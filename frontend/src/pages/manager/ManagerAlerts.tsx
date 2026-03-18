import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  member: string;
  detail: string;
  time: string;
  dismissed: boolean;
}

const mockAlerts: Alert[] = [
  { id: '1', type: 'critical', title: 'Inactive Member', member: 'Bob Wilson', detail: 'Bob has not logged in for 7 days. His readiness score is 35%—well below the team threshold.', time: '2 days ago', dismissed: false },
  { id: '2', type: 'critical', title: 'Critical Skill Gap Detected', member: 'John Doe', detail: 'John\'s AWS coverage is at 20%. Two upcoming projects require 70%+ AWS expertise.', time: '1 day ago', dismissed: false },
  { id: '3', type: 'warning', title: 'Learning Path Stalling', member: 'Alice Ray', detail: 'Alice has not progressed in her AWS Solutions Architect path for 5 days.', time: '5 days ago', dismissed: false },
  { id: '4', type: 'info', title: 'Goal Milestone Reached', member: 'Jane Smith', detail: 'Jane Smith reached an 80%+ readiness score milestone! Consider recognizing this achievement.', time: '3 days ago', dismissed: false },
];

const ManagerAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState(mockAlerts);

  const dismiss = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));

  const typeStyle = (t: string) => ({
    critical: { icon: '🚨', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', badge: 'rgba(239, 68, 68, 0.2)' },
    warning: { icon: '⚠️', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d', badge: 'rgba(245, 158, 11, 0.2)' },
    info: { icon: '✅', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7', badge: 'rgba(16, 185, 129, 0.2)' },
  }[t] as any || {});

  const active = alerts.filter(a => !a.dismissed);
  const dismissed = alerts.filter(a => a.dismissed);
  const criticalCount = active.filter(a => a.type === 'critical').length;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Alerts <span className="gradient-text">&amp; Notifications</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>{active.length} active alerts — {criticalCount} critical</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Critical', count: active.filter(a => a.type === 'critical').length, color: '#ef4444' },
          { label: 'Warning', count: active.filter(a => a.type === 'warning').length, color: '#f59e0b' },
          { label: 'Info', count: active.filter(a => a.type === 'info').length, color: '#10b981' },
          { label: 'Dismissed', count: dismissed.length, color: '#64748b' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence>
          {active.map(alert => {
            const ts = typeStyle(alert.type);
            return (
              <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0, overflow: 'hidden' }}
                style={{ background: ts.bg, border: `1px solid ${ts.border}`, borderRadius: '14px', padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{ts.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: ts.color }}>{alert.title}</span>
                      <span style={{ background: ts.badge, color: ts.color, padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                        {alert.type.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', flexShrink: 0 }}>{alert.time}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    👤 <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{alert.member}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5 }}>{alert.detail}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button style={{ background: ts.badge, border: `1px solid ${ts.border}`, color: ts.color, padding: '0.35rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Take Action</button>
                    <button onClick={() => dismiss(alert.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', padding: '0.35rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Dismiss</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {active.length === 0 && (
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
