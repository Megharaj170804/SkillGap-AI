import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'positive';
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  message: string;
  time: string;
}

const ManagerAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/manager/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load alerts', err);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const dismiss = async (id: string) => {
    try {
      await api.delete(`/manager/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Alert dismissed');
    } catch (err) {
      console.error('Failed to dismiss alert', err);
      toast.error('Failed to dismiss alert');
    }
  };

  const typeStyle = (t: string) => ({
    critical: { icon: '🚨', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', badge: 'rgba(239, 68, 68, 0.2)' },
    warning: { icon: '⚠️', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d', badge: 'rgba(245, 158, 11, 0.2)' },
    info: { icon: 'ℹ️', bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.3)', color: '#7dd3fc', badge: 'rgba(56, 189, 248, 0.2)' },
    positive: { icon: '✅', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7', badge: 'rgba(16, 185, 129, 0.2)' },
  }[t] as any || {});

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  if (loading) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading alerts...</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Alerts <span className="gradient-text">&amp; Notifications</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>{alerts.length} active alerts — {criticalCount} critical</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Critical', count: alerts.filter(a => a.severity === 'critical').length, color: '#ef4444' },
          { label: 'Warning', count: alerts.filter(a => a.severity === 'warning').length, color: '#f59e0b' },
          { label: 'Info', count: alerts.filter(a => a.severity === 'info').length, color: '#38bdf8' },
          { label: 'Positive', count: alerts.filter(a => a.severity === 'positive').length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence>
          {alerts.map(alert => {
            const ts = typeStyle(alert.severity);
            return (
              <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0, overflow: 'hidden' }}
                style={{ background: ts.bg, border: `1px solid ${ts.border}`, borderRadius: '14px', padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{ts.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: ts.color }}>SYSTEM_ALERT</span>
                      <span style={{ background: ts.badge, color: ts.color, padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', flexShrink: 0 }}>{alert.time}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'white' }}>
                      {alert.employeeAvatar}
                    </div>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{alert.employeeName}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5 }}>{alert.message}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button onClick={() => toast('Action flow coming soon', { icon: 'ℹ️' })} style={{ background: ts.badge, border: `1px solid ${ts.border}`, color: ts.color, padding: '0.35rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Take Action</button>
                    <button onClick={() => dismiss(alert.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', padding: '0.35rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Dismiss</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8' }}>All clear! No active alerts.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerAlerts;
