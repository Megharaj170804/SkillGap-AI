import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EmployeeCareer: React.FC = () => {
  const { user } = useAuth();
  const empId = (user as any)?.employeeRef;
  const [loading, setLoading] = useState(false);
  const saved: string[] = [
    "Your strong frontend skills make you a natural fit for full-stack leadership. Focus on backend architecture to unlock senior roles.",
    "Your ability to pick up new frameworks quickly is a competitive edge — use it to specialize in emerging tech like edge computing or WebAssembly.",
  ];

  const generate = async () => {
    setLoading(true);
    try {
      await api.get(`/ai/career-advice/${empId}`);
    } catch { /* fallback mock */ } finally { setLoading(false); }
  };

  const mockAdvice = {
    strengths: ['Strong React & TypeScript expertise', 'Fast learner with demonstrated versatility', 'Consistent code quality'],
    improvements: ['System design & distributed systems', 'Cloud platform depth (AWS/GCP)', 'Leadership & cross-functional communication'],
    nextSteps: ['Complete the "AWS Solutions Architect" path within 2 months', 'Contribute to one open-source project this quarter', 'Lead one team feature from design to deployment'],
    insight: "Based on your skill trajectory and department benchmarks, you are on track to qualify for a Senior Frontend Engineer role within 6–8 months if you close your cloud and system design gaps.",
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>AI <span className="gradient-text">Career Advisor</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Personalized AI insights on your career trajectory.</p>
      </div>

      {/* Generate Panel */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
        <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>Get Your Personalized Career Analysis</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>Gemini AI analyzes your skills, gaps, and target role to generate a tailored career roadmap.</p>
        <button onClick={generate} disabled={loading} className="btn-primary" style={{ minWidth: 220 }}>
          {loading ? '⏳ Analyzing your profile...' : '✨ Generate Career Advice'}
        </button>
      </div>

      {/* Advice Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', borderTop: '3px solid #10b981' }}>
          <h3 style={{ fontWeight: 700, color: '#10b981', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💪 Your Strengths</h3>
          {mockAdvice.strengths.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{s}</span>
            </div>
          ))}
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', borderTop: '3px solid #f59e0b' }}>
          <h3 style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🎯 Areas to Improve</h3>
          {mockAdvice.improvements.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{s}</span>
            </div>
          ))}
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', borderTop: '3px solid #6366f1' }}>
          <h3 style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🚀 Actionable Next Steps</h3>
          {mockAdvice.nextSteps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insight Banner */}
      <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '2rem' }}>💡</span>
        <div>
          <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.5rem' }}>AI Insight</div>
          <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.7 }}>{mockAdvice.insight}</p>
        </div>
      </div>

      {/* Saved Insights History */}
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>📌 Saved Insights</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {saved.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
              className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem' }}>📝</span>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6, flex: 1 }}>{s}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeCareer;
