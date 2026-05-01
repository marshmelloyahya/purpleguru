'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './code.module.css';
import { ThemeToggle } from '@/components/ThemeProvider';

// AGENTS are now fetched dynamically from /api/models

const LANGUAGES = [
  { value: 'auto', label: '🤖 Auto Detect' },
  { value: 'html', label: '🌐 HTML/CSS/JS (Web)' },
  { value: 'javascript', label: '📜 JavaScript' },
  { value: 'typescript', label: '💙 TypeScript' },
  { value: 'python', label: '🐍 Python' },
  { value: 'react', label: '⚛️ React / JSX' },
  { value: 'nodejs', label: '🟢 Node.js' },
  { value: 'css', label: '🎨 CSS' },
  { value: 'sql', label: '🗄️ SQL' },
  { value: 'bash', label: '🖥️ Bash / Shell' },
  { value: 'go', label: '🐹 Go' },
  { value: 'rust', label: '🦀 Rust' },
  { value: 'php', label: '🐘 PHP' },
  { value: 'java', label: '☕ Java' },
  { value: 'csharp', label: '💜 C#' },
  { value: 'cpp', label: '⚙️ C++' },
];

const MODES = [
  { value: 'generate', label: '✨ Generate', desc: 'Create new code from scratch' },
  { value: 'fix',      label: '🔧 Fix Bug',  desc: 'Find and fix errors in code' },
  { value: 'explain',  label: '📖 Explain',  desc: 'Understand existing code' },
  { value: 'refactor', label: '♻️ Refactor', desc: 'Improve and optimize code' },
];

const TEMPLATES = [
  { label: 'Landing Page', prompt: 'Create a modern, beautiful landing page for a SaaS product with dark mode, glassmorphism effects, hero section, features grid, and pricing section. Use embedded CSS and JavaScript.', lang: 'html' },
  { label: 'REST API', prompt: 'Create a complete Node.js Express REST API with CRUD operations for a "tasks" resource, including authentication middleware, error handling, and input validation.', lang: 'nodejs' },
  { label: 'Data Dashboard', prompt: 'Create an interactive data dashboard with charts (using Chart.js from CDN), statistics cards, and a data table with sorting and filtering.', lang: 'html' },
  { label: 'Login UI', prompt: 'Create a stunning animated login/register page with dark glassmorphism design, form validation, and smooth transitions between login and register forms.', lang: 'html' },
  { label: 'Python Scraper', prompt: 'Create a Python web scraper using BeautifulSoup and requests that scrapes product data (name, price, rating) from a website and saves to CSV.', lang: 'python' },
  { label: 'React Todo App', prompt: 'Create a complete React todo application with hooks, local storage persistence, drag-to-reorder, priority tags, and beautiful animations. Single file JSX.', lang: 'react' },
  { label: 'SQL Database', prompt: 'Design a complete SQL database schema for an e-commerce platform with users, products, orders, reviews, and inventory tables with indexes and constraints.', lang: 'sql' },
  { label: 'CLI Tool', prompt: 'Create a Python CLI tool using argparse/click that can process files in a directory (count words, find patterns, transform text) with colored output.', lang: 'python' },
];

export default function VibeCodePage() {
  const [agent, setAgent] = useState('auto');
  const [language, setLanguage] = useState('auto');
  const [mode, setMode] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeModel, setActiveModel] = useState(null);
  const [activeProvider, setActiveProvider] = useState(null);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [previewMode, setPreviewMode] = useState('code'); // 'code' | 'preview'
  const [copied, setCopied] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [models, setModels] = useState([{ value: 'auto', label: 'Auto (Best Available)', provider: null }]);
  const promptRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user));
    fetch('/api/models').then(r => r.json()).then(d => {
      if (d.models) setModels(d.models.map(m => ({ id: m.value, label: m.label, icon: '✦', color: 'purple', provider: m.provider })));
    });
  }, []);

  const selectedAgent = models.find(a => a.id === agent) || models[0];
  const selectedLang = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];

  const generate = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');

    const newHistory = [...history, { role: 'user', content: prompt }];

    try {
      const res = await fetch('/api/generate/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language, agent, provider: selectedAgent?.provider, mode, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Generation failed');
      } else {
        setCode(data.code);
        setActiveModel(data.model);
        setActiveProvider(data.provider);
        setHistory([...newHistory, { role: 'assistant', content: data.code }]);
        setPrompt('');
        // Auto-detect if HTML for preview
        if (data.code.trim().startsWith('<!DOCTYPE') || data.code.trim().startsWith('<html')) {
          setPreviewMode('preview');
        }
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }, [prompt, loading, language, agent, mode, history]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); generate(); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const ext = { html: 'html', javascript: 'js', typescript: 'ts', python: 'py', react: 'jsx', nodejs: 'js', css: 'css', sql: 'sql', bash: 'sh', go: 'go', rust: 'rs', php: 'php', java: 'java', csharp: 'cs', cpp: 'cpp', auto: 'txt' };
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-vibe-code.${ext[language] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => { setCode(''); setHistory([]); setError(''); setActiveModel(null); };

  const useTemplate = (t) => {
    setPrompt(t.prompt);
    setLanguage(t.lang);
    setMode('generate');
    promptRef.current?.focus();
  };

  const isHtml = code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html') || code.includes('<body');

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.orb1} /><div className={styles.orb2} /><div className={styles.orb3} />

      {/* Nav */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>✦ PurpleGuru</Link>
        <div className={styles.navLinks}>
          <Link href="/chat" className={styles.navLink}>💬 Chat</Link>
          <Link href="/code" className={`${styles.navLink} ${styles.navActive}`}>💻 Vibe Code</Link>
          <Link href="/image" className={styles.navLink}>🎨 Images</Link>
          <Link href="/video" className={styles.navLink}>🎬 Video</Link>
          <Link href="/pricing" className={styles.navLink}>Pricing</Link>
        </div>
        {user
          ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><ThemeToggle /><Link href="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link></div>
          : <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><ThemeToggle /><Link href="/login" className="btn btn-secondary btn-sm">Sign In</Link><Link href="/register" className="btn btn-primary btn-sm">Sign Up</Link></div>
        }
      </nav>

      <div className={styles.shell}>
        {/* ── LEFT PANEL ── */}
        <div className={styles.leftPanel}>
          {/* Header */}
          <div className={styles.leftHeader}>
            <div>
              <h1 className={styles.title}>Vibe <span className="grad-text">Coding</span></h1>
              <p className={styles.sub}>Describe what you want to build and let AI write the code</p>
            </div>
            <div className={`badge badge-${selectedAgent.color}`} style={{ alignSelf: 'flex-start' }}>
              {selectedAgent.icon} {selectedAgent.label}
            </div>
          </div>

          {/* Agent Selector */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>🤖 AI Agent</span>
              <button className={`btn btn-secondary btn-sm`} onClick={() => setShowAgentPanel(p => !p)}>
                {showAgentPanel ? 'Hide' : 'Choose Agent'}
              </button>
            </div>
            {showAgentPanel && (
              <div className={styles.agentGrid}>
                {models.map(a => (
                  <button key={a.id} onClick={() => { setAgent(a.id); setShowAgentPanel(false); }} className={`${styles.agentCard} ${agent === a.id ? styles.agentActive : ''}`}>
                    <span className={styles.agentIcon}>{a.icon}</span>
                    <div className={styles.agentInfo}>
                      <span className={styles.agentLabel}>{a.label}</span>
                      {a.provider && <span className={`badge badge-purple`} style={{ fontSize: 10, padding: '2px 7px' }}>{a.provider}</span>}
                    </div>
                    {agent === a.id && <span className={styles.agentCheck}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode + Language */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>⚙️ Options</div>
            <div className={styles.optionRow}>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ marginBottom: 6 }}>Mode</label>
                <div className={styles.modeGrid}>
                  {MODES.map(m => (
                    <button key={m.value} onClick={() => setMode(m.value)} className={`${styles.modeBtn} ${mode === m.value ? styles.modeBtnActive : ''}`} title={m.desc}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="label">Language / Framework</label>
              <select className="input" value={language} onChange={e => setLanguage(e.target.value)}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Templates */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>⚡ Quick Templates</div>
            <div className={styles.templateGrid}>
              {TEMPLATES.map(t => (
                <button key={t.label} onClick={() => useTemplate(t)} className={styles.templateChip}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className={styles.promptSection}>
            {!user && (
              <div className={styles.guestBanner}>
                <span>👋 Guest — <strong>3 requests/day</strong></span>
                <Link href="/register" className="btn btn-primary btn-sm">Sign Up for 20/day</Link>
              </div>
            )}
            <div className={styles.promptHeader}>
              <label className={styles.sectionLabel}>
                {mode === 'generate' ? '✨ Describe what to build' : mode === 'fix' ? '🔧 Paste code to fix' : mode === 'explain' ? '📖 Paste code to explain' : '♻️ Paste code to refactor'}
              </label>
              {history.length > 0 && <button className="btn btn-secondary btn-sm" onClick={clearAll}>Clear</button>}
            </div>
            <textarea
              ref={promptRef}
              className={`input ${styles.promptInput}`}
              placeholder={
                mode === 'generate'
                  ? 'e.g. Create a beautiful todo app with drag-and-drop, dark mode, and local storage...'
                  : mode === 'fix'
                  ? 'Paste your code here and describe the bug...'
                  : mode === 'explain'
                  ? 'Paste any code here to get a detailed explanation...'
                  : 'Paste your code here to get an improved, optimized version...'
              }
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              rows={6}
            />
            {history.length > 0 && (
              <p className={styles.historyNote}>💬 {Math.floor(history.length / 2)} exchange{history.length > 2 ? 's' : ''} in context — AI remembers your conversation</p>
            )}
            <button
              onClick={generate}
              disabled={loading || !prompt.trim()}
              className={`btn btn-primary ${styles.generateBtn}`}
            >
              {loading ? <><span className="spinner" /> Generating...</> : <>{mode === 'generate' ? '✨ Generate Code' : mode === 'fix' ? '🔧 Fix Code' : mode === 'explain' ? '📖 Explain Code' : '♻️ Refactor Code'} <kbd>Ctrl+↵</kbd></>}
            </button>

            {error && (
              <div className="alert alert-error" style={{ marginTop: 12 }}>
                {error}
                {error.includes('Sign up') && <Link href="/register" style={{ marginLeft: 8, fontWeight: 600, color: '#fff' }}>Sign Up →</Link>}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={styles.rightPanel}>
          {/* Toolbar */}
          <div className={styles.codeToolbar}>
            <div className={styles.toolbarLeft}>
              {activeModel && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-purple">{activeProvider}</span>
                  <span className="badge badge-gray" style={{ fontFamily: 'monospace', fontSize: 11 }}>{activeModel}</span>
                </div>
              )}
              {!activeModel && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Output will appear here</span>}
            </div>
            <div className={styles.toolbarRight}>
              {code && isHtml && (
                <div className={styles.tabGroup}>
                  <button onClick={() => setPreviewMode('code')} className={`${styles.tabBtn} ${previewMode === 'code' ? styles.tabActive : ''}`}>Code</button>
                  <button onClick={() => setPreviewMode('preview')} className={`${styles.tabBtn} ${previewMode === 'preview' ? styles.tabActive : ''}`}>Preview</button>
                </div>
              )}
              {code && (
                <>
                  <button onClick={copyCode} className="btn btn-secondary btn-sm">
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <button onClick={downloadCode} className="btn btn-secondary btn-sm">⬇ Download</button>
                  <button onClick={clearAll} className="btn btn-danger btn-sm">🗑 Clear</button>
                </>
              )}
            </div>
          </div>

          {/* Code Output */}
          <div className={styles.codeArea}>
            {loading && (
              <div className={styles.loadingOverlay}>
                <div className={styles.loadingContent}>
                  <div className={styles.loadingOrb} />
                  <p>Generating code with <strong>{selectedAgent.label}</strong>...</p>
                  <p className={styles.loadingHint}>This may take a few seconds</p>
                  <div className={styles.loadingDots}><span /><span /><span /></div>
                </div>
              </div>
            )}

            {!code && !loading && (
              <div className={styles.emptyCode}>
                <div className={styles.emptyIcon}>{'<>'}</div>
                <h3>Your code will appear here</h3>
                <p>Choose an agent, describe what you want, and click Generate</p>
                <div className={styles.shortcutHint}>
                  <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to generate
                </div>
              </div>
            )}

            {code && !loading && (
              <>
                {previewMode === 'preview' && isHtml ? (
                  <iframe
                    className={styles.preview}
                    srcDoc={code}
                    title="Code Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className={styles.codeWrapper}>
                    <div className={styles.codeHeader}>
                      <div className={styles.codeTrafficLights}>
                        <span style={{ background: '#ff5f57' }} />
                        <span style={{ background: '#febc2e' }} />
                        <span style={{ background: '#28c840' }} />
                      </div>
                      <span className={styles.codeLang}>{selectedLang.label}</span>
                    </div>
                    <pre ref={codeRef} className={styles.codeBlock}><code>{code}</code></pre>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Follow-up chat bar (when code exists) */}
          {code && !loading && (
            <div className={styles.followUp}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Follow up: add a feature, fix a bug, change the style..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKey}
              />
              <button onClick={generate} disabled={!prompt.trim()} className="btn btn-primary">
                ↑ Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
