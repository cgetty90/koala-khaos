
import type { Tween } from './motion';

export type Pose = 'idle' | 'ready' | 'watch' | 'reset' | 'win' | 'bonus';

const clips: Record<Exclude<Pose, 'idle'>, readonly number[]> = {
  ready: [3, 4, 5, 4],
  watch: [3, 4, 5],
  reset: [5, 4, 2, 0],
  win: [6, 7, 8, 6],
  bonus: [5, 6, 7, 8, 7, 8],
};

export function mountMascot(canvas: HTMLCanvasElement, animate: Tween, sheetUrl: string) {
  const ctx = canvas.getContext('2d')!;
  const sheet = new Image();
  const { width, height } = canvas;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let pose: Pose = 'idle';
  let request = 0;
  let frame = -1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const instant = () => motionPreference.matches || document.documentElement.dataset.motion === 'instant';

  function draw(index: number) {
    if (!sheet.complete || !sheet.naturalWidth || index === frame) return;
    frame = index;
    const w = sheet.naturalWidth / 3;
    const h = sheet.naturalHeight / 3;
    const scale = Math.min(width / w, height / h);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(sheet, index % 3 * w, Math.floor(index / 3) * h, w, h,
      (width - w * scale) / 2, height - h * scale, w * scale, h * scale);
  }

  function idleTick() {
    clearTimeout(timer);
    const dialog = canvas.closest('dialog');
    const hidden = canvas.closest('[hidden]');
    if (pose !== 'idle' || document.hidden || (dialog && !dialog.open) || hidden || instant()) {
      if (pose === 'idle') draw(0);
      return;
    }
    const cycle = performance.now() % 4100;
    draw(cycle > 3320 && cycle < 3470 ? 2 : cycle > 1040 && cycle < 1710 ? 1 : 0);
    timer = setTimeout(idleTick, 75);
  }

  function react(action: Pose) {
    pose = action;
    canvas.dataset.pose = action;
    clearTimeout(timer);
    const id = ++request;
    if (action === 'idle') { idleTick(); return; }
    const clip = clips[action];
    if (instant()) { draw(clip[clip.length - 1]); return; }
    void animate(action === 'bonus' ? 1040 : action === 'win' ? 740 : 510, progress => {
      if (request === id) draw(clip[Math.min(clip.length - 1, Math.floor(progress * clip.length))]);
    });
  }

  sheet.onload = () => react(pose);
  sheet.src = sheetUrl;
  document.addEventListener('visibilitychange', idleTick);
  motionPreference.addEventListener('change', idleTick);
  document.querySelector('#speed')?.addEventListener('change', () => queueMicrotask(idleTick));
  window.addEventListener('pagehide', () => clearTimeout(timer), { once: true });
  return react;
}

