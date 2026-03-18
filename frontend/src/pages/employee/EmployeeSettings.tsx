import React, { useState } from 'react';
import { motion } from 'framer-motion';

const EmployeeSettings: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('Profile');
  const sections = ['Profile', 'Notifications', 'Privacy', 'Account'];

  const Toggle = ({ label, defaultChecked = true }: { label: string; defaultChecked?: boolean }) => {
    const [on, setOn] = useState(defaultChecked);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{label}</span>
        <div onClick={() => setOn(!on)} style={{ width: 44, height: 22, borderRadius: 22, background: on ? '#6366f1' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My <span className="gradient-text">Settings</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Manage your personal preferences and account.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem', alignItems: 'start' }}>
        <div className="glass-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{ background: activeSection === s ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: activeSection === s ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent', color: activeSection === s ? '#a5b4fc' : '#94a3b8', padding: '0.65rem 1rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: activeSection === s ? 700 : 500, fontSize: '0.875rem', transition: 'all 0.2s' }}>
              {s}
            </button>
          ))}
        </div>

        <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '2rem' }}>
          {activeSection === 'Profile' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontWeight: 700, color: '#f1f5f9' }}>Profile Settings</h2>
              {[['Full Name', 'Your full name'], ['Email', 'your@email.com'], ['Current Role', 'e.g. Frontend Developer'], ['Target Role', 'e.g. Senior Engineer'], ['Department', 'e.g. Engineering']].map(([label, placeholder]) => (
                <div key={label} style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>{label.toUpperCase()}</label>
                  <input type="text" placeholder={placeholder} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </>
          )}
          {activeSection === 'Notifications' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontWeight: 700, color: '#f1f5f9' }}>Notification Preferences</h2>
              <Toggle label="Email me when my learning path updates" />
              <Toggle label="Reminders when I haven't logged in for 3 days" />
              <Toggle label="Weekly readiness score digest" />
              <Toggle label="Notify me about new achievements I'm close to" />
              <Toggle label="Team updates from my manager" defaultChecked={false} />
            </>
          )}
          {activeSection === 'Privacy' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontWeight: 700, color: '#f1f5f9' }}>Privacy Settings</h2>
              <Toggle label="Allow my manager to see my readiness score" />
              <Toggle label="Show my profile in team skill coverage reports" />
              <Toggle label="Allow AI analysis of my skill data" />
              <Toggle label="Share anonymized data for platform improvement" defaultChecked={false} />
            </>
          )}
          {activeSection === 'Account' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontWeight: 700, color: '#f1f5f9' }}>Account</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>CURRENT PASSWORD</label>
                <input type="password" placeholder="••••••••" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>NEW PASSWORD</label>
                <input type="password" placeholder="••••••••" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                <h4 style={{ color: '#fca5a5', margin: '0 0 0.5rem 0' }}>Danger Zone</h4>
                <button style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Request Account Deletion</button>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button className="btn-secondary">Discard</button>
            <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }} className="btn-primary" style={{ minWidth: 130 }}>
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeSettings;
