// 機構拆解車庫：單一輸入（油門）驅動動畫與所有讀數；拆解、X 光、隔離、測驗、組裝挑戰、自動導覽
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createStudio, approach } from './studio.js';
import { buildVehicle, VARIANTS, TYPE_NAME, variantOf } from './models.js';
import { kin } from './kin.js';
import { PARTS, quizPool } from '../data/parts.js';
import { $, el, toast, topbar, idle } from './ui.js';
import { postScore } from './board.js';

topbar('garage');
const q = new URLSearchParams(location.search);
let saved = {}; try { saved = JSON.parse(localStorage.getItem('vi.vehicle') || '{}'); } catch (_) {}
let type = q.get('type') || saved.type || 'drone';
let variant = q.get('v') || saved.variant || VARIANTS[type][0].id;
if (!VARIANTS[type]) type = 'drone';

const S = createStudio($('#c'), { cam: [1.9, 1.3, 2.3], target: [0, 0.25, 0], floorY: -0.35 });
S.controls.autoRotate = false; S.controls.autoRotateSpeed = 0.6;
let kit = null, explodeT = 0, explodeCur = 0, xray = false, workOnly = false, selected = null;
let thr = 0.55, thrTarget = 0.55, mode = 'free';   // free｜quiz｜build
const ACC = 0xff5a1f;

// 正在工作的零件：強調色描邊用的發光殼
const glowMat = new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0.0, depthWrite: false });

function load() {
  if (kit) { S.scene.remove(kit.group); kit.dispose(); }
  kit = buildVehicle(type, variant);
  const fit = { drone: 1.25, robot: 0.9, boat: 0.85 }[type];
  kit.group.scale.setScalar(fit);
  kit.group.position.y = type === 'boat' ? 0.05 : type === 'robot' ? -0.33 : 0.1;
  S.scene.add(kit.group);
  try { localStorage.setItem('vi.vehicle', JSON.stringify({ type, variant })); } catch (_) {}
  history.replaceState(null, '', `?type=${type}&v=${variant}`);
  selected = null; renderPicker(); renderParts(); showCard(null); kit.setExplode(explodeCur); kit.setXray(xray);
  document.title = `${variantOf(type, variant).name}・機構拆解｜無人載具競技群島`;
}

function renderPicker() {
  const T = $('#types'); T.innerHTML = '';
  for (const t of ['drone', 'robot', 'boat']) T.append(el('button', { class: t === type ? 'on' : '', onclick: () => { type = t; variant = VARIANTS[t][0].id; endGame(); load(); } }, TYPE_NAME[t]));
  const V = $('#variants'); V.innerHTML = '';
  for (const v of VARIANTS[type]) V.append(el('button', { class: v.id === variant ? 'on' : '', onclick: () => { variant = v.id; endGame(); load(); } },
    el('span', { class: 'dot', style: `background:#${v.color.toString(16).padStart(6, '0')}` }), el('span', {}, v.name, el('small', {}, v.sub))));
}
function partIds() { return PARTS[type].order.filter(id => kit.parts.some(p => p.id === id)); }
function renderParts() {
  const L = $('#plist'); L.innerHTML = '';
  for (const id of partIds()) L.append(el('button', { 'data-id': id, class: id === selected ? 'on' : '', onclick: () => onPart(id) }, PARTS[type].list[id].name));
}
function showCard(id) {
  const C = $('#card');
  if (!id) { C.innerHTML = '<p class="mut" style="margin:0">點任何一個零件，這裡會說明它的功能與原理。</p>'; return; }
  const p = PARTS[type].list[id];
  C.innerHTML = `<span class="tag or">${PARTS[type].works.includes(id) ? '運轉中會工作的零件' : '結構／控制零件'}</span>
    <h4>${p.name}</h4><div class="en">${p.en}</div><p><b>功能：</b>${p.role}</p><p><b>原理：</b>${p.how}</p><p class="mut"><b>注意：</b>${p.tip}</p>`;
}
function select(id) { selected = id; kit.highlight(id); renderParts(); showCard(id); }

// 讀數面板：每一格都讀 kin()
function renderRead(k) {
  $('#state').textContent = k.state;
  $('#read').innerHTML = k.read.map(([a, b]) => `<span>${a}</span><b class="${a.includes('油門') ? '' : 'hot'}">${b}</b>`).join('');
  $('#bars').innerHTML = Object.entries(k.bars).map(([n, v]) => `<div><div class="row" style="justify-content:space-between;font-size:.85em"><span>${n}</span><span>${Math.round(v * 100)}%</span></div><div class="bar"><i style="width:${Math.max(0, Math.min(100, v * 100))}%"></i></div></div>`).join('');
  $('#check').textContent = k.check;
}

// 3D 點選零件
S.onClick(e => {
  if (!kit) return;
  const hit = S.pick(e, [kit.group]);
  if (!hit) { if (mode === 'free') select(null); return; }
  let o = hit.object; while (o && !o.userData.partId) o = o.parent;
  if (o) onPart(o.userData.partId);
});
function onPart(id) {
  if (mode === 'quiz') return quizAnswer(id);
  if (mode === 'build') return buildPick(id);
  select(selected === id ? null : id);
}

/* ── 測驗：點出這個零件 ── */
let quiz = null;
function startQuiz() {
  endGame(); mode = 'quiz';
  const pool = quizPool(type, variant).sort(() => Math.random() - 0.5).slice(0, 6);
  quiz = { pool, i: 0, score: 0, t0: performance.now() };
  explodeT = 0.6; xray = false; kit.setXray(false); select(null); showQuiz();
}
function showQuiz() {
  const G = $('#game'); G.style.display = '';
  if (quiz.i >= quiz.pool.length) {
    const sec = (performance.now() - quiz.t0) / 1000;
    G.innerHTML = `<h3>測驗完成</h3><p style="font-size:1.3em;margin:.2em 0"><b>${quiz.score} / ${quiz.pool.length}</b> 題・${sec.toFixed(1)} 秒</p><div class="row"><button class="btn pri sm" id="again">再一次</button><button class="btn sm" id="quit">結束</button></div>`;
    $('#again').onclick = startQuiz; $('#quit').onclick = endGame; mode = 'free';
    postScore('quiz-' + type, { score: quiz.score * 100 - Math.round(sec), label: `${quiz.score}/${quiz.pool.length}・${sec.toFixed(1)} 秒`, v: variant });
    return;
  }
  const c = quiz.pool[quiz.i];
  G.innerHTML = `<h3>點出這個零件（${quiz.i + 1}/${quiz.pool.length}）</h3><p style="font-size:1.1em">「${c.q}」</p><p class="mut">在模型上點它，或點左邊的零件名稱。</p><button class="btn sm" id="quit">結束測驗</button>`;
  $('#quit').onclick = endGame;
}
function quizAnswer(id) {
  const c = quiz.pool[quiz.i];
  if (id === c.id) { quiz.score++; toast('答對：' + PARTS[type].list[id].name); }
  else toast(`這是「${PARTS[type].list[id].name}」，答案是「${PARTS[type].list[c.id].name}」`, 2800);
  select(c.id); quiz.i++; setTimeout(() => { if (mode === 'quiz') { select(null); showQuiz(); } }, 900);
}

/* ── 組裝挑戰：照正確順序把零件裝回去 ── */
let build = null;
function startBuild() {
  endGame(); mode = 'build';
  const order = partIds();
  build = { order, next: 0, miss: 0, t0: performance.now() };
  for (const p of kit.parts) p.group.visible = false;
  explodeT = 0; xray = false; kit.setXray(false); select(null);
  showBuild();
}
function showBuild() {
  const G = $('#game'); G.style.display = '';
  const done = build.next >= build.order.length;
  if (done) {
    const sec = (performance.now() - build.t0) / 1000;
    G.innerHTML = `<h3>組裝完成</h3><p style="font-size:1.25em;margin:.2em 0"><b>${sec.toFixed(1)} 秒</b>・裝錯 ${build.miss} 次</p><div class="row"><button class="btn pri sm" id="again">再挑戰</button><button class="btn sm" id="quit">結束</button></div>`;
    $('#again').onclick = startBuild; $('#quit').onclick = endGame; mode = 'free';
    postScore('build-' + type, { score: Math.max(0, 10000 - Math.round(sec * 50) - build.miss * 300), label: `${sec.toFixed(1)} 秒・錯 ${build.miss}`, v: variant });
    thrTarget = 0.6; return;
  }
  G.innerHTML = `<h3>組裝挑戰（${build.next}/${build.order.length}）</h3><p>由內而外：先裝骨架，再裝動力，最後裝保護。下一個該裝哪個零件？在左邊零件清單點它。</p><p class="mut">裝錯 ${build.miss} 次</p><button class="btn sm" id="quit">放棄</button>`;
  $('#quit').onclick = endGame;
  $$plist().forEach(b => { const i = build.order.indexOf(b.dataset.id); b.classList.toggle('done', i > -1 && i < build.next); });
}
const $$plist = () => [...document.querySelectorAll('#plist button')];
function buildPick(id) {
  const want = build.order[build.next];
  const idx = build.order.indexOf(id);
  if (idx > -1 && idx < build.next) return toast('這個已經裝好了');
  if (id !== want) {
    build.miss++;
    const w = PARTS[type].list[want];
    toast(`還不能裝「${PARTS[type].list[id].name}」。先裝「${w.name}」：${w.role}`, 3200);
    return showBuild();
  }
  const p = kit.parts.find(x => x.id === id);
  p.group.visible = true; p.flyIn = 1;
  build.next++; select(id); showBuild();
}
function endGame() {
  mode = 'free'; quiz = null; build = null; $('#game').style.display = 'none';
  if (kit) for (const p of kit.parts) { p.group.visible = true; p.flyIn = 0; }
  $$plist().forEach(b => b.classList.remove('done'));
}

/* ── 自動導覽（安靜 25 秒後開始，任何操作就交還） ── */
const FILM = () => {
  const ids = PARTS[type].works.filter(id => kit.parts.some(p => p.id === id));
  const v = variantOf(type, variant);
  return [
    { d: 4, cap: `${v.name}：${v.sub}`, thr: 0.15, ex: 0 },
    { d: 4, cap: '只有一個輸入：油門。轉速、推力、讀數全部跟著它走', thr: 0.85, ex: 0 },
    { d: 4, cap: '爆炸分解：每個零件沿著它的組裝方向退開', thr: 0.5, ex: 1 },
    ...ids.map(id => ({ d: 3.5, cap: `${PARTS[type].list[id].name}：${PARTS[type].list[id].role}`, thr: 0.7, ex: 0.7, sel: id, xray: true })),
    { d: 4, cap: '合體完成，開始運轉', thr: 0.65, ex: 0 }
  ];
};
let tour = null;
function startTour() { if (mode !== 'free') return; tour = { steps: FILM(), i: 0, t: 0 }; $('#tourtag').classList.add('show'); S.controls.autoRotate = true; stepTour(0); }
function stopTour() { if (!tour) return; tour = null; $('#tourtag').classList.remove('show'); $('#cap').classList.remove('show'); S.controls.autoRotate = false; xray = false; kit.setXray(false); select(null); }
function stepTour(i) {
  const s = tour.steps[i]; tour.i = i; tour.t = 0;
  thrTarget = s.thr; explodeT = s.ex; xray = !!s.xray; kit.setXray(xray); select(s.sel || null);
  const cap = $('#cap'); cap.textContent = s.cap; cap.classList.add('show');
}
const idler = idle(25000, startTour, stopTour);

/* ── 按鈕 ── */
$('#bExplode').onclick = () => { stopTour(); explodeT = 1; };
$('#bJoin').onclick = () => { stopTour(); explodeT = 0; };
$('#bXray').onclick = () => { stopTour(); xray = !xray; $('#bXray').classList.toggle('on', xray); kit.setXray(xray); };
$('#bWork').onclick = () => {
  stopTour(); workOnly = !workOnly; $('#bWork').classList.toggle('on', workOnly);
  for (const p of kit.parts) p.group.visible = !workOnly || PARTS[type].works.includes(p.id);
  if (workOnly) thrTarget = Math.max(thrTarget, 0.7);
};
$('#bQuiz').onclick = () => { stopTour(); startQuiz(); };
$('#bBuild').onclick = () => { stopTour(); startBuild(); };
$('#bTour').onclick = () => startTour();
$('#bGlb').onclick = () => {
  const ex = new GLTFExporter();
  const prev = explodeCur; kit.setExplode(0); kit.setXray(false); kit.highlight(null);
  ex.parse(kit.group, buf => {
    const blob = new Blob([buf], { type: 'model/gltf-binary' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `${type}_${variant}.glb` }); document.body.append(a); a.click(); a.remove();
    kit.setExplode(prev); kit.setXray(xray); toast('已下載 GLB，可直接匯入 Blender（File → Import → glTF 2.0）', 3200);
  }, err => toast('匯出失敗：' + err.message), { binary: true });
};
$('#thr').oninput = e => { stopTour(); thrTarget = e.target.value / 100; };

/* ── 每一格 ── */
let readT = 0;
S.onFrame((dt, t) => {
  if (!kit) return;
  if (tour) { tour.t += dt; if (tour.t > tour.steps[tour.i].d) { const n = tour.i + 1; if (n >= tour.steps.length) { tour.i = -1; stepTour(0); } else stepTour(n); } }
  thr = approach(thr, thrTarget, dt, 3);
  if (Math.abs(+$('#thr').value - thr * 100) > 1 && tour) $('#thr').value = Math.round(thr * 100);
  explodeCur = approach(explodeCur, explodeT, dt, 4);
  kit.setExplode(explodeCur);
  // 組裝飛入動畫
  for (const p of kit.parts) if (p.flyIn > 0) { p.flyIn = Math.max(0, p.flyIn - dt * 2.2); p.group.position.copy(p.home).addScaledVector(p.dir, p.flyIn * 1.6); }
  const k = kin(type, variant, thr);
  kit.update(dt, { throttle: thr, speed: thr, weapon: thr, fire: k.fire, steer: Math.sin(t * 0.8) * 0.6 * thr });
  // 無人機在油門超過懸停時微微浮起；水翼船升起
  if (type === 'drone') kit.group.position.y = 0.1 + Math.max(0, (k.read[4] ? parseFloat(k.read[4][1]) : 0) - 1) * 0.08 + Math.sin(t * 2) * 0.01 * thr;
  if (type === 'boat') kit.group.position.y = 0.05 + (k.foiling ? 0.12 : (k.lift || 0) * 0.05) + Math.sin(t * 1.7) * 0.008;
  readT -= dt; if (readT <= 0) { readT = 0.12; renderRead(k); }   // 面板隔格重繪
});

load();
