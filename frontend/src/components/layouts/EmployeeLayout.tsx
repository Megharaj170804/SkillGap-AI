import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Navbar';

const EmployeeLayout: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/employee/overview', label: '🏠 My Overview' },
    { to: '/employee/skills', label: '🎯 My Skills' },
    { to: '/employee/learning', label: '📚 Learning Paths' },
    { to: '/employee/career', label: '🚀 Career Advisor' },
    { to: '/employee/achievements', label: '🏆 Achievements' },
    { to: '/employee/project-mapper', label: '🗺️ Project Mapper' },
    { to: '/employee/settings', label: '⚙️ My Settings' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar — identical structure to AdminLayout */}
        <aside style={{ width: '250px', borderRight: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', background: 'rgba(15, 15, 26, 0.5)', overflowY: 'auto', flexShrink: 0 }}>
          {/* Employee badge */}
          <div style={{ padding: '0.75rem 1rem', marginBottom: '0.5rem', background: 'rgba(16, 185, 129, 0.07)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: '0.9rem', flexShrink: 0 }}>
              {user?.name?.[0] || 'E'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.82rem', lineHeight: 1.2 }}>{user?.name}</div>
              <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600, marginTop: 2 }}>Employee</div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-dark)' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .nav-item {
          padding: 0.75rem 1rem;
          color: #94a3b8;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
          display: block;
          font-weight: 500;
          font-size: 0.9rem;
        }
        .nav-item:hover {
          background: rgba(16, 185, 129, 0.08);
          color: #f1f5f9;
        }
        .nav-item.active {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15));
          color: #f1f5f9;
          border-left: 3px solid #10b981;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
      `}</style>
    </div>
  );
};

export default EmployeeLayout;
