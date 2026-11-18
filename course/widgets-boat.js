/* 水上無人船專用互動元件（教學估算）：
 *   boatslip  ：螺距 × 轉速＝理論航速，扣滑脫＝實際航速
 *   boatfroude：福祿數與航行狀態（排水→越峰→滑行）
 *   boatfoil  ：水翼升力 ∝ 速度²，找出起飛速度
 *   boatstab  ：單體與雙體的吃水、乾舷與穩心高度
 * 由 course/widgets.js 合併：window.DECK_WIDGET_EXT.push(api => ({ 元件名: { html, paint?, mount } }))
 */
(function () {
  window.DECK_WIDGET_EXT = window.DECK_WIDGET_EXT || [];
  window.DECK_WIDGET_EXT.push(function (api) {
    const { esc } = api;
    const $$ = (sel, root) => (root || document).querySelector(sel);
    const rng = (cls, min, max, step, val, lab) => `<label class="bw-r" style="display:block;margin:.35em 0"><span style="display:inline-block;min-width:9.5em">${lab}</span><input type="range" class="${cls}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:min(100%,320px);vertical-align:middle"> <b class="${cls}-v"></b></label>`;
    const bar = (cls, col) => `<div style="height:20px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin:.3em 0"><div class="${cls}" style="height:100%;width:0;background:${col};transition:width .2s"></div></div>`;
    const W = {};

    W.boatslip = {
      html: f => `<div class="q">${esc(f.label || '螺距 × 轉速＝理論航速；扣掉滑脫才是實際航速')}</div>
        ${rng('bs-kv', 300, 3500, 100, 2000, '馬達 KV')}${rng('bs-s', 2, 6, 1, 4, '電池串數（S）')}${rng('bs-p', 20, 120, 2, 64, '螺距（mm）')}${rng('bs-t', 0, 100, 5, 80, '油門（%）')}
        <div class="opts" style="margin:.3em 0">${[['vhull', 'V 底 25%'], ['cat', '雙體 22%'], ['foil', '水翼 18%'], ['jet', '噴水 35%']].map(([v, l], i) => `<label class="opt${i ? '' : ' on'}"><input type="radio" name="bs-h" value="${v}"${i ? '' : ' checked'}>${l}</label>`).join('')}</div>
        <div class="bs-o" style="font-size:1.05em"></div>${bar('bs-b1', '#94a3b8')}${bar('bs-b2', 'linear-gradient(90deg,#0ea5e9,#0369a1)')}<p class="hint bs-c"></p>`,
      async mount() {
        const root = $$('.bs-kv'); if (!root) return; const box = root.closest('.fld') || document;
        const SL = { vhull: 0.25, cat: 0.22, foil: 0.18, jet: 0.35 };
        const up = () => {
          const kv = +$$('.bs-kv', box).value, s = +$$('.bs-s', box).value, p = +$$('.bs-p', box).value, t = +$$('.bs-t', box).value / 100;
          const h = ($$('input[name="bs-h"]:checked', box) || {}).value || 'vhull';
          box.querySelectorAll('input[name="bs-h"]').forEach(x => x.parentElement.classList.toggle('on', x.checked));
          [['bs-kv', kv + ' KV'], ['bs-s', s + 'S（' + (s * 3.7).toFixed(1) + ' V）'], ['bs-p', p + ' mm'], ['bs-t', Math.round(t * 100) + '%']].forEach(([c, v]) => { $$('.' + c + '-v', box).textContent = v; });
          const rpm = kv * s * 3.7 * 0.85 * t, vt = p / 1000 * rpm / 60, va = vt * (1 - SL[h]);
          $$('.bs-o', box).innerHTML = `轉速 <b>${Math.round(rpm).toLocaleString()}</b> rpm → 理論航速 <b>${vt.toFixed(1)}</b> m/s → 扣滑脫 ${Math.round(SL[h] * 100)}% 實際約 <b>${va.toFixed(1)} m/s（${(va * 3.6).toFixed(0)} km/h）</b>`;
          $$('.bs-b1', box).style.width = Math.min(100, vt / 40 * 100) + '%'; $$('.bs-b2', box).style.width = Math.min(100, va / 40 * 100) + '%';
          $$('.bs-c', box).textContent = `手算抽查：${p} mm × ${Math.round(rpm)} rpm ÷ 60 ÷ 1000 ≈ ${vt.toFixed(1)} m/s；× (1 − ${SL[h]}) ≈ ${va.toFixed(1)} m/s。上條灰色＝理論，下條藍色＝實際（滿格 40 m/s）。轉速已含負載約 85%。`;
        };
        box.querySelectorAll('input').forEach(i => i.oninput = up); up();
      }
    };

    // 剩餘阻力／重量 對 福祿數（與 js/kits/boat.js 同一張教學表）
    const RES = { mono: [[0, 0], [0.3, 0.01], [0.5, 0.07], [0.7, 0.1], [1, 0.09], [1.5, 0.075], [3, 0.07]], cat: [[0, 0], [0.3, 0.012], [0.5, 0.05], [0.7, 0.06], [1, 0.05], [1.5, 0.045], [3, 0.045]] };
    const lerp = (tab, x) => { if (x <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) { const [a, b] = tab[i - 1], [c, d] = tab[i]; return b + (d - b) * (x - a) / (c - a); } return tab[tab.length - 1][1]; };
    W.boatfroude = {
      html: f => `<div class="q">${esc(f.label || '福祿數 Fn＝航速 ÷ √(g × 水線長)：判斷船在排水、越峰還是滑行')}</div>
        ${rng('bf-l', 0.4, 2, 0.1, 0.8, '水線長（m）')}${rng('bf-v', 0, 20, 0.2, 3, '航速（m/s）')}
        <svg viewBox="0 0 320 140" class="bf-svg" style="width:100%;max-width:420px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px" aria-label="阻力曲線">
          <rect x="30" y="10" width="${0.4 / 3 * 280}" height="110" fill="#dbeafe"/><rect x="${30 + 0.4 / 3 * 280}" y="10" width="${0.6 / 3 * 280}" height="110" fill="#fef3c7"/><rect x="${30 + 1 / 3 * 280}" y="10" width="${2 / 3 * 280}" height="110" fill="#dcfce7"/>
          <text x="34" y="22" font-size="10" fill="#1e40af">排水</text><text x="${34 + 0.4 / 3 * 280}" y="22" font-size="10" fill="#92400e">越峰</text><text x="${34 + 1 / 3 * 280}" y="22" font-size="10" fill="#166534">滑行（V 底）</text>
          <polyline class="bf-m" fill="none" stroke="#0f172a" stroke-width="2"/><polyline class="bf-c" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="5 3"/>
          <line x1="30" y1="120" x2="310" y2="120" stroke="#64748b"/><text x="300" y="134" font-size="10" text-anchor="end" fill="#475569">Fn 3.0</text><text x="30" y="134" font-size="10" fill="#475569">0</text>
          <circle class="bf-dot" r="5" fill="#ef4444"/></svg>
        <p style="margin:.2em 0;font-size:13px"><span style="color:#0f172a">━ 單體 V 底</span>　<span style="color:#0ea5e9">┅ 雙體</span>　縱軸＝興波與滑行阻力 ÷ 重量</p><div class="bf-o" style="font-size:1.05em"></div>`,
      async mount() {
        const el = $$('.bf-l'); if (!el) return; const box = el.closest('.fld') || document;
        const X = fn => 30 + Math.min(fn, 3) / 3 * 280, Y = r => 120 - r / 0.11 * 100;
        const pts = tab => Array.from({ length: 61 }, (_, i) => { const fn = i / 20; return X(fn).toFixed(1) + ',' + Y(lerp(tab, fn)).toFixed(1); }).join(' ');
        $$('.bf-m', box).setAttribute('points', pts(RES.mono)); $$('.bf-c', box).setAttribute('points', pts(RES.cat));
        const up = () => {
          const Lw = +$$('.bf-l', box).value, v = +$$('.bf-v', box).value, fn = v / Math.sqrt(9.81 * Lw), hull = Math.sqrt(9.81 * Lw) * 0.4;
          $$('.bf-l-v', box).textContent = Lw.toFixed(1) + ' m'; $$('.bf-v-v', box).textContent = v.toFixed(1) + ' m/s（' + (v * 3.6).toFixed(0) + ' km/h）';
          const d = $$('.bf-dot', box); d.setAttribute('cx', X(fn)); d.setAttribute('cy', Y(lerp(RES.mono, fn)));
          const st = fn < 0.4 ? '排水航行：船推開水前進，阻力隨速度快速上升' : fn < 1 ? '越峰區：船尾下沉、船首上揚，阻力最大，最耗電' : '滑行：船底的動態升力把船身抬起，濕面積變小';
          $$('.bf-o', box).innerHTML = `Fn＝${v.toFixed(1)} ÷ √(9.81 × ${Lw.toFixed(1)})＝<b>${fn.toFixed(2)}</b>｜${st}<br><small>這艘船的「船體速度」（Fn 0.4）約 ${hull.toFixed(1)} m/s；同樣航速下，船越長 Fn 越小。</small>`;
        };
        box.querySelectorAll('input').forEach(i => i.oninput = up); up();
      }
    };

    W.boatfoil = {
      html: f => `<div class="q">${esc(f.label || '水翼升力 L＝½ × ρ × v² × 面積 × 升力係數：升力等於重量時船身離水')}</div>
        ${rng('bo-w', 0.5, 5, 0.1, 2, '全重（kg）')}${rng('bo-a', 20, 400, 10, 80, '水翼面積（cm²）')}${rng('bo-v', 0, 10, 0.1, 2, '航速（m/s）')}
        <div class="bo-o" style="font-size:1.05em"></div>${bar('bo-b', 'linear-gradient(90deg,#f59e0b,#16a34a)')}<p class="hint">升力係數取 0.5、淡水密度 1000 kg/m³（教學估算）。速度加倍，升力變四倍：所以水翼船低速時翼片只是累贅，超過起飛速度後阻力反而大降。</p>`,
      async mount() {
        const el = $$('.bo-w'); if (!el) return; const box = el.closest('.fld') || document;
        const up = () => {
          const m = +$$('.bo-w', box).value, A = +$$('.bo-a', box).value / 1e4, v = +$$('.bo-v', box).value, W = m * 9.81, Lf = 0.5 * 1000 * v * v * A * 0.5, vto = Math.sqrt(2 * W / (1000 * A * 0.5));
          $$('.bo-w-v', box).textContent = m.toFixed(1) + ' kg'; $$('.bo-a-v', box).textContent = Math.round(A * 1e4) + ' cm²'; $$('.bo-v-v', box).textContent = v.toFixed(1) + ' m/s';
          const r = Lf / W; $$('.bo-b', box).style.width = Math.min(100, r * 100) + '%';
          $$('.bo-o', box).innerHTML = `升力 <b>${Lf.toFixed(1)} N</b>／重量 ${W.toFixed(1)} N＝<b>${(r * 100).toFixed(0)}%</b>　${r >= 1 ? '✅ <b>船身離水（翼航）</b>' : '尚未起飛'}<br><small>起飛速度 √(2 × 重量 ÷ (ρ × 面積 × 0.5))＝<b>${vto.toFixed(1)} m/s（${(vto * 3.6).toFixed(0)} km/h）</b></small>`;
        };
        box.querySelectorAll('input').forEach(i => i.oninput = up); up();
      }
    };

    W.boatstab = {
      html: f => `<div class="q">${esc(f.label || '浮力與穩性：同樣重量，單體與雙體差在哪裡？')}</div>
        ${rng('bt2-m', 1, 30, 0.5, 8, '全重（kg）')}${rng('bt2-l', 0.5, 1.8, 0.1, 1.2, '船長（m）')}${rng('bt2-b', 0.15, 0.9, 0.05, 0.5, '船寬／外寬（m）')}${rng('bt2-g', 0.05, 0.5, 0.01, 0.15, '重心高度 KG（m）')}
        <table class="tbl" style="font-size:14.5px"><thead><tr><th>項目</th><th>單體（全寬一個船身）</th><th>雙體（兩船身各占 24% 寬）</th></tr></thead><tbody class="bt2-t"></tbody></table>
        <p class="hint">吃水＝排水體積 ÷（方形係數 × 水線長 × 水線寬）；穩心高度 GM＝浮心高 KB＋穩心半徑 BM − 重心高 KG。GM 越大越不容易翻；雙體船的兩個浮力中心分得開，BM 大很多。</p>`,
      async mount() {
        const el = $$('.bt2-m'); if (!el) return; const box = el.closest('.fld') || document;
        const up = () => {
          const m = +$$('.bt2-m', box).value, L = +$$('.bt2-l', box).value, B = +$$('.bt2-b', box).value, KG = +$$('.bt2-g', box).value, V = m / 1000, Lw = L * 0.92;
          [['bt2-m', m.toFixed(1) + ' kg'], ['bt2-l', L.toFixed(1) + ' m'], ['bt2-b', B.toFixed(2) + ' m'], ['bt2-g', Math.round(KG * 1000) + ' mm']].forEach(([c, v]) => { $$('.' + c + '-v', box).textContent = v; });
          const bw1 = B * 0.86, T1 = V / (0.42 * Lw * bw1), I1 = 0.55 * Lw * bw1 ** 3 / 12, GM1 = T1 * 0.58 + I1 / V - KG;
          const bh = B * 0.24, bw2 = bh * 0.9, T2 = V / (0.5 * Lw * bw2 * 2), y = B / 2 - bh / 2, I2 = 2 * (0.55 * Lw * bw2 ** 3 / 12 + 0.7 * Lw * bw2 * y * y), GM2 = T2 * 0.58 + I2 / V - KG;
          const r = g => g <= 0 ? '<b style="color:#b91c1c">會翻覆</b>' : g / B < 0.12 ? '<b style="color:#b45309">偏低</b>' : '<b style="color:#15803d">穩</b>';
          $$('.bt2-t', box).innerHTML = `<tr><td>排水體積</td><td colspan="2">${(V * 1000).toFixed(1)} 公升（重量幾公斤就排開幾公升淡水）</td></tr>
            <tr><td>吃水</td><td>${Math.round(T1 * 1000)} mm</td><td>${Math.round(T2 * 1000)} mm</td></tr>
            <tr><td>穩心半徑 BM</td><td>${Math.round(I1 / V * 1000)} mm</td><td>${Math.round(I2 / V * 1000)} mm</td></tr>
            <tr><td>穩心高度 GM</td><td>${Math.round(GM1 * 1000)} mm（${r(GM1)}）</td><td>${Math.round(GM2 * 1000)} mm（${r(GM2)}）</td></tr>`;
        };
        box.querySelectorAll('input').forEach(i => i.oninput = up); up();
      }
    };
    return W;
  });
})();
