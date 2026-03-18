import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from "../../hooks/useSocket";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

// ─── Toast component ───────────────────────────────────────────────────────────
let toastId = 0;
const toastListeners: Array<(t: any) => void> = [];
export const showToast = (msg: string, type: 'success' | 'warning' | 'info' = 'info') => {
  const id = ++toastId;
  toastListeners.forEach((fn) => fn({ id, msg, type }));
};

const Toast = () => {
  const [toasts, setToasts] = useState<any[]>([]);
  useEffect(() => {
    const handler = (t: any) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    toastListeners.push(handler);
    return () => { const i = toastListeners.indexOf(handler); if (i > -1) toastListeners.splice(i, 1); };
  }, []);

  const bg = (type: string) => type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#6366f1';

  return createPortal(
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <AnimatePresence>
      {toasts.map((t) => (
        <motion.div key={t.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
          style={{ background: bg(t.type), color: 'white', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: 320 }}>
          {t.msg}
        </motion.div>
      ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

// ─── Animated number ──────────────────────────────────────────────────────────
const AnimatedNumber = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
};

const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [criticalFlash, setCriticalFlash] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, trendRes, deptRes, feedRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/readiness-trend'),
        api.get('/admin/dept-readiness'),
        api.get('/admin/activity-feed?limit=20'),
      ]);
      setStats(statsRes.data);
      setTrendData(trendRes.data.map((d: any) => ({ name: d.month, score: d.avgScore })));
      setDeptData(deptRes.data.map((d: any) => ({ name: d.department, score: d.avgScore, count: d.employeeCount })));
      setActivities(feedRes.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Socket real-time
  useSocket({
    events: {
      stats_updated: () => {
        fetchStats();
      },
      critical_alert: ({ employee, score }: any) => {
        showToast(`⚠️ ${employee.name} dropped to critical gap: ${score}%`, 'warning');
        setCriticalFlash(true);
        setTimeout(() => setCriticalFlash(false), 2000);
        fetchStats();
      },
      activity_feed_update: (activity: any) => {
        setActivities((prev) => [{ ...activity, id: Date.now() }, ...prev].slice(0, 20));
      },
      new_employee_added: ({ employee }: any) => {
        showToast(`✅ New employee ${employee.name} added to ${employee.department}`, 'success');
        fetchStats();
      },
    },
  });

  // Emit join admin_room once socket connects
useEffect(() => {
  const socket = connectSocket();

  socket.emit("join_room", "admin_room");

  return () => {
    socket.disconnect(); // cleanup (important!)
  };
}, []);

  const scoreColor = (n: number) => n >= 70 ? '#10b981' : n >= 40 ? '#f59e0b' : '#ef4444';

  const StatCard = ({ title, value, subtext, alert, flash }: any) => (
    <motion.div
      animate={{ backgroundColor: flash ? 'rgba(239,68,68,0.25)' : alert ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)' }}
      transition={{ duration: 0.4 }}
      style={{ padding: '1.5rem', border: `1px solid ${alert ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '16px', background: alert ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)' }}>
      <h3 style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: alert ? '#ef4444' : '#f1f5f9' }}>
        {loading ? '—' : value}
      </div>
      <div style={{ fontSize: '0.78rem', color: alert ? '#fca5a5' : '#6366f1', marginTop: '0.3rem', fontWeight: 500 }}>{subtext}</div>
    </motion.div>
  );

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <Toast />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Admin <span className="gradient-text">Overview</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Company-wide platform health and metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/export/company-report/pdf?token=${localStorage.getItem('token')}`)}>
            📥 Generate Report
          </button>
          <button className="btn-primary" onClick={() => navigate('/admin/employees')}>+ Add Employee</button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {stats && stats.criticalGapsCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <span style={{ color: '#fca5a5', fontWeight: 600 }}>{stats.criticalGapsCount} employees currently have critical skill gaps (&lt;40%).</span>
          </div>
          <button onClick={() => navigate('/admin/employees?filter=critical')}
            style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            View List
          </button>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard
          title="Total Employees"
          value={<AnimatedNumber target={stats?.totalEmployees || 0} />}
          subtext={`↑ ${stats?.newEmployeesThisMonth || 0} this month`}
        />
        <StatCard
          title="Avg Readiness Score"
          value={<AnimatedNumber target={stats?.avgReadinessScore || 0} suffix="%" />}
          subtext={`${stats?.avgReadinessChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(stats?.avgReadinessChangePercent || 0)}% from last month`}
        />
        <StatCard
          title="Active Learning Paths"
          value={<AnimatedNumber target={stats?.activeLearningPaths || 0} />}
          subtext={`${stats?.learningPathAdoptionPercent || 0}% adoption rate`}
        />
        <StatCard
          title="Critical Gaps"
          value={<AnimatedNumber target={stats?.criticalGapsCount || 0} />}
          subtext="Requires immediate attention"
          alert
          flash={criticalFlash}
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Trend Line */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Readiness Trend (6 Mos)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <RechartsTooltip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} animationDuration={1500} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dept Bar */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Avg Readiness by Dept</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <RechartsTooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px' }}
                formatter={(val: any, _: any, props: any) => [`${val}% (${props.payload.count} employees)`, 'Avg Score']}
              />
              <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]}
                onClick={(data: any) => navigate(`/admin/employees?dept=${data.name}`)}
                style={{ cursor: 'pointer' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="pulse-dot" style={{ background: '#10b981' }}></span> Live Activity Feed
        </h3>
        {activities.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No recent activity.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 360, overflowY: 'auto' }}>
          {activities.map((act: any, i: number) => (
            <motion.div key={act.id || act._id || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${act.color || '#6366f1'}20`, border: `1.5px solid ${act.color || '#6366f1'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {act.dot || '📋'}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#f1f5f9', fontSize: '0.88rem' }}>{act.message}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 500, whiteSpace: 'nowrap' }}>{act.timeAgo}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
