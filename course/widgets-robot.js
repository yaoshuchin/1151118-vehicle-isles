/* 人形格鬥機器人篇專用互動元件（classic script，由 course/index.html 載入，在 widgets.js 之後）
 * rbbalance：支撐多邊形與最大傾斜角（推一下，看會不會倒）
 * rbpunch ：出拳速度與動能（舵機速度 × 手臂長；動能 ∝ 速度²）
 * rbgetup ：倒地後 IMU 判斷方向 → 起身動作序列
 */
(function () {
  window.DECK_WIDGET_EXT = window.DECK_WIDGET_EXT || [];
  window.DECK_WIDGET_EXT.push(function (api) {
    const { esc } = api;
    const W = {};
    const each = (name, fn) => document.querySelectorAll(`[data-w="${name}"]`).forEach(el => { if (!el.dataset.bound) { el.dataset.bound = '1'; fn(el); } });
    const rng = (cls, min, max, step, val) => `<input type="range" class="${cls}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:100%">`;

    /* ── 支撐多邊形與傾斜角 ── */
    W.rbbalance = {
      html: f => `<div class="q">${esc(f.label || '推一下：重心投影跑出腳掌就會倒')}</div>
        <div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn ghost" data-bp="60,250">桌上型・單腳（腳寬 60 mm）</button><button class="btn ghost" data-bp="200,250">桌上型・雙腳站開</button><button class="btn ghost" data-bp="150,690">全尺寸・單腳</button></div>
        <label class="hint">支撐寬度（單腳＝腳掌寬；雙腳＝兩腳外緣距離）<b class="bb-w"></b></label>${rng('bb-rw', 30, 400, 5, 60)}
        <label class="hint">重心高度 <b class="bb-h"></b></label>${rng('bb-rh', 80, 900, 10, 250)}
        <label class="hint">被推的傾斜角 <b class="bb-t"></b></label>${rng('bb-rt', 0, 30, 0.5, 0)}
        <svg viewBox="0 0 320 230" class="bb-svg" style="width:100%;max-width:420px;display:block;margin:.3em auto;background:#f8fafc;border-radius:12px" aria-label="正面示意圖"></svg>
        <p class="see bb-out" style="margin:.3em 0"></p>`,
      async mount() {
        each('rbbalance', el => {
          const rw = el.querySelector('.bb-rw'), rh = el.querySelector('.bb-rh'), rt = el.querySelector('.bb-rt'), svg = el.querySelector('.bb-svg'), out = el.querySelector('.bb-out');
          const draw = () => {
            const w = +rw.value, h = +rh.value, t = +rt.value, lim = Math.atan(w / 2 / h) * 180 / Math.PI;
            el.querySelector('.bb-w').textContent = `：${w} mm`; el.querySelector('.bb-h').textContent = `：${h} mm`; el.querySelector('.bb-t').textContent = `：${t}°`;
            const sc = 165 / Math.max(h * 1.25, w * 1.1), gy = 210, cx = 160, px = cx + w / 2 * sc, th = t * Math.PI / 180;
            const dx = -w / 2 * sc, dy = -h * sc, comX = px + dx * Math.cos(th) - dy * Math.sin(th), comY = gy + dx * Math.sin(th) + dy * Math.cos(th);
            const fall = comX > px + 0.01;
            const bodyH = h * 1.2 * sc, bw = Math.max(14, w * 0.6 * sc);
            svg.innerHTML = `<line x1="0" y1="${gy}" x2="320" y2="${gy}" stroke="#94a3b8" stroke-width="2"/>
              <rect x="${cx - w / 2 * sc}" y="${gy + 2}" width="${w * sc}" height="6" fill="${fall ? '#fecaca' : '#bbf7d0'}"/>
              <g transform="rotate(${t} ${px} ${gy})"><rect x="${cx - w / 2 * sc}" y="${gy - 8}" width="${w * sc}" height="8" fill="#334155"/>
              <rect x="${cx - bw / 2}" y="${gy - bodyH}" width="${bw}" height="${bodyH - 8}" rx="6" fill="${fall ? '#fca5a5' : '#cbd5e1'}" stroke="#475569"/>
              <circle cx="${cx}" cy="${gy - bodyH - 12}" r="12" fill="#475569"/></g>
              <line x1="${comX}" y1="${comY}" x2="${comX}" y2="${gy}" stroke="${fall ? '#dc2626' : '#16a34a'}" stroke-width="2" stroke-dasharray="5 4"/>
              <circle cx="${comX}" cy="${comY}" r="7" fill="${fall ? '#dc2626' : '#16a34a'}"/><text x="${comX + 10}" y="${comY + 4}" font-size="12" fill="#0f172a">重心</text>
              <text x="8" y="18" font-size="13" fill="#0f172a">最大傾斜角 = atan(${(w / 2).toFixed(0)} ÷ ${h}) = ${lim.toFixed(1)}°</text>`;
            out.innerHTML = fall ? `<b style="color:#dc2626">倒地！</b> 傾斜 ${t}° 已超過最大傾斜角 ${lim.toFixed(1)}°：重心投影跑出支撐範圍。` : `<b>站得住</b>：傾斜 ${t}° 小於最大傾斜角 ${lim.toFixed(1)}°，還剩 ${(lim - t).toFixed(1)}° 餘裕。`;
          };
          [rw, rh, rt].forEach(r => r.oninput = draw);
          el.querySelectorAll('[data-bp]').forEach(b => b.onclick = () => { const [w, h] = b.dataset.bp.split(','); rw.value = w; rh.value = h; rt.value = 0; draw(); });
          draw();
        });
      }
    };

    /* ── 出拳速度與動能 ── */
    W.rbpunch = {
      html: f => `<div class="q">${esc(f.label || '調三個數字，看出拳速度與動能')}</div>
        <label class="hint">舵機速度（秒／60°，越小越快）<b class="pp-s"></b></label>${rng('pp-rs', 0.05, 0.3, 0.01, 0.12)}
        <label class="hint">手臂長（肩到拳）<b class="pp-l"></b></label>${rng('pp-rl', 10, 70, 1, 19)}
        <label class="hint">拳頭等效質量（拳＋部分前臂）<b class="pp-m"></b></label>${rng('pp-rm', 30, 2000, 10, 120)}
        <div class="pp-o" style="font-size:1.05em;margin:.4em 0"></div>
        <div style="display:grid;grid-template-columns:5em 1fr;gap:4px 8px;align-items:center"><span class="hint">拳速</span><div style="height:16px;background:#e2e8f0;border-radius:99px;overflow:hidden"><div class="pp-bv" style="height:100%;background:#f59e0b"></div></div>
        <span class="hint">動能</span><div style="height:16px;background:#e2e8f0;border-radius:99px;overflow:hidden"><div class="pp-be" style="height:100%;background:#ef4444"></div></div></div>
        <p class="hint pp-c" style="margin-top:.4em"></p>`,
      async mount() {
        each('rbpunch', el => {
          const rs = el.querySelector('.pp-rs'), rl = el.querySelector('.pp-rl'), rm = el.querySelector('.pp-rm');
          const up = () => {
            const t = +rs.value, L = +rl.value / 100, m = +rm.value / 1000, om = Math.PI / 3 / t * 0.7, v = om * L, E = 0.5 * m * v * v;
            el.querySelector('.pp-s').textContent = `：${t.toFixed(2)} 秒`; el.querySelector('.pp-l').textContent = `：${rl.value} cm`; el.querySelector('.pp-m').textContent = `：${rm.value} g`;
            el.querySelector('.pp-o').innerHTML = `角速度 <b>${om.toFixed(1)} rad/s</b> → 拳速 <b>${v.toFixed(2)} m/s</b> → 動能 <b>${E < 1 ? E.toFixed(3) : E.toFixed(2)} J</b>`;
            el.querySelector('.pp-bv').style.width = Math.min(100, v / 4 * 100) + '%'; el.querySelector('.pp-be').style.width = Math.min(100, E / 4 * 100) + '%';
            el.querySelector('.pp-c').textContent = `手算抽查：60° ＝ π/3 ≈ 1.05 rad；1.05 ÷ ${t.toFixed(2)} 秒 × 0.7（負載折減）＝ ${om.toFixed(1)} rad/s；× ${L.toFixed(2)} m ＝ ${v.toFixed(2)} m/s；½ × ${m.toFixed(2)} kg × ${v.toFixed(2)}² ＝ ${E.toFixed(3)} J。把舵機速度減半（拳速加倍），動能變 4 倍。`;
          };
          [rs, rl, rm].forEach(r => r.oninput = up); up();
        });
      }
    };

    /* ── 倒地與起身 ── */
    const FALLS = {
      front: { n: '正面倒地（趴下）', imu: 'IMU 讀到俯仰角約 +90°（往前倒）', seq: ['停止所有出拳動作，雙臂往前伸撐地。', '雙臂把上半身推高，讓胸口離地。', '髖、膝彎曲，把雙腳收到身體下方。', '重心移到兩腳掌上方（落進支撐多邊形）。', '伸直膝蓋與髖關節站起，回到格擋姿勢。'] },
      back: { n: '背面倒地（仰躺）', imu: 'IMU 讀到俯仰角約 −90°（往後倒）', seq: ['雙臂往身體兩側後方撐地。', '抬起上半身成坐姿（腹部與髖關節出力）。', '雙腳收到臀部前方，身體往前傾。', '重心移到腳掌上方。', '伸直站起，回到格擋姿勢。'] },
      side: { n: '側面倒地', imu: 'IMU 讀到橫滾角約 ±90°（往側邊倒）', seq: ['用下方手臂撐地，上方腿往前擺。', '翻身成趴姿（轉成「正面倒地」狀態）。', '接正面起身流程：雙臂撐起上半身。', '收腳、重心移到腳掌上方。', '站起，回到格擋姿勢。'] }
    };
    W.rbgetup = {
      html: f => `<div class="q">${esc(f.label || '選一種倒法：機器人怎麼知道、怎麼站起來？')}</div>
        <div class="row" style="flex-wrap:wrap;gap:6px">${Object.keys(FALLS).map(k => `<button class="btn ghost" data-gu="${k}">${FALLS[k].n}</button>`).join('')}</div>
        <p class="see gu-imu" style="margin:.4em 0">先選一種倒法。</p><ol class="steps gu-seq"></ol>
        <div class="row"><button class="btn am gu-play" disabled>▶ 播放起身流程</button></div>
        <p class="hint">ROBO-ONE 規則：倒地後裁判讀 10 秒，站不起來判 KO（第 45 回規則 11.1）。起身動作要事先寫成動作檔並反覆實測。</p>`,
      async mount() {
        each('rbgetup', el => {
          let cur = null, tm = 0;
          const seqEl = el.querySelector('.gu-seq'), play = el.querySelector('.gu-play');
          el.querySelectorAll('[data-gu]').forEach(b => b.onclick = () => {
            cur = FALLS[b.dataset.gu]; clearInterval(tm);
            el.querySelectorAll('[data-gu]').forEach(x => x.classList.toggle('am', x === b));
            el.querySelector('.gu-imu').innerHTML = `<b>${cur.n}</b>：${cur.imu} → 主控板選擇對應的起身動作檔。`;
            seqEl.innerHTML = cur.seq.map(x => `<li>${x}</li>`).join(''); play.disabled = false;
          });
          play.onclick = () => {
            if (!cur) return; clearInterval(tm); let i = 0; const li = seqEl.querySelectorAll('li');
            const step = () => { li.forEach((x, j) => { x.style.background = j === i ? '#fef3c7' : ''; x.style.fontWeight = j === i ? '700' : ''; }); i++; if (i > li.length) { clearInterval(tm); li.forEach(x => { x.style.background = ''; x.style.fontWeight = ''; }); } };
            step(); tm = setInterval(step, 1100);
          };
        });
      }
    };

    return W;
  });
})();
