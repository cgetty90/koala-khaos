export type GraphicsQuality = 'high' | 'balanced' | 'performance';
export const qualities: readonly GraphicsQuality[] = ['high','balanced','performance'];
export const validQuality = (value: unknown): value is GraphicsQuality => qualities.includes(value as GraphicsQuality);
export const graphicsBudget = (quality: GraphicsQuality) => ({
 high: { ambientFPS:12, ambientDPR:1, leaves:5, lights:4, boardDPR:2, waterfallFPS:16 },
 balanced: { ambientFPS:8, ambientDPR:1, leaves:3, lights:2, boardDPR:1.5, waterfallFPS:12 },
 performance: { ambientFPS:0, ambientDPR:1, leaves:1, lights:0, boardDPR:1, waterfallFPS:8 },
})[quality];
// Ambient detail only. Samples while hidden/idle never trigger a downgrade.
export class AdaptiveGraphics {
 private sum=0; private count=0; private windowStart=0; private slowSince=0; private calmSince=0; private changed=-Infinity;
 level=0;
 reset(){this.level=0;this.clear();this.changed=-Infinity;}
 private clear(){this.sum=0;this.count=0;this.windowStart=0;this.slowSince=0;this.calmSince=0;}
 sample(delta:number, now:number, active:boolean, visible:boolean, maxLevel:number) {
  if(!visible||!active||delta<=0||delta>250){this.clear();return this.level;}
  if(!this.windowStart)this.windowStart=now;
  this.sum+=delta;this.count++;
  if(now-this.windowStart<1000)return this.level;
  const mean=this.sum/this.count;this.sum=0;this.count=0;this.windowStart=now;
  if(mean>28){this.calmSince=0;this.slowSince ||= now;
   if(now-this.slowSince>=10000&&now-this.changed>=30000&&this.level<maxLevel){this.level++;this.changed=now;this.slowSince=now;}
  }else if(mean<20){this.slowSince=0;this.calmSince ||= now;
   if(now-this.calmSince>=30000&&now-this.changed>=30000&&this.level>0){this.level--;this.changed=now;this.calmSince=now;}
  }else{this.slowSince=0;this.calmSince=0;}
  return this.level;
 }
}
