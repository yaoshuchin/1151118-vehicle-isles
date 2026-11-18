// 競技場框架：席位與控制來源（電腦／本機／手機）、輸入、計分板、老師開房與 QR、排行榜
import * as THREE from 'three';
import { createStudio } from './studio.js';
import { $, el, esc, toast, topbar, isTeacher } from './ui.js';
import { Host, createHostRoom } from './net.js';
import { getBoard } from './board.js';

const q = new URLSearchParams(location.search);
const gameId = ['soccer', 'combat', 'boat'].includes(q.get('game')) ? q.get('game') : 'soccer';
topbar('arena.html?game=' + gameId);
const mod = await import(`./game-${gameId}.js`);

const S = createStudio($('#c'), { bg: 0x0b1220, fog: false, floor: false, orbit: false, cam: [0, 8, 12], fov: 50, shadowSize: 14 });
S.renderer.toneMappingExposure = 1.05;

const ui = {
  banner(t, sub = '', ms = 1800) { const b = $('#banner'); b.innerHTML = esc(t) + (sub ? `<small>${esc(sub)}</small>` : ''); b.classList.add('show'); clearTimeout(ui._bt); if (ms) ui._bt = setTimeout(() => b.classList.remove('show'), ms); },
  feed(t) { const f = $('#feed'); const d = el('div', {}, t); f.prepend(d); setTimeout(() => d.remove(), 4200); while (f.children.length > 5) f.lastChild.remove(); },
  buzz(slot, ms) { host?.send(slot, { buzz: ms }); }
};
const G = mod.createGame({ THREE, S, ui });
document.title = `${G.title}｜無人載具競技群島`;
$('#gtitle').textContent = G.title;
$('#rules').innerHTML = G.rules;
$('#keys').innerHTML = G.keys;

/* ── 模式與席位 ── */
let mode = q.get('mode') || G.modes[0].id;
let slots = [];                 // [{id,label,team,color, ctl:'ai'|'local'|'pad', name}]
function buildModes() {
  const M = $('#modes'); M.innerHTML = '';
  for (const m of G.modes) M.append(el('button', { class: 'btn sm' + (m.id === mode ? ' on' : ''), onclick: () => { mode = m.id; setup(); } }, m.label));
}
function setup() {
  const prev = new Map(slots.map(s => [s.id, s]));
  slots = G.slotsFor(mode).map((s, i) => {
    const p = prev.get(s.id);
    return { ...s, ctl: p?.ctl ?? (i === 0 ? 'local' : 'ai'), name: p?.name || '', variant: p?.variant ?? s.variant };
  });
  G.setup(mode, slots);
  buildModes(); renderSlots(); renderScore(); loadBoard();
  history.replaceState(null, '', `?game=${gameId}&mode=${mode}`);
}
function renderSlots() {
  const L = $('#slots'); L.innerHTML = '';
  for (const s of slots) {
    const sel = el('select', { onchange: e => { s.ctl = e.target.value; renderSlots(); } },
      ...[['ai', '電腦'], ['local', '本機'], ['pad', '手機']].map(([v, t]) => el('option', { value: v, selected: s.ctl === v ? '' : false }, t)));
    const vsel = G.variants ? el('select', { onchange: e => { s.variant = e.target.value; G.setup(mode, slots); renderScore(); } },
      ...G.variants.map(v => el('option', { value: v.id, selected: s.variant === v.id ? '' : false }, v.name))) : null;
    const who = s.ctl === 'pad' ? (s.name ? '📱 ' + s.name : '等待手機加入…') : s.ctl === 'local' ? '鍵盤／觸控' : '電腦控制';
    L.append(el('div', { class: 'slot' + (s.ctl === 'pad' && s.name ? ' pad' : '') },
      el('i', { style: `background:${s.css}` }), el('div', {}, el('b', {}, s.label), el('div', { class: 'who' }, who), vsel), sel));
  }
}
function renderScore() { $('#score').innerHTML = G.scoreHTML(); }

/* ── 本機輸入：鍵盤＋觸控搖桿 ── */
const keys = new Set();
addEventListener('keydown', e => { if (e.target.matches('input,textarea,select')) return; keys.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => keys.delete(e.code));
const touchAx = [0, 0, 0, 0];
function touchStick(elx, ix) {
  let id = null; const R = 50, k = elx.querySelector('i');
  elx.addEventListener('pointerdown', e => { id = e.pointerId; elx.setPointerCapture(id); mv(e); });
  const mv = e => { if (e.pointerId !== id) return; const r = elx.getBoundingClientRect(); let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; } k.style.transform = `translate(${dx}px,${dy}px)`; touchAx[ix] = dx / R; touchAx[ix + 1] = -dy / R; };
  elx.addEventListener('pointermove', mv);
  const up = () => { id = null; k.style.transform = ''; touchAx[ix] = touchAx[ix + 1] = 0; };
  elx.addEventListener('pointerup', up); elx.addEventListener('pointercancel', up);
}
touchStick($('#tl'), 0); touchStick($('#tr'), 2);
function localInput() {
  const k = c => keys.has(c) ? 1 : 0;
  const a = [k('KeyD') - k('KeyA') + touchAx[0], k('KeyW') - k('KeyS') + touchAx[1], k('ArrowRight') - k('ArrowLeft') + touchAx[2], k('ArrowUp') - k('ArrowDown') + touchAx[3]].map(v => Math.max(-1, Math.min(1, v)));
  return { a, b: (k('Space') ? 1 : 0) | (k('ShiftLeft') || k('ShiftRight') ? 2 : 0) };
}

/* ── 老師開房（伺服器簽票，學員看不到這個區塊） ── */
let host = null, ticket = null;
isTeacher().then(t => { if (t) $('#hostPanel').style.display = ''; });
$('#bHost').onclick = async () => {
  try {
    ticket = await createHostRoom(gameId);
    host?.close();
    host = new Host(ticket, {
      status: s => { $('#roomInfo').innerHTML = s === 'on' ? `房號 <b style="font-size:1.3em;letter-spacing:.1em">${ticket.room}</b>・已連線` : s === 'replaced' ? '這個房間已在別的視窗開啟' : '重新連線中…'; },
      join: (slot, name) => { const s = slots.find(x => x.id === slot); if (s) { s.ctl = 'pad'; s.name = name; renderSlots(); markQR(); ui.feed(`📱 ${name} 加入 ${s.label}`); } },
      leave: slot => { const s = slots.find(x => x.id === slot); if (s) { s.name = ''; renderSlots(); markQR(); ui.feed(`${s.label} 的手機離線，電腦接手`); } },
      emo: (slot, e) => { const s = slots.find(x => x.id === slot); ui.feed(`${s?.name || slot} ${e}`); }
    });
    $('#bQR').disabled = false; $('#bClose').disabled = false; showQR();
  } catch (e) { toast(e.message, 3000); }
};
$('#bClose').onclick = () => { host?.close(); host = null; ticket = null; for (const s of slots) if (s.ctl === 'pad') { s.ctl = 'ai'; s.name = ''; } renderSlots(); $('#roomInfo').textContent = '已關房。'; $('#bQR').disabled = true; $('#bClose').disabled = true; };
$('#bQR').onclick = showQR;
$('#qrClose').onclick = () => $('#qrModal').classList.remove('show');
let qrLib = null;
async function loadQR() { if (qrLib) return qrLib; await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/qrcode.js'; s.onload = res; s.onerror = rej; document.head.append(s); }); return (qrLib = window.qrcode); }
async function showQR() {
  if (!host) return;
  const qrcode = await loadQR();
  $('#qrRoom').textContent = '房號 ' + ticket.room;
  const box = $('#qrs'); box.innerHTML = '';
  for (const s of slots) {
    const url = host.padUrl(s.id, gameId, s.label);
    const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
    box.append(el('div', { class: 'qr', 'data-slot': s.id, 'data-url': url, html: qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) + `<b style="color:${s.css}">${esc(s.label)}</b><small class="mut">${s.name ? '📱 ' + esc(s.name) : '尚未加入'}</small>` }));
    if (s.ctl === 'ai') s.ctl = 'pad';
  }
  renderSlots();
  $('#qrModal').classList.add('show');
}
function markQR() { for (const d of document.querySelectorAll('.qr')) { const s = slots.find(x => x.id === d.dataset.slot); d.classList.toggle('joined', !!s?.name); const sm = d.querySelector('small'); if (sm) sm.textContent = s?.name ? '📱 ' + s.name : '尚未加入'; } }

/* ── 比賽控制 ── */
$('#bStart').onclick = () => { G.start(); renderScore(); };
$('#bPause').onclick = () => { G.pause(); $('#bPause').textContent = G.phase === 'pause' ? '繼續' : '暫停'; };
$('#bReset').onclick = () => { G.setup(mode, slots); renderScore(); $('#bPause').textContent = '暫停'; };
$('#bCam').onclick = () => G.nextCam();
$('#judge').append(...(G.judge || []).map(j => el('button', { class: 'btn sm', onclick: () => { j.fn(); renderScore(); } }, j.label)));

async function loadBoard() {
  const rows = await getBoard(G.boardKey(mode));
  $('#board').innerHTML = rows.length ? rows.slice(0, 6).map((r, i) => `<span>${i + 1}. ${esc(r.name)}</span><b>${esc(r.label)}</b>`).join('') : '<span class="mut">還沒有紀錄</span><b></b>';
}
G.onFinish = () => setTimeout(loadBoard, 800);

/* ── 主迴圈 ── */
let liveT = 0, padT = 0;
S.onFrame((dt, t) => {
  const inputs = new Map();
  const loc = localInput();
  for (const s of slots) {
    if (s.ctl === 'local') inputs.set(s.id, loc);
    else if (s.ctl === 'pad' && host) inputs.set(s.id, host.input(s.id));   // 手機沒在送 → null → 電腦接手
    else inputs.set(s.id, null);
  }
  G.step(dt, inputs, t);
  liveT -= dt; if (liveT <= 0) { liveT = 0.2; renderScore(); $('#live').innerHTML = G.liveRows().map(([a, b]) => `<span>${esc(a)}</span><b>${esc(b)}</b>`).join(''); }
  padT -= dt; if (host && padT <= 0) { padT = 0.5; for (const s of slots) if (s.ctl === 'pad' && s.name) host.send(s.id, G.padState(s.id)); }
});
setup();
