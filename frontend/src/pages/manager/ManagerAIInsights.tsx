import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ManagerAIInsights: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<any | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a fresh cache
    const fetchCache = async () => {
      try {
        const res = await api.get('/manager/team-insights-cache');
        if (res.data?.insights) {
          setInsight(res.data.insights);
          setGeneratedAt(res.data.generatedAt);
        }
      } catch (err) {
        console.error('Failed to check insights cache', err);
      }
    };
    fetchCache();
  }, []);

  const generateInsight = async () => {
    if (!user?.department) return toast.error('Department not found');
    setLoading(true);
    setInsight(null);
    try {
      const res = await api.post(`/ai/team-insights/${user.department}`);
      setInsight(res.data.insights);
      setGeneratedAt(new Date().toISOString());
      toast.success('Insights generated successfully');
    } catch (err) {
      console.error('Failed to generate insights', err);
      toast.error('Failed to generate AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>AI Team <span className="gradient-text">Insights</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Get AI-powered analysis and recommendations for your team based on real-time data.</p>
      </div>

      {/* Generate Panel */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 700, fontSize: '1.1rem' }}>Ask Gemini AI About Your Team</h3>
        
        {generatedAt && (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Last generated: {new Date(generatedAt).toLocaleString()}
          </p>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button onClick={generateInsight} disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start', minWidth: 220 }}>
            {loading ? '⏳ Analyzing Team Data...' : '🤖 Generate New Team Insights'}
          </button>
        </div>

        {loading && (
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
            <div className="spinner" style={{ width: 20, height: 20 }} />
            Gemini is analyzing your team's skills, gaps, and recent activities...
          </div>
        )}

        {insight && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>💪</div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#f1f5f9', fontSize: '1.05rem' }}>Team Strengths</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {insight.teamStrengths?.map((s: string, i: number) => <li key={i}>{s}</li>) || <li>No data</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>⚠️</div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#f1f5f9', fontSize: '1.05rem' }}>Critical Gaps</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {insight.criticalGaps?.map((g: string, i: number) => <li key={i}>{g}</li>) || <li>No data</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📅</div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#f1f5f9', fontSize: '1.05rem' }}>90-Day Action Plan</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {insight.ninetyDayPlan?.map((p: any, i: number) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                        <div style={{ fontWeight: 600, color: '#a5b4fc', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{p.day || p.timeframe}</div>
                        <div style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{p.action}</div>
                      </div>
                    )) || <div>No action plan generated.</div>}
                  </div>
                </div>
              </div>
            </div>

            {insight.hiringRecommendations && insight.hiringRecommendations.length > 0 && (
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>👥</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#f1f5f9', fontSize: '1.05rem' }}>Hiring Recommendations</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {insight.hiringRecommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {insight.projectReadiness && (
              <div style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                <strong>Project Readiness Score:</strong> <span style={{ color: insight.projectReadiness.score >= 80 ? '#10b981' : insight.projectReadiness.score >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{insight.projectReadiness.score}%</span> — {insight.projectReadiness.assessment}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ManagerAIInsights;
