import React from 'react';
import { motion } from 'framer-motion';

const achievements = [
  { id: '1', icon: '🚀', title: 'First Learning Path Completed', desc: 'Completed your very first AI-generated learning path.', date: 'Feb 10, 2025', earned: true, color: '#6366f1' },
  { id: '2', icon: '⚡', title: 'Speed Learner', desc: 'Completed 3 courses in under a week.', date: 'Feb 28, 2025', earned: true, color: '#f59e0b' },
  { id: '3', icon: '💯', title: '80% Readiness Milestone', desc: 'Reached an 80% or above readiness score.', date: '', earned: false, color: '#10b981' },
  { id: '4', icon: '🧠', title: 'AI Power User', desc: 'Used the AI advisor 10 times to get insights.', date: 'Mar 5, 2025', earned: true, color: '#8b5cf6' },
  { id: '5', icon: '🌟', title: 'Skill Streak — 7 Days', desc: 'Logged learning activity 7 days in a row.', date: '', earned: false, color: '#06b6d4' },
  { id: '6', icon: '🏅', title: 'Profile Complete', desc: 'Filled in all sections of your skill profile.', date: 'Jan 22, 2025', earned: true, color: '#10b981' },
  { id: '7', icon: '🔥', title: 'Gap Crusher', desc: 'Closed 5 skill gaps in a single month.', date: '', earned: false, color: '#ef4444' },
  { id: '8', icon: '🎓', title: 'Role Ready', desc: 'Reached 90% readiness for your target role.', date: '', earned: false, color: '#6366f1' },
];

const EmployeeAchievements: React.FC = () => {
  const earned = achievements.filter(a => a.earned);
  const locked = achievements.filter(a => !a.earned);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My <span className="gradient-text">Achievements</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>{earned.length} earned · {locked.length} locked</p>
      </div>

      {/* Progress */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{earned.length}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Earned</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
            <span>Achievement Progress</span>
            <span>{earned.length}/{achievements.length}</span>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5 }}>
            <div style={{ height: '100%', width: `${(earned.length / achievements.length) * 100}%`, background: 'linear-gradient(to right, #6366f1, #8b5cf6)', borderRadius: 5 }} />
          </div>
        </div>
      </div>

      {/* Earned */}
      <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>🏆 Earned</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {earned.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
            className="glass-card" style={{ padding: '1.5rem', borderTop: `3px solid ${a.color}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -16, right: -16, fontSize: '4rem', opacity: 0.06 }}>{a.icon}</div>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{a.icon}</div>
            <h4 style={{ margin: '0 0 0.4rem 0', fontWeight: 700, color: '#f1f5f9' }}>{a.title}</h4>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{a.desc}</p>
            <div style={{ fontSize: '0.72rem', color: a.color, fontWeight: 600 }}>🗓 Earned {a.date}</div>
          </motion.div>
        ))}
      </div>

      {/* Locked */}
      <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#64748b' }}>🔒 Locked</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {locked.map((a, _i) => (
          <div key={a.id} className="glass-card" style={{ padding: '1.5rem', opacity: 0.5, filter: 'grayscale(0.6)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', filter: 'grayscale(1)' }}>{a.icon}</div>
            <h4 style={{ margin: '0 0 0.4rem 0', fontWeight: 700, color: '#94a3b8' }}>{a.title}</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>{a.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeAchievements;
