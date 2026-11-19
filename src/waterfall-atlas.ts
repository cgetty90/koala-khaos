import { currentBudget } from './graphics-quality';
import { sceneCovered } from './ambient-state';
const WIDTH=800, HEIGHT=450, FRAMES=16;
const falls=[{x:.168,y:.300,w:.075,h:.298,slant:.004},{x:.218,y:.545,w:.020,h:.081,slant:.006},
 {x:.375,y:.781,w:.055,h:.053,slant:-.010},{x:.286,y:.756,w:.043,h:.029,slant:.012}];
const seed=(n:number)=>((Math.sin(n*147.79+31.46)*47289.177)%1+1)%1;
type Sheet={image:HTMLCanvasElement;width:number;height:number;left:number;top:number};
let sheets:Sheet[]|undefined;
// Small shared seamless atlases: paths and gradients are baked once, never on a water tick.
function atlas():Sheet[]{return sheets??=falls.map((f,index)=>{
 const width=Math.ceil(f.w*WIDTH+24),height=Math.ceil(f.h*HEIGHT+24);
 const image=document.createElement('canvas');image.width=width*FRAMES;image.height=height;
 const c=image.getContext('2d')!,w=f.w*WIDTH,h=f.h*HEIGHT,skew=f.slant*WIDTH;
 for(let frame=0;frame<FRAMES;frame++){
  c.save();c.translate(frame*width,0);c.beginPath();c.rect(0,0,width,height);c.clip();
  c.save();c.beginPath();c.moveTo(12,4);c.lineTo(12+w,4);c.lineTo(12+w+skew,4+h);c.lineTo(12+skew-w*.15,4+h);c.closePath();c.clip();
  for(let i=0;i<36;i++){const a=seed(i+index*43),t=(frame/FRAMES*(1+i%2)+seed(i*11+index))%1;
   c.globalAlpha=Math.sin(t*Math.PI)*(.20+a*.30);c.strokeStyle=i%4?'#a8e5ff':'#f2fcff';c.lineWidth=.4+a*1.3;
   c.beginPath();c.moveTo(12+a*w+t*skew,4+h*t);c.lineTo(12+a*w+(t+.15)*skew,4+h*(t+.15));c.stroke();
  }c.restore();
  for(let i=0;i<10;i++){const t=(frame/FRAMES+seed(i+index*7))%1;
   c.globalAlpha=Math.sin(t*Math.PI)*.38;c.fillStyle=i%3?'#d5f9ff':'#8eece5';c.beginPath();
   c.ellipse(12+skew+w*(.45+(seed(i*5)-.5)*(1+t)),4+h-Math.sin(t*Math.PI)*(1+i%4)+t*5,1+t*4,.6+t*.8,.08,0,Math.PI*2);c.fill();
  }
  const mist=c.createRadialGradient(12+w*.5,4+h,0,12+w*.5,4+h,12);mist.addColorStop(0,'#c5e8ff24');mist.addColorStop(1,'#c5e8ff00');c.globalAlpha=.4;c.fillStyle=mist;c.fillRect(0,h-10,width,25);c.restore();
 }
 return {image,width,height,left:f.x*WIDTH-12,top:f.y*HEIGHT-4};
});}

export function mountWaterfall(host:HTMLElement,dialog?:HTMLDialogElement){
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement;
 const patches=atlas().map(sheet=>{const canvas=document.createElement('canvas');canvas.width=sheet.width;canvas.height=sheet.height;
  canvas.className='waterfall-patch';canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',left:sheet.left/WIDTH*100+'%',top:sheet.top/HEIGHT*100+'%',width:sheet.width/WIDTH*100+'%',height:sheet.height/HEIGHT*100+'%'});
  host.append(canvas);return {...sheet,canvas,ctx:canvas.getContext('2d')!};});
 let timer:ReturnType<typeof setTimeout>|undefined,frame=0,count=0,closed=false;
 function fit(){const parent=host.parentElement!;const width=Math.max(parent.clientWidth,parent.clientHeight*WIDTH/HEIGHT);host.style.width=width+'px';host.style.height=width*HEIGHT/WIDTH+'px';}
 const visible=()=>!closed&&!document.hidden&&(!dialog?!sceneCovered()&&['base',undefined].includes(document.body.dataset.world):dialog.open);
 const animated=()=>visible()&&!motion.matches&&root.dataset.motion!=='instant';
 function paint(){for(const p of patches){p.ctx.clearRect(0,0,p.width,p.height);p.ctx.drawImage(p.image,frame*p.width,0,p.width,p.height,0,0,p.width,p.height);}host.dataset.frame=String(++count);}
 function tick(){timer=undefined;if(!animated())return;frame=(frame+1)%FRAMES;paint();timer=setTimeout(tick,1000/currentBudget().waterfallFPS);}
 function update(){clearTimeout(timer);timer=undefined;host.dataset.quality=root.dataset.effects==='reduced'||innerWidth<680?'simple':'full';host.style.visibility=visible()&&!motion.matches&&root.dataset.motion!=='instant'?'visible':'hidden';if(animated()){paint();timer=setTimeout(tick,1000/currentBudget().waterfallFPS);}}
 const resize=new ResizeObserver(fit);resize.observe(host.parentElement!);fit();
 const observer=new MutationObserver(update);observer.observe(root,{attributes:true,attributeFilter:['data-motion']});observer.observe(document.body,{attributes:true,attributeFilter:['data-world']});if(dialog)observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 for(const event of ['visibilitychange','graphics-qualitychange','ambientvisibilitychange'])document.addEventListener(event,update);
 motion.addEventListener('change',update);window.addEventListener('pageshow',update);update();
 window.addEventListener('pagehide',event=>{clearTimeout(timer);if(!event.persisted){closed=true;resize.disconnect();observer.disconnect();motion.removeEventListener('change',update);window.removeEventListener('pageshow',update);for(const name of ['visibilitychange','graphics-qualitychange','ambientvisibilitychange'])document.removeEventListener(name,update);}});
 return ()=>{if(visible()&&!motion.matches)host.animate([{opacity:.8},{opacity:1,offset:.3},{opacity:.8}],{duration:350});};
}
