'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './chat.module.css';
import { ThemeToggle } from '@/components/ThemeProvider';

// Models are now fetched dynamically from /api/models

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState('auto');
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([{ id: 1, title: 'New Chat', active: true }]);
  const [models, setModels] = useState([{ value: 'auto', label: 'Auto (Best Available)', provider: null }]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user));
    fetch('/api/models').then(r => r.json()).then(d => setModels(d.models || [{ value: 'auto', label: 'Auto (Best Available)', provider: null }]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const selectedModel = models.find(m => m.value === model);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim(), id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.content,
          model: model === 'auto' ? null : model,
          provider: model === 'auto' ? null : selectedModel?.provider,
          history,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Generation failed');
        if (data.requireSignup) setError(data.error + ' → Sign up free to get more!');
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant', content: data.text, id: Date.now() + 1,
          model: data.model, provider: data.provider,
        }]);
        // Update sidebar title from first message
        if (messages.length === 0) {
          setConversations(prev => prev.map(c => c.active ? { ...c, title: userMsg.content.slice(0, 35) + '...' } : c));
        }
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const newChat = () => {
    const id = Date.now();
    setConversations(prev => [...prev.map(c => ({ ...c, active: false })), { id, title: 'New Chat', active: true }]);
    setMessages([]);
    setError('');
  };

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.sidebarClosed}`}>
        <div className={styles.sidebarHead}>
          <Link href="/" className={styles.logo}>✦ PurpleGuru</Link>
          <div style={{ display: 'flex', gap: 6 }}>
            <ThemeToggle />
            <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSidebarOpen(f => !f)}>☰</button>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={newChat}>+ New Chat</button>
        <div className={styles.sidebarNav}>
          <Link href="/chat" className={`${styles.sidebarLink} ${styles.active}`}>💬 Text Chat</Link>
          <Link href="/code" className={styles.sidebarLink}>💻 Vibe Code</Link>
          <Link href="/image" className={styles.sidebarLink}>🎨 Image Gen</Link>
          <Link href="/video" className={styles.sidebarLink}>🎬 Video Gen</Link>
          <Link href="/pricing" className={styles.sidebarLink}>⭐ Pricing</Link>
        </div>
        <div className={styles.sidebarSection}>
          <p className={styles.sidebarLabel}>Recent Chats</p>
          {conversations.map(c => (
            <button key={c.id} className={`${styles.convItem} ${c.active ? styles.convActive : ''}`} onClick={() => setConversations(prev => prev.map(x => ({ ...x, active: x.id === c.id })))}>
              💬 {c.title}
            </button>
          ))}
        </div>
        <div className={styles.sidebarFooter}>
          {user ? (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>{user.name[0].toUpperCase()}</div>
              <div>
                <p className={styles.userName}>{user.name}</p>
                <span className={`badge badge-${user.plan === 'pro' ? 'purple' : user.plan === 'ultra' ? 'cyan' : 'gray'}`}>{user.plan}</span>
              </div>
              <Link href="/dashboard" className="btn btn-secondary btn-sm btn-icon">⚙</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/login" className="btn btn-secondary btn-sm" style={{ textAlign: 'center' }}>Sign In</Link>
              <Link href="/register" className="btn btn-primary btn-sm" style={{ textAlign: 'center' }}>Sign Up Free</Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            {!sidebarOpen && <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSidebarOpen(true)}>☰</button>}
            <h2 className={styles.chatTitle}>{conversations.find(c => c.active)?.title || 'New Chat'}</h2>
          </div>
          <div className={styles.topBarRight}>
            <select className={styles.modelSelect} value={model} onChange={e => setModel(e.target.value)}>
              {models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✦</div>
              <h2>How can I help you today?</h2>
              <p>Start a conversation with PurpleGuru. Powered by top AI models.</p>
              <div className={styles.suggestions}>
                {['Write a product description', 'Explain quantum computing', 'Create a Python function', 'Summarize an article'].map(s => (
                  <button key={s} className={`${styles.suggestionChip} card`} onClick={() => { setInput(s); textareaRef.current?.focus(); }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.assistantMsg} fade-in`}>
              <div className={styles.msgAvatar}>
                {msg.role === 'user' ? (user ? user.name[0].toUpperCase() : 'U') : '✦'}
              </div>
              <div className={styles.msgContent}>
                <div className={styles.msgMeta}>
                  <span className={styles.msgRole}>{msg.role === 'user' ? 'You' : 'PurpleGuru'}</span>
                  {msg.model && <span className="badge badge-purple" style={{ fontSize: 10 }}>{msg.model}</span>}
                </div>
                <div className={styles.msgText}>{msg.content}</div>
                <div className={styles.msgActions}>
                  <button onClick={() => navigator.clipboard.writeText(msg.content)} className={styles.msgAction}>📋 Copy</button>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.message} ${styles.assistantMsg} fade-in`}>
              <div className={styles.msgAvatar}>✦</div>
              <div className={styles.msgContent}>
                <div className={styles.msgMeta}><span className={styles.msgRole}>PurpleGuru</span></div>
                <div className={styles.typing}><span /><span /><span /></div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error fade-in" style={{ margin: '0 24px' }}>
              {error}
              {error.includes('Sign up') && <Link href="/register" style={{ marginLeft: 8, color: '#fff', fontWeight: 600 }}>Sign Up →</Link>}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          {!user && (
            <div className={styles.guestBanner}>
              <span>👋 Using as guest — <strong>3 messages/day</strong></span>
              <Link href="/register" className="btn btn-primary btn-sm">Sign Up Free for 20/day →</Link>
            </div>
          )}
          <form className={styles.inputForm} onSubmit={sendMessage}>
            <div className={styles.inputWrap}>
              <textarea
                ref={textareaRef}
                className={`${styles.chatInput} input`}
                placeholder="Ask PurpleGuru anything... (Shift+Enter for new line)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                style={{ resize: 'none', minHeight: 52 }}
              />
              <button type="submit" disabled={loading || !input.trim()} className={`btn btn-primary ${styles.sendBtn}`}>
                {loading ? <span className="spinner" /> : '↑'}
              </button>
            </div>
            <p className={styles.inputHint}>PurpleGuru may make mistakes. Verify important info.</p>
          </form>
        </div>
      </main>
    </div>
  );
}
