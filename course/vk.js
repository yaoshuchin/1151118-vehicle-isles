// 簡報用的「我的載具」規格產生器（window.VK）：欄位 → 規格 JSON、vehicle.md、每天安裝包的 INSTALL.md
import { VARIANTS, TYPE_NAME, variantOf } from '../js/models.js';
import { kin } from '../js/kin.js';
import { PARTS } from '../data/parts.js';

const hex = n => '#' + n.toString(16).padStart(6, '0');
const OPTS = [];
for (const t of ['drone', 'robot', 'boat']) for (const v of VARIANTS[t]) OPTS.push({ v: t + ':' + v.id, l: `${TYPE_NAME[t]}｜${v.name}`, s: v.sub });
const DETAIL = [
  { v: 'defender', l: '無人機：當防守手（不掛攻擊手彩帶）', t: 'drone' }, { v: 'nocage', l: '無人機：不加保護球籠', t: 'drone' }, { v: 'noled', l: '無人機：關掉隊伍燈', t: 'drone' },
  { v: 'blockfist', l: '人形：金屬方拳（不戴拳套）', t: 'robot' }, { v: 'light', l: '人形：輕裝（拿掉外殼裝甲）', t: 'robot' },
  { v: 'camonly', l: '無人船：只裝光電攝影機', t: 'boat' }, { v: 'nomast', l: '無人船：不裝感測桅桿（競速版）', t: 'boat' }, { v: 'nolights', l: '無人船：關掉航行燈', t: 'boat' }
];
function pick(f) {
  const [t0, v0] = String(f.veh || 'drone:red').split(':');
  const t = VARIANTS[t0] ? t0 : 'drone', v = variantOf(t, v0);
  const d = (Array.isArray(f.veh_d) ? f.veh_d : []).filter(x => (DETAIL.find(y => y.v === x) || {}).t === t);
  const c = /^#?[0-9a-f]{6}$/i.test(String(f.veh_color || '').trim()) ? '#' + String(f.veh_color).trim().replace('#', '') : hex(v.color);
  return { t, v, d, c, name: String(f.veh_name || '').trim() || v.name };
}
function previewUrl(f) { const p = pick(f); return `../preview.html?t=${p.t}&v=${p.v.id}&d=${p.d.join(',')}&c=${p.c.slice(1)}&n=${encodeURIComponent(p.name)}`; }
function spec(f) {
  const p = pick(f), full = kin(p.t, p.v.id, 1);
  return { name: p.name, type: p.t, typeName: TYPE_NAME[p.t], variant: p.v.id, variantName: p.v.name, color: p.c,
    details: p.d.map(x => DETAIL.find(y => y.v === x).l), fullThrottle: Object.fromEntries(full.read), handCheck: full.check,
    parts: PARTS[p.t].order.filter(id => PARTS[p.t].list[id] && (id !== 'foil' || p.v.id === 'foil')).map(id => ({ id, ...PARTS[p.t].list[id] })),
    assemblyOrder: PARTS[p.t].order.filter(id => id !== 'foil' || p.v.id === 'foil'), workingParts: PARTS[p.t].works };
}
const LOOK = {
  drone: '四軸無人機：機架、四顆無刷馬達、三葉螺旋槳（對角同向、相鄰反向）、飛控板、電調、電池、接收機；無人機足球規格要包在經緯線球籠裡（學員選「不加球籠」就不包）。攻擊手掛一條金色彩帶。',
  robot: '**人形**格鬥機器人（雙腳站立、兩隻手臂、有頭），不是輪型車。要有骨架（髖、膝、踝、肩、肘）可以擺姿勢：格擋、出拳、踢腿、倒地、起身。關節處放伺服馬達，背後有紅色緊急停止鈕。',
  boat: '**無人水面載具（USV）**：多面隱身船殼（硬舭、船首收尖上翹、平板船尾）、稜角上層結構、感測桅桿（雷達罩、光電攝影機、通訊天線、左紅右綠航行燈）。只放偵察與監測感測器，**不放武器**。'
};
const RULES = {
  drone: `- 每隊一台**攻擊手**（金色彩帶），只有攻擊手**完整穿過對方球門環**才得 1 分；防守手穿環不算分。
- 1 對 1：各 1 攻擊手；3 對 3：各 1 攻擊手＋2 防守手。每局 {{time}}、三局兩勝。
- 撞到環框會彈回；球籠允許碰撞。
- 電腦對手：攻擊手先飛到環前對準再穿越；防守手站在「對方攻擊手」與「自家球門」的連線上。
- 練習模式：6 個環依序穿越計時。`,
  robot: `- 一對一擂台。出拳、踢腿打中且對方沒有格擋＝**有效打擊 1 點**。
- 被打會掉**平衡值**，歸零就**倒地**；10 秒內站不起來判 KO；**倒地 3 次**判輸。
- 每場 {{time}}，時間到比有效打擊點數，再比倒地次數。
- 電腦對手：保持在打擊距離、繞圈、看到對手出拳有機會格擋。
- 練習模式：沙包，60 秒內打出幾次有效打擊。`,
  boat: `- 5 艘船、**順時針**繞橢圓水道 {{laps}} 圈；內側橘色浮標，切進浮標內側每顆**罰 2 秒**。
- 外側是岸邊，撞岸大幅減速；從後方高速撞船會被警告。
- 電腦對手沿航道中心線行駛、會變換車道。
- 練習模式：單人 1 圈計時。`
};
function doc(f) {
  const s = spec(f);
  const parts = s.parts.map((p, i) => `| ${i + 1} | ${p.id} | ${p.name} | ${p.role} | ${p.how} |`).join('\n');
  const reads = Object.entries(s.fullThrottle).map(([a, b]) => `| ${a} | ${b} |`).join('\n');
  return `# 我的載具：${s.name}（${s.typeName}・${s.variantName}）

> 由「無人載具 AI 互動平台」產生，是**載具的唯一規格來源**；網頁上的 3D 模型、零件、讀數都照這裡做。
> 機構拆解頁的工作規則改寫自開源專案 teardown（elvarofficial/teardown，MIT 授權），已改為繁體中文與課堂慣例。

## 1. 外觀
- 類型：${s.typeName}；型態：${s.variantName}；主色：\`${s.color}\`
- 細節：${s.details.length ? s.details.join('、') : '預設'}
- ${LOOK[s.type]}
- 用 Three.js **程式碼建模**（不可下載別人的模型檔），每個零件是獨立的 Group，名稱用下表的 id。

## 2. 零件表
| # | id | 名稱 | 功能 | 原理 |
| --- | --- | --- | --- | --- |
${parts}

- 組裝順序（由內而外）：${s.assemblyOrder.join(' → ')}
- 運轉時用唯一強調色標示的「工作零件」：${s.workingParts.join('、')}

## 3. 機構數學（單一輸入、單一數字來源）
建立 \`site/js/kin.js\`，**不准 import three.js**。只有一個輸入 t（0～1），算出下表讀數；畫面上所有儀表、標籤、動畫速度都讀它。

| 讀數（t＝100%） | 數值 |
| --- | --- |
${reads}

**手算抽查**（交付時寫進回報）：${s.handCheck}
`;
}
const ENGINE = { codex: 'Codex', claude: 'Claude Code', agy: 'Antigravity' };
const common = (f, title, root) => `## 你是誰、要做什麼
你是幫老師蓋網頁的 AI。這個資料夾「${root}」是老師在「無人載具 AI 互動平台」上一步一步選好、填好的規格。請照下面步驟，**在這個資料夾裡**做出「${title}」，老師不會寫程式，所以請你全部做完、自己測試，再用白話回報。

## 不可以違反
1. 規格以 vehicle.json 與 references/ 為準，不自行換載具、不增刪零件。
2. 純靜態網頁（HTML／CSS／JavaScript），放在 \`site/\`；Three.js 固定版本（例如 \`https://cdn.jsdelivr.net/npm/three@0.160.0/\` 的 ES module，或下載到 site/vendor）。
3. 不要任何 API 金鑰、不要登入、不要 PWA。
4. 不抓網路上來源不明的圖片或模型，全部用程式繪製。
5. 不可複製別人的網站、遊戲或商標；文字用繁體中文（臺灣用語）。
6. 手機 375px 也要能操作，不能左右捲動。
`;
function install1(f) {
  const s = spec(f), title = `${s.name}・機構拆解頁`;
  return `# INSTALL：${title}

${common(f, title, '我的載具拆解頁安裝包')}
## 步驟
1. 讀完 \`vehicle.json\`、\`references/vehicle.md\`、\`references/teardown-rules.md\`、\`references/my-notes.md\`。
2. 建 \`site/index.html\`＋\`site/js/kin.js\`＋\`site/js/model.js\`＋\`site/js/page.js\`＋\`site/style.css\`。
3. 畫面：中央是我的載具（照 vehicle.md 第 1 節造型），右側面板是 kin.js 的即時讀數，下方一個「油門／出力」滑桿。
4. 按鈕：爆炸分解、合體、X 光透視、只看工作零件、點出這個零件（6 題）、組裝挑戰（照組裝順序點零件，錯了說先裝哪個與原因）。
5. 點零件顯示名稱、功能、原理、注意（用零件表文字；老師的筆記在 my-notes.md，可以拿來補充說明）。
6. 沒人操作 25 秒自動導覽，任何點擊、拖曳、滾輪、按鍵立刻交還控制權。
7. 測試：用瀏覽器實際打開（能用 Playwright 就截 4 張圖：全貌、爆炸分解、X 光、組裝挑戰），檢查 Console 沒有錯誤、手算抽查吻合。
8. 回報（繁體中文、白話）：做好的檔案在哪、怎麼打開（雙擊 site/index.html 或執行 \`python -m http.server\`）、截圖、手算抽查結果。

完成後老師會看到：**「${title}」網頁**，可以轉動、拆解、透視、測驗、組裝。
`;
}
function install2(f) {
  const s = spec(f), title = `${s.name}・競技場`;
  const rules = RULES[s.type].replace('{{time}}', f.arena_time || (s.type === 'robot' ? '2 分鐘' : '90 秒')).replace('{{laps}}', f.arena_laps || '3');
  return `# INSTALL：${title}

${common(f, title, '我的競技場安裝包')}
## 比賽規則（課堂版；畫面上要註明「正式賽依主辦單位規則」）
${rules}

## 老師選的設定
- 模式：${[].concat(f.arena_modes || []).join('、') || '對戰＋練習'}
- 電腦對手難度：${f.arena_level || '普通'}
- 操作：鍵盤（WASD＋方向鍵＋Space／Shift）與手機觸控雙搖桿都要能玩
- 鏡頭：${[].concat(f.arena_cams || ['轉播鏡頭', '跟隨鏡頭']).join('、')}
- 額外要求：${f.arena_extra || '（無）'}

## 步驟
1. 讀完 \`vehicle.json\`、\`references/vehicle.md\`、這份 INSTALL.md。
2. 在 \`site/arena.html\` 做出 3D 競技場：場地、計分板、倒數、開始／暫停／重設、比賽結束畫面；我的載具照 vehicle.md 造型。
3. 電腦對手要會動、會得分、會輸；不要做成站著不動。
4. 成績存在 localStorage，顯示個人最佳紀錄。
5. 如果資料夾裡已經有第一篇做的 \`site/index.html\`，在首頁加一顆「進入競技場」按鈕，不要覆蓋原本的拆解頁。
6. 測試：實際打完一場（能用 Playwright 就截圖：開場、比賽中、結束畫面），Console 沒有錯誤。
7. 用白話回報怎麼打開、怎麼操作、截圖在哪。
`;
}
function install4(f) {
  const title = (f.ev_name || '我的載具島') + '・賽事版';
  return `# INSTALL：${title}（更新包）

${common(f, title, '我的賽事版更新包')}
## 這是「更新」，不是重做
請在**我原本的載具島資料夾**裡更新（第三篇用載具島工坊做出來、已經蓋好的那個資料夾）。先讀 \`部署紀錄.md\`（如果有），保留原本所有島嶼與功能。

## 要加的功能
- 賽事頁：賽程表（${f.ev_format || '單淘汰'}），參賽名單：${f.ev_teams || '（由我現場輸入）'}
- 排行榜：${[].concat(f.ev_boards || ['個人最佳紀錄']).join('、')}（存在 localStorage；不要放假數字）
- 手機觸控：競技場在手機上用雙搖桿操作、按鈕至少 44px
- 頒獎頁：冠亞季軍、證書可列印
- 轉播模式：大字計分板、可切換鏡頭，方便老師在 Meet 分享畫面
- 額外要求：${f.ev_extra || '（無）'}

## 步驟
1. 讀完這份 INSTALL.md 與原本資料夾的 SKILL.md、project.json、references/。
2. 照上面清單加功能，不刪原本內容。
3. 測試（桌機與手機 375px），Console 沒有錯誤，截圖。
4. 問我要不要重新部署到**同一個網址**；我同意後再部署，部署後打開正式網址確認。
`;
}
const RULES_TEARDOWN = `# 機構拆解頁的七條規則
（改寫自開源專案 teardown，elvarofficial/teardown，MIT 授權）

1. 從參考開始：先想像真實載具的照片或剖視圖，比例照著做，不要做成通用方塊。
2. 真實數字、單一來源：所有儀表、圖表、標籤都讀 kin.js 的同一個函數；至少一項能用紙筆驗算。
3. 一個輸入驅動全部：轉速、動畫、讀數都由油門 t 推導，不手工做關鍵影格。
4. 正在工作的零件要打開：爆炸分解、X 光透視、只看工作零件。
5. 淺色攝影棚、單一強調色：強調色只代表「現在正在變的東西」。
6. 鏡頭為機構而選：預設 3/4 側面。
7. 穿模用數字修，不用鏡頭藏。

## 看圖驗收（交付前）
截 4 張圖逐張檢查：該接觸的有接觸、沒有互穿、面板數字與動作一致、文字不被裁切、標籤不擋零件。
`;
window.VK = { OPTS, DETAIL, pick, spec, doc, previewUrl, install1, install2, install4, RULES_TEARDOWN, ENGINE };
