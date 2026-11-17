import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { candies, findWins, finishFreeSpin, makeBoard, newBonus, refill, seededRandom, spinPayout, startSpin, tumble, type Candy } from './game.ts';
import { basis, bonusModes, freeSpins, math, naturalBonus, purchaseBonus, purchaseCost, settleBonusAward, settleCredits, stakes, weightedIndex, mysteryWeights, type Purchase } from './math.ts';

const balanced = (): Candy[] => Array.from({ length: 30 }, (_, index) => candies[index % 6]);

describe('Paytable and cascades', () => {
  it('counts scattered candies and pays the correct mode, symbol, and count band', () => {
    const board = balanced();
    board[7] = board[14] = 'berry';
    assert.deepEqual(findWins(board), []);
    board[21] = 'berry';
    const indices = [0, 6, 7, 12, 14, 18, 21, 24];
    assert.deepEqual(findWins(board), [{ candy: 'berry', indices, pay: 1200 }]);
    assert.deepEqual(findWins(board, 'epic'), [{ candy: 'berry', indices, pay: 2200 }]);
    board[11] = board[17] = 'berry';
    assert.equal(findWins(board)[0].pay, 2600);
    assert.equal(settleCredits(2600, 500), 130);
  });

  it('removes simultaneous wins in a single tumble and preserves column order during refill', () => {
    const board = balanced();
    for (const index of [2, 3, 4]) board[index] = 'berry';
    for (const index of [8, 9, 10]) board[index] = 'lemon';
    const first = tumble(board, seededRandom(1), 'base').next().value;
    assert.ok(first);
    assert.equal(first.wins.length, 2);
    assert.equal(new Set(first.removed).size, 16);
    assert.equal(first.pay, 2600);

    const column = balanced();
    [column[0], column[12], column[24]] = ['peach', 'grape', 'mint'];
    let draws = 0;
    const result = refill(column, new Set([6, 18]), () => { draws++; return .91; });
    assert.equal(draws, 2);
    assert.equal(new Set(result.moves.map(move => move.to)).size, 30);
    assert.deepEqual([0, 6, 12, 18, 24].map(i => result.board[i]), ['toffee', 'toffee', 'peach', 'grape', 'mint']);
    assert.deepEqual(result.moves.filter(move => move.to % 6 === 0).map(({ fromRow, to }) => [fromRow, to]),
      [[4, 24], [2, 18], [0, 12], [-1, 6], [-2, 0]]);
  });

  it('replays a Koala Chaos cascade and ends without a winning group', () => {
    const replay = (seed: number) => {
      const random = seededRandom(seed);
      const spin = startSpin(random, 'base');
      return { spin, stages: [...tumble(spin.board, random, 'base')] };
    };
    const { spin, stages } = replay(75);
    assert.equal(spin.transformed.length, 3);
    assert.deepEqual(stages.map(stage => stage.pay), [1400, 1000]);
    assert.deepEqual(findWins(stages[1].board), []);
    assert.deepEqual(replay(75), replay(75));
    assert.notDeepEqual(replay(75), replay(76));
    for (const mode of ['base', ...bonusModes] as const) {
      const board = makeBoard(seededRandom(42), mode);
      assert.equal(board.length, 30);
      assert.ok(candies.every(candy => board.filter(item => item === candy).length <= math[mode].copies));
    }
  });
});

describe('Bonus routing and settlement', () => {
  it('triggers all modes naturally only in the base game', () => {
    assert.equal(naturalBonus(0), 'regular');
    assert.equal(naturalBonus(.0036), 'super');
    assert.equal(naturalBonus(.00445), 'epic');
    assert.equal(naturalBonus(.00446), undefined);
    for (const [seed, mode] of [[351, 'regular'], [846, 'super'], [47888, 'epic']] as const) {
      assert.equal(startSpin(seededRandom(seed), 'base').trigger, mode);
      assert.equal(startSpin(seededRandom(seed), mode).trigger, undefined);
    }
  });

  it('applies the mystery weights and refuses a direct epic purchase', () => {
    for (const [sample, index] of [[0, 0], [.6499, 0], [.65, 1], [.9499, 1], [.95, 2], [.9999, 2]]) {
      assert.equal(weightedIndex(mysteryWeights, sample), index);
      assert.equal(purchaseBonus(50_000, 100, 'mystery', () => sample)?.mode, bonusModes[index]);
    }
    assert.equal(purchaseBonus(50_000, 100, 'epic' as Purchase, () => .999), undefined);
  });

  it('offers exactly 50 stake choices in steps of 20 minor units', () => {
    assert.equal(stakes.length, 50);
    assert.equal(stakes[0], 20);
    assert.equal(stakes.at(-1), 1000);
    stakes.forEach((stake, index) => assert.equal(stake, 20 * (index + 1)));
  });

  it('prices each purchase in integer minor units and accepts only valid, funded stakes', () => {
    assert.equal(purchaseCost(20, 'regular'), 2000);
    assert.equal(purchaseCost(40, 'super'), 12000);
    assert.equal(purchaseCost(1000, 'mystery'), 500000);
    assert.deepEqual(purchaseBonus(6000, 20, 'super', () => assert.fail('direct purchase drew RNG')),
      { balance: 0, mode: 'super', cost: 6000 });
    for (const stake of [0, 1, 20.5, 21, 1020]) assert.equal(purchaseBonus(50_000, stake, 'regular', () => 0), undefined);
    let draws = 0;
    const draw = () => { draws++; return .955; };
    assert.equal(purchaseBonus(9999, 20, 'mystery', draw), undefined);
    assert.equal(draws, 0);
    assert.deepEqual(purchaseBonus(10_000, 20, 'mystery', draw), { balance: 0, mode: 'epic', cost: 10_000 });
    assert.equal(draws, 1);
  });

  it('observes all Mystery weights in 200,000 seeded purchases', () => {
    const rng = seededRandom(20261116);
    const counts = { regular: 0, super: 0, epic: 0 };
    const sample = 200_000;
    for (let i = 0; i < sample; i++) counts[purchaseBonus(10_000, 20, 'mystery', rng)!.mode]++;
    bonusModes.forEach((mode, i) => {
      const expected = mysteryWeights[i] / 100;
      const sigma = Math.sqrt(sample * expected * (1 - expected));
      assert.ok(Math.abs(counts[mode] - sample * expected) <= 4 * sigma);
    });
  });

  it('keeps fractional minor units out of the ledger and reconciles bonus caps', () => {
    assert.equal(settleCredits(1300, 20), 2);
    assert.equal(settleCredits(1300, 40), 5);
    assert.equal(settleBonusAward(1300, 1300, 20), 3);
    assert.equal(settleBonusAward(2600, 0, 20), 0);
    for (const stake of [20, 40, 1000]) {
      const cap = math.epic.sessionCap * basis;
      const previous = cap - 1300;
      assert.equal(settleCredits(previous, stake) + settleBonusAward(previous, 1300, stake),
        math.epic.sessionCap * stake);
      assert.equal(settleCredits(spinPayout('base', 9e9, 100), stake), math.base.spinCap * stake);
    }
  });
  it('resets regular and super leaves but persists epic leaves across a losing spin', () => {
    for (const mode of bonusModes) {
      const win = finishFreeSpin(newBonus(mode), 2000, 10);
      const loss = finishFreeSpin(win.bonus, 0, 0);
      const next = finishFreeSpin(loss.bonus, 1500, 5);
      assert.equal(win.payout, 20_000);
      assert.equal(loss.payout, 0);
      assert.equal(next.payout, mode === 'epic' ? 22_500 : 7500);
      assert.equal(next.bonus.leaves, mode === 'epic' ? 15 : 0);
    }
  });

  it('enforces every cap and exactly ten free spins', () => {
    assert.equal(spinPayout('base', 9e9, 100), math.base.spinCap * basis);
    for (const mode of bonusModes) {
      let bonus = newBonus(mode);
      let sum = 0;
      for (let i = 0; i < freeSpins; i++) {
        const next = finishFreeSpin(bonus, 9e9, 100);
        assert.ok(next.payout <= math[mode].spinCap * basis && next.payout >= 0);
        assert.equal(next.remaining, freeSpins - i - 1);
        sum += next.payout;
        bonus = next.bonus;
      }
      assert.equal(bonus.total, math[mode].sessionCap * basis);
      assert.equal(bonus.total, sum);
      assert.throws(() => finishFreeSpin(bonus, 1, 0), RangeError);
    }
  });
});

