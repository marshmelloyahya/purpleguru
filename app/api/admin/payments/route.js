import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const payments = db.prepare(`
    SELECT p.*, u.name as user_name, u.email as user_email 
    FROM payments p 
    LEFT JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC
  `).all();
  
  return Response.json({ payments });
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const { paymentId, status } = await req.json();

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  if (!payment) return Response.json({ error: 'Not found' }, { status: 404 });

  db.prepare('UPDATE payments SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, paymentId);

  // If approving a pending crypto payment, upgrade the user
  if (status === 'completed' && payment.status === 'pending') {
    const planSlug = payment.plan.toLowerCase(); // Since plan name was saved, e.g. "Pro"
    
    const expiresDate = new Date();
    if (payment.billing_period === 'monthly') expiresDate.setMonth(expiresDate.getMonth() + 1);
    else expiresDate.setFullYear(expiresDate.getFullYear() + 1);

    db.prepare('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?').run(planSlug, expiresDate.toISOString(), payment.user_id);
  }

  return Response.json({ success: true });
}
