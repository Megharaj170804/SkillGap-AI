import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const getDashboardRoute = (role: string) => {
  const routes: Record<string, string> = {
    admin: '/admin/overview',
    manager: '/manager/overview',
    employee: '/employee/overview',
  };
  return routes[role] || '/';
};

interface Credential {
  label: string;
  icon: string;
  email: string;
  password: string;
  color: string;
}

const credentials: Credential[] = [
  { label: 'Admin', icon: '👑', email: 'admin@skillgap.com', password: 'admin123', color: '#6d28d9' },
  { label: 'Manager', icon: '👔', email: 'manager@skillgap.com', password: 'manager123', color: '#0891b2' },
  { label: 'Employee', icon: '🎓', email: 'rahul@skillgap.com', password: 'emp123', color: '#059669' },
];

const DemoWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [loadingFor, setLoadingFor] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (cred: Credential) => {
    setLoadingFor(cred.label);
    try {
      const res = await api.post('/auth/login', { email: cred.email, password: cred.password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      await login(cred.email, cred.password);
      navigate(getDashboardRoute(user.role), { replace: true });
    } catch (err) {
      // Fallback: prefill login page via sessionStorage
      sessionStorage.setItem('demoEmail', cred.email);
      sessionStorage.setItem('demoPassword', cred.password);
      navigate('/login');
    } finally {
      setLoadingFor(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', left: '1.5rem',
      zIndex: 9000, fontFamily: "'Inter', sans-serif",
    }}>
      {/* Expanded widget */}
      {open && (
        <div style={{
          marginBottom: '0.75rem',
          background: 'rgba(10,10,26,0.97)',
          border: '1px solid rgba(109,40,217,0.4)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(109,40,217,0.2)',
          width: '280px',
          backdropFilter: 'blur(20px)',
          animation: 'widgetSlideUp 0.25s ease',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(109,40,217,0.3), rgba(6,182,212,0.2))',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid rgba(109,40,217,0.2)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span>🔑</span>
            <span style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.9rem' }}>Quick Demo Access</span>
            <button onClick={() => setOpen(false)} style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: '#6b7280', cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
            }}>✕</button>
          </div>

          {credentials.map((cred, i) => (
            <div key={cred.label} style={{
              padding: '0.9rem 1rem',
              borderBottom: i < credentials.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span>{cred.icon}</span>
                <span style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.875rem' }}>{cred.label}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.1rem' }}>{cred.email}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.6rem' }}>
                Password: <span style={{ color: '#9ca3af' }}>{cred.password}</span>
              </div>
              <button
                onClick={() => handleQuickLogin(cred)}
                disabled={loadingFor !== null}
                style={{
                  width: '100%', padding: '0.45rem 0.75rem',
                  background: loadingFor === cred.label
                    ? 'rgba(109,40,217,0.3)'
                    : `linear-gradient(135deg, ${cred.color}cc, ${cred.color}88)`,
                  border: `1px solid ${cred.color}66`,
                  borderRadius: '8px', color: 'white',
                  fontWeight: 600, fontSize: '0.8rem',
                  cursor: loadingFor !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
              >
                {loadingFor === cred.label ? 'Logging in...' : `Login as ${cred.label}`}
              </button>
            </div>
          ))}

          <div style={{
            padding: '0.6rem 1rem',
            fontSize: '0.7rem', color: '#4b5563', textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            Demo credentials for testing only
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.65rem 1.1rem',
          background: open
            ? 'rgba(10,10,26,0.95)'
            : 'linear-gradient(135deg, #6d28d9, #06b6d4)',
          border: '1px solid rgba(109,40,217,0.4)',
          borderRadius: '12px', color: 'white',
          cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
          fontFamily: 'inherit',
          boxShadow: '0 4px 20px rgba(109,40,217,0.35)',
          transition: 'all 0.2s',
        }}
      >
        <span>🔑</span>
        {open ? 'Close' : 'Demo Login'}
      </button>

      <style>{`
        @keyframes widgetSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DemoWidget;
