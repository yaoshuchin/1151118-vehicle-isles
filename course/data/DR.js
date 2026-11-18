/* 無人機篇｜3D 建模實作（2026-11-18 晚上 7:00–10:00 課程）
 * 海報大綱：1. 無人機機構解說 2. 無人機操控競賽說明 3. 無人機平台 3D 建模
 */
(function () {
  const btn = (label, href, cls) => `<a class="btn ${cls || 'ghost'}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
  const links = (label, items) => ({ type: 'links', label, items: items.map(([l, h, c]) => ({ label: l, href: h, cls: c })) });
  const note = (id, label, ph, ai) => Object.assign({ type: 'area', id, label, ph, rows: 4 }, ai ? { ai: { prompt: `你是無人機課程助教，用繁體中文（臺灣用語）。把學員下面這段筆記整理成條列重點，保留原意與數字，不要編造；最後加一行「延伸思考：」提出一個好問題。\n\n{{_me}}`, demo: '（示範）{{_me}}\n延伸思考：串接 AI 後再按一次，就是 AI 整理的版本。' } } : {});

  window.DECK = window.VC.make({
    id: 'DR', kit: 'drone', title: '無人機篇｜3D 建模實作',
    cover: {
      kick: '阿亮老師主講｜2026 年 11 月 18 日（三）19:00–22:00',
      title: '無人機<br>3D 建模實作',
      sub: '一份講義完成三件事：看懂無人機機構、搞懂競賽規則、用生成器設計並建出您自己的 3D 無人機。每一頁都能填寫、拖曳 3D、請 AI 協助，最後打包交給您的 AI 做成網頁。',
      list: ['U01 無人機有哪些種類', 'U02 機構解說：骨架、動力、航電', 'U03 飛行原理與操控', 'U04 競賽說明：無人機足球與 FPV 競速', 'U05 平台 3D 建模（六步生成器＋打包）', 'U06 故障診斷與賽前檢查（FMEA、紀錄判讀、檢查表）'],
      html: `<div class="cards" style="margin-top:8px">
        <div class="cd"><b>課程入口</b><small>回到課程首頁看所有資源</small><div class="row" style="margin-top:6px">${btn('🏠 課程首頁', '../portal.html', 'am')}</div></div>
        <div class="cd"><b>示範網頁</b><small>拆解車庫、競技場、博物館</small><div class="row" style="margin-top:6px">${btn('拆解車庫', '../garage.html?type=drone&v=red')}${btn('無人機足球場', '../arena.html?game=soccer')}</div></div>
        <div class="cd"><b>示範成果</b><small>老師用生成器做好的 3D 無人機</small><div class="row" style="margin-top:6px">${btn('⛶ 打開示範 3D', '../demo.html?k=drone')}</div></div>
      </div>`,
      say: '各位好，今晚三個小時，我們從「看懂」到「做出來」：先拆解一台無人機，再看比賽怎麼比，最後每個人用生成器設計自己的無人機，交給 AI 建成 3D 網頁。'
    },
    u00: [{ kind: 'teach', title: '今晚的路線圖', why: '三個小時分成三段，對應海報上的三個主題；每段都有「看」與「做」。',
      html: `<table class="tbl"><thead><tr><th>時間</th><th>主題</th><th>您會做的事</th><th>帶走的成果</th></tr></thead><tbody>
        <tr><td>19:00–19:20</td><td>開工準備＋種類</td><td>串接 AI、認識六大類無人機</td><td>類型筆記</td></tr>
        <tr><td>19:20–20:10</td><td>① 機構解說</td><td>在拆解車庫逐一點開零件、讀懂規格代號</td><td>規格判讀筆記</td></tr>
        <tr><td>20:10–20:50</td><td>② 操控與競賽說明</td><td>玩混控模擬、穿環練習、讀無人機足球規則</td><td>我的賽事規則卡</td></tr>
        <tr><td>20:50–21:35</td><td>③ 平台 3D 建模</td><td>六步生成器設計自己的無人機、AI 評審</td><td>規格書＋3D 模型</td></tr>
        <tr><td>21:35–21:50</td><td>故障診斷與賽前檢查</td><td>故障卡＋AI 診斷、FMEA、飛行紀錄判讀、檢查表</td><td>維修保養計畫</td></tr>
        <tr><td>21:50–22:00</td><td>交給 AI 建置</td><td>一鍵建置（或打包＋貼指令）</td><td>我的無人機 3D 建模網頁</td></tr></tbody></table>
        <p class="hint">U06 時間不夠時可課後完成；建議 U05 完成後先跳到最後一頁按「一鍵交給我的 AI 建置」，AI 在背景做網頁時再上 U06。</p>`,
      say: '時間是參考，重點是每一段都要動手。' },
      { kind: 'do', step: '動手', title: '串接 AI（兩條路，擇一即可）', why: '課程裡每個 <b>✨</b> 按鈕都會交給 AI 幫你整理、評審、設計。你可以用<b>自己電腦的 AI</b>（Codex／Claude／Antigravity），或填<b>自己的 Gemini／Groq／OpenAI 金鑰</b>。都不接也能上課，✨ 會先給示範內容。',
        fields: [{ type: 'bridge' }], layout: 'wideR',
        say: '金鑰只存在你這台電腦的瀏覽器，不會上傳、也不經過課程伺服器——花的是你自己的免費額度。' }],
    notes: [['dr_n_type', '無人機種類筆記'], ['dr_n_spec', '規格判讀筆記'], ['dr_n_fly', '飛行原理筆記'], ['dr_rulecard', '我的賽事規則卡']],
    units: [
      { u: 'U01', title: '無人機有哪些種類', done: ['我能說出四種構型的差別', '我知道多旋翼為什麼是競賽主流', '寫好類型筆記'], slides: [
        { kind: 'teach', title: '依「構型」分四大類', why: '判斷一台無人機，第一個問題是：<b>它靠什麼產生升力？</b>',
          html: `<table class="tbl"><thead><tr><th>構型</th><th>升力來源</th><th>優點</th><th>限制</th><th>典型用途</th></tr></thead><tbody>
            <tr><td><b>多旋翼</b>（四軸、六軸、八軸）</td><td>多顆螺旋槳直接向下推</td><td>可垂直起降、定點懸停、機構最簡單</td><td>續航短（多為 5～30 分鐘）</td><td>空拍、競速、無人機足球、巡檢</td></tr>
            <tr><td><b>固定翼</b></td><td>機翼前進時產生升力</td><td>效率高、續航長、飛得遠</td><td>需要跑道或手拋，不能懸停</td><td>測繪、長距離巡查</td></tr>
            <tr><td><b>垂直起降複合翼</b>（VTOL）</td><td>起降用旋翼、巡航用機翼</td><td>兼具垂直起降與長航程</td><td>結構複雜、較重、較貴</td><td>物流、大範圍測繪</td></tr>
            <tr><td><b>單旋翼直升機</b></td><td>一副大主旋翼＋尾旋翼</td><td>大槳效率好、載重高</td><td>機構複雜（傾斜盤）、維修難</td><td>農業噴灑、重載</td></tr></tbody></table>`,
          txt: '本課程的競賽與建模都用<b>多旋翼</b>：機構最單純，所有姿態變化都只靠「四顆馬達的轉速差」完成，非常適合拿來學機構。',
          say: '大家先記一句話：多旋翼沒有任何會動的舵面，所有動作都是改變馬達轉速。' },
        { kind: 'teach', title: '多旋翼：為什麼大多是四軸？', why: '軸數越多越穩、越能容錯，但也越重、越耗電。',
          html: `<div class="cards">
            <div class="cd"><b>三軸（Y3）</b><small>尾馬達要靠舵機偏轉來抵銷扭力，機構反而複雜，少見。</small></div>
            <div class="cd"><b>四軸（X4）★</b><small>兩順兩逆剛好抵銷扭力；零件最少、反應最快。競速、足球、空拍主流。</small></div>
            <div class="cd"><b>六軸（X6）</b><small>壞一顆馬達還能降落；載重更大，專業空拍與巡檢常用。</small></div>
            <div class="cd"><b>八軸／共軸 X8</b><small>上下兩層槳共用機臂，載重最大，用於重型攝影與噴灑。</small></div></div>
            <table class="tbl"><thead><tr><th>比較</th><th>四軸</th><th>六軸</th><th>八軸</th></tr></thead><tbody>
            <tr><td>容錯（壞一顆）</td><td>會失控</td><td>可降落</td><td>可續飛</td></tr><tr><td>重量／成本</td><td>最低</td><td>中</td><td>最高</td></tr><tr><td>反應速度</td><td>最快</td><td>中</td><td>較慢</td></tr></tbody></table>`,
          say: '四軸的關鍵在於「對角同向、相鄰反向」，等一下在 U03 用模擬器看它怎麼轉彎。' },
        { kind: 'teach', title: '依「尺寸與用途」再細分', why: '多旋翼常用<b>螺旋槳吋數</b>或<b>軸距</b>來稱呼尺寸。同樣是四軸，重量可以差到 30 倍。',
          html: `<table class="tbl"><thead><tr><th>類別</th><th>常見尺寸</th><th>重量級距</th><th>特徵</th></tr></thead><tbody>
            <tr><td>Tiny Whoop 室內機</td><td>65～75 mm 軸距、31～40 mm 槳</td><td>約 20～40 g</td><td>涵道護槳、1S 電池，教室可飛</td></tr>
            <tr><td>Cinewhoop 空拍機</td><td>2.5～3.5 吋涵道</td><td>約 200～400 g</td><td>涵道保護、數位圖傳、平穩運鏡</td></tr>
            <tr><td>5 吋 FPV 競速／花式</td><td>約 210～230 mm 軸距</td><td>約 450～700 g（含電池）</td><td>碳纖維機架、6S 高功率、反應極快</td></tr>
            <tr><td>7 吋長航程</td><td>約 300～330 mm 軸距</td><td>約 800～1200 g</td><td>2 葉槳、GPS 返航、續航長</td></tr>
            <tr><td>無人機足球 Class 20</td><td>20 cm 球籠</td><td>≤ 110 g（規則上限）</td><td>球籠包覆、可碰撞</td></tr>
            <tr><td>無人機足球 Class 40</td><td>40 cm 球籠</td><td>≤ 1100 g（規則上限）</td><td>球籠包覆、正式國際賽主力</td></tr>
            <tr><td>消費級空拍機</td><td>折疊式、含雲台相機</td><td>249 g 至 1 kg 以上</td><td>GPS 定點、避障、自動返航</td></tr></tbody></table>
            <p class="src">足球機重量上限依 FIDA 規則書（fidasystem.com/rules.html）；其餘為一般市售常見範圍。</p>`,
          say: '請記住 250 公克這條線：在臺灣，250 公克以上就要註冊。U04 會再講法規。' },
        { kind: 'do', step: '動手', title: '到無人機博物館找「關鍵零件的進步」', why: '博物館的每件展品都對應一個零件的進步：感測器變小、電池變輕、馬達變強，才讓今天的多旋翼成真。',
          steps: ['按「▶ 打開無人機博物館」。', '至少看 4 件展品，留意每件的「學習重點」。', '回來寫筆記：您最感興趣的類型與原因。'],
          fields: [links('實際操作頁', [['▶ 打開無人機博物館', '../museum.html?type=drone', 'am'], ['群島首頁', '../hub.html']]),
            note('dr_n_type', '我的類型筆記：我最感興趣的是哪一類？為什麼？它適合什麼任務？', '例：5 吋 FPV，因為反應快，適合穿越競速；缺點是續航短', true)], layout: 'wideR' }
      ] },
      { u: 'U02', title: '機構解說：骨架、動力、航電', done: ['在拆解車庫點過全部零件', '看得懂 2207、1950KV、5.1×4.3×3、6S 的意思', '寫好規格判讀筆記'], slides: [
        { kind: 'teach', title: '一台四軸無人機的九大零件', why: '把無人機想成人體：<b>機架</b>是骨頭、<b>馬達與槳</b>是肌肉、<b>飛控</b>是大腦、<b>接收機與圖傳</b>是耳朵與眼睛、<b>電池</b>是心臟。',
          html: `<div class="cards">
            <div class="cd"><b>① 機架 Frame</b><small>底板、機臂、上板、銅柱；決定軸距與耐撞度</small></div>
            <div class="cd"><b>② 無刷馬達 ×4</b><small>外轉子設計，規格寫作「定子直徑＋高度」＋KV</small></div>
            <div class="cd"><b>③ 螺旋槳 ×4</b><small>兩正兩反；寫作「直徑×螺距×葉數」</small></div>
            <div class="cd"><b>④ 電子調速器 ESC</b><small>把飛控指令轉成三相電流驅動馬達</small></div>
            <div class="cd"><b>⑤ 飛控 FC</b><small>內含 IMU（陀螺儀＋加速度計），每秒數千次修正姿態</small></div>
            <div class="cd"><b>⑥ 接收機 RX</b><small>接收遙控器訊號，例如 ExpressLRS</small></div>
            <div class="cd"><b>⑦ 圖傳 VTX＋鏡頭</b><small>把第一人稱畫面送到眼鏡（FPV）</small></div>
            <div class="cd"><b>⑧ 鋰聚合物電池 LiPo</b><small>寫作「串數 S＋容量 mAh＋放電倍率 C」</small></div>
            <div class="cd"><b>⑨ 保護結構</b><small>球籠、涵道或護圈：讓碰撞變安全</small></div></div>`,
          say: '這九個零件就是等一下生成器的五個步驟：機架、動力、航電、保護外觀。' },
        { kind: 'teach', title: '骨架：機架佈局與軸距', why: '<b>軸距</b>＝對角兩顆馬達中心的距離，決定能裝多大的槳。相鄰兩顆槳之間要留間隙，否則會互相打到。',
          html: `<table class="tbl"><thead><tr><th>佈局</th><th>形狀</th><th>手感與用途</th></tr></thead><tbody>
            <tr><td>正 X（True X）</td><td>四臂互成 90°</td><td>俯仰、橫滾反應一致，花式飛行常用</td></tr>
            <tr><td>寬 X（Wide X）</td><td>左右較寬</td><td>前方鏡頭不會拍到槳，空拍常用</td></tr>
            <tr><td>長 X（Stretch X）</td><td>前後較長</td><td>高速俯仰較穩，競速常用</td></tr>
            <tr><td>H 型</td><td>兩根縱樑</td><td>中間空間大，好收電池與電子</td></tr>
            <tr><td>球籠一體</td><td>機架包在經緯球籠內</td><td>無人機足球專用，可碰撞</td></tr></tbody></table>
            <p class="txt"><b>手算：</b>正 X 型相鄰馬達距離＝軸距 × sin45° × 2 ≈ 軸距 × 0.707。軸距 225 mm → 約 159 mm；5.1 吋槳直徑約 130 mm，間隙約 29 mm，安全。</p>`,
          say: '板厚與材質是取捨：碳纖維 5 mm 很耐撞但較重；比賽前一晚斷機臂是常有的事。' },
        { kind: 'teach', title: '動力：讀懂馬達、槳、電池的規格代號', why: '店家與論壇都用代號溝通。看懂這四組代號，就能判斷一台機的性格。',
          html: `<table class="tbl"><thead><tr><th>代號</th><th>意思</th><th>怎麼影響飛行</th></tr></thead><tbody>
            <tr><td><b>2207</b>（馬達）</td><td>定子直徑 22 mm、高度 7 mm</td><td>定子越大扭力越大，帶得動越大的槳</td></tr>
            <tr><td><b>1950 KV</b></td><td>每 1 伏特空轉約 1950 rpm</td><td>6S（22.2 V）空轉約 4.3 萬 rpm；大槳配低 KV、小槳配高 KV</td></tr>
            <tr><td><b>5.1×4.3×3</b>（槳）</td><td>直徑 5.1 吋、螺距 4.3 吋、3 葉</td><td>螺距大＝每轉推得遠、速度快但耗電；葉數多＝抓力強</td></tr>
            <tr><td><b>6S 1100 mAh 120C</b>（電池）</td><td>6 芯串聯 22.2 V、容量 1.1 Ah、最大放電 120 倍容量</td><td>電壓高＝轉速高；容量大＝飛得久但重；C 值不夠會掉壓</td></tr></tbody></table>
            <p class="txt"><b>重要關係：</b>推力約與「槳徑²×轉速²」成正比；電池能量（Wh）＝容量（Ah）× 3.7 V × 串數。</p>`,
          say: '請把這張表拍下來。等一下生成器步驟 3 就是在選這些代號。' },
        { kind: 'teach', title: '航電：飛控怎麼讓無人機不翻覆', why: '人手無法每秒修正幾千次，所以由<b>飛控</b>負責：IMU 量測機身角速度，與搖桿要求的角速度比較，用 <b>PID</b> 算出每顆馬達該加多少、減多少。',
          html: `<ol class="steps"><li><b>量測</b>：陀螺儀測到機身往右傾 5°。</li><li><b>比較</b>：搖桿說要「水平」，誤差 5°。</li><li><b>計算 PID</b>：P＝依誤差大小立即修正；I＝修正長時間累積的偏差（例如重心不正）；D＝抑制修正過頭造成的抖動。</li><li><b>輸出</b>：右側兩顆加速、左側兩顆減速，回到水平。</li></ol>
            <table class="tbl"><thead><tr><th>航電零件</th><th>選擇重點</th></tr></thead><tbody>
            <tr><td>飛控 F4／F7／H7</td><td>處理器等級；F7、H7 運算快，濾波與 GPS 功能更完整</td></tr>
            <tr><td>電調 AIO／四合一／獨立</td><td>小機用一體板省重量；四合一為主流；獨立電調好換修</td></tr>
            <tr><td>接收機 ELRS 2.4 GHz／915 MHz</td><td>2.4 GHz 延遲低；915 MHz 穿透與距離較好</td></tr>
            <tr><td>圖傳 類比／數位</td><td>類比延遲最低、便宜；數位畫質清楚、較重</td></tr></tbody></table>`,
          say: 'PID 不用背公式，記住 P 管快、I 管準、D 管穩就好。' },
        { kind: 'teach', title: '組裝順序與配線原則', why: '實機組裝的順序，就是 3D 拆解圖反過來播放。',
          html: `<ol class="steps"><li>鎖底板與機臂，裝上馬達（注意螺絲長度，太長會碰到線圈）。</li><li>馬達三條線焊到電調；電調電源線焊上 XT60 接頭與電容。</li><li>疊上飛控，連接接收機與圖傳。</li><li>裝上板、鏡頭、天線；接收機天線要遠離碳纖維與電源線。</li><li><b>先不裝槳</b>，在電腦上設定方向與遙控器，確認每顆馬達轉向正確。</li><li>最後才裝槳：順時針與逆時針槳要對應正確的馬達。</li></ol>
            <p class="warn">⚠ 測試時一律先拆槳；LiPo 電池充電要用防火袋、有人看顧，鼓包立刻停用。</p>`,
          say: '最多人受傷的時刻不是飛行，而是桌上測試忘了拆槳。' },
        { kind: 'do', step: '動手', title: '拆解車庫：逐一點開零件、看讀數', why: '拆解車庫的每個讀數都來自同一組公式，輸入只有油門。請親手驗證「推力 ∝ 油門²」。',
          steps: ['按「▶ 打開拆解車庫」，選無人機。', '點每個零件看說明；按「拆解」看爆炸圖。', '把油門拉到懸停（約 50%），記下推重比與懸停油門。', '回來寫規格判讀筆記。'],
          fields: [links('實際操作頁', [['▶ 打開拆解車庫（無人機）', '../garage.html?type=drone&v=red', 'am'], ['藍鯨號', '../garage.html?type=drone&v=blue'], ['綠螳號', '../garage.html?type=drone&v=green']]),
            note('dr_n_spec', '我的規格判讀筆記：寫下一組規格（馬達／槳／電池）並解釋它的意思', '例：2207 1950KV＋5.1×4.3×3＋6S 1100mAh：定子 22×7 mm…', true)], layout: 'wideR' }
      ] },
      { u: 'U03', title: '飛行原理與操控', done: ['玩過推力曲線與混控模擬', '知道遙控器 Mode 2 各桿功能', '完成穿環練習一次'], slides: [
        { kind: 'do', step: '互動', title: '推力與轉速的平方關係', why: '油門推一半，推力只剩約四分之一。這解釋了為什麼懸停時油門不在 50%，以及為什麼油門末段特別「暴衝」。',
          steps: ['拖動滑桿，觀察推力條。', '找出「推力剛好等於重量」的位置（懸停點）。'], fields: [{ type: 'thrustcurve' }], layout: 'wideR' },
        { kind: 'do', step: '互動', title: '四顆馬達的混控：所有動作都靠轉速差', why: '多旋翼沒有舵面。前進、轉彎、旋轉，全部來自「哪幾顆加速、哪幾顆減速」。',
          steps: ['依序按八個搖桿動作。', '特別注意「機頭右轉」：加速的是對角那一對，靠的是反扭力。', '想一想：為什麼偏航時高度不會改變？'],
          fields: [{ type: 'mixer' }], layout: 'wideR', say: '偏航是最反直覺的：要往右轉，反而讓逆時針轉的那對槳加速。' },
        { kind: 'teach', title: '遙控器 Mode 2 與三種飛行模式', why: '臺灣與多數國家使用 <b>Mode 2</b>：左手管高度與方向，右手管移動。',
          html: `<table class="tbl"><thead><tr><th>搖桿</th><th>上下</th><th>左右</th></tr></thead><tbody>
            <tr><td>左桿</td><td>油門 Throttle（升降）</td><td>偏航 Yaw（機頭轉向）</td></tr><tr><td>右桿</td><td>俯仰 Pitch（前後）</td><td>橫滾 Roll（左右平移）</td></tr></tbody></table>
            <table class="tbl"><thead><tr><th>飛行模式</th><th>放開搖桿時</th><th>適合誰</th></tr></thead><tbody>
            <tr><td>自穩 Angle</td><td>自動回到水平，傾斜角有上限</td><td>新手、無人機足球</td></tr>
            <tr><td>半自穩 Horizon</td><td>小動作自穩、推到底可翻滾</td><td>過渡練習</td></tr>
            <tr><td>手動 Acro（Rate）</td><td>維持當下角度，不會自己回正</td><td>FPV 競速與花式</td></tr></tbody></table>`,
          say: '足球賽大多用自穩模式，因為要專心在戰術；競速選手幾乎都用手動模式。' },
        { kind: 'do', step: '動手', title: '穿環練習：體驗操控與手感', why: '在模擬競技場的「穿環練習」依序穿過 6 個環，計時。先求穩再求快。',
          steps: ['按「▶ 打開穿環練習」。', '依畫面提示操作，完成一輪計時。', '再試「1 對 1」對電腦，體會攻擊手如何對準球門環。', '回來寫下您的時間與心得。'],
          fields: [links('實際操作頁', [['▶ 打開穿環練習', '../arena.html?game=soccer&mode=practice', 'am'], ['1 對 1 對電腦', '../arena.html?game=soccer&mode=1v1'], ['3 對 3', '../arena.html?game=soccer&mode=3v3']]),
            note('dr_n_fly', '我的飛行原理筆記：練習時間、最難的動作、和混控模擬的關聯', '例：穿環 48 秒；最難的是邊前進邊偏航，因為…', true)], layout: 'wideR' }
      ] },
      { u: 'U04', title: '競賽說明：無人機足球與 FPV 競速', done: ['說得出 Class 20 與 Class 40 的差別', '知道得分、反向入環與攻擊手規定', '寫好我的賽事規則卡'], slides: [
        { kind: 'teach', title: '無人機足球是什麼', why: '<b>無人機足球（Drone Soccer）</b>：每台無人機包在球籠裡，像一顆會飛的球。兩隊在網室中對戰，只有<b>攻擊手</b>穿過對方的<b>球門環</b>才算得分。',
          html: `<div class="cards"><div class="cd"><b>起源</b><small>2016 年前後起源於韓國，之後推廣到歐美與亞洲，國際航空運動聯盟（FAI）也已訂有規則。</small></div>
            <div class="cd"><b>為什麼適合教學</b><small>球籠讓碰撞安全；需要團隊分工；比賽時間短、節奏快。</small></div>
            <div class="cd"><b>需要的能力</b><small>穩定懸停、精準穿環、隊友溝通、電池與維修管理。</small></div></div>
            <p class="src">來源：FAI Drone Sports Sporting Rules（fai.org/page/sporting-rules-0）；FIDA Rule Book（fidasystem.com/rules.html）。</p>`,
          say: '它像足球，但更像「空中曲棍球」：防守手的工作是卡位，不是搶球。' },
        { kind: 'teach', title: 'Class 20 與 Class 40 規格比較', why: '兩個級別的規則架構相同，差在<b>球籠尺寸、機重上限、球門環與場地</b>。',
          html: `<table class="tbl"><thead><tr><th>項目</th><th>Class 20</th><th>Class 40</th></tr></thead><tbody>
            <tr><td>球籠直徑</td><td>20 cm ± 1 cm</td><td>40 cm ± 2 cm</td></tr>
            <tr><td>機重上限</td><td>110 g</td><td>1,100 g</td></tr>
            <tr><td>每隊上場</td><td colspan="2">5 人 5 機（最少 3 人可開賽）</td></tr>
            <tr><td>球門環內徑</td><td>30 cm ± 1 cm</td><td>60 cm ± 1 cm</td></tr>
            <tr><td>球門環中心高度</td><td>1.8～2.2 m</td><td>3～3.5 m</td></tr>
            <tr><td>場地</td><td>約 4 m 寬 × 8 m 長 × 3 m 高</td><td>短邊 5～10 m、長邊 10～20 m、高 4～5 m（建議 16×7×4.5 m）</td></tr>
            <tr><td>每局時間</td><td colspan="2">3 分鐘；先贏 2 局者獲勝（最多 3 局）</td></tr>
            <tr><td>攻擊手標示</td><td>貼標示牌</td><td>綠色 LED 與標示</td></tr></tbody></table>
            <p class="src">資料來源：FIDA Dronesoccer Rule Book（fidasystem.com/rules.html）。各賽事細節以主辦單位最新公告為準。</p>`,
          say: '請注意機重上限，生成器步驟 1 選足球任務時，系統會幫您檢查有沒有超重。' },
        { kind: 'teach', title: '得分、反向入環與常見判罰', why: '規則的核心只有一條：<b>攻擊手的球從正面完整穿過對方球門環＝1 分</b>。其餘規則都在防止危險與鑽漏洞。',
          html: `<table class="tbl"><thead><tr><th>情況</th><th>判定</th></tr></thead><tbody>
            <tr><td>攻擊手從正面完整穿過對方球門環</td><td>得 1 分</td></tr>
            <tr><td>防守手穿過對方球門環</td><td>不算分</td></tr>
            <tr><td>己方從正面穿過自己的球門環</td><td>允許（不論有意無意）</td></tr>
            <tr><td>從背面反向進入自己的球門環</td><td>任何情況都不允許：超過一半球體從正面進入又退出，或防守手從背面進入，皆視為反向入環</td></tr>
            <tr><td>無視越位規定連續得分、反向入環、累積兩次以上警告</td><td>可判罰球</td></tr>
            <tr><td>違反運動精神、擅改器材或場地、用手推動無人機</td><td>警告、判輸該局或判輸整場</td></tr></tbody></table>
            <p class="src">資料來源：FIDA Rule Book。實際判罰細節依各賽事規則書。</p>`,
          say: '反向入環是最常見的爭議：防守手很想躲進球門環擋人，但從背面進去就是犯規。' },
        { kind: 'teach', title: '位置與戰術：攻擊手、防守手', why: '五個人分工：1 名攻擊手負責得分，其餘負責阻擋與掩護。',
          html: `<div class="cards"><div class="cd"><b>攻擊手 Striker</b><small>唯一能得分；要在球門環前「停、對準、穿越」，追求穩定而不是最快。</small></div>
            <div class="cd"><b>防守手 Defender</b><small>站在「對方攻擊手」與「自家球門」的連線上卡位；不能反向入環。</small></div>
            <div class="cd"><b>掩護手</b><small>替攻擊手擋開對方防守，製造穿環空檔。</small></div>
            <div class="cd"><b>場邊管理</b><small>電池輪替、撞擊後檢查球籠與槳、與裁判溝通。</small></div></div>
            <p class="txt">機構與戰術是連在一起的：攻擊手要<b>懸停穩</b>（懸停油門適中、推重比夠），防守手要<b>耐撞</b>（球籠與機架強度），這就是 U05 建模時的取捨。</p>`,
          say: '請把您在生成器裡的「位置」選擇，跟這頁的需求對照。' },
        { kind: 'teach', title: 'FPV 競速賽怎麼比', why: '另一種主流賽事是 <b>FPV 競速</b>：選手戴眼鏡，以第一人稱畫面高速穿越賽道。',
          html: `<table class="tbl"><thead><tr><th>項目</th><th>一般做法</th></tr></thead><tbody>
            <tr><td>賽道</td><td>由「門」（Gate，穿過）與「旗」（Flag，繞過）組成，常有立體高低差</td></tr>
            <tr><td>分組</td><td>數名選手同組（Heat）同時起飛，各用不同圖傳頻道避免干擾</td></tr>
            <tr><td>計分</td><td>完成指定圈數的時間或名次；漏門通常要回補或被判罰</td></tr>
            <tr><td>常見機型</td><td>5 吋競速機、6S 電池、類比或數位圖傳</td></tr>
            <tr><td>安全</td><td>選手區與賽道之間要有防護網；起飛前統一檢查頻道與失控保護（Failsafe）</td></tr></tbody></table>
            <p class="src">各聯盟（例如 MultiGP 等）細節不同，參賽時以主辦單位最新規則為準。</p>`,
          say: '競速和足球對機體的要求完全相反：一個要輕快，一個要耐撞。' },
        { kind: 'teach', title: '安全與臺灣法規重點', why: '模擬可以隨便撞，實機不行。在臺灣戶外飛行要遵守《民用航空法》遙控無人機相關規定。',
          html: `<table class="tbl"><thead><tr><th>項目</th><th>重點</th></tr></thead><tbody>
            <tr><td>註冊</td><td>最大起飛重量 <b>250 g 以上</b>須註冊並在機身標示註冊號碼</td></tr>
            <tr><td>操作證</td><td>依重量與操作情形須取得普通或專業操作證</td></tr>
            <tr><td>飛航限制</td><td>禁航區、限航區、機場周邊與人群聚集處不得任意飛行；一般飛行高度上限 400 呎（約 120 m）；應在目視範圍內操作</td></tr>
            <tr><td>室內場館</td><td>網室、場館內的教學與比賽仍須遵守場館安全規範與主辦單位規定</td></tr>
            <tr><td>電池</td><td>LiPo 充電要用防火袋、有人看顧；鼓包、破損立即停用</td></tr></tbody></table>
            <p class="src">法規以交通部民用航空局「遙控無人機管理資訊系統」（drone.caa.gov.tw）最新公告為準。</p>`,
          say: '生成器算出 250 公克以上時，會自動提醒註冊。' },
        { kind: 'do', step: '動手', title: '對戰體驗＋寫下我的賽事規則卡', why: '先到競技場打一場 3 對 3，再把您理解的規則寫成一張規則卡（可以替班上辦一場小比賽）。',
          steps: ['按「▶ 3 對 3 對戰」打一局。', '填寫規則卡：級別、局數、得分、犯規、安全。', '按「✨ 交給 AI 優化」整理成正式格式。'],
          fields: [links('實際操作頁', [['▶ 3 對 3 對戰', '../arena.html?game=soccer&mode=3v3', 'am'], ['排行榜', '../board.html']]),
            { type: 'area', id: 'dr_rulecard', label: '我的賽事規則卡（級別、場地、局數、得分、犯規、安全）', rows: 7, ph: '例：Class 20 校內賽；每隊 3 人；每局 3 分鐘三戰兩勝；攻擊手掛綠牌；反向入環判罰球；電池充電區有人看顧…',
              ai: { prompt: '你是無人機足球裁判長，用繁體中文（臺灣用語）。把學員寫的賽事規則卡整理成正式規則條文（第 1 條、第 2 條…），保留學員的設定，不要加入學員沒提到的數字；若有缺漏（例如安全、判罰）在最後用「建議補充：」列出。\n\n{{_me}}', demo: '（示範）{{_me}}\n建議補充：串接 AI 後再按一次，就是 AI 整理的正式條文。' } }], layout: 'wideR' }
      ] },
      { u: 'U05', title: '平台 3D 建模：六步生成器', gen: true, done: ['完成六個建模步驟', '規格檢查警告處理完畢', '產生安裝包並交給 AI'], slides: [
        { kind: 'teach', title: '建模流程：從任務到 3D 模型', why: '「平台 3D 建模」不是隨便畫一台好看的無人機，而是<b>先有規格、再有模型</b>：每個尺寸都有理由，每個零件都對得上規格書。',
          html: `<ol class="steps"><li><b>任務</b>：決定比賽類型與位置 → 套用建議規格。</li><li><b>機架</b>：佈局、軸距、板厚、材質。</li><li><b>動力</b>：馬達、KV、槳、電池。</li><li><b>航電</b>：飛控、電調、接收機、圖傳、GPS、LED。</li><li><b>保護與外觀</b>：球籠／涵道、上蓋、配色。</li><li><b>總檢查</b>：估算總重、推重比、續航，處理警告，請 AI 評審。</li></ol>
            <p class="txt">左邊的 3D 會即時跟著您的選擇變化；右邊估算每改一格就重算。最後一頁可以「🔧 拆解」看爆炸圖，或「⬇ 下載 GLB」把模型帶去 Blender、Unity。</p>`,
          say: '請先選任務、按套用，再一步一步改成您想要的樣子。看到紅色警告，就是工程師在跟您說話。' }
      ] }
    ],
    pack: { root: '我的無人機3D建模安裝包', out: '我的無人機3D建模網頁', rulesMd: `# 無人機足球規則摘要（依 FIDA Rule Book，fidasystem.com/rules.html）

| 項目 | Class 20 | Class 40 |
|---|---|---|
| 球籠直徑 | 20 cm ± 1 cm | 40 cm ± 2 cm |
| 機重上限 | 110 g | 1,100 g |
| 每隊上場 | 5 人（最少 3 人可開賽） | 同左 |
| 球門環內徑 | 30 cm | 60 cm |
| 球門環中心高度 | 1.8–2.2 m | 3–3.5 m |
| 每局 | 3 分鐘，先贏 2 局勝 | 同左 |

- 只有攻擊手的球從正面完整穿過對方球門環才得 1 分。
- 不可從背面反向進入自己的球門環。
- 違反運動精神、擅改器材、用手推動無人機：警告、判輸該局或整場。

# FPV 競速（一般做法）
- 賽道由門與旗組成；數名選手同組起飛；以完成圈數時間或名次計分；細節依主辦單位。

# 臺灣法規提醒
- 250 g 以上須註冊；依情形須操作證；遵守禁限航區與 400 呎高度限制；以民航局 drone.caa.gov.tw 最新公告為準。
` }
  });
})();
