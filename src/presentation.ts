
export function mountPresentation(light: HTMLElement, relic: HTMLElement, instant: () => boolean) {
  const color = {
    land: '#50bcdc',
    scatter: '#ffdc8d',
    tumble: '#ff79db',
    gumleaf: '#ffd075',
    collect: '#5ff5de',
    reset: '#a899ff',
    win: '#ffd18e',
    regular: '#ff87ca',
    super: '#77eaff',
    epic: '#ffd482',
  };
  let scenePulse: Animation | undefined;
  let relicPulse: Animation | undefined;
  let lastScenePulse = -Infinity;
  function signal(event: keyof typeof color) {
    if (instant() || document.hidden) return;
    const now = performance.now();
    if (now - lastScenePulse >= 650) {
      lastScenePulse = now;
      light.style.setProperty('--event-color', color[event]);
      scenePulse?.cancel();
      scenePulse = light.animate([{ opacity: 0 },
        { opacity: event === 'land' ? .14 : .28, offset: .36 },
        { opacity: 0 }], { duration: event === 'epic' ? 840 : 540, easing: 'ease-out' });
    }
    if (event !== 'gumleaf' && event !== 'collect' && event !== 'reset') return;
    relicPulse?.cancel();
    relicPulse = relic.animate([{ filter: 'brightness(1)' },
      { filter: event === 'reset' ? 'brightness(.82)' : 'brightness(1.34)', offset: .24 },
      { filter: 'brightness(1)' }], { duration: 550, easing: 'ease-out' });
  }
  return signal;
}

