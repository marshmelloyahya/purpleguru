import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const plans = db.prepare('SELECT * FROM plans ORDER BY id ASC').all();
  // Parse features JSON for client
  plans.forEach(p => p.features = JSON.parse(p.features));
  
  return Response.json({ plans });
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const { id, name, price_monthly, price_yearly, daily_text_limit, daily_image_limit, daily_video_limit, features } = await req.json();

  db.prepare(`
    UPDATE plans SET 
      name = ?, price_monthly = ?, price_yearly = ?, 
      daily_text_limit = ?, daily_image_limit = ?, daily_video_limit = ?, 
      features = ?
    WHERE id = ?
  `).run(name, price_monthly, price_yearly, daily_text_limit, daily_image_limit, daily_video_limit, JSON.stringify(features), id);

  return Response.json({ success: true });
}
