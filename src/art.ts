import { Assets, Sprite, Spritesheet, type Texture } from 'pixi.js';
import type { Candy } from './game';

export const conceptArt = (name: string) => import.meta.env.BASE_URL + 'art/concept/' + name + '.webp';
export type BoardSymbol = Candy | 'scatter';

export const presentationCandyNames: Record<Candy, string> = {
  berry: 'Raspberry Jelly', lemon: 'Honey Star', mint: 'Peppermint Swirl',
  grape: 'Gummy Bear', peach: 'Raspberry Lollipop', toffee: 'Blue Jelly',
};

export async function loadCandyArt() {
  const [sheet, scatter] = await Promise.all([
    Assets.load<Spritesheet>(import.meta.env.BASE_URL + 'art/concept/candies.json'),
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
