import { open, readFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export type Reservation = { id: string; cents: number; seconds: number; closed: boolean; room?: string; kind?: 'spoken' };
type Extension = { approvedOn: '2026-10-09'; baseAttempts: 4; extraAttempts: 1; cents: 200; seconds: 300 };
type PhoneTrial = { approvedOn: '2026-10-09'; baseAttempts: 6; extraAttempts: 1; cents: 200; seconds: 300; source: 'reserve'; purpose: 'iphone-playback-interrupt'; totalBudgetCents: 2500 };
const PHONE_TRIAL: PhoneTrial = { approvedOn: '2026-10-09', baseAttempts: 6, extraAttempts: 1, cents: 200, seconds: 300, source: 'reserve', purpose: 'iphone-playback-interrupt', totalBudgetCents: 2500 };
type ReserveTransfer = { approvedOn: '2026-10-09'; baseAttempts: 5; extraAttempts: 1; cents: 200; seconds: 300; source: 'reserve'; totalBudgetCents: 2500 };
const RESERVE_TRANSFER: ReserveTransfer = { approvedOn: '2026-10-09', baseAttempts: 5, extraAttempts: 1, cents: 200, seconds: 300, source: 'reserve', totalBudgetCents: 2500 };
function sameFields(value: unknown, expected: object): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === Object.keys(expected).length && Object.entries(expected).every(([key, field]) => record[key] === field);
}
function validTransfer(value: unknown): value is ReserveTransfer { return sameFields(value, RESERVE_TRANSFER); }
export type Ledger = { version: 1; runs: Reservation[]; spokenExtension?: Extension; reserveTransfer?: ReserveTransfer; phoneTrial?: PhoneTrial };
function validExtension(value: unknown): value is Extension {
  return sameFields(value, { approvedOn: '2026-10-09', baseAttempts: 4, extraAttempts: 1, cents: 200, seconds: 300 });
}
export function validateLedger(value: unknown): Ledger {
    const parsed = value as Ledger;
    if (!parsed || typeof parsed !== 'object') throw new Error('Usage ledger requires review.');
    if (parsed.version !== 1 || !Array.isArray(parsed.runs) || parsed.runs.length > (validExtension(parsed.spokenExtension) ? (validTransfer(parsed.reserveTransfer) ? (sameFields(parsed.phoneTrial, PHONE_TRIAL) ? 7 : 6) : 5) : 4)
      || (parsed.spokenExtension !== undefined && !validExtension(parsed.spokenExtension))
      || (parsed.reserveTransfer !== undefined && (!validTransfer(parsed.reserveTransfer) || !validExtension(parsed.spokenExtension)))
      || (parsed.phoneTrial !== undefined && (!sameFields(parsed.phoneTrial, PHONE_TRIAL) || !validTransfer(parsed.reserveTransfer)))
      || (parsed.runs[6] !== undefined && parsed.runs[6].kind !== 'spoken')
      || (parsed.runs[5] !== undefined && parsed.runs[5].kind !== 'spoken')
      || (parsed.runs[4] !== undefined && parsed.runs[4].kind !== 'spoken')
      || parsed.runs.some((r, i) => r.kind !== undefined && (i < 4 || i > 6 || r.kind !== 'spoken'))
      || parsed.runs.some(r => !r || typeof r.id !== 'string' || !/^[a-f0-9-]{36}$/.test(r.id)
        || r.cents !== 200 || r.seconds !== 300 || typeof r.closed !== 'boolean'
        || (r.room !== undefined && !/^[a-zA-Z0-9_-]{1,100}$/.test(r.room)))
      || new Set(parsed.runs.map(r => r.id)).size !== parsed.runs.length) throw new Error('Usage ledger requires review.');
    return parsed;
}
/** Conservative lifetime reservations, never refunded automatically, including failed attempts.
 * Missing/corrupt files and unresolved cleanup block paid work. One server owns this file.
 */
export class ExperimentBudget {
  private path: string;
  constructor(path: string) { this.path = path; }
  async read(): Promise<Ledger> {
    const parsed = JSON.parse(await readFile(this.path, 'utf8')) as Ledger;
    return validateLedger(parsed);
  }
  protected async change(update: (ledger: Ledger) => void) {
    const lock = await open(`${this.path}.lock`, 'wx', 0o600);
    const temp = `${this.path}.${randomUUID()}.tmp`;
    try {
      const ledger = await this.read(); update(ledger);
      const file = await open(temp, 'wx', 0o600);
      try { await file.writeFile(JSON.stringify(ledger)); await file.sync(); } finally { await file.close(); }
      await rename(temp, this.path);
    } finally {
      await lock.close(); await unlink(`${this.path}.lock`);
      await unlink(temp).catch(() => {});
    }
  }
  async approveAdditionalSpokenTest() {
    await this.change(ledger => {
      if (ledger.spokenExtension || ledger.runs.length !== 4 || ledger.runs.some(run => !run.closed)) throw new Error('Additional spoken-test approval cannot be applied.');
      ledger.spokenExtension = { approvedOn: '2026-10-09', baseAttempts: 4, extraAttempts: 1, cents: 200, seconds: 300 };
    });
  }
  async approveReserveTransfer() {
    await this.change(ledger => {
      if (!validExtension(ledger.spokenExtension) || ledger.reserveTransfer || ledger.runs.length !== 5 || ledger.runs.some(run => !run.closed)) throw new Error('Reserve transfer approval cannot be applied.');
      ledger.reserveTransfer = { ...RESERVE_TRANSFER };
    });
  }
  async approvePhoneTrial() {
    await this.change(ledger => {
      if (!validTransfer(ledger.reserveTransfer) || ledger.phoneTrial || ledger.runs.length !== 6 || ledger.runs.some(run => !run.closed)) throw new Error('Phone-test approval cannot be applied.');
      ledger.phoneTrial = { ...PHONE_TRIAL };
    });
  }
  async reserve(kind: 'scripted' | 'spoken' = 'scripted'): Promise<string> {
    const id = randomUUID();
    await this.change(ledger => {
      if (ledger.runs.some(r => !r.closed)) throw new Error('Previous connection cleanup needs verification.');
      const extra = kind === 'spoken' && validExtension(ledger.spokenExtension);
      if (ledger.runs.length >= (extra ? (validTransfer(ledger.reserveTransfer) ? (sameFields(ledger.phoneTrial, PHONE_TRIAL) ? 7 : 6) : 5) : 4)) throw new Error('Approved experiment reservation limit reached.');
      ledger.runs.push({ id, cents: 200, seconds: 300, closed: false, ...(ledger.runs.length >= 4 ? { kind: 'spoken' as const } : {}) });
    });
    return id;
  }
  async setRoom(id: string, room: string) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(room)) throw new Error('Invalid room identifier.');
    await this.change(ledger => {
      const run = ledger.runs.find(r => r.id === id && !r.closed);
      if (!run || run.room) throw new Error('Room reservation mismatch.'); run.room = room;
    });
  }
  async closeVerified(id: string) {
    await this.change(ledger => {
      const run = ledger.runs.find(r => r.id === id); if (!run) throw new Error('Unknown reservation.');
      run.closed = true;
    });
  }
}

export async function initializeExperimentBudget(path: string) {
  const file = await open(path, 'wx', 0o600);
  try { await file.writeFile(JSON.stringify({ version: 1, runs: [] })); await file.sync(); } finally { await file.close(); }
}
