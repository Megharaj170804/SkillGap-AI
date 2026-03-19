import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useSocket, connectSocket } from '../../hooks/useSocket';

interface Department {
  id: string;
  name: string;
  head: string;
  headAvatar: string;
  employeeCount: number;
  avgReadiness: number;
  criticalGaps: number;
  avgLearningPaths: number;
  color: string;
  skills: { name: string; coverage: number }[];
}

const AdminDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [departmentInsights, setDepartmentInsights] = useState<any>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/admin/analytics/departments');
      setDepartments(res.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  useSocket({
    events: {
      stats_updated: () => { fetchDepartments(); }
    }
  });

  useEffect(() => {
    const s = connectSocket();
    s.emit('join_room', 'admin_room');
  }, []);


  const scoreColor = (n: number) => n >= 70 ? '#10b981' : n >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Department <span className="gradient-text">Management</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>{departments.length} departments across the organization</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Department</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading departments...</div>
      ) : departments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No departments found. Add employees with departments to see them here.</div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Departments', val: departments.length, color: '#6366f1' },
              { label: 'Total Employees', val: departments.reduce((a, d) => a + d.employeeCount, 0), color: '#8b5cf6' },
              { label: 'Avg Readiness', val: `${Math.round(departments.reduce((a, d) => a + d.avgReadiness, 0) / departments.length)}%`, color: '#10b981' },
              { label: 'Critical Gap Depts', val: departments.filter(d => d.criticalGaps > 0).length, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>{s.label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Department Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {departments.map((dept, i) => (
              <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
                className="glass-card" style={{ padding: '1.5rem', borderTop: `3px solid ${dept.color}`, cursor: 'pointer' }} onClick={() => setSelectedDept(dept)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>{dept.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: dept.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: 'white' }}>{dept.headAvatar}</div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Led by <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{dept.head}</span></span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: scoreColor(dept.avgReadiness) }}>{dept.avgReadiness}%</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>readiness</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{dept.employeeCount}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>People</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: dept.criticalGaps > 0 ? '#ef4444' : '#10b981' }}>{dept.criticalGaps}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Critical</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{dept.avgLearningPaths}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Avg Paths</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {dept.skills.map(sk => (
                    <div key={sk.name} style={{ flex: 1, minWidth: '60px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sk.name}>{sk.name}</div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${sk.coverage}%`, background: dept.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Department Detail Drawer */}
      {createPortal(
      <AnimatePresence>
        {selectedDept && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDept(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
              style={{ position: 'fixed', top: 0, right: 0, width: 480, height: '100vh', background: '#0f1626', borderLeft: '1px solid rgba(99, 102, 241, 0.3)', zIndex: 201, overflowY: 'auto', padding: '2rem' }}>
              <button onClick={() => { setSelectedDept(null); setDepartmentInsights(null); }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#94a3b8', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
              <div style={{ borderLeft: `4px solid ${selectedDept.color}`, paddingLeft: '1rem', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>{selectedDept.name}</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8' }}>Department Head: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{selectedDept.head}</span></p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.05em' }}>Top Skill Coverages</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={selectedDept.skills} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={80} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px', color: '#f1f5f9' }} />
                    <Bar dataKey="coverage" fill={selectedDept.color} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  className="btn-primary" 
                  style={{ width: '100%' }}
                  disabled={generatingInsights}
                  onClick={async () => {
                    setGeneratingInsights(true);
                    setDepartmentInsights(null);
                    try {
                      const res = await api.post(`/ai/team-insights/${encodeURIComponent(selectedDept.name)}`);
                      setDepartmentInsights(res.data.insights);
                      import('react-hot-toast').then(m => m.default.success(`AI Insights generated for ${selectedDept.name}`));
                    } catch (err: any) {
                      import('react-hot-toast').then(m => m.default.error(err.response?.data?.message || 'Failed to generate insights'));
                    } finally {
                      setGeneratingInsights(false);
                    }
                  }}
                >
                  {generatingInsights ? '⏳ Generating...' : '🤖 Generate Team AI Insights'}
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ width: '100%' }}
                  disabled={exportingReport}
                  onClick={async () => {
                    setExportingReport(true);
                    try {
                      const res = await api.get(`/admin/analytics/departments/${encodeURIComponent(selectedDept.name)}/report`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `${selectedDept.name.replace(/\s+/g, '-')}-report.csv`);
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode?.removeChild(link);
                      import('react-hot-toast').then(m => m.default.success('Report downloaded!'));
                    } catch (err) {
                      import('react-hot-toast').then(m => m.default.error('Failed to export report'));
                    } finally {
                      setExportingReport(false);
                    }
                  }}
                >
                  {exportingReport ? '⏳ Exporting...' : '📋 Export Department Report'}
                </button>
              </div>

              {/* Render AI Insights */}
              <AnimatePresence>
                {departmentInsights && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>💪</div>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', color: '#f1f5f9', fontSize: '0.95rem' }}>Team Strengths</h4>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {departmentInsights.teamStrengths?.map((s: string, i: number) => <li key={i}>{s}</li>) || <li>No data</li>}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>⚠️</div>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', color: '#f1f5f9', fontSize: '0.95rem' }}>Critical Gaps</h4>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {departmentInsights.criticalGaps?.map((g: string, i: number) => <li key={i}>{g}</li>) || <li>No data</li>}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>📅</div>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#f1f5f9', fontSize: '0.95rem' }}>90-Day Action Plan</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {departmentInsights.ninetyDayPlan?.map((p: any, i: number) => (
                              <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                                <div style={{ fontWeight: 600, color: '#a5b4fc', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{p.day || p.timeframe}</div>
                                <div style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{p.action}</div>
                              </div>
                            )) || <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No action plan generated.</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Create Modal */}
      {createPortal(
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }} />
            <motion.div initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
              style={{ position: 'fixed', top: '50%', left: '50%', width: '460px', maxWidth: '95vw', background: '#1a1a2e', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '20px', padding: '2rem', zIndex: 301 }}>
              <h2 style={{ margin: '0 0 1.5rem 0', fontWeight: 700, color: '#f1f5f9' }}>Create Department</h2>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Departments are dynamically generated on the platform based on employee assignments. To create a new department, simply create a new employee and set their department to the new name.</div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreateModal(false)} className="btn-primary">Understood</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
};

export default AdminDepartments;
