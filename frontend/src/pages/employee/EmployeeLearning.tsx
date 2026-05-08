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
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [roles, setRoles] = useState<string[]>([]);
  const [historyData, setHistoryData] = useState<any>(null);
  const [isFallbackPath, setIsFallbackPath] = useState(false);
  const [quotaError, setQuotaError] = useState({
    show: false,
    message: '',
    retryAfter: '',
    hasCachedPath: false,
  });
  
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
      setIsFallbackPath(false);
      setEmployeeRaw(empRes.data);
      setHistoryData(histRes.data);
      const fetchedRoles = rolesRes.data.map((r: any) => r.roleName) || [];
      
      // Fallback if DB has no roles yet
      const finalRoles = fetchedRoles.length > 0 
        ? fetchedRoles 
        : ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UX/UI Designer'];
        
      setRoles(finalRoles);
      
      const comp = pathData.filter((w: any) => w.status === 'completed').length;
      const tWeeks = pathRes.data.totalWeeks || pathData.length;
      setTotalWeeks(tWeeks);
      setOverallProgress(tWeeks > 0 ? Math.round((comp / tWeeks) * 100) : 0);
      
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
    setIsFallbackPath(false);
    try {
      const res = await api.post(`/ai/learning-path/${empId}`, { ...prefs, forceRegenerate: true });
      setPath(res.data.path || []);
      setIsFallbackPath(Boolean(res.data?.fallback));
      await loadData();
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 429 && data?.quotaError) {
        setQuotaError({
          show: true,
          message: data?.message || 'AI quota reached. Please retry later.',
          retryAfter: data?.retryAfter || `${data?.retryAfterSeconds || 60} seconds`,
          hasCachedPath: Boolean(data?.cachedPath?.length),
        });

        if (data?.cachedPath?.length) {
          setPath(data.cachedPath);
          setIsFallbackPath(false);
        }
      } else if (status === 429) {
        setQuotaError({
          show: true,
          message: data?.message || 'Too many requests. Please wait before retrying.',
          retryAfter: data?.retryAfter || '1 hour',
          hasCachedPath: false,
        });
      } else {
        setQuotaError({
          show: true,
          message: 'Failed to generate learning path. Please try again.',
          retryAfter: '',
          hasCachedPath: false,
        });
      }
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
      {quotaError.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div style={{ background: '#1f2937', border: '1px solid #b45309', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '460px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>⏳</span>
              <h3 style={{ color: '#fff', margin: '0.5rem 0 0 0' }}>AI Quota Reached</h3>
            </div>

            <div style={{ background: 'rgba(146,64,14,0.25)', border: '1px solid rgba(202,138,4,0.55)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
              <p style={{ color: '#fde68a', fontSize: '0.9rem', margin: 0 }}>{quotaError.message}</p>
              {quotaError.retryAfter && (
                <p style={{ color: '#fbbf24', fontSize: '0.78rem', margin: '0.35rem 0 0 0' }}>Retry after: {quotaError.retryAfter}</p>
              )}
            </div>

            {quotaError.hasCachedPath && (
              <div style={{ background: 'rgba(6,78,59,0.25)', border: '1px solid rgba(16,185,129,0.5)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                <p style={{ color: '#86efac', fontSize: '0.85rem', margin: 0 }}>Your previously generated learning path is loaded below, so you can continue learning right now.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => setQuotaError({ show: false, message: '', retryAfter: '', hasCachedPath: false })}
                style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                {quotaError.hasCachedPath ? 'View My Existing Path' : 'OK, I Will Try Later'}
              </button>
              <button
                onClick={() => {
                  setQuotaError({ show: false, message: '', retryAfter: '', hasCachedPath: false });
                  window.open('https://ai.google.dev/gemini-api/docs/rate-limits', '_blank');
                }}
                style={{ width: '100%', background: '#374151', color: '#d1d5db', border: 'none', padding: '0.65rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                Check Quota Limits
              </button>
            </div>
          </div>
        </div>
      )}

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
          {isFallbackPath && (
            <div style={{ background: 'rgba(146,64,14,0.25)', border: '1px solid rgba(202,138,4,0.55)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#fcd34d', fontSize: '0.9rem' }}>
              This is a basic fallback path because AI quota was exhausted. Regenerate later for a fully personalized AI roadmap.
            </div>
          )}

          {/* Stale data detection banner */}
          {(() => {
            const firstWeek = path[0];
            const hasNoContent = !firstWeek?.resources?.length && !firstWeek?.learningResources?.length && !firstWeek?.dailyPlan && !firstWeek?.dailySchedule;
            if (!hasNoContent) return null;
            return (
              <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '0.25rem' }}>⚠️ Your learning path data is incomplete</div>
                  <div style={{ fontSize: '0.85rem', color: '#d1d5db' }}>The stored path is missing resources, daily plans, and project details. Please regenerate to get your full personalized roadmap.</div>
                </div>
                <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  🔄 Regenerate Now
                </button>
              </div>
            );
          })()}

          {/* Progress bar */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: '#f1f5f9' }}>Overall Progress</span>
              <span style={{ fontWeight: 700, color: '#6366f1' }}>{completedCount} / {totalWeeks} weeks done</span>
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
                       {w.focusSkill || 'General'} <span style={{ opacity: 0.6, fontSize: '0.7rem', marginLeft: '4px' }}>W{w.week ?? i + 1}</span>
                     </div>
                     {i < path.length - 1 && <div style={{ width: '20px', height: '2px', background: 'rgba(255,255,255,0.1)' }} />}
                   </React.Fragment>
                 )
               })}
             </div>
          </div>

          {/* Week Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {path.map((w, wIdx) => {
              // Normalize week number — AI might return 'weekNumber' instead of 'week'
              const weekNum = w.week ?? w.weekNumber ?? (wIdx + 1);
              const weekTitle = w.title || w.weekTitle || `Week ${weekNum} Learning`;
              const weekFocusSkill = w.focusSkill || w.skill || w.topic || 'General';
              const weekResources = w.resources || w.learningResources || [];
              const weekDailyPlan = w.dailyPlan || w.dailySchedule || {};
              const weekOverview = w.overview || w.description || w.weeklyOverview || '';
              const weekCheckpoint = w.weeklyCheckpoint || w.checkpoint || w.weeklyGoal || '';
              const weekConcepts = w.keyConceptsCovered || w.keyConcepts || w.concepts || [];
              const weekPractice = w.practiceProject || w.project || null;
              const weekNextPreview = w.nextWeekPreview || w.preview || '';

              const isExpanded = expandedWeek === weekNum;
              const isCompleted = w.status === 'completed';
              const isCurrent = w.status === 'in_progress';

              const ss = {
                completed: { dot: '#10b981', badgeBg: 'rgba(16,185,129,0.1)', badgeCol: '#10b981', label: 'Completed ✅' },
                in_progress: { dot: '#3b82f6', badgeBg: 'rgba(59,130,246,0.1)', badgeCol: '#3b82f6', label: 'In Progress 🔄' },
                upcoming: { dot: '#475569', badgeBg: 'rgba(255,255,255,0.05)', badgeCol: '#94a3b8', label: 'Upcoming 🔒' },
              }[w.status as string] || { dot: '#475569', badgeBg: 'rgba(255,255,255,0.05)', badgeCol: '#94a3b8', label: w.status };

              // Check resource completions
              const weekCompletedResources = historyData?.completedResources?.filter((cr: any) => cr.weekNumber === weekNum) || [];
              // Can mark week complete if: all resources done, OR there are no resources at all
              const allResourcesChecked = weekResources.length === 0 || weekCompletedResources.length >= weekResources.length;

              return (
                <div key={weekNum} className="glass-card" style={{ overflow: 'hidden', borderLeft: `4px solid ${ss.dot}` }}>
                  {/* Collapsed Header */}
                  <div 
                    onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                    style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Week {weekNum}</div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>{weekTitle}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                         <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', color: '#cbd5e1' }}>{w.skillCategory || weekFocusSkill}</span>
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
                          
                          <p style={{ margin: '0 0 1rem 0', color: '#cbd5e1', lineHeight: 1.6 }}>{weekOverview}</p>
                          <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {weekConcepts.map((c: string, idx: number) => (
                              <span key={idx} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px' }}>{c}</span>
                            ))}
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                            {/* Daily Plan */}
                            <div style={{ flex: '1 1 300px' }}>
                              <h4 style={{ color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📅 Daily Plan</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {Object.keys(weekDailyPlan).length === 0 && (
                                  <span style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>No daily plan provided for this week.</span>
                                )}
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => {
                                  const plan = weekDailyPlan?.[day];
                                  if (!plan) return null;
                                  return (
                                    <div key={day} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                                      <span style={{ color: '#94a3b8', width: '40px', fontWeight: 600, textTransform: 'capitalize' }}>{day.substring(0,3)}</span>
                                      <span style={{ color: '#e2e8f0', flex: 1 }}>{typeof plan === 'string' ? plan : plan.task}</span>
                                      {plan.estimatedHours && <span style={{ color: '#6366f1', fontWeight: 600 }}>{plan.estimatedHours}h</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Resources */}
                            <div style={{ flex: '1 1 350px' }}>
                              <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>📚 Resources</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {weekResources.length === 0 && (
                                  <span style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>No resources listed for this week.</span>
                                )}
                                {weekResources.map((r: any, rIdx: number) => {
                                  const resourceTitle = r.title || r.name || r.resourceName || `Resource ${rIdx + 1}`;
                                  const resourceUrl = r.url || r.link || '#';
                                  const resourcePlatform = r.platform || r.source || 'Online';
                                  const resourceType = r.type || 'article';
                                  const done = weekCompletedResources.some((cr: any) => cr.title === resourceTitle);
                                  return (
                                    <div key={rIdx} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                      {done && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '4px', background: '#10b981' }} />}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                            <span>{resourceType === 'video' ? '📹' : resourceType === 'course' ? '🎓' : '📄'}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{resourcePlatform} {r.isFree && <span style={{ color: '#10b981' }}>🆓 Free</span>}</span>
                                          </div>
                                          <div style={{ color: '#f1f5f9', fontWeight: 600, textDecoration: 'none', display: 'block', marginBottom: '4px' }}>
                                            {resourceTitle}
                                          </div>
                                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>⏱ {r.estimatedHours || r.duration || '?'}h | 🎯 <span style={{ textTransform: 'capitalize' }}>{r.difficulty || 'beginner'}</span></div>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                        <a href={resourceUrl} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', background: '#1d4ed8', color: '#fff', padding: '0.4rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>
                                          {resourceType === 'video' ? '▶ Watch' : resourceType === 'course' ? '🎓 Open Course' : '📖 Read'}
                                        </a>
                                        {!done ? (
                                          <button onClick={() => markResourceDone(weekNum, resourceTitle, r.estimatedHours || 1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.5)', color: '#34d399', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Mark Done</button>
                                        ) : (
                                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>✓ Done</span>
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
                              {weekPractice ? (
                                <>
                                  <h5 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc' }}>{weekPractice.title}</h5>
                                  <p style={{ fontSize: '0.85rem', color: '#d1d5db', margin: '0 0 1rem 0' }}>{weekPractice.description}</p>
                                  {weekPractice.githubSearchQuery && (
                                    <a href={`https://github.com/search?q=${encodeURIComponent(weekPractice.githubSearchQuery)}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#fbbf24', textDecoration: 'none' }}>Search Examples on GitHub →</a>
                                  )}
                                </>
                              ) : (
                                <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>No practice project defined for this week.</p>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: '250px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '1rem' }}>
                              <h4 style={{ color: '#34d399', marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✅ Checkpoint</h4>
                              <p style={{ fontSize: '0.85rem', color: '#d1d5db', margin: 0 }}>{weekCheckpoint || 'No checkpoint defined.'}</p>
                              {weekNextPreview && <p style={{ fontSize: '0.78rem', color: '#6366f1', marginTop: '0.5rem', fontStyle: 'italic' }}>Next: {weekNextPreview}</p>}
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
                                         <button onClick={() => logSession(weekNum, weekFocusSkill)} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
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
                                   <button onClick={() => skipWeek(weekNum)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>⏭️ Skip Week</button>
                                   {allResourcesChecked ? (
                                      <button onClick={() => markWeekComplete(weekNum)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>✓ Mark Week Complete</button>
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
