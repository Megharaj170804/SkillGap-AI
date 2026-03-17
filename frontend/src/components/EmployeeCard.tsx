import React from 'react';
import { useNavigate } from 'react-router-dom';
import GapChart from './GapChart';

interface EmployeeCardProps {
  id: string;
  name: string;
  currentRole: string;
  targetRole?: string;
  department: string;
  gapScore?: number;
  topGaps?: string[];
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  id, name, currentRole, targetRole, department, gapScore, topGaps = [],
}) => {
  const navigate = useNavigate();
  const initial = name.charAt(0).toUpperCase();
  const departmentColors: Record<string, string> = {
    Engineering: '#6366f1',
    'Data Science': '#06b6d4',
    Design: '#f59e0b',
    Marketing: '#10b981',
    default: '#8b5cf6',
  };
  const deptColor = departmentColors[department] || departmentColors.default;

  return (
    <div
      className="glass-card"
      style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
      onClick={() => navigate(`/employees/${id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
          background: `${deptColor}22`,
          border: `2px solid ${deptColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', fontWeight: 700, color: deptColor,
        }}>{initial}</div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>{name}</h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{currentRole}</p>
          <span style={{ fontSize: '0.7rem', color: deptColor, fontWeight: 600 }}>{department}</span>
        </div>
        {gapScore !== undefined && (
          <div style={{ marginLeft: 'auto' }}>
            <GapChart gapScore={gapScore} size={64} />
          </div>
        )}
      </div>

      {/* Target role */}
      {targetRole && (
        <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Target:</span>
          <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>{targetRole}</span>
        </div>
      )}

      {/* Top gaps */}
      {topGaps.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Top Gaps</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {topGaps.map((gap, i) => (
              <span key={i} className="badge-missing" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>{gap}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCard;
