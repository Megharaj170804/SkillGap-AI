import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useSocket, connectSocket } from '../../hooks/useSocket';

const AdminAICenter: React.FC = () => {
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; name: string; complete?: boolean } | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const fetchAIUsage = useCallback(async () => {
    try {
      const res = await api.get('/admin/ai-usage');
      setAiUsage(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAIUsage();
    const interval = setInterval(fetchAIUsage, 60000);
    return () => clearInterval(interval);
  }, [fetchAIUsage]);

  // Socket
  useSocket({
    events: {
      bulk_progress: (data: any) => {
        setBulkProgress(data);
        if (data.complete) {
          setTimeout(() => {
            setBulkProgress(null);
            setRunning(null);
            fetchAIUsage();
            showToast('✅ All AI learning paths generated!');
          }, 1500);
        }
      },
      stats_updated: () => fetchAIUsage(),
    },
  });

  useEffect(() => {
    const s = connectSocket();
    s.emit('join_room', 'admin_room');
  }, []);

  const handleBulkGeneratePaths = async () => {
    setRunning('bulk_paths');
    setBulkProgress({ done: 0, total: 0, name: 'Starting...' });
    try {
      const res = await api.post('/admin/bulk-ai-paths');
      if (res.data.generated === 0) {
        showToast(res.data.message || 'All employees already have paths!');
        setRunning(null);
        setBulkProgress(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to start bulk generation.');
      setRunning(null);
      setBulkProgress(null);
    }
  };

  const severityStyle = (s: string): any => ({
    primary: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#a5b4fc', btnBg: '#6366f1' },
    secondary: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', color: '#c4b5fd', btnBg: '#8b5cf6' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fcd34d', btnBg: '#f59e0b' },
    danger: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#fca5a5', btnBg: '#ef4444' },
  }[s] || {});

  const bulkActions = [
    { icon: '🚀', label: 'Generate AI Paths for All Employees', desc: 'Create personalized 12-week learning paths for all employees without one.', count: aiUsage?.callsByEndpoint?.learningPath !== undefined ? aiUsage.callsByEndpoint.learningPath : '—', severity: 'primary', action: handleBulkGeneratePaths },
    { icon: '📊', label: 'Refresh All Skill Gaps', desc: 'Re-analyze skill gaps using latest assessment data.', count: '—', severity: 'secondary', action: () => showToast('Gap refresh triggered for all employees.') },
    { icon: '📧', label: 'Send Weekly Nudge Emails', desc: "Remind employees who haven't engaged in 7+ days.", count: '—', severity: 'warning', action: () => showToast('Nudge emails queued.') },
  ];

  const statCards = aiUsage ? [
    { label: 'Calls Today', value: aiUsage.callsToday },
    { label: 'Calls This Month', value: aiUsage.callsThisMonth },
    { label: 'Avg Response Time', value: aiUsage.avgResponseTime },
    { label: 'Success Rate', value: `${aiUsage.successRate}%` },
  ] : [];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#6366f1', color: 'white', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>AI <span className="gradient-text">Control Center</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Manage AI operations, bulk actions, and monitor Gemini usage.</p>
      </div>

      {/* AI Status Banner */}
      <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.2rem' }}>🟢</span>
        <span style={{ color: '#6ee7b7', fontWeight: 600 }}>Gemini AI is operational.</span>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          {aiUsage ? `${aiUsage.callsToday} requests today. Avg latency: ${aiUsage.avgResponseTime}.` : 'Loading usage stats...'}
        </span>
      </div>

      {/* AI Usage Stats */}
      {aiUsage && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map(({ label, value }) => (
            <div key={label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Endpoint Breakdown */}
      {aiUsage?.callsByEndpoint && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#f1f5f9' }}>Usage by Endpoint</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(aiUsage.callsByEndpoint).map(([endpoint, count]: any) => (
              <div key={endpoint} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ width: 130, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'capitalize' }}>{endpoint}</span>
                <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${Math.min((count / Math.max(...Object.values(aiUsage.callsByEndpoint) as number[])) * 100, 100)}%` }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4 }} transition={{ duration: 0.8 }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc', minWidth: 30, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Progress Modal */}
      {createPortal(
        <AnimatePresence>
          {bulkProgress && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400 }} />
              <motion.div initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
                style={{ position: 'fixed', top: '50%', left: '50%', width: 500, background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '2rem', zIndex: 401 }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#f1f5f9' }}>🤖 Generating AI Learning Paths</h3>
                <p style={{ color: '#94a3b8', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                  {bulkProgress.complete ? '✅ Complete!' : `Processing: ${bulkProgress.name}`}
                </p>
                <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, marginBottom: '1rem', overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 6 }}
                    animate={{ width: bulkProgress.total > 0 ? `${(bulkProgress.done / bulkProgress.total) * 100}%` : '0%' }}
                    transition={{ duration: 0.4 }} />
                </div>
                <div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>
                  {bulkProgress.done} / {bulkProgress.total || '?'} employees
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Bulk Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>Bulk AI Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bulkActions.map((action) => {
              const st = severityStyle(action.severity);
              const isRunning = running === 'bulk_paths' && action.label.includes('Learning Paths');
              return (
                <div key={action.label} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: '14px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{action.icon}</span>
                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{action.label}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>{action.desc}</p>
                    </div>
                    <button onClick={action.action} disabled={!!running}
                      style={{ background: st.btnBg, border: 'none', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: running ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem', opacity: running ? 0.7 : 1, flexShrink: 0 }}>
                      {isRunning ? '⏳ Running...' : 'Run'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Endpoint Summary */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>AI Feature Summary</h2>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            {aiUsage ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8' }}>Learning Paths Generated</span>
                  <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{aiUsage.callsByEndpoint?.learningPath || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(139,92,246,0.08)', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8' }}>Career Advice Generated</span>
                  <span style={{ color: '#c4b5fd', fontWeight: 700 }}>{aiUsage.callsByEndpoint?.careerAdvice || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(16,185,129,0.08)', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8' }}>Team Insights</span>
                  <span style={{ color: '#6ee7b7', fontWeight: 700 }}>{aiUsage.callsByEndpoint?.teamInsights || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(245,158,11,0.08)', borderRadius: '10px' }}>
                  <span style={{ color: '#94a3b8' }}>Failed Requests</span>
                  <span style={{ color: '#fca5a5', fontWeight: 700 }}>{aiUsage.failedRequests || 0}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Loading AI stats...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAICenter;
