import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { plan, period, method, txId, promo, senderName, proofUrl } = await req.json();

  if (!plan || !period || !method) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const planData = db.prepare('SELECT * FROM plans WHERE slug = ?').get(plan);
  if (!planData) return Response.json({ error: 'Invalid plan' }, { status: 400 });

  let basePrice = planData[`price_${period}`];
  let discount = 0;
  
  if (promo) {
    const pInfo = db.prepare('SELECT * FROM promo_codes WHERE code = COLLATE NOCASE ?').get(promo);
    if (pInfo && (!pInfo.expires_at || new Date(pInfo.expires_at) > new Date()) && (pInfo.max_uses === 0 || pInfo.times_used < pInfo.max_uses)) {
      if (pInfo.discount_percent) discount = basePrice * (pInfo.discount_percent / 100);
      else if (pInfo.discount_amount) discount = pInfo.discount_amount;
      
      // Update promo usage
      db.prepare('UPDATE promo_codes SET times_used = times_used + 1 WHERE id = ?').run(pInfo.id);
    }
  }

  const finalAmount = Math.max(0, basePrice - discount);

  if (method === 'giftcard') {
    const gc = db.prepare('SELECT * FROM gift_cards WHERE code = ? AND is_active = 1').get(txId);
    if (!gc) return Response.json({ error: 'Invalid or inactive gift card' }, { status: 400 });
    if (gc.balance < finalAmount) return Response.json({ error: 'Insufficient gift card balance' }, { status: 400 });

    // Deduct balance and apply plan instantly
    db.prepare('UPDATE gift_cards SET balance = balance - ? WHERE id = ?').run(finalAmount, gc.id);
    
    // Create completed payment record
    const payUuid = uuidv4();
    db.prepare('INSERT INTO payments (uuid, user_id, plan, billing_period, amount, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(payUuid, user.id, planData.name, period, finalAmount, 'completed');

    // Upgrade user
    const expiresDate = new Date();
    if (period === 'monthly') expiresDate.setMonth(expiresDate.getMonth() + 1);
    else expiresDate.setFullYear(expiresDate.getFullYear() + 1);

    db.prepare('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?').run(planData.slug, expiresDate.toISOString(), user.id);

    return Response.json({ success: true, status: 'completed' });
  }

  if (method === 'binance' || method.startsWith('custom_')) {
    if (!txId && !proofUrl) return Response.json({ error: 'Transaction ID or Payment Proof required' }, { status: 400 });
    
    let methodName = method === 'binance' ? 'Binance' : 'Custom';
    if (method.startsWith('custom_')) {
      const customId = method.split('_')[1];
      const mData = db.prepare('SELECT name FROM payment_methods WHERE id = ?').get(customId);
      if (mData) methodName = mData.name;
    }

    const payUuid = uuidv4();
    db.prepare('INSERT INTO payments (uuid, user_id, plan, billing_period, amount, status, stripe_payment_intent, payment_method, proof_url, sender_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(payUuid, user.id, planData.name, period, finalAmount, 'pending', txId || 'Custom Upload', methodName, proofUrl || null, senderName || null);

    return Response.json({ success: true, status: 'pending' });
  }

  return Response.json({ error: 'Invalid payment method' }, { status: 400 });
}
