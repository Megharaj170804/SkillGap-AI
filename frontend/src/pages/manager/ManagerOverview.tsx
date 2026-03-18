import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useManagerSocket } from '../../hooks/useManagerSocket';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ManagerOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, teamRes, feedRes] = await Promise.all([
        api.get('/manager/my-stats'),
        api.get('/manager/my-team'),
        api.get('/manager/activity-feed')
      ]);
      setStats(statsRes.data);
      setTeam(teamRes.data);
      setActivities(feedRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time integration
  useManagerSocket(
    user?.id, 
    user?.department, 
    (newAct: any) => {
      // activity_update
      setActivities(prev => [newAct, ...prev].slice(0, 20));
    }, 
    () => {
      // team_stats_updated - trigger re-fetch of stats
      api.get('/manager/my-stats').then(res => setStats(res.data));
    }
  );

  const handleNudge = async (employeeId: string) => {
    try {
      const res = await api.post(`/manager/nudge/${employeeId}`);
      toast.success(res.data.message || 'Nudge sent successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send nudge');
    }
  };

  const handleAIPath = async (_employeeId: string) => {
    // This could navigate to a detailed view or trigger an AI path generation
    toast('AI Path functionality coming soon', { icon: 'ℹ️' });
  };

  if (loading || !stats) {
    return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading dashboard...</div>;
  }

  const StatCard = ({ title, value, subtext, alert, color }: any) => (
    <div className="glass-card" style={{ padding: '1.5rem', border: alert ? '1px solid rgba(239, 68, 68, 0.4)' : '' }}>
      <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>{title}</h3>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: color || '#f1f5f9' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: alert ? '#fca5a5' : '#94a3b8', marginTop: '0.25rem', fontWeight: 500 }}>{subtext}</div>
    </div>
  );

  return (
    <div style={{ paddingBottom: '2rem' }}>
      
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))', border: '1px solid var(--border)', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#f1f5f9' }}>Good morning, {stats.managerName}! 👋</h1>
          <p style={{ color: '#c4b5fd', margin: '0.25rem 0 0 0' }}>Your team has {stats.teamSize} members.</p>
        </div>
        {stats.employeesNeedingAttentionToday > 0 && (
          <div>
            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {stats.employeesNeedingAttentionToday} employee{stats.employeesNeedingAttentionToday > 1 ? 's need' : ' needs'} attention today
            </span>
          </div>
        )}
      </motion.div>

      {/* Team Health Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Team Avg Readiness" value={`${stats.teamAvgReadiness}%`} subtext={`↑ ${stats.teamAvgReadinessChangeThisWeek}% this week`} color={stats.teamAvgReadiness >= 70 ? '#10b981' : stats.teamAvgReadiness >= 40 ? '#f59e0b' : '#ef4444'} />
        <StatCard title="On Track (>=70%)" value={stats.onTrackCount} subtext="Ready for promotion" color="#10b981" />
        <StatCard title="Needing Help (40-69%)" value={stats.needingHelpCount} subtext="Progressing slowly" color="#f59e0b" />
        <StatCard title="Critical (<40%)" value={stats.criticalCount} subtext="Action required" alert={stats.criticalCount > 0} color={stats.criticalCount > 0 ? "#ef4444" : "#94a3b8"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Members Grid */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>My Team Members</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {team.map(member => (
              <motion.div key={member._id} whileHover={{ y: -4 }} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {member.avatar}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>{member.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{member.currentRole} → <span style={{ color: '#6366f1', fontWeight: 600 }}>{member.targetRole}</span></div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#94a3b8' }}>Readiness Score</span>
                    <span style={{ fontWeight: 700, color: member.gapScore >= 70 ? '#10b981' : member.gapScore >= 40 ? '#f59e0b' : '#ef4444' }}>{member.gapScore}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${member.gapScore}%`, background: member.gapScore >= 70 ? '#10b981' : member.gapScore >= 40 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Top Gaps:</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {member.topGaps && member.topGaps.length > 0 ? member.topGaps.map((gap: string) => <span key={gap} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem' }}>{gap}</span>) : <span style={{ color: '#64748b', fontSize: '0.7rem' }}>None</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active {member.lastActiveText}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleNudge(member._id)} style={{ background: 'transparent', border: '1px solid var(--border)', color: '#94a3b8', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Nudge</button>
                    <button onClick={() => handleAIPath(member._id)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>{member.aiPathStatus === 'generated' ? 'View Path' : 'AI Path'}</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Activity & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: '#f1f5f9' }}>This Week's Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Courses Completed</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{stats.thisWeekCoursesCompleted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Hours Logged</span>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>{stats.thisWeekHoursLogged}h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Skills Improved</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{stats.thisWeekSkillsImproved}</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <span className="pulse-dot" style={{ background: '#10b981' }}></span> Live Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activities.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>No recent activity.</div>
              ) : activities.map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>
                    {act.employeeAvatar || 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}><span style={{ fontWeight: 600 }}>{act.employeeName}</span> {act.message}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>{act.timeAgo || new Date(act.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManagerOverview;
