// 群島首頁：中央島（認識機械＋三座博物館）＋三座競技島＋工坊島＋簡報島
import * as THREE from 'three';
import { createStudio } from './studio.js';
import { buildVehicle, VARIANTS, TYPE_NAME, variantOf } from './models.js';
import { $, el, topbar, idle } from './ui.js';

topbar('hub');
const ISLANDS = [
  { id: 'core', name: '中央島・認識機械', sub: '機構拆解車庫', color: 0xff5a1f, ic: '核', x: 0, z: 0, r: 4.2,
    desc: '選好載具後在這裡拆開它：爆炸分解、X 光透視、點出零件測驗、照順序組裝挑戰。右邊讀數全部來自同一組機構數學。',
    acts: [['進入拆解車庫', () => `garage.html?type=${me.type}&v=${me.variant}`]] },
  { id: 'mdrone', name: '無人機博物館', sub: '從空中魚雷到球籠足球', color: 0x3b82f6, ic: '館', x: -5.2, z: -4.6, r: 1.9, desc: '八件展品看無人機一百多年的演進。', acts: [['進館參觀', () => 'museum.html?type=drone']] },
  { id: 'mrobot', name: '格鬥機器人博物館', sub: '從早期人形到擂台拳擊', color: 0xef4444, ic: '館', x: 0, z: -6.6, r: 1.9, desc: '人形機器人怎麼站穩、怎麼出拳、格鬥賽怎麼判倒地。', acts: [['進館參觀', () => 'museum.html?type=robot']] },
  { id: 'mboat', name: '無人船博物館', sub: '從特斯拉遙控船到 USV', color: 0x14b8a6, ic: '館', x: 5.2, z: -4.6, r: 1.9, desc: 'V 底、雙體、水翼三種船型的原理與歷史。', acts: [['進館參觀', () => 'museum.html?type=boat']] },
  { id: 'soccer', name: '無人機足球島', sub: '1 對 1・3 對 3・穿環練習', color: 0x16a34a, ic: '球', x: -11, z: 3, r: 3.2,
    desc: '只有攻擊手穿過對方的環才算分。可以跟電腦對打，老師開房後手機掃 QR 就能 3 對 3。', acts: [['3 對 3', () => 'arena.html?game=soccer&mode=3v3'], ['1 對 1', () => 'arena.html?game=soccer&mode=1v1'], ['穿環練習', () => 'arena.html?game=soccer&mode=practice']] },
  { id: 'combat', name: '格鬥機器人島', sub: '1 對 1 擂台', color: 0xdc2626, ic: '鬥', x: 0, z: 9, r: 3.2,
    desc: '人形機器人擂台：出拳、踢腿、格擋；倒地 10 秒或倒地 3 次判輸，時間到比有效打擊。', acts: [['1 對 1 對戰', () => 'arena.html?game=combat&mode=1v1'], ['沙包練習', () => 'arena.html?game=combat&mode=drill']] },
  { id: 'boat', name: '水道競速島', sub: '5 船・3 圈・浮標罰秒', color: 0x0284c7, ic: '船', x: 11, z: 3, r: 3.2,
    desc: '五艘船同時出發，切浮標罰 2 秒。水翼船要超過起飛速度才會變快。', acts: [['5 船競速', () => 'arena.html?game=boat&mode=race'], ['單人計時', () => 'arena.html?game=boat&mode=time']] },
  { id: 'forge', name: '載具工坊島', sub: '生成器：設計自己的載具', color: 0x9333ea, ic: '工', x: -8, z: 9.5, r: 2.4,
    desc: '調參數生成自己的載具 3D 模型，匯出 GLB 給 Blender、匯出技能包給 AI，或請 AI 依需求幫你調。', acts: [['進入工坊', () => 'forge.html']] },
  { id: 'deck', name: '課程島', sub: '互動簡報＋排行榜', color: 0xca8a04, ic: '課', x: 8, z: 9.5, r: 2.4,
    desc: '四篇互動簡報：每一頁都能動手，每天最後打包一個安裝包，交給 AI 做出自己的網頁。第三天用載具島工坊生成自己的載具島。', acts: [['打開互動簡報', () => 'course/'], ['載具島工坊（生成平台）', () => 'https://aliang-vehicle-forge.netlify.app'], ['排行榜', () => 'board.html']] }
];
const BRIDGES = [['core', 'mdrone'], ['core', 'mrobot'], ['core', 'mboat'], ['core', 'soccer'], ['core', 'combat'], ['core', 'boat'], ['combat', 'forge'], ['combat', 'deck'], ['soccer', 'forge'], ['boat', 'deck']];

let me = { type: 'drone', variant: 'red' };
try { me = { ...me, ...JSON.parse(localStorage.getItem('vi.vehicle') || '{}') }; } catch (_) {}

const S = createStudio($('#c'), { bg: 0xa5d8f3, fog: true, fogNear: 30, fogFar: 70, floor: false, cam: [0, 20, 24], target: [0, 0, 2], maxD: 45, minD: 8, shadowSize: 18 });
S.scene.fog.color.setHex(0xa5d8f3);
const sea = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ color: 0x2b8fd0, roughness: 0.3, metalness: 0.1 })); sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; S.scene.add(sea);
const byId = {};
const clickables = [];
for (const I of ISLANDS) {
  const g = new THREE.Group(); g.position.set(I.x, 0, I.z);
  const cliff = new THREE.Mesh(new THREE.CylinderGeometry(I.r, I.r * 1.12, 1.2, 9), new THREE.MeshStandardMaterial({ color: 0xd6c08d, roughness: 0.9, flatShading: true })); cliff.position.y = 0.3; cliff.castShadow = cliff.receiveShadow = true; g.add(cliff);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(I.r * 0.96, I.r, 0.25, 9), new THREE.MeshStandardMaterial({ color: I.id === 'core' ? 0x84cc16 : 0x65a30d, roughness: 0.95, flatShading: true })); top.position.y = 0.98; top.receiveShadow = true; g.add(top);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(I.r * 0.5, I.r * 0.5, 0.06, 32), new THREE.MeshStandardMaterial({ color: I.color })); pad.position.y = 1.13; g.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(I.r * 0.62, 0.05, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff })); ring.rotation.x = Math.PI / 2; ring.position.y = 1.16; g.add(ring);
  // 地標
  let mark = null;
  if (I.id === 'soccer') { mark = buildVehicle('drone', 'red'); mark.group.scale.setScalar(1.6); mark.group.position.y = 2.3; const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.07, 8, 32), new THREE.MeshStandardMaterial({ color: 0x3b82f6 })); r2.position.set(1.5, 2.2, 0); r2.rotation.y = Math.PI / 2; g.add(r2); }
  if (I.id === 'combat') { mark = buildVehicle('robot', 'boxer'); mark.group.scale.setScalar(2.2); mark.group.position.y = 1.16; }
  if (I.id === 'boat') { mark = buildVehicle('boat', 'foil'); mark.group.scale.setScalar(1.8); mark.group.position.y = 1.9; }
  if (I.id === 'core') { mark = buildVehicle(me.type, me.variant); mark.group.scale.setScalar(me.type === 'drone' ? 2.4 : 2); mark.group.position.y = me.type === 'drone' ? 2.5 : me.type === 'boat' ? 1.7 : 1.16; mark.setExplode(0.35); }
  if (I.id.startsWith('m')) { const h = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.4), new THREE.MeshStandardMaterial({ color: 0xf8fafc })); h.position.y = 1.65; h.castShadow = true; g.add(h); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.7, 4), new THREE.MeshStandardMaterial({ color: I.color })); roof.position.y = 2.5; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof); }
  if (I.id === 'forge') { const a = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), new THREE.MeshStandardMaterial({ color: 0x7c3aed })); a.position.y = 1.7; a.castShadow = true; g.add(a); const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x334155 })); ch.position.set(0.5, 2.6, 0.4); g.add(ch); }
  if (I.id === 'deck') { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 0.12), new THREE.MeshStandardMaterial({ color: 0x0f172a })); b.position.y = 2.1; b.castShadow = true; g.add(b); const sc = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.1), new THREE.MeshBasicMaterial({ color: 0xfacc15 })); sc.position.set(0, 2.1, 0.07); g.add(sc); }
  if (mark) g.add(mark.group);
  // 標籤
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 120; const cx = cv.getContext('2d');
  cx.fillStyle = 'rgba(255,255,255,.95)'; cx.beginPath(); cx.roundRect(4, 4, 632, 112, 28); cx.fill();
  cx.fillStyle = '#' + I.color.toString(16).padStart(6, '0'); cx.beginPath(); cx.roundRect(16, 18, 84, 84, 18); cx.fill();
  cx.fillStyle = '#fff'; cx.font = 'bold 54px "Noto Sans TC",sans-serif'; cx.textAlign = 'center'; cx.fillText(I.ic, 58, 80);
  cx.fillStyle = '#0f172a'; cx.textAlign = 'left'; cx.font = 'bold 50px "Noto Sans TC",sans-serif'; cx.fillText(I.name.replace('・認識機械', ''), 118, 78);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false })); sp.scale.set(I.r > 3 ? 5.2 : 4, I.r > 3 ? 0.98 : 0.75, 1); sp.position.y = I.r > 3 ? 4.6 : 3.6; sp.renderOrder = 10; g.add(sp);
  g.traverse(o => o.userData.island = I.id);
  S.scene.add(g); byId[I.id] = { I, g, mark }; clickables.push(g);
}
for (const [a, b] of BRIDGES) {
  const A = byId[a].I, B = byId[b].I, dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz) - A.r - B.r + 0.6;
  const br = new THREE.Mesh(new THREE.BoxGeometry(d, 0.12, 0.7), new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 }));
  const mx = A.x + dx / Math.hypot(dx, dz) * (A.r - 0.3 + d / 2), mz = A.z + dz / Math.hypot(dx, dz) * (A.r - 0.3 + d / 2);
  br.position.set(mx, 0.95, mz); br.rotation.y = -Math.atan2(dz, dx); br.castShadow = br.receiveShadow = true; S.scene.add(br);
}

function renderList(sel) {
  const L = $('#isl'); L.innerHTML = '';
  for (const I of ISLANDS) L.append(el('button', { class: I.id === sel ? 'on' : '', onclick: () => focus(I.id) }, el('i', { style: `background:#${I.color.toString(16).padStart(6, '0')}` }, I.ic), el('span', {}, el('b', {}, I.name), el('small', {}, I.sub))));
}
function renderMe() { const v = variantOf(me.type, me.variant); $('#me').innerHTML = `<span class="dot" style="background:#${v.color.toString(16).padStart(6, '0')}"></span><div><b>${v.name}</b><div class="mut" style="font-size:.9em">${TYPE_NAME[me.type]}・${v.sub}</div></div>`; }
let flyTo = null;
function focus(id) {
  const { I } = byId[id];
  renderList(id);
  $('#info').style.display = '';
  $('#infoP').innerHTML = `<h2 style="margin-top:0">${I.name}</h2><p class="mut">${I.sub}</p><p>${I.desc}</p>`;
  const acts = el('div', { class: 'acts' }, I.acts.map(([t, u], i) => el('a', { class: 'btn ' + (i ? '' : 'pri'), href: u() }, t)));
  $('#infoP').append(acts);
  flyTo = { pos: new THREE.Vector3(I.x, 9 + I.r, I.z + 11 + I.r), tgt: new THREE.Vector3(I.x, 1, I.z), t: 1.5 };
}
S.onClick(e => { const h = S.pick(e, clickables); if (h) { let o = h.object; while (o && !o.userData.island) o = o.parent; if (o) focus(o.userData.island); } });
idle(30000, () => { S.controls.autoRotate = true; S.controls.autoRotateSpeed = 0.4; }, () => { S.controls.autoRotate = false; });
S.onFrame((dt, t) => {
  for (const k of Object.values(byId)) if (k.mark) k.mark.update(dt, { throttle: 0.6, speed: 0.4, weapon: 0.7 });
  if (byId.soccer.mark) byId.soccer.mark.group.position.y = 2.3 + Math.sin(t * 1.5) * 0.15;
  if (flyTo && flyTo.t > 0) { flyTo.t -= dt; S.camera.position.lerp(flyTo.pos, Math.min(1, dt * 2.5)); S.controls.target.lerp(flyTo.tgt, Math.min(1, dt * 2.5)); }
});

/* ── 選載具（第一次進來一定要選） ── */
let pv = null, pvKit = null, pick = { ...me };
function openPick() {
  $('#pick').classList.add('show');
  if (!pv) {
    pv = createStudio($('#pv'), { cam: [1.7, 1.1, 2.0], target: [0, 0.2, 0], floorY: -0.35, maxD: 5 });
    pv.controls.autoRotate = true; pv.controls.autoRotateSpeed = 2;
    pv.onFrame(dt => pvKit?.update(dt, { throttle: 0.6, speed: 0.5, weapon: 0.8 }));
  }
  pv.resize(); renderPick();
}
function renderPick() {
  const T = $('#ptype'); T.innerHTML = '';
  const D = { drone: '三種顏色・無人機足球', robot: '三種人形・擂台格鬥', boat: '三種無人船・水道競速' };
  for (const t of ['drone', 'robot', 'boat']) T.append(el('button', { class: t === pick.type ? 'on' : '', onclick: () => { pick = { type: t, variant: VARIANTS[t][0].id }; renderPick(); } }, el('b', {}, TYPE_NAME[t]), el('span', { class: 'mut' }, D[t])));
  const V = $('#pvar'); V.innerHTML = '';
  for (const v of VARIANTS[pick.type]) V.append(el('button', { class: v.id === pick.variant ? 'on' : '', onclick: () => { pick.variant = v.id; renderPick(); } }, el('b', { style: `color:#${v.color.toString(16).padStart(6, '0')}` }, v.name), el('span', { class: 'mut' }, v.sub)));
  if (pvKit) { pv.scene.remove(pvKit.group); pvKit.dispose(); }
  pvKit = buildVehicle(pick.type, pick.variant); pvKit.group.scale.setScalar({ drone: 1.2, robot: 0.85, boat: 0.85 }[pick.type]); pvKit.group.position.y = pick.type === 'robot' ? -0.33 : 0.05; pv.scene.add(pvKit.group);
}
$('#ok').onclick = () => { me = { ...pick }; try { localStorage.setItem('vi.vehicle', JSON.stringify(me)); } catch (_) {} $('#pick').classList.remove('show'); renderMe(); location.reload(); };
$('#change').onclick = openPick;
renderList(); renderMe();
let had = null; try { had = localStorage.getItem('vi.vehicle'); } catch (_) {}
if (!had) openPick();
