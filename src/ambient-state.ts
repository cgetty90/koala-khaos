// One visibility contract for decoration behind full-screen presentations.
let mounted = false;
export const sceneCovered = () => document.documentElement.dataset.sceneCovered === 'true';
export function mountAmbientState() {
  if (mounted) return;
  mounted = true;
  function update() {
    const covered = Boolean(document.querySelector('#welcome[open],#feature-dialog[open],#celebration[open]'));
    const value = String(covered || document.hidden);
    if (document.documentElement.dataset.sceneCovered === value) return;
    document.documentElement.dataset.sceneCovered = value;
    document.dispatchEvent(new Event('ambientvisibilitychange'));
  }
  const observer = new MutationObserver(update);
  observer.observe(document.body, {subtree:true,attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pageshow', update);
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { observer.disconnect(); document.removeEventListener('visibilitychange',update); window.removeEventListener('pageshow',update); }
  });
  update();
}
