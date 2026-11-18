// AI 串接（BYOK：學員自己的金鑰，瀏覽器直連，不經過老師伺服器）。2026-11-18 改。
// 介面不變（mountAI / askAI），forge.js、deck.js 不用改。
import { byok } from './byok.js';
import { el, esc } from './ui.js';

let state = { ok: false, model: '', checked: false };
export const aiReady = () => byok.ready();

export function mountAI(box) {
  box.innerHTML = '';
  const light = el('span', { class: 'tag' }, byok.ready() ? '已填金鑰' : '未填金鑰');
  const sel = el('select', { style: 'font:inherit;padding:5px 8px;border-radius:8px;border:1.5px solid #b9c4d6' });
  Object.keys(byok.providers).forEach(p => { const o = el('option', { value: p }, byok.providers[p].label); if (byok.provider === p) o.selected = true; sel.append(o); });
  const key = el('input', { type: 'password', placeholder: byok.providers[byok.provider].keyHint, value: byok.keyOf(byok.provider), style: 'flex:1;min-width:140px;font:inherit;padding:6px 9px;border-radius:8px;border:1.5px solid #b9c4d6' });
  const save = el('button', { class: 'btn blue sm' }, '儲存並測試');
  const link = el('a', { href: byok.providers[byok.provider].url, target: '_blank', rel: 'noopener', class: 'mut', style: 'font-size:.9em' }, '免費申請金鑰 ↗');
  const steps = el('div', { style: 'margin-top:.4em;font-size:.92em' });
  box.append(
    el('div', { class: 'row', style: 'justify-content:space-between' }, el('b', {}, '用我自己的 AI 金鑰'), light),
    el('div', { class: 'row', style: 'margin-top:6px;gap:6px;flex-wrap:wrap' }, sel, key, save),
    el('div', { class: 'row', style: 'margin-top:4px' }, link), steps
  );
  sel.onchange = () => { byok.setProvider(sel.value); key.placeholder = byok.providers[sel.value].keyHint; key.value = byok.keyOf(sel.value); link.href = byok.providers[sel.value].url; };
  async function run() {
    byok.setKey(sel.value, key.value);
    if (!key.value) { steps.innerHTML = '<span style="color:var(--bad)">請先貼上您自己的金鑰（只存在這台電腦，不會上傳）。</span>'; light.className = 'tag or'; light.textContent = '未填金鑰'; return; }
    save.disabled = true; steps.innerHTML = '測試中…（用您的金鑰送一句話）';
    const r = await byok.test(sel.value);
    save.disabled = false;
    state = { ok: !!r.ok, model: byok.providers[sel.value].model, checked: true };
    light.className = 'tag ' + (r.ok ? 'gr' : 'or'); light.textContent = r.ok ? '金鑰可用' : '金鑰有問題';
    steps.innerHTML = r.ok
      ? `<span style="color:var(--ok)">✅ ${esc(byok.providers[sel.value].label)} 金鑰可用，✨ 由您自己的額度負責。</span>`
      : `<span style="color:var(--bad)">✘ ${esc(r.error || '測試失敗')}</span>`;
    box.dispatchEvent(new CustomEvent('ai', { detail: state }));
  }
  save.onclick = run;
  return { run };
}

// task=forge → 回 JSON；其他 → 回文字。用學員金鑰直連。
export async function askAI(task, input, extra = {}) {
  let prompt;
  if (task === 'forge') {
    prompt = `你是「無人載具工坊」的設計助手，使用繁體中文（臺灣用語）。學員用一句話描述想要的載具，只回傳「只有 JSON」的物件：\n{"name":"不超過10字","variant":"型態代號","color":"#RRGGBB","params":{參數名:數字},"reason":"80字內，至少一個取捨"}\nvariant 只能從清單選；params 只能用提供的參數名、數值在範圍內；不要輸出 JSON 以外文字。\n需求：${input}\n類型：${extra.type}，目前型態：${extra.variant}\n可選型態：${JSON.stringify(extra.variants || [])}\n參數範圍：${JSON.stringify(extra.ranges || []).slice(0, 1500)}\n目前參數：${JSON.stringify(extra.params || {}).slice(0, 600)}`;
  } else {
    prompt = `你是「無人載具 AI 互動平台」的課程助教，使用繁體中文（臺灣用語）。把學員內容潤飾得更清楚專業，不改事實與數字，不編造；保留標題與格式，最後加一行「💡 提醒：」給一個可做的建議，總長不超過 350 字。\n單元：${esc(extra.unit || '')}\n內容：\n${input}`;
  }
  const r = await byok.run(prompt, { json: task === 'forge' });
  if (!r.ok) throw new Error(r.error || 'AI 服務錯誤');
  if (task === 'forge' && !r.json) throw new Error('AI 回傳格式不正確，請再按一次');
  return { text: r.text, json: r.json, model: byok.providers[byok.provider].model };
}
