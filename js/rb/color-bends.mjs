/**
 * Color Bends — React-Bits port (Three.js)
 * @see https://github.com/DavidHDev/react-bits/tree/main/src/content/Backgrounds/ColorBends
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const MAX_COLORS = 8;

const FRAG = `
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

  for (int j = 0; j < 5; j++) {
    if (j >= uIterations - 1) break;
    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
    q += (rr - q) * 0.15;
  }

  vec3 col = vec3(0.0);
  float a = 1.0;

  if (uColorCount > 0) {
    vec2 s = q;
    vec3 sumCol = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < MAX_COLORS; ++i) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, kMix);
      float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
      sumCol += uColors[i] * w;
      cover = max(cover, w);
    }
    col = clamp(sumCol, 0.0, 1.0);
    a = uTransparent > 0 ? cover : 1.0;
  }

  col *= uIntensity;

  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);
  }

  vec3 rgb = (uTransparent > 0) ? col * a : col;
  gl_FragColor = vec4(rgb, a);
}`;

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}`;

function hexToVec3(hex) {
  const h = hex.replace('#', '').trim();
  const v =
    h.length === 3
      ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  return new THREE.Vector3(v[0] / 255, v[1] / 255, v[2] / 255);
}

function parseColors(str, fallback) {
  const list = (str || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  return list.length ? list : fallback;
}

export function mountColorBends(container, opts = {}) {
  const {
    rotation = 90,
    speed = 0.22,
    colors = ['#e9d391', '#a8c6b9', '#6b9fc4', '#8f84c4'],
    transparent = true,
    autoRotate = 0.04,
    scale = 1.1,
    frequency = 1.05,
    warpStrength = 1.1,
    mouseInfluence = 0.65,
    parallax = 0.45,
    noise = 0.08,
    iterations = 3,
    intensity = 1.35,
    bandWidth = 5.5,
  } = opts;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);

  const uColorsArray = Array.from({ length: MAX_COLORS }, () => new THREE.Vector3(0, 0, 0));
  const colorVecs = colors.filter(Boolean).slice(0, MAX_COLORS).map(hexToVec3);
  colorVecs.forEach((v, i) => uColorsArray[i].copy(v));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uCanvas: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uRot: { value: new THREE.Vector2(1, 0) },
      uColorCount: { value: colorVecs.length },
      uColors: { value: uColorsArray },
      uTransparent: { value: transparent ? 1 : 0 },
      uScale: { value: scale },
      uFrequency: { value: frequency },
      uWarpStrength: { value: warpStrength },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: mouseInfluence },
      uParallax: { value: parallax },
      uNoise: { value: noise },
      uIterations: { value: iterations },
      uIntensity: { value: intensity },
      uBandWidth: { value: bandWidth },
    },
    premultipliedAlpha: true,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'high-performance',
    alpha: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, transparent ? 0 : 1);
  Object.assign(renderer.domElement.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    pointerEvents: 'none',
  });
  container.appendChild(renderer.domElement);

  const clock = new THREE.Clock();
  let rotationDeg = rotation;
  const pointerTarget = new THREE.Vector2(0, 0);
  const pointerCurrent = new THREE.Vector2(0, 0);
  let raf = 0;
  let intersecting = false;

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    material.uniforms.uCanvas.value.set(w, h);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const onPointer = (e) => {
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
    const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
    pointerTarget.set(x, y);
  };
  container.addEventListener('pointermove', onPointer, { passive: true });

  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (document.hidden || !intersecting) return;

    const dt = clock.getDelta();
    const elapsed = clock.elapsedTime;
    material.uniforms.uTime.value = elapsed;

    const deg = (rotationDeg % 360) + autoRotate * elapsed;
    const rad = (deg * Math.PI) / 180;
    material.uniforms.uRot.value.set(Math.cos(rad), Math.sin(rad));

    pointerCurrent.lerp(pointerTarget, Math.min(1, dt * 8));
    material.uniforms.uPointer.value.copy(pointerCurrent);

    renderer.render(scene, camera);
  };

  const io = new IntersectionObserver(
    (entries) => {
      intersecting = entries.some((e) => e.isIntersecting);
      if (intersecting && !document.hidden && !raf) raf = requestAnimationFrame(tick);
    },
    { threshold: 0 },
  );
  io.observe(container);
  if (!document.hidden) raf = requestAnimationFrame(tick);

  return () => {
    if (raf) cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    container.removeEventListener('pointermove', onPointer);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };
}

export function mountColorBendsFromEl(el) {
  const colors = parseColors(el.dataset.colors, ['#e9d391', '#a8c6b9', '#6b9fc4', '#8f84c4']);
  return mountColorBends(el, {
    rotation: el.dataset.rotation != null ? parseFloat(el.dataset.rotation) : 90,
    speed: el.dataset.speed != null ? parseFloat(el.dataset.speed) : 0.22,
    colors,
    autoRotate: el.dataset.autoRotate != null ? parseFloat(el.dataset.autoRotate) : 0.04,
    scale: el.dataset.scale != null ? parseFloat(el.dataset.scale) : 1.1,
    frequency: el.dataset.frequency != null ? parseFloat(el.dataset.frequency) : 1.05,
    warpStrength: el.dataset.warpStrength != null ? parseFloat(el.dataset.warpStrength) : 1.1,
    mouseInfluence: el.dataset.mouseInfluence != null ? parseFloat(el.dataset.mouseInfluence) : 0.65,
    intensity: el.dataset.intensity != null ? parseFloat(el.dataset.intensity) : 1.35,
    bandWidth: el.dataset.bandWidth != null ? parseFloat(el.dataset.bandWidth) : 5.5,
    iterations: el.dataset.iterations != null ? parseInt(el.dataset.iterations, 10) : 3,
    noise: el.dataset.noise != null ? parseFloat(el.dataset.noise) : 0.08,
  });
}
