import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const DEPARTMENTS = ['Engineering', 'Data Science', 'Design', 'Marketing', 'Product'];

interface Insights {
  teamStrengths: string[];
  criticalGaps: string[];
  hiringRecommendations: string[];
  projectReadiness: { score: number; assessment: string };
  ninetyDayPlan: { day: string; action: string }[];
}

const TeamInsights: React.FC = () => {
  const [dept, setDept] = useState(DEPARTMENTS[0]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/ai/team-insights/${dept}`);
      setInsights(res.data.insights);
      toast.success('✨ Team Insights Generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate team insights');
    } finally {
      setLoading(false);
    }
  };

  const readinessColor = insights?.projectReadiness?.score
    ? insights.projectReadiness.score >= 70 ? '#10b981' : insights.projectReadiness.score >= 40 ? '#f59e0b' : '#ef4444'
    : '#6366f1';

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          AI <span className="gradient-text">Team Insights</span>
        </h1>
        <p style={{ color: '#94a3b8' }}>Get AI-powered team performance analysis and recommendations</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="form-input" style={{ width: 'auto' }}>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button className="btn-primary" onClick={fetchInsights} disabled={loading} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing...</> : '✨ Generate Team Insights'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1.25rem', height: 140, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      )}

      {insights && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top row: strengths + gaps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '3px solid #10b981' }}>
              <h3 style={{ color: '#10b981', fontWeight: 700, marginBottom: '0.75rem' }}>💪 Team Strengths</h3>
              {insights.teamStrengths?.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: '0.875rem' }}>
                  ✅ {s}
                </motion.div>
              ))}
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '3px solid #ef4444' }}>
              <h3 style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.75rem' }}>⚠️ Critical Gaps</h3>
              {insights.criticalGaps?.map((g, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: '0.875rem' }}>
                  ❌ {g}
                </motion.div>
              ))}
            </div>

            {/* Hiring recommendations */}
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '3px solid #f59e0b' }}>
              <h3 style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '0.75rem' }}>🎯 Hiring Recommendations</h3>
              {insights.hiringRecommendations?.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: '0.875rem' }}>
                  👤 {r}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Project readiness */}
          {insights.projectReadiness && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#e2e8f0' }}>🚀 Project Readiness</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: readinessColor }}>{insights.projectReadiness.score}%</div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${insights.projectReadiness.score}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                      style={{ height: '100%', background: `linear-gradient(90deg, ${readinessColor}, ${readinessColor}99)`, borderRadius: 6 }}
                    />
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{insights.projectReadiness.assessment}</p>
                </div>
              </div>
            </div>
          )}

          {/* 90-day plan */}
          {insights.ninetyDayPlan && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#e2e8f0' }}>📅 90-Day Improvement Plan</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {insights.ninetyDayPlan.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                    style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 10, padding: '1rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{step.day}</div>
                    <p style={{ color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5 }}>{step.action}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!insights && !loading && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <p style={{ color: '#94a3b8' }}>Select a department and click "Generate Team Insights" to get AI analysis</p>
        </div>
      )}
    </div>
  );
};

export default TeamInsights;
