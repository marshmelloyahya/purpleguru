'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={<div className={styles.page}><span className="spinner" /> Loading...</div>}>
      <CheckoutContent />
    </React.Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planSlug = searchParams.get('plan') || 'pro';
  const period = searchParams.get('period') || 'monthly';
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [plan, setPlan] = useState(null);
  const [settings, setSettings] = useState({});
  const [customMethods, setCustomMethods] = useState([]);
  const [method, setMethod] = useState('binance');
  const [txId, setTxId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [planSlug]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/checkout/data?plan=' + planSlug);
      if (res.status === 401) { router.push('/login?next=/checkout?plan=' + planSlug + '&period=' + period); return; }
      const d = await res.json();
      setPlan(d.plan);
      setSettings(d.settings);
      setCustomMethods(d.customMethods || []);
      if (d.settings.binance_enabled !== '1' && d.customMethods?.length) {
        setMethod(`custom_${d.customMethods[0].id}`);
      }
    } catch {
      setError('Failed to load checkout details');
    }
    setLoading(false);
  };

  const applyPromo = async (e) => {
    e.preventDefault();
    if (!promo) return;
    try {
      const res = await fetch('/api/checkout/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promo }) });
      const d = await res.json();
      if (!d.valid) setError(d.error || 'Invalid promo code');
      else { setDiscount(d.discount_percent ? (plan?.[`price_${period}`] * d.discount_percent / 100) : d.discount_amount); setError(''); }
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/checkout/process', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planSlug, period, method, txId, promo, senderName, proofUrl })
      });
      const d = await res.json();
      if (!res.ok) setError(d.error);
      else {
        setSuccess('Payment submitted successfully! Directing to dashboard...');
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch {
      setError('Network error');
    }
    setSubmitting(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProofUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  if (loading) return <div className={styles.page}><span className="spinner" /> Loading...</div>;
  if (!plan) return <div className={styles.page}>Plan not found</div>;

  const basePrice = plan[`price_${period}`] || 0;
  const total = Math.max(0, basePrice - discount);

  return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      
      <div className={styles.container}>
        {/* Left Side - Payment details */}
        <div>
          <Link href="/pricing" style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, display: 'inline-block' }}>← Back to Pricing</Link>
          <h1 className={styles.title}>Checkout</h1>
          
          <h2 className={styles.sectionTitle}>1. Select Payment Method</h2>
          <div className={styles.paymentMethods}>
            {settings.binance_enabled === '1' && (
              <div className={`${styles.methodCard} ${method === 'binance' ? styles.methodActive : ''}`} onClick={() => setMethod('binance')}>
                <span className={styles.methodIcon}>🔶</span>
                <span className={styles.methodName}>Binance Pay</span>
              </div>
            )}
            {customMethods.map(cm => (
              <div key={cm.id} className={`${styles.methodCard} ${method === `custom_${cm.id}` ? styles.methodActive : ''}`} onClick={() => setMethod(`custom_${cm.id}`)}>
                <span className={styles.methodIcon}>{cm.type === 'bank' ? '🏦' : '📱'}</span>
                <span className={styles.methodName}>{cm.name}</span>
              </div>
            ))}
            <div className={`${styles.methodCard} ${method === 'giftcard' ? styles.methodActive : ''}`} onClick={() => setMethod('giftcard')}>
              <span className={styles.methodIcon}>🎁</span>
              <span className={styles.methodName}>Gift Card</span>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>2. Payment Details</h2>
          <form onSubmit={handleSubmit}>
            {(method === 'binance' || method.startsWith('custom_')) && (
              <div className={styles.cryptoDetails}>
                <p style={{ marginBottom: 16 }}>Please send exactly <strong style={{ color: 'var(--accent-primary)', fontSize: 20 }}>${total.toFixed(2)}</strong> to the following details:</p>
                
                {method === 'binance' ? (
                  <div className={styles.cryptoAddress} style={{ marginBottom: 24 }}>{settings.binance_pay_id || 'Not configured by admin'}</div>
                ) : (
                  <div className={styles.cryptoAddress} style={{ marginBottom: 24, whiteSpace: 'pre-wrap' }}>
                    {customMethods.find(m => m.id === parseInt(method.split('_')[1]))?.details}
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="label">Your Name</label>
                    <input className="input" required={method.startsWith('custom_')} value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Full Name or Username" />
                  </div>
                  <div className="form-group">
                    <label className="label">Transaction ID</label>
                    <input className="input" value={txId} onChange={e => setTxId(e.target.value)} placeholder="TxID or Ref Number" />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="label">Upload Payment Proof (Optional if TxID is provided)</label>
                  <input type="file" className="input" accept="image/*" onChange={handleFileUpload} style={{ padding: '8px 12px' }} />
                </div>
                
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>* Your account will be upgraded manually after verification.</p>
              </div>
            )}

            {method === 'giftcard' && (
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="label">Gift Card Code</label>
                <input className="input" required value={txId} onChange={e => setTxId(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" />
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginTop: 24 }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginTop: 24 }}>{success}</div>}

            <button type="submit" disabled={submitting || success} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
              {submitting ? <span className="spinner" /> : `Complete Order • $${total.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Right Side - Summary */}
        <div>
          <div className={styles.summaryCard}>
            <h2 className={styles.sectionTitle}>Order Summary</h2>
            <div className={styles.summaryRow}>
              <span>{plan.name} Plan ({period})</span>
              <span>${basePrice.toFixed(2)}</span>
            </div>
            
            {discount > 0 && (
              <div className={styles.summaryRow} style={{ color: 'var(--accent-tertiary)' }}>
                <span>Promo Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}

            <div className={styles.summaryTotal}>
              <span>Total Due</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: 32 }}>
              <label className="label">Promo Code</label>
              <form onSubmit={applyPromo} className={styles.discountForm}>
                <input className="input" value={promo} onChange={e => setPromo(e.target.value)} placeholder="Got a code?" />
                <button type="submit" className="btn btn-secondary">Apply</button>
              </form>
            </div>
            
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              <li>✓ Full access immediately upon verification</li>
              <li>✓ 24/7 Priority Support</li>
              <li>✓ Cancel anytime</li>
            </ul>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 14, marginBottom: 12 }}>Need Help? Contact Us</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {settings.whatsapp_number && <a href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" className="btn btn-secondary btn-sm">💬 WhatsApp</a>}
                {settings.telegram_username && <a href={`https://t.me/${settings.telegram_username.replace('@', '')}`} target="_blank" className="btn btn-secondary btn-sm">✈️ Telegram</a>}
                <Link href="/dashboard" className="btn btn-secondary btn-sm">🎫 Open Ticket</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
