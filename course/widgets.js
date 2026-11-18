/* 互動元件外掛：deck.js 會呼叫 window.DECK_WIDGETS(api) 取得元件，合併進引擎。
 * 共用：kit3d（即時 3D 建模台）、kitstats（規格估算＋檢查）、kitpreset（套用任務建議規格）、kitspec（規格書全文）
 * 無人機專用：mixer（四顆馬達轉速差＝飛行動作）
 * 其他載具的專用元件：在自己的檔案 push 到 window.DECK_WIDGET_EXT（函式 api => ({ 元件名: {html, paint?, mount?} })）
 */
(function () {
  window.DECK_WIDGET_EXT = window.DECK_WIDGET_EXT || [];
  window.DECK_WIDGETS = function (api) {
    const { S, setv, esc, toast, rerender } = api;
    const KIT = k => (window.KITS || {})[k];
    const W = {};
    const frames = new Set();
    addEventListener('message', e => { if (e.data && e.data.type === 'labready') frames.forEach(fr => { if (fr.contentWindow === e.source) post(fr); }); });
    function syncFree() {
      document.querySelectorAll('iframe.kitfree').forEach(fr => { frames.add(fr); if (!fr.getAttribute('src')) fr.src = `../lab.html?k=${encodeURIComponent(fr.dataset.k)}&embed=1${fr.dataset.ex ? '&ex=1' : ''}`; else post(fr); });
    }
    function post(fr) { try { fr.contentWindow.postMessage({ type: 'kitspec', k: fr.dataset.k, f: S.f }, location.origin); } catch (e) { } }

    W.kit3d = {
      html: f => `<div class="q">${esc(f.label || '即時 3D 建模台（拖曳轉動、滾輪縮放；上方可拆解看零件）')}</div><iframe class="v3d" data-k="${esc(f.kit)}" title="3D 建模預覽" style="width:100%;height:${f.h || 420}px;border:0;border-radius:14px;background:#eef3f8"></iframe><div class="row"><a class="btn ghost" target="_blank" rel="noopener" data-full="${esc(f.kit)}">⛶ 全螢幕開啟</a></div>`,
      paint(f, el) {
        const fr = el.querySelector('iframe'); frames.add(fr);
        if (!fr.src) fr.src = `../lab.html?k=${encodeURIComponent(f.kit)}&embed=1${f.ex ? '&ex=1' : ''}`; else post(fr);
        const a = el.querySelector('[data-full]'); if (a) a.href = `../lab.html?k=${encodeURIComponent(f.kit)}#f=${encodeURIComponent(JSON.stringify(S.f))}`;
      }
    };
    W.kitstats = {
      html: f => `<div class="q">${esc(f.label || '規格估算與檢查（教學估算）')}</div><div class="kstat"></div>`,
      paint(f, el) {
        syncFree(); const K = KIT(f.kit); if (!K) return;
        const c = K.calc(K.spec(S.f)), rows = f.rows ? c.rows.slice(0, f.rows) : c.rows;
        el.querySelector('.kstat').innerHTML = `<table class="ktab">${rows.map(r => `<tr><th>${esc(r[0])}</th><td><b>${esc(r[1])}</b></td><td class="mut">${esc(r[2])}</td></tr>`).join('')}</table>`
          + c.warns.map(x => `<p class="warn" style="margin:.35em 0">⚠ ${x}</p>`).join('') + (f.goods === false ? '' : c.goods.map(x => `<p class="see" style="margin:.35em 0">✅ ${x}</p>`).join(''));
      }
    };
    W.kitpreset = {
      html: f => `<div class="row"><button class="btn am" data-kp="${esc(f.kit)}" data-from="${esc(f.from)}">⚙ 套用這個任務的建議規格</button></div><p class="hint">會把步驟 2～5 填成一組合理起點（之後都能改）。</p>`,
      async mount(f) {
        document.querySelectorAll(`[data-kp="${f.kit}"]`).forEach(b => b.onclick = () => {
          const K = KIT(f.kit); if (!K) return;
          const m = S.f[f.from] || K.DEF[f.from], p = K.PRESETS[m]; if (!p) { toast('這個任務沒有預設規格'); return; }
          Object.keys(p).forEach(id => { S.f[id] = p[id]; }); setv(f.from, m); rerender(); toast('已套用建議規格，往下一步看看細節');
        });
      }
    };
    W.kitspec = {
      html: f => `<div class="q">${esc(f.label || '規格書（會放進安裝包）')}</div><pre class="prev" style="max-height:340px;overflow:auto"></pre>`,
      paint(f, el) { const K = KIT(f.kit); if (K) el.querySelector('pre').textContent = K.md(K.spec(S.f)); }
    };

    /* 無人機：四顆馬達混控 ───────────────── */
    const MOVES = [
      ['up', '左桿往上推（油門↑）', '上升', [1, 1, 1, 1], '四顆一起加速，總推力大於重量。'],
      ['down', '左桿往下拉（油門↓）', '下降', [-1, -1, -1, -1], '四顆一起減速，總推力小於重量。'],
      ['fwd', '右桿往前推（俯仰）', '前進', [-1, -1, 1, 1], '後面兩顆加速、前面兩顆減速，機頭往下傾，推力有一部分朝後噴，機體往前。'],
      ['back', '右桿往後拉（俯仰）', '後退', [1, 1, -1, -1], '前面兩顆加速，機頭抬起往後飛。'],
      ['right', '右桿往右推（橫滾）', '右移', [-1, 1, 1, -1], '左邊兩顆加速，機身往右傾斜，往右平移。'],
      ['left', '右桿往左推（橫滾）', '左移', [1, -1, -1, 1], '右邊兩顆加速，往左傾斜平移。'],
      ['yawr', '左桿往右推（偏航）', '機頭右轉', [1, -1, 1, -1], '逆時針轉的那一對加速：反扭力讓機身往順時針（右）轉，總推力不變所以高度不變。'],
      ['yawl', '左桿往左推（偏航）', '機頭左轉', [-1, 1, -1, 1], '順時針轉的那一對加速，機身往左轉。']
    ];
    // 馬達順序：右前(逆)、左前(順)、左後(逆)、右後(順)
    W.mixer = {
      html: f => `<div class="q">${esc(f.label || '點一個搖桿動作，看四顆馬達怎麼變')}</div>
        <div class="mixer"><div class="mx-btns">${MOVES.map(m => `<button class="btn ghost" data-mx="${m[0]}">${m[1]}</button>`).join('')}</div>
        <svg viewBox="-120 -120 240 240" class="mx-svg" aria-label="馬達俯視圖"><text x="0" y="-104" text-anchor="middle" font-size="12" fill="#64748b">▲ 機頭</text>
        <line x1="-70" y1="-70" x2="70" y2="70" stroke="#334155" stroke-width="9" stroke-linecap="round"/><line x1="70" y1="-70" x2="-70" y2="70" stroke="#334155" stroke-width="9" stroke-linecap="round"/><rect x="-22" y="-28" width="44" height="56" rx="8" fill="#0f172a"/>
        ${[[70, -70, '右前', '逆'], [-70, -70, '左前', '順'], [-70, 70, '左後', '逆'], [70, 70, '右後', '順']].map(([x, y, n, d], i) => `<g data-m="${i}" transform="translate(${x} ${y})"><circle r="34" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/><circle class="mxc" r="22" fill="#94a3b8"/><text y="5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${n}</text><text y="50" text-anchor="middle" font-size="11" fill="#475569">${d}時針</text></g>`).join('')}
        </svg></div><p class="see mx-out" style="margin-top:.4em">選一個動作。</p>`,
      async mount(f) {
        document.querySelectorAll('[data-mx]').forEach(b => b.onclick = () => {
          const m = MOVES.find(x => x[0] === b.dataset.mx); document.querySelectorAll('[data-mx]').forEach(x => x.classList.toggle('am', x === b));
          document.querySelectorAll('.mx-svg [data-m]').forEach(g => { const d = m[3][+g.dataset.m], c = g.querySelector('.mxc'); c.setAttribute('r', d > 0 ? 30 : 14); c.setAttribute('fill', d > 0 ? '#ef4444' : '#3b82f6'); });
          const o = document.querySelector('.mx-out'); if (o) o.innerHTML = `<b>${m[2]}</b>：${m[4]}<br><small>紅＝加速、藍＝減速。</small>`;
        });
      }
    };
    /* 推力與轉速平方 */
    W.thrustcurve = {
      html: f => `<div class="q">${esc(f.label || '拉動油門：推力不是直線變化')}</div><input type="range" min="0" max="100" value="50" class="tc-r" style="width:100%"><div class="tc-o" style="font-size:1.1em;margin:.3em 0"></div><div style="height:22px;background:#e2e8f0;border-radius:99px;overflow:hidden"><div class="tc-b" style="height:100%;background:linear-gradient(90deg,#f59e0b,#ef4444);width:25%"></div></div><p class="hint">推力 ∝ 轉速²：油門 50% 只有約 25% 推力；這就是為什麼「懸停油門」常落在 30～50%。</p>`,
      async mount(f) {
        const r = document.querySelector('.tc-r'); if (!r) return;
        const up = () => { const t = r.value / 100; document.querySelector('.tc-o').innerHTML = `油門 <b>${r.value}%</b> → 推力約 <b>${Math.round(t * t * 100)}%</b>（5 吋機單顆約 ${Math.round(t * t * 1800)} g）`; document.querySelector('.tc-b').style.width = (t * t * 100) + '%'; };
        r.oninput = up; up();
      }
    };
    (window.DECK_WIDGET_EXT || []).forEach(fn => { try { Object.assign(W, fn(api)); } catch (e) { console.warn(e); } });
    return W;
  };
})();
