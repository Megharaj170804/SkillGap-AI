import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import SkillBar from '../components/SkillBar';
import GapChart from '../components/GapChart';
import { useSocket } from '../hooks/useSocket';

interface Employee {
  _id: string;
  name: string;
  email: string;
  currentRole: string;
  targetRole: string;
  department: string;
  skills: { skillName: string; proficiencyLevel: number; yearsOfExperience: number }[];
  projectHistory: { projectName: string; technologiesUsed: string[]; duration: string }[];
}

interface Analysis {
  gapScore: number;
  totalRequired: number;
  strongSkills: { skillName: string; priority: string }[];
  weakSkills: { skillName: string; priority: string }[];
  missingSkills: { skillName: string; priority: string }[];
}

const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useSocket({
    events: {
      skill_updated: () => setRefreshKey(k => k + 1),
      learning_path_updated: () => setRefreshKey(k => k + 1),
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [empRes, analysisRes] = await Promise.all([
          api.get(`/employees/${id}`),
          api.get(`/analysis/employee/${id}`),
        ]);
        setEmployee(empRes.data);
        setAnalysis(analysisRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load employee details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, refreshKey]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>;
  if (error) return <div style={{ padding: '2rem', color: '#fca5a5', textAlign: 'center' }}>{error}</div>;
  if (!employee) return null;

  const initial = employee.name.charAt(0).toUpperCase();

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }} id="back-btn">← Back</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left column */}
        <div>
          {/* Profile header */}
          <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '16px', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', fontWeight: 800, color: 'white',
              }}>{initial}</div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.2rem' }}>{employee.name}</h1>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{employee.email}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, background: 'rgba(99,102,241,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)' }}>{employee.department}</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>{employee.currentRole}</span>
                  {employee.targetRole && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>→ {employee.targetRole}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: '#e2e8f0' }}>Current Skills</h2>
            {employee.skills.length > 0 ? (
              employee.skills.map((s) => (
                <SkillBar key={s.skillName} skillName={s.skillName} level={s.proficiencyLevel} />
              ))
            ) : (
              <p style={{ color: '#94a3b8' }}>No skills recorded.</p>
            )}
          </div>

          {/* Gap Analysis badges */}
          {analysis && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: '#e2e8f0' }}>Gap Analysis — {employee.targetRole}</h2>
              {[
                { label: 'Missing Skills', items: analysis.missingSkills, cls: 'badge-missing' },
                { label: 'Weak Skills', items: analysis.weakSkills, cls: 'badge-weak' },
                { label: 'Strong Skills', items: analysis.strongSkills, cls: 'badge-strong' },
              ].map(({ label, items, cls }) => items.length > 0 && (
                <div key={label} style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {items.map((s: any) => <span key={s.skillName} className={cls}>{s.skillName}</span>)}
                  </div>
                </div>
              ))}
              <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => navigate(`/employees/${id}/learning`)} id="view-learning-path">View Learning Path →</button>
            </div>
          )}
        </div>

        {/* Right column — readiness donut */}
        {analysis && (
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem', color: '#e2e8f0' }}>Role Readiness</h3>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <GapChart gapScore={analysis.gapScore} size={160} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
              {[
                { label: 'Strong', value: analysis.strongSkills.length, color: '#10b981' },
                { label: 'Weak', value: analysis.weakSkills.length, color: '#f59e0b' },
                { label: 'Missing', value: analysis.missingSkills.length, color: '#ef4444' },
                { label: 'Total Req.', value: analysis.totalRequired, color: '#6366f1' },
              ].map((s) => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetail;
