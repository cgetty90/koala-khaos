export type Tween = (duration: number, draw: (progress: number) => void) => Promise<void>;

export function createMotion(getRate: () => number) {
  let skipped = false;
  let visibilityChanges = 0;
  const root = document.documentElement;
  function syncVisibility() {
    visibilityChanges++;
    root.dataset.paused = String(document.hidden);
  }
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();

  async function visible() {
    while (document.hidden) {
      await new Promise<void>(resolve => document.addEventListener('visibilitychange', () => resolve(), { once: true }));
    }
  }

  const tween: Tween = async (duration, draw) => {
    await visible();
    if (skipped || !getRate() || duration <= 0) {
      draw(1);
      return;
    }
    draw(0);
    let elapsed = 0;
    let previous: number | undefined;
    let visibility = visibilityChanges;
    while (elapsed < duration) {
      await visible();
      const now = await new Promise<number>(resolve => requestAnimationFrame(resolve));
      if (document.hidden) continue;
      const rate = getRate();
      if (skipped || !rate) {
        draw(1);
        return;
      }
      if (visibility === visibilityChanges && previous !== undefined) {
        elapsed += Math.min(now - previous, 50) * rate;
      }
      visibility = visibilityChanges;
      previous = now;
      draw(Math.min(elapsed / duration, 1));
    }
  };
  return {
    tween,
    visible,
    wait: (duration: number) => tween(duration, () => {}),
    async nextSpin() {
      await visible();
      // Even instant playback yields between spins so rendering and visibility events can run.
      await new Promise<number>(resolve => requestAnimationFrame(resolve));
      await visible();
    },
    reset() {
      skipped = false;
      root.dataset.skip = 'false';
    },
    skip() {
      skipped = true;
      root.dataset.skip = 'true';
    },
    get instant() { return skipped || !getRate(); },
  };
}

export type BoardPhase = 'drop' | 'refill' | 'pop' | 'anticipation' | 'transform' | 'storm-charge' | 'storm-break';

export function createBoardTimeline(host: HTMLElement, tween: Tween, render: () => void) {
  let state: BoardPhase | 'idle' = 'idle';
  host.dataset.phase = state;
  return async (next: BoardPhase, duration: number, frame: (progress: number) => void) => {
    if (state !== 'idle') throw new Error('A board animation is already running');
    state = next;
    host.dataset.phase = state;
    try {
      await tween(duration, progress => { frame(progress); render(); });
    } finally {
      state = 'idle';
      host.dataset.phase = state;
    }
  };
}
