import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AdminSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('General');
  const [saved, setSaved] = useState(false);

  const sections = ['General', 'Notifications', 'AI Configuration', 'User Management', 'Security'];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ label, defaultChecked = true }: { label: string; defaultChecked?: boolean }) => {
    const [on, setOn] = useState(defaultChecked);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{label}</span>
        <div onClick={() => setOn(!on)} style={{ width: 46, height: 24, borderRadius: 24, background: on ? '#6366f1' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
        </div>
      </div>
    );
  };

  const TextSetting = ({ label, placeholder, defaultValue }: any) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>{label}</label>
      <input type="text" defaultValue={defaultValue} placeholder={placeholder} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Platform <span className="gradient-text">Settings</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Configure the SkillGap Platform.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Sidebar Nav */}
        <div className="glass-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{ background: activeSection === s ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: activeSection === s ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent', color: activeSection === s ? '#a5b4fc' : '#94a3b8', padding: '0.7rem 1rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: activeSection === s ? 700 : 500, fontSize: '0.9rem', transition: 'all 0.2s' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '2rem' }}>
          {activeSection === 'General' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>General Settings</h2>
              <TextSetting label="COMPANY NAME" defaultValue="Tekdi Technologies Pvt. Ltd." />
              <TextSetting label="PLATFORM URL" defaultValue="https://skillgap.tekdi.com" />
              <TextSetting label="SUPPORT EMAIL" defaultValue="sales@tekdi.net" />
              <Toggle label="Allow employees to self-register" defaultChecked={false} />
              <Toggle label="Show readiness scores to employees" />
              <Toggle label="Enable public learning library" defaultChecked={false} />
            </>
          )}
          {activeSection === 'Notifications' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>Notification Preferences</h2>
              <Toggle label="Email digest for managers (weekly)" />
              <Toggle label="Nudge emails for inactive employees (7+ days)" />
              <Toggle label="Alert admins when critical gaps appear" />
              <Toggle label="Notify on completed learning paths" />
              <Toggle label="Slack integration for alerts" defaultChecked={false} />
            </>
          )}
          {activeSection === 'AI Configuration' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>AI Configuration</h2>
              <TextSetting label="GEMINI API KEY" defaultValue="•••••••••••••••••••••••••••" />
              <TextSetting label="AI PROVIDER MODEL" defaultValue="gemini-1.5-pro" />
              <TextSetting label="MAX TOKENS PER REQUEST" defaultValue="2048" />
              <Toggle label="Enable AI-powered learning path generation" />
              <Toggle label="Enable career advice module" />
              <Toggle label="Enable team insights generation" />
              <Toggle label="Log all AI requests for audit" defaultChecked={false} />
            </>
          )}
          {activeSection === 'User Management' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>User Management</h2>
              {[['admin@company.com', 'Admin', 'Active'], ['manager@company.com', 'Manager', 'Active'], ['hr@company.com', 'Admin', 'Inactive']].map(([email, role, status]) => (
                <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>{email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{role}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: status === 'Active' ? '#10b981' : '#64748b' }}>● {status}</span>
                    <button style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Manage</button>
                  </div>
                </div>
              ))}
              <button className="btn-secondary" style={{ marginTop: '1.25rem', fontSize: '0.85rem' }}>+ Invite Admin User</button>
            </>
          )}
          {activeSection === 'Security' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>Security Settings</h2>
              <Toggle label="Require 2FA for admin accounts" defaultChecked={false} />
              <Toggle label="Auto-logout inactive sessions (30 min)" />
              <Toggle label="Restrict login to company domain only" defaultChecked={false} />
              <Toggle label="Enable audit log" />
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                <h4 style={{ color: '#fca5a5', margin: '0 0 0.5rem 0' }}>Danger Zone</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>These actions are irreversible. Proceed with caution.</p>
                <button style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>🗑️ Reset All Employee Data</button>
              </div>
            </>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn-secondary">Discard Changes</button>
            <button onClick={handleSave} className="btn-primary" style={{ minWidth: 120 }}>
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSettings;
