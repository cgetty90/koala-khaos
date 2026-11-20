import {forestBlend,drawForestTrails} from './bonus-polish';

import { conceptArt } from './art';
import { kartDetails, kartEvents, kartPose, kartSmoke } from './kart-effects';
import type { BonusMode } from './math';
import type { createMotion } from './motion';
import type { createSound } from './sound';

const routes = {
  regular: { name: 'Bush Dash', duration: 2480, color: '#ead29b', accent: 'kart-candy' },
  super: { name: 'Red Dust Run', duration: 2720, color: '#d9b678', accent: 'kart-thunder' },
  epic: { name: 'Opal Run', duration: 3020, color: '#8fd5b5', accent: 'kart-portal' },
} as const;

export function createKartIntro(canvas: HTMLCanvasElement, clock: ReturnType<typeof createMotion>,
  audio: ReturnType<typeof createSound>, limited: () => boolean) {
  const context = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const feature=canvas.closest<HTMLElement>('#feature-dialog')!;
  const assets = new Map<string, Promise<HTMLImageElement>>();
  function load(path: string) {
    const cached = assets.get(path);
    if (cached) return cached;
    const bitmap = new Image();
    bitmap.src = path;
    const ready = bitmap.decode().then(() => bitmap).catch(error => {
      assets.delete(path);
      throw error;
    });
    assets.set(path, ready);
    return ready;
  }
  const sheetPath = import.meta.env.BASE_URL + 'art/outback/kart-atlas.webp';

  return async (mode: BonusMode) => {
    const style = routes[mode];
    const title = canvas.parentElement!.querySelector<HTMLElement>('.kart-route')!;
    title.textContent = style.name;
    if (clock.instant) return false;
    let sheet: HTMLImageElement, world: HTMLImageElement;
    try {
      [sheet, world] = await Promise.all([load(sheetPath), load(conceptArt(mode))]);
    } catch {
      return false; // The existing tier title is the fallback when an asset cannot decode.
    }
    feature.style.setProperty('--kart-handoff','0');
    canvas.parentElement!.hidden = false;
    canvas.dataset.route = mode;
    const impact = ['kart-mount', 'kart-ignition', 'kart-rev', 'kart-wheelspin',
      'kart-tyre', 'kart-driveby', style.accent] as const;
    const cueAt = Object.values(kartEvents);
    let nextCue = 0;
    const frameWidth = sheet.naturalWidth / 3;
    const frameHeight = sheet.naturalHeight / 3;
    try {
      await clock.tween(style.duration, progress => {
        const quiet = limited();
        const blend=forestBlend(progress);
        feature.style.setProperty('--kart-arrival',String(blend.arrival));
        feature.style.setProperty('--kart-handoff',String(blend.handoff));
        feature.style.setProperty('--kart-opacity',String(blend.arrival*(1-blend.handoff)));
        if (clock.instant) nextCue = cueAt.length;
        while (nextCue < cueAt.length && progress >= cueAt[nextCue]) audio.cue(impact[nextCue++]);
        const pose = kartPose(mode, progress, width, height);
        const { frame, speed, lift, travel } = pose;
        audio.setKartEngine(!clock.instant && progress >= kartEvents.ignition && progress < .955
          ? { throttle: Math.min(1, .08 + speed * .9 + (progress > .3 && progress < .5 ? .38 : 0)), pan: -.43 + travel * .79,
              volume: progress > .83 ? Math.max(.15,(1-progress)*4.5) : .82 }
          : null);
        canvas.dataset.action = progress < kartEvents.ignition ? 'mount'
          : progress < kartEvents.wheelspin ? 'ignition' : progress < kartEvents.acceleration ? 'wheelspin' : 'drive';
        const zoom = 1.04 + speed * (mode === 'epic' ? .24 : .16);
        const cropWidth = Math.min(world.naturalWidth, world.naturalHeight * width / height) / zoom;
        const cropHeight = cropWidth * height / width;
        const originX = (world.naturalWidth - cropWidth) * (.25 + speed * .52);
        const originY = (world.naturalHeight - cropHeight) * (.53 - lift / 210);

        context.clearRect(0, 0, width, height);
        context.drawImage(world, originX, originY, cropWidth, cropHeight, 0, 0, width, height);
        drawForestTrails(context,progress,width,height,mode,quiet);
        const shade = context.createLinearGradient(0, height * .4, 0, height);
        shade.addColorStop(0, '#142f2700'); shade.addColorStop(1, '#102b27aa');
        context.fillStyle = shade;
        context.fillRect(0, height * .4, width, height * .6);
        if (!quiet && speed > .08) {
          for (let i = 0; i < 22; i++) {
            const travel = (speed * (1.4 + i % 5 * .3) + i * .079) % 1;
            const x = width * (1 - travel) - 32;
            const y = height * (.55 + (i * 37 % 100) * .004);
            context.globalAlpha = Math.sin(travel * Math.PI) * Math.min(speed * 2, .54);
            context.fillStyle = i % 4 === 0 ? '#fff6e1' : style.color;
            context.beginPath();
            context.ellipse(x, y, 1 + i % 6, 1 + i % 3, 0, 0, Math.PI * 2);
            context.fill();
          }
        }
        context.globalAlpha = 1;
        if (!quiet && mode === 'epic' && speed > .59) {
          const rainbow = ['#f6dfa2b3','#c4d9958c','#81c7ad9c','#daf3cf8c'];
          context.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            context.strokeStyle = rainbow[i];
            context.beginPath();
            context.ellipse(width * .76, height * .54, 24 + i * 9 + speed * 32, 39 + i * 9 + speed * 27, -.18, 0, Math.PI * 2);
            context.stroke();
          }
        }
        if (!quiet && mode === 'super' && speed > .43 && speed < .79) {
          const strength = Math.sin((speed - .43) / .36 * Math.PI) * .29;
          context.globalAlpha = strength;
          context.strokeStyle = '#f3dda5';
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(width * .79, 0);
          context.lineTo(width * .72, height * .16);
          context.lineTo(width * .77, height * .23);
          context.lineTo(width * .69, height * .43);
          context.stroke();
          context.globalAlpha = 1;
        }
        const spriteX = frame % 3 * frameWidth;
        const spriteY = Math.floor(frame / 3) * frameHeight;
        if (!quiet) {
          context.fillStyle = '#1a0a2070';
          context.beginPath();
          context.ellipse(pose.x + pose.w * .52, height * .923, pose.w * (.33 - lift / 350), 6 - lift / 20, .02, 0, Math.PI * 2);
          context.fill();
          kartSmoke(context, mode, progress, style.duration, width, height);
          if (speed > .28) {
            for (const [distance, opacity] of [[21,.07],[10,.13]]) {
              context.globalAlpha = opacity * speed;
              context.drawImage(sheet, spriteX, spriteY, frameWidth, frameHeight,
                pose.x - distance * speed, pose.y + speed * 2, pose.w, pose.h);
            }
            context.globalAlpha = 1;
          }
        }
        context.drawImage(sheet, spriteX, spriteY, frameWidth, frameHeight, pose.x, pose.y, pose.w, pose.h);
        kartDetails(context, pose, progress, quiet);
        canvas.dataset.frame = String(frame);
      });
    } finally {
      audio.setKartEngine(null);
      feature.style.setProperty('--kart-handoff','1');
      canvas.parentElement!.hidden = true;
    }
    return true;
  };
}

