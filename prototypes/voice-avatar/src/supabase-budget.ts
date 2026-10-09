import { ExperimentBudget, validateLedger } from './experiment-budget.ts';
import type { Ledger } from './experiment-budget.ts';

/** Server-only durable prototype ledger. No fallback, automatic seeding or request retries. */
export class SupabaseBudget extends ExperimentBudget {
  private endpoint: string;
  private key: string;
  constructor(url: string, key: string) {
    super('');
    const target = new URL(url);
    if (target.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(target.hostname) || target.pathname !== '/' || target.search || target.hash || target.username || target.password || key.length < 32) throw new Error('Invalid private ledger configuration.');
    this.endpoint = target.origin + '/rest/v1/rpc/'; this.key = key;
  }
  private async rpc(name: string, body: object): Promise<unknown> {
    try {
      const response = await fetch(this.endpoint + name, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
        headers: { apikey: this.key, ...(this.key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${this.key}` }), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      return await response.json();
    } catch { throw new Error('Durable experiment ledger requires review.'); }
  }
  override async read(): Promise<Ledger> { return validateLedger(await this.rpc('stylist_prototype_budget_read', {})); }
  protected override async change(update: (ledger: Ledger) => void) {
    const previous = await this.read(); const next = structuredClone(previous);
    update(next); validateLedger(next);
    const result = await this.rpc('stylist_prototype_budget_change', { expected: previous, replacement: next });
    if (result !== true) throw new Error('Durable experiment ledger requires review.');
  }
  override async approveAdditionalSpokenTest() { throw new Error('Hosted allowance amendments require a separate review.'); }
  override async approveReserveTransfer() { throw new Error('Hosted allowance amendments require a separate review.'); }
}
