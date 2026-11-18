/* U06 故障診斷與賽前檢查（三種載具共用）
 * 方法轉化自「F:\6次課程規劃」第 4～6 次機械群課程：故障現象題庫（現象→原因→檢查→安全提醒）、七欄位提示詞、
 * FMEA（S×O×D＝RPN）、感測器數據異常偵測、實習安全檢核表、AI 使用規範與查核、4 等級 × 6 向度評分規準、Blender 虛擬展間。
 * 案例內容依各載具重新撰寫（教學用，數值為一般經驗範圍，實際以原廠手冊為準）。
 */
(function () {
  const F = (t, sym, cause, check, safe) => ({ t, sym, cause, check, safe });
  const DATA = {
    drone: {
      name: '無人機', act: '飛行', log: '飛行紀錄（黑盒子）', bad: '無人機掉下來怎麼辦？', ex: ['第二局 1 分 30 秒後，大油門時畫面閃一下就墜落', '室內網室、電池用了 40 次、剛撞過球門環', '已換新槳、螺絲都鎖緊'],
      faults: [
        F('起飛瞬間翻覆', '一推油門就往某一側翻倒，離不開地面', '螺旋槳裝反；馬達順序或轉向與飛控設定不符；飛控安裝方向設定錯', '拆槳後用設定軟體逐顆測試馬達順序與轉向；對照槳上 CW／CCW 標示；確認飛控箭頭朝前', '測試馬達一律先拆槳'),
        F('懸停高頻抖動、馬達發燙', '懸停時機身細抖、聲音尖，落地後馬達燙手', '槳葉缺損不平衡；PID 的 D 值過高；馬達軸彎；機架螺絲鬆', '換新槳、鎖緊機架、看黑盒子陀螺儀頻譜、逐步降低 D 值', '落地後等馬達冷卻再觸碰'),
        F('飛行中突然斷電掉落', '大油門時畫面閃一下後整台墜落', '電池放電倍率不足或老化造成電壓驟降；XT60 接頭虛焊；電源線被槳切到', '看黑盒子電壓曲線、量電池內阻、檢查焊點與線材', '鼓包電池立即停用，放防火袋'),
        F('圖傳雪花或黑屏', 'FPV 畫面雜訊多，某些位置會黑屏', '天線鬆脫或損傷；頻道與他人相同；圖傳過熱', '換天線、確認頻道表、檢查圖傳散熱', '圖傳沒裝天線不可通電'),
        F('失控保護觸發', '飛到場地另一端時突然停槳或自行降落', '接收機天線被碳板遮擋；距離過遠；綁定或失控保護設定錯', '做測距測試、調整天線角度、確認失控保護設為「停止／降落」', '失控保護不可設成「保持油門」'),
        F('一直往某方向漂', '自穩模式放開搖桿仍持續往同一方向移動', '加速度計未校正；重心偏；某顆馬達效率低', '水平校正、電池置中、交換馬達位置比較', '校正時放在平面上，勿接觸螺旋槳'),
        F('撞擊後無法起飛', '足球賽撞擊後某顆馬達不轉或卡卡的', '球籠變形卡到槳；馬達線斷；電調燒毀', '目視球籠、手轉馬達檢查卡滯、聞是否有焦味、量馬達線', '拔電池後再檢查'),
        F('電池充電後膨脹', '電池外觀鼓起、軟包變厚', '過放（低於 3.0 V／芯）；過充；單芯不平衡', '用平衡充電、檢查每芯電壓（3.7～4.2 V）', '在防火袋裡充電、有人看顧；膨脹電池依規定回收')
      ],
      check: {
        before: ['電池每芯 ≥ 4.15 V，外觀無膨脹破損', '螺旋槳無缺損、方向正確、螺帽鎖緊', '機架與馬達螺絲無鬆動', '球籠／涵道無裂痕或變形', '失控保護測試：關遙控器時停槳', '隊伍燈與攻擊手標示正確', '圖傳頻道已登記、不與他人衝突'],
        during: ['撞擊後先降落目視檢查', '電池低於 3.5 V／芯立即降落', '聽到異音或聞到焦味立即停止'],
        after: ['先拔電池再碰機體', '電池調整到儲存電壓（約 3.8 V／芯）', '記錄飛行時間與異常', '清潔機體、檢查槳與球籠']
      },
      ch: [{ k: 'v', n: '電池電壓（每芯）', u: 'V', lo: 3.5, base: t => 4.1 - t * 0.004, noise: 0.02, bad: [[115, 125, -0.45]] },
        { k: 'tm', n: '馬達溫度（最高的一顆）', u: '°C', hi: 80, base: t => 35 + t * 0.12, noise: 1.2, bad: [[140, 180, 25]] },
        { k: 'vib', n: '機身震動', u: 'g', hi: 2.5, base: () => 1.1, noise: 0.25, bad: [[60, 66, 2.2]] }],
      dur: 180
    },
    robot: {
      name: '人形格鬥機器人', act: '比賽', log: '比賽紀錄（舵機與 IMU）', bad: '機器人一直跌倒怎麼辦？', ex: ['連續出拳三次後往右後方跌倒，第一回合還正常', '比賽第二回合、電池剛充滿、擂台表面較滑', '已重新校正 IMU、舵機零點正常'],
      faults: [
        F('站立時一直往前倒', '開機站好後幾秒內往前傾倒', '重心偏前；腳踝舵機零點偏移；IMU 未校正', '量重心位置、重新設定零點、IMU 水平校正', '扶住機身再開機，避免摔落'),
        F('某關節抖動嗡嗡響', '保持姿勢時某個關節持續抖動、發出嗡嗡聲', '舵機負載過大；齒輪磨損；位置控制增益過高', '摸舵機溫度、手扳檢查齒隙、降低增益或換大扭力舵機', '斷電後再手扳關節'),
        F('出拳後失去平衡', '連續出拳後身體被自己的慣性帶倒', '動作太快、慣性大；腳掌太小；動作沒有重心補償', '放慢動作、加寬站距、在出拳動作加入髖部反向補償', '練習時在軟墊上並有人保護'),
        F('動作中突然全身無力', '比賽中所有關節同時放鬆，機器人癱倒', '電池電壓低觸發保護；總電流超過穩壓器上限；電源接頭鬆', '量電池電壓、分配電源迴路、檢查並固定接頭', '癱倒時先按緊急停止再接近'),
        F('舵機冒煙或發燙', '某顆舵機外殼燙手，甚至有焦味', '堵轉（被卡住仍出力）；扭力不足；長時間維持高負載姿勢', '立即斷電、找出卡住原因、換更大扭力舵機或修改姿勢', '冒煙立即斷電，勿用手觸碰'),
        F('遙控延遲或動作錯亂', '按鍵後很久才動，或做出不對的動作', '無線干擾；動作檔編號錯誤；主控板過載', '換頻道、重新燒錄動作檔、降低同時執行的動作數', '測試時保持安全距離'),
        F('倒地後起不來', '倒地讀秒中起身動作失敗', '起身序列順序錯；扭力不足；地面太滑', '調整起身序列、加止滑腳底、換大扭力膝關節舵機', '起身測試時周圍淨空'),
        F('被擊中後零件鬆脫', '比賽中裝甲或拳套脫落、螺絲掉出', '螺絲未上螺絲膠；結構疲勞', '關鍵螺絲上中強度螺絲膠、賽前逐顆檢查', '鬆脫零件立即撿離擂台')
      ],
      check: {
        before: ['電池電壓充足、接頭牢固', '所有舵機零點正確、站姿正常', '緊急停止鈕測試：一按全部斷電', '關鍵螺絲上螺絲膠、裝甲與拳套固定', 'IMU 水平校正完成', '動作檔版本確認、遙控配對正確'],
        during: ['倒地後檢查關節溫度與異音', '舵機異常發燙立即暫停', '每回合間檢查裝甲與螺絲'],
        after: ['按緊急停止並斷電', '檢查舵機溫度與齒輪', '記錄倒地次數與故障', '電池充電或調整到儲存電壓']
      },
      ch: [{ k: 'st', n: '膝關節舵機溫度', u: '°C', hi: 70, base: t => 32 + t * 0.15, noise: 1, bad: [[120, 180, 20]] },
        { k: 'cur', n: '總電流', u: 'A', hi: 12, base: () => 5, noise: 1.2, bad: [[40, 44, 8], [90, 93, 8]] },
        { k: 'tilt', n: '機身傾角（IMU）', u: '°', hi: 25, base: () => 4, noise: 2, bad: [[95, 99, 45]] }],
      dur: 180
    },
    boat: {
      name: '無人船', act: '航行', log: '航行紀錄（遙測）', bad: '船跑不動怎麼辦？', ex: ['跑了約 2 分半後速度掉一半，馬達很燙', '湖面有水草、氣溫 30 度、用 3S 電池', '已確認螺旋槳沒有鬆脫、電池電量足夠'],
      faults: [
        F('船艙進水', '收船時艙內有積水，電子零件潮濕', '艙蓋密封條老化或沒壓緊；線材穿孔沒防水；船殼裂縫', '下水前做泡水測試、重新密封穿孔、檢查船殼', '電子艙進水立即斷電，擦乾後再檢查'),
        F('馬達過熱停機', '航行幾分鐘後失去動力，馬達很燙', '冷卻水路堵塞；螺旋槳太大；水草纏繞', '看出水口有沒有水柱、清通管路、換小一號槳、清除纏繞物', '收船後等馬達冷卻再碰'),
        F('直線一直往一邊偏', '放開方向仍持續往同一側轉', '舵角零點偏；左右推進器推力不等；重心偏', '調舵角中立、校正推進器、調整電池位置', '調整時先拔電'),
        F('高速時船頭上下跳', '速度變快後船頭一直彈跳（海豚跳）', '重心太後；船底攻角不對；修平片角度', '電池前移、調整修平片或船底角度', '跳船時降速，避免翻覆'),
        F('訊號中斷失控', '開到遠處時突然不受控制', '天線浸水或太低；距離過遠；失控保護設定錯', '天線高於水面、做距離測試、失控保護設為「停車」', '失控保護不可設成「保持油門」；備妥救援船或撈網'),
        F('自主航行亂繞圈', '自動模式下航線像螺旋，到不了航點', '羅盤受馬達與電源線干擾；未校正；GPS 定位差', '羅盤遠離電源線並重新校正、等 GPS 衛星數足夠再啟動', '自主測試時有人可隨時切回手動'),
        F('轉彎時翻覆', '急轉彎時船身傾斜過大而翻覆', '穩性不足（船寬太窄、重心太高）；轉彎太急', '降低重心、加寬或改雙體、限制舵角', '翻船時先斷電再撈回'),
        F('電池或接頭鏽蝕', '接頭發綠、接觸不良，動力時有時無', '電池與接頭受潮；沒有防水盒', '電池放防水盒、接頭塗防水油膏、收船後擦乾', '鏽蝕接頭會發熱，立即更換')
      ],
      check: {
        before: ['艙蓋密封、泡水測試無漏水', '冷卻水管通暢、螺旋槳鎖固', '失控保護測試：關遙控器時停車', '天線高於水面、航行燈正常', '救援工具（撈網、救援船）就位', '電池放防水盒、電量充足'],
        during: ['觀察出水口水柱是否正常', '溫度或電流異常立即返航', '保持在可視、可救援範圍內'],
        after: ['先斷電再撈船', '打開艙蓋檢查進水並擦乾', '沖洗螺旋槳與冷卻水路', '記錄航行時間與異常']
      },
      ch: [{ k: 'tm', n: '馬達溫度', u: '°C', hi: 65, base: t => 28 + t * 0.08, noise: 0.8, bad: [[150, 240, 30]] },
        { k: 'cur', n: '馬達電流', u: 'A', hi: 45, base: () => 28, noise: 3, bad: [[150, 240, 12]] },
        { k: 'spd', n: '航速', u: 'm/s', lo: 3, base: () => 6, noise: 0.4, bad: [[150, 240, -3.5]] }],
      dur: 240
    }
  };
  const MAINT = window.MAINT = { DATA };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 固定亂數（每次產生同一份紀錄，方便全班對照）
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  MAINT.series = (k) => {
    const d = DATA[k], r = rng(42 + k.length);
    return d.ch.map(c => { const pts = []; for (let t = 0; t <= d.dur; t++) { let v = c.base(t) + (r() - 0.5) * 2 * c.noise; (c.bad || []).forEach(([a, b, dv]) => { if (t >= a && t <= b) v += dv * Math.min(1, (t - a + 1) / 4); }); pts.push(+v.toFixed(2)); } return pts; });
  };
  MAINT.fmeaRows = (k, f) => {
    let saved = {}; try { saved = JSON.parse(f[k + '_fmea'] || '{}'); } catch (e) { }
    return DATA[k].faults.map((x, i) => { const s = saved[i] || {}; const S = +s.S || 5, O = +s.O || 3, D = +s.D || 3; return { i, t: x.t, S, O, D, RPN: S * O * D }; }).sort((a, b) => b.RPN - a.RPN);
  };
  MAINT.md = (k, f) => {
    const d = DATA[k], rows = MAINT.fmeaRows(k, f), sel = +f[k + '_fault'] || 0, fl = d.faults[sel];
    const ck = id => (Array.isArray(f[id]) ? f[id] : []);
    return `# 維修保養與賽前檢查（${d.name}）

## 我分析的故障：${fl.t}
- 故障現象：${fl.sym}
- 可能原因：${fl.cause}
- 檢查方法：${fl.check}
- 安全提醒：${fl.safe}

## AI 診斷結果
${String(f[k + '_diag'] || '（未產生）')}

## FMEA 風險排序（RPN＝嚴重度 S × 發生度 O × 偵測度 D，≥ 125 優先改善）
| 排序 | 故障模式 | S | O | D | RPN |
|---|---|---|---|---|---|
${rows.map((r, i) => `| ${i + 1} | ${r.t} | ${r.S} | ${r.O} | ${r.D} | ${r.RPN} |`).join('\n')}

## ${d.log}異常判讀
${String(f[k + '_lognote'] || '（未填）')}

## 檢查表（已勾選＝本隊採用）
- 賽前：${ck(k + '_ck_before').join('；') || '（未勾選）'}
- 賽中：${ck(k + '_ck_during').join('；') || '（未勾選）'}
- 賽後：${ck(k + '_ck_after').join('；') || '（未勾選）'}
`;
  };
  MAINT.prompt = (k, f, specLine) => {
    const d = DATA[k], fl = d.faults[+f[k + '_fault'] || 0], g = id => String(f[k + '_p_' + id] || '').trim();
    return `你是${d.name}維修技師，用繁體中文（臺灣用語）回答成人學員。
① 設備：${specLine}
② 現象：${g('sym') || fl.sym}
③ 條件：${g('cond') || '（未填）'}
④ 已排除：${g('done') || '（未填）'}
⑤ 目標：依機率排序 5 個可能原因，每項附檢查方法、所需工具、預期正常值。
⑥ 輸出格式：Markdown 表格，最後附一段「下一步建議」。
⑦ 邊界：涉及通電、拆機或高溫的步驟請標示⚠；不要編造我沒提供的數據；不確定的地方請說明需要再量測什麼。`;
  };

  /* 互動元件 */
  window.DECK_WIDGET_EXT = window.DECK_WIDGET_EXT || [];
  window.DECK_WIDGET_EXT.push(api => ({
    faultcards: {
      html: f => { const d = DATA[f.kit], cur = +api.S.f[f.kit + '_fault'] || 0;
        return `<div class="q">${esc(f.label || '選一張故障卡（點一下）')}</div><div class="cards">${d.faults.map((x, i) => `<button class="cd fc${i === cur ? ' on' : ''}" data-fc="${i}" style="text-align:left;cursor:pointer;${i === cur ? 'border:2px solid #ea580c;background:#fff7ed' : ''}"><b>${String(i + 1).padStart(2, '0')}｜${esc(x.t)}</b><small>${esc(x.sym)}</small></button>`).join('')}</div>
        <div class="fcbox" style="margin-top:8px"></div>`; },
      paint(f, el) { const x = DATA[f.kit].faults[+api.S.f[f.kit + '_fault'] || 0];
        el.querySelector('.fcbox').innerHTML = `<table class="tbl"><tbody><tr><th style="width:7em">故障現象</th><td>${esc(x.sym)}</td></tr><tr><th>可能原因</th><td>${esc(x.cause)}</td></tr><tr><th>檢查方法</th><td>${esc(x.check)}</td></tr><tr><th>安全提醒</th><td>⚠ ${esc(x.safe)}</td></tr></tbody></table>`; },
      async mount(f) { document.querySelectorAll('[data-fc]').forEach(b => b.onclick = () => { api.S.f[f.kit + '_p_sym'] = ''; api.setv(f.kit + '_fault', b.dataset.fc); api.rerender(); }); }
    },
    fmea: {
      html: f => `<div class="q">${esc(f.label || 'FMEA：替每個故障模式打分數（1＝很低、10＝很高）')}</div><div class="fmbox" style="overflow:auto"></div><p class="hint">S 嚴重度：發生時多危險／多影響比賽；O 發生度：多常發生；D 偵測度：賽前<b>越難發現</b>分數越高。RPN ≥ 125 列為優先改善。</p>`,
      paint(f, el) {
        const k = f.kit, rows = MAINT.fmeaRows(k, api.S.f), opt = v => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option${n === v ? ' selected' : ''}>${n}</option>`).join('');
        el.querySelector('.fmbox').innerHTML = `<table class="tbl"><thead><tr><th>排序</th><th>故障模式</th><th>S</th><th>O</th><th>D</th><th>RPN</th></tr></thead><tbody>${rows.map((r, i) => `<tr style="${r.RPN >= 125 ? 'background:#fef2f2' : ''}"><td>${i + 1}</td><td>${esc(r.t)}</td>${['S', 'O', 'D'].map(c => `<td><select data-fm="${r.i}" data-c="${c}">${opt(r[c])}</select></td>`).join('')}<td><b style="color:${r.RPN >= 125 ? '#b91c1c' : '#0f172a'}">${r.RPN}</b>${r.RPN >= 125 ? ' ⚠' : ''}</td></tr>`).join('')}</tbody></table>`;
        el.querySelectorAll('[data-fm]').forEach(s => s.onchange = () => { let o = {}; try { o = JSON.parse(api.S.f[k + '_fmea'] || '{}'); } catch (e) { } const i = s.dataset.fm; o[i] = o[i] || {}; const r0 = rows.find(r => r.i === +i); o[i] = { S: r0.S, O: r0.O, D: r0.D }; o[i][s.dataset.c] = +s.value; api.setv(k + '_fmea', JSON.stringify(o)); });
      }
    },
    sensorlog: {
      html: f => { const d = DATA[f.kit]; return `<div class="q">${esc(f.label || d.log + '：拉動門檻，找出異常時段')}</div>${d.ch.map((c, i) => `<div class="slg" data-i="${i}" style="margin:6px 0 10px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><b>${esc(c.n)}（${c.u}）</b><label style="font-size:14px">${c.hi != null ? '上限' : '下限'}門檻 <input type="range" class="thr" min="0" max="100" value="50" style="width:160px"> <span class="tv"></span></label></div><canvas width="900" height="120" style="width:100%;height:120px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"></canvas><div class="al" style="font-size:14px;color:#b91c1c"></div></div>`).join('')}`; },
      async mount(f) {
        const d = DATA[f.kit], S = MAINT.series(f.kit);
        document.querySelectorAll('.slg').forEach(box => {
          const i = +box.dataset.i, c = d.ch[i], pts = S[i], cv = box.querySelector('canvas'), x = cv.getContext('2d'), r = box.querySelector('.thr');
          const mn = Math.min(...pts), mx = Math.max(...pts), pad = (mx - mn) * 0.1 || 1, lo = mn - pad, hi = mx + pad;
          const def = c.hi != null ? c.hi : c.lo; r.value = Math.round((def - lo) / (hi - lo) * 100);
          const draw = () => {
            const th = lo + (hi - lo) * r.value / 100; box.querySelector('.tv').textContent = th.toFixed(c.u === 'V' || c.u === 'm/s' ? 2 : 1) + ' ' + c.u;
            const W = cv.width, H = cv.height, X = t => t / (pts.length - 1) * W, Y = v => H - (v - lo) / (hi - lo) * H;
            x.clearRect(0, 0, W, H); const bad = v => c.hi != null ? v > th : v < th;
            const segs = []; let st = -1; pts.forEach((v, t) => { if (bad(v) && st < 0) st = t; if ((!bad(v) || t === pts.length - 1) && st >= 0) { segs.push([st, t]); st = -1; } });
            x.fillStyle = 'rgba(239,68,68,.15)'; segs.forEach(([a, b]) => x.fillRect(X(a), 0, Math.max(2, X(b) - X(a)), H));
            x.strokeStyle = '#2563eb'; x.lineWidth = 2; x.beginPath(); pts.forEach((v, t) => t ? x.lineTo(X(t), Y(v)) : x.moveTo(X(t), Y(v))); x.stroke();
            x.strokeStyle = '#ef4444'; x.setLineDash([6, 4]); x.beginPath(); x.moveTo(0, Y(th)); x.lineTo(W, Y(th)); x.stroke(); x.setLineDash([]);
            x.fillStyle = '#64748b'; x.font = '12px sans-serif'; x.fillText('0 秒', 4, H - 4); x.fillText(d.dur + ' 秒', W - 44, H - 4);
            box.querySelector('.al').innerHTML = segs.length ? `⚠ 警報 ${segs.length} 段：${segs.slice(0, 6).map(([a, b]) => a + '–' + b + ' 秒').join('、')}${segs.length > 6 ? '…' : ''}${segs.length > 5 ? '（太多段：門檻可能太嚴，會誤報）' : ''}` : '<span style="color:#15803d">沒有警報（門檻太鬆可能漏報）</span>';
          };
          r.oninput = draw; draw();
        });
      }
    }
  }));

  /* U06 頁面 */
  MAINT.unit = (k, u, specLine) => {
    const d = DATA[k], build = {};
    build['diagprompt_' + k] = f => MAINT.prompt(k, f, specLine(f));
    const slides = [
      { kind: 'teach', title: '故障診斷的思路：現象 → 原因 → 檢查 → 安全', why: `機械維修的老手不是背答案，而是有固定的推理順序。這一單元用同一套方法，替您設計的${d.name}做「出問題時怎麼辦」與「賽前怎麼檢查」。`,
        html: `<div class="cards"><div class="cd"><b>① 描述現象</b><small>看到、聽到、量到什麼？何時發生？</small></div><div class="cd"><b>② 列出可能原因</b><small>依機率排序，不只一個</small></div><div class="cd"><b>③ 檢查方法</b><small>從簡單、不用拆的開始</small></div><div class="cd"><b>④ 安全提醒</b><small>斷電、拆槳、冷卻、防火</small></div></div>
          <table class="tbl"><thead><tr><th>方法</th><th>用途</th><th>本單元的動手頁</th></tr></thead><tbody>
          <tr><td>故障卡＋七欄位提示詞</td><td>把問題描述清楚，讓 AI 給可用的診斷</td><td>動手 1</td></tr>
          <tr><td>FMEA（失效模式與影響分析）</td><td>RPN＝嚴重度 × 發生度 × 偵測度，決定先改善哪一項</td><td>動手 2</td></tr>
          <tr><td>感測紀錄異常偵測</td><td>用門檻找出異常時段，練習「誤報」與「漏報」的取捨</td><td>動手 3</td></tr>
          <tr><td>檢核表</td><td>賽前、賽中、賽後的固定流程</td><td>動手 4</td></tr></tbody></table>
          <p class="src">方法轉化自本系列機械群研習（故障現象題庫、七欄位提示詞、FMEA、感測器異常偵測、實習安全檢核表）；案例依${d.name}重新撰寫，數值為一般經驗範圍，實際以原廠手冊為準。</p>`,
        say: '先記住四個字：象、因、查、安。之後不管問 AI 還是問老師，都照這個順序講。' },
      { kind: 'do', step: '動手 1', title: '故障卡＋七欄位：請 AI 幫您診斷', why: `「${d.bad}」這種問法，AI 只能給通用清單。把<b>設備、現象、條件、已排除</b>寫清楚，AI 才能對症。設備欄會自動帶入您在 U05 設計的規格。`,
        steps: ['點一張故障卡。', '在右邊補充「條件」與「已排除」（可照例子寫）。', '看即時組好的七欄位提示詞。', '按「✨ 交給 AI 優化」取得診斷表。'],
        fields: [{ type: 'faultcards', kit: k },
          { type: 'area', id: k + '_p_sym', label: '② 現象（可修改；空白＝用故障卡的描述）', rows: 2, ph: '例：' + d.ex[0] },
          { type: 'area', id: k + '_p_cond', label: '③ 條件（環境、電池、操作、時間點）', rows: 2, ph: '例：' + d.ex[1] },
          { type: 'area', id: k + '_p_done', label: '④ 已排除（已檢查且正常的項目）', rows: 2, ph: '例：' + d.ex[2] },
          { type: 'copybox', id: 'diagprompt_' + k, label: '即時組好的七欄位提示詞', btn: '複製提示詞' },
          { type: 'area', id: k + '_diag', label: '✨ AI 診斷結果（可再自己修改）', rows: 8, ai: { prompt: `{{_b_diagprompt_${k}}}`, demo: '（示範）串接 AI 後按一次，就會依您的七欄位提示詞給出診斷表。' } }], layout: 'wideR' },
      { kind: 'do', step: '動手 2', title: 'FMEA：哪個故障最該先處理？', why: '資源有限時，用 <b>RPN＝S × O × D</b> 排序。注意 D（偵測度）是「越難在賽前發現，分數越高」——看不出來的問題最危險。',
        steps: ['逐列調整 S、O、D（先用直覺，再和隊友討論）。', '表格會自動依 RPN 由高到低排序。', '紅底（RPN ≥ 125）就是您要優先改善的項目，回 U05 想想能不能用設計降低它。'],
        fields: [{ type: 'fmea', kit: k }], layout: 'wideR', say: '同一個故障，不同隊伍打的分數會不一樣，這正是討論的價值。' },
      { kind: 'do', step: '動手 3', title: `${d.log}：找出異常時段`, why: `下面是一份${d.name}${d.act}的教學用模擬紀錄，裡面藏了幾段異常。拉動門檻：太嚴會<b>誤報</b>（一直響），太鬆會<b>漏報</b>（真的壞了沒發現）。`,
        steps: ['逐條拉門檻，讓警報剛好抓到異常、又不會滿畫面紅色。', '把找到的異常時段與可能原因寫下來（可對照故障卡）。', '按「✨ 交給 AI 優化」整理成判讀報告。'],
        fields: [{ type: 'sensorlog', kit: k }, { type: 'area', id: k + '_lognote', label: '我的判讀：異常在哪幾秒？可能是哪一張故障卡？', rows: 4, ph: '例：' + { drone: '115–125 秒電壓驟降到 3.5 V 以下，對應「飛行中突然斷電掉落」', robot: '95 秒傾角超過 40°，對應「出拳後失去平衡」', boat: '150 秒後溫度與電流一起上升、航速下降，對應「馬達過熱停機」' }[k] + '…',
          ai: { prompt: `你是${d.name}維修技師，用繁體中文（臺灣用語）。把學員對${d.log}的判讀整理成「異常時段／可能原因／建議檢查／門檻建議」四欄表格，保留學員寫的數字，不要編造新數據。\n\n{{_me}}`, demo: '（示範）{{_me}}\n串接 AI 後再按一次，就是 AI 整理的判讀報告。' } }], layout: 'wideR' },
      { kind: 'do', step: '動手 4', title: '賽前／賽中／賽後檢查表', why: '檢核表的價值在於「每次都一樣」。勾選您的隊伍要採用的項目，會一起放進安裝包，AI 會把它做成網頁上的可勾選清單。',
        fields: [{ type: 'check', id: k + '_ck_before', label: '賽前（' + d.act + '前）', options: d.check.before, def: [] }, { type: 'check', id: k + '_ck_during', label: '賽中', options: d.check.during }, { type: 'check', id: k + '_ck_after', label: '賽後', options: d.check.after }], layout: 'wideR' },
      { kind: 'teach', title: '使用 AI 的查核習慣與評分規準', why: 'AI 會講得很有自信，但不一定對。成人學習者最重要的能力是<b>查核</b>：知道哪些話要回頭確認。',
        html: `<table class="tbl"><thead><tr><th>查核三步</th><th>做法</th></tr></thead><tbody><tr><td>① 數字要有來源</td><td>規格、扭力、電壓、規則條文，回到原廠手冊或主辦單位規則確認</td></tr><tr><td>② 安全步驟要人工確認</td><td>斷電、拆槳、冷卻、防火的順序，不可只依 AI</td></tr><tr><td>③ 標示 AI 協助</td><td>報告上註明哪些段落由 AI 協助、已查證哪些</td></tr></tbody></table>
          <table class="tbl"><thead><tr><th>評分向度</th><th>優（4）</th><th>可（2）</th></tr></thead><tbody>
          <tr><td>規格合理性</td><td>規格檢查無警告，能說明每個取捨</td><td>有警告未處理</td></tr><tr><td>機構理解</td><td>能用數字解釋性能（推力、平衡、浮力）</td><td>只能描述外觀</td></tr>
          <tr><td>規則符合</td><td>重量、尺寸、安全規定全部符合並附來源</td><td>部分不符</td></tr><tr><td>3D 模型完整度</td><td>零件齊全、可拆解、標籤正確</td><td>零件缺漏</td></tr>
          <tr><td>維修與安全規劃</td><td>FMEA 有排序與改善、檢查表完整</td><td>只列故障未排序</td></tr><tr><td>紀錄與 AI 使用</td><td>AI 協助有標示且已查證</td><td>未標示或直接照抄</td></tr></tbody></table>
          <p class="src">評分規準格式參考本系列機械群研習「4 等級 × 6 向度」範本，依本課作品改寫（表中列出優與可兩級，良與待加強介於其間）。</p>` },
      { kind: 'teach', title: '延伸：把 3D 模型帶進 Blender 做虛擬展間', why: '生成器與 AI 做出的模型都能「⬇ 下載 GLB」。GLB 是通用的 3D 格式，可以帶進 Blender 打光、算圖，或放進虛擬展間給別人參觀。',
        html: `<ol class="steps"><li>在 3D 建模台按「⬇ 下載 GLB 模型」。</li><li>Blender：檔案 → 匯入 → glTF 2.0（.glb）。</li><li>加地板、三點打光，攝影機繞著模型做 10 秒轉台動畫。</li><li>用「拆解」狀態再匯出一份，做成零件展示牆。</li><li>匯出成網頁（GLB＋model-viewer）或影片，放進作品集。</li></ol>
          <p class="txt">這一段對應本系列第 6 次研習「機械零件數位化：以 3D Blender 打造虛擬實習展間」的做法，有興趣可課後延伸。</p>` }
    ];
    return { unit: { u, title: '故障診斷與賽前檢查', done: ['完成一張故障卡的 AI 診斷', 'FMEA 排出優先改善項目', '找出紀錄中的異常時段', '勾好檢查表'], slides }, build };
  };
})();
