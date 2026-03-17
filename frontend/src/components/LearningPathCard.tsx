import React from 'react';

interface LearningPathCardProps {
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  priority: string;
  isMissing?: boolean;
  courses: string[];
  estimatedWeeks: number;
}

const priorityBadge: Record<string, string> = {
  critical: 'badge-critical',
  important: 'badge-important',
  'good-to-have': 'badge-good-to-have',
};

const LearningPathCard: React.FC<LearningPathCardProps> = ({
  skillName, currentLevel, requiredLevel, priority, isMissing = false, courses, estimatedWeeks,
}) => {
  return (
    <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '0.75rem', transition: 'all 0.2s ease' }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', marginBottom: '0.3rem' }}>{skillName}</h4>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={priorityBadge[priority] || 'badge-important'}>{priority}</span>
            {isMissing ? (
              <span className="badge-missing">⚠ Missing</span>
            ) : (
              <span className="badge-weak">
                Level {currentLevel} → {requiredLevel} needed
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#6366f1' }}>{estimatedWeeks}w</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>est. weeks</div>
        </div>
      </div>

      {/* Level progress */}
      {!isMissing && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: '6px', borderRadius: '99px',
                background: i < currentLevel
                  ? (i < requiredLevel ? '#f59e0b' : '#10b981')
                  : i < requiredLevel
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(255,255,255,0.06)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            <span>Current: {currentLevel}/5</span>
            <span>Required: {requiredLevel}/5</span>
          </div>
        </div>
      )}

      {/* Courses */}
      <div>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Courses</p>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {courses.map((course, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <span style={{ color: '#6366f1', fontSize: '0.7rem' }}>▶</span>
              {course}
            </li>
          ))}
          {courses.length === 0 && <li style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No specific course found. Search online resources.</li>}
        </ul>
      </div>
    </div>
  );
};

export default LearningPathCard;
