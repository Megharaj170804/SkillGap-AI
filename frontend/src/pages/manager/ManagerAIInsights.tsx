import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ManagerAIInsights: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('What are the biggest skill gaps in my team and how should I address them?');

  const mockInsights = [
    "🔍 **Critical Finding**: 2 out of 4 team members have Docker proficiency below 50%, creating a deployment bottleneck.",
    "📈 **Positive Trend**: Jane Smith's readiness score increased from 72% to 82% in Q1, largely due to consistent engagement with AI-generated learning paths.",
    "⚠️ **Alert**: Bob Wilson has been inactive for 7 days. His skill readiness of 35% requires manager intervention.",
    "🎯 **Recommendation**: Prioritize AWS Cloud training — 3 upcoming projects require cloud deployment expertise not currently covered by 3 members.",
    "🚀 **Quick Win**: A 2-week 'Docker Fundamentals' sprint could lift team Docker coverage from 56% to ~75%, removing a major production risk.",
  ];

  const generateInsight = () => {
    setLoading(true);
    setInsight(null);
    setTimeout(() => {
      setInsight(mockInsights[Math.floor(Math.random() * mockInsights.length)]);
      setLoading(false);
    }, 2000);
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>AI Team <span className="gradient-text">Insights</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Get AI-powered analysis and recommendations for your team.</p>
      </div>

      {/* Generate Panel */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 700, fontSize: '1.1rem' }}>Ask Gemini AI About Your Team</h3>
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1rem', color: '#f1f5f9', outline: 'none', resize: 'vertical', fontSize: '0.9rem' }}
          />
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {['What skill gaps need attention?', 'Who is ready for promotion?', 'Plan a training sprint', 'Compare team to benchmarks'].map(q => (
              <button key={q} onClick={() => setPrompt(q)} style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#a5b4fc', padding: '0.35rem 0.85rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>{q}</button>
            ))}
          </div>
          <button onClick={generateInsight} disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start', minWidth: 180 }}>
            {loading ? '⏳ Analyzing...' : '🤖 Generate Insight'}
          </button>
        </div>

        {loading && (
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
            <div className="spinner" style={{ width: 20, height: 20 }} />
            Gemini is analyzing your team data...
          </div>
        )}

        {insight && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1.5rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🤖</div>
              <div style={{ color: '#e2e8f0', lineHeight: 1.7, fontSize: '0.95rem' }}>{insight}</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Saved Insights */}
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>Recent Insights</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { q: 'What are the biggest skill gaps in my team?', date: 'Mar 16, 2025', summary: 'AWS and Docker are the top critical gaps. 3 of 4 team members have under 50% coverage.' },
            { q: 'Who is ready for promotion?', date: 'Mar 14, 2025', summary: 'Jane Smith at 82% readiness is the strongest candidate for a Senior role promotion.' },
          ].map(ins => (
            <div key={ins.q} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💬</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{ins.date}</div>
                <div style={{ fontWeight: 600, color: '#a5b4fc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>"{ins.q}"</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{ins.summary}</div>
              </div>
              <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>View Full</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerAIInsights;
