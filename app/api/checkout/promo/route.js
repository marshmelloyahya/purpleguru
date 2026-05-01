import { getDb } from '@/lib/db';

export async function POST(req) {
  try {
    const { code } = await req.json();
    if (!code) return Response.json({ valid: false, error: 'Code required' });

    const db = getDb();
    const promo = db.prepare('SELECT * FROM promo_codes WHERE code = COLLATE NOCASE ?').get(code);

    if (!promo) return Response.json({ valid: false, error: 'Invalid promo code' });
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) return Response.json({ valid: false, error: 'Promo code expired' });
    if (promo.max_uses > 0 && promo.times_used >= promo.max_uses) return Response.json({ valid: false, error: 'Promo code usage limit reached' });

    return Response.json({ 
      valid: true, 
      discount_percent: promo.discount_percent, 
      discount_amount: promo.discount_amount 
    });
  } catch (err) {
    return Response.json({ valid: false, error: err.message }, { status: 500 });
  }
}
