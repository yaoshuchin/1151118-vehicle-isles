// 競技平台連線（老師端 host／學員手機 pad）。入場票由伺服器簽發，前端只轉交。
import { RELAY, API } from './config.js';

// 老師端：向伺服器要一張開房票（需老師登入），連到房間伺服器
export async function createHostRoom(game) {
  const r = await fetch(API + '/ticket', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game }) });
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? '需要老師身分才能開對戰房' : '開房失敗（' + r.status + '）');
  return r.json();   // { room, exp, host, pad }
}

export class Host {
  constructor(t, handlers) { this.t = t; this.h = handlers; this.pads = new Map(); this.closed = false; this.retry = 0; this.open(); }
  open() {
    const { room, exp, host } = this.t;
    this.ws = new WebSocket(`${RELAY}/ws?room=${room}&role=host&exp=${exp}&sig=${host}`);
    this.ws.onopen = () => { this.retry = 0; this.h.status?.('on'); this.ping = setInterval(() => this.ws.readyState === 1 && this.ws.send('ping'), 20000); };
    this.ws.onmessage = e => {
      if (e.data === 'pong') return;
      const m = JSON.parse(e.data);
      if (m.t === 'hello') for (const p of m.pads || []) this.pads.set(p.s, { name: p.n, a: [0, 0, 0, 0], b: 0 });
      if (m.t === 'join') { this.pads.set(m.s, { name: m.n, a: [0, 0, 0, 0], b: 0 }); this.h.join?.(m.s, m.n); }
      if (m.t === 'leave') { this.pads.delete(m.s); this.h.leave?.(m.s); }
      if (m.t === 'in') { const p = this.pads.get(m.s); if (p) { p.a = m.a; p.b = m.b; p.at = performance.now(); } }
      if (m.t === 'emo') this.h.emo?.(m.s, m.e);
      if (m.t === 'replaced') { this.closed = true; this.h.status?.('replaced'); }
    };
    this.ws.onclose = () => { clearInterval(this.ping); if (this.closed) return; this.h.status?.('off'); setTimeout(() => this.open(), Math.min(8000, 800 * 2 ** this.retry++)); };
  }
  input(slot) { const p = this.pads.get(slot); if (!p || performance.now() - (p.at || 0) > 1500) return null; return p; }
  send(slot, d) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ t: 'to', s: slot, d })); }
  kick(slot) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ t: 'kick', s: slot })); }
  close() { this.closed = true; this.ws?.close(); }
  padUrl(slot, game, label) {
    const { room, exp, pad } = this.t;
    const u = new URL('controller.html', location.href);
    u.search = new URLSearchParams({ room, exp, sig: pad, slot, game, label }).toString();
    return u.href;
  }
}

export class Pad {
  constructor(q, handlers) { this.q = q; this.h = handlers; this.retry = 0; this.closed = false; this.open(); }
  open() {
    const { room, exp, sig, slot, name } = this.q;
    let cid = ''; try { cid = localStorage.getItem('vi-cid') || ''; if (!cid) { cid = Math.random().toString(36).slice(2, 14); localStorage.setItem('vi-cid', cid); } } catch (_) { cid = this.cid || (this.cid = Math.random().toString(36).slice(2, 14)); }
    this.ws = new WebSocket(`${RELAY}/ws?room=${room}&role=pad&slot=${slot}&name=${encodeURIComponent(name || '')}&cid=${cid}&exp=${exp}&sig=${sig}`);
    this.ws.onopen = () => { this.retry = 0; this.h.status?.('on'); };
    this.ws.onmessage = e => { if (e.data === 'pong') return; const m = JSON.parse(e.data); this.h.msg?.(m); if (m.t === 'kicked' || m.t === 'full' || m.t === 'taken') this.closed = true; };
    this.ws.onclose = (ev) => { if (this.closed || ev.code === 1006 && this.retry > 6) { this.h.status?.('closed', ev.code); return; } this.h.status?.('off'); setTimeout(() => this.open(), Math.min(6000, 600 * 2 ** this.retry++)); };
  }
  send(a, b) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ t: 'in', a, b })); }
  emo(e) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ t: 'emo', e })); }
}
