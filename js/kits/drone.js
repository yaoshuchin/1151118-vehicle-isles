/* 無人機 3D 建模生成器：欄位定義、任務預設、規格正規化、教學估算（classic script，簡報與 lab.html 共用）
 * 介面（三種載具一致）：KITS.<k> = { k, name, prefix, steps, PRESETS, presetField, spec(f), calc(s), md(s), geom?(s) }
 * 所有數字都是「教學估算」：用簡化公式讓學員看懂取捨，不是特定產品規格。
 */
(function () {
  const K = window.KITS = window.KITS || {};
  const o = (v, l, s) => ({ v, l, s });
  const COLORS = [o('#ef4444', '紅'), o('#2563eb', '藍'), o('#16a34a', '綠'), o('#f59e0b', '橘黃'), o('#7c3aed', '紫'), o('#0f172a', '碳黑'), o('#e5e7eb', '亮銀'), o('#ec4899', '桃紅')];
  const MISSION = [
    o('soccer20', '無人機足球 Class 20', '20 cm 球籠、5 對 5、機重 ≤ 110 g'),
    o('soccer40', '無人機足球 Class 40', '40 cm 球籠、5 對 5、機重 ≤ 1100 g'),
    o('race5', 'FPV 競速穿越機（5 吋）', '穿門、繞旗、計時賽'),
    o('whoop', '室內教育機（Tiny Whoop）', '65 mm、涵道護槳、教室可飛'),
    o('cine', '空拍電影機（Cinewhoop）', '3 吋涵道、數位圖傳、穩定畫面'),
    o('long7', '長航程巡航機（7 吋）', 'GPS 回家、續航優先')
  ];
  const PRESETS = {
    soccer20: { dr_layout: 'cage', dr_wb: '95 mm', dr_plate: '2 mm', dr_armw: '6 mm', dr_mat: 'pc', dr_standoff: '15 mm', dr_motor: '1103', dr_kv: '11000 KV', dr_prop: '1.6 吋', dr_blades: '4', dr_pitch: '1.4 吋', dr_cells: '2', dr_mah: '450 mAh', dr_fc: 'F4', dr_esc: 'aio', dr_rx: 'elrs24', dr_vtx: 'none', dr_tilt: '0°', dr_gps: 'no', dr_led: 'full', dr_cage: 'ball20', dr_canopy: 'none' },
    soccer40: { dr_layout: 'cage', dr_wb: '250 mm', dr_plate: '4 mm', dr_armw: '12 mm', dr_mat: 'carbon', dr_standoff: '25 mm', dr_motor: '2306', dr_kv: '1700 KV', dr_prop: '5 吋', dr_blades: '3', dr_pitch: '3.5 吋', dr_cells: '4', dr_mah: '1300 mAh', dr_fc: 'F4', dr_esc: '4in1', dr_rx: 'elrs24', dr_vtx: 'none', dr_tilt: '0°', dr_gps: 'no', dr_led: 'full', dr_cage: 'ball40', dr_canopy: 'basic' },
    race5: { dr_layout: 'stretch', dr_wb: '225 mm', dr_plate: '5 mm', dr_armw: '12 mm', dr_mat: 'carbon', dr_standoff: '30 mm', dr_motor: '2207', dr_kv: '1700 KV', dr_prop: '5.1 吋', dr_blades: '3', dr_pitch: '4.3 吋', dr_cells: '6', dr_mah: '1100 mAh', dr_fc: 'F7', dr_esc: '4in1', dr_rx: 'elrs24', dr_vtx: 'analog', dr_tilt: '35°', dr_gps: 'no', dr_led: 'arm', dr_cage: 'none', dr_canopy: 'aero' },
    whoop: { dr_layout: 'trueX', dr_wb: '65 mm', dr_plate: '1.5 mm', dr_armw: '6 mm', dr_mat: 'pc', dr_standoff: '15 mm', dr_motor: '0802', dr_kv: '19000 KV', dr_prop: '1.2 吋', dr_blades: '4', dr_pitch: '1.4 吋', dr_cells: '1', dr_mah: '300 mAh', dr_fc: 'F4', dr_esc: 'aio', dr_rx: 'elrs24', dr_vtx: 'analog', dr_tilt: '15°', dr_gps: 'no', dr_led: 'arm', dr_cage: 'duct', dr_canopy: 'basic' },
    cine: { dr_layout: 'trueX', dr_wb: '150 mm', dr_plate: '3 mm', dr_armw: '10 mm', dr_mat: 'carbon', dr_standoff: '25 mm', dr_motor: '1404', dr_kv: '3800 KV', dr_prop: '3 吋', dr_blades: '5', dr_pitch: '2.5 吋', dr_cells: '4', dr_mah: '850 mAh', dr_fc: 'F7', dr_esc: '4in1', dr_rx: 'elrs24', dr_vtx: 'digital', dr_tilt: '10°', dr_gps: 'no', dr_led: 'none', dr_cage: 'duct', dr_canopy: 'basic' },
    long7: { dr_layout: 'trueX', dr_wb: '315 mm', dr_plate: '5 mm', dr_armw: '14 mm', dr_mat: 'carbon', dr_standoff: '30 mm', dr_motor: '2806', dr_kv: '1300 KV', dr_prop: '7 吋', dr_blades: '2', dr_pitch: '4 吋', dr_cells: '6', dr_mah: '3000 mAh', dr_fc: 'H7', dr_esc: '4in1', dr_rx: 'elrs915', dr_vtx: 'digital', dr_tilt: '20°', dr_gps: 'yes', dr_led: 'none', dr_cage: 'none', dr_canopy: 'aero' }
  };
  const LAYOUT = [o('trueX', '正 X 型（True X）', '四顆馬達對稱，各方向手感一致'), o('wideX', '寬 X 型（Wide X）', '左右較寬，鏡頭前方不會拍到槳'), o('stretch', '長 X 型（Stretch X）', '前後較長，高速俯衝時更穩'), o('H', 'H 型', '兩根縱樑，電池與電子好收納'), o('cage', '足球球籠一體式', '機架包在經緯線球籠裡，可安全碰撞')];
  const MAT = [o('carbon', '碳纖維板', '最輕最硬，競速主流'), o('nylon', '尼龍 3D 列印', '便宜、好修，略重'), o('alu', '鋁合金', '耐撞但重'), o('pc', 'PC 塑膠一體成型', '教育機、足球機常用，有彈性')];
  const MOTOR = { '0802': { d: 8, h: 2, g: 2, cap: 55 }, '1103': { d: 11, h: 3, g: 4, cap: 160 }, '1404': { d: 14, h: 4, g: 9, cap: 650 }, '2004': { d: 20, h: 4, g: 20, cap: 900 }, '2207': { d: 22, h: 7, g: 32, cap: 1900 }, '2306': { d: 23, h: 6, g: 31, cap: 1850 }, '2806': { d: 28, h: 6.5, g: 48, cap: 3000 } };
  const KVREF = { 1.2: 70000, 1.6: 62000, 2: 55000, 2.5: 50000, 3: 48000, 3.5: 45000, 4: 42000, 5: 38000, 5.1: 38000, 6: 32000, 7: 27000 };
  const opt = (id, label, options, def, extra) => Object.assign({ type: 'radio', id, label, options, def }, extra || {});
  const sel = (id, label, options, def, hint) => ({ type: 'select', id, label, options, def, hint });
  const DEF = Object.assign({ dr_name: '', dr_mission: 'race5', dr_team: 'red', dr_role: 'striker', dr_number: '7', dr_mat: 'carbon', dr_c1: '#ef4444', dr_c2: '#0f172a', dr_extra: '' }, PRESETS.race5);

  const steps = [
    { title: '步驟 1｜任務與賽制', why: '先決定<b>這台無人機要做什麼</b>：同樣叫無人機，足球機、競速機、空拍機的尺寸與重量差好幾倍。選好任務後按「套用建議規格」，後面五步會自動填好一組合理的起點，你再慢慢改。',
      steps: ['取名字、選任務。', '按「⚙ 套用這個任務的建議規格」。', '足球機再選隊伍與位置（攻擊手才能得分）。'], see: '右邊 3D 立刻換成這類無人機，規格表跟著變。',
      fields: [{ type: 'text', id: 'dr_name', label: '機體名稱', ph: '例：紅隼一號' }, opt('dr_mission', '任務類型', MISSION, DEF.dr_mission), { type: 'kitpreset', id: 'dr_preset', kit: 'drone', from: 'dr_mission' },
        opt('dr_team', '隊伍（足球賽用）', [o('red', '紅隊'), o('blue', '藍隊'), o('none', '不分隊')], 'red'), opt('dr_role', '位置', [o('striker', '攻擊手（Striker）', '唯一能得分，要掛標示'), o('defender', '防守手', '擋住對方攻擊手'), o('na', '不適用（非足球）')], 'striker'),
        { type: 'text', id: 'dr_number', label: '機號（印在機身）', ph: '例：7' }] },
    { title: '步驟 2｜機架結構', why: '機架是骨頭。<b>軸距</b>＝對角兩顆馬達中心的距離，決定能裝多大的槳；<b>板厚</b>與<b>臂寬</b>決定耐撞程度與重量；<b>佈局</b>決定手感。',
      steps: ['選佈局，看 3D 機臂角度變化。', '選軸距：5 吋槳約需 210～230 mm。', '選板厚、臂寬、材質，觀察右邊「機架重量」。', '注意紅字：相鄰槳太近會互相打到。'], see: '規格表的「相鄰槳間隙」若小於 3 mm 會變紅。',
      fields: [opt('dr_layout', '機架佈局', LAYOUT, DEF.dr_layout), sel('dr_wb', '軸距（對角馬達中心距）', ['65 mm', '75 mm', '95 mm', '110 mm', '150 mm', '180 mm', '225 mm', '250 mm', '280 mm', '315 mm', '350 mm'], DEF.dr_wb),
        sel('dr_plate', '機臂板厚', ['1.5 mm', '2 mm', '3 mm', '4 mm', '5 mm', '6 mm'], DEF.dr_plate), sel('dr_armw', '機臂寬度', ['6 mm', '8 mm', '10 mm', '12 mm', '14 mm'], DEF.dr_armw),
        opt('dr_mat', '材質', MAT, DEF.dr_mat), sel('dr_standoff', '上下板間距（銅柱高度）', ['15 mm', '20 mm', '25 mm', '30 mm', '35 mm'], DEF.dr_standoff, '要放得下飛控＋電調疊層與鏡頭')] },
    { title: '步驟 3｜動力系統', why: '動力四件組：<b>馬達</b>（2207＝定子直徑 22 mm、高 7 mm；KV＝每 1 伏特空轉幾 rpm）、<b>螺旋槳</b>（5.1×4.3×3＝直徑 5.1 吋、螺距 4.3 吋、3 葉）、<b>電池</b>（6S＝6 顆鋰電芯串聯約 22.2 V；mAh＝容量）。',
      steps: ['選馬達與 KV：大槳配低 KV、小槳配高 KV。', '選槳徑、葉數、螺距。', '選電池串數與容量。', '看右邊推重比、懸停油門、續航怎麼變。'], see: '「推重比」4～10 適合競技；「懸停油門」約 20～45% 最好控。',
      fields: [sel('dr_motor', '馬達定子規格', Object.keys(MOTOR), DEF.dr_motor, '前兩碼＝定子直徑、後兩碼＝定子高度（mm）'), sel('dr_kv', '馬達 KV 值', ['1300 KV', '1700 KV', '1950 KV', '2450 KV', '3800 KV', '8000 KV', '11000 KV', '19000 KV'], DEF.dr_kv),
        sel('dr_prop', '螺旋槳直徑', ['1.2 吋', '1.6 吋', '2 吋', '2.5 吋', '3 吋', '3.5 吋', '4 吋', '5 吋', '5.1 吋', '6 吋', '7 吋'], DEF.dr_prop), opt('dr_blades', '葉數', [o('2', '2 葉', '效率高、省電'), o('3', '3 葉', '抓力與效率平衡'), o('4', '4 葉', '小槳補推力'), o('5', '5 葉', '涵道空拍常用')], DEF.dr_blades),
        sel('dr_pitch', '螺距', ['1.4 吋', '2 吋', '2.5 吋', '3 吋', '3.5 吋', '4 吋', '4.3 吋', '4.8 吋'], DEF.dr_pitch, '螺距越大，每轉推越遠：速度快但更耗電'), opt('dr_cells', '電池串數', [o('1', '1S（3.7 V）'), o('2', '2S（7.4 V）'), o('3', '3S（11.1 V）'), o('4', '4S（14.8 V）'), o('6', '6S（22.2 V）')], DEF.dr_cells),
        sel('dr_mah', '電池容量', ['300 mAh', '450 mAh', '650 mAh', '850 mAh', '1100 mAh', '1300 mAh', '1500 mAh', '1800 mAh', '2200 mAh', '3000 mAh'], DEF.dr_mah)] },
    { title: '步驟 4｜航電與感測', why: '航電是大腦與神經：<b>飛控</b>（內含陀螺儀＋加速度計 IMU，每秒上千次修正姿態）、<b>電調</b>（把飛控指令變成馬達轉速）、<b>接收機</b>（收遙控器訊號）、<b>圖傳與鏡頭</b>（第一人稱 FPV 畫面）、<b>GPS</b>（定位與自動返航）。',
      steps: ['選飛控等級與電調形式。', '選接收機與圖傳。', '選鏡頭仰角：飛越快，鏡頭要越往上仰。', '要不要 GPS、LED。'], see: '3D 機頭的鏡頭角度、機尾天線、上方 GPS 會跟著出現。',
      fields: [opt('dr_fc', '飛控處理器', [o('F4', 'F4', '入門、夠用'), o('F7', 'F7', '運算快、濾波好'), o('H7', 'H7', '最快、適合 GPS 與藍芽')], DEF.dr_fc), opt('dr_esc', '電調形式', [o('aio', '飛控電調一體板（AIO）', '小機省重量'), o('4in1', '四合一電調', '主流，疊在飛控下方'), o('single', '四顆獨立電調', '裝在機臂上，好換修')], DEF.dr_esc),
        opt('dr_rx', '接收機', [o('elrs24', 'ExpressLRS 2.4 GHz', '低延遲，主流'), o('elrs915', 'ExpressLRS 915 MHz', '穿透好、遠距'), o('stock', '套件原廠接收機', '教育機常見')], DEF.dr_rx), opt('dr_vtx', '圖傳', [o('none', '不裝圖傳（目視飛行）', '足球場常見'), o('analog', '類比圖傳', '延遲最低、便宜'), o('digital', '數位圖傳', '畫質清楚、較重')], DEF.dr_vtx),
        sel('dr_tilt', '鏡頭仰角', ['0°', '10°', '15°', '20°', '25°', '30°', '35°', '40°', '45°'], DEF.dr_tilt), opt('dr_gps', 'GPS', [o('no', '不裝'), o('yes', '裝（定位、自動返航）')], DEF.dr_gps), opt('dr_led', 'LED 燈', [o('none', '不裝'), o('arm', '機臂燈條'), o('full', '全機隊伍燈（足球賽規定要看得出隊伍）')], DEF.dr_led)] },
    { title: '步驟 5｜保護結構與外觀', why: '保護結構決定<b>能不能碰撞</b>：足球機整台包在球籠裡；室內機用涵道護住槳葉；競速機通常不加保護以求輕。外觀用兩個顏色：主色（球籠、上蓋、燈）與副色（馬達鐘罩、槳）。',
      steps: ['選保護結構與上蓋造型。', '選主色與副色。', '有特別想法寫在「額外要求」，AI 建模時會照做。'], see: '3D 外觀即時換色；球籠會包住整台。',
      fields: [opt('dr_cage', '保護結構', [o('none', '不加（競速最輕）'), o('guard', '槳保護圈'), o('duct', '涵道（Cinewhoop／Whoop）'), o('ball20', '20 cm 經緯球籠（Class 20）'), o('ball40', '40 cm 經緯球籠（Class 40）')], DEF.dr_cage),
        opt('dr_canopy', '上蓋造型', [o('none', '不加上蓋'), o('basic', '方形護蓋'), o('aero', '流線型護蓋')], DEF.dr_canopy), opt('dr_c1', '主色', COLORS, DEF.dr_c1), opt('dr_c2', '副色', COLORS, DEF.dr_c2),
        { type: 'area', id: 'dr_extra', label: '額外要求（可不填）', ph: '例：上蓋要有鯊魚鰭、機臂刻我的名字', rows: 3 }] }
  ];

  const num = v => parseFloat(String(v == null ? '' : v)) || 0;
  function spec(f) {
    f = f || {};
    const g = k => (f[k] != null && f[k] !== '' && !(Array.isArray(f[k]) && !f[k].length)) ? f[k] : DEF[k];
    const s = {
      kind: 'drone', name: String(g('dr_name') || '').trim() || '我的無人機', mission: g('dr_mission'), team: g('dr_team'), role: g('dr_role'), number: String(g('dr_number') || ''),
      layout: g('dr_layout'), wb: num(g('dr_wb')), plate: num(g('dr_plate')), armw: num(g('dr_armw')), mat: g('dr_mat'), standoff: num(g('dr_standoff')),
      motor: String(g('dr_motor')), kv: num(g('dr_kv')), prop: num(g('dr_prop')), blades: num(g('dr_blades')), pitch: num(g('dr_pitch')), cells: num(g('dr_cells')), mah: num(g('dr_mah')),
      fc: g('dr_fc'), esc: g('dr_esc'), rx: g('dr_rx'), vtx: g('dr_vtx'), tilt: num(g('dr_tilt')), gps: g('dr_gps') === 'yes', led: g('dr_led'), cage: g('dr_cage'), canopy: g('dr_canopy'),
      c1: g('dr_c1'), c2: g('dr_c2'), extra: String(g('dr_extra') || '')
    };
    if (!MOTOR[s.motor]) s.motor = '2207';
    return s;
  }
  function geom(s) {
    const r = s.wb / 2, a = { trueX: 45, cage: 45, H: 45, wideX: 50, stretch: 40 }[s.layout] || 45, rad = a * Math.PI / 180;
    const x = r * Math.sin(rad), z = r * Math.cos(rad);
    // 前方＝+z；右前、左後同向（逆時針），左前、右後同向（順時針）
    const motors = [{ x, z, dir: -1, n: '右前' }, { x: -x, z, dir: 1, n: '左前' }, { x: -x, z: -z, dir: -1, n: '左後' }, { x, z: -z, dir: 1, n: '右後' }];
    return { motors, adj: Math.min(2 * x, 2 * z), propMM: s.prop * 25.4, span: s.wb + s.prop * 25.4 };
  }
  const label = (arr, v) => ((arr.find(x => x.v === v) || {}).l || v);
  function calc(s) {
    const G = geom(s), M = MOTOR[s.motor], V = s.cells * 3.7, matF = { carbon: 1, nylon: 1.35, alu: 1.8, pc: 1.15 }[s.mat] || 1;
    const w = {};
    w.frame = s.wb * s.plate * 0.1 * matF * (s.layout === 'H' ? 1.15 : 1) * (s.armw / 12 * 0.5 + 0.5) + s.standoff * 0.2 * s.wb / 225;
    w.motors = 4 * M.g;
    w.props = 4 * (s.prop * s.prop * 0.18 * s.blades / 3 + 0.3);
    const Wh = s.mah / 1000 * 3.7 * s.cells; w.battery = Wh / 0.15;
    w.elec = 2 + s.wb * 0.01 + (s.esc === 'aio' ? 2 : s.esc === '4in1' ? 3 + s.wb * 0.03 : 4 * (1 + s.wb * 0.012)) + (s.rx === 'stock' ? 3 : 1.5) + ({ none: 0, analog: s.wb < 120 ? 4 : 12, digital: s.wb < 120 ? 12 : 30 }[s.vtx] || 0) + (s.gps ? 10 : 0) + ({ none: 0, arm: 3, full: 6 }[s.led] || 0);
    w.canopy = { none: 0, basic: 1.5 + s.wb * 0.03, aero: 7 + s.wb * 0.04 }[s.canopy] || 0;
    w.cage = { none: 0, guard: s.wb * 0.1, duct: s.wb * 0.12, ball20: 30, ball40: 260 }[s.cage] || 0;
    const W = Object.values(w).reduce((a, b) => a + b, 0);
    const bladeF = { 2: 0.9, 3: 1, 4: 1.08, 5: 1.13 }[s.blades] || 1, pitchF = 0.85 + 0.17 * (s.pitch / s.prop) / 0.86;
    const kvF = Math.max(0.5, Math.min(1.3, s.kv * V / (KVREF[s.prop] || 38000)));
    const propT = 55 * s.prop * s.prop * Math.sqrt(V / 14.8) * bladeF * pitchF * kvF * (s.cage === 'duct' ? 1.08 : 1);
    const T = Math.min(propT, M.cap), twr = 4 * T / W, hover = Math.sqrt(1 / twr);
    const eff = 2.2 + s.prop * 0.75, P = W / eff, tHover = Wh * 0.8 / P * 60, tRace = tHover * 0.4;
    const Imax = 4 * T / 2.6 / V, Cneed = Imax / (s.mah / 1000);
    const rpm = s.kv * V * 0.8, tip = rpm / 60 * Math.PI * s.prop * 0.0254;
    const gap = G.adj - G.propMM;
    const warns = [], goods = [];
    if (s.cage !== 'duct' && s.cage !== 'guard' && gap < 3) warns.push(`相鄰兩顆槳只差 ${gap.toFixed(0)} mm，<b>槳會互相打到</b>：加大軸距或改小槳。`);
    if ((s.cage === 'duct' || s.cage === 'guard') && gap < 8) warns.push(`涵道／護圈之間只剩 ${gap.toFixed(0)} mm，護圈會重疊：加大軸距。`);
    if (propT > M.cap * 1.15) warns.push(`這片槳要 ${propT.toFixed(0)} g 推力，${s.motor} 馬達最多約 ${M.cap} g：<b>馬達帶不動</b>，換大一號定子。`);
    if (twr < 2) warns.push(`推重比只有 ${twr.toFixed(1)}：飛得起來但很肉，不適合競技（建議 ≥ 3）。`);
    else if (twr > 16) warns.push(`推重比 ${twr.toFixed(1)} 太猛：油門一點點就衝很高，新手難控制。`);
    else goods.push(`推重比 ${twr.toFixed(1)}，落在競技常見範圍。`);
    if (hover > 0.6) warns.push(`懸停油門 ${(hover * 100).toFixed(0)}%：剩餘推力太少，遇到亂流會掉高度。`);
    if (Cneed > 120) warns.push(`滿油門約 ${Imax.toFixed(0)} A，電池要 ${Cneed.toFixed(0)}C 以上：<b>放電倍率吃緊</b>，加大容量或降 KV。`);
    if (tip > 260) warns.push(`槳尖速度 ${tip.toFixed(0)} m/s（音速約 343）：噪音大、效率掉，考慮降 KV 或改小槳。`);
    if (tRace < 2 && /soccer|race/.test(s.mission)) warns.push(`競技續航只有約 ${tRace.toFixed(1)} 分鐘，撐不完一局：加大電池。`);
    if (s.mission === 'soccer20') { if (s.cage !== 'ball20') warns.push('Class 20 足球機必須包在 <b>20 cm 球籠</b>裡。'); if (W > 110) warns.push(`Class 20 規定機重 ≤ 110 g，你的估算 ${W.toFixed(0)} g <b>超重</b>。`); else goods.push('符合 Class 20 重量上限（110 g）。'); if (G.span > 190) warns.push(`機體跨距 ${G.span.toFixed(0)} mm 裝不進 20 cm 球籠。`); }
    if (s.mission === 'soccer40') { if (s.cage !== 'ball40') warns.push('Class 40 足球機必須包在 <b>40 cm 球籠</b>裡。'); if (W > 1100) warns.push(`Class 40 規定機重 ≤ 1100 g，你的估算 ${W.toFixed(0)} g <b>超重</b>。`); else goods.push('符合 Class 40 重量上限（1100 g）。'); if (G.span > 380) warns.push(`機體跨距 ${G.span.toFixed(0)} mm 裝不進 40 cm 球籠。`); }
    if (/soccer/.test(s.mission) && s.led !== 'full') warns.push('足球賽要能分辨隊伍與攻擊手：建議選「全機隊伍燈」。');
    if (s.mission === 'long7' && !s.gps) warns.push('長航程建議裝 GPS，訊號中斷時才能自動返航。');
    if (s.vtx === 'none' && /race|cine|long/.test(s.mission)) warns.push('這個任務靠第一人稱畫面飛行，需要圖傳。');
    if (W >= 250) goods.push(`估算 ${W.toFixed(0)} g ≥ 250 g：在臺灣須依《民用航空法》辦理註冊（以民航局最新公告為準）。`);
    if (!warns.length) goods.push('沒有發現衝突，可以交給 AI 建模了！');
    const rows = [
      ['估算總重', W.toFixed(0) + ' g', `機架 ${w.frame.toFixed(0)}＋馬達 ${w.motors.toFixed(0)}＋槳 ${w.props.toFixed(0)}＋電池 ${w.battery.toFixed(0)}＋電子 ${w.elec.toFixed(0)}＋外殼保護 ${(w.canopy + w.cage).toFixed(0)}`],
      ['單顆最大推力', T.toFixed(0) + ' g', '推力 ∝ 槳徑² × 轉速²（受馬達上限限制）'],
      ['推重比', twr.toFixed(1), '4 × 單顆推力 ÷ 總重'],
      ['懸停油門', (hover * 100).toFixed(0) + '%', '推力 ∝ 油門²，所以＝√(1÷推重比)'],
      ['懸停續航', tHover.toFixed(1) + ' 分', `電池 ${Wh.toFixed(1)} Wh × 80% ÷ 懸停功率 ${P.toFixed(0)} W`],
      ['競技續航', tRace.toFixed(1) + ' 分', '激烈操作約為懸停的 40%'],
      ['滿油門電流', Imax.toFixed(0) + ' A', `需電池放電倍率約 ${Cneed.toFixed(0)}C`],
      ['槳尖速度', tip.toFixed(0) + ' m/s', `最高轉速約 ${(rpm / 1000).toFixed(1)} 千 rpm`],
      ['相鄰槳間隙', gap.toFixed(0) + ' mm', `相鄰馬達距 ${G.adj.toFixed(0)} − 槳徑 ${G.propMM.toFixed(0)}`],
      ['機體跨距', G.span.toFixed(0) + ' mm', '軸距＋一片槳徑']
    ];
    return { W, T, twr, hover, rows, warns, goods, w };
  }
  function md(s) {
    const c = calc(s);
    return `# ${s.name}｜無人機規格書

| 項目 | 規格 |
|---|---|
| 任務 | ${label(MISSION, s.mission)} |
| 隊伍／位置／機號 | ${s.team}／${s.role}／${s.number || '—'} |
| 機架佈局 | ${label(LAYOUT, s.layout)} |
| 軸距 | ${s.wb} mm |
| 機臂 | 板厚 ${s.plate} mm、寬 ${s.armw} mm、${label(MAT, s.mat)} |
| 上下板間距 | ${s.standoff} mm |
| 馬達 | ${s.motor}（定子 ${MOTOR[s.motor].d}×${MOTOR[s.motor].h} mm）${s.kv} KV ×4 |
| 螺旋槳 | ${s.prop} 吋 × 螺距 ${s.pitch} 吋 × ${s.blades} 葉（相鄰反轉） |
| 電池 | ${s.cells}S ${s.mah} mAh |
| 飛控／電調 | ${s.fc}／${s.esc} |
| 接收機／圖傳 | ${s.rx}／${s.vtx} |
| 鏡頭仰角 | ${s.tilt}° |
| GPS／LED | ${s.gps ? '有' : '無'}／${s.led} |
| 保護結構／上蓋 | ${s.cage}／${s.canopy} |
| 主色／副色 | ${s.c1}／${s.c2} |
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
  K.drone = { k: 'drone', name: '無人機', prefix: 'dr_', steps, PRESETS, presetField: 'dr_mission', DEF, spec, calc, md, geom, MISSION, MOTOR };
})();
