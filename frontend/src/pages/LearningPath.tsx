import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LearningPathCard from '../components/LearningPathCard';

interface SkillGap {
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  priority: string;
  recommendations: { courses: string[]; estimatedWeeks: number };
}

interface LearningData {
  employeeName: string;
  currentRole: string;
  targetRole: string;
  gapScore: number;
  weakSkills: SkillGap[];
  missingSkills: SkillGap[];
  strongSkills: SkillGap[];
}

const LearningPath: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalWeeks, setTotalWeeks] = useState(0);

  useEffect(() => {
    api.get(`/analysis/employee/${id}`)
      .then((res) => {
        setData(res.data);
        const all = [...res.data.missingSkills, ...res.data.weakSkills];
        const weeks = all.reduce((sum: number, s: SkillGap) => sum + (s.recommendations?.estimatedWeeks || 0), 0);
        setTotalWeeks(weeks);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load learning path.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>;
  if (error) return <div style={{ padding: '2rem', color: '#fca5a5', textAlign: 'center' }}>{error}</div>;
  if (!data) return null;

  const allGaps: (SkillGap & { isMissing: boolean })[] = [
    ...data.missingSkills.map((s) => ({ ...s, isMissing: true })),
    ...data.weakSkills.map((s) => ({ ...s, isMissing: false })),
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto' }}>
      <button onClick={() => navigate(`/employees/${id}`)} className="btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }} id="back-btn">← Employee Detail</button>

      {/* Header */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.3rem' }}>
              Learning Path — <span className="gradient-text">{data.employeeName}</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {data.currentRole} → <span style={{ color: '#6366f1', fontWeight: 600 }}>{data.targetRole}</span>
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1' }}>{totalWeeks}w</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total est. weeks</div>
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Missing', count: data.missingSkills.length, color: '#ef4444' },
            { label: 'Weak', count: data.weakSkills.length, color: '#f59e0b' },
            { label: 'Ready', count: data.strongSkills.length, color: '#10b981' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{count} {label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* If everything ready */}
      {allGaps.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>You're ready for {data.targetRole}!</h2>
          <p style={{ color: '#94a3b8' }}>All required skills meet the minimum level. Keep it up!</p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            {allGaps.length} Skills to Improve — Ordered by Priority
          </p>
          {allGaps.map((gap) => (
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
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningPath;
