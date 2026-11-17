
import type { BonusMode } from './math';
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const kartEvents = {
  mount: .06, ignition: .225, rev: .30, wheelspin: .38, acceleration: .51, driveby: .68, accent: .78,
} as const;

export function kartPose(mode: BonusMode, progress: number, width: number, height: number) {
  const travel = clamp((progress - .38) / .62);
  const speed = travel ** 1.35;
  const lift = mode === 'super' && travel > .25 && travel < .83
    ? Math.sin((travel - .25) * Math.PI / .58) * 57 : 0;
  const drift = mode === 'regular' ? Math.sin(travel * Math.PI * 2) * 8 * travel : 0;
  const frame = progress < .29 ? Math.min(2, Math.floor(progress * 10.35))
    : mode === 'epic' && travel > .60 ? (travel > .82 ? 8 : 7)
    : lift > 14 ? 6 : 3 + Math.floor(travel * 13) % 3;
  const grow = height * (.73 + Math.sin(travel * Math.PI) * .155);
  const vibration = progress >= kartEvents.ignition && progress < .49 ? Math.sin(progress * 155) * (progress > .38 ? 2.8 : 1.6) : 0;
  return {
    x: width * (.135 + speed * .42) + drift + vibration,
    y: Math.max(8, height * .94 - grow - lift + Math.sin(travel * 51) * 3 + vibration),
    w: grow * 320 / 280, h: grow, frame, travel, speed, lift,
  };
}
type Pose = ReturnType<typeof kartPose>;

// Registration measured in each packed 320×280 sprite cell.
// [exhaust, rear hub, tyre contact, near headlight]
const anchors = [
  [.46,.70,.67,.77,.69,.94,.73,.68], [.45,.67,.61,.79,.61,.94,.67,.67],
  [.13,.61,.16,.74,.17,.89,.60,.67], [.12,.63,.15,.77,.15,.91,.60,.65],
  [.13,.63,.17,.75,.16,.89,.56,.57], [.13,.66,.14,.77,.14,.90,.48,.68],
  [.12,.64,.16,.78,.16,.93,.57,.47], [.12,.61,.19,.77,.18,.94,.61,.64],
  [.13,.56,.29,.81,.31,.95,.64,.65],
];
const spool = (n: number) => ((Math.sin(n * 41.877 + 26.21) * 13259) % 1 + 1) % 1;

export function kartSmoke(ctx: CanvasRenderingContext2D, mode: BonusMode, progress: number,
  duration: number, width: number, height: number) {
  const now = progress * duration / 1000;
  for (let i = 0; i < 68; i++) {
    const tyre = i >= 19;
    const born = tyre ? .362 + (i - 19) * .012 : .223 + i * .025;
    const age = now - born * duration / 1000;
    const lifetime = tyre ? .61 + spool(i) * .47 : .53 + spool(i) * .31;
    if (age <= 0 || age >= lifetime || born > .96) continue;
    const source = kartPose(mode, born, width, height);
    if (tyre && source.lift > 15) continue;
    const j = tyre ? 4 : 0;
    const pupil = anchors[source.frame];
    const dx = source.x + pupil[j] * source.w;
    const dy = source.y + pupil[j + 1] * source.h;
    const time = age / lifetime;
    const x = dx - (tyre ? 44 + source.travel * 86 : 39) * age - 13 * Math.sin(time * 2 + i) * time;
    const y = dy - age * (tyre ? 20 : 54) + (spool(i * 3) - .5) * time * 23;
    const r = 3 + time * (tyre ? 31 + 10 * source.travel : 17);
    const a = Math.min(1,time * 8) * (1 - time) ** 1.45 * (tyre ? .58 : .43);
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(time * (spool(i) - .5) * 2.4);
    ctx.scale(1.24, .66 + time * .33);
    const puff = ctx.createRadialGradient(0,0,0,0,0,r);
    puff.addColorStop(0, tyre ? '#e0b3a2' : '#c4daec');
    puff.addColorStop(.46, tyre ? '#b08faba0' : '#b4b9dca6');
    puff.addColorStop(1,'#b7acc000');
    ctx.globalAlpha = a;
    ctx.fillStyle = puff;
    ctx.fillRect(-r,-r,r*2,r*2);
    ctx.restore();
  }
}

export function kartDetails(ctx: CanvasRenderingContext2D, model: Pose, progress: number, quiet: boolean) {
  if (progress < kartEvents.ignition || quiet) return;
  const anchor = anchors[model.frame];
  const lampX = model.x + model.w * anchor[6];
  const lampY = model.y + model.h * anchor[7];
  const radius = 12 + model.travel * 10;
  const light = ctx.createRadialGradient(lampX,lampY,0,lampX,lampY,radius);
  light.addColorStop(0, '#c4fff5bc');
  light.addColorStop(.31, '#5af4ff6a');
  light.addColorStop(1,'#5af4ff00');
  ctx.fillStyle = light;
  ctx.fillRect(lampX-radius,lampY-radius,2*radius,2*radius);
  if (progress < kartEvents.wheelspin) return;
  const x = model.x + anchor[2]*model.w, y = model.y + anchor[3]*model.h;
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(.56,1);
  ctx.rotate(progress * (92 + 40 * model.speed));
  ctx.strokeStyle = '#eac99b65';
  ctx.lineWidth = 1.45;
  for (let i=0;i<3;i++) {
    const angle = i*Math.PI*2/3;
    ctx.beginPath();
    ctx.arc(0,0,model.h*.052,angle,angle+.78);
    ctx.stroke();
  }
  ctx.restore();
}

