'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './image.module.css';
import { ThemeToggle } from '@/components/ThemeProvider';

// IMAGE_MODELS are now fetched dynamically from /api/models?type=image

const STYLE_PRESETS = [
  { label: 'Photorealistic', prefix: 'photorealistic, 8k, detailed, ' },
  { label: 'Digital Art', prefix: 'digital art, vibrant colors, trending on artstation, ' },
  { label: 'Oil Painting', prefix: 'oil painting, classical art style, masterpiece, ' },
  { label: 'Anime', prefix: 'anime style, detailed, Studio Ghibli inspired, ' },
  { label: 'Cyberpunk', prefix: 'cyberpunk, neon lights, futuristic, dark atmosphere, ' },
  { label: 'Minimalist', prefix: 'minimalist design, clean, simple, white background, ' },
];

export default function ImagePage() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [models, setModels] = useState([{ value: 'auto', label: 'Auto (Best Available)', provider: null }]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user));
    fetch('/api/models?type=image').then(r => r.json()).then(d => setModels(d.models || [{ value: 'auto', label: 'Auto (Best Available)', provider: null }]));
  }, []);

  const generate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true); setError('');
    const finalPrompt = selectedStyle ? STYLE_PRESETS.find(s => s.label === selectedStyle)?.prefix + prompt : prompt;
    const selectedModelObj = models.find(m => m.value === model);
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, model: model === 'auto' ? null : model, provider: selectedModelObj?.provider }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else { setImages(prev => [{ url: data.url, prompt: finalPrompt, model: data.model, id: Date.now() }, ...prev]); }
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
          <Link href="/image" className={`${styles.navLink} ${styles.active}`}>🎨 Images</Link>
          <Link href="/video" className={styles.navLink}>🎬 Video</Link>
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
          <h1 className={styles.title}>AI <span className="grad-text">Image Generation</span></h1>
          <p className={styles.sub}>Create stunning visuals from text descriptions using FLUX, DALL-E, and more.</p>

          {!user && (
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              👋 Guest: 1 image/day free. <Link href="/register" style={{ color: '#fff', fontWeight: 600 }}>Sign up</Link> for 5/day.
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
              <label className="label">Style Preset</label>
              <div className={styles.styleGrid}>
                {STYLE_PRESETS.map(s => (
                  <button type="button" key={s.label} onClick={() => setSelectedStyle(prev => prev === s.label ? null : s.label)} className={`${styles.styleChip} ${selectedStyle === s.label ? styles.styleActive : ''}`}>{s.label}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label">Prompt</label>
              <textarea className="input" rows={4} placeholder="Describe the image you want to generate..." value={prompt} onChange={e => setPrompt(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading || !prompt.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              {loading ? <><span className="spinner" /> Generating...</> : '🎨 Generate Image'}
            </button>
          </form>
        </div>

        <div className={styles.right}>
          {loading && (
            <div className={styles.loadingCard}>
              <div className={styles.loadingOrb} />
              <p>Creating your image...</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>This may take 10–30 seconds</p>
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          {images.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <div style={{ fontSize: 64 }}>🎨</div>
              <h3>Your images will appear here</h3>
              <p>Enter a prompt and click Generate</p>
            </div>
          )}
          <div className={styles.imageGrid}>
            {images.map(img => (
              <div key={img.id} className={`${styles.imageCard} card fade-in`}>
                <img src={img.url} alt={img.prompt} className={styles.generatedImg} />
                <div className={styles.imageInfo}>
                  <p className={styles.imagePrompt}>{img.prompt.slice(0, 80)}...</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span className="badge badge-purple">{img.model}</span>
                    <a href={img.url} download={`purpleguru-${img.id}.png`} className="btn btn-secondary btn-sm">⬇ Download</a>
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
