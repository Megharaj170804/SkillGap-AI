import React, { useState } from 'react';
import { motion } from 'framer-motion';

const projects = [
  { id: '1', name: 'E-Commerce Platform Rebuild', deadline: 'May 30, 2025', requiredSkills: ['React', 'Node.js', 'AWS', 'Docker', 'TypeScript'], members: [{ name: 'Jane Smith', coverage: [95, 60, 40, 55, 90] }, { name: 'John Doe', coverage: [90, 40, 20, 30, 85] }] },
  { id: '2', name: 'Data Pipeline Automation', deadline: 'Apr 15, 2025', requiredSkills: ['Python', 'SQL', 'Spark', 'Docker', 'Airflow'], members: [{ name: 'Bob Wilson', coverage: [75, 85, 30, 60, 20] }, { name: 'Alice Ray', coverage: [45, 70, 15, 80, 25] }] },
];

const ManagerProjectPlanner: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);

  const coveragColor = (pct: number) => pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Project <span className="gradient-text">Skill Planner</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Map your team's skills to upcoming project requirements.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {projects.map((project, pi) => (
          <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.1 }} className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9' }}>{project.name}</h3>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>📅 Deadline: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{project.deadline}</span></div>
              </div>
              <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>🤖 Generate Training Plan</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 400 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Team Member</th>
                    {project.requiredSkills.map(s => (
                      <th key={s} style={{ padding: '0.5rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{s}</th>
                    ))}
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {project.members.map(member => {
                    const avg = Math.round(member.coverage.reduce((a, c) => a + c, 0) / member.coverage.length);
                    return (
                      <tr key={member.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap' }}>{member.name}</td>
                        {member.coverage.map((pct, i) => (
                          <td key={i} style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <div style={{ width: 38, height: 38, borderRadius: 6, background: pct >= 70 ? 'rgba(16,185,129,0.15)' : pct >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: coveragColor(pct), fontWeight: 700, fontSize: '0.72rem' }}>{pct}%</div>
                          </td>
                        ))}
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: coveragColor(avg), fontSize: '0.9rem' }}>{avg}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}
      </div>

      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 480, maxWidth: '95vw', background: '#1a1a2e', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '20px', padding: '2rem', zIndex: 301 }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontWeight: 700, color: '#f1f5f9' }}>Create New Project</h2>
            {['Project Name', 'Deadline', 'Required Skills (comma-separated)'].map(f => (
              <div key={f} style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>{f.toUpperCase()}</label>
                <input type="text" placeholder={`Enter ${f}...`} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="btn-primary">Create Project</button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default ManagerProjectPlanner;
