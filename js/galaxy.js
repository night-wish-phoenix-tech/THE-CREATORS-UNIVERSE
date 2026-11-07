import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WORLDS } from "./worlds-data.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("galaxy-canvas");

/* ---------- Basic scene ---------- */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070a1f, 0.008);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
const HOME_POS = new THREE.Vector3(0, 8, 30);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);
camera.position.copy(HOME_POS);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 6;
controls.maxDistance = 60;
controls.autoRotate = !reducedMotion;
controls.autoRotateSpeed = 0.35;

/* ---------- Lights ---------- */
scene.add(new THREE.AmbientLight(0x6670ff, 0.6));
const sun = new THREE.PointLight(0xffffff, 2.2, 200);
sun.position.set(10, 15, 20);
scene.add(sun);

/* ---------- Stars ---------- */
function makeStars(count, spread, size) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * spread;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: true, transparent: true, opacity: 0.9 });
  return new THREE.Points(geo, mat);
}
const isMobile = innerWidth < 720;
scene.add(makeStars(isMobile ? 800 : 2000, 300, 0.7));
scene.add(makeStars(isMobile ? 200 : 500, 200, 1.2));

/* ---------- Nebulae (soft glowing clouds) ---------- */
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
[
  { c: "rgba(139,92,246,0.55)", p: [-30, 10, -60], s: 90 },
  { c: "rgba(34,211,238,0.35)", p: [40, -10, -70], s: 100 },
  { c: "rgba(244,114,182,0.40)", p: [10, 25, -80], s: 80 }
].forEach(n => {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(n.c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
  }));
  sprite.position.set(...n.p);
  sprite.scale.set(n.s, n.s, 1);
  scene.add(sprite);
});

/* ---------- Planets ---------- */
const planets = [];
const pickables = [];

WORLDS.forEach(w => {
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

  // Atmosphere glow
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
  const camPos = center.clone().add(dir.multiplyScalar(p.data.size * 4.5 + 2)).add(new THREE.Vector3(0, p.data.size, 0));
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

/* ---------- Clicking / tapping planets ---------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downX = 0, downY = 0;
let hovered = null;

canvas.addEventListener("pointerdown", e => { downX = e.clientX; downY = e.clientY; });

canvas.addEventListener("pointerup", e => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return; // it was a drag
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

  if (flyT < 1) {
    flyT = Math.min(flyT + dt / 1.6, 1);
    const k = flyT * flyT * (3 - 2 * flyT); // smooth ease
    camera.position.lerpVectors(flyFrom, flyTo, k);
    controls.target.lerpVectors(targetFrom, targetTo, k);
  }

  planets.forEach((p, i) => {
    if (!reducedMotion) {
      p.body.rotation.y += dt * 0.25;
      p.group.position.y = p.data.position[1] + Math.sin(clock.elapsedTime * 0.6 + i) * 0.25;
    }
    p.targetScale = hovered === p.data.id ? 1.1 : 1;
    p.baseScale += (p.targetScale - p.baseScale) * 0.12;
    p.body.scale.setScalar(p.baseScale);
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
