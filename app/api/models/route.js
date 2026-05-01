import { getDb } from '@/lib/db';

const PROVIDER_MODELS = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  ],
  gemini: [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
  ],
  huggingface: [
    { value: 'HuggingFaceH4/zephyr-7b-beta', label: 'Zephyr 7B' },
  ],
  together: [
    { value: 'meta-llama/Llama-3-70b-chat-hf', label: 'Together LLaMA 3 70B' }
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek V3' },
    { value: 'deepseek-reasoner', label: 'DeepSeek R1' }
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }
  ],
  'aichatgptfree.org': [{ value: 'aichatgptfree', label: 'Free GPT-4' }],
  'mirexa.vercel.app': [{ value: 'mirexa', label: 'Mirexa AI' }],
  'chatgpt.com': [{ value: 'chatgpt-free', label: 'ChatGPT Free' }],
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'text';

    const db = getDb();
    const activeKeys = db.prepare('SELECT DISTINCT provider FROM api_keys WHERE is_working = 1').all();
    
    let availableModels = [
      { value: 'auto', label: 'Auto (Best Available)', provider: null }
    ];

    for (const key of activeKeys) {
      if (PROVIDER_MODELS[key.provider]) {
        PROVIDER_MODELS[key.provider].forEach(m => {
          availableModels.push({ ...m, provider: key.provider });
        });
      } else {
        // Fallback for providers that aren't mapped
        availableModels.push({ value: `auto-${key.provider}`, label: `Auto ${key.provider}`, provider: key.provider });
      }
    }

    return Response.json({ models: availableModels });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
