// 博物館：環形展廳，八個展台，點展台看展品；看過的蓋章（本機記錄）
import * as THREE from 'three';
import { createStudio, approach } from './studio.js';
import { buildVehicle } from './models.js';
import { MUSEUM } from '../data/museum.js';
import { $, el, topbar, idle, toast } from './ui.js';

topbar('museum');
const S = createStudio($('#c'), { cam: [0, 3.2, 7.5], target: [0, 0.8, 0], floorR: 9, maxD: 12, minD: 2 });
let type = new URLSearchParams(location.search).get('type') || 'drone'; if (!MUSEUM[type]) type = 'drone';
let hall = null, stands = [], cur = 0, tourOn = false, tourT = 0;
let seen = {}; try { seen = JSON.parse(localStorage.getItem('vi.museum') || '{}'); } catch (_) {}

const m = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0.1, wireframe: !!o.w });
const box = (w, h, d, c, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(c)); b.position.set(x, y, z); b.castShadow = true; return b; };
function biplane(c) { const g = new THREE.Group(); g.add(box(1.0, 0.1, 0.12, c)); g.add(box(0.12, 0.02, 1.1, 0xe7d8b4, 0.15, 0.12, 0)); g.add(box(0.12, 0.02, 1.1, 0xe7d8b4, 0.15, -0.06, 0)); g.add(box(0.05, 0.2, 0.3, c, -0.45, 0.08, 0)); return g; }
function fixedwing() { const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.9, 6, 12), m(0xcbd5e1)); f.rotation.z = Math.PI / 2; g.add(f); g.add(box(0.16, 0.015, 1.6, 0xe2e8f0, 0.05)); g.add(box(0.1, 0.18, 0.02, 0xe2e8f0, -0.5, 0.1)); return g; }
function hullOnly(v, extra) { const k = buildVehicle('boat', v); k.group.scale.setScalar(0.7); if (extra) extra(k.group); return k; }
function shapeFor(code) {
  let k = null, g = null;
  switch (code) {
    case 'biplane': g = biplane(0x8b5e34); break;
    case 'biplane2': g = biplane(0xb91c1c); break;
    case 'fixedwing': g = fixedwing(); break;
    case 'quad': k = buildVehicle('drone', 'green'); k.parts.find(p => p.id === 'cage').group.visible = false; k.group.scale.setScalar(1.3); break;
    case 'camdrone': k = buildVehicle('drone', 'blue'); k.parts.find(p => p.id === 'cage').group.visible = false; k.group.scale.setScalar(1.3); k.group.add(box(0.08, 0.08, 0.08, 0x111827, 0, -0.08, 0)); break;
    case 'fpv': k = buildVehicle('drone', 'red'); k.parts.find(p => p.id === 'cage').group.visible = false; k.group.scale.setScalar(1.2); k.group.add(box(0.06, 0.05, 0.05, 0x111827, 0.06, 0.07, 0)); break;
    case 'ball': k = buildVehicle('drone', 'red'); k.group.scale.setScalar(0.9); break;
    case 'swarm': g = new THREE.Group(); for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: [0x3b82f6, 0xef4444, 0xfacc15][i % 3], emissiveIntensity: 1.5 })); const a = i / 40 * Math.PI * 2; s.position.set(Math.cos(a) * 0.5, Math.sin(a * 2) * 0.2, Math.sin(a) * 0.5); g.add(s); } break;
    case 'early': k = buildVehicle('robot', 'titan'); k.group.scale.setScalar(0.9); k.group.traverse(o => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.7 }); }); k.pose?.({ guard: 0, walkAmt: 0.6, walk: 0.8 }); break;
    case 'walker': k = buildVehicle('robot', 'boxer'); k.group.scale.setScalar(0.9); k.pose?.({ guard: 0, walkAmt: 0.8, walk: 1.2 }); break;
    case 'servokit': k = buildVehicle('robot', 'servo'); k.group.scale.setScalar(0.95); break;
    case 'servo': g = new THREE.Group(); g.add(box(0.36, 0.2, 0.18, 0x1e3a8a)); { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 20), m(0xe5e7eb)); h.position.set(0.08, 0.12, 0); g.add(h); g.add(box(0.3, 0.025, 0.05, 0xe5e7eb, 0.18, 0.15, 0)); } break;
    case 'zmp': k = buildVehicle('robot', 'boxer'); k.group.scale.setScalar(0.9); { const s = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.25, 4), new THREE.MeshBasicMaterial({ color: 0xff5a1f, side: THREE.DoubleSide })); s.rotation.x = -Math.PI / 2; s.position.y = 0.01; k.group.add(s); } break;
    case 'boxer': k = buildVehicle('robot', 'boxer'); k.group.scale.setScalar(0.95); break;
    case 'judge': g = new THREE.Group(); [0xef4444, 0xfacc15, 0x3b82f6].forEach((c, i) => { g.add(box(0.3, 0.3 + i * 0.12, 0.3, 0xe2e8f0, (i - 1) * 0.38, 0, 0)); g.add(box(0.22, 0.16, 0.02, c, (i - 1) * 0.38, 0.32 + i * 0.06, 0.16)); }); break;
    case 'estop': g = new THREE.Group(); g.add(box(0.36, 0.2, 0.36, 0xfacc15)); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 24), new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x400000 })); c.position.y = 0.15; g.add(c); } break;
    case 'tesla': k = hullOnly('vhull', g2 => { g2.add(box(0.03, 0.6, 0.03, 0x8b5e34, 0, 0.3, 0.1)); }); break;
    case 'target': k = hullOnly('vhull', g2 => { const t = new THREE.Mesh(new THREE.CircleGeometry(0.25, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })); t.position.set(0, 0.35, 0); g2.add(t); const t2 = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.15, 24), new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })); t2.position.set(0, 0.35, 0.001); g2.add(t2); }); break;
    case 'vhull': case 'vhull2': k = hullOnly('vhull'); break;
    case 'cat': k = hullOnly('catamaran'); break;
    case 'foil': k = hullOnly('foil'); break;
    case 'usv': k = hullOnly('catamaran', g2 => { g2.add(box(0.04, 0.5, 0.04, 0xe2e8f0, 0, 0.3, 0)); g2.add(box(0.3, 0.05, 0.06, 0x111827, 0, 0.55, 0)); }); break;
    case 'solar': k = hullOnly('catamaran', g2 => { g2.add(box(0.55, 0.02, 0.9, 0x1e3a8a, 0, 0.22, 0)); }); break;
    default: g = box(0.4, 0.4, 0.4, 0x94a3b8);
  }
  if (k) return { obj: k.group, kit: k };
  return { obj: g, kit: null };
}

function build() {
  if (hall) S.scene.remove(hall);
  hall = new THREE.Group(); stands = [];
  const M = MUSEUM[type], n = M.items.length, R = 4.2;
  // 展廳牆面
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 4, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xf8fafc, side: THREE.BackSide, roughness: 0.95 })); wall.position.y = 1.65; hall.add(wall);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(7.45, 7.45, 0.25, 48, 1, true), new THREE.MeshStandardMaterial({ color: M.color, side: THREE.BackSide })); band.position.y = 2.6; hall.add(band);
  M.items.forEach((it, i) => {
    const a = i / n * Math.PI * 2, x = Math.sin(a) * R, z = Math.cos(a) * R;
    const st = new THREE.Group(); st.position.set(x, 0, z); st.rotation.y = a;
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.7, 32), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })); ped.position.y = 0.0; ped.castShadow = ped.receiveShadow = true; st.add(ped);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.04, 32), new THREE.MeshStandardMaterial({ color: M.color })); top.position.y = 0.37; st.add(top);
    const { obj, kit } = shapeFor(it.shape); obj.position.y = 0.85; st.add(obj);
    // 年份牌
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const cx = cv.getContext('2d');
    cx.fillStyle = '#0f172a'; cx.fillRect(0, 0, 512, 128); cx.fillStyle = '#ff5a1f'; cx.font = 'bold 44px sans-serif'; cx.fillText(it.year, 20, 54); cx.fillStyle = '#fff'; cx.font = 'bold 40px "Noto Sans TC",sans-serif'; cx.fillText(it.title.slice(0, 11), 20, 108);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); lab.position.set(0, 0.2, 0.63); st.add(lab);
    st.traverse(o => { o.userData.stand = i; });
    hall.add(st); stands.push({ st, obj, kit, a });
  });
  S.scene.add(hall);
  renderSide(); go(0, true);
}
function renderSide() {
  const T = $('#tabs'); T.innerHTML = '';
  for (const [k, v] of Object.entries(MUSEUM)) T.append(el('button', { class: k === type ? 'on' : '', onclick: () => { type = k; history.replaceState(null, '', '?type=' + k); build(); } }, v.name.replace('博物館', '')));
  $('#intro').textContent = MUSEUM[type].intro;
  const L = $('#tl'); L.innerHTML = '';
  MUSEUM[type].items.forEach((it, i) => L.append(el('button', { class: i === cur ? 'on' : '', onclick: () => go(i) }, el('span', { class: 'y' }, it.year), el('span', {}, it.title), el('span', { class: 'stamp' }, seen[type + i] ? '✔' : ''))));
  const n = MUSEUM[type].items.filter((_, i) => seen[type + i]).length;
  $('#prog').textContent = `已蓋章 ${n}/${MUSEUM[type].items.length}`;
}
const camGoal = { pos: new THREE.Vector3(0, 3.2, 7.5), tgt: new THREE.Vector3(0, 0.8, 0) };
let flying = 0;
function go(i, silent) {
  const items = MUSEUM[type].items; cur = (i + items.length) % items.length;
  const it = items[cur], s = stands[cur];
  $('#ex').innerHTML = `<div class="y">${it.year}</div><h2>${it.title}</h2><p>${it.text}</p><div class="learn"><b>學習重點：</b>${it.learn}</div>`;
  const dir = new THREE.Vector3(Math.sin(s.a), 0, Math.cos(s.a));
  camGoal.tgt.copy(s.st.position).setY(0.85);
  camGoal.pos.copy(s.st.position).addScaledVector(dir, -3.6).setY(2.1);
  flying = 1.2;
  seen[type + cur] = 1; try { localStorage.setItem('vi.museum', JSON.stringify(seen)); } catch (_) {}
  renderSide();
  const all = Object.values(MUSEUM).reduce((n, M) => n + M.items.length, 0);
  if (!silent && Object.keys(seen).length === all) toast('三館全部蓋滿！博物館護照完成 🎉', 3500);
}
S.onClick(e => { const h = S.pick(e, stands.map(s => s.st)); if (h) { let o = h.object; while (o && o.userData.stand == null) o = o.parent; if (o) go(o.userData.stand); } });
$('#prev').onclick = () => go(cur - 1); $('#next').onclick = () => go(cur + 1);
$('#tour').onclick = () => { tourOn = true; tourT = 0; };
idle(25000, () => { tourOn = true; tourT = 0; }, () => { tourOn = false; });
S.onFrame((dt, t) => {
  for (const s of stands) { s.obj.rotation.y += dt * 0.5; s.kit?.update(dt, { throttle: 0.5, speed: 0.3, weapon: 0.6 }); }
  if (flying > 0) { flying -= dt; S.camera.position.lerp(camGoal.pos, Math.min(1, dt * 3)); S.controls.target.lerp(camGoal.tgt, Math.min(1, dt * 3)); }
  if (tourOn) { tourT += dt; if (tourT > 7) { tourT = 0; go(cur + 1, true); } }
});
build();
