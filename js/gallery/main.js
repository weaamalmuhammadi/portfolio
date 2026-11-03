/**
 * main.js — entry point of the 3D gallery.
 *
 * Each frame:  input (keys / click-to-walk)  →  visitor movement
 *           →  viewing-circle "focus" state machine
 *           →  camera (follow the visitor ↔ frame an artwork)  →  UI.
 *
 * Focus rules
 *   - Stand still inside a circle for a moment → the camera glides in and
 *     the info panel opens. No key press needed.
 *   - Move again (keys, click, menu) → the panel closes and the camera
 *     returns behind the visitor.
 *
 * The loop starts when intro.js fires the `galleryStart` event.
 */

import * as THREE from 'three';
import { HALL, LAYOUT, MOVE, CAM, ARTWORKS, THEME, THEME_NAME } from './config.js';
import { buildWorld, decalMaterial } from './world.js';
import { createCharacter, createTrail } from './character.js';
import { createUI } from './ui.js';
import { makeMarkerTexture, loadThemeFonts, RING_R } from './textures.js';

// Theme: fonts for canvas text + the matching UI colours (css: :root[data-theme])
document.documentElement.dataset.theme = THEME_NAME;
loadThemeFonts();

/* =============================================
   RENDERER · SCENE · CAMERA
   ============================================= */
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CAM.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(THEME.scene.background);
scene.fog = new THREE.Fog(THEME.scene.background, THEME.scene.fogNear, THEME.scene.fogFar);

const camera = new THREE.PerspectiveCamera(CAM.fov, Math.max(1, window.innerWidth) / Math.max(1, window.innerHeight), 0.1, 200);

window.addEventListener('resize', () => {
  const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);   // never 0×0 (hidden tabs)
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}, { passive: true });

/* =============================================
   HELPERS
   ============================================= */
const clamp = THREE.MathUtils.clamp;
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const dampAngle = (a, b, lambda, dt) => a + wrapAngle(b - a) * (1 - Math.exp(-lambda * dt));
const AXIS_X = new THREE.Vector3(1, 0, 0);

/* =============================================
   STATE
   ============================================= */
const state = {
  running: false,
  startedAt: 0,
  x: 0, z: LAYOUT.startZ,     // visitor position
  vx: 0, vz: 0,               // velocity
  yaw: Math.PI, targetYaw: Math.PI,
  focus: null,                // target the camera is framing
  lock: null,                 // target closed with × — don't reopen until you leave its circle
  still: 0,                   // seconds standing still inside a circle
  auto: null,                 // { x, z, fast } — walking somewhere by itself
  stride: 0,
  leftFoot: false,
};

let elapsed = 0;

/* =============================================
   BUILD
   ============================================= */
const world = buildWorld(scene, renderer);
const hero = createCharacter(scene);
const trail = createTrail(scene);

const ui = createUI({
  onTravel: (i) => travelTo(world.targets[i]),
  onNav: (dir) => {
    const n = world.targets.length;
    const current = state.focus ? state.focus.index : 0;
    travelTo(world.targets[(current + dir + n) % n]);
  },
  onClose: () => releaseFocus(true),
  onMenuChange: (open) => { if (open) { held.clear(); ui.clearKeys(); } },
});

/* Little marker where you clicked */
const clickMarker = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  decalMaterial(makeMarkerTexture({ seed: 77 }), { opacity: 0, order: -3 })
);
clickMarker.rotation.x = -Math.PI / 2;
clickMarker.renderOrder = 4;
scene.add(clickMarker);
let clickAge = Infinity;

/* =============================================
   MOVEMENT HELPERS
   ============================================= */
function travelTo(target) {
  if (!target || state.focus === target) return;
  state.lock = null;
  state.auto = { x: target.x, z: target.z, fast: true };
}

function walkTo(x, z) {
  state.lock = null;
  state.auto = { x, z, fast: false };
  clickMarker.position.set(x, 0.026, z);
  clickAge = 0;
}

function setFocus(target) {
  state.focus = target;
  state.still = 0;
  if (target.kind === 'project') {
    ui.showProject(target.index);
    world.videos.get(target.index)?.play();   // gameplay video, if this one has one
  } else {
    ui.showContact();
  }
}

function releaseFocus(lock) {
  if (!state.focus) return;
  if (lock) state.lock = state.focus;
  world.videos.get(state.focus.index)?.pause();
  state.focus = null;
  ui.hidePanel();
}

function nearestTarget() {
  let best = null;
  world.targets.forEach((t) => { if (!best || t.dist < best.dist) best = t; });
  return best;
}

/* =============================================
   INPUT — keyboard
   ============================================= */
const KEYS = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
};
const held = new Set();

window.addEventListener('keydown', (e) => {
  if (!state.running) return;

  if (e.code === 'Escape') {
    e.preventDefault();
    ui.flashKey('esc');
    ui.toggleMenu();
    return;
  }

  const dir = KEYS[e.code];
  if (dir) {
    if (ui.isMenuOpen()) return;
    e.preventDefault();
    held.add(dir);
    ui.setKey(dir, true);
    return;
  }

  const onControl = e.target instanceof Element && e.target.closest('a, button');
  if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !onControl && !ui.isMenuOpen()) {
    e.preventDefault();
    onEnter();
  }
});

window.addEventListener('keyup', (e) => {
  const dir = KEYS[e.code];
  if (!dir) return;
  held.delete(dir);
  ui.setKey(dir, false);
});

window.addEventListener('blur', () => { held.clear(); ui.clearKeys(); });

/* Enter: open the project link while looking at it, otherwise step into the nearest circle */
function onEnter() {
  if (state.focus) {
    const art = ARTWORKS[state.focus.index];
    if (state.focus.kind === 'project' && art.link && art.link !== '#') {
      window.open(art.link, '_blank', 'noopener');
    }
    return;
  }
  const near = nearestTarget();
  if (!near || near.dist > near.r + HALL.approach) return;
  if (near.dist < near.r) { state.lock = null; state.still = MOVE.dwell; }
  else travelTo(near);
}

/* =============================================
   INPUT — pointer (click / tap to walk, hover, parallax)
   ============================================= */
const pointer = { nx: 0, ny: 0, sx: 0, sy: 0, cx: 0, cy: 0, downX: 0, downY: 0, downT: 0, hoverDirty: false };
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const floorHit = new THREE.Vector3();

canvas.addEventListener('pointermove', (e) => {
  pointer.cx = e.clientX;
  pointer.cy = e.clientY;
  pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
  pointer.hoverDirty = true;
});

canvas.addEventListener('pointerdown', (e) => {
  pointer.downX = e.clientX;
  pointer.downY = e.clientY;
  pointer.downT = performance.now();
});

canvas.addEventListener('pointerup', (e) => {
  if (!state.running || ui.isMenuOpen()) return;
  const dragged = Math.hypot(e.clientX - pointer.downX, e.clientY - pointer.downY) > 10;
  if (dragged || performance.now() - pointer.downT > 700) return;

  const target = pick(e.clientX, e.clientY);
  if (target) { travelTo(target); return; }

  if (raycaster.ray.intersectPlane(floorPlane, floorHit)) {
    const W = LAYOUT.walk;
    walkTo(clamp(floorHit.x, -W.xMax, W.xMax), clamp(floorHit.z, W.zMin, W.zMax));
  }
});

/* Which viewing target (if any) is under the cursor */
function pick(cx, cy) {
  ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(world.hitMeshes, false);
  return hits.length ? world.targets[hits[0].object.userData.targetIndex] : null;
}

/* =============================================
   UPDATE
   ============================================= */
function update(dt) {
  /* ---- desired direction ---- */
  let ix = 0, iz = 0;
  if (!ui.isMenuOpen()) {
    ix = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
    iz = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0);
  }
  const steering = ix !== 0 || iz !== 0;
  if (steering) state.auto = null;

  let maxSpeed = MOVE.speed;
  if (!steering && state.auto) {
    const ex = state.auto.x - state.x, ez = state.auto.z - state.z;
    const d = Math.hypot(ex, ez);
    if (d < 0.06) {
      state.auto = null;
      state.vx *= 0.25;   // settle on the spot instead of sliding past it
      state.vz *= 0.25;
    } else {
      ix = ex / d;
      iz = ez / d;
      // ease off when arriving
      maxSpeed = Math.max(0.6, (state.auto.fast ? MOVE.travelSpeed : MOVE.speed) * Math.min(1, d / 1.8));
    }
  }
  const len = Math.hypot(ix, iz);
  if (len > 1) { ix /= len; iz /= len; }

  // Setting off again releases whatever we were looking at
  if (state.focus && (steering || state.auto)) releaseFocus(false);

  /* ---- velocity & position ---- */
  const k = 1 - Math.exp(-(len > 0 ? MOVE.accel : MOVE.decel) * dt);
  state.vx += (ix * maxSpeed - state.vx) * k;
  state.vz += (iz * maxSpeed - state.vz) * k;

  const W = LAYOUT.walk;
  let nx = state.x + state.vx * dt;
  let nz = state.z + state.vz * dt;
  if (nx < -W.xMax || nx > W.xMax) { nx = clamp(nx, -W.xMax, W.xMax); state.vx = 0; }
  if (nz < W.zMin || nz > W.zMax)  { nz = clamp(nz, W.zMin, W.zMax);  state.vz = 0; }
  const moved = Math.hypot(nx - state.x, nz - state.z);
  state.x = nx;
  state.z = nz;
  const speed = dt > 0 ? moved / dt : 0;

  /* ---- heading ---- */
  if (speed > 0.3) state.targetYaw = Math.atan2(state.vx, state.vz);
  else if (state.focus) state.targetYaw = state.focus.facing;
  state.yaw = wrapAngle(dampAngle(state.yaw, state.targetYaw, 9, dt));

  hero.setPose(state.x, state.z, state.yaw);
  hero.update(dt, speed, elapsed, Boolean(state.focus));

  /* ---- trail ---- */
  state.stride += moved;
  if (speed > 0.6 && state.stride > MOVE.stride) {
    state.stride = 0;
    state.leftFoot = !state.leftFoot;
    trail.spawn(state.x, state.z, state.yaw, state.leftFoot, elapsed);
  }
  trail.update(elapsed);

  updateTargets(dt, speed, steering);
  updateCamera(dt);
  updateTag();
  updateClickMarker(dt);

  if (pointer.hoverDirty && !ui.isTouch) {
    pointer.hoverDirty = false;
    canvas.style.cursor = !ui.isMenuOpen() && pick(pointer.cx, pointer.cy) ? 'pointer' : '';
  }
}

/* ---- viewing circles: focus state machine + highlight ---- */
function updateTargets(dt, speed, steering) {
  let inside = null;
  world.targets.forEach((t) => {
    t.dist = Math.hypot(state.x - t.x, state.z - t.z);
    if (t.dist < t.r) inside = t;
  });
  if (state.lock && state.lock.dist > state.lock.r + 0.2) state.lock = null;

  const settled = inside && !steering && !state.auto && speed < 0.35;
  state.still = settled ? state.still + dt : 0;
  if (!state.focus && settled && state.still >= MOVE.dwell && state.lock !== inside) setFocus(inside);

  world.targets.forEach((t) => {
    const active = state.focus === t;
    const near = !active && t.dist < t.r + 1.5;
    t.glow = damp(t.glow, active ? 1 : near ? 0.4 : 0, 6, dt);
    t.fill.material.opacity = t.glow;
    t.ring.material.opacity = 0.62 + t.glow * 0.38;
    const s = t.size * (1 + t.glow * 0.06);
    t.ring.scale.set(s, s, 1);
    t.fill.scale.set(s, s, 1);
    t.ring.rotation.z += dt * (0.03 + t.glow * 0.22);
  });
}

/* ---- floating title over the nearest circle ---- */
const tagPos = new THREE.Vector3();
function updateTag() {
  const near = nearestTarget();
  if (state.focus || ui.isMenuOpen() || !near || near.dist > near.r + HALL.approach) {
    ui.setTag(false);
    return;
  }
  let hint = 'Step into the circle';
  if (near.dist < near.r) {
    hint = state.lock === near
      ? (ui.isTouch ? 'Tap the artwork to look closer' : 'Press Enter to look closer')
      : 'Hold still…';
  }
  tagPos.set(near.x, near.tagY, near.z).project(camera);
  const onScreen = tagPos.z < 1 && Math.abs(tagPos.x) < 1.05 && Math.abs(tagPos.y) < 1.05;
  ui.setTag(
    onScreen, near.title, hint,
    ((tagPos.x + 1) / 2) * window.innerWidth,
    ((1 - tagPos.y) / 2) * window.innerHeight
  );
}

function updateClickMarker(dt) {
  clickAge += dt;
  const k = clickAge / 0.9;
  clickMarker.material.opacity = k < 1 ? 0.75 * (1 - k) : 0;
  const s = (0.3 + Math.min(k, 1) * 0.2) / RING_R;
  clickMarker.scale.set(s, s, 1);
}

/* =============================================
   CAMERA
   ============================================= */
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const goalPos = new THREE.Vector3();
const goalLook = new THREE.Vector3();

/* Frame a target so it fills most of the height and sits to the right,
   leaving the left of the screen for the info panel (bottom on portrait). */
/* Portrait screens get a wider lens (the camera can't back up through the wall) */
const followFov = () => (camera.aspect < 1 ? CAM.fov + 16 : CAM.fov);
const focusFov  = () => (camera.aspect < 1 ? CAM.focusFov + 16 : CAM.focusFov);

/* Same breakpoint the CSS uses to move the info panel to the bottom */
const narrowLayout = window.matchMedia('(max-width: 860px), (max-aspect-ratio: 1/1)');

function frameTarget(t, pos, look) {
  const v = t.view;
  const aspect = camera.aspect;
  const tanH = Math.tan(THREE.MathUtils.degToRad(focusFov()) / 2);
  const wide = !narrowLayout.matches;
  const hFrac = wide ? 0.8 : 0.4;    // share of screen height the frame may fill
  const wFrac = wide ? 0.44 : 0.86;  // share of screen width

  let d = Math.max((v.h / hFrac) / (2 * tanH), (v.w / wFrac) / (2 * tanH * aspect));
  d = Math.min(d, v.maxDist);

  const visH = 2 * tanH * d;
  const shiftRight = wide ? visH * aspect * 0.2 : 0;
  const shiftDown = wide ? 0 : visH * 0.17;
  const drift = Math.sin(elapsed * 0.3) * 0.15;   // slow breathing drift

  look.copy(v.centre).addScaledVector(v.right, -shiftRight + drift);
  look.y -= shiftDown;
  pos.copy(look).addScaledVector(v.normal, d);
  pos.y = Math.max(1.2, pos.y + Math.sin(elapsed * 0.5) * 0.05);
}

function followGoal(pos, look) {
  pos.set(state.x * 0.55, CAM.height + Math.sin(elapsed * 0.9) * 0.05, state.z + CAM.distance);
  pos.z = Math.min(pos.z, LAYOUT.frontZ - 1.2);
  look.set(state.x * 0.3, CAM.lookHeight, state.z - CAM.lookAhead);
}

function updateCamera(dt) {
  let lambda, fov;
  if (state.focus) {
    frameTarget(state.focus, goalPos, goalLook);
    lambda = CAM.focusLambda;
    fov = focusFov();
  } else {
    followGoal(goalPos, goalLook);
    lambda = CAM.followLambda;
    fov = followFov();
  }

  // Gentle mouse parallax (desktop)
  if (!ui.isTouch) {
    pointer.sx = damp(pointer.sx, pointer.nx, 3, dt);
    pointer.sy = damp(pointer.sy, pointer.ny, 3, dt);
    const amount = state.focus ? CAM.parallax * 0.35 : CAM.parallax;
    const right = state.focus ? state.focus.view.right : AXIS_X;
    goalPos.addScaledVector(right, pointer.sx * amount);
    goalPos.y -= pointer.sy * amount * 0.5;
  }

  // Slow crane-down right after entering
  const t = clamp((elapsed - state.startedAt) / CAM.introDuration, 0, 1);
  lambda *= 0.2 + 0.8 * t * t * (3 - 2 * t);

  const a = 1 - Math.exp(-lambda * dt);
  camPos.lerp(goalPos, a);
  camLook.lerp(goalLook, a);
  // Safety net: if anything ever produced NaN, snap back to the goal instead of staying broken
  if (!Number.isFinite(camPos.x + camPos.y + camPos.z)) camPos.copy(goalPos);
  if (!Number.isFinite(camLook.x + camLook.y + camLook.z)) camLook.copy(goalLook);

  const newFov = damp(camera.fov, fov, lambda * 0.8, dt);
  if (Math.abs(newFov - camera.fov) > 1e-3) {
    camera.fov = newFov;
    camera.updateProjectionMatrix();
  }
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  camera.updateMatrixWorld();
}

/* =============================================
   TOP BAR CONTRAST
   A few times a second, read the rendered pixels under the name and the
   menu button and flip them to white when the view behind them is dark.
   ============================================= */
const topBar = {
  items: [document.querySelector('.hud-top .brand'), document.getElementById('menuBtn')],
  clock: 0,
  buffer: new Uint8Array(4 * 256),
};

function sampleTopBar(dt) {
  topBar.clock += dt;
  if (topBar.clock < 0.25) return;
  topBar.clock = 0;

  const gl = renderer.getContext();
  const dpr = renderer.getPixelRatio();
  const bufW = renderer.domElement.width, bufH = renderer.domElement.height;

  topBar.items.forEach((el) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.max(1, Math.min(256, Math.round(r.width * dpr)));
    const x = clamp(Math.round(r.left * dpr), 0, bufW - w);
    const y = clamp(Math.round((window.innerHeight - (r.top + r.height / 2)) * dpr), 0, bufH - 1);
    gl.readPixels(x, y, w, 1, gl.RGBA, gl.UNSIGNED_BYTE, topBar.buffer);   // one row across the element

    let lum = 0;
    for (let i = 0; i < w; i++) {
      lum += 0.2126 * topBar.buffer[i * 4] + 0.7152 * topBar.buffer[i * 4 + 1] + 0.0722 * topBar.buffer[i * 4 + 2];
    }
    lum /= w;
    // a little hysteresis so it doesn't flicker on mid-greys
    if (lum < 118) el.classList.add('on-dark');
    else if (lum > 150) el.classList.remove('on-dark');
  });
}

/* =============================================
   LOOP & BOOT
   ============================================= */
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!state.running) return;
  elapsed += dt;
  update(dt);
  renderer.render(scene, camera);
  sampleTopBar(dt);   // must run right after rendering, while the frame is still readable
}

// Opening shot: high near the entrance, looking down the hall
hero.setPose(state.x, state.z, state.yaw);
hero.update(0, 0, 0, false);
camPos.set(0, 12, LAYOUT.frontZ - 0.8);
camLook.set(0, 6, LAYOUT.startZ - 30);
camera.fov = followFov();
camera.updateProjectionMatrix();
camera.position.copy(camPos);
camera.lookAt(camLook);
renderer.compile(scene, camera);
renderer.render(scene, camera);
requestAnimationFrame(loop);

// intro.js fires this as the white curtain starts to fade
window.addEventListener('galleryStart', () => {
  document.body.classList.add('in-gallery');
  state.running = true;
  state.startedAt = elapsed;
  last = performance.now();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
});

// Handy for poking at the scene from the console while developing locally
if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  window.__gallery = {
    state, world, camera, scene, renderer, held,
    // advance the simulation by hand (for testing when animation frames are paused)
    step(seconds = 1, fps = 60) {
      for (let i = 0; i < Math.round(seconds * fps); i++) { elapsed += 1 / fps; update(1 / fps); }
      renderer.render(scene, camera);
      topBar.clock = 1;
      sampleTopBar(0);
    },
  };
}
