import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';

interface EmployeeMetrics {
  currentRole: string;
  targetRole: string;
  department: string;
  skillsCount: number;
}

interface AnalysisData {
  gapScore: number;
  missingCount: number;
  weakCount: number;
  strongCount: number;
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<EmployeeMetrics | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  const empId = (user as any)?.employeeRef;

  const loadData = async () => {
    if (!empId) return;
    try {
      const empRes = await api.get(`/employees/${empId}`);
      const anRes = await api.get(`/analysis/employee/${empId}`).catch((err) => {
        // Handle 400 (no target role) or 404 (role not in matrix)
        if (err.response?.status === 400 || err.response?.status === 404) {
          return { data: null };
        }
        throw err;
      });

      const emp = empRes.data;
      setMetrics({
        currentRole: emp.currentRole || 'N/A',
        targetRole: emp.targetRole || 'Not Set',
        department: emp.department || 'N/A',
        skillsCount: emp.skills?.length || 0,
      });

      if (anRes.data) {
        setAnalysis({
          gapScore: anRes.data.gapScore,
          missingCount: anRes.data.missingSkills?.length || 0,
          weakCount: anRes.data.weakSkills?.length || 0,
          strongCount: anRes.data.strongSkills?.length || 0,
        });
      }
    } catch {
      // silent fail or log
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [empId]);

  // Real-time updates
  useSocket({
    employeeId: empId,
    events: {
      skill_updated: loadData,
      gap_analysis_ready: loadData,
      learning_path_updated: loadData,
    },
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

  const score = analysis?.gapScore || 0;
  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  const hasMatrixError = metrics?.targetRole !== 'Not Set' && !analysis && !loading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {hasMatrixError && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1rem 1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <h4 style={{ color: '#ef4444', margin: 0, fontWeight: 700 }}>Action Required by Admin</h4>
            <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Your target role <strong>"{metrics?.targetRole}"</strong> is not yet defined in the platform's skills matrix. Analysis is unavailable.</p>
          </div>
        </motion.div>
      )}

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '2rem', borderRadius: 16, background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.25rem' }}>Welcome, {user?.name}! 👋</h2>
          <p style={{ color: '#c4b5fd', fontSize: '0.9rem', margin: 0 }}>{metrics?.currentRole} · {metrics?.department}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 0.25rem 0' }}>Target Role</p>
          <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, fontWeight: 700, fontSize: '0.9rem' }}>
            {metrics?.targetRole}
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            {analysis && <span className="pulse-dot" style={{ background: scoreColor }} />}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Readiness Score</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor, margin: 0 }}>
            {analysis ? `${score}%` : 'N/A'}
          </h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>🎯</span>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Skills</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1', margin: 0 }}>{metrics?.skillsCount}</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>⚠️</span>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Skill Gaps</p>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', margin: 0 }}>
            {analysis ? analysis.missingCount + analysis.weakCount : 'N/A'}
          </h3>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginTop: '1rem', marginBottom: '0.5rem' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <ActionCard
          icon="📚"
          title="AI Learning Path"
          desc={hasMatrixError ? "Requires role matrix to be set up first." : "Get a personalized 12-week plan to reach your target role."}
          gradient="linear-gradient(135deg, #4f46e5, #7c3aed)"
          onClick={() => !hasMatrixError && navigate(`/ai/learning-path/${empId}`)}
          delay={0.4}
          disabled={hasMatrixError}
        />
        <ActionCard
          icon="💡"
          title="Career Advice"
          desc="AI-generated strengths, areas to improve, and unique insights."
          gradient="linear-gradient(135deg, #059669, #10b981)"
          onClick={() => navigate(`/ai/career-advice/${empId}`)}
          delay={0.5}
        />
        <ActionCard
          icon="🗺️"
          title="Project Skill Mapper"
          desc="Analyze project descriptions to find the top 10 required skills."
          gradient="linear-gradient(135deg, #d97706, #f59e0b)"
          onClick={() => navigate('/project-mapper')}
          delay={0.6}
        />
        <ActionCard
          icon="👤"
          title="Update Profile"
          desc="Add new skills and experience to improve your readiness score."
          gradient="rgba(255,255,255,0.05)"
          border="1px solid rgba(255,255,255,0.1)"
          onClick={() => navigate('/profile')}
          delay={0.7}
        />
      </div>
    </div>
  );
};

const ActionCard = ({ icon, title, desc, gradient, border, onClick, delay, disabled }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    whileHover={disabled ? {} : { scale: 1.02, y: -4 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    onClick={onClick}
    style={{
      background: disabled ? 'rgba(255,255,255,0.05)' : gradient, 
      border: border || 'none', borderRadius: 16, padding: '1.5rem',
      cursor: disabled ? 'not-allowed' : 'pointer', 
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      boxShadow: disabled ? 'none' : '0 10px 30px rgba(0,0,0,0.2)',
      opacity: disabled ? 0.6 : 1,
    }}
  >
    <div style={{ fontSize: '2rem' }}>{icon}</div>
    <div style={{ fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>{title}</div>
    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.5 }}>{desc}</div>
  </motion.div>
);

export default EmployeeDashboard;
