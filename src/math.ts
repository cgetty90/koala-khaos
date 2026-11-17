export const bonusModes = ['regular', 'super', 'epic'] as const;
export type BonusMode = typeof bonusModes[number];
export type Mode = 'base' | BonusMode;
export type Purchase = 'regular' | 'super' | 'mystery';
export const freeSpins = 10;
export const stakeStep = 20;
export const maximumStake = 1000;
export const stakes = Array.from({ length: maximumStake / stakeStep }, (_, index) => (index + 1) * stakeStep);
export const startingBalance = 50_000;
export const prices = { regular: 100, super: 300, mystery: 500 } satisfies Record<Purchase, number>;
export const mysteryWeights = [65, 30, 5] as const;
export const naturalOdds = [3600, 850, 10] as const; // per million, mutually exclusive
export const modeNames = { base: 'Base game', regular: 'Sugar Rush', super: 'Koala Frenzy', epic: 'Koala Mayhem' };
export const basis = 10_000;
export const bands = [8, 10, 12, 15] as const;

export const candyPay = {
  berry: [2200, 4800, 10000, 18000],
  lemon: [2600, 5500, 12000, 23000],
  mint: [1800, 3900, 8500, 15000],
  grape: [3000, 6500, 14000, 27000],
  peach: [2000, 4400, 9500, 17000],
  toffee: [2400, 5100, 11000, 21000],
} as const;

export function payPoints(candy: keyof typeof candyPay, band: number, mode: Mode) {
  const points = candyPay[candy][band];
  return mode === 'base' ? Math.round(points * .55 / 100) * 100 : points;
}
export const math = {
  base: { copies: 10, chaos: .018, convert: 3, leaf: .025, values: [2, 3, 5, 10], weights: [65, 24, 9, 2], spinCap: 500, sessionCap: 500 },
  regular: { copies: 13, chaos: .04, convert: 3, leaf: .225, values: [2, 3, 5, 10, 15], weights: [26, 24, 25, 17, 8], spinCap: 450, sessionCap: 2000 },
  super: { copies: 13, chaos: .05, convert: 3, leaf: .16, values: [5, 10, 15, 25, 50, 100], weights: [27, 23, 20, 17, 9, 4], spinCap: 850, sessionCap: 4000 },
  epic: { copies: 13, chaos: .06, convert: 3, leaf: .28, values: [5, 10, 25, 50, 100], weights: [40, 29, 20, 8, 3], spinCap: 1200, sessionCap: 6000 },
} satisfies Record<Mode, { copies: number; chaos: number; convert: number; leaf: number; values: number[]; weights: number[]; spinCap: number; sessionCap: number }>;

export function weightedIndex(weights: readonly number[], sample: number) {
  let threshold = sample * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length - 1; i++) {
    threshold -= weights[i];
    if (threshold < 0) return i;
  }
  return weights.length - 1;
}

export function naturalBonus(sample: number): BonusMode | undefined {
  let points = sample * 1_000_000;
  for (const [i, odds] of naturalOdds.entries()) {
    points -= odds;
    if (points < 0) return bonusModes[i];
  }
}

export function purchaseCost(stakeMinor: number, purchase: Purchase) {
  return prices[purchase] * stakeMinor;
}

export function purchaseBonus(balance: number, stakeMinor: number, purchase: Purchase, random: () => number) {
  if (!(Object.hasOwn(prices, purchase)) || !stakes.includes(stakeMinor)) return;
  const cost = purchaseCost(stakeMinor, purchase);
  if (balance < cost) return;
  const mode = purchase === 'mystery' ? bonusModes[weightedIndex(mysteryWeights, random())] : purchase;
  return { balance: balance - cost, mode, cost };
}

export function settleCredits(payout: number, stakeMinor: number) {
  return Math.floor(payout * stakeMinor / basis);
}






export function settleBonusAward(previousPayout: number, payout: number, stakeMinor: number) {
  return settleCredits(previousPayout + payout, stakeMinor) - settleCredits(previousPayout, stakeMinor);
}
