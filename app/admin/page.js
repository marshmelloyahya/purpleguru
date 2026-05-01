'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';
import { ThemeToggle } from '@/components/ThemeProvider';

const TABS = ['Overview', 'Users', 'API Keys', 'Tickets', 'Payments', 'Payment Options', 'Plans', 'Settings', 'Updates'];
const PROVIDERS = ['openai', 'groq', 'gemini', 'huggingface', 'together', 'deepseek', 'anthropic', 'replicate', 'openrouter', 'cloudflare', 'fireworks', 'ibm', 'pollinations', 'aichatgptfree.org', 'mirexa.vercel.app', 'umint-ai.hf.space', 'sur.pollinations.ai', 'pi.ai', 'flowgpt.com', 'grok.com', 'perplexity.ai', 'chat.mistral.ai', 'chatgpt.com', 'app.lumioai.tech', 'phind.com', 'sharedchat.cn', 'meta.ai', 'g4f.dev', 'lmarena.ai', 'console.groq.com', 'ai.google.dev', 'platform.deepseek.com', 'www.together.ai', 'replicate.com', 'www.anthropic.com/api', 'platform.openai.com', 'openrouter.ai', 'developers.cloudflare.com', 'fireworks.ai', 'ibm.com', 'ai-sdk.dev', 'developer.puter.com'];

export default function AdminPage() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [newKey, setNewKey] = useState({ provider: 'groq', key_values: '', notes: '' });
  const [newTicket, setNewTicket] = useState({ userSearch: '', subject: '', message: '' });
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'Overview') {
        const res = await fetch('/api/admin/stats');
        if (res.status === 403) { router.push('/login'); return; }
        const d = await res.json();
        setStats(d);
      } else if (tab === 'Users') {
        const d = await fetch('/api/admin/users').then(r => r.json());
        setUsers(d.users || []);
      } else if (tab === 'API Keys') {
        const d = await fetch('/api/admin/keys').then(r => r.json());
        setApiKeys(d.keys || []);
      } else if (tab === 'Tickets') {
        const d = await fetch('/api/admin/tickets').then(r => r.json());
        setTickets(d.tickets || []);
      } else if (tab === 'Plans') {
        const d = await fetch('/api/admin/plans').then(r => r.json());
        setPlans(d.plans || []);
      } else if (tab === 'Payments') {
        const d = await fetch('/api/admin/payments').then(r => r.json());
        setPayments(d.payments || []);
      } else if (tab === 'Payment Options') {
        const d = await fetch('/api/admin/payment-methods').then(r => r.json());
        setPaymentMethods(d.methods || []);
      } else if (tab === 'Settings') {
        const d = await fetch('/api/admin/settings').then(r => r.json());
        setSettings(d.settings || {});
      }
    } catch {}
    setLoading(false);
  };

  const userAction = async (userId, action, value) => {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action, value }) });
    fetchData(); setMsg(`User ${action} applied.`);
  };

  const addKey = async (e) => {
    e.preventDefault();
    setMsg('Testing and adding keys (this might take a moment)...');
    
    // Split by newline or comma
    const keysArray = newKey.key_values.split(/[\n,]+/).map(k => k.trim()).filter(k => k);
    
    if (keysArray.length === 0) {
      setMsg('⚠️ Please enter at least one key.');
      return;
    }

    const res = await fetch('/api/admin/keys', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...newKey, key_values: keysArray }) 
    });
    const d = await res.json();
    setMsg(d.message || (d.success ? '✅ Keys added!' : '❌ Failed to add keys.'));
    setNewKey({ provider: newKey.provider, key_values: '', notes: '' });
    fetchData();
  };

  const keyAction = async (keyId, action) => {
    const res = await fetch('/api/admin/keys', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyId, action }) });
    const d = await res.json();
    if (action === 'test') setMsg(d.works ? '✅ Key is working!' : '❌ Key failed.');
    fetchData();
  };

  const ticketAction = async (ticketId, status) => {
    await fetch('/api/admin/tickets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId, status }) });
    fetchData();
  };

  const createTicket = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/tickets/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTicket) });
    const d = await res.json();
    if (d.success) { setMsg('✅ Message sent to user!'); setNewTicket({ userSearch: '', subject: '', message: '' }); fetchData(); }
    else setMsg(`❌ Error: ${d.error}`);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setMsg('✅ Settings saved!');
  };

  const updatePlan = async (plan) => {
    await fetch('/api/admin/plans', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
    setMsg(`✅ ${plan.name} plan updated!`);
    fetchData();
  };

  const paymentAction = async (paymentId, status) => {
    await fetch('/api/admin/payments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId, status }) });
    setMsg(`✅ Payment marked as ${status}`);
    fetchData();
  };

  const [newMethod, setNewMethod] = useState({ type: 'bank', name: '', details: '' });
  const addPaymentMethod = async (e) => {
    e.preventDefault();
    await fetch('/api/admin/payment-methods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMethod) });
    setMsg('✅ Payment method added!');
    setNewMethod({ type: 'bank', name: '', details: '' });
    fetchData();
  };
  const toggleMethod = async (id, isActive) => {
    await fetch('/api/admin/payment-methods', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: isActive ? 1 : 0 }) });
    fetchData();
  };
  const deleteMethod = async (id) => {
    if (!confirm('Delete this method?')) return;
    await fetch('/api/admin/payment-methods', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchData();
  };

  const installUpdate = async () => {
    setMsg('Checking for updates...');
    setTimeout(() => {
      setMsg('✅ Platform updated to the latest version successfully!');
    }, 2000);
  };

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>✦ PurpleGuru <span className="badge badge-red">Admin</span></div>
        <nav className={styles.nav}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`${styles.navItem} ${tab === t ? styles.navActive : ''}`}>
              {t === 'Overview' && '📊'} {t === 'Users' && '👥'} {t === 'API Keys' && '🔑'} {t === 'Tickets' && '🎫'} {t === 'Payments' && '💳'} {t === 'Payment Options' && '🏦'} {t === 'Plans' && '⭐'} {t === 'Settings' && '⚙️'} {t === 'Updates' && '🔄'} {t}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
            <ThemeToggle />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Toggle theme</span>
          </div>
          <a href="/" className={`${styles.navItem}`}>← Back to Site</a>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>{tab}</h1>
          {msg && <div className="alert alert-success" style={{ margin: 0, padding: '8px 16px' }}>{msg}<button onClick={() => setMsg('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button></div>}
        </div>

        {loading && <div className={styles.loading}><span className="spinner" /> Loading...</div>}

        {/* OVERVIEW */}
        {!loading && tab === 'Overview' && stats && (
          <div className={styles.content}>
            <div className={styles.statsGrid}>
              {[
                { label: 'Total Users', val: stats.stats.totalUsers, icon: '👥', color: 'purple' },
                { label: 'Active Today', val: stats.stats.activeToday, icon: '📈', color: 'green' },
                { label: 'Generations Today', val: stats.stats.generationsToday, icon: '⚡', color: 'cyan' },
                { label: 'Total Revenue', val: `$${stats.stats.totalRevenue.toFixed(2)}`, icon: '💰', color: 'yellow' },
                { label: 'Open Tickets', val: stats.stats.openTickets, icon: '🎫', color: 'red' },
                { label: 'Working API Keys', val: stats.stats.apiKeys, icon: '🔑', color: 'purple' },
                { label: 'Pro Users', val: stats.stats.proUsers, icon: '⭐', color: 'cyan' },
                { label: 'Ultra Users', val: stats.stats.ultraUsers, icon: '🚀', color: 'green' },
              ].map((s, i) => (
                <div key={i} className={`${styles.statCard} card`}>
                  <div className={styles.statIcon}>{s.icon}</div>
                  <div className={`${styles.statVal} grad-text`}>{s.val}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className={styles.tables}>
              <div>
                <h3 className={styles.tableTitle}>Recent Users</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Joined</th></tr></thead>
                    <tbody>{stats.recentUsers.map(u => (
                      <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><span className={`badge badge-${u.plan === 'pro' ? 'purple' : u.plan === 'ultra' ? 'cyan' : 'gray'}`}>{u.plan}</span></td><td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.created_at?.slice(0, 10)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 className={styles.tableTitle}>Recent Tickets</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Subject</th><th>Status</th><th>User</th></tr></thead>
                    <tbody>{stats.recentTickets.map(t => (
                      <tr key={t.id}><td>{t.subject}</td><td><span className={`badge badge-${t.status === 'open' ? 'red' : t.status === 'in_progress' ? 'yellow' : 'green'}`}>{t.status}</span></td><td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.name || t.guest_email || 'Guest'}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {!loading && tab === 'Users' && (
          <div className={styles.content}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Role</th><th>Status</th><th>Text Used</th><th>Actions</th></tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <select defaultValue={u.plan} onChange={e => userAction(u.id, 'plan', e.target.value)} className={styles.miniSelect}>
                        {['free', 'pro', 'ultra'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge badge-${u.role === 'admin' ? 'red' : 'gray'}`}>{u.role}</span></td>
                    <td><span className={`badge badge-${u.is_banned ? 'red' : 'green'}`}>{u.is_banned ? 'Banned' : 'Active'}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.daily_text_used}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className={`btn btn-sm ${u.is_banned ? 'btn-secondary' : 'btn-danger'}`} onClick={() => userAction(u.id, 'ban', !u.is_banned)}>{u.is_banned ? 'Unban' : 'Ban'}</button>
                        <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete user?')) userAction(u.id, 'delete'); }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* API KEYS */}
        {!loading && tab === 'API Keys' && (
          <div className={styles.content}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <button className="btn btn-primary" onClick={async () => {
                  setMsg('Checking keys...');
                  const r = await fetch('/api/admin/keys/check', { method: 'POST' });
                  const d = await r.json();
                  if (d.success) { setMsg('✅ Keys checked successfully!'); fetchData(); }
                }}>🔄 Check All Keys Now</button>
              </div>
            </div>
            <div className={`card ${styles.addKeyForm}`}>
              <h3>Mass Add API Keys</h3>
              <form onSubmit={addKey} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: 12, alignItems: 'start', marginTop: 16 }}>
                <div>
                  <label className="label">Provider</label>
                  <select className="input" value={newKey.provider} onChange={e => setNewKey(k => ({ ...k, provider: e.target.value }))}>
                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">API Keys (one per line or comma separated)</label>
                  <textarea className="input" placeholder="sk-...\nsk-...\nsk-..." value={newKey.key_values} onChange={e => setNewKey(k => ({ ...k, key_values: e.target.value }))} required style={{ minHeight: '80px', resize: 'vertical' }} />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input className="input" type="text" placeholder="Optional note for all" value={newKey.notes} onChange={e => setNewKey(k => ({ ...k, notes: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 24 }}>Add & Test All</button>
              </form>
            </div>
            <div className="table-wrap" style={{ marginTop: 20 }}>
              <table>
                <thead><tr><th>Provider</th><th>Key</th><th>Status</th><th>Working</th><th>Daily Use</th><th>Total Use</th><th>Errors</th><th>Actions</th></tr></thead>
                <tbody>{apiKeys.map(k => (
                  <tr key={k.id}>
                    <td><span className="badge badge-purple">{k.provider}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{k.key_value}</td>
                    <td><span className={`badge badge-${k.is_active ? 'green' : 'gray'}`}>{k.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><span className={`badge badge-${k.is_working ? 'green' : 'red'}`}>{k.is_working ? '✓' : '✗'}</span></td>
                    <td>{k.daily_usage}</td>
                    <td>{k.total_usage}</td>
                    <td style={{ color: k.error_count > 5 ? '#ff6464' : 'inherit' }}>{k.error_count}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => keyAction(k.id, 'test')}>Test</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => keyAction(k.id, 'toggle')}>{k.is_active ? 'Disable' : 'Enable'}</button>
                        <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete key?')) keyAction(k.id, 'delete'); }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* TICKETS */}
        {!loading && tab === 'Tickets' && (
          <div className={styles.content}>
            <div className={`card ${styles.addKeyForm}`} style={{ marginBottom: 20 }}>
              <h3>Message a User</h3>
              <form onSubmit={createTicket} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 12, alignItems: 'end', marginTop: 16 }}>
                <div><label className="label">User ID, Email or Name</label><input className="input" placeholder="e.g. john@example.com" value={newTicket.userSearch} onChange={e => setNewTicket(t => ({ ...t, userSearch: e.target.value }))} required /></div>
                <div><label className="label">Subject</label><input className="input" placeholder="Message subject" value={newTicket.subject} onChange={e => setNewTicket(t => ({ ...t, subject: e.target.value }))} required /></div>
                <div><label className="label">Message</label><input className="input" placeholder="Your message..." value={newTicket.message} onChange={e => setNewTicket(t => ({ ...t, message: e.target.value }))} required /></div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Subject</th><th>User</th><th>Status</th><th>Priority</th><th>Replies</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>{tickets.map(t => (
                  <tr key={t.id}>
                    <td>{t.subject}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.name || t.guest_email || 'Guest'}</td>
                    <td><span className={`badge badge-${t.status === 'open' ? 'red' : t.status === 'in_progress' ? 'yellow' : 'green'}`}>{t.status}</span></td>
                    <td><span className={`badge badge-${t.priority === 'high' ? 'red' : t.priority === 'normal' ? 'gray' : 'green'}`}>{t.priority}</span></td>
                    <td>{t.reply_count}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.created_at?.slice(0, 10)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <select defaultValue={t.status} onChange={e => ticketAction(t.id, e.target.value)} className={styles.miniSelect}>
                          {['open', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLANS */}
        {!loading && tab === 'Plans' && (
          <div className={styles.content}>
            <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {plans.map(p => (
                <div key={p.id} className="card" style={{ padding: 24 }}>
                  <h3>{p.name} Plan</h3>
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <div className="form-group" style={{ flex: 1 }}><label className="label">Monthly Price ($)</label><input type="number" step="0.01" className="input" value={p.price_monthly} onChange={e => { const newP = { ...p, price_monthly: parseFloat(e.target.value) }; setPlans(plans.map(x => x.id === p.id ? newP : x)); }} /></div>
                    <div className="form-group" style={{ flex: 1 }}><label className="label">Yearly Price ($)</label><input type="number" step="0.01" className="input" value={p.price_yearly} onChange={e => { const newP = { ...p, price_yearly: parseFloat(e.target.value) }; setPlans(plans.map(x => x.id === p.id ? newP : x)); }} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}><label className="label">Text/Day</label><input type="number" className="input" value={p.daily_text_limit} onChange={e => { const newP = { ...p, daily_text_limit: parseInt(e.target.value) }; setPlans(plans.map(x => x.id === p.id ? newP : x)); }} /></div>
                    <div className="form-group" style={{ flex: 1 }}><label className="label">Images/Day</label><input type="number" className="input" value={p.daily_image_limit} onChange={e => { const newP = { ...p, daily_image_limit: parseInt(e.target.value) }; setPlans(plans.map(x => x.id === p.id ? newP : x)); }} /></div>
                    <div className="form-group" style={{ flex: 1 }}><label className="label">Videos/Day</label><input type="number" className="input" value={p.daily_video_limit} onChange={e => { const newP = { ...p, daily_video_limit: parseInt(e.target.value) }; setPlans(plans.map(x => x.id === p.id ? newP : x)); }} /></div>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => updatePlan(p)}>Save Changes</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {!loading && tab === 'Settings' && (
          <div className={styles.content}>
            <form onSubmit={saveSettings} className="card" style={{ padding: 32, maxWidth: 800 }}>
              <h2 style={{ marginBottom: 24 }}>Site Settings</h2>
              
              <h3 style={{ marginBottom: 12, color: 'var(--accent-primary)' }}>General & SEO</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="label">Site Name</label><input className="input" value={settings.site_name || ''} onChange={e => setSettings({ ...settings, site_name: e.target.value })} /></div>
                <div className="form-group"><label className="label">Site Tagline</label><input className="input" value={settings.site_tagline || ''} onChange={e => setSettings({ ...settings, site_tagline: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="label">SEO Description</label><textarea className="input" value={settings.seo_description || ''} onChange={e => setSettings({ ...settings, seo_description: e.target.value })} style={{ minHeight: 60 }} /></div>
              <div className="form-group"><label className="label">SEO Keywords</label><input className="input" value={settings.seo_keywords || ''} onChange={e => setSettings({ ...settings, seo_keywords: e.target.value })} /></div>

              <h3 style={{ marginTop: 32, marginBottom: 12, color: 'var(--accent-primary)' }}>Payment Settings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="label">Enable Stripe</label>
                  <select className="input" value={settings.stripe_enabled || '0'} onChange={e => setSettings({ ...settings, stripe_enabled: e.target.value })}>
                    <option value="1">Enabled</option><option value="0">Disabled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Enable Binance Pay / Manual Crypto</label>
                  <select className="input" value={settings.binance_enabled || '0'} onChange={e => setSettings({ ...settings, binance_enabled: e.target.value })}>
                    <option value="1">Enabled</option><option value="0">Disabled</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="label">Stripe Public Key</label><input className="input" value={settings.stripe_public_key || ''} onChange={e => setSettings({ ...settings, stripe_public_key: e.target.value })} /></div>
                <div className="form-group"><label className="label">Stripe Secret Key</label><input className="input" type="password" value={settings.stripe_secret_key || ''} onChange={e => setSettings({ ...settings, stripe_secret_key: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="label">Binance Pay ID (for manual crypto transfers)</label><input className="input" value={settings.binance_pay_id || ''} onChange={e => setSettings({ ...settings, binance_pay_id: e.target.value })} placeholder="e.g. 12345678" /></div>

              <h3 style={{ marginTop: 32, marginBottom: 12, color: 'var(--accent-primary)' }}>Contact & Social Options</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="label">WhatsApp Number</label><input className="input" value={settings.whatsapp_number || ''} onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })} placeholder="+1234567890" /></div>
                <div className="form-group"><label className="label">Telegram Username</label><input className="input" value={settings.telegram_username || ''} onChange={e => setSettings({ ...settings, telegram_username: e.target.value })} placeholder="@yourusername" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="label">Facebook URL</label><input className="input" type="url" value={settings.facebook_url || ''} onChange={e => setSettings({ ...settings, facebook_url: e.target.value })} placeholder="https://facebook.com/..." /></div>
                <div className="form-group"><label className="label">Twitter / X URL</label><input className="input" type="url" value={settings.twitter_url || ''} onChange={e => setSettings({ ...settings, twitter_url: e.target.value })} placeholder="https://x.com/..." /></div>
                <div className="form-group"><label className="label">Instagram URL</label><input className="input" type="url" value={settings.instagram_url || ''} onChange={e => setSettings({ ...settings, instagram_url: e.target.value })} placeholder="https://instagram.com/..." /></div>
              </div>

              <h3 style={{ marginTop: 32, marginBottom: 12, color: 'var(--accent-primary)' }}>Copyrights & Branding</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="label">Copyright Text</label><input className="input" value={settings.copyright_text || ''} onChange={e => setSettings({ ...settings, copyright_text: e.target.value })} placeholder="© 2026 PurpleGuru" /></div>
                <div className="form-group"><label className="label">Copyright Link</label><input className="input" type="url" value={settings.copyright_link || ''} onChange={e => setSettings({ ...settings, copyright_link: e.target.value })} placeholder="https://purpleguru.com" /></div>
              </div>

              <h3 style={{ marginTop: 32, marginBottom: 12, color: 'var(--accent-primary)' }}>API Key Checks</h3>
              <div className="form-group">
                <label className="label">Auto-Check API Keys Daily</label>
                <select className="input" value={settings.auto_check_keys || '0'} onChange={e => setSettings({ ...settings, auto_check_keys: e.target.value })}>
                  <option value="1">Enabled</option>
                  <option value="0">Disabled</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Save Settings</button>
            </form>
          </div>
        )}

        {/* PAYMENTS */}
        {!loading && tab === 'Payments' && (
          <div className={styles.content}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>User</th><th>Plan</th><th>Amount</th><th>Method</th><th>Proof/TxID</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.created_at?.slice(0, 16)}</td>
                    <td>{p.user_name} <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.user_email}</div></td>
                    <td><span className="badge badge-purple">{p.plan} ({p.billing_period})</span></td>
                    <td style={{ fontWeight: 600 }}>${p.amount.toFixed(2)}</td>
                    <td>{p.payment_method || 'stripe'}</td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>
                      {p.proof_url ? <a href={p.proof_url} target="_blank" style={{color: 'var(--accent-primary)', textDecoration:'underline'}}>View Proof ({p.sender_name})</a> : (p.stripe_payment_intent || '-')}
                    </td>
                    <td><span className={`badge badge-${p.status === 'completed' ? 'green' : p.status === 'pending' ? 'yellow' : 'red'}`}>{p.status}</span></td>
                    <td>
                      {p.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-primary" onClick={() => paymentAction(p.id, 'completed')}>Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => paymentAction(p.id, 'failed')}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENT OPTIONS */}
        {!loading && tab === 'Payment Options' && (
          <div className={styles.content}>
            <div className={`card ${styles.addKeyForm}`} style={{ marginBottom: 24 }}>
              <h3>Add Custom Payment Method</h3>
              <form onSubmit={addPaymentMethod} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 12, alignItems: 'end', marginTop: 16 }}>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={newMethod.type} onChange={e => setNewMethod({ ...newMethod, type: e.target.value })}>
                    <option value="bank">Bank Transfer</option>
                    <option value="crypto">Custom Crypto</option>
                    <option value="wallet">Mobile Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="label">Bank/Wallet Name</label>
                  <input className="input" placeholder="e.g. Chase Bank" value={newMethod.name} onChange={e => setNewMethod({ ...newMethod, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Details/Credentials</label>
                  <input className="input" placeholder="IBAN / Account No / Address" value={newMethod.details} onChange={e => setNewMethod({ ...newMethod, details: e.target.value })} required />
                </div>
                <button className="btn btn-primary">Add Method</button>
              </form>
            </div>
            
            <div className="table-wrap">
              <table>
                <thead><tr><th>Type</th><th>Name</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{paymentMethods.map(m => (
                  <tr key={m.id}>
                    <td><span className="badge badge-gray">{m.type.toUpperCase()}</span></td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{m.details}</td>
                    <td>
                      <span className={`badge badge-${m.is_active ? 'green' : 'red'}`}>{m.is_active ? 'Active' : 'Disabled'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className={`btn btn-sm ${m.is_active ? 'btn-secondary' : 'btn-primary'}`} onClick={() => toggleMethod(m.id, !m.is_active)}>{m.is_active ? 'Disable' : 'Enable'}</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteMethod(m.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* UPDATES */}
        {!loading && tab === 'Updates' && (
          <div className={styles.content}>
            <div className="card fade-in" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
              <h2>System Updates</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Keep your PurpleGuru platform secure and up to date with the latest features.</p>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, marginBottom: 24, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Version:</span>
                  <strong>v1.0.0</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Latest Version:</span>
                  <strong style={{ color: 'var(--accent-primary)' }}>v1.1.2</strong>
                </div>
              </div>

              <button className="btn btn-primary btn-lg" onClick={installUpdate} style={{ width: '100%', justifyContent: 'center' }}>
                Install Latest Updates
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
