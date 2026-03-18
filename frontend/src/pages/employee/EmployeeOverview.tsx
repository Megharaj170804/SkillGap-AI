import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, animate } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const EmployeeOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [weeklyHours, setWeeklyHours] = useState<any[]>([]);
  const [todaysFocus, setTodaysFocus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  
  const [displayScore, setDisplayScore] = useState(0);

  const loadData = async () => {
    try {
      const [statsRes, hoursRes, focusRes] = await Promise.all([
        api.get('/employee/my-stats'),
        api.get('/employee/weekly-hours'),
        api.get('/employee/todays-focus')
      ]);
      setStats(statsRes.data);
      setWeeklyHours(hoursRes.data);
      setTodaysFocus(focusRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
    } catch (err) {
      console.error('Failed to load roles');
    }
  };

  useEffect(() => { loadData(); }, []);

  // Real-time updates
  useSocket({ employeeId: (user as any)?.employeeRef, events: {
    your_gap_updated: () => {
      loadData();
    },
  }});

  useEffect(() => {
    if (stats?.gapScore > 0) {
      const controls = animate(0, stats.gapScore, {
        duration: 1.5,
        onUpdate: (val) => setDisplayScore(Math.round(val)),
      });
      return controls.stop;
    } else {
      setDisplayScore(0);
    }
  }, [stats?.gapScore]);

  const handleSetRole = async () => {
    try {
      await api.put('/employee/set-target-role', { targetRole: selectedRole });
      setShowRoleModal(false);
      loadData();
    } catch (err) {
      console.error('Error saving role');
    }
  };

  const markFocusAsStudied = async () => {
    if (!todaysFocus || todaysFocus.focusSkill === 'General Learning') return;
    try {
      await api.post('/progress/log-today', { skillName: todaysFocus.focusSkill });
      loadData();
    } catch {
      console.error('Failed to log');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

  const score = stats?.gapScore || 0;
  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const roleNotSet = !stats?.targetRole;

  return (
    <div style={{ paddingBottom: '2rem', position: 'relative' }}>
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.1))', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#f1f5f9' }}>Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}!</span> 👋</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8' }}>
            {stats?.lastMotivationalTip || 'Keep pushing toward your goal!'}
          </p>
        </div>
        <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => { if(roleNotSet) { loadRoles(); setShowRoleModal(true); }}}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>TARGET ROLE</div>
          <div style={{ background: roleNotSet ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: roleNotSet ? '#f59e0b' : '#10b981', border: roleNotSet ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 700, transition: 'all 0.2s', ...(roleNotSet ? { boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)' } : {}) }}>
            {stats?.targetRole || 'Not Set'}
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: 'Readiness Score', val: `${displayScore}%`, color: scoreColor, icon: '📊', sub: score >= 70 ? 'On track!' : score >= 40 ? 'Making progress' : 'Critical gap' },
          { label: 'Total Skills', val: stats?.totalSkills || 0, color: '#6366f1', icon: '🎯', sub: stats?.totalSkills === 0 ? <span style={{color: '#f59e0b'}}>Add skills to get started</span> : 'Listed in profile' },
          { label: 'Skill Gaps', val: roleNotSet ? '-' : stats?.skillGapsCount || 0, color: roleNotSet ? '#64748b' : (stats?.skillGapsCount > 5 ? '#ef4444' : stats?.skillGapsCount >= 3 ? '#f59e0b' : '#10b981'), icon: '⚠️', sub: roleNotSet ? 'Set target role first' : 'Missing or weak skills' },
          { label: 'Strong Skills', val: roleNotSet ? '-' : stats?.strongSkillsCount || 0, color: roleNotSet ? '#64748b' : '#10b981', icon: '💪', sub: 'Well covered' },
          { label: 'Learning Hours', val: `${stats?.learningHoursThisWeek?.toFixed(1) || 0}h`, color: '#8b5cf6', icon: '📚', sub: 'This week' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
              <span className="pulse-dot" style={{ background: s.color }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>{s.label}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Readiness + Learning Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Progress gauge */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'stretch' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '2rem', alignSelf: 'flex-start' }}>Readiness Progress</h3>
          {roleNotSet ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '2rem' }}>🎯</span>
              <p style={{ marginTop: '1rem' }}>Set your target role to see readiness</p>
              <button onClick={() => { loadRoles(); setShowRoleModal(true); }} style={{ marginTop: '1rem', background: '#6366f1', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Set Role Now</button>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', width: 200, height: 200 }}>
                <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="16"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor }}>{displayScore}%</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ready</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1.2rem' }}>{stats?.strongSkillsCount || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Strong 💪</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '1.2rem' }}>{stats?.skillGapsCount || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Gaps ⚠️</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Weekly Learning Hours AreaChart */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Learning Hours This Week</h3>
          {weeklyHours.every(d => d.hours === 0) ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '2rem' }}>📚</span>
              <p style={{ marginTop: '1rem' }}>No study sessions logged yet</p>
              <button onClick={() => navigate('/employee/learning')} style={{ marginTop: '1rem', background: '#8b5cf6', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Log Study Session</button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weeklyHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(v: any) => [`${v}h`, 'Hours']} />
                <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Widgets Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Today's Focus Widget */}
        <motion.div whileHover={{ y: -2 }} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🎯 Today's Focus</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
            {todaysFocus?.focusSkill || 'Loading...'}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            {todaysFocus?.reason}
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={markFocusAsStudied} disabled={todaysFocus?.focusSkill === 'General Learning'} style={{ background: '#3b82f6', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', flex: 1, opacity: todaysFocus?.focusSkill === 'General Learning' ? 0.5 : 1 }}>
              Mark as studied today ✓
            </button>
          </div>
        </motion.div>

        {/* Current Streak Widget */}
        <motion.div whileHover={{ y: -2 }} className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(220, 38, 38, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))' }}>🔥</div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#f59e0b' }}>
              {stats?.currentStreak || 0} Day Streak
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>
              {stats?.currentStreak === 0 ? 'Start your streak today!' : 'Keep the momentum going!'}
            </p>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, padding: '0.2rem 0.6rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'inline-block' }}>
              Best: {stats?.longestStreak || stats?.currentStreak || 0} days
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal for setting Target Role */}
      {showRoleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: '2rem', width: '90%', maxWidth: '400px', background: '#0f172a' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Set Target Role</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select your career goal to unlock personalized gap analysis and AI learning paths.</p>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', marginBottom: '1.5rem', outline: 'none' }}>
              <option value="" disabled>Select a role...</option>
              {roles.map(r => (
                <option key={r._id} value={r.roleName}>{r.roleName}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRoleModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSetRole} disabled={!selectedRole} style={{ background: '#10b981', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: selectedRole ? 'pointer' : 'not-allowed', opacity: selectedRole ? 1 : 0.5, fontWeight: 600 }}>Save Target Role</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmployeeOverview;
