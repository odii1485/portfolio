/**
 * 3D Circular Gallery — arrows, auto-loop, flip-to-read, full badge visibility
 */
import { mountCircularGallery } from './circular-gallery.mjs';

function collectCertMeta(gallery) {
  const store = gallery.querySelector('.cert-data-store') || gallery.querySelector('.cert-scroll');
  return [...store.querySelectorAll('.cert-card')].map((card) => ({
    image: card.querySelector('.cert-badge-img')?.src || '',
    title: card.querySelector('.cert-front h4')?.textContent?.trim() || 'Certification',
    tag: card.querySelector('.cert-card-tag')?.textContent?.trim() || '',
    year: card.querySelector('.cert-card-year')?.textContent?.trim() || '',
    backYear: card.querySelector('.cert-back-year')?.textContent?.trim() || '',
    backTitle: card.querySelector('.cert-back h4')?.textContent?.trim() || '',
    backText: card.querySelector('.cert-back p')?.textContent?.trim() || '',
    backFoot: card.querySelector('.cert-back-foot')?.textContent?.trim() || '',
    isNew: card.classList.contains('cert-card-new'),
  })).filter((m) => m.image);
}

/** Index of the cert under the pointer (or nearest to viewport centre). */
function getActiveIndex(app, metaLen, clientX = null) {
  if (!app?.medias?.length) return 0;

  const container = app.container;
  const rect = container?.getBoundingClientRect?.();
  const halfView = (app.viewport?.width || 0) / 2;

  if (clientX != null && rect && halfView > 0) {
    const centerPx = rect.left + rect.width / 2;
    let best = 0;
    let minDist = Infinity;
    for (const media of app.medias) {
      const worldX = media.plane?.position?.x ?? 0;
      const screenX = centerPx + (worldX / halfView) * (rect.width / 2);
      const d = Math.abs(clientX - screenX);
      if (d < minDist) {
        minDist = d;
        best = media.index % metaLen;
      }
    }
    return best;
  }

  const width = app.medias[0].width;
  if (width > 0) {
    const scrollPos = app.scroll?.target ?? app.scroll?.current ?? 0;
    return Math.round(Math.abs(scrollPos) / width) % metaLen;
  }

  let best = 0;
  let minDist = Infinity;
  for (const media of app.medias) {
    const x = media.plane?.position?.x ?? 0;
    const d = Math.abs(x);
    if (d < minDist) {
      minDist = d;
      best = media.index % metaLen;
    }
  }
  return best;
}

function buildFrontHtml(m) {
  return `
    <div class="cert-badge-wrap">
      <img class="cert-badge-img" src="${m.image}" alt="${m.title}">
    </div>
    ${m.tag ? `<span class="cert-card-tag">${m.tag}</span>` : ''}
    <h4>${m.title}</h4>
    ${m.year ? `<span class="cert-card-year">${m.year}</span>` : ''}
  `;
}

function buildBackHtml(m) {
  return `
    ${m.backYear ? `<span class="cert-back-year">${m.backYear}</span>` : ''}
    <h4>${m.backTitle || m.title}</h4>
    ${m.backText ? `<p>${m.backText}</p>` : ''}
    ${m.backFoot ? `<span class="cert-back-foot">${m.backFoot}</span>` : ''}
  `;
}

function buildFlipPanel(gallery, meta) {
  let panel = gallery.querySelector('.cert-flip-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'cert-flip-panel';
    panel.innerHTML = `
      <div class="cert-flip-panel-backdrop" data-cert-flip-close aria-hidden="true"></div>
      <div class="cert-flip-panel-card glass-panel-heavy">
        <button type="button" class="cert-flip-panel-close" data-cert-flip-close aria-label="Close">×</button>
        <p class="cert-flip-panel-hint">Tap ↻ or card to flip · Esc to close</p>
        <div class="cert-flip-panel-inner">
          <div class="cert-flip cert-flip-panel-flip">
            <div class="cert-face cert-front"></div>
            <div class="cert-face cert-back"></div>
          </div>
        </div>
      </div>
    `;
    gallery.appendChild(panel);
  }

  const close = () => {
    panel.classList.remove('is-open');
    panel.querySelector('.cert-flip-panel-flip')?.classList.remove('is-flipped');
  };

  panel.querySelectorAll('[data-cert-flip-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  const flip = panel.querySelector('.cert-flip-panel-flip');
  const front = panel.querySelector('.cert-flip-panel-flip .cert-front');
  const back = panel.querySelector('.cert-flip-panel-flip .cert-back');

  panel.querySelector('.cert-flip-panel-card')?.addEventListener('click', (e) => {
    if (e.target.closest('[data-cert-flip-close], .cert-flip-panel-close')) return;
    flip?.classList.toggle('is-flipped');
  });

  return {
    open(index) {
      const m = meta[index];
      if (!m) return;
      front.innerHTML = buildFrontHtml(m);
      back.innerHTML = buildBackHtml(m);
      flip.classList.remove('is-flipped');
      panel.classList.add('is-open');
    },
    close,
  };
}

function setupCertInfiniteLinear(gallery) {
  const linear = gallery.querySelector('.cert-scroll');
  const track = linear?.querySelector('.cert-scroll-track');
  if (!linear || !track || track.dataset.certInfiniteReady) return false;

  const cards = [...track.querySelectorAll('.cert-card')];
  if (cards.length < 2) return false;

  if (!track.dataset.certDuplicated) {
    const clones = cards.map((card) => {
      const clone = card.cloneNode(true);
      clone.classList.remove('reveal');
      clone.classList.add('visible');
      clone.setAttribute('aria-hidden', 'true');
      return clone;
    });
    clones.forEach((clone) => track.appendChild(clone));
    track.dataset.certDuplicated = '1';
  }

  track.dataset.certInfiniteReady = '1';
  track.style.animation = '';
  track.style.transform = '';
  linear.classList.remove('is-rb-hidden');
  gallery.dataset.certGalleryReady = '1';
  gallery.classList.add('cert-infinite-active');
  window.__certLinearMode = true;
  return true;
}

export function initCertGallery() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const gallery = document.querySelector('[data-cert-gallery]');
  if (!gallery || gallery.dataset.certGalleryReady) return;

  const linear = gallery.querySelector('.cert-scroll');
  const prevBtn = gallery.querySelector('.cert-nav-prev');
  const nextBtn = gallery.querySelector('.cert-nav-next');

  if (window.innerWidth <= 768) {
    window.__certLinearMode = true;
    if (linear) linear.classList.remove('is-rb-hidden');
    /* main.js owns touch + auto-scroll on the linear track */
    return;
  }

  const meta = collectCertMeta(gallery);
  if (meta.length < 2) return;

  gallery.dataset.certGalleryReady = '1';
  gallery.setAttribute('data-cert-orbit', '');
  window.__certOrbitMode = true;

  if (linear) {
    linear.classList.add('cert-data-store');
    linear.setAttribute('aria-hidden', 'true');
    linear.classList.remove('is-rb-hidden');
    linear.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
  }

  let container = gallery.querySelector('.circular-gallery');
  if (!container) {
    container = document.createElement('div');
    container.className = 'circular-gallery';
    gallery.insertBefore(container, linear || null);
  }

  const items = meta.map((m) => ({ image: m.image, text: '' }));

  if (gallery.__rbCircularApp?.destroy) gallery.__rbCircularApp.destroy();

  const app = mountCircularGallery(container, {
    items,
    bend: 2.2,
    textColor: '#e9d391',
    borderRadius: 0.06,
    font: 'bold 22px Inter, sans-serif',
    scrollSpeed: 2,
    scrollEase: 0.06,
  });

  gallery.__rbCircularApp = app;

  const flipUI = buildFlipPanel(gallery, meta);

  const step = () => (app.medias?.[0]?.width || 1);

  const navClick = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  prevBtn?.addEventListener('click', navClick(() => {
    app.scroll.target += step();
    app.onCheck?.();
  }));

  nextBtn?.addEventListener('click', navClick(() => {
    app.scroll.target -= step();
    app.onCheck?.();
  }));

  prevBtn?.removeAttribute('hidden');
  nextBtn?.removeAttribute('hidden');

  let autoOn = true;
  let autoId = 0;

  const startAuto = () => {
    cancelAnimationFrame(autoId);
    const tick = () => {
      if (autoOn && !app.isDown) {
        app.scroll.target -= app.scrollSpeed * 0.14;
      }
      autoId = requestAnimationFrame(tick);
    };
    autoId = requestAnimationFrame(tick);
  };

  gallery.addEventListener('mouseenter', () => {
    autoOn = false;
  });
  gallery.addEventListener('mouseleave', () => {
    autoOn = true;
  });

  let dragMoved = false;
  container.addEventListener('mousedown', () => { dragMoved = false; });
  container.addEventListener('mousemove', () => {
    if (app.isDown) dragMoved = true;
  });
  container.addEventListener('click', (e) => {
    if (dragMoved) return;
    const idx = getActiveIndex(app, meta.length, e.clientX);
    flipUI.open(idx);
  });

  startAuto();

  const hint = document.createElement('p');
  hint.className = 'cert-gallery-kbd-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = '← → to browse · Enter to open · Esc to close';
  gallery.querySelector('.container')?.appendChild(hint);

  document.addEventListener('keydown', (e) => {
    const panel = gallery.querySelector('.cert-flip-panel');
    const panelOpen = panel?.classList.contains('is-open');
    const inGallery =
      panelOpen ||
      document.activeElement === container ||
      gallery.contains(document.activeElement);
    if (!inGallery) return;
    if (e.key === 'Escape' && panelOpen) {
      flipUI.close();
      return;
    }
    if (!panelOpen && (e.key === 'Enter' || e.key === ' ')) {
      if (document.activeElement?.closest('[data-cert-gallery]')) {
        e.preventDefault();
        flipUI.open(getActiveIndex(app, meta.length) % meta.length);
      }
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      app.scroll.target += step();
      app.onCheck?.();
      if (panelOpen) flipUI.open(getActiveIndex(app, meta.length) % meta.length);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      app.scroll.target -= step();
      app.onCheck?.();
      if (panelOpen) flipUI.open(getActiveIndex(app, meta.length) % meta.length);
    }
  });

  container.setAttribute('tabindex', '0');
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Certification gallery. Use arrow keys to browse.');

  const onResize = () => {
    if (window.innerWidth <= 768) {
      flipUI.close();
      autoOn = false;
    }
  };
  window.addEventListener('resize', onResize);
}
