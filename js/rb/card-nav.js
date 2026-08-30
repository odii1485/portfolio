/** CardNav — react-bits (mobile) */

export function initCardNav() {
  const nav = document.querySelector('.card-nav');
  if (!nav || !window.gsap) return;
  if (nav.dataset.cardNavReady) return;
  nav.dataset.cardNavReady = '1';

  const flow = nav.querySelector('.card-nav-flow');
  const links = [...nav.querySelectorAll('.card-nav-link')];
  if (!flow || !links.length) return;

  const moveFlow = (el) => {
    const nr = nav.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    window.gsap.to(flow, {
      top: er.top - nr.top,
      left: er.left - nr.left,
      width: er.width,
      height: er.height,
      duration: 0.42,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onStart: () => flow.classList.add('visible'),
    });
  };

  links.forEach((a) => {
    a.addEventListener('mouseenter', () => moveFlow(a));
    a.addEventListener('focus', () => moveFlow(a));
  });
  nav.addEventListener('mouseleave', () => flow.classList.remove('visible'));
}
