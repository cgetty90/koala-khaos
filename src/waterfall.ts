
const WIDTH = 800;
const HEIGHT = 450;

// Coordinates on the existing production jungle plate, including the ledges and plunge pools.
const falls = [
  { x: .168, y: .300, w: .075, h: .298, slant: .004, speed: .48 },
  { x: .218, y: .545, w: .020, h: .081, slant: .006, speed: .62 },
  { x: .375, y: .781, w: .055, h: .053, slant: -.010, speed: .53 },
  { x: .286, y: .756, w: .043, h: .029, slant: .012, speed: .61 },
];
const seed = (n: number) => ((Math.sin(n * 147.79 + 31.46) * 47289.177) % 1 + 1) % 1;

export function mountWaterfall(canvas: HTMLCanvasElement, dialog?: HTMLDialogElement) {
  const ctx = canvas.getContext('2d')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 680px)');
  const host = canvas.parentElement!;
  const baseWorld = () => ['base', undefined].includes(document.body.dataset.world);
  let request = 0;
  let last = 0;
  let phase = 0;
  let drawCount = 0;
  let accent = 0;
  let closing = false;
  const root = document.documentElement;

  function fit() {
    const aspect = WIDTH / HEIGHT;
    const width = Math.max(host.clientWidth, host.clientHeight * aspect);
    canvas.style.width = width + 'px';
    canvas.style.height = width / aspect + 'px';
  }

  function draw() {
    ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const lite = compact.matches || root.dataset.effects === 'reduced';
    const quality = lite ? 'simple' : 'full';
    if (canvas.dataset.quality !== quality) canvas.dataset.quality = quality;
    for (const [index, f] of falls.entries()) {
      const x = f.x * WIDTH, y = f.y * HEIGHT;
      const w = f.w * WIDTH, h = f.h * HEIGHT, skew = f.slant * WIDTH;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y + h * .03);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w + skew, y + h);
      ctx.lineTo(x + skew - w * .15, y + h * .98);
      ctx.closePath();
      ctx.clip();
      // Falling ribbons and highlights. Each particle wraps with zero opacity at the seam.
      for (let i = 0; i < (lite ? 25 : 49); i++) {
        const a = seed(i + index * 43);
        const t = (phase * f.speed * (.8 + a * .49) + seed(i * 11 + index)) % 1;
        const dy = h * t;
        const span = h * (.07 + seed(i * 3) * .22);
        ctx.globalAlpha = Math.sin(t * Math.PI) * (.26 + a * .29) * (lite ? .72 : 1) * (1 + accent * .32);
        ctx.strokeStyle = i % 4 ? '#b7e8ff' : '#f2fcff';
        ctx.lineWidth = .36 + a * 1.35;
        ctx.beginPath();
        ctx.moveTo(x + a * w + t * skew, y + dy);
        ctx.lineTo(x + a * w + (t + span / h) * skew, y + dy + span);
        ctx.stroke();
      }
      ctx.restore();
      // Pool foam. Ripples and droplets expand away from the impact.
      for (let i = 0; i < (lite ? 8 : 16); i++) {
        const t = (phase * (.52 + seed(i) * .4) + seed(index * 13 + i)) % 1;
        const spread = seed(i * 5) - .5;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .46;
        ctx.fillStyle = i % 3 ? '#cff9ff' : '#8ef6ef';
        ctx.beginPath();
        ctx.ellipse(x + skew + w * (.42 + spread * (1 + t)), y + h - Math.sin(t * Math.PI) * (1+i%5) + t * 5,
          1 + t * 4, .65 + t * .85, .08, 0, Math.PI*2);
        ctx.fill();
      }
      // Mist and a soft moving reflection outside the falling-water mask.
      if (!lite) {
        for (let i = 0; i < 4; i++) {
          const t = (phase * .38 + i * .25) % 1;
          const mx = x + skew + w * (.46 + (seed(i + index) - .5) * t);
          const my = y + h - t * 9;
          const radius = 3 + t * 12;
          const mist = ctx.createRadialGradient(mx,my,0,mx,my,radius);
          mist.addColorStop(0,'#c5e8ff66'); mist.addColorStop(1,'#c5e8ff00');
          ctx.globalAlpha = Math.sin(t * Math.PI) * (.45 + accent * .15);
          ctx.fillStyle = mist;
          ctx.fillRect(mx-radius,my-radius,2*radius,2*radius);
        }
      }
      ctx.globalAlpha = 1;
    }
    canvas.dataset.frame = String(++drawCount);
  }

  function tick(now: number) {
    request = 0;
    if (closing || document.hidden || (dialog && !dialog.open)) return;
    request = requestAnimationFrame(tick);
    const enabled = baseWorld() && !motion.matches && root.dataset.motion !== 'instant';
    if (!enabled) {
      if (last) ctx.clearRect(0, 0, WIDTH, HEIGHT);
      last = 0;
      return;
    }
    const frameTime = compact.matches || root.dataset.effects === 'reduced' ? 62 : 41;
    if (last && now - last < frameTime) return;
    if (last) phase += Math.min(.09,(now-last)/1000);
    last = now;
    accent *= .93;
    draw();
  }

  function visibility() {
    cancelAnimationFrame(request);
    last = 0;
    if (!document.hidden && !closing && (!dialog || dialog.open)) request = requestAnimationFrame(tick);
  }
  const visibilityObserver = dialog ? new MutationObserver(visibility) : undefined;
  if (dialog) visibilityObserver?.observe(dialog, { attributeFilter:['open'] });
  const resize = new ResizeObserver(fit);
  resize.observe(host);
  fit();
  visibility();
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pageshow', visibility);
  window.addEventListener('pagehide', event => {
    cancelAnimationFrame(request);
    if (!event.persisted) {
      closing = true;
      resize.disconnect();
      visibilityObserver?.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pageshow', visibility);
    }
  });
  return () => { accent = 1; };
}

