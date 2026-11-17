
const key = 'koala-khaos.preferences.v15';
export interface Preferences { speed?: string; sound?: boolean; music?: number; sfx?: number; }
export function loadPreferences(): Preferences {
  try {
    const p = JSON.parse(localStorage.getItem(key) ?? '{}');
    if (!p || typeof p !== 'object') return {};
    const range = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1 ? n : undefined;
    return { speed: ['0', '0.65', '1', '2'].includes(p.speed) ? p.speed : undefined,
      sound: typeof p.sound === 'boolean' ? p.sound : undefined, music: range(p.music), sfx: range(p.sfx) };
  } catch { return {}; }
}
export function storePreferences(p: Preferences) {
  try { localStorage.setItem(key, JSON.stringify(p)); } catch { /* Private browsing can disable persistence. */ }
}

