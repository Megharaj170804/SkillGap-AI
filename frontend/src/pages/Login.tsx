import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Get user from localStorage to redirect by role
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (user?.role === 'admin') navigate('/admin/overview');
      else if (user?.role === 'manager') navigate('/manager/overview');
      else navigate('/employee/overview');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(139,92,246,0.1) 0%, transparent 60%), var(--bg-dark)',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '16px', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: 'white',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>S</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.3rem' }}>
            <span className="gradient-text">SkillGap</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Email address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '10px',
                fontSize: '0.85rem', marginBottom: '1rem',
              }}>{error}</div>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading} id="login-submit">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
          </div>
        </div>

        {/* Quick credentials hint */}
        <div className="glass-card" style={{ padding: '1rem', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Test Logins</p>
          {[
            { label: 'Admin', email: 'admin@skillgap.com', pwd: 'admin123' },
            { label: 'Manager', email: 'manager@skillgap.com', pwd: 'manager123' },
            { label: 'Employee', email: 'rahul@skillgap.com', pwd: 'emp123' },
          ].map((cred) => (
            <button key={cred.label} onClick={() => { setEmail(cred.email); setPassword(cred.pwd); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '8px', padding: '0.4rem 0.75rem', marginBottom: '0.3rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.8rem', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
            >
              <span style={{ color: '#6366f1', fontWeight: 600 }}>{cred.label}</span> — {cred.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
