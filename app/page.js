'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { ThemeToggle } from '@/components/ThemeProvider';

export default function HomePage() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 6 + 6,
    })));
  }, []);

  return (
    <div className={styles.page}>
      {/* Particles */}
      <div className={styles.particles}>
        {particles.map(p => (
          <span key={p.id} className={styles.particle} style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
          }} />
        ))}
      </div>

      {/* Orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>✦</div>
            <span>Aura <strong>AI</strong></span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/chat" className={styles.navLink}>Chat</Link>
            <Link href="/code" className={styles.navLink}>⚡ Vibe Code</Link>
            <Link href="/image" className={styles.navLink}>Images</Link>
            <Link href="/video" className={styles.navLink}>Video</Link>
            <Link href="/pricing" className={styles.navLink}>Pricing</Link>
          </div>
          <div className={styles.navActions}>
            <ThemeToggle />
            <Link href="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className="badge badge-purple fade-in" style={{ marginBottom: 24 }}>
            ✦ The AI Platform of the Future
          </div>
          <h1 className={`${styles.heroTitle} fade-in`}>
            Create Anything with<br />
            <span className="grad-text">AI-Powered Generation</span>
          </h1>
          <p className={`${styles.heroSub} fade-in`}>
            Generate stunning text, images, and videos in seconds. Powered by the world&apos;s best AI models.
            Free to use — no signup required.
          </p>
          <div className={`${styles.heroActions} fade-in`}>
            <Link href="/chat" className="btn btn-primary btn-lg">
              <span>Start Creating Free</span>
              <span>→</span>
            </Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">View Plans</Link>
          </div>
          <p className={styles.heroBadge}>✓ No credit card &nbsp;·&nbsp; ✓ No signup needed &nbsp;·&nbsp; ✓ 3 free requests/day</p>
        </div>

        {/* Demo card */}
        <div className={styles.heroDemo}>
          <div className={`${styles.demoCard} card`}>
            <div className={styles.demoHeader}>
              <div className={styles.demoTitle}>
                <span className={styles.demoIcon}>🤖</span>
                <span>PurpleGuru</span>
                <span className="badge badge-green">Live</span>
              </div>
            </div>
            <div className={styles.demoMessages}>
              <div className={styles.demoMsg}>
                <span className={styles.demoMsgUser}>You</span>
                <p>Write a product description for an AI-powered smartwatch</p>
              </div>
              <div className={`${styles.demoMsg} ${styles.demoMsgAI}`}>
                <span className={styles.demoMsgAILabel}>PurpleGuru</span>
                <p>Introducing the <strong>NexPulse</strong> — your intelligent companion that doesn&apos;t just track your life, it enhances it. Powered by adaptive AI, it learns your patterns, predicts your needs, and keeps you at peak performance around the clock...</p>
                <div className={styles.demoTyping}><span /><span /><span /></div>
              </div>
            </div>
            <div className={styles.demoInput}>
              <input readOnly placeholder="Ask anything..." className="input" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
              <button className="btn btn-primary btn-sm">Send</button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Everything you need to <span className="grad-text">create</span></h2>
          <p className={styles.sectionSub}>Three powerful generation modes — all in one place</p>
          <div className={styles.featureGrid}>
            {[
              { icon: '💬', title: 'AI Chat & Text', desc: 'Powered by GPT-4, Gemini, LLaMA, and more. Write, summarize, code, analyze — anything.', badge: 'Most Popular', color: 'purple', link: '/chat' },
              { icon: '💻', title: 'Vibe Coding', desc: 'Generate, fix, explain, and refactor code with 11 AI agents. Live HTML preview, 16 languages, conversation memory.', badge: '⚡ New', color: 'green', link: '/code' },
              { icon: '🎨', title: 'Image Generation', desc: 'Create stunning visuals with DALL-E 3, FLUX, and Stable Diffusion. Photorealistic or artistic.', badge: 'New Models', color: 'cyan', link: '/image' },
              { icon: '🎬', title: 'Video Generation', desc: 'Turn your prompts into captivating short videos with our AI video engine.', badge: 'Beta', color: 'purple', link: '/video' },
            ].map((f, i) => (
              <Link href={f.link} key={i} className={`${styles.featureCard} card`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.featureIcon} data-color={f.color}>{f.icon}</div>
                <div className={`badge badge-${f.color}`} style={{ marginBottom: 12 }}>{f.badge}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className={styles.featureLink}>Try it free →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {[
              { val: '5M+', label: 'Generations Made' },
              { val: '10+', label: 'AI Models' },
              { val: '150K+', label: 'Active Users' },
              { val: '99.9%', label: 'Uptime' },
            ].map((s, i) => (
              <div key={i} className={styles.statItem}>
                <div className={`${styles.statVal} grad-text`}>{s.val}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className={styles.pricingTeaser}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Simple, <span className="grad-text">fair pricing</span></h2>
          <p className={styles.sectionSub}>Start free, upgrade when you need more</p>
          <div className={styles.planGrid}>
            {[
              { name: 'Guest', price: 'Free', badge: null, features: ['3 text/day', '1 image/day', 'No signup required'], cta: 'Try Now', link: '/chat', highlight: false },
              { name: 'Free', price: 'Free', badge: null, features: ['20 text/day', '5 images/day', '1 video/day', 'Chat history'], cta: 'Sign Up Free', link: '/register', highlight: false },
              { name: 'Pro', price: '$9.99/mo', badge: '⭐ Popular', features: ['500 text/day', '100 images/day', '20 videos/day', 'All models', 'Priority queue'], cta: 'Go Pro', link: '/pricing', highlight: true },
              { name: 'Ultra', price: '$29.99/mo', badge: null, features: ['Unlimited text', '500 images/day', '100 videos/day', 'Early access', 'API access'], cta: 'Go Ultra', link: '/pricing', highlight: false },
            ].map((p, i) => (
              <div key={i} className={`${styles.planCard} card ${p.highlight ? styles.planHighlight : ''}`}>
                {p.badge && <div className={styles.planBadge}>{p.badge}</div>}
                <h3 className={styles.planName}>{p.name}</h3>
                <div className={`${styles.planPrice} ${p.highlight ? 'grad-text' : ''}`}>{p.price}</div>
                <ul className={styles.planFeatures}>
                  {p.features.map((f, j) => <li key={j}><span>✓</span>{f}</li>)}
                </ul>
                <Link href={p.link} className={`btn ${p.highlight ? 'btn-primary' : 'btn-secondary'} btn-sm`} style={{ width: '100%', justifyContent: 'center' }}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>Ready to start creating?</h2>
          <p>Join thousands of users already using PurpleGuru. No credit card required.</p>
          <Link href="/chat" className="btn btn-primary btn-lg">Start for Free →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}><div className={styles.logoIcon}>✦</div><span>Aura <strong>AI</strong></span></div>
              <p>The AI platform built for everyone.</p>
            </div>
            <div className={styles.footerLinks}>
              <div><h4>Product</h4><Link href="/chat">Chat</Link><Link href="/image">Images</Link><Link href="/video">Video</Link><Link href="/pricing">Pricing</Link></div>
              <div><h4>Account</h4><Link href="/login">Sign In</Link><Link href="/register">Sign Up</Link><Link href="/dashboard">Dashboard</Link></div>
              <div><h4>Support</h4><Link href="/tickets">Support Tickets</Link><Link href="/contact">Contact</Link></div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2025 PurpleGuru. All rights reserved.</p>
            <p className="badge badge-purple">Powered by Multiple AI Models</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
