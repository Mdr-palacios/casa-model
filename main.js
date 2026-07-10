import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ------------------------------------------------------------------ *
 *  SCHEMATIC HOUSE MODEL
 *  Coordinates in meters. x = across the front facade, z = depth
 *  (0 = front of house, increasing toward the back), y = up.
 *
 *  Layout (confirmed facts baked in, everything else is a labeled
 *  placeholder estimate — see the "Assumptions & notes" panel):
 *    - Main entrance: brick archway in the middle of the front facade,
 *      as wide as the hallway, opening directly into it (no direct
 *      exterior access to the living room or kitchen)
 *    - Middle strip, full depth: Hallway (<2m wide), runs past the
 *      kitchen, separates the two back bedrooms
 *    - Front-left:  Living room  (entered from the hallway)
 *    - Back-left:   Bedroom 1 "grandma's room" (via living room) + ensuite
 *    - Front-right: Kitchen (entered from the hallway only)
 *    - Back-right:  Bedroom 2 (via the hallway) + ensuite
 * ------------------------------------------------------------------ */

const T = 0.15;      // wall thickness
const H = 2.6;       // wall height
const DOOR_H = 2.1;  // door header height
const SILL = 0.9;    // window sill height
const WIN_H = 2.1;   // window header height

const HOUSE = { x: [0, 10], z: [0, 9] };
const FENCE = { x: [-3.5, 13.5], z: [-3.5, 12.5], h: 2.0, t: 0.2 };

const COLORS = {
  block: 0xb7ae9d,
  blockDark: 0xa89e8c,
  brick: 0xa15a3f,
  slab: 0x8f8a7d,
  fence: 0x9c9488,
  groundDirt: 0xcdb98f,
  pad: 0xc7bfae,
  benchWood: 0x7a5233,
};

const ROOM_FLOOR = {
  living: 0xc98f6d,
  kitchen: 0xd9b26a,
  hallway: 0xb7a68c,
  bed1: 0x9fb08a,
  bath1: 0x8fa6b0,
  bed2: 0xa58fb0,
  bath2: 0x8fa6b0,
};

const ROOMS = [
  { key: 'living', name: 'Sala', x: [0, 4.5], z: [0, 4.5] },
  { key: 'kitchen', name: 'Cocina', x: [6.0, 10.0], z: [0, 4.0] },
  { key: 'hallway', name: 'Pasillo', x: [4.5, 6.0], z: [0, 9.0] },
  { key: 'bed1', name: 'Recámara 1 (Abuela)', x: [0, 4.5], z: [4.5, 7.3] },
  { key: 'bath1', name: 'Baño', x: [3.0, 4.5], z: [7.3, 9.0] },
  { key: 'bed1b', name: null, x: [0, 3.0], z: [7.3, 9.0], mergeInto: 'bed1' },
  { key: 'bed2', name: 'Recámara 2', x: [6.0, 10.0], z: [4.0, 7.3] },
  { key: 'bath2', name: 'Baño', x: [8.5, 10.0], z: [7.3, 9.0] },
  { key: 'bed2b', name: null, x: [6.0, 8.5], z: [7.3, 9.0], mergeInto: 'bed2' },
];

/* ---------------------------- renderer ---------------------------- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe6e0);
scene.fog = new THREE.Fog(0xdfe6e0, 30, 70);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
const CENTER = new THREE.Vector3(5, 1.2, 4.5);
camera.position.set(15.5, 9.5, -5.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-holder').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.copy(CENTER);
controls.minDistance = 3;
controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI * 0.495;

/* ----------------------------- lights ------------------------------ */

scene.add(new THREE.HemisphereLight(0xfdf6e8, 0x8a7a5c, 1.25));
const sun = new THREE.DirectionalLight(0xfff2df, 1.1);
sun.position.set(-8, 22, -10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
scene.add(sun);

/* ----------------------------- ground ------------------------------ */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: COLORS.groundDirt, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(5, -0.01, 4.5);
ground.receiveShadow = true;
scene.add(ground);

const pad = new THREE.Mesh(
  new THREE.BoxGeometry(HOUSE.x[1] - HOUSE.x[0] + 0.4, 0.12, HOUSE.z[1] - HOUSE.z[0] + 0.4),
  new THREE.MeshStandardMaterial({ color: COLORS.pad, roughness: 0.95 })
);
pad.position.set(5, 0.06, 4.5);
pad.receiveShadow = true;
scene.add(pad);

/* --------------------------- room floors ---------------------------- */

const labelGroup = new THREE.Group();
scene.add(labelGroup);

ROOMS.forEach((r) => {
  if (!r.name) return; // merged sliver, no separate floor tint needed visually
  const w = r.x[1] - r.x[0];
  const d = r.z[1] - r.z[0];
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.02, 0.06, d - 0.02),
    new THREE.MeshStandardMaterial({ color: ROOM_FLOOR[r.key] || 0xdddddd, roughness: 0.85 })
  );
  floor.position.set((r.x[0] + r.x[1]) / 2, 0.15, (r.z[0] + r.z[1]) / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  const area = w * d;
  const label = makeLabel(r.name, area);
  // Small utility rooms (bathrooms) sit lower than bedroom/living-space
  // labels so they read as clearly separate even when they're close together
  const labelY = r.key === 'bath1' || r.key === 'bath2' ? 1.55 : 2.9;
  // Hallway is long and thin — place its label toward the front (near the
  // entrance) rather than dead-center, so it doesn't crowd the back rooms
  const labelZ = r.key === 'hallway' ? 2.0 : (r.z[0] + r.z[1]) / 2;
  label.position.set((r.x[0] + r.x[1]) / 2, labelY, labelZ);
  labelGroup.add(label);
});
// merged slivers (bed1b, bed2b) get their parent room's floor tint too
['bed1b', 'bed2b'].forEach((key) => {
  const r = ROOMS.find((rr) => rr.key === key);
  const w = r.x[1] - r.x[0];
  const d = r.z[1] - r.z[0];
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.02, 0.06, d - 0.02),
    new THREE.MeshStandardMaterial({ color: ROOM_FLOOR[r.mergeInto], roughness: 0.85 })
  );
  floor.position.set((r.x[0] + r.x[1]) / 2, 0.15, (r.z[0] + r.z[1]) / 2);
  floor.receiveShadow = true;
  scene.add(floor);
});

function makeLabel(text, area = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(44,35,24,0.82)';
  roundRect(ctx, 8, 24, 496, 80, 24);
  ctx.fill();
  ctx.font = `600 44px "General Sans", sans-serif`;
  ctx.fillStyle = '#fdf6ee';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  // Scale label size down for small rooms (like the bathroom) so labels don't crowd each other
  const sizeFactor = Math.max(0.92, Math.min(1, Math.sqrt(area) / 3.2));
  sprite.scale.set(2.6 * sizeFactor, 0.65 * sizeFactor, 1);
  return sprite;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------------------------- materials ----------------------------- */

const blockMat = new THREE.MeshStandardMaterial({ color: COLORS.block, roughness: 0.92 });
const brickMat = new THREE.MeshStandardMaterial({ color: COLORS.brick, roughness: 0.85 });
const slabMat = new THREE.MeshStandardMaterial({ color: COLORS.slab, roughness: 0.9 });
const fenceMat = new THREE.MeshStandardMaterial({ color: COLORS.fence, roughness: 0.95 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x8fb0c0, roughness: 0.15, transmission: 0.55, thickness: 0.05 });
const benchMat = new THREE.MeshStandardMaterial({ color: COLORS.benchWood, roughness: 0.8 });

const walls = new THREE.Group();
scene.add(walls);

function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Build a straight wall run with door/window openings.
 * orientation 'x': wall runs along X at fixed z. orientation 'z': wall runs along Z at fixed x.
 * openings: [{ from, to, kind: 'door'|'window'|'archway' }]
 */
function wallRun(orientation, fixed, start, end, openings = [], mat = blockMat) {
  const cuts = [...openings].sort((a, b) => a.from - b.from);
  let cursor = start;
  const group = new THREE.Group();

  const addSeg = (a, b, yLo, yHi) => {
    if (b - a <= 0.001) return;
    const len = b - a;
    const height = yHi - yLo;
    const cy = yLo + height / 2;
    const c = (a + b) / 2;
    let mesh;
    if (orientation === 'x') {
      mesh = box(len, height, T, mat);
      mesh.position.set(c, cy, fixed);
    } else {
      mesh = box(T, height, len, mat);
      mesh.position.set(fixed, cy, c);
    }
    group.add(mesh);
  };

  cuts.forEach((cut) => {
    addSeg(cursor, cut.from, 0, H);
    cursor = cut.to;
  });
  addSeg(cursor, end, 0, H);

  // openings themselves: header (and sill for windows) built as separate thin runs
  cuts.forEach((cut) => {
    const radius = (cut.to - cut.from) / 2;
    const springY = cut.springY ?? DOOR_H;
    const headerY = cut.kind === 'window' ? WIN_H
      : cut.kind === 'brickArch' ? springY + radius
      : DOOR_H;
    // header above opening (for a brickArch, this is just the flat cap above the rounded top)
    const len = cut.to - cut.from;
    const c = (cut.from + cut.to) / 2;
    const hHeight = H - headerY;
    const headerMat = cut.kind === 'archway' || cut.kind === 'brickArch' ? brickMat : mat;
    let header;
    if (orientation === 'x') {
      header = box(len, hHeight, T, headerMat);
      header.position.set(c, headerY + hHeight / 2, fixed);
    } else {
      header = box(T, hHeight, len, headerMat);
      header.position.set(fixed, headerY + hHeight / 2, c);
    }
    group.add(header);

    if (cut.kind === 'brickArch') {
      addArchVoussoirs(group, orientation, fixed, cut.from, cut.to, springY);
    }

    if (cut.kind === 'window') {
      let sill;
      if (orientation === 'x') {
        sill = box(len, SILL, T, mat);
        sill.position.set(c, SILL / 2, fixed);
      } else {
        sill = box(T, SILL, len, mat);
        sill.position.set(fixed, SILL / 2, c);
      }
      group.add(sill);
      // glass pane
      let pane;
      const paneH = headerY - SILL - 0.05;
      if (orientation === 'x') {
        pane = box(len - 0.1, paneH, 0.04, glassMat);
        pane.position.set(c, SILL + paneH / 2 + 0.02, fixed);
      } else {
        pane = box(0.04, paneH, len - 0.1, glassMat);
        pane.position.set(fixed, SILL + paneH / 2 + 0.02, c);
      }
      pane.castShadow = false;
      group.add(pane);
    }
    if (cut.kind === 'archway') {
      // brick voussoir hint: a slim brick lip under the header
      const lipH = 0.12;
      let lip;
      if (orientation === 'x') {
        lip = box(len + 0.1, lipH, T + 0.04, brickMat);
        lip.position.set(c, headerY - lipH / 2, fixed);
      } else {
        lip = box(T + 0.04, lipH, len + 0.1, brickMat);
        lip.position.set(fixed, headerY - lipH / 2, c);
      }
      group.add(lip);
    }
  });

  walls.add(group);
  return group;
}

/**
 * Rounded brick-arch surround: a fan of radial voussoir bricks tracing a
 * semicircle from the springline on one jamb, over the top, to the
 * springline on the other jamb — the rounded brick outline seen on real
 * arched doorways (vs. the flat header used for plain doors/windows).
 */
function addArchVoussoirs(group, orientation, fixed, from, to, springY, count = 9) {
  const cx = (from + to) / 2;
  const radius = (to - from) / 2;
  const arcLen = Math.PI * radius;
  const segLen = Math.max(0.16, (arcLen / count) * 1.25);
  const thick = 0.15;
  const depth = T + 0.05;
  for (let i = 0; i < count; i++) {
    const theta = (Math.PI * (i + 0.5)) / count;
    const dx = radius * Math.cos(theta);
    const dy = radius * Math.sin(theta);
    let voussoir;
    if (orientation === 'x') {
      voussoir = box(segLen, thick, depth, brickMat);
      voussoir.position.set(cx + dx, springY + dy, fixed);
      voussoir.rotation.z = theta + Math.PI / 2;
    } else {
      voussoir = box(depth, thick, segLen, brickMat);
      voussoir.position.set(fixed, springY + dy, cx + dx);
      voussoir.rotation.x = -(theta + Math.PI / 2);
    }
    group.add(voussoir);
  }
}

/* ------------------------------ walls -------------------------------- */

// Front wall (z=0): single main entrance — a brick archway into the
// hallway, in the middle of the facade, as wide as the hallway itself.
// Living room and kitchen have no direct exterior access.
wallRun('x', 0, HOUSE.x[0], HOUSE.x[1], [
  { from: 4.5, to: 6.0, kind: 'archway' },
]);

// Back wall (z=9): bedroom windows
wallRun('x', 9, HOUSE.x[0], HOUSE.x[1], [
  { from: 1.5, to: 2.7, kind: 'window' },
  { from: 7.0, to: 8.2, kind: 'window' },
]);

// West wall (x=0): solid
wallRun('z', 0, HOUSE.z[0], HOUSE.z[1], []);

// East wall (x=10): kitchen window
wallRun('z', 10, HOUSE.z[0], HOUSE.z[1], [{ from: 1.5, to: 2.7, kind: 'window' }]);

// Living room / hallway partition (x=4.5, z 0-4.5): a pair of side-by-side
// brick round arches (matching the reference photo) with a shared brick
// pier between them — the living room is reached by walking through either arch
wallRun('z', 4.5, 0, 4.5, [
  { from: 1.0, to: 1.9, kind: 'brickArch', springY: 1.85 },
  { from: 2.3, to: 3.2, kind: 'brickArch', springY: 1.85 },
]);

// Hallway(back)/bedroom1(back) partition (x=4.5, z 4.5-9): solid
wallRun('z', 4.5, 4.5, 9, []);

// Kitchen / hallway partition (x=6.0, z 0-4): door
wallRun('z', 6.0, 0, 4.0, [{ from: 1.5, to: 2.4, kind: 'door' }]);

// Hallway / bedroom2 partition (x=6.0, z 4-9): door
wallRun('z', 6.0, 4.0, 9.0, [{ from: 6.0, to: 6.9, kind: 'door' }]);

// Kitchen / bedroom2 partition (z=4.0, x 6-10): solid
wallRun('x', 4.0, 6.0, 10.0, []);

// Living room / bedroom1 partition (z=4.5, x 0-4.5): door
wallRun('x', 4.5, 0, 4.5, [{ from: 2.0, to: 2.9, kind: 'door' }]);

// Bathroom partitions inside bedroom 1
wallRun('z', 3.0, 7.3, 9.0, [{ from: 7.3, to: 8.0, kind: 'door' }], blockMat);
wallRun('x', 7.3, 3.0, 4.5, [], blockMat);

// Bathroom partitions inside bedroom 2 (mirrored)
wallRun('z', 8.5, 7.3, 9.0, [{ from: 7.3, to: 8.0, kind: 'door' }], blockMat);
wallRun('x', 7.3, 8.5, 10.0, [], blockMat);

/* Brick accent course — one horizontal stripe wrapping the living-room facade */
(() => {
  const stripe = box(4.5, 0.22, T + 0.03, brickMat);
  stripe.position.set(2.25, 1.55, 0);
  walls.add(stripe);
})();

/* ------------------------------ roof ---------------------------------- */

const roofGroup = new THREE.Group();
const roof = box(HOUSE.x[1] - HOUSE.x[0] + 0.5, 0.2, HOUSE.z[1] - HOUSE.z[0] + 0.5, slabMat);
roof.position.set(5, H + 0.1, 4.5);
roofGroup.add(roof);
const bondBeam = box(HOUSE.x[1] - HOUSE.x[0] + 0.2, 0.18, HOUSE.z[1] - HOUSE.z[0] + 0.2, new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.9 }));
bondBeam.position.set(5, H - 0.05, 4.5);
roofGroup.add(bondBeam);
roofGroup.visible = false; // dollhouse mode by default so room colors + labels read clearly from orbit/top views
scene.add(roofGroup);

/* ------------------------------ simple furniture ------------------------ */

const woodMat = new THREE.MeshStandardMaterial({ color: 0x6d4a30, roughness: 0.85 });
const fabricMat = new THREE.MeshStandardMaterial({ color: 0xe4d9c4, roughness: 0.95 });
const counterMat = new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: 0.7 });

function addSofa(cx, cz, rotY = 0) {
  const g = new THREE.Group();
  const base = box(1.9, 0.4, 0.75, fabricMat);
  base.position.y = 0.2;
  g.add(base);
  const back = box(1.9, 0.45, 0.16, fabricMat);
  back.position.set(0, 0.42, -0.3);
  g.add(back);
  g.position.set(cx, 0.18, cz);
  g.rotation.y = rotY;
  scene.add(g);
}

function addCounter(x1, x2, cz, depth = 0.55) {
  const len = x2 - x1;
  const c = box(len, 0.85, depth, counterMat);
  c.position.set((x1 + x2) / 2, 0.425, cz);
  scene.add(c);
  const table = box(0.9, 0.72, 0.9, woodMat);
  table.position.set((x1 + x2) / 2, 0.36, cz + depth + 0.7);
  scene.add(table);
}

addSofa(3.2, 0.85, Math.PI);          // living room, facing the entrance
addCounter(6.4, 9.6, 0.5);            // kitchen counter along the front-right wall

/* ------------------------------ hallway chairs ------------------------- */
(() => {
  const c1 = box(0.42, 0.42, 0.42, benchMat);
  c1.position.set(5.25, 0.21, 2.0);
  scene.add(c1);
  const c2 = box(0.42, 0.42, 0.42, benchMat);
  c2.position.set(5.25, 0.21, 2.5);
  scene.add(c2);
})();

/* ------------------------------ perimeter fence ------------------------- */

function fenceRun(orientation, fixed, start, end, gap) {
  const cuts = gap ? [gap] : [];
  let cursor = start;
  const add = (a, b) => {
    if (b - a <= 0.01) return;
    const len = b - a;
    const c = (a + b) / 2;
    let mesh;
    if (orientation === 'x') {
      mesh = box(len, FENCE.h, FENCE.t, fenceMat);
      mesh.position.set(c, FENCE.h / 2, fixed);
    } else {
      mesh = box(FENCE.t, FENCE.h, len, fenceMat);
      mesh.position.set(fixed, FENCE.h / 2, c);
    }
    scene.add(mesh);
  };
  cuts.forEach((cut) => {
    add(cursor, cut.from);
    cursor = cut.to;
  });
  add(cursor, end);
}

fenceRun('x', FENCE.z[0], FENCE.x[0], FENCE.x[1], { from: 3.5, to: 6.5 }); // front gate
fenceRun('x', FENCE.z[1], FENCE.x[0], FENCE.x[1]);
fenceRun('z', FENCE.x[0], FENCE.z[0], FENCE.z[1]);
fenceRun('z', FENCE.x[1], FENCE.z[0], FENCE.z[1]);

/* ------------------------------ view modes ------------------------------ */

let mode = 'orbit'; // 'orbit' | 'top' | 'walk'
let labelsOn = true;

const btnOrbit = document.getElementById('btnOrbit');
const btnTop = document.getElementById('btnTop');
const btnWalk = document.getElementById('btnWalk');
const btnLabels = document.getElementById('btnLabels');
const btnRoof = document.getElementById('btnRoof');
const hint = document.getElementById('hint');
let roofOn = false;
let roofOverrideHidden = false;

function setActive(btn) {
  [btnOrbit, btnTop, btnWalk].forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
}

let animTarget = null;
function flyTo(pos, target, duration = 700) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const t0 = performance.now();
  animTarget = { pos, target, startPos, startTarget, t0, duration };
}

function applyRoofVisibility() {
  roofGroup.visible = mode === 'top' ? false : roofOn;
}

btnOrbit.addEventListener('click', () => {
  mode = 'orbit';
  setActive(btnOrbit);
  controls.enabled = true;
  controls.maxPolarAngle = Math.PI * 0.495;
  hint.textContent = 'Drag to orbit · scroll to zoom · right-drag to pan';
  hint.style.display = '';
  flyTo(new THREE.Vector3(15.5, 9.5, -5.5), CENTER.clone());
  applyRoofVisibility();
});

btnTop.addEventListener('click', () => {
  mode = 'top';
  setActive(btnTop);
  controls.enabled = true;
  hint.textContent = 'Scroll to zoom · drag to pan the plan (roof hidden for clarity)';
  hint.style.display = '';
  flyTo(new THREE.Vector3(5, 22, 4.5), new THREE.Vector3(5, 0, 4.5));
  applyRoofVisibility();
});

btnWalk.addEventListener('click', () => {
  mode = 'walk';
  setActive(btnWalk);
  controls.enabled = false;
  hint.textContent = 'WASD to move · click + drag to look around';
  hint.style.display = '';
  camera.position.set(5.25, 1.6, -1.0);
  walkYaw = Math.PI;
  walkPitch = 0;
  applyRoofVisibility();
});

btnRoof.addEventListener('click', () => {
  roofOn = !roofOn;
  btnRoof.textContent = `Roof: ${roofOn ? 'on' : 'off'}`;
  btnRoof.classList.toggle('active', roofOn);
  applyRoofVisibility();
});

btnLabels.addEventListener('click', () => {
  labelsOn = !labelsOn;
  labelGroup.visible = labelsOn;
  btnLabels.textContent = `Labels: ${labelsOn ? 'on' : 'off'}`;
  btnLabels.classList.toggle('active', labelsOn);
});

/* ------------------------------ walk controls ---------------------------- */

let walkYaw = Math.PI, walkPitch = 0;
const keys = {};
let dragging = false, lastX = 0, lastY = 0;

window.addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (mode !== 'walk') return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener('pointerup', () => (dragging = false));
window.addEventListener('pointermove', (e) => {
  if (mode !== 'walk' || !dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  walkYaw -= dx * 0.0035;
  walkPitch -= dy * 0.0035;
  walkPitch = Math.max(-1.2, Math.min(1.2, walkPitch));
});

function updateWalk(dt) {
  camera.rotation.set(walkPitch, walkYaw, 0, 'YXZ');
  const forward = new THREE.Vector3(Math.sin(walkYaw), 0, Math.cos(walkYaw)).multiplyScalar(-1);
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const speed = 2.4 * dt;
  const move = new THREE.Vector3();
  if (keys['w'] || keys['arrowup']) move.add(forward);
  if (keys['s'] || keys['arrowdown']) move.sub(forward);
  if (keys['d'] || keys['arrowright']) move.add(right);
  if (keys['a'] || keys['arrowleft']) move.sub(right);
  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(speed);
    camera.position.add(move);
  }
  // keep within the fenced lot loosely, and at eye height
  camera.position.x = Math.max(FENCE.x[0] + 0.5, Math.min(FENCE.x[1] - 0.5, camera.position.x));
  camera.position.z = Math.max(FENCE.z[0] + 0.5, Math.min(FENCE.z[1] - 0.5, camera.position.z));
  camera.position.y = 1.6;
}

/* ------------------------------ notes panel ------------------------------ */

const notesToggle = document.getElementById('notesToggle');
const notesPanel = document.getElementById('notesPanel');
notesToggle.addEventListener('click', () => {
  const open = notesPanel.classList.toggle('open');
  notesToggle.textContent = `Assumptions & notes ${open ? '▴' : '▾'}`;
});

/* --------------------------------- resize --------------------------------- */

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ---------------------------------- loop ----------------------------------- */

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (animTarget) {
    const elapsed = performance.now() - animTarget.t0;
    const p = Math.min(1, elapsed / animTarget.duration);
    const ease = 1 - Math.pow(1 - p, 3);
    camera.position.lerpVectors(animTarget.startPos, animTarget.pos, ease);
    controls.target.lerpVectors(animTarget.startTarget, animTarget.target, ease);
    if (p >= 1) animTarget = null;
  }

  if (mode === 'walk') {
    updateWalk(dt);
  } else {
    controls.update();
  }

  // labels always face camera (Sprite does this natively)
  renderer.render(scene, camera);
}
animate();
