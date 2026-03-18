import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../../hooks/useSocket';

const mockTeamMembers = [
  { id: '1', name: 'John Doe', avatar: 'J', currentRole: 'Junior Dev', targetRole: 'Senior Dev', gapScore: 45, topGaps: ['React', 'Node'], lastActive: '2 days' },
  { id: '2', name: 'Jane Smith', avatar: 'S', currentRole: 'Frontend Dev', targetRole: 'Tech Lead', gapScore: 82, topGaps: ['System Design'], lastActive: '1 hr' },
  { id: '3', name: 'Bob Wilson', avatar: 'B', currentRole: 'Backend Dev', targetRole: 'Staff Engineer', gapScore: 35, topGaps: ['K8s', 'AWS', 'Go'], lastActive: '1 week' },
  { id: '4', name: 'Alice Ray', avatar: 'A', currentRole: 'DevOps', targetRole: 'Site Reliability Eng', gapScore: 60, topGaps: ['Python', 'Terraform'], lastActive: '5 hrs' },
];

const mockActivities = [
  { id: 1, user: 'Jane Smith', action: 'completed React Advanced course', time: '1 hr ago', avatar: 'S' },
  { id: 2, user: 'John Doe', action: 'generated AI Learning Path', time: '1 day ago', avatar: 'J' },
  { id: 3, user: 'System', action: 'Flagged: Bob hasn\'t logged in for 7 days ⚠️', time: '2 days ago', avatar: '🤖' },
];

const ManagerOverview: React.FC = () => {
  const [activities, setActivities] = useState(mockActivities);

  // Future real-time integration
  useSocket({
    events: {
      team_activity: (data) => {
        setActivities(prev => [data, ...prev].slice(0, 10));
      }
    }
  });

  const avgScore = Math.round(mockTeamMembers.reduce((acc, m) => acc + m.gapScore, 0) / mockTeamMembers.length);

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#f1f5f9' }}>Good morning, Manager! 👋</h1>
          <p style={{ color: '#c4b5fd', margin: '0.25rem 0 0 0' }}>Your team has {mockTeamMembers.length} members.</p>
        </div>
        <div>
          <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            1 employee needs attention today
          </span>
        </div>
      </motion.div>

      {/* Team Health Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Team Avg Readiness" value={`${avgScore}%`} subtext="↑ 2% this week" color={avgScore >= 70 ? '#10b981' : avgScore >= 40 ? '#f59e0b' : '#ef4444'} />
        <StatCard title="On Track (>=70%)" value={mockTeamMembers.filter(m => m.gapScore >= 70).length} subtext="Ready for promotion" color="#10b981" />
        <StatCard title="Needing Help (40-69%)" value={mockTeamMembers.filter(m => m.gapScore >= 40 && m.gapScore < 70).length} subtext="Progressing slowly" color="#f59e0b" />
        <StatCard title="Critical (&lt;40%)" value={mockTeamMembers.filter(m => m.gapScore < 40).length} subtext="Action required" alert color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Members Grid */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>My Team Members</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {mockTeamMembers.map(member => (
              <motion.div key={member.id} whileHover={{ y: -4 }} className="glass-card" style={{ padding: '1.25rem' }}>
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
                    {member.topGaps.map(gap => <span key={gap} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem' }}>{gap}</span>)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active {member.lastActive} ago</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ background: 'transparent', border: '1px solid var(--border)', color: '#94a3b8', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Nudge</button>
                    <button style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>AI Path</button>
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
                <span style={{ fontWeight: 700, color: '#10b981' }}>12 <span style={{ fontSize: '0.7rem' }}>↑3</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Hours Logged</span>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>45h <span style={{ fontSize: '0.7rem' }}>↑5h</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Skills Improved</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>8 <span style={{ fontSize: '0.7rem' }}>↓1</span></span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <span className="pulse-dot" style={{ background: '#10b981' }}></span> Live Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activities.map((act) => (
                <div key={act.id} style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>
                    {act.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}><span style={{ fontWeight: 600 }}>{act.user}</span> {act.action}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>{act.time}</div>
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
