/* 人形格鬥機器人 3D 建模生成器：欄位定義、任務預設、規格正規化、教學估算（classic script，簡報與 lab.html 共用）
 * 介面（三種載具一致）：KITS.<k> = { k, name, prefix, steps, PRESETS, presetField, DEF, spec(f), calc(s), md(s), geom(s) }
 * 本課程的格鬥機器人一律是「人形」：雙足、雙臂、有頭；不是輪型或履帶戰鬥車。
 * 所有數字都是「教學估算」：用簡化公式讓學員看懂取捨，不是特定產品規格；級別上限是本課程練習級別，正式比賽依主辦單位最新規則。
 */
(function () {
  const K = window.KITS = window.KITS || {};
  const o = (v, l, s) => ({ v, l, s });
  const COLORS = [o('#ef4444', '紅'), o('#2563eb', '藍'), o('#16a34a', '綠'), o('#f59e0b', '橘黃'), o('#7c3aed', '紫'), o('#0f172a', '碳黑'), o('#e5e7eb', '亮銀'), o('#ec4899', '桃紅')];
  const MISSION = [
    o('robo1', '小型二足格鬥（ROBO-ONE 類）', '桌上擂台、雙足舵機人形，出拳把對手打倒'),
    o('boxing', '輕量級人形拳擊', '戴拳套、以有效打擊計分，拳速與連拳優先'),
    o('edu', '教育用舵機人形', '教室示範、步態與程式教學，安全與成本優先'),
    o('show', '全尺寸展示型', '約 1.3 m 等級，展場與表演賽，安全規範最嚴')
  ];
  // 本課程練習級別（教學假設，不是任何正式賽事的級別表）
  const CLASSES = {
    r1: { l: 'ROBO-ONE 一般組（第 45 回規則）', kg: 4, cm: 0, r1: true },
    r1light: { l: 'ROBO-ONE Light（第 28 回 Light 規則）', kg: 1.2, cm: 0, r1: true },
    mini: { l: '迷你級（課程練習）', kg: 1.5, cm: 35 },
    light: { l: '輕量級（課程練習）', kg: 3, cm: 50 },
    middle: { l: '中量級（課程練習）', kg: 6, cm: 80 },
    open: { l: '全尺寸展示（不分量級）', kg: 0, cm: 0 }
  };
  const CLASS_OPTS = Object.keys(CLASSES).map(k => o(k, CLASSES[k].l, CLASSES[k].r1 ? `機重 ≤ ${CLASSES[k].kg} kg；腳底、手臂長依重量限制` : CLASSES[k].kg ? `≤ ${CLASSES[k].kg} kg、身高 ≤ ${CLASSES[k].cm} cm` : '重量身高不設限，安全審查從嚴'));
  const PRESETS = {
    robo1: { rb_class: 'r1', rb_height: '50 cm', rb_legr: '0.48', rb_shoulder: '150 mm', rb_footl: '80 mm', rb_footw: '60 mm', rb_mat: 'alu', rb_dof: '20', rb_torque: '35 kg·cm', rb_speed: '0.12 秒/60°', rb_servos: '20', rb_cells: '3', rb_mah: '1500 mAh', rb_mcu: 'ctrl', rb_imu: '6axis', rb_fist: 'block', rb_arm: '0.38', rb_armor: ['chest', 'head'], rb_sensor: 'none', rb_estop: 'back', rb_helmet: 'visor', rb_numpos: 'chest' },
    boxing: { rb_class: 'middle', rb_height: '60 cm', rb_legr: '0.48', rb_shoulder: '180 mm', rb_footl: '120 mm', rb_footw: '75 mm', rb_mat: 'cfrp', rb_dof: '20', rb_torque: '50 kg·cm', rb_speed: '0.08 秒/60°', rb_servos: '22', rb_cells: '3', rb_mah: '2200 mAh', rb_mcu: 'esp32', rb_imu: '6axis', rb_fist: 'glove', rb_arm: '0.44', rb_armor: ['chest', 'head', 'shoulder'], rb_sensor: 'tof', rb_estop: 'back', rb_helmet: 'round', rb_numpos: 'both' },
    edu: { rb_class: 'mini', rb_height: '30 cm', rb_legr: '0.48', rb_shoulder: '110 mm', rb_footl: '80 mm', rb_footw: '45 mm', rb_mat: 'pla', rb_dof: '17', rb_torque: '10 kg·cm', rb_speed: '0.14 秒/60°', rb_servos: '17', rb_cells: '2', rb_mah: '1000 mAh', rb_mcu: 'esp32', rb_imu: '6axis', rb_fist: 'block', rb_arm: '0.38', rb_armor: ['chest'], rb_sensor: 'cam', rb_estop: 'back', rb_helmet: 'box', rb_numpos: 'chest' },
    show: { rb_class: 'open', rb_height: '130 cm', rb_legr: '0.48', rb_shoulder: '350 mm', rb_footl: '250 mm', rb_footw: '150 mm', rb_mat: 'cfrp', rb_dof: '22', rb_torque: '1000 kg·cm', rb_speed: '0.20 秒/60°', rb_servos: '22', rb_cells: '12', rb_mah: '9000 mAh', rb_mcu: 'jetson', rb_imu: '9axis', rb_fist: 'glove', rb_arm: '0.38', rb_armor: ['chest', 'head', 'shoulder', 'shin'], rb_sensor: 'stereo', rb_estop: 'back', rb_helmet: 'horn', rb_numpos: 'both' }
  };
  const MAT = [o('alu', '鋁合金板（折彎＋鎖螺絲）', '業餘格鬥機主流，耐摔好修'), o('pla', '3D 列印塑膠（PLA／PETG）', '便宜、好改，摔多會裂'), o('cfrp', '碳纖維板＋鋁件', '最輕最硬，價格高'), o('steel', '鋼骨架', '最耐撞但很重')];
  const MATF = { alu: 1, pla: 0.8, cfrp: 0.65, steel: 1.9 };
  const DOF = [o('12', '12 軸（只有雙腿）', '能走路，但不能出拳'), o('17', '17 軸（腿 10＋臂 6＋頭 1）', '格鬥最低配置'), o('20', '20 軸（再加腰與手腕）', '轉身出拳更有力'), o('22', '22 軸（腿各 6 軸）', '步態更自然、起身更順'), o('26', '26 軸（再加手指或頸部）', '展示動作豐富，但重又耗電')];
  const ARMOR = [o('head', '頭盔'), o('chest', '胸甲'), o('shoulder', '肩甲'), o('shin', '脛甲（小腿）'), o('back', '背甲')];
  const opt = (id, label, options, def, extra) => Object.assign({ type: 'radio', id, label, options, def }, extra || {});
  const sel = (id, label, options, def, hint) => ({ type: 'select', id, label, options, def, hint });
  const DEF = Object.assign({ rb_name: '', rb_mission: 'robo1', rb_team: 'red', rb_number: '1', rb_c1: '#ef4444', rb_c2: '#0f172a', rb_extra: '' }, PRESETS.robo1);

  const steps = [
    { title: '步驟 1｜任務與賽制', why: '先決定<b>這台人形機器人要上哪一種擂台</b>：同樣是雙足格鬥，桌上型（約 30～60 cm、幾公斤）與全尺寸（1 公尺以上、數十公斤）的零件、安全規範差好幾個等級。選好任務後按「套用建議規格」，後面四步會自動填好一組合理起點。',
      steps: ['取名字、選任務類型。', '按「⚙ 套用這個任務的建議規格」。', '確認級別、紅藍角與編號（編號會印在胸口）。'], see: '右邊 3D 立刻換成這類人形，規格表跟著變。',
      warn: 'ROBO-ONE 兩個級別依官方規則（重量、腳底、手臂長）；其餘為本課程<b>練習級別</b>。正式比賽一律依主辦單位最新規則。',
      fields: [{ type: 'text', id: 'rb_name', label: '機體名稱', ph: '例：鐵拳一號' }, opt('rb_mission', '任務類型', MISSION, DEF.rb_mission), { type: 'kitpreset', id: 'rb_preset', kit: 'robot', from: 'rb_mission' },
        opt('rb_class', '參賽級別', CLASS_OPTS, DEF.rb_class), opt('rb_team', '角落', [o('red', '紅角'), o('blue', '藍角'), o('none', '不分角（展示）')], 'red'),
        { type: 'text', id: 'rb_number', label: '機號（印在胸口／背後）', ph: '例：1' }] },
    { title: '步驟 2｜骨架與尺寸', why: '骨架決定<b>站不站得穩</b>。身高與腿長比例決定<b>重心高度</b>；腳掌越寬，重心投影越不容易跑出<b>支撐多邊形</b>；肩寬決定出拳的轉動慣量。自由度（DOF）＝關節數，越多動作越靈活，但也越重越耗電。',
      steps: ['選身高與腿長比例，看「重心高度」。', '選腳掌長、寬，看「單腳最大傾斜角」。', '選肩寬、材質與自由度數。', '注意紅字：傾斜角太小代表一碰就倒。'], see: '3D 人形的比例即時改變；規格表的「重心高度」「最大傾斜角」跟著變。',
      fields: [sel('rb_height', '身高（腳底到頭頂）', ['25 cm', '30 cm', '35 cm', '40 cm', '45 cm', '50 cm', '60 cm', '80 cm', '100 cm', '130 cm', '150 cm', '170 cm'], DEF.rb_height),
        opt('rb_legr', '腿長比例（髖關節到腳底 ÷ 身高）', [o('0.42', '短腿（42%）', '重心低、穩，步幅小'), o('0.48', '標準（48%）', '多數格鬥機的平衡點'), o('0.54', '長腿（54%）', '步幅大、移動快，但重心高')], DEF.rb_legr),
        sel('rb_shoulder', '肩寬（左右肩關節中心距）', ['70 mm', '90 mm', '110 mm', '130 mm', '150 mm', '180 mm', '220 mm', '280 mm', '350 mm', '420 mm', '500 mm'], DEF.rb_shoulder, '約身高的 25～35% 看起來最自然'),
        sel('rb_footl', '腳掌長', ['60 mm', '80 mm', '100 mm', '120 mm', '150 mm', '200 mm', '250 mm', '300 mm'], DEF.rb_footl), sel('rb_footw', '腳掌寬', ['35 mm', '45 mm', '60 mm', '75 mm', '90 mm', '120 mm', '150 mm'], DEF.rb_footw, '單腳站立時，能撐住側向傾斜的就是這個寬度'),
        opt('rb_mat', '骨架材質', MAT, DEF.rb_mat), opt('rb_dof', '自由度（關節數）', DOF, DEF.rb_dof)] },
    { title: '步驟 3｜驅動系統', why: '每個關節是一顆<b>伺服舵機</b>：扭力 kg·cm＝距轉軸 1 cm 處能舉起幾公斤（1 kg·cm ≈ 0.098 N·m）；速度「0.12 秒/60°」＝轉 60 度要 0.12 秒。電池 S 數＝鋰電芯串聯數（每顆約 3.7 V）；主控板發出動作指令，<b>IMU</b>（陀螺儀＋加速度計）感覺傾斜，讓機器人自動站穩、倒地後知道要怎麼起身。',
      steps: ['選主要關節（膝、髖）的舵機扭力與速度。', '選舵機數量：比自由度多的部分會並聯在膝關節。', '選電池 S 數與容量。', '選主控板與 IMU，看「扭力餘裕」與「續航」。'], see: '「膝關節扭力餘裕」建議 ≥ 1.5 倍；低於 1 代表蹲下就站不起來。',
      fields: [sel('rb_torque', '主要關節舵機扭力', ['2.5 kg·cm', '6 kg·cm', '10 kg·cm', '15 kg·cm', '25 kg·cm', '35 kg·cm', '50 kg·cm', '70 kg·cm', '100 kg·cm', '300 kg·cm', '600 kg·cm', '1000 kg·cm'], DEF.rb_torque, '300 kg·cm 以上屬於全尺寸人形的關節模組等級'),
        sel('rb_speed', '舵機速度（無負載）', ['0.06 秒/60°', '0.08 秒/60°', '0.10 秒/60°', '0.12 秒/60°', '0.14 秒/60°', '0.18 秒/60°', '0.20 秒/60°', '0.25 秒/60°'], DEF.rb_speed, '數字越小越快；出拳速度直接看它'),
        sel('rb_servos', '舵機數量', ['12', '16', '17', '18', '20', '22', '24', '26', '28', '30'], DEF.rb_servos, '每個自由度至少一顆；多出來的兩顆可並聯在膝關節加倍扭力'),
        opt('rb_cells', '電池串數', [o('2', '2S（7.4 V）', '小型舵機常用'), o('3', '3S（11.1 V）', '高壓舵機（約 9～12 V）'), o('4', '4S（14.8 V）'), o('6', '6S（22.2 V）'), o('12', '12S（44.4 V）', '全尺寸關節模組')], DEF.rb_cells),
        sel('rb_mah', '電池容量', ['500 mAh', '800 mAh', '1000 mAh', '1500 mAh', '2200 mAh', '3000 mAh', '5000 mAh', '9000 mAh', '15000 mAh'], DEF.rb_mah),
        opt('rb_mcu', '主控板', [o('ctrl', '專用舵機控制板', '動作檔播放，延遲低'), o('esp32', 'ESP32 微控制器', '便宜、可藍牙／Wi-Fi 遙控'), o('rpi', '樹莓派＋舵機擴充板', '可跑 Python 與影像'), o('jetson', '邊緣 AI 運算板', '視覺辨識、步態控制，耗電大')], DEF.rb_mcu),
        opt('rb_imu', '姿態感測器 IMU', [o('none', '不裝', '只能播放固定動作'), o('6axis', '6 軸（陀螺儀＋加速度計）', '平衡補償、倒地偵測'), o('9axis', '9 軸（再加磁力計）', '還知道面向哪個方向')], DEF.rb_imu)] },
    { title: '步驟 4｜攻防配置', why: '格鬥的核心：<b>出拳速度≈肩關節角速度 × 手臂長</b>；<b>出拳動能＝½ × 拳頭等效質量 × 速度²</b>，速度加倍、動能變四倍。手臂越長打得越遠，但肩關節負擔越大。裝甲保護舵機與電子，但每一片都是重量。<b>緊急停止鈕</b>要放在裁判一伸手就按得到的位置。',
      steps: ['選拳型與手臂長度，看「出拳速度」「出拳動能」。', '勾選要裝甲的部位，觀察總重變化。', '選頭部感測器。', '選緊急停止鈕位置。'], see: '3D 拳頭、裝甲、頭部鏡頭與背後紅色急停鈕即時出現。',
      warn: '本課程只做<b>模擬與建模</b>：不得加裝尖刺、刀刃、發射物或任何可傷人的構造。',
      fields: [opt('rb_fist', '拳型', [o('block', '方塊拳（金屬或硬塑膠）', '最簡單，打擊集中'), o('glove', '拳套（軟質緩衝）', '拳擊賽常見，保護雙方機體'), o('claw', '夾爪手', '可抓取，出拳較弱')], DEF.rb_fist),
        opt('rb_arm', '手臂長（肩到拳 ÷ 身高）', [o('0.32', '短臂（32%）', '出拳快、肩膀負擔小'), o('0.38', '標準臂（38%）'), o('0.44', '長臂（44%）', '打得遠，但慣量大')], DEF.rb_arm),
        { type: 'check', id: 'rb_armor', label: '裝甲部位（可複選）', options: ARMOR, def: DEF.rb_armor },
        opt('rb_sensor', '頭部感測器', [o('none', '不裝（遙控操作）'), o('cam', '單鏡頭攝影機', '第一人稱畫面'), o('tof', 'ToF 距離感測器', '量對手距離，自動出拳時機'), o('stereo', '雙目深度相機', '立體視覺，全尺寸常用')], DEF.rb_sensor),
        opt('rb_estop', '緊急停止鈕位置', [o('back', '背部上方', '裁判從後方一手按到'), o('head', '頭頂', '最顯眼，但容易被打到'), o('remote', '只有無線急停', '沒有實體按鈕')], DEF.rb_estop)] },
    { title: '步驟 5｜外觀', why: '外觀用兩個顏色：<b>主色</b>（裝甲、頭盔）與<b>副色</b>（骨架、拳頭）。頭盔造型與胸口號碼讓裁判與觀眾一眼認出您的機體；角落色會出現在上臂臂章。',
      steps: ['選主色與副色。', '選頭盔造型與號碼位置。', '有特別想法寫在「額外要求」，AI 建模時會照做。'], see: '3D 外觀即時換色，胸口號碼跟著變。',
      fields: [opt('rb_c1', '主色（裝甲、頭盔）', COLORS, DEF.rb_c1), opt('rb_c2', '副色（骨架、拳頭）', COLORS, DEF.rb_c2),
        opt('rb_helmet', '頭盔造型', [o('box', '方盔', '舵機機器人經典造型'), o('round', '圓盔', '拳擊風'), o('visor', '護目鏡', '一條發光橫槽'), o('horn', 'V 字天線', '機甲風')], DEF.rb_helmet),
        opt('rb_numpos', '號碼位置', [o('chest', '胸口'), o('back', '背後'), o('both', '胸口＋背後'), o('none', '不印')], DEF.rb_numpos),
        { type: 'area', id: 'rb_extra', label: '額外要求（可不填）', ph: '例：胸甲做成六角形、拳頭加我的隊徽', rows: 3 }] }
  ];

  const num = v => parseFloat(String(v == null ? '' : v)) || 0;
  function spec(f) {
    f = f || {};
    const g = k => (f[k] != null && f[k] !== '' && !(Array.isArray(f[k]) && !f[k].length)) ? f[k] : DEF[k];
    const armor = g('rb_armor');
    const s = {
      kind: 'robot', name: String(g('rb_name') || '').trim() || '我的格鬥機器人', mission: g('rb_mission'), cls: g('rb_class'), team: g('rb_team'), number: String(g('rb_number') || ''),
      height: num(g('rb_height')), legr: num(g('rb_legr')), shoulder: num(g('rb_shoulder')), footl: num(g('rb_footl')), footw: num(g('rb_footw')), mat: g('rb_mat'), dof: num(g('rb_dof')),
      torque: num(g('rb_torque')), speed: num(g('rb_speed')), servos: num(g('rb_servos')), cells: num(g('rb_cells')), mah: num(g('rb_mah')), mcu: g('rb_mcu'), imu: g('rb_imu'),
      fist: g('rb_fist'), armr: num(g('rb_arm')), armor: Array.isArray(armor) ? armor.slice() : String(armor || '').split(',').filter(Boolean), sensor: g('rb_sensor'), estop: g('rb_estop'),
      c1: g('rb_c1'), c2: g('rb_c2'), helmet: g('rb_helmet'), numpos: g('rb_numpos'), extra: String(g('rb_extra') || '')
    };
    if (!CLASSES[s.cls]) s.cls = 'light';
    if (!MATF[s.mat]) s.mat = 'alu';
    s.height = Math.max(20, Math.min(200, s.height || 45)); s.legr = s.legr || 0.48; s.armr = s.armr || 0.38;
    s.torque = s.torque || 35; s.speed = s.speed || 0.12; s.dof = s.dof || 17; s.servos = s.servos || s.dof; s.cells = s.cells || 3; s.mah = s.mah || 1500;
    s.shoulder = s.shoulder || s.height * 3.3; s.footl = s.footl || s.height * 2.2; s.footw = s.footw || s.height * 1.3;
    return s;
  }
  // 骨架幾何（毫米），3D 模型與估算共用同一組尺寸
  function geom(s) {
    const H = s.height * 10, Lleg = H * s.legr, fh = Math.max(8, H * 0.03);
    const thigh = (Lleg - fh) / 2, shin = thigh, pelvisH = H * 0.06, headH = H * 0.13, neck = H * 0.025;
    const spineY = Lleg + pelvisH, T = H - spineY - headH - neck, shY = T * 0.86;
    const SW = s.shoulder, torsoW = SW * 0.74, torsoD = Math.max(H * 0.11, 25), hipSp = Math.max(SW * 0.42, s.footw * 1.15);
    const armL = s.armr * H, fist = Math.max(14, H * 0.055), upper = armL * 0.47, fore = armL - upper - fist * 0.5;
    const sv = Math.max(10, H * 0.045 * Math.cbrt(s.torque / 35) * (s.torque > 200 ? 0.42 : 1));
    return { H, Lleg, fh, thigh, shin, pelvisH, headH, neck, spineY, T, shY, SW, torsoW, torsoD, hipSp, armL, fist, upper, fore, sv, footl: s.footl, footw: s.footw };
  }
  const label = (arr, v) => ((arr.find(x => x.v === v) || {}).l || v);
  const servoG = t => t <= 100 ? 10 + 2.2 * t : 230 + 1.6 * (t - 100); // 單顆舵機（關節模組）重量，教學近似
  function calc(s) {
    const G = geom(s), Hm = G.H / 1000, Hdm = G.H / 100;
    const w = {};
    const extra = Math.max(0, s.servos - s.dof);
    w.servo = s.servos * servoG(s.torque) * 0.6;               // 手臂、頭部用較小舵機，平均約主關節的 60%
    w.frame = 47 * Math.pow(Hdm, 2.1) * MATF[s.mat] * Math.sqrt(Math.max(0.6, s.shoulder / (0.3 * G.H)));
    w.armor = s.armor.length * 6 * Hdm * Hdm;
    const Wh = s.mah / 1000 * 3.7 * s.cells; w.battery = Wh / 0.15;
    w.elec = ({ ctrl: 20, esp32: 15, rpi: 60, jetson: 250 }[s.mcu] || 20) + ({ none: 0, '6axis': 3, '9axis': 5 }[s.imu] || 0) + ({ none: 0, cam: 10, tof: 5, stereo: 90 }[s.sensor] || 0) * (Hm > 0.9 ? 2 : 1)
      + (s.estop === 'remote' ? 10 : 12 + 1.2 * Hdm * Hdm) + ({ block: 1, glove: 1.4, claw: 1.8 }[s.fist] || 1) * 4 * Hdm * Hdm;
    const W = Object.values(w).reduce((a, b) => a + b, 0), Wkg = W / 1000;
    // 重心高度：約在骨盆上方；長腿、頭部重物會讓重心升高
    const hc = G.H * (0.5 + (s.legr - 0.48) * 0.55 + (s.armor.includes('head') ? 0.012 : 0) + (s.mcu === 'jetson' ? 0.01 : 0) + (s.sensor === 'stereo' ? 0.008 : 0));
    const tiltSide = Math.atan(s.footw / 2 / hc) * 180 / Math.PI, tiltFwd = Math.atan(s.footl / 2 / hc) * 180 / Math.PI;
    // 出拳：無負載角速度打七折 × 手臂長
    const omega = (Math.PI / 3) / s.speed * 0.7, armM = G.armL / 1000, v = omega * armM;
    const mFist = Wkg * 0.04 * ({ block: 1, glove: 1.1, claw: 1.2 }[s.fist] || 1), E = 0.5 * mFist * v * v;
    // 扭力需求（kg·cm）
    const legKg = Wkg * 0.16, thighCm = G.thigh / 10;
    const needLift = legKg * (G.Lleg / 10) / 2;                       // 髖關節把整條腿抬到水平
    const needRoll = (Wkg - legKg) * (G.hipSp / 20);                   // 單腳站立時髖側擺撐住上半身
    const needKnee = Wkg * thighCm * Math.sin(30 * Math.PI / 180);      // 單腳、膝彎 30° 撐住全身
    const needShoulder = Wkg * 0.05 * (G.armL / 10) / 2;                // 手臂平舉（出拳到底）
    const kneeT = s.torque * (extra >= 2 ? 2 : 1);
    const need = Math.max(needLift, needRoll, needKnee), margin = kneeT / needKnee, marginAll = Math.min(kneeT / needKnee, s.torque / needLift, s.torque / needRoll);
    const shMargin = s.torque * 0.6 / needShoulder;
    // 續航：格鬥中約 8 W/kg，站立約 3 W/kg，另加運算板
    const Pc = { ctrl: 0.5, esp32: 1, rpi: 5, jetson: 15 }[s.mcu] || 1;
    const Pf = 8 * Wkg + Pc, Ps = 3 * Wkg + Pc, tFight = Wh * 0.8 / Pf * 60, tStand = Wh * 0.8 / Ps * 60;
    const Ipk = Pf * 3 / (s.cells * 3.7), Cneed = Ipk / (s.mah / 1000);
    const C = CLASSES[s.cls];
    const warns = [], goods = [];
    if (C.kg) {
      if (Wkg > C.kg) warns.push(`${C.l}上限 ${C.kg} kg，您的估算 ${Wkg.toFixed(2)} kg <b>超重</b>：減裝甲、換輕材質或降一級舵機。`); else goods.push(`符合${C.l}重量上限（${C.kg} kg）。`);
      if (C.cm) { if (s.height > C.cm) warns.push(`${C.l}身高上限 ${C.cm} cm，您選了 ${s.height} cm：<b>超高</b>。`); else goods.push(`符合${C.l}身高上限（${C.cm} cm）。`); }
      if (C.r1) {
        // ROBO-ONE 第 45 回規則 5.3.1 表 1（腳底）、5.3.2 表 2（手臂）：依機重分級；腿長以髖關節到腳底計（教學近似）
        const FT = [[1.2, 55, 100, 35, 260], [2, 50, 110, 30, 300], [3, 45, 120, 25, 300], [5, 40, 130, 25, 350]].find(r => Wkg <= r[0]) || [5, 40, 130, 25, 350];
        const fl = Math.min(G.Lleg * FT[1] / 100, FT[2]), fw = G.Lleg * FT[3] / 100;
        if (s.footl > fl + 0.5) warns.push(`ROBO-ONE 腳底長上限：腿長 ${(G.Lleg / 10).toFixed(1)} cm × ${FT[1]}%、且 ≤ ${FT[2] / 10} cm → 約 ${fl.toFixed(0)} mm，您選 ${s.footl} mm <b>超出</b>。`);
        if (s.footw > fw + 0.5) warns.push(`ROBO-ONE 腳底寬上限：腿長 × ${FT[3]}% → 約 ${fw.toFixed(0)} mm，您選 ${s.footw} mm <b>超出</b>。`);
        if (s.footl <= fl + 0.5 && s.footw <= fw + 0.5) goods.push(`腳底 ${s.footl}×${s.footw} mm 在 ROBO-ONE 依重量分級的上限內（約 ${fl.toFixed(0)}×${fw.toFixed(0)} mm）。`);
        if (G.armL > FT[4]) warns.push(`ROBO-ONE 手臂長（自支撐軸量起）上限 ${FT[4] / 10} cm，您的手臂約 ${(G.armL / 10).toFixed(1)} cm <b>超出</b>。`);
        if (s.estop === 'remote') goods.push('提醒：ROBO-ONE 規定電池與機體間要有可直接切斷的開關（機械開關或拔接頭），不能只靠無線。');
      }
    } else if (s.height < 100) warns.push('「全尺寸展示」級別通常是 1 公尺以上的人形；桌上型請改選練習級別。');
    if (tiltSide < 4) warns.push(`單腳站立時只能側傾 ${tiltSide.toFixed(1)}°就倒：<b>一碰就倒</b>，加寬腳掌或改短腿降低重心。`);
    else if (tiltSide < 6) warns.push(`單腳側傾容許 ${tiltSide.toFixed(1)}°，偏小：出拳時重心外移容易倒，建議加寬腳掌。`);
    else goods.push(`單腳側傾容許 ${tiltSide.toFixed(1)}°，平衡餘裕足夠。`);
    if (margin < 1) warns.push(`膝關節扭力餘裕只有 ${margin.toFixed(2)} 倍：<b>蹲下就站不起來</b>，換大扭力舵機或多加兩顆並聯膝關節。`);
    else if (margin < 1.5) warns.push(`膝關節扭力餘裕 ${margin.toFixed(2)} 倍偏低（建議 ≥ 1.5），被打或起身時舵機容易過熱。`);
    else goods.push(`膝關節扭力餘裕 ${margin.toFixed(1)} 倍${extra >= 2 ? '（膝關節雙舵機並聯）' : ''}。`);
    if (margin > 8 && s.torque >= 50) warns.push(`扭力餘裕高達 ${margin.toFixed(1)} 倍：舵機明顯過大，重量與耗電都浪費，可降一級。`);
    if (s.torque / needRoll < 1.2) warns.push(`單腳站立時髖側擺需要約 ${needRoll.toFixed(1)} kg·cm，舵機只有 ${s.torque} kg·cm：抬腳時會往外倒。`);
    if (shMargin < 1) warns.push(`手臂平舉需要約 ${needShoulder.toFixed(1)} kg·cm，手臂舵機（約主關節六成）撐不住：縮短手臂或減輕拳頭。`);
    if (s.servos < s.dof) warns.push(`自由度 ${s.dof} 軸卻只有 ${s.servos} 顆舵機：<b>每個關節至少要一顆</b>。`);
    if (s.dof === 12 && s.mission !== 'edu') warns.push('12 軸只有雙腿，沒有手臂關節，<b>不能出拳</b>：格鬥至少選 17 軸。');
    if (s.imu === 'none' && /robo1|boxing|show/.test(s.mission)) warns.push('沒有 IMU：無法做平衡補償，也無法判斷倒地方向自動起身。格鬥建議至少 6 軸。');
    if (s.fist === 'claw' && s.mission === 'boxing') warns.push('拳擊賽以拳頭打擊計分，夾爪手出拳弱且容易損壞：建議改拳套。');
    if (s.mission === 'boxing' && s.fist !== 'glove') warns.push('人形拳擊建議戴<b>拳套</b>，保護雙方機體與裁判。');
    if (s.estop === 'remote' && (G.H >= 800 || s.mission === 'show')) warns.push('全尺寸人形摔倒力量很大：除了無線急停，<b>機身一定要有實體緊急停止鈕</b>。');
    if (s.estop === 'head' && /robo1|boxing/.test(s.mission)) warns.push('急停鈕放頭頂容易被對手打到誤觸，建議改背部上方。');
    if (s.torque < 200 && s.cells >= 4) warns.push(`一般舵機額定電壓約 6～12 V，${s.cells}S（${(s.cells * 3.7).toFixed(1)} V）會燒毀：需降壓模組或改 2S／3S。`);
    if (s.torque >= 300 && s.cells < 6) warns.push('全尺寸關節模組多使用 24～48 V 系統：建議 6S 以上。');
    if (s.torque <= 15 && s.cells >= 3) warns.push('小型舵機（≤ 15 kg·cm）多為 4.8～7.4 V：3S 以上需降壓。');
    if (Cneed > 25) warns.push(`出拳瞬間電流約 ${Ipk.toFixed(1)} A，電池要 ${Cneed.toFixed(0)}C 以上：放電倍率吃緊，加大容量。`);
    if (tFight < 6 && s.mission !== 'edu') warns.push(`格鬥續航只有約 ${tFight.toFixed(1)} 分鐘，連打幾場就要換電池：加大容量。`);
    const sr = s.shoulder / G.H; if (sr > 0.42) warns.push(`肩寬是身高的 ${(sr * 100).toFixed(0)}%，太寬：上身慣量大、轉身慢。`); else if (sr < 0.2) warns.push(`肩寬只有身高的 ${(sr * 100).toFixed(0)}%，太窄：手臂會打到自己身體。`);
    if (s.footl / G.H > 0.32) warns.push('腳掌長超過身高 32%：走路時腳尖容易互踢、卡地，也不像人形。');
    if (s.mission === 'show' && s.mcu !== 'jetson' && s.mcu !== 'rpi') warns.push('全尺寸人形需要即時步態控制與影像，主控板建議選樹莓派或邊緣 AI 運算板。');
    if (!warns.length) goods.push('沒有發現衝突，可以交給 AI 建模了！');
    const rows = [
      ['估算總重', (Wkg < 10 ? Wkg.toFixed(2) : Wkg.toFixed(1)) + ' kg', `舵機 ${(w.servo / 1000).toFixed(2)}＋骨架 ${(w.frame / 1000).toFixed(2)}＋裝甲 ${(w.armor / 1000).toFixed(2)}＋電池 ${(w.battery / 1000).toFixed(2)}＋電子與拳 ${(w.elec / 1000).toFixed(2)}（kg）`],
      ['重心高度', (hc / 10).toFixed(1) + ' cm', `約身高的 ${(hc / G.H * 100).toFixed(0)}%（長腿、頭部重物會升高）`],
      ['單腳最大側傾角', tiltSide.toFixed(1) + '°', `atan(腳掌半寬 ${(s.footw / 2).toFixed(0)} mm ÷ 重心高 ${hc.toFixed(0)} mm)`],
      ['前後最大傾斜角', tiltFwd.toFixed(1) + '°', `atan(腳掌半長 ${(s.footl / 2).toFixed(0)} mm ÷ 重心高)`],
      ['出拳速度', v.toFixed(2) + ' m/s', `角速度 ${omega.toFixed(1)} rad/s × 臂長 ${(armM * 100).toFixed(0)} cm（無負載速度打七折）`],
      ['出拳動能', (E < 1 ? E.toFixed(3) : E.toFixed(2)) + ' J', `½ × 拳頭等效質量 ${(mFist * 1000).toFixed(0)} g × 速度²`],
      ['膝關節扭力餘裕', margin.toFixed(2) + ' 倍', `舵機 ${kneeT} kg·cm ÷ 單腳蹲 30° 需 ${needKnee.toFixed(1)} kg·cm`],
      ['抬腿所需扭力', needLift.toFixed(1) + ' kg·cm', `腿重 ${(legKg * 1000).toFixed(0)} g × 腿長一半；單腳站髖側擺需 ${needRoll.toFixed(1)} kg·cm`],
      ['格鬥續航', tFight.toFixed(1) + ' 分', `電池 ${Wh.toFixed(1)} Wh × 80% ÷ 格鬥功率 ${Pf.toFixed(0)} W`],
      ['站立待機續航', tStand.toFixed(0) + ' 分', `待機功率約 ${Ps.toFixed(0)} W`],
      ['級別檢查', C.kg ? `${Wkg <= C.kg && (!C.cm || s.height <= C.cm) ? '重量／身高符合' : '不符合'}` : '不分量級', C.r1 ? `${C.l}：機重 ≤ ${C.kg} kg（腳底、手臂另見檢查結果）` : C.kg ? `${C.l}：≤ ${C.kg} kg、≤ ${C.cm} cm` : '全尺寸展示：以安全審查為主']
    ];
    return { W, Wkg, hc, tiltSide, tiltFwd, v, E, margin, marginAll, need, needLift, needKnee, needRoll, tFight, rows, warns, goods, w };
  }
  function md(s) {
    const c = calc(s), G = geom(s);
    return `# ${s.name}｜人形格鬥機器人規格書

| 項目 | 規格 |
|---|---|
| 任務 | ${label(MISSION, s.mission)} |
| 級別 | ${CLASSES[s.cls].l} |
| 角落／機號 | ${{ red: '紅角', blue: '藍角', none: '不分角' }[s.team] || s.team}／${s.number || '—'} |
| 身高 | ${s.height} cm（腿長比例 ${Math.round(s.legr * 100)}%，髖關節高 ${(G.Lleg / 10).toFixed(1)} cm） |
| 肩寬 | ${s.shoulder} mm |
| 腳掌 | 長 ${s.footl} mm × 寬 ${s.footw} mm |
| 骨架材質 | ${label(MAT, s.mat)} |
| 自由度 | ${s.dof} 軸 |
| 舵機 | ${s.servos} 顆，主要關節 ${s.torque} kg·cm（約 ${(s.torque * 0.098).toFixed(1)} N·m）、${s.speed} 秒/60° |
| 電池 | ${s.cells}S ${s.mah} mAh |
| 主控板／IMU | ${s.mcu}／${s.imu} |
| 拳型／手臂長 | ${s.fist}／身高的 ${Math.round(s.armr * 100)}%（${(G.armL / 10).toFixed(1)} cm） |
| 裝甲部位 | ${s.armor.map(a => label(ARMOR, a)).join('、') || '無'} |
| 頭部感測器 | ${s.sensor} |
| 緊急停止鈕 | ${s.estop} |
| 頭盔／號碼位置 | ${s.helmet}／${s.numpos} |
| 主色／副色 | ${s.c1}／${s.c2} |
| 額外要求 | ${s.extra || '無'} |

## 教學估算（簡化公式，非特定產品實測）

| 項目 | 數值 | 說明 |
|---|---|---|
${c.rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} |`).join('\n')}

## 檢查結果

${c.warns.map(x => '- ⚠ ' + x.replace(/<[^>]+>/g, '')).join('\n') || '- 無警告'}
${c.goods.map(x => '- ✅ ' + x.replace(/<[^>]+>/g, '')).join('\n')}

> ROBO-ONE 級別依第 45 回規則（https://www.robo-one.com/abouts/view/rule/）與第 28 回 Light 規則；其餘為本課程練習級別。正式比賽依主辦單位最新規則。
`;
  }
  K.robot = { k: 'robot', name: '人形格鬥機器人', prefix: 'rb_', steps, PRESETS, presetField: 'rb_mission', DEF, spec, calc, md, geom, MISSION, CLASSES };
})();
