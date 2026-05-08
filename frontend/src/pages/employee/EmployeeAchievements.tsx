import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

interface Certificate {
  _id: string;
  certificateType: string;
  message: string;
  achievementText: string;
  issuedAt: string;
  managerName?: string;
}

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
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activeTab, setActiveTab] = useState<'badges' | 'certificates'>('badges');
  
  const [showCelebration, setShowCelebration] = useState<Badge | null>(null);

  const loadData = async () => {
    try {
      const [achRes, leadRes, certRes] = await Promise.all([
        api.get(`/achievements/${empId}`),
        api.get(`/employee/leaderboard`),
        api.get(`/employee/certificates`)
      ]);
      setEarned(achRes.data.earned);
      setAllBadges(achRes.data.allBadges);
      setLeaderboard(leadRes.data.leaderboard);
      setDepartment(leadRes.data.department);
      setCertificates(certRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  useSocket({
    employeeId: empId,
    events: {
      achievement_unlocked: (data: Badge) => {
        setEarned(prev => [data, ...prev]);
        setShowCelebration(data);
        setTimeout(() => setShowCelebration(null), 5000);
      },
      certificate_received: (data: Certificate) => {
        setCertificates(prev => [data, ...prev]);
      }
    }
  });

  const printCertificate = (cert: Certificate) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    
    const certTypeLabel = cert.certificateType ? cert.certificateType.replace('_', ' ').toUpperCase() : 'AWARD';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${certTypeLabel}</title>
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f1f5f9; }
            .cert-container { background: #fff; padding: 3rem; border: 15px solid #1e293b; outline: 5px solid #6366f1; outline-offset: -10px; text-align: center; width: 700px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            h1 { color: #1e293b; font-size: 2.5rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 2px; }
            h2 { color: #6366f1; font-size: 1.5rem; margin-bottom: 2rem; font-weight: 600; }
            .recipient { font-size: 2rem; color: #0f172a; font-weight: 800; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.5rem; margin-bottom: 1.5rem; display: inline-block; min-width: 300px; }
            p { color: #64748b; font-size: 1.1rem; line-height: 1.6; margin-bottom: 1rem; }
            .achievement { font-weight: 700; color: #10b981; font-size: 1.2rem; margin: 1.5rem 0; padding: 1rem; background: rgba(16,185,129,0.1); border-radius: 8px; }
            .footer { display: flex; justify-content: space-between; margin-top: 3rem; text-align: left; }
            .signature-line { border-top: 1px solid #94a3b8; width: 200px; padding-top: 0.5rem; font-size: 0.9rem; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="cert-container">
            <h1>Certificate of Recognition</h1>
            <h2>${certTypeLabel}</h2>
            <p>This certificate is proudly presented to</p>
            <div class="recipient">${(user as any)?.name || 'Employee'}</div>
            <div class="achievement">"${cert.achievementText}"</div>
            <p>"${cert.message}"</p>
            <div class="footer">
              <div class="signature-line">
                <div>Date</div>
                <div style="color: #0f172a; font-weight: 700; margin-top: 0.25rem">${new Date(cert.issuedAt).toLocaleDateString()}</div>
              </div>
              <div class="signature-line">
                <div>Authorized Signature</div>
                <div style="color: #0f172a; font-weight: 700; margin-top: 0.25rem">Management Team</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My <span className="gradient-text">Achievements</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>{earned.length} badges earned · {certificates.length} certificates</p>
        </div>
        
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '10px' }}>
          <button 
            onClick={() => setActiveTab('badges')}
            style={{ padding: '0.5rem 1.5rem', background: activeTab === 'badges' ? 'rgba(99,102,241,0.2)' : 'transparent', color: activeTab === 'badges' ? '#818cf8' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
          >
            Badges
          </button>
          <button 
            onClick={() => setActiveTab('certificates')}
            style={{ padding: '0.5rem 1.5rem', background: activeTab === 'certificates' ? 'rgba(16,185,129,0.2)' : 'transparent', color: activeTab === 'certificates' ? '#34d399' : '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
          >
            Certificates
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Main Content Area */}
        <div>
          {activeTab === 'badges' ? (
            <>
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
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {certificates.length === 0 && (
                  <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                    <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>No Certificates Yet</h3>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Keep improving your skills! Your manager can award certificates for your achievements.</p>
                  </div>
                )}
                {certificates.map((cert) => (
                  <motion.div key={cert._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(15,23,42,0) 100%)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '2.5rem' }}>🏆</div>
                      <div style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {cert.certificateType ? cert.certificateType.replace('_', ' ') : 'Recognition'}
                      </div>
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>Certificate of Recognition</h4>
                    <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, margin: '0 0 1rem 0' }}>"{cert.achievementText}"</p>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', margin: '0 0 1.5rem 0', flex: 1 }}>"{cert.message}"</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Issued <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{new Date(cert.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={() => printCertificate(cert)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        🖨️ Print
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
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
