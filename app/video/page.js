'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// Reusing image module CSS as the layout is identical
import styles from '../image/image.module.css';
import { ThemeToggle } from '@/components/ThemeProvider';

export default function VideoPage() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [models, setModels] = useState([{ value: 'auto', label: 'Auto (Best Available)', provider: null }]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user));
    fetch('/api/models?type=video').then(r => r.json()).then(d => setModels(d.models || [{ value: 'auto', label: 'Auto (Best Available)', provider: null }]));
  }, []);

  const generate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true); setError('');
    const selectedModelObj = models.find(m => m.value === model);
    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: model === 'auto' ? null : model, provider: selectedModelObj?.provider }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else { setVideos(prev => [{ url: data.url, prompt, model: data.model, id: Date.now() }, ...prev]); }
    } catch { setError('Network error. Try again.'); }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>✦ PurpleGuru</Link>
        <div className={styles.navLinks}>
          <Link href="/chat" className={styles.navLink}>💬 Chat</Link>
          <Link href="/code" className={styles.navLink}>💻 Vibe Code</Link>
          <Link href="/image" className={styles.navLink}>🎨 Images</Link>
          <Link href="/video" className={`${styles.navLink} ${styles.active}`}>🎬 Video</Link>
          <Link href="/pricing" className={styles.navLink}>Pricing</Link>
        </div>
        <div>
          <ThemeToggle style={{ marginRight: 8 }} />
          {user ? <Link href="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
            : <><Link href="/login" className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}>Sign In</Link><Link href="/register" className="btn btn-primary btn-sm">Sign Up</Link></>}
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.left}>
          <h1 className={styles.title}>AI <span className="grad-text">Video Generation</span></h1>
          <p className={styles.sub}>Create cinematic videos from text descriptions using advanced AI models.</p>

          {!user && (
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              👋 Guest: Video generation requires Pro or Ultra plan. <Link href="/register" style={{ color: '#fff', fontWeight: 600 }}>Sign up</Link>
            </div>
          )}

          <form onSubmit={generate} className={styles.form}>
            <div className="form-group">
              <label className="label">Model</label>
              <select className="input" value={model} onChange={e => setModel(e.target.value)}>
                {models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="label">Prompt</label>
              <textarea className="input" rows={4} placeholder="Describe the video you want to generate in detail..." value={prompt} onChange={e => setPrompt(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading || !prompt.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              {loading ? <><span className="spinner" /> Generating Video...</> : '🎬 Generate Video'}
            </button>
          </form>
        </div>

        <div className={styles.right}>
          {loading && (
            <div className={styles.loadingCard}>
              <div className={styles.loadingOrb} />
              <p>Rendering your video...</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>This may take 1-3 minutes</p>
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          {videos.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <div style={{ fontSize: 64 }}>🎬</div>
              <h3>Your videos will appear here</h3>
              <p>Enter a prompt and click Generate</p>
            </div>
          )}
          <div className={styles.imageGrid} style={{ gridTemplateColumns: '1fr' }}>
            {videos.map(vid => (
              <div key={vid.id} className={`${styles.imageCard} card fade-in`} style={{ padding: 16 }}>
                <video src={vid.url} controls autoPlay loop style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                <div className={styles.imageInfo} style={{ marginTop: 12 }}>
                  <p className={styles.imagePrompt}>{vid.prompt.slice(0, 100)}...</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span className="badge badge-purple">{vid.model}</span>
                    <a href={vid.url} download={`purpleguru-${vid.id}.mp4`} className="btn btn-secondary btn-sm">⬇ Download</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
