import type { Tween } from './motion';

export type Pose = 'idle' | 'ready' | 'curious' | 'watch' | 'reset' | 'win' | 'big' | 'bonus';
type Keyframe = readonly [position: number, atlasFrame: number];
const clips: Record<Exclude<Pose, 'idle'>, { duration: number; keys: readonly Keyframe[] }> = {
  ready: { duration: 330, keys: [[0,1],[.37,3]] },
  curious: { duration: 540, keys: [[0,3],[.24,1],[.68,3]] },
  watch: { duration: 620, keys: [[0,3],[.25,4]] },
  reset: { duration: 730, keys: [[0,1],[.48,2],[.65,0]] },
  win: { duration: 640, keys: [[0,3],[.22,6],[.76,1]] },
  big: { duration: 1100, keys: [[0,4],[.17,7],[.39,8],[.79,6]] },
  bonus: { duration: 1200, keys: [[0,4],[.15,6],[.31,7],[.57,8]] },
};
const gogglesFrame = 9;

export function mountMascot(canvas: HTMLCanvasElement, animate: Tween, sheetUrl: string) {
  const ctx = canvas.getContext('2d')!;
  const sheet = new Image();
  const goggles = new Image();
  const { width, height } = canvas;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = canvas.closest('dialog');
  let pose: Pose = 'idle';
  let revision = 0;
  let frame = -1;
  let painted = -Infinity;
  let started = 0;
  let nextGesture = 0;
  let gesture = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const instant = () => motionPreference.matches || document.documentElement.dataset.motion === 'instant';
  const visible = () => !document.hidden && (!dialog || dialog.open) && !canvas.closest('[hidden]');
  const full = () => document.documentElement.dataset.effects !== 'reduced';

  function draw(index: number, breath = 0) {
    if (!sheet.naturalWidth || (frame === index && painted === breath)) return;
    const adjusting = index === gogglesFrame && goggles.naturalWidth;
    const image = adjusting ? goggles : sheet;
    const cellWidth = image.naturalWidth / (adjusting ? 1 : 3);
    const cellHeight = image.naturalHeight / (adjusting ? 1 : 3);
    const scale = Math.min(width / cellWidth, height / cellHeight) * (adjusting ? .90 : 1);
    const sourceIndex = index === gogglesFrame ? 0 : index;
    // Feet stay planted. Only a shallow breathing motion runs while idle.
    const w = cellWidth * scale;
    const h = cellHeight * scale;
    const lift = h * breath;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, sourceIndex % 3 * cellWidth, Math.floor(sourceIndex / 3) * cellHeight, cellWidth, cellHeight,
      (width - w) / 2, height - h - lift, w, h + lift);
    frame = index;
    painted = breath;
  }

  function idleTick() {
    clearTimeout(timer);
    if (pose !== 'idle' || !visible()) return;
    if (instant()) { draw(0); return; }
    const now = performance.now();
    if (now >= nextGesture) {
      started = now;
      nextGesture = now + 2100 + Math.random() * 2200;
      gesture++;
    }
    const phase = now - started;
    const index = gesture % 4 === 3 && full() && goggles.naturalWidth && phase < 630 ? gogglesFrame
      : gesture % 2 === 0 && phase < 150 ? 2
      : gesture % 2 === 1 && phase < 590 ? 1 : 0;
    const breath = full() ? .0035 * (1 - Math.cos(now / 540)) : 0;
    draw(index, index === gogglesFrame ? 0 : breath);
    timer = setTimeout(idleTick, full() ? 54 : 95);
  }

  function react(action: Pose, returnToIdle = false) {
    pose = action;
    canvas.dataset.pose = action;
    clearTimeout(timer);
    const id = ++revision;
    if (action === 'idle') {
      nextGesture = performance.now() + 950 + Math.random() * 1000;
      idleTick();
      return;
    }
    const { keys, duration } = clips[action];
    if (instant()) {
      draw(keys.at(-1)![1]);
      if (returnToIdle) react('idle');
      return;
    }
    void animate(duration, progress => {
      if (id !== revision) return;
      let index = keys.length - 1;
      while (progress < keys[index][0]) index--;
      draw(keys[index][1]);
    }).then(() => {
      if (returnToIdle && id === revision) react('idle');
    });
  }

  sheet.addEventListener('load', () => { if (frame === -1) react(pose); }, { once:true });
  sheet.src = sheetUrl;
  goggles.src = import.meta.env.BASE_URL + 'art/identity/mochi-goggles.webp';
  const observer = dialog ? new MutationObserver(idleTick) : undefined;
  if (dialog) observer?.observe(dialog, { attributeFilter:['open'] });
  document.addEventListener('visibilitychange', idleTick);
  motionPreference.addEventListener('change', idleTick);
  document.querySelector('#speed')?.addEventListener('change', () => queueMicrotask(idleTick));
  window.addEventListener('pagehide', event => {
    clearTimeout(timer);
    if (!event.persisted) observer?.disconnect();
  });
  window.addEventListener('pageshow', idleTick);
  return react;
}
