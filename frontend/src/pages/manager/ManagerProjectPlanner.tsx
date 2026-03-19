import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ManagerProjectPlanner: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null); // projectId being assigned
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', deadline: '', requiredSkills: '' });

  const fetchProjects = async () => {
    try {
      const res = await api.get('/manager/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects', err);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await api.get('/manager/my-team');
      setTeamMembers(res.data);
    } catch (err) {
      console.error('Failed to load team', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTeam();
  }, []);

  const generateTrainingPlan = async (projectId: string) => {
    setGeneratingPlan(projectId);
    try {
      const res = await api.post(`/ai/project-training-plan/${projectId}`);
      setProjects(projects.map(p => p._id === projectId ? { ...p, aiAnalysis: res.data.plan } : p));
      toast.success('Training Plan generated!');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Failed to generate AI plan. Please ensure Gemini API is up.';
      toast.error(msg);
    } finally {
      setGeneratingPlan(null);
    }
  };

  const openAssignModal = (project: any) => {
    setAssignModal(project._id);
    setSelectedEmployees(project.assignedEmployees.map((e: any) => e._id));
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleAssign = async () => {
    if (!assignModal) return;
    setAssigning(true);
    try {
      const res = await api.patch(`/manager/projects/${assignModal}/assign`, { employeeIds: selectedEmployees });
      setProjects(projects.map(p => p._id === assignModal ? res.data : p));
      toast.success('Team members assigned!');
      setAssignModal(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign team members');
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.deadline || !newProject.requiredSkills) {
      return toast.error('Please fill in all fields');
    }
    const reqSkills = newProject.requiredSkills.split(',').map(s => ({
      skillName: s.trim(), level: 3, priority: 'high'
    })).filter(s => s.skillName);
    try {
      await api.post('/manager/projects', {
        name: newProject.name,
        description: 'New Project',
        deadline: newProject.deadline,
        requiredSkills: reqSkills,
        assignedEmployees: []
      });
      toast.success('Project created');
      setShowCreate(false);
      setNewProject({ name: '', deadline: '', requiredSkills: '' });
      fetchProjects();
    } catch (err) {
      console.error('Failed to create project', err);
      toast.error('Failed to create project');
    }
  };

  const coveragColor = (pct: number) => pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

  const getMemberCoverageForSkill = (member: any, reqSkill: any) => {
    if (!member.skills) return 0;
    const empSkill = member.skills.find((s: any) =>
      (s.skillName || s.name || '').toLowerCase() === (reqSkill.skillName || '').toLowerCase()
    );
    if (!empSkill) return 0;
    const empLevel = empSkill.proficiencyLevel || empSkill.level || 0;
    const reqLevel = reqSkill.level || 3;
    return Math.round(Math.min(1, empLevel / reqLevel) * 100);
  };

  if (loading) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading projects...</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Project <span className="gradient-text">Skill Planner</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Map your team's skills to upcoming project requirements.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {projects.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No active projects. Create one to start planning.</p>
        ) : projects.map((project, pi) => (
          <motion.div key={project._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.1 }} className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9' }}>{project.name}</h3>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  📅 Deadline: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{new Date(project.deadline).toLocaleDateString()}</span> ({project.daysUntilDeadline} days away)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                  onClick={() => openAssignModal(project)}
                >
                  👥 Assign Team
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                  onClick={() => generateTrainingPlan(project._id)}
                  disabled={generatingPlan === project._id}
                >
                  {generatingPlan === project._id ? '⏳ Generating...' : '🤖 Generate Training Plan'}
                </button>
              </div>
            </div>

            {/* Team member skill coverage table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 400 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Team Member</th>
                    {project.requiredSkills.map((s: any) => (
                      <th key={s._id || s.skillName} style={{ padding: '0.5rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.skillName}</th>
                    ))}
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {project.assignedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={project.requiredSkills.length + 2} style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center' }}>
                        No employees assigned yet. Click <strong style={{ color: '#94a3b8' }}>👥 Assign Team</strong> to add members.
                      </td>
                    </tr>
                  ) : project.assignedEmployees.map((member: any) => {
                    const coverage = project.requiredSkills.map((rs: any) => getMemberCoverageForSkill(member, rs));
                    const avg = coverage.length > 0 ? Math.round(coverage.reduce((a: number, c: number) => a + c, 0) / coverage.length) : 0;
                    return (
                      <tr key={member._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                              {member.avatar || (member.name || 'U').charAt(0)}
                            </div>
                            <div>
                              <div>{member.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{member.currentRole}</div>
                            </div>
                          </div>
                        </td>
                        {coverage.map((pct: number, i: number) => (
                          <td key={i} style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <div style={{ width: 38, height: 38, borderRadius: 6, background: pct >= 70 ? 'rgba(16,185,129,0.15)' : pct >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: coveragColor(pct), fontWeight: 700, fontSize: '0.72rem' }}>{pct}%</div>
                          </td>
                        ))}
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: coveragColor(avg), fontSize: '0.9rem' }}>{avg}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Overall Project Readiness: <span style={{ color: coveragColor(project.skillCoveragePercent), fontWeight: 'bold' }}>{project.skillCoveragePercent}%</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Risk Level: <span style={{ color: project.riskLevel === 'high' ? '#ef4444' : project.riskLevel === 'medium' ? '#f59e0b' : '#10b981', fontWeight: 'bold', textTransform: 'capitalize' }}>{project.riskLevel}</span>
              </div>
            </div>

            {project.aiAnalysis && (
              <div style={{ marginTop: '1.5rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1.25rem', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📊</span> AI Training Plan Insight
                </h4>
                <p style={{ margin: '0 0 1rem 0', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {project.aiAnalysis.projectReadiness}
                </p>
                {project.aiAnalysis.criticalGaps?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#f87171', fontSize: '0.85rem', textTransform: 'uppercase' }}>Critical Gaps</h5>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                      {project.aiAnalysis.criticalGaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}
                {project.aiAnalysis.employeePlans?.length > 0 && (
                  <div>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#34d399', fontSize: '0.85rem', textTransform: 'uppercase' }}>Recommended Actions Per Member</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {project.aiAnalysis.employeePlans.map((ep: any, i: number) => (
                        <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                          <strong style={{ color: '#f1f5f9' }}>{ep.employeeName}</strong>
                          <div style={{ color: '#94a3b8', marginTop: '0.25rem' }}>Focus: {ep.focusAreas?.join(', ')}</div>
                          <div style={{ color: '#60a5fa', marginTop: '0.25rem' }}>Courses: {ep.recommendedCourses?.join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── ASSIGN TEAM MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
              zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
            onClick={e => { if (e.target === e.currentTarget) setAssignModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: 480, padding: '2rem', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9' }}>
                👥 Assign Team Members
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Select which team members to assign to this project.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '320px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                {teamMembers.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center' }}>No team members found in your department.</p>
                ) : teamMembers.map((emp: any) => {
                  const checked = selectedEmployees.includes(emp._id);
                  return (
                    <div
                      key={emp._id}
                      onClick={() => toggleEmployee(emp._id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem', borderRadius: '10px', cursor: 'pointer',
                        background: checked ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${checked ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '4px', flexShrink: 0,
                        background: checked ? '#6366f1' : 'rgba(255,255,255,0.1)',
                        border: `2px solid ${checked ? '#6366f1' : 'rgba(255,255,255,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '0.7rem', fontWeight: 800,
                      }}>
                        {checked ? '✓' : ''}
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {(emp.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.currentRole} · Readiness {emp.gapScore || 0}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
                <button className="btn-primary" onClick={handleAssign} disabled={assigning}>
                  {assigning ? 'Saving...' : `Assign ${selectedEmployees.length} Member${selectedEmployees.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CREATE PROJECT FORM ────────────────────────────────────────────── */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="glass-card" style={{ marginTop: '2rem', padding: '2rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontWeight: 700, color: '#f1f5f9' }}>Create New Project</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>PROJECT NAME</label>
              <input type="text" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} placeholder="e.g. Platform Migration" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>DEADLINE</label>
              <input type="date" value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>REQUIRED SKILLS (COMMA-SEPARATED)</label>
            <input type="text" value={newProject.requiredSkills} onChange={e => setNewProject({ ...newProject, requiredSkills: e.target.value })} placeholder="e.g. React, Node.js, AWS" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start', marginTop: '1.5rem' }}>
            <button onClick={handleCreateProject} className="btn-primary">Create Project</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ManagerProjectPlanner;
