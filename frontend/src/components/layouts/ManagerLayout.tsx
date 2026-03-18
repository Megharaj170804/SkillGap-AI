import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Navbar from '../Navbar';

const ManagerLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ width: '250px', borderRight: '1px solid rgba(99, 102, 241, 0.2)', padding: '1rem', background: 'rgba(15, 15, 26, 0.5)', overflowY: 'auto', flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <NavLink to="/manager/overview" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>🏠 My Team Overview</NavLink>
            <NavLink to="/manager/skill-coverage" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>📊 Team Skill Coverage</NavLink>
            <NavLink to="/manager/ai-insights" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>🤖 AI Team Insights</NavLink>
            <NavLink to="/manager/project-planner" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>🎯 Project Skill Planner</NavLink>
            <NavLink to="/manager/progress-tracker" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>📈 Team Progress</NavLink>
            <NavLink to="/manager/alerts" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>🔔 Alerts & Notifications</NavLink>
            <NavLink to="/manager/reports" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>📋 My Reports</NavLink>
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
          background: rgba(99, 102, 241, 0.1);
          color: #f1f5f9;
        }
        .nav-item.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
          color: #f1f5f9;
          border-left: 3px solid #6366f1;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
      `}</style>
    </div>
  );
};

export default ManagerLayout;
