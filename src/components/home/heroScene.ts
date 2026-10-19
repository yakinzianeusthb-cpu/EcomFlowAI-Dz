/**
 * The home page's 3D hero: a polished ring turning around a crystal cube (the product at the centre of its
 * campaign), seen through a fluted glass panel, in a dark room lit by deep red light.
 *
 * Two passes. The scene (a background plane, the objects) is rendered into an HDR target; a full-screen pass then
 * draws it through the fluted panel, adds the vignette, and tone-maps it to the screen. Loaded on demand (this
 * module pulls in three.js), in a worker where the browser allows it (heroWorker.ts), so it never weighs on the
 * page's first paint.
 */
import {
  ACESFilmicToneMapping,
  Color,
  DoubleSide,
  Group,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
  type Material,
  type Texture,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { damp, EASE_OUT, nextPixelRatio, type HeroQuality } from '../../lib/heroMotion';

export interface HeroLayout {
  /** canvas size in CSS pixels */
  width: number;
  height: number;
  /** the fluted glass panel, as fractions of the canvas width */
  panel: { start: number; end: number };
  /** where the object sits (normalised device coordinates) and its height as a share of the canvas */
  anchor: { x: number; y: number; size: number };
  rtl: boolean;
}

export interface HeroScene {
  /** resolves once the shaders are compiled and the first frame is on the canvas */
  ready: Promise<void>;
  setLayout(layout: HeroLayout): void;
  /** pointer position over the hero, -1..1 on both axes (up is +y) */
  setPointer(x: number, y: number): void;
  /** 0 while the hero is on screen, 1 once it has scrolled away */
  setScroll(progress: number): void;
  start(): void;
  stop(): void;
  /** one frame in the final pose, for visitors who ask for reduced motion */
  renderStill(): void;
  dispose(): void;
}

export interface HeroSceneOptions {
  quality: HeroQuality;
  onContextLost?: () => void;
}

const FOV = 30;
const CAMERA_Z = 9;
const BACKDROP_Z = -8;
/** height of the object group in world units at scale 1 (the ring's outer diameter with a little air) */
const OBJECT_HEIGHT = 2.9;
const INTRO_SECONDS = 1.8;

const BACKDROP_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * The room: near black, deep red light from the two top corners, a grey haze low on the far side. Linear HDR.
 * Distances are measured in units of the screen's shorter side, so a phone gets the same corners as a desktop.
 */
const BACKDROP_FRAGMENT = /* glsl */ `
uniform float uAspect;
uniform float uRtl;
varying vec2 vUv;
void main() {
  vec2 p = vUv;
  p.x = mix(p.x, 1.0 - p.x, uRtl);
  vec2 unit = vec2(uAspect, 1.0) / min(uAspect, 1.0);
  vec3 col = vec3(0.0026, 0.0026, 0.0030);
  vec3 ember = vec3(0.30, 0.010, 0.010);
  vec2 a = (p - vec2(-0.02, 1.02)) * unit;
  vec2 b = (p - vec2(1.02, 1.0)) * unit;
  col += ember * exp(-dot(a, a) * 6.5);
  col += ember * 0.8 * exp(-dot(b, b) * 8.5);
  vec2 h = (p - vec2(0.88, -0.05)) * unit;
  col += vec3(0.05, 0.05, 0.055) * exp(-dot(h, h) * 2.6);
  gl_FragColor = vec4(col, 1.0);
}
`;

const POST_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * The fluted panel: each vertical flute is a small cylinder lens that shows a magnified, mirrored slice of what is
 * behind it, darker toward its grooves, with a soft highlight line. Then vignette, the scroll exit, tone mapping,
 * and a 1.5-step dither that keeps the dark gradients free of banding.
 */
const POST_FRAGMENT = /* glsl */ `
uniform sampler2D tScene;
uniform vec2 uRes;
uniform vec2 uPanel;
uniform float uFlute;
uniform float uEdge;
uniform float uTime;
uniform float uScroll;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 scene(vec2 uv) { return texture2D(tScene, clamp(uv, vec2(0.0005), vec2(0.9995))).rgb; }

void main() {
  vec2 uv = vUv;
  float px = uv.x * uRes.x;
  float start = uPanel.x * uRes.x;
  float end = uPanel.y * uRes.x;
  vec3 col;
  if (end > start && px >= start && px <= end) {
    float cell = floor((px - start) / uFlute);
    float centre = start + (cell + 0.5) * uFlute;
    float local = (px - centre) / (0.5 * uFlute);
    float jitter = (hash(vec2(cell, 7.0)) - 0.5) * 0.35;
    vec2 s = vec2((centre + (local * -0.62 + jitter) * 0.5 * uFlute) / uRes.x, uv.y);
    float fringe = local * 0.8 / uRes.x;
    vec2 dy = vec2(0.0, 2.5 / uRes.y);
    vec3 c = vec3(scene(s + vec2(fringe, 0.0)).r, scene(s).g, scene(s - vec2(fringe, 0.0)).b) * 0.5
      + (scene(s + dy) + scene(s - dy)) * 0.25;
    float shade = 1.0 - 0.38 * local * local;
    float groove = smoothstep(0.84, 1.0, abs(local)) * 0.55;
    float sheen = exp(-pow((local + 0.55) * 5.0, 2.0)) * 0.03;
    col = c * shade * 0.8 * (1.0 - groove) + vec3(sheen);
    float inner = mix(start, end, uEdge);
    col += vec3(0.05) * exp(-abs(px - inner) * 0.8);
  } else {
    col = scene(uv);
  }
  vec2 q = uv - 0.5;
  col *= 1.0 - 0.6 * dot(q, q);
  col *= 1.0 - 0.6 * uScroll;
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb += (hash(uv * uRes + fract(uTime) * 61.0) - 0.5) * (1.5 / 255.0);
}
`;

/** A studio for the reflections: crisp white strips, two red panels (the corner light), a faint front fill. */
function buildEnvironment(renderer: WebGLRenderer): WebGLRenderTarget<Texture> {
  const room = new Scene();
  room.background = new Color(0x020203);
  const geometries: PlaneGeometry[] = [];
  const materials: MeshBasicMaterial[] = [];
  const panel = (w: number, h: number, hex: number, intensity: number, position: [number, number, number], lookAtOrigin = true) => {
    const geometry = new PlaneGeometry(w, h);
    const material = new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(intensity), side: DoubleSide });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...position);
    if (lookAtOrigin) mesh.lookAt(0, 0, 0);
    room.add(mesh);
    geometries.push(geometry);
    materials.push(material);
  };
  panel(8, 1.6, 0xffffff, 6, [0, 5.5, 0.5]); // overhead softbox
  panel(0.6, 8, 0xffffff, 7, [-5.5, 0.5, 1.5]); // tall strips on both sides: the bright lines along the ring
  panel(0.4, 8, 0xffffff, 5, [5.5, 0.5, -1]);
  panel(10, 6, 0x7a7e88, 1.6, [0, 0, -7]); // grey back wall, so polished metal reads silver, not black
  panel(10, 10, 0x3a3b40, 0.9, [0, -5, 0]);
  panel(3.2, 3.2, 0xff2a20, 1.6, [-4.5, 3.5, -2.5]); // the red corner light
  panel(3.2, 3.2, 0xff2a20, 1.3, [4.5, 3.6, -2.5]);
  panel(6, 3, 0xb4b9c4, 1, [0, -0.5, 7]); // soft fill from the camera side
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(room, 0.03);
  pmrem.dispose();
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  return target;
}

/** The ring is polished metal everywhere; the cube is real refractive crystal where the device can afford it. */
function objectMaterials(transmission: boolean): { ring: MeshPhysicalMaterial; cube: MeshPhysicalMaterial } {
  const ring = new MeshPhysicalMaterial({ color: 0xe6e8ec, metalness: 1, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2 });
  if (transmission) {
    return {
      ring,
      cube: new MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 1.6, ior: 2.2, dispersion: 0.8,
        clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.6,
      }),
    };
  }
  // phones and weak machines: smoked crystal, no transmission pass
  return {
    ring,
    cube: new MeshPhysicalMaterial({
      color: 0xa4aab4, metalness: 0.4, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.9,
      transparent: true, opacity: 0.88,
    }),
  };
}

// The scene runs on the page or inside a worker (OffscreenCanvas); some workers have no requestAnimationFrame.
const nextFrame: (cb: (now: number) => void) => number =
  typeof requestAnimationFrame === 'function' ? (cb) => requestAnimationFrame(cb) : (cb) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
const cancelFrame: (id: number) => void = typeof cancelAnimationFrame === 'function' ? (id) => cancelAnimationFrame(id) : (id) => clearTimeout(id);
/** gives the thread back between the heavy start-up steps, so none of them is one long task */
const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export function createHeroScene(canvas: HTMLCanvasElement | OffscreenCanvas, { quality, onContextLost }: HeroSceneOptions): HeroScene {
  const high = quality.detail === 'high';
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  let pixelRatio = quality.pixelRatio;
  renderer.setPixelRatio(pixelRatio);

  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: high ? 4 : 0 });
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 40);
  camera.position.set(0, 0, CAMERA_Z);
  // the reflections are built in `ready`, as their own step
  let environment: WebGLRenderTarget<Texture> | null = null;

  const backdropMaterial = new ShaderMaterial({
    vertexShader: BACKDROP_VERTEX,
    fragmentShader: BACKDROP_FRAGMENT,
    uniforms: { uAspect: { value: 1 }, uRtl: { value: 0 } },
    depthWrite: false,
  });
  const backdropGeometry = new PlaneGeometry(1, 1);
  const backdrop = new Mesh(backdropGeometry, backdropMaterial);
  backdrop.position.z = BACKDROP_Z;
  backdrop.renderOrder = -1;
  scene.add(backdrop);

  // the object: a pivot (position, pointer parallax, scroll), a tilt, then the parts
  const pivot = new Group();
  const tilt = new Group();
  pivot.add(tilt);
  scene.add(pivot);

  const materials = objectMaterials(quality.transmission);
  const ringGeometry = new TorusGeometry(1.12, 0.26, high ? 64 : 40, high ? 220 : 140);
  const ring = new Mesh(ringGeometry, materials.ring);
  tilt.add(ring);
  const cubeGeometry = new RoundedBoxGeometry(1.04, 1.04, 1.04, high ? 6 : 3, 0.085);
  const cube = new Mesh(cubeGeometry, materials.cube);
  tilt.add(cube);
  const sphereGeometry = new SphereGeometry(0.17, high ? 48 : 28, high ? 32 : 20);
  const sphereMaterial = new MeshStandardMaterial({ color: 0xa3a3a9, roughness: 0.5, metalness: 0.1, envMapIntensity: 1.2 });
  const sphere = new Mesh(sphereGeometry, sphereMaterial);
  pivot.add(sphere);

  const postMaterial = new ShaderMaterial({
    vertexShader: POST_VERTEX,
    fragmentShader: POST_FRAGMENT,
    uniforms: {
      tScene: { value: target.texture },
      uRes: { value: new Vector2(1, 1) },
      uPanel: { value: new Vector2(0, 0) },
      uFlute: { value: 46 },
      uEdge: { value: 1 },
      uTime: { value: 0 },
      uScroll: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const postGeometry = new PlaneGeometry(2, 2);
  const postScene = new Scene();
  postScene.add(new Mesh(postGeometry, postMaterial));
  const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let layout: HeroLayout = { width: 1, height: 1, panel: { start: 0, end: 0 }, anchor: { x: 0, y: 0, size: 0.6 }, rtl: false };
  let base = { x: 0, y: 0, scale: 1, visibleHeight: 1 };
  const motion = { pointerX: 0, pointerY: 0, x: 0, y: 0, scroll: 0, scrollShown: 0, time: 0, intro: 0 };

  const applySize = () => {
    const { width, height } = layout;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    const w = Math.max(1, Math.round(width * pixelRatio));
    const h = Math.max(1, Math.round(height * pixelRatio));
    target.setSize(w, h);
    postMaterial.uniforms.uRes.value.set(w, h);
    // flutes about 46 CSS pixels wide on a desktop, narrower on a phone
    postMaterial.uniforms.uFlute.value = (width < 768 ? 30 : 46) * pixelRatio;
  };

  const setLayout = (next: HeroLayout) => {
    layout = next;
    camera.aspect = next.width / Math.max(1, next.height);
    camera.updateProjectionMatrix();
    const halfFov = (FOV * Math.PI) / 360;
    const visibleHeight = 2 * CAMERA_Z * Math.tan(halfFov);
    const visibleWidth = visibleHeight * camera.aspect;
    base = { x: (next.anchor.x * visibleWidth) / 2, y: (next.anchor.y * visibleHeight) / 2, scale: (next.anchor.size * visibleHeight) / OBJECT_HEIGHT, visibleHeight };
    // the backdrop fills the view exactly at its depth, so its UVs are screen coordinates
    const backdropHeight = 2 * (CAMERA_Z - BACKDROP_Z) * Math.tan(halfFov);
    backdrop.scale.set(backdropHeight * camera.aspect, backdropHeight, 1);
    backdropMaterial.uniforms.uAspect.value = camera.aspect;
    backdropMaterial.uniforms.uRtl.value = next.rtl ? 1 : 0;
    postMaterial.uniforms.uPanel.value.set(next.panel.start, next.panel.end);
    postMaterial.uniforms.uEdge.value = next.rtl ? 0 : 1;
    applySize();
  };

  const pose = (dt: number) => {
    motion.time += dt;
    motion.intro = Math.min(1, motion.intro + dt / INTRO_SECONDS);
    const intro = EASE_OUT(motion.intro);
    motion.x = damp(motion.x, motion.pointerX, 2.6, dt);
    motion.y = damp(motion.y, motion.pointerY, 2.6, dt);
    motion.scrollShown = damp(motion.scrollShown, motion.scroll, 7, dt);
    const t = motion.time;
    const mirror = layout.rtl ? -1 : 1;
    // the ring rocks slowly but always shows its opening (never edge-on), and the whole piece turns in the picture
    // plane, a turn every ~100 s; the entrance arrives with a quarter turn that settles
    ring.rotation.set(1.0 + Math.sin(t * 0.37) * 0.12, Math.sin(t * 0.23 + 1) * 0.42, 0);
    cube.rotation.set(0.62 + t * 0.15, 0.38 - t * 0.21, 0.18);
    tilt.rotation.z = (-0.42 + t * 0.06 - (1 - intro) * 0.9) * mirror;
    sphere.position.set(1.05 * mirror, 1.3 + Math.sin(t * 0.9) * 0.07, -0.7);
    pivot.rotation.set(-motion.y * 0.16, motion.x * 0.26 * mirror, motion.scrollShown * 0.5 * mirror);
    pivot.position.set(base.x, base.y + motion.scrollShown * base.visibleHeight * 0.22, 0);
    pivot.scale.setScalar(base.scale * (0.92 + 0.08 * intro));
    postMaterial.uniforms.uTime.value = t;
    postMaterial.uniforms.uScroll.value = motion.scrollShown;
  };

  const draw = () => {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
  };

  // frame budget: after a short warm-up, frames slower than ~45/s lower the resolution (a few times at most)
  const budget = { frames: 0, total: 0, steps: 0 };
  const watchBudget = (dt: number) => {
    budget.frames++;
    if (budget.frames <= 40 || budget.steps >= 3) return;
    budget.total += dt * 1000;
    if (budget.frames < 100) return;
    const next = nextPixelRatio(pixelRatio, budget.total / 60, 0.75);
    budget.frames = 40;
    budget.total = 0;
    if (next !== pixelRatio) {
      pixelRatio = next;
      budget.steps++;
      applySize();
    }
  };

  let frame = 0;
  let last = 0;
  let compiled = false;
  const loop = (now: number) => {
    frame = nextFrame(loop);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    pose(dt);
    draw();
    watchBudget(dt);
  };

  // nothing is drawn before the shaders are compiled: drawing earlier would compile them in one long task
  const start = () => {
    if (frame || !compiled) return;
    last = 0;
    frame = nextFrame(loop);
  };
  const stop = () => {
    if (!frame) return;
    cancelFrame(frame);
    frame = 0;
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    stop();
    onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  let disposed = false;
  const ready = (async () => {
    // step by step, giving the thread back in between: the reflections, then every shader (compiled in parallel
    // where the browser allows it), then the first frame
    await breathe();
    if (disposed) return;
    environment = buildEnvironment(renderer);
    scene.environment = environment.texture;
    await breathe();
    if (disposed) return;
    await renderer.compileAsync(scene, camera);
    await breathe();
    if (disposed) return;
    await renderer.compileAsync(postScene, postCamera);
    if (disposed) return;
    compiled = true;
    pose(0);
    draw();
  })();

  const dispose = () => {
    disposed = true;
    stop();
    canvas.removeEventListener('webglcontextlost', onLost);
    const owned: Material[] = [backdropMaterial, materials.ring, materials.cube, sphereMaterial, postMaterial];
    owned.forEach((m) => m.dispose());
    [backdropGeometry, ringGeometry, cubeGeometry, sphereGeometry, postGeometry].forEach((g) => g.dispose());
    environment?.dispose();
    target.dispose();
    renderer.dispose();
    // browsers keep only a few WebGL contexts alive: give this one back now rather than at garbage collection
    renderer.forceContextLoss();
  };

  return {
    ready,
    setLayout,
    setPointer: (x, y) => {
      motion.pointerX = x;
      motion.pointerY = y;
    },
    setScroll: (progress) => {
      motion.scroll = progress;
    },
    start,
    stop,
    renderStill: () => {
      if (!compiled) return;
      motion.intro = 1;
      motion.time = 2.6;
      pose(0);
      draw();
    },
    dispose,
  };
}
