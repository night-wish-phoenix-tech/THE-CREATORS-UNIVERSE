import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WORLDS } from "./worlds-data.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = innerWidth < 720;
const canvas = document.getElementById("galaxy-canvas");

/* ---------- Which planet? (planet.html?world=artoria) ---------- */
const id = new URLSearchParams(location.search).get("world");
const worldIndex = Math.max(0, WORLDS.findIndex(w => w.id === id));
const world = WORLDS[worldIndex];
const wColor = new THREE.Color(world.color);
const nextWorld = WORLDS[(worldIndex + 1) % WORLDS.length];
const prevWorld = WORLDS[(worldIndex - 1 + WORLDS.length) % WORLDS.length];

document.title = world.name + " · THE CREATOR'S UNIVERSE";
document.getElementById("world-title").textContent = world.name;
document.getElementById("world-sub").textContent = world.tagline;

/* ---------- Demo exhibits (one per category) ---------- */
const exhibits = world.categories.map(cat => ({
  title: "Sample " + cat + " exhibit",
  creator: "Demo Creator",
  category: cat,
  text: "This is demo content. In Phase 7, real " + cat.toLowerCase() + " uploaded by creators will be displayed here, with images, descriptions and links.",
  tags: [cat, "Demo data"]
}));

/* ---------- Scene ---------- */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x120a30, 0.006);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
const HOME_POS = new THREE.Vector3(0, 11, 26);
const HOME_TARGET = new THREE.Vector3(0, 1, 0);
camera.position.copy(HOME_POS);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true;
controls.minDistance = 6;
controls.maxDistance = 48;
controls.maxPolarAngle = Math.PI / 2.05;
controls.autoRotate = !reducedMotion;
controls.autoRotateSpeed = 0.4;

/* ---------- Lights ---------- */
scene.add(new THREE.AmbientLight(0x6670ff, 0.55));
scene.add(new THREE.HemisphereLight(0xffb0d0, 0x3a2090, 1.1));
const warm = new THREE.DirectionalLight(0xffb070, 1.8);
warm.position.set(-20, 14, 15);
scene.add(warm);

/* ---------- Sky from your image ---------- */
let sky = null;
new THREE.TextureLoader().load(
  "image/space-bg.jpg",
  tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    sky = new THREE.Mesh(
      new THREE.SphereGeometry(450, 64, 64),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    sky.renderOrder = -1;
    scene.add(sky);
  },
  undefined,
  () => console.warn("Could not load image/space-bg.jpg")
);

/* ---------- Helpers ---------- */
function glowTexture(color) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function rgba(color, a) {
  return "rgba(" + Math.round(color.r * 255) + "," + Math.round(color.g * 255) + "," + Math.round(color.b * 255) + "," + a + ")";
}

function starSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}
const STAR_TEX = starSprite();

function makeStars(count, size) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 120 + Math.random() * 160;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    map: STAR_TEX, size: size * 3, sizeAttenuation: true,
    transparent: true, opacity: 0.9, depthWrite: false, fog: false
  }));
}
scene.add(makeStars(isMobile ? 300 : 700, 0.6));

function makeLabel(text, borderColor) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(10,14,45,0.78)";
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = borderColor || world.color;
  g.lineWidth = 6;
  g.strokeRect(3, 3, 506, 122);
  g.fillStyle = "#ffffff";
  g.font = "bold 46px Segoe UI, Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 256, 64, 480);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c), transparent: true, depthTest: false
  }));
  sprite.scale.set(4, 1, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Cloud sea below ---------- */
const cloudTex = [
  glowTexture("rgba(244,114,182,0.55)"),
  glowTexture("rgba(139,92,246,0.5)"),
  glowTexture("rgba(251,146,60,0.35)")
];
for (let i = 0; i < (isMobile ? 10 : 18); i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: cloudTex[i % 3], transparent: true, opacity: 0.55, depthWrite: false
  }));
  s.position.set((Math.random() - 0.5) * 110, -16 - Math.random() * 6, (Math.random() - 0.5) * 110);
  const sc = 32 + Math.random() * 25;
  s.scale.set(sc, sc * 0.5, 1);
  scene.add(s);
}

/* ---------- The island ---------- */
const R = 9;
const rnd = mulberry32(world.id.length * 13 + 5);
const island = new THREE.Group();
scene.add(island);

const grassColor = new THREE.Color(0x2f8f5b).lerp(wColor, 0.3);
island.add(new THREE.Mesh(
  new THREE.CylinderGeometry(R, R * 0.95, 0.5, 48),
  new THREE.MeshStandardMaterial({ color: grassColor, roughness: 0.9, flatShading: true })
));

const H = R * 1.3;
const coneGeo = new THREE.ConeGeometry(R * 0.98, H, 32, 8);
const cp = coneGeo.attributes.position;
for (let i = 0; i < cp.count; i++) {
  const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
  if (y < H / 2 - 0.01 && y > -H / 2 + 0.01) {
    const n = Math.sin(x * 1.3 + y * 1.1) * Math.cos(z * 1.2 + y * 1.7);
    cp.setXYZ(i, x * (1 + n * 0.16), y + n * 0.3, z * (1 + n * 0.16));
  }
}
coneGeo.computeVertexNormals();
const rock = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({ color: 0x3b2a52, roughness: 1, flatShading: true }));
rock.rotation.x = Math.PI;
rock.position.y = -0.25 - H / 2;
island.add(rock);

const underGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture(rgba(wColor, 0.7)),
  blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
}));
underGlow.position.set(0, -H - 1, 0);
underGlow.scale.set(R * 3.5, R * 1.8, 1);
island.add(underGlow);

// Centrepiece crystal
const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(1.1, 1.4, 0.6, 8),
  new THREE.MeshStandardMaterial({ color: 0x2a2250, roughness: 0.6 })
);
pedestal.position.y = 0.55;
island.add(pedestal);

const crystal = new THREE.Mesh(
  new THREE.OctahedronGeometry(1.1, 0),
  new THREE.MeshStandardMaterial({ color: wColor, emissive: wColor, emissiveIntensity: 0.7, roughness: 0.2, flatShading: true })
);
crystal.position.y = 2.5;
island.add(crystal);

const crystalLight = new THREE.PointLight(wColor, 35, 16);
crystalLight.position.y = 3;
island.add(crystalLight);

const title = makeLabel(world.name);
title.position.y = 4.6;
title.scale.set(5, 1.25, 1);
island.add(title);

// Trees
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3a29, roughness: 1 });
const leafColors = [0x4caf70, 0xe879a8, 0x8aa83a, 0xf9a8d4];
for (let i = 0; i < (isMobile ? 14 : 22); i++) {
  const a = rnd() * Math.PI * 2;
  const r = i % 2 ? 7.6 + rnd() * 1.0 : 2.5 + rnd() * 0.9;
  const s = 0.8 + rnd() * 0.9;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.1 * s, 0.8 * s, 6), trunkMat);
  t.position.set(x, 0.25 + 0.4 * s, z);
  const f = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.45 * s, 1),
    new THREE.MeshStandardMaterial({ color: leafColors[i % 4], roughness: 0.8, flatShading: true })
  );
  f.scale.y = 0.85;
  f.position.set(x, 0.25 + 1.05 * s, z);
  island.add(t, f);
}

/* ---------- Pavilions (one per category) ---------- */
const pavilions = [];
const pickables = [];
const N = exhibits.length;

exhibits.forEach((ex, i) => {
  const a = (i / N) * Math.PI * 2;
  const px = Math.cos(a) * 5.6;
  const pz = Math.sin(a) * 5.6;

  const g = new THREE.Group();
  g.position.set(px, 0, pz);
  g.rotation.y = -a + Math.PI / 2;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xf5e9ff, emissive: wColor, emissiveIntensity: 0.35, roughness: 0.5 })
  );
  base.position.y = 0.8;

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.35, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: wColor, emissive: wColor, emissiveIntensity: 0.55, roughness: 0.4 })
  );
  roof.position.y = 1.8;

  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.75),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8 })
  );
  door.position.set(0, 0.75, 1.02);

  const label = makeLabel(ex.category);
  label.position.y = 3.0;

  g.add(base, roof, door, label);
  island.add(g);

  base.userData.index = i;
  roof.userData.index = i;
  pickables.push(base, roof);
  pavilions.push({ group: g, pos: new THREE.Vector3(px, 0, pz), scale: 1, target: 1 });
});

/* ---------- Bridges + portals (to the next / previous planet) ---------- */
const bridges = [];
const portalSpinners = [];
const BR_START = R - 1;
const BR_END = R + 7;

function buildBridge(angle, target) {
  const tColor = new THREE.Color(target.color);
  const dx = Math.cos(angle), dz = Math.sin(angle);
  const g = new THREE.Group();
  g.rotation.y = -angle; // local +x now points along the bridge

  // Walkway
  const len = BR_END - BR_START;
  const mid = (BR_START + BR_END) / 2;
  const plank = new THREE.Mesh(
    new THREE.BoxGeometry(len, 0.2, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x2a2250, emissive: 0x4c3a9a, emissiveIntensity: 0.35, roughness: 0.6 })
  );
  plank.position.set(mid, 0.15, 0);
  g.add(plank);

  // Glowing rails + lamps
  const railMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  [-0.82, 0.82].forEach(z => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.07), railMat);
    rail.position.set(mid, 0.6, z);
    g.add(rail);
    for (let k = 0; k <= 4; k++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.07), railMat);
      post.position.set(BR_START + (len * k) / 4, 0.4, z);
      g.add(post);
    }
  });

  // Portal ring
  const portalX = BR_END + 1.2;
  const pg = new THREE.Group();
  pg.position.set(portalX, 1.9, 0);
  pg.rotation.y = Math.PI / 2; // ring faces along the bridge

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.14, 16, 48),
    new THREE.MeshStandardMaterial({ color: tColor, emissive: tColor, emissiveIntensity: 0.9, roughness: 0.3 })
  );
  const spinner = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.05, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
  );
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.55, 40),
    new THREE.MeshBasicMaterial({
      color: tColor, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(rgba(tColor, 0.8)), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
  }));
  halo.scale.set(7, 7, 1);

  pg.add(ring, spinner, disc, halo);
  g.add(pg);

  const light = new THREE.PointLight(tColor, 25, 12);
  light.position.set(portalX - 1, 2, 0);
  g.add(light);

  const label = makeLabel("→ " + target.name, target.color);
  label.position.set(portalX, 4.2, 0);
  g.add(label);

  island.add(g);

  ring.userData.portal = target.id;
  disc.userData.portal = target.id;
  pickables.push(ring, disc);
  portalSpinners.push(spinner);

  bridges.push({
    dx, dz,
    max: portalX + 0.2,
    portalPos: new THREE.Vector3(dx * portalX, 0, dz * portalX),
    target
  });
}

buildBridge(Math.PI / N, nextWorld);
buildBridge(-Math.PI / N, prevWorld);

/* ---------- Travel through a portal ---------- */
let travelling = false;
function travel(targetId) {
  if (travelling) return;
  const target = WORLDS.find(w => w.id === targetId);
  if (!target) return;
  travelling = true;
  const url = "planet.html?world=" + target.id;
  if (reducedMotion) { location.href = url; return; }
  document.getElementById("warp-text").textContent = "🌀 Entering portal to " + target.name + "…";
  document.body.classList.add("warping");
  setTimeout(() => { location.href = url; }, 1100);
}

/* ---------- Avatar ---------- */
const SWATCHES = ["#8b5cf6", "#f472b6", "#22d3ee", "#fbbf24", "#34d399", "#fb923c"];
let avatarColor = SWATCHES[0];
try {
  const saved = localStorage.getItem("cu-avatar-color");
  if (saved && SWATCHES.includes(saved)) avatarColor = saved;
} catch (e) { /* storage may be blocked */ }

const avatarMat = new THREE.MeshStandardMaterial({
  color: avatarColor, emissive: avatarColor, emissiveIntensity: 0.18, roughness: 0.5
});

function buildAvatar() {
  const g = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 4, 12), avatarMat);
  body.position.y = 0.75;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xffe0c8, roughness: 0.7 })
  );
  head.position.y = 1.38;

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.1, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  );
  visor.position.set(0, 1.4, 0.2);

  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.4, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x2a2250, roughness: 0.6 })
  );
  pack.position.set(0, 0.8, -0.3);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2250, roughness: 0.7 });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.14), legMat);
  const legR = legL.clone();
  legL.position.set(-0.13, 0.2, 0);
  legR.position.set(0.13, 0.2, 0);

  g.add(body, head, visor, pack, legL, legR);
  g.userData.legL = legL;
  g.userData.legR = legR;
  g.userData.body = body;
  return g;
}

const avatar = buildAvatar();
avatar.visible = false;
scene.add(avatar);

/* ---------- Walk mode ---------- */
let walking = false;
let nearIndex = -1;
const input = { up: false, down: false, left: false, right: false };
const AVATAR_Y = 0.25;
const SPEED = 4;
const prompt_ = document.getElementById("walk-prompt");
const walkBtn = document.getElementById("walk-btn");

function setWalking(on) {
  walking = on;
  avatar.visible = on;
  document.body.classList.toggle("walking", on);
  walkBtn.textContent = on ? "🧭 Explore mode" : "🚶 Walk mode";
  flyT = 1;
  if (on) {
    controls.autoRotate = false;
    controls.minDistance = 3;
    controls.maxDistance = 16;
    avatar.position.set(0, AVATAR_Y, 3.2);
    avatar.rotation.y = Math.PI;
    camera.position.set(0, 4.4, 10);
    controls.target.set(0, 1.2, 3.2);
  } else {
    controls.minDistance = 6;
    controls.maxDistance = 48;
    nearIndex = -1;
    prompt_.classList.add("hidden-prompt");
    fly(HOME_POS.clone(), HOME_TARGET.clone());
    controls.autoRotate = !reducedMotion;
  }
}

walkBtn.addEventListener("click", () => setWalking(!walking));

// Colour swatches
const swatchBox = document.getElementById("swatches");
SWATCHES.forEach(c => {
  const b = document.createElement("button");
  b.style.background = c;
  b.setAttribute("aria-label", "Avatar colour " + c);
  if (c === avatarColor) b.classList.add("active");
  b.addEventListener("click", () => {
    avatarColor = c;
    avatarMat.color.set(c);
    avatarMat.emissive.set(c);
    swatchBox.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
    try { localStorage.setItem("cu-avatar-color", c); } catch (e) { /* ignore */ }
  });
  swatchBox.appendChild(b);
});

// Keyboard
const KEYMAP = {
  KeyW: "up", ArrowUp: "up",
  KeyS: "down", ArrowDown: "down",
  KeyA: "left", ArrowLeft: "left",
  KeyD: "right", ArrowRight: "right"
};
addEventListener("keydown", e => {
  if (!walking) return;
  const dir = KEYMAP[e.code];
  if (dir) { input[dir] = true; e.preventDefault(); }
  if (e.code === "KeyE" && nearIndex >= 0) openExhibit(nearIndex);
});
addEventListener("keyup", e => {
  const dir = KEYMAP[e.code];
  if (dir) input[dir] = false;
});
addEventListener("blur", () => { input.up = input.down = input.left = input.right = false; });

// On-screen d-pad
document.querySelectorAll("#dpad button").forEach(b => {
  const dir = b.dataset.dir;
  const on = e => { input[dir] = true; e.preventDefault(); };
  const off = () => { input[dir] = false; };
  b.addEventListener("pointerdown", on);
  b.addEventListener("pointerup", off);
  b.addEventListener("pointerleave", off);
  b.addEventListener("pointercancel", off);
});

prompt_.addEventListener("click", () => { if (nearIndex >= 0) openExhibit(nearIndex); });

const fwd = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const before = new THREE.Vector3();

function updateWalk(dt, t) {
  const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const iz = (input.up ? 1 : 0) - (input.down ? 1 : 0);
  let moving = false;

  before.copy(avatar.position);

  if (ix !== 0 || iz !== 0) {
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    right.crossVectors(fwd, UP);
    move.set(0, 0, 0).addScaledVector(fwd, iz).addScaledVector(right, ix).normalize();

    avatar.position.addScaledVector(move, SPEED * dt);
    moving = true;

    const target = Math.atan2(move.x, move.z);
    let diff = target - avatar.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    avatar.rotation.y += diff * Math.min(1, dt * 10);
  }

  const p = avatar.position;

  // Where may the avatar stand? On the island, or inside a bridge corridor.
  let corridor = null;
  for (const b of bridges) {
    const along = p.x * b.dx + p.z * b.dz;
    const across = -p.x * b.dz + p.z * b.dx;
    if (along > R - 2.2 && along < b.max + 0.5 && Math.abs(across) < 0.95) {
      corridor = { b, along, across };
      break;
    }
  }
  if (corridor) {
    if (corridor.along > R - 0.9) {
      const b = corridor.b;
      const across = Math.max(-0.7, Math.min(0.7, corridor.across));
      const along = Math.min(corridor.along, b.max);
      p.x = b.dx * along - b.dz * across;
      p.z = b.dz * along + b.dx * across;
    }
  } else {
    const maxR = R - 0.9;
    const d = Math.hypot(p.x, p.z);
    if (d > maxR) { p.x *= maxR / d; p.z *= maxR / d; }
  }

  // Crystal pedestal
  const dc = Math.hypot(p.x, p.z);
  if (dc < 1.9 && dc > 0.001) { p.x *= 1.9 / dc; p.z *= 1.9 / dc; }

  // Pavilions
  pavilions.forEach(pv => {
    const dx = p.x - pv.pos.x, dz = p.z - pv.pos.z;
    const dd = Math.hypot(dx, dz);
    if (dd < 1.5 && dd > 0.001) {
      p.x = pv.pos.x + (dx / dd) * 1.5;
      p.z = pv.pos.z + (dz / dd) * 1.5;
    }
  });
  p.y = AVATAR_Y;

  // Portals
  bridges.forEach(b => {
    if (Math.hypot(p.x - b.portalPos.x, p.z - b.portalPos.z) < 1.3) travel(b.target.id);
  });

  // Walking animation
  const swing = moving ? Math.sin(t * 11) * 0.6 : 0;
  avatar.userData.legL.rotation.x = swing;
  avatar.userData.legR.rotation.x = -swing;
  avatar.userData.body.position.y = 0.75 + (moving ? Math.abs(Math.sin(t * 11)) * 0.05 : 0);

  // Camera follows the avatar
  camera.position.add(p.clone().sub(before));
  controls.target.set(p.x, p.y + 1.2, p.z);

  // Near a pavilion?
  let best = -1, bestD = 2.9;
  pavilions.forEach((pv, i) => {
    const dd = Math.hypot(p.x - pv.pos.x, p.z - pv.pos.z);
    if (dd < bestD) { bestD = dd; best = i; }
  });
  if (best !== nearIndex) {
    nearIndex = best;
    if (best >= 0) {
      prompt_.textContent = "Open exhibit: " + exhibits[best].category + "  (E)";
      prompt_.classList.remove("hidden-prompt");
    } else {
      prompt_.classList.add("hidden-prompt");
    }
  }
}

/* ---------- Camera fly ---------- */
let flyFrom, flyTo, targetFrom, targetTo, flyT = 1;
function fly(pos, target) {
  flyFrom = camera.position.clone();
  targetFrom = controls.target.clone();
  flyTo = pos;
  targetTo = target;
  flyT = reducedMotion ? 1 : 0;
  controls.autoRotate = false;
}

/* ---------- UI ---------- */
const panel = document.getElementById("info-panel");
const list = document.getElementById("world-list");
const nav = document.getElementById("world-nav");

exhibits.forEach((ex, i) => {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.dataset.index = i;
  btn.innerHTML = '<span class="dot" style="background:' + world.color + '"></span>' + ex.category;
  btn.addEventListener("click", () => { openExhibit(i); nav.classList.remove("open"); });
  li.appendChild(btn);
  list.appendChild(li);
});

// 2D alternative to the portals
const travelTitle = document.createElement("li");
travelTitle.textContent = "Travel";
travelTitle.style.cssText = "font-size:0.8rem;letter-spacing:2px;opacity:0.7;margin:12px 0 4px;";
list.appendChild(travelTitle);
[nextWorld, prevWorld].forEach(tw => {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.innerHTML = '<span class="dot" style="background:' + tw.color + '"></span>→ ' + tw.name;
  btn.addEventListener("click", () => travel(tw.id));
  li.appendChild(btn);
  list.appendChild(li);
});

function openExhibit(i) {
  const ex = exhibits[i];
  document.getElementById("panel-name").textContent = ex.title;
  document.getElementById("panel-tagline").textContent = "by " + ex.creator + " · " + ex.category;
  document.getElementById("panel-desc").textContent = ex.text;
  const tags = document.getElementById("panel-cats");
  tags.innerHTML = "";
  ex.tags.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    tags.appendChild(li);
  });
  panel.classList.remove("hidden");
  list.querySelectorAll("button").forEach(b => b.classList.toggle("active", Number(b.dataset.index) === i));

  if (walking) return;

  const p = pavilions[i].pos;
  const dir = p.clone().setY(0).normalize();
  fly(
    p.clone().add(dir.multiplyScalar(7)).add(new THREE.Vector3(0, 3.5, 0)),
    p.clone().add(new THREE.Vector3(0, 1.2, 0))
  );
}

function closeExhibit() {
  panel.classList.add("hidden");
  list.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  if (walking) return;
  fly(HOME_POS.clone(), HOME_TARGET.clone());
  controls.autoRotate = !reducedMotion;
}

document.getElementById("close-panel").addEventListener("click", closeExhibit);
document.getElementById("back-btn").addEventListener("click", closeExhibit);
document.getElementById("menu-btn").addEventListener("click", () => nav.classList.toggle("open"));

/* ---------- Click / tap ---------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downX = 0, downY = 0, hovered = -1;

function pick(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(pickables)[0];
}

canvas.addEventListener("pointerdown", e => { downX = e.clientX; downY = e.clientY; });
canvas.addEventListener("pointerup", e => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
  const hit = pick(e);
  if (!hit) return;
  const ud = hit.object.userData;
  if (ud.portal) travel(ud.portal);
  else if (ud.index !== undefined) openExhibit(ud.index);
});
canvas.addEventListener("pointermove", e => {
  if (e.pointerType === "touch") return;
  const hit = pick(e);
  const ud = hit ? hit.object.userData : null;
  hovered = ud && ud.index !== undefined ? ud.index : -1;
  canvas.style.cursor = hit ? "pointer" : "grab";
});

/* ---------- Animation ---------- */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;

  if (flyT < 1) {
    flyT = Math.min(flyT + dt / 1.4, 1);
    const k = flyT * flyT * (3 - 2 * flyT);
    camera.position.lerpVectors(flyFrom, flyTo, k);
    controls.target.lerpVectors(targetFrom, targetTo, k);
  }

  if (!reducedMotion) {
    crystal.rotation.y += dt * 0.6;
    crystal.position.y = 2.5 + Math.sin(t * 1.2) * 0.2;
    if (sky) sky.rotation.y += dt * 0.004;
    portalSpinners.forEach((s, i) => { s.rotation.z += dt * (i % 2 ? -1.4 : 1.4); });
  }

  if (walking) updateWalk(dt, t);

  pavilions.forEach((p, i) => {
    p.target = hovered === i ? 1.08 : 1;
    p.scale += (p.target - p.scale) * 0.15;
    p.group.scale.setScalar(p.scale);
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

setTimeout(() => document.getElementById("loader").classList.add("done"), 900);
