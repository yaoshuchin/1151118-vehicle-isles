// 載具工坊（生成器）：調參數 → 3D 預覽＋即時性能 → 匯出 GLB／Blender 腳本／規格／技能包；也能請 AI 依需求調參數
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createStudio, approach } from './studio.js';
import { buildVehicle, VARIANTS, TYPE_NAME, variantOf } from './models.js';
import { kin, SPEC } from './kin.js';
import { PARTS } from '../data/parts.js';
import { $, el, toast, topbar } from './ui.js';
import { mountAI, askAI } from './aiconn.js';

topbar('forge');
const S = createStudio($('#c'), { cam: [1.9, 1.3, 2.3], target: [0, 0.25, 0], floorY: -0.35 });
S.controls.autoRotate = true; S.controls.autoRotateSpeed = 1;
let saved = {}; try { saved = JSON.parse(localStorage.getItem('vi.forge') || localStorage.getItem('vi.vehicle') || '{}'); } catch (_) {}

const DEF = {
  drone: [['mass_g', '全重', 120, 320, 5, 'g'], ['KV', '馬達 KV', 3000, 8000, 100, ''], ['cell', '電池串數', 1, 3, 1, 'S'], ['Tmax_g', '單顆最大推力', 90, 260, 5, 'g'], ['cap_mAh', '電池容量', 300, 850, 25, 'mAh']],
  robot: [['omega', '肩關節最高角速度', 4, 16, 0.5, 'rad/s'], ['reach', '手臂長', 0.1, 0.9, 0.01, 'm'], ['fist', '拳頭等效質量', 0.03, 5, 0.01, 'kg'], ['mass', '全重', 1, 150, 0.5, 'kg'], ['foot', '腳掌半寬', 0.04, 0.25, 0.01, 'm'], ['com', '重心高度', 0.15, 1.1, 0.01, 'm']],
  boat: [['KV', '馬達 KV', 1800, 4000, 50, ''], ['cell', '電池串數', 2, 4, 1, 'S'], ['prop_mm', '螺旋槳直徑', 28, 45, 1, 'mm'], ['pitchRatio', '螺距比', 1.0, 2.0, 0.05, ''], ['mass_kg', '全重', 0.9, 2.2, 0.05, 'kg']]
};
function defaults(type, variant) {
  const s = SPEC[type];
  if (type === 'drone') return { mass_g: s.mass_g, KV: s.KV, cell: s.cell, Tmax_g: s.Tmax_g, cap_mAh: s.cap_mAh };
  if (type === 'robot') { const r = s[variant] || s.servo; return { omega: r.omega, reach: r.reach, fist: r.fist, mass: r.mass, foot: r.foot, com: r.com }; }
  return { KV: s.KV, cell: s.cell, prop_mm: s.prop_mm, pitchRatio: s.pitchRatio, mass_kg: s.mass_kg };
}
let D = { type: saved.type || 'drone', variant: saved.variant || 'red', name: saved.name || '', color: saved.color || null, scale: saved.scale || 1, p: saved.p || null };
if (!VARIANTS[D.type]) D.type = 'drone';
if (!VARIANTS[D.type].some(v => v.id === D.variant)) D.variant = VARIANTS[D.type][0].id;
if (!D.p || Object.keys(D.p).length !== DEF[D.type].length || DEF[D.type].some(d => D.p[d[0]] == null)) D.p = defaults(D.type, D.variant);

function specOf() {
  const sp = structuredClone(SPEC), p = D.p;
  if (D.type === 'drone') Object.assign(sp.drone, { mass_g: p.mass_g, KV: p.KV, cell: p.cell, Tmax_g: p.Tmax_g, cap_mAh: p.cap_mAh, Imax_A: 6 * (p.Tmax_g / 160) * (p.KV / 5000) ** 0.3 });
  if (D.type === 'robot') Object.assign(sp.robot[D.variant] || sp.robot.servo, p);
  if (D.type === 'boat') Object.assign(sp.boat, { KV: p.KV, cell: p.cell, prop_mm: p.prop_mm, pitchRatio: p.pitchRatio, mass_kg: p.mass_kg });
  return sp;
}
const colorHex = () => D.color || '#' + variantOf(D.type, D.variant).color.toString(16).padStart(6, '0');

let kit = null;
function rebuild() {
  if (kit) { S.scene.remove(kit.group); kit.dispose(); }
  kit = buildVehicle(D.type, D.variant);
  const col = new THREE.Color(colorHex()), base = variantOf(D.type, D.variant).color;
  kit.group.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() === new THREE.Color(base).getHex()) o.material.color.copy(col); });
  kit.group.scale.setScalar({ drone: 1.25, robot: 0.9, boat: 0.85 }[D.type] * D.scale);
  kit.group.position.y = D.type === 'boat' ? 0.05 : D.type === 'robot' ? -0.33 : 0.1;
  S.scene.add(kit.group); save();
}
function save() { try { localStorage.setItem('vi.forge', JSON.stringify(D)); } catch (_) {} }

function renderUI() {
  const T = $('#types'); T.innerHTML = '';
  for (const t of ['drone', 'robot', 'boat']) T.append(el('button', { class: t === D.type ? 'on' : '', onclick: () => { D.type = t; D.variant = VARIANTS[t][0].id; D.p = defaults(t, D.variant); D.color = null; renderUI(); rebuild(); } }, TYPE_NAME[t]));
  const V = $('#vars'); V.innerHTML = '';
  for (const v of VARIANTS[D.type]) V.append(el('button', { class: v.id === D.variant ? 'on' : '', onclick: () => { D.variant = v.id; if (D.type === 'robot') D.p = defaults('robot', v.id); D.color = null; renderUI(); rebuild(); } }, v.name));
  const P = $('#params'); P.innerHTML = '';
  P.append(el('div', { class: 'rng' }, el('label', {}, '載具名稱'), el('span', {}), el('input', { value: D.name, placeholder: variantOf(D.type, D.variant).name + '改', oninput: e => { D.name = e.target.value.slice(0, 20); save(); } })));
  P.append(el('div', { class: 'row' }, el('label', {}, '主色'), el('input', { type: 'color', value: colorHex(), style: 'width:60px;padding:2px', oninput: e => { D.color = e.target.value; rebuild(); } }),
    el('label', {}, '尺寸'), el('input', { type: 'range', min: 0.7, max: 1.3, step: 0.05, value: D.scale, style: 'flex:1;padding:0', oninput: e => { D.scale = +e.target.value; rebuild(); } })));
  for (const [k, label, min, max, step, unit] of DEF[D.type]) {
    const val = el('span', {}, fmt(D.p[k], step) + ' ' + unit);
    P.append(el('div', { class: 'rng' }, el('label', {}, label), val, el('input', { type: 'range', min, max, step, value: D.p[k], oninput: e => { D.p[k] = +e.target.value; val.textContent = fmt(D.p[k], step) + ' ' + unit; save(); } })));
  }
}
const fmt = (v, step) => step < 1 ? (+v).toFixed(step < 0.1 ? 2 : 1) : Math.round(v);

let thr = 0.7, thrT = 0.7;
$('#thr').oninput = e => thrT = e.target.value / 100;
let rt = 0;
S.onFrame((dt) => {
  if (!kit) return;
  thr = approach(thr, thrT, dt, 3);
  const k = kin(D.type, D.variant, thr, specOf());
  kit.update(dt, { throttle: thr, speed: thr, weapon: thr, fire: k.fire });
  rt -= dt; if (rt <= 0) { rt = 0.15; $('#read').innerHTML = k.read.map(([a, b]) => `<span>${a}</span><b class="hot">${b}</b>`).join('') + `<span>狀態</span><b>${k.state}</b>`; $('#check').textContent = k.check; }
});

/* ── 匯出 ── */
const fname = ext => `${(D.name || variantOf(D.type, D.variant).name).replace(/[\\/:*?"<>|\s]/g, '_')}.${ext}`;
function download(name, text, type = 'text/plain') { const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })), download: name }); document.body.append(a); a.click(); a.remove(); }
function specJSON() {
  const v = variantOf(D.type, D.variant), k = kin(D.type, D.variant, 1, specOf());
  return { name: D.name || v.name + '改', type: D.type, typeName: TYPE_NAME[D.type], variant: D.variant, variantName: v.name, color: colorHex(), scale: D.scale, params: D.p,
    fullThrottle: Object.fromEntries(k.read), parts: PARTS[D.type].order.filter(id => id !== 'foil' || D.variant === 'foil').map(id => ({ id, name: PARTS[D.type].list[id].name, role: PARTS[D.type].list[id].role })), source: '無人載具競技群島・載具工坊' };
}
$('#xJson').onclick = () => { const t = JSON.stringify(specJSON(), null, 2); $('#out').textContent = t; download(fname('json'), t, 'application/json'); };
$('#xGlb').onclick = () => new GLTFExporter().parse(kit.group, buf => { const a = el('a', { href: URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' })), download: fname('glb') }); document.body.append(a); a.click(); a.remove(); $('#out').textContent = '已下載 ' + fname('glb') + '\nBlender：File → Import → glTF 2.0 (.glb/.gltf)\n每個零件是獨立物件，名稱就是零件代號，可以直接在 Outliner 裡拆開。'; }, e => toast(e.message), { binary: true });
$('#xPy').onclick = () => { const t = bpy(); $('#out').textContent = t; download(fname('py'), t); };
$('#xSkill').onclick = () => { const t = skill(); $('#out').textContent = t; download('SKILL.md', t); };
$('#xPrompt').onclick = async () => { const t = prompt(); $('#out').textContent = t; try { await navigator.clipboard.writeText(t); toast('已複製提示詞，貼給 Claude Code 或 Codex'); } catch (_) { toast('瀏覽器不允許自動複製，請從下方預覽框手動複製'); } };

function bpy() {
  const j = specJSON(), c = new THREE.Color(j.color);
  return `# ${j.name}｜Blender 重建腳本（由「載具工坊」產生）
# 用法：Blender 頂端切到 Scripting → New → 貼上 → Run Script（錯誤訊息看底部 Console，不會跳視窗）
# 適用 Blender 4.2 以上（已在 5.x 語法下撰寫）。單位：公尺。
import bpy, math

TYPE = "${j.type}"; VARIANT = "${j.variant}"; SCALE = ${j.scale}
COLOR = (${c.r.toFixed(3)}, ${c.g.toFixed(3)}, ${c.b.toFixed(3)}, 1.0)

def mat(name, rgba, metal=0.1, rough=0.5):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")   # 依類型找節點，不依名稱（避免語系問題）
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rough
    return m

PAINT = mat("${j.id || 'paint'}_paint", COLOR, 0.2, 0.45)
DARK = mat("dark", (0.07, 0.09, 0.12, 1), 0.2, 0.6)
METAL = mat("metal", (0.7, 0.72, 0.75, 1), 0.9, 0.3)
BATT = mat("battery", (0.14, 0.38, 0.92, 1), 0.1, 0.4)

col = bpy.data.collections.new("${j.name}")
bpy.context.scene.collection.children.link(col)

def put(obj, name, m):
    obj.name = name
    obj.data.materials.append(m)
    for c in obj.users_collection: c.objects.unlink(obj)
    col.objects.link(obj)
    return obj

def box(name, size, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=[v * SCALE for v in loc], rotation=rot)
    o = bpy.context.active_object; o.scale = [s * SCALE for s in size]
    return put(o, name, m)

def cyl(name, r, h, loc, m, rot=(0, 0, 0), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r * SCALE, depth=h * SCALE, location=[v * SCALE for v in loc], rotation=rot)
    return put(bpy.context.active_object, name, m)

if TYPE == "drone":
    box("frame_plate", (0.16, 0.16, 0.025), (0, 0, 0), DARK)
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        box(f"frame_arm_{i}", (0.34, 0.035, 0.02), (math.cos(a) * 0.17, math.sin(a) * 0.17, 0), DARK, (0, 0, a))
        cyl(f"motor_{i}", 0.035, 0.045, (math.cos(a) * 0.32, math.sin(a) * 0.32, 0.03), METAL)
        cyl(f"prop_{i}", 0.075, 0.004, (math.cos(a) * 0.32, math.sin(a) * 0.32, 0.075), PAINT, verts=3)
    box("battery", (0.13, 0.07, 0.05), (0, 0, -0.04), BATT)
    for i in range(6):   # 球籠：六個經線圈
        bpy.ops.mesh.primitive_torus_add(major_radius=0.5 * SCALE, minor_radius=0.012 * SCALE, rotation=(math.pi / 2, 0, i * math.pi / 6))
        put(bpy.context.active_object, f"cage_{i}", PAINT)
elif TYPE == "robot":   # 人形：Blender 是 Z 朝上，身高約 1.0
    B = 1.35 if VARIANT == "titan" else (0.9 if VARIANT == "boxer" else 1.0)
    box("torso", (0.26 * B, 0.15 * B, 0.3), (0, 0, 0.71), PAINT)
    box("hips", (0.2 * B, 0.12 * B, 0.08), (0, 0, 0.5), DARK)
    box("head", (0.13 * B, 0.12 * B, 0.12), (0, 0, 0.96), PAINT)
    box("battery", (0.14, 0.05, 0.12), (0, 0.1 * B, 0.7), BATT)
    for s in (-1, 1):
        box(f"arm_upper_{s}", (0.06 * B, 0.06 * B, 0.17), (s * 0.17, 0, 0.75), DARK)
        box(f"arm_fore_{s}", (0.055 * B, 0.055 * B, 0.15), (s * 0.17, 0, 0.59), DARK)
        box(f"fist_{s}", (0.075 * B, 0.075 * B, 0.075 * B), (s * 0.17, 0, 0.48), mat("fist", (0.8, 0.1, 0.1, 1)) if VARIANT == "boxer" else DARK)
        box(f"leg_thigh_{s}", (0.08 * B, 0.08 * B, 0.21), (s * 0.075, 0, 0.36), DARK)
        box(f"leg_shin_{s}", (0.07 * B, 0.075 * B, 0.2), (s * 0.075, 0, 0.15), DARK)
        box(f"foot_{s}", (0.1 * B, 0.17 * B, 0.025), (s * 0.075, -0.025, 0.02), PAINT)
        for z in (0.83, 0.66, 0.47, 0.26, 0.05):
            cyl(f"servo_{s}_{z}", 0.03 * B, 0.07 * B, (s * (0.17 if z > 0.6 else 0.075), 0, z), METAL, (0, math.pi / 2, 0))
    cyl("estop", 0.025, 0.02, (0.06, 0.09 * B, 0.82), mat("estop", (0.9, 0.1, 0.1, 1)), (math.pi / 2, 0, 0))
else:
    hulls = [(-0.24, 0.2), (0.24, 0.2)] if VARIANT == "catamaran" else [(0, 0.4)]
    for i, (x, w) in enumerate(hulls):
        o = box(f"hull_{i}", (w, 1.5, 0.16), (x, 0, -0.06), PAINT)
        bpy.ops.object.modifier_add(type="BEVEL"); o.modifiers[-1].width = 0.03 * SCALE
    cyl("motor", 0.045, 0.14, (0, -0.05, -0.04), METAL, (math.pi / 2, 0, 0))
    cyl("shaft", 0.008, 0.62, (0, -0.33, -0.1), METAL, (math.pi / 2 - 0.12, 0, 0))
    cyl("prop", 0.055, 0.01, (0, -0.7, -0.15), mat("brass", (0.83, 0.63, 0.1, 1), 0.9, 0.3), (math.pi / 2, 0, 0), verts=2)
    box("battery", (0.1, 0.3, 0.05), (0, 0.15, -0.01), BATT)
    if VARIANT == "foil":
        for y, w in ((0.38, 0.5), (-0.55, 0.32)):
            box(f"foil_strut_{y}", (0.012, 0.05, 0.26), (0, y, -0.2), METAL)
            box(f"foil_wing_{y}", (w, 0.09, 0.012), (0, y, -0.33), METAL)

print("完成：${j.name}（", len(col.objects), "個物件）")
`;
}
function skill() {
  const j = specJSON();
  return `---
name: ${(j.type + '-' + j.variant + '-teardown').toLowerCase()}
description: 把「${j.name}」（${j.typeName}・${j.variantName}）做成一頁可以拆解的 3D 模擬網頁：機器在中間運轉、面板讀同一組真實數字、按鈕打開正在工作的零件、沒人操作時自動導覽。使用者說「做${j.name}的拆解模擬」「把我的載具做成 3D 網頁」時使用。
---

# ${j.name}｜可拆解 3D 模擬頁技能包

> 由「無人載具競技群島・載具工坊」產生。拆解頁的工作規則改寫自開源專案 teardown（elvarofficial/teardown，MIT 授權），並改為繁體中文與課堂慣例。

## 這台載具的規格（唯一真實來源）

\`\`\`json
${JSON.stringify(j, null, 2)}
\`\`\`

## 你要做出的成品

一個資料夾，用瀏覽器打開 \`index.html\` 就能用（不需要伺服器、不需要網路）：

| 檔案 | 負責什麼 | 規則 |
|---|---|---|
| \`kin.js\` | 數學。輸入只有「油門 t（0～1）」，算出轉速、推力／速度、電流等所有讀數 | **這個檔案不准出現 three.js** |
| \`model.js\` | 幾何。用 three.js 程式碼建出每個零件（一個零件一個 Group，名稱用上面的 id） | 零件要有「原位」與「拆解方向」 |
| \`stage.js\` | 攝影棚。淺色背景、單一強調色（只標正在工作的零件） | 粗糙度 ≥ 0.45，避免近白表面過曝 |
| \`panel.js\` | 面板。讀數、長條圖、按鈕 | 面板上的每個數字都必須來自 kin.js |
| \`tour.js\` | 自動導覽。安靜 25 秒後開始；任何點擊、拖曳、滾輪就交還控制權 | 每段字幕停留：短句 1 秒＋每多一字 0.25 秒 |
| \`index.html\` | 組起來 | three.js 用固定版本並放在本機 vendor 資料夾 |

## 七條規則（決定像不像真的）

1. **從參考開始**：先找一張這類${j.typeName}的實物照或剖視圖，照著比例做，不要憑空想像。
2. **真實數字、單一來源**：所有儀表、圖表、標籤都讀 kin.js 的同一個函數；至少一項可以用紙筆驗算（見下方「手算抽查」）。
3. **一個輸入驅動全部**：轉速、動畫、讀數都由油門 t 推導，不要手工做關鍵影格。
4. **正在工作的零件要打開**：提供「爆炸分解」「X 光透視」「只看工作中的零件」三個按鈕。
5. **淺色攝影棚、單一強調色**：強調色只代表「現在正在變的東西」。
6. **鏡頭為機構而選**：預設 3/4 側面視角，看得到每個零件的相對位置。
7. **穿模用數字修，不用鏡頭藏**：零件互相穿透就改參數，不要靠角度遮掉。

## 手算抽查（交付前一定要驗）

${kin(j.type, j.variant, 1, specOf()).check}

## 驗收清單

- [ ] 打開 index.html 沒有任何 Console 錯誤
- [ ] 拖曳油門，所有讀數同步改變，與上方規格一致
- [ ] 爆炸分解、X 光、只看工作零件三個按鈕都有效
- [ ] 每個零件點了會顯示名稱與功能（用上方 parts 的文字）
- [ ] 不碰 25 秒會自動導覽，一碰就停
- [ ] 手機寬度（375px）不會左右捲動
- [ ] **看截圖驗收**：至少截 4 張（全貌、爆炸、X 光、自動導覽中），逐張檢查有沒有穿模、字被裁切、標籤擋住零件

## 安全與授權

- 這是教學模擬，不是實機控制程式；實際操作請遵守民航法規與場地安全規定。
- 程式碼用到的第三方套件（three.js：MIT）要保留授權檔。
`;
}
function prompt() {
  const j = specJSON();
  return `請用我附上的技能包 SKILL.md，幫我做出「${j.name}」的可拆解 3D 模擬網頁。
- 類型：${j.typeName}／型態：${j.variantName}／主色：${j.color}
- 參數以 SKILL.md 裡的 JSON 為唯一來源，所有讀數都從 kin.js 算出來
- 做完請用無頭瀏覽器截 4 張圖（全貌、爆炸分解、X 光、自動導覽），自己看圖檢查後再交給我
- 交付：資料夾路徑、截圖、手算抽查的結果`;
}

/* ── AI ── */
const ai = mountAI($('#aibox'));
$('#ask').onclick = async () => {
  const wish = $('#wish').value.trim(); if (!wish) return toast('先寫下你想要的載具');
  $('#ask').disabled = true; $('#aiNote').textContent = 'AI 思考中…';
  try {
    const r = await askAI('forge', wish, { type: D.type, variant: D.variant, params: D.p, ranges: DEF[D.type], variants: VARIANTS[D.type].map(v => `＝：`) });
    const j = r.json || {};
    if (j.variant && VARIANTS[D.type].some(v => v.id === j.variant)) D.variant = j.variant;
    for (const [k, , min, max] of DEF[D.type]) if (j.params && typeof j.params[k] === 'number') D.p[k] = Math.max(min, Math.min(max, j.params[k]));
    if (/^#[0-9a-f]{6}$/i.test(j.color || '')) D.color = j.color;
    if (j.name) D.name = String(j.name).slice(0, 20);
    renderUI(); rebuild();
    $('#aiNote').textContent = j.reason || r.text || '已套用。';
  } catch (e) { $('#aiNote').textContent = e.message + '（先按上方「串接 AI」看看哪裡有問題）'; }
  $('#ask').disabled = false;
};
renderUI(); rebuild();
