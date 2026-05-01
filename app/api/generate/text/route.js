import { getCurrentUser, createSessionsTable, PLAN_LIMITS } from '@/lib/auth';
import { generateText } from '@/lib/ai';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    createSessionsTable();
    const db = getDb();
    const user = await getCurrentUser();
    const cookieStore = await cookies();

    // Determine plan limits
    let plan = 'guest';
    let userId = null;
    let guestSessionId = cookieStore.get('guest_session')?.value;

    if (user) {
      plan = user.plan;
      userId = user.id;
      // Check and reset daily usage if new day
      const today = new Date().toISOString().split('T')[0];
      if (user.last_reset_date !== today) {
        db.prepare(`UPDATE users SET daily_text_used=0, daily_image_used=0, daily_video_used=0, last_reset_date=? WHERE id=?`).run(today, user.id);
        user.daily_text_used = 0;
      }
      // Check limit
      const limit = PLAN_LIMITS[plan]?.text || 3;
      if (user.daily_text_used >= limit) {
        return Response.json({ error: 'Daily text limit reached. Please upgrade your plan.', limitReached: true }, { status: 429 });
      }
    } else {
      // Guest: track via session
      if (!guestSessionId) {
        guestSessionId = uuidv4();
        cookieStore.set('guest_session', guestSessionId, { httpOnly: true, maxAge: 24 * 60 * 60, path: '/' });
      }
      // Count guest usage today
      const today = new Date().toISOString().split('T')[0];
      const guestUsage = db.prepare(`SELECT COUNT(*) as c FROM usage_logs WHERE guest_session_id = ? AND type = 'text' AND date(created_at) = ?`).get(guestSessionId, today);
      if (guestUsage.c >= 3) {
        return Response.json({ error: 'Guest limit reached (3/day). Sign up for more.', limitReached: true, requireSignup: true }, { status: 429 });
      }
    }

    const { prompt, model, provider, history } = await req.json();
    if (!prompt?.trim()) return Response.json({ error: 'Prompt is required' }, { status: 400 });

    const result = await generateText({ prompt, model, provider, conversationHistory: history || [] });

    // Log usage
    db.prepare(`INSERT INTO usage_logs (user_id, guest_session_id, type, model, tokens_used) VALUES (?, ?, 'text', ?, ?)`).run(userId, guestSessionId || null, result.model, result.tokens);

    // Increment user counter
    if (userId) {
      db.prepare(`UPDATE users SET daily_text_used = daily_text_used + 1 WHERE id = ?`).run(userId);
    }

    return Response.json({ text: result.text, model: result.model, provider: result.provider });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
