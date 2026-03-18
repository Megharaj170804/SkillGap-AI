import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

interface Badge {
  id?: string;
  badgeId?: string;
  icon: string;
  title: string;
  description: string;
  color?: string;
  earnedAt?: string;
}

const EmployeeAchievements: React.FC = () => {
  const { user } = useAuth();
  const empId = (user as any)?.employeeRef;
  const [loading, setLoading] = useState(true);

  const [earned, setEarned] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [department, setDepartment] = useState('');
  
  const [showCelebration, setShowCelebration] = useState<Badge | null>(null);

  const loadData = async () => {
    try {
      const [achRes, leadRes] = await Promise.all([
        api.get(`/achievements/${empId}`),
        api.get(`/employee/leaderboard`)
      ]);
      setEarned(achRes.data.earned);
      setAllBadges(achRes.data.allBadges);
      setLeaderboard(leadRes.data.leaderboard);
      setDepartment(leadRes.data.department);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Run an implicit check
    api.post(`/achievements/check/${empId}`).catch(console.error);
    // eslint-disable-next-line
  }, []);

  useSocket({
    employeeId: empId,
    events: {
      achievement_unlocked: (data: Badge) => {
        setEarned(prev => [data, ...prev]);
        setShowCelebration(data);
        setTimeout(() => setShowCelebration(null), 5000);
      }
    }
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

  const earnedIds = earned.map(a => a.badgeId || a.title);
  const locked = allBadges.filter(a => !earnedIds.includes(a.id || '') && !earnedIds.includes(a.title));

  return (
    <div style={{ paddingBottom: '2rem', position: 'relative' }}>
      
      {/* Toast Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <div style={{ fontSize: '3rem' }}>{showCelebration.icon}</div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.2rem' }}>Achievement Unlocked!</div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.2rem' }}>{showCelebration.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>{showCelebration.description}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My <span className="gradient-text">Achievements</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>{earned.length} earned · {locked.length} locked</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Main Content Area */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{earned.length}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Earned</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                <span>Achievement Progress</span>
                <span>{earned.length} / {Math.max(earned.length, allBadges.length)}</span>
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (earned.length / Math.max(1, allBadges.length)) * 100)}%`, background: 'linear-gradient(to right, #6366f1, #8b5cf6)', borderRadius: 5, transition: 'width 1s ease' }} />
              </div>
            </div>
          </div>

          {/* Earned */}
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>🏆 Earned</h3>
          {earned.length === 0 && <p style={{ color: '#64748b' }}>No achievements earned yet. Keep learning!</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {earned.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
                className="glass-card" style={{ padding: '1.5rem', borderTop: `3px solid ${a.color || '#6366f1'}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -16, right: -16, fontSize: '4rem', opacity: 0.06 }}>{a.icon}</div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{a.icon}</div>
                <h4 style={{ margin: '0 0 0.4rem 0', fontWeight: 700, color: '#f1f5f9' }}>{a.title}</h4>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{a.description}</p>
                <div style={{ fontSize: '0.72rem', color: a.color || '#6366f1', fontWeight: 600 }}>🗓 Earned {a.earnedAt ? new Date(a.earnedAt).toLocaleDateString() : 'Recently'}</div>
              </motion.div>
            ))}
          </div>

          {/* Locked */}
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#64748b' }}>🔒 Locked</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {locked.map((a, _i) => (
              <div key={_i} className="glass-card" style={{ padding: '1.5rem', opacity: 0.5, filter: 'grayscale(0.6)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', filter: 'grayscale(1)' }}>{a.icon}</div>
                <h4 style={{ margin: '0 0 0.4rem 0', fontWeight: 700, color: '#94a3b8' }}>{a.title}</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>{a.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar area: Leaderboard */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏅</span> Team Leaderboard
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.5rem 0' }}>{department} Department</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {leaderboard.map((lb, idx) => {
                const isMe = lb._id === empId;
                return (
                  <div key={lb._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: isMe ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', border: isMe ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: idx === 0 ? '#fbbf24' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#b45309' : '#64748b', width: '20px', textAlign: 'center' }}>
                      {idx + 1}
                    </div>
                    <img src={lb.avatar} alt="Avatar" style={{ width: 36, height: 36, borderRadius: '50%', background: '#334155' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: isMe ? '#a5b4fc' : '#f1f5f9', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lb.name} {isMe && '(You)'}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lb.role}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>
                      {lb.points} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeAchievements;
