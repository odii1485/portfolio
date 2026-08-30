/**
 * Safari / iOS WebKit — detect and apply CSS shell fallbacks.
 * Safari may create a WebGL canvas that never paints; :has(canvas) fallbacks then fail.
 */

export function isSafariBrowser() {
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/i.test(ua);
  const notEmbedded =
    !/CriOS|FxiOS|EdgiOS|OPiOS|mercury|Chrome|Chromium/i.test(ua);
  const desktopSafari = /Safari/i.test(ua) && !/Chrome|Chromium/i.test(ua);
  return (iOS && webkit && notEmbedded) || desktopSafari;
}

export function initSafariShell() {
  if (!isSafariBrowser()) return false;
  document.documentElement.classList.add('rb-safari');
  return true;
}

/** Cap GPU load on Safari/iOS (reduces blank-canvas / context-loss cases). */
export function safariDprCap() {
  if (!isSafariBrowser()) return Math.min(2, window.devicePixelRatio || 1);
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  return mobile ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
}

export function safeMount(mountFn, container, opts = {}) {
  try {
    const cleanup = mountFn(container, opts);
    const canvas = container.querySelector('canvas');
    if (canvas) {
      requestAnimationFrame(() => {
        const gl =
          canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl');
        if (!gl && !container.querySelector('canvas[width]')) {
          container.dataset.rbMountFailed = '1';
          container.closest('section')?.classList.add('rb-section-fallback');
        }
      });
    }
    return cleanup;
  } catch (err) {
    console.warn('[Rahul Web] Background mount failed (Safari/WebGL):', err);
    container.dataset.rbMountFailed = '1';
    container.closest('section')?.classList.add('rb-section-fallback');
    return () => {};
  }
}
