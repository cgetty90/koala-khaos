import { Application, Container, Graphics, Sprite, Texture, Assets } from 'pixi.js';

export async function mountLivingWorld() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const app = new Application();
  await app.init({ resizeTo:window, backgroundAlpha:0, antialias:false,
    resolution:Math.min(devicePixelRatio,1.5), autoDensity:true, preference:'webgl' });
  app.canvas.className = 'living-world';
  app.canvas.setAttribute('aria-hidden','true');
  document.querySelector('.scenery')!.append(app.canvas);
  const leaves = new Container();
  app.stage.addChild(leaves);
  const texture = await Assets.load<Texture>(import.meta.env.BASE_URL + 'art/production/gumleaf.webp');
  const objects = Array.from({length:14},(_,index)=>{
    const leaf = new Sprite(texture);
    leaf.anchor.set(.5);
    leaf.width=22+index%4*5;
    leaf.height=leaf.width*.53;
    leaf.alpha=.25+index%3*.08;
    leaves.addChild(leaf);
    return leaf;
  });
  const sparks = new Graphics();
  app.stage.addChild(sparks);
  let elapsed=0;
  const update = () => {
    const paused = document.hidden || reduced.matches || document.documentElement.dataset.effects === 'reduced';
    if(paused){app.ticker.stop();app.canvas.style.visibility='hidden';}
    else {app.canvas.style.visibility='visible';app.ticker.start();}
  };
  app.ticker.maxFPS=30;
  app.ticker.add(ticker=>{
    elapsed+=Math.min(ticker.deltaMS,50)/1000;
    const w=app.screen.width,h=app.screen.height;
    objects.forEach((leaf,index)=>{
      const phase=(elapsed*(.008+index%3*.002)+index*.137)%1;
      leaf.x=(index*.193%1)*w+Math.sin(elapsed*.18+index)*35;
      leaf.y=phase*(h+90)-45;
      leaf.rotation=Math.sin(elapsed*.4+index)*.5;
    });
    sparks.clear();
    for(let i=0;i<22;i++){
      const x=(i*.271%1)*w+Math.sin(elapsed*.2+i)*18;
      const y=(i*.417%1)*h+Math.cos(elapsed*.25+i)*12;
      sparks.circle(x,y,1+i%2).fill({color:i%3?0xffe8a8:0x7cecd5,alpha:.12+(1+Math.sin(elapsed*.6+i))*.13});
    }
  });
  document.addEventListener('visibilitychange',update);
  reduced.addEventListener('change',update);
  new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['data-effects']});
  update();
  window.addEventListener('pagehide',()=>app.destroy(true,{children:true}),{once:true});
}
