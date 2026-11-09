/**
 * world.js — builds the static gallery hall in the active theme's style.
 *
 *   addLights        sky fill + a high key light that casts the railing shadows
 *   addShell         floor, walls, ceiling (peaked or flat, with baked soft corners)
 *   addSkylights     framed roof windows · flat light panels · neon strips · none
 *   addBackWallPanel your name + bio painted on the far wall
 *   addRails         wrap-around rail · painted floor line · velvet ropes · pixel blocks
 *   addArtwork       frame (mat · screen · pixel), picture, wall label and its lamp
 *   addMarkers       viewing circles (+ the "get in touch" circle)
 *
 * buildWorld() returns what the rest of the app needs to interact with:
 *   targets    one per viewing circle — position, radius, camera framing
 *   hitMeshes  meshes you can click to walk to their circle
 */

import * as THREE from 'three';
import {
  SITE, HALL, ART, FRAME, LIGHT, THEME, DEMO_ART, ARTWORKS, LAYOUT, WALL_X, PEAK_Y,
} from './config.js';
import * as TX from './textures.js';

const TILE_WALL = 8;   // world units per plaster tile

export function buildWorld(scene, renderer) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const world = { targets: [], hitMeshes: [], panel: null, videos: new Map() };

  addLights(scene);
  addShell(scene, aniso);
  addSkylights(scene);
  addBackWallPanel(scene, world, aniso);
  addRails(scene);

  const F = THEME.frame;
  const shared = {
    frameMat: new THREE.MeshStandardMaterial({ color: F.color, roughness: F.roughness ?? 0.55, metalness: F.metalness ?? 0 }),
    innerMat: new THREE.MeshLambertMaterial({ color: F.inner ?? 0x000000 }),
    matMat:   new THREE.MeshLambertMaterial({ map: TX.makeMatTexture(), color: F.mat ?? 0xffffff }),
    bevelMat: new THREE.MeshLambertMaterial({ color: 0xcfcfcb }),
    shadow:   TX.makeRectHaloTexture('#000'),
    halo:     F.glow ? TX.makeRectHaloTexture('#fff') : null,
    aniso,
  };
  ARTWORKS.forEach((art) => addArtwork(scene, world, art, shared));

  addMarkers(scene, world);
  return world;
}

/* =============================================
   LIGHTS
   ============================================= */
function addLights(scene) {
  scene.add(new THREE.HemisphereLight(LIGHT.sky, LIGHT.ground, LIGHT.ambient));

  // Key light from high up and slightly behind, so shadows fall toward the visitor
  const c = LAYOUT.centerZ;
  const sun = new THREE.DirectionalLight(LIGHT.sunColor, LIGHT.sun);
  sun.position.set(6, 30, c - 12);
  sun.target.position.set(0, 0, c);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const ext = Math.max(LAYOUT.length, HALL.width) * 0.6;
  Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  // Weak opposite fill so both walls read evenly
  const fill = new THREE.DirectionalLight(0xffffff, LIGHT.fill);
  fill.position.set(-6, 10, c + 10);
  fill.target.position.set(0, 0, c);
  scene.add(fill, fill.target);
}

/* =============================================
   ROOM SHELL
   ============================================= */

/* A grid mesh whose vertices come from fn(u, v) → { x, y, z, u, v, shade }.
   `shade` darkens vertices near corners — cheap baked ambient occlusion. */
function gridGeometry(nu, nv, fn, flip = false) {
  const pos = [], uv = [], col = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const p = fn(i / nu, j / nv);
      pos.push(p.x, p.y, p.z);
      uv.push(p.u, p.v);
      const s = p.shade ?? 1;
      col.push(s, s, s);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      if (flip) idx.push(a, b, c, b, d, c);
      else      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setIndex(idx);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

/* 1 far from a corner, dipping by `strength` right at it */
const ao = (gap, strength, falloff) => 1 - strength * Math.exp(-Math.max(0, gap) / falloff);

/* Floor material for the theme */
function floorMaterial(aniso) {
  const F = THEME.floor;
  let map;
  switch (F.style) {
    case 'grid':     map = TX.makeGridTexture(aniso, { base: F.base, minor: F.minor, major: F.major, cells: F.tile, glow: F.glow }); break;
    case 'checker':  map = TX.makeCheckerTexture({ a: F.a, b: F.b }); break;
    case 'tiles':    map = TX.makeTileTexture(aniso, { base: F.base, grout: F.grout }); break;
    case 'polished': map = TX.makePolishedTexture(aniso, { base: F.base }); break;
    default:         map = TX.makeMarbleTexture(aniso);
  }
  const mat = new THREE.MeshStandardMaterial({
    map, vertexColors: true, roughness: F.roughness ?? 0.5, metalness: F.metalness ?? 0,
  });
  if (F.glow) {                      // glowing grid lines
    mat.emissive = new THREE.Color(0xffffff);
    mat.emissiveMap = map;
    mat.emissiveIntensity = F.glow;
  }
  return mat;
}

/* Wall texture for the theme (plaster is grey and gets tinted by material colour) */
function wallTexture(aniso) {
  const W = THEME.walls;
  switch (W.style) {
    case 'panels': return TX.makePanelTexture(aniso, { base: W.base, seam: W.seam });
    case 'bricks': return TX.makeBrickTexture({ brick: W.brick, mortar: W.mortar });
    default:       return TX.makePlasterTexture(aniso, { seed: 5, tone: W.tone ?? 240 });
  }
}

function addShell(scene, aniso) {
  const { frontZ, backZ, length } = LAYOUT;
  const endGap = (z) => Math.min(z - backZ, frontZ - z);
  const floorTile = THEME.floor.tile ?? 6.5;
  const wallTile = THEME.walls.tile ?? TILE_WALL;

  const wallTex = wallTexture(aniso);
  const plaster = THEME.walls.style === 'plaster' ? wallTex : TX.makePlasterTexture(aniso, { seed: 5, tone: 240 });
  const wallMat = new THREE.MeshLambertMaterial({ map: wallTex, vertexColors: true, side: THREE.DoubleSide, color: THEME.walls.side });
  const endMat  = new THREE.MeshLambertMaterial({ map: wallTex, vertexColors: true, side: THREE.DoubleSide, color: THEME.walls.end });
  const ceilMat = new THREE.MeshLambertMaterial({ map: plaster, vertexColors: true, side: THREE.DoubleSide, color: THEME.ceiling.color });

  // Floor
  const floor = new THREE.Mesh(
    gridGeometry(40, Math.ceil(length / 1.5), (u, v) => {
      const x = -WALL_X + u * HALL.width, z = frontZ - v * length;
      return {
        x, y: 0, z, u: x / floorTile, v: z / floorTile,
        shade: ao(WALL_X - Math.abs(x), 0.32, 0.9) * ao(endGap(z), 0.28, 1.1),
      };
    }, true),
    floorMaterial(aniso)
  );
  floor.receiveShadow = true;
  scene.add(floor);

  // Side walls
  [-1, 1].forEach((sx) => {
    const wall = new THREE.Mesh(
      gridGeometry(40, 14, (u, v) => {
        const z = frontZ - u * length, y = v * HALL.eave;
        return {
          x: sx * WALL_X, y, z, u: z / wallTile, v: y / wallTile,
          shade: ao(y, 0.3, 0.8) * ao(HALL.eave - y, 0.14, 1.2) * ao(endGap(z), 0.22, 1.0),
        };
      }, sx < 0),
      wallMat
    );
    wall.receiveShadow = true;
    scene.add(wall);
  });

  // End walls (back wall is what you walk toward; front wall closes the room)
  [[backZ, true], [frontZ, false]].forEach(([z, isBack]) => {
    const rect = new THREE.Mesh(
      gridGeometry(24, 14, (u, v) => {
        const x = -WALL_X + u * HALL.width, y = v * HALL.eave;
        return {
          x, y, z, u: x / wallTile, v: y / wallTile,
          shade: ao(y, 0.3, 0.8) * ao(WALL_X - Math.abs(x), 0.22, 1.0) * ao(HALL.eave - y, 0.1, 1.2),
        };
      }, isBack),
      endMat
    );
    rect.receiveShadow = true;
    scene.add(rect);

    if (HALL.peakRise > 0) {
      const gable = new THREE.BufferGeometry();
      gable.setAttribute('position', new THREE.Float32BufferAttribute([
        -WALL_X, HALL.eave, z,  WALL_X, HALL.eave, z,  0, PEAK_Y, z,
      ], 3));
      gable.setAttribute('uv', new THREE.Float32BufferAttribute([
        -WALL_X / wallTile, HALL.eave / wallTile,  WALL_X / wallTile, HALL.eave / wallTile,  0, PEAK_Y / wallTile,
      ], 2));
      gable.setAttribute('color', new THREE.Float32BufferAttribute([0.86, 0.86, 0.86,  0.86, 0.86, 0.86,  0.95, 0.95, 0.95], 3));
      gable.computeVertexNormals();
      scene.add(new THREE.Mesh(gable, endMat));
    }
  });

  // Ceiling — two slopes meeting at the ridge (flat when peakRise is 0)
  const slopeLen = Math.hypot(WALL_X, HALL.peakRise);
  [-1, 1].forEach((sx) => {
    scene.add(new THREE.Mesh(
      gridGeometry(40, 10, (u, v) => {
        const z = frontZ - u * length, s = v * slopeLen;
        return {
          x: sx * WALL_X * (1 - v), y: HALL.eave + HALL.peakRise * v, z,
          u: z / TILE_WALL, v: s / TILE_WALL,
          shade: ao(s, 0.35, 1.1) * ao(slopeLen - s, HALL.peakRise > 0 ? 0.12 : 0, 0.7) * ao(endGap(z), 0.2, 1.0),
        };
      }),
      ceilMat
    ));
  });
}

/* =============================================
   SKYLIGHTS / CEILING LIGHTS
   ============================================= */

/* z positions between the artwork pairs, along the whole hall */
function bayPositions() {
  const zs = [];
  for (let z = HALL.firstRowZ + HALL.rowSpacing / 2; z < LAYOUT.frontZ - 4; z += HALL.rowSpacing) zs.push(z);
  for (let z = HALL.firstRowZ - HALL.rowSpacing / 2; z > LAYOUT.backZ + 3; z -= HALL.rowSpacing) zs.push(z);
  return zs;
}

function addSkylights(scene) {
  const S = THEME.skylights;
  if (S.style === 'none') return;
  if (S.style === 'neon') return addNeonStrips(scene, S);

  const frameMat = new THREE.MeshLambertMaterial({ color: S.frame });
  const glassMat = new THREE.MeshBasicMaterial({ color: S.glass, toneMapped: false, side: THREE.DoubleSide });
  const glowMat  = new THREE.MeshBasicMaterial({
    map: TX.makeGlowTexture(), color: S.glass, transparent: true, opacity: 0.35, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide,
  });
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  /* A window lying in a local x/z plane; `inward` is the local y side facing the room */
  const windowGroup = (len, width, bar, depth, inward) => {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(len, width).rotateX(Math.PI / 2), glassMat);
    glass.position.y = inward * 0.03;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(len + 4, width + 4).rotateX(Math.PI / 2), glowMat);
    glow.position.y = inward * 0.05;
    g.add(glass, glow);
    const yb = inward * depth * 0.35;
    [
      [box(len + bar, depth, bar), 0, width / 2],
      [box(len + bar, depth, bar), 0, -width / 2],
      [box(bar, depth, width + bar), -len / 2, 0],
      [box(bar, depth, width + bar), len / 2, 0],
      [box(bar * 0.7, depth * 0.8, width), 0, 0],   // centre mullion
    ].forEach(([geo, x, z]) => {
      const m = new THREE.Mesh(geo, frameMat);
      m.position.set(x, yb, z);
      g.add(m);
    });
    return g;
  };

  bayPositions().forEach((z) => {
    if (S.style === 'framed' && HALL.peakRise > 0) {
      // Roof windows set into each slope
      const alpha = Math.atan2(HALL.peakRise, WALL_X);
      const s0 = 1.2, s1 = 5.8;
      [-1, 1].forEach((sx) => {
        const pivot = new THREE.Group();
        pivot.position.set(0, PEAK_Y, z);
        pivot.rotation.z = sx > 0 ? -alpha : Math.PI + alpha;   // local +x runs down the slope
        const win = windowGroup(s1 - s0, 2.7, 0.2, 0.26, sx > 0 ? -1 : 1);
        win.position.x = (s0 + s1) / 2;
        pivot.add(win);
        scene.add(pivot);
      });
    } else {
      // Flat light panels in the ceiling, two per bay
      [-1, 1].forEach((sx) => {
        const win = windowGroup(5.2, 3.0, S.bar ?? 0.14, 0.2, -1);
        win.position.set(sx * WALL_X * 0.38, HALL.eave, z);
        scene.add(win);
      });
    }
  });
}

/* Glowing tubes outlining the hall (neon theme) */
function addNeonStrips(scene, S) {
  const [a, b] = S.colors;
  const { backZ, length, centerZ } = LAYOUT;
  const tube = (color, r, len) => new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, len, 10),
    new THREE.MeshBasicMaterial({ color, toneMapped: false })
  );
  const along = (color, x, y, r = 0.06) => {
    const t = tube(color, r, length);
    t.rotation.x = Math.PI / 2;
    t.position.set(x, y, centerZ);
    scene.add(t);
  };
  const across = (color, y, z, r = 0.06) => {
    const t = tube(color, r, HALL.width);
    t.rotation.z = Math.PI / 2;
    t.position.set(0, y, z);
    scene.add(t);
  };

  // wall/ceiling joints, wall/floor joints and a centre line on the ceiling
  [-1, 1].forEach((sx) => {
    along(a, sx * (WALL_X - 0.08), HALL.eave - 0.1);
    along(b, sx * (WALL_X - 0.08), 0.08, 0.05);
  });
  along(b, 0, HALL.eave - 0.05, 0.08);
  across(a, HALL.eave - 0.1, backZ + 0.08);
  across(b, 0.08, backZ + 0.08, 0.05);
  // cross strips over each bay
  bayPositions().forEach((z) => across(a, HALL.eave - 0.05, z, 0.05));
}

/* =============================================
   BACK WALL — name & bio
   ============================================= */
function addBackWallPanel(scene, world, aniso) {
  const W = 2048, H = 1536;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const tex = TX.toTexture(cv, { aniso });
  const draw = () => { TX.drawBackPanel(cv, SITE); tex.needsUpdate = true; };
  draw();
  TX.fontsReady().then(draw);

  const pw = HALL.panelWidth, ph = pw * (H / W);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(pw, ph),
    new THREE.MeshLambertMaterial({
      map: tex, transparent: true,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: THEME.panelGlow ?? 0,
    })
  );
  panel.position.set(0, HALL.panelY, LAYOUT.backZ + 0.03);
  panel.userData.targetIndex = ARTWORKS.length;   // clicking it walks to the contact circle
  scene.add(panel);
  world.hitMeshes.push(panel);
  world.panel = { w: pw, h: ph };

  // One wide, soft wash over the whole wall — a single lamp, centred, so the
  // light reads as one pool instead of two overlapping ones.
  const wash = new THREE.SpotLight(LIGHT.spotColor, LIGHT.spot * 2.2, 40, Math.PI / 4.1, 0.95, 0.95);
  wash.position.set(0, HALL.panelY + 2.2, LAYOUT.backZ + 8);
  wash.target.position.set(0, HALL.panelY - 1.5, LAYOUT.backZ);   // aimed low, so the last paragraph is lit too
  scene.add(wash, wash.target);
}

/* =============================================
   RAILING
   ============================================= */

/* One continuous path: down the left, round the corner, across, back up the right */
function railPath(y) {
  const { railX, railBackZ, frontZ } = LAYOUT;
  const R = 0.9;
  const v = (x, z) => new THREE.Vector3(x, y, z);
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(v(-railX, frontZ), v(-railX, railBackZ + R)));
  path.add(new THREE.QuadraticBezierCurve3(v(-railX, railBackZ + R), v(-railX, railBackZ), v(-railX + R, railBackZ)));
  path.add(new THREE.LineCurve3(v(-railX + R, railBackZ), v(railX - R, railBackZ)));
  path.add(new THREE.QuadraticBezierCurve3(v(railX - R, railBackZ), v(railX, railBackZ), v(railX, railBackZ + R)));
  path.add(new THREE.LineCurve3(v(railX, railBackZ + R), v(railX, frontZ)));
  return path;
}

/* Evenly spaced points along the path (skipping the bit hidden behind the camera) */
function pointsAlong(path, spacing) {
  const n = Math.round(path.getLength() / spacing);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const p = path.getPointAt(i / n);
    if (p.z <= LAYOUT.frontZ - 0.5) pts.push(p);
  }
  return pts;
}

function addRails(scene) {
  const R = THEME.rails;
  const H = HALL.railHeight;

  if (R.style === 'line') {
    // Painted boundary line on the floor
    const stripe = new THREE.Mesh(
      new THREE.TubeGeometry(railPath(0), 600, 0.07, 6, false),
      new THREE.MeshBasicMaterial({ color: R.color, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    );
    stripe.scale.y = 0.05;
    stripe.position.y = 0.012;
    scene.add(stripe);
    return;
  }

  if (R.style === 'blocks') {
    // Low fence of chunky pixel blocks
    const geo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const mats = [new THREE.MeshLambertMaterial({ color: R.color }), new THREE.MeshLambertMaterial({ color: R.alt })];
    pointsAlong(railPath(0), 0.9).forEach((p, i) => {
      const tall = i % 5 === 0;
      for (let k = 0; k < (tall ? 2 : 1); k++) {
        const b = new THREE.Mesh(geo, mats[(i + k) % 2]);
        b.position.set(p.x, 0.21 + k * 0.42, p.z);
        b.castShadow = true;
        scene.add(b);
      }
    });
    return;
  }

  if (R.style === 'ropes') {
    // Brass stanchions with sagging velvet ropes
    const brass = new THREE.MeshStandardMaterial({ color: R.post, metalness: 0.7, roughness: 0.3 });
    const velvet = new THREE.MeshStandardMaterial({ color: R.rope, roughness: 0.85 });
    const postH = 1.05;
    const posts = pointsAlong(railPath(0), 3.4);
    posts.forEach((p, i) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, postH, 12), brass);
      post.position.set(p.x, postH / 2, p.z);
      post.castShadow = true;
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), brass);
      top.position.set(p.x, postH + 0.06, p.z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.05, 20), brass);
      base.position.set(p.x, 0.025, p.z);
      scene.add(post, top, base);

      const q = posts[i + 1];
      if (!q) return;
      const hang = postH - 0.1;
      const mid = new THREE.Vector3((p.x + q.x) / 2, hang - 0.3, (p.z + q.z) / 2);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(p.x, hang, p.z), mid, new THREE.Vector3(q.x, hang, q.z)
      );
      const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.045, 8, false), velvet);
      rope.castShadow = true;
      scene.add(rope);
    });
    return;
  }

  // 'wrap' — one continuous rail on posts (optionally glowing)
  const mat = new THREE.MeshStandardMaterial({
    color: R.color, roughness: 0.45,
    emissive: R.glow ? R.color : 0x000000, emissiveIntensity: R.glow ? 2.2 : 0,
  });
  const postMat = R.glow ? new THREE.MeshStandardMaterial({ color: 0x1a1726, roughness: 0.5 }) : mat;
  const tube = new THREE.Mesh(new THREE.TubeGeometry(railPath(H), 600, R.radius ?? 0.08, 10, false), mat);
  tube.castShadow = true;
  scene.add(tube);

  const postGeo = new THREE.CylinderGeometry(0.065, 0.065, H, 10);
  const footGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16);
  pointsAlong(railPath(H), 4.2).forEach((p) => {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(p.x, H / 2, p.z);
    post.castShadow = true;
    const foot = new THREE.Mesh(footGeo, postMat);
    foot.position.set(p.x, 0.02, p.z);
    scene.add(post, foot);
  });
}

/* =============================================
   ARTWORKS
   ============================================= */
const photoLoader = new THREE.TextureLoader();

function addArtwork(scene, world, art, shared) {
  const sx = art.side === 'left' ? -1 : 1;
  const F = THEME.frame;

  // Local frame: +x = the viewer's right, +z = out of the wall into the room
  const g = new THREE.Group();
  g.position.set(sx * WALL_X, ART.centerY, art.z);
  g.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(g);

  const FW = FRAME.w, FH = FRAME.h, D = ART.depth, fb = ART.frame;
  let face = D * 0.42;   // depth of the picture inside the frame
  const hits = [];

  // Soft drop shadow on the wall
  if (F.shadow) {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(FW * shared.shadow.scaleX, FH * shared.shadow.scaleY),
      new THREE.MeshBasicMaterial({ map: shared.shadow.tex, transparent: true, opacity: F.shadow, depthWrite: false })
    );
    shadow.position.set(0.12, -0.3, 0.012);
    g.add(shadow);
  }

  const bars = (mat, thick, depth, w, h, z) => {
    [
      [w, thick, 0, (h - thick) / 2], [w, thick, 0, -(h - thick) / 2],
      [thick, h - 2 * thick, -(w - thick) / 2, 0], [thick, h - 2 * thick, (w - thick) / 2, 0],
    ].forEach(([bw, bh, x, y]) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, depth), mat);
      bar.position.set(x, y, z);
      bar.castShadow = true;
      g.add(bar);
    });
  };

  if (F.style === 'screen') {
    // Thin-bezel monitor; the picture sits on its front face
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(FW, FH, D), shared.frameMat);
    bezel.position.z = D / 2 + 0.01;
    bezel.castShadow = true;
    g.add(bezel);
    face = D + 0.012;
    hits.push(bezel);

    if (shared.halo) {   // coloured glow spilling onto the wall
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(FW * shared.halo.scaleX * 1.25, FH * shared.halo.scaleY * 1.4),
        new THREE.MeshBasicMaterial({
          map: shared.halo.tex, color: F.glow, transparent: true, opacity: 0.55, depthWrite: false,
          blending: THREE.AdditiveBlending, toneMapped: false,
        })
      );
      halo.position.z = 0.015;
      g.add(halo);
    }
  } else if (F.style === 'pixel') {
    // Chunky two-tone frame: bright outer moulding + dark inner outline
    bars(shared.frameMat, fb, D, FW, FH, D / 2 + 0.01);
    const t = fb * 0.32;
    bars(shared.innerMat, t, D + 0.04, FW - 2 * fb + 2 * t, FH - 2 * fb + 2 * t, D / 2 + 0.03);
  } else {
    // 'mat' — moulding, white passe-partout, thin bevel line
    bars(shared.frameMat, fb, D, FW, FH, D / 2 + 0.01);
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(FW - 2 * fb + 0.02, FH - 2 * fb + 0.02), shared.matMat);
    mat.position.z = face;
    g.add(mat);
    hits.push(mat);
    if (ART.mat > 0) {
      const bevel = new THREE.Mesh(new THREE.PlaneGeometry(ART.width + 0.07, ART.height + 0.07), shared.bevelMat);
      bevel.position.z = face + 0.002;
      g.add(bevel);
    }
  }

  // The picture — placeholder (or sample art with ?demo), swapped for a photo if one exists
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = Math.round(1024 * (ART.height / ART.width));
  const pictureTex = TX.toTexture(cv, { aniso: shared.aniso });
  const drawPicture = () => {
    if (DEMO_ART) TX.drawDemoArt(cv, art);
    else TX.drawPlaceholderArt(cv, art, ARTWORKS.length);
    pictureTex.needsUpdate = true;
  };
  drawPicture();
  TX.fontsReady().then(drawPicture);

  const artMat = new THREE.MeshLambertMaterial({
    map: pictureTex, emissive: 0xffffff, emissiveMap: pictureTex, emissiveIntensity: F.artGlow ?? 0.28,
  });
  const picture = new THREE.Mesh(new THREE.PlaneGeometry(ART.width, ART.height), artMat);
  picture.position.z = face + 0.004;
  g.add(picture);
  hits.push(picture);

  if (!DEMO_ART) {
    if (art.poster) loadStill(art.poster, artMat, shared.aniso);
    else loadPhoto(art, artMat, shared.aniso);
    // A gameplay video plays while the visitor stands in this artwork's circle
    if (art.video) world.videos.set(art.index, createVideoPlayback(art.video, artMat, shared.aniso));
  }

  // Museum label to the right of the frame
  const lcv = document.createElement('canvas');
  lcv.width = 640; lcv.height = 360;
  const ltex = TX.toTexture(lcv, { aniso: shared.aniso });
  const drawLabel = () => { TX.drawWallLabel(lcv, art, ARTWORKS.length); ltex.needsUpdate = true; };
  drawLabel();
  TX.fontsReady().then(drawLabel);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.3 * (360 / 640)),
    new THREE.MeshLambertMaterial({ map: ltex, emissive: 0xffffff, emissiveMap: ltex, emissiveIntensity: THEME.panelGlow ? 0.35 : 0 })
  );
  label.position.set(FW / 2 + 1.05, -FH / 2 + 1.0, 0.02);
  g.add(label);

  // Lamp aimed at the top of the frame — leaves a soft pool of light above it
  const spot = new THREE.SpotLight(LIGHT.spotColor, LIGHT.spot, 30, LIGHT.spotAngle, 0.75, 1.3);
  spot.position.set(sx * (WALL_X - 4.6), HALL.eave - 0.4, art.z);
  spot.target.position.set(sx * WALL_X, ART.centerY + 1.1, art.z);
  scene.add(spot, spot.target);

  // Clicking the artwork walks the visitor to its circle
  hits.forEach((m) => { m.userData.targetIndex = art.index; world.hitMeshes.push(m); });
}

/* Crop a texture to fill the frame (never squashed), like CSS object-fit: cover */
function fitCover(tex, sourceAspect) {
  const frameAspect = ART.width / ART.height;
  if (sourceAspect > frameAspect) {
    tex.repeat.x = frameAspect / sourceAspect;
    tex.offset.x = (1 - tex.repeat.x) / 2;
  } else {
    tex.repeat.y = sourceAspect / frameAspect;
    tex.offset.y = (1 - tex.repeat.y) / 2;
  }
}

/* Put one image file in the frame */
function loadStill(path, material, aniso, onDone) {
  photoLoader.load(path, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    fitCover(tex, tex.image.width / tex.image.height);
    material.map = tex;
    material.emissiveMap = tex;
    material.needsUpdate = true;
    onDone?.(tex);
  });
}

/* Swap the placeholder for assets/paintings/<image>.jpg|png|webp if it exists. */
function loadPhoto(art, material, aniso) {
  if (!art.image) return;
  const exts = ['jpg', 'png', 'webp'];
  const attempt = (i) => {
    if (i >= exts.length) return;   // no photo yet — keep the placeholder
    photoLoader.load(`assets/paintings/${art.image}.${exts[i]}`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = aniso;
      fitCover(tex, tex.image.width / tex.image.height);
      material.map = tex;
      material.emissiveMap = tex;
      material.needsUpdate = true;
    }, undefined, () => attempt(i + 1));
  };
  attempt(0);
}

/* A muted, looping gameplay video for one frame. The file is only downloaded
   the first time the visitor steps into that artwork's circle; stepping away
   pauses it and puts the poster back. */
function createVideoPlayback(src, material, aniso) {
  let el = null, tex = null, poster = null;

  return {
    play() {
      poster = poster || material.map;
      if (!el) {
        el = document.createElement('video');
        el.src = src;
        el.muted = true;          // required for autoplay
        el.loop = true;
        el.playsInline = true;
        el.preload = 'auto';
        el.setAttribute('aria-hidden', 'true');
        tex = new THREE.VideoTexture(el);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = aniso;
        el.addEventListener('loadedmetadata', () => fitCover(tex, el.videoWidth / el.videoHeight));
      }
      el.play().catch(() => {});   // a blocked autoplay just leaves the poster up
      material.map = tex;
      material.emissiveMap = tex;
      material.needsUpdate = true;
    },

    pause() {
      if (!el) return;
      el.pause();
      if (poster) {
        material.map = poster;
        material.emissiveMap = poster;
        material.needsUpdate = true;
      }
    },
  };
}

/* =============================================
   VIEWING CIRCLES
   ============================================= */

/* Material for a floor decal (glowing themes add light instead of covering) */
export function decalMaterial(map, { opacity = 1, color = 0xffffff, order = -2 } = {}) {
  const glow = Boolean(THEME.markers.glow);
  return new THREE.MeshBasicMaterial({
    map, color, opacity, transparent: true, depthWrite: false,
    blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: !glow,
    polygonOffset: true, polygonOffsetFactor: order, polygonOffsetUnits: order,
  });
}

function addMarkers(scene, world) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const washTex = TX.makeWashTexture();
  const washColor = new THREE.Color(THEME.markers.color);

  const place = (x, z, r, ringTex, target) => {
    const size = r / TX.RING_R;
    const ring = new THREE.Mesh(geo, decalMaterial(ringTex, { opacity: 0.7 }));
    const fill = new THREE.Mesh(geo, decalMaterial(washTex, { opacity: 0, color: washColor }));
    [[ring, 0.022, 3], [fill, 0.018, 2]].forEach(([m, y, order]) => {
      m.rotation.x = -Math.PI / 2;
      m.scale.set(size, size, 1);
      m.position.set(x, y, z);
      m.renderOrder = order;
      scene.add(m);
    });
    world.targets.push({ ...target, x, z, r, ring, fill, size, glow: 0, dist: Infinity });
  };

  ARTWORKS.forEach((art) => {
    const sx = art.side === 'left' ? -1 : 1;
    place(sx * LAYOUT.circleX, art.z, HALL.circleRadius, TX.makeMarkerTexture({ seed: 21 + art.index }), {
      kind: 'project',
      index: art.index,
      title: art.title,
      facing: Math.atan2(sx, 0),   // visitor turns to face the wall
      tagY: 3.1,
      view: {
        centre: new THREE.Vector3(sx * WALL_X, ART.centerY, art.z),
        normal: new THREE.Vector3(-sx, 0, 0),
        right:  new THREE.Vector3(0, 0, sx),
        w: FRAME.w, h: FRAME.h,
        maxDist: HALL.width - 1.5,
      },
    });
  });

  const ct = LAYOUT.contact;
  const label = 'ABOUT ME · SAY HELLO · ABOUT ME · SAY HELLO · ';
  place(ct.x, ct.z, ct.r, TX.makeMarkerTexture({ seed: 9, label }), {
    kind: 'contact',
    index: ARTWORKS.length,
    title: 'About me',
    facing: Math.PI,
    tagY: 3.4,
    view: {
      centre: new THREE.Vector3(0, HALL.panelY, LAYOUT.backZ),
      normal: new THREE.Vector3(0, 0, 1),
      right:  new THREE.Vector3(1, 0, 0),
      w: world.panel.w, h: world.panel.h,
      maxDist: 30,
    },
  });
}
