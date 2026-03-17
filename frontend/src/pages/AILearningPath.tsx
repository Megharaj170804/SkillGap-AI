import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useParams } from 'react-router-dom';

interface WeekPlan {
  weekNumber: number;
  focusSkill: string;
  learningActivity: string;
  resources: string[];
  expectedOutcome: string;
}

const SkeletonWeek = () => (
  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1.25rem', marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }}>
    <div style={{ height: 16, width: '40%', background: 'rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 8 }} />
    <div style={{ height: 12, width: '70%', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
  </div>
);

interface Props { employeeId?: string; }

const AILearningPath: React.FC<Props> = ({ employeeId: propId }) => {
  const { user } = useAuth();
  const { id: routeId } = useParams<{ id: string }>();
  const empId = routeId || propId || user?.employeeRef;
  const [learningPath, setLearningPath] = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedWeeks, setCompletedWeeks] = useState<Set<number>>(new Set());
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [cached, setCached] = useState(false);

  useSocket({
    employeeId: empId,
    events: {
      learning_path_updated: (_data: unknown) => {
        toast.success('🤖 Learning path updated!');
        fetchPath(true);
      },
    },
  });

  const fetchPath = async (force = false) => {
    if (!empId) return;
    if (!force && learningPath.length > 0) return;
    setLoading(true);
    try {
      const res = await api.post(`/ai/learning-path/${empId}`);
      const path = Array.isArray(res.data.learningPath) ? res.data.learningPath : [];
      setLearningPath(path);
      setCached(res.data.cached || false);
      if (!res.data.cached) toast.success('✨ AI Learning Path Generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate learning path');
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (n: number) => setOpenWeek(openWeek === n ? null : n);
  const toggleComplete = (n: number) => {
    setCompletedWeeks((prev) => {
      const s = new Set(prev);
      s.has(n) ? s.delete(n) : s.add(n);
      return s;
    });
  };

  const progress = learningPath.length > 0 ? Math.round((completedWeeks.size / learningPath.length) * 100) : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          AI <span className="gradient-text">Learning Path</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Your personalized 12-week skill development journey</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          onClick={() => fetchPath(true)}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Generating...</> : '✨ Generate AI Learning Path'}
        </button>
        {cached && <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: 20 }}>Cached result (24h)</span>}
        {learningPath.length > 0 && (
          <span style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>✅ {completedWeeks.size}/{learningPath.length} weeks complete</span>
        )}
      </div>

      {/* Progress bar */}
      {learningPath.length > 0 && (
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Overall Progress</span>
            <span style={{ color: '#6366f1', fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4 }}
            />
          </div>
        </div>
      )}

      {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonWeek key={i} />)}

      <AnimatePresence>
        {learningPath.map((week, idx) => (
          <motion.div
            key={week.weekNumber || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card"
            style={{ marginBottom: '0.75rem', overflow: 'hidden' }}
          >
            <div
              onClick={() => toggleWeek(week.weekNumber)}
              style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: completedWeeks.has(week.weekNumber) ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white'
              }}>
                {completedWeeks.has(week.weekNumber) ? '✓' : `W${week.weekNumber}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>Week {week.weekNumber}: {week.focusSkill}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>{week.learningActivity}</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6366f1' }}>{openWeek === week.weekNumber ? '▲' : '▼'}</span>
            </div>

            <AnimatePresence>
              {openWeek === week.weekNumber && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ padding: '0 1.25rem 1.25rem' }}
                >
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      <strong style={{ color: '#e2e8f0' }}>Expected Outcome:</strong> {week.expectedOutcome}
                    </p>
                    {week.resources && week.resources.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c4b5fd', marginBottom: '0.4rem' }}>📚 Resources:</p>
                        {week.resources.map((r, i) => (
                          <div key={i} style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '0.25rem 0', paddingLeft: '1rem' }}>• {r}</div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => toggleComplete(week.weekNumber)}
                      style={{
                        marginTop: '1rem', padding: '0.4rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                        background: completedWeeks.has(week.weekNumber) ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                        color: completedWeeks.has(week.weekNumber) ? '#fca5a5' : '#6ee7b7',
                      }}
                    >
                      {completedWeeks.has(week.weekNumber) ? '↩ Mark Incomplete' : '✅ Mark Complete'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {!loading && learningPath.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
          <p style={{ color: '#94a3b8' }}>Click "Generate AI Learning Path" to get your personalized 12-week plan</p>
        </div>
      )}
    </div>
  );
};

export default AILearningPath;
