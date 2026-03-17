import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SkillBar from '../components/SkillBar';
import GapChart from '../components/GapChart';
import LearningPathCard from '../components/LearningPathCard';

interface Employee {
  _id: string;
  name: string;
  email: string;
  currentRole: string;
  targetRole: string;
  department: string;
  skills: { skillName: string; proficiencyLevel: number; yearsOfExperience: number }[];
}

interface Analysis {
  gapScore: number;
  missingSkills: any[];
  weakSkills: any[];
  strongSkills: any[];
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'skills' | 'analysis' | 'learning'>('skills');

  useEffect(() => {
    if (!user) return;
    // Get the employeeRef from /me endpoint
    api.get('/auth/me').then(async (meRes) => {
      const empId = meRes.data.employeeRef;
      if (!empId) {
        setError('No employee profile linked to your account. Contact your admin.');
        setLoading(false);
        return;
      }
      try {
        const [empRes, analysisRes] = await Promise.all([
          api.get(`/employees/${empId}`),
          api.get(`/analysis/employee/${empId}`),
        ]);
        setEmployee(empRes.data);
        setAnalysis(analysisRes.data);
      } catch (err: any) {
        // Analysis might fail if no targetRole
        if (err.response?.status !== 400 && err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    }).catch(() => {
      setError('Failed to load profile.');
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>;
  if (error && !employee) return <div style={{ padding: '2rem', color: '#fca5a5', textAlign: 'center' }}>{error}</div>;

  const tabs = ['skills', 'analysis', 'learning'] as const;
  const tabLabels = { skills: '⚡ My Skills', analysis: '📊 Gap Analysis', learning: '🎯 Learning Path' };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Profile Header */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '18px', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: 'white',
            boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
          }}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.2rem' }}>{user?.name}</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{user?.email}</p>
            {employee && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, background: 'rgba(99,102,241,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)' }}>{employee.department}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>{employee.currentRole}</span>
                {employee.targetRole && (
                  <span style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>Target: {employee.targetRole}</span>
                )}
              </div>
            )}
          </div>
          {analysis && (
            <GapChart gapScore={analysis.gapScore} size={100} />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            id={`tab-${tab}`}
            style={{
              flex: 1, padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: activeTab === tab ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: activeTab === tab ? 'white' : '#94a3b8',
              boxShadow: activeTab === tab ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'skills' && employee && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: '#e2e8f0' }}>My Skills ({employee.skills.length})</h2>
          {employee.skills.length > 0
            ? employee.skills.map((s) => <SkillBar key={s.skillName} skillName={s.skillName} level={s.proficiencyLevel} />)
            : <p style={{ color: '#94a3b8' }}>No skills recorded yet. Ask your admin to update your profile.</p>}
        </div>
      )}

      {activeTab === 'analysis' && analysis && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: '#e2e8f0' }}>Gap Analysis — {employee?.targetRole}</h2>
          {[
            { label: 'Missing Skills', items: analysis.missingSkills, cls: 'badge-missing' },
            { label: 'Weak Skills (below required)', items: analysis.weakSkills, cls: 'badge-weak' },
            { label: 'Strong Skills ✓', items: analysis.strongSkills, cls: 'badge-strong' },
          ].map(({ label, items, cls }) => items.length > 0 && (
            <div key={label} style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {items.map((s: any) => <span key={s.skillName} className={cls}>{s.skillName}</span>)}
              </div>
            </div>
          ))}
          <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => setActiveTab('learning')} id="goto-learning">View Learning Path →</button>
        </div>
      )}

      {activeTab === 'analysis' && !analysis && (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8' }}>No gap analysis available. Make sure your target role is set.</p>
        </div>
      )}

      {activeTab === 'learning' && (
        <div>
          {analysis && [...analysis.missingSkills, ...analysis.weakSkills].length > 0 ? (
            [...analysis.missingSkills.map((s: any) => ({ ...s, isMissing: true })),
             ...analysis.weakSkills.map((s: any) => ({ ...s, isMissing: false }))]
              .map((gap: any) => (
                <LearningPathCard
                  key={gap.skillName}
                  skillName={gap.skillName}
                  currentLevel={gap.currentLevel}
                  requiredLevel={gap.requiredLevel}
                  priority={gap.priority}
                  isMissing={gap.isMissing}
                  courses={gap.recommendations?.courses || []}
                  estimatedWeeks={gap.recommendations?.estimatedWeeks || 0}
                />
              ))
          ) : (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>You're ready!</h2>
              <p style={{ color: '#94a3b8' }}>All required skills meet the minimum level. Keep growing!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
