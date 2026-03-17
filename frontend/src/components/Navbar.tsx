import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav style={{
      background: 'rgba(15, 15, 26, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 2rem',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 800, color: 'white',
          }}>S</div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9' }}>SkillGap</span>
          <span style={{ fontWeight: 300, fontSize: '1.1rem', color: '#6366f1' }}>Platform</span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <NavLink to="/dashboard">Dashboard</NavLink>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <NavLink to="/employees">Employees</NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/employees/add">Add Employee</NavLink>
          )}
          {user?.role === 'employee' && (
            <NavLink to="/profile">My Profile</NavLink>
          )}
        </div>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{user?.name}</p>
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '0.1rem 0.5rem',
              borderRadius: '20px', border: '1px solid',
              ...parseBadgeStyle(user?.role || ''),
            }}>{user?.role?.toUpperCase()}</span>
          </div>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} style={{
    color: '#94a3b8', textDecoration: 'none', padding: '0.4rem 0.75rem',
    borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500,
    transition: 'all 0.2s',
  }}
  onMouseEnter={(e) => {
    (e.target as HTMLElement).style.color = '#f1f5f9';
    (e.target as HTMLElement).style.background = 'rgba(99, 102, 241, 0.1)';
  }}
  onMouseLeave={(e) => {
    (e.target as HTMLElement).style.color = '#94a3b8';
    (e.target as HTMLElement).style.background = 'transparent';
  }}>
    {children}
  </Link>
);

const parseBadgeStyle = (role: string) => {
  const map: Record<string, React.CSSProperties> = {
    admin: { color: '#c4b5fd', backgroundColor: 'rgba(167, 139, 250, 0.1)', borderColor: 'rgba(167, 139, 250, 0.3)' },
    manager: { color: '#67e8f9', backgroundColor: 'rgba(103, 232, 249, 0.1)', borderColor: 'rgba(103, 232, 249, 0.3)' },
    employee: { color: '#6ee7b7', backgroundColor: 'rgba(110, 231, 183, 0.1)', borderColor: 'rgba(110, 231, 183, 0.3)' },
  };
  return map[role] || {};
};

export default Navbar;
