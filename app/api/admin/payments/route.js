import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const res = await db.execute(`SELECT p.*, u.name as user_name, u.email as user_email FROM payments p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC`);
  return Response.json({ payments: res.rows });
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const { paymentId, status } = await req.json();

  const paymentRes = await db.execute({ sql: 'SELECT * FROM payments WHERE id = ?', args: [paymentId] });
  const payment = paymentRes.rows[0];
  if (!payment) return Response.json({ error: 'Not found' }, { status: 404 });

  await db.execute({ sql: 'UPDATE payments SET status = ?, updated_at = datetime("now") WHERE id = ?', args: [status, paymentId] });

  if (status === 'completed' && payment.status === 'pending') {
    const planSlug = payment.plan.toLowerCase();
    const expiresDate = new Date();
    if (payment.billing_period === 'monthly') expiresDate.setMonth(expiresDate.getMonth() + 1);
    else expiresDate.setFullYear(expiresDate.getFullYear() + 1);
    await db.execute({ sql: 'UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?', args: [planSlug, expiresDate.toISOString(), payment.user_id] });
  }

  return Response.json({ success: true });
}
