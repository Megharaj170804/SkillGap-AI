import React from 'react';

interface SkillBarProps {
  skillName: string;
  level: number;
  maxLevel?: number;
  showLevel?: boolean;
}

const levelColors = (level: number, max: number) => {
  const pct = level / max;
  if (pct >= 0.8) return { bar: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  if (pct >= 0.5) return { bar: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  return { bar: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
};

const levelLabels = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

const SkillBar: React.FC<SkillBarProps> = ({ skillName, level, maxLevel = 5, showLevel = true }) => {
  const pct = Math.min((level / maxLevel) * 100, 100);
  const colors = levelColors(level, maxLevel);

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0' }}>{skillName}</span>
        {showLevel && (
          <span style={{ fontSize: '0.75rem', color: colors.bar, fontWeight: 600 }}>
            {level}/{maxLevel} • {levelLabels[level] || ''}
          </span>
        )}
      </div>
      <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${colors.bar}cc, ${colors.bar})`,
          borderRadius: '99px',
          transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 8px ${colors.bar}66`,
        }} />
      </div>
    </div>
  );
};

export default SkillBar;
