import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';

interface AnalyticsData {
  totalEmployees: number;
  avgProgress: number;
  topSkillGaps: { name: string; count: number }[];
  roleDistribution: { name: string; value: number }[];
  departmentBreakdown: { dept: string; count: number }[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const StatCard = ({ icon, value, label, color }: any) => (
  <div className="glass-card" style={{ padding: '1.25rem' }}>
    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '1.75rem', fontWeight: 900, color }}>{value}</div>
    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{label}</div>
  </div>
);

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/export/analytics')
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div className="spinner" style={{ width: 48, height: 48, margin: '4rem auto' }} />
    </div>
  );

  if (!data) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Platform <span className="gradient-text">Analytics</span>
        </h1>
        <p style={{ color: '#94a3b8' }}>Company-wide skill and readiness overview</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon="👥" value={data.totalEmployees} label="Total Employees" color="#6366f1" />
        <StatCard icon="📈" value={`${data.avgProgress}%`} label="Avg Progress" color={data.avgProgress >= 70 ? '#10b981' : data.avgProgress >= 40 ? '#f59e0b' : '#ef4444'} />
        <StatCard icon="⚠️" value={data.topSkillGaps?.[0]?.name || '—'} label="Most Common Gap" color="#ef4444" />
        <StatCard icon="🏢" value={data.departmentBreakdown?.length || 0} label="Departments" color="#06b6d4" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Skill gap frequency bar chart */}
        {data.topSkillGaps?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>Most Common Skill Gaps</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topSkillGaps} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9' }} />
                <Bar dataKey="count" fill="url(#gapGradient)" radius={[6, 6, 0, 0]} isAnimationActive />
                <defs>
                  <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Role distribution pie */}
        {data.roleDistribution?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>Target Role Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.roleDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" isAnimationActive label={({ name }) => name} labelLine>
                  {data.roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Department breakdown */}
        {data.departmentBreakdown?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>Employees by Department</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.departmentBreakdown} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dept" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9' }} />
                <Bar dataKey="count" fill="url(#deptGradient)" radius={[6, 6, 0, 0]} isAnimationActive />
                <defs>
                  <linearGradient id="deptGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
