// 學員手機遙控器：雙搖桿＋動作鍵，每秒送 20 次輸入給老師的競技場
import { Pad } from './net.js';

const q = Object.fromEntries(new URLSearchParams(location.search));
const $ = s => document.querySelector(s);
const GAME = {
  soccer: { name: '無人機足球', l: '升降／轉向', r: '前後／左右平移', btn: ['加速'] },
  combat: { name: '人形格鬥', l: '前後移動／繞圈', r: '往下拉＝格擋', btn: ['出拳', '踢腿'] },
  boat:   { name: '水道競速',   l: '油門', r: '方向舵', btn: ['加速'] }
}[q.game] || { name: '競技', l: '左搖桿', r: '右搖桿', btn: ['A'] };
const TEAM = { r: '#e5484d', b: '#3b82f6', g: '#22c55e' };
const team = TEAM[(q.slot || '')[0]] || '#ff5a1f';
document.documentElement.style.setProperty('--team', team);
$('#chip').textContent = q.label || q.slot || '—';
$('#game').textContent = GAME.name;
$('#ll').textContent = GAME.l; $('#rl').textContent = GAME.r;
if (!q.room || !q.sig) { $('#info').innerHTML = 'QR 碼不完整<small>請重新掃描老師投影的 QR 碼</small>'; }

// 搖桿：手指放哪裡，搖桿中心就在哪裡（浮動搖桿，比固定位置好按）
const axes = [0, 0, 0, 0]; let bits = 0;
function stick(zone, el, ix) {
  let id = null, cx = 0, cy = 0; const R = 60, knob = el.querySelector('i');
  const place = (x, y) => { el.style.left = (x - 75) + 'px'; el.style.top = (y - 75) + 'px'; };
  const rest = () => { const r = zone.getBoundingClientRect(); place(r.left + r.width / 2, innerHeight * 0.66); knob.style.transform = ''; axes[ix] = 0; axes[ix + 1] = 0; };
  zone.addEventListener('pointerdown', e => { if (id !== null) return; id = e.pointerId; zone.setPointerCapture(id); cx = e.clientX; cy = e.clientY; place(cx, cy); move(e); });
  const move = e => { if (e.pointerId !== id) return; let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; axes[ix] = +(dx / R).toFixed(2); axes[ix + 1] = +(-dy / R).toFixed(2); };
  zone.addEventListener('pointermove', move);
  const up = e => { if (e.pointerId !== id) return; id = null; rest(); };
  zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up);
  addEventListener('resize', rest); rest();
}
stick($('#zl'), $('#sl'), 0); stick($('#zr'), $('#sr'), 2);
GAME.btn.forEach((t, i) => {
  const b = document.createElement('button'); b.textContent = t; $('#btns').append(b);
  const on = e => { e.preventDefault(); bits |= 1 << i; b.classList.add('dn'); navigator.vibrate?.(15); };
  const off = e => { e.preventDefault(); bits &= ~(1 << i); b.classList.remove('dn'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});

let pad = null;
function join() {
  const name = $('#nm').value.trim() || '玩家';
  try { localStorage.setItem('vi.name', name); } catch (_) {}
  $('#nameBox').classList.remove('show');
  document.documentElement.requestFullscreen?.().catch(() => {});
  pad = new Pad({ ...q, name }, {
    status(s, code) {
      const st = $('#st');
      st.className = s === 'on' ? 'on' : s === 'closed' ? 'bad' : 'off';
      st.textContent = s === 'on' ? '已連線' : s === 'closed' ? (code === 4001 ? '已在別的手機登入' : code === 4003 ? '被老師移出' : code === 4002 ? '房間已滿' : code === 4004 ? '這個位置已有人，請掃另一個 QR 碼' : '連線結束') : '重新連線中…';
      if (s === 'closed') { $('#endMsg').innerHTML = `<h2>${st.textContent}</h2><p>需要的話請重新掃描 QR 碼。</p>`; $('#endBox').classList.add('show'); }
    },
    msg(m) {
      if (m.t === 'hello') $('#info').innerHTML = m.host ? '已加入，等老師開始<small>先試試搖桿</small>' : '老師的競技場還沒開<small>開了會自動接上</small>';
      if (m.t === 'host') $('#info').innerHTML = m.on ? '老師的競技場已連線<small>&nbsp;</small>' : '老師的競技場離線<small>等待重新連線</small>';
      if (m.t === 'st') {
        const d = m.d || {};
        if (d.msg != null) $('#info').innerHTML = `${d.msg}<small>${d.sub || '&nbsp;'}</small>`;
        if (d.buzz) navigator.vibrate?.(d.buzz);
      }
    }
  });
  // 每秒 20 次送出；沒動也送，順便當心跳
  setInterval(() => pad.send(axes, bits), 50);
}
$('#go').onclick = join;
try { $('#nm').value = localStorage.getItem('vi.name') || ''; } catch (_) {}
document.querySelectorAll('.emo button').forEach(b => b.onclick = () => pad?.emo(b.dataset.e));
