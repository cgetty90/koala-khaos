import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const release=JSON.parse(readFileSync('scripts/release-audio.json','utf8'));
test('release includes four bounded-size, hash-verified music assets',()=>{
 assert.deepEqual(Object.keys(release.tracks),['base','regular','super','epic']);
 for(const track of Object.values(release.tracks) as any[]){
  assert.match(track.path,/^audio\/nocturne-v3\/[a-z-]+\.ogg$/);
  const bytes=readFileSync('public/'+track.path);
  assert.equal(bytes.length,track.bytes);assert(track.bytes<1_500_000);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),track.sha256);
  assert(track.duration>=30&&track.duration<=60);
 }
 assert(!existsSync('public/audio/original-v1'));
 assert(!existsSync('public/audio/jungle-v2'));
 const entrance=release.entrances;assert.equal(entrance.slotSeconds,4);
 assert.deepEqual(entrance.slots,{regular:0,super:4,epic:8});
 const bytes=readFileSync('public/'+entrance.path);assert(bytes.length<350_000);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),entrance.sha256);
});
test('all four scene mappings use the approved soundtrack and release marker',()=>{
 const sound=readFileSync('src/sound.ts','utf8');
 for(const [role,slug] of Object.entries({base:'eucalyptus-nocturne',regular:'jungle-awakening',super:'storm-rising',epic:'thunder-khaos'})){
  assert(sound.includes(`${role}:'${slug}'`));assert(release.tracks[role].path.endsWith('/'+slug+'.ogg'));
 }
 assert(readFileSync('index.html','utf8').includes(`content="${release.version}"`));
});
