// 共用介面：頂列、提示、登入狀態、作者頁尾、Netlify 標章移除
import { API } from './config.js';

export const AUTH_KEY = 'vi.auth';
export const AUTH_HASH = '5cae49b1fea5b5b969cdc931b8338968940c92309aa2339360cdd5c77be4a4ff';

export function checkAuth() {
  try {
    return localStorage.getItem(AUTH_KEY) === AUTH_HASH;
  } catch (_) {
    return false;
  }
}

export function relock() {
  try {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem('vi.intro');
  } catch (_) {}
  const isCourse = location.pathname.includes('/course/');
  location.replace(isCourse ? '../index.html' : 'index.html');
}

export function requireAuth() {
  const p = location.pathname.split('/').pop() || 'index.html';
  if (p === 'index.html' || p === '') return true;
  if (!checkAuth()) {
    const isCourse = location.pathname.includes('/course/');
    const nextTarget = isCourse ? ('course/' + location.search) : (p + location.search);
    location.replace((isCourse ? '../index.html' : 'index.html') + '?next=' + encodeURIComponent(nextTarget));
    return false;
  }
  return true;
}

if (typeof window !== 'undefined') {
  const p = location.pathname.split('/').pop() || 'index.html';
  if (p !== 'index.html' && p !== '') {
    requireAuth();
  }
}

export function renderLockBtn() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('.lock-floating-btn, .lock-btn')) return;
  const p = location.pathname.split('/').pop() || 'index.html';
  if (p === 'index.html' || p === '') return;
  const btn = el('button', {
    class: 'lock-floating-btn',
    title: '重新上鎖',
    style: 'position:fixed;top:14px;right:16px;z-index:999;background:rgba(15,23,42,.78);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:99px;padding:6px 14px;cursor:pointer;font:700 13px system-ui;display:inline-flex;align-items:center;gap:5px;box-shadow:0 4px 12px rgba(0,0,0,.25);transition:all .15s;',
    onclick: relock
  }, '🔒 重新上鎖');
  btn.onmouseenter = () => btn.style.background = 'rgba(232,83,31,.9)';
  btn.onmouseleave = () => btn.style.background = 'rgba(15,23,42,.78)';
  document.body.append(btn);
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderLockBtn);
  } else {
    setTimeout(renderLockBtn, 100);
  }
}

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let toastT;
export function toast(msg, ms = 2200) {
  let t = $('.toast'); if (!t) { t = el('div', { class: 'toast' }); document.body.append(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}

const NAV = [
  ['portal.html', '課程首頁'], ['hub.html', '群島'], ['garage.html', '機構拆解'], ['museum.html', '博物館'], ['forge.html', '載具工坊'],
  ['arena.html?game=soccer', '無人機足球'], ['arena.html?game=combat', '格鬥場'], ['arena.html?game=boat', '水道賽'],
  ['course/', '互動簡報'], ['board.html', '排行榜']
];
export function topbar(cur) {
  const nav = el('nav', {}, NAV.map(([h, t]) => el('a', { href: h, class: h.startsWith(cur) ? 'cur' : '' }, t)));
  const lockNav = el('button', {
    class: 'lock-btn',
    title: '重新上鎖',
    style: 'margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:99px;padding:4px 10px;cursor:pointer;font:700 13px system-ui;display:inline-flex;align-items:center;gap:4px;',
    onclick: relock
  }, '🔒 重新上鎖');
  nav.append(lockNav);
  const bar = el('header', { class: 'topbar' }, el('a', { class: 'brand', href: 'portal.html' }, el('i', {}, '島'), '無人載具競技群島'), nav);
  document.body.prepend(bar);
  return bar;
}

let me = null;
export async function whoami() {
  if (checkAuth()) {
    return { ok: true, lvl: 'teacher' };
  }
  return { ok: false };
}
export const isTeacher = async () => (await whoami()).lvl === 'teacher';

export function authorFooter() {
  return el('footer', { class: 'foot', html: `
    <img src="img/author.png" alt="作者資訊：曾慶良主任（阿亮老師）" loading="lazy">
    <div>
      <h3>曾慶良 主任（阿亮老師）</h3>
      <p>新興科技推廣中心主任｜教育部學科中心研究教師｜臺北市資訊教育輔導員</p>
      <p>2026 國科會資安創意發想競賽優勝・2025 SETEAM 教學專業講師認證・2024 教育部人工智慧講師認證・2019 百大資訊人才獎・2018、2019 親子天下創新 100 教師</p>
      <p>YouTube：<a href="https://www.youtube.com/@Liang-yt02" target="_blank" rel="noopener">@Liang-yt02</a>｜Facebook 社團：<a href="https://www.facebook.com/groups/2754139931432955" target="_blank" rel="noopener">3A 科技研究社</a>｜Email：3a01chatgpt@gmail.com</p>
      <small>© 2026 曾慶良（阿亮老師）版權所有。本站教材、程式與 3D 模型均為原創，僅供課程學員學習使用；未經書面同意，請勿轉載、改作或作為商業用途。<br>
      法規聲明：本站為教學模擬，不能取代實機訓練與正式賽事規則。實際飛行請遵守交通部民用航空局「遙控無人機管理規則」與當地場地規定；格鬥機器人與遙控船請在合格防護場地、有成人督導下操作。各賽事規則以主辦單位公告為準。<br>
      本站與任何第三方模擬器、協會或商標無關；文中提及之賽事名稱僅作知識介紹。</small>
    </div>` });
}

// Netlify 標章：CSS 已隱藏，這裡再用 MutationObserver 移除
new MutationObserver(() => document.querySelectorAll('#nl-badge-frame,iframe[title="Powered by Netlify"],[id^="netlify-badge"]').forEach(n => n.remove()))
  .observe(document.documentElement, { childList: true, subtree: true });

export function idle(ms, onIdle, onActive) {
  let t = null, active = true;
  const kick = () => { if (!active) { active = true; onActive?.(); } clearTimeout(t); t = setTimeout(() => { active = false; onIdle(); }, ms); };
  ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach(e => addEventListener(e, kick, { passive: true }));
  kick();
  return { kick, get active() { return active; } };
}
