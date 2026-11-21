export type MusicScene = 'base'|'regular'|'super'|'epic';

// Encoded prefetch is cheap and never decodes all bonus tracks at startup.
// Only base + the selected bonus stay decoded. Audio failures never gate play.
export class MusicCache {
  private fetcher: (scene:MusicScene)=>Promise<ArrayBuffer>;
  private encoded = new Map<MusicScene,Promise<ArrayBuffer>>();
  private decoded = new Map<MusicScene,Promise<AudioBuffer>>();
  private ready = new Map<MusicScene,AudioBuffer>();
  constructor(fetcher:(scene:MusicScene)=>Promise<ArrayBuffer>){this.fetcher=fetcher;}
  prefetch(scene:MusicScene){
    let request=this.encoded.get(scene);
    if(!request){
      request=this.fetcher(scene).catch(error=>{if(this.encoded.get(scene)===request)this.encoded.delete(scene);throw error;});
      this.encoded.set(scene,request);
    }
    return request;
  }
  load(scene:MusicScene,context:Pick<AudioContext,'decodeAudioData'>){
    let request=this.decoded.get(scene);
    if(!request){
      request=this.prefetch(scene).then(bytes=>context.decodeAudioData(bytes.slice(0)))
        .then(buffer=>{if(this.decoded.get(scene)===request)this.ready.set(scene,buffer);return buffer;})
        .catch(error=>{if(this.decoded.get(scene)===request)this.decoded.delete(scene);throw error;});
      this.decoded.set(scene,request);
    }
    return request;
  }
  get(scene:MusicScene){return this.ready.get(scene);}
  keep(scene:MusicScene){
    for(const cached of this.decoded.keys())if(cached!=='base'&&cached!==scene){this.decoded.delete(cached);this.ready.delete(cached);}
  }
  clear(){this.encoded.clear();this.decoded.clear();this.ready.clear();}
}
