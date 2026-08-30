/** ImageTrail variant 4 — react-bits (GSAP) */

function lerp(a, b, n) {
  return (1 - n) * a + n * b;
}

function getLocalPointerPos(e, rect) {
  let clientX = 0;
  let clientY = 0;
  if (e.touches?.length) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function getMouseDistance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

class ImageItem {
  constructor(DOM_el) {
    this.DOM = { el: DOM_el, inner: DOM_el.querySelector('.content__img-inner') };
    this.defaultStyle = { scale: 1, x: 0, y: 0, opacity: 0 };
    this.getRect();
    this.resize = () => {
      window.gsap?.set(this.DOM.el, this.defaultStyle);
      this.getRect();
    };
    window.addEventListener('resize', this.resize);
  }

  getRect() {
    this.rect = this.DOM.el.getBoundingClientRect();
  }
}

class ImageTrailVariant4 {
  constructor(container) {
    this.container = container;
    this.images = [...container.querySelectorAll('.content__img')].map((img) => new ImageItem(img));
    this.imagesTotal = this.images.length;
    this.imgPosition = 0;
    this.zIndexVal = 1;
    this.activeImagesCount = 0;
    this.isIdle = true;
    this.threshold = 80;
    this.mousePos = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    this.cacheMousePos = { x: 0, y: 0 };

    const handlePointerMove = (ev) => {
      const rect = container.getBoundingClientRect();
      this.mousePos = getLocalPointerPos(ev, rect);
    };
    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('touchmove', handlePointerMove, { passive: true });

    const initRender = (ev) => {
      const rect = container.getBoundingClientRect();
      this.mousePos = getLocalPointerPos(ev, rect);
      this.cacheMousePos = { ...this.mousePos };
      requestAnimationFrame(() => this.render());
      container.removeEventListener('mousemove', initRender);
      container.removeEventListener('touchmove', initRender);
    };
    container.addEventListener('mousemove', initRender);
    container.addEventListener('touchmove', initRender, { passive: true });
  }

  render() {
    const distance = getMouseDistance(this.mousePos, this.lastMousePos);
    if (distance > this.threshold) {
      this.showNextImage();
      this.lastMousePos = { ...this.mousePos };
    }
    this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
    this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);
    if (this.isIdle && this.zIndexVal !== 1) this.zIndexVal = 1;
    requestAnimationFrame(() => this.render());
  }

  showNextImage() {
    const gsap = window.gsap;
    if (!gsap) return;
    ++this.zIndexVal;
    this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
    const img = this.images[this.imgPosition];
    gsap.killTweensOf(img.DOM.el);

    let dx = this.mousePos.x - this.cacheMousePos.x;
    let dy = this.mousePos.y - this.cacheMousePos.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance !== 0) {
      dx /= distance;
      dy /= distance;
    }
    dx *= distance / 100;
    dy *= distance / 100;

    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated(),
      })
      .fromTo(
        img.DOM.el,
        {
          opacity: 1,
          scale: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - img.rect.width / 2,
          y: this.cacheMousePos.y - img.rect.height / 2,
        },
        {
          duration: 0.4,
          ease: 'power1',
          scale: 1,
          x: this.mousePos.x - img.rect.width / 2,
          y: this.mousePos.y - img.rect.height / 2,
        },
        0
      )
      .fromTo(
        img.DOM.inner,
        {
          scale: 2,
          filter: `brightness(${Math.max((400 * distance) / 100, 100)}%) contrast(${Math.max((400 * distance) / 100, 100)}%)`,
        },
        { duration: 0.4, ease: 'power1', scale: 1, filter: 'brightness(100%) contrast(100%)' },
        0
      )
      .to(img.DOM.el, { duration: 0.4, ease: 'power3', opacity: 0 }, 0.4)
      .to(img.DOM.el, { duration: 1.5, ease: 'power4', x: `+=${dx * 110}`, y: `+=${dy * 110}` }, 0.05);
  }

  onImageActivated() {
    this.activeImagesCount++;
    this.isIdle = false;
  }

  onImageDeactivated() {
    this.activeImagesCount--;
    if (this.activeImagesCount === 0) this.isIdle = true;
  }
}

const TRAIL_SRCS = [
  'assets/projects/wine-b2b.jpg',
  'assets/projects/data-cloud-ai.jpg',
  'assets/projects/shopify-overhaul.jpg',
  'assets/projects/sfcc-personal-care.jpg',
  'assets/projects/travel-sfcc.jpg',
];

export function initImageTrail() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (!window.gsap) return;

  const block = document.getElementById('cta-block');
  if (!block || block.dataset.rbImageTrail) return;
  block.dataset.rbImageTrail = '1';
  block.classList.add('content');
  document.getElementById('cta-trail')?.setAttribute('hidden', '');

  let pool = block.querySelector('.content__img-pool');
  if (!pool) {
    pool = document.createElement('div');
    pool.className = 'content__img-pool';
    pool.setAttribute('aria-hidden', 'true');
    TRAIL_SRCS.forEach((src) => {
      const el = document.createElement('div');
      el.className = 'content__img';
      const inner = document.createElement('div');
      inner.className = 'content__img-inner';
      inner.style.backgroundImage = `url('${src}')`;
      el.appendChild(inner);
      pool.appendChild(el);
    });
    block.insertBefore(pool, block.firstChild);
  }

  window.__rbImageTrail = new ImageTrailVariant4(block);
}
