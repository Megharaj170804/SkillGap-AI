import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem', marginBottom: '1.5rem',
        animation: 'pulse 2s infinite',
      }}>🚫</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fca5a5', marginBottom: '0.5rem' }}>403 — Access Denied</h1>
      <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '2rem' }}>
        You don't have permission to view this page.<br />
        Your role <strong style={{ color: '#6366f1' }}>{user?.role}</strong> is not authorized here.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn-primary" onClick={() => navigate(-1)} id="unauthorized-back">Go Back</button>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')} id="unauthorized-dashboard">Dashboard</button>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
    </div>
  );
};

export default Unauthorized;
