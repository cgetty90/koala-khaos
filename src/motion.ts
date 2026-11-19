export type Tween = (duration: number, draw: (progress: number) => void) => Promise<void>;

type PlaybackStage = { skipped: boolean };

export function createMotion(getRate: () => number, onActivity = () => {}) {
  const active: PlaybackStage[] = [];
  let scope: PlaybackStage | undefined;
  let visibilityChanges = 0;
  function syncVisibility() {
    visibilityChanges++;
    document.documentElement.dataset.paused = String(document.hidden);
  }
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();

  async function visible() {
    while (document.hidden) {
      await new Promise<void>(resolve => document.addEventListener('visibilitychange', () => resolve(), { once: true }));
    }
  }

  const current = () => scope ?? active.at(-1);
  const tween = async (duration: number, draw: (progress: number) => void, skippable = true) => {
    const stage = scope ?? { skipped: false };
    await visible();
    if (stage.skipped || !getRate() || duration <= 0) {
      draw(1);
      return;
    }
    if (skippable) { active.push(stage); onActivity(); }
    try {
      draw(0);
      let elapsed = 0;
      let previous: number | undefined;
      let visibility = visibilityChanges;
      while (elapsed < duration) {
        await visible();
        const now = await new Promise<number>(resolve => requestAnimationFrame(resolve));
        if (document.hidden) continue;
        const rate = getRate();
        if (stage.skipped || !rate) {
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
    } finally {
      if (skippable) { active.splice(active.lastIndexOf(stage), 1); onActivity(); }
    }
  };
  return {
    tween,
    visible,
    wait: (duration: number) => tween(duration, () => {}),
    pause: (duration: number) => tween(duration, () => {}, false),
    async nextSpin() {
      await visible();
      await new Promise<number>(resolve => requestAnimationFrame(resolve));
      await visible();
    },
    async stage(task: () => Promise<void>) {
      const previous = scope;
      scope = { skipped:false };
      onActivity();
      try { await task(); }
      finally { scope = previous; onActivity(); }
    },
    skipCurrent() {
      const stage = current();
      if (!stage || stage.skipped || !getRate() || document.hidden) return false;
      stage.skipped = true;
      onActivity();
      return true;
    },
    get skippable() {
      const stage = current();
      return Boolean(stage && !stage.skipped && getRate() && !document.hidden);
    },
    get skipping() { return current()?.skipped === true; },
    get instant() { return current()?.skipped || !getRate(); },
  };
}

export type BoardPhase = 'drop' | 'refill' | 'pop' | 'anticipation' | 'transform' | 'storm-charge' | 'storm-break';
export type BoardPresentationEvent={phase:BoardPhase;edge:'start'|'release'|'end';progress:number;completed?:boolean;audioSuppressed?:boolean};

export function createBoardTimeline(host: HTMLElement, tween: Tween, render: () => void,notify:(event:BoardPresentationEvent)=>void=()=>{},suppressAudio:()=>boolean=()=>false) {
  let state: BoardPhase | 'idle' = 'idle';
  host.dataset.phase = state;
  return async (next: BoardPhase, duration: number, frame: (progress: number) => void) => {
    if (state !== 'idle') throw new Error('A board animation is already running');
    state = next;
    host.dataset.phase = state;
    let started=false,released=false,lastProgress=0,completed=false,audioSuppressed=false;
    try {
      await tween(duration, progress => {frame(progress);render();lastProgress=progress;audioSuppressed=suppressAudio();if(!started){started=true;notify({phase:next,edge:'start',progress})}if(next==='pop'&&!released&&progress>=.32){released=true;notify({phase:next,edge:'release',progress})}});
      completed=true;
    } finally {
      notify({phase:next,edge:'end',progress:lastProgress,completed,audioSuppressed});
      state = 'idle';
      host.dataset.phase = state;
    }
  };
}
