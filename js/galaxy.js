import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WORLDS } from "./worlds-data.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("galaxy-canvas");
const isMobile = innerWidth < 720;

/* ---------- Basic scene ---------- */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x120a30, 0.005);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
const HOME_POS = new THREE.Vector3(0, 8, 30);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);
camera.position.copy(HOME_POS);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 6;
controls.maxDistance = 70;
controls.autoRotate = !reducedMotion;
controls.autoRotateSpeed = 0.3;

/* ---------- Lights (warm sunset + purple space) ---------- */
scene.add(new THREE.AmbientLight(0x6670ff, 0.5));
scene.add(new THREE.HemisphereLight(0xffb0d0, 0x3a2090, 1.1));
const warm = new THREE.DirectionalLight(0xffb070, 1.8);
warm.position.set(-20, 12, 15);
scene.add(warm);
const sun = new THREE.PointLight(0xffffff, 2.2, 200);
sun.position.set(10, 15, 20);
scene.add(sun);

/* ---------- Nebula sky from your image ---------- */
let sky = null;
new THREE.TextureLoader().load(
  "images/space-bg.jpg",
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
  () => console.warn("Could not load images/space-bg.jpg - using gradient background instead.")
);

/* ---------- Round glowing stars ---------- */
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

function makeStars(count, spread, size) {
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
  const mat = new THREE.PointsMaterial({
    map: STAR_TEX, color: 0xffffff, size: size * 3, sizeAttenuation: true,
    transparent: true, opacity: 0.9, depthWrite: false, fog: false
  });
  return new THREE.Points(geo, mat);
}
scene.add(makeStars(isMobile ? 300 : 700, 300, 0.6));

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

function streakTexture() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(34,211,238,0.22)";
  g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 46; i++) {
    const len = 50 + Math.random() * 120;
    const x = Math.random() * 124;
    const y0 = Math.random() * (256 - len);
    const w = 1 + Math.random() * 4;
    const grad = g.createLinearGradient(0, y0, 0, y0 + len);
    grad.addColorStop(0, "rgba(34,211,238,0)");
    grad.addColorStop(0.5, `rgba(190,250,255,${0.5 + Math.random() * 0.5})`);
    grad.addColorStop(1, "rgba(34,211,238,0)");
    g.fillStyle = grad;
    g.fillRect(x, y0, w, len);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Cloud sea (pink / purple sunset mist) ---------- */
const cloudTextures = [
  glowTexture("rgba(244,114,182,0.55)"),
  glowTexture("rgba(139,92,246,0.5)"),
  glowTexture("rgba(251,146,60,0.35)")
];
for (let i = 0; i < (isMobile ? 10 : 18); i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: cloudTextures[i % 3], transparent: true, opacity: 0.55, depthWrite: false
  }));
  s.position.set((Math.random() - 0.5) * 90, -14 - Math.random() * 6, (Math.random() - 0.5) * 90);
  const sc = 30 + Math.random() * 25;
  s.scale.set(sc, sc * 0.5, 1);
  scene.add(s);
}

/* ---------- Floating island (hero planet) ---------- */
const waterTex = streakTexture();
const riverTex = streakTexture();
riverTex.repeat.set(1, 2);
waterTex.repeat.set(1, 3);
let drops = null;
let dropData = [];

function buildIsland(w) {
  const R = w.size * 1.4;
  const rnd = mulberry32(7);
  const g = new THREE.Group();

  // Grass top
  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R * 0.95, 0.4, 40),
    new THREE.MeshStandardMaterial({ color: 0x2f8f5b, roughness: 0.9, flatShading: true })
  );
  g.add(grass);

  // Rocky underside
  const H = R * 1.9;
  const coneGeo = new THREE.ConeGeometry(R * 0.98, H, 28, 8);
  const pos = coneGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y < H / 2 - 0.01 && y > -H / 2 + 0.01) {
      const n = Math.sin(x * 2.1 + y * 1.3) * Math.cos(z * 1.9 + y * 2.2);
      pos.setXYZ(i, x * (1 + n * 0.18), y + n * 0.25, z * (1 + n * 0.18));
    }
  }
  coneGeo.computeVertexNormals();
  const rock = new THREE.Mesh(
    coneGeo,
    new THREE.MeshStandardMaterial({ color: 0x3b2a52, roughness: 1, flatShading: true })
  );
  rock.rotation.x = Math.PI;
  rock.position.y = -0.2 - H / 2;
  g.add(rock);

  // Trees
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3a29, roughness: 1 });
  function leafMat(c) {
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, flatShading: true });
  }

  // Big central tree
  const bigTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 2.4, 8), trunkMat);
  bigTrunk.position.set(0, 1.4, -0.4);
  g.add(bigTrunk);
  [
    [0, 3.3, -0.4, 1.5, 0x6b8f3a],
    [-1.0, 2.9, -0.2, 1.0, 0x4f7f3a],
    [1.0, 2.8, -0.5, 1.0, 0x8aa83a]
  ].forEach(([x, y, z, r, c]) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leafMat(c));
    m.scale.y = 0.8;
    m.position.set(x, y, z);
    g.add(m);
  });

  // Small trees (pink blossoms + green)
  const leafColors = [0xe879a8, 0x4caf70, 0xf9a8d4, 0x8aa83a];
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 1.8 + rnd() * (R * 0.8 - 1.8);
    const s = 0.7 + rnd() * 0.8;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > R * 0.45 && Math.abs(x) < 1.2) continue; // keep the river path clear
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.09 * s, 0.7 * s, 6), trunkMat);
    t.position.set(x, 0.2 + 0.35 * s, z);
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 * s, 1), leafMat(leafColors[i % 4]));
    f.scale.y = 0.85;
    f.position.set(x, 0.2 + 0.95 * s, z);
    g.add(t, f);
  }

  // Glowing pavilions
  [3.6, 5.3].forEach(a => {
    const px = Math.cos(a) * R * 0.6, pz = Math.sin(a) * R * 0.6;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0xf9a8d4, emissive: 0xf472b6, emissiveIntensity: 0.5 })
    );
    base.position.set(px, 0.38, pz);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.35 })
    );
    roof.position.set(px, 0.8, pz);
    g.add(base, roof);
  });

  // River on top
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, R * 0.95),
    new THREE.MeshBasicMaterial({
      map: riverTex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide
    })
  );
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.22, R * 0.48);
  g.add(river);

  // Glowing waterfalls down the rock face
  const D = H * 0.9;
  const zTop = R + 0.15;
  const zBot = R * 0.1 + 0.35;
  const dz = zTop - zBot;
  const L = Math.sqrt(D * D + dz * dz);
  const tilt = Math.atan(dz / D);
  [[-0.55, 0.55], [0, 1.0], [0.55, 0.55]].forEach(([x, width]) => {
    const fall = new THREE.Mesh(
      new THREE.PlaneGeometry(width, L),
      new THREE.MeshBasicMaterial({
        map: waterTex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide
      })
    );
    fall.rotation.x = tilt;
    fall.position.set(x, 0.2 - D / 2, (zTop + zBot) / 2);
    g.add(fall);
  });

  // Cyan glow at the bottom of the waterfall
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture("rgba(34,211,238,0.9)"), blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false
  }));
  glow.position.set(0, 0.2 - D, zBot + 0.5);
  glow.scale.set(R * 1.8, R * 1.8, 1);
  g.add(glow);

  const light = new THREE.PointLight(0x22d3ee, 60, 22);
  light.position.set(0, 0.2 - D * 0.7, zBot + 1);
  g.add(light);

  // Pink mist under the island
  const mist = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture("rgba(244,114,182,0.6)"), blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false
  }));
  mist.position.set(0, -D - 1, 0);
  mist.scale.set(R * 4, R * 2, 1);
  g.add(mist);

  // Falling droplets
  const N = isMobile ? 40 : 90;
  const dp = new Float32Array(N * 3);
  dropData = [];
  for (let i = 0; i < N; i++) {
    dropData.push({
      x: (Math.random() - 0.5) * 1.8,
      y: -Math.random() * D,
      speed: 1 + Math.random() * 1.5,
      zOff: Math.random() * 0.6
    });
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  drops = new THREE.Points(dGeo, new THREE.PointsMaterial({
    map: STAR_TEX, color: 0xbafaff, size: 0.35, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  drops.userData.D = D;
  drops.userData.zTop = zTop;
  drops.userData.zBot = zBot;
  g.add(drops);

  return g;
}

/* ---------- Planets ---------- */
const planets = [];
const pickables = [];

WORLDS.forEach(w => {
  if (w.type === "island") {
    const group = buildIsland(w);
    group.position.set(...w.position);
    group.traverse(o => {
      if (o.isMesh) { o.userData.worldId = w.id; pickables.push(o); }
    });
    scene.add(group);
    planets.push({ data: w, group, body: null, baseScale: 1, targetScale: 1 });
    return;
  }

  const group = new THREE.Group();
  group.position.set(...w.position);

  const color = new THREE.Color(w.color);
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(w.size, 48, 48),
    new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.25, roughness: 0.65, metalness: 0.1
    })
  );
  body.userData.worldId = w.id;
  group.add(body);

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(w.size * 1.18, 32, 32),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending
    })
  );
  group.add(atmo);

  if (w.ring) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(w.size * 1.5, w.size * 2.1, 64),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);
  }

  scene.add(group);
  planets.push({ data: w, group, body, baseScale: 1, targetScale: 1 });
  pickables.push(body);
});

/* ---------- Camera fly-to animation ---------- */
let flyFrom = null, flyTo = null, targetFrom = null, targetTo = null, flyT = 1;

function flyTo_(pos, target) {
  flyFrom = camera.position.clone();
  targetFrom = controls.target.clone();
  flyTo = pos;
  targetTo = target;
  flyT = reducedMotion ? 1 : 0;
  controls.autoRotate = false;
}

function selectWorld(id) {
  const p = planets.find(pl => pl.data.id === id);
  if (!p) return;
  const center = p.group.position.clone();
  const dir = center.clone().sub(HOME_TARGET).normalize();
  if (dir.lengthSq() === 0) dir.set(0, 0.3, 1);
  const camPos = center.clone()
    .add(dir.multiplyScalar(p.data.size * 4.5 + 2))
    .add(new THREE.Vector3(0, p.data.size, 0));
  flyTo_(camPos, center);
  showPanel(p.data);
}

function backToGalaxy() {
  flyTo_(HOME_POS.clone(), HOME_TARGET.clone());
  hidePanel();
  controls.autoRotate = !reducedMotion;
}

/* ---------- UI ---------- */
const panel = document.getElementById("info-panel");
const list = document.getElementById("world-list");
const nav = document.getElementById("world-nav");

WORLDS.forEach(w => {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.dataset.id = w.id;
  btn.innerHTML = `<span class="dot" style="background:${w.color}"></span>${w.name}`;
  btn.addEventListener("click", () => {
    selectWorld(w.id);
    nav.classList.remove("open");
  });
  li.appendChild(btn);
  list.appendChild(li);
});

function showPanel(w) {
  document.getElementById("enter-btn").href = "planet.html?world=" + w.id;
  document.getElementById("panel-name").textContent = w.name;
  document.getElementById("panel-tagline").textContent = w.tagline;
  document.getElementById("panel-desc").textContent = w.description;
  const cats = document.getElementById("panel-cats");
  cats.innerHTML = "";
  w.categories.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    cats.appendChild(li);
  });
  panel.classList.remove("hidden");
  list.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.id === w.id));
}

function hidePanel() {
  panel.classList.add("hidden");
  list.querySelectorAll("button").forEach(b => b.classList.remove("active"));
}

document.getElementById("close-panel").addEventListener("click", backToGalaxy);
document.getElementById("back-btn").addEventListener("click", backToGalaxy);
document.getElementById("menu-btn").addEventListener("click", () => nav.classList.toggle("open"));

/* ---------- Clicking / tapping ---------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downX = 0, downY = 0;
let hovered = null;

canvas.addEventListener("pointerdown", e => { downX = e.clientX; downY = e.clientY; });

canvas.addEventListener("pointerup", e => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
  const hit = pick(e);
  if (hit) selectWorld(hit.object.userData.worldId);
});

canvas.addEventListener("pointermove", e => {
  if (e.pointerType === "touch") return;
  const hit = pick(e);
  hovered = hit ? hit.object.userData.worldId : null;
  canvas.style.cursor = hovered ? "pointer" : "grab";
});

function pick(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(pickables)[0];
}

/* ---------- Animation loop ---------- */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  if (flyT < 1) {
    flyT = Math.min(flyT + dt / 1.6, 1);
    const k = flyT * flyT * (3 - 2 * flyT);
    camera.position.lerpVectors(flyFrom, flyTo, k);
    controls.target.lerpVectors(targetFrom, targetTo, k);
  }

  if (!reducedMotion) {
    if (sky) sky.rotation.y += dt * 0.004;
    waterTex.offset.y += dt * 0.55;
    riverTex.offset.y += dt * 0.25;

    if (drops) {
      const arr = drops.geometry.attributes.position.array;
      const { D, zTop, zBot } = drops.userData;
      dropData.forEach((d, i) => {
        d.y -= dt * d.speed;
        if (d.y < -D) d.y = 0;
        const f = -d.y / D;
        arr[i * 3] = d.x;
        arr[i * 3 + 1] = 0.2 + d.y;
        arr[i * 3 + 2] = zTop + (zBot - zTop) * f + d.zOff;
      });
      drops.geometry.attributes.position.needsUpdate = true;
    }
  }

  planets.forEach((p, i) => {
    if (!reducedMotion) {
      if (p.body) p.body.rotation.y += dt * 0.25;
      else p.group.rotation.y = Math.sin(t * 0.2) * 0.25; // island gently sways
      p.group.position.y = p.data.position[1] + Math.sin(t * 0.6 + i) * 0.25;
    }
    p.targetScale = hovered === p.data.id ? 1.05 : 1;
    p.baseScale += (p.targetScale - p.baseScale) * 0.12;
    p.group.scale.setScalar(p.baseScale);
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ---------- Resize + loader ---------- */
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

setTimeout(() => document.getElementById("loader").classList.add("done"), 900);
