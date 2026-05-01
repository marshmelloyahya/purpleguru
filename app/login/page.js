'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { ThemeToggle } from '@/components/ThemeProvider';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      
      const searchParams = new URLSearchParams(window.location.search);
      const nextUrl = searchParams.get('next');

      if (nextUrl) {
        router.push(nextUrl);
      } else if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch { setError('Network error. Try again.'); }
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
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Sign in to your account to continue</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Your password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>
        <p className={styles.switch}>Don&apos;t have an account? <Link href="/register">Sign up free</Link></p>
        <div className={styles.divider}><span>or continue as</span></div>
        <Link href="/chat" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Guest (3 free/day)</Link>
      </div>
    </div>
  );
}
