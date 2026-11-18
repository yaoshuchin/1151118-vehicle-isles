// 機構數學（單一輸入：油門 t ∈ [0,1]）。這個檔案不准出現 three.js。
// 規則：畫面上所有儀表、標籤、動畫轉速都讀這裡算出來的同一組數字。
// 規格為「教學示範機」的合理數值（參考常見業餘零件等級），不是任何廠牌產品規格。

export const SPEC = {
  drone: { name: '無人機足球練習機', mass_g: 180, cell: 2, Vcell: 3.7, KV: 5000, load: 0.8, prop_in: 2.5, blades: 3, Tmax_g: 160, Imax_A: 6, cap_mAh: 450 },
  robot: {   // 人形格鬥機器人：servo＝桌上型舵機二足；boxer＝全尺寸拳擊人形；titan＝重裝構想機（教學假想值）
    servo: { name: '舵機鬥士', h: 0.42, mass: 1.6, dof: 17, omega: 10.5, reach: 0.15, fist: 0.06, foot: 0.06, com: 0.2 },
    boxer: { name: '拳擊人形', h: 1.32, mass: 35, dof: 23, omega: 12, reach: 0.55, fist: 0.8, foot: 0.12, com: 0.7 },
    titan: { name: '重裝泰坦（構想）', h: 1.8, mass: 120, dof: 28, omega: 7, reach: 0.8, fist: 4, foot: 0.2, com: 1.0 }
  },
  boat: { name: '電動競速遙控船', mass_kg: 1.4, len_mm: 650, cell: 3, Vcell: 3.7, KV: 2800, load: 0.85, prop_mm: 35, pitchRatio: 1.4,
    slip: { vhull: 0.25, catamaran: 0.22, foil: 0.18 }, foil_m2: 0.006, foil_CL: 0.5, eff: { vhull: 1.0, catamaran: 0.93, foil: 1.04, foilWet: 0.78 } }
};
const g = 9.81;
const r1 = v => Math.round(v * 10) / 10, r0 = v => Math.round(v), r2 = v => Math.round(v * 100) / 100;

export function kin(type, variant, t, SP = SPEC) {
  t = Math.max(0, Math.min(1, t));
  if (type === 'drone') {
    const s = SP.drone, V = s.cell * s.Vcell;
    const rpm = s.KV * V * s.load * t;                  // 有負載時的轉速
    const thrust1 = s.Tmax_g * t * t;                    // 推力約與轉速平方成正比
    const total = thrust1 * 4, twr = total / s.mass_g;
    const amps = 4 * s.Imax_A * t ** 3;                  // 功率約與轉速三次方成正比
    const hover = Math.sqrt(s.mass_g / (s.Tmax_g * 4));  // 懸停油門
    const minutes = amps > 0.05 ? (s.cap_mAh / 1000 * 0.8) / amps * 60 : null;
    const state = twr < 0.98 ? '推力不足，停在地面' : twr < 1.03 ? '懸停（推力＝重量）' : '爬升中';
    return {
      rpm, anim: rpm / 60 * 2 * Math.PI / 40, hot: t > 0.02 ? 'prop' : null, state,
      read: [['油門', r0(t * 100) + ' %'], ['馬達轉速', r0(rpm) + ' rpm'], ['單顆推力', r1(thrust1) + ' g'], ['總推力', r0(total) + ' g'],
        ['推重比', r2(twr)], ['電流（估）', r1(amps) + ' A'], ['可飛時間（估）', minutes ? r1(Math.min(minutes, 99)) + ' 分' : '—'], ['懸停油門', r0(hover * 100) + ' %']],
      bars: { 推重比: Math.min(1, twr / 4), 電流: amps / (4 * s.Imax_A) },
      check: `手算抽查：懸停時總推力要等於重量 → 4 × ${s.Tmax_g} g × t² = ${s.mass_g} g → t = √(${s.mass_g}/${s.Tmax_g * 4}) = ${r2(hover)}，也就是油門約 ${r0(hover * 100)} %。`
    };
  }
  if (type === 'robot') {
    const s = SP.robot[variant] || SP.robot.servo;
    const om = s.omega * t, v = om * s.reach, E = 0.5 * s.fist * v * v, p = s.fist * v;
    const tilt = Math.atan(s.foot / s.com) * 180 / Math.PI;
    return { rpm: 0, anim: om, hot: 'servo', state: t < 0.05 ? '格擋待機' : E > 30 ? '重拳！' : v > 3 ? '快速連拳' : '試探刺拳',
      read: [['出力', r0(t * 100) + ' %'], ['身高／全重', s.h + ' m／' + s.mass + ' kg'], ['關節數', s.dof + ' 個'], ['肩關節角速度', r1(om) + ' rad/s'],
        ['拳頭速度', r1(v) + ' m/s'], ['出拳動能', (E < 1 ? r2(E) : r0(E)) + ' J'], ['出拳衝量', r2(p) + ' N·s'], ['最大傾斜（不倒）', r1(tilt) + '°']],
      bars: { 拳速: Math.min(1, v / 8), 穩定度: Math.min(1, tilt / 20) },
      check: `手算抽查：拳頭速度 = 角速度 × 手臂長 = ${r1(om)} rad/s × ${s.reach} m ≈ ${r1(v)} m/s；動能 = ½ × ${s.fist} kg × ${r1(v)}² ≈ ${E < 1 ? r2(E) : r0(E)} J。` };
  }  // boat
  const s = SP.boat, V = s.cell * s.Vcell, id = s.slip[variant] != null ? variant : 'vhull';
  const rpm = s.KV * V * s.load * t, pitch = s.prop_mm / 1000 * s.pitchRatio;
  const vp = pitch * rpm / 60, W = s.mass_kg * g;
  const vWet = vp * (1 - s.slip[id]) * (id === 'foil' ? s.eff.foilWet : s.eff[id]);
  const liftWet = 0.5 * 1000 * vWet * vWet * s.foil_m2 * s.foil_CL, foiling = id === 'foil' && liftWet >= W;
  const vr = foiling ? vp * (1 - s.slip[id]) * s.eff.foil : vWet;
  const lift = foiling ? W : liftWet;   // 升起後水翼自動減小攻角，升力維持等於重量
  const vTake = Math.sqrt(W / (0.5 * 1000 * s.foil_m2 * s.foil_CL));
  return {
    rpm, anim: rpm / 60 * 2 * Math.PI / 60, hot: 'prop', foiling, lift: Math.min(1, lift / W),
    state: t < 0.03 ? '漂浮待機' : id === 'foil' ? (foiling ? '水翼升起，船身離水' : '排水航行，速度不足升起') : vr > 8 ? '滑行（船身半出水）' : '排水航行',
    read: [['油門', r0(t * 100) + ' %'], ['馬達轉速', r0(rpm) + ' rpm'], ['螺距', r0(pitch * 1000) + ' mm'], ['理論航速', r1(vp) + ' m/s'],
      ['滑脫率', r0(s.slip[id] * 100) + ' %'], ['實際航速（估）', r1(vr) + ' m/s（' + r0(vr * 3.6) + ' km/h）'],
      ...(id === 'foil' ? [['水翼升力／重量', foiling ? '1.00（已升起）' : r2(lift / W)], ['起飛速度', r1(vTake) + ' m/s']] : [])],
    bars: { 航速: Math.min(1, vr / 22), ...(id === 'foil' ? { 升力: Math.min(1, lift / W) } : {}) },
    check: `手算抽查：理論航速 = 螺距 × 轉速 ÷ 60 = ${r0(pitch * 1000)} mm × ${r0(rpm)} ÷ 60 ≈ ${r1(vp)} m/s；扣掉 ${r0(s.slip[id] * 100)} % 滑脫才是真正前進的距離。`
  };
}
