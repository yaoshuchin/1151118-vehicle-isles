// 共用 3D 島嶼引擎：編輯器與倒數軟體都用這支，確保畫面一致。
// 島的造型沿用「Claude 各版本全攻略」首頁主視覺的低多邊形浮空島風格。
import * as THREE from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/addons/GLTFLoader.js';
import { rigStandee, rigModel, poseRig } from './rig.js';
export { THREE };

export const THEMES = {
  spring: { name: '春綠', grass: 0x8cc56b, grass2: 0x5f9e4a, dirt: 0xb7835a, rock: 0x8a6a52, path: 0xf1dfc4 },
  beach: { name: '海灘', grass: 0xf3dca8, grass2: 0x6fb85a, dirt: 0xd8b07a, rock: 0x9b7d62, path: 0xfff3dc },
  autumn: { name: '秋楓', grass: 0xd9a441, grass2: 0xc9622f, dirt: 0x9c6b47, rock: 0x7a5a46, path: 0xf3e2c4 },
  sakura: { name: '櫻花', grass: 0xa8d58a, grass2: 0xf2a7c3, dirt: 0xb7835a, rock: 0x8a6a52, path: 0xfde8ef },
  snow: { name: '雪國', grass: 0xf4f8fc, grass2: 0x5f8f74, dirt: 0x9fb3c8, rock: 0x6f8094, path: 0xdde8f2 },
  night: { name: '星夜', grass: 0x4f7f6a, grass2: 0x2f5d4c, dirt: 0x6b5144, rock: 0x4a3d39, path: 0xc9c2b0 },
};

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.02, flatShading: true, ...extra });
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function rng(seed) { let s = seed || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// ---------------- 島本體 ----------------
function buildIsland(th, opts) {
  const rnd = rng(7), g = new THREE.Group();
  const top = new THREE.CylinderGeometry(2.25, 2.1, 0.32, 28, 1);
  const p = top.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r > 1.9) { const k = 1 + (rnd() - 0.5) * 0.08; p.setX(i, x * k); p.setZ(i, z * k); } }
  top.computeVertexNormals();
  const grass = new THREE.Mesh(top, mat(th.grass)); grass.position.y = -0.16; grass.userData.surface = true; g.add(grass);
  const dirt = new THREE.Mesh(new THREE.CylinderGeometry(2.12, 1.9, 0.35, 28, 1), mat(th.dirt)); dirt.position.y = -0.48; g.add(dirt);
  const rock = new THREE.ConeGeometry(1.9, 2.2, 14, 3); rock.rotateX(Math.PI);
  const rp = rock.attributes.position;
  for (let i = 0; i < rp.count; i++) { const y = rp.getY(i); if (y < 1.05) { rp.setX(i, rp.getX(i) * (0.85 + rnd() * 0.3)); rp.setZ(i, rp.getZ(i) * (0.85 + rnd() * 0.3)); } }
  rock.computeVertexNormals();
  const rk = new THREE.Mesh(rock, mat(th.rock)); rk.position.y = -1.75; g.add(rk);
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + rnd() * 0.12, 0), mat(th.rock)); const a = rnd() * Math.PI * 2; s.position.set(Math.cos(a) * 1.3, -1.3 - rnd() * 1.2, Math.sin(a) * 1.3); g.add(s); }
  if (opts.plaza !== false) {
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 22), mat(th.path)); plaza.position.y = 0.02; g.add(plaza);
  }
  if (opts.waterfall !== false) {
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.7), new THREE.MeshBasicMaterial({
      map: canvasTex(32, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(150,210,255,.95)'); gr.addColorStop(1, 'rgba(150,210,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }),
      transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    fall.position.set(0.55, -1.08, 2.12); g.add(fall); g.userData.fall = fall;
  }
  return g;
}

function cloud() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
  [[0, 0, 0, 0.28], [0.26, 0.04, 0, 0.22], [-0.26, 0.02, 0, 0.2], [0.1, 0.16, 0, 0.2]].forEach(([x, y, z, r]) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m); s.position.set(x, y, z); g.add(s); });
  return g;
}

// ---------------- 裝飾物件庫 ----------------
const D = {};
D.pine = { name: '松樹', icon: '🌲', build: th => { const t = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.22, 6), mat(0x7a5236)); tr.position.y = 0.11; t.add(tr); [[0.24, 0.44, 0.4], [0.18, 0.34, 0.6], [0.11, 0.24, 0.76]].forEach(([r, h, y]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mat(th.grass2)); c.position.y = y; t.add(c); }); return t; } };
D.roundTree = { name: '圓樹', icon: '🌳', build: th => { const t = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.36, 6), mat(0x7a5236)); tr.position.y = 0.18; t.add(tr); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), mat(th.grass2)); c.position.y = 0.55; t.add(c); const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(th.grass2)); c2.position.set(0.18, 0.5, 0.05); t.add(c2); return t; } };
D.sakura = { name: '櫻花樹', icon: '🌸', build: () => { const t = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.38, 6), mat(0x6b4530)); tr.position.y = 0.19; t.add(tr); [[0, 0.58, 0, 0.3], [0.2, 0.52, 0.06, 0.2], [-0.18, 0.5, -0.04, 0.2], [0, 0.72, 0.1, 0.18]].forEach(([x, y, z, r]) => { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(0xf6b6cd)); c.position.set(x, y, z); t.add(c); }); return t; } };
D.palm = { name: '椰子樹', icon: '🌴', build: () => { const t = new THREE.Group(); for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.17, 6), mat(0x9a6b42)); s.position.set(i * 0.018, 0.085 + i * 0.16, 0); s.rotation.z = -i * 0.05; t.add(s); } for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.55, 4), mat(0x4f9b45)); const a = i / 6 * Math.PI * 2; l.position.set(0.09 + Math.cos(a) * 0.2, 0.8, Math.sin(a) * 0.2); l.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2); t.add(l); } const co = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), mat(0x6b4a2a)); co.position.set(0.1, 0.78, 0.05); t.add(co); return t; } };
D.flowers = { name: '花叢', icon: '🌼', build: () => { const t = new THREE.Group(), r = rng(3); const cols = [0xff6b8a, 0xffd23f, 0xffffff, 0xb085f5, 0xff9f43]; for (let i = 0; i < 7; i++) { const x = (r() - 0.5) * 0.36, z = (r() - 0.5) * 0.36; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 4), mat(0x4f9b45)); st.position.set(x, 0.07, z); t.add(st); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 0), mat(cols[i % 5])); f.position.set(x, 0.15, z); t.add(f); } return t; } };
D.bush = { name: '灌木', icon: '🌿', build: th => { const t = new THREE.Group(); [[0, 0.12, 0, 0.16], [0.14, 0.09, 0.05, 0.11], [-0.13, 0.08, -0.03, 0.1]].forEach(([x, y, z, r]) => { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(th.grass2)); c.position.set(x, y, z); t.add(c); }); return t; } };
D.rock = { name: '石頭', icon: '🪨', build: th => { const t = new THREE.Group(); const a = new THREE.Mesh(new THREE.DodecahedronGeometry(0.17, 0), mat(0x9a948c)); a.position.y = 0.1; a.scale.set(1.2, 0.8, 1); t.add(a); const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), mat(0xaaa49b)); b.position.set(0.18, 0.05, 0.08); t.add(b); return t; } };
D.mushroom = { name: '蘑菇', icon: '🍄', build: () => { const t = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 8), mat(0xfff4ea)); s.position.y = 0.08; t.add(s); const c = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe2412f)); c.position.y = 0.15; t.add(c); for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.02, 5, 4), mat(0xffffff)); const a = i * 1.3; d.position.set(Math.cos(a) * 0.09, 0.23, Math.sin(a) * 0.09); t.add(d); } return t; } };
D.house = { name: '小屋', icon: '🏠', build: () => { const t = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.42, 0.5), mat(0xfff4ea)); b.position.y = 0.21; t.add(b); const r = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.34, 4), mat(0xe2551f)); r.position.y = 0.59; r.rotation.y = Math.PI / 4; r.scale.set(1, 1, 0.85); t.add(r); const d = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.22, 0.02), mat(0x8a5a3a)); d.position.set(0, 0.11, 0.26); t.add(d); [-0.18, 0.18].forEach(x => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), mat(0x9fd3ff, { emissive: 0x335577, emissiveIntensity: 0.3 })); w.position.set(x, 0.25, 0.26); t.add(w); }); return t; } };
D.hut = { name: '海灘小屋', icon: '🛖', build: () => { const t = new THREE.Group(); [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 5), mat(0x9a6b42)); p.position.set(x, 0.18, z); t.add(p); }); const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), mat(0xc79a6b)); f.position.y = 0.12; t.add(f); const r = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 6), mat(0xe8c56a)); r.position.y = 0.5; t.add(r); return t; } };
D.lamp = { name: '路燈', icon: '🏮', build: () => { const t = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.55, 6), mat(0x3b3f46)); p.position.y = 0.275; t.add(p); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), mat(0xfff1a8, { emissive: 0xffc94a, emissiveIntensity: 0.9 })); l.position.y = 0.6; t.add(l); t.userData.anim = (o, tt) => { l.material.emissiveIntensity = 0.7 + Math.sin(tt * 3) * 0.2; }; return t; } };
D.bench = { name: '長椅', icon: '🪑', build: () => { const t = new THREE.Group(); const s = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.14), mat(0xb7794a)); s.position.y = 0.13; t.add(s); const b = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.03), mat(0xb7794a)); b.position.set(0, 0.24, -0.065); t.add(b); [-0.19, 0.19].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.13, 0.12), mat(0x3b3f46)); l.position.set(x, 0.065, 0); t.add(l); }); return t; } };
D.umbrella = { name: '海灘傘', icon: '⛱️', build: () => { const t = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), mat(0xffffff)); p.position.y = 0.35; p.rotation.z = 0.12; t.add(p); const cols = [0xff5a5f, 0xffffff]; for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.18, 8, 1, true, i / 8 * Math.PI * 2, Math.PI / 4), mat(cols[i % 2], { side: THREE.DoubleSide })); s.position.set(0.04, 0.72, 0); t.add(s); } return t; } };
D.lounger = { name: '躺椅', icon: '🏖️', build: () => { const t = new THREE.Group(); const a = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.38), mat(0x4aa3df)); a.position.set(0, 0.1, 0.06); t.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.2), mat(0x4aa3df)); b.position.set(0, 0.17, -0.18); b.rotation.x = -0.7; t.add(b); [[-0.08, 0.2], [0.08, 0.2], [-0.08, -0.08], [0.08, -0.08]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.02), mat(0xffffff)); l.position.set(x, 0.05, z); t.add(l); }); return t; } };
D.campfire = { name: '營火', icon: '🔥', build: () => { const t = new THREE.Group(); for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 5), mat(0x7a5236)); l.rotation.set(Math.PI / 2, i * Math.PI / 4, 0); l.position.y = 0.04; t.add(l); } const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 6), mat(0xff7a1a, { emissive: 0xff5a00, emissiveIntensity: 0.9 })); f1.position.y = 0.17; t.add(f1); const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 6), mat(0xffd23f, { emissive: 0xffc000, emissiveIntensity: 1 })); f2.position.y = 0.15; t.add(f2); t.userData.anim = (o, tt) => { f1.scale.y = 1 + Math.sin(tt * 12) * 0.15; f2.scale.y = 1 + Math.cos(tt * 15) * 0.2; f1.rotation.y = tt * 2; }; return t; } };
D.windmill = { name: '風車', icon: '🎡', build: () => { const t = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.7, 8), mat(0xfff4ea)); b.position.y = 0.35; t.add(b); const r = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.18, 8), mat(0xe2551f)); r.position.y = 0.79; t.add(r); const hub = new THREE.Group(); hub.position.set(0, 0.62, 0.16); t.add(hub); for (let i = 0; i < 4; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.36, 0.01), mat(0xd9c9b0)); bl.position.y = 0.18; const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; arm.add(bl); hub.add(arm); } t.userData.anim = (o, tt, dt) => { hub.rotation.z -= dt * 1.5; }; return t; } };
D.flag = { name: '旗子', icon: '🚩', build: () => { const t = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), mat(0x777777)); p.position.y = 0.3; t.add(p); const f = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.01), mat(0xe2551f)); f.position.set(0.11, 0.52, 0); t.add(f); t.userData.anim = (o, tt) => { f.rotation.y = Math.sin(tt * 3) * 0.35; }; return t; } };
D.chest = { name: '寶箱', icon: '🧰', build: () => { const t = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.2), mat(0xa0632f)); b.position.y = 0.08; t.add(b); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8, 1, false, 0, Math.PI), mat(0xb8743a)); l.rotation.z = Math.PI / 2; l.position.y = 0.16; t.add(l); const g = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), mat(0xffd23f, { emissive: 0xaa8800, emissiveIntensity: 0.3 })); g.position.set(0, 0.15, 0.105); t.add(g); return t; } };
D.balloon = { name: '愛心氣球', icon: '🎈', build: () => { const t = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.55, 4), mat(0xffffff)); s.position.y = 0.3; t.add(s); const sh = new THREE.Shape(); sh.moveTo(0, -0.12); sh.bezierCurveTo(-0.2, 0.0, -0.12, 0.14, 0, 0.06); sh.bezierCurveTo(0.12, 0.14, 0.2, 0, 0, -0.12); const h = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), mat(0xff4f7b, { flatShading: false, roughness: 0.35 })); h.position.set(0, 0.68, -0.03); t.add(h); t.userData.anim = (o, tt) => { h.position.y = 0.68 + Math.sin(tt * 1.6) * 0.04; h.rotation.y = Math.sin(tt) * 0.4; }; return t; } };
D.star = { name: '星星', icon: '⭐', build: () => { const t = new THREE.Group(); const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.07 : 0.16, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const s = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 }), mat(0xffd23f, { emissive: 0xffa500, emissiveIntensity: 0.35 })); s.position.y = 0.55; t.add(s); t.userData.anim = (o, tt) => { s.rotation.y = tt * 1.2; s.position.y = 0.55 + Math.sin(tt * 2) * 0.05; }; return t; } };
D.sign = { name: '標題看板', icon: '🪧', build: (th, item) => { const t = new THREE.Group(); [-0.25, 0.25].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 5), mat(0x7a5236)); p.position.set(x, 0.25, 0); t.add(p); }); const text = (item && item.text) || '加油！'; const tex = canvasTex(512, 200, (c, w, h) => { c.fillStyle = '#fff6e8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b7794a'; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14); c.fillStyle = '#3b2a1f'; c.font = 'bold 92px "Noto Sans TC","Microsoft JhengHei",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 4, w - 40); }); const b = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.26, 0.03), [mat(0xb7794a), mat(0xb7794a), mat(0xb7794a), mat(0xb7794a), new THREE.MeshBasicMaterial({ map: tex }), mat(0xb7794a)]); b.position.y = 0.48; t.add(b); return t; } };
export const DECOR = D;

// ---------------- 人物 ----------------
const texCache = new Map(), glbCache = new Map();
const gltf = new GLTFLoader();
function loadTex(url) {
  if (!texCache.has(url)) texCache.set(url, new Promise((ok, no) => new THREE.TextureLoader().load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; ok(t); }, undefined, no)));
  return texCache.get(url);
}
function loadGLB(url) {
  if (!glbCache.has(url)) glbCache.set(url, new Promise((ok, no) => gltf.load(url, g => ok(g.scene), undefined, no)));
  return glbCache.get(url).then(s => s.clone(true));
}
function shadowBlob(r = 0.28) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; return m;
}

function buildStandee(url, item) {
  const g = new THREE.Group(); const H = 1.15;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 20), mat(0xffffff, { flatShading: false })); base.position.y = 0.02; g.add(base);
  g.add(shadowBlob(0.3));
  const card = new THREE.Group(); card.position.y = 0.035; g.add(card); g.userData.billboard = card;
  loadTex(url).then(t => {
    const a = t.image.width / t.image.height;
    const mt = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide });
    let m; try { const r = rigStandee(t, H * a, H, mt); m = r.mesh; g.userData.rig = r.rig; }
    catch (e) { console.warn('立牌綁骨架失敗，改用靜態', e); m = new THREE.Mesh(new THREE.PlaneGeometry(H * a, H), mt); m.position.y = H / 2; }
    card.add(m);
  }).catch(e => console.warn('立牌載入失敗', url, e));
  return g;
}

function buildGLBChar(url, item, style) {
  const g = new THREE.Group(); g.add(shadowBlob(0.3));
  const holder = new THREE.Group(); g.add(holder); g.userData.body = holder;
  const H = style === 'C' ? 0.95 : 1.15;
  loadGLB(url).then(s => {
    s.traverse(o => { if (o.isMesh) { if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); const old = o.material; const hasVC = !!o.geometry.attributes.color; const m = new THREE.MeshStandardMaterial({ map: old && old.map || null, color: old && old.map ? 0xffffff : (hasVC ? 0xffffff : (old && old.color) || 0xdddddd), vertexColors: hasVC, roughness: 0.62, metalness: 0.0, side: THREE.DoubleSide }); o.material = m; } });
    try { g.userData.rig = rigModel(s); } catch (e) { console.warn('3D 人物綁骨架失敗，改用靜態', e); }
    const box = new THREE.Box3().setFromObject(s), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const k = H / (size.y || 1); s.scale.setScalar(k); s.position.set(-c.x * k, -box.min.y * k, -c.z * k);
    holder.add(s);
  }).catch(e => console.warn('3D 模型載入失敗', url, e));
  return g;
}

// ---------------- 世界 ----------------
export class IslandWorld {
  constructor(canvas, opts = {}) {
    this.opts = opts; this.canvas = canvas;
    this.resolve = opts.resolve || (s => s);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: !!opts.preserve });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
    this.hemi = new THREE.HemisphereLight(0xfff8ef, 0xd9a882, 1.5); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.0); this.sun.position.set(4, 7, 5); this.scene.add(this.sun);
    this.world = new THREE.Group(); this.scene.add(this.world);
    this.isl = new THREE.Group(); this.world.add(this.isl);
    this.items = new Map(); this.clouds = [];
    this.yaw = -0.35; this.yawV = 0; this.zoom = 1; this.lookY = opts.lookY ?? -0.45;
    this.tiltX = 0; this.tiltY = 0; this.tx = 0; this.ty = 0;
    this.spin = 0.18; this.lastAct = 0; this.dragging = false;
    this.party = 0; this.confetti = null;
    this.clock = new THREE.Clock(); this.ray = new THREE.Raycaster(); this.ndc = new THREE.Vector2();
    this.selBox = null; this.onFrame = null;
    new ResizeObserver(() => this.resize()).observe(canvas.parentElement || canvas);
    this.resize();
    const loop = () => { this.frame(); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  }

  resize() {
    const el = this.canvas.parentElement || this.canvas, r = el.getBoundingClientRect(); if (!r.width) return;
    this.renderer.setSize(r.width, r.height, false); this.cam.aspect = r.width / r.height; this.frameCam();
  }
  frameCam() {
    // 依視窗比例自動算距離：寬度要塞得下整座島（fitW），高度要塞得下島＋人物（fitH）
    const a = this.cam.aspect, tv = Math.tan(THREE.MathUtils.degToRad(this.cam.fov / 2));
    const fitW = this.opts.fitW || 5.6, fitH = this.opts.fitH || 5.0;
    const d = Math.max((fitW / 2) / (tv * a), (fitH / 2) / tv) / this.zoom;
    this.cam.position.set(0, 3.9 * d / 8.6, d); this.cam.lookAt(0, this.lookY, 0); this.cam.updateProjectionMatrix();
  }
  setZoom(z) { this.zoom = Math.max(0.55, Math.min(2.2, z)); this.frameCam(); }

  setScene(sc) {
    this.sc = sc; const th = THEMES[sc.theme] || THEMES.spring; this.th = th;
    if (this.base) this.isl.remove(this.base);
    this.base = buildIsland(th, { waterfall: sc.waterfall !== false, plaza: sc.plaza !== false }); this.isl.add(this.base);
    this.surface = this.base.children.find(o => o.userData.surface);
    this.clouds.forEach(c => this.world.remove(c)); this.clouds = [];
    if (sc.clouds !== false) this.clouds = [[-2.9, 0.9, -1.2], [2.7, 1.5, -1.6], [2.4, -1.1, 1.0], [-2.6, -0.8, 0.8]].map(([x, y, z], i) => { const c = cloud(); c.position.set(x, y, z); c.scale.setScalar(0.9 + (i % 2) * 0.4); c.userData.home = c.position.clone(); this.world.add(c); return c; });
    this.spin = sc.spin ?? 0.18;
    const night = sc.theme === 'night'; this.hemi.intensity = night ? 0.9 : 1.5; this.sun.intensity = night ? 1.1 : 2.0;
    [...this.items.keys()].forEach(id => this.removeItem(id));
    (sc.items || []).forEach(it => this.addItem(it));
  }

  addItem(it) {
    let obj;
    if (it.type === 'char') {
      const url = this.resolve(it.src);
      obj = (it.style === 'A' || /\.(png|webp|jpe?g)$/i.test(it.src)) ? buildStandee(url, it) : buildGLBChar(url, it, it.style);
      obj.userData.isChar = true;
    } else {
      const d = DECOR[it.kind]; if (!d) return null; obj = d.build(this.th, it);
    }
    const wrap = new THREE.Group(); wrap.add(obj); wrap.userData = { id: it.id, item: it, inner: obj, phase: Math.random() * 6, bounce: 0 };
    this.isl.add(wrap); this.items.set(it.id, wrap); this.applyItem(it); return wrap;
  }
  applyItem(it) {
    const w = this.items.get(it.id); if (!w) return; w.userData.item = it;
    w.position.set(it.x || 0, 0, it.z || 0); w.rotation.y = (it.rot || 0) * Math.PI / 180; w.scale.setScalar(it.scale || 1);
  }
  rebuildItem(it) { this.removeItem(it.id); this.addItem(it); }
  removeItem(id) { const w = this.items.get(id); if (!w) return; this.isl.remove(w); this.items.delete(id); if (this.selId === id) this.select(null); }

  select(id) {
    this.selId = id;
    if (this.selBox) { this.scene.remove(this.selBox); this.selBox = null; }
    if (id && this.items.get(id)) { this.selBox = new THREE.BoxHelper(this.items.get(id), 0xe2551f); this.scene.add(this.selBox); }
  }

  setPointer(x, y) { this.tx = x; this.ty = y; }
  toNdc(cx, cy) { const r = this.canvas.getBoundingClientRect(); return [(cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1]; }
  pickItem(cx, cy) {
    const [x, y] = this.toNdc(cx, cy); this.ndc.set(x, y); this.ray.setFromCamera(this.ndc, this.cam);
    const hits = this.ray.intersectObjects([...this.items.values()], true);
    for (const h of hits) { let o = h.object; while (o && !o.userData?.id) o = o.parent; if (o) return o.userData.id; }
    return null;
  }
  pickSurface(cx, cy) {
    const [x, y] = this.toNdc(cx, cy); this.ndc.set(x, y); this.ray.setFromCamera(this.ndc, this.cam);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.isl.updateMatrixWorld(); const inv = this.isl.matrixWorld.clone().invert();
    const r2 = this.ray.ray.clone().applyMatrix4(inv); const p = new THREE.Vector3();
    if (!r2.intersectPlane(plane, p)) return null;
    const d = Math.hypot(p.x, p.z); if (d > 2.15) return null;
    return { x: +p.x.toFixed(3), z: +p.z.toFixed(3) };
  }
  hitTest(cx, cy) {
    const [x, y] = this.toNdc(cx, cy); if (Math.abs(x) > 1 || Math.abs(y) > 1) return false;
    this.ndc.set(x, y); this.ray.setFromCamera(this.ndc, this.cam);
    return this.ray.intersectObject(this.isl, true).some(h => !(h.object.material && h.object.material.alphaTest > 0 && h.uv && this._alphaAt(h)));
  }
  _alphaAt(h) { // 立牌透明處不算命中（讓滑鼠穿透到後面的視窗）
    const img = h.object.material.map && h.object.material.map.image; if (!img) return false;
    if (!img._ctx) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; img._ctx = c.getContext('2d', { willReadFrequently: true }); img._ctx.drawImage(img, 0, 0); }
    const px = img._ctx.getImageData(Math.floor(h.uv.x * (img.width - 1)), Math.floor((1 - h.uv.y) * (img.height - 1)), 1, 1).data; return px[3] < 30;
  }

  celebrate(sec = 4) {
    this.party = sec;
    this.items.forEach(w => { w.userData.bounce = 1; });
    if (this.confetti) this.world.remove(this.confetti);
    const g = new THREE.Group(), cols = [0xff4f7b, 0xffd23f, 0x4aa3df, 0x7cc46a, 0xe2551f, 0xb085f5];
    for (let i = 0; i < 140; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.11), new THREE.MeshBasicMaterial({ color: cols[i % 6], side: THREE.DoubleSide }));
      m.position.set((Math.random() - 0.5) * 1.2, 1.2 + Math.random() * 0.5, (Math.random() - 0.5) * 1.2);
      m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 3.2, 2.5 + Math.random() * 2.5, (Math.random() - 0.5) * 3.2);
      m.userData.w = new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0); g.add(m);
    }
    this.confetti = g; this.world.add(g);
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05), t = this.clock.elapsedTime;
    if (!this.dragging) { this.yaw += this.yawV; this.yawV *= 0.93; if (performance.now() - this.lastAct > 2500) this.yaw += dt * this.spin; }
    const k = 1 - Math.pow(0.002, dt);
    this.tiltX += (-this.ty * 0.12 - this.tiltX) * k; this.tiltY += (this.tx * 0.15 - this.tiltY) * k;
    this.world.rotation.set(this.tiltX, this.tiltY, 0); this.isl.rotation.y = this.yaw;
    this.isl.position.y = Math.sin(t * 0.9) * 0.08;
    this.clouds.forEach((c, i) => { c.position.x = c.userData.home.x + Math.sin(t * 0.3 + i) * 0.25; c.position.y = c.userData.home.y + Math.cos(t * 0.4 + i * 2) * 0.12; });
    if (this.base && this.base.userData.fall) this.base.userData.fall.material.opacity = 0.85 + Math.sin(t * 6) * 0.1;
    const v = new THREE.Vector3();
    this.items.forEach(w => {
      const u = w.userData, inner = u.inner, it = u.item;
      u.bounce = Math.max(0, u.bounce - dt * (this.party > 0 ? 0.9 : 1.5));
      if (this.party > 0 && u.bounce <= 0) u.bounce = 1;
      const jump = Math.sin(u.bounce * Math.PI);
      if (inner.userData.isChar) {
        // 人物動作：idle 輕輕搖擺｜none 靜止｜patrol 左右來回走｜wander 繞圈散步｜dance 跳舞轉圈｜hop 原地蹦跳
        const a = it.anim || 'idle', ph = u.phase, body = inner.userData.body, card = inner.userData.billboard, sc = it.scale || 1;
        let ox = 0, oz = 0, y = 0, face = 0, tilt = 0, spin = 0, sx = 1, sy = 1, step = false;
        // 2026-11-01 調柔和：彈跳、晃動減半、步伐放慢；立牌不轉圈不翻面（避免露出紙片側邊）
        const flat = !!card;
        if (a === 'idle') { const b = Math.sin(t * 1.6 + ph); sy = 1 + b * 0.015; sx = 1 - b * 0.008; face = Math.sin(t * 0.6 + ph) * 0.3; tilt = Math.sin(t * 0.9 + ph) * 0.035; }
        else if (a === 'patrol') { const q = t * 0.5 + ph; ox = Math.sin(q) * 0.6; face = Math.cos(q) >= 0 ? Math.PI / 2 : -Math.PI / 2; step = true; }
        else if (a === 'wander') { const q = t * 0.42 + ph, r = 0.45; ox = Math.cos(q) * r - r; oz = Math.sin(q) * r; face = -q; step = true; }
        else if (a === 'dance') { spin = flat ? 0 : t * 1.8 + ph; const b = Math.sin(t * 4 + ph); y = Math.abs(b) * 0.06; tilt = b * 0.12; ox = Math.sin(t * 1.2 + ph) * 0.08; face = spin; }
        else if (a === 'hop') { const p = (t * 1.0 + ph) % 1, land = Math.max(0, 1 - Math.min(p, 1 - p) / 0.12); y = 4 * p * (1 - p) * 0.25; sy = 1 - land * 0.12; sx = 1 + land * 0.08; }
        if (step) { const s = Math.sin(t * 5.5 + ph); y = Math.abs(s) * 0.03; tilt = s * 0.06; }
        if (ox || oz) { // 走動時不要走出島外
          const r = (it.rot || 0) * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
          for (let k = 0; k < 8; k++) { const wx = (it.x || 0) + c * ox + sn * oz, wz = (it.z || 0) - sn * ox + c * oz; if (Math.hypot(wx, wz) < 1.9) break; ox *= 0.8; oz *= 0.8; }
        }
        inner.position.set(ox / sc, y + jump * 0.35, oz / sc);
        if (inner.userData.rig) poseRig(inner.userData.rig, a, t, ph, Math.min(1, (y + jump * 0.35) / 0.3), this.party > 0);
        // 3D 人物：平滑轉向（跳舞直接跟著轉）
        if (u.f === undefined) u.f = face;
        if (a === 'dance') u.f = face; else { let d = face - u.f; d = Math.atan2(Math.sin(d), Math.cos(d)); u.f += d * Math.min(1, dt * 8); }
        const partySpin = this.party > 0 ? (1 - u.bounce) * Math.PI * 2 : 0;
        if (body) { body.rotation.y = u.f + partySpin; body.rotation.z = tilt; body.scale.set(sx, sy, sx); }
        if (card) {
          // 真人立牌：永遠正面朝鏡頭（不轉圈、不翻面），只用扭腰與手腳擺動表現動作
          this.cam.getWorldPosition(v); card.parent.worldToLocal(v);
          card.rotation.y = Math.atan2(v.x, v.z);
          card.rotation.z = tilt; card.scale.set(sx, sy, 1);
        }
      } else {
        inner.position.y = jump * 0.35;
      }
      if (inner.userData.anim) inner.userData.anim(inner, t, dt);
    });
    if (this.party > 0) this.party -= dt;
    if (this.confetti) {
      let alive = 0; this.confetti.children.forEach(m => { const vv = m.userData.v; vv.y -= 4.2 * dt; vv.multiplyScalar(0.992); m.position.addScaledVector(vv, dt); m.rotation.x += m.userData.w.x * dt; m.rotation.y += m.userData.w.y * dt; if (m.position.y > -4) alive++; });
      if (!alive) { this.world.remove(this.confetti); this.confetti = null; }
    }
    if (this.selBox) this.selBox.update();
    if (this.onFrame) this.onFrame(dt, t);
    this.renderer.render(this.scene, this.cam);
  }
}

// 島嶼場景預設值
export function defaultScene() {
  return {
    version: 1, appName: '島嶼倒數', title: '專心倒數中', minutes: 5, seconds: 0,
    theme: 'beach', spin: 0.18, clouds: true, waterfall: true, plaza: true, size: 'M', timeColor: '#ffffff',
    music: { src: 'lib:sounds/music_island_lofi.wav', volume: 0.45, onlyRunning: true },
    endSound: { src: 'lib:sounds/end_fanfare.wav', volume: 0.9 }, tick: true,
    items: [
      { id: 'd1', type: 'decor', kind: 'palm', x: -1.35, z: -0.9, rot: 0, scale: 1.1 },
      { id: 'd2', type: 'decor', kind: 'palm', x: 1.5, z: -0.7, rot: 40, scale: 0.95 },
      { id: 'd3', type: 'decor', kind: 'umbrella', x: 0.9, z: 0.95, rot: 0, scale: 1 },
      { id: 'd4', type: 'decor', kind: 'lounger', x: 1.35, z: 0.55, rot: -30, scale: 1 },
      { id: 'd5', type: 'decor', kind: 'hut', x: -0.2, z: -1.45, rot: 0, scale: 1 },
      { id: 'd6', type: 'decor', kind: 'flowers', x: -1.3, z: 0.75, rot: 0, scale: 1 },
      { id: 'd7', type: 'decor', kind: 'balloon', x: -0.75, z: 1.2, rot: 0, scale: 1 },
    ],
  };
}
