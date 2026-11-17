import { bands, basis, freeSpins, math, naturalBonus, payPoints, weightedIndex, type BonusMode, type Mode } from './math.ts';

export const columns = 6;
export const rows = 5;
export const size = columns * rows;
export const candies = ['berry', 'lemon', 'mint', 'grape', 'peach', 'toffee'] as const;
export const candyNames = { berry: 'Berry Jelly', lemon: 'Sherbet Star', mint: 'Peppermint Twist', grape: 'Grape Moon', peach: 'Peach Shell', toffee: 'Blue Toffee' };
export type Candy = (typeof candies)[number];
export type Random = () => number;

export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(items: readonly T[], random: Random) => items[Math.floor(random() * items.length)];

export function makeBoard(random: Random, mode: Mode = 'base'): Candy[] {
  const copies = math[mode].copies;
  const counts = candies.map(() => copies);
  let left = copies * candies.length;
  return Array.from({ length: size }, () => {
    let index = 0;
    let draw = Math.floor(random() * left--);
    while (draw >= counts[index]) draw -= counts[index++];
    counts[index]--;
    return candies[index];
  });
}

export function findWins(board: readonly Candy[], mode: Mode = 'base') {
  const groups = candies.map(() => [] as number[]);
  for (let i = 0; i < board.length; i++) groups[candies.indexOf(board[i])].push(i);
  return groups.flatMap((indices, i) => {
    const band = bands.filter(min => indices.length >= min).length - 1;
    const candy = candies[i];
    return band < 0 ? [] : [{ candy, indices, pay: payPoints(candy, band, mode) }];
  });
}

export interface Movement {
  candy: Candy;
  fromRow: number;
  to: number;
}

export function refill(board: readonly Candy[], removed: ReadonlySet<number>, random: Random) {
  const next = Array<Candy>(size);
  const moves: Movement[] = [];
  for (let col = 0; col < columns; col++) {
    let dest = rows - 1;
    for (let row = rows - 1; row >= 0; row--) {
      const index = row * columns + col;
      if (removed.has(index)) continue;
      const to = dest-- * columns + col;
      next[to] = board[index];
      moves.push({ candy: board[index], fromRow: row, to });
    }
    const vacancies = dest + 1;
    for (; dest >= 0; dest--) {
      const candy = pick(candies, random);
      const to = dest * columns + col;
      next[to] = candy;
      moves.push({ candy, fromRow: dest - vacancies, to });
    }
  }
  return { board: next, moves };
}

export function* tumble(start: readonly Candy[], random: Random, mode: Mode) {
  const config = math[mode];
  let board = start;
  let base = 0;
  let leafSum = 0;
  while (true) {
    const wins = findWins(board, mode);
    if (wins.length === 0) return;
    const removed = wins.flatMap(win => win.indices);
    const pay = wins.reduce((sum, win) => sum + win.pay, 0);
    const leaf = random() < config.leaf ? config.values[weightedIndex(config.weights, random())] : 0;
    const next = refill(board, new Set(removed), random);
    base += pay;
    leafSum += leaf;
    yield { ...next, wins, removed, pay, leaf, base, leafSum };
    board = next.board;
  }
}

export function startSpin(random: Random, mode: Mode) {
  const config = math[mode];
  const initial = makeBoard(random, mode);
  const board = [...initial];
  const transformed: number[] = [];
  if (random() < config.chaos) {
    const target = pick(candies, random);
    const available = initial.flatMap((candy, index) => candy === target ? [] : [index]);
    for (let i = 0; i < config.convert && available.length; i++) {
      const [index] = available.splice(Math.floor(random() * available.length), 1);
      transformed.push(index);
      board[index] = target;
    }
  }
  return { initial, board, transformed, trigger: mode === 'base' ? naturalBonus(random()) : undefined };
}

export function spinPayout(mode: Mode, base: number, leafSum: number, bonusTotal = 0) {
  return Math.min(base * (leafSum || 1), math[mode].spinCap * basis, math[mode].sessionCap * basis - bonusTotal);
}

export interface Bonus {
  mode: BonusMode;
  played: number;
  total: number;
  leaves: number;
}

export function newBonus(mode: BonusMode): Bonus {
  return { mode, played: 0, total: 0, leaves: 0 };
}

export function finishFreeSpin(bonus: Bonus, base: number, spinLeaves: number) {
  if (bonus.played >= freeSpins) throw new RangeError('Bonus is already complete');
  const played = bonus.played + 1;
  const leaves = (bonus.mode === 'epic' ? bonus.leaves : 0) + spinLeaves;
  const payout = spinPayout(bonus.mode, base, leaves, bonus.total);
  return { bonus: { ...bonus, played, total: bonus.total + payout, leaves: bonus.mode === 'epic' ? leaves : 0 }, payout, remaining: freeSpins - played };
}



