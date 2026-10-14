import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Lock,
  LogOut,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('salt-pepper-token'));
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      void loadCurrentUser();
    } else {
      delete api.defaults.headers.common.Authorization;
      setUser(null);
    }
  }, [token]);

  const loadCurrentUser = async () => {
    setLoadingUser(true);
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user as User);
    } catch {
      localStorage.removeItem('salt-pepper-token');
      setToken(null);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('salt-pepper-token');
    setToken(null);
    setUser(null);
    void api.post('/auth/logout');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage setToken={setToken} />} />
        <Route
          path="*"
          element={
            <ProtectedRoutes user={user} token={token} loadingUser={loadingUser} onLogout={handleLogout} />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoutes({
  user,
  token,
  loadingUser,
  onLogout,
}: {
  user: User | null;
  token: string | null;
  loadingUser: boolean;
  onLogout: () => void;
}) {
  const location = useLocation();

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (loadingUser && !user) {
    return <div className="page-shell centered"><div className="loader" />Loading secure session...</div>;
  }

  if (location.pathname === '/admin' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/dashboard" element={<DashboardHome user={user} />} />
        <Route path="/admin" element={<AdminDashboard user={user} />} />
        <Route path="/database" element={<DatabaseExplorer />} />
        <Route path="/lab" element={<HashingLaboratory />} />
        <Route path="/architecture" element={<SecurityArchitecture />} />
        <Route path="/report" element={<ExperimentReport />} />
        <Route path="/settings" element={<SettingsPage user={user} onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function DashboardLayout({
  children,
  user,
  onLogout,
}: {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}) {
  const navLinks = [
    { label: 'Overview', to: '/dashboard' },
    { label: 'Database Explorer', to: '/database' },
    { label: 'Hashing Laboratory', to: '/lab' },
    { label: 'Security Architecture', to: '/architecture' },
    { label: 'Experiment Report', to: '/report' },
    { label: 'Settings', to: '/settings' },
    ...(user?.role === 'admin' ? [{ label: 'Admin', to: '/admin' }] : []),
  ];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">S&amp;P</div>
          <div>
            <strong>Salt &amp; Pepper</strong>
            <small>{user?.role === 'admin' ? 'Administrator' : 'Authenticated user'}</small>
          </div>
        </div>

        <nav className="nav-menu">
          {navLinks.map((item) => (
            <Link key={item.to} to={item.to} className="nav-item">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="side-card">
          <span>Signed in as</span>
          <strong>{user?.name || 'User'}</strong>
          <small>{user?.email || 'No email available'}</small>
          <button type="button" className="button button-secondary small" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="workspace">{children}</main>
    </div>
  );
}

function LandingPage() {
  const featureCards = [
    { title: 'Unique Salt', icon: KeyRound, text: 'Every password gets a fresh cryptographic salt.' },
    { title: 'Secret Pepper', icon: Lock, text: 'The server keeps a confidential pepper outside the database.' },
    { title: 'Secure Hashing', icon: ShieldCheck, text: 'bcrypt prevents efficient offline cracking.' },
    { title: 'Protected Database', icon: Database, text: 'MongoDB stores only the hash and salt metadata.' },
  ];

  return (
    <div className="landing-page">
      <header className="topbar">
        <div className="brand-inline">
          <ShieldCheck size={20} />
          <span>Salt &amp; Pepper Security</span>
        </div>
        <div className="top-links">
          <Link to="/auth?mode=login">Login</Link>
          <Link to="/auth?mode=register" className="button button-primary">Get Started</Link>
        </div>
      </header>

      <main className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Cybersecurity Experiment</span>
          <h1>Salt &amp; Pepper Password Security</h1>
          <p>Understand how unique salts and server-side secret peppers strengthen password storage.</p>

          <div className="hero-actions">
            <Link to="/auth?mode=register" className="button button-primary">Get Started <ArrowRight size={18} /></Link>
            <Link to="/auth?mode=login" className="button button-secondary">Login</Link>
          </div>

          <div className="hero-metrics">
            <div><strong>bcrypt</strong><span>Strong hashing</span></div>
            <div><strong>HMAC</strong><span>Secret pepper</span></div>
            <div><strong>MongoDB</strong><span>Database storage</span></div>
          </div>
        </div>

        <div className="architecture-card">
          <div className="mini-panel"><span>Client</span><strong>User input</strong></div>
          <div className="flow-line" />
          <div className="mini-panel accent"><span>Backend</span><strong>Hash + pepper</strong></div>
          <div className="flow-line" />
          <div className="mini-panel success"><span>Database</span><strong>Safe storage</strong></div>
        </div>
      </main>

      <section className="features-grid">
        {featureCards.map(({ title, icon: Icon, text }) => (
          <div key={title} className="feature-card">
            <Icon size={22} />
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>

      <section className="info-section">
        <div>
          <h2>How authentication works</h2>
          <p>
            Passwords are never stored in plaintext. The backend applies a unique salt, a secret pepper, and a secure bcrypt hash before saving only the verification metadata.
          </p>
        </div>
        <div className="check-list">
          <div><ShieldCheck size={16} /> Salted hash</div>
          <div><ShieldCheck size={16} /> Hidden pepper</div>
          <div><ShieldCheck size={16} /> Secure verification</div>
        </div>
      </section>

      <footer className="footer">Educational cybersecurity experiment: Salt &amp; Pepper Password Protection</footer>
    </div>
  );
}

function AuthPage({ setToken }: { setToken: (token: string | null) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>(new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const nextMode = new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login';
    setMode(nextMode);
  }, [location.search]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const payload = mode === 'register'
        ? { name: form.name, email: form.email, password: form.password, confirmPassword: form.confirmPassword }
        : { email: form.email, password: form.password };

      const response = await api.post(endpoint, payload);
      if (response.data.token) {
        localStorage.setItem('salt-pepper-token', response.data.token);
        setToken(response.data.token);
      }

      if (mode === 'register') {
        setSuccess('Account created. Redirecting to login...');
        navigate('/auth?mode=login');
      } else {
        setSuccess(response.data.message || 'Login successful.');
        navigate('/dashboard');
      }
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to process request.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = useMemo(() => {
    if (!form.password) return 'No password';
    if (form.password.length >= 12 && /[A-Z]/.test(form.password) && /\d/.test(form.password)) return 'Strong';
    if (form.password.length >= 8) return 'Medium';
    return 'Weak';
  }, [form.password]);

  return (
    <div className="page-shell auth-shell">
      <div className="auth-panel">
        <div className="auth-header">
          <div className="badge-icon"><ShieldCheck size={18} /></div>
          <h2>{mode === 'register' ? 'Create account' : 'Welcome back'}</h2>
        </div>

        <div className="auth-toggle">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => navigate('/auth?mode=login')}>Login</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => navigate('/auth?mode=register')}>Register</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Full name
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Jane Doe" required />
            </label>
          )}

          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="name@example.com" required />
          </label>

          <label>
            Password
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="••••••••" required />
              <button type="button" className="icon-button" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {mode === 'register' && (
            <label>
              Confirm password
              <input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} placeholder="Repeat password" required />
            </label>
          )}

          {mode === 'register' && (
            <div className="password-strength">
              <span>Password strength</span>
              <strong className={passwordStrength.toLowerCase()}>{passwordStrength}</strong>
            </div>
          )}

          {error && <div className="notice error">{error}</div>}
          {success && <div className="notice success">{success}</div>}

          <button type="submit" className="button button-primary full" disabled={loading}>
            {loading ? 'Processing...' : mode === 'register' ? 'Create account' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' ? 'Need an account?' : 'Already registered?'}{' '}
          <Link to={mode === 'login' ? '/auth?mode=register' : '/auth?mode=login'}>Go here</Link>
        </div>
      </div>
    </div>
  );
}

function DashboardHome({ user }: { user?: User | null }) {
  const [stats, setStats] = useState({ totalUsers: 0, adminCount: 0, userCount: 0, authStatus: 'Checking' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await api.get('/admin/overview');
        setStats(response.data);
      } catch {
        setStats({ totalUsers: 0, adminCount: 0, userCount: 0, authStatus: 'Unavailable' });
      } finally {
        setLoading(false);
      }
    };

    void loadOverview();
  }, []);

  return (
    <div className="content-panel">
      <div className="page-heading">
        <div>
          <p className="section-kicker">Overview</p>
          <h1>Security summary</h1>
        </div>
        <div className="status-chip success">{loading ? 'Loading' : stats.authStatus}</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><Users size={22} /><span>Total users</span><strong>{stats.totalUsers}</strong></div>
        <div className="stat-card"><UserCog size={22} /><span>Admins</span><strong>{stats.adminCount}</strong></div>
        <div className="stat-card"><Shield size={22} /><span>Users</span><strong>{stats.userCount}</strong></div>
        <div className="stat-card"><Activity size={22} /><span>Auth</span><strong>{stats.authStatus}</strong></div>
      </div>

      <div className="two-column">
        <div className="card">
          <h3>Quick navigation</h3>
          <div className="link-grid">
            <Link to="/database">Database Explorer</Link>
            <Link to="/lab">Hashing Laboratory</Link>
            <Link to="/architecture">Security Architecture</Link>
            <Link to="/report">Experiment Report</Link>
          </div>
        </div>
        <div className="card">
          <h3>Authenticated identity</h3>
          <p>{user?.name || 'User'}</p>
          <p>{user?.email || 'Not available'}</p>
          <p>Role: {user?.role || 'user'}</p>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ user }: { user?: User | null }) {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get('/admin/overview');
        setOverview(response.data);
      } catch {
        setOverview({ totalUsers: 0, adminCount: 0, userCount: 0, securityModel: 'bcrypt' });
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  if (loading) {
    return <div className="page-shell centered"><div className="loader" />Loading admin dashboard...</div>;
  }

  return (
    <div className="content-panel">
      <div className="page-heading">
        <div>
          <p className="section-kicker">Administrator</p>
          <h1>Secure control panel</h1>
        </div>
        <div className="status-chip warning">{user?.role === 'admin' ? 'Authorized' : 'Restricted'}</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><BarChart3 size={22} /><span>Total users</span><strong>{overview?.totalUsers ?? 0}</strong></div>
        <div className="stat-card"><ShieldCheck size={22} /><span>Admins</span><strong>{overview?.adminCount ?? 0}</strong></div>
        <div className="stat-card"><Users size={22} /><span>Regular users</span><strong>{overview?.userCount ?? 0}</strong></div>
        <div className="stat-card"><FlaskConical size={22} /><span>Hashing scheme</span><strong>{overview?.securityModel ?? 'bcrypt'}</strong></div>
      </div>

      <div className="card">
        <h3>Protected resources</h3>
        <div className="link-grid">
          <Link to="/database">Database Explorer</Link>
          <Link to="/lab">Hashing Laboratory</Link>
          <Link to="/architecture">Security Architecture</Link>
        </div>
      </div>
    </div>
  );
}

function DatabaseExplorer() {
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setRows(response.data.users ?? []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, []);

  return (
    <div className="content-panel">
      <div className="page-heading">
        <div>
          <p className="section-kicker">Database Explorer</p>
          <h1>MongoDB user records</h1>
        </div>
        <button className="button button-secondary" type="button" onClick={() => setReveal((prev) => !prev)}>
          {reveal ? 'Hide hashes' : 'Reveal hash and salt'}
        </button>
      </div>

      {loading ? (
        <div className="page-shell centered"><div className="loader" />Loading database...</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>{reveal ? 'Hash / Salt' : 'Hash'}</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5}>No users found.</td></tr>
              ) : rows.map((row) => (
                <tr key={String(row.id || row.email)}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.role}</td>
                  <td>
                    {reveal ? (
                      <div className="hash-cell">
                        <span>{row.passwordHash || 'n/a'}</span>
                        <small>{row.passwordSalt || 'salt unavailable'}</small>
                      </div>
                    ) : (
                      <span>{row.passwordHash ? '**************' : '—'}</span>
                    )}
                  </td>
                  <td>{row.passwordVersion || 'bcrypt-hmac-sha256-v1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HashingLaboratory() {
  const [sample, setSample] = useState('Password123!');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDemo = async () => {
    setLoading(true);
    try {
      const response = await api.post('/lab/hash-demo', { password: sample });
      setResult(response.data.result);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-panel">
      <div className="page-heading">
        <div>
          <p className="section-kicker">Hashing Laboratory</p>
          <h1>Salt and pepper demonstration</h1>
        </div>
      </div>

      <div className="card lab-panel">
        <label>
          Sample password
          <input value={sample} onChange={(e) => setSample(e.target.value)} />
        </label>
        <button type="button" className="button button-primary" onClick={runDemo} disabled={loading}>
          {loading ? 'Generating...' : 'Generate comparison'}
        </button>
      </div>

      {result && (
        <div className="demo-grid">
          <div className="card demo-box"><h3>Plaintext</h3><code>{result.samplePassword}</code></div>
          <div className="card demo-box"><h3>Salt-only hash</h3><code>{String(result.saltOnlyHash)}</code></div>
          <div className="card demo-box"><h3>Peppered hash</h3><code>{String(result.pepperedHash)}</code></div>
          <div className="card demo-box">
            <h3>Metadata</h3>
            <p>Salt: {String(result.generatedSalt)}</p>
            <p>Version: {String(result.passwordVersion)}</p>
            <p>Pepper stored in database: {String(result.pepperStored)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityArchitecture() {
  const steps = [
    'User enters password',
    'Backend receives HTTPS request',
    'Server obtains secret pepper from environment',
    'Unique cryptographic salt is generated',
    'HMAC-SHA256 and bcrypt create the stored hash',
    'MongoDB stores the hash and metadata',
  ];

  return (
    <div className="content-panel">
      <div className="page-heading">
        <div>
          <p className="section-kicker">Security Architecture</p>
          <h1>Registration and verification flow</h1>
        </div>
      </div>

      <div className="architecture-steps">
        {steps.map((step, index) => (
          <div key={step} className="step-item">
            <span>{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Important distinction</h3>
        <p>A salt is not a secret. A pepper must stay outside the database to add another protection layer if a database is compromised.</p>
      </div>
    </div>
  );
}

function ExperimentReport() {
  const reportSections = [
    ['Aim', 'Demonstrate secure password protection using unique salts and a server-side pepper.'],
    ['Theory', 'Plaintext and weak hashing are unsafe because attackers can reuse cracked values. Salts break deterministic matches.'],
    ['Algorithm', 'The app combines HMAC-SHA256 with a pepper and then applies bcrypt for verification-friendly storage.'],
    ['Result', 'The database stores only salted hashes and version metadata, reducing the impact of a breach.'],
  ];

  return (
    <div className="content-panel">
      <div className="page-heading">
        <div>
          <p className="section-kicker">Experiment Report</p>
          <h1>Result and observations</h1>
        </div>
      </div>

      <div className="report-grid">
        {reportSections.map(([title, content]) => (
          <div key={String(title)} className="card report-item">
            <h3>{String(title)}</h3>
            <p>{String(content)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage({ user, onLogout }: { user?: User | null; onLogout?: () => void }) {
  return (
    <div className="content-panel">
      <div className="page-heading">
        <div>
          <p className="section-kicker">Settings</p>
          <h1>Account details</h1>
        </div>
      </div>

      <div className="card settings-card">
        <p><strong>Name:</strong> {user?.name || 'Not available'}</p>
        <p><strong>Email:</strong> {user?.email || 'Not available'}</p>
        <p><strong>Role:</strong> {user?.role || 'user'}</p>
        <button type="button" className="button button-primary" onClick={onLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}

export default App;
