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
 *    - Back-left:   Bedroom 1 "Ana's room" (via living room) + ensuite
 *    - Front-right: Kitchen (entered from the hallway only)
 *    - Back-right:  Bedroom 2 (via the hallway) + ensuite
 * ------------------------------------------------------------------ */

const T = 0.15;      // wall thickness
const H = 2.6;       // wall height
const DOOR_H = 2.1;  // door header height
const SILL = 0.9;    // window sill height
const WIN_H = 2.1;   // window header height

const HOUSE = { x: [0, 10], z: [0, 9] };
// South side has no yard — the fence and house share the same southern wall,
// so the fence's south edge lines up exactly with the house's back wall (z=9).
// East, west, and north keep their yard setback.
const FENCE = { x: [-3.5, 13.5], z: [-3.5, 9], h: H, t: 0.2 }; // fence height matches house wall height

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
  { key: 'bed1', name: 'Recámara 1 (Ana)', x: [0, 4.5], z: [6.2, 9.0] },
  { key: 'bath1', name: 'Baño', x: [3.0, 4.5], z: [4.5, 6.2] },
  { key: 'bed1b', name: null, x: [0, 3.0], z: [4.5, 6.2], mergeInto: 'bed1' },
  { key: 'bed2', name: 'Recámara 2 (Abuela Cande)', x: [6.0, 10.0], z: [5.7, 9.0] },
  { key: 'bath2', name: 'Baño', x: [8.5, 10.0], z: [4.0, 5.7] },
  { key: 'bed2b', name: null, x: [6.0, 8.5], z: [4.0, 5.7], mergeInto: 'bed2' },
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

// Bathroom finishes — both ensuites (bath1, bath2) are finished with the
// same real tile selection: glossy white "Bossa" marble-look slabs on every
// wall, floor-to-ceiling, and the "Landstone" river-pebble mosaic on the
// floor, matching the physical showroom samples and the approved mockup.
const textureLoader = new THREE.TextureLoader();
const bathWallTex = textureLoader.load('./textures/bath_wall_bossa.jpg');
bathWallTex.wrapS = bathWallTex.wrapT = THREE.RepeatWrapping;
bathWallTex.colorSpace = THREE.SRGBColorSpace;
bathWallTex.repeat.set(1.4, 1.1); // large-format slabs — roughly one repeat per wall segment
const bathWallMat = new THREE.MeshStandardMaterial({ map: bathWallTex, roughness: 0.22, metalness: 0.04 });

const bathFloorTex = textureLoader.load('./textures/bath_floor_pebble.jpg');
bathFloorTex.wrapS = bathFloorTex.wrapT = THREE.RepeatWrapping;
bathFloorTex.colorSpace = THREE.SRGBColorSpace;
bathFloorTex.repeat.set(3.2, 3.2); // small pebble-mosaic tiles repeat several times across the floor
const bathFloorMat = new THREE.MeshStandardMaterial({ map: bathFloorTex, roughness: 0.8 });

const labelGroup = new THREE.Group();
scene.add(labelGroup);

ROOMS.forEach((r) => {
  if (!r.name) return; // merged sliver, no separate floor tint needed visually
  const w = r.x[1] - r.x[0];
  const d = r.z[1] - r.z[0];
  const isBath = r.key === 'bath1' || r.key === 'bath2';
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.02, 0.06, d - 0.02),
    isBath ? bathFloorMat : new THREE.MeshStandardMaterial({ color: ROOM_FLOOR[r.key] || 0xdddddd, roughness: 0.85 })
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
  // Shrink the font to fit longer labels (e.g. names in parentheses) within
  // the fixed-width canvas so text never gets clipped at the edges.
  let fontSize = 44;
  const maxTextWidth = 460;
  ctx.font = `600 ${fontSize}px "General Sans", sans-serif`;
  while (ctx.measureText(text).width > maxTextWidth && fontSize > 18) {
    fontSize -= 2;
    ctx.font = `600 ${fontSize}px "General Sans", sans-serif`;
  }
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
// Unfinished plywood pedestrian door set into the fence, next to the vehicle gate
const plywoodDoorMat = new THREE.MeshStandardMaterial({ color: 0xcdae7d, roughness: 0.8 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x8fb0c0, roughness: 0.15, transmission: 0.55, thickness: 0.05 });
const benchMat = new THREE.MeshStandardMaterial({ color: COLORS.benchWood, roughness: 0.8 });
// Interior plaster finish — painted white on every room-facing wall surface
const paintMat = new THREE.MeshStandardMaterial({ color: 0xf3efe4, roughness: 0.92 });

/**
 * Window style options — modeled after the reference photos shared for
 * comparison. Every window opening in the house gets all four variants
 * built, and only one is shown at a time via the "Ventanas" toggle button
 * so they can be compared side by side without changing the model.
 */
const WINDOW_STYLES = [
  {
    // Matches the exact door+window combo mom picked (mahogany wood frame,
    // dark tinted glass, plain panes split only by the center mullion —
    // no grid bars). Kept first in the array so it's the default variant
    // shown when the page loads (activeWindowStyle = 0 below).
    name: 'Caoba sin cuadrícula (elegido)',
    frameColor: 0x7b4230,
    glassColor: 0x45483f,
    grid: null,
    frameW: 0.065,
  },
  {
    name: 'Caoba con cuadrícula',
    frameColor: 0x6b3a22,
    glassColor: 0x333f49,
    grid: { cols: 2, rows: 3 },
    frameW: 0.07,
  },
  {
    name: 'Blanco con cuadrícula',
    frameColor: 0xf1efe6,
    glassColor: 0x46565f,
    grid: { cols: 3, rows: 4 },
    frameW: 0.05,
  },
  {
    name: 'Bronce con moldura',
    frameColor: 0xa78a5c,
    glassColor: 0x38424a,
    grid: { cols: 2, rows: 2 },
    frameW: 0.06,
    molding: true,
    moldingColor: 0xe8e2d3,
  },
  {
    name: 'Negro sin cuadrícula',
    frameColor: 0x2b2b2b,
    glassColor: 0x3a4750,
    grid: null,
    frameW: 0.055,
  },
];
WINDOW_STYLES.forEach((s) => {
  s.frameMat = new THREE.MeshStandardMaterial({
    color: s.frameColor,
    roughness: s.name.startsWith('Negro') ? 0.3 : 0.7,
    metalness: s.name.startsWith('Bronce') ? 0.35 : s.name.startsWith('Negro') ? 0.25 : 0.05,
  });
  s.glassMatInst = new THREE.MeshPhysicalMaterial({ color: s.glassColor, roughness: 0.12, transmission: 0.5, thickness: 0.05 });
  if (s.molding) s.moldingMat = new THREE.MeshStandardMaterial({ color: s.moldingColor, roughness: 0.9 });
});
// windowStyleGroups[i] holds every built variant-i mesh group across the whole
// house; toggling styles just flips `.visible` on these, no rebuilding needed.
const windowStyleGroups = [[], [], [], [], []];
let activeWindowStyle = 0;

/**
 * Build one window-style variant (frame + center mullion + optional grid +
 * glass sashes + optional molding surround) for a single opening.
 * orientation/fixed follow the same convention as wallRun/wallSegBox.
 */
function buildWindowVariant(orientation, fixed, from, to, sillY, headerY, style) {
  const group = new THREE.Group();
  const len = to - from;
  const oh = headerY - sillY;
  const c = (from + to) / 2;
  const fw = style.frameW;
  const depth = T * 0.9;

  const mk = (l, h, d, mat) => (orientation === 'x' ? box(l, h, d, mat) : box(d, h, l, mat));
  const place = (mesh, alongPos, y) => {
    if (orientation === 'x') mesh.position.set(alongPos, y, fixed);
    else mesh.position.set(fixed, y, alongPos);
    mesh.castShadow = false;
    group.add(mesh);
  };

  // outer frame
  place(mk(len, fw, depth, style.frameMat), c, headerY - fw / 2);
  place(mk(len, fw, depth, style.frameMat), c, sillY + fw / 2);
  place(mk(fw, oh, depth, style.frameMat), from + fw / 2, (sillY + headerY) / 2);
  place(mk(fw, oh, depth, style.frameMat), to - fw / 2, (sillY + headerY) / 2);

  // center mullion — divides the sliding window into two sashes
  const midW = fw * 1.3;
  place(mk(midW, oh - fw * 2, depth, style.frameMat), c, (sillY + headerY) / 2);

  const innerTop = headerY - fw;
  const innerBot = sillY + fw;
  const ih = innerTop - innerBot;
  const sashes = [
    { a: from + fw, b: c - midW / 2 },
    { a: c + midW / 2, b: to - fw },
  ];

  sashes.forEach((s) => {
    const sw = s.b - s.a;
    const sc = (s.a + s.b) / 2;
    place(mk(sw - 0.02, ih - 0.02, 0.04, style.glassMatInst), sc, (innerTop + innerBot) / 2);

    if (style.grid) {
      const { cols, rows } = style.grid;
      const barW = fw * 0.55;
      for (let i = 1; i < cols; i++) {
        const gx = s.a + (sw * i) / cols;
        place(mk(barW, ih, depth * 0.85, style.frameMat), gx, (innerTop + innerBot) / 2);
      }
      for (let j = 1; j < rows; j++) {
        const gy = innerBot + (ih * j) / rows;
        place(mk(sw, barW, depth * 0.85, style.frameMat), sc, gy);
      }
    }
  });

  if (style.molding) {
    const mExtra = 0.09;
    const mW = 0.05;
    const mDepth = depth * 0.5;
    const mFrom = from - mExtra, mTo = to + mExtra;
    const mSillY = sillY - mExtra, mHeaderY = headerY + mExtra;
    const mLen = mTo - mFrom;
    const moh = mHeaderY - mSillY;
    place(mk(mLen, mW, mDepth, style.moldingMat), c, mHeaderY - mW / 2);
    place(mk(mLen, mW, mDepth, style.moldingMat), c, mSillY + mW / 2);
    place(mk(mW, moh, mDepth, style.moldingMat), mFrom + mW / 2, (mSillY + mHeaderY) / 2);
    place(mk(mW, moh, mDepth, style.moldingMat), mTo - mW / 2, (mSillY + mHeaderY) / 2);
  }

  return group;
}

function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function placeBox(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

/**
 * Gate + matching window-bar ("rejas") style options — modeled after the
 * reference photos of "portones modernos" the family shared for comparison.
 * Each option pairs a front vehicle-gate design with a matching metal grille
 * mounted on every EXTERIOR window, so switching styles previews both at
 * once. Only exterior-facing windows get bars (the interior bedroom1-to-
 * hallway window does not, since it's not a security-relevant opening).
 */
const GATE_STYLES = [
  {
    name: 'Panel sólido caoba',
    kind: 'panel',
    color: 0x4a3323,
    metalness: 0.15,
    roughness: 0.55,
    barSpacing: 0.24,
    ornateBars: false,
  },
  {
    name: 'Barrotes verticales negros',
    kind: 'bars',
    color: 0x1c1c1c,
    metalness: 0.5,
    roughness: 0.35,
    barSpacing: 0.13,
    ornateBars: false,
  },
  {
    name: 'Herrería con anillos',
    kind: 'ornate',
    color: 0x1a1a1a,
    metalness: 0.55,
    roughness: 0.3,
    accentColor: 0xb8894a,
    barSpacing: 0.27,
    ornateBars: true,
  },
];
GATE_STYLES.forEach((s) => {
  s.mat = new THREE.MeshStandardMaterial({ color: s.color, metalness: s.metalness, roughness: s.roughness });
  if (s.accentColor) s.accentMat = new THREE.MeshStandardMaterial({ color: s.accentColor, metalness: 0.6, roughness: 0.3 });
});
let activeGateStyle = 0;
// gateStyleGroups[i] = the gate-leaf group for style i (built once GATE is
// known, in the fence section below). windowBarGroups[i] = every window-bar
// grille mesh built for style i across the whole house.
const gateStyleGroups = [];
const windowBarGroups = [[], [], []];

/**
 * Build a security-bar grille for one exterior window opening, sized a bit
 * larger than the opening and mounted just outside the wall face (standard
 * practice for "rejas" in this kind of construction).
 */
function buildWindowBarsVariant(orientation, fixed, from, to, sillY, headerY, style) {
  const group = new THREE.Group();
  const margin = 0.06;
  const bFrom = from - margin, bTo = to + margin;
  const bSill = sillY - margin, bHeader = headerY + margin;
  const len = bTo - bFrom;
  const oh = bHeader - bSill;
  const c = (bFrom + bTo) / 2;
  const sign = orientation === 'x' ? (fixed === HOUSE.z[0] ? -1 : 1) : (fixed === HOUSE.x[0] ? -1 : 1);
  const standoff = fixed + sign * (T / 2 + 0.06);
  const barThick = 0.035;
  const railThick = 0.045;
  const depth = 0.03;

  const mk = (l, h, d, mat) => (orientation === 'x' ? box(l, h, d, mat) : box(d, h, l, mat));
  const place = (mesh, alongPos, y) => {
    if (orientation === 'x') mesh.position.set(alongPos, y, standoff);
    else mesh.position.set(standoff, y, alongPos);
    group.add(mesh);
  };

  // frame: top & bottom rails + two side stiles
  place(mk(len, railThick, depth, style.mat), c, bHeader - railThick / 2);
  place(mk(len, railThick, depth, style.mat), c, bSill + railThick / 2);
  place(mk(railThick, oh, depth, style.mat), bFrom + railThick / 2, (bSill + bHeader) / 2);
  place(mk(railThick, oh, depth, style.mat), bTo - railThick / 2, (bSill + bHeader) / 2);

  const innerFrom = bFrom + railThick, innerTo = bTo - railThick;
  const innerLen = innerTo - innerFrom;
  const barCount = Math.max(3, Math.round(innerLen / style.barSpacing));
  for (let i = 1; i < barCount; i++) {
    const bx = innerFrom + (innerLen * i) / barCount;
    place(mk(style.ornateBars ? barThick * 1.3 : barThick, oh, depth, style.mat), bx, (bSill + bHeader) / 2);
  }

  if (style.ornateBars) {
    const midY = (bSill + bHeader) / 2;
    place(mk(len, railThick * 0.8, depth, style.mat), c, midY);
    for (let i = 0; i < barCount; i++) {
      const rx = innerFrom + (innerLen * (i + 0.5)) / barCount;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 8, 16), style.accentMat);
      if (orientation === 'x') {
        ring.position.set(rx, midY, standoff);
      } else {
        ring.rotation.y = Math.PI / 2;
        ring.position.set(standoff, midY, rx);
      }
      group.add(ring);
    }
  }

  return group;
}

/**
 * Build the pair of front-gate leaves for one gate style, spanning the GATE
 * opening in the north fence wall. 'panel' = solid mahogany-look panel with
 * decorative reveal grooves; 'bars'/'ornate' = a bar grille, with 'ornate'
 * adding a horizontal mid-rail and ring accents matching the window grilles.
 */
function buildGateLeaves(style) {
  const group = new THREE.Group();
  const leafH = FENCE.h - 0.1;
  const y0 = leafH / 2 + 0.05;
  const zPos = FENCE.z[0];
  const gap = 0.04;
  const mid = (GATE.from + GATE.to) / 2;
  const leaves = [
    { from: GATE.from, to: mid - gap / 2, innerAtTo: true },
    { from: mid + gap / 2, to: GATE.to, innerAtTo: false },
  ];
  const depth = 0.06;
  const railThick = 0.08;

  leaves.forEach((lf) => {
    const w = lf.to - lf.from;
    const c = (lf.from + lf.to) / 2;
    if (style.kind === 'panel') {
      group.add(placeBox(box(w, leafH, depth, style.mat), c, y0, zPos));
      const grooveMat = new THREE.MeshStandardMaterial({ color: 0x2e1f14, roughness: 0.7 });
      [0.32, 0.68].forEach((f) => {
        group.add(placeBox(box(0.03, leafH - 0.16, depth + 0.005, grooveMat), lf.from + w * f, y0, zPos));
      });
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xc7c0ac, metalness: 0.6, roughness: 0.3 });
      const innerEdge = lf.innerAtTo ? lf.to - 0.12 : lf.from + 0.12;
      group.add(placeBox(box(0.03, 0.5, depth + 0.03, handleMat), innerEdge, y0, zPos));
    } else {
      group.add(placeBox(box(w, railThick, depth, style.mat), c, y0 + leafH / 2 - railThick / 2, zPos));
      group.add(placeBox(box(w, railThick, depth, style.mat), c, y0 - leafH / 2 + railThick / 2, zPos));
      group.add(placeBox(box(railThick, leafH, depth, style.mat), lf.from + railThick / 2, y0, zPos));
      group.add(placeBox(box(railThick, leafH, depth, style.mat), lf.to - railThick / 2, y0, zPos));

      const innerFrom = lf.from + railThick, innerTo = lf.to - railThick;
      const innerW = innerTo - innerFrom;
      const barCount = Math.max(3, Math.round(innerW / style.barSpacing));
      const barH = leafH - railThick * 2;
      for (let i = 1; i < barCount; i++) {
        const bx = innerFrom + (innerW * i) / barCount;
        group.add(placeBox(box(0.03, barH, depth * 0.8, style.mat), bx, y0, zPos));
      }
      if (style.ornateBars) {
        group.add(placeBox(box(w - railThick * 2, 0.06, depth * 0.8, style.mat), c, y0, zPos));
        for (let i = 0; i < barCount; i++) {
          const rx = innerFrom + (innerW * (i + 0.5)) / barCount;
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 16), style.accentMat);
          ring.position.set(rx, y0, zPos);
          group.add(ring);
        }
      }
    }
  });

  return group;
}

const walls = new THREE.Group();
scene.add(walls);

/**
 * Wall segment box whose room-facing side(s) are painted white, while any
 * face that borders the exterior (a HOUSE perimeter boundary) keeps `extMat`
 * (the stucco/block finish). Interior partition walls have rooms on both
 * sides, so both large faces come out painted white. `extMat === brickMat`
 * (the arch/pier feature) is left fully brick on every face — exposed brick
 * is a deliberate accent, not painted over.
 * BoxGeometry material slot order: [+x, -x, +y, -y, +z, -z].
 */
function wallSegBox(orientation, fixed, w, h, d, extMat, paintOverride = null) {
  if (extMat === brickMat) return box(w, h, d, extMat);
  const geo = new THREE.BoxGeometry(w, h, d);
  // paintOverride lets a specific wall run swap the generic white paint for
  // a room-specific finish (e.g. bathroom tile) on just one interior face,
  // without affecting the room on the other side of the same wall.
  const posPaint = paintOverride?.pos ?? paintMat;
  const negPaint = paintOverride?.neg ?? paintMat;
  let mats;
  if (orientation === 'x') {
    const nzOutside = fixed === HOUSE.z[0];
    const pzOutside = fixed === HOUSE.z[1];
    mats = [extMat, extMat, extMat, extMat, pzOutside ? extMat : posPaint, nzOutside ? extMat : negPaint];
  } else {
    const nxOutside = fixed === HOUSE.x[0];
    const pxOutside = fixed === HOUSE.x[1];
    mats = [pxOutside ? extMat : posPaint, nxOutside ? extMat : negPaint, extMat, extMat, extMat, extMat];
  }
  const m = new THREE.Mesh(geo, mats);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Build a straight wall run with door/window openings.
 * orientation 'x': wall runs along X at fixed z. orientation 'z': wall runs along Z at fixed x.
 * openings: [{ from, to, kind: 'door'|'window'|'archway' }]
 */
function wallRun(orientation, fixed, start, end, openings = [], mat = blockMat, paintOverride = null) {
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
      mesh = wallSegBox('x', fixed, len, height, T, mat, paintOverride);
      mesh.position.set(c, cy, fixed);
    } else {
      mesh = wallSegBox('z', fixed, T, height, len, mat, paintOverride);
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
      header = wallSegBox('x', fixed, len, hHeight, T, headerMat, paintOverride);
      header.position.set(c, headerY + hHeight / 2, fixed);
    } else {
      header = wallSegBox('z', fixed, T, hHeight, len, headerMat, paintOverride);
      header.position.set(fixed, headerY + hHeight / 2, c);
    }
    group.add(header);

    if (cut.kind === 'brickArch') {
      addArchVoussoirs(group, orientation, fixed, cut.from, cut.to, springY, cut.voussoirCount ?? 9);
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
      // Build every window-style variant for this opening; only the active
      // style is visible at a time (see the "Ventanas" toggle button below).
      WINDOW_STYLES.forEach((style, i) => {
        const variant = buildWindowVariant(orientation, fixed, cut.from, cut.to, SILL, headerY, style);
        variant.visible = i === activeWindowStyle;
        windowStyleGroups[i].push(variant);
        group.add(variant);
      });
      // Exterior windows also get a matching security-bar grille for each
      // gate style (see the "Portón y rejas" toggle button below); the
      // interior bed1-to-hallway window is skipped since it's not exposed.
      if (cut.exterior) {
        GATE_STYLES.forEach((style, i) => {
          const bars = buildWindowBarsVariant(orientation, fixed, cut.from, cut.to, SILL, headerY, style);
          bars.visible = i === activeGateStyle;
          windowBarGroups[i].push(bars);
          group.add(bars);
        });
      }
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

// Front/north wall (z=0): main entrance archway in the middle, plus one
// window each for the living room and kitchen (both single-window rooms).
// Living room window sits west of that room's center; kitchen window is
// centered on the kitchen's stretch of this wall.
wallRun('x', 0, HOUSE.x[0], HOUSE.x[1], [
  { from: 0.9, to: 2.1, kind: 'window', exterior: true },   // living room window, west of room center (2.25)
  { from: 4.5, to: 6.0, kind: 'archway' },  // main entrance, into the hallway
  { from: 7.4, to: 8.6, kind: 'window', exterior: true },   // kitchen window, centered on kitchen (6.0-10.0)
]);

// Back wall (z=9): solid — the bedrooms' windows are on their side walls
// instead (west/east for bedroom 1, east for bedroom 2), not the back wall.
wallRun('x', 9, HOUSE.x[0], HOUSE.x[1], []);

// West wall (x=0): bedroom 1's west-facing exterior window
wallRun('z', 0, HOUSE.z[0], HOUSE.z[1], [
  { from: 7.0, to: 8.2, kind: 'window', exterior: true },
]);

// East wall (x=10): bedroom 2's east-facing exterior window (kitchen's
// only window is on the north wall). Split at bath2's z-range (4.0-5.7) so
// bath2's stretch of this exterior wall gets the tile finish on its interior
// (-x) face, while the exterior (+x) face keeps the stucco finish everywhere
// and the window stays on the bed2 portion untouched.
wallRun('z', 10, 0, 4.0, []); // kitchen portion
wallRun('z', 10, 4.0, 5.7, [], blockMat, { neg: bathWallMat }); // bath2 portion, interior -x face
wallRun('z', 10, 5.7, HOUSE.z[1], [
  { from: 6.75, to: 7.95, kind: 'window', exterior: true },
]); // bed2 portion

// Living room / hallway partition (x=4.5, z 0-4.5): a pair of side-by-side
// brick round arches spanning the FULL width of the wall (matching the
// reference photos) — end piers flush against the front wall (z=0) and the
// bedroom-1 partition (z=4.5), with a shared center pier between the two
// arches. The whole wall (piers + arches) is exposed brick, not painted.
wallRun('z', 4.5, 0, 4.5, [
  { from: 0.45, to: 1.75, kind: 'brickArch', springY: 1.85, voussoirCount: 12 },
  { from: 2.75, to: 4.05, kind: 'brickArch', springY: 1.85, voussoirCount: 12 },
], brickMat);

// Hallway(back)/bedroom1(back) partition (x=4.5, z 4.5-9): bedroom 1's
// second window, on its east wall, looking into the hallway. Split at the
// bath1/bed1 boundary (z=6.2) so bath1's stretch of this wall can get the
// tile finish on its face without changing the hallway-facing paint or the
// bed1 portion (which keeps the window).
wallRun('z', 4.5, 4.5, 6.2, [], blockMat, { neg: bathWallMat }); // bath1 side (interior, -x face)
wallRun('z', 4.5, 6.2, 9, [
  { from: 7.0, to: 8.2, kind: 'window' },
]);

// Kitchen / hallway partition (x=6.0, z 0-4): rounded brick arch, matching
// the width of the living room's northeast arch (1.3m, from the double-arch
// wall's first/north opening at z 0.45-1.75).
wallRun('z', 6.0, 0, 4.0, [{ from: 1.3, to: 2.6, kind: 'brickArch', springY: 1.85, voussoirCount: 12 }]);

// Hallway / bedroom2 partition (x=6.0, z 4-9): door
wallRun('z', 6.0, 4.0, 9.0, [{ from: 6.0, to: 6.9, kind: 'door' }]);

// Kitchen / bedroom2 partition (z=4.0, x 6-10): solid. Split at the
// kitchen/bath2 boundary (x=8.5) so bath2's stretch of this wall (its north
// wall) can get the tile finish without affecting the kitchen side.
wallRun('x', 4.0, 6.0, 8.5, []);
wallRun('x', 4.0, 8.5, 10.0, [], blockMat, { pos: bathWallMat }); // bath2 north wall (+z face)

// Living room / bedroom1 partition (z=4.5, x 0-4.5): door — moved flush
// against the west exterior wall (x=0), so the entrance is right at that wall.
// Split at the bed1b/bath1 boundary (x=3.0) so bath1's stretch of this wall
// (the bathroom's north wall) can get the tile finish; the door stays on the
// bed1b side, unaffected.
wallRun('x', 4.5, 0, 3.0, [{ from: 0, to: 0.9, kind: 'door' }]);
wallRun('x', 4.5, 3.0, 4.5, [], blockMat, { pos: bathWallMat }); // bath1 north wall (+z face)

// Bathroom partitions inside bedroom 1 (northeast corner) — door is on the
// SOUTH wall of the bathroom, in the southeast corner (flush against the
// east exterior wall), matching the real house photos of this bathroom's door.
// Both walls below are fully dedicated to bath1, so their bath1-facing side
// gets the Bossa wall-tile finish floor-to-ceiling; the bed1/bed1b-facing
// side keeps the plain painted finish.
wallRun('z', 3.0, 4.5, 6.2, [], blockMat, { pos: bathWallMat }); // west wall, +x face = bath1 interior
wallRun('x', 6.2, 3.0, 4.5, [{ from: 3.6, to: 4.5, kind: 'door' }], blockMat, { neg: bathWallMat }); // south wall, -z face = bath1 interior

// Bathroom partitions inside bedroom 2 (northeast corner, mirrored) — door on
// the south wall, southeast corner, flush against the east exterior wall.
// Same tiling treatment as bath1 above.
wallRun('z', 8.5, 4.0, 5.7, [], blockMat, { pos: bathWallMat }); // west wall, +x face = bath2 interior
wallRun('x', 5.7, 8.5, 10.0, [{ from: 9.1, to: 10.0, kind: 'door' }], blockMat, { neg: bathWallMat }); // south wall, -z face = bath2 interior

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

function fenceRun(orientation, fixed, start, end, gaps) {
  const cuts = Array.isArray(gaps) ? gaps : gaps ? [gaps] : [];
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

// Front gate opening, plus a separate pedestrian door immediately to the
// east of it (matching the reference photos: plywood door set in the block
// wall right next to the vehicle gate's brick-infilled opening).
const GATE = { from: 3.5, to: 6.5 };
const PED_DOOR = { from: GATE.to, to: GATE.to + 0.9 };
fenceRun('x', FENCE.z[0], FENCE.x[0], FENCE.x[1], [GATE, PED_DOOR]); // front gate + pedestrian door

// Pedestrian door leaf — a flat plywood-toned panel filling the door
// opening, slightly inset from the full opening width/height for a frame
// reveal, matching the unfinished-plywood look in the reference photos.
(() => {
  const w = (PED_DOOR.to - PED_DOOR.from) - 0.08;
  const h = FENCE.h - 0.1;
  const leaf = box(w, h, 0.06, plywoodDoorMat);
  leaf.position.set((PED_DOOR.from + PED_DOOR.to) / 2, h / 2, FENCE.z[0]);
  scene.add(leaf);
})();

// Front vehicle gate leaves — all 3 style options are built now that GATE is
// known; only the active one is visible at a time (see the "Portón y rejas"
// toggle button below), matching whichever window-bar grille is showing.
GATE_STYLES.forEach((style, i) => {
  const leaves = buildGateLeaves(style);
  leaves.visible = i === activeGateStyle;
  scene.add(leaves);
  gateStyleGroups.push(leaves);
});
// South: no separate fence wall over the house's own width — the house's back
// exterior wall IS the south property line there. Only fence the side-yard
// slivers to the west and east of the house that continue past its footprint.
fenceRun('x', FENCE.z[1], FENCE.x[0], FENCE.x[1], { from: HOUSE.x[0], to: HOUSE.x[1] });
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
const btnWindowStyle = document.getElementById('btnWindowStyle');
const btnGateStyle = document.getElementById('btnGateStyle');
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

btnWindowStyle.addEventListener('click', () => {
  activeWindowStyle = (activeWindowStyle + 1) % WINDOW_STYLES.length;
  windowStyleGroups.forEach((group, i) => {
    group.forEach((variant) => { variant.visible = i === activeWindowStyle; });
  });
  btnWindowStyle.textContent = `Ventanas: ${WINDOW_STYLES[activeWindowStyle].name}`;
});

btnGateStyle.addEventListener('click', () => {
  activeGateStyle = (activeGateStyle + 1) % GATE_STYLES.length;
  gateStyleGroups.forEach((leaves, i) => { leaves.visible = i === activeGateStyle; });
  windowBarGroups.forEach((group, i) => {
    group.forEach((variant) => { variant.visible = i === activeGateStyle; });
  });
  btnGateStyle.textContent = `Portón y rejas: ${GATE_STYLES[activeGateStyle].name}`;
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
