/**
 * One-time mobile welcome nudge — suggests desktop for the full experience.
 * Shows only on first visit (localStorage) and viewports ≤768px.
 */
(function initMobileDesktopNudge() {
  const STORAGE_KEY = 'rahul-portfolio-mobile-nudge-v2';
  const MOBILE_MQ = '(max-width: 768px)';

  if (localStorage.getItem(STORAGE_KEY)) return;
  if (!window.matchMedia(MOBILE_MQ).matches) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.createElement('div');
  root.id = 'mobile-desktop-nudge';
  root.className = 'mobile-nudge';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'mobile-nudge-title');
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="mobile-nudge__backdrop" data-nudge-close aria-hidden="true"></div>
    <div class="mobile-nudge__card">
      <button type="button" class="mobile-nudge__close" data-nudge-close aria-label="Close">&times;</button>
      <div class="mobile-nudge__orbit" aria-hidden="true">
        <span class="mobile-nudge__spark mobile-nudge__spark--1">✦</span>
        <span class="mobile-nudge__spark mobile-nudge__spark--2">◇</span>
        <span class="mobile-nudge__spark mobile-nudge__spark--3">✦</span>
      </div>
      <div class="mobile-nudge__monitor" aria-hidden="true">
        <div class="mobile-nudge__screen">
          <span class="mobile-nudge__cursor"></span>
        </div>
        <div class="mobile-nudge__stand"></div>
      </div>
      <p class="mobile-nudge__badge">Plot twist · pocket mode</p>
      <h2 id="mobile-nudge-title" class="mobile-nudge__title">Works on mobile.<br><em>Slaps</em> on desktop.</h2>
      <p class="mobile-nudge__body">
        Like watching a blockbuster on a flip phone — totally doable, but the director's cut
        is on a bigger screen. Copy the link, open it on your laptop, and act like you found a secret level.
      </p>
      <p class="mobile-nudge__hint">One-time message. Zero spam. Scout's honour.</p>
      <div class="mobile-nudge__actions">
        <button type="button" class="mobile-nudge__btn mobile-nudge__btn--primary" data-nudge-close>
          I'm good on mobile
        </button>
        <button type="button" class="mobile-nudge__btn mobile-nudge__btn--ghost" data-nudge-copy>
          Copy site link
        </button>
      </div>
      <p class="mobile-nudge__copy-msg" id="mobile-nudge-copy-msg" hidden aria-live="polite">Link copied — open on your computer when you can.</p>
    </div>
  `;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mobile-nudge-open');
    setTimeout(() => root.remove(), 450);
  };

  const open = () => {
    document.body.appendChild(root);
    requestAnimationFrame(() => {
      root.classList.add('is-open');
      root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('mobile-nudge-open');
      root.querySelector('.mobile-nudge__btn--primary')?.focus();
    });
  };

  root.querySelectorAll('[data-nudge-close]').forEach((el) => {
    el.addEventListener('click', dismiss);
  });

  root.querySelector('[data-nudge-copy]')?.addEventListener('click', async () => {
    const url = window.location.origin + window.location.pathname;
    const msg = root.querySelector('#mobile-nudge-copy-msg');
    try {
      await navigator.clipboard.writeText(url);
      if (msg) {
        msg.hidden = false;
        msg.textContent = 'Link copied — paste it on your laptop.';
      }
    } catch {
      if (msg) {
        msg.hidden = false;
        msg.textContent = url;
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-open')) dismiss();
  });

  const delay = reducedMotion ? 400 : 1600;
  setTimeout(open, delay);

  window.matchMedia(MOBILE_MQ).addEventListener('change', (e) => {
    if (!e.matches && root.parentNode) dismiss();
  });
})();
