/* 無人載具課程：把 data/content.js（window.COURSE）展開成 15W382 簡報引擎要的 window.DECK
 * 每單元：講解 → 動手 1（打開工具、做完打勾）→ 動手 2（生成器＋即時產出＋✨AI 潤飾）→ 隨堂小測
 * 每一天最後一單元：打包「安裝包」交給 AI（Codex／Claude Code／Antigravity）
 */
(function () {
  const VEH = [
    ['drone:red', '無人機｜紅隼號', '紅色機・攻擊手常用色'], ['drone:blue', '無人機｜藍鯨號', '藍色機・防守手常用色'], ['drone:green', '無人機｜綠螳號', '綠色機・練習與巡航'],
    ['robot:servo', '人形格鬥機器人｜舵機鬥士', '二足伺服舵機格鬥機，靈活好上手'], ['robot:boxer', '人形格鬥機器人｜拳擊人形', '全尺寸拳擊人形機器人，出拳最快'], ['robot:titan', '人形格鬥機器人｜重裝泰坦', '重裝甲構想機，打得重但比較慢'],
    ['boat:vhull', '無人船｜隱身快艇', '多面隱身船殼＋感測桅桿，直線最快'], ['boat:catamaran', '無人船｜穿浪雙體', '兩個細長船身穿浪，轉彎最穩'], ['boat:foil', '無人船｜水翼巡邏艇', '水翼把船身抬出水面，阻力最小']
  ].map(([v, l, s]) => ({ v, l, s }));
  const DET = [['defender', '無人機：當防守手（不掛攻擊手彩帶）'], ['nocage', '無人機：不加保護球籠'], ['noled', '無人機：關掉隊伍燈'], ['blockfist', '人形：金屬方拳（不戴拳套）'], ['light', '人形：輕裝（拿掉外殼裝甲）'], ['camonly', '無人船：只裝光電攝影機'], ['nomast', '無人船：不裝感測桅桿（競速版）'], ['nolights', '無人船：關掉航行燈']].map(([v, l]) => ({ v, l }));
  const ENGN = { codex: 'Codex', claude: 'Claude Code', agy: 'Antigravity' };
  const FORGE = 'https://aliang-vehicle-forge.netlify.app';
  const day1 = () => { try { return (JSON.parse(localStorage.getItem('vehicledeck.v1.D1') || '{}').f) || {}; } catch (e) { return {}; } };
  const withVeh = f => Object.assign({}, day1(), f.veh ? {} : {}, f.veh ? f : Object.assign({}, f, { veh: day1().veh, veh_d: day1().veh_d, veh_name: day1().veh_name, veh_color: day1().veh_color }));
  const fillT = (tpl, f, uid) => tpl.replace(/\{(\w+)\}/g, (m, k) => { const v = f[uid + '_' + k]; return v == null || String(v).trim() === '' ? '＿＿' : String(v); });

  const vehFields = (label, def) => [
    { type: 'radio', id: 'veh', label: label || '選一台載具（類型＋型態）', options: VEH, def: def || 'drone:red' },
    { type: 'vehicle3d' },
    { type: 'check', id: 'veh_d', label: '細節（只會套用到你選的類型）', options: DET },
    { type: 'text', id: 'veh_name', label: '幫它取名字', ph: '例：鋼鐵阿亮號' },
    { type: 'text', id: 'veh_color', label: '主色（色碼，可不填）', ph: '例：#ff5a1f' }
  ];
  const engineSlide = (u, step) => ({
    u, kind: 'do', step, title: '開工準備：資料夾、AI、串接',
    why: '這份簡報就是<b>生成器</b>：你在每一頁勾選、填寫的內容，最後會打包成<b>安裝包</b>，交給你電腦裡的 AI 安裝成網頁。',
    steps: ['選你要用的 AI：Codex（ChatGPT 桌面版）、Claude Code 或 Antigravity。', '在「文件」新增資料夾 <b>載具課程</b>，回來按「選擇我的上課資料夾」→「編輯檔案」。', '按「🔌 串接 AI」：課程伺服器會自動檢查 6 項，全部打勾就完成；有問題照「怎麼修」做，再按「重新偵測」。'],
    see: '上方「📁」與「🟢 AI 已串接」都變綠色。',
    warn: '請用電腦版 Chrome 或 Edge。串接 <b>不用下載任何東西</b>，AI 由課程伺服器代理。',
    fields: [{ type: 'engine', label: '我要用哪一個 AI 安裝網頁？' }, { type: 'folder' }, { type: 'bridge' }],
    say: '三件事：選 AI、選資料夾、按串接。串接是在雲端做，大家的電腦不用裝任何串接包。'
  });
  const packCommand = (root, prompt) => (f, ctx) => `【Codex（ChatGPT 桌面版）】
① 打開 ChatGPT 桌面版，左上角切到 Codex
② 專案選單 →「新專案」→ 選你的上課資料夾${ctx.folder.h ? `「${ctx.folder.h.name}」` : '（例如 文件\\載具課程）'}→ 信任資料夾
③ 貼上下面「給 AI 的指令」按 Enter

【Claude Code】
① 檔案總管進到上課資料夾 → 網址列輸入 powershell 按 Enter
② 輸入 claude 按 Enter → 貼上下面的指令

【Antigravity】
① 打開 Antigravity →「Open Folder」選上課資料夾
② 在 Agent 面板貼上下面的指令

給 AI 的指令：

${prompt(f)}`;

  function makeDeck(dayId) {
    const C = window.COURSE, dk = C.days.find(d => d.id === dayId), di = C.days.indexOf(dk);
    const units = [], slides = [], build = {};
    const firstU = 'U00';
    units.push({ u: firstU, title: '開工準備' + (dayId === 'D1' ? '：選載具、資料夾、AI' : '：資料夾與 AI 串接'), done: ['上課資料夾設定好（📁 綠色）', 'AI 已串接（🟢）', ...(dayId === 'D1' ? ['選好我的載具'] : [])] });
    slides.push({ u: firstU, kind: 'cover', kick: `${C.title}｜第 ${di + 1} 篇`, title: dk.name.replace('：', '<br>'), sub: dk.goal + '　這份簡報不只是看的：每一頁都可以勾選、輸入、按 ✨ 請 AI 幫忙，最後一頁按「打包」，交給你電腦裡的 AI 安裝。', list: dk.units.map((u, i) => `U0${i + 1} ${u.title}`), say: '各位老師好，這一篇跟著我一頁一頁做。你填的每一格都會被記下來，最後變成你自己的網頁。' });
    slides.push(engineSlide(firstU, '動手 1'));
    if (dayId === 'D1') slides.push({ u: firstU, kind: 'do', step: '動手 2', title: '選一台載具：之後四篇它都是主角', why: '先選類型與型態，再選細節。右邊 3D 會即時變化，拖曳可以轉動。', steps: ['從 9 台裡選一台。', '勾細節（只會套用到你選的類型）。', '取名字；想換顏色就填色碼。'], see: '3D 預覽換成你選的載具，左下角顯示名字。', fields: vehFields(), layout: 'wideR', say: '選你真的有興趣的。之後拆解、比賽、做島，都是這一台。' });
    if (dayId !== 'D1') slides.push({ u: firstU, kind: 'do', step: '動手 2', title: '確認我的載具（沿用第一篇）', why: '第一篇選的載具會自動帶進來，要換也可以。', steps: ['確認 3D 是你的載具。', '想換就重選，安裝包會用這裡的設定。'], fields: vehFields('我的載具（預設沿用第一篇）', day1().veh), say: '' });

    dk.units.forEach((cu, i) => {
      const U = 'U0' + (i + 1), uid = cu.id;
      units.push({ u: U, title: cu.title, done: [...cu.check, '帶走：' + cu.out] });
      slides.push({ u: U, kind: 'teach', title: cu.title, why: '這個單元你會：' + cu.goal.join('、') + '。', steps: cu.talk, say: cu.say });
      slides.push({ u: U, kind: 'do', step: '動手 1', title: '動手做：' + cu.tool.label, why: '點右邊按鈕打開實際操作頁（新分頁），照上一頁的重點操作，做完回來打勾。',
        steps: ['按「▶ 打開」。', '照重點操作一次，有問題舉手。', '做完回到這一頁，勾「我做到了」。'],
        fields: [{ type: 'links', label: '實際操作頁', items: [{ label: '▶ 打開：' + cu.tool.label, href: '../' + cu.tool.url, cls: 'am' }, { label: '看老師的示範成品島', href: '../hub.html' }] },
          { type: 'check', id: uid + '_did', label: '我做到了', options: cu.check }], say: '' });
      const fields = cu.gen.fields.map(([k, label, ph]) => ({ type: /結論|原因|策略|計畫|理念|性能|限制|建議|順序|關鍵/.test(label) ? 'area' : 'text', id: uid + '_' + k, label, ph: ph ? '例：' + ph : '', rows: 3 }));
      build['g_' + uid] = f => fillT(cu.gen.tpl, f, uid);
      fields.push({ type: 'copybox', id: 'g_' + uid, label: '即時產出：' + cu.out, btn: '複製這份成果' });
      if (cu.gen.ai || cu.ai) fields.push({ type: 'area', id: uid + '_ai', label: '✨ 請 AI 潤飾（會把上面的即時產出改得更清楚，不改數字）', rows: 6,
        ai: { prompt: `你是課程助教，用繁體中文（臺灣用語）。把下面這份「${cu.out}」潤飾得更清楚、更專業，不要改變事實與數字，不要編造資料，保留原本格式；最後加一行「💡 提醒：」給一個具體建議。\n\n{{_b_g_${uid}}}`, demo: '（示範）{{_me}}\n💡 提醒：串接 AI 後再按一次，就是 AI 依你的內容潤飾的版本。' } });
      slides.push({ u: U, kind: 'do', step: '動手 2', title: cu.gen.title, why: '左邊填寫，右邊即時產出；這份成果會一起放進這一篇的安裝包。', steps: ['照提示填（沒想法就照「例：」寫）。', '看右邊即時產出。', cu.gen.ai || cu.ai ? '按「✨ 交給 AI 優化」讓 AI 潤飾。' : '按「複製這份成果」貼到你的筆記。'], fields, layout: 'wideR', say: '' });
      ([]).forEach((q, qi) => slides.push({ u: U, kind: 'do', step: '小測 ' + (qi + 1), title: '隨堂小測：' + q.q, why: '選一個答案，馬上知道對不對。', fields: [{ type: 'radio', id: uid + '_q' + qi, label: q.q, options: q.o, answer: q.o[q.a] }], say: '' }));
    });

    // ── 每天的安裝包 ──
    const notes = f => dk.units.map(cu => `## ${cu.title}｜${cu.out}\n\n${(f[cu.id + '_ai'] || '').trim() || fillT(cu.gen.tpl, f, cu.id)}\n`).join('\n');
    const lastU = 'U0' + dk.units.length;
    let D = { id: dayId, title: `${C.title}｜${dk.name}`, units, slides, build, sample: {} };
    const packSlide = (title, why, root, outName) => ({ u: lastU, kind: 'do', step: '打包', title, why,
      steps: ['看「打包前檢查」，還沒打勾的可以回去補（不補也能打包）。', '按「📦 產生安裝包」：會存進你的上課資料夾。', '按「📋 複製給 AI 的指令」，照下方說明貼給你的 AI。', `AI 做完會告訴你怎麼打開「${outName}」。`],
      see: `資料夾裡多了「${root}」，AI 照 INSTALL.md 做出 ${outName}。`, fields: [{ type: 'checklist' }, { type: 'pack' }], layout: 'wideR', say: '打包、複製、貼給 AI，接下來等 AI 做完，大家看它的測試截圖。' });
    const baseChecks = (f, ctx) => [{ ok: ctx.folder.ok(), t: '已設定上課資料夾（U00）' }, { ok: !!(f.engine), t: '已選要用的 AI（U00）' }, { ok: !!(withVeh(f).veh), t: '已選我的載具' }];
    if (dayId === 'D1' || dayId === 'D2' || dayId === 'D4') {
      if (dayId === 'D2') slides.push({ u: lastU, kind: 'do', step: '設定', title: '我的競技場設定', why: '這些設定會寫進安裝包，AI 照著做出你的競技場。', fields: [
        { type: 'check', id: 'arena_modes', label: '要哪些模式', options: ['對戰（跟電腦）', '練習模式', '2 人同一台電腦對打'], def: ['對戰（跟電腦）', '練習模式'] },
        { type: 'radio', id: 'arena_level', label: '電腦對手難度', options: ['簡單', '普通', '困難', '可以在畫面上選'], def: '可以在畫面上選' },
        { type: 'select', id: 'arena_time', label: '每局／每場時間', options: ['60 秒', '90 秒', '2 分鐘', '3 分鐘'], def: '90 秒' },
        { type: 'select', id: 'arena_laps', label: '無人船圈數（選無人船才用）', options: ['1', '2', '3', '5'], def: '3' },
        { type: 'check', id: 'arena_cams', label: '鏡頭', options: ['轉播鏡頭', '俯視鏡頭', '跟隨鏡頭'], def: ['轉播鏡頭', '跟隨鏡頭'] },
        { type: 'area', id: 'arena_extra', label: '額外要求（可不填）', ph: '例：得分時要有煙火、場地改成夜晚', rows: 3 }], say: '' });
      if (dayId === 'D4') slides.push({ u: lastU, kind: 'do', step: '設定', title: '我的賽事版設定', why: '這是給第三篇做好的載具島用的「更新包」，AI 會在原本的島上加賽事功能。', fields: [
        { type: 'text', id: 'ev_name', label: '我的載具島名稱', ph: '例：鋼鐵阿亮競技群島' },
        { type: 'radio', id: 'ev_format', label: '賽制', options: ['單淘汰', '循環賽', '計時排名'], def: '單淘汰' },
        { type: 'area', id: 'ev_teams', label: '參賽名單（一行一隊／一人，可不填）', rows: 4 },
        { type: 'check', id: 'ev_boards', label: '排行榜', options: ['個人最佳紀錄', '班級排行（本機）', '三項賽事總積分'], def: ['個人最佳紀錄'] },
        { type: 'area', id: 'ev_extra', label: '額外要求（可不填）', ph: '例：頒獎頁要放學校 Logo', rows: 3 }], say: '' });
      const cfg = {
        D1: { root: '我的載具拆解頁安裝包', out: '我的載具機構拆解頁', title: '打包：我的載具拆解頁安裝包', why: '把這一篇的載具選擇與 8 個單元的成果打包，交給 AI 做出你的<b>機構拆解網頁</b>。', inst: f => window.VK.install1(withVeh(f)) },
        D2: { root: '我的競技場安裝包', out: '我的競技場', title: '打包：我的競技場安裝包', why: '把競技場設定與這一篇的成果打包，交給 AI 做出<b>可以跟電腦對打的競技場</b>。', inst: f => window.VK.install2(withVeh(f)) },
        D4: { root: '我的賽事版更新包', out: '賽事版載具島', title: '打包：我的賽事版更新包', why: '把賽事設定打包成<b>更新包</b>，交給 AI 在你第三篇的載具島上加賽事功能。', inst: f => window.VK.install4(withVeh(f)) }
      }[dayId];
      slides.push(packSlide(cfg.title, cfg.why, cfg.root, cfg.out));
      D.pack = async f => {
        const g = withVeh(f), s = window.VK.spec(g);
        const files = {
          '00_先讀我.txt': `這是「${cfg.root}」。\n把整個資料夾交給你的 AI（Codex／Claude Code／Antigravity），說：請讀 INSTALL.md 照步驟做。\n做完會得到：${cfg.out}。\n產生時間：${new Date().toLocaleString('zh-TW')}\n`,
          'INSTALL.md': cfg.inst(f), 'AGENTS.md': '請先讀 INSTALL.md，照步驟完成，所有規格以 vehicle.json 與 references/ 為準。\n', 'CLAUDE.md': '請先讀 INSTALL.md，照步驟完成。\n', 'GEMINI.md': '請先讀 INSTALL.md，照步驟完成。\n',
          'vehicle.json': JSON.stringify(s, null, 2), 'references/vehicle.md': window.VK.doc(g), 'references/teardown-rules.md': window.VK.RULES_TEARDOWN, 'references/my-notes.md': `# 老師在簡報上寫的成果（${dk.name}）\n\n${notes(f)}`
        };
        return { root: cfg.root, files };
      };
      D.packPrompt = f => `請讀 ${cfg.root}/INSTALL.md，照裡面的步驟幫我做出「${cfg.out}」，做完自己測試並截圖，再用白話告訴我怎麼打開。`;
      D.packCommand = packCommand(cfg.root, D.packPrompt);
      D.checklist = (f, ctx) => baseChecks(f, ctx).concat(dk.units.map(cu => ({ ok: (Array.isArray(f[cu.id + '_did']) && f[cu.id + '_did'].length > 0), t: `${cu.title}：做到了` })));
    }
    if (dayId === 'D3') {
      slides.push({ u: lastU, kind: 'do', step: '打包', title: '用載具島工坊產生「我的載具島」安裝包', why: '第三篇的成品是一整座 3D 載具島：在<b>載具島工坊</b>選載具、選島型與外觀，下載載具島包，交給 AI 蓋島。',
        steps: ['按「打開載具島工坊」。', '步驟 1 打造載具（跟這份簡報選的一樣）＋選島型「載具競技群島」。', '一路填到步驟 6，按「下載」，解壓縮到你的上課資料夾。', '複製下方指令貼給你的 AI。'],
        fields: [{ type: 'links', label: '生成平台', items: [{ label: '🏝 打開載具島工坊', href: FORGE, cls: 'am' }, { label: '看老師的示範成品島', href: '../hub.html' }] },
          { type: 'copybox', id: 'd3cmd', label: '給 AI 的指令', btn: '複製指令' }], say: '工坊是生成器，島要你自己設計：島名、島嶼清單、外觀、玩法都由你決定。' });
      build.d3cmd = f => `請用這個資料夾幫我蓋好我的 3D 載具島網站。先讀 START_HERE.md，再讀 SKILL.md、project.json、references/（尤其是 vehicle.md）；資料不夠先問我；做完照 references/checklist.md 實際測試並截圖，再問我要部署到哪裡。`;
    }
    D.vendors = {};
    return D;
  }
  window.makeDeck = makeDeck;
})();
