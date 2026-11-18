/* 載具單篇課程產生器（無人機／格鬥機器人／水上無人船共用）
 * window.VC.make(cfg) → window.DECK（15W382 引擎格式）
 * cfg = { id, kit, title, cover:{kick,title,sub,list,html,say}, u00:[slides], notes:[[欄位id,標題]], units:[{u,title,done,slides,gen?:true}], pack:{root,out,what,rulesMd} }
 * 單元 gen:true ＝ 在該單元 slides 之後自動加入建模步驟頁＋總檢查頁；打包頁固定加在最後一單元。
 * 生成器步驟取自 window.KITS[kit].steps；左欄即時 3D、右欄填寫＋估算檢查。
 */
(function () {
  const ENGINE_SLIDE = u => ({
    u, kind: 'do', step: '動手', title: '開工準備：資料夾、AI、串接',
    why: '這份講義就是<b>生成器</b>：每一頁的勾選與填寫都會被記住，最後打包成<b>安裝包</b>，交給您電腦裡的 AI，做出您自己的 3D 建模網頁。',
    steps: ['選要用的 AI：Codex（ChatGPT 桌面版）、Claude Code 或 Antigravity。', '在「文件」新增資料夾 <b>載具課程</b>（一鍵建置也放這裡），回來按「選擇我的上課資料夾」→ 允許「編輯檔案」。', '串接 AI：<b>建議</b>下載「載具課程串接包」並雙擊啟動，✨ 與一鍵建置都會用您自己電腦的 AI；沒裝也可以，系統會自動改用雲端備援。'],
    see: '上方「📁」與「🟢 AI 已串接」都變綠色。',
    warn: '請用電腦版 Chrome 或 Edge。本機串接器只綁本機 127.0.0.1、只接受本課網址；關掉黑色視窗就停止。',
    fields: [{ type: 'engine', label: '我要用哪一個 AI 安裝網頁？' }, { type: 'folder' }, { type: 'bridge' }],
    say: '三件事：選 AI、選資料夾、開串接器。串接器開著，最後一頁就能一鍵讓您的 AI 把網頁做出來。'
  });
  const ENG = { codex: 'Codex（ChatGPT 桌面版）', claude: 'Claude Code', agy: 'Antigravity' };
  const howTo = (folderName) => `【Codex（ChatGPT 桌面版）】
① 打開 ChatGPT 桌面版，左上角切到 Codex
② 專案選單 →「新專案」→ 選上課資料夾${folderName ? `「${folderName}」` : '（例如 文件\\載具課程）'}→ 信任資料夾
③ 貼上下方「給 AI 的指令」按 Enter

【Claude Code】
① 檔案總管進到上課資料夾 → 網址列輸入 powershell 按 Enter
② 輸入 claude 按 Enter → 貼上下方指令

【Antigravity】
① 打開 Antigravity →「Open Folder」選上課資料夾
② 在 Agent 面板貼上下方指令`;

  function genSlides(cfg, un) {
    const K = window.KITS[cfg.kit], g = un || cfg.genUnit, out = [];
    const n = K.steps.length;
    K.steps.forEach((st, i) => out.push({
      u: g.u, kind: 'do', step: `建模 ${i + 1}/${n + 1}`, title: st.title, why: st.why, steps: st.steps, see: st.see, warn: st.warn,
      html: `<div class="kitfree-wrap"><iframe class="kitfree" data-k="${cfg.kit}" title="3D 建模預覽"></iframe><p class="hint" style="margin:.3em 0 0">拖曳轉動、滾輪縮放；上方「🔧 拆解」看零件、「⬇ 下載 GLB」存模型。</p></div>`,
      fields: st.fields.concat([{ type: 'kitstats', kit: cfg.kit, rows: 6, goods: false, label: '即時估算（改任何一格都會重算）' }]),
      layout: 'kitL', say: st.say || ''
    }));
    out.push({
      u: g.u, kind: 'do', step: `建模 ${n + 1}/${n + 1}`, title: `步驟 ${n + 1}｜總檢查與規格書`,
      why: '這一頁把前面所有選擇整理成<b>規格書</b>，並逐項檢查衝突。紅色警告建議回去修正；也可以請 AI 當評審，給您改進建議。',
      steps: ['看左邊 3D：按「🔧 拆解」逐一確認零件。', '看右邊檢查：⚠ 越少越好。', '按「✨ 交給 AI 優化」請 AI 評審。'],
      html: `<div class="kitfree-wrap"><iframe class="kitfree" data-k="${cfg.kit}" data-ex="1" title="3D 拆解預覽"></iframe></div>`,
      fields: [{ type: 'kitstats', kit: cfg.kit, label: '完整估算與檢查' }, { type: 'kitspec', kit: cfg.kit },
        { type: 'area', id: cfg.kit + '_review', label: '✨ AI 評審意見（可改寫成您的設計說明）', rows: 8, ai: { prompt: `你是${K.name}競賽評審與機構工程師，用繁體中文（臺灣用語）回答成人學員。下面是學員的規格書與教學估算。請：①用三句話評價這台設計的定位；②指出最重要的 3 個風險（引用規格書數字）；③給 3 個具體修改建議（寫明要把哪一格改成什麼）。不要編造規格書以外的數據。\n\n{{_b_specmd}}`, demo: '（示範）串接 AI 後按一次，就會依您的規格書給評審意見。' } }],
      layout: 'kitL', say: ''
    });
    return out;
  }

  function make(cfg) {
    const K = window.KITS[cfg.kit];
    const units = [{ u: 'U00', title: '開工準備', done: ['上課資料夾設定好（📁 綠色）', 'AI 已串接（🟢）'] }];
    const slides = [{ u: 'U00', kind: 'cover', kick: cfg.cover.kick, title: cfg.cover.title, sub: cfg.cover.sub, list: cfg.cover.list, html: cfg.cover.html, say: cfg.cover.say || '' }];
    (cfg.u00 || []).forEach(s => slides.push(Object.assign({ u: 'U00' }, s)));
    slides.push(ENGINE_SLIDE('U00'));
    const specLine = f => { const s = K.spec(f), c = K.calc(s); return `${s.name}（${K.name}）；` + c.rows.slice(0, 5).map(r => r[0] + ' ' + r[1]).join('、'); };
    const M = (window.MAINT && cfg.maint !== false) ? window.MAINT.unit(cfg.kit, 'U0' + (cfg.units.length + 1), specLine) : null;
    const allUnits = M ? cfg.units.concat([M.unit]) : cfg.units;
    allUnits.forEach(un => {
      units.push({ u: un.u, title: un.title, done: un.done || [] });
      un.slides.forEach(s => slides.push(Object.assign({ u: un.u }, s)));
      if (un.gen) genSlides(cfg, un).forEach(s => slides.push(s));
    });
    const P = cfg.pack, lastU = allUnits[allUnits.length - 1].u;
    const build = Object.assign({ specmd: f => K.md(K.spec(f)) }, M ? M.build : {});
    slides.push({ u: lastU, kind: 'do', step: '打包', title: `打包：${P.root}`, why: `把 3D 建模生成器的所有選擇、規格書、參考模型程式與這一篇的筆記打包，交給 AI 做出<b>${P.out}</b>。`,
      steps: ['看「打包前檢查」，未打勾的可回去補（不補也能打包）。', '<b>有開本機串接器</b>：按「🤖 一鍵交給我的 AI 建置」，等進度顯示完成，按「🌐 打開我的成品網頁」。', '<b>沒開串接器</b>：按「📦 產生安裝包」存進上課資料夾，再按「📋 複製給 AI 的指令」貼給 AI。', `兩種方式做出的都是「${P.out}」。`],
      see: `資料夾裡多了「${P.root}」，AI 照 INSTALL.md 做出 ${P.out}。`, fields: [{ type: 'checklist' }, { type: 'build' }, { type: 'pack' }], layout: 'wideR', say: '有開本機串接器的同學，直接按「一鍵交給我的 AI 建置」；沒開的同學，產生安裝包、複製指令貼給 AI。做完我們一起看成品。' });
    const notesIds = cfg.notes || [];
    const D = { id: cfg.id, title: cfg.title, units, slides, build, sample: {}, vendors: {}, packOut: P.out };
    D.pack = async (f, ctx) => {
      const s = K.spec(f), c = K.calc(s);
      const txt = async p => { try { const r = await fetch(p, { cache: 'no-store' }); return r.ok ? await r.text() : ''; } catch (e) { return ''; } };
      const notes = notesIds.map(([id, t]) => `## ${t}\n\n${String(f[id] || '（未填）')}\n`).join('\n');
      const files = {
        '00_先讀我.txt': `這是「${P.root}」。\n把整個資料夾交給您的 AI（Codex／Claude Code／Antigravity），說：請讀 INSTALL.md 照步驟做。\n完成後會得到：${P.out}。\n產生時間：${new Date().toLocaleString('zh-TW')}\n`,
        'INSTALL.md': install(cfg, K, s, c),
        'AGENTS.md': '請先讀 INSTALL.md，照步驟完成；所有規格以 spec.json 與 references/ 為準。\n', 'CLAUDE.md': '請先讀 INSTALL.md，照步驟完成。\n', 'GEMINI.md': '請先讀 INSTALL.md，照步驟完成。\n',
        'spec.json': JSON.stringify({ kind: cfg.kit, spec: s, estimate: { rows: c.rows, warnings: c.warns.map(x => x.replace(/<[^>]+>/g, '')) } }, null, 2),
        'references/spec.md': K.md(s),
        'references/maintenance.md': window.MAINT ? window.MAINT.md(cfg.kit, f) : '',
        'references/rules.md': P.rulesMd || '',
        'references/reference-model.js': await txt(`../js/kits/${cfg.kit}-3d.js`),
        'references/reference-calc.js': await txt(`../js/kits/${cfg.kit}.js`),
        'references/my-notes.md': `# 我在講義上寫的筆記（${cfg.title}）\n\n${notes}\n## AI 評審意見\n\n${String(f[cfg.kit + '_review'] || '（未填）')}\n`
      };
      return { root: P.root, files };
    };
    D.packPrompt = f => `請讀 ${P.root}/INSTALL.md，照步驟幫我做出「${P.out}」，做完自己測試並截圖，再用白話告訴我怎麼打開。`;
    D.packCommand = (f, ctx) => `${howTo(ctx.folder.h && ctx.folder.h.name)}\n\n給 AI 的指令：\n\n${D.packPrompt(f)}`;
    D.checklist = (f, ctx) => {
      const c = K.calc(K.spec(f));
      return [{ ok: ctx.folder.ok(), t: '已設定上課資料夾（U00）' }, { ok: !!f.engine, t: '已選要用的 AI（U00）' }, { ok: !!String(f[K.prefix + 'name'] || '').trim(), t: '已幫載具取名字（建模步驟 1）' },
        { ok: c.warns.length === 0, t: c.warns.length ? `規格檢查還有 ${c.warns.length} 個警告（可打包，但建議先修）` : '規格檢查全部通過' },
        { ok: !!String(f[cfg.kit + '_review'] || '').trim(), t: 'AI 評審意見已產生（總檢查頁）' }]
        .concat(notesIds.map(([id, t]) => ({ ok: !!String(f[id] || '').trim(), t: `筆記：${t}` })))
        .concat(M ? [{ ok: !!String(f[cfg.kit + '_diag'] || '').trim(), t: '故障診斷：AI 診斷已產生（U06）' }, { ok: !!f[cfg.kit + '_fmea'], t: 'FMEA 已評分（U06）' }, { ok: (f[cfg.kit + '_ck_before'] || []).length > 0, t: '賽前檢查表已勾選（U06）' }] : []);
    };
    return D;
  }

  function install(cfg, K, s, c) {
    const P = cfg.pack;
    return `# INSTALL｜${P.out}

您是學員的 AI 助手。請在這個資料夾旁邊建立資料夾 **「${P.out}」**，做出一個可以離線打開的 3D 建模網頁，並自己測試。

## 輸入
- \`spec.json\`：學員在生成器選的全部規格（${K.name}：${s.name}）與教學估算。
- \`references/spec.md\`：同一份規格的表格版（給人看）。
- \`references/reference-model.js\`：課程平台用的參數化 Three.js 模型（ES module，\`build(THREE, spec)\`，需要 \`window.KITS\`）。**以它為起點改寫，不要從零亂畫。**
- \`references/reference-calc.js\`：規格正規化與估算公式（classic script，定義 \`window.KITS.${K.k}\`）。
- \`references/rules.md\`：競賽規則摘要。
- \`references/my-notes.md\`：學員上課筆記與 AI 評審意見（可用來寫說明文字）。
- \`references/maintenance.md\`：學員選的故障卡、AI 診斷、FMEA 風險排序、紀錄判讀與賽前／賽中／賽後檢查表。

## 要做出的成品
${P.what || ''}
1. \`index.html\`：全螢幕 3D 檢視（Three.js r160 以上，用 importmap 從 https://cdn.jsdelivr.net/npm/three@0.160.0/ 載入，或把檔案放進 vendor/ 離線使用）。
   - 依 \`spec.json\` 建出模型：尺寸、數量、顏色、零件都要對應規格（例如槳徑、軸距、葉數、顏色）。
   - 工具列：**組合／拆解（爆炸圖動畫）**、**零件標籤**、**動作展示**、**自動旋轉**、**下載 GLB**（GLTFExporter）。
   - 點擊零件：側欄顯示零件名稱、功能、規格數字（取自 spec.md）。
   - 側欄分頁：「規格」（spec.md 表格）、「估算與檢查」（spec.json 的 estimate）、「競賽規則」（rules.md）、「設計說明」（my-notes.md 的 AI 評審）、「維修保養」（maintenance.md：FMEA 表依 RPN 排序並標出 ≥125 的項目；賽前／賽中／賽後檢查表做成可勾選清單，勾選狀態存在 localStorage）。
   - 標題用學員取的名字「${s.name}」；版面全寬、繁體中文、專業語氣。
2. \`README.md\`：怎麼打開（雙擊或 \`python -m http.server\`）、怎麼改規格（改 spec.json 重新整理）。
3. （選做）若電腦有 Blender 4.x 以上：\`blender/build_model.py\` 用 bpy 依 spec.json 建同一台模型並匯出 \`model.glb\`；沒有 Blender 就跳過並說明。

## 驗收（一定要做）
1. 用本機伺服器打開 index.html，瀏覽器主控台 **0 個錯誤**。
2. 截兩張圖存到 \`${P.out}/screenshots/\`：組合狀態、拆解＋標籤狀態。
3. 按「下載 GLB」確認能下載（或用程式呼叫匯出確認不報錯）。
4. 用白話告訴學員：成品在哪裡、怎麼打開、怎麼改顏色或尺寸。

## 注意
- 估算數字是課程的「教學估算」，網頁上要標示「教學估算，非實測」。
- 不要上傳到網路、不要安裝與本任務無關的套件。
`;
  }
  window.VC = { make, genSlides, ENGINE_SLIDE };
})();
