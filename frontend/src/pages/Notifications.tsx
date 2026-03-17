import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Notif {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_STYLES: Record<string, { color: string; icon: string }> = {
  gap_alert: { color: '#ef4444', icon: '⚠️' },
  skill_update: { color: '#10b981', icon: '🎯' },
  learning: { color: '#6366f1', icon: '📚' },
  team: { color: '#f59e0b', icon: '👥' },
  ai_ready: { color: '#8b5cf6', icon: '🤖' },
};

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/notifications/${user.id}`)
      .then((res) => setNotifs(res.data))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const clearAll = async () => {
    if (!user?.id) return;
    try {
      await api.delete(`/notifications/clear/${user.id}`);
      setNotifs([]);
      toast.success('All notifications cleared');
    } catch { toast.error('Failed to clear notifications'); }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            <span className="gradient-text">Notifications</span>
          </h1>
          <p style={{ color: '#94a3b8' }}>{notifs.filter((n) => !n.isRead).length} unread</p>
        </div>
        {notifs.length > 0 && (
          <button onClick={clearAll} style={{ padding: '0.4rem 1rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem' }}>
            🗑 Clear All
          </button>
        )}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>}

      <AnimatePresence>
        {notifs.map((n) => {
          const style = TYPE_STYLES[n.type] || { color: '#94a3b8', icon: '🔔' };
          return (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => !n.isRead && markRead(n._id)}
              className="glass-card"
              style={{ padding: '1rem 1.25rem', marginBottom: '0.5rem', cursor: n.isRead ? 'default' : 'pointer', borderLeft: `3px solid ${style.color}`, opacity: n.isRead ? 0.6 : 1 }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.25rem' }}>{style.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{n.title}</span>
                    {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: style.color, flexShrink: 0, marginTop: 4 }} />}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>{n.message}</p>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {!loading && notifs.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <p style={{ color: '#94a3b8' }}>No notifications yet</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
