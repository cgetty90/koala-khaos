import type { Landing, RevealTiming } from './catalogue-client';
import './purchase-replay.css';

import { conceptArt } from './art';
import type { BonusMode } from './math';
import type { createMotion } from './motion';

const counts = { regular: 3, super: 4, epic: 5 } as const;

export async function revealPurchaseScatters(
  layer: HTMLElement,
  mode: BonusMode,
  clock: ReturnType<typeof createMotion>,
  onImpact: (index: number) => void,
  plan: Landing[],
  timing: RevealTiming,
) {
  const locations = plan.map(({ column, row }) => [column, row]);
  if (locations.length !== counts[mode] || plan.some((landing, i) => landing.order !== i) || new Set(plan.map(p => p.row * 6 + p.column)).size !== plan.length) throw Error('Invalid cinematic scatter count.');
  layer.replaceChildren();
  layer.dataset.landed = '0';
  layer.dataset.presentation = 'cinematic-only-purchase';
  layer.dataset.phase = 'drop';
  layer.hidden = false;
  try {
    await clock.wait(timing.leadMs);
    for (const [index, [column, row]] of locations.entries()) {
      const cell = document.createElement('span');
      cell.className = 'scatter-drop-cell';
      cell.style.setProperty('--column', String(column));
      cell.style.setProperty('--row', String(row));
      const badge = document.createElement('img');
      badge.src = conceptArt('scatter');
      badge.alt = '';
      const sparks = Array.from({ length: 8 }, (_, i) => {
        const spark = document.createElement('i');
        spark.style.setProperty('--angle', String(i * 45) + 'deg');
        return spark;
      });
      cell.append(badge, ...sparks);
      layer.append(cell);
      let landed = false;
      await clock.tween(timing.dropMs, progress => {
        const impact = timing.impactProgress;
        const rebound = Math.max(0, (progress - impact) / (1 - impact));
        const fall = (row + 1.3) * (1 - (Math.min(progress, impact) / impact) ** 2);
        const bounce = .28 * Math.sin(rebound * Math.PI * 2) * (1 - rebound) ** 2;
        const squash = Math.sin(rebound * Math.PI * 3) * (1 - rebound) * .19;
        badge.style.transform = 'translateY(' + (-100 * (fall + Math.max(0, bounce))) + '%) scale(' +
          (1 + squash) + ',' + (1 - squash) + ')';
        cell.style.setProperty('--impact', String(rebound));
        if (!landed && progress >= impact) {
          landed = true;
          cell.dataset.landed = 'true';
          layer.dataset.landed = String(index + 1);
          if (!clock.instant) onImpact(index);
        }
      });
      await clock.wait(timing.betweenMs);
    }
    layer.dataset.phase = 'complete';
    await clock.wait(timing.holdMs);
  } finally {
    layer.hidden = true;
    layer.replaceChildren();
    delete layer.dataset.phase;
    delete layer.dataset.presentation;
  }
  return counts[mode];
}

