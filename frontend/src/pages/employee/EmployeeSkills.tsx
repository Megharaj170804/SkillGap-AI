import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Skill { name: string; proficiency: number; }

const levelLabel = (p: number) => p >= 80 ? 'Expert' : p >= 60 ? 'Advanced' : p >= 40 ? 'Intermediate' : 'Beginner';
const levelColor = (p: number) => p >= 80 ? '#10b981' : p >= 60 ? '#6366f1' : p >= 40 ? '#f59e0b' : '#ef4444';

const EmployeeSkills: React.FC = () => {
  const { user } = useAuth();
  const empId = (user as any)?.employeeRef;

  const [skills, setSkills] = useState<Skill[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'strong' | 'weak' | 'missing'>('all');

  useEffect(() => {
    if (!empId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [empRes, anRes] = await Promise.all([
          api.get(`/employees/${empId}`),
          api.get(`/analysis/employee/${empId}`).catch(() => ({ data: null })),
        ]);
        setSkills(empRes.data.skills || []);
        if (anRes.data) {
          setMissingSkills(anRes.data.missingSkills || []);
        }
      } catch { /* silent */ } finally { setLoading(false); }
    };
    load();
  }, [empId]);

  const allSkills = [...skills, ...missingSkills.filter(ms => !skills.find(s => s.name === ms)).map(s => ({ name: s, proficiency: 0 }))];

  const displayed = allSkills.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    if (filter === 'strong') return matchSearch && s.proficiency >= 70;
    if (filter === 'weak') return matchSearch && s.proficiency > 0 && s.proficiency < 70;
    if (filter === 'missing') return matchSearch && s.proficiency === 0;
    return matchSearch;
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My <span className="gradient-text">Skills</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>{skills.length} skills profiled · {missingSkills.length} gaps identified</p>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="🔍 Search skills..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '180px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 1rem', color: '#f1f5f9', outline: 'none' }}
        />
        {(['all', 'strong', 'weak', 'missing'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? 'rgba(99, 102, 241, 0.2)' : 'transparent', border: filter === f ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.1)', color: filter === f ? '#a5b4fc' : '#94a3b8', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: filter === f ? 700 : 500, fontSize: '0.85rem', textTransform: 'capitalize' }}>
            {f === 'all' ? `All (${allSkills.length})` : f === 'strong' ? `Strong (${allSkills.filter(s => s.proficiency >= 70).length})` : f === 'weak' ? `Weak (${allSkills.filter(s => s.proficiency > 0 && s.proficiency < 70).length})` : `Missing (${missingSkills.length})`}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {displayed.map((s, i) => {
          const isMissing = s.proficiency === 0 && missingSkills.includes(s.name);
          return (
            <motion.div key={s.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card" style={{ padding: '1.25rem', borderLeft: `3px solid ${levelColor(s.proficiency)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>{s.name}</div>
                <span style={{ background: `${levelColor(s.proficiency)}15`, color: levelColor(s.proficiency), border: `1px solid ${levelColor(s.proficiency)}40`, padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {isMissing ? 'MISSING' : levelLabel(s.proficiency)}
                </span>
              </div>
              {!isMissing && (
                <>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: '0.4rem' }}>
                    <div style={{ height: '100%', width: `${s.proficiency}%`, background: levelColor(s.proficiency), borderRadius: 3, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.proficiency}% proficiency</div>
                </>
              )}
              {isMissing && (
                <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem' }}>Required for target role — not in your profile yet</div>
              )}
            </motion.div>
          );
        })}
      </div>
      {displayed.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No skills match your filters.</div>
      )}
    </div>
  );
};

export default EmployeeSkills;
