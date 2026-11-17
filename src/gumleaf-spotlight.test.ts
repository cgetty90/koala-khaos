import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { planGumleafSpotlight } from './gumleaf-spotlight.ts';

test('a genuine Gumleaf batch gets one spotlight using its strongest multiplier', () => {
  assert.equal(planGumleafSpotlight([], 1, false), null);
  assert.deepEqual(planGumleafSpotlight([2, 10, 100], 1, false), {
    intensity: 'large', duration: 220, static: false, text: '×2 + ×10 + ×100',
  });
  assert.equal(planGumleafSpotlight([10], 1, false)?.intensity, 'medium');
  assert.equal(planGumleafSpotlight([5], 1, false)?.intensity, 'small');
});

test('Gumleaf timing supports Gentle, Normal, Fast, Turbo, Instant and reduced motion', () => {
  for (const [rate, reduced, turbo, duration, still] of [
    [.65, false, false, 350, false], [1, false, false, 220, false], [2, false, false, 100, false],
    [.65, false, true, 100, false], [0, false, false, 70, true], [.65, true, false, 90, true],
  ] as const) {
    const plan = planGumleafSpotlight([3], rate, reduced, turbo);
    assert.equal(plan?.duration, duration);
    assert.equal(plan?.static, still);
  }
});
