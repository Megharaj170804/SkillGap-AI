import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EmployeeCard from '../components/EmployeeCard';

interface TeamMember {
  employeeId: string;
  name: string;
  currentRole: string;
  targetRole: string;
  gapScore: number | null;
  topGaps: string[];
}

const DEPARTMENTS = ['Engineering', 'Data Science', 'Design', 'Marketing', 'Product'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDept, setSelectedDept] = useState(user?.department || 'Engineering');

  // Employees redirect
  if (user?.role === 'employee') {
    navigate('/profile');
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/analysis/team/${selectedDept}`);
        setTeamData(res.data.teamAnalysis || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load team data.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [selectedDept]);

  const chartData = teamData
    .filter((m) => m.gapScore !== null)
    .map((m) => ({ name: m.name.split(' ')[0], readiness: m.gapScore }));

  const avgScore = teamData.length > 0
    ? Math.round(teamData.filter((m) => m.gapScore !== null).reduce((s, m) => s + (m.gapScore || 0), 0) / teamData.filter((m) => m.gapScore !== null).length)
    : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Team <span className="gradient-text">Dashboard</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Welcome back, {user?.name} · {user?.role}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="form-input"
            style={{ width: 'auto', minWidth: 160 }}
            id="dept-filter"
          >
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {user?.role === 'admin' && (
            <button className="btn-primary" onClick={() => navigate('/employees/add')} id="add-emp-btn">+ Add Employee</button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Employees', value: teamData.length, color: '#6366f1', icon: '👥' },
          { label: 'Avg Readiness', value: `${avgScore}%`, color: avgScore >= 70 ? '#10b981' : avgScore >= 40 ? '#f59e0b' : '#ef4444', icon: '📊' },
          { label: 'Need Attention', value: teamData.filter((m) => (m.gapScore || 0) < 50).length, color: '#ef4444', icon: '⚠️' },
          { label: 'Ready for Role', value: teamData.filter((m) => (m.gapScore || 0) >= 70).length, color: '#10b981', icon: '✅' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{stat.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: '#e2e8f0' }}>Team Skill Readiness — {selectedDept}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val: unknown) => [`${val}%`, 'Readiness']}
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#f1f5f9' }}
              />
              <Bar dataKey="readiness" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Loading / Error */}
      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>}
      {error && <div style={{ color: '#fca5a5', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '10px' }}>{error}</div>}

      {/* Employee cards grid */}
      {!loading && !error && (
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: '#e2e8f0' }}>
            Employees in <span style={{ color: '#6366f1' }}>{selectedDept}</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {teamData.map((m) => (
              <EmployeeCard
                key={m.employeeId}
                id={m.employeeId}
                name={m.name}
                currentRole={m.currentRole}
                targetRole={m.targetRole}
                department={selectedDept}
                gapScore={m.gapScore ?? undefined}
                topGaps={m.topGaps}
              />
            ))}
            {teamData.length === 0 && <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>No employees found in this department.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
