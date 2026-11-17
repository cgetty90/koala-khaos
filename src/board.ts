import { Application, Container, Graphics, type Sprite } from 'pixi.js';
import { loadCandyArt, type BoardSymbol } from './art';
import { columns, rows, type Movement } from './game';
import { createBoardTimeline, type Tween } from './motion';

const cell = 96;
const width = columns * cell;
const height = rows * cell;
const rowAt = (i: number) => Math.floor(i / columns);
const xAt = (i: number) => (i % columns + .5) * cell;
const rowY = (r: number) => (r + .5) * cell;
const clamp = (p: number) => Math.max(0, Math.min(1, p));
const shardColors: Record<BoardSymbol, number> = {
  berry: 0xff528b, lemon: 0xffc444, mint: 0x74ffc3, grape: 0xd988ff, peach: 0xff6888, toffee: 0x64dfff, scatter: 0xffdb83,
};
type BoardMove = Omit<Movement, 'candy'> & { candy: BoardSymbol };
export type ScatterReveal = { order: readonly number[]; alreadyLanded: number; onLand(cell: number): void };

export async function mountBoard(host: HTMLElement, animate: Tween, living = false, fallPace = () => 1) {
  const candyArt = await loadCandyArt();
  const app = new Application();
  await app.init({ width, height, backgroundAlpha: 0, preference: 'canvas', autoStart: false, resolution: 1 });
  host.appendChild(app.canvas);

  const backdrop = new Graphics();
  const pieces = new Container();
  const sparks = new Graphics();
  app.stage.addChild(backdrop, pieces, sparks);
  for (let i = 0; i < columns * rows; i++) {
    const color = (i + rowAt(i)) % 2 ? 0x3d2254 : 0x2d1e46;
    backdrop.roundRect(xAt(i) - 45, rowY(rowAt(i)) - 45, 90, 90, 13)
      .fill({ color, alpha: .92 }).stroke({ color: 0xbe8bac, alpha: .22, width: 1 });
    backdrop.roundRect(xAt(i) - 43, rowY(rowAt(i)) - 43, 86, 86, 11)
      .stroke({ color: 0x9d73be, alpha: .15, width: 1.25 });
  }

  let sprites: Sprite[] = [];
  let restingBoard: readonly BoardSymbol[] = [];
  let resolution = 1;
  const render = () => app.render();
  function resize() {
    const pixels = host.clientWidth * Math.min(devicePixelRatio, 2);
    const next = Math.max(.4, Math.min(2, Math.round(pixels / width * 8) / 8));
    if (next === resolution) return;
    resolution = next;
    app.renderer.resize(width, height, resolution);
    host.dataset.resolution = String(resolution);
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  window.addEventListener('resize', resize, { passive: true });

  function create(candy: BoardSymbol, index: number) {
    const sprite = candyArt(candy);
    sprite.position.set(xAt(index), rowY(rowAt(index)));
    return pieces.addChild(sprite);
  }
  function publish(board: readonly BoardSymbol[]) {
    restingBoard = board;
    host.dataset.candies = board.join(',');
    render();
  }
  function draw(board: readonly BoardSymbol[]) {
    pieces.removeChildren().forEach(piece => piece.destroy());
    sprites = board.map(create);
    publish(board);
  }

  const phase = createBoardTimeline(host, animate, render);
  const compactTouch = matchMedia('(pointer: coarse) and (max-width: 720px)');
  const restoreRestingPositions = () => sprites.forEach((sprite, i) => { sprite.y = rowY(rowAt(i)); });
  if (living) {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    let drifting = false;
    const timer = setInterval(() => {
      if (document.hidden || host.dataset.phase !== 'idle' || compactTouch.matches || !sprites.length) return;
      const enabled = !preference.matches && root.dataset.effects !== 'reduced' && root.dataset.motion !== 'instant';
      if (!enabled) {
        if (drifting) { restoreRestingPositions(); render(); drifting = false; }
        return;
      }
      const time = performance.now() / 560;
      sprites.forEach((sprite, i) => { sprite.y = rowY(rowAt(i)) + Math.sin(time + i * 1.48) * .85; });
      render();
      drifting = true;
    }, 120);
    window.addEventListener('pagehide', event => { if (!event.persisted) clearInterval(timer); });
  }

  async function fall(board: readonly BoardSymbol[], moves: readonly BoardMove[], duration: number, opening = false,
    reveal?: ScatterReveal, openingPace = 1) {
    restoreRestingPositions();
    const previous = sprites;
    const next = Array<Sprite>(board.length);
    const kept = new Set<Sprite>();
    const falling = moves.map(move => {
      const source = move.fromRow * columns + move.to % columns;
      const survivor = !opening && move.fromRow >= 0 ? previous[source] : undefined;
      const sprite = survivor ?? create(move.candy, move.to);
      kept.add(sprite);
      next[move.to] = sprite;
      return { ...move, sprite, scale: sprite.scale.x };
    });
    for (const sprite of previous) if (!kept.has(sprite)) sprite.destroy();
    sprites = next;
    const planned = reveal?.order.length ? reveal : undefined;
    const schedule = new Map<number, number>();
    let span = duration;
    if (planned) {
      const entering = falling.filter(move => move.fromRow < 0)
        .sort((a,b) => a.to % columns - b.to % columns || b.to - a.to);
      const expected = entering.filter(move => board[move.to] === 'scatter').map(move => move.to);
      if (expected.join(',') !== planned.order.join(',')) throw Error('Scatter arrival order disagrees with receipt');
      let delay = 0, count = planned.alreadyLanded;
      for (const {to} of entering) {
        schedule.set(to, delay);
        if (board[to] === 'scatter') count++;
        delay += count >= 2 ? 26 : 9;
      }
      span = Math.max(duration, 165 + (schedule.get(entering.at(-1)!.to) ?? 0));
    }
    let landed = 0;
    try {
      await phase(opening ? 'drop' : 'refill', span * fallPace() * openingPace, progress => {
      sparks.clear();
      const fullEffects = !compactTouch.matches && document.documentElement.dataset.effects !== 'reduced';
      for (const { to, fromRow, sprite, scale } of falling) {
        const target = rowAt(to);
        if (target === fromRow) continue;
        const delay = opening ? (to % columns) * .021 + (rows - 1 - target) * .011 : fromRow < 0 ? .055 : 0;
        const custom = schedule.get(to);
        const time = custom === undefined ? clamp((progress - delay) / (opening ? .851 : fromRow < 0 ? .945 : 1))
          : clamp((progress * span - custom) / 165);
        const descent = clamp(time / .74);
        const impact = clamp((time - .74) / .26);
        const bounced = Math.abs(Math.sin(impact * Math.PI * 2)) * (1 - impact) ** 2;
        const compression = impact < .35 ? (1 - impact / .35) * .18 : -bounced * .08;
        const stretch = descent < 1 ? Math.sin(descent * Math.PI) * .12 : -compression;
        sprite.y = rowY(fromRow + (target - fromRow) * descent ** 2.3) - bounced * 21;
        const sway = fromRow < 0 ? Math.sin(Math.PI * descent) * (to % 2 ? -5 : 5) : 0;
        sprite.x = xAt(to) + sway;
        sprite.scale.set(scale * (1 - stretch * .55), scale * (1 + stretch));
        sprite.rotation = fromRow < 0 ? Math.sin(descent * Math.PI) * (to % 2 ? -.23 : .23) : 0;
        if (custom !== undefined && board[to] === 'scatter' && time >= .74 && time < 1) {
          sparks.circle(sprite.x,sprite.y,36+impact*22).stroke({color:0xffdb83,alpha:1-impact,width:4});
        }
        if (fullEffects && time >= .74 && time < 1 && fromRow < 0) {
          const glow = (1 - impact) ** 2;
          const color = shardColors[board[to]];
          sparks.ellipse(xAt(to), rowY(target) + 28, 16 + impact * 14, 2 + glow * 2)
            .fill({ color, alpha: glow * .34 });
        }
      }
      while (planned && landed < planned.order.length && progress * span >= schedule.get(planned.order[landed])! + 165 * .74) {
        planned.onLand(planned.order[landed++]);
      }
      });
    } finally { sparks.clear(); }
    publish(board);
  }

  return {
    draw,
    fall(board: readonly BoardSymbol[], moves: readonly BoardMove[], duration: number, reveal?: ScatterReveal) {
      return fall(board, moves, duration, false, reveal);
    },
    drop(board: readonly BoardSymbol[], duration: number, reveal?: ScatterReveal, openingPace = 1) {
      return fall(board, board.map((candy, to) => ({ candy, to, fromRow: rowAt(to) - rows })), duration, true, reveal, openingPace);
    },
    async storm(duration: number, reduced: boolean, impact: () => void, ready: Promise<unknown>) {
      if (!sprites.length) return;
      restoreRestingPositions();
      const old = sprites.map((sprite, index) => ({
        sprite, index, x: sprite.x, y: sprite.y, scale: sprite.scale.x,
        color: shardColors[restingBoard[index]],
      }));
      const compact = compactTouch.matches;
      let completed = false;
      try {
        await phase('storm-charge', duration * .32, progress => {
          const charge = Math.sin(progress * Math.PI / 2);
          sparks.clear();
          for (const { sprite, index, x, y, scale } of old) {
            const wave = Math.sin(index * .92 + progress * 3.2);
            sprite.position.set(x + wave * charge * 4, y - charge * (3 + wave * 3));
            sprite.rotation = wave * charge * .08;
            sprite.scale.set(scale * (1 + charge * .1), scale * (1 - charge * .13));
          }
          if (reduced) return;
          for (let side = 0; side < 4; side++) {
            const vertical = side % 2 === 1;
            const length = vertical ? height : width;
            const edge = side < 2 ? 10 : (vertical ? width : height) - 10;
            for (let segment = 0; segment < 3; segment++) {
              const start = (segment / 3 + .035 + progress * .08) * length;
              const end = start + length * .19;
              const bend = edge + Math.sin(side * 2 + segment + progress * 6) * 13;
              if (vertical) sparks.moveTo(edge, start).quadraticCurveTo(bend, (start + end) / 2, edge, end);
              else sparks.moveTo(start, edge).quadraticCurveTo((start + end) / 2, bend, end, edge);
              sparks.stroke({ color: segment % 2 ? 0xd18aff : 0xffdf9a, width: 2.5, alpha: charge * .76 });
            }
          }
        });
        await ready;
        impact();
        await phase('storm-break', duration * .68, progress => {
          sparks.clear();
          for (const { sprite, index, x, y, scale, color } of old) {
            const release = clamp((progress - (index % columns) * .026) / .85);
            const travel = 1 - (1 - release) ** 2;
            const fade = (1 - release ** 1.7) * Math.min(1, release * 12);
            sprite.scale.set(scale * Math.max(.03, 1 - release * 1.2));
            sprite.rotation = (index % 2 ? 1 : -1) * release * .55;
            sprite.alpha = (1 - release) ** 3;
            if (!release || !fade) continue;
            const outward = Math.atan2(y - height / 2, x - width / 2);
            for (let piece = 0; piece < (reduced ? 2 : compact ? 3 : 6); piece++) {
              const angle = outward + (piece - 2.5) * .68 + index * .27 + travel * 1.75;
              const radius = (20 + (piece * 19 + index * 7) % 86) * travel;
              const px = x + Math.cos(angle) * radius;
              const py = y + Math.sin(angle) * radius + release ** 2 * 20;
              const size = (piece % 3 * 1.4 + 3.6) * fade;
              const hue = piece % 5 === 4 ? 0xffdf91 : color;
              if (!reduced && !compact) {
                sparks.moveTo(px - Math.cos(angle) * 31 * fade, py - Math.sin(angle) * 31 * fade)
                  .lineTo(px, py).stroke({ color: hue, alpha: fade * .48, width: size * .85 });
                sparks.circle(px, py, size * 2.3).fill({ color: hue, alpha: fade * .2 });
              }
              sparks.poly([px, py - size * 1.45, px + size, py, px, py + size, px - size, py])
                .fill({ color: hue, alpha: fade });
              if (!reduced) sparks.circle(px, py, size * .35).fill({ color: 0xfff2d8, alpha: fade * .76 });
            }
          }
        });
        completed = true;
      } finally {
        if (!completed) for (const {sprite,x,y,scale} of old) {
          sprite.position.set(x,y);
          sprite.scale.set(scale);
          sprite.rotation = 0;
          sprite.alpha = 1;
        }
        sparks.clear();
        render();
      }
    },
    async pop(indices: readonly number[], duration: number) {
      restoreRestingPositions();
      const targets = indices.map(index => ({ index, sprite: sprites[index], scale: sprites[index].scale.x }));
      const particleCount = document.documentElement.dataset.effects === 'reduced' ? 3 : compactTouch.matches ? 5 : 8;
      await phase('pop', duration, p => {
        sparks.clear();
        for (const { index, sprite, scale } of targets) {
          const release = clamp((p - .32) / .68);
          sprite.scale.set(scale * (1 + Math.sin(p * Math.PI) * .33 - release * .85));
          sprite.alpha = 1 - release;
          if (p >= 1) continue;
          sparks.circle(sprite.x, sprite.y, 24 + release * 32)
            .stroke({ color: 0xffdd91, width: 2.8 * (1 - release), alpha: .65 * (1 - release) });
          const hue = shardColors[restingBoard[index]];
          const decay = (1 - release) ** 1.4;
          if (!release) continue;
          for (let i = 0; i < particleCount; i++) {
            const theta = (i * Math.PI * 2) / particleCount + index * .14 + release * .24;
            const radius = 12 + (1 - (1 - release) ** 2) * (36 + (i * 11 % 23));
            const x = sprite.x + Math.cos(theta) * radius;
            const y = sprite.y + Math.sin(theta) * radius + release * release * 9;
            const gem = (2.5 + i % 3) * decay;
            sparks.poly([x, y - gem * 1.7, x + gem, y, x, y + gem, x - gem, y])
              .fill({ color: i % 3 === 0 ? 0xffe7ac : hue, alpha: decay });
            if (particleCount === 8) sparks.circle(x, y - gem * .45, gem * .38)
              .fill({ color: 0xfff5df, alpha: decay * .72 });
          }
        }
      });
      sparks.clear();
      render();
    },
    async transform(board: readonly BoardSymbol[], changed: readonly number[], duration: number) {
      restoreRestingPositions();
      const old = changed.map(index => ({ sprite: sprites[index], scale: sprites[index].scale.x }));
      await phase('anticipation', duration * .45, p => old.forEach(({ sprite, scale }) => {
        sprite.scale.x = scale * Math.max(.04, 1 - p);
        sprite.tint = 0xe4a5ff;
      }));
      const replacements = changed.map(index => {
        sprites[index].destroy();
        const sprite = create(board[index], index);
        sprites[index] = sprite;
        return { sprite, scale: sprite.scale.x };
      });
      await phase('transform', duration * .55, p => replacements.forEach(({ sprite, scale }) => {
        sprite.scale.x = scale * Math.max(.04, p);
        sprite.rotation = (1 - p) * .4;
      }));
      publish(board);
    },
  };
}


