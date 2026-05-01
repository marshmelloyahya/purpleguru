import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const planSlug = url.searchParams.get('plan');

  const db = getDb();
  const plan = db.prepare('SELECT * FROM plans WHERE slug = ?').get(planSlug);
  if (!plan) return Response.json({ error: 'Plan not found' }, { status: 404 });

  const rows = db.prepare("SELECT key, value FROM settings WHERE key IN ('binance_enabled', 'binance_pay_id', 'whatsapp_number', 'telegram_username')").all();
  const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});

  const customMethods = db.prepare('SELECT id, type, name, details FROM payment_methods WHERE is_active = 1').all();

  return Response.json({ plan, settings, customMethods });
}
