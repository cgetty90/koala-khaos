
/** Presentation-only readiness. A late decorative download cannot hold a settled round. */
export async function optionalArt<T>(work:Promise<T>,milliseconds:number):Promise<T|null>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  return await Promise.race([work.catch(()=>null),new Promise<null>(resolve=>{
   timer=setTimeout(()=>resolve(null),milliseconds);
  })]);
 }finally{clearTimeout(timer);}
}
const warmed=new Map<string,Promise<HTMLImageElement>>();
export function warmArt(url:string){
 const cached=warmed.get(url);
 if(cached)return cached;
 const image=new Image();image.decoding='async';image.fetchPriority='low';image.src=url;
 const ready=image.decode().then(()=>image).catch(error=>{warmed.delete(url);throw error;});
 warmed.set(url,ready);
 return ready;
}
export function warmBonusArt(){
 const base=import.meta.env.BASE_URL+'art/outback/';
 for(const name of ['shop-regular','shop-super','shop-mystery','scatter-amber'])
  void warmArt(base+name+'.webp').catch(()=>{});
}
export function warmFeatureArt(mode:string){
 const base=import.meta.env.BASE_URL+'art/outback/';
 const names=['berry','lemon','mint','grape','peach','toffee','scatter-amber','kart-atlas',
  ...(mode==='mystery'?['world-regular','world-super','world-epic']:['world-'+mode])];
 for(const name of names)void warmArt(base+name+'.webp').catch(()=>{});
}