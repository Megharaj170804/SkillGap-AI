import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const weeklyData = [
  { day: 'Mon', hours: 1.5 }, { day: 'Tue', hours: 2 }, { day: 'Wed', hours: 0.5 },
  { day: 'Thu', hours: 3 }, { day: 'Fri', hours: 2.5 }, { day: 'Sat', hours: 1 }, { day: 'Sun', hours: 0 },
];

const EmployeeOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const empId = (user as any)?.employeeRef;

  const [metrics, setMetrics] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!empId) {
      setLoading(false);
      return;
    }
    try {
      const [empRes, anRes] = await Promise.all([
        api.get(`/employees/${empId}`),
        api.get(`/analysis/employee/${empId}`).catch(() => ({ data: null })),
      ]);
      const emp = empRes.data;
      setMetrics({ currentRole: emp.currentRole || 'N/A', targetRole: emp.targetRole || 'Not Set', department: emp.department || 'N/A', skillsCount: emp.skills?.length || 0 });
      if (anRes.data) setAnalysis(anRes.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [empId]);
  useSocket({ employeeId: empId, events: { skill_updated: loadData, gap_analysis_ready: loadData } });

  const score = analysis?.gapScore || 0;
  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';


  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.1))', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#f1f5f9' }}>Welcome back, <span className="gradient-text">{user?.name}!</span> 👋</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8' }}>{metrics?.currentRole} · {metrics?.department}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>TARGET ROLE</div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 700 }}>
            {metrics?.targetRole || 'Not Set'}
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: 'Readiness Score', val: analysis ? `${score}%` : 'N/A', color: scoreColor, icon: '📊', sub: score >= 70 ? 'On track!' : score >= 40 ? 'Needs work' : 'Critical gap' },
          { label: 'Total Skills', val: metrics?.skillsCount || 0, color: '#6366f1', icon: '🎯', sub: 'Listed in profile' },
          { label: 'Skill Gaps', val: analysis ? (analysis.missingSkills?.length || 0) + (analysis.weakSkills?.length || 0) : 'N/A', color: '#f59e0b', icon: '⚠️', sub: 'Missing or weak' },
          { label: 'Strong Skills', val: analysis?.strongSkills?.length ?? 'N/A', color: '#10b981', icon: '💪', sub: 'Well covered' },
          { label: 'Learning Hours', val: `${weeklyData.reduce((a, d) => a + d.hours, 0)}h`, color: '#8b5cf6', icon: '📚', sub: 'This week' },
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
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '2rem', alignSelf: 'flex-start' }}>Readiness Progress</h3>
          <div style={{ position: 'relative', width: 180, height: 180 }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor }}>{score}%</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Readiness</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#10b981' }}>{analysis?.strongSkills?.length || 0}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Strong</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#f59e0b' }}>{analysis?.weakSkills?.length || 0}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Weak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#ef4444' }}>{analysis?.missingSkills?.length || 0}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Missing</div>
            </div>
          </div>
        </div>

        {/* Weekly Learning Hours */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Learning Hours This Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={(v: any) => [`${v}h`, 'Hours']} />
              <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Gaps + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Top skill gaps */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎯 Priority Skill Gaps
          </h3>
          {analysis?.missingSkills?.slice(0, 5).map((skill: string, i: number) => (
            <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: '#64748b', width: 18, textAlign: 'center', fontSize: '0.8rem' }}>#{i + 1}</span>
              <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.07)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem 0.9rem', borderRadius: '8px' }}>
                <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: '0.875rem' }}>{skill}</span>
              </div>
              <button onClick={() => navigate(`/employee/learning`)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Learn →</button>
            </div>
          )) || (
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Set a target role to see skill gaps.</div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '📚', label: 'Generate AI Learning Path', color: '#6366f1', action: () => navigate(`/employee/learning`) },
              { icon: '💡', label: 'Get Career Advice', color: '#10b981', action: () => navigate('/employee/career') },
              { icon: '🗺️', label: 'Project Skill Mapper', color: '#f59e0b', action: () => navigate('/employee/project-mapper') },
              { icon: '🏆', label: 'View Achievements', color: '#8b5cf6', action: () => navigate('/employee/achievements') },
              { icon: '👤', label: 'Update My Profile', color: '#06b6d4', action: () => navigate('/profile') },
            ].map(item => (
              <motion.button key={item.label} whileHover={{ x: 4 }} onClick={item.action}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', textAlign: 'left', color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', transition: 'background 0.2s' }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ color: item.color }}>→</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOverview;
