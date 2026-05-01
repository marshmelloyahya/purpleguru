import { getCurrentUser, createSessionsTable, PLAN_LIMITS } from '@/lib/auth';
import { generateImage } from '@/lib/ai';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

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
        user.daily_image_used = 0;
      }
      const limit = PLAN_LIMITS[plan]?.image || 1;
      if (user.daily_image_used >= limit) {
        return Response.json({ error: 'Daily image limit reached. Upgrade your plan.', limitReached: true }, { status: 429 });
      }
    } else {
      if (!guestSessionId) {
        guestSessionId = uuidv4();
        cookieStore.set('guest_session', guestSessionId, { httpOnly: true, maxAge: 24 * 60 * 60, path: '/' });
      }
      const today = new Date().toISOString().split('T')[0];
      const guestUsage = db.prepare(`SELECT COUNT(*) as c FROM usage_logs WHERE guest_session_id = ? AND type = 'image' AND date(created_at) = ?`).get(guestSessionId, today);
      if (guestUsage.c >= 1) {
        return Response.json({ error: 'Guest image limit reached (1/day). Sign up for more.', limitReached: true, requireSignup: true }, { status: 429 });
      }
    }

    const { prompt, provider, model } = await req.json();
    if (!prompt?.trim()) return Response.json({ error: 'Prompt required' }, { status: 400 });

    const result = await generateImage({ prompt, provider, model });

    db.prepare(`INSERT INTO usage_logs (user_id, guest_session_id, type, model) VALUES (?, ?, 'image', ?)`).run(userId, guestSessionId || null, result.model);
    if (userId) db.prepare(`UPDATE users SET daily_image_used = daily_image_used + 1 WHERE id = ?`).run(userId);

    return Response.json({ url: result.url, model: result.model, provider: result.provider });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
