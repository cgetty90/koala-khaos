import{test}from'node:test';import assert from'node:assert/strict';import{CueGate,cuePolicy}from'./audio-policy.ts';
import {createBoardTimeline} from './motion.ts';
test('instant permits confirmed results and UI but suppresses motion sounds',()=>{for(const n of ['spin','land','pop','refill','storm'])assert.equal(cuePolicy(n,'instant').allowed,false);for(const n of ['confirm','result','summary'])assert.equal(cuePolicy(n,'instant').allowed,true)});
test('turbo groups contacts and bounds tails while keeping bonus priority',()=>{assert(cuePolicy('land','turbo').cooldown>cuePolicy('land','normal').cooldown);assert.equal(cuePolicy('pop','turbo').maxDuration,.18);assert(cuePolicy('epic','turbo').priority>cuePolicy('land','turbo').priority)});
test('duplicate events are gated and cancellation resets the presentation gate',()=>{const gate=new CueGate();assert(gate.accept('land',1,'normal'));assert(!gate.accept('land',1.02,'normal'));assert(gate.accept('scatter-impact',1.02,'normal'));gate.clear();assert(gate.accept('land',1.02,'normal'))});

test('approved B contact grouping and Instant final-settle suppression',()=>{
 const gate=new CueGate();assert(gate.accept('land',1,'normal'));assert(!gate.accept('land',1.12,'normal'));assert(gate.accept('land',1.131,'normal'));
 assert(!cuePolicy('reel-settle','instant').allowed);assert.equal(cuePolicy('land','turbo').cooldown,.2);
});

test('cancelled board timelines cannot report a completed final landing',async()=>{
 const events:any[]=[];const host={dataset:{}}as unknown as HTMLElement;
 const phase=createBoardTimeline(host,async(_duration,draw)=>{draw(.5);throw Error('cancelled')},()=>{},e=>events.push(e));
 await assert.rejects(()=>phase('drop',100,()=>{}),/cancelled/);assert.deepEqual(events.at(-1),{phase:'drop',edge:'end',progress:.5,completed:false,audioSuppressed:false});assert.equal(host.dataset.phase,'idle');
});

test('skip suppression survives tween cleanup before the final notification',async()=>{
 let skipping=false;const events:any[]=[];
 const phase=createBoardTimeline({dataset:{}}as unknown as HTMLElement,async(_duration,draw)=>{draw(0);skipping=true;draw(1);skipping=false},()=>{},e=>events.push(e),()=>skipping);
 await phase('drop',100,()=>{});assert.equal(events.at(-1).audioSuppressed,true);assert.equal(events.at(-1).completed,true);
});
