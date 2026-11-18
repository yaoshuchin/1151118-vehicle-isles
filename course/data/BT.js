/* 水上無人船篇｜3D 建模實作
 * 大綱：1. 無人船種類 2. 機構解說（船體、推進、轉向、感測、浮力與穩性）3. 航行原理與操控 4. 競賽規則（RoboBoat、遙控模型船競速）5. 平台 3D 建模
 * 本課程的無人船一律為 USV 造型，只配置偵察與監測感測器，不配置任何武器。
 * 規則數字皆有來源連結；查無可靠來源者寫「依主辦單位最新規則」。
 */
(function () {
  const btn = (label, href, cls) => `<a class="btn ${cls || 'ghost'}" href="${href}" target="_blank" rel="noopener">${label}</a>`;
  const links = (label, items) => ({ type: 'links', label, items: items.map(([l, h, c]) => ({ label: l, href: h, cls: c })) });
  const src = (items, tail) => `<p class="src">資料來源：${items.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join('；')}${tail ? '。' + tail : ''}</p>`;
  const note = (id, label, ph, ai) => Object.assign({ type: 'area', id, label, ph, rows: 4 }, ai ? { ai: { prompt: `你是無人船課程助教，用繁體中文（臺灣用語）。把學員下面這段筆記整理成條列重點，保留原意與數字，不要編造；最後加一行「延伸思考：」提出一個好問題。\n\n{{_me}}`, demo: '（示範）{{_me}}\n延伸思考：串接 AI 後再按一次，就是 AI 整理的版本。' } } : {});
  const RB = {
    h26: ['RoboBoat 2026 Team Handbook（PDF）', 'https://robonation.org/app/uploads/sites/3/2025/10/RoboBoat-2026-Team-Handbook_111125.pdf'],
    score: ['RoboBoat 2026 Section 4 Scoring', 'https://robonation.gitbook.io/roboboat-resources/section-4-scoring-and-awards'],
    safety: ['RoboBoat 2026 Section 5.2 Safety', 'https://robonation.gitbook.io/roboboat-resources/section-5-rules-and-requirements/5.2-safety-requirements'],
    veh: ['RoboBoat 2026 Section 5.3 Vehicle Requirements', 'https://robonation.gitbook.io/roboboat-resources/section-5-rules-and-requirements/5.3-vehicle-requirements'],
    over: ['RoboBoat 2026 Section 1 Overview', 'https://robonation.gitbook.io/roboboat-resources/section-1-competition-overview'],
    neww: ["RoboBoat What's New for 2026", 'https://robonation.gitbook.io/roboboat-resources/introduction-and-table-of-contents/whats-new-for-2026'],
    y27: ['RoboBoat 2027 官方頁', 'https://roboboat.org/programs/2027/']
  };
  const NAMBA = ['NAMBA International Official Rule Book（PDF）', 'https://namba.com/content/library/rules/namba_rulebook.pdf'];

  window.DECK = window.VC.make({
    id: 'BT', kit: 'boat', title: '水上無人船篇｜3D 建模實作',
    cover: {
      kick: '阿亮老師主講｜水上無人船篇',
      title: '水上無人船<br>3D 建模實作',
      sub: '一份講義完成三件事：看懂無人水面載具（USV）的機構、搞懂真實賽事怎麼比、用生成器設計並建出您自己的 3D 無人船。每一頁都能填寫、拖曳 3D、請 AI 協助，最後打包交給您的 AI 做成網頁。',
      list: ['U01 無人船有哪些種類', 'U02 機構解說：船體、推進、轉向、感測、浮力與穩性', 'U03 航行原理與操控', 'U04 競賽規則：RoboBoat 自主船賽與遙控模型船競速', 'U05 平台 3D 建模（六步生成器＋打包）', 'U06 故障診斷與賽前檢查（FMEA、紀錄判讀、檢查表）'],
      html: `<div class="cards" style="margin-top:8px">
        <div class="cd"><b>課程入口</b><small>回到課程首頁看所有資源</small><div class="row" style="margin-top:6px">${btn('🏠 課程首頁', '../portal.html', 'am')}</div></div>
        <div class="cd"><b>示範網頁</b><small>拆解車庫、水道競速、博物館</small><div class="row" style="margin-top:6px">${btn('拆解車庫', '../garage.html?type=boat&v=vhull')}${btn('水道競速', '../arena.html?game=boat&mode=race')}</div></div>
        <div class="cd"><b>示範成果</b><small>老師用生成器做好的 3D 無人船</small><div class="row" style="margin-top:6px">${btn('⛶ 打開示範 3D', '../demo.html?k=boat')}</div></div>
      </div>`,
      say: '各位好，這一篇我們把場景從天空搬到水面：先拆解一艘無人船，再看真實的自主船比賽怎麼計分，最後每個人用生成器設計自己的無人船，交給 AI 建成 3D 網頁。'
    },
    u00: [{ kind: 'teach', title: '本篇的路線圖', why: '整篇分成三段，對應三個主題；每段都有「看」與「做」。時間為建議分配，可依現場調整。',
      html: `<table class="tbl"><thead><tr><th>建議時間</th><th>主題</th><th>您會做的事</th><th>帶走的成果</th></tr></thead><tbody>
        <tr><td>約 20 分鐘</td><td>開工準備＋種類</td><td>串接 AI、認識 USV 的分類與四種船型</td><td>類型筆記</td></tr>
        <tr><td>約 50 分鐘</td><td>① 機構解說</td><td>在拆解車庫逐一點開零件、用互動元件算吃水與穩性</td><td>規格判讀筆記</td></tr>
        <tr><td>約 40 分鐘</td><td>② 航行原理與競賽規則</td><td>玩滑脫率、福祿數、水翼互動；讀 RoboBoat 計分表；跑一場水道競速</td><td>我的賽事規則卡</td></tr>
        <tr><td>約 60 分鐘</td><td>③ 平台 3D 建模</td><td>六步生成器設計自己的無人船、AI 評審</td><td>規格書＋3D 模型</td></tr>
        <tr><td>約 10 分鐘</td><td>打包交給 AI</td><td>產生安裝包、貼指令給 AI</td><td>我的無人船 3D 建模網頁</td></tr></tbody></table>
        <p class="txt">本課程的無人船一律以<b>偵察與監測</b>為任務（定位、影像、測深、水質），<b>不配置任何武器</b>。</p>`,
      say: '時間是參考，重點是每一段都要動手。' },
      { kind: 'do', step: '動手', title: '串接 AI（兩條路，擇一即可）', why: '課程裡每個 <b>✨</b> 按鈕都會交給 AI 幫你整理、評審、設計。你可以用<b>自己電腦的 AI</b>（Codex／Claude／Antigravity），或填<b>自己的 Gemini／Groq／OpenAI 金鑰</b>。都不接也能上課，✨ 會先給示範內容。',
        fields: [{ type: 'bridge' }], layout: 'wideR',
        say: '金鑰只存在你這台電腦的瀏覽器，不會上傳、也不經過課程伺服器——花的是你自己的免費額度。' }],
    notes: [['bt_n_type', '無人船種類筆記'], ['bt_n_spec', '規格判讀筆記'], ['bt_n_fly', '航行原理筆記'], ['bt_rulecard', '我的賽事規則卡']],
    units: [
      { u: 'U01', title: '無人船有哪些種類', done: ['我能說出 USV 的三種控制層級', '我能比較四種船型的優缺點', '寫好類型筆記'], slides: [
        { kind: 'teach', title: '什麼是 USV：無人水面載具', why: '<b>USV（Unmanned Surface Vehicle）</b>＝船上沒有人、在水面航行的載具；自主航行的又常稱 <b>ASV（Autonomous Surface Vehicle）</b>，RoboBoat 比賽就用 ASV 這個詞。',
          html: `<table class="tbl"><thead><tr><th>控制層級</th><th>誰在做決定</th><th>需要的設備</th><th>典型例子</th></tr></thead><tbody>
            <tr><td><b>遙控</b>（RC）</td><td>岸上操作手全程操控</td><td>遙控器、接收機、電調</td><td>遙控模型競速艇</td></tr>
            <tr><td><b>航點自動</b></td><td>人規劃航線，船自己照 GPS 航點走</td><td>自駕儀、GPS、羅盤、數傳</td><td>水質監測船、測深船</td></tr>
            <tr><td><b>完全自主</b></td><td>船自己看、自己判斷、自己避障</td><td>機上電腦、光達、攝影機、AI 辨識</td><td>RoboBoat 參賽船</td></tr></tbody></table>
            <div class="cards"><div class="cd"><b>歷史起點</b><small>1898 年特斯拉在紐約公開展示無線電遙控船，證明可以用無線電控制機器（展品見無人船博物館）。</small></div>
            <div class="cd"><b>今天的主流</b><small>電動、GPS 導航、感測器模組化；從海洋測量、環境監測、港口巡查到學生競賽都在用。</small></div>
            <div class="cd"><b>本課程範圍</b><small>只談偵察與監測感測器：定位、影像、光達、聲納、水質探棒。</small></div></div>`,
          say: '同樣一艘船，加上自駕儀就會自己跑航點，再加上機上電腦就能自己認浮標。差別在「誰做決定」。' },
        { kind: 'teach', title: '依「船型」分四大類', why: '判斷一艘無人船，第一個問題是：<b>它靠什麼浮在水上、怎麼對付阻力？</b>',
          html: `<table class="tbl"><thead><tr><th>船型</th><th>浮力與升力來源</th><th>優點</th><th>限制</th><th>典型用途</th></tr></thead><tbody>
            <tr><td><b>單體 V 底</b>（隱身快艇）</td><td>一個船身排水；高速時船底產生動態升力而<b>滑行</b></td><td>結構簡單、直線最快</td><td>窄船身穩性較差、浪中顛簸</td><td>遙控競速、高速巡查</td></tr>
            <tr><td><b>雙體</b>（穿浪雙體）</td><td>兩個細長船身排水</td><td>橫向穩性極好、甲板寬、好裝感測器</td><td>結構較重、轉彎半徑較大</td><td>RoboBoat、測量、監測</td></tr>
            <tr><td><b>三體</b></td><td>細長主船身＋兩側浮筒</td><td>主船身阻力小、浮筒防翻</td><td>浮筒與橫樑增加重量與複雜度</td><td>長航程巡航</td></tr>
            <tr><td><b>水翼</b></td><td>低速靠船身排水；超過<b>起飛速度</b>後由水下翼片升力撐起船身</td><td>翼航時阻力小、浪中平穩</td><td>低速時翼片是累贅、控制較難</td><td>高速示範、巡邏</td></tr></tbody></table>
            <p class="txt">右邊的拆解車庫有三種造型可以直接比較：<b>隱身快艇</b>（V 底）、<b>穿浪雙體</b>、<b>水翼巡邏艇</b>。</p>`,
          say: '雙體船是自主船比賽最常見的選擇，因為穩：感測器在搖晃的船上很難看準浮標。' },
        { kind: 'teach', title: '依「尺寸與任務」再細分', why: '同樣叫無人船，競速艇要的是速度，監測船要的是續航與穩定。下表是本課程生成器的六種任務與設計重點（數字為生成器的教學估算）。',
          html: `<table class="tbl"><thead><tr><th>任務</th><th>常見船型</th><th>設計重點</th><th>生成器預設的估算結果</th></tr></thead><tbody>
            <tr><td>遙控模型競速（橢圓繞標）</td><td>單體 V 底</td><td>輕、滑行、P 級 3～4S</td><td>約 1.6 kg、最高約 20 m/s</td></tr>
            <tr><td>遙控直線計速</td><td>單體 V 底</td><td>大功率、高螺距</td><td>約 2 kg、受馬達功率限制</td></tr>
            <tr><td>自主航行挑戰（RoboBoat 類）</td><td>雙體</td><td>穩、感測器多、急停與護罩</td><td>約 10 kg、穩心高度大</td></tr>
            <tr><td>水質監測巡航</td><td>雙體</td><td>續航、RTK 定位、水質探棒與測深</td><td>巡航續航約 5～6 小時</td></tr>
            <tr><td>教育用小型 USV</td><td>單體 V 底＋噴水</td><td>低速、無外露螺旋槳、急停</td><td>約 1 kg、約 2 m/s</td></tr>
            <tr><td>水翼巡邏示範艇</td><td>水翼</td><td>超過起飛速度、展示升力</td><td>起飛約 3 m/s</td></tr></tbody></table>
            <p class="src">以上為本課程生成器的教學估算（js/kits/boat.js），不是特定產品規格。</p>`,
          say: '請把「任務決定規格」這句話帶到 U05：選了任務，後面每一格都有理由。' },
        { kind: 'do', step: '動手', title: '到無人船博物館找「關鍵技術的進步」', why: '博物館的每件展品都對應一項技術進步：無線電遙控、電動推進、GPS 定位、感測器小型化，才讓今天的 USV 成真。',
          steps: ['按「▶ 打開無人船博物館」。', '至少看 4 件展品，留意每件的「學習重點」。', '回來寫筆記：您最感興趣的類型與原因。'],
          fields: [links('實際操作頁', [['▶ 打開無人船博物館', '../museum.html?type=boat', 'am'], ['群島首頁', '../hub.html']]),
            note('bt_n_type', '我的類型筆記：我最感興趣的是哪一類？為什麼？它適合什麼任務？', '例：雙體監測船，因為穩、甲板大，適合裝水質探棒與測深聲納；缺點是較重', true)], layout: 'wideR' }
      ] },
      { u: 'U02', title: '機構解說：船體、推進、轉向、感測、浮力與穩性', done: ['在拆解車庫點過全部零件', '會用排水量算吃水、說得出乾舷與穩心高度', '寫好規格判讀筆記'], slides: [
        { kind: 'teach', title: '一艘無人船的九大零件', why: '把無人船想成人體：<b>船殼</b>是身體、<b>馬達與螺旋槳</b>是腿、<b>舵</b>是方向盤、<b>自駕儀</b>是大腦、<b>感測桅桿</b>是眼睛與耳朵、<b>電池</b>是心臟。',
          html: `<div class="cards">
            <div class="cd"><b>① 船殼 Hull</b><small>多面隱身船殼：硬舭、內傾舷側、船首收尖上翹、平板船尾</small></div>
            <div class="cd"><b>② 上層結構</b><small>稜角艙體，保護電子設備並安裝感測器</small></div>
            <div class="cd"><b>③ 無刷馬達</b><small>內轉子居多，規格寫作「外徑＋長度」＋KV，需水冷</small></div>
            <div class="cd"><b>④ 傳動軸／推進器</b><small>直驅螺旋槳、雙推進器或噴水葉輪</small></div>
            <div class="cd"><b>⑤ 舵或差速</b><small>舵片偏轉水流，或左右推力差轉彎</small></div>
            <div class="cd"><b>⑥ 電池與電調</b><small>鋰電池（串數 S、容量 mAh）＋電子調速器</small></div>
            <div class="cd"><b>⑦ 自駕儀／機上電腦</b><small>讀 GPS、羅盤，跑航點；機上電腦跑影像辨識</small></div>
            <div class="cd"><b>⑧ 感測桅桿</b><small>雷達罩造型天線罩、光電攝影機、光達、通訊天線</small></div>
            <div class="cd"><b>⑨ 安全裝置</b><small>航行燈（左紅右綠、船尾白）、緊急停止按鈕、螺旋槳護罩</small></div></div>`,
          say: '這九個零件就是等一下生成器的五個步驟：船體、推進、感測航電、外觀。' },
        { kind: 'teach', title: '船體：讀懂船長、船寬、型深、吃水、乾舷', why: '造船的第一張圖是<b>剖面</b>。看懂這五個尺寸，就知道船浮多高、能不能抗浪。',
          html: `<table class="tbl"><thead><tr><th>名詞</th><th>意思</th><th>影響</th></tr></thead><tbody>
            <tr><td><b>船長 L</b></td><td>船首到船尾</td><td>越長，同樣速度下興波越小、直線越穩</td></tr>
            <tr><td><b>船寬 B</b></td><td>最寬處（雙體為外寬）</td><td>越寬越穩，但阻力與重量增加</td></tr>
            <tr><td><b>型深 D</b></td><td>龍骨到甲板的高度</td><td>決定船殼體積與乾舷</td></tr>
            <tr><td><b>吃水 T</b></td><td>泡在水裡的深度</td><td>由重量決定；越重吃水越深</td></tr>
            <tr><td><b>乾舷</b></td><td>型深 − 吃水</td><td>太低時浪一打就上甲板、容易進水</td></tr>
            <tr><td><b>硬舭 Chine</b></td><td>船底與舷側交接的稜線</td><td>高速時讓水流乾淨分離，幫助滑行；也是隱身造型的特徵</td></tr></tbody></table>
            <p class="txt"><b>手算：</b>船重幾公斤，就排開幾公升淡水（阿基米德原理）。2 kg 的船、水線長 0.74 m、水線寬 0.19 m、方形係數 0.42 → 吃水 ≈ 0.002 ÷（0.42 × 0.74 × 0.19）≈ 0.034 m＝34 mm。</p>`,
          say: '方形係數是「船的水下體積佔長方塊的比例」，V 底船大約 0.4 左右。' },
        { kind: 'teach', title: '推進：螺旋槳直驅、雙推進、噴水', why: '推進方式決定速度、安全與維修。規格代號跟無人機很像，只是螺旋槳改用<b>毫米</b>與<b>螺距比</b>描述。',
          html: `<table class="tbl"><thead><tr><th>推進方式</th><th>原理</th><th>優點</th><th>限制</th></tr></thead><tbody>
            <tr><td><b>螺旋槳直驅</b></td><td>船內馬達經傳動軸帶動船尾螺旋槳</td><td>效率高、速度快</td><td>螺旋槳外露、怕水草</td></tr>
            <tr><td><b>雙推進</b></td><td>左右各一具推進器</td><td>可差速原地迴轉、壞一具還能回航</td><td>重量與耗電加倍</td></tr>
            <tr><td><b>噴水推進</b></td><td>船內葉輪吸水再從噴嘴高速噴出</td><td>無外露槳、淺水安全</td><td>效率較低、滑脫較大</td></tr></tbody></table>
            <table class="tbl"><thead><tr><th>代號</th><th>意思</th><th>怎麼影響航行</th></tr></thead><tbody>
            <tr><td><b>3660</b>（馬達）</td><td>外徑 36 mm、長 60 mm</td><td>越大功率越高也越重；船用馬達通常要水冷</td></tr>
            <tr><td><b>2000 KV</b></td><td>每 1 伏特空轉約 2000 rpm</td><td>4S（14.8 V）空轉約 2.96 萬 rpm</td></tr>
            <tr><td><b>40 mm × 螺距比 1.6</b></td><td>直徑 40 mm、每轉理論前進 64 mm</td><td>螺距越大越快，但馬達負擔越重</td></tr>
            <tr><td><b>4S 5000 mAh</b></td><td>4 芯串聯 14.8 V、容量 5 Ah</td><td>能量（Wh）＝5 × 3.7 × 4 ＝ 74 Wh</td></tr></tbody></table>`,
          say: '請把這張表拍下來。等一下生成器步驟 3 就是在選這些代號。' },
        { kind: 'teach', title: '轉向：舵、差速、向量噴嘴', why: '船沒有煞車，也沒有輪子，轉向全靠<b>改變水流方向</b>或<b>左右推力差</b>。',
          html: `<table class="tbl"><thead><tr><th>方式</th><th>怎麼轉</th><th>特點</th><th>生成器搭配規則</th></tr></thead><tbody>
            <tr><td><b>舵</b></td><td>螺旋槳後方的舵片偏轉，水流把船尾推開</td><td>簡單可靠；低速時舵效差</td><td>搭配螺旋槳直驅或雙推進</td></tr>
            <tr><td><b>差速</b></td><td>左推進器加速、右減速 → 船頭往右轉</td><td>可原地迴轉，停靠碼頭很好用</td><td>必須是雙推進</td></tr>
            <tr><td><b>向量噴嘴</b></td><td>噴嘴左右擺動，直接改變推力方向</td><td>反應快、無外露舵片</td><td>必須是噴水推進</td></tr></tbody></table>
            <p class="txt">轉彎時船會<b>外傾或內傾</b>：V 底高速轉彎會內傾咬水；窄而高的船容易被離心力甩翻，這就是穩性要算的原因。</p>`,
          say: '自主船比賽要停靠碼頭，差速轉向幾乎是標準配備。' },
        { kind: 'teach', title: '感測與航電：USV 的眼睛與大腦', why: '自主航行要回答三個問題：<b>我在哪裡？我面向哪裡？前面有什麼？</b>每一種感測器各負責一部分。',
          html: `<table class="tbl"><thead><tr><th>感測器／航電</th><th>回答的問題</th><th>選擇重點</th></tr></thead><tbody>
            <tr><td>GPS／RTK GNSS</td><td>我在哪裡</td><td>一般 GPS 約公尺級；RTK 加基準站修正可達公分級</td></tr>
            <tr><td>電子羅盤／雙天線 GNSS</td><td>船頭朝哪裡</td><td>羅盤怕馬達與電線的磁場；雙天線 GNSS 不受磁場影響</td></tr>
            <tr><td>光達</td><td>前面的物體多遠</td><td>2D 掃一圈、3D 得到點雲；水面反光會產生雜訊</td></tr>
            <tr><td>攝影機／雙目相機</td><td>浮標是什麼顏色、形狀</td><td>辨識紅綠浮標、數字標牌；雙目可同時估距離</td></tr>
            <tr><td>聲納</td><td>水有多深、水下地形</td><td>單波束測深；側掃聲納得到水下影像</td></tr>
            <tr><td>水質探棒</td><td>水溫、pH、濁度、溶氧</td><td>要伸入水中、定期校正</td></tr>
            <tr><td>自駕儀＋機上電腦</td><td>下一步怎麼做</td><td>自駕儀管航向與航點；機上電腦跑影像與決策</td></tr>
            <tr><td>通訊（遙控、數傳、Wi-Fi、行動網路）</td><td>岸上怎麼知道船的狀況</td><td>距離、頻寬與法規；自主模式下比賽規定不得遙控決策</td></tr></tbody></table>`,
          say: '感測器越多越重、越耗電：生成器步驟 4 會把每個感測器的重量和耗電算進去。' },
        { kind: 'do', step: '互動', title: '浮力與穩性：單體和雙體差在哪裡', why: '浮力決定<b>吃水</b>，穩性決定<b>會不會翻</b>。穩性用<b>穩心高度 GM</b> 衡量：GM＝浮心高 KB＋穩心半徑 BM − 重心高 KG；GM 越大越不容易翻，GM ≤ 0 會自己翻覆。',
          steps: ['拖動全重，看吃水怎麼變。', '把重心高度往上拉（想像裝高桅桿），看 GM 怎麼變小。', '比較同樣外寬下，單體與雙體的 BM 差多少。'],
          fields: [{ type: 'boatstab' }], layout: 'wideR', say: '雙體船的兩個浮力中心分得很開，船一傾斜，低的那一側浮力大增，把船推回來，所以特別穩。' },
        { kind: 'teach', title: '組裝順序與防水原則', why: '實船組裝的順序，就是 3D 拆解圖反過來播放。水和電放在一起，防水是第一優先。',
          html: `<ol class="steps"><li>船殼檢漏：船殼泡水 10 分鐘以上，確認沒有滲水（各隊依實際條件調整）。</li><li>安裝馬達座、傳動軸與軸封（或噴水推進器），轉動順暢、不卡。</li><li>配置水冷管路（船用馬達與電調常見），出水口要看得到水柱。</li><li>電池、電調、自駕儀放在防水艙或防水盒；接頭與穿孔用防水接頭或膠封。</li><li>安裝上層結構與感測桅桿；羅盤遠離馬達與電源線。</li><li><b>先不下水</b>：在岸上確認轉向、推進方向、急停能切斷推進器電源。</li><li>最後才下水測試，並綁好拖帶繩，方便回收。</li></ol>
            <p class="warn">⚠ 不可下水游泳撈船；鋰電池充電要用防火袋、有人看顧，鼓包立刻停用。</p>`,
          say: '最常見的失敗不是速度不夠，而是進水短路。先防水，再求快。' },
        { kind: 'do', step: '動手', title: '拆解車庫：三種船型逐一拆開比較', why: '拆解車庫的每個讀數都來自同一組公式，輸入只有油門。請親手驗證「理論航速＝螺距 × 轉速 ÷ 60」。',
          steps: ['按「▶ 打開拆解車庫（隱身快艇）」。', '點每個零件看說明；按「拆解」看爆炸圖。', '同一個油門（例如 60%）分別記下三種船型的實際航速。', '回來寫規格判讀筆記。'],
          fields: [links('實際操作頁', [['▶ 打開拆解車庫（隱身快艇）', '../garage.html?type=boat&v=vhull', 'am'], ['穿浪雙體', '../garage.html?type=boat&v=catamaran'], ['水翼巡邏艇', '../garage.html?type=boat&v=foil']]),
            note('bt_n_spec', '我的規格判讀筆記：寫下一組規格（船型／馬達／螺旋槳／電池）並解釋它的意思', '例：V 底 800 mm、3660 2000KV、40 mm 螺距比 1.6、4S 5000mAh：理論航速約…', true)], layout: 'wideR' }
      ] },
      { u: 'U03', title: '航行原理與操控', done: ['會算理論航速與滑脫率', '說得出排水、越峰、滑行三個階段', '知道水翼起飛速度怎麼算', '完成一次水道計時'], slides: [
        { kind: 'do', step: '互動', title: '滑脫率：螺旋槳在水中會「打滑」', why: '螺旋槳每轉一圈，理論上前進一個<b>螺距</b>；但水不是固體，實際前進距離比較短，差距的百分比就是<b>滑脫率</b>。',
          steps: ['拖動 KV、電池串數、螺距、油門，看理論與實際航速。', '切換船型：水翼滑脫最小、噴水最大。', '用畫面下方的「手算抽查」，自己按一次計算機。'],
          fields: [{ type: 'boatslip' }], layout: 'wideR', say: '模型船常見的滑脫率約兩到三成；噴水推進要再多扣一些。' },
        { kind: 'do', step: '互動', title: '福祿數：排水、越峰、滑行', why: '船速快到一個程度，會「爬上自己的船首波」。這個轉折用<b>福祿數 Fn＝航速 ÷ √(g × 水線長)</b> 判斷：約 0.4 以下是排水航行，0.4～1.0 是阻力最大的越峰區，1.0 以上 V 底船可進入滑行。',
          steps: ['設定船長 0.8 m，把航速從 0 慢慢拉到 10 m/s。', '找出紅點越過「阻力峰」的位置。', '比較單體實線與雙體虛線：雙體的峰比較低，但它不靠滑行。'],
          fields: [{ type: 'boatfroude' }], layout: 'wideR', say: '如果馬達功率不足，船會卡在阻力峰前上不去，這就是生成器會警告「沒有進入滑行」的原因。' },
        { kind: 'do', step: '互動', title: '水翼：速度到了，船身就離水', why: '水翼和飛機機翼一樣：升力 L＝½ × ρ × v² × 面積 × 升力係數。水的密度約是空氣的 800 倍，所以很小的翼片就能撐起整艘船。',
          steps: ['設定全重 2 kg、水翼 80 cm²。', '把航速往上拉，找出升力剛好等於重量的速度（起飛速度）。', '把水翼面積加倍，起飛速度變多少？'],
          fields: [{ type: 'boatfoil' }], layout: 'wideR', say: '起飛速度與面積的平方根成反比：面積變四倍，起飛速度才減半。' },
        { kind: 'teach', title: '操控：遙控與自駕儀的模式', why: '遙控船靠操作手；自主船靠<b>自駕儀模式</b>切換。比賽與實務上，<b>任何時候都要能一鍵切回人工或急停</b>。',
          html: `<table class="tbl"><thead><tr><th>操作</th><th>遙控器常見配置</th></tr></thead><tbody>
            <tr><td>油門</td><td>槍型遙控器的扳機，或搖桿上下</td></tr><tr><td>轉向</td><td>方向輪或搖桿左右（舵、差速或向量噴嘴）</td></tr>
            <tr><td>失控保護（Failsafe）</td><td>訊號中斷時油門自動歸零；比賽前一定要測</td></tr></tbody></table>
            <table class="tbl"><thead><tr><th>自駕儀模式（開源自駕儀常見名稱）</th><th>船會怎麼做</th><th>用在哪裡</th></tr></thead><tbody>
            <tr><td>手動 Manual</td><td>完全照遙控器指令</td><td>下水、回收、測試</td></tr>
            <tr><td>保持 Hold</td><td>停止推進</td><td>暫停、等待</td></tr>
            <tr><td>自動 Auto</td><td>依序走預先規劃的 GPS 航點</td><td>水質監測測線、巡航</td></tr>
            <tr><td>返航 RTL</td><td>自動回到出發點</td><td>電量低、訊號中斷</td></tr>
            <tr><td>導引 Guided</td><td>由機上電腦即時下指令</td><td>自主避障、停靠</td></tr></tbody></table>
            <p class="src">模式名稱以 ArduPilot Rover 等開源自駕儀為例，各韌體版本略有差異，以官方文件為準。</p>`,
          say: '自主船的第一條安全規則：人永遠可以接手。' },
        { kind: 'do', step: '動手', title: '水道計時：體驗操控與船型差異', why: '在模擬競技場的「單人計時」繞水道一圈。注意：切進浮標內側會被罰秒。',
          steps: ['按「▶ 打開單人計時」，完成一圈計時。', '換一種船型再跑一次，比較時間與轉彎手感。', '再試「5 船競速」，體會多船同場的超車與避碰。', '回來寫下您的時間與心得。'],
          fields: [links('實際操作頁', [['▶ 打開單人計時', '../arena.html?game=boat&mode=time', 'am'], ['5 船競速', '../arena.html?game=boat&mode=race'], ['排行榜', '../board.html']]),
            note('bt_n_fly', '我的航行原理筆記：計時成績、哪種船型轉彎最穩、和滑脫率／福祿數／水翼的關聯', '例：V 底 1 圈 52 秒，直線最快但轉彎外飄；水翼船起步慢，超過起飛速度後…', true)], layout: 'wideR' }
      ] },
      { u: 'U04', title: '競賽規則：RoboBoat 自主船賽與遙控模型船競速', done: ['說得出 RoboBoat 的任務與計分方式', '知道車輛尺寸、重量與急停規定', '知道遙控模型船繞標賽的罰則', '寫好我的賽事規則卡'], slides: [
        { kind: 'teach', title: 'RoboBoat 是什麼', why: '<b>RoboBoat</b> 是 RoboNation 主辦的國際學生自主水面載具（ASV）競賽：船要<b>完全自主</b>通過浮標門、避障、停靠並回報資訊，另外還要繳交設計文件與簡報。',
          html: `<table class="tbl"><thead><tr><th>項目</th><th>2026 年（已舉辦）</th><th>2027 年（已公布）</th></tr></thead><tbody>
            <tr><td>日期</td><td>2026 年 2 月 19～24 日</td><td>2027 年 2 月 18～23 日（第 20 屆）</td></tr>
            <tr><td>地點</td><td colspan="2">美國佛羅里達州 Sarasota，Nathan Benderson Park</td></tr>
            <tr><td>主題</td><td>Storm Response（風暴災後應變）</td><td>依主辦單位最新規則（2027 手冊尚待公布）</td></tr>
            <tr><td>參賽資格</td><td colspan="2">大學與高中隊伍；75% 以上為全職學生；至少 3 名隊員</td></tr>
            <tr><td>競賽組成</td><td colspan="2">自主挑戰（Autonomy Challenge）＋設計文件（Design Documentation）</td></tr>
            <tr><td>船數</td><td>每隊最多 2 艘，可展示船與船之間的通訊</td><td>依主辦單位最新規則</td></tr></tbody></table>
            ${src([RB.over, RB.neww, RB.y27], '以下各頁以 2026 年手冊為例說明，參賽請以最新年度手冊為準')}`,
          say: '這是全世界最有代表性的學生自主船比賽，題目每年換，但核心一直是：看浮標、走航道、會停靠、能回報。' },
        { kind: 'teach', title: 'RoboBoat 2026 的六項任務與分數', why: '每艘船必須先<b>通過入口門</b>才能做其他任務；任務順序自訂，每次出賽取<b>最佳一輪</b>計分。下表為準決賽與決賽的計分項目（資格賽只看是否達標，不給分）。',
          html: `<table class="tbl"><thead><tr><th>任務</th><th>做什麼</th><th>主要得分項（分）</th></tr></thead><tbody>
            <tr><td>1 撤離路線與返回</td><td>自主穿過兩對紅綠浮標組成的入口門，結束時從出口門返回</td><td>通過入口門 100；回報入口門 100；從出口門返回 200；回報心跳訊息 100</td></tr>
            <tr><td>2 清除漂流物</td><td>沿航道進出漂流物區、辨識紅綠浮標並回報座標</td><td>進入 100、離開 100；避開紅色 100；繞綠色一圈 200；回報全部位置 200</td></tr>
            <tr><td>3 緊急應變衝刺</td><td>穿門、依燈號方向繞黃色浮標後出門，越快越好</td><td>完成 200；方向正確 150；時間分 250 − T；回報 100</td></tr>
            <tr><td>4 物資投送</td><td>把球送到黑色船、把水送到橘色船</td><td>每類第 1／2／3 艘：75／125／200；回報 100</td></tr>
            <tr><td>5 進港停靠</td><td>進入碼頭，停進綠燈指示的泊位</td><td>進入任一空泊位 50；綠燈泊位 200；綠燈且號碼最小 350；回報 100</td></tr>
            <tr><td>6 港口警報</td><td>聽到聲響訊號（1 聲或 2 聲）立即放下任務前往指定區域</td><td>前往任一區 150；前往正確區 300；回報 150</td></tr>
            <tr><td>撞擊浮標或障礙物</td><td>—</td><td>每次 −25，最多計 20 次（−500）</td></tr>
            <tr><td>船間通訊（兩艘船）</td><td>單向、確認、雙向協同三級</td><td>0～500</td></tr></tbody></table>
            ${src([RB.score, RB.h26])}`,
          say: '注意每一項幾乎都有「回報訊息」分數：船不只要做到，還要把位置與狀態傳給裁判伺服器。' },
        { kind: 'teach', title: 'RoboBoat 的設計文件、重量分與資格賽', why: '分數不只來自水上：<b>設計文件</b>與<b>重量、推力</b>也算分。越輕、推力越大，分數越高。',
          html: `<table class="tbl"><thead><tr><th>設計文件</th><th>分數</th></tr></thead><tbody>
            <tr><td>技術設計報告</td><td>200</td></tr><tr><td>隊伍網站</td><td>180</td></tr><tr><td>隊伍介紹影片</td><td>120</td></tr><tr><td>設計簡報</td><td>180</td></tr><tr><td>系統評估</td><td>180</td></tr><tr><td><b>合計</b></td><td><b>860</b></td></tr></tbody></table>
            <table class="tbl"><thead><tr><th>船重 w（磅）</th><th>重量分</th></tr></thead><tbody>
            <tr><td>w ≤ 70</td><td>80 ＋（70 − w）</td></tr><tr><td>70 ＜ w ≤ 110</td><td>2 ×（110 − w）</td></tr><tr><td>110 ＜ w ＜ 140</td><td>−250 − 5 ×（w − 110）</td></tr><tr><td>w ≥ 140</td><td>取消資格</td></tr><tr><td>推力分</td><td>100 ×（推力 ÷ 重量）</td></tr></tbody></table>
            <p class="txt"><b>晉級準決賽的資格條件：</b>完成兩項任務的核心能力、兩項任務的進階能力、連續自主完成兩項任務，並送出心跳訊息。</p>
            ${src([RB.score, RB.h26, RB.neww])}`,
          say: '生成器選「自主航行挑戰」時，會自動把您的估算重量換成磅，套這個公式算重量分。' },
        { kind: 'teach', title: 'RoboBoat 的船體規定與安全要求', why: '下水前每次都要通過<b>安全檢查</b>。以下規定直接影響您在生成器裡的選擇。',
          html: `<table class="tbl"><thead><tr><th>規定</th><th>內容</th><th>對應生成器</th></tr></thead><tbody>
            <tr><td>尺寸</td><td>船要放得進 6 × 3 × 3 英尺（約 1829 × 914 × 914 mm）的箱子</td><td>步驟 2 船長、船寬；桅桿高度</td></tr>
            <tr><td>重量</td><td>整套系統須低於 140 磅（約 63.5 kg）</td><td>估算總重</td></tr>
            <tr><td>浮力</td><td>必須正浮力；不可以是主要潛在水下或飛離水面的載具</td><td>儲備浮力、乾舷</td></tr>
            <tr><td>電源</td><td>必須電池供電，任何電池（組）開路電壓不得超過 60 V 直流</td><td>步驟 3 電池串數</td></tr>
            <tr><td>急停</td><td>船上至少一顆直徑 1.5 英吋的紅色按鈕＋一套無線遙控急停；啟動時須直接切斷推進器電源，無線急停須在 2 秒內斷電，發射器斷電或拔電池也要自動急停</td><td>步驟 4 緊急停止開關</td></tr>
            <tr><td>推進安全</td><td>所有轉動件都要保護，例如螺旋槳須加護罩</td><td>步驟 3 螺旋槳護罩</td></tr>
            <tr><td>可回收</td><td>須裝多點拖帶索具；須可遙控開回碼頭，遙控中斷時推力歸零</td><td>（實作時加裝）</td></tr>
            <tr><td>自主</td><td>自主模式下所有決策都在船上完成，不可由岸上傳送控制資訊</td><td>步驟 4 主控選機上電腦</td></tr>
            <tr><td>電池安全</td><td>參加電池安全說明會、繳交電池規格與安全資料表、備 LiPo 防火袋、充電時有人看顧、不可在水中或浮動碼頭上換電池</td><td>—</td></tr></tbody></table>
            ${src([RB.veh, RB.safety])}`,
          say: '急停規定寫得非常細：不能只是「叫馬達停」，而是要「把電斷掉」。這是所有水上機器人比賽的共通精神。' },
        { kind: 'teach', title: '遙控模型船競速：橢圓繞標賽怎麼比', why: '另一種主流賽事是<b>遙控模型船競速</b>：多艘船同場順時針繞浮標，依名次累積積分。以下以北美模型船協會 NAMBA 規則書為例。',
          html: `<table class="tbl"><thead><tr><th>項目</th><th>NAMBA 規則書內容</th></tr></thead><tbody>
            <tr><td>航道</td><td>轉彎一律<b>順時針</b>（特殊組別除外）；紀錄賽航道全長 1 英里、6 圈，轉彎半徑 15～50 英尺，每個彎道用 5 顆浮標（15 英尺半徑可用 3 顆）</td></tr>
            <tr><td>分組</td><td>每組（Heat）3～8 艘；至少比 3 輪</td></tr>
            <tr><td>起跑</td><td>最多 2 分鐘的整備時間（Pit Time）讓所有船下水，接著倒數計時，時間到即開賽，不論船的位置</td></tr>
            <tr><td>計分</td><td>第 1～8 名：400、300、225、169、127、96、72、54 分；未完賽 25 分；未出賽 0 分</td></tr>
            <tr><td>浮標罰則</td><td>切進浮標內側、跳過或明顯撞到浮標：罰多跑 1 圈；從外側輕觸且未移動浮標不罰</td></tr>
            <tr><td>累積犯規</td><td>累積 3 次駕駛或浮標犯規，命令離場並記為未完賽</td></tr>
            <tr><td>撞擊停擺船</td><td>撞到已宣告停擺的船，該組取消資格、0 分</td></tr></tbody></table>
            ${src([NAMBA], '規則書版本以 NAMBA 官網最新公告為準（本頁查閱版本修訂日期 2026 年 2 月 22 日）')}
            <p class="txt">課程的「水道競速島」是簡化版：切浮標每顆罰 2 秒、跑 3 圈，方便在課堂上比較船型。</p>`,
          say: '模型船比賽的精神跟賽車很像：跑得快不夠，還要不切標、不撞人。' },
        { kind: 'teach', title: '電動模型船的分級、安全與臺灣場地', why: '電動組依<b>鋰電芯串數</b>分級，讓同級船公平競爭；生成器步驟 1 的級別就是用這個分法。',
          html: `<table class="tbl"><thead><tr><th>NAMBA 電動分級</th><th>鋰電芯數</th><th>最高電壓</th></tr></thead><tbody>
            <tr><td>N 級</td><td>2 芯</td><td>8.46 V</td></tr><tr><td>P 級</td><td>3～4 芯</td><td>16.92 V</td></tr><tr><td>Q 級</td><td>5～6 芯</td><td>25.38 V</td></tr><tr><td>S 級</td><td>7～8 芯</td><td>33.84 V</td></tr></tbody></table>
            <table class="tbl"><thead><tr><th>安全重點</th><th>內容</th></tr></thead><tbody>
            <tr><td>回收船</td><td>任何情況都不可游泳或潛水去撈船；回收船須為硬殼船、不可用充氣艇，模型船航行時回收船要靠岸且無人</td></tr>
            <tr><td>油門控制</td><td>所有船都必須能確實關閉動力或控制油門；遙控開關位置要防止誤觸</td></tr>
            <tr><td>充電區</td><td>準備滅火器、安全充電容器、沙桶；充電器須符合電池化學類型</td></tr>
            <tr><td>臺灣場地</td><td>在湖泊、河川、港區或公園水域操作，須遵守場地管理單位與主管機關規定；本課程不提供特定數字，請依主辦單位最新規則</td></tr></tbody></table>
            ${src([NAMBA])}`,
          say: '生成器選了 P 級卻裝 6S，就會跳出紅字：這就是分級規則在做的事。' },
        { kind: 'do', step: '動手', title: '對戰體驗＋寫下我的賽事規則卡', why: '先到競技場跑一場 5 船競速，再把您理解的規則寫成一張規則卡（可以替班上辦一場自主船或遙控船小比賽）。',
          steps: ['按「▶ 5 船競速」跑一場。', '填寫規則卡：賽制、航道、任務或圈數、計分、罰則、安全。', '按「✨ 交給 AI 優化」整理成正式格式。'],
          fields: [links('實際操作頁', [['▶ 5 船競速', '../arena.html?game=boat&mode=race', 'am'], ['單人計時', '../arena.html?game=boat&mode=time'], ['排行榜', '../board.html']]),
            { type: 'area', id: 'bt_rulecard', label: '我的賽事規則卡（賽制、航道、任務或圈數、計分、罰則、安全）', rows: 7, ph: '例：校內自主船挑戰；泳池 25 m；任務一穿過紅綠浮標門 100 分、任務二繞黃浮標回來 150 分；撞浮標每次 −25；船上紅色急停按鈕＋遙控急停；不可下水撈船…',
              ai: { prompt: '你是無人船競賽裁判長，用繁體中文（臺灣用語）。把學員寫的賽事規則卡整理成正式規則條文（第 1 條、第 2 條…），保留學員的設定，不要加入學員沒提到的數字；若有缺漏（例如安全、急停、回收、判罰）在最後用「建議補充：」列出。\n\n{{_me}}', demo: '（示範）{{_me}}\n建議補充：串接 AI 後再按一次，就是 AI 整理的正式條文。' } }], layout: 'wideR' }
      ] },
      { u: 'U05', title: '平台 3D 建模：六步生成器', gen: true, done: ['完成六個建模步驟', '規格檢查警告處理完畢', '產生安裝包並交給 AI'], slides: [
        { kind: 'teach', title: '建模流程：從任務到 3D 模型', why: '「平台 3D 建模」不是隨便畫一艘好看的船，而是<b>先有規格、再有模型</b>：每個尺寸都有理由，每個零件都對得上規格書。',
          html: `<ol class="steps"><li><b>任務</b>：決定比賽類型與級別 → 套用建議規格。</li><li><b>船體</b>：船型、船長、船寬、型深、設計吃水、材質（水翼船加翼面積）。</li><li><b>推進</b>：推進方式、轉向、馬達、KV、螺旋槳、電池、護罩。</li><li><b>感測與航電</b>：主控、定位、航向、光達、攝影機、聲納、水質探棒、通訊、航行燈、急停。</li><li><b>外觀</b>：上層結構、感測桅桿、主副色、船號。</li><li><b>總檢查</b>：估算總重、吃水與乾舷、航速、福祿數、穩性、續航，處理警告，請 AI 評審。</li></ol>
            <p class="txt">左邊的 3D 會即時跟著您的選擇變化，船浮在半透明水面上；右邊估算每改一格就重算。最後一頁可以「🔧 拆解」看爆炸圖，或「⬇ 下載 GLB」把模型帶去 Blender、Unity。</p>
            <p class="txt">本課程的無人船只配置偵察與監測感測器，生成器也沒有任何武器選項。</p>`,
          say: '請先選任務、按套用，再一步一步改成您想要的樣子。看到紅色警告，就是工程師在跟您說話。' }
      ] }
    ],
    pack: { root: '我的無人船3D建模安裝包', out: '我的無人船3D建模網頁', what: '- 模型必須是 USV 造型：多面隱身船殼、稜角上層結構、感測桅桿（雷達罩造型天線罩、光電攝影機、天線、左紅右綠航行燈）；只放偵察與監測感測器，不放任何武器。\n- 加一塊半透明水面，船依「實際吃水」浮在水面上；「動作展示」要有隨波起伏與螺旋槳轉動（水翼船可展示船身升起）。\n', rulesMd: `# RoboBoat 自主船競賽摘要（以 2026 年手冊為例）

- 來源：RoboBoat 2026 Team Handbook https://robonation.org/app/uploads/sites/3/2025/10/RoboBoat-2026-Team-Handbook_111125.pdf
- 計分：https://robonation.gitbook.io/roboboat-resources/section-4-scoring-and-awards
- 2026 年 2 月 19–24 日於美國 Sarasota 的 Nathan Benderson Park 舉辦；2027 年為 2 月 18–23 日（手冊待公布，以主辦單位最新規則為準）。

| 項目 | 規定 |
|---|---|
| 尺寸 | 須放得進 6 × 3 × 3 英尺的箱子 |
| 重量 | 低於 140 磅；≤ 70 磅重量分＝80＋(70−w)；70–110 磅＝2×(110−w)；110–140 磅＝−250−5×(w−110) |
| 推力分 | 100 ×（推力 ÷ 重量） |
| 電源 | 電池供電，開路電壓 ≤ 60 V DC |
| 急停 | 船上 1.5 英吋紅色按鈕＋無線急停，須直接切斷推進器電源 |
| 推進 | 所有轉動件須保護，螺旋槳須加護罩 |
| 撞擊 | 每次 −25 分，最多 20 次 |
| 設計文件 | 報告 200、網站 180、影片 120、簡報 180、系統評估 180，共 860 |

任務（2026）：1 撤離路線與返回、2 清除漂流物、3 緊急應變衝刺、4 物資投送、5 進港停靠、6 港口警報。

# 遙控模型船橢圓繞標賽（NAMBA 規則書）

- 來源：https://namba.com/content/library/rules/namba_rulebook.pdf
- 順時針繞標；紀錄賽航道 1 英里 6 圈；每組 3–8 艘、至少 3 輪。
- 名次積分：400、300、225、169、127、96、72、54；未完賽 25；未出賽 0。
- 切標或撞標罰多跑 1 圈；累積 3 次犯規離場。
- 電動分級：N 級 2 芯、P 級 3–4 芯、Q 級 5–6 芯、S 級 7–8 芯。
- 不可游泳撈船；所有船須能確實關閉動力。

# 本課程原則
- 無人船只配置偵察與監測感測器，不配置武器。
- 各賽事細節以主辦單位最新規則為準。
` }
  });
})();
