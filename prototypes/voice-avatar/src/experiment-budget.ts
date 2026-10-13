import { open, readFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export type Reservation = { id: string; cents: number; seconds: number; closed: boolean; room?: string; kind?: 'spoken' | 'recovery'; started?: boolean };
export const RECOVERY_TRIAL = { approvedOn: '2026-10-12', baseAttempts: 9, extraAttempts: 2, cents: 400, seconds: 600, purpose: 'replacement-room-resume', totalBudgetCents: 2900 } as const;
export const RECOVERY_REPEAT = { approvedOn: '2026-10-12', baseAttempts: 11, extraAttempts: 2, cents: 400, seconds: 600, purpose: 'replacement-room-repeat', totalBudgetCents: 3300 } as const;
export const RECOVERY_SECOND_REPEAT = { approvedOn: '2026-10-12', baseAttempts: 13, extraAttempts: 2, cents: 400, seconds: 600, purpose: 'replacement-room-second-repeat', totalBudgetCents: 3700 } as const;
type Extension = { approvedOn: '2026-10-09'; baseAttempts: 4; extraAttempts: 1; cents: 200; seconds: 300 };
type PhoneTrial = { approvedOn: '2026-10-09'; baseAttempts: 6; extraAttempts: 1; cents: 200; seconds: 300; source: 'reserve'; purpose: 'iphone-playback-interrupt'; totalBudgetCents: 2500 };
const PHONE_TRIAL: PhoneTrial = { approvedOn: '2026-10-09', baseAttempts: 6, extraAttempts: 1, cents: 200, seconds: 300, source: 'reserve', purpose: 'iphone-playback-interrupt', totalBudgetCents: 2500 };
type AutomaticTrial = { approvedOn: '2026-10-09'; baseAttempts: 7; extraAttempts: 1; cents: 200; seconds: 300; source: 'reserve'; purpose: 'automatic-capture-spoken-stop'; totalBudgetCents: 2500 };
type RepeatTrial = { approvedOn: '2026-10-09'; baseAttempts: 8; extraAttempts: 1; cents: 200; seconds: 300; source: 'reserve'; purpose: 'automatic-capture-repeat'; totalBudgetCents: 2500 };
const AUTOMATIC_TRIAL: AutomaticTrial = { approvedOn: '2026-10-09', baseAttempts: 7, extraAttempts: 1, cents: 200, seconds: 300, source: 'reserve', purpose: 'automatic-capture-spoken-stop', totalBudgetCents: 2500 };
const REPEAT_TRIAL: RepeatTrial = { approvedOn: '2026-10-09', baseAttempts: 8, extraAttempts: 1, cents: 200, seconds: 300, source: 'reserve', purpose: 'automatic-capture-repeat', totalBudgetCents: 2500 };
type ReserveTransfer = { approvedOn: '2026-10-09'; baseAttempts: 5; extraAttempts: 1; cents: 200; seconds: 300; source: 'reserve'; totalBudgetCents: 2500 };
const RESERVE_TRANSFER: ReserveTransfer = { approvedOn: '2026-10-09', baseAttempts: 5, extraAttempts: 1, cents: 200, seconds: 300, source: 'reserve', totalBudgetCents: 2500 };
function sameFields(value: unknown, expected: object): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === Object.keys(expected).length && Object.entries(expected).every(([key, field]) => record[key] === field);
}
function validTransfer(value: unknown): value is ReserveTransfer { return sameFields(value, RESERVE_TRANSFER); }
export type Ledger = { version: 1; runs: Reservation[]; spokenExtension?: Extension; reserveTransfer?: ReserveTransfer; phoneTrial?: PhoneTrial; automaticTrial?: AutomaticTrial; repeatTrial?: RepeatTrial; recoveryTrial?: typeof RECOVERY_TRIAL; recoveryRepeat?: typeof RECOVERY_REPEAT; recoverySecondRepeat?: typeof RECOVERY_SECOND_REPEAT };
function validExtension(value: unknown): value is Extension {
  return sameFields(value, { approvedOn: '2026-10-09', baseAttempts: 4, extraAttempts: 1, cents: 200, seconds: 300 });
}
export function validateLedger(value: unknown): Ledger {
    const parsed = value as Ledger;
    if (!parsed || typeof parsed !== 'object') throw new Error('Usage ledger requires review.');
    if (parsed.version !== 1 || !Array.isArray(parsed.runs) || parsed.runs.length > (sameFields(parsed.recoverySecondRepeat, RECOVERY_SECOND_REPEAT) ? 15 : sameFields(parsed.recoveryRepeat, RECOVERY_REPEAT) ? 13 : sameFields(parsed.recoveryTrial, RECOVERY_TRIAL) ? 11 : (validExtension(parsed.spokenExtension) ? (validTransfer(parsed.reserveTransfer) ? (sameFields(parsed.phoneTrial, PHONE_TRIAL) ? (sameFields(parsed.automaticTrial, AUTOMATIC_TRIAL) ? (sameFields(parsed.repeatTrial, REPEAT_TRIAL) ? 9 : 8) : 7) : 6) : 5) : 4))
      || (parsed.recoveryTrial !== undefined && (!sameFields(parsed.recoveryTrial, RECOVERY_TRIAL) || !sameFields(parsed.repeatTrial, REPEAT_TRIAL) || !(parsed.recoverySecondRepeat ? [13,15] : parsed.recoveryRepeat ? [11,13] : [9,11]).includes(parsed.runs.length)))
      || (parsed.recoveryRepeat !== undefined && (!sameFields(parsed.recoveryRepeat, RECOVERY_REPEAT) || !sameFields(parsed.recoveryTrial, RECOVERY_TRIAL) || !(parsed.recoverySecondRepeat ? [13,15] : [11,13]).includes(parsed.runs.length) || !repeatPredecessorSafe(parsed)))
      || (parsed.recoverySecondRepeat !== undefined && (!sameFields(parsed.recoverySecondRepeat, RECOVERY_SECOND_REPEAT) || !sameFields(parsed.recoveryRepeat, RECOVERY_REPEAT) || ![13,15].includes(parsed.runs.length) || !secondRepeatPredecessorSafe(parsed)))
      || (parsed.spokenExtension !== undefined && !validExtension(parsed.spokenExtension))
      || (parsed.reserveTransfer !== undefined && (!validTransfer(parsed.reserveTransfer) || !validExtension(parsed.spokenExtension)))
      || (parsed.phoneTrial !== undefined && (!sameFields(parsed.phoneTrial, PHONE_TRIAL) || !validTransfer(parsed.reserveTransfer)))
      || (parsed.automaticTrial !== undefined && (!sameFields(parsed.automaticTrial, AUTOMATIC_TRIAL) || !sameFields(parsed.phoneTrial, PHONE_TRIAL)))
      || (parsed.repeatTrial !== undefined && (!sameFields(parsed.repeatTrial, REPEAT_TRIAL) || !sameFields(parsed.automaticTrial, AUTOMATIC_TRIAL)))
      || (parsed.runs[8] !== undefined && parsed.runs[8].kind !== 'spoken')
      || (parsed.runs[7] !== undefined && parsed.runs[7].kind !== 'spoken')
      || (parsed.runs[6] !== undefined && parsed.runs[6].kind !== 'spoken')
      || (parsed.runs[5] !== undefined && parsed.runs[5].kind !== 'spoken')
      || (parsed.runs[4] !== undefined && parsed.runs[4].kind !== 'spoken')
      || parsed.runs.some((r, i) => i >= 9 ? r.kind !== 'recovery' || (r.started !== undefined && typeof r.started !== 'boolean') : r.started !== undefined || (r.kind !== undefined && (i < 4 || r.kind !== 'spoken')))
      || parsed.runs.some(r => !r || typeof r.id !== 'string' || !/^[a-f0-9-]{36}$/.test(r.id)
        || r.cents !== 200 || r.seconds !== 300 || typeof r.closed !== 'boolean'
        || (r.room !== undefined && !/^[a-zA-Z0-9_-]{1,100}$/.test(r.room)))
      || new Set(parsed.runs.map(r => r.id)).size !== parsed.runs.length) throw new Error('Usage ledger requires review.');
    return parsed;
}
export function repeatPredecessorSafe(ledger: Ledger): boolean {
  return ledger.runs.length >= 11 && ledger.runs.slice(0,10).every(r => r.closed)
    && ledger.runs[9]?.started === true && Boolean(ledger.runs[9]?.room)
    && ledger.runs[10]?.kind === 'recovery' && ledger.runs[10]?.started === false
    && ledger.runs[10]?.closed === false && ledger.runs[10]?.room === undefined;
}
export function secondRepeatPredecessorSafe(ledger: Ledger): boolean {
  return repeatPredecessorSafe(ledger) && ledger.runs.length >= 13 && ledger.runs[11]?.closed === true && ledger.runs[11]?.started === true && Boolean(ledger.runs[11]?.room) && ledger.runs[12]?.kind === 'recovery' && ledger.runs[12]?.started === false && ledger.runs[12]?.closed === false && ledger.runs[12]?.room === undefined;
}
export function recoveryAvailable(ledger: Ledger): boolean {
  if (ledger.recoverySecondRepeat) return sameFields(ledger.recoverySecondRepeat, RECOVERY_SECOND_REPEAT) && ledger.runs.length === 13 && secondRepeatPredecessorSafe(ledger);
  return ledger.recoveryRepeat ? sameFields(ledger.recoveryRepeat, RECOVERY_REPEAT) && ledger.runs.length === 11 && repeatPredecessorSafe(ledger)
    : sameFields(ledger.recoveryTrial, RECOVERY_TRIAL) && ledger.runs.length === 9 && ledger.runs.every(r => r.closed);
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
  async approveAutomaticTrial() {
    await this.change(ledger => {
      if (!sameFields(ledger.phoneTrial, PHONE_TRIAL) || ledger.automaticTrial || ledger.runs.length !== 7 || ledger.runs.some(run => !run.closed)) throw new Error('Automatic-test approval cannot be applied.');
      ledger.automaticTrial = { ...AUTOMATIC_TRIAL };
    });
  }
  async approveRepeatTrial() {
    await this.change(ledger => {
      if (!sameFields(ledger.automaticTrial, AUTOMATIC_TRIAL) || ledger.repeatTrial || ledger.runs.length !== 8 || ledger.runs.some(run => !run.closed)) throw new Error('Repeat-test approval cannot be applied.');
      ledger.repeatTrial = { ...REPEAT_TRIAL };
    });
  }
  async approveRecoveryTrial() {
    await this.change(ledger => {
      if (ledger.recoveryTrial || !sameFields(ledger.repeatTrial, REPEAT_TRIAL) || ledger.runs.length !== 9 || ledger.runs.some(r => !r.closed)) throw new Error('Recovery approval cannot be applied.');
      ledger.recoveryTrial = { ...RECOVERY_TRIAL };
    });
  }
  async approveRecoveryRepeat() {
    await this.change(ledger => {
      if (ledger.recoveryRepeat || !sameFields(ledger.recoveryTrial, RECOVERY_TRIAL) || ledger.runs.length !== 11 || !repeatPredecessorSafe(ledger)) throw new Error('Recovery repeat approval cannot be applied.');
      ledger.recoveryRepeat = { ...RECOVERY_REPEAT };
    });
  }
  async approveRecoverySecondRepeat() {
    await this.change(ledger => {
      if (ledger.recoverySecondRepeat || !sameFields(ledger.recoveryRepeat, RECOVERY_REPEAT) || ledger.runs.length !== 13 || !secondRepeatPredecessorSafe(ledger)) throw new Error('Second recovery repeat approval cannot be applied.');
      ledger.recoverySecondRepeat = { ...RECOVERY_SECOND_REPEAT };
    });
  }
  async reserveRecoveryPair(): Promise<readonly [string, string]> {
    const ids = [randomUUID(), randomUUID()] as const;
    await this.change(ledger => {
      if (!recoveryAvailable(ledger)) throw new Error('Recovery allowance unavailable.');
      for (const id of ids) ledger.runs.push({id,cents:200,seconds:300,closed:false,kind:'recovery',started:false});
    });
    return ids;
  }
  async claimRecoveryRoom(id: string) {
    await this.change(ledger => {
      const base = ledger.recoverySecondRepeat ? 13 : ledger.recoveryRepeat ? 11 : 9;
      const index = ledger.runs.findIndex(r => r.id === id);
      const run = ledger.runs[index];
      if (!sameFields(ledger.recoveryTrial, RECOVERY_TRIAL) || ledger.runs.length !== base + 2 || index < base || !run || run.kind !== 'recovery' || run.closed || run.started
        || (index === base + 1 && (!ledger.runs[base]!.closed || !ledger.runs[base]!.room))) throw new Error('Recovery room unavailable.');
      run.started = true;
    });
  }
  async reserve(kind: 'scripted' | 'spoken' = 'scripted'): Promise<string> {
    const id = randomUUID();
    await this.change(ledger => {
      if (ledger.runs.some(r => !r.closed)) throw new Error('Previous connection cleanup needs verification.');
      const extra = kind === 'spoken' && validExtension(ledger.spokenExtension);
      if (ledger.runs.length >= (extra ? (validTransfer(ledger.reserveTransfer) ? (sameFields(ledger.phoneTrial, PHONE_TRIAL) ? (sameFields(ledger.automaticTrial, AUTOMATIC_TRIAL) ? (sameFields(ledger.repeatTrial, REPEAT_TRIAL) ? 9 : 8) : 7) : 6) : 5) : 4)) throw new Error('Approved experiment reservation limit reached.');
      ledger.runs.push({ id, cents: 200, seconds: 300, closed: false, ...(ledger.runs.length >= 4 ? { kind: 'spoken' as const } : {}) });
    });
    return id;
  }
  async setRoom(id: string, room: string) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(room)) throw new Error('Invalid room identifier.');
    await this.change(ledger => {
      const run = ledger.runs.find(r => r.id === id && !r.closed);
      if (!run || run.room || (run.kind === 'recovery' && run.started !== true)) throw new Error('Room reservation mismatch.'); run.room = room;
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
