import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EmployeeLearning: React.FC = () => {
  const { user } = useAuth();
  const empId = (user as any)?.employeeRef;

  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      await api.post(`/ai/learning-path/${empId}`);
    } catch { /* show empty state */ } finally { setGenerating(false); }
  };

  const mockPath = {
    title: 'Your 12-Week Growth Plan',
    weeks: [
      { week: '1–2', focus: 'Docker Fundamentals', resources: ['Docker Official Docs', 'Docker & Kubernetes: The Practical Guide (Udemy)'], status: 'completed' },
      { week: '3–4', focus: 'AWS Cloud Practitioner', resources: ['AWS Free Tier Labs', 'Cloud Practitioner Essentials (AWS Training)'], status: 'in-progress' },
      { week: '5–6', focus: 'Kubernetes Core Concepts', resources: ['k8s.io Interactive Tutorial', 'KodeKloud CKA Course'], status: 'upcoming' },
      { week: '7–8', focus: 'System Design Patterns', resources: ['Designing Data-Intensive Applications', 'System Design Primer (GitHub)'], status: 'upcoming' },
      { week: '9–10', focus: 'TypeScript Advanced Patterns', resources: ['TypeScript Handbook', 'Matt Pocock\'s Total TypeScript'], status: 'upcoming' },
      { week: '11–12', focus: 'Portfolio Project + Review', resources: ['Build a full-stack project with all new skills', 'Peer code review session'], status: 'upcoming' },
    ]
  };

  const statusStyle = (s: string) => ({
    completed: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', icon: '✅' },
    'in-progress': { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', icon: '⏳' },
    upcoming: { color: '#64748b', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', icon: '📅' },
  }[s] || {});


  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My <span className="gradient-text">Learning Path</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>AI-personalized plan to reach your target role.</p>
        </div>
        <button onClick={generate} className="btn-primary" disabled={generating}>
          {generating ? '⏳ Generating...' : '🤖 Regenerate with AI'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{mockPath.title}</span>
          <span style={{ fontWeight: 700, color: '#6366f1' }}>1 / 6 weeks done</span>
        </div>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5 }}>
          <div style={{ height: '100%', width: `${(1 / 6) * 100}%`, background: 'linear-gradient(to right, #6366f1, #10b981)', borderRadius: 5 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          <span>Week 1</span><span>Week 12</span>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'rgba(99, 102, 241, 0.2)', borderRadius: 2 }} />
        {mockPath.weeks.map((w, i) => {
          const ss = statusStyle(w.status) as any;
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', left: -28, top: 16, width: 16, height: 16, borderRadius: '50%', background: ss.color, border: `3px solid ${ss.bg}`, flexShrink: 0 }} />
              <div style={{ background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>WEEK {w.week}</span>
                    <h3 style={{ margin: '0.2rem 0 0 0', fontWeight: 700, color: '#f1f5f9' }}>{ss.icon} {w.focus}</h3>
                  </div>
                  <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize' }}>{w.status.replace('-', ' ')}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {w.resources.map(r => (
                    <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <span style={{ color: ss.color }}>▸</span> {r}
                    </div>
                  ))}
                </div>
                {w.status === 'in-progress' && (
                  <button style={{ marginTop: '0.75rem', background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color, padding: '0.35rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Mark Complete ✓</button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeLearning;
