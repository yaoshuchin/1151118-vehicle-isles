/* AI 團隊互動簡報｜引擎
 * 簡報＝生成器：每頁可放互動區（勾選、選擇、輸入、✨ AI 優化、下載到資料夾、上傳、打包）。
 * 內容在 data/<day>.js（window.DECK），引擎只負責畫面、存檔、串接、資料夾、打包。
 * 網址：?d=day1&u=U00&p=3（第幾單元第幾頁）｜&show=1 學生畫面（聽教師控制台）｜&print=1 全部印出（產 PDF 用）
 */
import { byok } from '../js/byok.js';
(function () {
  'use strict';
  const D = window.DECK;
  if (!D) { document.getElementById('stage').textContent = '找不到這一天的簡報內容'; return; }
  const Q = new URLSearchParams(location.search);
  const SHOW = Q.get('show') === '1', PRINT = false; // 2026-11-18 老師指示：不提供列印／另存 PDF
  /* 平臺模式（學員用）：研究通式外殼＝上方列＋左側欄＋步驟分頁＋滿版內容；教師控制台學生畫面（show）與 PDF（print）維持投影片 */
  const PLAT = !SHOW && !PRINT;
  const KEY = 'vehicledeck.v1.' + D.id;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ───────── 狀態（每一天各自一份草稿） ───────── */
  let S = { f: {}, i: 0 };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* 無痕模式 */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  const shared = (() => { try { return JSON.parse(localStorage.getItem('vehicledeck.v1.shared') || '{}'); } catch (e) { return {}; } })();
  const saveShared = () => { try { localStorage.setItem('vehicledeck.v1.shared', JSON.stringify(shared)); } catch (e) { } };
  if (PRINT && D.sample) S.f = Object.assign({}, D.sample);
  const val = id => S.f[id];
  const setv = (id, v) => { S.f[id] = v; save(); refreshLive(); if (PLAT) { paintSide(); paintSteps(true); } };
  /* {{欄位}} 代入；陣列用「、」接起來 */
  const fill = (t, extra) => String(t || '').replace(/\{\{(\w+)\}\}/g, (m, k) => {
    const v = (extra && k in extra) ? extra[k] : S.f[k];
    return Array.isArray(v) ? v.join('、') : (v == null || v === '' ? '（未填）' : String(v));
  });

  const fillE = t => /\{\{/.test(t || '') ? String(t).replace(/\{\{(\w+)\}\}/g, (m, k) => { const v = S.f[k]; return esc(Array.isArray(v) ? v.join('、') : (v == null || v === '' ? '（未填）' : v)); }) : (t || '');

  /* ───────── 投影片清單、單元頁碼 ───────── */
  /* 每單元最後自動加一頁「本單元盤點」 */
  if (!D.slides.some(s => s.kind === 'recap')) {
    const out = [];
    D.slides.forEach((s, i) => {
      out.push(s);
      const nx = D.slides[i + 1];
      if (!nx || nx.u !== s.u) out.push({ u: s.u, kind: 'recap', title: '本單元盤點：你做了這些事', say: '先看清單，還沒打勾的可以點一下回去補。確認好了，就回首頁或往下一單元。' });
    });
    D.slides = out;
  }
  const SL = D.slides;
  SL.forEach((s, i) => { s._i = i; });
  const unitPages = {};
  SL.forEach(s => { (unitPages[s.u] = unitPages[s.u] || []).push(s._i); s._p = unitPages[s.u].length; });
  const unitTitle = u => (D.units.find(x => x.u === u) || {}).title || '';
  const idxOf = (u, p) => { const a = unitPages[u]; return a ? a[Math.min(Math.max(1, p), a.length) - 1] : 0; };

  /* ───────── toast ───────── */
  function toast(t, ms) { const e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => e.hidden = true, ms || 3500); }

  /* ───────── IndexedDB：資料夾權杖、上傳檔 ───────── */
  const idb = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('vehicledeck', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('kv', mode); const st = t.objectStore('kv'); const r = fn(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); };
    return { get: k => tx('readonly', s => s.get(k)).catch(() => null), set: (k, v) => tx('readwrite', s => s.put(v, k)).catch(() => null), del: k => tx('readwrite', s => s.delete(k)).catch(() => null) };
  })();

  /* ───────── 學員資料夾（File System Access API） ───────── */
  const folder = {
    h: null,
    ok: () => !!folder.h,
    can: () => 'showDirectoryPicker' in window,
    async restore() { folder.h = await idb.get('folder'); paintStatus(); },
    async pick() {
      if (!folder.can()) { toast('這個瀏覽器不能指定資料夾，請改用電腦版 Chrome 或 Edge。下載的檔案會放在「下載」資料夾。', 6000); return false; }
      try {
        const h = await window.showDirectoryPicker({ id: 'vehicledeck', mode: 'readwrite', startIn: 'documents' });
        folder.h = h; await idb.set('folder', h); paintStatus(); render(); toast('✅ 已設定資料夾：' + h.name); return true;
      } catch (e) { toast(e.name === 'AbortError' ? '還沒設定成功。如果剛才跳出「無法開啟這個資料夾／含有系統檔案」，代表選到「文件」「桌面」「下載」本身：請在裡面按「新增資料夾」建一個「載具課程」，點進去再按「選取資料夾」，最後按「允許／編輯檔案」。' : e.name === 'NotAllowedError' || e.name === 'SecurityError' ? '瀏覽器沒有給權限：請再按一次，跳出「讓網站編輯檔案？」時按「編輯檔案／允許」。' : '沒有設定成功：' + e.message, 12000); return false; }
    },
    async perm() {
      if (!folder.h) return false;
      const o = { mode: 'readwrite' };
      if ((await folder.h.queryPermission(o)) === 'granted') return true;
      return (await folder.h.requestPermission(o)) === 'granted';
    },
    /* 寫入 a/b/c.txt；content 可為字串、Blob、Uint8Array */
    async write(path, content) {
      const parts = path.split('/').filter(Boolean); let d = folder.h;
      for (let i = 0; i < parts.length - 1; i++) d = await d.getDirectoryHandle(parts[i], { create: true });
      const fh = await d.getFileHandle(parts[parts.length - 1], { create: true });
      const w = await fh.createWritable(); await w.write(content); await w.close();
    }
  };
  /* 有資料夾就寫進去，沒有就走瀏覽器下載 */
  async function saveFiles(files, zipName) {
    if (folder.ok() && await folder.perm().catch(() => false)) {
      for (const f of files) await folder.write(f.path, f.content);
      return 'folder';
    }
    if (files.length === 1 && !zipName) { dl(files[0].content, files[0].path.split('/').pop()); return 'download'; }
    const z = new JSZip(); files.forEach(f => z.file(f.path, f.content));
    dl(await z.generateAsync({ type: 'blob' }), zipName || 'download.zip'); return 'download';
  }
  function dl(content, name) {
    const b = content instanceof Blob ? content : new Blob([content]);
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ───────── AI 串接：優先用學員自己電腦的 AI（本機串接器），沒開才用雲端備援 ───────── */
  const BR = 'http://127.0.0.1:8901';
  const ENG = { codex: 'Codex（ChatGPT 桌面版）', claude: 'Claude Code', agy: 'Antigravity', groq: 'Groq（免費，只寫文字）' };
  const LOGIN = { codex: 'codex login', claude: 'claude auth login', agy: 'agy', groq: '雙擊 00_載具課程串接包 裡的「設定Groq金鑰.cmd」' };
  const BRIDGE_FILES = ['00_先讀我.txt', 'SKILL.md', 'selftest.py', '設定Groq金鑰.cmd', '載具課程串接器.py', '開啟載具課程串接器.cmd', '開啟載具課程串接器.command'];
  const lfetch = (path, opt, ms) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 3000); return fetch(BR + path, Object.assign({ signal: c.signal, targetAddressSpace: 'loopback', cache: 'no-store' }, opt || {})).finally(() => clearTimeout(t)); };
  const bridge = {
    engines: {}, nologin: {}, connected: !!shared.connected, found: false, mode: shared.mode || '', local: false, cloud: false,
    steps: shared.steps || [], model: shared.model || '', base: '',
    async detectLocal(refresh) {
      try {
        const r = await lfetch('/engines' + (refresh ? '?refresh=1' : ''), null, refresh ? 20000 : 4000); const j = await r.json();
        const en = {}, nl = {};
        Object.entries(j.engines || {}).forEach(([k, d]) => { if (!ENG[k]) return; en[k] = !!d.ok; if (d.installed && d.login === 'no') nl[k] = 1; });
        bridge.engines = en; bridge.nologin = nl; bridge.found = true; bridge.local = Object.values(en).some(Boolean);
        try { const b = await (await lfetch('/buildinfo')).json(); bridge.base = b.base || ''; } catch (e) { bridge.base = ''; }
      } catch (e) { bridge.engines = {}; bridge.nologin = {}; bridge.local = false; bridge.base = ''; }
      return bridge.local;
    },
    async detectCloud() {
      // BYOK：用學員自己的 Gemini／Groq 金鑰，瀏覽器直連（不經過伺服器）。有填金鑰就算備援就緒。
      const p = byok.provider, has = byok.ready();
      bridge.cloud = has; bridge.model = has ? byok.providers[p].model : '';
      bridge.steps = has
        ? [{ ok: true, name: byok.providers[p].label + ' 金鑰', msg: '已填（只存在您這台電腦，✨ 花您自己的免費額度）' }]
        : [{ ok: false, name: '雲端備援', msg: '尚未填入您自己的 AI 金鑰', fix: '在下方「B.」選 Gemini 或 Groq，貼上免費金鑰' }];
      return bridge.cloud;
    },
    async detect(refresh) {
      const tryLocal = refresh || shared.localSeen;      // 沒連過本機串接器的學員，頁面載入時不去探測（避免權限詢問與主控台錯誤）
      await Promise.all([tryLocal ? bridge.detectLocal(refresh) : Promise.resolve(false), bridge.detectCloud()]);
      if (bridge.local) shared.localSeen = 1;
      bridge.mode = bridge.local ? 'local' : bridge.cloud ? 'cloud' : '';
      bridge.connected = !!bridge.mode; if (!bridge.local) bridge.found = bridge.found || bridge.cloud;
      Object.assign(shared, { connected: bridge.connected, mode: bridge.mode, steps: bridge.steps, model: bridge.model }); saveShared(); paintStatus();
      document.querySelectorAll('[data-w="bridge"]').forEach(el => { el.innerHTML = W.bridge.html(); });
      document.querySelectorAll('[data-w="build"]').forEach(el => { el.innerHTML = W.build.html(); });
      return bridge.connected;
    },
    pick() { if (bridge.mode !== 'local') return 'cloud'; const want = val('engine'); if (want && bridge.engines[want]) return want; return ['codex', 'claude', 'agy', 'groq'].find(k => bridge.engines[k]) || 'cloud'; },
    pickBuilder() { const want = val('engine'); if (want && want !== 'groq' && bridge.engines[want]) return want; return ['codex', 'claude', 'agy'].find(k => bridge.engines[k]) || ''; },
    label(k) { return k === 'cloud' ? '雲端 AI' : ENG[k]; },
    async runCloud(prompt) {
      // 用學員自己的金鑰直連 Gemini／Groq
      if (!byok.ready()) return { ok: false, error: '請先在「B.」填入您自己的 Gemini 或 Groq 免費金鑰' };
      const r = await byok.run(prompt);
      return r.ok ? { ok: true, text: r.text, via: 'cloud' } : { ok: false, error: r.error };
    },
    async run(prompt) {
      const eng = bridge.pick();
      if (eng !== 'cloud') {
        try {
          const r = await lfetch('/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ engine: eng, prompt, timeout: 240 }) }, 250000);
          const j = await r.json();
          if (j.ok) return { ok: true, text: j.text, via: eng };
          if (bridge.cloud) { const c = await bridge.runCloud(prompt); if (c.ok) { c.note = ENG[eng] + ' 沒回應（' + ((j.error && (j.error.plain || j.error)) || j.kind || '') + '），已改用雲端 AI'; return c; } }
          return { ok: false, error: j.error || j.kind };
        } catch (e) { if (bridge.cloud) return bridge.runCloud(prompt); return { ok: false, error: '連不到本機串接器（黑色視窗還開著嗎？）' }; }
      }
      return bridge.runCloud(prompt);
    },
    async files() { return Promise.all(BRIDGE_FILES.map(async n => ({ path: '00_載具課程串接包/' + n, content: new Uint8Array(await (await fetch('templates/bridge/' + encodeURIComponent(n), { cache: 'no-store' })).arrayBuffer()) }))); },
    // 一鍵安裝／登入 CLI：請本機串接器開一個終端機視窗跑 codex login 等（網頁自己做不到執行本機指令）
    async cli(engine, action) {
      if (!bridge.local && !(await bridge.detectLocal(true))) return { ok: false, error: '請先下載並啟動串接器（A 區的「下載串接包」）' };
      try {
        const r = await lfetch('/cli', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ engine, action }) }, 15000);
        return await r.json();
      } catch (e) { return { ok: false, error: '連不到串接器（黑色視窗還開著嗎？）' }; }
    }
  };

  /* ───────── 一鍵建置：把安裝包送進本機串接器，由學員自己的 AI 在背景做出網頁 ───────── */
  const build = {
    id: shared['build_' + D.id] || '', st: null, timer: 0,
    async start() {
      if (!bridge.local) await bridge.detect(true);
      const eng = bridge.pickBuilder();
      if (!eng) { toast('還沒偵測到本機串接器裡可用的 Codex／Claude Code／Antigravity。請先到 U00 下載串接包並啟動，或改用「產生安裝包＋複製指令」。', 9000); return; }
      const r = await D.pack(S.f, ctx);
      const files = {}; Object.keys(r.files).forEach(k => { if (typeof r.files[k] === 'string') files[k] = r.files[k]; });
      const body = { engine: eng, root: r.root, out: D.packOut || r.root.replace('安裝包', ''), files, prompt: D.packPrompt(S.f), timeout: 1800 };
      try {
        const res = await lfetch('/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 20000);
        const j = await res.json();
        if (!j.ok) { toast('建置沒有開始：' + (j.error || ''), 9000); return; }
        build.id = j.id; shared['build_' + D.id] = j.id; saveShared();
        toast('🤖 ' + ENG[eng] + ' 開始建置，可以繼續上課，這一頁會顯示進度', 6000); build.poll();
      } catch (e) { toast('連不到本機串接器：黑色視窗還開著嗎？', 8000); }
    },
    async poll() {
      clearTimeout(build.timer); if (!build.id) return;
      try { const j = await (await lfetch('/build/' + build.id, null, 5000)).json(); build.st = j.ok ? j : null; } catch (e) { build.st = { status: 'lost', msg: '暫時連不到串接器' }; }
      document.querySelectorAll('[data-w="build"]').forEach(el => { el.innerHTML = W.build.html(); const lg = el.querySelector('.blog'); if (lg) lg.scrollTop = lg.scrollHeight; });
      if (build.st && (build.st.status === 'running' || build.st.status === 'lost')) build.timer = setTimeout(build.poll, 3000);
    },
    async open(what) { try { const j = await (await lfetch('/build/' + build.id + '/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ what }) })).json(); toast(j.ok ? '已在您的電腦打開：' + j.opened : j.error, 6000); } catch (e) { toast('連不到本機串接器', 5000); } },
    async cancel() { try { await lfetch('/build/' + build.id + '/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); } catch (e) { } build.poll(); }
  };

  /* ───────── 上方狀態列 ───────── */
  function paintStatus() {
    const f = $('folderst'), b = $('bridgest');
    if (f) { f.textContent = folder.h ? '📁 ' + folder.h.name : '📁 尚未設定資料夾'; f.classList.toggle('ok', !!folder.h); }
    if (b) {
      const loc = bridge.mode === 'local';
      $('bdot').textContent = loc ? '🟢 我的 AI 已串接' : bridge.connected ? '🟢 雲端 AI（備援）' : bridge.found ? '🟡 AI 有問題' : '⚪ 未串接';
      b.title = (loc ? '本機串接器：' + Object.keys(bridge.engines).filter(k => bridge.engines[k]).map(k => ENG[k]).join('、') : bridge.connected ? '已串接雲端 AI：' + bridge.model + '（開啟本機串接器後，會改用您自己電腦的 AI）' : '尚未串接（✨ 會先給示範內容）') + '；點一下重新偵測';
      b.classList.toggle('ok', bridge.connected);
    }
  }

  /* ───────── 畫面元件 ───────── */
  const imgHTML = im => `<figure class="shot"><img src="${esc(im.src)}" alt="${esc(im.cap || '')}" loading="lazy">${im.cap ? `<figcaption>${esc(im.cap)}</figcaption>` : ''}</figure>`;
  const cmdHTML = c => `<div class="cmd"><button class="cp" data-copy>複製</button><span>${esc(fill(c))}</span></div>`;
  function textCol(s) {
    let h = '';
    if (s.why) h += `<p class="why">${fillE(s.why)}</p>`;
    if (s.html) h += s.html;
    if (s.steps) h += `<div><span class="lbl">${s.stepsLabel || '要做的事'}</span><ol class="steps">${s.steps.map(x => `<li>${fillE(x)}</li>`).join('')}</ol></div>`;
    if (s.txt) h += `<p class="txt">${fillE(s.txt)}</p>`;
    if (s.cmd) h += (s.cmdLabel ? `<span class="lbl">${esc(s.cmdLabel)}</span>` : '') + (Array.isArray(s.cmd) ? s.cmd.map(cmdHTML).join('') : cmdHTML(s.cmd));
    if (s.see) h += `<p class="see">👀 你會看到：${fillE(s.see)}</p>`;
    if (s.warn) h += `<p class="warn">⚠ ${fillE(s.warn)}</p>`;
    return h;
  }
  function imgsCol(imgs) {
    if (!imgs || !imgs.length) return '';
    const cls = imgs.length === 2 ? 'n2' : imgs.length >= 3 ? 'g4' : '';
    return `<div class="imgs ${cls}">${imgs.map(imgHTML).join('')}</div>`;
  }

  /* 互動欄位 */
  function fieldHTML(f) {
    const v = val(f.id);
    const q = f.label ? `<div class="q">${fillE(f.label)}</div>` : '';
    let hint = f.hint ? `<p class="hint">${fillE(f.hint)}</p>` : '';
    if (f.answer && v != null && v !== '') hint += `<p class="${v === f.answer ? 'see' : 'warn'}">${v === f.answer ? '✅ 答對了！' : '🤔 再想想：建議選「' + esc(f.answer) + '」。'}${f.explain || ''}</p>`;
    switch (f.type) {
      case 'check': case 'radio': {
        const arr = f.type === 'check' ? (Array.isArray(v) ? v : (f.def || [])) : (v != null ? v : f.def);
        return `<div class="fld">${q}<div class="opts">${f.options.map(o => {
          const val0 = typeof o === 'string' ? o : o.v, lab = typeof o === 'string' ? o : (o.l || o.v), sm = o.s ? ` <small>${esc(o.s)}</small>` : '';
          const on = f.type === 'check' ? arr.includes(val0) : arr === val0;
          return `<label class="opt${on ? ' on' : ''}"><input type="${f.type === 'check' ? 'checkbox' : 'radio'}" name="${f.id}" data-f="${f.id}" data-t="${f.type}" value="${esc(val0)}"${on ? ' checked' : ''}>${esc(lab)}${sm}</label>`;
        }).join('')}</div>${hint}</div>`;
      }
      case 'text':
        return `<div class="fld"><label for="f_${f.id}">${fillE(f.label)}</label><input type="text" id="f_${f.id}" data-f="${f.id}" data-t="text" value="${esc(v != null ? v : (f.def || ''))}" placeholder="${esc(f.ph || '')}">${hint}</div>`;
      case 'area': {
        const ai = f.ai ? `<div class="row"><button class="btn spark" data-ai="${f.id}">✨ 交給 AI 優化</button><span class="hint" id="ai_${f.id}"></span></div>` : '';
        return `<div class="fld"><label for="f_${f.id}">${fillE(f.label)}</label><textarea id="f_${f.id}" data-f="${f.id}" data-t="text" rows="${f.rows || 4}" placeholder="${esc(f.ph || '')}">${esc(v != null ? v : (f.def || ''))}</textarea>${ai}${hint}</div>`;
      }
      case 'select':
        return `<div class="fld"><label for="f_${f.id}">${f.label || ''}</label><select id="f_${f.id}" data-f="${f.id}" data-t="text">${f.options.map(o => `<option${(v || f.def) === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>${hint}</div>`;
      default: {
        const w = W[f.type];
        return w ? `<div class="fld" data-w="${f.type}" data-wid="${f.id || ''}">${w.html(f)}</div>` : '';
      }
    }
  }
  function panelHTML(s) {
    const fs = s.fields || [];
    return `<div class="panel">${s.panelTitle ? `<h3>${s.panelTitle}</h3>` : ''}${fs.map(fieldHTML).join('')}</div>`;
  }

  /* ───────── 特殊元件 ───────── */
  const W = {};
  W.folder = {
    html: () => folder.can()
      ? `<div class="row"><button class="btn am" data-act="pickFolder">📁 ${folder.h ? '重新選擇' : '選擇'}我的上課資料夾</button></div>
         <p class="txt" style="font-size:20px">${folder.h ? `目前資料夾：<b>${esc(folder.h.name)}</b>（之後按「下載」都會直接存進這裡）` : '還沒選。<b>不要直接選「文件」「桌面」「下載」本身</b>（Chrome 會拒絕）：按下按鈕後，先在「文件」裡按「新增資料夾」建一個 <b>載具課程</b>，點進去再按「選取資料夾」，跳出詢問時按「編輯檔案／允許」。'}</p>`
      : `<p class="warn">這個瀏覽器不能指定資料夾，請改用電腦版 Chrome 或 Edge。</p>`
  };
  W.bridge = {
    html: () => {
      const loc = bridge.local, lights = Object.keys(ENG).map(k => `<span class="light${bridge.engines[k] ? ' on' : bridge.nologin[k] ? ' half' : ''}"><i class="dot"></i>${ENG[k]}${bridge.nologin[k] ? '（還沒登入）' : ''}</span>`).join('');
      const cliBtns = k => (k === 'groq') ? '' : `<span class="clibtn"><button class="btn sm" data-act="cliInstall" data-eng="${k}">⬇ 安裝</button><button class="btn sm am" data-act="cliLogin" data-eng="${k}">🔑 登入</button></span>`;
      const engRow = k => `<div class="engrow"><span class="light${bridge.engines[k] ? ' on' : bridge.nologin[k] ? ' half' : ''}"><i class="dot"></i>${ENG[k]}</span>${bridge.engines[k] ? '<b class="ok">✅ 可用</b>' : bridge.nologin[k] ? '<b class="warn">已裝好，還沒登入</b>' : ''}${bridge.local ? cliBtns(k) : ''}</div>`;
      return `<div class="q">A. 用我自己電腦的 AI（建議：✨ 與一鍵建置都用它）</div>
      <div class="row"><button class="btn am" data-act="getBridge">⬇ 下載 載具課程串接包</button><button class="btn" data-act="detect">🔄 重新偵測</button></div>
      <ol class="list" style="margin:.3em 0"><li>下載後到資料夾雙擊「<b>開啟載具課程串接器.cmd</b>」，跳出黑色視窗（開著＝串接中）。</li><li>回來按「🔄 重新偵測」；Chrome 若問「存取本機網路上的裝置」請按<b>允許</b>。</li><li>串接器開著後，下面每個 AI 都能按「<b>⬇ 安裝</b>」「<b>🔑 登入</b>」——會跳出終端機視窗，照畫面做完再按「重新偵測」。</li></ol>
      <div class="engs">${['codex', 'claude', 'agy', 'groq'].map(engRow).join('')}</div>
      ${!bridge.local ? '<p class="hint">※ 先啟動串接器，才會出現各 AI 的「安裝／登入」按鈕。</p>' : ''}
      <p class="hint">${loc ? `<span class="ok">✅ 已串接您電腦裡的 AI。✨ 由您的 AI 寫；一鍵建置的成品放在：${esc(bridge.base || '文件\\載具課程')}</span>` : bridge.found ? '串接器有開，但還沒有一家 AI 可以用：登入後按「🔄 重新偵測」。' : '尚未偵測到本機串接器。'}</p>
      <div class="q" style="margin-top:.6em">B. 用我自己的 AI 金鑰（免安裝；本機串接器沒開時用這個）</div>
      <p class="hint">貼上您自己的 <b>Gemini</b>、<b>Groq</b>（兩家有免費額度）或 <b>OpenAI</b> 金鑰，✨ 由您自己的額度負責。金鑰<b>只存在您這台電腦</b>，不會上傳、也不經過課程伺服器。</p>
      <div class="row" style="gap:6px;flex-wrap:wrap">
        <select id="byokP" style="font:inherit;padding:6px 9px;border-radius:9px;border:1.5px solid #b9c4d6">${Object.keys(byok.providers).map(p => `<option value="${p}"${byok.provider === p ? ' selected' : ''}>${esc(byok.providers[p].label)}</option>`).join('')}</select>
        <input id="byokK" type="password" placeholder="${esc(byok.providers[byok.provider].keyHint)}" value="${esc(byok.keyOf(byok.provider))}" style="flex:1;min-width:160px;font:inherit;padding:7px 10px;border-radius:9px;border:1.5px solid #b9c4d6">
        <button class="btn am" data-act="byokSave">儲存並測試</button>
      </div>
      <div class="row" style="margin-top:4px"><a href="${byok.providers[byok.provider].url}" target="_blank" rel="noopener" class="hint" id="byokLink">免費申請金鑰 ↗</a></div>
      <ol class="list">${(bridge.steps || []).map(s => `<li class="${s.ok ? 'ok' : 'bad'}">${s.ok ? '✅' : s.warn ? '🟡' : '❌'} <b>${esc(s.name)}</b>　${esc(s.msg || '')}${s.fix ? '<br>怎麼修：' + esc(s.fix) : ''}</li>`).join('')}</ol>
      <p class="hint">${bridge.connected ? '目前 ✨ 由「' + (loc ? '您電腦裡的 AI' : '您的雲端金鑰') + '」負責。' : '沒亮燈也可以繼續上課，✨ 會先給示範內容。'}</p>`;
    }
  };
  W.build = {
    html: () => {
      const st = build.st, eng = bridge.pickBuilder();
      const head = `<div class="q">🤖 一鍵交給我的 AI 建置（免複製貼上）</div>`;
      if (!bridge.local) return head + `<p class="hint">需要本機串接器（U00「A. 用我自己電腦的 AI」）。沒開也沒關係：用上面的「產生安裝包＋複製指令」，貼給 AI 也能完成。</p><div class="row"><button class="btn" data-act="detect">🔄 偵測本機串接器</button></div>`;
      if (!eng) return head + `<p class="warn">串接器有開，但 Codex／Claude Code／Antigravity 都還不能用（Groq 只能寫文字）。登入後按重新偵測。</p>`;
      let h = head + `<p class="txt">按下去：安裝包會寫進 <b>${esc(bridge.base || '文件\\載具課程')}</b>，由 <b>${esc(ENG[eng])}</b> 在背景照 INSTALL.md 做出網頁並自己測試（約 5～15 分鐘），您可以繼續上課。</p>`;
      const running = st && st.status === 'running';
      h += `<div class="row"><button class="btn am" data-act="build" ${running ? 'disabled' : ''}>🤖 ${st && st.status !== 'running' ? '再建置一次' : '一鍵交給 ' + esc(ENG[eng]) + ' 建置'}</button>${running ? '<button class="btn ghost" data-act="buildCancel">⏹ 取消</button>' : ''}</div>`;
      if (st) {
        const tag = { running: '⏳ AI 正在做', done: '✅ 完成', error: '❌ 沒有完成', cancelled: '⏹ 已取消', lost: '🟡 暫時連不到串接器' }[st.status] || st.status;
        h += `<p class="${st.status === 'done' ? 'see' : st.status === 'error' ? 'warn' : 'hint'}" style="margin:.4em 0">${tag}${st.seconds ? `（${Math.round(st.seconds)} 秒）` : ''}　${esc(st.msg || '')}</p>`;
        if ((st.files || []).length) h += `<div class="q" style="margin-top:.3em">AI 已建立的檔案（${st.files.length}）</div><ul class="list" style="max-height:160px;overflow:auto;font-size:14px">${st.files.map(x => `<li>📄 ${esc(x.path)}（${Math.max(1, Math.round(x.size / 1024))} KB）</li>`).join('')}</ul>`;
        if (st.log) h += `<pre class="prev blog" style="max-height:220px;min-height:80px;font-size:13px">${esc(st.log.slice(-4000))}</pre>`;
        if (st.status === 'done' || st.index) h += `<div class="row"><button class="btn am" data-act="buildOpen" data-what="page">🌐 打開我的成品網頁</button><button class="btn ghost" data-act="buildOpen" data-what="out">📂 打開成品資料夾</button></div>`;
        else if (st.status !== 'running') h += `<div class="row"><button class="btn ghost" data-act="buildOpen" data-what="pack">📂 打開安裝包資料夾</button></div>`;
      }
      return h;
    },
    async mount() { if (build.id && !build.st) build.poll(); }
  };
  W.engine = {
    html: f => `<div class="q">${f.label || '✨ 要叫哪一個 AI？'}</div><div class="opts">${Object.keys(ENG).map(k => `<label class="opt${(val('engine') || '') === k ? ' on' : ''}"><input type="radio" name="engine" data-f="engine" data-t="radio" value="${k}"${(val('engine') || '') === k ? ' checked' : ''}>${ENG[k]}${bridge.engines[k] ? ' 🟢' : ''}</label>`).join('')}</div>`
  };
  /* 官方技能包：讀 GitHub 目錄 → 勾選 → 存進資料夾 */
  const VENDORS = D.vendors || {};
  W.skillshop = {
    html: f => {
      const cur = S.f._vendor || Object.keys(VENDORS)[0];
      return `<div class="tabs">${Object.keys(VENDORS).map(k => `<button class="tab${k === cur ? ' on' : ''}" data-vendor="${k}">${esc(VENDORS[k].name)}</button>`).join('')}</div>
        <p class="hint" id="skmeta">讀取 GitHub 清單中…</p>
        <div class="sk" id="sklist"></div>
        <div class="row"><button class="btn am" data-act="getSkills">⬇ 下載勾選的技能到資料夾</button><a class="btn ghost" id="skzip" target="_blank" rel="noopener">整包 ZIP</a><a class="btn ghost" id="skgh" target="_blank" rel="noopener">GitHub 頁面</a></div>
        <div class="bar2"><i id="skbar"></i></div>`;
    },
    async mount() {
      const cur = S.f._vendor || Object.keys(VENDORS)[0], v = VENDORS[cur];
      $('skzip').href = `https://github.com/${v.repo}/archive/refs/heads/main.zip`; $('skgh').href = `https://github.com/${v.repo}`;
      const list = await skillTree(v.repo).catch(e => null);
      if (!list) { $('skmeta').innerHTML = '<span class="bad">讀不到 GitHub 清單（可能是網路或一小時內查太多次）。請改按「整包 ZIP」。</span>'; return; }
      const picked = S.f['sk_' + cur] || v.def || [];
      $('skmeta').textContent = `${v.name}｜${v.repo}｜共 ${list.length} 個技能。勾你想帶回家的（建議 2～4 個）：`;
      $('sklist').innerHTML = list.map(s => `<label class="opt${picked.includes(s.name) ? ' on' : ''}" title="${esc(s.dir)}"><input type="checkbox" data-f="sk_${cur}" data-t="check" value="${esc(s.name)}"${picked.includes(s.name) ? ' checked' : ''}>${esc(s.name)}</label>`).join('');
    }
  };
  const treeCache = {};
  async function skillTree(repo) {
    if (treeCache[repo]) return treeCache[repo];
    const ck = 'aiteam.tree.' + repo;
    try { const c = JSON.parse(sessionStorage.getItem(ck) || 'null'); if (c) return (treeCache[repo] = c); } catch (e) { }
    const j = await fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
    const files = j.tree.filter(t => t.type === 'blob').map(t => ({ path: t.path, size: t.size }));
    const skills = j.tree.filter(t => /(^|\/)SKILL\.md$/.test(t.path)).map(t => {
      const dir = t.path.replace(/\/?SKILL\.md$/, ''); const name = dir.split('/').pop();
      return { name, dir, files: files.filter(f => f.path.startsWith(dir + '/')).map(f => f.path) };
    }).sort((a, b) => a.name.localeCompare(b.name) || a.dir.length - b.dir.length).filter((x, i, arr) => !i || arr[i - 1].name !== x.name);
    try { sessionStorage.setItem(ck, JSON.stringify(skills)); } catch (e) { }
    return (treeCache[repo] = skills);
  }
  async function getSkills() {
    const cur = S.f._vendor || Object.keys(VENDORS)[0], v = VENDORS[cur];
    const names = S.f['sk_' + cur] || v.def || [];
    if (!names.length) return toast('請先勾選至少一個技能');
    const list = await skillTree(v.repo);
    const chosen = list.filter(s => names.includes(s.name));
    const all = chosen.flatMap(s => s.files.map(p => ({ s, p })));
    if (all.length > 400) return toast('勾太多了（' + all.length + ' 個檔），請少勾幾個');
    const out = []; let n = 0;
    for (const x of all) {
      const r = await fetch(`https://raw.githubusercontent.com/${v.repo}/main/${x.p.split('/').map(encodeURIComponent).join('/')}`);
      if (r.ok) out.push({ path: `01_官方技能包/${cur}/${x.s.name}/${x.p.slice(x.s.dir.length + 1)}`, content: new Uint8Array(await r.arrayBuffer()) });
      n++; const bar = $('skbar'); if (bar) bar.style.width = Math.round(n / all.length * 100) + '%';
    }
    out.push({ path: `01_官方技能包/${cur}/00_來源.txt`, content: `來源：https://github.com/${v.repo}\n下載時間：${new Date().toLocaleString('zh-TW')}\n技能：${names.join('、')}\n授權：各技能資料夾內的 LICENSE 為準。\n` });
    const how = await saveFiles(out, `官方技能包_${cur}.zip`);
    S.f['got_' + cur] = names; save();
    toast(how === 'folder' ? `✅ ${names.length} 個技能已存進「01_官方技能包/${cur}」` : '✅ 已下載 ZIP（還沒設定資料夾，所以放在「下載」）', 5000);
  }
  /* 看一支官方 SKILL.md（從 GitHub 即時讀） */
  W.skillview = {
    opts() {
      const o = [];
      Object.keys(VENDORS).forEach(k => { const v = VENDORS[k]; const names = S.f['got_' + k] || S.f['sk_' + k] || v.def || []; names.forEach(n => o.push(k + '/' + n)); });
      if (!o.length) o.push('anthropic/skill-creator');
      return o;
    },
    html: f => { const o = W.skillview.opts(); const cur = o.includes(S.f._sv) ? S.f._sv : (o.includes(f.def) ? f.def : o[0]);
      return `<div class="row"><select id="svsel" style="font:19px var(--font);padding:8px 10px;border-radius:10px;border:1.5px solid #b9c4d6;flex:1">${o.map(x => `<option${x === cur ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select><button class="btn am" data-act="svload">打開這支</button></div>
        <div class="see" id="svmeta" style="font-size:18px">讀取中</div><pre class="prev" id="svpre" style="font-size:15px"></pre>`; },
    async mount(f) { const sel = $('svsel'); if (sel) await W.skillview.load(sel.value); },
    async load(key) {
      S.f._sv = key; save();
      const [vk, name] = key.split('/'); const v = VENDORS[vk]; const meta = $('svmeta'), pre = $('svpre'); if (!v || !pre) return;
      try {
        const list = await skillTree(v.repo); const sk = list.find(x => x.name === name); if (!sk) throw new Error('清單裡找不到 ' + name);
        const txt = await fetch(`https://raw.githubusercontent.com/${v.repo}/main/${sk.dir.split('/').map(encodeURIComponent).join('/')}/SKILL.md`).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); });
        const fm = (txt.match(/^---\s*\n([\s\S]*?)\n---/) || [])[1] || '';
        const g = k => ((fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm')) || [])[1] || '').replace(/^["']|["']$/g, '');
        const lines = txt.split('\n').length, others = sk.files.filter(p => !/SKILL\.md$/.test(p)).length;
        meta.innerHTML = `<b>name：</b>${esc(g('name'))}<br><b>description：</b>${esc(g('description').slice(0, 260))}${g('description').length > 260 ? '（後略）' : ''}<br><b>大小：</b>SKILL.md 共 ${lines} 行，另附 ${others} 個檔（腳本、參考資料、範本）`;
        pre.textContent = txt.split('\n').slice(0, 80).join('\n') + (lines > 80 ? '\n\n（以下省略，完整內容在你的資料夾或 GitHub）' : '');
      } catch (e) { meta.innerHTML = '<span class="bad">讀不到這支 SKILL.md（' + esc(e.message) + '）。可以到你的資料夾 01_官方技能包 直接用記事本打開。</span>'; }
    }
  };
  /* 即時預覽：data 裡的 build(S.f) 回傳文字 */
  W.preview = {
    html: f => `<div class="q">${f.label || '即時預覽'}</div><pre class="prev" data-live="${f.id}"></pre>`,
    paint(f, el) { el.querySelector('pre').textContent = D.build[f.id](S.f, ctx); }
  };
  /* 上傳手邊資料（存在瀏覽器，打包時一起放進安裝包） */
  W.upload = {
    html: f => `<div class="q">${f.label || '上傳你手邊的資料'}</div><div class="row"><label class="btn am" style="display:inline-flex;align-items:center">📎 選擇檔案<input type="file" multiple data-up="${f.id}" hidden></label><button class="btn ghost" data-act="clearUp" data-id="${f.id}">清空</button></div><ul class="list" id="upl_${f.id}"></ul>${f.hint ? `<p class="hint">${f.hint}</p>` : ''}`,
    async mount(f) {
      const m = (await idb.get('up.' + D.id + '.' + f.id)) || [];
      const ul = $('upl_' + f.id); if (ul) ul.innerHTML = m.length ? m.map(x => `<li>${esc(x.name)}（${Math.ceil(x.size / 1024)} KB）</li>`).join('') : '<li class="hint">還沒有檔案（可以不放）</li>';
    }
  };
  W.dlfiles = {
    html: f => `<div class="q">${f.label || ''}</div><div class="row">${(f.items || []).map((x, i) => `<button class="btn ${x.cls || 'am'}" data-act="dlfile" data-i="${i}" data-wid2="${f.id}">⬇ ${esc(x.label)}</button>`).join('')}</div>${f.hint ? `<p class="hint">${f.hint}</p>` : ''}`
  };
  W.links = {
    html: f => `<div class="q">${f.label || ''}</div><div class="row">${(f.items || []).map(x => `<a class="btn ${x.cls || 'ghost'}" href="${esc(x.href)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join('')}</div>${f.hint ? `<p class="hint">${f.hint}</p>` : ''}`
  };
  W.pack = {
    html: f => `<div class="row"><button class="btn am" data-act="pack">📦 產生安裝包，存進我的資料夾</button><button class="btn ghost" data-act="copyCmd">📋 複製給 AI 的指令</button></div><pre class="prev" data-live="pack_cmd" style="min-height:160px"></pre><p class="hint" id="packmsg"></p>`,
    paint(f, el) { el.querySelector('pre').textContent = D.packCommand(S.f, ctx); }
  };
  /* 即時組好的指令＋一鍵複製：data 裡的 build[f.id](S.f) 回傳文字 */
  W.copybox = {
    html: f => `<div class="q">${f.label || '給 AI 的指令'}</div><pre class="prev" data-live="${f.id}" style="min-height:140px"></pre><div class="row"><button class="btn am" data-copybox="${f.id}">📋 ${esc(f.btn || '複製這段指令')}</button></div>${f.hint ? `<p class="hint">${f.hint}</p>` : ''}`,
    paint(f, el) { el.querySelector('pre').textContent = D.build[f.id](S.f, ctx); }
  };
  W.vehicle3d = {
    html: f => `<div class="q">${f.label || '我的載具（3D 即時預覽，可拖曳轉動）'}</div><iframe class="v3d" title="載具 3D 預覽" style="width:100%;height:${f.h || 380}px;border:0;border-radius:14px;background:#eef3f8"></iframe>`,
    paint(f, el) { const u = window.VK ? window.VK.previewUrl(S.f) : ''; const ifr = el.querySelector('iframe'); if (u && ifr.dataset.u !== u) { ifr.dataset.u = u; ifr.src = u; } }
  };
  W.checklist = {
    html: f => `<div class="q">${f.label || '打包前檢查'}</div><ul class="list" data-live="checklist"></ul>`,
    paint(f, el) { el.querySelector('ul').innerHTML = D.checklist(S.f, ctx).map(c => `<li class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✅' : '⬜'} ${esc(c.t)}</li>`).join(''); }
  };
  /* 外掛互動元件（course/widgets.js 的 window.DECK_WIDGETS）：計算器、模擬器、3D 建模 */
  if (typeof window.DECK_WIDGETS === 'function') Object.assign(W, window.DECK_WIDGETS({ S, setv, val, esc, fill, toast, D, rerender: () => render() }));
  /* 範本檔（templates/ 底下）：文字或位元組 */
  const tpl = async (p, bin) => { const r = await fetch('templates/' + p.split('/').map(encodeURIComponent).join('/'), { cache: 'no-store' }); if (!r.ok) throw new Error('讀不到範本 ' + p); return bin ? new Uint8Array(await r.arrayBuffer()) : r.text(); };
  const ctx = { esc, fill, folder, bridge, ENG, unitPages, toast, tpl, idb, D };

  /* ───────── 畫一頁 ───────── */
  function slideHTML(s) {
    const unit = s.u, chip = `<span class="chip${s.kind === 'do' ? ' do' : ''}">${esc(unit)}</span>`;
    const stepChip = s.step ? `<span class="chip step">${esc(s.step)}</span>` : '';
    const say = s.say ? `<div class="say"><b>阿亮老師說：</b>${s.say}</div>` : '';
    const foot = `<div class="snav"><button data-nav="prev" ${s._i <= 0 ? 'disabled' : ''}>◀ 上一頁</button><button data-nav="home">🏠 回首頁</button><button data-nav="next" ${s._i >= SL.length - 1 ? 'disabled' : ''}>下一頁 ▶</button></div><div class="foot">${esc(D.title)}｜${esc(unit)} ${esc(unitTitle(unit))}｜第 ${s._p} 頁</div>`;
    if (s.kind === 'recap') return recapHTML(s, chip, say, foot);
    if (s.kind === 'cover') {
      return `<section class="slide cover"><div class="cv"><div><div class="kick">${s.kick || ''}</div><h1>${s.title}</h1>${s.sub ? `<p>${s.sub}</p>` : ''}${s.list ? `<ul>${s.list.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}</div><div class="col">${imgsCol(s.imgs)}${s.html || ''}</div></div>${say}${foot}</section>`;
    }
    const head = `<div class="shead">${chip}${stepChip}<h1>${s.title}</h1></div>`;
    let body;
    const hasPanel = s.fields && s.fields.length;
    if (hasPanel && (s.imgs || []).length) body = `<div class="sbody ${s.layout || ''}"><div class="col">${textCol(s)}${imgsCol(s.imgs)}</div><div class="col">${panelHTML(s)}</div></div>`;
    else if (hasPanel) body = `<div class="sbody ${s.layout || 'wideR'}"><div class="col">${textCol(s)}</div><div class="col">${panelHTML(s)}</div></div>`;
    else if ((s.imgs || []).length) body = `<div class="sbody ${s.layout || ''}"><div class="col">${textCol(s)}</div><div class="col">${imgsCol(s.imgs)}</div></div>`;
    else body = `<div class="sbody one"><div class="col">${textCol(s)}</div></div>`;
    return `<section class="slide">${head}${body}${say}${foot}</section>`;
  }

  /* 本單元盤點頁：列出每個動手步驟、有沒有填好；點一下回到那一頁 */
  const TRACK = ['area', 'check', 'radio', 'select', 'text'];
  function stepState(x) {
    const fs = (x.fields || []);
    if (fs.some(f => f.type === 'folder')) return PRINT || folder.ok() ? 1 : 0;
    if (fs.some(f => f.type === 'bridge')) return PRINT || bridge.connected ? 1 : 0;
    const ids = fs.filter(f => TRACK.includes(f.type) && f.id).map(f => f.id);
    if (!ids.length) return 2;
    return ids.every(id => { const v = S.f[id]; return Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== ''; }) ? 1 : 0;
  }
  function recapHTML(s, chip, say, foot) {
    const all = unitPages[s.u].map(i => SL[i]);
    const dos = all.filter(x => x.kind === 'do');
    const items = (dos.length ? dos : all.filter(x => x.kind !== 'recap')).map(x => {
      const st = stepState(x), mark = st === 1 ? '✅' : st === 2 ? '👀' : '⬜', tip = st === 1 ? '完成' : st === 2 ? '看過就好' : '還沒填';
      return `<li class="r${st}"><a href="#" data-go="${x._i}"><span class="mk">${mark}</span><span class="st">${esc(x.step || '第 ' + x._p + ' 頁')}</span><span class="tt">${esc(String(x.title).replace(/<[^>]+>/g, ''))}</span><span class="tp">${tip}</span></a></li>`;
    }).join('');
    const ok = dos.filter(x => stepState(x) !== 0).length;
    const ui = D.units.findIndex(x => x.u === s.u), nu = D.units[ui + 1];
    const nxt = nu && unitPages[nu.u] ? `<button class="btn am" data-go="${unitPages[nu.u][0]}">下一單元：${esc(nu.u)} ${esc(nu.title)} ▶</button>` : '';
    const extra = (D.units[ui] || {}).done;
    return `<section class="slide recap"><div class="shead">${chip}<span class="chip step">盤點</span><h1>${esc(s.u)} ${esc(unitTitle(s.u))}｜完成盤點</h1></div>
      <div class="sbody one"><div class="col"><p class="why">這個單元有 <b>${dos.length}</b> 個動手步驟，已完成 <b>${ok}</b> 個。點任一項可以回到那一頁補做。</p>
      <ol class="rlist">${items}</ol>${extra ? `<div class="rdone"><span class="lbl">這個單元帶走的成果</span><ul>${extra.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
      <div class="row rbtns"><a class="btn" href="../">🏠 回首頁</a>${nxt}</div></div></div>${say}${foot}</section>`;
  }

  function refreshLive() {
    document.querySelectorAll('[data-w]').forEach(el => {
      const w = W[el.dataset.w]; if (!w || !w.paint) return;
      const s = SL[S.i]; const f = PRINT ? findField(el.dataset.w, el.dataset.wid) : (s.fields || []).find(x => x.type === el.dataset.w && (x.id || '') === el.dataset.wid);
      if (f) try { w.paint(f, el); } catch (e) { console.warn(e); }
    });
  }
  const findField = (t, id) => { for (const s of SL) for (const f of (s.fields || [])) if (f.type === t && (f.id || '') === id) return f; return null; };

  function render() {
    const st = $('stage');
    if (PRINT) {
      st.innerHTML = SL.filter(s => !Q.get('u') || s.u === Q.get('u')).map(slideHTML).join('');
      refreshLive();
      const mounts = []; SL.filter(s => !Q.get('u') || s.u === Q.get('u')).forEach(s => (s.fields || []).forEach(f => { const w = W[f.type]; if (w && w.mount) mounts.push(w.mount(f).catch(() => null)); }));
      Promise.race([Promise.all(mounts), new Promise(r => setTimeout(r, 15000))]).then(() => { st.querySelectorAll('input,textarea,select,button').forEach(e => e.disabled = true); document.body.dataset.ready = '1'; });
      return;
    }
    const s = SL[S.i];
    st.innerHTML = slideHTML(s);
    $('dtitle').textContent = D.title;
    $('utitle').textContent = `${s.u} ${unitTitle(s.u)}`;
    const mt = `${s.u} ${unitTitle(s.u)}　・　第 ${s._p} / ${unitPages[s.u].length} 頁`;
    if ($('mqt').textContent !== mt) $('mqt').textContent = mt;
    $('pg').textContent = `${S.i + 1} / ${SL.length}`;
    $('prev').disabled = S.i <= 0; $('next').disabled = S.i >= SL.length - 1;
    (s.fields || []).forEach(f => { const w = W[f.type]; if (w && w.mount) w.mount(f).catch(e => console.warn(e)); });
    refreshLive(); paintToc(); fit();
    if (PLAT) { paintSide(); paintSteps(); const m = $('main'); if (m && render._last !== S.i) m.scrollTop = 0; render._last = S.i; }
    const u = new URL(location.href); u.searchParams.set('u', s.u); u.searchParams.set('p', s._p); history.replaceState(null, '', u);
    if (remote) remote.postMessage({ t: 'state', u: s.u, p: s._p, total: unitPages[s.u].length });
  }
  function go(i) { const n = Math.min(Math.max(0, i), SL.length - 1); if (n === S.i) return; S.i = n; save(); render(); }

  function fit() {
    if (PRINT || PLAT) return;
    /* 滿版：依視窗比例把頁面撐開（寬螢幕就變寬、高螢幕就變高），不留左右空白 */
    const w = $('wrap'), m = SHOW ? 1 : 0.985, W = w.clientWidth * m, H = w.clientHeight * m;
    const sw = Math.max(1600, Math.round(900 * W / H)), sh = Math.max(900, Math.round(1600 * H / W));
    const st = $('stage'); st.style.width = sw + 'px'; st.style.height = sh + 'px';
    st.style.transform = `scale(${Math.min(W / sw, H / sh)})`;
  }

  function paintToc() {
    const box = $('toclist'); if (!box || $('toc').hidden) return;
    box.innerHTML = D.units.map(u => `<div class="tu">${esc(u.u)} ${esc(u.title)}</div>` + (unitPages[u.u] || []).map(i => `<a href="#" data-go="${i}" class="${i === S.i ? 'cur' : ''} ${SL[i].kind === 'do' ? 'do' : ''}">${SL[i]._p}. ${esc(String(SL[i].title).replace(/<[^>]+>/g, ''))}</a>`).join('')).join('');
    const c = box.querySelector('.cur'); if (c) c.scrollIntoView({ block: 'center' });
  }

  /* ───────── 事件 ───────── */
  document.addEventListener('input', e => {
    const t = e.target, id = t.dataset && t.dataset.f; if (!id) return;
    if (t.dataset.t === 'check') {
      const arr = [...document.querySelectorAll(`input[data-f="${id}"]:checked`)].map(x => x.value);
      setv(id, arr); t.closest('.opt').classList.toggle('on', t.checked);
    } else if (t.dataset.t === 'radio') {
      setv(id, t.value); document.querySelectorAll(`input[data-f="${id}"]`).forEach(x => x.closest('.opt').classList.toggle('on', x.checked));
      const af = findField('radio', id); if (af && af.answer) render();
      if (id === 'engine') { shared.engine = t.value; saveShared(); }
    } else setv(id, t.value);
  });
  document.addEventListener('change', async e => {
    const t = e.target;
    if (t.id === 'byokP') {   // 切換 Gemini／Groq：換提示字、換金鑰欄、換申請連結
      byok.setProvider(t.value);
      const k = document.getElementById('byokK'), lk = document.getElementById('byokLink');
      if (k) { k.placeholder = byok.providers[t.value].keyHint; k.value = byok.keyOf(t.value); }
      if (lk) lk.href = byok.providers[t.value].url;
      return;
    }
    if (!t.dataset || !t.dataset.up) return;
    const key = 'up.' + D.id + '.' + t.dataset.up;
    const m = (await idb.get(key)) || [];
    for (const f of t.files) { if (f.size > 20 * 1024 * 1024) { toast(f.name + ' 超過 20MB，略過'); continue; } m.push({ name: f.name, size: f.size, data: new Uint8Array(await f.arrayBuffer()) }); }
    await idb.set(key, m); S.f['upcount_' + t.dataset.up] = m.length; save();
    const w = W.upload; w.mount({ id: t.dataset.up }); refreshLive(); toast('✅ 已加入 ' + t.files.length + ' 個檔案');
  });
  document.addEventListener('click', async e => {
    const t = e.target.closest('button,a,img,[data-go]'); if (!t) return;
    if (t.matches('.shot img')) return openLb(t.src);
    if (t.dataset.go) { e.preventDefault(); go(+t.dataset.go); return; }
    if (t.dataset.nav) { if (t.dataset.nav === 'home') location.href = '../portal.html'; else go(S.i + (t.dataset.nav === 'next' ? 1 : -1)); return; }
    if (t.dataset.copybox) { const f = findField('copybox', t.dataset.copybox); if (f) copy(D.build[f.id](S.f, ctx)); return; }
    if (t.dataset.copy !== undefined) { const txt = t.parentElement.querySelector('span').textContent; copy(txt); return; }
    if (t.dataset.vendor) { S.f._vendor = t.dataset.vendor; save(); render(); return; }
    if (t.dataset.ai) return aiFill(t);
    const act = t.dataset.act; if (!act) return;
    t.disabled = true;
    try {
      if (act === 'pickFolder') await folder.pick();
      else if (act === 'detect') { const ok = await bridge.detect(true); render(); toast(ok ? '🟢 串接成功！' + (Object.keys(bridge.nologin).length ? '（' + Object.keys(bridge.nologin).map(k => ENG[k]).join('、') + ' 還沒登入）' : '') : bridge.found ? '🟡 串接器有開，但 AI 還沒登入：照畫面上的登入指令登入後，再按一次重新偵測。' : '偵測不到串接器：黑色視窗有開嗎？Chrome 問「存取本機網路」要按允許。', 7000); }
      else if (act === 'getBridge') { const fs = await bridge.files(); const how = await saveFiles(fs, '載具課程串接包.zip'); toast(how === 'folder' ? '✅ 串接包已存進「00_載具課程串接包」，去資料夾雙擊「開啟載具課程串接器.cmd」' : '✅ 已下載 載具課程串接包.zip，請解壓縮後雙擊「開啟載具課程串接器.cmd」', 7000); }
      else if (act === 'cliInstall' || act === 'cliLogin') {
        const eng = t.dataset.eng, action = act === 'cliLogin' ? 'login' : 'install';
        toast('正在開啟終端機視窗…', 2500);
        const r = await bridge.cli(eng, action);
        if (r.ok) toast(r.mode === 'url' ? ('已打開官網，照網頁說明安裝 ' + ENG[eng] + '，裝好回來按「🔑 登入」') : ('✅ ' + (r.hint || '已開啟終端機視窗，照畫面操作完再按「🔄 重新偵測」')), 9000);
        else toast('✘ ' + (r.error || '失敗'), 8000);
      }
      else if (act === 'byokSave') {
        const p = (document.getElementById('byokP') || {}).value || byok.provider;
        const k = (document.getElementById('byokK') || {}).value || '';
        byok.setKey(p, k);
        if (!k) { toast('請先貼上您自己的金鑰（只存在這台電腦）', 5000); return; }
        toast('測試中…（用您的金鑰送一句話）', 3000);
        const r = await byok.test(p);
        if (r.ok) { await bridge.detect(bridge.local); render(); toast('✅ ' + byok.providers[p].label + ' 金鑰可用，✨ 由您自己的額度負責', 6000); }
        else toast('✘ 金鑰有問題：' + (r.error || '測試失敗'), 8000);
      }
      else if (act === 'getSkills') await getSkills();
      else if (act === 'clearUp') { await idb.del('up.' + D.id + '.' + t.dataset.id); S.f['upcount_' + t.dataset.id] = 0; save(); W.upload.mount({ id: t.dataset.id }); refreshLive(); }
      else if (act === 'dlfile') { const f = findField('dlfiles', t.dataset.wid2), x = f.items[+t.dataset.i]; const fs = await x.files(S.f, ctx); const how = await saveFiles(fs, x.zip); toast(how === 'folder' ? '✅ 已存進資料夾：' + fs.map(z => z.path).join('、') : '✅ 已下載'); S.f['dl_' + f.id + '_' + t.dataset.i] = 1; save(); refreshLive(); }
      else if (act === 'pack') await pack();
      else if (act === 'getBridge') { const fs = await bridge.files(); const how = await saveFiles(fs, '載具課程串接包.zip'); toast(how === 'folder' ? '✅ 串接包已存進「00_載具課程串接包」，到資料夾雙擊「開啟載具課程串接器.cmd」' : '✅ 已下載 載具課程串接包.zip：解壓縮後雙擊「開啟載具課程串接器.cmd」', 8000); }
      else if (act === 'build') await build.start();
      else if (act === 'buildOpen') await build.open(t.dataset.what);
      else if (act === 'buildCancel') await build.cancel();
      else if (act === 'svload') await W.skillview.load($('svsel').value);
      else if (act === 'copyCmd') copy((D.packPrompt || D.packCommand)(S.f, ctx));
    } catch (err) { console.error(err); toast('出了點問題：' + err.message, 6000); }
    t.disabled = false;
  });
  async function copy(txt) {
    try { await navigator.clipboard.writeText(txt); toast('📋 已複製'); }
    catch (e) { const a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); toast('📋 已複製'); }
  }
  async function aiFill(btn) {
    const f = findField('area', btn.dataset.ai); if (!f) return;
    const msg = $('ai_' + f.id), ta = $('f_' + f.id);
    const ex = { _me: ta.value }; Object.keys(D.build || {}).forEach(k => { if (f.ai.prompt.includes('{{_b_' + k + '}}')) ex['_b_' + k] = D.build[k](S.f, ctx); });
    const prompt = fill(f.ai.prompt, ex);
    btn.disabled = true;
    if (!bridge.connected) await bridge.detect();
    if (bridge.connected) {
      msg.textContent = '⏳ ' + bridge.label(bridge.pick()) + ' 正在寫，約 10～60 秒…';
      const r = await bridge.run(prompt);
      if (r && r.ok && (r.text || r.json)) { ta.value = String(r.text || JSON.stringify(r.json)).trim(); setv(f.id, ta.value); msg.innerHTML = '<span class="ok">✅ ' + esc(bridge.label(r.via || 'cloud')) + ' 寫好了，可以再自己改</span>' + (r.note ? '<br><small>' + esc(r.note) + '</small>' : ''); }
      else msg.innerHTML = '<span class="bad">AI 沒有回應：' + esc((r && r.error && (r.error.plain || r.error)) || '未知原因') + '</span>';
    } else {
      ta.value = fill(f.ai.demo || '（示範內容）', { _me: ta.value }); setv(f.id, ta.value);
      msg.innerHTML = Object.keys(bridge.nologin || {}).length
        ? '你的 AI <b>已裝好但還沒登入</b>，先放示範內容；在 PowerShell 輸入 <b>' + Object.keys(bridge.nologin).map(k => esc(LOGIN[k])).join('</b> 或 <b>') + '</b> 登入後再按一次。'
        : '還沒串接 AI，先放<b>示範內容</b>；串接後再按一次就是你的 AI 寫的。';
    }
    btn.disabled = false;
  }
  async function pack() {
    const r = await D.pack(S.f, ctx);
    const files = Object.keys(r.files).map(p => ({ path: r.root + '/' + p, content: r.files[p] }));
    for (const u of (r.uploads || [])) {
      const m = (await idb.get('up.' + D.id + '.' + u.id)) || [];
      m.forEach(x => files.push({ path: r.root + '/' + u.dir + '/' + x.name, content: x.data }));
    }
    const z = new JSZip(); files.forEach(f => z.file(f.path, f.content));
    const blob = await z.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    let how;
    if (folder.ok() && await folder.perm().catch(() => false)) how = await saveFiles(files.concat([{ path: r.root + '.zip', content: blob }]), r.root + '.zip');
    else { dl(blob, r.root + '.zip'); how = 'download'; }
    S.f._packed = new Date().toLocaleString('zh-TW'); save(); refreshLive();
    const m = $('packmsg'); if (m) m.innerHTML = how === 'folder' ? `<span class="ok">✅ 已存進資料夾：「${esc(r.root)}」資料夾＋${esc(r.root)}.zip（共 ${files.length} 個檔）。下一步：複製指令貼給 AI。</span>` : `<span class="ok">✅ 已下載 ${esc(r.root)}.zip，請解壓縮到你的上課資料夾。</span>`;
  }

  /* 放大檢視：滾輪縮放、拖曳 */
  const lb = { k: 1, x: 0, y: 0 };
  function openLb(src) {
    const L = $('lb'), im = $('lbimg'); im.src = src; L.hidden = false;
    im.onload = () => { const k = Math.min(innerWidth * .92 / im.naturalWidth, innerHeight * .88 / im.naturalHeight, 2.5); lb.k = k; lb.x = (innerWidth - im.naturalWidth * k) / 2; lb.y = (innerHeight - im.naturalHeight * k) / 2; paintLb(); };
  }
  function paintLb() { $('lbimg').style.transform = `translate(${lb.x}px,${lb.y}px) scale(${lb.k})`; $('lbimg').style.left = '0'; $('lbimg').style.top = '0'; }
  (function () {
    const L = $('lb'); let drag = null, moved = false;
    L.addEventListener('wheel', e => { e.preventDefault(); const f = e.deltaY < 0 ? 1.15 : 1 / 1.15; const nk = Math.min(Math.max(lb.k * f, .1), 12); lb.x = e.clientX - (e.clientX - lb.x) * nk / lb.k; lb.y = e.clientY - (e.clientY - lb.y) * nk / lb.k; lb.k = nk; paintLb(); }, { passive: false });
    L.addEventListener('pointerdown', e => { drag = { x: e.clientX - lb.x, y: e.clientY - lb.y }; moved = false; L.setPointerCapture(e.pointerId); });
    L.addEventListener('pointermove', e => { if (!drag) return; moved = true; lb.x = e.clientX - drag.x; lb.y = e.clientY - drag.y; paintLb(); });
    L.addEventListener('pointerup', e => { if (!moved && e.target === L) L.hidden = true; drag = null; });
  })();

  document.addEventListener('keydown', e => {
    if (!$('lb').hidden) { if (e.key === 'Escape') $('lb').hidden = true; return; }
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (['ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && SHOW)) { e.preventDefault(); go(S.i + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(S.i - 1); }
    else if (e.key === 't' || e.key === 'T') toggleToc();
  });
  function toggleToc() { if (PLAT) { document.body.classList.toggle('nav-open'); return; } $('toc').hidden = !$('toc').hidden; paintToc(); }

  /* ───────── 平臺模式：外殼、左側欄、步驟分頁 ───────── */
  const PARTS = window.DECK_PARTS || [];
  function buildPlat() {
    document.body.classList.add('plat');
    const wrap = $('wrap'), side = document.createElement('aside'), main = document.createElement('div'), steps = document.createElement('nav');
    side.id = 'side'; main.id = 'main'; steps.id = 'stepper'; steps.setAttribute('aria-label', '本單元步驟');
    main.appendChild(steps); main.appendChild($('stage')); wrap.appendChild(side); wrap.appendChild(main);
    const scrim = document.createElement('div'); scrim.id = 'scrim'; scrim.onclick = () => document.body.classList.remove('nav-open'); document.body.appendChild(scrim);
    const sel = PARTS.length ? `<label class="partsel"><span>目前篇章：</span><select id="partsel">${PARTS.map(p => `<option value="${esc(p.id)}"${p.id === D.id ? ' selected' : ''}>${esc(p.t)}</option>`).join('')}</select></label>` : '';
    $('where').insertAdjacentHTML('beforebegin', `<a class="brand" href="../portal.html" title="回課程首頁"><span class="logo">AI</span><span class="brand-t"><b>無人載具 AI 互動平台</b><small>無人機・人形格鬥機器人・無人船</small></span></a>${sel}`);
    const ps = $('partsel'); if (ps) ps.onchange = () => { location.href = '?d=' + encodeURIComponent(ps.value); };
  }
  function paintSide() {
    const side = $('side'); if (!side) return;
    const cur = SL[S.i].u;
    const units = D.units.map(u => {
      const pages = unitPages[u.u] || []; const dos = pages.map(i => SL[i]).filter(x => x.kind === 'do');
      const ok = dos.filter(x => stepState(x) !== 0).length;
      return `<a href="#" class="nav-i${u.u === cur ? ' on' : ''}" data-go="${pages[0]}"><span class="ni">${esc(u.u)}</span><span class="nt">${esc(u.title)}</span>${dos.length ? `<span class="cnt${ok === dos.length ? ' full' : ''}">${ok}/${dos.length}</span>` : ''}</a>`;
    }).join('');
    const others = PARTS.filter(p => p.id !== D.id).map(p => `<a class="nav-i" href="?d=${encodeURIComponent(p.id)}"><span class="ni">↗</span><span class="nt">${esc(p.t)}</span></a>`).join('');
    side.innerHTML = `<div class="nav-g">${esc(D.title)}</div>${units}<div class="nav-g">其他</div>${others}<a class="nav-i" href="../portal.html"><span class="ni">🏠</span><span class="nt">課程首頁</span></a>
      <p class="side-tip">填寫的內容自動存在這台電腦的瀏覽器；右上角燈號是 AI 串接狀態。</p>`;
    document.body.classList.remove('nav-open');
  }
  function paintSteps(quiet) {
    const el = $('stepper'); if (!el) return;
    const s = SL[S.i], pages = unitPages[s.u];
    el.innerHTML = `<span class="stp-u">${esc(s.u)} ${esc(unitTitle(s.u))}</span>` + pages.map((i, k) => {
      const x = SL[i], st = x.kind === 'do' ? stepState(x) : -1;
      const name = x.kind === 'recap' ? '完成盤點' : String(x.title).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return `<a href="#" class="stp${i === S.i ? ' on' : ''}${x.kind === 'do' ? ' do' : ''}${st === 1 ? ' done' : ''}" data-go="${i}" title="${esc(name)}"><b>${st === 1 ? '✓' : k + 1}</b><span>${esc(x.step ? x.step + '｜' + name : name)}</span></a>`;
    }).join('');
    const on = el.querySelector('.on'); if (!quiet && on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  $('homebtn').onclick = () => { location.href = '../portal.html'; };
  $('prev').onclick = () => go(S.i - 1); $('next').onclick = () => go(S.i + 1);
  $('tocbtn').onclick = toggleToc; $('tocx').onclick = toggleToc;
  $('folderst').onclick = () => folder.pick();
  $('bridgest').onclick = async () => { const ok = await bridge.detect(true); render(); toast(ok ? '🟢 串接成功' : '偵測不到載具課程串接器（先到 U00 下載串接包）', 5000); };
  addEventListener('resize', fit);

  /* 教師控制台遙控（同一瀏覽器的兩個視窗，BroadcastChannel） */
  let remote = null;
  if (SHOW && 'BroadcastChannel' in window) {
    document.body.classList.add('show');
    remote = new BroadcastChannel('c5-teacher');
    remote.onmessage = ({ data: m }) => {
      if (m.t === 'ping') { const s = SL[S.i]; return remote.postMessage({ t: 'state', u: s.u, p: s._p, total: unitPages[s.u].length }); }
      if (m.t === 'go' && unitPages[m.u]) go(idxOf(m.u, m.p || 1));
    };
  }

  /* 起始頁：網址 ?u=&p= 優先，其次上次看到的頁 */
  if (Q.get('u') && unitPages[Q.get('u')]) S.i = idxOf(Q.get('u'), +Q.get('p') || 1);
  if (!(S.i >= 0 && S.i < SL.length)) S.i = 0;
  if (PRINT) document.body.classList.add('print');
  if (PLAT) buildPlat();
  folder.restore().then(render);
  if (!PRINT) bridge.detect().then(() => { const s = SL[S.i]; if ((s.fields || []).some(f => f.type === 'bridge' || f.type === 'engine')) render(); });
  if (remote) remote.postMessage({ t: 'hello', u: SL[S.i].u, p: SL[S.i]._p, total: unitPages[SL[S.i].u].length });
  window.DECKAPI = { S, go, render, ctx };
})();
