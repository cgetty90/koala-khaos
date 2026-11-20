import { Assets, Sprite, type Texture } from 'pixi.js';
import type { Candy } from './game';

export const conceptArt = (name: string) => import.meta.env.BASE_URL + 'art/outback/' + ({ scatter:'scatter-amber', regular:'world-regular', super:'world-super', epic:'world-epic' }[name] ?? name) + '.webp';
export type BoardSymbol = Candy | 'scatter';

export const presentationCandyNames: Record<Candy, string> = {
  berry: 'Gumnuts', lemon: 'Bush Hat', mint: 'Eucalyptus',
  grape: 'Opal', peach: 'Golden Wattle', toffee: 'Billy Can',
};


export async function loadCandyArt() {
 const files={berry:'gumnuts-2x',lemon:'bush-hat-2x',mint:'eucalyptus-2x',grape:'opal-premium',peach:'wattle-2x',toffee:'billy-premium',scatter:'scatter-amber-2x'};
 const textures=Object.fromEntries(await Promise.all(Object.entries(files).map(async([key,name])=>[key,await Assets.load<Texture>(import.meta.env.BASE_URL+'premium/'+name+'.webp')])));
 return (candy:BoardSymbol)=>{
   const sprite=new Sprite(textures[candy] as Texture);
   sprite.anchor.set(.5);
   sprite.scale.set(81/Math.max(sprite.width,sprite.height));
   return sprite;
 };
}
