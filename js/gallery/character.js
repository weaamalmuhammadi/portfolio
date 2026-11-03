/**
 * character.js — the visitor and the trail it leaves behind.
 *
 * Every theme uses the same little rig (legs, torso, arms, big head) and the
 * same walk animation; only the way each body part is drawn changes:
 *
 *   scribble   dense ballpoint-pen loops over a pale core, with "line boil"
 *              (three scribbles per part swapped a few times a second)
 *   wireframe  low-poly shapes with visible edges, like a model in an editor
 *   voxel      blocky 8-bit figure
 *   toon       smooth cel-shaded toy with an outline
 *
 * A soft blob under the feet keeps the figure grounded.
 */

import * as THREE from 'three';
import { rng, makeBlobTexture, makeTrailTexture } from './textures.js';
import { MOVE, THEME } from './config.js';

const VARIANTS = 3;    // scribbles per body part
const BOIL_FPS = 8;    // how often they swap

/* Body parts: ellipsoid radii, where they hang from, and scribble density */
const PARTS = {
  leg:   { rx: 0.13, ry: 0.28, rz: 0.14, strokes: 30,  length: 50, loop: 0.18 },
  foot:  { rx: 0.14, ry: 0.09, rz: 0.2,  strokes: 14,  length: 40, loop: 0.2 },
  torso: { rx: 0.35, ry: 0.4,  rz: 0.31, strokes: 80,  length: 60, loop: 0.13 },
  arm:   { rx: 0.11, ry: 0.26, rz: 0.11, strokes: 26,  length: 50, loop: 0.18 },
  head:  { rx: 0.56, ry: 0.52, rz: 0.54, strokes: 130, length: 70, loop: 0.12 },
};

/* =============================================
   SCRIBBLE GEOMETRY
   ============================================= */

/* Uniform random point on a unit sphere */
function randomOnSphere(rand, out) {
  const u = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
  return out.set(Math.cos(a) * s, u, Math.sin(a) * s);
}

/* Many short curly pen strokes spread evenly over an ellipsoid (radii rx, ry, rz).
   Each stroke drifts across the surface while drawing small loops. */
function scribble(rand, { rx, ry, rz, strokes, length = 60, loop = 0.12 }) {
  const pts  = [];
  const p    = new THREE.Vector3();
  const dir  = new THREE.Vector3();
  const side = new THREE.Vector3();
  const tmp  = new THREE.Vector3();

  for (let s = 0; s < strokes; s++) {
    randomOnSphere(rand, p);
    randomOnSphere(rand, dir);
    dir.sub(tmp.copy(p).multiplyScalar(dir.dot(p))).normalize();

    const size = loop * (0.6 + rand() * 0.8);
    let theta = rand() * Math.PI * 2, curl = 0, prev = null;

    for (let i = 0; i < length; i++) {
      curl = curl * 0.85 + (rand() - 0.5) * 0.4;
      dir.applyAxisAngle(p, curl);
      p.addScaledVector(dir, 0.028).normalize();
      dir.sub(tmp.copy(p).multiplyScalar(dir.dot(p))).normalize();

      theta += 0.42 + rand() * 0.2;                      // smooth little loops
      side.crossVectors(p, dir);
      const lx = Math.cos(theta) * size, ly = Math.sin(theta) * size;
      const r = 1.02 + (rand() - 0.5) * 0.08;            // fuzzy outline

      const x = (p.x * r + dir.x * lx + side.x * ly) * rx;
      const y = (p.y * r + dir.y * lx + side.y * ly) * ry;
      const z = (p.z * r + dir.z * lx + side.z * ly) * rz;
      if (prev) pts.push(prev[0], prev[1], prev[2], x, y, z);
      prev = [x, y, z];
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

/* =============================================
   PART FACTORIES — one per style
   Each returns (role) => Object3D centred on the part.
   ============================================= */
function scribbleFactory(C, rand, boil) {
  const ink = new THREE.LineBasicMaterial({ color: C.ink ?? 0x0b0b0b });
  const coreMat = new THREE.MeshBasicMaterial({ color: C.paper ?? 0xd4d4d2 });   // "paper" between strokes
  const sphere = new THREE.SphereGeometry(1, 16, 12);

  return (role) => {
    const shape = PARTS[role];
    const g = new THREE.Group();
    for (let v = 0; v < VARIANTS; v++) {
      const lines = new THREE.LineSegments(scribble(rand, shape), ink);
      lines.visible = v === 0;
      g.add(lines);
    }
    // Pale core hides strokes on the far side and casts the shadow
    const core = new THREE.Mesh(sphere, coreMat);
    core.scale.set(shape.rx * 0.84, shape.ry * 0.84, shape.rz * 0.84);
    core.castShadow = true;
    g.add(core);
    boil.push({ holder: g, frame: 0 });
    return g;
  };
}

function wireframeFactory(C) {
  const faceMat = new THREE.MeshLambertMaterial({
    color: C.face, flatShading: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const lineMat = new THREE.LineBasicMaterial({ color: C.line, toneMapped: !C.glow });
  const geos = { 0: new THREE.IcosahedronGeometry(1, 0), 1: new THREE.IcosahedronGeometry(1, 1) };
  const edges = { 0: new THREE.EdgesGeometry(geos[0]), 1: new THREE.EdgesGeometry(geos[1]) };

  return (role) => {
    const { rx, ry, rz } = PARTS[role];
    const detail = role === 'head' || role === 'torso' ? 1 : 0;
    const g = new THREE.Group();
    const face = new THREE.Mesh(geos[detail], faceMat);
    face.scale.set(rx, ry, rz);
    face.castShadow = true;
    const lines = new THREE.LineSegments(edges[detail], lineMat);
    lines.scale.set(rx * 1.004, ry * 1.004, rz * 1.004);
    g.add(face, lines);
    return g;
  };
}

function voxelFactory(C) {
  const col = C.colors;
  const mats = {};
  const mat = (hex) => (mats[hex] ||= new THREE.MeshLambertMaterial({ color: hex }));
  const box = (g, w, h, d, color, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
  };

  return (role) => {
    const g = new THREE.Group();
    switch (role) {
      case 'head':
        box(g, 0.9, 0.84, 0.86, col.skin);
        box(g, 0.96, 0.3, 0.92, col.hair, 0, 0.34, -0.02);     // hair on top
        box(g, 0.96, 0.62, 0.2, col.hair, 0, 0.08, -0.4);      // hair at the back
        box(g, 0.11, 0.17, 0.04, 0x1b1b1b, -0.19, 0.0, 0.44);  // eyes
        box(g, 0.11, 0.17, 0.04, 0x1b1b1b,  0.19, 0.0, 0.44);
        break;
      case 'torso':
        box(g, 0.72, 0.74, 0.5, col.shirt);
        if (col.accent != null) box(g, 0.74, 0.12, 0.52, col.accent, 0, 0.22, 0);   // scarf
        break;
      case 'arm':
        box(g, 0.22, 0.46, 0.24, col.shirt);
        box(g, 0.2, 0.16, 0.22, col.skin, 0, -0.3, 0);          // hand
        break;
      case 'leg':
        box(g, 0.27, 0.52, 0.29, col.pants);
        break;
      case 'foot':
        box(g, 0.29, 0.16, 0.4, col.shoes, 0, 0, 0.04);
        break;
    }
    return g;
  };
}

function toonFactory(C) {
  // Three flat light steps give the cel-shaded look
  const gradient = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;

  const sphere = new THREE.SphereGeometry(1, 28, 20);
  const outlineMat = new THREE.MeshBasicMaterial({ color: C.outline, side: THREE.BackSide });
  const mats = {};
  const mat = (hex) => (mats[hex] ||= new THREE.MeshToonMaterial({ color: hex, gradientMap: gradient }));

  return (role) => {
    const { rx, ry, rz } = PARTS[role];
    const g = new THREE.Group();
    const body = new THREE.Mesh(sphere, mat(C.colors[role]));
    body.scale.set(rx, ry, rz);
    body.castShadow = true;
    const outline = new THREE.Mesh(sphere, outlineMat);   // inverted hull
    outline.scale.set(rx + 0.03, ry + 0.03, rz + 0.03);
    g.add(outline, body);

    if (role === 'head' && C.hair != null) {
      // Hair cap over the top and back of the head (what you see while following)
      const hair = new THREE.Mesh(sphere, mat(C.hair));
      hair.scale.set(rx * 1.06, ry * 0.8, rz * 1.04);
      hair.position.set(0, ry * 0.26, -rz * 0.14);
      const hairLine = new THREE.Mesh(sphere, outlineMat);
      hairLine.scale.set(rx * 1.06 + 0.03, ry * 0.8 + 0.03, rz * 1.04 + 0.03);
      hairLine.position.copy(hair.position);
      const tuft = new THREE.Mesh(sphere, mat(C.hair));
      tuft.scale.set(0.12, 0.16, 0.12);
      tuft.position.set(0.08, ry * 1.02, -0.02);
      tuft.rotation.z = -0.5;
      g.add(hairLine, hair, tuft);
    }

    if (role === 'head' && C.eyes != null) {
      const eyeMat = new THREE.MeshBasicMaterial({ color: C.eyes });
      [-1, 1].forEach((s) => {
        const eye = new THREE.Mesh(sphere, eyeMat);
        eye.scale.set(0.055, 0.08, 0.03);
        eye.position.set(s * 0.18, 0.0, rz * 0.97);
        g.add(eye);
        if (C.blush != null) {
          const cheek = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: C.blush }));
          cheek.scale.set(0.08, 0.045, 0.02);
          cheek.position.set(s * 0.3, -0.13, rz * 0.9);
          g.add(cheek);
        }
      });
    }
    return g;
  };
}

const FACTORIES = { scribble: scribbleFactory, wireframe: wireframeFactory, voxel: voxelFactory, toon: toonFactory };

/* =============================================
   CHARACTER
   ============================================= */
export function createCharacter(scene) {
  const C = THEME.character;
  const rand = rng(1987);
  const boil = [];
  const makePart = (FACTORIES[C.style] || scribbleFactory)(C, rand, boil);

  const root = new THREE.Group();   // position + heading
  const body = new THREE.Group();   // bob, lean and waddle
  root.add(body);
  scene.add(root);

  const pivot = (parent, x, y, z) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };
  const part = (parent, role, [x, y, z]) => {
    const holder = pivot(parent, x, y, z);
    holder.add(makePart(role));
    return holder;
  };

  // Legs (pivot at the hip) with little rounded feet
  const legL = pivot(body, -0.16, 0.66, 0);
  const legR = pivot(body,  0.16, 0.66, 0);
  [legL, legR].forEach((leg) => {
    part(leg, 'leg', [0, -0.32, 0]);
    part(leg, 'foot', [0, -0.58, 0.05]);
  });

  // Round little torso
  part(body, 'torso', [0, 0.98, 0]);

  // Stubby arms (pivot at the shoulder, hanging slightly outward)
  const armL = pivot(body, -0.35, 1.22, 0);
  const armR = pivot(body,  0.35, 1.22, 0);
  armL.rotation.z = -0.25;
  armR.rotation.z =  0.25;
  [armL, armR].forEach((arm) => part(arm, 'arm', [0, -0.22, 0]));

  // Big head
  const head = pivot(body, 0, 1.3, 0);
  part(head, 'head', [0, 0.42, 0]);

  // Soft contact shadow
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6),
    new THREE.MeshBasicMaterial({ map: makeBlobTexture(), transparent: true, opacity: THEME.blob ?? 0.55, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.renderOrder = 1;
  scene.add(blob);

  let phase = 0, amp = 0, boilClock = 0;

  return {
    root,

    setPose(x, z, yaw) {
      root.position.set(x, 0, z);
      root.rotation.y = yaw;
      blob.position.set(x, 0.016, z);
    },

    /* speed: units/second; focused: standing in front of something */
    update(dt, speed, t, focused) {
      const walk = Math.min(1, speed / MOVE.speed);
      amp += (walk - amp) * (1 - Math.exp(-8 * dt));
      phase += speed * dt * MOVE.stepRate;

      const s = Math.sin(phase);
      const idle = 1 - amp;

      legL.rotation.x =  s * 0.7 * amp;
      legR.rotation.x = -s * 0.7 * amp;
      armL.rotation.x = -s * 0.55 * amp;
      armR.rotation.x =  s * 0.55 * amp;

      body.position.y = Math.abs(Math.cos(phase)) * 0.07 * amp + Math.sin(t * 2.2) * 0.012 * idle;
      body.rotation.x = 0.09 * amp;             // lean into the walk
      body.rotation.z = s * 0.04 * amp;         // waddle

      const lookAround = focused ? 0 : idle;
      head.rotation.z = -s * 0.05 * amp + Math.sin(t * 0.7) * 0.03 * idle;
      head.rotation.y = Math.sin(t * 0.45) * 0.22 * lookAround;
      head.rotation.x = Math.sin(t * 1.1) * 0.02 * idle + (focused ? -0.08 : 0);

      const squash = 1 - body.position.y * 0.6;
      blob.scale.set(squash, squash, 1);

      // Line boil (scribble style only)
      if (boil.length) {
        boilClock += dt;
        if (boilClock > 1 / BOIL_FPS) {
          boilClock = 0;
          boil.forEach((b) => {
            b.holder.children[b.frame].visible = false;
            b.frame = (b.frame + 1) % VARIANTS;
            b.holder.children[b.frame].visible = true;
          });
        }
      }
    },
  };
}

/* =============================================
   TRAIL — footprints, glowing dots or pixel squares that fade out
   ============================================= */
export function createTrail(scene, { count = 36, life = 7 } = {}) {
  const T = THEME.trail;
  if (!T || T.style === 'none') return { spawn() {}, update() {} };

  const footprints = T.style === 'footprints';
  const texLeft  = makeTrailTexture(T.style, { seed: 3, mirror: true });
  const texRight = footprints ? makeTrailTexture(T.style, { seed: 4 }) : texLeft;
  const geo = footprints ? new THREE.PlaneGeometry(0.26, 0.39) : new THREE.PlaneGeometry(0.2, 0.2);

  const pool = Array.from({ length: count }, () => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: texRight, color: T.color, transparent: true, opacity: 0, depthWrite: false,
      blending: T.glow ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !T.glow,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }));
    m.visible = false;
    m.renderOrder = 1;
    scene.add(m);
    return m;
  });
  let next = 0;

  return {
    spawn(x, z, yaw, left, now) {
      const m = pool[next];
      next = (next + 1) % count;
      // right-hand direction for a figure facing (sin yaw, cos yaw)
      const rx = -Math.cos(yaw), rz = Math.sin(yaw);
      const side = left ? -0.14 : 0.14;
      m.position.set(x + rx * side, 0.014, z + rz * side);
      m.rotation.set(-Math.PI / 2, 0, yaw + Math.PI);
      m.material.map = left ? texLeft : texRight;
      m.userData.born = now;
      m.visible = true;
    },
    update(now) {
      pool.forEach((m) => {
        if (!m.visible) return;
        const age = now - m.userData.born;
        if (age > life) { m.visible = false; return; }
        m.material.opacity = (T.opacity ?? 0.5) * Math.min(1, age * 6) * Math.pow(1 - age / life, 1.5);
      });
    },
  };
}
