(()=>{
const premiumRoot=new URL('./',document.currentScript.src).href;

(()=>{
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.motion==='instant';
const premium=()=>true;
const open={open:false};
const stage=document.createElement('div');stage.className='premium-environment';
stage.innerHTML='<div class="living-plane living-far"></div><div class="living-plane living-mid"></div><canvas id="flow"></canvas><div class="living-plane living-edge"></div>';
document.querySelector('.scenery').append(stage);
document.body.dataset.art='premium';
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


/* Independent water passes. The source video contains only the registered shaft crop. */
const layeredWater = (() => {
  const video=document.createElement('video'), mask=new Image();
  const surface=document.createElement('canvas');
  surface.width=134; surface.height=228;
  const paint=surface.getContext('2d');
  video.muted=true; video.playsInline=true; video.loop=true; video.preload='none';
  let picture=0, painted=-1, enabled=false, draws=0, starting=false, failed=false;
  const wraps=[];
  let lastVideoFrame;
  function videoFrame(now,frame){
    picture=frame.presentedFrames;
    if(lastVideoFrame && frame.mediaTime<lastVideoFrame.time){
      wraps.push(now-lastVideoFrame.now);
      if(wraps.length>24)wraps.shift();
    }
    lastVideoFrame={time:frame.mediaTime,now};
    video.requestVideoFrameCallback(videoFrame);
  }
  video.requestVideoFrameCallback?.(videoFrame);
  const motes=Array.from({length:35},(_,i)=>({
    life:.51+(i*37%33)*.019, phase:i*17%39/39,
    x:(i*23%39-15)*1.55, dx:(i*29%45-12)*1.22,
    height:7+i*13%27, r:.65+(i%6)*.33
  }));
  function stamp(color){
    const sprite=document.createElement('canvas');
    sprite.width=sprite.height=64;
    const ctx=sprite.getContext('2d');
    const g=ctx.createRadialGradient(32,32,2,32,32,32);
    g.addColorStop(0,color);g.addColorStop(.52,'#e9ffff63');g.addColorStop(1,'#d6ffff00');
    ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
    return sprite;
  }
  const mist=stamp('#d4f4faad'), foam=stamp('#fff9e9fa');
  function set(active){
    enabled=active;
    if(active)finishSprites.load();
    if(active&&!video.getAttribute('src')){
      mask.src=premiumRoot+'quality-shaft-mask.webp';
      video.src=premiumRoot+'quality-shaft.mp4';
    }
    sync();
  }
  function sync(){
    const permitted=enabled&&!reduced()&&!document.hidden&&premium()&&!open.open
      &&(!document.body.dataset.mode||document.body.dataset.mode==='regular');
    if(!permitted){ if(!video.paused)video.pause(); return; }
    if(video.paused&&!starting&&!failed){
      starting=true;
      video.play().catch(error=>{failed=error.name!=='AbortError';}).finally(()=>{starting=false;});
    }
  }
  function draw(ctx,t){
    if(!enabled||video.paused||video.readyState<2||!mask.naturalWidth)return false;
    const frame=video.requestVideoFrameCallback ? picture : video.currentTime;
    if(painted!==frame){
      paint.globalCompositeOperation='source-over';paint.drawImage(video,0,0);
      paint.globalCompositeOperation='destination-in';paint.drawImage(mask,0,0);
      painted=frame;
    }
    // Tight shaft mask keeps the lower rock shelves and bank in the original plate.
    ctx.save();
    ctx.globalAlpha=.88;ctx.drawImage(surface,135,359,209,338);
    if(finishSprites.ready()&&document.body.dataset.waterArt!=='previous'){
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(159,385);ctx.lineTo(246,423);ctx.lineTo(280,638);ctx.lineTo(253,666);
      ctx.lineTo(174,660);ctx.lineTo(151,570);ctx.closePath();ctx.clip();
      for(let i=0;i<4;i++){
        const p=(t*(.68+i*.14)+i*.29)%1;
        ctx.globalAlpha=.29*Math.sin(Math.PI*p)**2;
        finishSprites.draw(ctx,"water-vein",153+i*21,382+p*61,52+i*4,256-p*29);
      }
      ctx.restore();
      for(let i=0;i<3;i++){
        const p=(t*(.66+i*.159)+i*.37)%1;
        ctx.globalAlpha=.41*Math.sin(Math.PI*p)**1.6;
        finishSprites.draw(ctx,"whitewater",150+i*37+p*14,655+i*11,92+p*25,29);
      }
      for(let i=0;i<3;i++){
        const p=(t*(.37+i*.04)+i*.35)%1;
        ctx.globalAlpha=.66*Math.sin(Math.PI*p)**1.5;
        finishSprites.draw(ctx,"pool-ripples",218-p*34+i*18,711+p*15,96+p*92,18+p*10);
      }
    }
    // Low fans of foam run continuously across the impact and into the pool.
    for(let i=0;i<9;i++){
      const p=(t*(.57+i*.019)+i*.371)%1;
      ctx.globalAlpha=Math.sin(Math.PI*p)**1.6*(.22+i%3*.033);
      ctx.drawImage(foam,188+i*6+p*63,665+i%3*4+p*4,46+p*66,15+p*6);
    }
    for(const m of motes){
      const p=(t/m.life+m.phase)%1;
      ctx.globalAlpha=(1-p)**1.5*.76;
      ctx.fillStyle='#e8ffff';
      ctx.beginPath();ctx.ellipse(218+m.x+m.dx*p,679-4*m.height*p*(1-p)+p*8,m.r,m.r*.72,0,0,Math.PI*2);ctx.fill();
    }
    // Small spill at the foot of the exposed rock, beneath the upper impact.
    for(let i=0;i<5;i++){
      const p=(t*(.91+i*.071)+i*.23)%1;
      ctx.globalAlpha=.27*Math.sin(Math.PI*p);
      ctx.drawImage(foam,268+i*6+p*13,692+p*22,22+p*8,10+p*4);
    }
    // Thin drifting veils have a different cycle and never fill the whole base in white.
    for(let i=0;i<5;i++){
      const p=(t*(.19+i*.023)+i*.337)%1;
      ctx.globalAlpha=Math.sin(Math.PI*p)**2*.23;
      ctx.drawImage(mist,180+i*11+p*81,631+i%2*15-p*21,84+p*47,36+p*12);
    }
    ctx.restore();draws++;
    return true;
  }
  return {set,decode:()=>mask.decode(),sync,draw,error:()=>video.error?.message||(failed?"Video playback failed. Showing original waterfall.":""),metrics:()=>({draws,wraps:[...wraps],paused:video.paused,
    video:video.getVideoPlaybackQuality(),error:video.error?.message||null})};
})();





/* Independent layer compositor for the living forest study. */
const forestMotion=(()=>{
  const canvas=document.getElementById('flow'), ctx=canvas.getContext('2d',{alpha:true});
  const edges=[...document.querySelectorAll('.living-plane')];
  const far=edges[0], middle=edges[1], edge=edges[2];
  const width=1600,height=900;
  let waterfall, surface, mist, handle=0, last=0, frames=0;
  let pointer=[0,0], camera=[0,0];
  const scene={
    desktop:{x:.15,y:.425,w:.138,h:.385,anchor:.5},
    portrait:{x:.15,y:.425,w:.138,h:.385,anchor:.14},
  };
  function size(){
    const b=canvas.getBoundingClientRect(), scale=Math.min(1,960/b.width,960/b.height);
    canvas.width=Math.max(1,Math.round(b.width*scale));canvas.height=Math.max(1,Math.round(b.height*scale));
    draw(performance.now(),false);
  }
  function currentScene(){return innerWidth<=900?scene.portrait:scene.desktop;}
  function prepareWater(image){
    const worker=document.createElement('canvas');worker.width=196;worker.height=400;
    const paint=worker.getContext('2d');
    paint.drawImage(image,0,0,196,400);
    const plume=document.createElement('canvas');plume.width=196;plume.height=112;
    plume.getContext('2d').drawImage(image,0,Math.floor(image.naturalHeight*.69),
      image.naturalWidth,Math.ceil(image.naturalHeight*.31),0,0,196,112);
    return [worker,plume];
  }
  function visible(){
    return !document.hidden&&document.body.dataset.art==='premium'&&
      (!document.body.dataset.mode||document.body.dataset.mode==='regular');
  }
  // Each emitter starts on a different shelf. Banks and the pool stay fixed.
  const streams=[
    {x:-.26,start:.03,end:.87,width:.125,speed:1.07,bend:-.10,seed:11,impact:.81},
    {x:-.07,start:.005,end:.91,width:.199,speed:1.36,bend:.025,seed:17,impact:.88},
    {x:.15,start:.035,end:.94,width:.146,speed:.94,bend:.16,seed:29,impact:.92},
    {x:.31,start:.17,end:.88,width:.074,speed:1.18,bend:.20,seed:41,impact:.87}
  ];
  const fract=x=>x-Math.floor(x);
  const noise=(seed,i)=>fract(Math.sin(seed*78.233+i*12.9898)*43758.5453);
  function center(s,p,t){return s.x+s.bend*p*p+.013*Math.sin(p*9-t*2.3+s.seed)*p;}
  function waterScene(x,y,w,h,t,moving){
    ctx.save();ctx.translate(x+w/2,y);ctx.scale(w,h);
    // Feathered source art supplies the complex, natural waterfall body.
    // The independent currents and impacts below are composited over it.
    ctx.globalAlpha=.83;ctx.drawImage(surface,-.46,-.035,.92,1.03);
    for(const s of streams){
      const {start,end,width:sw,speed,seed,impact}=s,len=end-start;
      const edge=(p,side)=>center(s,p,t)+side*sw*(.41+.17*p+.08*Math.sin(p*21-t*2+seed));
      ctx.beginPath();ctx.moveTo(edge(0,-1),start);
      for(let i=1;i<=15;i++){let p=i/15;ctx.lineTo(edge(p,-1),start+p*len);}
      for(let i=15;i>=0;i--){let p=i/15;ctx.lineTo(edge(p,1),start+p*len);}
      ctx.closePath();
      const grad=ctx.createLinearGradient(0,start,0,end);
      grad.addColorStop(0,'#d9faf2bb');grad.addColorStop(.13,'#a9e4efba');
      grad.addColorStop(.35,'#4c9fcabb');grad.addColorStop(.72,'#8ce5e5d9');
      grad.addColorStop(.96,'#dcfff3f2');grad.addColorStop(1,'#a8eeee18');
      ctx.globalAlpha=.29;ctx.fillStyle=grad;ctx.fill();
      ctx.save();ctx.clip();
      // Dephase independent texture passes as they accelerate downstream.
      for(let i=0;i<4;i++){
        const phase=fract(t*.89*speed+i*.263+seed*.043), p=phase*phase;
        ctx.globalAlpha=Math.sin(phase*Math.PI)*.65;
        ctx.drawImage(surface,24+i*26,26+i*53,94,116,center(s,p,t)-sw,start+p*len,sw*2,.19);
      }
      for(let i=0;i<12;i++){
        const p=fract(t*speed+noise(seed,i)), q=p*p;
        const jitter=(noise(seed+7,i)-.5)*sw*.62, cap=.017+p*.035;
        ctx.globalAlpha=(.16+noise(seed+11,i)*.51)*Math.sin(Math.PI*p);
        ctx.strokeStyle=i%5===0?'#fff3cb':'#fbffff';
        ctx.lineWidth=.006+noise(seed+3,i)*.007;
        ctx.beginPath();
        ctx.moveTo(center(s,q,t)+jitter,start+q*len);
        ctx.lineTo(center(s,Math.min(1,q+cap),t)+jitter*.92,start+q*len+cap);
        ctx.stroke();
      }
      ctx.restore();
      // Each ring starts at its stream's strike point on the rock or pool.
      const hit=center(s,.94,t);
      for(let i=0;i<3;i++){
        const phase=fract(t*.65+i*.333+seed*.09);
        ctx.globalAlpha=(1-phase)*(.31+i*.07);
        ctx.strokeStyle=i===1?'#ffe4b8':'#d7fff6';ctx.lineWidth=.0045;
        ctx.beginPath();ctx.ellipse(hit,impact+.021*phase,.042+.24*phase,.006+.027*phase,0,.1,Math.PI*1.85);ctx.stroke();
      }
      for(let i=0;i<17;i++){
        const p=fract(t*(.78+noise(seed,i)*.67)+noise(seed+21,i));
        const vector=(noise(seed+8,i)-.5)*.35, height=.055+noise(seed+50,i)*.12;
        const px=hit+vector*p, py=impact-height*4*p*(1-p)+.037*p;
        ctx.globalAlpha=(1-p)*(.3+noise(seed+80,i)*.66);
        ctx.fillStyle=i%6===0?'#fff0c5':'#e9fff8';
        ctx.beginPath();ctx.ellipse(px,py,.003+noise(seed+70,i)*.009,.002+noise(seed+25,i)*.006,0,0,Math.PI*2);ctx.fill();
      }
      // A plume moves independently of the impact particles.
      const drift=fract(t*(.23+.001*seed)+seed*.068);
      ctx.globalAlpha=(.26+.18*Math.sin(drift*Math.PI))*(1-drift*.46);
      ctx.drawImage(mist,hit-.16+drift*.04,impact-.108-drift*.035,.34+drift*.12,.20+drift*.09);
    }
    ctx.restore();
  }


  function draw(now,moving){
    const b=canvas, mode=currentScene(), seconds=moving?now/1000:0;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,b.width,b.height);
    if(!waterfall||!visible())return;
    const unit=Math.max(b.width/width,b.height/height);
    const offsetX=(b.width-width*unit)*mode.anchor, offsetY=(b.height-height*unit)*.5;
    camera[0]+=(pointer[0]-camera[0])*.09;camera[1]+=(pointer[1]-camera[1])*.09;
    const cx=moving?camera[0]:0,cy=moving?camera[1]:0;
    far.style.transform='translate3d('+(-cx*1.1)+'px,'+(-cy*.7)+'px,0) scale(1.012)';
    middle.style.transform='translate3d('+(-cx*2.8)+'px,'+(-cy*1.7)+'px,0) scale(1.016)';
    const drift=moving?Math.sin(seconds*.82):0;
    edge.style.transform='translate3d('+(cx*3+drift*3.5)+'px,'+(cy*1.8+drift*.9)+'px,0) rotate('+drift*.27+'deg)';
    ctx.setTransform(unit,0,0,unit,offsetX-cx*2.8*unit,offsetY-cy*1.7*unit);
    const x=(mode.x-mode.w/2)*width,y=mode.y*height,w=mode.w*width,h=mode.h*height;
    if(!moving || (!layeredWater.draw(ctx,seconds) && !heygenStudy.drawWater(ctx))) waterScene(x,y,w,h,seconds,moving);
    if(moving){
      ctx.save();ctx.beginPath();
      ctx.moveTo(width*.14,height*.73);ctx.bezierCurveTo(width*.28,height*.76,width*.55,height*.80,width*.86,height*.86);
      ctx.lineTo(width*.96,height);ctx.lineTo(width*.1,height);ctx.closePath();ctx.clip();
      ctx.globalCompositeOperation='screen';
      ctx.lineCap='round';
      for(let i=0;i<30;i++){
        const p=(i*29%31)/31,d=(seconds*.061+i*.131)%1;
        const rx=width*(.17+p*.62+Math.cos(i)*.023),ry=height*(.76+d*.238);
        const len=5+d*d*(19+i%7*4);
        ctx.globalAlpha=Math.sin(d*Math.PI)**2*(.14+i%4*.038);
        ctx.strokeStyle=i%5===0?'#ffd77d':'#72f5eb';ctx.lineWidth=1.1+d*1.6;
        ctx.beginPath();ctx.moveTo(rx-len,ry);ctx.quadraticCurveTo(rx,ry-.7,rx+len,ry);ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha=1;
    frames++;
  }
  const still=()=>typeof reduced==='function'&&reduced();
  function frame(t){
    handle=requestAnimationFrame(frame);
    if(t-last<(innerWidth<=900?41:32))return;
    last=t;
    if(visible()&&!still())draw(t,true);
  }
  window.addEventListener('pointermove',e=>{
    pointer=[e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1];
  },{passive:true});
  window.addEventListener('pointerleave',()=>{pointer=[0,0];},{passive:true});
  window.addEventListener('resize',size,{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(handle);handle=0;}
    else if(waterfall&&!handle)handle=requestAnimationFrame(frame);
  });
  new MutationObserver(()=>draw(performance.now(),false)).observe(document.body,{attributes:true,attributeFilter:['data-reduced','data-art','data-mode']});
  function init(image){
    waterfall=image;[surface,mist]=prepareWater(image);
    size();
    if(!handle)handle=requestAnimationFrame(frame);
  }
  return {init,redrawStill:()=>draw(performance.now(),false),registration:scene,renderedFrames:()=>frames};
})();





const heygenStudy={drawWater:()=>false};
const water=new Image();water.src=premiumRoot+'living-waterfall.webp';
window.premiumEnvironmentReady=water.decode().then(()=>forestMotion.init(water));
layeredWater.set(true);
function update(){layeredWater.sync();requestAnimationFrame(update);}
requestAnimationFrame(update);
matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',()=>forestMotion.redrawStill());
})();

})();