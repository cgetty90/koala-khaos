// Presentation only. No game RNG, awards or receipt data enters this layer.
export const smoothBlend=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};
export function forestBlend(progress:number){return{arrival:smoothBlend(progress/.12),handoff:smoothBlend((progress-.80)/.20)}}
export function mountBonusLeaves(host:HTMLElement){const field=document.createElement('div');field.className='bonus-forest-leaves';field.setAttribute('aria-hidden','true');for(let i=0;i<12;i++){const leaf=document.createElement('i');leaf.style.setProperty('--leaf',String(i));field.append(leaf)}host.prepend(field)}
export function drawForestTrails(ctx:CanvasRenderingContext2D,progress:number,width:number,height:number,tier:string,quiet:boolean){
 if(quiet)return;const count=tier==='epic'?20:tier==='super'?16:12;
 ctx.save();for(let i=0;i<count;i++){const t=(progress*.9+i*.083)%1;const x=width*(1-t),y=height*(.15+(i*17%70)/100)+Math.sin(t*4+i)*9;ctx.globalAlpha=Math.sin(t*Math.PI)*.38;ctx.fillStyle=i%3===0?'#ffe2a0':tier==='epic'?'#81c9ae':'#a4bb7c';ctx.save();ctx.translate(x,y);ctx.rotate(t*2+i);ctx.beginPath();ctx.ellipse(0,0,2+i%3,1.2,0,0,Math.PI*2);ctx.fill();ctx.restore()}ctx.restore();
}
