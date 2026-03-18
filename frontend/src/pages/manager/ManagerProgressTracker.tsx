import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];

const ManagerProgressTracker: React.FC = () => {
  const [teamProgress, setTeamProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/manager/team-progress')
      .then(res => {
        setTeamProgress(res.data);
      })
      .catch(err => {
        console.error('Failed to load team progress', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (n: number) => n >= 70 ? '#10b981' : n >= 40 ? '#f59e0b' : '#ef4444';

  if (loading) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading progress data...</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Team <span className="gradient-text">Progress Tracker</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Monitor learning velocity and individual member progress.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {teamProgress.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No team members found.</p>
        ) : teamProgress.map((member, i) => {
          const chartData = (member.weeklyHours || [0,0,0,0,0]).map((h: number, wi: number) => ({ name: weeks[wi], hours: h }));
          const totalHours = (member.weeklyHours || []).reduce((a: number, b: number) => a + b, 0);
          
          return (
            <motion.div key={member.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {member.avatar || member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 700, color: '#f1f5f9' }}>{member.name}</h3>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>📚 {member.currentPath}</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1.5rem', color: scoreColor(member.readiness) }}>{member.readiness}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: '1.25rem' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, member.readiness)}%`, background: scoreColor(member.readiness), borderRadius: 4 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#6366f1', fontSize: '1.25rem' }}>{totalHours}h</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Last 5 Wks</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '1.25rem' }}>{member.totalCoursesCompleted || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Courses Done</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center', position: 'relative' }}>
                    <div style={{ fontWeight: 700, color: member.goalMet ? '#10b981' : (member.hoursThisWeek === 0 ? '#ef4444' : '#f59e0b'), fontSize: '1.25rem' }}>
                      {member.hoursThisWeek}h / {member.weeklyGoalHours}h
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>This Wk Goal</div>
                    {member.goalMet && <div style={{ position: 'absolute', top: -4, right: -4, fontSize: '1rem' }}>🏆</div>}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>LEARNING HOURS / WEEK</div>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.75rem' }} />
                    <Line type="monotone" dataKey="hours" stroke={scoreColor(member.readiness)} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ManagerProgressTracker;
