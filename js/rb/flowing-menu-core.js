/** Shared FlowingMenu primitives (react-bits) */

export function distMetric(x, y, x2, y2) {
  const xDiff = x - x2;
  const yDiff = y - y2;
  return xDiff * xDiff + yDiff * yDiff;
}

export function findClosestEdge(mouseX, mouseY, width, height) {
  const top = distMetric(mouseX, mouseY, width / 2, 0);
  const bottom = distMetric(mouseX, mouseY, width / 2, height);
  return top < bottom ? 'top' : 'bottom';
}

export function createMarqueePart(text, image) {
  const part = document.createElement('div');
  part.className = 'marquee__part';
  const span = document.createElement('span');
  span.textContent = text;
  part.appendChild(span);
  if (image) {
    const img = document.createElement('div');
    img.className = 'marquee__img';
    img.style.backgroundImage = `url('${image}')`;
    part.appendChild(img);
  }
  return part;
}

/**
 * @param {HTMLElement} item
 * @param {object} [opts]
 * @param {() => boolean} [opts.isDisabled] skip hover (mobile)
 * @param {HTMLElement[]} [opts.hideOnShow] elements to fade when marquee shows
 */
export function initMenuItem(item, marquee, inner, part, speed = 15, opts = {}) {
  const gsap = window.gsap;
  if (!gsap) return;

  const isDisabled = opts.isDisabled || (() => window.matchMedia('(max-width: 768px)').matches);
  const hideOnShow = opts.hideOnShow || [];

  let anim = null;
  const defaults = { duration: 0.6, ease: 'expo.out' };

  const setupMarquee = () => {
    const contentWidth = part.offsetWidth;
    if (!contentWidth) return;
    const needed = Math.max(4, Math.ceil(window.innerWidth / contentWidth) + 2);
    inner.innerHTML = '';
    for (let i = 0; i < needed; i++) {
      inner.appendChild(part.cloneNode(true));
    }
    if (anim) anim.kill();
    anim = gsap.to(inner, { x: -contentWidth, duration: speed, ease: 'none', repeat: -1 });
  };

  setTimeout(setupMarquee, 50);
  window.addEventListener('resize', setupMarquee);

  gsap.set(marquee, { y: '101%' });
  gsap.set(inner, { y: '-101%' });

  const showMarquee = (edge) => {
    const tl = gsap.timeline({ defaults });
    if (hideOnShow.length) {
      tl.to(hideOnShow, { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0);
    }
    tl.set(marquee, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(inner, { y: edge === 'top' ? '101%' : '-101%' }, 0)
      .to([marquee, inner], { y: '0%' }, 0);
    item.classList.add('is-flow-active');
    marquee.style.visibility = 'visible';
  };

  const hideMarquee = (edge) => {
    const tl = gsap.timeline({ defaults });
    tl.to(marquee, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(inner, { y: edge === 'top' ? '101%' : '-101%' }, 0);
    if (hideOnShow.length) {
      tl.to(hideOnShow, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.1);
    }
    item.classList.remove('is-flow-active');
    marquee.style.visibility = '';
  };

  item.addEventListener('mouseenter', (ev) => {
    if (isDisabled()) return;
    const rect = item.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);
    showMarquee(edge);
  });

  item.addEventListener('mouseleave', (ev) => {
    if (isDisabled()) return;
    const rect = item.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);
    hideMarquee(edge);
    item.classList.remove('is-active');
  });

  item.addEventListener('click', (ev) => {
    if (!isDisabled()) return;
    const link = item.querySelector('.menu__item-link, .svc-row__surface');
    if (link && (ev.target === link || link.contains(ev.target))) return;

    ev.preventDefault();
    const wasActive = item.classList.contains('is-active');
    const menu = item.closest('.menu');
    const scope = menu || item.parentElement;
    scope?.querySelectorAll('.menu__item, .svc-row__flow').forEach((other) => {
      if (other === item) return;
      other.classList.remove('is-active', 'is-flow-active');
      const otherMarquee = other.querySelector('.marquee');
      const otherInner = other.querySelector('.marquee__inner');
      if (otherMarquee && otherInner) {
        gsap.set(otherMarquee, { y: '101%' });
        gsap.set(otherInner, { y: '-101%' });
      }
      if (hideOnShow.length && other === item) return;
    });

    if (wasActive) {
      item.classList.remove('is-active');
      hideMarquee('bottom');
    } else {
      item.classList.add('is-active');
      showMarquee('bottom');
    }
  });

  return { setupMarquee };
}

export function buildMarqueeLayer(text, image, speed = 14) {
  const marquee = document.createElement('div');
  marquee.className = 'marquee';
  const innerWrap = document.createElement('div');
  innerWrap.className = 'marquee__inner-wrap';
  const inner = document.createElement('div');
  inner.className = 'marquee__inner';
  const part = createMarqueePart(text, image);
  inner.appendChild(part);
  innerWrap.appendChild(inner);
  marquee.appendChild(innerWrap);
  return { marquee, innerWrap, inner, part, speed };
}
