'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { ThemeToggle } from '@/components/ThemeProvider';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess('Account created! Redirecting...');
      setTimeout(() => router.push('/login'), 1500);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Link href="/" className={styles.logo}>✦ PurpleGuru</Link>
          <ThemeToggle />
        </div>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.sub}>Free forever. No credit card required.</p>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="label">Name</label><input className="input" type="text" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div className="form-group"><label className="label">Email</label><input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
          <div className="form-group"><label className="label">Password</label><input className="input" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} /></div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>
        <div className={styles.planBenefits}>
          <p>🎁 <strong>Free plan includes:</strong></p>
          <ul><li>✓ 20 AI text chats/day</li><li>✓ 5 AI images/day</li><li>✓ 1 video/day</li><li>✓ Conversation history</li></ul>
        </div>
        <p className={styles.switch}>Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
