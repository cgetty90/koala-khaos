import { modeNames } from './theme';
import { conceptArt, presentationCandyNames } from './art';
import { candies, columns, refill, seededRandom, type Candy } from './game';
import { bands, basis, bonusModes, freeSpins, math, mysteryWeights, naturalOdds, payPoints, type Mode } from './math';

const fmt = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sprite = (candy: Candy) => '<img src="' + import.meta.env.BASE_URL + 'art/outback/' + candy + '.webp" alt="" width="36" height="36">';
const illustration = (name: string, className = '') =>
  '<img class="' + className + '" src="' + conceptArt(name) + '" alt="">';

function paytable(mode: Mode) {
  return '<table><caption>' + modeNames[mode] + ' payouts in multiples of the base bet</caption><thead><tr><th scope="col">Symbol</th>' +
    bands.map((min, i) => '<th scope="col">' + min + (bands[i + 1] ? '–' + (bands[i + 1] - 1) : '+') + '</th>').join('') +
    '</tr></thead><tbody>' + candies.map(candy =>
      '<tr><th scope="row"><span class="guide-symbol">' + sprite(candy) + presentationCandyNames[candy] + '</span></th>' +
      bands.map((_, i) => '<td>×' + fmt.format(payPoints(candy, i, mode) / basis) + '</td>').join('') + '</tr>').join('') +
    '</tbody></table>';
}

function tumbleExample() {
  const winners = new Set([0, 3, 8, 11, 12, 16, 25, 28]);
  const others = candies.slice(1);
  const board = Array.from({ length: 30 }, (_, i) => winners.has(i) ? 'berry' as const : others[i % others.length]);
  const filled = refill(board, winners, seededRandom(17)).board;
  const stages = [
    { name: 'Match eight', desc: 'The gold outlines show eight matching symbols anywhere on the board.', items: board, marked: true },
    { name: 'Pop the winners', desc: 'Every matching symbol in the winning group disappears together.', items: board.map((candy, i) => winners.has(i) ? null : candy), marked: false },
    { name: 'Fall and refill', desc: 'Survivors drop down their own columns. New symbols arrive from above, then the full board is checked again.', items: filled, marked: false },
  ];
  return '<div class="guide-cards">' + stages.map(stage => '<figure class="guide-card"><div class="guide-board" aria-hidden="true" style="--columns:' + columns + '">' +
    stage.items.map((candy, i) => '<span' + (stage.marked && winners.has(i) ? ' class="matched"' : '') + '>' + (candy ? sprite(candy) : '') + '</span>').join('') +
    '</div><figcaption><strong>' + stage.name + '</strong><p>' + stage.desc + '</p></figcaption></figure>').join('') + '</div>';
}

export function mountGameGuide(dialog: HTMLDialogElement, stake: () => number, openShop: () => void) {
  const nav = Array.from(dialog.querySelectorAll<HTMLButtonElement>('[data-guide]'));
  const view = dialog.querySelector<HTMLElement>('#guide-page')!;
  const settings = dialog.querySelector<HTMLElement>('#guide-settings')!;
  const scroller = dialog.querySelector<HTMLElement>('.guide-content')!;
  const modes = ['base', ...bonusModes] as const;
  const pages: Record<string, () => string> = {
    play: () => '<h3>How to Play</h3><p>Match at least eight identical symbols anywhere on the 6×5 grid. They can be in separate rows or columns.</p>' +
      tumbleExample() + '<p>This illustration is an example. A live spin keeps tumbling until no matching group wins.</p>',
    pay: () => '<h3>Paytable</h3><label class="guide-mode">Game mode <select aria-label="Paytable mode">' +
      modes.map(mode => '<option value="' + mode + '">' + modeNames[mode] + '</option>').join('') +
      '</select></label><div id="paytable" class="paytable">' + paytable('base') + '</div><p>These are nominal symbol awards before Gumleaves and caps. Paid round entitlement settles on a 0.10× Base Bet grid, up to 6,000× Base Bet including the opening and feature.</p>',
    bonus: () => '<h3>Bonus Features</h3><div class="guide-illustration">' + illustration('scatter') +
      '<p>BONUS symbols can replace symbols on the opening drop or during a refill. Two scatters slow the remaining arrivals in that drop. The spin can still end without a bonus. Three trigger Bush Bash, four trigger Outback Frenzy, and five trigger Koala Mayhem.</p></div>' +
      '<div class="guide-cards">' + bonusModes.map((mode, i) =>
        '<article class="guide-card">' + illustration(mode, 'guide-world') + '<h4>' + modeNames[mode] + '</h4><p>Natural chance ' +
        (naturalOdds[i] / 10_000).toFixed(3) + '% per base spin.</p><p>Feature cap ×' + math[mode].sessionCap.toLocaleString('en') + ' base bet.</p></article>').join('') +
      '</div><p>Watch the introduction, then select Continue to play all ' + freeSpins + ' free spins automatically. Purchased bonuses use a separate reveal and award no base-game win.</p>',
    leaf: () => '<h3>Golden Gumleaf Multipliers</h3><div class="guide-illustration">' + illustration('gumleaf') +
      '<p>Collected leaves add together, then multiply the symbol win. A spin with no applicable leaves uses ×1. The spotlight pauses the tumble briefly when a genuine leaf arrives.</p></div>' +
      '<dl class="guide-leaves">' + modes.map(mode => '<div><dt>' + modeNames[mode] + '</dt><dd>' +
        math[mode].values.map(value => '×' + value).join(' · ') + '<br>' +
        (mode === 'epic' ? 'Accumulates across all ten free spins.' : 'Resets on every spin.') + '</dd></div>').join('') + '</dl>',
    ante: () => '<h3>Gumleaf Ante ×3</h3><div class="guide-illustration">' + illustration('gumleaf') +
      '<p>Ante charges three times the Base Bet. Natural bonus entry rises from 0.446% to 2.230%. Your Base Bet is ' +
      fmt.format(stake() / 100) + ' fictional credits. The live Total Bet shows the exact charge before you spin.</p></div>',
    buy: () => '<h3>Buy Bonus</h3><div class="guide-cards">' +
      (['regular', 'super', 'mystery'] as const).map(mode => '<article class="guide-card">' +
        illustration(mode === 'mystery' ? 'scatter' : mode, 'guide-world') + '<h4>' + (mode === 'mystery' ? 'Mystery Bonus' : modeNames[mode]) +
        '</h4></article>').join('') +
      '</div><p>Mystery selects ' + bonusModes.map((mode, i) => modeNames[mode] + ' ' + mysteryWeights[i] + '%').join(', ') +
      '. Mystery Super and Epic use different award distributions from Super Buy and natural Epic. Each feature still plays ten spins. Koala Mayhem has no direct purchase.</p><button type="button" data-guide-shop class="primary">Open bonus shop</button>',
    info: () => '<h3>Game Information</h3><div class="guide-illustration">' + illustration('mochi-idle') +
      '<p>Koala Khaos is a hobby demo. Credits are fictional and non-redeemable. Visit Free practice in Settings to try a bonus or see a scatter demonstration.</p></div>',
  };
  dialog.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-guide]');
    if (button) select(button.dataset.guide!);
    if ((event.target as HTMLElement).closest('[data-guide-shop]')) openShop();
  });
  view.addEventListener('change', event => {
    const selected = event.target as HTMLSelectElement;
    view.querySelector('#paytable')!.innerHTML = paytable(selected.value as Mode);
  });
  function select(key: string) {
    for (const button of nav) button.setAttribute('aria-pressed', String(key === button.dataset.guide));
    settings.hidden = key !== 'settings';
    view.hidden = key === 'settings';
    if (key !== 'settings') view.innerHTML = pages[key]();
    scroller.scrollTop = 0;
  }
  return select;
}
