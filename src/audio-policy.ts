export type AudioPace='gentle'|'normal'|'turbo'|'instant';
const essential=new Set(['ui','ui-menu','ui-setting','ui-ante','ui-bonus','confirm','result','scatter','regular','super','epic','big','mega','jackpot','summary']);
export function cuePolicy(name:string,pace:AudioPace){
 const major=['scatter','regular','super','epic','big','mega','jackpot','summary'].includes(name);
 const priority=major?4:name==='scatter-impact'||name==='gumleaf-spotlight'?3:name.startsWith('ui')||name==='confirm'?1:2;
 return {allowed:pace!=='instant'||essential.has(name),priority,cooldown:name==='land'?(pace==='turbo'?.2:.13):pace==='instant'?.12:.065,maxDuration:pace==='turbo'?(major?.8:priority===3?.38:.18):pace==='instant'?.28:Infinity};
}
export class CueGate{
 private last=new Map<string,number>();
 accept(name:string,time:number,pace:AudioPace){const policy=cuePolicy(name,pace);if(!policy.allowed||time-(this.last.get(name)??-Infinity)<policy.cooldown)return false;this.last.set(name,time);return true}
 clear(){this.last.clear()}
}
