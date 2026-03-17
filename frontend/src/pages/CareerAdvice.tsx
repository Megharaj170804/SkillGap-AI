import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

interface Advice {
  strengths: string[];
  improvements: string[];
  uniqueInsight: string;
  motivationalMessage: string;
}

const SkeletonCard = ({ color }: { color: string }) => (
  <div style={{ background: `rgba(${color}, 0.06)`, borderRadius: 12, padding: '1.25rem', animation: 'pulse 1.5s infinite' }}>
    <div style={{ height: 14, width: '50%', background: `rgba(${color}, 0.1)`, borderRadius: 8, marginBottom: 8 }} />
    <div style={{ height: 12, width: '80%', background: `rgba(${color}, 0.06)`, borderRadius: 8 }} />
  </div>
);

interface Props { employeeId?: string; }

const CareerAdvice: React.FC<Props> = ({ employeeId: propId }) => {
  const { user } = useAuth();
  const { id: routeId } = useParams<{ id: string }>();
  const empId = routeId || propId || user?.employeeRef;
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);

  const fetchAdvice = async () => {
    if (!empId) { toast.error('Employee profile not linked.'); return; }
    setLoading(true);
    try {
      const res = await api.post(`/ai/career-advice/${empId}`);
      setAdvice(res.data.advice);
      setCached(res.data.cached || false);
      if (!res.data.cached) toast.success('✨ Career Advice Generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate advice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          AI <span className="gradient-text">Career Advice</span>
        </h1>
        <p style={{ color: '#94a3b8' }}>Get personalized career guidance powered by AI</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <button className="btn-primary" onClick={fetchAdvice} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing...</> : '✨ Get AI Career Advice'}
        </button>
        {cached && <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: 20 }}>Cached (24h)</span>}
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <SkeletonCard color="16,185,129" />
          <SkeletonCard color="245,158,11" />
          <SkeletonCard color="99,102,241" />
        </div>
      )}

      {advice && !loading && (
        <AnimatePresence>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Strengths */}
            {advice.strengths?.map((s, i) => (
              <motion.div key={`s-${i}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.5rem' }}>
                  💪 Strength {i + 1}
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.875rem', lineHeight: 1.5 }}>{s}</p>
              </motion.div>
            ))}

            {/* Improvements */}
            {advice.improvements?.map((imp, i) => (
              <motion.div key={`imp-${i}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 3) * 0.15 }}
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.5rem' }}>
                  🎯 Improve {i + 1}
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.875rem', lineHeight: 1.5 }}>{imp}</p>
              </motion.div>
            ))}

            {/* Unique Insight */}
            {advice.uniqueInsight && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                style={{ gridColumn: '1/-1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.5rem' }}>
                  ✨ Unique Career Insight
                  <span style={{ marginLeft: 8, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.65rem', color: 'white' }}>AI Generated</span>
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6 }}>{advice.uniqueInsight}</p>
              </motion.div>
            )}
          </div>

          {/* Motivational message */}
          {advice.motivationalMessage && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚀</div>
              <p style={{ color: '#e2e8f0', fontSize: '1rem', lineHeight: 1.7, fontStyle: 'italic' }}>{advice.motivationalMessage}</p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(advice.motivationalMessage || '');
                  toast.success('Copied to clipboard!');
                }}
                style={{ marginTop: '1rem', padding: '0.4rem 1rem', borderRadius: 8, border: '1px solid rgba(99,102,241,0.4)', background: 'transparent', color: '#818cf8', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                📋 Share
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {!advice && !loading && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <p style={{ color: '#94a3b8' }}>Click "Get AI Career Advice" to receive personalized guidance</p>
        </div>
      )}
    </div>
  );
};

export default CareerAdvice;
