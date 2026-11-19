import type { Tween } from './motion';
import { sceneCovered } from './ambient-state';

export type Pose = 'idle' | 'ready' | 'curious' | 'watch' | 'reset' | 'win' | 'big' | 'mega' | 'epic' | 'bonus' | 'complete';
type Keyframe = readonly [position: number, atlasFrame: number];
const clips: Record<Exclude<Pose, 'idle'>, { duration: number; keys: readonly Keyframe[] }> = {
  ready: { duration: 330, keys: [[0,1],[.37,3]] },
  curious: { duration: 540, keys: [[0,3],[.24,1],[.68,3]] },
  watch: { duration: 620, keys: [[0,3],[.25,4]] },
  reset: { duration: 730, keys: [[0,1],[.35,5],[.82,0]] },
  win: { duration: 640, keys: [[0,3],[.22,6],[.76,1]] },
  big: { duration: 1100, keys: [[0,4],[.17,7],[.39,8],[.79,6]] },
  mega: { duration: 1250, keys: [[0,3],[.14,6],[.31,7],[.62,8],[.88,6]] },
  epic: { duration: 1500, keys: [[0,4],[.18,7],[.43,8],[.72,7],[.9,8]] },
  bonus: { duration: 1200, keys: [[0,4],[.15,6],[.31,7],[.57,8]] },
  complete: { duration: 1300, keys: [[0,6],[.18,7],[.5,8]] },
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
  let inView = true;
  let wanted = 0;
  const instant = () => motionPreference.matches || document.documentElement.dataset.motion === 'instant';
  const visible = () => !document.hidden && inView && (!dialog ? !sceneCovered() : dialog.open) && !canvas.closest('[hidden]');
  const full = () => document.documentElement.dataset.effects !== 'reduced';

  function draw(index: number, breath = 0) {
    wanted = index;
    if (!sheet.naturalWidth || !visible()) return;
    if (frame === index && painted === breath) return;
    // One opaque authored pose: crossfading different silhouettes produces ghost limbs.
    // Alpha bounds keep the feet and body scale consistent across the nine poses.
    const bounds = [[39,25,314,404],[432,27,309,404],[824,30,314,400],
      [38,470,312,406],[429,478,315,399],[825,485,321,392],
      [37,904,319,417],[422,904,321,360],[808,908,353,413]];
    const adjusting = index === gogglesFrame && goggles.naturalWidth;
    const image = adjusting ? goggles : sheet;
    const outback = sheetUrl.includes('/outback/');
    const [sx,sy,sw,sh] = outback ? [(index%3)*384,Math.floor(index/3)*448,384,448] : adjusting ? [0,0,image.naturalWidth,image.naturalHeight] : bounds[index];
    const scale = outback ? Math.min(width/384,height/448)*.99 : adjusting ? Math.min(width / sw,height / sh) * .9 : Math.min(width / 353,height / 417) * .97;
    const w = sw * scale, h = sh * scale;
    const lift = height * breath + (!outback && index === 7 ? height * .08 : 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.drawImage(image,sx,sy,sw,sh,(width-w)/2,height-h-lift,w,h);
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
    draw(index);
    // Schedule only an authored pose boundary, never a continuous canvas breath.
    const boundary = phase < 150 ? 150 - phase : phase < 630 ? 630 - phase : nextGesture - now;
    timer = setTimeout(idleTick, Math.max(40, boundary));
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
  // Keep every gesture on the same character model and outfit.
  if (!sheetUrl.includes('/v33/') && !sheetUrl.includes('/outback/')) goggles.src = import.meta.env.BASE_URL + 'art/identity/mochi-goggles.webp';
  const observer = dialog ? new MutationObserver(idleTick) : undefined;
  if (dialog) observer?.observe(dialog, { attributeFilter:['open'] });
  document.addEventListener('visibilitychange', idleTick);
  motionPreference.addEventListener('change', idleTick);
  const wake = () => { if (pose === 'idle') idleTick(); else { frame = -1; draw(wanted); } };
  const intersection = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; wake(); });
  intersection.observe(canvas);
  document.addEventListener('ambientvisibilitychange',wake);
  document.addEventListener('graphics-qualitychange',wake);
  document.querySelector('#speed')?.addEventListener('change', () => queueMicrotask(idleTick));
  window.addEventListener('pagehide', event => {
    clearTimeout(timer);
    if (!event.persisted) { observer?.disconnect(); intersection.disconnect(); document.removeEventListener('ambientvisibilitychange',wake); document.removeEventListener('graphics-qualitychange',wake); }
  });
  window.addEventListener('pageshow', idleTick);
  return react;
}
