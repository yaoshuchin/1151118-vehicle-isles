// 自動綁骨架：從人物「正面輪廓」找出手臂和腿，建立 5 根骨頭（root／armL／armR／legL／legR），
// 讓 A 真人立牌（紙偶式）與 B／C／匯入的 GLB 都能擺手、抬腿。不需要外部軟體，載入時即時計算。
import * as THREE from '../vendor/three.module.min.js';

const NY = 220; // 輪廓格子的高度解析度

// ---- 輪廓分析：mask[row*nx+col]，row 0 = 最下面 ----
function runsOf(mask, nx, r) {
  const out = []; let s = -1;
  for (let c = 0; c <= nx; c++) {
    const on = c < nx && mask[r * nx + c];
    if (on && s < 0) s = c; else if (!on && s >= 0) { out.push([s, c - 1]); s = -1; }
  }
  return out;
}

function analyze(mask, nx, ny) {
  // 身體中線：中段高度的重心
  let sx = 0, n = 0;
  for (let r = Math.floor(ny * 0.3); r < ny * 0.7; r++) for (let c = 0; c < nx; c++) if (mask[r * nx + c]) { sx += c; n++; }
  if (!n) return null;
  const xc = sx / n;
  const bL = new Array(ny).fill(null), bR = new Array(ny).fill(null), aCL = new Array(ny).fill(null), aCR = new Array(ny).fill(null), legRow = new Array(ny).fill(false), legC = new Array(ny).fill(null);
  for (let r = 0; r < ny; r++) {
    const runs = runsOf(mask, nx, r); if (!runs.length) continue;
    let ti = runs.findIndex(([a, b]) => a <= xc && b >= xc), li, ri;
    if (ti >= 0) { li = ri = ti; }
    else { // 中線落在縫裡 → 兩條腿
      ri = runs.findIndex(([a]) => a > xc); li = ri < 0 ? runs.length - 1 : ri - 1;
      if (li >= 0 && ri >= 0 && r < ny * 0.6) { legRow[r] = true; legC[r] = [(runs[li][0] + runs[li][1]) / 2, (runs[ri][0] + runs[ri][1]) / 2]; }
      if (li < 0 || ri < 0) continue;
    }
    if (r > ny * 0.22 && r < ny * 0.86) {
      if (li > 0) { bL[r] = (runs[li - 1][1] + runs[li][0]) / 2; aCL[r] = (runs[li - 1][0] + runs[li - 1][1]) / 2; }
      if (ri < runs.length - 1) { bR[r] = (runs[ri][1] + runs[ri + 1][0]) / 2; aCR[r] = (runs[ri + 1][0] + runs[ri + 1][1]) / 2; }
    }
  }
  // 手臂：取最長的連續區段（中間斷開 4% 以內視為同一段）
  const seg = arr => {
    let best = null, s = -1, last = -1; const gap = ny * 0.04;
    for (let r = 0; r <= ny; r++) {
      const on = r < ny && arr[r] !== null;
      if (on) { if (s < 0 || r - last > gap) { if (s >= 0 && (!best || last - s > best[1] - best[0])) best = [s, last]; s = r; } last = r; }
    }
    if (s >= 0 && (!best || last - s > best[1] - best[0])) best = [s, last];
    return best && best[1] - best[0] >= ny * 0.06 ? best : null;
  };
  const arm = (b, ac, side) => {
    const sg = seg(b); if (!sg) return null;
    const [lo, hi] = sg;
    for (let r = lo; r <= hi; r++) if (b[r] === null) { b[r] = b[r - 1]; ac[r] = ac[r - 1]; }
    // 轉軸放在「分得開的那段」最上面：整隻手分開→肩膀；只有前臂分開→手肘（不會脫離身體）
    const bnd = r => b[Math.min(hi, Math.max(lo, Math.round(r)))];
    return { lo, hi, bnd, side, acLo: ac[lo], pivot: [ac[hi], hi] };
  };
  const armL = arm(bL, aCL, -1), armR = arm(bR, aCR, 1);
  // 腿：下半身裡有分開的列，取最高那列當胯下
  let lo = -1, hi = -1, cnt = 0;
  for (let r = 0; r < ny * 0.6; r++) if (legRow[r]) { if (lo < 0) lo = r; hi = r; cnt++; }
  let legs = null;
  if (hi - lo >= ny * 0.15 && cnt >= (hi - lo) * 0.45) {
    const c = legC[hi]; legs = { crotch: hi, pivotL: [c[0], hi + ny * 0.03], pivotR: [c[1], hi + ny * 0.03] };
  }
  return { xc, armL, armR, legs };
}

// 每個點的骨頭與權重（最多 2 個影響：肢體 + root）
function weigh(A, cx, cy, ny) {
  for (const a of [A.armL, A.armR]) {
    if (!a) continue;
    const blend = ny * 0.025, ext = ny * 0.045;
    if (cy < a.lo - ext || cy > a.hi + blend) continue;
    let b = a.bnd(cy); if (b === null) continue;
    if (cy < a.lo) b = (b + a.acLo) / 2; // 手掌貼著大腿的那段：只收比分界線更外側的部分
    if (a.side < 0 ? cx < b : cx > b) return [a.side < 0 ? 1 : 2, cy <= a.hi ? 1 : 1 - (cy - a.hi) / blend];
  }
  if (A.legs) {
    const up = ny * 0.03, dn = ny * 0.03, c = A.legs.crotch;
    if (cy < c + up) return [cx < A.xc ? 3 : 4, cy <= c - dn ? 1 : 1 - (cy - (c - dn)) / (up + dn)];
  }
  return [0, 1];
}

function makeSkeleton(pts, parent) {
  const root = new THREE.Bone(); root.name = 'root';
  const bones = [root];
  for (const [name, p] of pts) { const b = new THREE.Bone(); b.name = name; if (p) b.position.copy(p); root.add(b); bones.push(b); }
  parent.add(root); parent.updateMatrixWorld(true);
  return { root, bones, skeleton: new THREE.Skeleton(bones) };
}

function skinAttrs(geo, fn) {
  const pos = geo.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const [b, w] = fn(pos.getX(i), pos.getY(i), pos.getZ(i)); si[i * 4] = b; sw[i * 4] = w; si[i * 4 + 1] = 0; sw[i * 4 + 1] = 1 - w; }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
}

// ---- A 真人立牌：細分平面 + 圖片透明度輪廓 ----
export function rigStandee(tex, W, H, material) {
  const img = tex.image, ny = NY, nx = Math.max(8, Math.round(NY * W / H));
  const cv = document.createElement('canvas'); cv.width = nx; cv.height = ny;
  const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, nx, ny);
  const d = ctx.getImageData(0, 0, nx, ny).data, mask = new Uint8Array(nx * ny);
  for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) mask[r * nx + c] = d[((ny - 1 - r) * nx + c) * 4 + 3] > 40 ? 1 : 0;
  const A = analyze(mask, nx, ny);
  // 不共用頂點：每個三角形整塊歸給一根骨頭（紙偶式），轉動時不會拉出殘影
  const geo = new THREE.PlaneGeometry(W, H, 80, 160).toNonIndexed(); geo.translate(0, H / 2, 0);
  const toC = (x, y) => [(x + W / 2) / W * nx, y / H * ny], toW = ([cx, cy]) => new THREE.Vector3(cx / nx * W - W / 2, cy / ny * H, 0.002);
  if (!A || (!A.armL && !A.armR && !A.legs)) return { mesh: new THREE.Mesh(geo, material), rig: null };
  const mesh = new THREE.SkinnedMesh(geo, material);
  { const pos = geo.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i += 3) {
      const [cx, cy] = toC((pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3);
      const [b, w] = weigh(A, cx, cy, ny), bone = w >= 0.5 ? b : 0;
      for (let k = i; k < i + 3; k++) { si[k * 4] = bone; sw[k * 4] = 1; }
    }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); }
  const sk = makeSkeleton([['armL', A.armL && toW(A.armL.pivot)], ['armR', A.armR && toW(A.armR.pivot)], ['legL', A.legs && toW(A.legs.pivotL)], ['legR', A.legs && toW(A.legs.pivotR)]], mesh);
  mesh.bind(sk.skeleton); mesh.frustumCulled = false;
  const [, armL, armR, legL, legR] = sk.bones;
  return { mesh, rig: { flat: true, armL: A.armL && armL, armR: A.armR && armR, legL: A.legs && legL, legR: A.legs && legR } };
}

// ---- 3D 模型（GLB）：把所有三角形投影到正面算輪廓 ----
const baked = new Map(); // 原始 geometry.uuid → 已烘焙+蒙皮的 geometry 與骨頭位置
export function rigModel(s) {
  s.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(s.matrixWorld).invert();
  const meshes = []; s.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) meshes.push(o); });
  if (!meshes.length) return null;
  const key = meshes.map(m => m.geometry.uuid).join('|');
  let rec = baked.get(key);
  if (!rec) {
    const geos = meshes.map(m => { const g = m.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)); return g; });
    const box = new THREE.Box3(); geos.forEach(g => { g.computeBoundingBox(); box.union(g.boundingBox); });
    const H = box.max.y - box.min.y, cell = H / NY, nx = Math.ceil((box.max.x - box.min.x) / cell) + 1, ny = NY;
    const mask = new Uint8Array(nx * ny), toC = (x, y) => [(x - box.min.x) / cell, (y - box.min.y) / cell];
    // 三角形點陣化到正面格子
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (const g of geos) {
      const p = g.attributes.position, idx = g.index, tc = idx ? idx.count / 3 : p.count / 3;
      for (let t = 0; t < tc; t++) {
        const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
        a.fromBufferAttribute(p, i0); b.fromBufferAttribute(p, i1); c.fromBufferAttribute(p, i2);
        const [ax, ay] = toC(a.x, a.y), [bx, by] = toC(b.x, b.y), [cx, cy] = toC(c.x, c.y);
        const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(nx - 1, Math.floor(Math.max(ax, bx, cx))), y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(ny - 1, Math.floor(Math.max(ay, by, cy)));
        const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
        for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
          if (x1 - x0 < 1 && y1 - y0 < 1) { mask[yy * nx + xx] = 1; continue; }
          const px = xx + 0.5, py = yy + 0.5;
          if (Math.abs(den) < 1e-9) { mask[yy * nx + xx] = 1; continue; }
          const l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den, l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den;
          if (l1 >= -0.02 && l2 >= -0.02 && l1 + l2 <= 1.02) mask[yy * nx + xx] = 1;
        }
      }
    }
    const A = analyze(mask, nx, ny);
    if (!A || (!A.armL && !A.armR && !A.legs)) { baked.set(key, rec = { none: true }); }
    else {
      // 每塊肢體在關節附近的平均深度（z），讓轉軸落在肢體中間
      const zs = { 1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0] };
      for (const g of geos) skinAttrs(g, (x, y, z) => {
        const [cx, cy] = toC(x, y), w = weigh(A, cx, cy, ny);
        if (w[0] && w[1] > 0.5) { const piv = w[0] === 1 ? A.armL.pivot : w[0] === 2 ? A.armR.pivot : w[0] === 3 ? A.legs.pivotL : A.legs.pivotR; if (Math.abs(cy - piv[1]) < ny * 0.08) { zs[w[0]][0] += z; zs[w[0]][1]++; } }
        return w;
      });
      // 拆開共用頂點：一個三角形若「一邊跟肢體、一邊跟身體」差太多（例如手掌貼著屁股），整塊歸給中心點那邊，避免拉出長條
      for (let gi = 0; gi < geos.length; gi++) {
        const g = geos[gi].index ? geos[gi].toNonIndexed() : geos[gi]; geos[gi] = g;
        const P = g.attributes.position, SI = g.attributes.skinIndex.array, SW = g.attributes.skinWeight.array;
        for (let i = 0; i < P.count; i += 3) {
          let mn = 1, mx = 0, b0 = -1, mixed = false;
          for (let k = i; k < i + 3; k++) { const b = SI[k * 4], w = b ? SW[k * 4] : 0; mn = Math.min(mn, w); mx = Math.max(mx, w); if (b) { if (b0 >= 0 && b0 !== b) mixed = true; b0 = b; } }
          if (!mixed && mx - mn <= 0.5) continue;
          const [cx, cy] = toC((P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3), [b, w] = weigh(A, cx, cy, ny), bone = w >= 0.5 ? b : 0;
          for (let k = i; k < i + 3; k++) { SI[k * 4] = bone; SW[k * 4] = 1; SI[k * 4 + 1] = 0; SW[k * 4 + 1] = 0; }
        }
      }
      const toW = ([cx, cy], k) => new THREE.Vector3(box.min.x + cx * cell, box.min.y + cy * cell, zs[k][1] ? zs[k][0] / zs[k][1] : (box.min.z + box.max.z) / 2);
      rec = { geos, piv: [['armL', A.armL && toW(A.armL.pivot, 1)], ['armR', A.armR && toW(A.armR.pivot, 2)], ['legL', A.legs && toW(A.legs.pivotL, 3)], ['legR', A.legs && toW(A.legs.pivotR, 4)]] };
      baked.set(key, rec);
    }
  }
  if (rec.none) return null;
  const sk = makeSkeleton(rec.piv.map(([n, p]) => [n, p && p.clone()]), s);
  meshes.forEach((m, i) => {
    const sm = new THREE.SkinnedMesh(rec.geos[i], m.material); sm.frustumCulled = false;
    m.parent.remove(m); s.add(sm); sm.bind(sk.skeleton);
  });
  const [, armL, armR, legL, legR] = sk.bones, has = n => rec.piv.find(p => p[0] === n)[1];
  return { flat: false, armL: has('armL') && armL, armR: has('armR') && armR, legL: has('legL') && legL, legR: has('legR') && legR };
}

// ---- 依動作擺動手腳 ----
// 參數：a 動作名、t 時間、ph 相位、air 0~1 目前離地高度比例、party 是否在歡呼
export function poseRig(R, a, t, ph, air, party) {
  let sw = 0, up = 0.06, lsw = 0, lup = 0;
  const s = Math.sin(t * 5.5 + ph);
  if (a === 'patrol' || a === 'wander') { sw = s * 0.45; lsw = s * 0.4; up = 0.08; }
  else if (a === 'dance') { up = 1.0 + Math.sin(t * 4 + ph) * 0.45; sw = Math.sin(t * 2 + ph) * 0.3; lsw = Math.sin(t * 4 + ph) * 0.18; }
  else if (a === 'hop') { up = 0.25 + air * 1.9; lup = air * 0.35; }
  else if (a === 'idle') { sw = Math.sin(t * 1.6 + ph) * 0.07; up = 0.07 + Math.sin(t * 2 + ph) * 0.04; }
  else if (a === 'none') { up = 0.04; }
  if (party) { up = 2.4 + Math.sin(t * 8 + ph) * 0.3; lup = air * 0.3; }
  if (R.flat) {
    // 紙偶：只能在平面內轉（z 軸）
    const kick = a === 'patrol' || a === 'wander';
    if (R.armL) R.armL.rotation.z = -(up * 0.85 + (kick ? Math.max(0, s) * 0.28 : sw * 0.4));
    if (R.armR) R.armR.rotation.z = up * 0.85 + (kick ? Math.max(0, -s) * 0.28 : -sw * 0.4);
    if (R.legL) R.legL.rotation.z = -(kick ? Math.max(0, -s) * 0.16 : lsw * 0.25) - lup * 0.4;
    if (R.legR) R.legR.rotation.z = (kick ? Math.max(0, s) * 0.16 : lsw * 0.25) + lup * 0.4;
  } else {
    // 3D：幅度收一點，避免手穿過身體、褲子被拉扯
    const u3 = Math.min(up, 2.2) * 0.8, s3 = sw * 0.85, l3 = lsw * 0.8;
    if (R.armL) R.armL.rotation.set(s3, 0, -u3);
    if (R.armR) R.armR.rotation.set(-s3, 0, u3);
    if (R.legL) R.legL.rotation.set(-l3 - lup, 0, -lup * 0.3);
    if (R.legR) R.legR.rotation.set(l3 - lup, 0, lup * 0.3);
  }
}
