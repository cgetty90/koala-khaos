import { accept, complete, currentBalance, pending, splitReceipt, type PaidMode, type RecordedSpin, type Presentation } from './catalogue-client';
import './style.css';
import './stage.css';
import './concept.css';
import './production.css';
import './control-deck.css';
import './cabinet-v16.css';
import './game-guide.css';
import { mountGameGuide } from './game-guide';
import { loadPreferences, storePreferences } from './preferences';
import { planGumleafSpotlight } from './gumleaf-spotlight';
import './jungle-v12.css';
import { mountWaterfall } from './waterfall';
import { createKartIntro } from './kart-intro';
import './scatter-demo.css';
import './cinematic-v23.css';
import './interface-polish.css';
import './fullscreen-cinema.css';
import './jungle-finish.css';
import './identity-v25.css';
import './bonus-v26.css';
import './responsive-v27.css';
import './visual-v32.css';
import './visual-v33.css';
import './visual-v34.css';
import { mountLivingWorld } from './living-world-v32';
import { mountScatterDemo } from './scatter-demo';
import { conceptArt as art, presentationCandyNames as candyNames } from './art';
import { mountMascot } from './mascot';
import { mountPresentation } from './presentation';
import { createMotion } from './motion';
import { createSound, defaultMusic, defaultSfx } from './sound';
import { mountBoard } from './board';
import { revealPurchaseScatters } from './scatter-reveal';
import { candies, finishFreeSpin, makeBoard, newBonus, seededRandom, spinPayout, startSpin, tumble, type Bonus } from './game';
import { basis, bonusModes, freeSpins, math, maximumStake, modeNames, mysteryWeights, prices, purchaseCost, settleBonusAward, settleCredits, stakeStep, stakes, startingBalance, type BonusMode, type Purchase } from './math';

const get = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const host = get('board');

const game = document.querySelector<HTMLElement>('.game')!;
const spin = get<HTMLButtonElement>('drop');
const buy = get<HTMLButtonElement>('bonus');
const speed = get<HTMLSelectElement>('speed');
const sound = get<HTMLInputElement>('sound');
const stakeSelect = get<HTMLSelectElement>('stake');
const stakeDown = get<HTMLButtonElement>('stake-down');
const stakeUp = get<HTMLButtonElement>('stake-up');
const total = get<HTMLOutputElement>('credits');
const spinWin = get<HTMLOutputElement>('spin-win');
const lastCounterKey = 'koala-candidate.last-spin-credit';
const status = get('status');
const burst = get('burst');
const history = get('history');
const track = get('bonus-track');
const remaining = get('bonus-remaining');
const bonusTotal = get('bonus-total');
const progression = document.querySelector('.progression')!;
const shop = get<HTMLDialogElement>('shop');
const feature = get<HTMLDialogElement>('feature-dialog');
const autoButton = get<HTMLButtonElement>('autoplay');
const autoDialog = get<HTMLDialogElement>('auto-dialog');
const utility = get<HTMLDialogElement>('utility');
const autoStop = get<HTMLButtonElement>('auto-stop');
const autoStopModal = get<HTMLButtonElement>('auto-stop-modal');
const autoTrack = get('auto-track');

interface AutoRun {
  remaining: number;
  stopped: boolean;
  turbo: boolean;
  stopOnBonus: boolean;
}
let auto: AutoRun | undefined;

function renderAuto() {
  autoTrack.hidden = !auto;
  autoStop.hidden = !auto;
  autoStopModal.hidden = !auto;
  autoStop.disabled = autoStopModal.disabled = Boolean(auto?.stopped);
  get('auto-remaining').textContent = auto?.stopped ? 'Stopping…' : (auto?.remaining ?? 0) + ' auto spins left';
}
function stopAuto() {
  if (!auto) return;
  auto.stopped = true;
  if (feature.open && feature.dataset.stage === 'summary') feature.close();
  renderAuto();
}
autoStop.addEventListener('click', stopAuto);
autoStopModal.addEventListener('click', stopAuto);
get('utility-open').addEventListener('click', () => { if (!busy) { selectGuide('settings'); utility.showModal(); } });
autoButton.addEventListener('click', () => {
  if (!busy && !feature.open && !shop.open && !utility.open) autoDialog.showModal();
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-close]')) {
  button.addEventListener('click', () => button.closest('dialog')?.close());
}
const qa = [...document.querySelectorAll<HTMLButtonElement>('[data-qa]')];
const formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const creditFormat = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (cents: number) => creditFormat.format(cents / 100);
const fresh = () => seededRandom(crypto.getRandomValues(new Uint32Array(1))[0]);
const seed = new URLSearchParams(location.search).get('seed');
const replay = seed !== null && /^\d+$/.test(seed) ? seededRandom(Number(seed)) : undefined;
const random = () => replay ?? fresh();
const stake = () => Number(stakeSelect.value);
const selectGuide = mountGameGuide(utility, stake, () => { utility.close(); buy.click(); });

type Source = 'natural' | 'purchase' | 'mystery' | 'practice';
interface Session { board: Bonus; stake: number; source: Source }
let session: Session | undefined;
let balance = startingBalance;
const anteKey = 'koala-candidate.ante-confirmed.v21';
let ante = sessionStorage.getItem(anteKey) === 'true';
const chargedStake = () => stake() * (ante ? 3 : 1);
let busy = true;
let purchaseReveal = false;
let awaitingReceipt = false;
let skipCooldownUntil = 0;
const settlementRetry = get<HTMLButtonElement>('settlement-retry');
const mascot = get<HTMLCanvasElement>('mascot');
const cinematicMochi = get<HTMLCanvasElement>('cinematic-mochi');
const featureAction = get<HTMLButtonElement>('feature-action');
const continueButton = get<HTMLButtonElement>('feature-continue');
const fastForward = get<HTMLButtonElement>('fast-forward');
const celebration = get<HTMLDialogElement>('celebration');
const motion = createMotion(() => (reducedMotion.matches ? 0 : Number(speed.value)) * (auto?.turbo ? 2.5 : 1), refreshSpinButton);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const introClock = createMotion(() => Number(speed.value) && !reducedMotion.matches ? 1 : 0);
const audioStatus = get('audio-status');
const audio = createSound(({ status: state, scene }) => {
  audioStatus.dataset.state = state;
  audioStatus.dataset.scene = scene;
  const labels = {
    off: 'Sound off', paused: 'Audio paused while this tab is hidden',
    loading: 'Loading ' + modeNames[scene] + ' music',
    playing: 'Playing ' + modeNames[scene] + ' music',
    unavailable: 'Music unavailable on this device',
  };
  audioStatus.textContent = labels[state];
});
function cue(name: Parameters<typeof audio.cue>[0]) {
  if (!motion.instant) audio.cue(name);
}
const tracks = {
  regular: 'Leaf values from ×2 to ×15. Your multiplier resets after each spin.',
  super: 'Bigger leaves from ×5 to ×100. Your multiplier resets after each spin.',
  epic: 'Golden Gumleaves build a multiplier that stays with you for all ten spins.',
};

const atlas = import.meta.env.BASE_URL + 'art/v33/mochi-poses.webp';
const pose = mountMascot(mascot, introClock.tween, atlas);
const cinematicPose = mountMascot(cinematicMochi, introClock.tween, atlas);
const winPose = mountMascot(get<HTMLCanvasElement>('win-mochi'), introClock.tween, atlas);
const welcome = get<HTMLDialogElement>('welcome');
mountMascot(get<HTMLCanvasElement>('welcome-mochi'), introClock.tween, atlas);
mountWaterfall(get<HTMLCanvasElement>('welcome-water'), welcome);
const gumleafValue = get('gumleaf-value');
const effects = get<HTMLInputElement>('reduced-effects');
const reducedEffects = () => effects.checked || reducedMotion.matches;
effects.addEventListener('change', () => {
  document.documentElement.dataset.effects = effects.checked ? 'reduced' : 'full';
});
const kartIntro = createKartIntro(get<HTMLCanvasElement>('kart-canvas'), introClock, audio, reducedEffects);
const brightenFalls = mountWaterfall(get<HTMLCanvasElement>('waterfall-field'));
const stageSignal = mountPresentation(get('scenery-light'), get('gumleaf-relic'),
  () => motion.instant || reducedEffects());
function signal(event: Parameters<typeof stageSignal>[0]) {
  stageSignal(event);
  if (!motion.instant && !reducedEffects() && (event === 'scatter' || event === 'gumleaf' || event === 'win')) brightenFalls();
}
function setLeaf(value: number, reset = false) {
  const next = '×' + value;
  if (reset && gumleafValue.textContent !== next) signal('reset');
  gumleafValue.textContent = next;
}

const preferences = loadPreferences();
speed.value = preferences.speed ?? '0.65';
sound.checked = preferences.sound ?? true;
const deckSound = get<HTMLButtonElement>('deck-sound');
const deckSpeed = get<HTMLButtonElement>('deck-speed');
const anteDialog = get<HTMLDialogElement>('ante-dialog');
const anteOpen = get<HTMLButtonElement>('ante-open');
get('ante-confirm').addEventListener('click', () => { if (!busy) { ante = !ante; sessionStorage.setItem(anteKey, String(ante)); anteDialog.close(); refreshControls(); } });
const spotlight = get('leaf-spotlight');
const staticSpotlight = createMotion(() => 1);
let audioUnlocked = false;

function syncMotion() {
  document.documentElement.dataset.motion = reducedMotion.matches || speed.value === '0' ? 'instant' : 'animated';
  const label = speed.selectedOptions[0].textContent;
  get('deck-speed-label').textContent = label;
  deckSpeed.dataset.speed = speed.value;
  deckSpeed.setAttribute('aria-label', 'Change spin speed. Current speed: ' + label);
}
reducedMotion.addEventListener('change', syncMotion);
function syncSound() {
  deckSound.setAttribute('aria-pressed', String(sound.checked));
  get('deck-sound-label').textContent = sound.checked ? 'On' : 'Off';
  if (!audioUnlocked) {
    audioStatus.dataset.state = sound.checked ? 'locked' : 'off';
    audioStatus.textContent = sound.checked ? 'Sound on · waiting for an interaction' : 'Sound off';
  }
}
function activateSound() {
  audioUnlocked = true;
  audio.setEnabled(sound.checked);
}
document.addEventListener('click', event => {
  if (!event.isTrusted || audioUnlocked || !sound.checked ||
      (event.target instanceof Element && event.target.closest('#deck-sound,#sound,label[for="sound"]'))) return;
  activateSound();
}, true);
document.addEventListener('click', event => {
  if (!event.isTrusted || !(event.target instanceof Element)) return;
  const button = event.target.closest('button');
  if (!button || button.disabled || button.matches('#deck-sound,#drop,#confirm-buy,[data-qa]')) return;
  audio.cue('ui');
}, true);
function changeSound() {
  preferences.sound = sound.checked;
  storePreferences(preferences);
  syncSound();
  activateSound();
}
sound.addEventListener('change', changeSound);
deckSound.addEventListener('click', () => {
  sound.checked = !sound.checked;
  changeSound();
});
speed.addEventListener('change', () => {
  preferences.speed = speed.value;
  storePreferences(preferences);
  syncMotion();
});
deckSpeed.addEventListener('click', () => {
  if (busy || utility.open) return;
  speed.selectedIndex = (speed.selectedIndex + 1) % speed.options.length;
  speed.dispatchEvent(new Event('change'));
  get('speed-announcement').textContent = 'Animation speed: ' + speed.selectedOptions[0].textContent;
  if (!reducedEffects() && !motion.instant) {
    deckSpeed.getAnimations().forEach(animation => animation.cancel());
    deckSpeed.animate([{ filter:'brightness(1.44)' }, { filter:'brightness(1)' }], { duration:370 });
  }
});
anteOpen.addEventListener('click', () => { if (!busy && !anteDialog.open) anteDialog.showModal(); });
anteDialog.addEventListener('close', () => anteOpen.focus());
function bindVolume(id: string, field: 'music' | 'sfx', initial: number, setVolume: (value: number) => void) {
  const input = get<HTMLInputElement>(id);
  const output = get<HTMLOutputElement>(id + '-value');
  const preferred = preferences[field] ?? initial;
  input.value = String(Math.round(preferred * 100));
  output.value = input.value + '%';
  setVolume(preferred);
  input.addEventListener('input', () => {
    const volume = Number(input.value) / 100;
    output.value = input.value + '%';
    preferences[field] = volume;
    storePreferences(preferences);
    setVolume(volume);
  });
}
bindVolume('music-volume', 'music', defaultMusic, audio.setMusicVolume);
bindVolume('sfx-volume', 'sfx', defaultSfx, audio.setSfxVolume);
syncMotion();
syncSound();

const welcomeKey = 'koala-khaos.welcomed.v25';
const enter = get<HTMLButtonElement>('welcome-enter');
let returningFromMenu = false;
function welcomeSeen() {
  try { return localStorage.getItem(welcomeKey) === '1'; }
  catch { return sessionStorage.getItem(welcomeKey) === '1'; }
}
function markWelcomeSeen() {
  try { localStorage.setItem(welcomeKey, '1'); }
  catch { sessionStorage.setItem(welcomeKey, '1'); }
}
for (let index = 0; index < 15; index++) {
  const spark = document.createElement('i');
  spark.style.setProperty('--x', ((index * 31 + 12) % 100) + '%');
  spark.style.setProperty('--y', ((index * 19 + 9) % 88) + '%');
  spark.style.setProperty('--lag', '-' + (index % 7) + 's');
  get('welcome-lights').append(spark);
}
get('welcome-open').addEventListener('click', () => {
  if (busy || welcome.open) return;
  returningFromMenu = true;
  utility.close();
  welcome.showModal();
});
welcome.addEventListener('cancel', event => { event.preventDefault(); });
enter.addEventListener('click', async () => {
  if (enter.disabled || !welcome.open) return;
  enter.disabled = true;
  if (!audioUnlocked) activateSound();
  markWelcomeSeen();
  if (!motion.instant && !reducedEffects()) {
    const exit = welcome.animate([{ opacity:1 }, { opacity:0 }], { duration:240, easing:'ease-in' });
    await exit.finished.catch(() => {});
  }
  welcome.close();
  enter.disabled = false;
  if (returningFromMenu) get('utility-open').focus();
  else if (!spin.disabled) spin.focus();
  returningFromMenu = false;
});
if (!welcomeSeen()) {
  if (pending()) markWelcomeSeen();
  else welcome.showModal();
}

const rays = spotlight.querySelector('i')!;
for (let index = 0; index < 12; index++) {
  const ray = document.createElement('b');
  const angle = index * Math.PI / 6;
  ray.style.setProperty('--sx', String(Math.cos(angle)));
  ray.style.setProperty('--sy', String(Math.sin(angle)));
  rays.append(ray);
}
async function showLeafSpotlight(values: readonly number[]) {
  const reduced = reducedEffects();
  const rate = Number(speed.value);
  const plan = planGumleafSpotlight(values, rate, reduced, Boolean(auto?.turbo));
  if (!plan) return;
  await motion.visible();
  spotlight.dataset.intensity = plan.intensity;
  spotlight.dataset.duration = String(plan.duration);
  spotlight.dataset.static = String(plan.static);
  get('spotlight-value').textContent = plan.text;
  get('leaf-announcement').textContent = 'Golden Gumleaf ' + plan.text;
  spotlight.hidden = false;
  if (!plan.static) signal('gumleaf');
  audio.cue('gumleaf-spotlight', plan.intensity === 'large' ? 2 : plan.intensity === 'medium' ? 1 : 0);
  try {
    if (plan.static) await staticSpotlight.wait(plan.duration);
    else await motion.tween(plan.duration * rate * (auto?.turbo ? 2.5 : 1), p => {
      spotlight.style.setProperty('--spot-progress', String(p));
      spotlight.style.setProperty('--spot-wave', String(Math.sin(Math.PI * p)));
    });
  } finally {
    spotlight.hidden = true;
    get('leaf-announcement').textContent = '';
  }
}

mountScatterDemo(audio, utility, atlas, () => reducedMotion.matches ? 0 : Number(speed.value), () => signal('scatter'));

function skip() {
  if (!busy || purchaseReveal || feature.open || shop.open || autoDialog.open || anteDialog.open || utility.open) return;
  if (!motion.skipCurrent()) return;
  skipCooldownUntil = performance.now() + 320;
  window.setTimeout(refreshSpinButton, 325);
  audio.setSuspense(false);
  audio.silence();
}
host.addEventListener('click', () => { if (!celebration.open) skip(); });
fastForward.addEventListener('click', skip);
document.addEventListener('visibilitychange', refreshSpinButton);
celebration.addEventListener('cancel', event => {
  event.preventDefault();
  skip();
});

const particles = get('win-particles');
for (let i = 0; i < 24; i++) {
  const fleck = document.createElement('i');
  const angle = i * Math.PI / 12;
  fleck.style.setProperty('--dx', String(Math.cos(angle) * (140 + (i % 4) * 26)) + 'px');
  fleck.style.setProperty('--dy', String(Math.sin(angle) * (100 + (i % 3) * 32)) + 'px');
  fleck.style.setProperty('--delay', String((i % 4) * 44) + 'ms');
  particles.append(fleck);
}

let sceneFrame = 0;
document.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || document.hidden || motion.instant) return;
  cancelAnimationFrame(sceneFrame);
  sceneFrame = requestAnimationFrame(() => {
    const root = document.documentElement;
    root.style.setProperty('--scene-x', ((event.clientX / innerWidth - .5) * 18).toFixed(1) + 'px');
    root.style.setProperty('--scene-y', ((event.clientY / innerHeight - .5) * 12).toFixed(1) + 'px');
  });
}, { passive: true });

async function flash(message: string, tone: string) {
  if (motion.instant) return;
  const value = get('burst-value');
  value.hidden = tone !== 'leaf';
  value.textContent = tone === 'leaf' ? '×' + message : '';
  get('burst-label').textContent = tone === 'leaf' ? 'Golden Gumleaf' : message;
  burst.dataset.tone = tone;
  burst.hidden = false;
  await motion.wait(400);
  burst.hidden = true;
}

function writeHistory(message: string) {
  const entry = document.createElement('li');
  entry.textContent = message;
  history.append(entry);
  history.scrollTop = history.scrollHeight;
}
function refreshControls() {
  const selectedStake = stake();
  get<HTMLOutputElement>('total-bet').value = fmt(chargedStake());
  anteOpen.querySelector('b')!.textContent = ante ? 'ON' : 'OFF';
  anteOpen.dataset.enabled = String(ante);
  anteOpen.setAttribute('aria-pressed', String(ante));
  get('ante-availability').textContent = ante ? 'On' : 'Off';
  get('ante-confirm').textContent = ante ? 'Turn Ante off' : 'Confirm Ante · ' + fmt(selectedStake * 3);
  anteDialog.dataset.enabled = String(ante);
  get('ante-heading').textContent = ante ? 'ON · 3× Base Bet' : 'OFF · 1× Base Bet';
  get<HTMLOutputElement>('ante-price').value = fmt(selectedStake * 3);
  get<HTMLOutputElement>('ante-base').value = fmt(selectedStake);
  anteOpen.disabled = busy || awaitingReceipt;
  deckSpeed.disabled = busy || awaitingReceipt;
  total.value = awaitingReceipt ? '—' : fmt(balance);
  settlementRetry.hidden = busy || !awaitingReceipt;
  const locked = busy || awaitingReceipt || feature.open || shop.open;
  refreshSpinButton();
  buy.disabled = locked || Boolean(session);
  autoButton.disabled = buy.disabled || balance < chargedStake();
  get<HTMLButtonElement>('utility-open').disabled = locked;
  stakeSelect.disabled = buy.disabled;
  stakeDown.disabled = stakeSelect.disabled || stake() <= stakeStep;
  stakeUp.disabled = stakeSelect.disabled || stake() >= maximumStake;
  qa.forEach(button => { button.disabled = buy.disabled; });
}
function refreshSpinButton() {
  const blocked = purchaseReveal || feature.open || shop.open || utility.open || anteDialog.open || autoDialog.open;
  const canSkip = busy && !blocked && motion.skippable;
  const ready = !busy && !blocked && !session && !awaitingReceipt &&
    performance.now() >= skipCooldownUntil && balance >= chargedStake();
  spin.dataset.spinState = ready ? 'ready' : canSkip ? 'skip' : busy
    ? motion.skipping ? 'skipping' : 'spinning' : 'disabled';
  spin.disabled = !ready && (!canSkip || celebration.open);
  const label = ready || !busy ? 'Spin' : canSkip || motion.skipping ? 'Skip' : 'Spinning';
  spin.querySelector('.spin-text')!.textContent = label;
  spin.querySelector('.spin-glyph')!.textContent = label === 'Skip' ? '»' : '↻';
  fastForward.disabled = !celebration.open || !canSkip;
  host.dataset.skippable = String(canSkip && !celebration.open);
}

let displayedSession: Session | undefined;
let bonusTarget = 0;
let visibleBonus = 0;
let bonusFrame = 0;
function paintBonus(value: number) {
  visibleBonus = value;
  bonusTotal.textContent = fmt(value);
}
function updateBonusMeter(state: Session, value: number, left: number) {
  const nextRemaining = String(left);
  const animate = displayedSession === state && !motion.instant && !reducedEffects() && !document.hidden;
  if (remaining.textContent !== nextRemaining && animate) {
    remaining.getAnimations().forEach(effect => effect.cancel());
    remaining.animate([{ transform:'translateY(4px)',opacity:.52 },{ transform:'none',opacity:1 }],
      { duration:220,easing:'ease-out' });
  }
  remaining.textContent = nextRemaining;
  if (displayedSession === state && value === bonusTarget) return;
  displayedSession = state;
  bonusTarget = value;
  bonusTotal.dataset.confirmed = String(value);
  cancelAnimationFrame(bonusFrame);
  if (!animate || value <= visibleBonus) { paintBonus(value); return; }
  const from = visibleBonus;
  const started = performance.now();
  bonusTotal.getAnimations().forEach(effect => effect.cancel());
  bonusTotal.animate([{ color:'#fffcea',textShadow:'0 0 15px #ffcb6c' },{ color:'',textShadow:'' }],
    { duration:330,easing:'ease-out' });
  const update = (now: number) => {
    const progress = Math.max(0,Math.min(1,(now-started)/230));
    paintBonus(from + Math.floor((value-from)*(1-(1-progress)**2)));
    if (progress < 1) bonusFrame = requestAnimationFrame(update);
  };
  bonusFrame = requestAnimationFrame(update);
}
function updateBonus(state: Session) {
  const { board, stake: locked, source } = state;
  track.hidden = false;
  game.dataset.mode = board.mode;
  document.body.dataset.world = board.mode;
  get('mode-name').textContent = modeNames[board.mode] + (source === 'practice' ? ' · Practice' : '');
  const left = freeSpins - board.played;
  updateBonusMeter(state, settleCredits(board.total, locked), left);
  [...progression.children].forEach((step, index) => {
    step.classList.toggle('done', index < board.played);
    if (index === board.played) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });
}
async function showIntro(active: Session, presentation?: Presentation) {
  audio.prepareCinematics();
  const { mode } = active.board;
  const mystery = active.source === 'mystery';
  const purchased = active.source === 'purchase' || mystery;
  purchaseReveal = purchased;
  refreshControls();
  await introClock.visible();
  featureAction.hidden = true;
  continueButton.hidden = true;
  continueButton.disabled = true;
  let scatterCount: number | undefined;
  if (purchased) {
    if (presentation?.effect.classification !== 'cinematic-only-purchase' || !presentation.effect.timings) throw Error('Purchase receipt lacks presentation metadata.');
    status.textContent = mystery ? 'Mystery Bonus · Scatters incoming' : 'Bonus purchase · Scatters incoming';
    if (mystery) audio.cue('mystery');
    scatterCount = await revealPurchaseScatters(get('bonus-scatter-layer'), mode, introClock, index => {
      audio.cue('scatter-impact', index);
      signal('scatter');
    }, presentation.effect.landings, presentation.effect.timings);
  }
  feature.dataset.mode = mode;
  feature.dataset.stage = 'reveal';
  feature.style.setProperty('--feature-world', 'url("' + art(mode) + '")');
  get('cinematic-emblem').hidden = false;
  get('feature-title').textContent = modeNames[mode];
  const result = mystery ? 'Mystery revealed ' + modeNames[mode] + '. ' : '';
  const scatters = scatterCount === undefined ? '' : scatterCount + ' cinematic scatters. ';
  get('feature-copy').textContent = result + scatters + '10 free spins. ' + tracks[mode];
  feature.showModal();
  cinematicPose('bonus');
  signal(mode);
  audio.setScene(mode);
  const playedKart = await kartIntro(mode);
  audio.cue(mode);
  await introClock.tween(playedKart ? 430 : mode === 'epic' ? 1580 : 1230, progress => {
    const wave = Math.sin(progress * Math.PI);
    feature.style.setProperty('--charge', String((mode === 'epic' ? .76 : .48) * wave + .22));
    feature.style.setProperty('--zoom', String(1.06 + progress * .07));
    feature.style.setProperty('--ray-angle', String(progress * (mode === 'epic' ? 87 : 46)) + 'deg');
  });

  feature.dataset.stage = 'continue';
  continueButton.disabled = false;
  continueButton.hidden = false;
  continueButton.focus();
  await new Promise<void>(resolve => continueButton.addEventListener('click', () => {
    continueButton.disabled = true;
    resolve();
  }, { once: true }));
  continueButton.hidden = true;
  feature.close();
  await motion.visible();
}
function cinematicAction() {
  if (!feature.open) return undefined;
  const action = feature.dataset.stage === 'continue' ? continueButton
    : feature.dataset.stage === 'summary' ? featureAction : undefined;
  return action && !action.hidden && !action.disabled ? action : undefined;
}
feature.addEventListener('click', event => {
  if (event.target instanceof Element && !event.target.closest('button')) cinematicAction()?.click();
});
feature.addEventListener('keydown', event => {
  if (event.repeat || !['Enter',' '].includes(event.key) ||
      (event.target instanceof Element && event.target.closest('button'))) return;
  const action = cinematicAction();
  if (action) { event.preventDefault(); action.click(); }
});
feature.addEventListener('cancel', event => {
  if (busy) event.preventDefault();
});

feature.addEventListener('close', () => {
  refreshControls();
  if (!busy) {
    track.hidden = true;
    game.dataset.mode = 'base';
    document.body.dataset.world = 'base';
    audio.setScene('base');
  }
  if (!spin.disabled) spin.focus();
});
for (const value of stakes) stakeSelect.add(new Option(fmt(value), String(value)));
for (let i = 1; i <= freeSpins; i++) {
  const step = document.createElement('li');
  step.textContent = String(i);
  progression.append(step);
}
progression.setAttribute('aria-label', 'Free spin progress');
function stakeChanged() {
  status.textContent = balance >= chargedStake()
    ? 'Base Bet ' + fmt(stake()) + ' · Total Bet ' + fmt(chargedStake())
    : 'Your balance is below the Total Bet.';
  refreshControls();
}
stakeSelect.addEventListener('change', stakeChanged);
stakeDown.addEventListener('click', () => {
  stakeSelect.value = String(stake() - stakeStep);
  stakeChanged();
});
stakeUp.addEventListener('click', () => {
  stakeSelect.value = String(stake() + stakeStep);
  stakeChanged();
});

const shopNames = { regular: 'Sugar Rush', super: 'Koala Frenzy', mystery: 'Mystery Bonus' };
const purchases = Object.keys(prices) as Purchase[];
const shopOptions = get('shop-options');
const shopEmblems = { regular:'chest-regular',super:'chest-super',mystery:'chest-closed' } satisfies Record<Purchase,string>;
const confirmation = get('shop-confirmation');
const confirmBuy = get<HTMLButtonElement>('confirm-buy');
const weightSum = mysteryWeights.reduce<number>((a, b) => a + b, 0);
const odds = bonusModes.map((mode, i) =>
  modeNames[mode] + ' ' + formatter.format(mysteryWeights[i] * 100 / weightSum) + '%').join(' · ');
let quote: { purchase: Purchase; stake: number } | undefined;

function resetConfirmation() {
  quote = undefined;
  confirmation.hidden = true;
  shopOptions.hidden = false;
}
get('cancel-buy').addEventListener('click', () => {
  resetConfirmation();
  shopOptions.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
});
shop.addEventListener('close', () => {
  resetConfirmation();
  refreshControls();
});
buy.addEventListener('click', () => {
  if (busy || session || feature.open || shop.open) return;
  resetConfirmation();
  shopOptions.replaceChildren();
  const selectedStake = stake();
  get('shop-status').textContent = 'Balance ' + fmt(balance) + ' · Base Bet ' + fmt(selectedStake);
  for (const purchase of purchases) {
    const option = document.createElement('button');
    const cost = purchaseCost(selectedStake, purchase);
    option.className = 'secondary';
    option.setAttribute('aria-label', shopNames[purchase] + ' · ' + fmt(cost) + ' credits');
    const image = document.createElement('img');
    image.src = import.meta.env.BASE_URL + 'art/cinematic/' + shopEmblems[purchase] + '.webp';
    image.alt = '';
    const label = document.createElement('strong');
    label.textContent = shopNames[purchase];
    const price = document.createElement('span');
    price.textContent = fmt(cost) + ' credits';
    option.dataset.purchase = purchase;
    const multiplier = document.createElement('small');
    multiplier.textContent = prices[purchase] + '× Base Bet';
    option.append(image, label, multiplier, price);
    option.disabled = balance < cost;
    if (option.disabled) {
      const shortage = document.createElement('small');
      shortage.className = 'purchase-shortage';
      shortage.textContent = 'Insufficient credits';
      option.append(shortage);
      option.setAttribute('aria-label', option.getAttribute('aria-label') + ' · Insufficient credits');
    }
    option.addEventListener('click', () => {
      if (busy || session || !shop.open || quote || balance < cost) return;
      quote = { purchase, stake: selectedStake };
      get('confirm-title').textContent = shopNames[purchase];
      get('confirm-price').textContent = fmt(cost) + ' credits';
      get('confirm-balance').textContent = fmt(balance);
      get('confirm-remaining').textContent = fmt(balance - cost);
      get<HTMLImageElement>('confirm-art').src = image.src;
      confirmation.style.setProperty('--purchase-world', 'url("' + art(purchase === 'mystery' ? 'epic' : purchase) + '")');
      const disclosure = get('confirm-odds');
      disclosure.textContent = odds;
      disclosure.hidden = purchase !== 'mystery';
      shopOptions.hidden = true;
      confirmation.hidden = false;
      confirmBuy.disabled = false;
      confirmBuy.focus();
    });
    shopOptions.append(option);
  }
  shop.showModal();
  refreshControls();
});
confirmBuy.addEventListener('click', () => {
  if (busy || session || !shop.open || !quote) return;
  const { purchase, stake: locked } = quote;
  quote = undefined;
  confirmBuy.disabled = true;
  shop.close();
  audio.cue('confirm');
  void runSequence(async () => { await playPaid(purchase, locked); });
});
qa.forEach(button => button.addEventListener('click', () => {
  if (busy || session || feature.open || shop.open) return;
  if (utility.open) utility.close();
  void runSequence(() => playBonus(button.dataset.qa as BonusMode, 'practice', stake()));
}));

let display: Awaited<ReturnType<typeof mountBoard>>;

async function animateWin(payout: number, award: number) {
  const tier = payout >= 100 * basis ? 'epic' : payout >= 25 * basis ? 'mega' : payout >= 10 * basis ? 'big' : undefined;
  if (!tier || motion.instant) return;
  celebration.dataset.tier = tier;
  get('win-title').textContent = tier === 'epic' ? 'Epic Win' : tier === 'mega' ? 'Mega Win' : 'Big Win';
  const counter = get('win-counter');
  counter.textContent = fmt(0);
  const bounds = spin.getBoundingClientRect();
  celebration.style.setProperty('--skip-left', bounds.left + 'px');
  celebration.style.setProperty('--skip-top', bounds.top + 'px');
  celebration.style.setProperty('--skip-size', bounds.width + 'px');
  try {
    celebration.showModal();
    audio.setCinematicDuck(true);
    pose('big');
    winPose(tier);
    signal('win');
    cue(tier === 'epic' ? 'jackpot' : tier);
    await motion.tween(tier === 'epic' ? 2050 : tier === 'mega' ? 1500 : 1080, progress => {
      counter.textContent = fmt(Math.floor(award * (1 - (1 - progress) ** 3)));
    });
  } finally {
    audio.setCinematicDuck(false);
    celebration.close();
    refreshSpinButton();
  }
}

async function playSpin(active?: Session, recorded?: RecordedSpin, openingDuration = 520, openingPace = 1) {
  await motion.visible();
  const locked = active?.stake ?? stake();
  const mode = active?.board.mode ?? 'base';
  const carried = active?.board.leaves ?? 0;
  spinWin.value = '0.00';
  spinWin.dataset.confirmed = '0';
  if (!active) {
    track.hidden = true;
    game.dataset.mode = 'base';
    document.body.dataset.world = 'base';
    audio.setScene('base');
  }
  const rng = recorded ? undefined : random();
  let base = 0, leaves = 0, cascades = 0;
  history.replaceChildren();
  let previousCounter = 0;
  async function updateCounter(tumble: number, kind: 'connection' | 'multiplier') {
    for (const entry of recorded?.credits ?? []) {
      if (entry.tumble !== tumble || entry.kind !== kind || !entry.delta) continue;
      const start = previousCounter;
      previousCounter = entry.total;
      spinWin.dataset.confirmed = String(entry.total);
      spinWin.dispatchEvent(new CustomEvent('spin-credit', { detail: entry }));
      if (!motion.instant && !reducedEffects()) {
        spinWin.getAnimations().forEach(animation => animation.cancel());
        spinWin.animate([{filter:'brightness(1.45)', textShadow:'0 0 16px #ffbb66'},
          {filter:'none'}], {duration:240, easing:'ease-out'});
        const spark = document.createElement('i');
        spark.className = 'spin-win-sparks';
        spark.setAttribute('aria-hidden', 'true');
        const frame = spinWin.parentElement!;
        frame.querySelector('.spin-win-sparks')?.remove();
        frame.append(spark);
        spark.addEventListener('animationend', () => spark.remove(), { once:true });
      }
      await motion.tween(145, progress => {
        spinWin.value = fmt(start + Math.floor(entry.delta * (1 - (1 - progress) ** 2)));
      });
    }
  }
  setLeaf(carried || 1, !carried);
  status.textContent = active ? modeNames[active.board.mode] + ' · Free spin ' + (active.board.played + 1) + ' of ' + freeSpins : 'Spinning…';
  pose('ready');
  audio.prepareCinematics();
  cue('spin');

  const simulated = recorded ? undefined : startSpin(rng!, mode);
  const result = recorded?.opening ?? simulated!;
  let landedScatters = 0;
  delete host.dataset.scatterLanded;
  function scatterReveal(order: readonly number[] | undefined) {
    if (!order?.length) return;
    return { order, alreadyLanded: landedScatters, onLand(cell: number) {
      landedScatters++;
      host.dataset.scatterLanded = String(landedScatters);
      host.dispatchEvent(new CustomEvent('scatter-landed', { detail: { cell, count: landedScatters } }));
      status.textContent = landedScatters + (landedScatters === 1 ? ' scatter landed' : ' scatters landed');
      if (!motion.instant) audio.cue('scatter-impact', landedScatters-1);
      if (landedScatters === 1) pose('curious');
      if (landedScatters >= 2) {
        pose('watch');
        signal('scatter');
        if (!motion.instant && landedScatters === 2) audio.setSuspense(true);
      }
    } };
  }
  try {
    await display.drop(result.initial, openingDuration, scatterReveal(recorded?.opening.scatterLandings), openingPace);
  } finally { if (landedScatters >= 2) audio.setSuspense(false); }
  cue('land');
  signal('land');
  if (result.transformed.length) {
    const target = result.board[result.transformed[0]];
    if (target === 'scatter') throw Error('A scatter cannot be transformed into candy');
    status.textContent = 'Koala Chaos! Mochi made ' + result.transformed.length + ' ' + candyNames[target] + ' candies.';
    writeHistory(status.textContent);
    pose('win');
    cue('chaos');
    await Promise.all([
      display.transform(result.board, result.transformed, 450),
      flash('Koala Chaos!', 'chaos'),
    ]);
  }
  for (const stage of recorded?.tumbles ?? tumble(simulated!.board, rng!, mode)) {
    cascades++;
    base = stage.base;
    leaves = stage.leafSum;
    const groups = 'wins' in stage ? (stage.wins as ReturnType<typeof import('./game').findWins>).map(win => win.indices.length + ' ' + candyNames[win.candy]).join(' + ') : '';
    const tumbleAward = settleCredits(stage.base, locked) - settleCredits(stage.base - ('pay' in stage ? Number(stage.pay) : 0), locked);
    status.textContent = recorded ? 'Tumble ' + cascades : 'Tumble ' + cascades + ' · +' + fmt(tumbleAward) + ' before leaves';
    writeHistory(status.textContent + ' · ' + groups + (stage.leaf ? ' · Gumleaf +' + stage.leaf : ''));
    setLeaf((leaves + carried) || 1);
    const preview = spinPayout(mode, base, leaves + carried, active?.board.total);
    if (!recorded) spinWin.value = fmt(settleBonusAward(active?.board.total ?? 0, preview, locked));
    cue('tumble');
    signal('tumble');
    cue('pop');
    await display.pop(stage.removed, 240);
    await updateCounter(cascades - 1, 'connection');
    if (stage.leaf) {
      await showLeafSpotlight([stage.leaf]);
      cue('collect');
      signal('collect');
      await updateCounter(cascades - 1, 'multiplier');
    }
    try {
      await display.fall(stage.board, stage.moves, 320,
        scatterReveal('scatterLandings' in stage ? stage.scatterLandings : undefined));
    } finally { if (landedScatters >= 2) audio.setSuspense(false); }
    cue('refill');
  }

  await motion.visible();
  const settled = active && !recorded ? finishFreeSpin(active.board, base, leaves) : undefined;
  const payout = recorded ? recorded.award.multiplierHundredths * 100 : settled?.payout ?? spinPayout(mode, base, leaves);
  const award = recorded?.award.credit ?? settleBonusAward(active?.board.total ?? 0, payout, locked);
  if (recorded) {
    balance += award;
    if (active) {
      active.board = { ...active.board, played: active.board.played + 1, total: active.board.total + payout, leaves: mode === 'epic' ? carried + leaves : 0 };
      updateBonus(active);
    }
  } else if (active && settled) {
    active.board = settled.bonus;
    if (active.source !== 'practice') balance += award;
    updateBonus(active);
  } else {
    balance += award - locked;
  }
  total.value = fmt(balance);
  if (!cascades) writeHistory('No group of 8 or more matching candies.');
  spinWin.value = fmt(award);
  spinWin.dataset.confirmed = String(award);
  const lastWin = get<HTMLOutputElement>('last-win');
  lastWin.value = spinWin.value;
  if (recorded) sessionStorage.setItem(lastCounterKey, String(award));
  if (award > 0 && !motion.instant && !reducedEffects()) {
    lastWin.getAnimations().forEach(animation => animation.cancel());
    lastWin.animate([{ color:'#fff0ab', textShadow:'0 0 10px #ffba61' },
      { color:'#c0ffe6',textShadow:'none' }], { duration:640,easing:'ease-out' });
  }
  const summary = active ? modeNames[active.board.mode] + ' · Free spin ' + active.board.played : '';
  const unit = active?.source === 'practice' ? ' practice credits' : ' fake credits';
  const resultLabel = award ? active ? '+' + spinWin.value + unit : 'Candy win' : payout ? 'Win below 0.01 credit' : 'No win';
  status.textContent = summary ? summary + ' · ' + resultLabel : resultLabel;
  if (landedScatters) status.textContent += ' · ' + landedScatters + (landedScatters === 1 ? ' scatter' : ' scatters');
  if (payout > 0 && (payout === math[mode].spinCap * basis || active?.board.total === math[mode].sessionCap * basis)) {
    status.textContent += ' · Payout cap reached';
  }
  await animateWin(payout, award);
  if (motion.instant || payout >= 10 * basis) pose('idle');
  else pose(award ? 'win' : 'reset', true);
  return { trigger: 'trigger' in result ? result.trigger : undefined, locked };
}

async function playBonus(mode: BonusMode, source: Source, locked: number, recorded?: RecordedSpin[], presentation?: Presentation) {
  const active: Session = { board: newBonus(mode), stake: locked, source };
  session = active;
  if (source === 'mystery' || source === 'purchase') track.hidden = true;
  else updateBonus(active);
  if (source !== 'natural') {
    spinWin.value = '0.00';
    setLeaf(1, true);
    status.textContent = modeNames[mode] + ' · 10 free spins';
  } else {
    status.textContent += ' · ' + modeNames[mode] + ' unlocked';
  }
  if (source === 'natural') {
    audio.cue('scatter');
    signal('scatter');
  }
  audio.setCinematicDuck(true);
  try {
    await showIntro(active, presentation);
  } finally { audio.setCinematicDuck(false); }
  purchaseReveal = false;
  refreshControls();
  updateBonus(active);
  while (active.board.played < freeSpins) {
    await motion.nextSpin();
    await playSpin(active, recorded?.[active.board.played]);
    if (active.board.played < freeSpins) await motion.pause(320);
  }
  await motion.visible();
  cancelAnimationFrame(bonusFrame);
  paintBonus(bonusTarget);
  get('feature-title').textContent = modeNames[mode] + ' complete';
  get('feature-copy').textContent = 'Total ' + fmt(settleCredits(active.board.total, locked)) +
    (source === 'practice' ? ' practice credits. Your live balance is unchanged.' : ' fake credits across ten free spins.');
  const resultTotal = settleCredits(active.board.total, locked);
  const resultCounter = get<HTMLOutputElement>('bonus-result');
  resultCounter.value = fmt(0);
  feature.dataset.stage = 'summary';
  audio.cue('summary');
  feature.style.setProperty('--feature-world', 'url("' + art(mode) + '")');
  get('cinematic-emblem').hidden = false;
  cinematicPose('complete');
  feature.showModal();
  await motion.tween(650, progress => {
    resultCounter.value = fmt(Math.floor(resultTotal * (1 - (1 - progress) ** 3)));
  });
  resultCounter.value = fmt(resultTotal);
  featureAction.hidden = false;
  featureAction.focus();
}

async function playPaid(mode: PaidMode, stakeMinor: number) {
  const paidOpening = mode === 'normal' || mode === 'ante';
  const storm = paidOpening && !motion.instant;
  const duration = auto?.turbo ? Number(speed.value) * 2.5 * 145 : 350;
  awaitingReceipt = true;
  total.value = '—';
  status.dataset.phase = 'pending';
  status.textContent = 'Settlement pending · confirming this round…';
  const ready = accept(mode, stakeMinor).then(accepted => {
    const spins = splitReceipt(accepted);
    awaitingReceipt = false;
    delete status.dataset.phase;
    balance = accepted.receipt.balance - accepted.receipt.credit;
    total.value = fmt(balance);
    return { ...accepted, ...spins };
  });
  if (storm) {
    // The old candies can react immediately. The board may only clear
    // once the authoritative receipt arrives and validates.
    void ready.catch(() => {});
    game.dataset.storm = 'active';
    try {
      await motion.stage(() => display.storm(duration * .43, reducedEffects(), () => {
        if (!motion.instant && !reducedEffects()) brightenFalls();
        cue('storm');
      }, ready));
    } finally {
      delete game.dataset.storm;
    }
  }
  const { receipt, presentation, opening, bonus } = await ready;
  const tier = receipt.record.spec.tier;
  if (opening) {
    const quietSpin = !tier && opening.tumbles.length === 0 && opening.award.credit === 0;
    const openingPace = quietSpin && speed.value === '0.65' && !auto?.turbo ? 1.5 : 1;
    await playSpin(undefined, opening, storm ? duration * .57 : 520, openingPace);
  }
  if (tier) await playBonus(tier, opening ? 'natural' : mode === 'mystery' ? 'mystery' : 'purchase', stakeMinor, bonus, presentation);
  if (balance !== receipt.balance) throw Error('Final balance disagrees with receipt.');
  complete();
  return Boolean(tier);
}

async function runSequence(task: () => Promise<void>) {
  if (busy) return;
  busy = true;
  refreshControls();
  try {
    await task();
  } catch (error) {
    console.error(error);
    if (feature.open) feature.close();
    awaitingReceipt = Boolean(pending());
    if (awaitingReceipt) {
      status.dataset.phase = 'pending';
      status.textContent = 'Settlement pending · balance unavailable. Retry this round to confirm.';
      spinWin.value = '—';
      delete spinWin.dataset.confirmed;
      get<HTMLOutputElement>('last-win').value = '—';
    } else {
      status.textContent = 'Playback was interrupted.';
    }
  } finally {
    session = undefined;
    purchaseReveal = false;
    auto = undefined;
    renderAuto();
    busy = false;
    burst.hidden = true;
    if (celebration.open) celebration.close();
    if (mascot.dataset.pose !== 'win' && mascot.dataset.pose !== 'reset') pose('idle');
    refreshControls();
  }
}

async function playAuto(settings: AutoRun) {
  auto = settings;
  renderAuto();
  let reason = 'Autoplay complete.';
  while (!settings.stopped && settings.remaining > 0) {
    if (balance < chargedStake()) {
      reason = 'Autoplay stopped · insufficient fake credits.';
      break;
    }
    await motion.nextSpin();
    if (settings.stopped) break;
    settings.remaining--;
    renderAuto();
    refreshControls();
    const trigger = await playPaid(ante ? 'ante' : 'normal', stake());
    if (trigger) {
      if (settings.stopOnBonus || settings.stopped || !settings.remaining || balance < chargedStake()) {
        if (settings.stopOnBonus) reason = 'Autoplay stopped after the bonus.';
        else if (!settings.stopped && balance < chargedStake()) reason = 'Autoplay stopped · insufficient fake credits.';
        break;
      }
      await motion.pause(1150);
      if (feature.open) feature.close();
      session = undefined;
    purchaseReveal = false;
      refreshControls();
    }
    if (settings.remaining > 0 && !settings.stopped) await motion.pause(145);
  }
  status.textContent = settings.stopped ? 'Autoplay stopped.' : reason;
}
get('auto-start').addEventListener('click', () => {
  if (busy || !autoDialog.open || balance < chargedStake()) return;
  const count = Number(get<HTMLSelectElement>('auto-count').value);
  const turbo = get<HTMLInputElement>('auto-turbo').checked;
  const stopOnBonus = get<HTMLInputElement>('auto-bonus').checked;
  autoDialog.close();
  void runSequence(() => playAuto({ remaining: count, turbo, stopOnBonus, stopped: false }));
});


function resumePendingRound() {
  if (busy || !awaitingReceipt) return;
  const round = pending();
  if (!round) return;
  stakeSelect.value = String(round.stake);
  if (round.mode === 'normal' || round.mode === 'ante') ante = round.mode === 'ante';
  void runSequence(async () => { await playPaid(round.mode, round.stake); });
}

async function start() {
  const fallPace = () => speed.value === '0.65' && !auto?.turbo ? 1.8 : 1;
  const paint = mountBoard(host, motion.tween, true, fallPace).then(board => {
    display = board;
    display.draw(makeBoard(fresh()));
  });
  awaitingReceipt = Boolean(pending());
  const [, restoredBalance] = await Promise.all([paint, awaitingReceipt ? undefined : currentBalance()]);
  if (restoredBalance !== undefined) balance = restoredBalance;
  const gumleaf = new Image();
  gumleaf.fetchPriority = 'low';
  gumleaf.src = art('gumleaf');
  const previous = Number(sessionStorage.getItem(lastCounterKey));
  if (Number.isSafeInteger(previous) && previous >= 0) {
    spinWin.value = fmt(previous);
    spinWin.dataset.confirmed = String(previous);
    get<HTMLOutputElement>('last-win').value = spinWin.value;
  }
  delete status.dataset.phase;
  status.textContent = 'Choose a stake, then spin.';
  busy = false;
  refreshControls();
  settlementRetry.addEventListener('click', resumePendingRound);
  window.addEventListener('online', resumePendingRound);
  resumePendingRound();
  spin.addEventListener('click', () => {
    if (busy) { skip(); return; }
    if (spin.dataset.spinState !== 'ready') return;
    void runSequence(async () => {
      await playPaid(ante ? 'ante' : 'normal', stake());
    });
  });
}
const shell = document.querySelector<HTMLElement>('.shell')!;
new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  const portrait = width < height * 1.18;
  const sidecar = !portrait && (height < 550 || width < 880);
  shell.dataset.layout = portrait ? 'portrait' : 'landscape';
  shell.dataset.size = sidecar ? 'mini' : 'normal';
  shell.dataset.stage = portrait ? 'stacked' : sidecar ? 'sidecar' : 'cabinet';
}).observe(shell);

start().catch(error => {
  console.error(error);
  status.dataset.phase = 'error';
  status.textContent = 'The candy grid could not load. Reload to try again.';
});








void mountLivingWorld().catch(() => { /* The painted world remains available without WebGL. */ });
