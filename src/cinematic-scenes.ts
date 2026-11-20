import './cinematic-scenes.css';
import type {createMotion} from './motion';
type Tier='base'|'regular'|'super'|'epic';
export function mountCinematicScenes(){
 const game=document.querySelector<HTMLElement>('.game')!,scenery=document.querySelector<HTMLElement>('.scenery')!,feature=document.getElementById('feature-dialog')!;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),layer=document.createElement('div');layer.className='cinematic-bonus-world';layer.setAttribute('aria-hidden','true');
 const video=document.createElement('video');video.muted=true;video.playsInline=true;video.loop=true;video.preload='none';layer.append(video);scenery.append(layer);
 let mode:Tier='base',failed=false;const media:Partial<Record<Tier,string>>={regular:import.meta.env.BASE_URL+'cinematic/regular-loop.mp4',super:import.meta.env.BASE_URL+'cinematic/super-loop.mp4',epic:import.meta.env.BASE_URL+'cinematic/epic-loop.mp4'};
 const sync=()=>{const next=(feature instanceof HTMLDialogElement&&feature.open&&['reveal','continue'].includes(feature.dataset.stage??'')?feature.dataset.mode:game.dataset.mode??'base') as Tier;if(next===mode)return;mode=next;layer.dataset.mode=next;document.body.dataset.scene=next;failed=false;video.pause();video.removeAttribute('src');video.load();layer.dataset.video='fallback';
 if(next!=='base'&&!reduced.matches&&media[next]){video.src=media[next]!;void video.play().then(()=>{if(mode===next&&!failed)layer.dataset.video='playing'}).catch(()=>{failed=true;layer.dataset.video='fallback'});}
 };
 new MutationObserver(sync).observe(game,{attributes:true,attributeFilter:['data-mode']});new MutationObserver(sync).observe(feature,{attributes:true,attributeFilter:['data-mode','data-stage','open']});sync();
 video.addEventListener('error',()=>{failed=true;layer.dataset.video='fallback';});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(mode!=='base'&&!reduced.matches&&!failed&&video.getAttribute('src'))void video.play().catch(()=>{})});
 reduced.addEventListener('change',()=>{if(reduced.matches){video.pause();layer.dataset.video='fallback'}else{mode='base';sync()}});
 const curtain=document.createElement('div');curtain.className='cinematic-tier-curtain';curtain.setAttribute('aria-hidden','true');curtain.innerHTML='<i></i><i></i><i></i><i></i><i></i>';feature.prepend(curtain);
 return {async transition(tier:Exclude<Tier,'base'>,mystery:boolean,clock:ReturnType<typeof createMotion>){
  feature.dataset.cinematicTier=tier;feature.dataset.mystery=String(mystery);feature.dataset.authoritative='true';
  curtain.dataset.tier=tier;curtain.dataset.mystery=String(mystery);curtain.hidden=false;
  const duration=mystery?850:tier==='epic'?1000:tier==='super'?800:650;
  try{await clock.tween(duration,p=>{curtain.style.setProperty('--arrival',String(p));feature.style.setProperty('--charge',String(.22+.33*Math.sin(p*Math.PI)));});}finally{curtain.hidden=true}
 }};
}
