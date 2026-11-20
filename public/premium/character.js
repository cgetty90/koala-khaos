(()=>{
const premiumRoot=new URL('./',document.currentScript.src).href;
window.premiumCharacterLoads=[];

(()=>{
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.motion==='instant';
const premium=()=>true;
const open={get open(){return Boolean(document.querySelector('dialog[open]'));}};
const active=null;
const currentMochiFrame=0;
const finishArt = {
  "face-open": [
    2,
    2,
    255,
    194
  ],
  "face-half": [
    261,
    2,
    255,
    194
  ],
  "face-closed": [
    520,
    2,
    255,
    194
  ],
  "face-smile": [
    2,
    200,
    255,
    194
  ],
  "face-alert": [
    261,
    200,
    255,
    194
  ],
  "face-joy": [
    520,
    200,
    255,
    194
  ],
  "torso": [
    779,
    200,
    172,
    207
  ],
  "paw-0-0": [
    2,
    411,
    99,
    130
  ],
  "paw-0-1": [
    105,
    411,
    99,
    130
  ],
  "paw-0-2": [
    208,
    411,
    99,
    130
  ],
  "paw-0-3": [
    311,
    411,
    99,
    130
  ],
  "paw-1-0": [
    414,
    411,
    99,
    130
  ],
  "paw-1-1": [
    517,
    411,
    99,
    130
  ],
  "paw-1-2": [
    620,
    411,
    99,
    130
  ],
  "paw-1-3": [
    723,
    411,
    99,
    130
  ],
  "ear-near": [
    826,
    411,
    104,
    101
  ],
  "ear-far": [
    934,
    411,
    78,
    93
  ],
  "scarf-knot": [
    2,
    545,
    123,
    55
  ],
  "scarf-tail-near": [
    129,
    545,
    42,
    64
  ],
  "scarf-tail-far": [
    175,
    545,
    40,
    62
  ],
  "water-vein": [
    219,
    545,
    125,
    282
  ],
  "whitewater": [
    348,
    545,
    171,
    51
  ],
  "pool-ripples": [
    523,
    545,
    180,
    52
  ]
};

const finishSprites=(()=>{
  const image=new Image();
  let failed=false;
  image.onerror=()=>{failed=true;};
  function load(){if(!image.getAttribute('src'))image.src=premiumRoot+'finish.webp';}
  function draw(ctx,name,x,y,w,h){
    const [sx,sy,sw,sh]=finishArt[name];
    ctx.drawImage(image,sx,sy,sw,sh,x,y,w??sw,h??sh);
  }
  return {load,decode:()=>image.decode(),draw,ready:()=>image.naturalWidth>0,error:()=>failed?'Finishing artwork could not load.':''};
})();


const motionParts = {
  "upper-0": [
    2,
    2,
    70,
    110
  ],
  "lower-0": [
    78,
    2,
    64,
    102
  ],
  "hand-0": [
    154,
    2,
    56,
    66
  ],
  "upper-1": [
    2,
    117,
    70,
    110
  ],
  "lower-1": [
    78,
    117,
    64,
    102
  ],
  "hand-1": [
    154,
    117,
    56,
    66
  ],
  "white-0": [
    237,
    2,
    43,
    42
  ],
  "white-1": [
    288,
    2,
    75,
    51
  ],
  "iris-0": [
    238,
    66,
    30,
    39
  ],
  "iris-1": [
    282,
    66,
    32,
    41
  ]
};

const articulationParts = {
  "shoulder-0": [
    4,
    4,
    54,
    55
  ],
  "binding-0": [
    74,
    4,
    23,
    53
  ],
  "elbow-0": [
    144,
    4,
    56,
    55
  ],
  "wrist-0": [
    214,
    4,
    46,
    42
  ],
  "curl-0": [
    284,
    4,
    52,
    59
  ],
  "shoulder-1": [
    4,
    69,
    54,
    55
  ],
  "binding-1": [
    74,
    69,
    23,
    53
  ],
  "elbow-1": [
    144,
    69,
    56,
    55
  ],
  "wrist-1": [
    214,
    69,
    46,
    42
  ],
  "curl-1": [
    284,
    69,
    52,
    59
  ],
  "neutral-alert": [
    3,
    141,
    114,
    102
  ],
  "alert-surprise": [
    129,
    141,
    114,
    102
  ],
  "surprise-joy": [
    255,
    141,
    114,
    102
  ],
  "joy-neutral": [
    381,
    141,
    114,
    102
  ],
  "end-alert": [
    3,
    255,
    114,
    102
  ],
  "end-joy": [
    129,
    255,
    114,
    102
  ]
};

/* Registered paint corrections, controlled by the existing action clock and joints. */
const articulation=(()=>{
  const image=new Image(), patch=document.createElement('canvas');
  patch.width=114;patch.height=102;
  const paint=patch.getContext('2d');
  let enabled=true, error='';
  image.onerror=()=>{error='Corrective artwork could not load. Showing the previous motion art.';};
  const ready=()=>enabled&&image.naturalWidth>0;
  function load(){
    if(!image.getAttribute('src'))image.src=premiumRoot+'articulation.webp';
  }
  function tile(ctx,name,x,y,w,h){
    const [sx,sy,sw,sh]=articulationParts[name];
    ctx.drawImage(image,sx,sy,sw,sh,x,y,w??sw,h??sh);
  }
  function local(ctx,name,point,angle,w,h,opacity,x=-w/2,y=-h/2){
    if(!ready()||opacity<=.003)return;
    ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);
    ctx.globalAlpha=opacity;
    tile(ctx,name,x,y,w,h);ctx.restore();
  }
  const facing=(a,b)=>Math.atan2(a.x-b.x,b.y-a.y);
  function limb(ctx,side,{shoulder,elbow,wrist},raise){
    const upper=facing(shoulder,elbow), lower=facing(elbow,wrist);
    const change=Math.atan2(Math.sin(lower-upper),Math.cos(lower-upper));
    const bend=Math.min(1,Math.abs(change)/1.9);
    local(ctx,'shoulder-'+side,shoulder,upper,26,29,.61);
    local(ctx,'binding-'+side,shoulder,upper*.25,7,23,.26+raise*.22,
      (side===0?11:-18),-11);
    local(ctx,'elbow-'+side,elbow,upper+change*.52,27,25,.36+bend*.53);
    local(ctx,'wrist-'+side,wrist,lower,18,17,.54);
  }
  const hand=document.createElement('canvas');hand.width=36;hand.height=42;
  const fingers=hand.getContext('2d');
  function paw(ctx,old,side,curl){
    if(!ready()||curl<.01){old();return;}
    // Blend silhouettes in an offscreen buffer so both shapes share one wrist origin.
    fingers.clearRect(0,0,36,42);
    fingers.globalCompositeOperation='source-over';
    fingers.globalAlpha=1-curl;
    old(fingers,18,13);
    fingers.globalCompositeOperation='lighter';
    fingers.globalAlpha=curl;
    tile(fingers,'curl-'+side,7,7,22,26);
    fingers.globalAlpha=1;
    fingers.globalCompositeOperation='source-over';
    ctx.drawImage(hand,-18,-13);
  }
  const tracks={
    watch:[[0,'neutral'],[200,'neutral-alert'],[850,'neutral-alert']],
    impact:[[0,'neutral-alert'],[198,'alert-surprise'],[366,'end-alert'],
      [1000,'end-alert'],[1230,'alert-surprise'],[1490,'neutral-alert'],[1690,'neutral']],
    win:[[0,'neutral'],[235,'neutral-alert'],[440,'alert-surprise'],[615,'surprise-joy'],
      [760,'end-joy'],[1460,'end-joy'],[1700,'surprise-joy'],[1900,'joy-neutral'],[2160,'neutral']]
  };
  function face(ctx,state,time,ease){
    const keys=tracks[state];
    if(!ready()||!keys)return;
    const index=keys.findIndex(pair=>time<pair[0]);
    const [left,right]=index===-1?[keys.at(-1),keys.at(-1)]:[keys[Math.max(0,index-1)],keys[index]];
    const blend=left[0]===right[0]?0:ease(left[0],right[0],time);
    paint.globalCompositeOperation='source-over';paint.clearRect(0,0,114,102);
    if(left[1]!=='neutral'){
      paint.globalAlpha=1-blend;tile(paint,left[1],0,0);
    }
    if(blend>0&&right[1]!=='neutral'){
      paint.globalCompositeOperation='lighter';paint.globalAlpha=blend;tile(paint,right[1],0,0);
    }
    paint.globalAlpha=1;paint.globalCompositeOperation='source-over';
    ctx.drawImage(patch,91,80);
  }
  return {load,decode:()=>image.decode(),ready,limb,paw,face,error:()=>error,set:value=>{enabled=value;}};
})();


const priorMochiRig=(()=>{
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=374;canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');
  document.querySelector('#mascot').parentElement.append(canvas);
  const original=document.querySelector('#mascot'),ctx=canvas.getContext('2d');
  const draw=(...args)=>finishSprites.draw(ctx,...args);
  let enabled=false,reaction=null,last=-1,draws=0,current='open';
  const events=[];
  const pawX=[[74,83,91,95],[153,151,160,143]];
  const eyelids=[1.6,5.3,5.7,10.6,14,19.3,22.7,27.6];
  function set(on){enabled=on;reaction=null;if(on)finishSprites.load();}
  function frame(now){
    if(reaction&&reduced())reaction=null;
    if(reaction?.end&&now>reaction.end)reaction=null;
    const shown=Boolean(enabled&&finishSprites.ready()&&!reduced()&&!document.hidden&&premium()&&!open.open&&(!active||reaction));
    if(shown===canvas.hidden){
      canvas.hidden=!shown;original.style.visibility=shown?'hidden':'';
    }
    const index=Math.floor(now*24/1000);
    if(!shown||last===index)return;
    last=index;
    const t=now/1000, phase=t%31.7;
    const breath=Math.sin(t*1.4)*1.05;
    const look=(reaction?.key==='watch'||(phase>3&&phase<5)||(phase>12&&phase<15));
    const blink=eyelids.find(at=>phase>=at&&phase<at+.25);
    const dt=reaction?(now-reaction.start)/1000:0;
    const impact=reaction?.key==='impact';
    const joy=reaction?.key==='win';
    let hands=0;
    if(impact||joy){
      const summit=joy?3:2;
      hands=dt<.13?1:dt<.79?summit:dt<.98?1:0;
    }
    current=joy&&dt<1?'joy':impact&&dt<.82?'alert':
      blink!==undefined?(Math.abs(phase-blink-.12)<.052?'closed':'half'):
      phase>24&&phase<27?'smile':'open';
    const recoil=impact?Math.sin(Math.PI*Math.min(1,dt/.85))*3:0;
    const nod=joy?Math.sin(Math.PI*Math.min(1,dt/1.1))*4:0;
    const headX=look?-3:recoil*.6, headY=breath-recoil-nod;
    ctx.clearRect(0,0,320,374);
    draw('torso',79,159+breath,172,207-breath);
    for(let side=0;side<2;side++){
      const pose=side===1&&hands>0&&dt<.18?1:hands;
      draw('paw-'+side+'-'+pose,pawX[side][pose],178+breath+(pose===3?2:0));
    }
    for(const [name,x,y,delay] of [['scarf-tail-far',157,184,.5],['scarf-tail-near',144,185,0]]){
      ctx.save(); ctx.translate(x,y);
      ctx.rotate(.036*Math.sin(t*2-delay)+.11*recoil*Math.sin(Math.min(dt,1)*7-delay));
      draw(name,-5,0);ctx.restore();
    }
    draw('scarf-knot',102,152+breath,117,56);
    draw('ear-far',32+headX,63+headY+1.3*Math.sin(t*1.88));
    draw('ear-near',188+headX,33+headY+1.7*Math.sin(t*2.31+.5));
    draw('face-'+current,33+headX,4+headY);
    draws++;
  }
  function act(key){
    if(!enabled||!finishSprites.ready()||reduced())return;
    const start=performance.now();
    reaction={key,start,end:key==='watch'?null:start+1230};
    events.push(key);
    if(events.length>30)events.shift();
  }
  return {set,frame,scatter:landed=>act(landed?'impact':'watch'),win:()=>act('win'),cancel:()=>{reaction=null;},
    idle:()=>enabled&&finishSprites.ready(),error:finishSprites.error,
    metrics:()=>({draws,loaded:finishSprites.ready(),visible:!canvas.hidden,error:finishSprites.error(),events:[...events],current})};
})();


/* Articulated Mochi acting proof. All articulation occurs on separated illustrations. */
const articulatedMochi=(()=>{
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=374;canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');
  document.querySelector('#mascot').parentElement.append(canvas);
  const original=document.querySelector('#mascot'), ctx=canvas.getContext('2d');
  const pieces=new Image();
  let enabled=false, clock=0, last=0, lastDraw=-1, scale=1, action=null, draws=0, error='';
  let focus=0, nextBlink=1850, blinkStart=-999, nextTwitch=4700, twitchStart=-999;
  let rng=9325, gazeAmount=0, nextLook=4450, lookUntil=0, lastFrame;
  const events=[];
  pieces.onerror=()=>{error='The motion artwork could not load.';};
  const ready=()=>pieces.naturalWidth>0&&finishSprites.ready();
  const bound=(x,min=0,max=1)=>Math.min(max,Math.max(min,x));
  const ease=(a,b,t)=>{
    const x=bound((t-a)/(b-a));return x*x*x*(10+x*(-15+x*6));
  };
  const envelope=(t,a,b,c,d)=>ease(a,b,t)*(1-ease(c,d,t));
  const mix=(a,b,t)=>a+(b-a)*t;
  const random=()=>{
    rng=(Math.imul(rng,1664525)+1013904223)>>>0;
    return rng/4294967296;
  };
  function atlasPart(name,x,y,w,h,destination=ctx){
    const [sx,sy,sw,sh]=motionParts[name];
    destination.drawImage(pieces,sx,sy,sw,sh,x,y,w,h);
  }
  function originalPart(name,x,y,w,h){finishSprites.draw(ctx,name,x,y,w,h);}
  function pivoted(draw,name,x,y,px,py,angle){
    ctx.save();
    ctx.translate(x+px,y+py);ctx.rotate(angle);
    draw(name,-px,-py);
    ctx.restore();
  }
  // Two fixed bone lengths. Select the outward elbow solution for each side.
  function solve(side,shoulder,wrist){
    const a=36,b=34, dx=wrist.x-shoulder.x,dy=wrist.y-shoulder.y;
    const length=Math.hypot(dx,dy)||1, distance=bound(length,14,69.4);
    const ux=dx/length,uy=dy/length;
    const along=(a*a+distance*distance-b*b)/(2*distance);
    const away=Math.sqrt(Math.max(0,a*a-along*along))*(side===0?1:-1);
    return {elbow:{x:shoulder.x+ux*along-uy*away,y:shoulder.y+uy*along+ux*away},
      wrist:{x:shoulder.x+ux*distance,y:shoulder.y+uy*distance}};
  }
  function segment(name,a,b,width,top,bottom){
    const dx=b.x-a.x,dy=b.y-a.y;
    ctx.save();
    ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(-dx,dy));
    atlasPart(name,-width/2,-top,width,Math.hypot(dx,dy)+top+bottom);
    ctx.restore();
  }
  function arm(side,breath,raise,anticipation,overshoot){
    const sign=side===0?1:-1;
    const shoulder={x:side===0?111:212,y:203+breath-anticipation*1.5};
    const target={x:mix(side===0?122:199,side===0?140:180,raise)+overshoot*sign,
      y:mix(side===0?271:269,222,raise)+breath*.65};
    const {elbow,wrist}=solve(side,shoulder,target);
    const turn=bound(Math.atan2(-(wrist.x-elbow.x),wrist.y-elbow.y),-1.5,1.5);
    segment('upper-'+side,shoulder,elbow,31,13,7);
    segment('lower-'+side,elbow,wrist,26,12,7);
    const joint={shoulder,elbow,wrist,turn,tilt:turn*.94-sign*.46*raise,curl:ease(.30,.95,raise)};
    articulation.limb(ctx,side,joint,raise);
    return joint;
  }
  function drawHand({wrist,tilt,curl},side){
    ctx.save();
    ctx.translate(wrist.x,wrist.y);ctx.rotate(tilt);
    articulation.paw(ctx,(target=ctx,x=0,y=0)=>atlasPart('hand-'+side,x-11,y-6,22,27,target),side,curl);
    ctx.restore();
  }  const apertures=[
    [[109,119],[116,118],[123,123],[127,132],[121,137],[111,139],[106,135],[107,125]],
    [[153,116],[159,109],[168,104],[180,106],[189,114],[192,122],[185,127],[173,130],[159,132],[152,129]],
  ];
  function eyes(amount,wide){
    const placement=[[106,118,22,22,110,120,12,16],[152,104,41,29,158,109,17,21]];
    for(let i=0;i<2;i++){
      const [x,y,w,h,ix,iy,iw,ih]=placement[i];
      ctx.save();
      ctx.beginPath();apertures[i].forEach(([a,b],n)=>n?ctx.lineTo(a,b):ctx.moveTo(a,b));
      ctx.closePath();ctx.clip();
      atlasPart('white-'+i,x,y,w,h);
      atlasPart('iris-'+i,ix+1-amount*(i===0?2.8:4.6),iy-wide*.7,iw-2,ih);
      ctx.restore();
    }
  }
  function update(t,dt){
    if(action?.type==='watch'&&t-action.start>1700)action=null;
    if(action&&action.type!=='watch'&&t-action.start>action.length){
      events.push({state:'idle',clock:Math.round(t)});
      action=null;
    }
    const time=action?t-action.start:0, win=action?.type==='win', impact=action?.type==='impact', watching=action?.type==='watch';
    const notice=watching?ease(0,155,time):impact?1-ease(880,1540,time):win?envelope(time,0,145,1100,1670):0;
    gazeAmount+=(notice-gazeAmount)*(1-Math.exp(-dt/57));
    const turn=watching?ease(105,510,time):impact?1-ease(960,1640,time):win?envelope(time,180,560,1040,1720):0;
    focus+=(turn-focus)*(1-Math.exp(-dt/96));
    if(t>=nextBlink&&(!action||watching&&time>790)){
      blinkStart=t;nextBlink=t+2550+random()*3110;
    }
    if(t>=nextTwitch){twitchStart=t;nextTwitch=t+5400+random()*4500;}
    if(t>=nextLook){lookUntil=t+680+random()*440;nextLook=t+5100+random()*3300;}
    const idleLook=lookUntil>0?envelope(t,lookUntil-880,lookUntil-660,lookUntil-380,lookUntil):0;
    const blink=t-blinkStart;
    const breath=Math.sin(t*Math.PI*2/3650)*1.13;
    const ears=impact?envelope(time,130,385,520,1150):win?envelope(time,400,745,960,1660):envelope(t-twitchStart,0,130,165,460)*.44;
    const anticipation=impact?envelope(time,140,390,490,1000):win?envelope(time,120,350,530,920):focus*.12;
    const paws=[0,1].map(side=>{
      const f=time-side*(win?57:44);
      const target=win?envelope(f,310,970,1140,2090):impact?envelope(f,230,860,1020,1740):0;
      return mix(action?.from[side]??0,target,ease(0,230,time));
    });
    const follow=impact?envelope(time,480,1090,1170,1660):win?envelope(time,540,1070,1190,2050):0;
    const expression=win&&time>540&&time<1620?'joy':impact&&time>330&&time<1210?'alert':
      blink<205?(blink>=56&&blink<110?'closed':'half'):'open';
    return {breath,ears,anticipation,paws,follow,expression,focus,
      gaze:bound(gazeAmount+idleLook*.52),time,win,impact};
  }
  function frame(now){
    const step=last?Math.min(now-last,65):0;
    last=now;
    const shown=Boolean(enabled&&ready()&&!reduced()&&!document.hidden&&premium()&&!open.open);
    if(shown===canvas.hidden){
      canvas.hidden=!shown;original.style.visibility=shown?'hidden':'';
    }
    if(!shown){if(reduced()||document.hidden)action=null;return;}
    clock+=step*scale;
    const state=update(clock,step*scale);
    const index=Math.floor(now*60/1000);
    if(lastDraw===index)return;
    lastDraw=index;
    const {breath,ears,anticipation,paws,follow,expression,gaze}=state;
    ctx.clearRect(0,0,320,374);
    originalPart('torso',79,159+breath,172,207-breath);
    const joints=paws.map((value,side)=>arm(side,breath,value,anticipation,follow*(state.win?2.8:1.5)));
    const cloth=.022*Math.sin(clock/680)+follow*.105;
    pivoted(originalPart,'scarf-tail-far',152,184+breath,5,0,cloth*.68);
    pivoted(originalPart,'scarf-tail-near',139,185+breath,5,0,cloth);
    originalPart('scarf-knot',102,152+breath,117,56);
    joints.forEach(drawHand);
    const hx=-4.2*state.focus,hy=breath+anticipation*1.65-state.follow;
    pivoted(originalPart,'ear-far',32+hx,63+hy,51,58,.058*ears);
    pivoted(originalPart,'ear-near',188+hx,33+hy,29,64,-.080*ears);
    ctx.save();
    ctx.translate(160+hx,178+hy);ctx.rotate(-.022*state.focus+.014*anticipation);
    ctx.translate(-160,-178);
    const useCorrections=articulation.ready()&&Boolean(action);
    const baseFace=useCorrections&&expression!=='half'&&expression!=='closed'?'open':expression;
    originalPart('face-'+baseFace,33,4);
    if(baseFace==='open'){
      eyes(gaze,anticipation);
      if(useCorrections)articulation.face(ctx,action.type,state.time,ease);
    }
    ctx.restore();
    lastFrame={joints,clock,state:action?.type||'idle',expression,gaze,paws};
    draws++;
  }
  function actionStart(type){
    if(!enabled||!ready()||reduced())return;
    action={type,start:clock,length:type==='win'?2220:1840,from:lastFrame?.paws??[0,0]};
    events.push({state:type,clock:Math.round(clock)});
    if(events.length>24)events.shift();
  }
  return {decode:()=>pieces.decode(),set(on){enabled=on;last=0;if(on){articulation.load();finishSprites.load();if(!pieces.getAttribute('src'))pieces.src=premiumRoot+'motion-parts.webp';}
      else action=null;}, frame, scatter:landed=>actionStart(landed?'impact':'watch'),
    win:()=>actionStart('win'),cancel:()=>{action=null;},idle:()=>enabled&&ready(),
    error:()=>error||articulation.error()||finishSprites.error(),speed:value=>{scale=value;},
    metrics:()=>({visible:!canvas.hidden,draws,ready:ready(),events:[...events],lastFrame,scale})};
})();

const mochiRig=(()=>{
  let legacy=false, enabled=false;
  const select=()=>legacy?priorMochiRig:articulatedMochi;
  return {
    set(on){enabled=on;select().set(on);},
    legacy(on){
      if(legacy===on)return;
      select().set(false);select().frame(performance.now());
      legacy=on;select().set(enabled);
    },
    frame:time=>select().frame(time),
    scatter:value=>select().scatter(value),
    win:()=>select().win(),
    cancel:()=>select().cancel(),
    idle:()=>select().idle(),
    error:()=>select().error(),
    speed:value=>articulatedMochi.speed(value),
    metrics:()=>({...select().metrics(),legacy})
  };
})();







articulatedMochi.set(true);
window.premiumCharacterLoads.push(Promise.all([finishSprites.decode(),articulatedMochi.decode(),articulation.decode()]));
window.addEventListener('premium-pose',event=>{
 const name=event.detail;
 if(['ready','watch','curious'].includes(name))articulatedMochi.scatter(false);
 if(['bonus','epic'].includes(name))articulatedMochi.scatter(true);
 if(['win','big','mega','complete'].includes(name))articulatedMochi.win();
});
document.querySelector('#board').addEventListener('scatter-landed',()=>articulatedMochi.scatter(true));
function tick(time){articulatedMochi.frame(time);requestAnimationFrame(tick);}
requestAnimationFrame(tick);
})();


(()=>{
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.motion==='instant';
const premium=()=>true;
const open={get open(){return !document.querySelector('#cinematic-mochi').closest('dialog')?.open;}};
const active=null;
const currentMochiFrame=0;
const finishArt = {
  "face-open": [
    2,
    2,
    255,
    194
  ],
  "face-half": [
    261,
    2,
    255,
    194
  ],
  "face-closed": [
    520,
    2,
    255,
    194
  ],
  "face-smile": [
    2,
    200,
    255,
    194
  ],
  "face-alert": [
    261,
    200,
    255,
    194
  ],
  "face-joy": [
    520,
    200,
    255,
    194
  ],
  "torso": [
    779,
    200,
    172,
    207
  ],
  "paw-0-0": [
    2,
    411,
    99,
    130
  ],
  "paw-0-1": [
    105,
    411,
    99,
    130
  ],
  "paw-0-2": [
    208,
    411,
    99,
    130
  ],
  "paw-0-3": [
    311,
    411,
    99,
    130
  ],
  "paw-1-0": [
    414,
    411,
    99,
    130
  ],
  "paw-1-1": [
    517,
    411,
    99,
    130
  ],
  "paw-1-2": [
    620,
    411,
    99,
    130
  ],
  "paw-1-3": [
    723,
    411,
    99,
    130
  ],
  "ear-near": [
    826,
    411,
    104,
    101
  ],
  "ear-far": [
    934,
    411,
    78,
    93
  ],
  "scarf-knot": [
    2,
    545,
    123,
    55
  ],
  "scarf-tail-near": [
    129,
    545,
    42,
    64
  ],
  "scarf-tail-far": [
    175,
    545,
    40,
    62
  ],
  "water-vein": [
    219,
    545,
    125,
    282
  ],
  "whitewater": [
    348,
    545,
    171,
    51
  ],
  "pool-ripples": [
    523,
    545,
    180,
    52
  ]
};

const finishSprites=(()=>{
  const image=new Image();
  let failed=false;
  image.onerror=()=>{failed=true;};
  function load(){if(!image.getAttribute('src'))image.src=premiumRoot+'finish.webp';}
  function draw(ctx,name,x,y,w,h){
    const [sx,sy,sw,sh]=finishArt[name];
    ctx.drawImage(image,sx,sy,sw,sh,x,y,w??sw,h??sh);
  }
  return {load,decode:()=>image.decode(),draw,ready:()=>image.naturalWidth>0,error:()=>failed?'Finishing artwork could not load.':''};
})();


const motionParts = {
  "upper-0": [
    2,
    2,
    70,
    110
  ],
  "lower-0": [
    78,
    2,
    64,
    102
  ],
  "hand-0": [
    154,
    2,
    56,
    66
  ],
  "upper-1": [
    2,
    117,
    70,
    110
  ],
  "lower-1": [
    78,
    117,
    64,
    102
  ],
  "hand-1": [
    154,
    117,
    56,
    66
  ],
  "white-0": [
    237,
    2,
    43,
    42
  ],
  "white-1": [
    288,
    2,
    75,
    51
  ],
  "iris-0": [
    238,
    66,
    30,
    39
  ],
  "iris-1": [
    282,
    66,
    32,
    41
  ]
};

const articulationParts = {
  "shoulder-0": [
    4,
    4,
    54,
    55
  ],
  "binding-0": [
    74,
    4,
    23,
    53
  ],
  "elbow-0": [
    144,
    4,
    56,
    55
  ],
  "wrist-0": [
    214,
    4,
    46,
    42
  ],
  "curl-0": [
    284,
    4,
    52,
    59
  ],
  "shoulder-1": [
    4,
    69,
    54,
    55
  ],
  "binding-1": [
    74,
    69,
    23,
    53
  ],
  "elbow-1": [
    144,
    69,
    56,
    55
  ],
  "wrist-1": [
    214,
    69,
    46,
    42
  ],
  "curl-1": [
    284,
    69,
    52,
    59
  ],
  "neutral-alert": [
    3,
    141,
    114,
    102
  ],
  "alert-surprise": [
    129,
    141,
    114,
    102
  ],
  "surprise-joy": [
    255,
    141,
    114,
    102
  ],
  "joy-neutral": [
    381,
    141,
    114,
    102
  ],
  "end-alert": [
    3,
    255,
    114,
    102
  ],
  "end-joy": [
    129,
    255,
    114,
    102
  ]
};

/* Registered paint corrections, controlled by the existing action clock and joints. */
const articulation=(()=>{
  const image=new Image(), patch=document.createElement('canvas');
  patch.width=114;patch.height=102;
  const paint=patch.getContext('2d');
  let enabled=true, error='';
  image.onerror=()=>{error='Corrective artwork could not load. Showing the previous motion art.';};
  const ready=()=>enabled&&image.naturalWidth>0;
  function load(){
    if(!image.getAttribute('src'))image.src=premiumRoot+'articulation.webp';
  }
  function tile(ctx,name,x,y,w,h){
    const [sx,sy,sw,sh]=articulationParts[name];
    ctx.drawImage(image,sx,sy,sw,sh,x,y,w??sw,h??sh);
  }
  function local(ctx,name,point,angle,w,h,opacity,x=-w/2,y=-h/2){
    if(!ready()||opacity<=.003)return;
    ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);
    ctx.globalAlpha=opacity;
    tile(ctx,name,x,y,w,h);ctx.restore();
  }
  const facing=(a,b)=>Math.atan2(a.x-b.x,b.y-a.y);
  function limb(ctx,side,{shoulder,elbow,wrist},raise){
    const upper=facing(shoulder,elbow), lower=facing(elbow,wrist);
    const change=Math.atan2(Math.sin(lower-upper),Math.cos(lower-upper));
    const bend=Math.min(1,Math.abs(change)/1.9);
    local(ctx,'shoulder-'+side,shoulder,upper,26,29,.61);
    local(ctx,'binding-'+side,shoulder,upper*.25,7,23,.26+raise*.22,
      (side===0?11:-18),-11);
    local(ctx,'elbow-'+side,elbow,upper+change*.52,27,25,.36+bend*.53);
    local(ctx,'wrist-'+side,wrist,lower,18,17,.54);
  }
  const hand=document.createElement('canvas');hand.width=36;hand.height=42;
  const fingers=hand.getContext('2d');
  function paw(ctx,old,side,curl){
    if(!ready()||curl<.01){old();return;}
    // Blend silhouettes in an offscreen buffer so both shapes share one wrist origin.
    fingers.clearRect(0,0,36,42);
    fingers.globalCompositeOperation='source-over';
    fingers.globalAlpha=1-curl;
    old(fingers,18,13);
    fingers.globalCompositeOperation='lighter';
    fingers.globalAlpha=curl;
    tile(fingers,'curl-'+side,7,7,22,26);
    fingers.globalAlpha=1;
    fingers.globalCompositeOperation='source-over';
    ctx.drawImage(hand,-18,-13);
  }
  const tracks={
    watch:[[0,'neutral'],[200,'neutral-alert'],[850,'neutral-alert']],
    impact:[[0,'neutral-alert'],[198,'alert-surprise'],[366,'end-alert'],
      [1000,'end-alert'],[1230,'alert-surprise'],[1490,'neutral-alert'],[1690,'neutral']],
    win:[[0,'neutral'],[235,'neutral-alert'],[440,'alert-surprise'],[615,'surprise-joy'],
      [760,'end-joy'],[1460,'end-joy'],[1700,'surprise-joy'],[1900,'joy-neutral'],[2160,'neutral']]
  };
  function face(ctx,state,time,ease){
    const keys=tracks[state];
    if(!ready()||!keys)return;
    const index=keys.findIndex(pair=>time<pair[0]);
    const [left,right]=index===-1?[keys.at(-1),keys.at(-1)]:[keys[Math.max(0,index-1)],keys[index]];
    const blend=left[0]===right[0]?0:ease(left[0],right[0],time);
    paint.globalCompositeOperation='source-over';paint.clearRect(0,0,114,102);
    if(left[1]!=='neutral'){
      paint.globalAlpha=1-blend;tile(paint,left[1],0,0);
    }
    if(blend>0&&right[1]!=='neutral'){
      paint.globalCompositeOperation='lighter';paint.globalAlpha=blend;tile(paint,right[1],0,0);
    }
    paint.globalAlpha=1;paint.globalCompositeOperation='source-over';
    ctx.drawImage(patch,91,80);
  }
  return {load,decode:()=>image.decode(),ready,limb,paw,face,error:()=>error,set:value=>{enabled=value;}};
})();


const priorMochiRig=(()=>{
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=374;canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');
  document.querySelector('#cinematic-mochi').parentElement.append(canvas);
  const original=document.querySelector('#cinematic-mochi'),ctx=canvas.getContext('2d');
  const draw=(...args)=>finishSprites.draw(ctx,...args);
  let enabled=false,reaction=null,last=-1,draws=0,current='open';
  const events=[];
  const pawX=[[74,83,91,95],[153,151,160,143]];
  const eyelids=[1.6,5.3,5.7,10.6,14,19.3,22.7,27.6];
  function set(on){enabled=on;reaction=null;if(on)finishSprites.load();}
  function frame(now){
    if(reaction&&reduced())reaction=null;
    if(reaction?.end&&now>reaction.end)reaction=null;
    const shown=Boolean(enabled&&finishSprites.ready()&&!reduced()&&!document.hidden&&premium()&&!open.open&&(!active||reaction));
    if(shown===canvas.hidden){
      canvas.hidden=!shown;original.style.visibility=shown?'hidden':'';
    }
    const index=Math.floor(now*24/1000);
    if(!shown||last===index)return;
    last=index;
    const t=now/1000, phase=t%31.7;
    const breath=Math.sin(t*1.4)*1.05;
    const look=(reaction?.key==='watch'||(phase>3&&phase<5)||(phase>12&&phase<15));
    const blink=eyelids.find(at=>phase>=at&&phase<at+.25);
    const dt=reaction?(now-reaction.start)/1000:0;
    const impact=reaction?.key==='impact';
    const joy=reaction?.key==='win';
    let hands=0;
    if(impact||joy){
      const summit=joy?3:2;
      hands=dt<.13?1:dt<.79?summit:dt<.98?1:0;
    }
    current=joy&&dt<1?'joy':impact&&dt<.82?'alert':
      blink!==undefined?(Math.abs(phase-blink-.12)<.052?'closed':'half'):
      phase>24&&phase<27?'smile':'open';
    const recoil=impact?Math.sin(Math.PI*Math.min(1,dt/.85))*3:0;
    const nod=joy?Math.sin(Math.PI*Math.min(1,dt/1.1))*4:0;
    const headX=look?-3:recoil*.6, headY=breath-recoil-nod;
    ctx.clearRect(0,0,320,374);
    draw('torso',79,159+breath,172,207-breath);
    for(let side=0;side<2;side++){
      const pose=side===1&&hands>0&&dt<.18?1:hands;
      draw('paw-'+side+'-'+pose,pawX[side][pose],178+breath+(pose===3?2:0));
    }
    for(const [name,x,y,delay] of [['scarf-tail-far',157,184,.5],['scarf-tail-near',144,185,0]]){
      ctx.save(); ctx.translate(x,y);
      ctx.rotate(.036*Math.sin(t*2-delay)+.11*recoil*Math.sin(Math.min(dt,1)*7-delay));
      draw(name,-5,0);ctx.restore();
    }
    draw('scarf-knot',102,152+breath,117,56);
    draw('ear-far',32+headX,63+headY+1.3*Math.sin(t*1.88));
    draw('ear-near',188+headX,33+headY+1.7*Math.sin(t*2.31+.5));
    draw('face-'+current,33+headX,4+headY);
    draws++;
  }
  function act(key){
    if(!enabled||!finishSprites.ready()||reduced())return;
    const start=performance.now();
    reaction={key,start,end:key==='watch'?null:start+1230};
    events.push(key);
    if(events.length>30)events.shift();
  }
  return {set,frame,scatter:landed=>act(landed?'impact':'watch'),win:()=>act('win'),cancel:()=>{reaction=null;},
    idle:()=>enabled&&finishSprites.ready(),error:finishSprites.error,
    metrics:()=>({draws,loaded:finishSprites.ready(),visible:!canvas.hidden,error:finishSprites.error(),events:[...events],current})};
})();


/* Articulated Mochi acting proof. All articulation occurs on separated illustrations. */
const articulatedMochi=(()=>{
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=374;canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');
  document.querySelector('#cinematic-mochi').parentElement.append(canvas);
  const original=document.querySelector('#cinematic-mochi'), ctx=canvas.getContext('2d');
  const pieces=new Image();
  let enabled=false, clock=0, last=0, lastDraw=-1, scale=1, action=null, draws=0, error='';
  let focus=0, nextBlink=1850, blinkStart=-999, nextTwitch=4700, twitchStart=-999;
  let rng=9325, gazeAmount=0, nextLook=4450, lookUntil=0, lastFrame;
  const events=[];
  pieces.onerror=()=>{error='The motion artwork could not load.';};
  const ready=()=>pieces.naturalWidth>0&&finishSprites.ready();
  const bound=(x,min=0,max=1)=>Math.min(max,Math.max(min,x));
  const ease=(a,b,t)=>{
    const x=bound((t-a)/(b-a));return x*x*x*(10+x*(-15+x*6));
  };
  const envelope=(t,a,b,c,d)=>ease(a,b,t)*(1-ease(c,d,t));
  const mix=(a,b,t)=>a+(b-a)*t;
  const random=()=>{
    rng=(Math.imul(rng,1664525)+1013904223)>>>0;
    return rng/4294967296;
  };
  function atlasPart(name,x,y,w,h,destination=ctx){
    const [sx,sy,sw,sh]=motionParts[name];
    destination.drawImage(pieces,sx,sy,sw,sh,x,y,w,h);
  }
  function originalPart(name,x,y,w,h){finishSprites.draw(ctx,name,x,y,w,h);}
  function pivoted(draw,name,x,y,px,py,angle){
    ctx.save();
    ctx.translate(x+px,y+py);ctx.rotate(angle);
    draw(name,-px,-py);
    ctx.restore();
  }
  // Two fixed bone lengths. Select the outward elbow solution for each side.
  function solve(side,shoulder,wrist){
    const a=36,b=34, dx=wrist.x-shoulder.x,dy=wrist.y-shoulder.y;
    const length=Math.hypot(dx,dy)||1, distance=bound(length,14,69.4);
    const ux=dx/length,uy=dy/length;
    const along=(a*a+distance*distance-b*b)/(2*distance);
    const away=Math.sqrt(Math.max(0,a*a-along*along))*(side===0?1:-1);
    return {elbow:{x:shoulder.x+ux*along-uy*away,y:shoulder.y+uy*along+ux*away},
      wrist:{x:shoulder.x+ux*distance,y:shoulder.y+uy*distance}};
  }
  function segment(name,a,b,width,top,bottom){
    const dx=b.x-a.x,dy=b.y-a.y;
    ctx.save();
    ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(-dx,dy));
    atlasPart(name,-width/2,-top,width,Math.hypot(dx,dy)+top+bottom);
    ctx.restore();
  }
  function arm(side,breath,raise,anticipation,overshoot){
    const sign=side===0?1:-1;
    const shoulder={x:side===0?111:212,y:203+breath-anticipation*1.5};
    const target={x:mix(side===0?122:199,side===0?140:180,raise)+overshoot*sign,
      y:mix(side===0?271:269,222,raise)+breath*.65};
    const {elbow,wrist}=solve(side,shoulder,target);
    const turn=bound(Math.atan2(-(wrist.x-elbow.x),wrist.y-elbow.y),-1.5,1.5);
    segment('upper-'+side,shoulder,elbow,31,13,7);
    segment('lower-'+side,elbow,wrist,26,12,7);
    const joint={shoulder,elbow,wrist,turn,tilt:turn*.94-sign*.46*raise,curl:ease(.30,.95,raise)};
    articulation.limb(ctx,side,joint,raise);
    return joint;
  }
  function drawHand({wrist,tilt,curl},side){
    ctx.save();
    ctx.translate(wrist.x,wrist.y);ctx.rotate(tilt);
    articulation.paw(ctx,(target=ctx,x=0,y=0)=>atlasPart('hand-'+side,x-11,y-6,22,27,target),side,curl);
    ctx.restore();
  }  const apertures=[
    [[109,119],[116,118],[123,123],[127,132],[121,137],[111,139],[106,135],[107,125]],
    [[153,116],[159,109],[168,104],[180,106],[189,114],[192,122],[185,127],[173,130],[159,132],[152,129]],
  ];
  function eyes(amount,wide){
    const placement=[[106,118,22,22,110,120,12,16],[152,104,41,29,158,109,17,21]];
    for(let i=0;i<2;i++){
      const [x,y,w,h,ix,iy,iw,ih]=placement[i];
      ctx.save();
      ctx.beginPath();apertures[i].forEach(([a,b],n)=>n?ctx.lineTo(a,b):ctx.moveTo(a,b));
      ctx.closePath();ctx.clip();
      atlasPart('white-'+i,x,y,w,h);
      atlasPart('iris-'+i,ix+1-amount*(i===0?2.8:4.6),iy-wide*.7,iw-2,ih);
      ctx.restore();
    }
  }
  function update(t,dt){
    if(action?.type==='watch'&&t-action.start>1700)action=null;
    if(action&&action.type!=='watch'&&t-action.start>action.length){
      events.push({state:'idle',clock:Math.round(t)});
      action=null;
    }
    const time=action?t-action.start:0, win=action?.type==='win', impact=action?.type==='impact', watching=action?.type==='watch';
    const notice=watching?ease(0,155,time):impact?1-ease(880,1540,time):win?envelope(time,0,145,1100,1670):0;
    gazeAmount+=(notice-gazeAmount)*(1-Math.exp(-dt/57));
    const turn=watching?ease(105,510,time):impact?1-ease(960,1640,time):win?envelope(time,180,560,1040,1720):0;
    focus+=(turn-focus)*(1-Math.exp(-dt/96));
    if(t>=nextBlink&&(!action||watching&&time>790)){
      blinkStart=t;nextBlink=t+2550+random()*3110;
    }
    if(t>=nextTwitch){twitchStart=t;nextTwitch=t+5400+random()*4500;}
    if(t>=nextLook){lookUntil=t+680+random()*440;nextLook=t+5100+random()*3300;}
    const idleLook=lookUntil>0?envelope(t,lookUntil-880,lookUntil-660,lookUntil-380,lookUntil):0;
    const blink=t-blinkStart;
    const breath=Math.sin(t*Math.PI*2/3650)*1.13;
    const ears=impact?envelope(time,130,385,520,1150):win?envelope(time,400,745,960,1660):envelope(t-twitchStart,0,130,165,460)*.44;
    const anticipation=impact?envelope(time,140,390,490,1000):win?envelope(time,120,350,530,920):focus*.12;
    const paws=[0,1].map(side=>{
      const f=time-side*(win?57:44);
      const target=win?envelope(f,310,970,1140,2090):impact?envelope(f,230,860,1020,1740):0;
      return mix(action?.from[side]??0,target,ease(0,230,time));
    });
    const follow=impact?envelope(time,480,1090,1170,1660):win?envelope(time,540,1070,1190,2050):0;
    const expression=win&&time>540&&time<1620?'joy':impact&&time>330&&time<1210?'alert':
      blink<205?(blink>=56&&blink<110?'closed':'half'):'open';
    return {breath,ears,anticipation,paws,follow,expression,focus,
      gaze:bound(gazeAmount+idleLook*.52),time,win,impact};
  }
  function frame(now){
    const step=last?Math.min(now-last,65):0;
    last=now;
    const shown=Boolean(enabled&&ready()&&!reduced()&&!document.hidden&&premium()&&!open.open);
    if(shown===canvas.hidden){
      canvas.hidden=!shown;original.style.visibility=shown?'hidden':'';
    }
    if(!shown){if(reduced()||document.hidden)action=null;return;}
    clock+=step*scale;
    const state=update(clock,step*scale);
    const index=Math.floor(now*60/1000);
    if(lastDraw===index)return;
    lastDraw=index;
    const {breath,ears,anticipation,paws,follow,expression,gaze}=state;
    ctx.clearRect(0,0,320,374);
    originalPart('torso',79,159+breath,172,207-breath);
    const joints=paws.map((value,side)=>arm(side,breath,value,anticipation,follow*(state.win?2.8:1.5)));
    const cloth=.022*Math.sin(clock/680)+follow*.105;
    pivoted(originalPart,'scarf-tail-far',152,184+breath,5,0,cloth*.68);
    pivoted(originalPart,'scarf-tail-near',139,185+breath,5,0,cloth);
    originalPart('scarf-knot',102,152+breath,117,56);
    joints.forEach(drawHand);
    const hx=-4.2*state.focus,hy=breath+anticipation*1.65-state.follow;
    pivoted(originalPart,'ear-far',32+hx,63+hy,51,58,.058*ears);
    pivoted(originalPart,'ear-near',188+hx,33+hy,29,64,-.080*ears);
    ctx.save();
    ctx.translate(160+hx,178+hy);ctx.rotate(-.022*state.focus+.014*anticipation);
    ctx.translate(-160,-178);
    const useCorrections=articulation.ready()&&Boolean(action);
    const baseFace=useCorrections&&expression!=='half'&&expression!=='closed'?'open':expression;
    originalPart('face-'+baseFace,33,4);
    if(baseFace==='open'){
      eyes(gaze,anticipation);
      if(useCorrections)articulation.face(ctx,action.type,state.time,ease);
    }
    ctx.restore();
    lastFrame={joints,clock,state:action?.type||'idle',expression,gaze,paws};
    draws++;
  }
  function actionStart(type){
    if(!enabled||!ready()||reduced())return;
    action={type,start:clock,length:type==='win'?2220:1840,from:lastFrame?.paws??[0,0]};
    events.push({state:type,clock:Math.round(clock)});
    if(events.length>24)events.shift();
  }
  return {decode:()=>pieces.decode(),set(on){enabled=on;last=0;if(on){articulation.load();finishSprites.load();if(!pieces.getAttribute('src'))pieces.src=premiumRoot+'motion-parts.webp';}
      else action=null;}, frame, scatter:landed=>actionStart(landed?'impact':'watch'),
    win:()=>actionStart('win'),cancel:()=>{action=null;},idle:()=>enabled&&ready(),
    error:()=>error||articulation.error()||finishSprites.error(),speed:value=>{scale=value;},
    metrics:()=>({visible:!canvas.hidden,draws,ready:ready(),events:[...events],lastFrame,scale})};
})();

const mochiRig=(()=>{
  let legacy=false, enabled=false;
  const select=()=>legacy?priorMochiRig:articulatedMochi;
  return {
    set(on){enabled=on;select().set(on);},
    legacy(on){
      if(legacy===on)return;
      select().set(false);select().frame(performance.now());
      legacy=on;select().set(enabled);
    },
    frame:time=>select().frame(time),
    scatter:value=>select().scatter(value),
    win:()=>select().win(),
    cancel:()=>select().cancel(),
    idle:()=>select().idle(),
    error:()=>select().error(),
    speed:value=>articulatedMochi.speed(value),
    metrics:()=>({...select().metrics(),legacy})
  };
})();







articulatedMochi.set(true);
window.premiumCharacterLoads.push(Promise.all([finishSprites.decode(),articulatedMochi.decode(),articulation.decode()]));
window.addEventListener('premium-pose',event=>{
 const name=event.detail;
 if(['ready','watch','curious'].includes(name))articulatedMochi.scatter(false);
 if(['bonus','epic'].includes(name))articulatedMochi.scatter(true);
 if(['win','big','mega','complete'].includes(name))articulatedMochi.win();
});
document.querySelector('#board').addEventListener('scatter-landed',()=>articulatedMochi.scatter(true));
function tick(time){articulatedMochi.frame(time);requestAnimationFrame(tick);}
requestAnimationFrame(tick);
})();


(()=>{
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.motion==='instant';
const premium=()=>true;
const open={get open(){return !document.querySelector('#win-mochi').closest('dialog')?.open;}};
const active=null;
const currentMochiFrame=0;
const finishArt = {
  "face-open": [
    2,
    2,
    255,
    194
  ],
  "face-half": [
    261,
    2,
    255,
    194
  ],
  "face-closed": [
    520,
    2,
    255,
    194
  ],
  "face-smile": [
    2,
    200,
    255,
    194
  ],
  "face-alert": [
    261,
    200,
    255,
    194
  ],
  "face-joy": [
    520,
    200,
    255,
    194
  ],
  "torso": [
    779,
    200,
    172,
    207
  ],
  "paw-0-0": [
    2,
    411,
    99,
    130
  ],
  "paw-0-1": [
    105,
    411,
    99,
    130
  ],
  "paw-0-2": [
    208,
    411,
    99,
    130
  ],
  "paw-0-3": [
    311,
    411,
    99,
    130
  ],
  "paw-1-0": [
    414,
    411,
    99,
    130
  ],
  "paw-1-1": [
    517,
    411,
    99,
    130
  ],
  "paw-1-2": [
    620,
    411,
    99,
    130
  ],
  "paw-1-3": [
    723,
    411,
    99,
    130
  ],
  "ear-near": [
    826,
    411,
    104,
    101
  ],
  "ear-far": [
    934,
    411,
    78,
    93
  ],
  "scarf-knot": [
    2,
    545,
    123,
    55
  ],
  "scarf-tail-near": [
    129,
    545,
    42,
    64
  ],
  "scarf-tail-far": [
    175,
    545,
    40,
    62
  ],
  "water-vein": [
    219,
    545,
    125,
    282
  ],
  "whitewater": [
    348,
    545,
    171,
    51
  ],
  "pool-ripples": [
    523,
    545,
    180,
    52
  ]
};

const finishSprites=(()=>{
  const image=new Image();
  let failed=false;
  image.onerror=()=>{failed=true;};
  function load(){if(!image.getAttribute('src'))image.src=premiumRoot+'finish.webp';}
  function draw(ctx,name,x,y,w,h){
    const [sx,sy,sw,sh]=finishArt[name];
    ctx.drawImage(image,sx,sy,sw,sh,x,y,w??sw,h??sh);
  }
  return {load,decode:()=>image.decode(),draw,ready:()=>image.naturalWidth>0,error:()=>failed?'Finishing artwork could not load.':''};
})();


const motionParts = {
  "upper-0": [
    2,
    2,
    70,
    110
  ],
  "lower-0": [
    78,
    2,
    64,
    102
  ],
  "hand-0": [
    154,
    2,
    56,
    66
  ],
  "upper-1": [
    2,
    117,
    70,
    110
  ],
  "lower-1": [
    78,
    117,
    64,
    102
  ],
  "hand-1": [
    154,
    117,
    56,
    66
  ],
  "white-0": [
    237,
    2,
    43,
    42
  ],
  "white-1": [
    288,
    2,
    75,
    51
  ],
  "iris-0": [
    238,
    66,
    30,
    39
  ],
  "iris-1": [
    282,
    66,
    32,
    41
  ]
};

const articulationParts = {
  "shoulder-0": [
    4,
    4,
    54,
    55
  ],
  "binding-0": [
    74,
    4,
    23,
    53
  ],
  "elbow-0": [
    144,
    4,
    56,
    55
  ],
  "wrist-0": [
    214,
    4,
    46,
    42
  ],
  "curl-0": [
    284,
    4,
    52,
    59
  ],
  "shoulder-1": [
    4,
    69,
    54,
    55
  ],
  "binding-1": [
    74,
    69,
    23,
    53
  ],
  "elbow-1": [
    144,
    69,
    56,
    55
  ],
  "wrist-1": [
    214,
    69,
    46,
    42
  ],
  "curl-1": [
    284,
    69,
    52,
    59
  ],
  "neutral-alert": [
    3,
    141,
    114,
    102
  ],
  "alert-surprise": [
    129,
    141,
    114,
    102
  ],
  "surprise-joy": [
    255,
    141,
    114,
    102
  ],
  "joy-neutral": [
    381,
    141,
    114,
    102
  ],
  "end-alert": [
    3,
    255,
    114,
    102
  ],
  "end-joy": [
    129,
    255,
    114,
    102
  ]
};

/* Registered paint corrections, controlled by the existing action clock and joints. */
const articulation=(()=>{
  const image=new Image(), patch=document.createElement('canvas');
  patch.width=114;patch.height=102;
  const paint=patch.getContext('2d');
  let enabled=true, error='';
  image.onerror=()=>{error='Corrective artwork could not load. Showing the previous motion art.';};
  const ready=()=>enabled&&image.naturalWidth>0;
  function load(){
    if(!image.getAttribute('src'))image.src=premiumRoot+'articulation.webp';
  }
  function tile(ctx,name,x,y,w,h){
    const [sx,sy,sw,sh]=articulationParts[name];
    ctx.drawImage(image,sx,sy,sw,sh,x,y,w??sw,h??sh);
  }
  function local(ctx,name,point,angle,w,h,opacity,x=-w/2,y=-h/2){
    if(!ready()||opacity<=.003)return;
    ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);
    ctx.globalAlpha=opacity;
    tile(ctx,name,x,y,w,h);ctx.restore();
  }
  const facing=(a,b)=>Math.atan2(a.x-b.x,b.y-a.y);
  function limb(ctx,side,{shoulder,elbow,wrist},raise){
    const upper=facing(shoulder,elbow), lower=facing(elbow,wrist);
    const change=Math.atan2(Math.sin(lower-upper),Math.cos(lower-upper));
    const bend=Math.min(1,Math.abs(change)/1.9);
    local(ctx,'shoulder-'+side,shoulder,upper,26,29,.61);
    local(ctx,'binding-'+side,shoulder,upper*.25,7,23,.26+raise*.22,
      (side===0?11:-18),-11);
    local(ctx,'elbow-'+side,elbow,upper+change*.52,27,25,.36+bend*.53);
    local(ctx,'wrist-'+side,wrist,lower,18,17,.54);
  }
  const hand=document.createElement('canvas');hand.width=36;hand.height=42;
  const fingers=hand.getContext('2d');
  function paw(ctx,old,side,curl){
    if(!ready()||curl<.01){old();return;}
    // Blend silhouettes in an offscreen buffer so both shapes share one wrist origin.
    fingers.clearRect(0,0,36,42);
    fingers.globalCompositeOperation='source-over';
    fingers.globalAlpha=1-curl;
    old(fingers,18,13);
    fingers.globalCompositeOperation='lighter';
    fingers.globalAlpha=curl;
    tile(fingers,'curl-'+side,7,7,22,26);
    fingers.globalAlpha=1;
    fingers.globalCompositeOperation='source-over';
    ctx.drawImage(hand,-18,-13);
  }
  const tracks={
    watch:[[0,'neutral'],[200,'neutral-alert'],[850,'neutral-alert']],
    impact:[[0,'neutral-alert'],[198,'alert-surprise'],[366,'end-alert'],
      [1000,'end-alert'],[1230,'alert-surprise'],[1490,'neutral-alert'],[1690,'neutral']],
    win:[[0,'neutral'],[235,'neutral-alert'],[440,'alert-surprise'],[615,'surprise-joy'],
      [760,'end-joy'],[1460,'end-joy'],[1700,'surprise-joy'],[1900,'joy-neutral'],[2160,'neutral']]
  };
  function face(ctx,state,time,ease){
    const keys=tracks[state];
    if(!ready()||!keys)return;
    const index=keys.findIndex(pair=>time<pair[0]);
    const [left,right]=index===-1?[keys.at(-1),keys.at(-1)]:[keys[Math.max(0,index-1)],keys[index]];
    const blend=left[0]===right[0]?0:ease(left[0],right[0],time);
    paint.globalCompositeOperation='source-over';paint.clearRect(0,0,114,102);
    if(left[1]!=='neutral'){
      paint.globalAlpha=1-blend;tile(paint,left[1],0,0);
    }
    if(blend>0&&right[1]!=='neutral'){
      paint.globalCompositeOperation='lighter';paint.globalAlpha=blend;tile(paint,right[1],0,0);
    }
    paint.globalAlpha=1;paint.globalCompositeOperation='source-over';
    ctx.drawImage(patch,91,80);
  }
  return {load,decode:()=>image.decode(),ready,limb,paw,face,error:()=>error,set:value=>{enabled=value;}};
})();


const priorMochiRig=(()=>{
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=374;canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');
  document.querySelector('#win-mochi').parentElement.append(canvas);
  const original=document.querySelector('#win-mochi'),ctx=canvas.getContext('2d');
  const draw=(...args)=>finishSprites.draw(ctx,...args);
  let enabled=false,reaction=null,last=-1,draws=0,current='open';
  const events=[];
  const pawX=[[74,83,91,95],[153,151,160,143]];
  const eyelids=[1.6,5.3,5.7,10.6,14,19.3,22.7,27.6];
  function set(on){enabled=on;reaction=null;if(on)finishSprites.load();}
  function frame(now){
    if(reaction&&reduced())reaction=null;
    if(reaction?.end&&now>reaction.end)reaction=null;
    const shown=Boolean(enabled&&finishSprites.ready()&&!reduced()&&!document.hidden&&premium()&&!open.open&&(!active||reaction));
    if(shown===canvas.hidden){
      canvas.hidden=!shown;original.style.visibility=shown?'hidden':'';
    }
    const index=Math.floor(now*24/1000);
    if(!shown||last===index)return;
    last=index;
    const t=now/1000, phase=t%31.7;
    const breath=Math.sin(t*1.4)*1.05;
    const look=(reaction?.key==='watch'||(phase>3&&phase<5)||(phase>12&&phase<15));
    const blink=eyelids.find(at=>phase>=at&&phase<at+.25);
    const dt=reaction?(now-reaction.start)/1000:0;
    const impact=reaction?.key==='impact';
    const joy=reaction?.key==='win';
    let hands=0;
    if(impact||joy){
      const summit=joy?3:2;
      hands=dt<.13?1:dt<.79?summit:dt<.98?1:0;
    }
    current=joy&&dt<1?'joy':impact&&dt<.82?'alert':
      blink!==undefined?(Math.abs(phase-blink-.12)<.052?'closed':'half'):
      phase>24&&phase<27?'smile':'open';
    const recoil=impact?Math.sin(Math.PI*Math.min(1,dt/.85))*3:0;
    const nod=joy?Math.sin(Math.PI*Math.min(1,dt/1.1))*4:0;
    const headX=look?-3:recoil*.6, headY=breath-recoil-nod;
    ctx.clearRect(0,0,320,374);
    draw('torso',79,159+breath,172,207-breath);
    for(let side=0;side<2;side++){
      const pose=side===1&&hands>0&&dt<.18?1:hands;
      draw('paw-'+side+'-'+pose,pawX[side][pose],178+breath+(pose===3?2:0));
    }
    for(const [name,x,y,delay] of [['scarf-tail-far',157,184,.5],['scarf-tail-near',144,185,0]]){
      ctx.save(); ctx.translate(x,y);
      ctx.rotate(.036*Math.sin(t*2-delay)+.11*recoil*Math.sin(Math.min(dt,1)*7-delay));
      draw(name,-5,0);ctx.restore();
    }
    draw('scarf-knot',102,152+breath,117,56);
    draw('ear-far',32+headX,63+headY+1.3*Math.sin(t*1.88));
    draw('ear-near',188+headX,33+headY+1.7*Math.sin(t*2.31+.5));
    draw('face-'+current,33+headX,4+headY);
    draws++;
  }
  function act(key){
    if(!enabled||!finishSprites.ready()||reduced())return;
    const start=performance.now();
    reaction={key,start,end:key==='watch'?null:start+1230};
    events.push(key);
    if(events.length>30)events.shift();
  }
  return {set,frame,scatter:landed=>act(landed?'impact':'watch'),win:()=>act('win'),cancel:()=>{reaction=null;},
    idle:()=>enabled&&finishSprites.ready(),error:finishSprites.error,
    metrics:()=>({draws,loaded:finishSprites.ready(),visible:!canvas.hidden,error:finishSprites.error(),events:[...events],current})};
})();


/* Articulated Mochi acting proof. All articulation occurs on separated illustrations. */
const articulatedMochi=(()=>{
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=374;canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');
  document.querySelector('#win-mochi').parentElement.append(canvas);
  const original=document.querySelector('#win-mochi'), ctx=canvas.getContext('2d');
  const pieces=new Image();
  let enabled=false, clock=0, last=0, lastDraw=-1, scale=1, action=null, draws=0, error='';
  let focus=0, nextBlink=1850, blinkStart=-999, nextTwitch=4700, twitchStart=-999;
  let rng=9325, gazeAmount=0, nextLook=4450, lookUntil=0, lastFrame;
  const events=[];
  pieces.onerror=()=>{error='The motion artwork could not load.';};
  const ready=()=>pieces.naturalWidth>0&&finishSprites.ready();
  const bound=(x,min=0,max=1)=>Math.min(max,Math.max(min,x));
  const ease=(a,b,t)=>{
    const x=bound((t-a)/(b-a));return x*x*x*(10+x*(-15+x*6));
  };
  const envelope=(t,a,b,c,d)=>ease(a,b,t)*(1-ease(c,d,t));
  const mix=(a,b,t)=>a+(b-a)*t;
  const random=()=>{
    rng=(Math.imul(rng,1664525)+1013904223)>>>0;
    return rng/4294967296;
  };
  function atlasPart(name,x,y,w,h,destination=ctx){
    const [sx,sy,sw,sh]=motionParts[name];
    destination.drawImage(pieces,sx,sy,sw,sh,x,y,w,h);
  }
  function originalPart(name,x,y,w,h){finishSprites.draw(ctx,name,x,y,w,h);}
  function pivoted(draw,name,x,y,px,py,angle){
    ctx.save();
    ctx.translate(x+px,y+py);ctx.rotate(angle);
    draw(name,-px,-py);
    ctx.restore();
  }
  // Two fixed bone lengths. Select the outward elbow solution for each side.
  function solve(side,shoulder,wrist){
    const a=36,b=34, dx=wrist.x-shoulder.x,dy=wrist.y-shoulder.y;
    const length=Math.hypot(dx,dy)||1, distance=bound(length,14,69.4);
    const ux=dx/length,uy=dy/length;
    const along=(a*a+distance*distance-b*b)/(2*distance);
    const away=Math.sqrt(Math.max(0,a*a-along*along))*(side===0?1:-1);
    return {elbow:{x:shoulder.x+ux*along-uy*away,y:shoulder.y+uy*along+ux*away},
      wrist:{x:shoulder.x+ux*distance,y:shoulder.y+uy*distance}};
  }
  function segment(name,a,b,width,top,bottom){
    const dx=b.x-a.x,dy=b.y-a.y;
    ctx.save();
    ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(-dx,dy));
    atlasPart(name,-width/2,-top,width,Math.hypot(dx,dy)+top+bottom);
    ctx.restore();
  }
  function arm(side,breath,raise,anticipation,overshoot){
    const sign=side===0?1:-1;
    const shoulder={x:side===0?111:212,y:203+breath-anticipation*1.5};
    const target={x:mix(side===0?122:199,side===0?140:180,raise)+overshoot*sign,
      y:mix(side===0?271:269,222,raise)+breath*.65};
    const {elbow,wrist}=solve(side,shoulder,target);
    const turn=bound(Math.atan2(-(wrist.x-elbow.x),wrist.y-elbow.y),-1.5,1.5);
    segment('upper-'+side,shoulder,elbow,31,13,7);
    segment('lower-'+side,elbow,wrist,26,12,7);
    const joint={shoulder,elbow,wrist,turn,tilt:turn*.94-sign*.46*raise,curl:ease(.30,.95,raise)};
    articulation.limb(ctx,side,joint,raise);
    return joint;
  }
  function drawHand({wrist,tilt,curl},side){
    ctx.save();
    ctx.translate(wrist.x,wrist.y);ctx.rotate(tilt);
    articulation.paw(ctx,(target=ctx,x=0,y=0)=>atlasPart('hand-'+side,x-11,y-6,22,27,target),side,curl);
    ctx.restore();
  }  const apertures=[
    [[109,119],[116,118],[123,123],[127,132],[121,137],[111,139],[106,135],[107,125]],
    [[153,116],[159,109],[168,104],[180,106],[189,114],[192,122],[185,127],[173,130],[159,132],[152,129]],
  ];
  function eyes(amount,wide){
    const placement=[[106,118,22,22,110,120,12,16],[152,104,41,29,158,109,17,21]];
    for(let i=0;i<2;i++){
      const [x,y,w,h,ix,iy,iw,ih]=placement[i];
      ctx.save();
      ctx.beginPath();apertures[i].forEach(([a,b],n)=>n?ctx.lineTo(a,b):ctx.moveTo(a,b));
      ctx.closePath();ctx.clip();
      atlasPart('white-'+i,x,y,w,h);
      atlasPart('iris-'+i,ix+1-amount*(i===0?2.8:4.6),iy-wide*.7,iw-2,ih);
      ctx.restore();
    }
  }
  function update(t,dt){
    if(action?.type==='watch'&&t-action.start>1700)action=null;
    if(action&&action.type!=='watch'&&t-action.start>action.length){
      events.push({state:'idle',clock:Math.round(t)});
      action=null;
    }
    const time=action?t-action.start:0, win=action?.type==='win', impact=action?.type==='impact', watching=action?.type==='watch';
    const notice=watching?ease(0,155,time):impact?1-ease(880,1540,time):win?envelope(time,0,145,1100,1670):0;
    gazeAmount+=(notice-gazeAmount)*(1-Math.exp(-dt/57));
    const turn=watching?ease(105,510,time):impact?1-ease(960,1640,time):win?envelope(time,180,560,1040,1720):0;
    focus+=(turn-focus)*(1-Math.exp(-dt/96));
    if(t>=nextBlink&&(!action||watching&&time>790)){
      blinkStart=t;nextBlink=t+2550+random()*3110;
    }
    if(t>=nextTwitch){twitchStart=t;nextTwitch=t+5400+random()*4500;}
    if(t>=nextLook){lookUntil=t+680+random()*440;nextLook=t+5100+random()*3300;}
    const idleLook=lookUntil>0?envelope(t,lookUntil-880,lookUntil-660,lookUntil-380,lookUntil):0;
    const blink=t-blinkStart;
    const breath=Math.sin(t*Math.PI*2/3650)*1.13;
    const ears=impact?envelope(time,130,385,520,1150):win?envelope(time,400,745,960,1660):envelope(t-twitchStart,0,130,165,460)*.44;
    const anticipation=impact?envelope(time,140,390,490,1000):win?envelope(time,120,350,530,920):focus*.12;
    const paws=[0,1].map(side=>{
      const f=time-side*(win?57:44);
      const target=win?envelope(f,310,970,1140,2090):impact?envelope(f,230,860,1020,1740):0;
      return mix(action?.from[side]??0,target,ease(0,230,time));
    });
    const follow=impact?envelope(time,480,1090,1170,1660):win?envelope(time,540,1070,1190,2050):0;
    const expression=win&&time>540&&time<1620?'joy':impact&&time>330&&time<1210?'alert':
      blink<205?(blink>=56&&blink<110?'closed':'half'):'open';
    return {breath,ears,anticipation,paws,follow,expression,focus,
      gaze:bound(gazeAmount+idleLook*.52),time,win,impact};
  }
  function frame(now){
    const step=last?Math.min(now-last,65):0;
    last=now;
    const shown=Boolean(enabled&&ready()&&!reduced()&&!document.hidden&&premium()&&!open.open);
    if(shown===canvas.hidden){
      canvas.hidden=!shown;original.style.visibility=shown?'hidden':'';
    }
    if(!shown){if(reduced()||document.hidden)action=null;return;}
    clock+=step*scale;
    const state=update(clock,step*scale);
    const index=Math.floor(now*60/1000);
    if(lastDraw===index)return;
    lastDraw=index;
    const {breath,ears,anticipation,paws,follow,expression,gaze}=state;
    ctx.clearRect(0,0,320,374);
    originalPart('torso',79,159+breath,172,207-breath);
    const joints=paws.map((value,side)=>arm(side,breath,value,anticipation,follow*(state.win?2.8:1.5)));
    const cloth=.022*Math.sin(clock/680)+follow*.105;
    pivoted(originalPart,'scarf-tail-far',152,184+breath,5,0,cloth*.68);
    pivoted(originalPart,'scarf-tail-near',139,185+breath,5,0,cloth);
    originalPart('scarf-knot',102,152+breath,117,56);
    joints.forEach(drawHand);
    const hx=-4.2*state.focus,hy=breath+anticipation*1.65-state.follow;
    pivoted(originalPart,'ear-far',32+hx,63+hy,51,58,.058*ears);
    pivoted(originalPart,'ear-near',188+hx,33+hy,29,64,-.080*ears);
    ctx.save();
    ctx.translate(160+hx,178+hy);ctx.rotate(-.022*state.focus+.014*anticipation);
    ctx.translate(-160,-178);
    const useCorrections=articulation.ready()&&Boolean(action);
    const baseFace=useCorrections&&expression!=='half'&&expression!=='closed'?'open':expression;
    originalPart('face-'+baseFace,33,4);
    if(baseFace==='open'){
      eyes(gaze,anticipation);
      if(useCorrections)articulation.face(ctx,action.type,state.time,ease);
    }
    ctx.restore();
    lastFrame={joints,clock,state:action?.type||'idle',expression,gaze,paws};
    draws++;
  }
  function actionStart(type){
    if(!enabled||!ready()||reduced())return;
    action={type,start:clock,length:type==='win'?2220:1840,from:lastFrame?.paws??[0,0]};
    events.push({state:type,clock:Math.round(clock)});
    if(events.length>24)events.shift();
  }
  return {decode:()=>pieces.decode(),set(on){enabled=on;last=0;if(on){articulation.load();finishSprites.load();if(!pieces.getAttribute('src'))pieces.src=premiumRoot+'motion-parts.webp';}
      else action=null;}, frame, scatter:landed=>actionStart(landed?'impact':'watch'),
    win:()=>actionStart('win'),cancel:()=>{action=null;},idle:()=>enabled&&ready(),
    error:()=>error||articulation.error()||finishSprites.error(),speed:value=>{scale=value;},
    metrics:()=>({visible:!canvas.hidden,draws,ready:ready(),events:[...events],lastFrame,scale})};
})();

const mochiRig=(()=>{
  let legacy=false, enabled=false;
  const select=()=>legacy?priorMochiRig:articulatedMochi;
  return {
    set(on){enabled=on;select().set(on);},
    legacy(on){
      if(legacy===on)return;
      select().set(false);select().frame(performance.now());
      legacy=on;select().set(enabled);
    },
    frame:time=>select().frame(time),
    scatter:value=>select().scatter(value),
    win:()=>select().win(),
    cancel:()=>select().cancel(),
    idle:()=>select().idle(),
    error:()=>select().error(),
    speed:value=>articulatedMochi.speed(value),
    metrics:()=>({...select().metrics(),legacy})
  };
})();







articulatedMochi.set(true);
window.premiumCharacterLoads.push(Promise.all([finishSprites.decode(),articulatedMochi.decode(),articulation.decode()]));
window.addEventListener('premium-pose',event=>{
 const name=event.detail;
 if(['ready','watch','curious'].includes(name))articulatedMochi.scatter(false);
 if(['bonus','epic'].includes(name))articulatedMochi.scatter(true);
 if(['win','big','mega','complete'].includes(name))articulatedMochi.win();
});
document.querySelector('#board').addEventListener('scatter-landed',()=>articulatedMochi.scatter(true));
function tick(time){articulatedMochi.frame(time);requestAnimationFrame(tick);}
requestAnimationFrame(tick);
})();


(()=>{
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.motion==='instant';
const premium=()=>true;
const open={get open(){return !document.querySelector('#welcome-mochi').closest('dialog')?.open;}};
const active=null;
const currentMochiFrame=0;
const finishArt = {
  "face-open": [
    2,
    2,
    255,
    194
  ],
  "face-half": [
    261,
    2,
    255,
    194
  ],
  "face-closed": [
    520,
    2,
    255,
    194
  ],
  "face-smile": [
    2,
    200,
    255,
    194
  ],
  "face-alert": [
    261,
    200,
    255,
    194
  ],
  "face-joy": [
    520,
    200,
    255,
    194
  ],
  "torso": [
    779,
    200,
    172,
    207
  ],
  "paw-0-0": [
    2,
    411,
    99,
    130
  ],
  "paw-0-1": [
    105,
    411,
    99,
    130
  ],
  "paw-0-2": [
    208,
    411,
    99,
    130
  ],
  "paw-0-3": [
    311,
    411,
    99,
    130
  ],
  "paw-1-0": [
    414,
    411,
    99,
    130
  ],
  "paw-1-1": [
    517,
    411,
    99,
    130
  ],
  "paw-1-2": [
    620,
    411,
    99,
    130
  ],
  "paw-1-3": [
    723,
    411,
    99,
    130
  ],
  "ear-near": [
    826,
    411,
    104,
    101
  ],
  "ear-far": [
    934,
    411,
    78,
    93
  ],
  "scarf-knot": [
    2,
    545,
    123,
    55
  ],
  "scarf-tail-near": [
    129,
    545,
    42,
    64
  ],
  "scarf-tail-far": [
    175,
    545,
    40,
    62
  ],
  "water-vein": [
    219,
    545,
    125,
    282
  ],
  "whitewater": [
    348,
    545,
    171,
    51
  ],
  "pool-ripples": [
    523,
    545,
    180,
    52
  ]
};

const finishSprites=(()=>{
  const image=new Image();
  let failed=false;
  image.onerror=()=>{failed=true;};
  function load(){if(!image.getAttribute('src'))image.src=premiumRoot+'finish.webp';}
  function draw(ctx,name,x,y,w,h){
    const [sx,sy,sw,sh]=finishArt[name];
    ctx.drawImage(image,sx,sy,sw,sh,x,y,w??sw,h??sh);
  }
  return {load,decode:()=>image.decode(),draw,ready:()=>image.naturalWidth>0,error:()=>failed?'Finishing artwork could not load.':''};
})();


const motionParts = {
  "upper-0": [
    2,
    2,
    70,
    110
  ],
  "lower-0": [
    78,
    2,
    64,
    102
  ],
  "hand-0": [
    154,
    2,
    56,
    66
  ],
  "upper-1": [
    2,
    117,
    70,
    110
  ],
  "lower-1": [
    78,
    117,
    64,
    102
  ],
  "hand-1": [
    154,
    117,
    56,
    66
  ],
  "white-0": [
    237,
    2,
    43,
    42
  ],
  "white-1": [
    288,
    2,
    75,
    51
  ],
  "iris-0": [
    238,
    66,
    30,
    39
  ],
  "iris-1": [
    282,
    66,
    32,
    41
  ]
};

const articulationParts = {
  "shoulder-0": [
    4,
    4,
    54,
    55
  ],
  "binding-0": [
    74,
    4,
    23,
    53
  ],
  "elbow-0": [
    144,
    4,
    56,
    55
  ],
  "wrist-0": [
    214,
    4,
    46,
    42
  ],
  "curl-0": [
    284,
    4,
    52,
    59
  ],
  "shoulder-1": [
    4,
    69,
    54,
    55
  ],
  "binding-1": [
    74,
    69,
    23,
    53
  ],
  "elbow-1": [
    144,
    69,
    56,
    55
  ],
  "wrist-1": [
    214,
    69,
    46,
    42
  ],
  "curl-1": [
    284,
    69,
    52,
    59
  ],
  "neutral-alert": [
    3,
    141,
    114,
    102
  ],
  "alert-surprise": [
    129,
    141,
    114,
    102
  ],
  "surprise-joy": [
    255,
    141,
    114,
    102
  ],
  "joy-neutral": [
    381,
    141,
    114,
    102
  ],
  "end-alert": [
    3,
    255,
    114,
    102
  ],
  "end-joy": [
    129,
    255,
    114,
    102
  ]
};

/* Registered paint corrections, controlled by the existing action clock and joints. */
const articulation=(()=>{
  const image=new Image(), patch=document.createElement('canvas');
  patch.width=114;patch.height=102;
  const paint=patch.getContext('2d');
  let enabled=true, error='';
  image.onerror=()=>{error='Corrective artwork could not load. Showing the previous motion art.';};
  const ready=()=>enabled&&image.naturalWidth>0;
  function load(){
    if(!image.getAttribute('src'))image.src=premiumRoot+'articulation.webp';
  }
  function tile(ctx,name,x,y,w,h){
    const [sx,sy,sw,sh]=articulationParts[name];
    ctx.drawImage(image,sx,sy,sw,sh,x,y,w??sw,h??sh);
  }
  function local(ctx,name,point,angle,w,h,opacity,x=-w/2,y=-h/2){
    if(!ready()||opacity<=.003)return;
    ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);
    ctx.globalAlpha=opacity;
    tile(ctx,name,x,y,w,h);ctx.restore();
  }
  const facing=(a,b)=>Math.atan2(a.x-b.x,b.y-a.y);
  function limb(ctx,side,{shoulder,elbow,wrist},raise){
    const upper=facing(shoulder,elbow), lower=facing(elbow,wrist);
    const change=Math.atan2(Math.sin(lower-upper),Math.cos(lower-upper));
    const bend=Math.min(1,Math.abs(change)/1.9);
    local(ctx,'shoulder-'+side,shoulder,upper,26,29,.61);
    local(ctx,'binding-'+side,shoulder,upper*.25,7,23,.26+raise*.22,
      (side===0?11:-18),-11);
    local(ctx,'elbow-'+side,elbow,upper+change*.52,27,25,.36+bend*.53);
    local(ctx,'wrist-'+side,wrist,lower,18,17,.54);
  }
  const hand=document.createElement('canvas');hand.width=36;hand.height=42;
  const fingers=hand.getContext('2d');
  function paw(ctx,old,side,curl){
    if(!ready()||curl<.01){old();return;}
    // Blend silhouettes in an offscreen buffer so both shapes share one wrist origin.
    fingers.clearRect(0,0,36,42);
    fingers.globalCompositeOperation='source-over';
    fingers.globalAlpha=1-curl;
    old(fingers,18,13);
    fingers.globalCompositeOperation='lighter';
    fingers.globalAlpha=curl;
    tile(fingers,'curl-'+side,7,7,22,26);
    fingers.globalAlpha=1;
    fingers.globalCompositeOperation='source-over';
    ctx.drawImage(hand,-18,-13);
  }
  const tracks={
    watch:[[0,'neutral'],[200,'neutral-alert'],[850,'neutral-alert']],
    impact:[[0,'neutral-alert'],[198,'alert-surprise'],[366,'end-alert'],
      [1000,'end-alert'],[1230,'alert-surprise'],[1490,'neutral-alert'],[1690,'neutral']],
    win:[[0,'neutral'],[235,'neutral-alert'],[440,'alert-surprise'],[615,'surprise-joy'],
      [760,'end-joy'],[1460,'end-joy'],[1700,'surprise-joy'],[1900,'joy-neutral'],[2160,'neutral']]
  };
  function face(ctx,state,time,ease){
    const keys=tracks[state];
    if(!ready()||!keys)return;
    const index=keys.findIndex(pair=>time<pair[0]);
    const [left,right]=index===-1?[keys.at(-1),keys.at(-1)]:[keys[Math.max(0,index-1)],keys[index]];
    const blend=left[0]===right[0]?0:ease(left[0],right[0],time);
    paint.globalCompositeOperation='source-over';paint.clearRect(0,0,114,102);
    if(left[1]!=='neutral'){
      paint.globalAlpha=1-blend;tile(paint,left[1],0,0);
    }
    if(blend>0&&right[1]!=='neutral'){
      paint.globalCompositeOperation='lighter';paint.globalAlpha=blend;tile(paint,right[1],0,0);
    }
    paint.globalAlpha=1;paint.globalCompositeOperation='source-over';
    ctx.drawImage(patch,91,80);
  }
  return {load,decode:()=>image.decode(),ready,limb,paw,face,error:()=>error,set:value=>{enabled=value;}};
})();


const priorMochiRig=(()=>{
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=374;canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');
  document.querySelector('#welcome-mochi').parentElement.append(canvas);
  const original=document.querySelector('#welcome-mochi'),ctx=canvas.getContext('2d');
  const draw=(...args)=>finishSprites.draw(ctx,...args);
  let enabled=false,reaction=null,last=-1,draws=0,current='open';
  const events=[];
  const pawX=[[74,83,91,95],[153,151,160,143]];
  const eyelids=[1.6,5.3,5.7,10.6,14,19.3,22.7,27.6];
  function set(on){enabled=on;reaction=null;if(on)finishSprites.load();}
  function frame(now){
    if(reaction&&reduced())reaction=null;
    if(reaction?.end&&now>reaction.end)reaction=null;
    const shown=Boolean(enabled&&finishSprites.ready()&&!reduced()&&!document.hidden&&premium()&&!open.open&&(!active||reaction));
    if(shown===canvas.hidden){
      canvas.hidden=!shown;original.style.visibility=shown?'hidden':'';
    }
    const index=Math.floor(now*24/1000);
    if(!shown||last===index)return;
    last=index;
    const t=now/1000, phase=t%31.7;
    const breath=Math.sin(t*1.4)*1.05;
    const look=(reaction?.key==='watch'||(phase>3&&phase<5)||(phase>12&&phase<15));
    const blink=eyelids.find(at=>phase>=at&&phase<at+.25);
    const dt=reaction?(now-reaction.start)/1000:0;
    const impact=reaction?.key==='impact';
    const joy=reaction?.key==='win';
    let hands=0;
    if(impact||joy){
      const summit=joy?3:2;
      hands=dt<.13?1:dt<.79?summit:dt<.98?1:0;
    }
    current=joy&&dt<1?'joy':impact&&dt<.82?'alert':
      blink!==undefined?(Math.abs(phase-blink-.12)<.052?'closed':'half'):
      phase>24&&phase<27?'smile':'open';
    const recoil=impact?Math.sin(Math.PI*Math.min(1,dt/.85))*3:0;
    const nod=joy?Math.sin(Math.PI*Math.min(1,dt/1.1))*4:0;
    const headX=look?-3:recoil*.6, headY=breath-recoil-nod;
    ctx.clearRect(0,0,320,374);
    draw('torso',79,159+breath,172,207-breath);
    for(let side=0;side<2;side++){
      const pose=side===1&&hands>0&&dt<.18?1:hands;
      draw('paw-'+side+'-'+pose,pawX[side][pose],178+breath+(pose===3?2:0));
    }
    for(const [name,x,y,delay] of [['scarf-tail-far',157,184,.5],['scarf-tail-near',144,185,0]]){
      ctx.save(); ctx.translate(x,y);
      ctx.rotate(.036*Math.sin(t*2-delay)+.11*recoil*Math.sin(Math.min(dt,1)*7-delay));
      draw(name,-5,0);ctx.restore();
    }
    draw('scarf-knot',102,152+breath,117,56);
    draw('ear-far',32+headX,63+headY+1.3*Math.sin(t*1.88));
    draw('ear-near',188+headX,33+headY+1.7*Math.sin(t*2.31+.5));
    draw('face-'+current,33+headX,4+headY);
    draws++;
  }
  function act(key){
    if(!enabled||!finishSprites.ready()||reduced())return;
    const start=performance.now();
    reaction={key,start,end:key==='watch'?null:start+1230};
    events.push(key);
    if(events.length>30)events.shift();
  }
  return {set,frame,scatter:landed=>act(landed?'impact':'watch'),win:()=>act('win'),cancel:()=>{reaction=null;},
    idle:()=>enabled&&finishSprites.ready(),error:finishSprites.error,
    metrics:()=>({draws,loaded:finishSprites.ready(),visible:!canvas.hidden,error:finishSprites.error(),events:[...events],current})};
})();


/* Articulated Mochi acting proof. All articulation occurs on separated illustrations. */
const articulatedMochi=(()=>{
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=374;canvas.hidden=true;
  canvas.setAttribute('aria-hidden','true');
  document.querySelector('#welcome-mochi').parentElement.append(canvas);
  const original=document.querySelector('#welcome-mochi'), ctx=canvas.getContext('2d');
  const pieces=new Image();
  let enabled=false, clock=0, last=0, lastDraw=-1, scale=1, action=null, draws=0, error='';
  let focus=0, nextBlink=1850, blinkStart=-999, nextTwitch=4700, twitchStart=-999;
  let rng=9325, gazeAmount=0, nextLook=4450, lookUntil=0, lastFrame;
  const events=[];
  pieces.onerror=()=>{error='The motion artwork could not load.';};
  const ready=()=>pieces.naturalWidth>0&&finishSprites.ready();
  const bound=(x,min=0,max=1)=>Math.min(max,Math.max(min,x));
  const ease=(a,b,t)=>{
    const x=bound((t-a)/(b-a));return x*x*x*(10+x*(-15+x*6));
  };
  const envelope=(t,a,b,c,d)=>ease(a,b,t)*(1-ease(c,d,t));
  const mix=(a,b,t)=>a+(b-a)*t;
  const random=()=>{
    rng=(Math.imul(rng,1664525)+1013904223)>>>0;
    return rng/4294967296;
  };
  function atlasPart(name,x,y,w,h,destination=ctx){
    const [sx,sy,sw,sh]=motionParts[name];
    destination.drawImage(pieces,sx,sy,sw,sh,x,y,w,h);
  }
  function originalPart(name,x,y,w,h){finishSprites.draw(ctx,name,x,y,w,h);}
  function pivoted(draw,name,x,y,px,py,angle){
    ctx.save();
    ctx.translate(x+px,y+py);ctx.rotate(angle);
    draw(name,-px,-py);
    ctx.restore();
  }
  // Two fixed bone lengths. Select the outward elbow solution for each side.
  function solve(side,shoulder,wrist){
    const a=36,b=34, dx=wrist.x-shoulder.x,dy=wrist.y-shoulder.y;
    const length=Math.hypot(dx,dy)||1, distance=bound(length,14,69.4);
    const ux=dx/length,uy=dy/length;
    const along=(a*a+distance*distance-b*b)/(2*distance);
    const away=Math.sqrt(Math.max(0,a*a-along*along))*(side===0?1:-1);
    return {elbow:{x:shoulder.x+ux*along-uy*away,y:shoulder.y+uy*along+ux*away},
      wrist:{x:shoulder.x+ux*distance,y:shoulder.y+uy*distance}};
  }
  function segment(name,a,b,width,top,bottom){
    const dx=b.x-a.x,dy=b.y-a.y;
    ctx.save();
    ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(-dx,dy));
    atlasPart(name,-width/2,-top,width,Math.hypot(dx,dy)+top+bottom);
    ctx.restore();
  }
  function arm(side,breath,raise,anticipation,overshoot){
    const sign=side===0?1:-1;
    const shoulder={x:side===0?111:212,y:203+breath-anticipation*1.5};
    const target={x:mix(side===0?122:199,side===0?140:180,raise)+overshoot*sign,
      y:mix(side===0?271:269,222,raise)+breath*.65};
    const {elbow,wrist}=solve(side,shoulder,target);
    const turn=bound(Math.atan2(-(wrist.x-elbow.x),wrist.y-elbow.y),-1.5,1.5);
    segment('upper-'+side,shoulder,elbow,31,13,7);
    segment('lower-'+side,elbow,wrist,26,12,7);
    const joint={shoulder,elbow,wrist,turn,tilt:turn*.94-sign*.46*raise,curl:ease(.30,.95,raise)};
    articulation.limb(ctx,side,joint,raise);
    return joint;
  }
  function drawHand({wrist,tilt,curl},side){
    ctx.save();
    ctx.translate(wrist.x,wrist.y);ctx.rotate(tilt);
    articulation.paw(ctx,(target=ctx,x=0,y=0)=>atlasPart('hand-'+side,x-11,y-6,22,27,target),side,curl);
    ctx.restore();
  }  const apertures=[
    [[109,119],[116,118],[123,123],[127,132],[121,137],[111,139],[106,135],[107,125]],
    [[153,116],[159,109],[168,104],[180,106],[189,114],[192,122],[185,127],[173,130],[159,132],[152,129]],
  ];
  function eyes(amount,wide){
    const placement=[[106,118,22,22,110,120,12,16],[152,104,41,29,158,109,17,21]];
    for(let i=0;i<2;i++){
      const [x,y,w,h,ix,iy,iw,ih]=placement[i];
      ctx.save();
      ctx.beginPath();apertures[i].forEach(([a,b],n)=>n?ctx.lineTo(a,b):ctx.moveTo(a,b));
      ctx.closePath();ctx.clip();
      atlasPart('white-'+i,x,y,w,h);
      atlasPart('iris-'+i,ix+1-amount*(i===0?2.8:4.6),iy-wide*.7,iw-2,ih);
      ctx.restore();
    }
  }
  function update(t,dt){
    if(action?.type==='watch'&&t-action.start>1700)action=null;
    if(action&&action.type!=='watch'&&t-action.start>action.length){
      events.push({state:'idle',clock:Math.round(t)});
      action=null;
    }
    const time=action?t-action.start:0, win=action?.type==='win', impact=action?.type==='impact', watching=action?.type==='watch';
    const notice=watching?ease(0,155,time):impact?1-ease(880,1540,time):win?envelope(time,0,145,1100,1670):0;
    gazeAmount+=(notice-gazeAmount)*(1-Math.exp(-dt/57));
    const turn=watching?ease(105,510,time):impact?1-ease(960,1640,time):win?envelope(time,180,560,1040,1720):0;
    focus+=(turn-focus)*(1-Math.exp(-dt/96));
    if(t>=nextBlink&&(!action||watching&&time>790)){
      blinkStart=t;nextBlink=t+2550+random()*3110;
    }
    if(t>=nextTwitch){twitchStart=t;nextTwitch=t+5400+random()*4500;}
    if(t>=nextLook){lookUntil=t+680+random()*440;nextLook=t+5100+random()*3300;}
    const idleLook=lookUntil>0?envelope(t,lookUntil-880,lookUntil-660,lookUntil-380,lookUntil):0;
    const blink=t-blinkStart;
    const breath=Math.sin(t*Math.PI*2/3650)*1.13;
    const ears=impact?envelope(time,130,385,520,1150):win?envelope(time,400,745,960,1660):envelope(t-twitchStart,0,130,165,460)*.44;
    const anticipation=impact?envelope(time,140,390,490,1000):win?envelope(time,120,350,530,920):focus*.12;
    const paws=[0,1].map(side=>{
      const f=time-side*(win?57:44);
      const target=win?envelope(f,310,970,1140,2090):impact?envelope(f,230,860,1020,1740):0;
      return mix(action?.from[side]??0,target,ease(0,230,time));
    });
    const follow=impact?envelope(time,480,1090,1170,1660):win?envelope(time,540,1070,1190,2050):0;
    const expression=win&&time>540&&time<1620?'joy':impact&&time>330&&time<1210?'alert':
      blink<205?(blink>=56&&blink<110?'closed':'half'):'open';
    return {breath,ears,anticipation,paws,follow,expression,focus,
      gaze:bound(gazeAmount+idleLook*.52),time,win,impact};
  }
  function frame(now){
    const step=last?Math.min(now-last,65):0;
    last=now;
    const shown=Boolean(enabled&&ready()&&!reduced()&&!document.hidden&&premium()&&!open.open);
    if(shown===canvas.hidden){
      canvas.hidden=!shown;original.style.visibility=shown?'hidden':'';
    }
    if(!shown){if(reduced()||document.hidden)action=null;return;}
    clock+=step*scale;
    const state=update(clock,step*scale);
    const index=Math.floor(now*60/1000);
    if(lastDraw===index)return;
    lastDraw=index;
    const {breath,ears,anticipation,paws,follow,expression,gaze}=state;
    ctx.clearRect(0,0,320,374);
    originalPart('torso',79,159+breath,172,207-breath);
    const joints=paws.map((value,side)=>arm(side,breath,value,anticipation,follow*(state.win?2.8:1.5)));
    const cloth=.022*Math.sin(clock/680)+follow*.105;
    pivoted(originalPart,'scarf-tail-far',152,184+breath,5,0,cloth*.68);
    pivoted(originalPart,'scarf-tail-near',139,185+breath,5,0,cloth);
    originalPart('scarf-knot',102,152+breath,117,56);
    joints.forEach(drawHand);
    const hx=-4.2*state.focus,hy=breath+anticipation*1.65-state.follow;
    pivoted(originalPart,'ear-far',32+hx,63+hy,51,58,.058*ears);
    pivoted(originalPart,'ear-near',188+hx,33+hy,29,64,-.080*ears);
    ctx.save();
    ctx.translate(160+hx,178+hy);ctx.rotate(-.022*state.focus+.014*anticipation);
    ctx.translate(-160,-178);
    const useCorrections=articulation.ready()&&Boolean(action);
    const baseFace=useCorrections&&expression!=='half'&&expression!=='closed'?'open':expression;
    originalPart('face-'+baseFace,33,4);
    if(baseFace==='open'){
      eyes(gaze,anticipation);
      if(useCorrections)articulation.face(ctx,action.type,state.time,ease);
    }
    ctx.restore();
    lastFrame={joints,clock,state:action?.type||'idle',expression,gaze,paws};
    draws++;
  }
  function actionStart(type){
    if(!enabled||!ready()||reduced())return;
    action={type,start:clock,length:type==='win'?2220:1840,from:lastFrame?.paws??[0,0]};
    events.push({state:type,clock:Math.round(clock)});
    if(events.length>24)events.shift();
  }
  return {decode:()=>pieces.decode(),set(on){enabled=on;last=0;if(on){articulation.load();finishSprites.load();if(!pieces.getAttribute('src'))pieces.src=premiumRoot+'motion-parts.webp';}
      else action=null;}, frame, scatter:landed=>actionStart(landed?'impact':'watch'),
    win:()=>actionStart('win'),cancel:()=>{action=null;},idle:()=>enabled&&ready(),
    error:()=>error||articulation.error()||finishSprites.error(),speed:value=>{scale=value;},
    metrics:()=>({visible:!canvas.hidden,draws,ready:ready(),events:[...events],lastFrame,scale})};
})();

const mochiRig=(()=>{
  let legacy=false, enabled=false;
  const select=()=>legacy?priorMochiRig:articulatedMochi;
  return {
    set(on){enabled=on;select().set(on);},
    legacy(on){
      if(legacy===on)return;
      select().set(false);select().frame(performance.now());
      legacy=on;select().set(enabled);
    },
    frame:time=>select().frame(time),
    scatter:value=>select().scatter(value),
    win:()=>select().win(),
    cancel:()=>select().cancel(),
    idle:()=>select().idle(),
    error:()=>select().error(),
    speed:value=>articulatedMochi.speed(value),
    metrics:()=>({...select().metrics(),legacy})
  };
})();







articulatedMochi.set(true);
window.premiumCharacterLoads.push(Promise.all([finishSprites.decode(),articulatedMochi.decode(),articulation.decode()]));
window.addEventListener('premium-pose',event=>{
 const name=event.detail;
 if(['ready','watch','curious'].includes(name))articulatedMochi.scatter(false);
 if(['bonus','epic'].includes(name))articulatedMochi.scatter(true);
 if(['win','big','mega','complete'].includes(name))articulatedMochi.win();
});
document.querySelector('#board').addEventListener('scatter-landed',()=>articulatedMochi.scatter(true));
function tick(time){articulatedMochi.frame(time);requestAnimationFrame(tick);}
requestAnimationFrame(tick);
})();

})();