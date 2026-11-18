import { Application, Container, Graphics, Sprite, Texture, Assets } from 'pixi.js';
import { currentBudget } from './graphics-quality';
export async function mountLivingWorld() {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');const app=new Application();
 const budget=currentBudget();await app.init({width:innerWidth,height:innerHeight,backgroundAlpha:0,antialias:false,resolution:Math.min(devicePixelRatio,budget.ambientDPR),autoDensity:true,preference:'webgl',autoStart:false});
 app.canvas.className='living-world';app.canvas.setAttribute('aria-hidden','true');document.querySelector('.scenery')!.append(app.canvas);
 const leaves=new Container(),lights=new Container();app.stage.addChild(leaves,lights);
 const texture=await Assets.load<Texture>(import.meta.env.BASE_URL+'art/production/gumleaf.webp');
 const objects=Array.from({length:14},(_,i)=>{const s=new Sprite(texture);s.anchor.set(.5);s.width=22+i%4*5;s.height=s.width*.53;s.alpha=.25+i%3*.08;leaves.addChild(s);return s});
 // Geometry is authored once, not cleared/re-tessellated thirty times each second.
 const sparks=Array.from({length:22},(_,i)=>{const s=new Graphics().circle(0,0,1+i%2).fill({color:i%3?0xffe8a8:0x7cecd5});lights.addChild(s);return s});
 let elapsed=0,destroyed=false;
 function update(){if(destroyed)return;const b=currentBudget(),paused=document.hidden||reduced.matches||document.documentElement.dataset.effects==='reduced'||b.ambientFPS===0;
  app.ticker.maxFPS=b.ambientFPS||20;app.ticker.stop();app.canvas.style.visibility=paused?'hidden':'visible';
  if(b.ambientFPS===0)app.renderer.resize(1,1,1);else app.renderer.resize(innerWidth,innerHeight,Math.min(devicePixelRatio,b.ambientDPR));
  objects.forEach((s,i)=>s.visible=i<b.leaves);sparks.forEach((s,i)=>s.visible=i<b.lights);if(!paused)app.ticker.start();
 }
 app.ticker.add(ticker=>{elapsed+=Math.min(ticker.deltaMS,50)/1000;const w=app.screen.width,h=app.screen.height;
  objects.forEach((leaf,i)=>{if(!leaf.visible)return;const phase=(elapsed*(.008+i%3*.002)+i*.137)%1;leaf.position.set((i*.193%1)*w+Math.sin(elapsed*.18+i)*35,phase*(h+90)-45);leaf.rotation=Math.sin(elapsed*.4+i)*.5});
  sparks.forEach((s,i)=>{if(!s.visible)return;s.position.set((i*.271%1)*w+Math.sin(elapsed*.2+i)*18,(i*.417%1)*h+Math.cos(elapsed*.25+i)*12);s.alpha=.12+(1+Math.sin(elapsed*.6+i))*.13});
 });
 const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-effects']});
 document.addEventListener('visibilitychange',update);document.addEventListener('graphics-qualitychange',update);reduced.addEventListener('change',update);window.addEventListener('resize',update,{passive:true});window.addEventListener('pageshow',update);update();
 window.addEventListener('pagehide',event=>{app.ticker.stop();if(event.persisted)return;destroyed=true;observer.disconnect();document.removeEventListener('visibilitychange',update);document.removeEventListener('graphics-qualitychange',update);window.removeEventListener('resize',update);window.removeEventListener('pageshow',update);reduced.removeEventListener('change',update);app.destroy(true,{children:true})});
}
