/* 水上無人船（USV）3D 建模生成器：欄位定義、任務預設、規格正規化、教學估算（classic script，簡報與 lab.html 共用）
 * 介面（三種載具一致）：KITS.<k> = { k, name, prefix, steps, PRESETS, presetField, DEF, spec(f), calc(s), md(s), geom(s) }
 * 所有數字都是「教學估算」：用簡化的造船公式（排水量、方形係數、福祿數、滑脫率、水翼升力、穩心高度）讓學員看懂取捨，
 * 不是特定產品規格，也不是正式的船舶設計計算。本課程的無人船只配置偵察與監測感測器，不配置任何武器。
 */
(function () {
  const K = window.KITS = window.KITS || {};
  const o = (v, l, s) => ({ v, l, s });
  const COLORS = [o('#64748b', '隱身灰'), o('#0f172a', '深海藍黑'), o('#e5e7eb', '亮銀白'), o('#f97316', '救難橘'), o('#facc15', '警示黃'), o('#0ea5e9', '天藍'), o('#16a34a', '綠'), o('#ef4444', '紅')];
  const MISSION = [
    o('rcoval', '遙控模型競速（橢圓繞標）', '順時針繞浮標、多船同場、依名次計分'),
    o('rcsprint', '遙控直線計速', '單船直線測速，比最高速度'),
    o('roboboat', '自主航行挑戰（RoboBoat 類）', '通過浮標門、避障、停靠、回報位置'),
    o('survey', '水質監測巡航', 'GPS 航點巡航，量測水溫／pH／濁度與水深'),
    o('edu', '教育用小型 USV', '教室水池可用、低速、安全優先'),
    o('foil', '水翼巡邏示範艇', '超過起飛速度後船身離水，展示水翼原理')
  ];
  const CLASS = [o('N', 'N 級（2S）', 'NAMBA 電動分級：2 顆鋰電芯'), o('P', 'P 級（3～4S）', 'NAMBA 電動分級：3～4 顆鋰電芯'), o('Q', 'Q 級（5～6S）', 'NAMBA 電動分級：5～6 顆鋰電芯'), o('auto', '自主賽（不分電池級別）', '依 RoboBoat 尺寸、重量與安全規範'), o('none', '不參賽／自由設計')];
  const HULL = [o('vhull', '單體 V 底（隱身快艇）', '硬舭 V 底，高速時進入滑行，直線最快'), o('cat', '雙體（穿浪雙體）', '兩個細長船身，甲板寬、最穩，感測器好佈置'), o('tri', '三體（主船＋兩側浮筒）', '細長主船身阻力小，浮筒防翻'), o('foil', '水翼（水翼巡邏艇）', '水下翼片產生升力，把船身抬出水面')];
  const MAT = [o('glass', '玻璃纖維', '模型船與小型 USV 主流，好修補'), o('carbon', '碳纖維', '最輕最硬，價格最高'), o('abs', '3D 列印（PETG／ABS）', '好做、好改，需塗層防水'), o('hdpe', 'HDPE 塑膠', '耐撞、便宜、偏重'), o('foam', '泡棉夾層（不沉）', '內部充滿泡棉，破損也不沉'), o('alu', '鋁合金板', '堅固耐用，最重')];
  const DRIVE = [o('direct', '螺旋槳直驅（單軸）', '馬達經傳動軸帶動船尾螺旋槳'), o('twin', '雙推進（左右各一）', '可差速轉向，原地迴轉'), o('jet', '噴水推進', '葉輪藏在船內，不怕水草，淺水安全')];
  const STEER = [o('rudder', '舵', '螺旋槳後方的舵片偏轉水流'), o('diff', '雙推進差速', '左右推力不同就轉彎（需選雙推進）'), o('vector', '噴水向量轉向', '噴嘴左右擺動（需選噴水推進）')];
  // 馬達：外徑×長度（mm）；g＝重量；cap＝建議連續輸入功率（W）
  const MOTOR = { '2440': { d: 24, l: 40, g: 60, cap: 250 }, '2848': { d: 28, l: 48, g: 105, cap: 600 }, '3660': { d: 36, l: 60, g: 230, cap: 1500 }, '4074': { d: 40, l: 74, g: 400, cap: 2500 }, '4092': { d: 40, l: 92, g: 520, cap: 3500 }, '5692': { d: 56, l: 92, g: 900, cap: 6000 } };
  const AREAL = { glass: 1400, carbon: 800, abs: 1300, hdpe: 3000, foam: 1100, alu: 4300 }; // 殼板面密度 g/m²（教學估算）
  const SLIP = { vhull: 0.25, cat: 0.22, tri: 0.24, foil: 0.18 };
  const CB = { vhull: 0.42, cat: 0.5, tri: 0.45, foil: 0.42 };
  const RHO = 1000, g = 9.81, CF = 0.004, FOIL_CL = 0.5;

  const PRESETS = {
    rcoval: { bt_class: 'P', bt_hull: 'vhull', bt_len: '800 mm', bt_beam: '220 mm', bt_draft: '30 mm', bt_depth: '100 mm', bt_mat: 'glass', bt_foil: '不裝', bt_drive: 'direct', bt_steer: 'rudder', bt_motor: '3660', bt_kv: '2000 KV', bt_prop: '40 mm', bt_pitch: '1.6 倍', bt_cells: '4', bt_mah: '5000 mAh', bt_guard: 'none', bt_gps: 'none', bt_compass: 'none', bt_lidar: 'none', bt_cam: 'none', bt_sonar: 'none', bt_wq: 'none', bt_comm: 'rc', bt_fc: 'rx', bt_lights: 'no', bt_estop: 'no', bt_super: 'low', bt_mast: 'none' },
    rcsprint: { bt_class: 'Q', bt_hull: 'vhull', bt_len: '1000 mm', bt_beam: '250 mm', bt_draft: '40 mm', bt_depth: '120 mm', bt_mat: 'carbon', bt_foil: '不裝', bt_drive: 'direct', bt_steer: 'rudder', bt_motor: '4074', bt_kv: '1500 KV', bt_prop: '45 mm', bt_pitch: '1.8 倍', bt_cells: '6', bt_mah: '5000 mAh', bt_guard: 'none', bt_gps: 'gps', bt_compass: 'none', bt_lidar: 'none', bt_cam: 'none', bt_sonar: 'none', bt_wq: 'none', bt_comm: 'rc', bt_fc: 'rx', bt_lights: 'no', bt_estop: 'no', bt_super: 'low', bt_mast: 'none' },
    roboboat: { bt_class: 'auto', bt_hull: 'cat', bt_len: '1500 mm', bt_beam: '800 mm', bt_draft: '100 mm', bt_depth: '300 mm', bt_mat: 'glass', bt_foil: '不裝', bt_drive: 'twin', bt_steer: 'diff', bt_motor: '3660', bt_kv: '300 KV', bt_prop: '70 mm', bt_pitch: '1.0 倍', bt_cells: '6', bt_mah: '16000 mAh', bt_guard: 'shroud', bt_gps: 'rtk', bt_compass: 'dual', bt_lidar: '3d', bt_cam: 'stereo', bt_sonar: 'none', bt_wq: 'none', bt_comm: 'wifi', bt_fc: 'companion', bt_lights: 'yes', bt_estop: 'yes', bt_super: 'open', bt_mast: 'tall' },
    survey: { bt_class: 'none', bt_hull: 'cat', bt_len: '1200 mm', bt_beam: '600 mm', bt_draft: '80 mm', bt_depth: '250 mm', bt_mat: 'hdpe', bt_foil: '不裝', bt_drive: 'twin', bt_steer: 'diff', bt_motor: '2848', bt_kv: '500 KV', bt_prop: '60 mm', bt_pitch: '1.0 倍', bt_cells: '4', bt_mah: '22000 mAh', bt_guard: 'shroud', bt_gps: 'rtk', bt_compass: 'mag', bt_lidar: 'none', bt_cam: 'eo', bt_sonar: 'depth', bt_wq: 'probe', bt_comm: 'telem', bt_fc: 'pixhawk', bt_lights: 'yes', bt_estop: 'yes', bt_super: 'stealth', bt_mast: 'short' },
    edu: { bt_class: 'none', bt_hull: 'vhull', bt_len: '500 mm', bt_beam: '180 mm', bt_draft: '30 mm', bt_depth: '100 mm', bt_mat: 'abs', bt_foil: '不裝', bt_drive: 'jet', bt_steer: 'vector', bt_motor: '2440', bt_kv: '1100 KV', bt_prop: '30 mm', bt_pitch: '1.0 倍', bt_cells: '2', bt_mah: '2200 mAh', bt_guard: 'none', bt_gps: 'gps', bt_compass: 'mag', bt_lidar: 'none', bt_cam: 'fpv', bt_sonar: 'none', bt_wq: 'none', bt_comm: 'rc', bt_fc: 'pixhawk', bt_lights: 'yes', bt_estop: 'yes', bt_super: 'stealth', bt_mast: 'short' },
    foil: { bt_class: 'P', bt_hull: 'foil', bt_len: '800 mm', bt_beam: '200 mm', bt_draft: '30 mm', bt_depth: '100 mm', bt_mat: 'carbon', bt_foil: '80 cm²', bt_drive: 'direct', bt_steer: 'rudder', bt_motor: '3660', bt_kv: '1500 KV', bt_prop: '40 mm', bt_pitch: '1.4 倍', bt_cells: '4', bt_mah: '5000 mAh', bt_guard: 'none', bt_gps: 'gps', bt_compass: 'mag', bt_lidar: 'none', bt_cam: 'eo', bt_sonar: 'none', bt_wq: 'none', bt_comm: 'telem', bt_fc: 'pixhawk', bt_lights: 'yes', bt_estop: 'no', bt_super: 'stealth', bt_mast: 'short' }
  };
  const opt = (id, label, options, def, extra) => Object.assign({ type: 'radio', id, label, options, def }, extra || {});
  const sel = (id, label, options, def, hint) => ({ type: 'select', id, label, options, def, hint });
  const DEF = Object.assign({ bt_name: '', bt_mission: 'survey', bt_number: '7', bt_hullno: 'USV-01', bt_c1: '#64748b', bt_c2: '#0f172a', bt_extra: '' }, PRESETS.survey);

  const steps = [
    { title: '步驟 1｜任務與賽制', why: '先決定<b>這艘無人船要做什麼</b>：同樣是無人船，遙控競速艇追求每秒 20 公尺以上的速度，自主航行船要背光達與機上電腦，水質監測船要的是續航與穩定。選好任務後按「套用建議規格」，後面四步會填好一組合理的起點，您再逐項調整。',
      steps: ['為船命名、選擇任務。', '按「⚙ 套用這個任務的建議規格」。', '選擇參賽級別與賽事編號（自由設計可選「不參賽」）。'], see: '右側 3D 立即換成這類無人船，估算表同步更新。',
      fields: [{ type: 'text', id: 'bt_name', label: '船名', ph: '例：海巡者一號' }, opt('bt_mission', '任務類型', MISSION, DEF.bt_mission), { type: 'kitpreset', id: 'bt_preset', kit: 'boat', from: 'bt_mission' },
        opt('bt_class', '參賽級別', CLASS, DEF.bt_class), { type: 'text', id: 'bt_number', label: '賽事編號（印在上層結構頂部）', ph: '例：7' }] },
    { title: '步驟 2｜船體', why: '船體決定<b>浮得起來、站得穩、跑得快</b>三件事。<b>船長</b>越長，同樣速度下興波越小；<b>船寬</b>越寬越穩但阻力越大；<b>型深</b>＝龍骨到甲板的高度，扣掉<b>吃水</b>（泡在水裡的深度）就是<b>乾舷</b>，乾舷太低浪一打就進水。',
      steps: ['選船型，觀察 3D 船殼變化。', '選船長、船寬、型深與設計吃水。', '選材質，看右側「估算總重」與「實際吃水」。', '選水翼時，記得設定水翼面積。'], see: '估算表的「實際吃水」若超過設計吃水太多，或「乾舷」太低，會出現紅字。',
      fields: [opt('bt_hull', '船型', HULL, DEF.bt_hull), sel('bt_len', '船長', ['400 mm', '500 mm', '650 mm', '800 mm', '1000 mm', '1200 mm', '1500 mm', '1800 mm'], DEF.bt_len),
        sel('bt_beam', '船寬（雙體／三體為整體外寬）', ['120 mm', '150 mm', '180 mm', '200 mm', '220 mm', '250 mm', '300 mm', '400 mm', '500 mm', '600 mm', '800 mm', '900 mm'], DEF.bt_beam),
        sel('bt_depth', '型深（龍骨到甲板）', ['60 mm', '80 mm', '100 mm', '120 mm', '150 mm', '200 mm', '250 mm', '300 mm', '400 mm'], DEF.bt_depth),
        sel('bt_draft', '設計吃水（目標）', ['20 mm', '30 mm', '40 mm', '60 mm', '80 mm', '100 mm', '150 mm', '200 mm'], DEF.bt_draft, '估算會依總重算出實際吃水，與此值比較'),
        opt('bt_mat', '船殼材質', MAT, DEF.bt_mat), sel('bt_foil', '水翼總面積（僅水翼船型使用）', ['不裝', '40 cm²', '60 cm²', '80 cm²', '120 cm²', '200 cm²', '400 cm²', '800 cm²'], DEF.bt_foil, '面積越大，起飛速度越低，但阻力與重量也增加')] },
    { title: '步驟 3｜推進系統', why: '推進四件組：<b>馬達</b>（3660＝外徑 36 mm、長 60 mm；KV＝每 1 伏特空轉幾 rpm）、<b>螺旋槳</b>（直徑 40 mm、螺距比 1.6＝每轉一圈理論前進 64 mm）、<b>電池</b>（4S＝4 顆鋰電芯串聯約 14.8 V）與<b>轉向方式</b>。螺旋槳在水中會「打滑」，實際前進距離比螺距短，這個差距稱為<b>滑脫率</b>。',
      steps: ['選推進方式與轉向方式（差速需雙推進、向量需噴水）。', '選馬達規格與 KV。', '選螺旋槳（或噴水葉輪）直徑與螺距比。', '選電池串數與容量，觀察航速、電流與續航。'], see: '「理論航速」扣掉滑脫得到「扣滑脫航速」，再與馬達功率比較，取兩者較小值。',
      fields: [opt('bt_drive', '推進方式', DRIVE, DEF.bt_drive), opt('bt_steer', '轉向方式', STEER, DEF.bt_steer), sel('bt_motor', '馬達規格（外徑×長度 mm）', Object.keys(MOTOR), DEF.bt_motor, '前兩碼＝外徑、後兩碼＝長度；越大功率越高也越重'),
        sel('bt_kv', '馬達 KV 值', ['300 KV', '500 KV', '800 KV', '1100 KV', '1500 KV', '2000 KV', '2800 KV', '3500 KV'], DEF.bt_kv),
        sel('bt_prop', '螺旋槳／葉輪直徑', ['30 mm', '35 mm', '40 mm', '45 mm', '50 mm', '60 mm', '70 mm', '90 mm'], DEF.bt_prop), sel('bt_pitch', '螺距比（螺距 ÷ 直徑）', ['1.0 倍', '1.2 倍', '1.4 倍', '1.6 倍', '1.8 倍', '2.0 倍'], DEF.bt_pitch, '螺距比越大，每轉推得越遠：速度快但馬達負擔大'),
        opt('bt_cells', '電池串數', [o('2', '2S（7.4 V）'), o('3', '3S（11.1 V）'), o('4', '4S（14.8 V）'), o('6', '6S（22.2 V）')], DEF.bt_cells),
        sel('bt_mah', '電池容量（總計）', ['1300 mAh', '2200 mAh', '3300 mAh', '5000 mAh', '8000 mAh', '10000 mAh', '16000 mAh', '22000 mAh'], DEF.bt_mah),
        opt('bt_guard', '螺旋槳護罩', [o('none', '不加（競速最輕）'), o('shroud', '導流護罩（自主賽規定要保護轉動件）')], DEF.bt_guard)] },
    { title: '步驟 4｜感測與航電', why: '感測與航電是無人船的眼睛與大腦：<b>GPS／RTK</b>（定位，RTK 可達公分級）、<b>羅盤</b>（船頭方向）、<b>光達</b>（量測浮標與障礙物距離）、<b>攝影機</b>（辨識浮標顏色）、<b>聲納</b>（量水深）、<b>水質探棒</b>、<b>通訊</b>與<b>主控</b>。本課程的無人船只配置偵察與監測感測器。',
      steps: ['選主控：純遙控、自駕儀，或自駕儀＋機上電腦。', '依任務選定位、羅盤、光達、攝影機、聲納、水質探棒。', '選通訊方式。', '設定航行燈與緊急停止開關。'], see: '3D 的感測桅桿、雷達罩、攝影機、天線、航行燈與船底聲納會跟著出現。',
      fields: [opt('bt_fc', '主控', [o('rx', '只有接收機（純遙控）', '競速艇常見'), o('pixhawk', '自駕儀（航點巡航）', '開源自駕儀可跑 GPS 航點與回家'), o('companion', '自駕儀＋機上電腦', '跑影像辨識與避障，自主賽常見')], DEF.bt_fc),
        opt('bt_gps', '定位', [o('none', '不裝'), o('gps', 'GPS（約公尺級）'), o('rtk', 'RTK GNSS（公分級）')], DEF.bt_gps), opt('bt_compass', '航向感測', [o('none', '不裝'), o('mag', '電子羅盤', '便宜，怕馬達磁場干擾'), o('dual', '雙天線 GNSS 航向', '不受磁場影響')], DEF.bt_compass),
        opt('bt_lidar', '光達', [o('none', '不裝'), o('2d', '2D 掃描光達', '量測水平一圈距離'), o('3d', '3D 光達', '浮標、碼頭立體點雲')], DEF.bt_lidar),
        opt('bt_cam', '攝影機', [o('none', '不裝'), o('fpv', 'FPV 小鏡頭', '遙控操作用'), o('eo', '光電攝影機（雲台）', '巡查與影像紀錄'), o('stereo', '雙目深度相機', '辨識顏色＋距離')], DEF.bt_cam),
        opt('bt_sonar', '聲納', [o('none', '不裝'), o('depth', '單波束測深', '量水深'), o('side', '側掃聲納', '水下地形影像')], DEF.bt_sonar), opt('bt_wq', '水質探棒', [o('none', '不裝'), o('probe', '多參數探棒', '水溫、pH、濁度、溶氧')], DEF.bt_wq),
        opt('bt_comm', '通訊', [o('rc', '2.4 GHz 遙控', '只有操控'), o('telem', '數傳電台', '回傳位置與數據'), o('wifi', 'Wi-Fi 網橋', '頻寬大，可回傳影像'), o('lte', '行動網路', '距離不受限，需訊號')], DEF.bt_comm),
        opt('bt_lights', '航行燈（左紅右綠、船尾白）', [o('yes', '裝'), o('no', '不裝')], DEF.bt_lights), opt('bt_estop', '緊急停止開關', [o('yes', '船上紅色按鈕＋遙控停止'), o('no', '不裝')], DEF.bt_estop)] },
    { title: '步驟 5｜外觀與上層結構', why: 'USV 的造型語言：<b>多面隱身船殼</b>（平面拼接、硬舭稜線）、<b>稜角上層結構</b>、<b>感測桅桿</b>。主色用於船殼，副色用於上層結構與色帶。船號印在船首兩側，方便岸上辨識。',
      steps: ['選上層結構造型與桅桿高度。', '選主色與副色。', '輸入船號；其他想法寫在「額外要求」，AI 建模時會照做。'], see: '3D 外觀即時換色，船首兩側出現船號。',
      fields: [opt('bt_super', '上層結構', [o('stealth', '稜角隱身艙', '斜面拼接、深色窗帶'), o('low', '低矮競速罩', '風阻小、重心低'), o('open', '開放式感測平台', '框架與平板，好裝好拆')], DEF.bt_super),
        opt('bt_mast', '感測桅桿', [o('none', '不裝'), o('short', '短桅桿'), o('tall', '高桅桿（視野遠，重心較高）')], DEF.bt_mast),
        opt('bt_c1', '主色（船殼）', COLORS, DEF.bt_c1), opt('bt_c2', '副色（上層結構）', COLORS, DEF.bt_c2), { type: 'text', id: 'bt_hullno', label: '船號（印在船首兩側）', ph: '例：USV-01' },
        { type: 'area', id: 'bt_extra', label: '額外要求（可不填）', ph: '例：上層結構側面加校徽、船尾加反光條', rows: 3 }] }
  ];

  const num = v => parseFloat(String(v == null ? '' : v)) || 0;
  const label = (arr, v) => ((arr.find(x => x.v === v) || {}).l || v);
  function spec(f) {
    f = f || {};
    const gv = k => (f[k] != null && f[k] !== '' && !(Array.isArray(f[k]) && !f[k].length)) ? f[k] : DEF[k];
    const s = {
      kind: 'boat', name: String(gv('bt_name') || '').trim() || '我的無人船', mission: gv('bt_mission'), cls: gv('bt_class'), number: String(gv('bt_number') || ''), hullno: String(gv('bt_hullno') || ''),
      hull: gv('bt_hull'), len: num(gv('bt_len')), beam: num(gv('bt_beam')), depth: num(gv('bt_depth')), draft: num(gv('bt_draft')), mat: gv('bt_mat'), foil: num(gv('bt_foil')),
      drive: gv('bt_drive'), steer: gv('bt_steer'), motor: String(gv('bt_motor')), kv: num(gv('bt_kv')), prop: num(gv('bt_prop')), pitch: num(gv('bt_pitch')), cells: num(gv('bt_cells')), mah: num(gv('bt_mah')), guard: gv('bt_guard'),
      fc: gv('bt_fc'), gps: gv('bt_gps'), compass: gv('bt_compass'), lidar: gv('bt_lidar'), cam: gv('bt_cam'), sonar: gv('bt_sonar'), wq: gv('bt_wq'), comm: gv('bt_comm'), lights: gv('bt_lights') === 'yes', estop: gv('bt_estop') === 'yes',
      sup: gv('bt_super'), mast: gv('bt_mast'), c1: gv('bt_c1'), c2: gv('bt_c2'), extra: String(gv('bt_extra') || '')
    };
    if (!MOTOR[s.motor]) s.motor = '2848';
    if (!SLIP[s.hull]) s.hull = 'vhull';
    if (s.hull === 'foil' && !s.foil) s.foil = 80;
    return s;
  }
  // 幾何：船身配置（毫米）。前方＝+z、上方＝+y、右舷＝−x；龍骨 y＝0
  function geom(s) {
    const L = s.len, B = s.beam, D = s.depth, hulls = [];
    if (s.hull === 'cat') { const b = B * 0.24; [-1, 1].forEach(sx => hulls.push({ x: sx * (B / 2 - b / 2), b, L, D, y0: 0, main: true })); }
    else if (s.hull === 'tri') { hulls.push({ x: 0, b: B * 0.38, L, D, y0: 0, main: true }); const b = B * 0.14; [-1, 1].forEach(sx => hulls.push({ x: sx * (B / 2 - b / 2), b, L: L * 0.6, D: D * 0.62, y0: D * 0.38, z: -L * 0.08, ama: true })); }
    else hulls.push({ x: 0, b: B, L, D, y0: 0, main: true });
    const mains = hulls.filter(h => h.main), deckW = s.hull === 'cat' ? B : mains[0].b;
    const supH = { stealth: Math.max(40, L * 0.085), low: Math.max(22, L * 0.04), open: Math.max(30, L * 0.07) }[s.sup] || 40;
    const mastH = { none: 0, short: L * 0.13, tall: L * 0.24 }[s.mast] || 0;
    const nMotor = s.drive === 'twin' ? 2 : 1;
    const strut = s.hull === 'foil' ? Math.max(60, D * 1.1) : 0;
    return { L, B, D, hulls, mains, deckW, supH, mastH, nMotor, strut, height: D + supH + mastH + (s.mast !== 'none' ? L * 0.04 : 0) };
  }
  const lerpTab = (tab, x) => { if (x <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) { const [x0, y0] = tab[i - 1], [x1, y1] = tab[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return tab[tab.length - 1][1]; };
  // 剩餘阻力（興波＋滑行誘導阻力）÷ 重量，對福祿數查表
  const RES = { mono: [[0, 0], [0.3, 0.01], [0.5, 0.07], [0.7, 0.1], [1, 0.09], [1.5, 0.075], [3, 0.07], [10, 0.07]], cat: [[0, 0], [0.3, 0.012], [0.5, 0.05], [0.7, 0.06], [1, 0.05], [1.5, 0.045], [3, 0.045], [10, 0.045]] };
  const WETF = { mono: [[0, 1], [0.8, 1], [2, 0.2], [10, 0.2]], cat: [[0, 1], [1, 1], [2, 0.75], [10, 0.7]], tri: [[0, 1], [0.8, 1], [2, 0.45], [10, 0.4]] };

  function calc(s) {
    const G = geom(s), L = s.len / 1000, B = s.beam / 1000, D = s.depth / 1000, M = MOTOR[s.motor], areal = AREAL[s.mat] || 1400;
    const w = {};
    // 船殼：每個船身＝底與舷側＋甲板；雙體加連接甲板、三體加橫樑
    w.hull = G.hulls.reduce((a, h) => a + (h.L / 1000) * ((h.b / 1000) + 2 * (h.D / 1000)) * 0.9 * areal + (h.L / 1000) * (h.b / 1000) * 0.8 * areal * 0.6, 0);
    if (s.hull === 'cat') w.hull += L * 0.75 * (B - 2 * G.hulls[0].b / 1000) * areal * 0.7;
    if (s.hull === 'tri') w.hull += 2 * B * 0.05 * L * areal * 1.2;
    const sw = G.deckW / 1000 * (s.hull === 'cat' ? 0.5 : 0.62), sd = L * 0.32, sh = G.supH / 1000;
    w.sup = (sw * sd + 2 * (sw + sd) * sh) * areal * (s.sup === 'open' ? 0.45 : 0.6);
    w.mast = { none: 0, short: 30 + s.len * 0.05, tall: 60 + s.len * 0.1 }[s.mast] || 0;
    const Sf = s.hull === 'foil' ? s.foil * 1e-4 : 0;
    w.foil = s.hull === 'foil' ? Sf * 8000 + 2 * G.strut * 0.35 : 0;
    w.motors = G.nMotor * M.g;
    const hw = s.drive === 'jet' ? 120 + s.prop * 4 : 40 + s.len * 0.08;
    w.drive = G.nMotor * (hw + (s.guard === 'shroud' ? 30 + s.prop * 1.2 : 0) + 20 + M.cap * 0.04) + (s.steer === 'rudder' ? 25 + s.len * 0.02 : 0);
    const Wh = s.mah / 1000 * 3.7 * s.cells; w.battery = Wh / 0.15;
    const E = {
      fc: { rx: [15, 0.5], pixhawk: [80, 2.5], companion: [380, 14] }[s.fc] || [15, 0.5], gps: { none: [0, 0], gps: [30, 0.5], rtk: [150, 2] }[s.gps] || [0, 0], compass: { none: [0, 0], mag: [10, 0.1], dual: [200, 3] }[s.compass] || [0, 0],
      lidar: { none: [0, 0], '2d': [190, 3], '3d': [830, 12] }[s.lidar] || [0, 0], cam: { none: [0, 0], fpv: [15, 1.5], eo: [450, 8], stereo: [160, 4] }[s.cam] || [0, 0], sonar: { none: [0, 0], depth: [120, 2], side: [900, 15] }[s.sonar] || [0, 0],
      wq: { none: [0, 0], probe: [350, 2] }[s.wq] || [0, 0], comm: { rc: [15, 0.5], telem: [40, 1.5], wifi: [90, 4], lte: [120, 5] }[s.comm] || [15, 0.5], lights: s.lights ? [20 + s.len * 0.02, 2] : [0, 0], estop: s.estop ? [40 + s.len * 0.05, 0.5] : [0, 0]
    };
    w.elec = Object.values(E).reduce((a, x) => a + x[0], 0);
    const hotel = Object.values(E).reduce((a, x) => a + x[1], 0);
    const Wg = Object.values(w).reduce((a, b) => a + b, 0), Wkg = Wg / 1000, WN = Wkg * g, V = Wkg / RHO; // 排水體積 m³（淡水）
    // 吃水：V＝Cb × Lwl × Bwl × T × 船身數（只算主船身）
    const Lwl = L * 0.92, mains = G.mains, bwl = mains[0].b / 1000 * (s.hull === 'cat' ? 0.9 : 0.86), Cb = CB[s.hull];
    const T = V / (Cb * Lwl * bwl * mains.length), freeboard = D - T;
    let Vtot = mains.reduce((a, h) => a + 0.55 * (h.L / 1000) * (h.b / 1000) * (h.D / 1000), 0);
    if (s.hull === 'tri') Vtot += 2 * 0.5 * (G.hulls[1].L / 1000) * (G.hulls[1].b / 1000) * (G.hulls[1].D / 1000);
    const reserve = Vtot / V - 1;
    // 重心高度 KG（從龍骨量起，m）
    const sh2 = G.supH / 1000, mh = G.mastH / 1000;
    const mom = [[w.hull, D * 0.45], [w.sup, D + sh2 * 0.45], [w.mast, D + sh2 + mh * 0.5], [w.foil, -G.strut / 1000 * 0.7], [w.motors, D * 0.3], [w.drive, D * 0.15], [w.battery, D * 0.28],
      [E.fc[0] + E.comm[0] + E.estop[0], D * 0.6], [E.gps[0] + E.compass[0] + E.lights[0], s.mast !== 'none' ? D + sh2 + mh : D + sh2], [E.lidar[0], s.lidar === '3d' && s.mast !== 'none' ? D + sh2 + mh * 0.8 : D + sh2 * 0.5],
      [E.cam[0], D + sh2 * 0.6], [E.sonar[0], -0.01], [E.wq[0], D * 0.2]];
    const KG = mom.reduce((a, x) => a + x[0] * x[1], 0) / Wg, KB = T * 0.58;
    let I;
    if (s.hull === 'cat') { const h = mains[0], b = bwl, y = Math.abs(h.x) / 1000; I = 2 * (0.55 * Lwl * b * b * b / 12 + 0.7 * Lwl * b * y * y); }
    else I = 0.55 * Lwl * bwl * bwl * bwl / 12;
    const GM = KB + I / V - KG;
    // 推進：理論航速＝螺距 × 轉速；扣滑脫；再與功率比較
    const volt = s.cells * 3.7, rpm = s.kv * volt * 0.85, pitchM = s.prop / 1000 * s.pitch;
    const vTh = pitchM * rpm / 60, slip = SLIP[s.hull] + (s.drive === 'jet' ? 0.1 : 0) + (s.guard === 'shroud' ? -0.03 : 0), vSlip = vTh * (1 - slip);
    const etaP = (s.drive === 'jet' ? 0.35 : 0.5) * (s.guard === 'shroud' ? 0.95 : 1), etaM = 0.85, Pcap = M.cap * G.nMotor * 0.85;
    const fam = s.hull === 'cat' ? 'cat' : 'mono', wfam = s.hull === 'cat' ? 'cat' : s.hull === 'tri' ? 'tri' : 'mono';
    const Swet0 = mains.reduce((a, h) => a + 0.8 * (h.L / 1000 * 0.92) * (bwl + 2 * T), 0);
    const vTO = Sf > 0 ? Math.sqrt(2 * WN / (RHO * Sf * FOIL_CL)) : 0;
    const R = v => {
      const Fn = v / Math.sqrt(g * Lwl);
      if (s.hull === 'foil' && v >= vTO) return WN * 0.085 + 0.5 * RHO * CF * (Sf * 2.2 + 2 * (G.strut / 1000) * 0.03) * v * v;
      const r = WN * lerpTab(RES[fam], Fn) * (s.hull === 'tri' ? 0.9 : 1) * (s.hull === 'foil' ? 1.15 : 1);
      return r + 0.5 * RHO * CF * Swet0 * lerpTab(WETF[wfam], Fn) * v * v * (s.hull === 'foil' ? 1.2 : 1);
    };
    const Pel = v => R(v) * v / (etaP * etaM);
    let vMax = 0, humpStuck = false;
    for (let v = 0.05; v <= vSlip + 1e-9; v += 0.05) { if (Pel(v) > Pcap) { humpStuck = true; break; } vMax = v; }
    const powerLimited = humpStuck && vMax < vSlip - 0.06;
    const Fn = vMax / Math.sqrt(g * Lwl), PfullEl = Pel(vMax), Ifull = (PfullEl + hotel) / volt, Cneed = Ifull / (s.mah / 1000);
    const regime = s.hull === 'foil' && vTO && vMax >= vTO ? '水翼升起（船身離水）' : Fn < 0.4 ? '排水航行' : Fn < 1.0 ? (s.hull === 'cat' ? '半排水（細長船身穿浪）' : '過渡區（越過阻力峰中）') : (s.hull === 'cat' ? '高速半排水（雙體不靠滑行）' : '滑行（船身半出水）');
    const race = /^rc/.test(s.mission);
    let vC = race ? vMax * 0.6 : Math.min(vMax * 0.6, 1.5);
    if (s.hull === 'foil' && vTO && vMax >= vTO * 1.1) vC = Math.max(vC, Math.min(vMax * 0.8, vTO * 1.3));
    const PcEl = Pel(vC) + hotel;
    const tFull = Wh * 0.8 / (PfullEl + hotel) * 60, tCruise = Wh * 0.8 / PcEl * 60, rangeKm = vC * tCruise * 60 / 1000;
    const Hgt = (G.height + (s.hull === 'foil' ? G.strut : 0)) / 1000;
    const lb = Wkg * 2.20462;
    const rbScore = lb > 140 ? null : lb > 110 ? -250 - 5 * (lb - 110) : lb > 70 ? 2 * (110 - lb) : 80 + (70 - lb);
    const BL = s.beam / s.len;

    const warns = [], goods = [];
    if (T >= D) warns.push(`估算吃水 ${(T * 1000).toFixed(0)} mm 已超過型深 ${s.depth} mm：<b>船會沉</b>。加大船長、船寬或型深，或減輕重量。`);
    else if (freeboard < Math.max(0.025, D * 0.3)) warns.push(`乾舷只剩 ${(freeboard * 1000).toFixed(0)} mm：浪一打就上甲板，<b>容易進水</b>。加大型深或減重。`);
    if (T > s.draft / 1000 * 1.5) warns.push(`實際吃水 ${(T * 1000).toFixed(0)} mm 比設計吃水 ${s.draft} mm 深很多：船太重或船體太小。`);
    if (reserve < 0.6 && T < D) warns.push(`儲備浮力只有 ${(reserve * 100).toFixed(0)}%（建議 ≥ 100%）：載重或進水時餘裕不足。`);
    if (GM <= 0) warns.push(`穩心高度 GM ${(GM * 1000).toFixed(0)} mm ≤ 0：<b>船會自己翻覆</b>。降低桅桿與重物位置，或改雙體／加寬。`);
    else if (GM / B < 0.12 && s.hull !== 'cat') warns.push(`穩心高度 GM 只有 ${(GM * 1000).toFixed(0)} mm（船寬的 ${(GM / B * 100).toFixed(0)}%）：<b>穩性偏低</b>，轉彎或側浪容易翻，建議加寬、降低重心或改雙體。`);
    if (s.hull === 'vhull' && BL < 0.17) warns.push(`船寬／船長只有 ${BL.toFixed(2)}：單體船太細長，靜止時容易側翻（常見 0.2～0.35）。`);
    if (s.hull === 'cat' && BL < 0.3) warns.push(`雙體船外寬／船長 ${BL.toFixed(2)} 偏窄：兩船身間距太小，雙體穩性優勢發揮不出來。`);
    if (s.steer === 'diff' && s.drive !== 'twin') warns.push('差速轉向需要<b>雙推進</b>：請把推進方式改成「雙推進」。');
    if (s.steer === 'vector' && s.drive !== 'jet') warns.push('向量轉向需要<b>噴水推進</b>：請把推進方式改成「噴水推進」，或改用舵。');
    if (s.drive === 'jet' && s.steer === 'rudder') warns.push('噴水推進通常用噴嘴轉向（向量轉向），船尾沒有螺旋槳水流可以給舵使用。');
    if (powerLimited && vMax < vSlip * 0.7) warns.push(`螺距 × 轉速要求 ${vSlip.toFixed(1)} m/s，但馬達功率只推得到約 ${vMax.toFixed(1)} m/s：<b>馬達帶不動這組螺旋槳</b>，降低 KV／螺距或換大一號馬達。`);
    if (race && s.hull !== 'cat' && s.hull !== 'foil' && Fn < 1.0) warns.push(`福祿數只有 ${Fn.toFixed(2)}：競速艇沒有進入滑行，速度上不去。加大功率、減輕重量。`);
    if (s.hull === 'foil') {
      if (vMax < vTO * 1.1) warns.push(`水翼起飛速度 ${vTO.toFixed(1)} m/s，但估算最高航速只有 ${vMax.toFixed(1)} m/s：<b>船身升不起來</b>，水翼只是累贅。加大水翼面積或推進功率。`);
      else goods.push(`航速 ${vMax.toFixed(1)} m/s 超過起飛速度 ${vTO.toFixed(1)} m/s，船身可以離水。`);
      if (s.foil > 0 && Sf * 1e4 / (s.len * s.beam / 100) > 0.6) warns.push('水翼面積相對船體偏大：起飛快但高速阻力大、重量增加。');
    } else if (s.foil > 0) goods.push('選了水翼面積，但船型不是水翼，估算會忽略水翼。');
    if (Cneed > 60) warns.push(`滿載約 ${Ifull.toFixed(0)} A，電池需 ${Cneed.toFixed(0)}C 以上：<b>放電倍率吃緊</b>，加大容量或降 KV。`);
    if (PfullEl > M.cap * G.nMotor) warns.push(`滿載功率 ${PfullEl.toFixed(0)} W 超過馬達建議值 ${M.cap * G.nMotor} W：馬達過熱，需水冷或換大馬達。`);
    if (s.cls === 'N' && s.cells !== 2) warns.push(`N 級規定 2 顆鋰電芯（2S），目前是 ${s.cells}S。`);
    if (s.cls === 'P' && (s.cells < 3 || s.cells > 4)) warns.push(`P 級規定 3～4 顆鋰電芯，目前是 ${s.cells}S。`);
    if (s.cls === 'Q' && (s.cells < 5 || s.cells > 6)) warns.push(`Q 級規定 5～6 顆鋰電芯，目前是 ${s.cells}S。`);
    if (/^rc/.test(s.mission) && s.cls !== 'none' && !/^[NPQ]$/.test(s.cls)) warns.push('遙控競速建議選一個電池級別（N／P／Q），才能和同級船比賽。');
    if (s.mission === 'roboboat' || s.cls === 'auto') {
      if (s.len > 1829 || s.beam > 914 || Hgt > 0.914) warns.push(`尺寸 ${s.len}×${s.beam}×${(Hgt * 1000).toFixed(0)} mm 超出 RoboBoat 6×3×3 英尺（約 1829×914×914 mm）的箱子：<b>會被取消資格</b>。`);
      if (lb > 140) warns.push(`估算 ${lb.toFixed(0)} 磅超過 RoboBoat 140 磅上限：<b>會被取消資格</b>。`);
      else if (lb > 110) warns.push(`估算 ${lb.toFixed(0)} 磅介於 110～140 磅：RoboBoat 重量分為負分（${rbScore.toFixed(0)}）。`);
      else goods.push(`估算 ${lb.toFixed(0)} 磅，RoboBoat 2026 重量分約 ${rbScore.toFixed(0)} 分（越輕越高）。`);
      if (!s.estop) warns.push('RoboBoat 規定船上硬體急停＋無線遙控急停兩套，且必須直接切斷推進器電源：請裝緊急停止開關。');
      if (s.guard !== 'shroud' && s.drive !== 'jet') warns.push('RoboBoat 規定所有轉動件都要保護，螺旋槳需加護罩。');
      if (s.fc !== 'companion') warns.push('自主任務（辨識浮標顏色、避障、停靠）需要機上電腦跑影像與決策。');
      if (s.lidar === 'none' && s.cam !== 'stereo') warns.push('避障與停靠需要量距離：建議裝光達或雙目深度相機。');
      if (s.gps === 'none') warns.push('任務要回報經緯度位置：需要 GPS。');
      if (s.comm === 'rc') warns.push('任務要傳訊息到賽方伺服器：需要數傳、Wi-Fi 或行動網路。');
    }
    if (s.mission === 'survey') {
      if (s.wq === 'none') warns.push('水質監測任務需要水質探棒。');
      if (s.gps === 'none') warns.push('監測數據要附上座標：需要 GPS（建議 RTK）。');
      if (s.fc === 'rx') warns.push('航點巡航需要自駕儀，純遙控做不到自動來回測線。');
      if (tCruise < 60) warns.push(`巡航續航只有 ${tCruise.toFixed(0)} 分鐘：監測一趟通常要 1 小時以上，加大電池。`);
      if (s.comm === 'rc') warns.push('監測數據要即時回傳：建議數傳電台或行動網路。');
    }
    if (s.mission === 'edu') {
      if (vMax > 4) warns.push(`教育用船最高約 ${vMax.toFixed(1)} m/s 偏快：教室水池建議 3 m/s 以下，降 KV 或螺距。`);
      if (!s.estop) warns.push('教育用船建議裝緊急停止開關，學員失控時可立即斷電。');
      if (s.drive !== 'jet' && s.guard !== 'shroud') warns.push('教學場合建議用噴水推進或加螺旋槳護罩，避免手指受傷。');
    }
    if (s.mission === 'foil' && s.hull !== 'foil') warns.push('水翼示範艇的船型要選「水翼」。');
    if (!race && !s.lights && s.mission !== 'edu') warns.push('在開放水域航行，建議裝航行燈（左紅右綠、船尾白），讓其他船看得到您的方向。');
    if ((s.mission === 'survey' || s.mission === 'roboboat') && s.compass === 'mag' && s.drive !== 'jet') goods.push('提醒：電子羅盤要遠離馬達與電源線，避免磁場干擾。');
    if (s.mat === 'foam') goods.push('泡棉夾層船殼：破損也不會沉，適合教學與監測。');
    if (s.hull === 'cat') goods.push(`雙體船穩心高度約 ${(GM * 1000).toFixed(0)} mm，橫向穩性非常好。`);
    if (!warns.length) goods.push('沒有發現衝突，可以交給 AI 建模了！');

    const rows = [
      ['估算總重（排水量）', Wkg.toFixed(2) + ' kg', `船殼 ${w.hull.toFixed(0)}＋上層 ${(w.sup + w.mast).toFixed(0)}＋推進 ${(w.motors + w.drive).toFixed(0)}＋電池 ${w.battery.toFixed(0)}＋航電感測 ${w.elec.toFixed(0)}${w.foil ? '＋水翼 ' + w.foil.toFixed(0) : ''} g；排水體積 ${(V * 1000).toFixed(1)} L（淡水）`],
      ['實際吃水／乾舷', `${(T * 1000).toFixed(0)}／${(freeboard * 1000).toFixed(0)} mm`, `吃水＝排水體積 ÷（方形係數 ${Cb} × 水線長 × 水線寬）；乾舷＝型深 − 吃水`],
      ['儲備浮力', (reserve * 100).toFixed(0) + '%', '船殼全部沒入可提供的浮力 ÷ 重量 − 1'],
      ['理論／扣滑脫航速', `${vTh.toFixed(1)}／${vSlip.toFixed(1)} m/s`, `螺距 ${(pitchM * 1000).toFixed(0)} mm × ${(rpm / 1000).toFixed(1)} 千 rpm ÷ 60；滑脫率 ${(slip * 100).toFixed(0)}%`],
      ['估算最高航速', `${vMax.toFixed(1)} m/s（${(vMax * 3.6).toFixed(0)} km/h）`, powerLimited ? `受馬達功率限制（可用約 ${Pcap.toFixed(0)} W）` : '由螺距 × 轉速決定（功率尚有餘裕）'],
      ['福祿數／航行狀態', `${Fn.toFixed(2)}｜${regime}`, 'Fn＝航速 ÷ √(g × 水線長)；約 0.4 以下排水、1.0 以上可滑行'],
      ...(s.hull === 'foil' ? [['水翼起飛速度', vTO.toFixed(1) + ' m/s', `升力＝½ρv²×面積 ${s.foil} cm²×升力係數 ${FOIL_CL}，升力＝重量時船身離水`]] : []),
      ['穩心高度 GM', `${(GM * 1000).toFixed(0)} mm（${GM <= 0 ? '會翻覆' : GM / B < 0.12 ? '偏低' : GM / B < 0.3 ? '普通' : GM / B < 1 ? '良好' : '非常穩'}）`, `浮心 ${(KB * 1000).toFixed(0)}＋穩心半徑 ${(I / V * 1000).toFixed(0)}−重心 ${(KG * 1000).toFixed(0)} mm；船寬／船長 ${BL.toFixed(2)}`],
      ['滿載功率／電流', `${PfullEl.toFixed(0)} W／${Ifull.toFixed(0)} A`, `需電池放電倍率約 ${Cneed.toFixed(0)}C；航電耗電 ${hotel.toFixed(1)} W`],
      ['續航（全速／巡航）', `${tFull.toFixed(0)}／${tCruise.toFixed(0)} 分`, `電池 ${Wh.toFixed(0)} Wh × 80%；巡航 ${vC.toFixed(1)} m/s，航程約 ${rangeKm.toFixed(1)} km`],
      ['外形尺寸', `${s.len}×${s.beam}×${(Hgt * 1000).toFixed(0)} mm`, '長×寬×高（含桅桿與水翼）']
    ];
    if (s.mission === 'roboboat' || s.cls === 'auto') rows.push(['RoboBoat 重量分', rbScore == null ? '取消資格' : rbScore.toFixed(0) + ' 分', `${lb.toFixed(0)} 磅；依 RoboBoat 2026 手冊重量公式`]);
    return { W: Wkg, T, freeboard, reserve, GM, KG, vTh, vSlip, vMax, vTO, Fn, regime, rows, warns, goods, w, hotel };
  }
  function md(s) {
    const c = calc(s), M = MOTOR[s.motor];
    return `# ${s.name}｜無人船（USV）規格書

| 項目 | 規格 |
|---|---|
| 任務 | ${label(MISSION, s.mission)} |
| 級別／賽事編號／船號 | ${label(CLASS, s.cls)}／${s.number || '—'}／${s.hullno || '—'} |
| 船型 | ${label(HULL, s.hull)} |
| 船長×船寬×型深 | ${s.len}×${s.beam}×${s.depth} mm |
| 設計吃水 | ${s.draft} mm |
| 船殼材質 | ${label(MAT, s.mat)} |
| 水翼面積 | ${s.hull === 'foil' ? s.foil + ' cm²' : '不裝'} |
| 推進方式／轉向 | ${label(DRIVE, s.drive)}／${label(STEER, s.steer)} |
| 馬達 | ${s.motor}（外徑 ${M.d}×長 ${M.l} mm）${s.kv} KV × ${s.drive === 'twin' ? 2 : 1} |
| 螺旋槳／葉輪 | 直徑 ${s.prop} mm × 螺距比 ${s.pitch}（螺距 ${(s.prop * s.pitch).toFixed(0)} mm）${s.guard === 'shroud' ? '，加導流護罩' : ''} |
| 電池 | ${s.cells}S ${s.mah} mAh |
| 主控／通訊 | ${s.fc}／${s.comm} |
| 定位／航向 | ${s.gps}／${s.compass} |
| 光達／攝影機 | ${s.lidar}／${s.cam} |
| 聲納／水質探棒 | ${s.sonar}／${s.wq} |
| 航行燈／緊急停止 | ${s.lights ? '有（左紅右綠、船尾白）' : '無'}／${s.estop ? '有' : '無'} |
| 上層結構／桅桿 | ${s.sup}／${s.mast} |
| 主色／副色 | ${s.c1}／${s.c2} |
| 用途限制 | 僅配置偵察與監測感測器，不配置武器 |
| 額外要求 | ${s.extra || '無'} |

## 教學估算（簡化公式，非特定產品實測）

| 項目 | 數值 | 說明 |
|---|---|---|
${c.rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} |`).join('\n')}

## 檢查結果

${c.warns.map(x => '- ⚠ ' + x.replace(/<[^>]+>/g, '')).join('\n') || '- 無警告'}
${c.goods.map(x => '- ✅ ' + x.replace(/<[^>]+>/g, '')).join('\n')}
`;
  }
  K.boat = { k: 'boat', name: '無人船', prefix: 'bt_', steps, PRESETS, presetField: 'bt_mission', DEF, spec, calc, md, geom, MISSION, MOTOR, HULL, SLIP };
})();
