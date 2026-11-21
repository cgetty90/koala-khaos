import {test} from 'node:test';import assert from 'node:assert/strict';
import {MusicCache} from './music-cache.ts';
const defer=<T>()=>{let resolve!:(v:T)=>void;let reject!:(e:Error)=>void;const promise=new Promise<T>((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
test('prefetch deduplicates bytes without decoding and warm load reuses the exact ready buffer',async()=>{
 let fetched=0,decoded=0;const bytes=new ArrayBuffer(8),buffer={} as AudioBuffer;
 const cache=new MusicCache(async()=>{fetched++;return bytes});const context={decodeAudioData:async(copy:ArrayBuffer)=>{decoded++;assert.notEqual(copy,bytes);return buffer}};
 await Promise.all([cache.prefetch('super'),cache.prefetch('super')]);assert.equal(fetched,1);assert.equal(decoded,0);
 await Promise.all([cache.load('super',context),cache.load('super',context)]);assert.equal(decoded,1);assert.equal(cache.get('super'),buffer);
});
test('only base and selected bonus stay decoded; late discarded decode cannot resurrect cache',async()=>{
 const pending=defer<AudioBuffer>();const cache=new MusicCache(async()=>new ArrayBuffer(8));
 const base={} as AudioBuffer;await cache.load('base',{decodeAudioData:async()=>base});
 const old=cache.load('regular',{decodeAudioData:()=>pending.promise});cache.keep('super');pending.resolve({} as AudioBuffer);await old;
 assert.equal(cache.get('regular'),undefined);assert.equal(cache.get('base'),base);
 const superBuffer={} as AudioBuffer;await cache.load('super',{decodeAudioData:async()=>superBuffer});cache.keep('epic');assert.equal(cache.get('super'),undefined);
});
test('network or decode failure is retryable without retaining a poisoned promise',async()=>{
 let calls=0;const cache=new MusicCache(async()=>{if(++calls===1)throw Error('offline');return new ArrayBuffer(8)});
 await assert.rejects(cache.prefetch('epic'));await cache.prefetch('epic');assert.equal(calls,2);
 let decodes=0;const context={decodeAudioData:async()=>{if(++decodes===1)throw Error('bad codec');return {} as AudioBuffer}};
 await assert.rejects(cache.load('epic',context));await cache.load('epic',context);assert.equal(decodes,2);assert.equal(calls,2);
 cache.clear();assert.equal(cache.get('epic'),undefined);
});
