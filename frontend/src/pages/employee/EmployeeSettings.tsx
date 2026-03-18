import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EmployeeSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('Profile');
  const sections = ['Profile', 'Notifications', 'Privacy', 'Account'];
  const [loading, setLoading] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({ name: '', currentRole: '', targetRole: '', department: '', weeklyGoalHours: 5 });
  // Prefs State
  const [prefs, setPrefs] = useState({ emailAlerts: true, pushNotifications: true, weeklyDigest: true });
  // Auth State
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/employee/my-stats');
      const emp = res.data;
      setProfile({ name: emp.name || '', currentRole: emp.currentRole || '', targetRole: emp.targetRole || '', department: emp.department || '', weeklyGoalHours: emp.weeklyGoalHours || 5 });
      if (emp.notificationPrefs) {
        setPrefs(emp.notificationPrefs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await api.put('/employee/update-profile', profile);
      await api.put('/employee/set-weekly-hours', { hours: profile.weeklyGoalHours });
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    }
    setLoading(false);
  };

  const handleSavePrefs = async () => {
    setLoading(true);
    try {
      await api.put('/employee/notification-prefs', prefs);
      toast.success('Preferences saved');
    } catch (err) {
      toast.error('Failed to save preferences');
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error('Please fill passwords');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', passwords);
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
    setLoading(false);
  };

  const handleClearPath = async () => {
    if (window.confirm('Are you sure you want to clear your learning path? This cannot be undone.')) {
      setLoading(true);
      try {
        await api.delete('/employee/clear-path');
        toast.success('Learning path cleared');
      } catch (err) {
        toast.error('Failed to clear learning path');
      }
      setLoading(false);
    }
  };

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{label}</span>
        <div onClick={onChange} style={{ width: 44, height: 22, borderRadius: 22, background: checked ? '#6366f1' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
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
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>FULL NAME</label>
                <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>CURRENT ROLE</label>
                <input type="text" value={profile.currentRole} onChange={e => setProfile({...profile, currentRole: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>DEPARTMENT</label>
                <input type="text" value={profile.department} onChange={e => setProfile({...profile, department: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>TARGET ROLE</label>
                <input type="text" value={profile.targetRole} onChange={e => setProfile({...profile, targetRole: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>WEEKLY LEARNING GOAL (HOURS)</label>
                <input type="number" value={profile.weeklyGoalHours} onChange={e => setProfile({...profile, weeklyGoalHours: parseInt(e.target.value) || 0})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button onClick={handleSaveProfile} disabled={loading} className="btn-primary" style={{ minWidth: 130 }}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </>
          )}

          {activeSection === 'Notifications' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontWeight: 700, color: '#f1f5f9' }}>Notification Preferences</h2>
              <Toggle label="Email me when my learning path updates" checked={prefs.emailAlerts} onChange={() => setPrefs({...prefs, emailAlerts: !prefs.emailAlerts})} />
              <Toggle label="Push Notifications" checked={prefs.pushNotifications} onChange={() => setPrefs({...prefs, pushNotifications: !prefs.pushNotifications})} />
              <Toggle label="Weekly readiness score digest" checked={prefs.weeklyDigest} onChange={() => setPrefs({...prefs, weeklyDigest: !prefs.weeklyDigest})} />
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button onClick={handleSavePrefs} disabled={loading} className="btn-primary" style={{ minWidth: 130 }}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </>
          )}

          {activeSection === 'Privacy' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontWeight: 700, color: '#f1f5f9' }}>Data Management</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>Reset your AI-generated data including learning paths.</p>
              
              <div style={{ padding: '1.25rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: '#fcd34d', margin: '0 0 0.25rem 0' }}>Clear AI Learning Path</h4>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>Delete your current generated learning path.</p>
                </div>
                <button onClick={handleClearPath} disabled={loading} style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  Clear Path
                </button>
              </div>
            </>
          )}

          {activeSection === 'Account' && (
            <>
              <h2 style={{ margin: '0 0 2rem 0', fontWeight: 700, color: '#f1f5f9' }}>Account Security</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>CURRENT PASSWORD</label>
                <input type="password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} placeholder="••••••••" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>NEW PASSWORD</label>
                <input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} placeholder="••••••••" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start', marginTop: '1rem' }}>
                <button onClick={handleChangePassword} disabled={loading || !passwords.currentPassword} className="btn-primary">
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
              </div>

              <div style={{ marginTop: '3rem', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                <h4 style={{ color: '#fca5a5', margin: '0 0 0.5rem 0' }}>Danger Zone</h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>Permanently disable your account. Only admins can restore it.</p>
                <button onClick={() => alert('Please contact an Admin to delete your account.')} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Support Request</button>
              </div>
            </>
          )}

        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeSettings;
