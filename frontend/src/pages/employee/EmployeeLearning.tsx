import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import LearningPathModal from '../../components/employee/LearningPathModal';
import AnimatedGeneratingLoader from '../../components/employee/AnimatedGeneratingLoader';
import SkillHistorySection from '../../components/employee/SkillHistorySection';

export default function EmployeeLearning() {
  const { user } = useAuth();
  const empId = (user as any)?.employeeRef;

  const [path, setPath] = useState<any[]>([]);
  const [employeeRaw, setEmployeeRaw] = useState<any>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [roles, setRoles] = useState<string[]>([]);
  const [historyData, setHistoryData] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  // States for 'Log Study Session' within an active week
  const [logFormOpen, setLogFormOpen] = useState(false);
  const [logHours, setLogHours] = useState(1);
  const [logNotes, setLogNotes] = useState('');

  const loadData = async () => {
    try {
      const [pathRes, empRes, histRes, rolesRes] = await Promise.all([
        api.get('/employee/learning-path'),
        api.get(`/employee/${empId}`),
        api.get(`/employee/skill-history/${empId}`),
        api.get('/roles').catch(() => ({ data: [] }))
      ]);
      
      const pathData = pathRes.data.learningPath || [];
      setPath(pathData);
      setEmployeeRaw(empRes.data);
      setHistoryData(histRes.data);
      const fetchedRoles = rolesRes.data.map((r: any) => r.roleName) || [];
      
      // Fallback if DB has no roles yet
      const finalRoles = fetchedRoles.length > 0 
        ? fetchedRoles 
        : ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UX/UI Designer'];
        
      setRoles(finalRoles);
      
      const comp = pathData.filter((w: any) => w.status === 'completed').length;
      setOverallProgress(pathData.length ? Math.round((comp / pathData.length) * 100) : 0);
      
      // Auto expand current week
      const currentIdx = pathData.findIndex((w: any) => w.status === 'in_progress');
      if (currentIdx !== -1) setExpandedWeek(pathData[currentIdx].week);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [empId]);

  useSocket({
    employeeId: empId,
    events: {
      learning_path_ready: () => loadData(),
      session_logged: () => loadData(), // reload history
    }
  });

  const handleGenerate = async (prefs: any) => {
    setShowModal(false);
    setGenerating(true);
    try {
      const res = await api.post(`/ai/learning-path/${empId}`, prefs);
      setPath(res.data.path || []);
      loadData();
    } catch (err) {
      alert("AI generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const markResourceDone = async (weekNumber: number, resourceTitle: string, hours: number) => {
    try {
      await api.post('/progress/complete-resource', { employeeId: empId, weekNumber, resourceTitle, hoursSpent: hours });
      loadData(); // To refresh completed checks & history
    } catch (err) {
      console.error(err);
    }
  };

  const logSession = async (weekNumber: number, skillName: string) => {
    if (!logHours) return;
    try {
      await api.post('/progress/log-session', { employeeId: empId, weekNumber, skillName, hoursSpent: logHours, notes: logNotes });
      setLogFormOpen(false);
      setLogNotes('');
      setLogHours(1);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const markWeekComplete = async (weekNumber: number) => {
    try {
      await api.put('/employee/learning-path/complete-week', { weekNumber });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const skipWeek = async (weekNumber: number) => {
    const reason = window.prompt("Why are you skipping this week? (optional)");
    if (reason === null) return; // cancelled
    try {
      await api.put('/employee/learning-path/skip-week', { weekNumber, reason });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

  if (generating) {
    return <AnimatedGeneratingLoader />;
  }

  const completedCount = path.filter(w => w.status === 'completed').length;
  const inProgressCount = path.filter(w => w.status === 'in_progress').length;
  const upcomingCount = path.filter(w => w.status === 'upcoming').length;

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <LearningPathModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onGenerate={handleGenerate} 
        employeeRaw={employeeRaw}
        rolesList={roles}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My <span className="gradient-text">Learning Path</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>AI-personalized plan to reach {employeeRaw?.targetRole || 'your target role'} • Generated by Gemini AI</p>
          {employeeRaw?.lastAnalysisAt && (
             <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Last updated: {new Date(employeeRaw.lastAnalysisAt).toLocaleDateString()}</p>
          )}
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ cursor: 'pointer' }}>
          🔄 Regenerate Path
        </button>
      </div>

      {path.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '3rem' }}>🎯</span>
          <h2 style={{ color: '#f8fafc', margin: '1rem 0 0.5rem 0' }}>No Path Generated Yet</h2>
          <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            Set your target role and click generate to get a hyper-personalized roadmap bridging your skill gaps.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}>Generate My AI Path</button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: '#f1f5f9' }}>Overall Progress</span>
              <span style={{ fontWeight: 700, color: '#6366f1' }}>{completedCount} / {path.length} weeks done</span>
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, marginBottom: '0.75rem' }}>
              <div style={{ height: '100%', width: `${overallProgress}%`, background: 'linear-gradient(to right, #a855f7, #14b8a6)', borderRadius: 5, transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>✅ {completedCount} Completed</span> |
              <span>🔄 {inProgressCount} In Progress</span> |
              <span>🔒 {upcomingCount} Upcoming</span>
            </div>
          </div>

          {/* Skill Roadmap Overview */}
          <div style={{ marginBottom: '3rem', overflowX: 'auto', paddingBottom: '1rem' }}>
             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: 'max-content' }}>
               {path.map((w, i) => {
                 const isCompleted = w.status === 'completed';
                 const isCurrent = w.status === 'in_progress';
                 const color = isCompleted ? '#10b981' : isCurrent ? '#3b82f6' : '#475569';
                 const bg = isCompleted ? 'rgba(16,185,129,0.1)' : isCurrent ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)';
                 
                 return (
                   <React.Fragment key={i}>
                     <div 
                        onClick={() => setExpandedWeek(w.week)}
                        style={{ background: bg, border: `1px solid ${color}`, borderRadius: '20px', padding: '0.4rem 1rem', color: '#f1f5f9', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                       {w.focusSkill} <span style={{ opacity: 0.6, fontSize: '0.7rem', marginLeft: '4px' }}>W{w.week}</span>
                     </div>
                     {i < path.length - 1 && <div style={{ width: '20px', height: '2px', background: 'rgba(255,255,255,0.1)' }} />}
                   </React.Fragment>
                 )
               })}
             </div>
          </div>

          {/* Week Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {path.map((w) => {
              const isExpanded = expandedWeek === w.week;
              const isCompleted = w.status === 'completed';
              const isCurrent = w.status === 'in_progress';

              const ss = {
                completed: { dot: '#10b981', badgeBg: 'rgba(16,185,129,0.1)', badgeCol: '#10b981', label: 'Completed ✅' },
                in_progress: { dot: '#3b82f6', badgeBg: 'rgba(59,130,246,0.1)', badgeCol: '#3b82f6', label: 'In Progress 🔄' },
                upcoming: { dot: '#475569', badgeBg: 'rgba(255,255,255,0.05)', badgeCol: '#94a3b8', label: 'Upcoming 🔒' },
              }[w.status as string] || { dot: '#475569', badgeBg: 'rgba(255,255,255,0.05)', badgeCol: '#94a3b8', label: w.status };

              // Check resource completions
              const weekCompletedResources = historyData?.completedResources?.filter((cr: any) => cr.weekNumber === w.week) || [];
              const allResourcesChecked = w.resources && weekCompletedResources.length >= w.resources.length;

              return (
                <div key={w.week} className="glass-card" style={{ overflow: 'hidden', borderLeft: `4px solid ${ss.dot}` }}>
                  {/* Collapsed Header */}
                  <div 
                    onClick={() => setExpandedWeek(isExpanded ? null : w.week)}
                    style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Week {w.week}</div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>{w.title}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                         <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', color: '#cbd5e1' }}>{w.skillCategory}</span>
                         {w.priority === 'critical' && <span style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '2px 8px', borderRadius: '12px' }}>🔴 Critical Skill</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <span style={{ background: ss.badgeBg, color: ss.badgeCol, padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>{ss.label}</span>
                       <span style={{ color: '#64748b' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem', paddingTop: '1.25rem' }}>
                          
                          <p style={{ margin: '0 0 1rem 0', color: '#cbd5e1', lineHeight: 1.6 }}>{w.overview}</p>
                          <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {w.keyConceptsCovered?.map((c: string, idx: number) => (
                              <span key={idx} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px' }}>{c}</span>
                            ))}
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                            {/* Daily Plan */}
                            <div style={{ flex: '1 1 300px' }}>
                              <h4 style={{ color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📅 Daily Plan</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => {
                                  const plan = w.dailyPlan?.[day];
                                  if (!plan) return null;
                                  return (
                                    <div key={day} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                                      <span style={{ color: '#94a3b8', width: '40px', fontWeight: 600, textTransform: 'capitalize' }}>{day.substring(0,3)}</span>
                                      <span style={{ color: '#e2e8f0', flex: 1 }}>{plan.task}</span>
                                      <span style={{ color: '#6366f1', fontWeight: 600 }}>{plan.estimatedHours}h</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Resources */}
                            <div style={{ flex: '1 1 350px' }}>
                              <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>📚 Resources</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {w.resources?.map((r: any, rIdx: number) => {
                                  const done = weekCompletedResources.some((cr: any) => cr.title === r.title);
                                  return (
                                    <div key={rIdx} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                      {done && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '4px', background: '#10b981' }} />}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                            <span>{r.type === 'video' ? '📹' : r.type === 'course' ? '🎓' : '📄'}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{r.platform} {r.isFree && <span style={{ color: '#10b981' }}>🆓 Free</span>}</span>
                                          </div>
                                          <a href={r.url} target="_blank" rel="noreferrer" style={{ color: '#f1f5f9', fontWeight: 600, textDecoration: 'none', display: 'block', marginBottom: '4px' }}>
                                            {r.title}
                                          </a>
                                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>⏱ {r.estimatedHours}h | 🎯 <span style={{ textTransform: 'capitalize' }}>{r.difficulty}</span></div>
                                        </div>
                                        {!done ? (
                                          <button onClick={() => markResourceDone(w.week, r.title, r.estimatedHours)} style={{ background: 'transparent', border: '1px solid rgba(16,185,129,0.5)', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Mark Done</button>
                                        ) : (
                                          <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>✓ Done</span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Practice Project & Checkpoint */}
                          <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: 1, minWidth: '250px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '1rem' }}>
                              <h4 style={{ color: '#fbbf24', marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🛠️ This Week's Project</h4>
                              <h5 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc' }}>{w.practiceProject?.title}</h5>
                              <p style={{ fontSize: '0.85rem', color: '#d1d5db', margin: '0 0 1rem 0' }}>{w.practiceProject?.description}</p>
                              {w.practiceProject?.githubSearchQuery && (
                                <a href={`https://github.com/search?q=${encodeURIComponent(w.practiceProject.githubSearchQuery)}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#fbbf24', textDecoration: 'none' }}>Search Examples on GitHub →</a>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: '250px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '1rem' }}>
                              <h4 style={{ color: '#34d399', marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✅ Checkpoint</h4>
                              <p style={{ fontSize: '0.85rem', color: '#d1d5db', margin: 0 }}>{w.weeklyCheckpoint}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                             
                             <div>
                                {isCurrent && (
                                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {!logFormOpen ? (
                                      <button onClick={() => setLogFormOpen(true)} style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#a5b4fc', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>+ Log Today's Study Session</button>
                                    ) : (
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                        <input type="number" min={0.5} max={8} step={0.5} value={logHours} onChange={e => setLogHours(Number(e.target.value))} style={{ width: '60px', padding: '0.4rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px' }} title="Hours" />
                                        <input type="text" placeholder="What did you work on?" value={logNotes} onChange={e => setLogNotes(e.target.value)} style={{ width: '200px', padding: '0.4rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px' }} />
                                        <button onClick={() => logSession(w.week, w.focusSkill)} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                                        <button onClick={() => setLogFormOpen(false)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                      </div>
                                    )}
                                  </div>
                                )}
                             </div>
                             
                             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                               {w.status === 'upcoming' && (
                                 <React.Fragment>
                                   <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Complete previous weeks to unlock</span>
                                 </React.Fragment>
                               )}

                               {isCurrent && (
                                 <React.Fragment>
                                   <button onClick={() => skipWeek(w.week)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>⏭️ Skip Week</button>
                                   {allResourcesChecked ? (
                                      <button onClick={() => markWeekComplete(w.week)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✓ Mark Week Complete</button>
                                   ) : (
                                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', padding: '0.6rem' }}>Complete resources to unlock</span>
                                   )}
                                 </React.Fragment>
                               )}

                               {isCompleted && (
                                 <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
                                   ✅ Completed {w.completedAt ? `on ${new Date(w.completedAt).toLocaleDateString()}` : ''}
                                 </div>
                               )}
                             </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <SkillHistorySection historyData={historyData} />
        </>
      )}
    </div>
  );
}
