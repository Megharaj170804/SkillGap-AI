import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

interface Notif {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  gap_alert: '⚠️', skill_update: '🎯', learning: '📚', team: '👥', ai_ready: '🤖',
};

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter((n) => !n.isRead).length;

  const loadNotifs = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/notifications/${user.id}`);
      setNotifs(res.data.slice(0, 10));
    } catch { /* silent */ }
  };

  useEffect(() => {
    loadNotifs();
    // Auto-refresh every 30s
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useSocket({
    events: {
      skill_updated: () => { loadNotifs(); },
      gap_analysis_ready: () => { loadNotifs(); },
      learning_path_updated: () => { loadNotifs(); },
      new_employee_added: () => { loadNotifs(); },
      team_alert: () => { loadNotifs(); },
      nudge_received: (data: any) => { 
        loadNotifs(); 
        toast(`Learning Reminder: ${data.from} nudged you!`, { icon: '👋' });
      },
    },
  });

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
        title="Notifications"
      >
        <span style={{ fontSize: '1.25rem' }}>🔔</span>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              position: 'absolute', top: 'calc(100% + 12px)', right: 0, zIndex: 999,
              width: 320, maxHeight: 400, overflowY: 'auto',
              background: 'rgba(15,15,26,0.98)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14,
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem' }}>Notifications</span>
              <button onClick={() => navigate('/notifications')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.75rem' }}>See all</button>
            </div>

            {notifs.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No notifications</div>
            )}

            {notifs.map((n) => (
              <div
                key={n._id}
                onClick={() => markRead(n._id)}
                style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', opacity: n.isRead ? 0.6 : 1, background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}
              >
                <span style={{ fontSize: '1rem' }}>{TYPE_ICON[n.type] || '🔔'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.8rem', margin: 0 }}>{n.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>{n.message}</p>
                </div>
                {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
