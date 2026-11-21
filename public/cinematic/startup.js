(() => {
const mediaBase=new URL('.',document.currentScript.src);
const root=document.getElementById('cinematic-startup'),film=document.getElementById('startup-film'),button=document.getElementById('startup-continue'),skip=document.getElementById('startup-skip'),sound=document.getElementById('startup-sound'),status=document.getElementById('startup-status'),progress=document.getElementById('startup-progress'),retry=document.getElementById('startup-retry');
const shell=document.querySelector('.shell'),reduced=matchMedia('(prefers-reduced-motion:reduce)'),done=new Set();
let choiceMade=false,entered=false,failed=false,resolveEnter,firstFrame=false,filmTimer,stallTimer;const enterPromise=new Promise(r=>resolveEnter=r);
const marks=window.cinematicMetrics={started:performance.now(),stages:[],filmFailure:null,roundsBeforeContinue:0};
performance.mark('cinematic-shell');shell.inert=true;document.body.dataset.cinematic='loading';
const waiting=reason=>{film.pause();film.removeAttribute('src');film.load();root.dataset.film='waiting';skip.hidden=true;sound.hidden=true;clearTimeout(filmTimer);clearTimeout(stallTimer);if(reason)marks.filmFailure=reason;};
function task(name,label){if(failed||done.has(name))return;done.add(name);marks.stages.push({name,at:performance.now()});progress.value=done.size;status.textContent=label;root.dataset.completed=String(done.size);if(done.size===3){marks.essentialReady=performance.now();performance.mark('cinematic-essential-ready');window.dispatchEvent(new Event('cinematic-essential-ready'));root.dataset.ready='true';button.disabled=!choiceMade;button.textContent=choiceMade?'CONTINUE':'CHOOSE HOW TO ENTER';status.textContent='The forest is ready. Continue when you are.';clearTimeout(essentialTimer);}}
function fail(error){if(entered)return;failed=true;waiting('essential-failure');choiceMade=true;document.getElementById('jungle-entry').hidden=true;root.dataset.entry='error';button.disabled=true;retry.hidden=false;progress.value=done.size;progress.setAttribute('aria-invalid','true');status.textContent='Connection or reel artwork could not load. Reload to retry safely.';marks.error=String(error);clearTimeout(essentialTimer);}
const essentialTimer=setTimeout(()=>fail('Essential readiness timed out'),45000);
button.addEventListener('click',()=>{if(button.disabled||failed||entered)return;entered=true;marks.continueAt=performance.now();performance.mark('cinematic-continue');waiting();root.hidden=true;shell.inert=false;document.body.dataset.cinematic='entered';window.dispatchEvent(new Event('cinematic-enter'));resolveEnter();});
skip.addEventListener('click',()=>waiting('user-skip'));retry.addEventListener('click',()=>location.reload());
sound.addEventListener('click',()=>{film.muted=!film.muted;sound.textContent=film.muted?'Enable intro sound':'Mute intro sound';sound.setAttribute('aria-pressed',String(!film.muted));if(!film.paused)void film.play().catch(()=>waiting('audio-play-denied'));});
root.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const controls=[...root.querySelectorAll('button')].filter(e=>!e.hidden&&!e.disabled);if(!controls.length)return;const index=controls.indexOf(document.activeElement);if(event.shiftKey&&index<=0){event.preventDefault();controls.at(-1).focus()}else if(!event.shiftKey&&index===controls.length-1){event.preventDefault();controls[0].focus()}});
film.addEventListener('playing',()=>{if(!firstFrame){firstFrame=true;marks.filmFirstFrame=performance.now();performance.mark('cinematic-film-first-frame')}clearTimeout(filmTimer);clearTimeout(stallTimer)});
film.addEventListener('waiting',()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>waiting('video-stalled'),5000)});
film.addEventListener('ended',()=>waiting());film.addEventListener('error',()=>waiting('video-error'));
reduced.addEventListener('change',()=>{if(reduced.matches)waiting('reduced-motion')});
function startFilm(){if(reduced.matches||navigator.connection?.saveData){waiting('reduced-motion-or-data-saver');return}root.dataset.film='playing';film.src=new URL('mochi-intro.mp4',mediaBase).href;marks.filmRequested=performance.now();filmTimer=setTimeout(()=>waiting('video-initialization-timeout'),10000);void film.play().catch(()=>waiting('autoplay-denied'));}
const entry=document.getElementById('jungle-entry'),withSound=document.getElementById('entry-sound'),mutedEntry=document.getElementById('entry-muted');
let savedMute=false;try{savedMute=JSON.parse(localStorage.getItem('koala-khaos.preferences.v15')||'{}').sound===false}catch{}
if(savedMute){withSound.hidden=true;mutedEntry.textContent='ENTER THE JUNGLE — MUTED';mutedEntry.className='primary';}
skip.hidden=true;sound.hidden=true;root.dataset.entry='waiting';
function chooseEntry(on){
 if(choiceMade)return;choiceMade=true;entry.hidden=true;root.dataset.entry='chosen';marks.entryAt=performance.now();marks.entrySound=on;window.koalaEntrySound=on;
 if(on){try{const context=window.koalaEntryAudioContext=new AudioContext({sampleRate:48000});void context.resume().catch(()=>{})}catch{marks.audioUnlockFailed=true}}
 window.dispatchEvent(new CustomEvent('cinematic-intro-choice',{detail:{sound:on}}));
 film.muted=!on;film.volume=(()=>{try{const value=JSON.parse(localStorage.getItem('koala-khaos.preferences.v15')||'{}').music;return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1?value:.44}catch{return .44}})();
 sound.textContent=on?'Mute intro sound':'Enable intro sound';sound.setAttribute('aria-pressed',String(on));skip.hidden=false;sound.hidden=false;
 if(done.size===3&&!failed){button.disabled=false;button.textContent='CONTINUE';}
 startFilm();
}
withSound.addEventListener('click',()=>chooseEntry(true));mutedEntry.addEventListener('click',()=>chooseEntry(false));

const mirror=document.getElementById('waiting-mochi'),ctx=mirror.getContext('2d');let last=0;
function character(time){if(entered)return;if(time-last>=50&&!document.hidden&&!reduced.matches&&root.dataset.film==='waiting'){last=time;const sources=[...document.querySelectorAll('.mascot canvas')].filter(c=>!c.hidden&&c.width>0);const source=sources.at(-1);if(source){ctx.clearRect(0,0,320,374);ctx.drawImage(source,0,0,320,374);mirror.dataset.live='true';document.getElementById('waiting-mochi-still').hidden=true}}requestAnimationFrame(character)}requestAnimationFrame(character);
window.addEventListener('cinematic-environment-ready',()=>{root.dataset.environment='live'});
window.koalaCinematic={task,fail,entered:()=>enterPromise,markInteractive:()=>{marks.interactive=performance.now();performance.mark('cinematic-interactive');},metrics:marks};
})();
