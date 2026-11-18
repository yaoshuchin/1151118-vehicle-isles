// 九款載具的程序化 3D 模型（全部用程式碼建模，原創造型，無外部模型檔）
// buildVehicle(type, variant, opts) → { group, parts:[{id, group, home, dir}], update(dt, s), setExplode(k), setXray(on), highlight(id) }
// type: drone｜robot｜boat；variant 見 VARIANTS。
import * as THREE from 'three';

export const VARIANTS = {
  drone: [
    { id: 'red',   name: '紅隼號', color: 0xe5484d, sub: '紅色機・攻擊手常用色' },
    { id: 'blue',  name: '藍鯨號', color: 0x3b82f6, sub: '藍色機・防守手常用色' },
    { id: 'green', name: '綠螳號', color: 0x22c55e, sub: '綠色機・練習與巡航' }
  ],
  robot: [
    { id: 'servo', name: '舵機鬥士', color: 0xfacc15, sub: '二足伺服舵機格鬥機，靈活好上手' },
    { id: 'boxer', name: '拳擊人形', color: 0xdc2626, sub: '全尺寸拳擊人形機器人，出拳最快' },
    { id: 'titan', name: '重裝泰坦', color: 0x64748b, sub: '重裝甲構想機，打得重但比較慢' }
  ],
  boat: [
    { id: 'vhull', name: '隱身快艇', color: 0x0ea5e9, sub: '多面隱身船殼＋感測桅桿，直線最快' },
    { id: 'catamaran', name: '穿浪雙體', color: 0x14b8a6, sub: '兩個細長船身穿浪，轉彎最穩' },
    { id: 'foil', name: '水翼巡邏艇', color: 0xf97316, sub: '水翼把船身抬出水面，阻力最小' }
  ]
};
export const TYPE_NAME = { drone: '無人機', robot: '格鬥機器人', boat: '無人船' };
export const variantOf = (type, id) => VARIANTS[type].find(v => v.id === id) || VARIANTS[type][0];

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.55, metalness: o.m ?? 0.15, transparent: !!o.t, opacity: o.t ?? 1, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide });
const M = {
  dark: () => mat(0x1f2937, { r: 0.6 }), metal: () => mat(0x9ca3af, { r: 0.3, m: 0.85 }), black: () => mat(0x111827, { r: 0.8 }),
  pcb: () => mat(0x166534, { r: 0.5 }), gold: () => mat(0xd4a017, { r: 0.3, m: 0.9 }), rubber: () => mat(0x18181b, { r: 0.95 }),
  batt: () => mat(0x2563eb, { r: 0.4 }), white: () => mat(0xf1f5f9, { r: 0.4 }), steel: () => mat(0xcbd5e1, { r: 0.25, m: 0.95 })
};
function mesh(geo, material, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; }

// 零件容器：每個零件是一個 Group，記住原位 home 與拆解方向 dir
function makeKit() {
  const root = new THREE.Group();
  const parts = [];
  const add = (id, dir, build) => {
    const g = new THREE.Group(); g.name = id; g.userData.partId = id;
    build(g);
    g.traverse(o => { if (o.isMesh) o.userData.partId = id; });
    root.add(g);
    parts.push({ id, group: g, home: g.position.clone(), dir: new THREE.Vector3(...dir) });
    return g;
  };
  return { root, parts, add };
}

/* ───────────── 無人機（無人機足球式球籠四軸） ───────────── */
function buildDrone(v) {
  const K = makeKit();
  const body = mat(v.color, { r: 0.45 });
  const spin = [];
  K.add('cage', [0, 0.9, 0], g => {
    const cm = mat(v.color, { r: 0.4, m: 0.1 });
    const R = 0.5;
    for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 6, 48), cm); t.rotation.y = i * Math.PI / 6; g.add(t); }
    for (const y of [-0.32, 0, 0.32]) { const r = Math.sqrt(R * R - y * y); const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 48), cm); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); }
  });
  K.add('frame', [0, -0.55, 0], g => {
    g.add(mesh(new THREE.BoxGeometry(0.16, 0.025, 0.16), M.dark()));
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; const arm = mesh(new THREE.BoxGeometry(0.34, 0.02, 0.035), M.dark(), Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17); arm.rotation.y = -a; g.add(arm); }
    // 球籠與機架的連接柱
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; const s = mesh(new THREE.BoxGeometry(0.17, 0.012, 0.012), M.dark(), Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42); s.rotation.y = -a; g.add(s); }
  });
  K.add('motor', [0, 0.1, 0.0], g => {
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; const x = Math.cos(a) * 0.32, z = Math.sin(a) * 0.32;
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.045, 16), M.metal(), x, 0.03, z));
      g.add(mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.012, 16), body, x, 0.055, z)); }
    g.userData.explodeEach = true;
  });
  K.add('prop', [0, 0.35, 0], g => {
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; const x = Math.cos(a) * 0.32, z = Math.sin(a) * 0.32;
      const p = new THREE.Group(); p.position.set(x, 0.075, z);
      for (let b = 0; b < 3; b++) { const blade = mesh(new THREE.BoxGeometry(0.15, 0.004, 0.028), mat(i % 2 ? 0xfbbf24 : 0xf8fafc, { r: 0.5 }), 0.075, 0, 0); const holder = new THREE.Group(); holder.rotation.y = b * Math.PI * 2 / 3; blade.rotation.x = 0.25 * (i % 2 ? 1 : -1); holder.add(blade); p.add(holder); }
      p.userData.dir = (i % 2 ? 1 : -1); spin.push(p); g.add(p); }
  });
  K.add('fc', [0, 0.45, 0.35], g => { g.add(mesh(new THREE.BoxGeometry(0.09, 0.012, 0.09), M.pcb(), 0, 0.03, 0)); g.add(mesh(new THREE.BoxGeometry(0.025, 0.01, 0.025), M.black(), 0, 0.042, 0)); });
  K.add('esc', [0.35, 0.2, 0], g => { g.add(mesh(new THREE.BoxGeometry(0.1, 0.014, 0.1), mat(0x7c2d12, { r: 0.5 }), 0, 0.012, 0)); for (let i = 0; i < 4; i++) g.add(mesh(new THREE.BoxGeometry(0.012, 0.012, 0.012), M.black(), -0.03 + i * 0.02, 0.022, 0.03)); });
  K.add('battery', [0, -0.5, 0.3], g => { g.add(mesh(new THREE.BoxGeometry(0.13, 0.05, 0.07), M.batt(), 0, -0.04, 0)); g.add(mesh(new THREE.BoxGeometry(0.135, 0.03, 0.012), M.black(), 0, -0.04, 0)); });
  K.add('rx', [-0.4, 0.15, -0.2], g => { g.add(mesh(new THREE.BoxGeometry(0.04, 0.012, 0.03), M.black(), -0.06, 0.06, -0.04)); const ant = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.16), M.white(), -0.06, 0.12, -0.04); ant.rotation.z = 0.5; g.add(ant); });
  K.add('led', [0, 0.2, -0.45], g => { const lm = mat(v.color, { e: v.color, ei: 1.6 }); for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.add(mesh(new THREE.SphereGeometry(0.014, 10, 8), lm, Math.cos(a) * 0.43, -0.01, Math.sin(a) * 0.43)); } });
  const update = (dt, s = {}) => { const w = (s.throttle ?? 0.6) * 60 + 4; for (const p of spin) p.rotation.y += p.userData.dir * w * dt; };
  return finish(K, update);
}

/* ───────────── 人形格鬥機器人（骨架＋可拆零件） ─────────────
   做法：用隱形骨架（Object3D 階層）算姿勢；每個零件是一個容器 Group（位置＝拆解位移），
   裡面的網格每格從骨架節點複製矩陣。所以「擺姿勢」與「爆炸分解」可以同時成立。 */
const HUMANOID = {
  servo: { body: 0x1f2937, plate: 0xfacc15, joint: 0x1e3a8a, fist: 0x111827, visor: 0xef4444, bulk: 1.0, slim: 1.0 },
  boxer: { body: 0xe5e7eb, plate: 0xffffff, joint: 0x334155, fist: 0xdc2626, visor: 0x0f172a, bulk: 0.9, slim: 0.82 },
  titan: { body: 0x475569, plate: 0x64748b, joint: 0x1f2937, fist: 0x334155, visor: 0xf97316, bulk: 1.35, slim: 1.15 }
};
function buildRobot(v) {
  const K = makeKit();
  const C = HUMANOID[v.id] || HUMANOID.servo, B = C.bulk, S2 = C.slim;
  const body = () => mat(C.body, { r: 0.5, m: 0.4 }), plate = () => mat(C.plate, { r: 0.45, m: 0.2 }), joint = () => mat(C.joint, { r: 0.4, m: 0.5 });
  // 骨架（尺寸：全高約 1.0）
  const N = n => { const o = new THREE.Object3D(); o.name = n; return o; };
  const sk = { root: N('root'), hips: N('hips'), spine: N('spine'), head: N('head') };
  sk.root.add(sk.hips); sk.hips.position.y = 0.5; sk.hips.add(sk.spine); sk.spine.position.y = 0.06; sk.spine.add(sk.head); sk.head.position.y = 0.34;
  for (const s of [-1, 1]) {
    const k = s < 0 ? 'L' : 'R';
    const sh = N('sh' + k), el = N('el' + k), hd = N('hd' + k), hip = N('hip' + k), kn = N('kn' + k), an = N('an' + k);
    sk.spine.add(sh); sh.position.set(s * 0.17 * S2, 0.28, 0); sh.add(el); el.position.y = -0.17; el.add(hd); hd.position.y = -0.16;
    sk.hips.add(hip); hip.position.set(s * 0.075 * S2, -0.03, 0); hip.add(kn); kn.position.y = -0.22; kn.add(an); an.position.y = -0.21;
    Object.assign(sk, { ['sh' + k]: sh, ['el' + k]: el, ['hd' + k]: hd, ['hip' + k]: hip, ['kn' + k]: kn, ['an' + k]: an });
  }
  const bound = [];   // { mesh, node }
  const at = (g, node, geo, m, x = 0, y = 0, z = 0, rot) => { const me = mesh(geo, m, x, y, z); if (rot) me.rotation.set(...rot); me.updateMatrix(); me.userData.local = me.matrix.clone(); me.matrixAutoUpdate = false; g.add(me); bound.push({ mesh: me, node }); return me; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  K.add('torso', [0, 0, -0.6], g => {
    at(g, sk.spine, box(0.26 * S2 * B, 0.3, 0.15 * B), body(), 0, 0.15, 0);
    at(g, sk.hips, box(0.2 * S2 * B, 0.08, 0.12 * B), body(), 0, 0, 0);
  });
  K.add('armor', [0, 0.15, 0.7], g => {
    at(g, sk.spine, box(0.24 * S2 * B, 0.2, 0.03), plate(), 0, 0.18, 0.09 * B);
    for (const s of [-1, 1]) at(g, sk['sh' + (s < 0 ? 'L' : 'R')], box(0.1 * B, 0.06, 0.12 * B), plate(), s * 0.02, 0.03, 0);
    if (v.id === 'servo') for (const y of [0.1, 0.26]) at(g, sk.spine, box(0.25 * S2, 0.012, 0.002), mat(0x111827), 0, y, 0.106 * B);
  });
  K.add('head', [0, 0.55, 0], g => {
    if (v.id === 'boxer') { at(g, sk.head, new THREE.SphereGeometry(0.085, 20, 14), plate(), 0, 0.06, 0); at(g, sk.head, new THREE.SphereGeometry(0.07, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), mat(C.visor, { r: 0.1, m: 0.6 }), 0, 0.06, 0.025, [Math.PI / 2, 0, 0]); }
    else { at(g, sk.head, box(0.13 * B, 0.12, 0.12 * B), plate(), 0, 0.06, 0); at(g, sk.head, box(0.1 * B, 0.025, 0.01), mat(C.visor, { e: C.visor, ei: 1.4 }), 0, 0.07, 0.062 * B); }
  });
  K.add('imu', [0.5, 0.3, 0.3], g => { at(g, sk.spine, box(0.05, 0.05, 0.02), M.pcb(), 0, 0.16, 0.03); });
  K.add('battery', [0, 0.1, -0.9], g => { at(g, sk.spine, box(0.14 * S2, 0.12, 0.05), M.batt(), 0, 0.14, -0.09 * B); });
  K.add('estop', [0, 0.6, -0.8], g => { at(g, sk.spine, new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), mat(0xef4444, { e: 0x400000 }), 0.06, 0.26, -0.085 * B, [Math.PI / 2, 0, 0]); });
  K.add('arm', [0, 0.1, 0.5], g => {
    for (const k of ['L', 'R']) { at(g, sk['sh' + k], box(0.06 * B, 0.17, 0.06 * B), body(), 0, -0.085, 0); at(g, sk['el' + k], box(0.055 * B, 0.15, 0.055 * B), body(), 0, -0.075, 0); }
  });
  K.add('fist', [0, -0.1, 0.8], g => {
    for (const k of ['L', 'R']) { const f = v.id === 'boxer' ? new THREE.SphereGeometry(0.055, 16, 12) : box(0.075 * B, 0.075 * B, 0.075 * B); at(g, sk['hd' + k], f, mat(C.fist, { r: 0.5 }), 0, -0.03, 0); }
  });
  K.add('leg', [0, -0.2, 0.5], g => {
    for (const k of ['L', 'R']) { at(g, sk['hip' + k], box(0.08 * B, 0.21, 0.08 * B), body(), 0, -0.11, 0); at(g, sk['kn' + k], box(0.07 * B, 0.2, 0.075 * B), body(), 0, -0.1, 0);
      if (v.id === 'servo') at(g, sk['kn' + k], box(0.072, 0.07, 0.003), plate(), 0, -0.1, 0.039); }
  });
  K.add('foot', [0, -0.4, 0.3], g => { for (const k of ['L', 'R']) at(g, sk['an' + k], box(0.1 * B * (v.id === 'servo' ? 1.5 : 1), 0.025, 0.17 * B * (v.id === 'servo' ? 1.2 : 1)), v.id === 'servo' ? plate() : M.dark(), 0, -0.02, 0.025); });
  K.add('servo', [0.7, 0, 0], g => {
    const cyl = () => new THREE.CylinderGeometry(0.03 * B, 0.03 * B, 0.07 * B, 14);
    for (const k of ['L', 'R']) for (const n of ['sh', 'el', 'hip', 'kn', 'an']) at(g, sk[n + k], cyl(), joint(), 0, 0, 0, [0, 0, Math.PI / 2]);
    at(g, sk.head, cyl(), joint(), 0, -0.01, 0);
  });
  // 姿勢
  const P = { punchL: 0, punchR: 0, kick: 0, block: 0, walk: 0, walkAmt: 0, down: 0, guard: 1, t: 0 };
  function pose(p) {
    const g = p.guard ?? 1, sw = Math.sin(p.walk) * 0.45 * p.walkAmt;
    sk.hips.position.y = 0.5 - Math.abs(Math.sin(p.walk)) * 0.015 * p.walkAmt - p.down * 0.36;
    sk.hips.rotation.set(-p.down * 1.45, 0, 0);
    sk.spine.rotation.set(0.08 * g + p.block * 0.15, (p.punchR - p.punchL) * 0.35, 0);
    sk.head.rotation.set(-0.05, 0, 0);
    for (const [k, s, pu] of [['L', -1, p.punchL], ['R', 1, p.punchR]]) {
      const guardSh = -0.45 * g - p.block * 0.35, guardEl = -2.0 * g - p.block * 0.3;
      sk['sh' + k].rotation.set(guardSh + (-1.55 - guardSh) * pu, 0, s * (0.12 + p.block * 0.1));
      sk['el' + k].rotation.set(guardEl * (1 - pu), 0, 0);
    }
    sk.hipL.rotation.set(-sw - 0.1, 0, -0.04); sk.knL.rotation.set(Math.max(0, sw) * 0.8 + 0.15, 0, 0); sk.anL.rotation.set(-0.05, 0, 0.04);
    sk.hipR.rotation.set(sw - 0.1 - p.kick * 1.4, 0, 0.04); sk.knR.rotation.set(Math.max(0, -sw) * 0.8 + 0.15 + p.kick * (p.kick < 0.6 ? 1.2 : 0.2), 0, 0); sk.anR.rotation.set(-0.05, 0, -0.04);
    sk.root.updateMatrixWorld(true);
    for (const b of bound) b.mesh.matrix.multiplyMatrices(b.node.matrixWorld, b.mesh.userData.local);
  }
  pose(P);
  const kit = finish(K, (dt, s = {}) => {
    if (s.pose) Object.assign(P, s.pose);
    else { P.t += dt * (1 + (s.speed ?? 0.4) * 3); const c = (P.t % 1.6) / 1.6; const t = s.speed ?? 0.4; P.punchL = t > 0.05 ? Math.max(0, Math.sin(Math.min(1, c / 0.3) * Math.PI)) * t : 0; P.punchR = t > 0.05 ? Math.max(0, Math.sin(Math.min(1, Math.max(0, c - 0.5) / 0.3) * Math.PI)) * t : 0; P.walk += dt * 3 * t; P.walkAmt = 0.3 * t; P.kick = 0; P.down = 0; }
    pose(P);
  });
  kit.pose = p => { Object.assign(P, p); pose(P); };
  return kit;
}

/* ───────────── 無人船（無人水面載具 USV 造型：隱身多面船殼＋感測桅桿） ───────────── */
// 多面船殼：截面＝甲板邊→硬舭（chine）→龍骨，船首收尖上翹，船尾平板
function hullGeo(len, beam, depth, flare = 0.12) {
  const segs = 22, pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, z = -len / 2 + t * len;
    const bow = t > 0.62 ? Math.pow(Math.max(0, (1 - t) / 0.38), 0.85) : 1;
    const b = beam / 2 * Math.max(0.02, bow), sheer = depth * 0.35 + (t > 0.62 ? (t - 0.62) * depth * 0.9 : 0);
    const keel = -depth * (t > 0.8 ? Math.max(0.15, 1 - (t - 0.8) * 3.2) : 1), chineY = keel * 0.45;
    pos.push(-b * (1 + flare), sheer, z, -b * 0.92, chineY, z, 0, keel, z, b * 0.92, chineY, z, b * (1 + flare), sheer, z);
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j, b2 = a + 5; idx.push(a, b2, a + 1, a + 1, b2, b2 + 1); }
  const deck = pos.length / 3;
  for (let i = 0; i <= segs; i++) { const k = i * 5; pos.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2], pos[(k + 4) * 3], pos[(k + 4) * 3 + 1], pos[(k + 4) * 3 + 2]); }
  for (let i = 0; i < segs; i++) { const a = deck + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  idx.push(0, 2, 1, 0, 3, 2, 0, 4, 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const ng = g.toNonIndexed(); ng.computeVertexNormals(); return ng;   // 非索引＝每個面平面著色，呈現隱身多面感
}
// 稜角上層結構：底面 w1×d1、頂面 w2×d2、高 h（截頂角錐）
function frustum(w1, d1, w2, d2, h, shiftZ = 0) {
  const g = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const top = p.getY(i) > 0; p.setX(i, p.getX(i) * (top ? w2 : w1)); p.setZ(i, p.getZ(i) * (top ? d2 : d1) + (top ? shiftZ : 0)); p.setY(i, top ? h : 0); }
  g.computeVertexNormals(); return g;
}
function buildBoat(v) {
  const K = makeKit();
  const hullC = { vhull: 0x4b5563, catamaran: 0x9ca3af, foil: 0xe5e7eb }[v.id] ?? 0x6b7280;
  const paint = mat(hullC, { r: 0.55, m: 0.25, side: THREE.DoubleSide });
  const accent = mat(v.color, { r: 0.45 });
  let prop = null, rudder = null; const props = [];
  const LEN = 1.5;
  K.add('hull', [0, -0.6, 0], g => {
    if (v.id === 'catamaran') {
      for (const sx of [-1, 1]) g.add(mesh(hullGeo(LEN, 0.16, 0.14, 0.02), paint, sx * 0.23, 0, 0));
      g.add(mesh(frustum(0.62, 1.05, 0.62, 1.05, 0.06), paint, 0, 0.04, -0.06));
      const bow = mesh(frustum(0.62, 0.3, 0.2, 0.05, 0.06, 0.12), paint, 0, 0.04, 0.6); bow.rotation.x = Math.PI / 2 * 0; g.add(bow);
    } else g.add(mesh(hullGeo(LEN, v.id === 'foil' ? 0.36 : 0.4, v.id === 'foil' ? 0.12 : 0.16), paint));
    g.add(mesh(new THREE.BoxGeometry(v.id === 'catamaran' ? 0.64 : 0.42, 0.012, 0.03), accent, 0, 0.065, -0.73));   // 船尾識別色帶
  });
  K.add('canopy', [0, 0.7, 0], g => {
    const deckY = v.id === 'catamaran' ? 0.1 : 0.06;
    const sup = mesh(frustum(v.id === 'catamaran' ? 0.42 : 0.26, 0.5, v.id === 'catamaran' ? 0.3 : 0.17, 0.3, 0.17, -0.05), mat(hullC, { r: 0.5, m: 0.25 }), 0, deckY, -0.05); g.add(sup);
    const win = mesh(frustum(v.id === 'catamaran' ? 0.36 : 0.22, 0.02, v.id === 'catamaran' ? 0.28 : 0.16, 0.02, 0.06), mat(0x0f172a, { r: 0.1, m: 0.6 }), 0, deckY + 0.08, 0.17); win.rotation.x = -0.5; g.add(win);
    if (v.id !== 'catamaran') g.add(mesh(frustum(0.2, 0.35, 0.05, 0.05, 0.05, 0.12), mat(hullC, { r: 0.5 }), 0, 0.06, 0.42));   // 前甲板稜線
  });
  K.add('sensor', [0, 1.0, -0.2], g => {
    const deckY = (v.id === 'catamaran' ? 0.1 : 0.06) + 0.17;
    g.add(mesh(new THREE.BoxGeometry(0.02, 0.26, 0.02), M.dark(), 0, deckY + 0.13, -0.1));
    g.add(mesh(new THREE.BoxGeometry(0.16, 0.012, 0.012), M.dark(), 0, deckY + 0.22, -0.1));
    g.add(mesh(new THREE.SphereGeometry(0.045, 16, 12), M.white(), 0, deckY + 0.29, -0.1));                          // 雷達罩
    const cam = new THREE.Group(); cam.position.set(0, deckY + 0.02, 0.06);
    cam.add(mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.03, 16), M.white()));
    cam.add(mesh(new THREE.SphereGeometry(0.035, 16, 12), M.white(), 0, 0.04, 0));
    cam.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 12), mat(0x0f172a, { m: 0.6, r: 0.2 }), 0, 0.04, 0.035)).rotation.x = Math.PI / 2;
    g.add(cam);                                                                                                         // 光電攝影機
    for (const sx of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.18), M.white(), sx * 0.07, deckY + 0.3, -0.1));   // 通訊天線
    g.add(mesh(new THREE.SphereGeometry(0.012, 8, 6), mat(0x22c55e, { e: 0x22c55e, ei: 2 }), 0.08, deckY + 0.22, -0.1));          // 右舷綠燈
    g.add(mesh(new THREE.SphereGeometry(0.012, 8, 6), mat(0xef4444, { e: 0xef4444, ei: 2 }), -0.08, deckY + 0.22, -0.1));         // 左舷紅燈
  });
  K.add('motor', [0, 0.45, -0.5], g => { const m = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 16), M.steel(), 0, -0.04, -0.2); m.rotation.x = Math.PI / 2; g.add(m); const jk = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16), mat(0x0369a1, { m: 0.5 }), 0, -0.04, -0.2); jk.rotation.x = Math.PI / 2; g.add(jk); });
  const shaftX = v.id === 'catamaran' ? [-0.23, 0.23] : [0];
  K.add('shaft', [0, -0.25, -0.6], g => { for (const x of shaftX) { const s = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5), M.steel(), x, -0.12, -0.48); s.rotation.x = Math.PI / 2 - 0.12; g.add(s); } });
  K.add('prop', [0, -0.3, -0.9], g => {
    for (const x of shaftX) {
      const p = new THREE.Group(); p.position.set(x, -0.16, -0.74);
      for (let b = 0; b < 3; b++) { const blade = mesh(new THREE.BoxGeometry(0.1, 0.006, 0.035), M.gold(), 0.04, 0, 0); blade.rotation.x = 0.5; const h = new THREE.Group(); h.rotation.z = b * Math.PI * 2 / 3; h.add(blade); p.add(h); }
      p.rotation.x = Math.PI / 2; const hold = new THREE.Group(); hold.add(p); g.add(hold); props.push(p);
    }
    prop = props[0];
  });
  K.add('rudder', [0.5, 0, -0.7], g => { const r = new THREE.Group(); r.position.set(v.id === 'catamaran' ? 0 : 0.1, 0, -0.74); r.add(mesh(new THREE.BoxGeometry(0.008, 0.16, 0.07), M.steel(), 0, -0.1, -0.02)); g.add(r); rudder = r; g.add(mesh(new THREE.BoxGeometry(0.05, 0.03, 0.03), M.black(), r.position.x, 0.05, -0.62)); });
  K.add('battery', [-0.6, 0.4, 0.1], g => g.add(mesh(new THREE.BoxGeometry(0.12, 0.05, 0.3), M.batt(), 0, 0.0, 0.12)));
  K.add('esc', [0.6, 0.4, 0.2], g => { g.add(mesh(new THREE.BoxGeometry(0.08, 0.03, 0.1), mat(0x7c2d12), 0.08, 0.0, -0.32)); g.add(mesh(new THREE.BoxGeometry(0.04, 0.02, 0.035), M.black(), -0.08, 0.0, -0.36)); });
  K.add('cooling', [-0.5, 0.2, -0.5], g => { const c = mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 20, Math.PI * 1.5), mat(0x38bdf8, { t: 0.85 }), -0.1, -0.02, -0.3); c.rotation.y = Math.PI / 2; g.add(c); g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12), M.steel(), -0.12, -0.1, -0.68)); });
  if (v.id === 'foil') K.add('foil', [0, -0.7, 0], g => {
    for (const z of [0.38, -0.55]) { g.add(mesh(new THREE.BoxGeometry(0.012, 0.26, 0.05), M.steel(), 0, -0.2, z)); g.add(mesh(new THREE.BoxGeometry(z > 0 ? 0.5 : 0.32, 0.012, 0.09), M.steel(), 0, -0.33, z)); }
  });
  const update = (dt, s = {}) => { for (const p of props) p.rotation.y += (s.throttle ?? 0.5) * 70 * dt; if (rudder) rudder.rotation.y = -(s.steer ?? 0) * 0.5; };
  return finish(K, update);
}

/* ───────────── 共用：拆解、透視、高亮 ───────────── */
function finish(K, update) {
  const { root, parts } = K;
  let explode = 0, xray = false, hi = null;
  const original = new Map();
  root.traverse(o => { if (o.isMesh) original.set(o, { em: o.material.emissive?.getHex?.() ?? 0, op: o.material.opacity, tr: o.material.transparent }); });
  // 每個 mesh 的材質複製一份，避免高亮時互相影響
  root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); } });
  const apply = () => {
    for (const p of parts) {
      const k = p.id === hi ? Math.max(explode, 0.35) : explode;
      p.group.position.copy(p.home).addScaledVector(p.dir, k);
      if (p.group.userData.spread) p.group.scale.setScalar(1 + k * 0.25);
    }
  };
  const paint = () => root.traverse(o => {
    if (!o.isMesh) return;
    const id = o.userData.partId, base = original.get(o) || { em: 0, op: 1, tr: false };
    const dim = xray && hi && id !== hi;
    o.material.transparent = base.tr || xray || dim; o.material.opacity = dim ? 0.12 : (xray ? (id === hi ? 1 : 0.35) : base.op);
    o.material.depthWrite = !o.material.transparent || o.material.opacity > 0.9;
    if (o.material.emissive) o.material.emissive.setHex(id === hi ? 0x8a2a06 : base.em);
    o.material.needsUpdate = true;
  });
  return {
    group: root, parts, update,
    setExplode(k) { explode = k; apply(); },
    getExplode: () => explode,
    setXray(on) { xray = on; paint(); },
    highlight(id) { hi = id; apply(); paint(); },
    dispose() { root.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); }
  };
}

export function buildVehicle(type, variant) {
  const v = variantOf(type, variant);
  const kit = type === 'robot' ? buildRobot(v) : type === 'boat' ? buildBoat(v) : buildDrone(v);
  kit.variant = v; kit.type = type;
  kit.group.userData.vehicle = { type, variant: v.id };
  return kit;
}

// 競技場用的簡化外觀（少量網格，效能優先）；顏色可覆寫成隊伍色
export function buildArenaVehicle(type, variant, teamColor) {
  const k = buildVehicle(type, variant);
  if (teamColor != null && type === 'drone') k.group.traverse(o => { if (o.isMesh && (o.userData.partId === 'cage' || o.userData.partId === 'led')) { o.material.color.setHex(teamColor); if (o.userData.partId === 'led') o.material.emissive.setHex(teamColor); } });
  return k;
}
