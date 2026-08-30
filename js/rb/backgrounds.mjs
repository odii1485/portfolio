/**
 * React-Bits backgrounds — vanilla JS ports (Prism, Gradient Blinds, Line Waves).
 * @see https://github.com/DavidHDev/react-bits
 */
import { Renderer, Triangle, Program, Mesh } from 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm';
import { mountLightRays } from './light-rays.mjs';
import { mountShapeGrid } from './shape-grid.mjs';
import { initSafariShell, isSafariBrowser, safeMount, safariDprCap } from './safari-support.js';

const MAX_COLORS = 8;
const BRAND = {
  accent: '#bdd4c8',
  cyan: '#6b9fc4',
  pink: '#b87d96',
  purple: '#8f84c4',
  dark: '#0a0a0a',
};

const INTENSITY_PRESETS = {
  minimal: { opacity: 0.52, blindCount: 10 },
  soft: { opacity: 0.62, blindCount: 14 },
  normal: { opacity: 0.72, blindCount: 16 },
};

const GB_GRADIENT = ['#e9d391', '#a8c6b9', '#3a4540', '#5a6d85', '#0e0e10'];

const LINE_WAVES_PALETTES = {
  default: [BRAND.accent, BRAND.pink, BRAND.cyan],
  cool: [BRAND.cyan, BRAND.purple, '#1a535c'],
};

/* ─── Color helpers ─────────────────────────────────────────── */

export function hexToRGB(hex) {
  const c = hex.replace('#', '').padEnd(6, '0');
  return [
    parseInt(c.slice(0, 2), 16) / 255,
    parseInt(c.slice(2, 4), 16) / 255,
    parseInt(c.slice(4, 6), 16) / 255,
  ];
}

export function hexToVec3(hex) {
  return hexToRGB(hex);
}

export function prepStops(stops) {
  const base = (stops && stops.length ? stops : ['#FF9FFC', '#5227FF']).slice(0, MAX_COLORS);
  if (base.length === 1) base.push(base[0]);
  while (base.length < MAX_COLORS) base.push(base[base.length - 1]);
  const arr = [];
  for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRGB(base[i]));
  const count = Math.max(2, Math.min(MAX_COLORS, stops?.length ?? 2));
  return { arr, count };
}

/* ─── Visibility-aware RAF loop ─────────────────────────────── */

export function createVisibilityLoop(container, renderFn) {
  let raf = 0;
  let intersecting = false;

  const tick = (t) => {
    raf = requestAnimationFrame(tick);
    if (document.hidden || !intersecting) return;
    renderFn(t);
  };

  const start = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      intersecting = entries.some((e) => e.isIntersecting);
      if (intersecting && !document.hidden) start();
      else stop();
    },
    { threshold: 0 },
  );

  const onVisibilityChange = () => {
    if (document.hidden) stop();
    else if (intersecting) start();
  };

  io.observe(container);
  document.addEventListener('visibilitychange', onVisibilityChange);
  if (!document.hidden) start();

  return () => {
    stop();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

function styleCanvas(canvas) {
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
  });
}

function destroyGl({ program, geometry, mesh, renderer }) {
  const callIfFn = (obj, key) => {
    if (obj && typeof obj[key] === 'function') obj[key].call(obj);
  };
  callIfFn(program, 'remove');
  callIfFn(geometry, 'remove');
  callIfFn(mesh, 'remove');
  callIfFn(renderer, 'destroy');
}

/* ─── Prism ─────────────────────────────────────────────────── */

const PRISM_VERTEX = /* glsl */ `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const PRISM_FRAGMENT = /* glsl */ `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;

uniform float uHeight;
uniform float uBaseHalf;
uniform mat3 uRot;
uniform int uUseBaseWobble;
uniform float uGlow;
uniform vec2 uOffsetPx;
uniform float uNoise;
uniform float uSaturation;
uniform float uScale;
uniform float uHueShift;
uniform float uColorFreq;
uniform float uBloom;
uniform float uCenterShift;
uniform float uInvBaseHalf;
uniform float uInvHeight;
uniform float uMinAxis;
uniform float uPxScale;
uniform float uTimeScale;

vec4 tanh4(vec4 x){
  vec4 e2x = exp(2.0*x);
  return (e2x - 1.0) / (e2x + 1.0);
}

float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
}

float sdOctaAnisoInv(vec3 p){
  vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
  float m = q.x + q.y + q.z - 1.0;
  return m * uMinAxis * 0.5773502691896258;
}

float sdPyramidUpInv(vec3 p){
  float oct = sdOctaAnisoInv(p);
  float halfSpace = -p.y;
  return max(oct, halfSpace);
}

mat3 hueRotation(float a){
  float c = cos(a), s = sin(a);
  mat3 W = mat3(
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114
  );
  mat3 U = mat3(
    0.701, -0.587, -0.114,
    -0.299, 0.413, -0.114,
    -0.300, -0.588, 0.886
  );
  mat3 V = mat3(
    0.168, -0.331, 0.500,
    0.328, 0.035, -0.500,
    -0.497, 0.296, 0.201
  );
  return W + U * c + V * s;
}

void main(){
  vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;

  float z = 5.0;
  float d = 0.0;

  vec3 p;
  vec4 o = vec4(0.0);

  float centerShift = uCenterShift;
  float cf = uColorFreq;

  mat2 wob = mat2(1.0);
  if (uUseBaseWobble == 1) {
    float t = iTime * uTimeScale;
    float c0 = cos(t + 0.0);
    float c1 = cos(t + 33.0);
    float c2 = cos(t + 11.0);
    wob = mat2(c0, c1, c2, c0);
  }

  const int STEPS = 100;
  for (int i = 0; i < STEPS; i++) {
    p = vec3(f, z);
    p.xz = p.xz * wob;
    p = uRot * p;
    vec3 q = p;
    q.y += centerShift;
    d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
    z -= d;
    o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
  }

  o = tanh4(o * o * (uGlow * uBloom) / 1e5);

  vec3 col = o.rgb;
  float n = rand(gl_FragCoord.xy + vec2(iTime));
  col += (n - 0.5) * uNoise;
  col = clamp(col, 0.0, 1.0);

  float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);

  if(abs(uHueShift) > 0.0001){
    col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
  }

  gl_FragColor = vec4(col, o.a);
}
`;

export function mountPrism(container, opts = {}) {
  const {
    height = 3.5,
    baseWidth = 5.5,
    animationType = 'rotate',
    glow = 0.85,
    offset = { x: 0, y: 0 },
    noise = 0.35,
    transparent = true,
    scale = 3.2,
    hueShift = 0,
    colorFrequency = 1,
    hoverStrength = 2,
    inertia = 0.05,
    bloom = 1,
    suspendWhenOffscreen = true,
    timeScale = 0.45,
  } = opts;

  const H = Math.max(0.001, height);
  const BW = Math.max(0.001, baseWidth);
  const BASE_HALF = BW * 0.5;
  const GLOW = Math.max(0, glow);
  const NOISE = Math.max(0, noise);
  const offX = offset?.x ?? 0;
  const offY = offset?.y ?? 0;
  const SAT = transparent ? 1.5 : 1;
  const SCALE = Math.max(0.001, scale);
  const HUE = hueShift || 0;
  const CFREQ = Math.max(0, colorFrequency || 1);
  const BLOOM = Math.max(0, bloom || 1);
  const TS = Math.max(0, timeScale || 1);
  const HOVSTR = Math.max(0, hoverStrength || 1);
  const INERT = Math.max(0, Math.min(1, inertia || 0.12));

  const dpr = safariDprCap();
  const renderer = new Renderer({ dpr, alpha: transparent, antialias: false });
  const gl = renderer.gl;
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);

  styleCanvas(gl.canvas);
  container.appendChild(gl.canvas);

  const iResBuf = new Float32Array(2);
  const offsetPxBuf = new Float32Array(2);
  const rotBuf = new Float32Array(9);

  const program = new Program(gl, {
    vertex: PRISM_VERTEX,
    fragment: PRISM_FRAGMENT,
    uniforms: {
      iResolution: { value: iResBuf },
      iTime: { value: 0 },
      uHeight: { value: H },
      uBaseHalf: { value: BASE_HALF },
      uUseBaseWobble: { value: animationType === 'rotate' ? 1 : 0 },
      uRot: { value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) },
      uGlow: { value: GLOW },
      uOffsetPx: { value: offsetPxBuf },
      uNoise: { value: NOISE },
      uSaturation: { value: SAT },
      uScale: { value: SCALE },
      uHueShift: { value: HUE },
      uColorFreq: { value: CFREQ },
      uBloom: { value: BLOOM },
      uCenterShift: { value: H * 0.25 },
      uInvBaseHalf: { value: 1 / BASE_HALF },
      uInvHeight: { value: 1 / H },
      uMinAxis: { value: Math.min(BASE_HALF, H) },
      uPxScale: { value: 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE) },
      uTimeScale: { value: TS },
    },
  });

  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h);
    iResBuf[0] = gl.drawingBufferWidth;
    iResBuf[1] = gl.drawingBufferHeight;
    offsetPxBuf[0] = offX * dpr;
    offsetPxBuf[1] = offY * dpr;
    program.uniforms.uPxScale.value = 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const setMat3FromEuler = (yawY, pitchX, rollZ, out) => {
    const cy = Math.cos(yawY), sy = Math.sin(yawY);
    const cx = Math.cos(pitchX), sx = Math.sin(pitchX);
    const cz = Math.cos(rollZ), sz = Math.sin(rollZ);
    out[0] = cy * cz + sy * sx * sz;
    out[1] = cx * sz;
    out[2] = -sy * cz + cy * sx * sz;
    out[3] = -cy * sz + sy * sx * cz;
    out[4] = cx * cz;
    out[5] = sy * sz + cy * sx * cz;
    out[6] = sy * cx;
    out[7] = -sx;
    out[8] = cy * cx;
    return out;
  };

  const rnd = () => Math.random();
  const wX = (0.3 + rnd() * 0.6);
  const wY = (0.2 + rnd() * 0.7);
  const wZ = (0.1 + rnd() * 0.5);
  const phX = rnd() * Math.PI * 2;
  const phZ = rnd() * Math.PI * 2;

  let yaw = 0, pitch = 0, roll = 0;
  let targetYaw = 0, targetPitch = 0;
  const lerp = (a, b, t) => a + (b - a) * t;
  const pointer = { x: 0, y: 0, inside: true };
  const t0 = performance.now();

  const onMove = (e) => {
    const ww = Math.max(1, window.innerWidth);
    const wh = Math.max(1, window.innerHeight);
    const nx = (e.clientX - ww * 0.5) / (ww * 0.5);
    const ny = (e.clientY - wh * 0.5) / (wh * 0.5);
    pointer.x = Math.max(-1, Math.min(1, nx));
    pointer.y = Math.max(-1, Math.min(1, ny));
    pointer.inside = true;
  };
  const onLeave = () => { pointer.inside = false; };
  const onBlur = () => { pointer.inside = false; };

  let onPointerMove = null;
  if (animationType === 'hover') {
    onPointerMove = onMove;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onBlur);
    program.uniforms.uUseBaseWobble.value = 0;
  } else if (animationType === '3drotate') {
    program.uniforms.uUseBaseWobble.value = 0;
  }

  const render = (t) => {
    const time = (t - t0) * 0.001;
    program.uniforms.iTime.value = time;

    if (animationType === 'hover') {
      const maxPitch = 0.6 * HOVSTR;
      const maxYaw = 0.6 * HOVSTR;
      targetYaw = (pointer.inside ? -pointer.x : 0) * maxYaw;
      targetPitch = (pointer.inside ? pointer.y : 0) * maxPitch;
      yaw = lerp(yaw, targetYaw, INERT);
      pitch = lerp(pitch, targetPitch, INERT);
      roll = lerp(roll, 0, 0.1);
      program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);
    } else if (animationType === '3drotate') {
      const tScaled = time * TS;
      yaw = tScaled * wY;
      pitch = Math.sin(tScaled * wX + phX) * 0.6;
      roll = Math.sin(tScaled * wZ + phZ) * 0.5;
      program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);
    } else {
      rotBuf[0] = 1; rotBuf[1] = 0; rotBuf[2] = 0;
      rotBuf[3] = 0; rotBuf[4] = 1; rotBuf[5] = 0;
      rotBuf[6] = 0; rotBuf[7] = 0; rotBuf[8] = 1;
      program.uniforms.uRot.value = rotBuf;
    }

    renderer.render({ scene: mesh });
  };

  let stopLoop = null;
  if (suspendWhenOffscreen) {
    stopLoop = createVisibilityLoop(container, render);
  } else {
    let raf = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      render(t);
    };
    raf = requestAnimationFrame(loop);
    stopLoop = () => cancelAnimationFrame(raf);
  }

  return () => {
    stopLoop?.();
    ro.disconnect();
    if (animationType === 'hover') {
      if (onPointerMove) window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onBlur);
    }
    if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    destroyGl({ program, geometry: mesh.geometry, mesh, renderer });
  };
}

/* ─── Gradient Blinds ───────────────────────────────────────── */

const GB_VERTEX = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const GB_FRAGMENT = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 iResolution;
uniform vec2 iMouse;
uniform float iTime;

uniform float uAngle;
uniform float uNoise;
uniform float uBlindCount;
uniform float uSpotlightRadius;
uniform float uSpotlightSoftness;
uniform float uSpotlightOpacity;
uniform float uMirror;
uniform float uDistort;
uniform float uShineFlip;
uniform float uStripeStrength;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;
uniform vec3 uColor7;
uniform int uColorCount;

varying vec2 vUv;

float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

vec2 rotate2D(vec2 p, float a){
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * p;
}

vec3 getGradientColor(float t){
  float tt = clamp(t, 0.0, 1.0);
  int count = uColorCount;
  if (count < 2) count = 2;
  float scaled = tt * float(count - 1);
  float seg = floor(scaled);
  float f = fract(scaled);

  if (seg < 1.0) return mix(uColor0, uColor1, f);
  if (seg < 2.0 && count > 2) return mix(uColor1, uColor2, f);
  if (seg < 3.0 && count > 3) return mix(uColor2, uColor3, f);
  if (seg < 4.0 && count > 4) return mix(uColor3, uColor4, f);
  if (seg < 5.0 && count > 5) return mix(uColor4, uColor5, f);
  if (seg < 6.0 && count > 6) return mix(uColor5, uColor6, f);
  if (seg < 7.0 && count > 7) return mix(uColor6, uColor7, f);
  if (count > 7) return uColor7;
  if (count > 6) return uColor6;
  if (count > 5) return uColor5;
  if (count > 4) return uColor4;
  if (count > 3) return uColor3;
  if (count > 2) return uColor2;
  return uColor1;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv0 = fragCoord.xy / iResolution.xy;

  float aspect = iResolution.x / iResolution.y;
  vec2 p = uv0 * 2.0 - 1.0;
  p.x *= aspect;
  vec2 pr = rotate2D(p, uAngle);
  pr.x /= aspect;
  vec2 uv = pr * 0.5 + 0.5;

  vec2 uvMod = uv;
  if (uDistort > 0.0) {
    float a = uvMod.y * 6.0;
    float b = uvMod.x * 6.0;
    float w = 0.01 * uDistort;
    uvMod.x += sin(a) * w;
    uvMod.y += cos(b) * w;
  }
  float t = uvMod.x;
  if (uMirror > 0.5) {
    t = 1.0 - abs(1.0 - 2.0 * fract(t));
  }
  vec3 base = getGradientColor(t);

  vec2 offset = vec2(iMouse.x/iResolution.x, iMouse.y/iResolution.y);
  float d = length(uv0 - offset);
  float r = max(uSpotlightRadius, 1e-4);
  float dn = d / r;
  float spot = (1.0 - 2.0 * pow(dn, uSpotlightSoftness)) * uSpotlightOpacity;
  vec3 cir = vec3(spot);
  float stripe = fract(uvMod.x * max(uBlindCount, 1.0));
  if (uShineFlip > 0.5) stripe = 1.0 - stripe;
  vec3 ran = vec3(stripe);

  vec3 col = cir + base - ran * uStripeStrength;
  col += (rand(gl_FragCoord.xy + iTime) - 0.5) * uNoise;
  col = max(col, base * 0.22);

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

export function mountGradientBlinds(container, opts = {}) {
  const {
    gradientColors = GB_GRADIENT,
    angle = 0,
    noise = 0.22,
    blindCount = 16,
    blindMinWidth = 60,
    mouseDampening = 0.12,
    mirrorGradient = false,
    spotlightRadius = 0.92,
    spotlightSoftness = 1.1,
    spotlightOpacity = 0.58,
    stripeStrength = 0.48,
    distortAmount = 0,
    shineDirection = 'left',
    mixBlendMode = 'screen',
    opacity = 0.62,
    dpr,
  } = opts;

  container.style.mixBlendMode = mixBlendMode;
  container.style.opacity = String(opacity);

  const renderer = new Renderer({
    dpr: dpr ?? Math.min(2, window.devicePixelRatio || 1),
    alpha: true,
    antialias: true,
  });
  const gl = renderer.gl;
  styleCanvas(gl.canvas);
  container.appendChild(gl.canvas);

  const { arr: colorArr, count: colorCount } = prepStops(gradientColors);
  const uniforms = {
    iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
    iMouse: { value: [0, 0] },
    iTime: { value: 0 },
    uAngle: { value: (angle * Math.PI) / 180 },
    uNoise: { value: noise },
    uBlindCount: { value: Math.max(1, blindCount) },
    uSpotlightRadius: { value: spotlightRadius },
    uSpotlightSoftness: { value: spotlightSoftness },
    uSpotlightOpacity: { value: spotlightOpacity },
    uMirror: { value: mirrorGradient ? 1 : 0 },
    uDistort: { value: distortAmount },
    uShineFlip: { value: shineDirection === 'right' ? 1 : 0 },
    uStripeStrength: { value: stripeStrength },
    uColor0: { value: colorArr[0] },
    uColor1: { value: colorArr[1] },
    uColor2: { value: colorArr[2] },
    uColor3: { value: colorArr[3] },
    uColor4: { value: colorArr[4] },
    uColor5: { value: colorArr[5] },
    uColor6: { value: colorArr[6] },
    uColor7: { value: colorArr[7] },
    uColorCount: { value: colorCount },
  };

  const geometry = new Triangle(gl);
  const program = new Program(gl, { vertex: GB_VERTEX, fragment: GB_FRAGMENT, uniforms });
  const mesh = new Mesh(gl, { geometry, program });

  const mouseTarget = [0, 0];
  let lastTime = 0;
  let firstResize = true;
  let lastPointerAt = 0;
  let pointerInSection = false;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];

    if (blindMinWidth && blindMinWidth > 0) {
      const maxByMinWidth = Math.max(1, Math.floor(rect.width / blindMinWidth));
      const effective = blindCount ? Math.min(blindCount, maxByMinWidth) : maxByMinWidth;
      uniforms.uBlindCount.value = Math.max(1, effective);
    } else {
      uniforms.uBlindCount.value = Math.max(1, blindCount);
    }

    if (firstResize) {
      firstResize = false;
      const cx = gl.drawingBufferWidth / 2;
      const cy = gl.drawingBufferHeight / 2;
      uniforms.iMouse.value = [cx, cy];
      mouseTarget[0] = cx;
      mouseTarget[1] = cy;
    }
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const setMouseFromClient = (clientX, clientY) => {
    const rect = container.getBoundingClientRect();
    const scale = renderer.dpr || 1;
    mouseTarget[0] = (clientX - rect.left) * scale;
    mouseTarget[1] = (rect.height - (clientY - rect.top)) * scale;
  };

  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      pointerInSection = false;
      return;
    }
    pointerInSection = true;
    lastPointerAt = performance.now();
    setMouseFromClient(e.clientX, e.clientY);
  };

  const onPointerLeave = () => {
    pointerInSection = false;
  };

  const interactionRoot = container.closest('section') || container;
  interactionRoot.addEventListener('pointermove', onPointerMove, { passive: true });
  interactionRoot.addEventListener('pointerleave', onPointerLeave, { passive: true });

  const render = (t) => {
    uniforms.iTime.value = t * 0.001;

    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const cx = w * 0.5;
    const cy = h * 0.5;

    const useIdleOrbit =
      !pointerInSection || performance.now() - lastPointerAt > 1600;
    if (useIdleOrbit) {
      mouseTarget[0] = cx + Math.sin(t * 0.00042) * w * 0.26;
      mouseTarget[1] = cy + Math.cos(t * 0.00036) * h * 0.2;
    }

    if (mouseDampening > 0) {
      if (!lastTime) lastTime = t;
      const dt = (t - lastTime) / 1000;
      lastTime = t;
      const tau = Math.max(1e-4, mouseDampening);
      let factor = 1 - Math.exp(-dt / tau);
      if (factor > 1) factor = 1;
      const cur = uniforms.iMouse.value;
      cur[0] += (mouseTarget[0] - cur[0]) * factor;
      cur[1] += (mouseTarget[1] - cur[1]) * factor;
    } else {
      lastTime = t;
      uniforms.iMouse.value[0] = mouseTarget[0];
      uniforms.iMouse.value[1] = mouseTarget[1];
    }
    renderer.render({ scene: mesh });
  };

  const stopLoop = createVisibilityLoop(container, render);

  return () => {
    stopLoop();
    interactionRoot.removeEventListener('pointermove', onPointerMove);
    interactionRoot.removeEventListener('pointerleave', onPointerLeave);
    ro.disconnect();
    container.style.mixBlendMode = '';
    container.style.opacity = '';
    if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    destroyGl({ program, geometry, mesh, renderer });
  };
}

/* ─── Line Waves ────────────────────────────────────────────── */

const LW_VERTEX = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const LW_FRAGMENT = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uInnerLines;
uniform float uOuterLines;
uniform float uWarpIntensity;
uniform float uRotation;
uniform float uEdgeFadeWidth;
uniform float uColorCycleSpeed;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define HALF_PI 1.5707963

float hashF(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

float smoothNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hashF(i), hashF(i + 1.0), u);
}

float displaceA(float coord, float t) {
  float result = sin(coord * 2.123) * 0.2;
  result += sin(coord * 3.234 + t * 4.345) * 0.1;
  result += sin(coord * 0.589 + t * 0.934) * 0.5;
  return result;
}

float displaceB(float coord, float t) {
  float result = sin(coord * 1.345) * 0.3;
  result += sin(coord * 2.734 + t * 3.345) * 0.2;
  result += sin(coord * 0.189 + t * 0.934) * 0.3;
  return result;
}

vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 coords = gl_FragCoord.xy / uResolution.xy;
  coords = coords * 2.0 - 1.0;
  coords = rotate2D(coords, uRotation);

  float halfT = uTime * uSpeed * 0.5;
  float fullT = uTime * uSpeed;

  float mouseWarp = 0.0;
  if (uEnableMouse) {
    vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
    float mDist = length(coords - mPos);
    mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
  }

  float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
  float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;

  vec2 fieldA = vec2(warpAx, warpAy);
  vec2 fieldB = vec2(warpBx, warpBy);
  vec2 blended = mix(fieldA, fieldB, mix(fieldA, fieldB, 0.5));

  float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
  float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
  float vMask = 1.0 - max(fadeTop, fadeBottom);

  float tileCount = mix(uOuterLines, uInnerLines, vMask);
  float scaledY = blended.y * tileCount;
  float nY = smoothNoise(abs(scaledY));

  float ridge = pow(
    step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)),
    5.0
  );

  float lines = 0.0;
  for (float i = 1.0; i < 3.0; i += 1.0) {
    lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
  }

  float pattern = vMask * lines;

  float cycleT = fullT * uColorCycleSpeed;
  float rChannel = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
  float gChannel = (pattern + vMask * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
  float bChannel = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);

  vec3 col = (rChannel * uColor1 + gChannel * uColor2 + bChannel * uColor3) * uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`;

export function mountLineWaves(container, opts = {}) {
  const {
    speed = 0.3,
    innerLineCount = 32,
    outerLineCount = 36,
    warpIntensity = 1,
    rotation = -45,
    edgeFadeWidth = 0,
    colorCycleSpeed = 1,
    brightness = 0.2,
    color1 = BRAND.accent,
    color2 = BRAND.pink,
    color3 = BRAND.cyan,
    enableMouseInteraction = true,
    mouseInfluence = 2,
  } = opts;

  const renderer = new Renderer({
    dpr: safariDprCap(),
    alpha: true,
    premultipliedAlpha: false,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  styleCanvas(gl.canvas);
  container.appendChild(gl.canvas);

  const rotationRad = (rotation * Math.PI) / 180;
  const mouseBuf = new Float32Array([0.5, 0.5]);
  let currentMouse = [0.5, 0.5];
  let targetMouse = [0.5, 0.5];

  const program = new Program(gl, {
    vertex: LW_VERTEX,
    fragment: LW_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [1, 1, 1] },
      uSpeed: { value: speed },
      uInnerLines: { value: innerLineCount },
      uOuterLines: { value: outerLineCount },
      uWarpIntensity: { value: warpIntensity },
      uRotation: { value: rotationRad },
      uEdgeFadeWidth: { value: edgeFadeWidth },
      uColorCycleSpeed: { value: colorCycleSpeed },
      uBrightness: { value: brightness },
      uColor1: { value: hexToVec3(color1) },
      uColor2: { value: hexToVec3(color2) },
      uColor3: { value: hexToVec3(color3) },
      uMouse: { value: mouseBuf },
      uMouseInfluence: { value: mouseInfluence },
      uEnableMouse: { value: enableMouseInteraction },
    },
  });

  const geometry = new Triangle(gl);
  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    renderer.setSize(container.offsetWidth || 1, container.offsetHeight || 1);
    program.uniforms.uResolution.value = [
      gl.canvas.width,
      gl.canvas.height,
      gl.canvas.width / gl.canvas.height,
    ];
  };

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const handleMouseMove = (e) => {
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    targetMouse = [
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height,
    ];
  };
  const handleMouseLeave = () => {
    targetMouse = [0.5, 0.5];
  };

  if (enableMouseInteraction) {
    window.addEventListener('pointermove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
  }

  const render = (t) => {
    program.uniforms.uTime.value = t * 0.001;
    if (enableMouseInteraction) {
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      mouseBuf[0] = currentMouse[0];
      mouseBuf[1] = currentMouse[1];
    }
    renderer.render({ scene: mesh });
  };

  const stopLoop = createVisibilityLoop(container, render);

  return () => {
    stopLoop();
    ro.disconnect();
    if (enableMouseInteraction) {
      window.removeEventListener('pointermove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    }
    if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    destroyGl({ program, geometry, mesh, renderer });
  };
}

/* ─── Silk (react-bits port) ─────────────────────────────────── */

const SILK_VERTEX = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const SILK_FRAGMENT = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;
uniform float uOpacity;
uniform float uBrightness;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2 r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2 rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd = noise(gl_FragCoord.xy);
  vec2 uv = rotateUvs(vUv * uScale, uRotation);
  vec2 tex = uv * uScale;
  float tOffset = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
    0.4 * sin(5.0 * (tex.x + tex.y +
      cos(3.0 * tex.x + 5.0 * tex.y) +
      0.02 * tOffset) +
      sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.rgb = col.rgb * uBrightness + vec3(0.035);
  col.rgb *= uOpacity;
  col.a = uOpacity;
  gl_FragColor = col;
}
`;

export function mountSilk(container, opts = {}) {
  const {
    speed = 3,
    scale = 1.1,
    color = '#6b7589',
    noiseIntensity = 1,
    rotation = 0,
    opacity = 0.72,
    brightness = 1.15,
  } = opts;

  container.classList.add('rb-silk-layer');

  const renderer = new Renderer({
    dpr: safariDprCap(),
    alpha: true,
    premultipliedAlpha: false,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  styleCanvas(gl.canvas);
  container.appendChild(gl.canvas);

  const rotationRad = (rotation * Math.PI) / 180;
  const program = new Program(gl, {
    vertex: SILK_VERTEX,
    fragment: SILK_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: hexToVec3(color) },
      uSpeed: { value: speed },
      uScale: { value: scale },
      uRotation: { value: rotationRad },
      uNoiseIntensity: { value: noiseIntensity },
      uOpacity: { value: opacity },
      uBrightness: { value: brightness },
    },
  });

  const geometry = new Triangle(gl);
  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    renderer.setSize(container.offsetWidth || 1, container.offsetHeight || 1);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const render = (t) => {
    program.uniforms.uTime.value = t * 0.001;
    renderer.render({ scene: mesh });
  };

  const stopLoop = createVisibilityLoop(container, render);

  return () => {
    stopLoop();
    ro.disconnect();
    container.classList.remove('rb-silk-layer');
    if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    destroyGl({ program, geometry, mesh, renderer });
  };
}

/* ─── Init ──────────────────────────────────────────────────── */

export function initReactBitsBackgrounds() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const isSafari = initSafariShell() || isSafariBrowser();
  if (isMobile) {
    document.documentElement.classList.add('rb-mobile-shell');
  }
  const cleanups = [];
  const mountBg = (fn, el, opts) => cleanups.push(safeMount(fn, el, opts));

  document.querySelectorAll('[data-rb-prism]').forEach((el) => {
    const glow = el.dataset.glow != null ? parseFloat(el.dataset.glow) : undefined;
    const scale = el.dataset.scale != null ? parseFloat(el.dataset.scale) : undefined;
    const bloom = el.dataset.bloom != null ? parseFloat(el.dataset.bloom) : undefined;
    const animationType = isMobile ? 'rotate' : el.dataset.animation || 'hover';
    mountBg(mountPrism, el, {
      animationType,
      hoverStrength: isMobile || isSafari ? 0 : 2.2,
      inertia: isMobile ? 0.12 : 0.08,
      noise: isMobile || isSafari ? 0.2 : 0.35,
      timeScale: isMobile ? 0.32 : isSafari ? 0.38 : 0.45,
      suspendWhenOffscreen: true,
      ...(Number.isFinite(glow) ? { glow: isMobile ? glow * 0.82 : isSafari ? glow * 0.75 : glow } : {}),
      ...(Number.isFinite(scale) ? { scale: isMobile ? Math.min(scale, 2.35) : isSafari ? Math.min(scale, 2.2) : scale } : {}),
      ...(Number.isFinite(bloom) ? { bloom: isMobile ? bloom * 0.72 : isSafari ? bloom * 0.65 : bloom } : {}),
    });
  });

  if (!isMobile) {
    document.querySelectorAll('[data-rb-gradient-blinds]').forEach((el) => {
      const preset = INTENSITY_PRESETS[el.dataset.intensity] ?? INTENSITY_PRESETS.normal;
      cleanups.push(
        mountGradientBlinds(el, {
          opacity: preset.opacity,
          blindCount: preset.blindCount,
          gradientColors: GB_GRADIENT,
          spotlightOpacity: 0.58,
          spotlightRadius: 0.92,
          stripeStrength: 0.48,
          mouseDampening: 0.1,
        }),
      );
    });
  }

  const colorBendsEls = [...document.querySelectorAll('[data-rb-color-bends]')];
  if (colorBendsEls.length) {
    import('./color-bends.mjs').then(({ mountColorBendsFromEl }) => {
      colorBendsEls.forEach((el) => {
        if (!el.dataset.rbColorBendsReady) {
          el.dataset.rbColorBendsReady = '1';
          cleanups.push(mountColorBendsFromEl(el));
        }
      });
    });
  }

  document.querySelectorAll('[data-rb-silk]').forEach((el) => {
    const speed = el.dataset.speed != null ? parseFloat(el.dataset.speed) : 2.5;
    const scale = el.dataset.scale != null ? parseFloat(el.dataset.scale) : 1.15;
    const noiseIntensity =
      el.dataset.noiseIntensity != null ? parseFloat(el.dataset.noiseIntensity) : 0.75;
    const rotation = el.dataset.rotation != null ? parseFloat(el.dataset.rotation) : 0;
    const opacity = el.dataset.opacity != null ? parseFloat(el.dataset.opacity) : 0.72;
    const brightness = el.dataset.brightness != null ? parseFloat(el.dataset.brightness) : 1.15;
    const color = el.dataset.color || '#6b7589';
    mountBg(mountSilk, el, {
      color,
      speed: Number.isFinite(speed) ? speed : 2.5,
      scale: Number.isFinite(scale) ? scale : 1.15,
      noiseIntensity: Number.isFinite(noiseIntensity) ? noiseIntensity : 0.75,
      rotation: Number.isFinite(rotation) ? rotation : 0,
      opacity: Number.isFinite(opacity) ? (isSafari ? Math.min(opacity, 0.58) : opacity) : isSafari ? 0.58 : 0.72,
      brightness: Number.isFinite(brightness) ? brightness : 1.15,
    });
  });

  document.querySelectorAll('[data-rb-light-rays]').forEach((el) => {
    const raysSpeed = el.dataset.raysSpeed != null ? parseFloat(el.dataset.raysSpeed) : 0.85;
    const saturation = el.dataset.saturation != null ? parseFloat(el.dataset.saturation) : 0.72;
    const mouseInfluence =
      el.dataset.mouseInfluence != null ? parseFloat(el.dataset.mouseInfluence) : 0.08;
    mountBg(mountLightRays, el, {
      raysOrigin: el.dataset.raysOrigin || 'top-center',
      raysColor: el.dataset.raysColor || '#e9d391',
      raysSpeed: isMobile || isSafari ? raysSpeed * 0.7 : raysSpeed,
      lightSpread: el.dataset.lightSpread != null ? parseFloat(el.dataset.lightSpread) : 0.92,
      rayLength: el.dataset.rayLength != null ? parseFloat(el.dataset.rayLength) : 1.8,
      mouseInfluence: isMobile || isSafari ? 0 : mouseInfluence,
      saturation: isMobile || isSafari ? Math.min(saturation + 0.1, 0.95) : saturation,
    });
  });

  document.querySelectorAll('[data-rb-shape-grid]').forEach((el) => {
    const speed = el.dataset.speed != null ? parseFloat(el.dataset.speed) : 0.35;
    const vignette =
      el.dataset.vignetteStrength != null ? parseFloat(el.dataset.vignetteStrength) : 1;
    const hoverTrail =
      el.dataset.hoverTrail != null ? parseInt(el.dataset.hoverTrail, 10) : 5;
    mountBg(mountShapeGrid, el, {
      direction: el.dataset.direction || 'diagonal',
      speed: isMobile || isSafari ? speed * 1.12 : speed,
      squareSize: el.dataset.squareSize != null ? parseInt(el.dataset.squareSize, 10) : 44,
      shape: el.dataset.shape || 'square',
      borderColor: el.dataset.borderColor || 'rgba(255,255,255,0.06)',
      hoverFillColor: el.dataset.hoverFillColor || 'rgba(233,211,145,0.1)',
      hoverTrailAmount: isMobile || isSafari ? Math.min(hoverTrail, 2) : hoverTrail,
      vignetteStrength: isMobile || isSafari ? Math.min(vignette, 0.42) : vignette,
    });
  });

  document.querySelectorAll('[data-rb-line-waves]').forEach((el) => {
    const variant = el.dataset.variant === 'cool' ? 'cool' : 'default';
    const [c1, c2, c3] = LINE_WAVES_PALETTES[variant];
    const brightness = el.dataset.brightness != null ? parseFloat(el.dataset.brightness) : 0.22;
    const mouseInfluence = el.dataset.mouseInfluence != null ? parseFloat(el.dataset.mouseInfluence) : 2.5;
    const baseBrightness = Number.isFinite(brightness) ? brightness : 0.22;
    mountBg(mountLineWaves, el, {
      color1: c1,
      color2: c2,
      color3: c3,
      brightness: isMobile || isSafari ? Math.max(baseBrightness, 0.28) : baseBrightness,
      mouseInfluence: isMobile || isSafari ? 0 : Number.isFinite(mouseInfluence) ? mouseInfluence : 2.5,
      enableMouseInteraction: !isMobile && !isSafari,
    });
  });

  window.__rbBackgroundCleanups = cleanups;
  return cleanups;
}
