// 排行榜（Netlify Blobs）：成績寫入雲端，全班同一張表
import { API } from './config.js';
export const myName = () => { try { return localStorage.getItem('vi.name') || ''; } catch (_) { return ''; } };
export const setName = n => { try { localStorage.setItem('vi.name', String(n).slice(0, 16)); } catch (_) {} };
export async function postScore(game, { score, label, v }) {
  try {
    const r = await fetch(API + '/board', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game, score: Math.round(score), label, v, name: myName() || '匿名學員' }) });
    return r.ok;
  } catch (_) { return false; }
}
export async function getBoard(game) {
  try { const r = await fetch(API + '/board?game=' + encodeURIComponent(game)); return r.ok ? (await r.json()).rows || [] : []; } catch (_) { return []; }
}
