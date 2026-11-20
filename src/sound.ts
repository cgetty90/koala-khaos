import {forestCues} from './forest-cues';
import {reelCues} from './reel-cues';
import {CueGate,cuePolicy,type AudioPace} from './audio-policy';
type Scene = 'base' | 'regular' | 'super' | 'epic';
type Timbre = 'sine' | 'triangle' | 'square';
type Note = readonly [frequency: number, target: number, delay: number, duration: number, gain: number, timbre: Timbre];
type Texture = readonly [frequency: number, delay: number, duration: number, gain: number, filter: BiquadFilterType];

const jungleCues = ['spin', 'land', 'storm', 'pop', 'refill', 'scatter-impact', 'gumleaf-spotlight',
  'collect', 'chaos', 'confirm', 'ui', 'kart-driveby', 'kart-portal'];
const jungleSlotSeconds = 1.15;
const jungleDurations = [.32, .19, .49, .25, .23, .66, .78, .40, .52, .23, .13, .68, .97];

const effects: Record<string, { notes: readonly Note[]; textures?: readonly Texture[] }> = {
  ui: { notes: [[260, 145, 0, .085, .045, 'sine']] },
  spin: { notes: [[121, 209, 0, .17, .18, 'triangle'], [320, 660, .045, .23, .045, 'sine']], textures: [[1100, .01, .22, .09, 'bandpass']] },
  land: { notes: [[145, 57, 0, .18, .24, 'sine'], [370, 270, .025, .08, .055, 'triangle']], textures: [[740, 0, .085, .095, 'lowpass']] },
  storm: { notes: [[115, 46, 0, .19, .12, 'sine'], [523, 782, .025, .17, .047, 'triangle'], [1047, 590, .066, .14, .036, 'sine']], textures: [[1550, 0, .19, .078, 'bandpass'], [480, .021, .15, .048, 'lowpass']] },
  tumble: { notes: [[247, 331, 0, .12, .09, 'triangle'], [392, 494, .055, .11, .06, 'sine']] },
  pop: { notes: [[810, 380, 0, .09, .15, 'sine'], [1210, 470, .029, .11, .085, 'triangle']], textures: [[1950, 0, .08, .1, 'bandpass']] },
  refill: { notes: [[659, 440, 0, .10, .065, 'triangle'], [523, 392, .047, .12, .065, 'sine']], textures: [[1450, .05, .15, .063, 'bandpass']] },
  scatter: { notes: [[164, 82, 0, .31, .23, 'sine'], [520, 697, .06, .2, .11, 'triangle'], [1046, 1397, .17, .34, .07, 'sine']] },
  'gumleaf-spotlight': { notes: [[123,61,0,.29,.18,'sine'],[523,523,0,.34,.115,'triangle'],
    [784,784,.026,.36,.086,'sine'],[1319,1324,.068,.27,.046,'sine'],
    [2070,1976,.11,.21,.026,'sine']], textures: [[2800,0,.12,.045,'bandpass']] },
  gumleaf: { notes: [[554, 659, 0, .23, .11, 'triangle'], [831, 1047, .04, .25, .085, 'sine'], [1568, 1760, .15, .25, .045, 'sine']], textures: [[4200, .11, .23, .055, 'highpass']] },
  collect: { notes: [[784, 1047, 0, .14, .105, 'triangle'], [1319, 1568, .055, .25, .063, 'sine']] },
  chaos: { notes: [[156, 310, 0, .28, .19, 'triangle'], [466, 622, .055, .27, .088, 'square'], [933, 788, .17, .25, .07, 'sine']], textures: [[1700, 0, .34, .08, 'bandpass']] },
  confirm: { notes: [[349, 349, 0, .16, .11, 'triangle'], [523, 698, .05, .26, .095, 'sine']] },
  mystery: { notes: [[82, 112, 0, .57, .18, 'triangle'], [124, 154, .15, .55, .12, 'sine'], [187, 208, .37, .39, .095, 'sine']], textures: [[450, 0, .67, .07, 'lowpass']] },
  'scatter-impact': { notes: [[148, 50, 0, .21, .19, 'sine'], [548, 930, .016, .26, .12, 'triangle']], textures: [[910, 0, .16, .12, 'lowpass']] },
  regular: { notes: [[523, 523, 0, .24, .1, 'triangle'], [659, 659, .1, .23, .1, 'triangle'], [784, 784, .2, .35, .13, 'triangle'], [1047, 1047, .34, .42, .08, 'sine']] },
  super: { notes: [[98, 49, 0, .36, .22, 'sine'], [392, 523, .06, .34, .14, 'triangle'], [587, 784, .20, .43, .12, 'triangle'], [1175, 1568, .38, .38, .075, 'sine']], textures: [[1100, .05, .42, .075, 'bandpass']] },
  epic: { notes: [[65, 39, 0, .64, .27, 'sine'], [261, 261, .1, .50, .14, 'triangle'], [392, 392, .2, .54, .12, 'triangle'], [523, 659, .35, .52, .12, 'sine'], [1047, 1319, .47, .50, .07, 'sine']], textures: [[650, .12, .48, .11, 'lowpass']] },
  big: { notes: [[392, 392, 0, .27, .11, 'triangle'], [523, 523, .086, .27, .10, 'triangle'], [659, 659, .17, .29, .10, 'triangle'], [784, 784, .25, .34, .10, 'sine']] },
  mega: { notes: [[98, 53, 0, .34, .21, 'sine'], [392, 392, .04, .35, .13, 'triangle'], [523, 523, .13, .23, .1, 'triangle'], [659, 698, .23, .34, .11, 'triangle'], [1047, 1175, .39, .43, .09, 'sine']], textures: [[3400, .12, .50, .065, 'bandpass']] },
  jackpot: { notes: [[65, 34, 0, .69, .26, 'sine'], [196, 261, .08, .41, .12, 'triangle'], [392, 392, .20, .42, .12, 'triangle'], [523, 523, .34, .46, .13, 'triangle'], [784, 880, .48, .49, .11, 'triangle'], [1175, 1568, .64, .55, .094, 'sine']], textures: [[870, .02, .38, .12, 'lowpass'], [3900, .34, .70, .08, 'bandpass']] },
  'kart-ignition': { notes: [[58,48,0,.23,.118,'triangle'],[64,45,.09,.25,.126,'triangle'],[125,50,.13,.25,.065,'square']], textures: [[385,0,.28,.14,'lowpass']] },
  'kart-wheelspin': { notes: [[610,1110,.02,.37,.063,'triangle']], textures: [[2360,0,.42,.123,'bandpass'],[710,.07,.43,.09,'lowpass']] },
  'kart-driveby': { notes: [[178,64,0,.56,.14,'triangle'],[268,79,.035,.43,.065,'sine']], textures: [[1900,0,.56,.092,'bandpass']] },
  'kart-mount': { notes: [[196,145,0,.16,.13,'triangle'], [397,241,.04,.13,.07,'sine']], textures: [[1650,0,.14,.12,'bandpass']] },
  'kart-rev': { notes: [[46,122,0,.72,.19,'triangle'], [91,237,0,.71,.065,'square'], [74,147,.22,.52,.07,'triangle']], textures: [[750,0,.72,.11,'lowpass']] },
  'kart-tyre': { notes: [[319,766,0,.38,.095,'triangle']], textures: [[3160,0,.37,.125,'bandpass'], [760,.05,.51,.09,'lowpass']] },
  'kart-candy': { notes: [[523,698,0,.31,.105,'triangle'], [783,1046,.11,.37,.085,'sine'], [1046,1396,.19,.29,.071,'sine']], textures: [[3600,0,.21,.11,'highpass']] },
  'kart-thunder': { notes: [[93,34,0,.63,.19,'sine'],[166,71,.03,.52,.085,'triangle']], textures: [[410,0,.65,.15,'lowpass']] },
  'kart-portal': { notes: [[82,52,0,.75,.16,'sine'], [262,531,.07,.65,.09,'triangle'],[392,784,.16,.61,.07,'sine'],[659,1318,.22,.52,.055,'sine']], textures: [[1760,0,.56,.10,'bandpass']] },
  summary: { notes: [[392, 392, 0, .28, .09, 'triangle'], [523, 523, .085, .33, .08, 'triangle'], [659, 659, .17, .37, .083, 'sine'], [784, 784, .26, .47, .068, 'sine']] },
};

export const defaultMusic = .44;
export const defaultSfx = .68;
type AudioState = { status: 'off' | 'paused' | 'loading' | 'playing' | 'unavailable'; scene: Scene };
interface Track { scene: Scene; source: AudioBufferSourceNode; gain: GainNode; started: number; ramp: number }

export function createSound(onState: (state: AudioState) => void = () => {}) {
  let ctx: AudioContext | undefined;
  let kartVoice: { oscillators: OscillatorNode[]; gain: GainNode; pan: StereoPannerNode; filter: BiquadFilterNode } | undefined;
  let master: GainNode | undefined;
  let music: GainNode | undefined;
  let bed: GainNode | undefined;
  let tensionWanted = false;
  let cinematicDucked = false;
  let tensionRevision = 0;
  let tensionVoice: { source: AudioBufferSourceNode; gain: GainNode } | undefined;
  let jungleBuffer: AudioBuffer | undefined;
  let accentBuffer: AudioBuffer | undefined;
  let forestBuffer:AudioBuffer|undefined;
  let pace:AudioPace='normal';
  const gate=new CueGate();
  const variants=new Map<string,number>();
  const priorities=new WeakMap<Set<AudioScheduledSourceNode>,number>();
  let reelBuffer: AudioBuffer | undefined;
  const produced = new Map<string, AudioBuffer>();
  const clips = new Map<string, Promise<AudioBuffer>>();
  let sfx: GainNode | undefined;
  let noise: AudioBuffer | undefined;
  let scene: Scene = 'base';
  let active: Track | undefined;
  let outgoing: Track | undefined;
  let enabled = false;
  let musicVolume = defaultMusic, sfxVolume = defaultSfx;
  let revision = 0;
  let disposed = false;
  const buffers = new Map<Scene, Promise<AudioBuffer>>();
  const voices = new Set<Set<AudioScheduledSourceNode>>();
  const requests = new AbortController();
  const lastCue = new Map<string, number>();

  function report(status: AudioState['status']) {
    onState({ status, scene });
  }
  function stop(node: AudioScheduledSourceNode, at?: number) {
    try { node.stop(at); } catch { /* The source already ended. */ }
  }
  function silence() {
    releaseKartEngine(true);
    for (const group of voices) for (const node of group) stop(node);
    voices.clear();
    lastCue.clear();
    gate.clear();
  }

  async function decodeTrack(url: string, context: AudioContext) {
    const response = await fetch(url, { signal: requests.signal });
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
      throw new Error('Music file unavailable');
    }
    return context.decodeAudioData(await response.arrayBuffer());
  }

  function load(track: Scene, context: AudioContext) {
    let buffer = buffers.get(track);
    if (!buffer) {
      const files: Record<Scene, string> = {base:'jungle-expedition',regular:'jungle-awakening',super:'storm-rising',epic:'thunder-khaos'};
      buffer = decodeTrack(import.meta.env.BASE_URL + 'audio/jungle-v2/' + files[track] + '.ogg', context)
        .catch(error => { if(buffers.get(track)===buffer) buffers.delete(track); throw error; });
      buffers.set(track, buffer);
    }
    return buffer;
  }


  function loadClip(name: string, context: AudioContext) {
    let buffer = clips.get(name);
    if (!buffer) {
      buffer = fetch(import.meta.env.BASE_URL + 'audio/' + (name==='tension'?'forest-tension':name) + '.ogg', { signal: requests.signal })
        .then(response => {
          if (!response.ok) throw new Error('Cinematic audio unavailable');
          return response.arrayBuffer();
        })
        .then(bytes => context.decodeAudioData(bytes))
        .catch(error => { clips.delete(name); throw error; });
      clips.set(name, buffer);
    }
    return buffer;
  }

  function updateMusicDuck() {
    if (!bed || !ctx) return;
    const level = cinematicDucked ? .4 : tensionWanted && scene === 'base' ? .62 : 1;
    bed.gain.setTargetAtTime(level, ctx.currentTime, level === 1 ? .14 : .065);
  }

  function releaseTension() {
    const voice = tensionVoice;
    tensionVoice = undefined;
    if (!ctx || !bed) return;
    const now = ctx.currentTime;
    updateMusicDuck();
    if (voice) {
      voice.gain.gain.setTargetAtTime(0, now, .055);
      stop(voice.source, now + .24);
    }
  }

  async function syncTension() {
    const ticket = ++tensionRevision;
    const context = ctx;
    if (!tensionWanted || !enabled || scene !== 'base') { releaseTension(); return; }
    if (!context || document.hidden || tensionVoice || disposed) return;
    try {
      const buffer = await loadClip('tension', context);
      if (ticket !== tensionRevision || disposed || !enabled || document.hidden || tensionVoice || context.state !== 'running') return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      const now = context.currentTime;
      source.buffer = buffer;
      source.connect(gain).connect(music!);
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(.93, now, .075);
      updateMusicDuck();
      const voice = { source, gain };
      tensionVoice = voice;
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        if (tensionVoice === voice) {
          tensionVoice = undefined;
          updateMusicDuck();
        }
      };
      source.start(now);
    } catch { /* The base bed remains audible if the tension asset cannot load. */ }
  }

  function prepareCinematics() {
    if (!enabled || !ctx || disposed) return;
    void loadClip('forest-effects', ctx).then(buffer => { if (!disposed) forestBuffer = buffer; }).catch(() => {});
    void loadClip('tension', ctx).catch(() => {});
    void loadClip('eucalyptus-reels', ctx).then(buffer=>{if(!disposed)reelBuffer=buffer}).catch(()=>{});
  }

  function setTrack(track: Scene, buffer: AudioBuffer, context: AudioContext) {
    if (active?.scene === track) return;
    const now = context.currentTime;
    if (outgoing) stop(outgoing.source);
    const prior = active;
    const gain = context.createGain();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const ramp = prior ? .92 : .32;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + ramp);
    source.connect(gain).connect(bed!);
    const next = { scene: track, source, gain, started: now, ramp };
    active = next;
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      source.buffer = null;
      if (active === next) active = undefined;
      if (outgoing === next) outgoing = undefined;
    };
    source.start(now);
    if (prior) {
      outgoing = prior;
      prior.gain.gain.cancelScheduledValues(now);
      prior.gain.gain.setValueAtTime(Math.min(1, (now - prior.started) / prior.ramp), now);
      prior.gain.gain.linearRampToValueAtTime(0, now + .92);
      stop(prior.source, now + .94);
    }
  }

  async function reconcile() {
    const id = ++revision;
    const context = ctx, track = scene;
    if (!context || disposed) {
      if (!disposed) report('off');
      return;
    }
    if (!enabled || document.hidden) {
      silence();
      report(enabled ? 'paused' : 'off');
      await context.suspend().catch(() => {});
      return;
    }
    try {
      // When enabled by the switch, resume is called synchronously within the gesture.
      await context.resume();
      if (id !== revision || !enabled || document.hidden || disposed) return;
      if (active?.scene === track) {
        report('playing');
        void syncTension();
        return;
      }
      report('loading');
      const buffer = await load(track, context);
      if (id !== revision || !enabled || document.hidden || disposed) return;
      setTrack(track, buffer, context);
      void syncTension();
      report('playing');
    } catch {
      if (id === revision && !disposed) report('unavailable');
    }
  }

  function setup() {
    // Avoid decoding the full soundtrack at a 96 kHz output-device rate.
    let context: AudioContext;
    try { context = new AudioContext({ sampleRate:48000 }); }
    catch { context = new AudioContext(); }
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 3;
    master = context.createGain();
    music = context.createGain();
    bed = context.createGain();
    const warmth=context.createBiquadFilter(),air=context.createBiquadFilter();
    warmth.type='lowshelf';warmth.frequency.value=160;warmth.gain.value=1.2;
    air.type='highshelf';air.frequency.value=5200;air.gain.value=-1.8;
    bed.connect(warmth).connect(air).connect(music);
    sfx = context.createGain();
    music.gain.value = musicVolume * .72;
    sfx.gain.value = sfxVolume * .75;
    master.gain.value = 1;
    music.connect(master);
    sfx.connect(master);
    master.connect(limiter).connect(context.destination);
    const rate = context.sampleRate;
    noise = context.createBuffer(1, Math.ceil(rate * .8), rate);
    const samples = noise.getChannelData(0);
    let seed = 767_041;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[i] = (seed / 2147483648) - 1;
    }
    ctx = context;
    updateMusicDuck();
  }


  function releaseKartEngine(immediate = false) {
    const running = kartVoice;
    kartVoice = undefined;
    if (!running || !ctx) return;
    const now = ctx.currentTime;
    running.gain.gain.setTargetAtTime(.0001, now, .025);
    for (const oscillator of running.oscillators) stop(oscillator, immediate ? now : now + .14);
  }

  function setKartEngine(drive: { throttle: number; volume: number; pan: number } | null) {
    if (!drive || !enabled || !ctx || !sfx || ctx.state !== 'running' || document.hidden || !sfxVolume) {
      releaseKartEngine();
      return;
    }
    const context = ctx;
    const now = context.currentTime;
    if (!kartVoice) {
      const gain = context.createGain();
      const pan = context.createStereoPanner();
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = .9;
      const oscillators = [context.createOscillator(), context.createOscillator()];
      oscillators[0].type = 'triangle';
      oscillators[1].type = 'sine';
      const harmonics = [context.createGain(), context.createGain()];
      harmonics[0].gain.value = .69;
      harmonics[1].gain.value = .22;
      gain.gain.value = .0001;
      filter.connect(gain).connect(pan).connect(sfx);
      oscillators.forEach((node, i) => {
        node.frequency.value = i ? 78 : 39;
        node.connect(harmonics[i]).connect(filter);
        node.start(now);
      });
      oscillators[0].onended = () => {
        oscillators.forEach(node => node.disconnect());
        harmonics.forEach(node => node.disconnect());
        gain.disconnect(); pan.disconnect(); filter.disconnect();
      };
      kartVoice = { oscillators, gain, pan, filter };
    }
    const engine = kartVoice;
    const pitch = 37 + drive.throttle * 99;
    engine.oscillators[0].frequency.setTargetAtTime(pitch, now, .045);
    engine.oscillators[1].frequency.setTargetAtTime(pitch * 1.98, now, .04);
    engine.gain.gain.setTargetAtTime(drive.volume * (.065 + drive.throttle*.074), now, .07);
    engine.pan.pan.setTargetAtTime(drive.pan, now, .085);
    engine.filter.frequency.setTargetAtTime(119 + drive.throttle*770, now, .055);
  }

  function cue(name: keyof typeof effects, step = 0) {
    if (!ctx || !sfx || !enabled || document.hidden || ctx.state !== 'running' || sfxVolume === 0) return;
    const spec = effects[name]??effects.ui;
    if (!spec) return;
    const selectedReel = name === 'land' || name in reelCues;
    // Never fall back to the disliked legacy reel timbre while loading B.
    if (selectedReel && !reelBuffer) return;
    const context = ctx;
    const now = context.currentTime;
    if(!gate.accept(name,now,pace))return;
    const policy=cuePolicy(name,pace);
    if (voices.size >= 7) {
      const oldest=[...voices].sort((a,b)=>(priorities.get(a)??0)-(priorities.get(b)??0))[0];
      if(oldest&&(priorities.get(oldest)??0)>policy.priority)return;
      if (oldest) {
        for (const node of oldest) stop(node);
        voices.delete(oldest);
      }
    }
    const group = new Set<AudioScheduledSourceNode>();
    voices.add(group);
    priorities.set(group,policy.priority);
    function schedule(node: AudioScheduledSourceNode, delay: number, duration: number, level: number, filter?: BiquadFilterNode, offset?: number, clipLength = duration, masteredEnvelope = false) {
      const start = now + delay;
      const envelope = context.createGain();
      if(masteredEnvelope){
        envelope.gain.setValueAtTime(level,start);
        if(duration < .2){envelope.gain.setValueAtTime(level,start+Math.max(0,duration-.012));envelope.gain.linearRampToValueAtTime(0,start+duration)}
      }else{
        envelope.gain.setValueAtTime(.0001, start);
        envelope.gain.exponentialRampToValueAtTime(level, start + .013);
        envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
      }
      if (filter) node.connect(filter).connect(envelope);
      else node.connect(envelope);
      envelope.connect(sfx!);
      group.add(node);
      node.onended = () => {
        group.delete(node);
        if (group.size === 0) voices.delete(group);
        node.disconnect();
        filter?.disconnect();
        envelope.disconnect();
      };
      if (offset !== undefined) (node as AudioBufferSourceNode).start(start, offset, clipLength);
      else node.start(start);
      stop(node, start + duration + .01);
    }
    const jungleSlot = jungleCues.indexOf(name);
    const sequence=variants.get(name)??0;variants.set(name,sequence+1);
    const key=name==='land'?'land-'+sequence%3:name==='scatter-impact'?'scatter-'+Math.min(2,Math.max(0,step)):name;
    if(selectedReel){
      const sample=reelCues[key],source=context.createBufferSource();source.buffer=reelBuffer!;
      const length=Math.min(sample.duration,policy.maxDuration);
      schedule(source,0,length,.86,undefined,sample.offset,length,name==='reel-settle');
      return;
    }
    const sample=forestCues[key];
    if(forestBuffer&&sample){
      const source=context.createBufferSource();source.buffer=forestBuffer;
      const length=Math.min(sample.duration,policy.maxDuration);
      schedule(source,0,length,name.startsWith('ui')?.7:policy.priority>=3?1:.86,undefined,sample.offset,length);
      return;
    }
    const authoredName:Record<string,string>={big:'win-big',mega:'win-mega',jackpot:'win-epic',regular:'bonus-regular',super:'bonus-super',epic:'bonus-epic',land:'reel-stop'};
    const authored=produced.get(authoredName[name]);
    if(authored){const source=context.createBufferSource();source.buffer=authored;schedule(source,0,authored.duration,.92,undefined,0,authored.duration);return}
    if (jungleBuffer && jungleSlot !== -1) {
      const source = context.createBufferSource();
      source.buffer = jungleBuffer;
      source.playbackRate.value = 1 + Math.min(5, Math.max(0, step)) * .075;
      const length = jungleDurations[jungleSlot];
      schedule(source, 0, length / source.playbackRate.value, name === 'ui' ? .4 : .96,
        undefined, jungleSlot * jungleSlotSeconds, length);
      return;
    }
    const slot = ['regular', 'super', 'epic', 'big', 'mega', 'jackpot'].indexOf(name);
    if (accentBuffer && slot !== -1) {
      const source = context.createBufferSource();
      source.buffer = accentBuffer;
      schedule(source, 0, 2.5, .88, undefined, slot * 2.5);
      return;
    }
    for (const [frequency, target, delay, duration, level, timbre] of spec.notes) {
      const oscillator = context.createOscillator();
      oscillator.type = timbre;
      oscillator.frequency.setValueAtTime(frequency * (1 + step * .095), now + delay);
      oscillator.frequency.exponentialRampToValueAtTime(target * (1 + step * .095), now + delay + duration * .84);
      schedule(oscillator, delay, duration, level);
    }
    for (const [frequency, delay, duration, level, filterType] of spec.textures ?? []) {
      const buffer = context.createBufferSource();
      buffer.buffer = noise!;
      const filter = context.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = frequency;
      schedule(buffer, delay, duration, level, filter);
    }
  }

  const onVisibility = () => { void reconcile(); };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', event => {
    if (event.persisted) {
      silence();
      void ctx?.suspend().catch(() => {});
      return;
    }
    disposed = true;
    revision++;
    document.removeEventListener('visibilitychange', onVisibility);
    requests.abort();
    silence();
    if (active) stop(active.source);
    if (outgoing) stop(outgoing.source);
    buffers.clear();
    clips.clear();
    accentBuffer = undefined;
    forestBuffer=undefined;reelBuffer=undefined;produced.clear();
    jungleBuffer = undefined;
    releaseTension();
    void ctx?.close().catch(() => {});
  });
  window.addEventListener('pageshow', event => { if (event.persisted) void reconcile(); });

  return {
    cue, silence, prepareCinematics, setKartEngine,
    setPace(rate:number){pace=rate===0?'instant':rate<1?'gentle':rate>=2?'turbo':'normal'},
    setSuspense(value: boolean) {
      if (tensionWanted === value) return;
      tensionWanted = value;
      updateMusicDuck();
      void syncTension();
    },
    setCinematicDuck(value: boolean) {
      cinematicDucked = value;
      updateMusicDuck();
    },
    setEnabled(value: boolean) {
      enabled = value;
      if (!enabled) { tensionRevision++; releaseTension(); }
      try {
        if (enabled && !ctx) {
          setup();
          void loadClip('forest-effects', ctx!).then(buffer => {
            if (!disposed) forestBuffer = buffer;
          }).catch(() => {});
          void loadClip('eucalyptus-reels',ctx!).then(buffer=>{if(!disposed)reelBuffer=buffer}).catch(()=>{});
        }
        if (master && ctx) master.gain.setTargetAtTime(value ? 1 : 0, ctx.currentTime, .012);
        void reconcile();
      } catch {
        enabled = false;
        report('unavailable');
      }
    },
    setScene(value: Scene) {
      if (scene === value) return;
      scene = value;
      // Keep the base bed ready to return, but never cache all long bonus songs.
      // An outgoing source retains its own buffer only until its crossfade ends.
      for (const cached of buffers.keys()) if(cached !== 'base' && cached !== value) buffers.delete(cached);
      updateMusicDuck();
      if (scene !== 'base') { tensionRevision++; releaseTension(); }
      if (enabled) void reconcile();
    },
    setMusicVolume(value: number) {
      musicVolume = value;
      if (music && ctx) music.gain.setTargetAtTime(value * .72, ctx.currentTime, .025);
    },
    setSfxVolume(value: number) {
      sfxVolume = value;
      if (sfx && ctx) sfx.gain.setTargetAtTime(value * .75, ctx.currentTime, .025);
    },
  };
}

