import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const cellColor = (pct: number) => {
  if (pct >= 80) return { bg: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' };
  if (pct >= 50) return { bg: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' };
  return { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' };
};

const ManagerSkillCoverage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/manager/skill-coverage')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load skill coverage', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading skill coverage...</div>;
  }

  const { employees, skills, matrix, teamCoveragePercent } = data;

  // Calculate coverage percentage helper
  const getPct = (empId: string, skillName: string) => {
    const cell = matrix[empId]?.[skillName];
    if (!cell) return 0;
    if (cell.required === 0) return 100;
    return Math.round(Math.min(1, cell.current / cell.required) * 100);
  };

  // Build Radar Data
  const radarData = skills.map((skill: string) => {
    let sum = 0;
    employees.forEach((emp: any) => sum += getPct(emp.id, skill));
    const value = employees.length > 0 ? Math.round(sum / employees.length) : 0;
    return { subject: skill, value };
  });

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Team <span className="gradient-text">Skill Coverage</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Where your team is strong and where it needs support. Overall coverage: {teamCoveragePercent}%</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Heatmap */}
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', fontSize: '1rem' }}>Skill Coverage Heatmap</h3>
          <div style={{ overflowX: 'auto' }}>
            {employees.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No employees in your team yet.</p>
            ) : skills.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No required skills found for current roles.</p>
            ) : (
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem', color: '#94a3b8', textAlign: 'left', fontWeight: 600, minWidth: 80 }}>Member</th>
                    {skills.map((s: string) => <th key={s} style={{ padding: '0.5rem 0.5rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{s}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: any) => (
                    <tr key={emp.id}>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#f1f5f9', fontWeight: 600, whiteSpace: 'nowrap' }}>{emp.name.split(' ')[0]}</td>
                      {skills.map((s: string) => {
                        const pct = getPct(emp.id, s);
                        const cs = cellColor(pct);
                        return (
                          <td key={s} title={`${emp.name} - ${s}: ${pct}%`} style={{ padding: '0.4rem', textAlign: 'center' }}>
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
            )}
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
          {skills.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={(v: any) => [`${v}%`, 'Team Avg']} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Not enough data</div>
          )}
        </div>
      </div>

      {/* Gap Priority Matrix */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Gap Priority Matrix</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {skills
            .map((skill: string) => {
              const avg = radarData.find((r: any) => r.subject === skill)?.value || 0;
              const cs = cellColor(avg);
              return { skill, avg, cs };
            })
            .sort((a: { avg: number }, b: { avg: number }) => a.avg - b.avg)
            .map(({ skill, avg, cs }: { skill: string; avg: number; cs: any }) => (
              <div key={skill} style={{ background: cs.bg, border: `1px solid ${cs.color}30`, borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{skill}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Team avg: <span style={{ color: cs.color, fontWeight: 700 }}>{avg}%</span></div>
                </div>
                {avg < 50 && <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>Priority</span>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerSkillCoverage;
