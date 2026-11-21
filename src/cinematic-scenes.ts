import './cinematic-scenes.css';
import './bonus-entry-film.css';
import type {createMotion} from './motion';
type Tier='base'|'regular'|'super'|'epic';
export function mountCinematicScenes(){
 const game=document.querySelector<HTMLElement>('.game')!,scenery=document.querySelector<HTMLElement>('.scenery')!,feature=document.getElementById('feature-dialog')!;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),layer=document.createElement('div');layer.className='cinematic-bonus-world';layer.setAttribute('aria-hidden','true');
 const video=document.createElement('video');video.muted=true;video.playsInline=true;video.loop=true;video.preload='none';layer.append(video);scenery.append(layer);
 let mediaTimer:ReturnType<typeof setTimeout>|undefined;let mode:Tier='base',failed=false;const media:Partial<Record<Tier,string>>={regular:import.meta.env.BASE_URL+'cinematic/regular-loop.mp4',super:import.meta.env.BASE_URL+'cinematic/super-loop.mp4',epic:import.meta.env.BASE_URL+'cinematic/epic-loop.mp4'};
 const sync=()=>{const next=(feature instanceof HTMLDialogElement&&feature.open&&['reveal','continue'].includes(feature.dataset.stage??'')?feature.dataset.mode:game.dataset.mode??'base') as Tier;if(next===mode)return;clearTimeout(mediaTimer);mode=next;layer.dataset.mode=next;document.body.dataset.scene=next;failed=false;video.pause();video.removeAttribute('src');video.load();layer.dataset.video='fallback';
 if(next!=='base'&&!reduced.matches&&media[next]){video.src=media[next]!;mediaTimer=setTimeout(()=>{if(mode===next&&video.readyState<2){failed=true;video.pause();video.removeAttribute('src');video.load();layer.dataset.video='fallback'}},5000);void video.play().then(()=>{if(mode===next&&!failed){clearTimeout(mediaTimer);layer.dataset.video='playing'}}).catch(()=>{failed=true;layer.dataset.video='fallback'});}
 };
 new MutationObserver(sync).observe(game,{attributes:true,attributeFilter:['data-mode']});new MutationObserver(sync).observe(feature,{attributes:true,attributeFilter:['data-mode','data-stage','open']});sync();
 video.addEventListener('error',()=>{failed=true;layer.dataset.video='fallback';});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(mode!=='base'&&!reduced.matches&&!failed&&video.getAttribute('src'))void video.play().catch(()=>{})});
 reduced.addEventListener('change',()=>{if(reduced.matches){video.pause();layer.dataset.video='fallback'}else{mode='base';sync()}});
 const curtain=document.createElement('div');curtain.className='jungle-transition';curtain.hidden=true;curtain.setAttribute('aria-hidden','true');const canvas=document.createElement('canvas');canvas.width=800;canvas.height=400;curtain.append(canvas);const label=document.createElement('span');label.className='jungle-transition-label';curtain.append(label);feature.prepend(curtain);
 const skipTransition=document.createElement('button');skipTransition.type='button';skipTransition.id='skip-jungle-transition';skipTransition.textContent='Skip transition';skipTransition.hidden=true;feature.append(skipTransition);
 const cutscene=document.createElement('video');cutscene.className='bonus-entry-film';cutscene.muted=true;cutscene.playsInline=true;cutscene.preload='none';curtain.prepend(cutscene);
 const ctx=canvas.getContext('2d')!;const leaf=new Image();leaf.src=import.meta.env.BASE_URL+'art/outback/eucalyptus.webp';
 const paint=(tier:Exclude<Tier,'base'>,p:number)=>{
  ctx.clearRect(0,0,800,400);const power=Math.sin(p*Math.PI);
  if(tier!=='regular'){
   for(let i=0;i<3;i++){const cloud=ctx.createRadialGradient(180+i*260-p*100,50+i*15,10,180+i*260-p*100,50,240);cloud.addColorStop(0,`rgba(35,65,80,${power*.48})`);cloud.addColorStop(1,'rgba(15,38,49,0)');ctx.fillStyle=cloud;ctx.fillRect(0,0,800,240)}
   ctx.strokeStyle=`rgba(190,226,229,${power*.2})`;ctx.lineWidth=1;for(let i=0;i<26;i++){const x=(i*137-p*100)%900,y=(i*71+p*250)%450;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-11,y+28);ctx.stroke()}
   if(tier==='epic'&&p>.46&&p<.59){ctx.strokeStyle=`rgba(225,222,255,${Math.sin((p-.46)/.13*Math.PI)*.7})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(670,0);ctx.lineTo(630,46);ctx.lineTo(658,43);ctx.lineTo(611,96);ctx.stroke()}
  }
  ctx.globalAlpha=power*.8;
  for(let i=0;i<16;i++){const x=120+p*720+i*25,y=310-Math.sin(p*Math.PI)*220+Math.sin(i*2+p*6)*55;ctx.save();ctx.translate(x%870,y);ctx.rotate(i+p*6);if(leaf.complete&&leaf.naturalWidth)ctx.drawImage(leaf,-16,-16,32,32);else{ctx.fillStyle=tier==='regular'?'#d1b46d':'#9ebcb5';ctx.beginPath();ctx.ellipse(0,0,14,5,0,0,Math.PI*2);ctx.fill()}ctx.restore()}ctx.globalAlpha=1;
 };
 return {async transition(tier:Exclude<Tier,'base'>,mystery:boolean,clock:ReturnType<typeof createMotion>){
  feature.dataset.cinematicTier=tier;feature.dataset.mystery=String(mystery);feature.dataset.authoritative='true';curtain.hidden=false;skipTransition.hidden=false;feature.dataset.mysteryReveal=String(!mystery);const skip=()=>clock.skipCurrent();skipTransition.addEventListener('click',skip);
  label.textContent=mystery?'THE FOREST REVEALS ITS SECRET':tier==='regular'?'A LITTLE LEAF MAGIC':tier==='super'?'MOCHI STIRS THE STORM':'THE JUNGLE AWAKENS';
  const cinematic=!reduced.matches&&!clock.instant;
  feature.dataset.entryFilm=cinematic?'loading':'reduced';
  if(cinematic){
   cutscene.poster=import.meta.env.BASE_URL+'cinematic/'+tier+'-loop.webp';
   cutscene.src=media[tier]!;cutscene.currentTime=0;
   void cutscene.play().then(()=>{if(!curtain.hidden)feature.dataset.entryFilm='playing'}).catch(()=>{feature.dataset.entryFilm='fallback'});
  }
  const duration=cinematic?5500:0;const issued=new Set<string>();
  try{await clock.tween(duration,p=>{
   paint(tier,p);curtain.style.opacity=String(Math.min(1,p*8,(1-p)*10));if(p>=.6)feature.dataset.mysteryReveal='true';
   if(!clock.skipping&&!clock.instant&&p<.98){
    for(const [at,name]of [[.04,'watch'],[.3,'bonus'],[.7,tier==='regular'?'win':'epic']]as const)if(p>=at&&!issued.has(name)){issued.add(name);window.dispatchEvent(new CustomEvent('premium-pose',{detail:name}))}
    const cue=tier==='regular'?'scatter-impact':p<.65?'storm-charge':'storm';if(p>.3&&!issued.has(cue)){issued.add(cue);window.dispatchEvent(new CustomEvent('polish-transition-cue',{detail:cue}))}
   }
  })}finally{cutscene.pause();cutscene.removeAttribute('src');cutscene.load();curtain.hidden=true;skipTransition.hidden=true;skipTransition.removeEventListener('click',skip);feature.dataset.mysteryReveal='true';delete feature.dataset.entryFilm;ctx.clearRect(0,0,800,400)}
 }};
}
