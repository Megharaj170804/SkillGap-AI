import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
const tabs = ['📊 Skills Analysis', '👥 Employee Trends', '🤖 AI Usage', '📚 Learning Metrics'];

const AdminAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [skillsData, setSkillsData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [learningData, setLearningData] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, empRes, learnRes, aiRes] = await Promise.all([
        api.get('/admin/analytics/skills'),
        api.get('/admin/analytics/employees'),
        api.get('/admin/analytics/learning'),
        api.get('/admin/ai-usage'),
      ]);
      setSkillsData(skillsRes.data.topSkillGaps || []);
      setEmployeeData(empRes.data);
      setLearningData(learnRes.data);
      setAiUsage(aiRes.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const aiFeatureData = aiUsage ? [
    { name: 'Learning Paths', value: aiUsage.callsByEndpoint?.learningPath || 0, color: '#6366f1' },
    { name: 'Career Advice', value: aiUsage.callsByEndpoint?.careerAdvice || 0, color: '#8b5cf6' },
    { name: 'Team Insights', value: aiUsage.callsByEndpoint?.teamInsights || 0, color: '#10b981' },
    { name: 'AI Chat', value: aiUsage.callsByEndpoint?.chat || 0, color: '#f59e0b' },
  ] : [];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Platform <span className="gradient-text">Analytics</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Deep-dive data on skills, employees, AI usage, and learning.</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary" style={{ fontSize: '0.85rem' }}>🔄 Refresh</button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto', flexShrink: 0 }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.75rem 1.25rem',
            color: activeTab === i ? '#f1f5f9' : '#94a3b8', fontWeight: activeTab === i ? 700 : 500,
            borderBottom: activeTab === i ? '2px solid #6366f1' : '2px solid transparent',
            marginBottom: '-1px', whiteSpace: 'nowrap', fontSize: '0.9rem', transition: 'all 0.2s'
          }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading analytics...</div>
      ) : (
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

          {/* Skills Tab */}
          {activeTab === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Top 10 Skill Gaps (Low Proficiency Count)</h3>
                {skillsData.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No skill gap data available. Add employees with skills to see analysis.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={skillsData} layout="vertical" barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={100} />
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px' }}
                        formatter={(v: any) => [`${v} employees`, 'With gap']} />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Employees with gap" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Employee Trends Tab */}
          {activeTab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Readiness Distribution */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Readiness Score Distribution</h3>
                {employeeData?.readinessDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={employeeData.readinessDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px' }}
                        formatter={(v: any) => [`${v} employees`, 'Count']} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {(employeeData?.readinessDistribution || []).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No data available.</div>}
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Total Employees', val: employeeData?.totalEmployees || 0, color: '#6366f1' },
                  { label: 'Inactive (14+ days)', val: employeeData?.inactiveCount || 0, color: '#ef4444' },
                ].map((s) => (
                  <div key={s.label} className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Inactive Employees */}
              {employeeData?.inactiveEmployees?.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Inactive Employees (Last 14 Days)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {employeeData.inactiveEmployees.map((e: any) => (
                      <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{e.name}</span>
                        <span style={{ color: '#64748b' }}>{e.department}</span>
                        <span style={{ color: e.gapScore < 40 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>{e.gapScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Usage Tab */}
          {activeTab === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>AI Feature Usage Breakdown</h3>
                {aiFeatureData.some(d => d.value > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={aiFeatureData} cx="50%" cy="50%" outerRadius={90} paddingAngle={4} dataKey="value">
                          {aiFeatureData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                      {aiFeatureData.map((e) => (
                        <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: e.color }}>●</span>{e.name}
                          </span>
                          <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No AI usage data yet.</div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Total AI Calls Today', val: aiUsage?.callsToday || 0, color: '#6366f1' },
                  { label: 'This Month', val: aiUsage?.callsThisMonth || 0, color: '#8b5cf6' },
                  { label: 'Success Rate', val: `${aiUsage?.successRate || 0}%`, color: '#10b981' },
                  { label: 'Failed Requests', val: aiUsage?.failedRequests || 0, color: '#ef4444' },
                ].map((s) => (
                  <div key={s.label} className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{s.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Metrics Tab */}
          {activeTab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Total Courses Completed', val: learningData?.totalCoursesCompleted || 0, color: '#6366f1' },
                  { label: 'Avg Hours / Employee', val: `${learningData?.avgHoursPerEmployee || 0}h`, color: '#10b981' },
                ].map((s) => (
                  <div key={s.label} className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {learningData?.coursesOverTime?.length > 0 ? (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Courses Completed Over Time</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={learningData.coursesOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border)', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} name="Courses" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No learning data yet. Start logging progress to see trends.
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdminAnalytics;
