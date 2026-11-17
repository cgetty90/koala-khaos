import type { Movement } from './game';
import type { BoardSymbol } from './art';
import type { BonusMode, Purchase } from './math';
export type PaidMode = 'normal' | 'ante' | Purchase;

type Board = { type: 'opening-board'; initial: BoardSymbol[]; board: BoardSymbol[]; transformed: number[]; scatterLandings?: number[] };
type Tumble = { type: 'tumble'; board: BoardSymbol[]; moves: (Omit<Movement, 'candy'> & { candy: BoardSymbol })[];
  removed: number[]; leaf: number; leafSum: number; base: number; scatterLandings?: number[] };
type Award = { type: 'award'; nominal: number; multiplierHundredths: number; credit: number };
type Feature = { type: 'feature'; tier: BonusMode; spins: number };
type Event = Board | Tumble | Award | Feature | { type: 'debit'; credit: number } | { type: 'settled'; credit: number; multiplierHundredths: number };
export type SpinCreditEntry = { kind: 'connection' | 'multiplier'; tumble: number; connection: number | null; event: number; delta: number; total: number };
export type RecordedSpin = { opening: Board; tumbles: Tumble[]; award: Award; credits?: SpinCreditEntry[] };
export type Landing = { column: number; row: number; order: number };
export type RevealTiming = { leadMs: number; dropMs: number; impactProgress: number; betweenMs: number; holdMs: number };
export type Presentation = { schemaVersion: string; bonusTier: BonusMode | null; spinCredits?: {
  version: string; spins: { awardEvent: number; entries: SpinCreditEntry[]; final: number }[];
}; effect: {
  classification: string; landings: Landing[]; scatterCount: number; kartCinematic: string | null; timings: RevealTiming | null;
} };
export type Accepted = {
  receipt: { requestId: string; id: { version: string }; mode: PaidMode; stake: number; cost: number; credit: number; balance: number;
    record: { naturalScatterCount?: number; spec: { tier: BonusMode | null }; events: Event[] } };
  presentation: Presentation;
};
type Request = { id: string; mode: PaidMode; stake: number; fixture?: number };
const sessionKey = 'koala-candidate.session.v21';
const pendingKey = 'koala-candidate.pending.v21';
const apiOrigin = import.meta.env.PROD ? import.meta.env.VITE_KHAOS_API_ORIGIN || '' : '';
function sessionId() {
  const existing = sessionStorage.getItem(sessionKey);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(sessionKey, id);
  return id;
}
async function api<T>(action: string, payload: object): Promise<T> {
  const response = await fetch(apiOrigin + '/__khaos/' + action, {
    method: 'POST', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session: sessionId(), ...payload }),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error);
  return result;
}
export function pending(): Request | null {
  return JSON.parse(sessionStorage.getItem(pendingKey) ?? 'null');
}
export async function accept(mode: PaidMode, stake: number): Promise<Accepted> {
  let request = pending();
  if (request) {
    if (request.mode !== mode || request.stake !== stake) throw Error('Finish the pending round before changing mode or stake.');
  } else {
    const branch = import.meta.env.DEV ? new URLSearchParams(location.search).get('qaBranch') : null;
    request = { id: crypto.randomUUID(), mode, stake, fixture: branch === null ? undefined : Number(branch) };
    sessionStorage.setItem(pendingKey, JSON.stringify(request));
  }
  const payload = apiOrigin ? {...request, profile:'friend-v31'} : request;
  const accepted = await api<Accepted>('round', payload);
  const receipt = accepted.receipt;
  if (receipt.requestId !== request.id || receipt.mode !== request.mode || receipt.stake !== request.stake) {
    throw Error('Settlement receipt does not match the pending request.');
  }
  return accepted;
}
export function complete() { sessionStorage.removeItem(pendingKey); }
export async function currentBalance() { return (await api<{ balance: number }>('state', {})).balance; }
export function splitReceipt(accepted: Accepted) {
  const { receipt, presentation } = accepted;
  const known = receipt.id.version === 'khaos-1.9-private-checkpoints.1' && presentation.schemaVersion === 'khaos.presentation.1'
    || (receipt.id.version === 'khaos-1.9-scatter-candidate.1'
      || receipt.id.version === 'khaos-3.0-offline-b.1')
      && presentation.schemaVersion === 'khaos.presentation.2';
  if (!known ||
      presentation.bonusTier !== receipt.record.spec.tier) throw Error('Unrecognized receipt version or tier.');
  const spins: RecordedSpin[] = [];
  let opening: Board | undefined;
  let tumble: Tumble[] = [];
  const projected = presentation.spinCredits;
  if (projected && projected.version !== 'khaos.spin-credits.1') throw Error('Unrecognized spin credit timeline.');
  for (const [index, event] of receipt.record.events.entries()) {
    if (event.type === 'opening-board') { opening = event; tumble = []; }
    else if (event.type === 'tumble') tumble.push(event);
    else if (event.type === 'award') {
      if (!opening) throw Error('Award without opening board.');
      const timeline = projected?.spins[spins.length];
      if (projected) {
        if (!timeline || timeline.awardEvent !== index || timeline.final !== event.credit) throw Error('Spin credit timeline differs from the award.');
        let before = 0;
        for (const entry of timeline.entries) {
          if (!Number.isSafeInteger(entry.delta) || entry.delta < 0 || entry.total !== before + entry.delta ||
            receipt.record.events[entry.event]?.type !== 'tumble' || !tumble[entry.tumble]) throw Error('Invalid spin credit increment.');
          before = entry.total;
        }
        if (before !== event.credit) throw Error('Spin credit increments do not reconcile.');
      }
      spins.push({ opening, tumbles: tumble, award: event, credits: timeline?.entries });
      opening = undefined;
    }
  }
  const paidOpening = receipt.mode === 'normal' || receipt.mode === 'ante' ? spins.shift() : undefined;
  if (receipt.record.naturalScatterCount !== undefined) {
    const arrivals = [paidOpening?.opening, ...(paidOpening?.tumbles ?? [])]
      .reduce((sum, event) => sum + (event?.scatterLandings?.length ?? 0), 0);
    const tier = [null, null, null, 'regular', 'super', 'epic'][arrivals];
    if (!paidOpening || arrivals !== receipt.record.naturalScatterCount || tier !== receipt.record.spec.tier)
      throw Error('Recorded scatter count or feature tier disagrees with the receipt.');
  }
  if (spins.length !== (receipt.record.spec.tier ? 10 : 0) ||
      (paidOpening ? paidOpening.award.credit : 0) + spins.reduce((sum, s) => sum + s.award.credit, 0) !== receipt.credit)
    throw Error('Receipt reconciliation failed.');
  return { opening: paidOpening, bonus: spins };
}
