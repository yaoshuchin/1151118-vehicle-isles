/* BYOK（Bring Your Own Key）：沒裝本機串接器的使用者，貼自己的 Gemini 或 Groq 免費金鑰，
 * 由「使用者自己的瀏覽器」直連 API——金鑰只存 localStorage，絕不經過本站伺服器（2026-11-18 老師指定）。
 * Gemini／Groq 的 CORS 皆允許瀏覽器直連（已驗證）。
 *
 * 用法：
 *   import { byok } from './byok.js';
 *   byok.setKey('gemini', 'AIza...');            // 或 'groq', 'gsk_...'
 *   const r = await byok.run('提示詞', { json:false });   // → {ok, text, via:'gemini'|'groq'} 或 {ok:false, error}
 *   byok.ready();                                 // 有沒有可用金鑰
 */
const LS = 'vehicle-isles-byok';
const MODELS = {
  gemini: { label: 'Gemini', model: 'gemini-3.5-flash', keyHint: 'AIza… （Google AI Studio 免費金鑰）', url: 'https://aistudio.google.com/apikey' },
  groq: { label: 'Groq', model: 'llama-3.3-70b-versatile', keyHint: 'gsk_… （console.groq.com 免費金鑰）', url: 'https://console.groq.com/keys' },
  openai: { label: 'OpenAI', model: 'gpt-5.6-luna', keyHint: 'sk-… （platform.openai.com 金鑰，付費）', url: 'https://platform.openai.com/api-keys' }
};

const load = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; } };
const save = (o) => { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} };
const timeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

async function callGemini(key, model, prompt, json) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 2048, ...(json ? { responseMimeType: 'application/json' } : {}) } };
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal: timeout(20000) });
  const t = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(t.error?.message || ('Gemini HTTP ' + r.status));
  const text = (t.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!text) throw new Error('Gemini 沒有回應內容（可能被安全規則擋下或金鑰無效）');
  return text;
}
// Groq 與 OpenAI 都是 OpenAI 相容格式，只差網址、token 參數名
async function callOpenAICompatible(base, key, model, prompt, json, isOpenAI) {
  const body = { model, messages: [{ role: 'user', content: prompt }], ...(json ? { response_format: { type: 'json_object' } } : {}) };
  // OpenAI 新世代用 max_completion_tokens，且部分模型僅支援預設 temperature
  if (isOpenAI) { body.max_completion_tokens = 2048; } else { body.temperature = 0.5; body.max_tokens = 2048; }
  const r = await fetch(base + '/chat/completions', {
    method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify(body), signal: timeout(25000)
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(t.error?.message || ((isOpenAI ? 'OpenAI' : 'Groq') + ' HTTP ' + r.status));
  const text = (t.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!text) throw new Error((isOpenAI ? 'OpenAI' : 'Groq') + ' 沒有回應內容');
  return text;
}
const callGroq = (key, model, prompt, json) => callOpenAICompatible('https://api.groq.com/openai/v1', key, model, prompt, json, false);
const callOpenAI = (key, model, prompt, json) => callOpenAICompatible('https://api.openai.com/v1', key, model, prompt, json, true);
const CALLS = { gemini: callGemini, groq: callGroq, openai: callOpenAI };

export const byok = {
  providers: MODELS,
  get provider() { return load().provider || 'gemini'; },
  keyOf(p) { return (load().keys || {})[p] || ''; },
  ready() { return !!this.keyOf(this.provider); },
  setProvider(p) { if (!MODELS[p]) return; const s = load(); s.provider = p; save(s); },
  setKey(p, key) { const s = load(); s.keys = s.keys || {}; if (key) s.keys[p] = key.trim(); else delete s.keys[p]; s.provider = p; save(s); },
  clear(p) { const s = load(); if (s.keys) delete s.keys[p]; save(s); },

  /* 用「使用者自己的金鑰」直連；驗證金鑰可用（送一句「OK」） */
  async test(p = this.provider) {
    const key = this.keyOf(p); if (!key) return { ok: false, error: '尚未填入 ' + MODELS[p].label + ' 金鑰' };
    try { const out = await CALLS[p](key, MODELS[p].model, '只回答兩個英文字母：OK', false); return { ok: /ok/i.test(out), out }; }
    catch (e) { return { ok: false, error: e.message }; }
  },
  async run(prompt, opt = {}) {
    const p = opt.provider || this.provider, key = this.keyOf(p);
    if (!key) return { ok: false, error: '請先填入您自己的 ' + MODELS[p].label + ' 免費金鑰' };
    const model = opt.model || MODELS[p].model;
    try {
      const text = await CALLS[p](key, model, prompt, !!opt.json);
      let json = null;
      if (opt.json) { const m = text.match(/\{[\s\S]*\}/); try { json = m ? JSON.parse(m[0]) : null; } catch (e) {} }
      return { ok: true, text, json, via: p };
    } catch (e) { return { ok: false, error: e.message }; }
  }
};
