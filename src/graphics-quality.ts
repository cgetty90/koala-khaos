import { AdaptiveGraphics, graphicsBudget, qualities, validQuality, type GraphicsQuality } from './graphics-policy';
export function currentGraphics(){const value=document.documentElement.dataset.quality;return validQuality(value)?value:'high';}
export function currentBudget(){return graphicsBudget(currentGraphics());}
export function mountGraphicsQuality(select:HTMLSelectElement, reduced:HTMLInputElement, adaptive:HTMLInputElement, status:HTMLElement){
 const key='koala-khaos.graphics.v35';let selected:GraphicsQuality=matchMedia('(pointer:coarse) and (max-width:800px)').matches?'balanced':'high';
 try{const saved=JSON.parse(localStorage.getItem(key)||'{}');if(validQuality(saved.quality))selected=saved.quality;adaptive.checked=saved.adaptive===true}catch{}
 const policy=new AdaptiveGraphics();const root=document.documentElement;select.value=selected;
 function apply(){const actual=qualities[Math.min(2,qualities.indexOf(selected)+(adaptive.checked?policy.level:0))];root.dataset.quality=actual;root.dataset.effects=reduced.checked||actual==='performance'?'reduced':'full';status.textContent=actual===selected?select.selectedOptions[0].textContent!:select.selectedOptions[0].textContent+' · adaptive '+actual;document.dispatchEvent(new Event('graphics-qualitychange'));}
 function save(){try{localStorage.setItem(key,JSON.stringify({quality:selected,adaptive:adaptive.checked}))}catch{}}
 select.addEventListener('change',()=>{if(validQuality(select.value))selected=select.value;policy.reset();save();apply()});adaptive.addEventListener('change',()=>{policy.reset();save();apply()});reduced.addEventListener('change',apply);apply();
 let last=0,request=0;function tick(now:number){request=0;if(!adaptive.checked||selected==='performance'||document.hidden){last=0;return}const phase=document.querySelector<HTMLElement>('#board')?.dataset.phase;const active=Boolean(phase&&phase!=='idle')||Boolean(document.querySelector('dialog[open]:is(#celebration,#feature-dialog)'));const previous=policy.level;policy.sample(last?now-last:0,now,active,!document.hidden,2-qualities.indexOf(selected));last=now;if(previous!==policy.level)apply();request=requestAnimationFrame(tick)}
 function resume(){cancelAnimationFrame(request);last=0;if(adaptive.checked&&selected!=='performance'&&!document.hidden)request=requestAnimationFrame(tick)}adaptive.addEventListener('change',resume);select.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);resume();window.addEventListener('pagehide',()=>cancelAnimationFrame(request));window.addEventListener('pageshow',resume);
}
