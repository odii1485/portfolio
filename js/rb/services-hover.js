/**
 * Services rows — Flowing Menu hover (marquee + pill images)
 */

import { buildMarqueeLayer, initMenuItem } from './flowing-menu-core.js';

function getServiceTitle(row) {
  const fromData = row.dataset.svcTitle;
  if (fromData) return fromData.replace(/&amp;/g, '&');
  const h3 = row.querySelector('.svc-info h3');
  if (!h3) return 'Service';
  const clone = h3.cloneNode(true);
  clone.querySelector('.svc-new-badge')?.remove();
  return clone.textContent.trim();
}

function initServiceRow(row) {
  if (row.dataset.svcFlowReady) return;

  const title = getServiceTitle(row);
  const image = row.dataset.svcImage || '';
  const speed = 12;

  const flowShell = document.createElement('div');
  flowShell.className = 'svc-row__flow';

  const { marquee, inner, part } = buildMarqueeLayer(title.toUpperCase(), image, speed);
  flowShell.appendChild(marquee);
  row.appendChild(flowShell);

  const hideOnShow = [
    ...row.querySelectorAll('.svc-num, .svc-info, .svc-arrow, .svc-accent-bar'),
  ];

  row.classList.add('svc-row--flowing');
  row.dataset.svcFlowReady = '1';

  initMenuItem(row, marquee, inner, part, speed, {
    isDisabled: () => window.matchMedia('(max-width: 768px)').matches,
    hideOnShow,
  });
}

export function initServicesHover() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.gsap) return;

  document.querySelectorAll('#services .svc-row.svc-stack').forEach(initServiceRow);
}

window.__initServicesHover = initServicesHover;
