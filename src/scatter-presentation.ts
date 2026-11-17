
import type { Candy } from './game';
import type { BonusMode } from './math';

/** A presentation input from a qualified outcome producer. The live engine does not supply it. */
export interface ScatterOutcome {
  readonly candies: readonly Candy[];
  readonly scatterCells: readonly number[];
  readonly bonus: BonusMode | null;
}

export function scatterColumns(outcome: ScatterOutcome) {
  const { candies, scatterCells } = outcome;
  const occupied = new Set(scatterCells);
  if (candies.length !== 30 || occupied.size !== scatterCells.length ||
      scatterCells.some(cell => !Number.isInteger(cell) || cell < 0 || cell >= 30)) {
    throw new RangeError('Invalid 6×5 scatter presentation');
  }
  const count = scatterCells.length;
  const tier = count >= 5 ? 'epic' : count === 4 ? 'super' : count === 3 ? 'regular' : null;
  if (outcome.bonus !== tier) throw new RangeError('Scatter count and selected tier disagree');
  return Array.from({ length: 6 }, (_, column) => ({
    column,
    scatterCells: scatterCells.filter(cell => cell % 6 === column).sort((a, b) => a - b),
  }));
}

const symbols = ['berry', 'lemon', 'mint', 'grape', 'peach', 'toffee'] as const;
const board = Object.freeze(Array.from({ length: 30 }, (_, i) => symbols[(i * 5 + Math.floor(i / 6)) % 6]));
const positions = [12, 14, 22, 11, 15];
const tiers = [null, null, null, 'regular', 'super', 'epic'] as const;
export const scatterFixtures: readonly ScatterOutcome[] = Object.freeze(tiers.map((bonus, count) =>
  Object.freeze({ candies: board, scatterCells: Object.freeze(positions.slice(0, count)), bonus })));

