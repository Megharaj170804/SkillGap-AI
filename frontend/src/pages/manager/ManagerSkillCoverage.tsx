import React from 'react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';

const teamMembers = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Ray'];
const skills = ['React', 'Node.js', 'Python', 'SQL', 'Docker', 'AWS', 'TypeScript', 'Git'];

// Coverage percentage for each member × skill
const coverageMatrix = [
  [90, 40, 20, 60, 30, 20, 85, 100],
  [95, 60, 30, 70, 55, 40, 90, 100],
  [30, 90, 75, 85, 60, 55, 20, 100],
  [50, 65, 45, 70, 80, 70, 40, 100],
];

const radarData = skills.map((skill, i) => ({
  subject: skill, value: Math.round(coverageMatrix.reduce((acc, row) => acc + row[i], 0) / teamMembers.length),
}));

const cellColor = (pct: number) => {
  if (pct >= 80) return { bg: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' };
  if (pct >= 50) return { bg: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' };
  return { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' };
};

const ManagerSkillCoverage: React.FC = () => (
  <div style={{ paddingBottom: '2rem' }}>
    <div style={{ marginBottom: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Team <span className="gradient-text">Skill Coverage</span></h1>
      <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Where your team is strong and where it needs support.</p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Heatmap */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', fontSize: '1rem' }}>Skill Coverage Heatmap</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem 0.75rem', color: '#94a3b8', textAlign: 'left', fontWeight: 600, minWidth: 80 }}>Member</th>
                {skills.map(s => <th key={s} style={{ padding: '0.5rem 0.5rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((name, ri) => (
                <tr key={name}>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#f1f5f9', fontWeight: 600, whiteSpace: 'nowrap' }}>{name.split(' ')[0]}</td>
                  {coverageMatrix[ri].map((pct, ci) => {
                    const cs = cellColor(pct);
                    return (
                      <td key={ci} title={`${name} - ${skills[ci]}: ${pct}%`} style={{ padding: '0.4rem', textAlign: 'center' }}>
                        <motion.div whileHover={{ scale: 1.15 }} style={{ width: 36, height: 36, borderRadius: 6, background: cs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cs.color, fontWeight: 700, fontSize: '0.72rem', margin: '0 auto', cursor: 'default' }}>
                          {pct}%
                        </motion.div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}><span style={{ color: '#6ee7b7' }}>■</span> ≥80%</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}><span style={{ color: '#fcd34d' }}>■</span> 50–79%</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}><span style={{ color: '#fca5a5' }}>■</span> &lt;50%</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', fontSize: '1rem' }}>Team-Wide Skill Radar</h3>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={(v: any) => [`${v}%`, 'Team Avg']} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Gap Priority Matrix */}
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Gap Priority Matrix</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {skills.map((skill, si) => {
          const avg = Math.round(coverageMatrix.reduce((a, r) => a + r[si], 0) / teamMembers.length);
          const cs = cellColor(avg);
          return (
            <div key={skill} style={{ background: cs.bg, border: `1px solid ${cs.color}30`, borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{skill}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Team avg: <span style={{ color: cs.color, fontWeight: 700 }}>{avg}%</span></div>
              </div>
              {avg < 50 && <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>Priority</span>}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default ManagerSkillCoverage;
