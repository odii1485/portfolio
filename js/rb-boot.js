/**
 * Loads React-Bits ES modules only over http/https.
 * Opening index.html via file:// blocks modules (browser CORS) — use a local server.
 */
(function () {
  const isHttp =
    location.protocol === 'http:' || location.protocol === 'https:';

  if (!isHttp) {
    document.documentElement.classList.add('rb-file-protocol');
    console.info(
      '%c[Rahul Web]%c Animated backgrounds require a local server (file:// blocks ES modules).\n\n' +
        '  cd to this project folder, then run:\n' +
        '  npx --yes serve .\n\n' +
        '  Open http://localhost:3000 in your browser.\n' +
        '  (Netlify deploy uses https — works there automatically.)',
      'color:#c9b896;font-weight:700',
      'color:#b8b8b8'
    );
    return;
  }

  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'js/rb/index.mjs';
  script.onerror = () => {
    document.documentElement.classList.add('rb-file-protocol');
    console.error(
      '[Rahul Web] Could not load js/rb/index.mjs — use npm start and open http://localhost:3000 (check path + OGL CDN).'
    );
  };
  window.addEventListener('unhandledrejection', (e) => {
    if (String(e.reason?.stack || e.reason || '').includes('rb/')) {
      console.error('[Rahul Web] React-Bits module error:', e.reason);
    }
  });
  document.body.appendChild(script);
})();
