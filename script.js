import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =====================================================
   1. МЕНЮ И КНОПКА СВЯЗИ
   ===================================================== */
const nav = document.getElementById("nav");
document.getElementById("burger").addEventListener("click", () => nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

const fabList = document.getElementById("fab-list");
document.getElementById("fab-btn").addEventListener("click", () => fabList.classList.toggle("open"));

/* =====================================================
   2. ФОРМА ЗАПИСИ -> открывает Telegram с текстом
   !!! Замените your_telegram на ник администратора (без @)
   ===================================================== */
const TELEGRAM_USERNAME = "your_telegram";

document.getElementById("booking-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text =
    `Здравствуйте! Хочу записаться.\n` +
    `Имя: ${document.getElementById("f-name").value}\n` +
    `Телефон: ${document.getElementById("f-phone").value}\n` +
    `Услуга: ${document.getElementById("f-service").value}\n` +
    `Дата: ${document.getElementById("f-date").value}`;
  window.open(`https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`, "_blank");
});

/* =====================================================
   3. 3D-СЦЕНА
   ===================================================== */
const container = document.getElementById("viewer");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 0.4, 6.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Свет
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const key = new THREE.DirectionalLight(0xfff1d6, 1.6);
key.position.set(3, 4, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0x88aaff, 0.8);
rim.position.set(-4, 2, -3);
scene.add(rim);

// Управление мышью/пальцем
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 9;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.2;
controls.target.set(0, 0.2, 0);
controls.addEventListener("start", () => (controls.autoRotate = false));

function resize() {
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

/* ---------- Голова ---------- */
const skin = new THREE.MeshStandardMaterial({ color: 0xe0b48f, roughness: 0.7 });
const dark = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
const shirt = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.9 });

const person = new THREE.Group();
scene.add(person);

const head = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), skin);
head.scale.set(0.92, 1.12, 1);
person.add(head);

const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.46, 0.9, 24), skin);
neck.position.y = -1.25;
person.add(neck);

const shoulders = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 16), shirt);
shoulders.scale.set(1.2, 0.5, 0.7);
shoulders.position.y = -2.15;
person.add(shoulders);

// Лицо
[-0.33, 0.33].forEach(x => {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), dark);
  eye.position.set(x, 0.1, 0.9);
  person.add(eye);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), dark);
  brow.position.set(x, 0.3, 0.93);
  person.add(brow);
  const ear = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skin);
  ear.scale.set(0.4, 1, 0.7);
  ear.position.set(x * 2.75, 0, 0);
  person.add(ear);
});
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.35, 16), skin);
nose.position.set(0, -0.1, 1.02);
nose.rotation.x = Math.PI / 2.4;
person.add(nose);
const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.045, 0.05), new THREE.MeshStandardMaterial({ color: 0x8a4a42 }));
mouth.position.set(0, -0.5, 0.92);
person.add(mouth);

/* ---------- Борода ---------- */
const beardMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.9 });
const beard = new THREE.Group();
const beardMain = new THREE.Mesh(new THREE.SphereGeometry(1.02, 40, 24, 0, Math.PI * 2, 1.75, 0.95), beardMat);
beardMain.scale.set(0.95, 1.15, 1.04);
beardMain.rotation.x = 0.1;
beard.add(beardMain);
const stache = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.12), beardMat);
stache.position.set(0, -0.38, 0.97);
beard.add(stache);
beard.visible = false;
person.add(beard);

/* =====================================================
   4. ПРИЧЁСКИ (собираем из простых фигур)
   Радиус головы ~1, волосы чуть больше (1.06)
   ===================================================== */
let hairColor = 0x1a1410;
const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.85 });

// шапочка из волос: coverage — насколько вниз спускается (в радианах от макушки)
function cap(coverage, r = 1.06) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32, 0, Math.PI * 2, 0, coverage), hairMat);
  m.scale.set(0.92, 1.12, 1);
  m.rotation.x = -0.18; // чуть наклон, чтобы лоб был открыт
  return m;
}

// случайные числа с фиксированным "зерном", чтобы кудри всегда выглядели одинаково
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

const STYLES = {
  crop: {
    name: "Кроп / Фейд",
    desc: "Короткие виски и затылок, чуть длиннее сверху. Аккуратно, быстро в уходе.",
    build() {
      const g = new THREE.Group();
      g.add(cap(1.55, 1.045));
      const top = new THREE.Mesh(new THREE.SphereGeometry(1.09, 40, 24, 0, Math.PI * 2, 0, 0.9), hairMat);
      top.scale.set(0.92, 1.12, 1);
      top.rotation.x = -0.18;
      g.add(top);
      return g;
    }
  },
  pompadour: {
    name: "Помпадур",
    desc: "Объёмный начёс вверх и назад, короткие бока. Классика с характером.",
    build() {
      const g = new THREE.Group();
      g.add(cap(1.6, 1.045));
      const quiff = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 24), hairMat);
      quiff.scale.set(1.05, 0.7, 1.35);
      quiff.position.set(0, 1.05, 0.35);
      quiff.rotation.x = -0.45;
      g.add(quiff);
      return g;
    }
  },
  mohawk: {
    name: "Могавк",
    desc: "Полоса волос по центру, выбритые бока. Для смелых.",
    build() {
      const g = new THREE.Group();
      const sides = cap(1.5, 1.02);
      sides.material = new THREE.MeshStandardMaterial({ color: 0x3a2f28, roughness: 1 });
      g.add(sides);
      for (let i = 0; i < 11; i++) {
        const a = -0.9 + i * 0.2;                       // угол вдоль головы
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45 + Math.sin(i / 10 * Math.PI) * 0.35, 0.3), hairMat);
        b.position.set(0, Math.cos(a) * 1.15 + 0.15, Math.sin(a) * 1.1);
        b.rotation.x = a * 0.9;
        g.add(b);
      }
      return g;
    }
  },
  long: {
    name: "Длинные волосы",
    desc: "Волосы до плеч с чёлкой. Для тех, кто любит свободу и стиль.",
    build() {
      const g = new THREE.Group();
      g.add(cap(1.75, 1.07));
      const back = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), hairMat);
      back.scale.set(1.0, 1.55, 0.55);
      back.position.set(0, -0.55, -0.55);
      g.add(back);
      [-1, 1].forEach(s => {
        const side = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), hairMat);
        side.scale.set(0.4, 1.7, 0.7);
        side.position.set(s * 0.93, -0.3, -0.1);
        g.add(side);
      });
      const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 16, 0, Math.PI * 2, 0, 0.5), hairMat);
      fringe.scale.set(1, 0.6, 0.6);
      fringe.position.set(0, 0.85, 0.75);
      g.add(fringe);
      return g;
    }
  },
  curly: {
    name: "Кудри",
    desc: "Объёмные естественные кудри. Подчёркиваем текстуру и форму.",
    build() {
      const g = new THREE.Group();
      g.add(cap(1.45, 1.0));
      const rand = rng(42);
      for (let i = 0; i < 110; i++) {
        const theta = rand() * 1.5;                // от макушки вниз
        const phi = rand() * Math.PI * 2;
        const r = 1.08;
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.2 + rand() * 0.1, 12, 10), hairMat);
        c.position.set(
          Math.sin(theta) * Math.cos(phi) * r * 0.92,
          Math.cos(theta) * r * 1.12 + 0.05,
          Math.sin(theta) * Math.sin(phi) * r
        );
        g.add(c);
      }
      return g;
    }
  }
};

let currentKey = "crop";
let hairGroup = null;

function showStyle(key) {
  currentKey = key;
  if (hairGroup) person.remove(hairGroup);
  hairGroup = STYLES[key].build();
  person.add(hairGroup);
  document.getElementById("style-name").textContent = STYLES[key].name;
  document.getElementById("style-desc").textContent = STYLES[key].desc;
  document.querySelectorAll("#style-chips .chip").forEach(c => c.classList.toggle("active", c.dataset.key === key));
}

/* ---------- Кнопки причёсок ---------- */
const chipsBox = document.getElementById("style-chips");
Object.entries(STYLES).forEach(([key, s]) => {
  const b = document.createElement("button");
  b.className = "chip";
  b.dataset.key = key;
  b.textContent = s.name;
  b.addEventListener("click", () => showStyle(key));
  chipsBox.appendChild(b);
});

/* ---------- Цвета волос ---------- */
const COLORS = [0x1a1410, 0x4a3020, 0x8a5a2b, 0xd2b070, 0xb0b0b0, 0xa02828];
const colorBox = document.getElementById("color-chips");
COLORS.forEach((hex, i) => {
  const s = document.createElement("button");
  s.className = "swatch" + (i === 0 ? " active" : "");
  s.style.background = "#" + hex.toString(16).padStart(6, "0");
  s.addEventListener("click", () => {
    hairMat.color.setHex(hex);
    colorBox.querySelectorAll(".swatch").forEach(x => x.classList.remove("active"));
    s.classList.add("active");
  });
  colorBox.appendChild(s);
});

/* ---------- Борода ---------- */
document.getElementById("beard-toggle").addEventListener("change", (e) => {
  beard.visible = e.target.checked;
});

/* =====================================================
   5. ЗАПУСК
   ===================================================== */
showStyle("crop");
document.getElementById("loading")?.remove();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
