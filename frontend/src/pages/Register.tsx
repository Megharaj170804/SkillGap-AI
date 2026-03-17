import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const DEPARTMENTS = ['Engineering', 'Data Science', 'Design', 'Marketing', 'Product', 'Operations'];
const ROLES = ['admin', 'manager', 'employee'];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess('Registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.15) 0%, transparent 60%), var(--bg-dark)',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.3rem' }}>
            <span className="gradient-text">Create Account</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Join the SkillGap Platform</p>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            {[
              { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
              { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            ].map((field) => (
              <div key={field.name} style={{ marginBottom: '1rem' }}>
                <label className="form-label">{field.label}</label>
                <input
                  id={`register-${field.name}`}
                  type={field.type}
                  name={field.name}
                  className="form-input"
                  placeholder={field.placeholder}
                  value={(form as any)[field.name]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Role</label>
              <select name="role" className="form-input" value={form.role} onChange={handleChange} id="register-role">
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Department</label>
              <select name="department" className="form-input" value={form.department} onChange={handleChange} id="register-dept">
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
            )}
            {success && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>{success}</div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading} id="register-submit">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
