import { getDb } from './db';

// ── Provider Catalog ─────────────────────────────────────────────────────────
export const PROVIDERS = {
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    textModels: ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    imageModels: [],
    videoModels: [],
    priority: 1, // try first (fastest free)
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    textModels: ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'],
    imageModels: ['imagen-3.0-generate-002'],
    videoModels: [],
    priority: 2,
  },
  together: {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    textModels: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'mistralai/Mixtral-8x22B-Instruct-v0.1'],
    imageModels: ['black-forest-labs/FLUX.1-schnell-Free', 'black-forest-labs/FLUX.1-dev'],
    videoModels: [],
    priority: 3,
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    textModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    imageModels: ['dall-e-3', 'dall-e-2'],
    videoModels: [],
    priority: 4,
  },
  huggingface: {
    name: 'HuggingFace',
    baseUrl: 'https://api-inference.huggingface.co/models',
    textModels: ['mistralai/Mistral-7B-Instruct-v0.2'],
    imageModels: ['black-forest-labs/FLUX.1-schnell', 'stabilityai/stable-diffusion-xl-base-1.0'],
    videoModels: [],
    priority: 5,
  },
};

// ── Key Pool Helpers ──────────────────────────────────────────────────────────

/**
 * Get ALL working, active keys for a provider (sorted by least used today).
 */
export function getApiKeys(provider) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM api_keys
    WHERE provider = ? AND is_active = 1 AND is_working = 1
    ORDER BY daily_usage ASC, last_used_at ASC NULLS FIRST
  `).all(provider);
}

/**
 * Get the single best key for a provider (least used today).
 */
export function getApiKey(provider) {
  const keys = getApiKeys(provider);
  return keys[0] || null;
}

export function markKeyFailed(keyId) {
  const db = getDb();
  db.prepare(`
    UPDATE api_keys
    SET is_working = 0, error_count = error_count + 1, last_tested_at = datetime('now')
    WHERE id = ?
  `).run(keyId);
}

export function incrementKeyUsage(keyId) {
  const db = getDb();
  db.prepare(`
    UPDATE api_keys
    SET daily_usage = daily_usage + 1, total_usage = total_usage + 1, last_used_at = datetime('now')
    WHERE id = ?
  `).run(keyId);
}

// ── Test a key ────────────────────────────────────────────────────────────────
export async function testApiKey(provider, keyValue) {
  try {
    const pc = PROVIDERS[provider];
    
    // Default to OpenAI compatible check for unknown providers
    if (!pc || ['groq', 'together', 'openai'].includes(provider)) {
      const baseUrl = pc ? pc.baseUrl : (provider.startsWith('http') ? provider : `https://${provider}/v1`);
      const r = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${keyValue}` },
        signal: AbortSignal.timeout(6000),
      });
      return r.ok;
    }
    if (provider === 'gemini') {
      const r = await fetch(`${pc.baseUrl}/models?key=${keyValue}`, { signal: AbortSignal.timeout(6000) });
      return r.ok;
    }
    if (provider === 'huggingface') {
      const r = await fetch('https://huggingface.co/api/whoami', {
        headers: { Authorization: `Bearer ${keyValue}` },
        signal: AbortSignal.timeout(6000),
      });
      return r.ok;
    }
    return true;
  } catch {
    return false;
  }
}

// ── Text Generation ───────────────────────────────────────────────────────────

async function tryTextWithKey(provider, key, model, messages) {
  const pc = PROVIDERS[provider];
  const selectedModel = model || (pc ? pc.textModels[0] : 'gpt-3.5-turbo');

  if (!pc || ['groq', 'together', 'openai'].includes(provider)) {
    const baseUrl = pc ? pc.baseUrl : (provider.startsWith('http') ? provider : `https://${provider}/v1`);
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key.key_value}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel, messages, max_tokens: 4096, temperature: 0.7 }),
      signal: AbortSignal.timeout(40000),
    });
    if (!r.ok) { markKeyFailed(key.id); return null; }
    const d = await r.json();
    incrementKeyUsage(key.id);
    return { text: d.choices[0].message.content, model: selectedModel, provider, tokens: d.usage?.total_tokens || 0 };
  }

  if (provider === 'gemini') {
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const systemMsg = messages.find(m => m.role === 'system');

    const body = {
      contents,
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

    const r = await fetch(
      `${pc.baseUrl}/models/${selectedModel}:generateContent?key=${key.key_value}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(40000) }
    );
    if (!r.ok) { markKeyFailed(key.id); return null; }
    const d = await r.json();
    incrementKeyUsage(key.id);
    return { text: d.candidates[0].content.parts[0].text, model: selectedModel, provider, tokens: d.usageMetadata?.totalTokenCount || 0 };
  }

  if (provider === 'huggingface') {
    const lastUser = messages.filter(m => m.role === 'user').pop();
    const r = await fetch(`${pc.baseUrl}/${selectedModel}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key.key_value}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: lastUser?.content || '', parameters: { max_new_tokens: 1024 } }),
      signal: AbortSignal.timeout(40000),
    });
    if (!r.ok) { markKeyFailed(key.id); return null; }
    const d = await r.json();
    incrementKeyUsage(key.id);
    const text = Array.isArray(d) ? d[0]?.generated_text || '' : d.generated_text || '';
    return { text, model: selectedModel, provider, tokens: 0 };
  }

  return null;
}

/**
 * Generate text — tries all keys for the requested provider (or all providers),
 * rotating to the next working key/provider on failure.
 */
export async function generateText({ prompt, systemPrompt = '', model, provider, conversationHistory = [] }) {
  // Build message array
  const buildMessages = (history) => {
    const msgs = [];
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
    msgs.push(...history);
    msgs.push({ role: 'user', content: prompt });
    return msgs;
  };

  const messages = buildMessages(conversationHistory);

  // Determine provider order (requested provider first, then fallback to ALL working providers)
  let providerOrder = provider ? [provider] : [];
  const db = getDb();
  const allWorkingProviders = db.prepare('SELECT DISTINCT provider FROM api_keys WHERE is_working = 1').all().map(r => r.provider);
  
  // Mix in known providers by priority first, then unknown ones
  const knownSorted = Object.entries(PROVIDERS).sort((a, b) => a[1].priority - b[1].priority).map(([k]) => k);
  for (const p of knownSorted) {
    if (allWorkingProviders.includes(p) && !providerOrder.includes(p)) providerOrder.push(p);
  }
  for (const p of allWorkingProviders) {
    if (!providerOrder.includes(p)) providerOrder.push(p);
  }

  const errors = [];

  for (const p of providerOrder) {
    const keys = getApiKeys(p);
    if (!keys.length) continue;

    // Try each key for this provider
    for (const key of keys) {
      try {
        const result = await tryTextWithKey(p, key, model, messages);
        if (result) return result;
      } catch (err) {
        markKeyFailed(key.id);
        errors.push(`${p}:key${key.id} — ${err.message}`);
      }
    }
    errors.push(`${p} — all keys exhausted`);
  }

  throw new Error(
    `No working AI provider available. Add API keys in the Admin → API Keys panel.\nDetails: ${errors.slice(0, 3).join('; ')}`
  );
}

// ── Image Generation ──────────────────────────────────────────────────────────

async function tryImageWithKey(provider, key, model, prompt) {
  const pc = PROVIDERS[provider];
  const selectedModel = model || (pc ? pc.imageModels[0] : 'dall-e-3');

  if (!pc || ['together', 'openai'].includes(provider)) {
    const baseUrl = pc ? pc.baseUrl : (provider.startsWith('http') ? provider : `https://${provider}/v1`);
    const r = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key.key_value}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel, prompt, n: 1, width: 1024, height: 1024, size: '1024x1024' }),
      signal: AbortSignal.timeout(90000),
    });
    if (!r.ok) { markKeyFailed(key.id); return null; }
    const d = await r.json();
    let url = d.data?.[0]?.url;
    if (d.data?.[0]?.b64_json) url = `data:image/png;base64,${d.data[0].b64_json}`;
    if (!url) return null;
    incrementKeyUsage(key.id);
    return { url, model: selectedModel, provider };
  }

  if (provider === 'huggingface') {
    const r = await fetch(`${pc.baseUrl}/${selectedModel}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key.key_value}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
      signal: AbortSignal.timeout(90000),
    });
    if (!r.ok) { markKeyFailed(key.id); return null; }
    const blob = await r.blob();
    const base64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
    incrementKeyUsage(key.id);
    return { url: `data:image/png;base64,${base64}`, model: selectedModel, provider };
  }

  return null;
}

export async function generateImage({ prompt, provider, model }) {
  let providerOrder = provider ? [provider] : [];
  const db = getDb();
  const allWorkingProviders = db.prepare('SELECT DISTINCT provider FROM api_keys WHERE is_working = 1').all().map(r => r.provider);
  
  for (const p of ['together', 'huggingface', 'openai']) {
    if (allWorkingProviders.includes(p) && !providerOrder.includes(p)) providerOrder.push(p);
  }
  for (const p of allWorkingProviders) {
    if (!providerOrder.includes(p)) providerOrder.push(p);
  }

  for (const p of providerOrder) {
    const keys = getApiKeys(p);
    if (!keys.length) continue;

    for (const key of keys) {
      try {
        const result = await tryImageWithKey(p, key, model, prompt);
        if (result) return result;
      } catch {
        markKeyFailed(key.id);
      }
    }
  }

  throw new Error('No working image generation API keys. Add Together AI, HuggingFace, or OpenAI keys in Admin → API Keys.');
}

// ── Video Generation ──────────────────────────────────────────────────────────

async function tryVideoWithKey(provider, key, model, prompt) {
  const pc = PROVIDERS[provider];
  const selectedModel = model || (pc ? pc.videoModels[0] : 'sora-2'); // fallback default

  if (!pc || ['together', 'openai'].includes(provider)) {
    const baseUrl = pc ? pc.baseUrl : (provider.startsWith('http') ? provider : `https://${provider}/v1`);
    const r = await fetch(`${baseUrl}/videos/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key.key_value}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel, prompt }),
      signal: AbortSignal.timeout(120000), // Video takes longer
    });
    if (!r.ok) { markKeyFailed(key.id); return null; }
    const d = await r.json();
    let url = d.data?.[0]?.url;
    if (!url) return null;
    incrementKeyUsage(key.id);
    return { url, model: selectedModel, provider };
  }

  // Add more specific provider logics here if needed (e.g. replicate, fal, etc.)

  return null;
}

export async function generateVideo({ prompt, provider, model }) {
  let providerOrder = provider ? [provider] : [];
  const db = getDb();
  const allWorkingProviders = db.prepare('SELECT DISTINCT provider FROM api_keys WHERE is_working = 1').all().map(r => r.provider);
  
  for (const p of ['together', 'openai', 'replicate']) {
    if (allWorkingProviders.includes(p) && !providerOrder.includes(p)) providerOrder.push(p);
  }
  for (const p of allWorkingProviders) {
    if (!providerOrder.includes(p)) providerOrder.push(p);
  }

  for (const p of providerOrder) {
    const keys = getApiKeys(p);
    if (!keys.length) continue;

    for (const key of keys) {
      try {
        const result = await tryVideoWithKey(p, key, model, prompt);
        if (result) return result;
      } catch {
        markKeyFailed(key.id);
      }
    }
  }

  throw new Error('No working video generation API keys. Add keys in Admin → API Keys.');
}
