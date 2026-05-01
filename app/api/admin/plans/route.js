import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const res = await db.execute('SELECT * FROM plans ORDER BY id ASC');
  const plans = res.rows.map(p => ({ ...p, features: JSON.parse(p.features) }));
  return Response.json({ plans });
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const { id, name, price_monthly, price_yearly, daily_text_limit, daily_image_limit, daily_video_limit, features } = await req.json();

  await db.execute({
    sql: `UPDATE plans SET name = ?, price_monthly = ?, price_yearly = ?, daily_text_limit = ?, daily_image_limit = ?, daily_video_limit = ?, features = ? WHERE id = ?`,
    args: [name, price_monthly, price_yearly, daily_text_limit, daily_image_limit, daily_video_limit, JSON.stringify(features), id],
  });

  return Response.json({ success: true });
}
