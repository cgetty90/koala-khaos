
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scatterColumns, scatterFixtures } from './scatter-presentation.ts';

test('all six fixtures keep the selected symbols, positions and tier', () => {
  const expected = [null, null, null, 'regular', 'super', 'epic'];
  scatterFixtures.forEach((outcome, count) => {
    const before = JSON.stringify(outcome);
    const placements = scatterColumns(outcome).flatMap(column => column.scatterCells);
    assert.equal(outcome.bonus, expected[count]);
    assert.equal(placements.length, count);
    assert.deepEqual(placements.sort((a, b) => a - b), [...outcome.scatterCells].sort((a, b) => a - b));
    assert.equal(JSON.stringify(outcome), before);
    assert.equal(Object.isFrozen(outcome.scatterCells), true);
  });
});

test('a presentation with duplicate, out-of-range or incompatible positions is rejected', () => {
  const fixture = scatterFixtures[3];
  const cell = fixture.scatterCells[0];
  assert.throws(() => scatterColumns({ ...fixture, bonus: 'super' }), /disagree/);
  assert.throws(() => scatterColumns({ ...fixture, scatterCells: [cell, cell, cell] }), /invalid/i);
  assert.throws(() => scatterColumns({ ...fixture, scatterCells: [cell, -1, 30] }), /invalid/i);
  assert.throws(() => scatterColumns({ ...fixture, candies: [] }), /invalid/i);
});

