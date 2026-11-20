import {optionalArt} from './optional-art';
import type { Landing, RevealTiming } from './catalogue-client';
import './purchase-replay.css';

import { conceptArt } from './art';
import type { BonusMode } from './math';
import type { createMotion } from './motion';

const counts = { regular: 3, super: 4, epic: 5 } as const;

export async function revealPurchaseScatters(
  layer: HTMLElement,
  mode: BonusMode,
  clock: ReturnType<typeof createMotion>,
  onImpact: (index: number) => void,
  plan: Landing[],
  timing: RevealTiming,
) {
  // Purchase presentation only: preserve receipt cells/count; order the visual landings left-to-right.
  if (plan.length !== counts[mode] || plan.some((landing,i)=>landing.order!==i||!Number.isInteger(landing.column)||landing.column<0||landing.column>5||!Number.isInteger(landing.row)||landing.row<0||landing.row>4) || new Set(plan.map(p=>p.row*6+p.column)).size!==plan.length) throw Error('Invalid cinematic scatter count.');
  const ordered=[...plan].sort((a,b)=>a.column-b.column||b.row-a.row);
  const occupied=new Set(ordered.map(p=>p.row*6+p.column));
  const previous=(document.getElementById('board')?.dataset.candies??'').split(',');
  const symbols=['berry','lemon','mint','grape','peach','toffee'];
  const span=ordered.length*(timing.dropMs+timing.betweenMs);
  const actors:{cell:HTMLElement;image:HTMLImageElement;row:number;start:number;scatter:boolean;landed:boolean;ordinal:number}[]=[];
  layer.replaceChildren();layer.dataset.landed='0';layer.dataset.presentation='cinematic-only-purchase';layer.dataset.phase='drop';layer.hidden=false;
  function actor(column:number,row:number,name:string,start:number,scatter:boolean,ordinal:number){
    const cell=document.createElement('span');cell.className=scatter?'scatter-drop-cell':'purchase-fill-cell';cell.style.setProperty('--column',String(column));cell.style.setProperty('--row',String(row));
    const image=document.createElement('img');image.src=conceptArt(name);image.alt='';image.style.transform='translateY('+(-100*(row+1.3))+'%)';cell.append(image);
    if(scatter)for(let i=0;i<8;i++){const spark=document.createElement('i');spark.style.setProperty('--angle',String(i*45)+'deg');cell.append(spark)}
    layer.append(cell);actors.push({cell,image,row,start,scatter,landed:false,ordinal});
  }
  for(let cell=0;cell<30;cell++)if(!occupied.has(cell)){
    const name=symbols.includes(previous[cell])?previous[cell]:symbols[cell%symbols.length];
    actor(cell%6,Math.floor(cell/6),name,(cell%6)*Math.max(0,(span-timing.dropMs-60)/5)+(4-Math.floor(cell/6))*12,false,-1);
  }
  ordered.forEach((p,i)=>actor(p.column,p.row,'scatter',i*(timing.dropMs+timing.betweenMs),true,i));
  // Predecode only these small, cached images; never select another outcome or touch the real board.
  await optionalArt(Promise.all(actors.map(a=>a.image.decode().catch(()=>{}))),1200);
  for(const actor of actors)if(!actor.image.complete||!actor.image.naturalWidth){
    actor.image.alt=actor.scatter?'Bonus scatter':'Symbol';
    actor.cell.dataset.artPending='true';
  }
  try{
    await clock.wait(timing.leadMs);
    await clock.tween(span,progress=>{
      const elapsed=progress*span;
      for(const a of actors){
        const t=Math.max(0,Math.min(1,(elapsed-a.start)/timing.dropMs));
        const contact=timing.impactProgress,impact=Math.max(0,(t-contact)/(1-contact));
        const descent=Math.min(1,t/contact);const bounce=Math.abs(Math.sin(impact*Math.PI*2))*(1-impact)**2*.15;
        const squash=Math.sin(impact*Math.PI*3)*(1-impact)*.08;
        a.image.style.transform='translateY('+(-100*((a.row+1.3)*(1-descent**2.3)+bounce))+'%) scale('+(1+squash)+','+(1-squash)+')';
        a.cell.style.setProperty('--impact',String(impact));
        if(a.scatter&&!a.landed&&t>=contact){a.landed=true;a.cell.dataset.landed='true';layer.dataset.landed=String(a.ordinal+1);a.cell.dataset.landingOrder=String(a.ordinal);if(!clock.instant)onImpact(a.ordinal)}
      }
    });
    layer.dataset.phase='complete';await clock.wait(timing.holdMs);
  }finally{layer.hidden=true;layer.replaceChildren();delete layer.dataset.phase;delete layer.dataset.presentation}
  return counts[mode];
}
