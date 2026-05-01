import { getCurrentUser, createSessionsTable, PLAN_LIMITS } from '@/lib/auth';
import { generateText } from '@/lib/ai';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const CODE_SYSTEM_PROMPT = `You are an expert software engineer and AI coding assistant. 
You write clean, modern, well-commented code. 
When asked to generate code:
- Always output ONLY the code without markdown code fences unless asked for explanation
- Use best practices and modern patterns
- Add helpful inline comments
- Make the code complete and ready to run
- For web (HTML/CSS/JS), always output a single complete HTML file with embedded CSS and JS
- For other languages, output clean, runnable code`;

export async function POST(req) {
  try {
    createSessionsTable();
    const db = getDb();
    const user = await getCurrentUser();
    const cookieStore = await cookies();

    let plan = 'guest';
    let userId = null;
    let guestSessionId = cookieStore.get('guest_session')?.value;

    if (user) {
      plan = user.plan;
      userId = user.id;
      const today = new Date().toISOString().split('T')[0];
      if (user.last_reset_date !== today) {
        db.prepare(`UPDATE users SET daily_text_used=0, daily_image_used=0, daily_video_used=0, last_reset_date=? WHERE id=?`).run(today, user.id);
        user.daily_text_used = 0;
      }
      const limit = PLAN_LIMITS[plan]?.text || 3;
      if (user.daily_text_used >= limit) {
        return Response.json({ error: 'Daily limit reached. Please upgrade your plan.', limitReached: true }, { status: 429 });
      }
    } else {
      if (!guestSessionId) {
        guestSessionId = uuidv4();
        cookieStore.set('guest_session', guestSessionId, { httpOnly: true, maxAge: 24 * 60 * 60, path: '/' });
      }
      const today = new Date().toISOString().split('T')[0];
      const guestUsage = db.prepare(`SELECT COUNT(*) as c FROM usage_logs WHERE guest_session_id = ? AND type = 'text' AND date(created_at) = ?`).get(guestSessionId, today);
      if (guestUsage.c >= 3) {
        return Response.json({ error: 'Guest limit reached (3/day). Sign up for more.', limitReached: true, requireSignup: true }, { status: 429 });
      }
    }

    const { prompt, language, agent, provider, history, mode } = await req.json();
    if (!prompt?.trim()) return Response.json({ error: 'Prompt is required' }, { status: 400 });

    // Build a code-specific prompt
    const langHint = language && language !== 'auto' ? `Language: ${language}\n` : '';
    const modeHint = mode === 'fix' ? 'Fix the following code and explain what was wrong:\n' : mode === 'explain' ? 'Explain the following code in detail:\n' : mode === 'refactor' ? 'Refactor and improve the following code:\n' : '';
    const fullPrompt = `${modeHint}${langHint}${prompt}`;

    const reqModel = agent === 'auto' ? null : agent;
    const reqProvider = agent === 'auto' ? null : provider;

    const result = await generateText({
      prompt: fullPrompt,
      systemPrompt: CODE_SYSTEM_PROMPT,
      model: reqModel,
      provider: reqProvider,
      conversationHistory: history || [],
    });

    // Log usage
    db.prepare(`INSERT INTO usage_logs (user_id, guest_session_id, type, model, tokens_used) VALUES (?, ?, 'text', ?, ?)`).run(userId, guestSessionId || null, result.model, result.tokens);
    if (userId) db.prepare(`UPDATE users SET daily_text_used = daily_text_used + 1 WHERE id = ?`).run(userId);

    return Response.json({ code: result.text, model: result.model, provider: result.provider });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
