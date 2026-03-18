import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import { connectSocket, disconnectSocket } from '../hooks/useSocket';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (isAuthenticated) {
      const empId = (user as any)?.employeeRef;
      const dept = user?.department;
      connectSocket(empId, dept);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  // Determine primary dashboard link based on role
  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin/overview';
    if (user?.role === 'manager') return '/manager/overview';
    return '/dashboard'; // default employee dashboard
  };

  return (
    <nav style={{
      background: 'rgba(15, 15, 26, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 1rem',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', gap: '1rem' }}>
        
        {/* Mobile Menu Toggle (Visible only on small screens via CSS) */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          style={{ background: 'transparent', border: 'none', color: '#f1f5f9', fontSize: '1.5rem', cursor: 'pointer', display: 'none' }}>
          ☰
        </button>

        {/* Logo */}
        <Link to={getDashboardLink()} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 800, color: 'white',
          }}>S</div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9' }} className="hide-on-mobile">SkillGap</span>
          <span style={{ fontWeight: 300, fontSize: '1.1rem', color: '#6366f1' }} className="hide-on-mobile">Platform</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {user?.role === 'employee' && (
            <>
              <NavLink to="/dashboard">My Dashboard</NavLink>
              <NavLink to="/profile">My Profile</NavLink>
              <NavLink to="/project-mapper">Project Mapper</NavLink>
            </>
          )}
          {user?.role === 'admin' && (
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Admin Workspace Active</span>
          )}
          {user?.role === 'manager' && (
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Manager Workspace Active</span>
          )}
        </div>

        {/* Right area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <GlobalSearch />
          
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode((d) => !d)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '1rem', color: '#e2e8f0' }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <NotificationBell />

          <div style={{ textAlign: 'right', display: 'none' }} className="user-info-desktop">
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>{user?.name}</p>
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

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {user?.role === 'employee' && (
            <>
              <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)}>My Dashboard</NavLink>
              <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>My Profile</NavLink>
              <NavLink to="/project-mapper" onClick={() => setMobileMenuOpen(false)}>Project Mapper</NavLink>
            </>
          )}
          {user?.role === 'admin' && (
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0.5rem' }}>Use sidebar for Admin Navigation</span>
          )}
          {user?.role === 'manager' && (
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0.5rem' }}>Use sidebar for Manager Navigation</span>
          )}
        </div>
      )}

      {/* Embedded CSS for Responsiveness */}
      <style>{`
        @media (max-width: 850px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (max-width: 500px) {
          .hide-on-mobile { display: none !important; }
        }
        @media (min-width: 768px) {
          .user-info-desktop { display: block !important; }
        }
      `}</style>
    </nav>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void }> = ({ to, children, onClick }) => (
  <Link to={to} onClick={onClick} style={{
    color: '#94a3b8', textDecoration: 'none', padding: '0.4rem 0.75rem',
    borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500,
    transition: 'all 0.2s', display: 'block'
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
