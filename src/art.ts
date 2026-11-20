import { Assets, Sprite, Spritesheet, type Texture } from 'pixi.js';
import type { Candy } from './game';

export const conceptArt = (name: string) => import.meta.env.BASE_URL + 'art/outback/' + ({ scatter:'scatter-amber', regular:'world-regular', super:'world-super', epic:'world-epic' }[name] ?? name) + '.webp';
export type BoardSymbol = Candy | 'scatter';

export const presentationCandyNames: Record<Candy, string> = {
  berry: 'Gumnuts', lemon: 'Bush Hat', mint: 'Eucalyptus',
  grape: 'Opal', peach: 'Golden Wattle', toffee: 'Billy Can',
};

export async function loadCandyArt() {
  const [sheet, scatter] = await Promise.all([
    Assets.load<Spritesheet>(import.meta.env.BASE_URL + 'art/outback/symbols.json'),
    Assets.load<Texture>(conceptArt('scatter')),
  ]);
  return (candy: BoardSymbol) => {
    const sprite = new Sprite(candy === 'scatter' ? scatter : sheet.textures[candy] as Texture);
    sprite.anchor.set(.5);
    const scale = 81 / Math.max(sprite.width, sprite.height);
    sprite.scale.set(scale);
    return sprite;
  };
}
