
import { conceptArt as art } from './art';
import { mountBoard } from './board';
import { mountMascot } from './mascot';
import { createMotion } from './motion';
import { scatterColumns, scatterFixtures, type ScatterOutcome } from './scatter-presentation';
import type { createSound } from './sound';

const titles = { regular: 'Bush Bash', super: 'Outback Frenzy', epic: 'Koala Mayhem' };

export function mountScatterDemo(audio: ReturnType<typeof createSound>, utility: HTMLDialogElement,
  atlas: string, rate: () => number, onSuspense: () => void) {
  const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const dialog = get<HTMLDialogElement>('scatter-demo');
  const host = get('fixture-board');
  const stage = get('fixture-stage');
  const curtains = get('fixture-curtains');
  const marks = get('fixture-marks');
  const result = get('fixture-result');
  const heading = get('fixture-heading');
  const buttons = [...dialog.querySelectorAll<HTMLButtonElement>('[data-fixture-count],#fixture-auto,#fixture-close')];
  const turbo = get<HTMLInputElement>('fixture-turbo');
  const back = get<HTMLButtonElement>('fixture-continue');
  const clock = createMotion(() => rate() ? turbo.checked ? 2.5 : rate() : 0);
  const pose = mountMascot(get<HTMLCanvasElement>('fixture-mochi'), clock.tween, atlas);
  let board: ReturnType<typeof mountBoard> | undefined;
  let running = false;

  function update(message: string) { heading.textContent = message; }
  function lock(value: boolean) {
    buttons.forEach(button => { button.disabled = value; });
    turbo.disabled = value;
  }

  async function present(outcome: ScatterOutcome) {
    const columns = scatterColumns(outcome);
    audio.setScene('base');
    await clock.visible();
    result.hidden = true;
    back.hidden = true;
    stage.dataset.phase = 'falling';
    stage.dataset.landed = '0';
    delete stage.dataset.tier;
    update('Revealing the selected fixture');
    pose('ready');
    marks.replaceChildren();
    curtains.replaceChildren();
    const covers = columns.map(() => {
      const shield = document.createElement('i');
      curtains.append(shield);
      return shield;
    });
    (await (board ??= mountBoard(host, clock.tween))).draw(outcome.candies);
    let landed = 0;
    try {
      for (const { column, scatterCells } of columns) {
        await clock.tween(landed >= 2 ? 435 : 142, progress => {
          const cover = covers[column];
          cover.style.transform = 'translateY(' + (-100 * progress ** 1.72) + '%)';
          cover.style.opacity = String(1 - progress ** 2);
        });
        for (const cell of scatterCells) {
          const image = new Image();
          image.src = art('scatter');
          image.alt = '';
          image.className = 'fixture-scatter';
          image.style.setProperty('--col', String(column));
          image.style.setProperty('--row', String(Math.floor(cell / 6)));
          marks.append(image);
          let impacted = false;
          await clock.tween(255, progress => {
            const contact = .72;
            const descent = Math.min(progress / contact, 1);
            const rebound = progress < contact ? 0 : Math.sin(Math.PI * (progress - contact) / (1 - contact));
            image.style.transform = 'translateY(' + (-100 * (1 - descent ** 2) - 9 * rebound) + '%)';
            image.style.opacity = String(Math.min(1, progress * 5));
            if (progress < contact || impacted) return;
            impacted = true;
            landed++;
            stage.dataset.landed = String(landed);
            update(landed + (landed === 1 ? ' scatter landed' : ' scatters landed'));
            if (!clock.instant) audio.cue('scatter-impact', landed - 1);
            if (landed === 1) pose('ready');
            if (landed === 2) {
              stage.dataset.phase = 'suspense';
              pose('watch');
              onSuspense();
              if (!clock.instant) audio.setSuspense(true);
            }
          });
        }
      }
      await clock.wait(275);
    } finally {
      audio.setSuspense(false);
    }
    stage.dataset.phase = 'settled';
    stage.dataset.tier = outcome.bonus ?? 'none';
    update(landed + (landed === 1 ? ' scatter' : ' scatters') + ' · ' + (outcome.bonus ? titles[outcome.bonus] : 'No bonus'));
    if (outcome.bonus) {
      result.dataset.tier = outcome.bonus;
      result.style.setProperty('--fixture-world', 'url("' + art(outcome.bonus) + '")');
      result.querySelector('strong')!.textContent = titles[outcome.bonus];
      result.hidden = false;
      audio.setScene(outcome.bonus);
      audio.cue(outcome.bonus);
      pose('bonus');
      await clock.wait(950);
    } else {
      pose(landed === 2 ? 'reset' : 'idle');
    }
  }

  async function run(counts: readonly number[]) {
    if (running) return;
    running = true;
    lock(true);
    try {
      for (const count of counts) {
        await present(scatterFixtures[count]);
        if (counts.length > 1) await clock.wait(460);
      }
      back.hidden = result.hidden;
      if (!back.hidden) back.focus();
    } catch (error) {
      console.error(error);
      update('The scatter preview could not play.');
      board = undefined;
    } finally {
      audio.setSuspense(false);
      running = false;
      lock(false);
    }
  }

  get('scatter-demo-open').addEventListener('click', () => {
    utility.close();
    audio.prepareCinematics();
    dialog.showModal();
    pose('idle');
  });
  get('fixture-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { if (running) event.preventDefault(); });
  dialog.addEventListener('close', () => {
    audio.setSuspense(false);
    audio.setScene('base');
    result.hidden = true;
    back.hidden = true;
    stage.dataset.phase = 'ready';
    delete stage.dataset.tier;
    marks.replaceChildren();
    update('Select a predetermined outcome');
  });
  back.addEventListener('click', () => {
    result.hidden = true;
    back.hidden = true;
    audio.setScene('base');
    pose('idle');
    get('fixture-close').focus();
  });
  for (const button of buttons) {
    if (button.dataset.fixtureCount !== undefined) {
      button.addEventListener('click', () => void run([Number(button.dataset.fixtureCount)]));
    }
  }
  get('fixture-auto').addEventListener('click', () => void run([0, 1, 2, 3, 4, 5]));
}

