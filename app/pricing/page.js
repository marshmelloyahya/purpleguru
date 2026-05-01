'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './pricing.module.css';
import { ThemeToggle } from '@/components/ThemeProvider';

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/checkout/plans').then(r => r.json()).then(d => {
      setPlans(d.plans || []);
      setLoading(false);
    });
  }, []);
  return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>✦ PurpleGuru</Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ThemeToggle />
            <Link href="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Sign Up Free</Link>
          </div>
      </nav>

      <div className={styles.content}>
        <div className="badge badge-purple" style={{ margin: '0 auto 20px', display: 'flex', width: 'fit-content' }}>Simple Pricing</div>
        <h1 className={styles.title}>Choose your <span className="grad-text">plan</span></h1>
        <p className={styles.sub}>Start free, upgrade anytime. No hidden fees. Cancel anytime.</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 4, borderRadius: 100, display: 'inline-flex' }}>
            <button className={`btn btn-sm ${period === 'monthly' ? 'btn-primary' : ''}`} style={{ borderRadius: 100, background: period !== 'monthly' ? 'transparent' : '', border: 'none' }} onClick={() => setPeriod('monthly')}>Monthly</button>
            <button className={`btn btn-sm ${period === 'yearly' ? 'btn-primary' : ''}`} style={{ borderRadius: 100, background: period !== 'yearly' ? 'transparent' : '', border: 'none' }} onClick={() => setPeriod('yearly')}>Yearly (-20%)</button>
          </div>
        </div>

        {loading ? <div style={{ textAlign: 'center' }}><span className="spinner" /></div> : (
          <div className={styles.planGrid}>
            {plans.map((p) => {
              const isPaid = p.slug !== 'free' && p.slug !== 'guest';
              const price = isPaid ? p[`price_${period}`] : 0;
              const link = isPaid ? `/checkout?plan=${p.slug}&period=${period}` : (p.slug === 'guest' ? '/chat' : '/register');
              const cta = isPaid ? `Get ${p.name}` : (p.slug === 'guest' ? 'Try Now' : 'Sign Up Free');
              const highlight = p.slug === 'pro';

              return (
                <div key={p.slug} className={`${styles.planCard} card ${highlight ? styles.planHighlight : ''}`}>
                  {highlight && <div className={styles.planBadge}>⭐ Most Popular</div>}
                  <h3 className={styles.planName}>{p.name}</h3>
                  <div className={styles.planPrice}>
                    <span className={highlight ? 'grad-text' : ''}>{isPaid ? `$${price}` : 'Free'}</span>
                    {isPaid && <small>/{period === 'monthly' ? 'month' : 'year'}</small>}
                  </div>
                  <ul className={styles.features}>
                    <li><span className={styles.check}>✓</span>{p.daily_text_limit} text/day</li>
                    <li><span className={styles.check}>✓</span>{p.daily_image_limit} images/day</li>
                    <li><span className={styles.check}>✓</span>{p.daily_video_limit} videos/day</li>
                    {p.features?.map((f, i) => <li key={i}><span className={styles.check}>✓</span>{f}</li>)}
                  </ul>
                  <Link href={link} className={`btn ${highlight ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center' }}>{cta}</Link>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.faq}>
          <h2>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            {[
              { q: 'Do I need a credit card?', a: 'No. The Guest and Free plans require no payment information. Upgrade only when you need more.' },
              { q: 'What AI models are included?', a: 'We support GPT-4o, Gemini, LLaMA, Mixtral, FLUX, DALL-E and many more across all plans.' },
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. You keep access until the end of your billing period.' },
              { q: 'How do daily limits work?', a: 'Limits reset every day at midnight UTC. Unused generations do not carry over.' },
            ].map((f, i) => (
              <div key={i} className={`${styles.faqItem} card`}>
                <h4>{f.q}</h4>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
