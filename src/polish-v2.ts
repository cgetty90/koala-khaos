const frame=document.querySelector('.reel-frame');
const sculpture=document.createElement('div');sculpture.className='polish-cabinet';sculpture.setAttribute('aria-hidden','true');frame?.append(sculpture);
document.body.dataset.visual='polish-v2';document.body.dataset.cabinet='deferred';
// Optional artwork starts only after genuine essential readiness; no new gameplay gate.
function loadCabinet(){
 const cabinet=new Image();cabinet.fetchPriority='low';const url=import.meta.env.BASE_URL+'premium/cabinet-v2.webp';
 document.body.dataset.cabinet='loading';let expired=false;
 const timer=setTimeout(()=>{expired=true;document.body.dataset.cabinet='fallback';cabinet.removeAttribute('src')},5000);
 cabinet.onerror=()=>{clearTimeout(timer);document.body.dataset.cabinet='fallback'};
 cabinet.onload=()=>{clearTimeout(timer);if(expired)return;document.documentElement.style.setProperty('--v2-frame','url("'+url+'")');document.body.dataset.cabinet='ready'};
 cabinet.src=url;
}
if((window as Window & {cinematicMetrics?:{essentialReady?:number}}).cinematicMetrics?.essentialReady)loadCabinet();
else window.addEventListener('cinematic-essential-ready',loadCabinet,{once:true});
