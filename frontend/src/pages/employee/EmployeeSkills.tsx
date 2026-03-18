import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Skill {
  skillName: string;
  currentLevel: number;
  requiredLevel: number | null;
  gap: number;
  status: 'strong' | 'weak' | 'missing' | 'extra';
  category?: string;
  yearsOfExperience: number;
}

const levelLabels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

const EmployeeSkills: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelfAssessment, setShowSelfAssessment] = useState(false);
  
  // Add Skill State
  const [newSkill, setNewSkill] = useState({ name: '', level: 1, years: 0, category: 'Other' });
  
  // Self Assessment State
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [assessmentRatings, setAssessmentRatings] = useState<any[]>([]);
  const requiredOnly = skills.filter(s => s.requiredLevel !== null);

  const loadData = async () => {
    try {
      const res = await api.get('/employee/my-skills');
      setSkills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddSkill = async () => {
    try {
      await api.put('/employee/add-skill', {
        skillName: newSkill.name,
        level: newSkill.level,
        yearsOfExperience: newSkill.years,
        category: newSkill.category
      });
      setShowAddModal(false);
      setNewSkill({ name: '', level: 1, years: 0, category: 'Other' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLevel = async (skillName: string, newLevel: number) => {
    try {
      await api.put('/employee/update-skill', { skillName, newLevel });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSkill = async (skillName: string) => {
    if (!window.confirm(`Remove ${skillName} from your profile?`)) return;
    try {
      await api.put('/employee/remove-skill', { skillName });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const startAssessment = () => {
    if (requiredOnly.length === 0) {
      alert("Please set a target role to perform self assessment.");
      return;
    }
    setAssessmentRatings([]);
    setAssessmentStep(0);
    setShowSelfAssessment(true);
  };

  const submitAssessment = async () => {
    try {
      await api.put('/employee/self-assessment', { skills: assessmentRatings });
      setShowSelfAssessment(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['All', ...Array.from(new Set(skills.map(s => s.category || 'Other')))];
  const displayed = activeTab === 'All' ? skills : skills.filter(s => (s.category || 'Other') === activeTab);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My <span className="gradient-text">Skills</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Manage your proficiency and compare against target role</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={startAssessment} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Run Full Self Assessment</button>
          <button onClick={() => setShowAddModal(true)} style={{ background: '#10b981', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>+ Add Skill</button>
        </div>
      </div>

      {/* Categories Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setActiveTab(c)} style={{ background: activeTab === c ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === c ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent', color: activeTab === c ? '#a5b4fc' : '#94a3b8', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {displayed.map(s => {
          const color = s.status === 'strong' ? '#10b981' : s.status === 'weak' ? '#f59e0b' : s.status === 'missing' ? '#ef4444' : '#64748b';
          
          return (
            <motion.div key={s.skillName} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: color }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>{s.skillName}</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{s.category || 'Other'} · {s.yearsOfExperience} yrs exp</div>
                </div>
                <button onClick={() => handleDeleteSkill(s.skillName)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.2rem' }}>×</button>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'inline-block', background: `${color}15`, color: color, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>
                {s.status === 'strong' ? '✅ Strong' : s.status === 'weak' ? '⚠️ Needs Work' : s.status === 'missing' ? '❌ Missing' : '➕ Extra'}
              </div>

              {/* Gap Text */}
              {s.requiredLevel !== null && (
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  {s.gap > 0 ? `${s.gap} levels below required (${s.requiredLevel})` : s.gap < 0 ? `Exceeds by ${Math.abs(s.gap)} level(s)` : `Meets requirement (${s.requiredLevel})`}
                </div>
              )}

              {/* Dots representation & Update Level */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', width: '60px' }}>Current:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <div key={lvl} onClick={() => handleUpdateLevel(s.skillName, lvl)} title={`Set to ${lvl}`}
                      style={{ width: '12px', height: '12px', borderRadius: '50%', background: lvl <= s.currentLevel ? color : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
              </div>

              {/* Progress Bar mapped against required level if any */}
              {s.requiredLevel !== null && (
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((s.currentLevel / s.requiredLevel) * 100, 100)}%`, background: color }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add Skill Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card" style={{ padding: '2rem', width: '400px', background: '#0f172a' }}>
              <h2 style={{ marginTop: 0 }}>Add Skill</h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Skill Name</label>
                <input value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})} type="text" style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} placeholder="e.g. React" />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Category</label>
                <select value={newSkill.category} onChange={e => setNewSkill({...newSkill, category: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Cloud">Cloud</option>
                  <option value="Data">Data</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Proficiency (1-5)</label>
                <input type="range" min="1" max="5" value={newSkill.level} onChange={e => setNewSkill({...newSkill, level: parseInt(e.target.value)})} style={{ width: '100%' }} />
                <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.5rem' }}>{newSkill.level}: {levelLabels[newSkill.level-1]}</div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Years of Experience</label>
                <input value={newSkill.years} onChange={e => setNewSkill({...newSkill, years: parseInt(e.target.value)||0})} type="number" min="0" style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAddSkill} disabled={!newSkill.name} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: newSkill.name ? 'pointer' : 'not-allowed', opacity: newSkill.name ? 1 : 0.5 }}>Save Skill</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Self Assessment Modal */}
      <AnimatePresence>
        {showSelfAssessment && requiredOnly.length > 0 && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="glass-card" style={{ padding: '3rem', width: '500px', background: '#0f172a', textAlign: 'center' }}>
              
              <div style={{ fontSize: '0.85rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1rem' }}>
                Skill {assessmentStep + 1} of {requiredOnly.length}
              </div>
              
              <h2 style={{ fontSize: '2rem', margin: '0 0 1.5rem 0', color: '#f8fafc' }}>{requiredOnly[assessmentStep].skillName}</h2>
              
              <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Rate your proficiency (1-5):</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button key={lvl} onClick={() => {
                    const newRatings = [...assessmentRatings];
                    newRatings.push({ skillName: requiredOnly[assessmentStep].skillName, level: lvl });
                    setAssessmentRatings(newRatings);
                    if (assessmentStep + 1 < requiredOnly.length) {
                      setAssessmentStep(s => s + 1);
                    } else {
                      submitAssessment();
                    }
                  }} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6366f1'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                    {lvl}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>1: Never used / Beginner</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>2: Learning / Basic grasp</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>3: Can work independently</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>4: Advanced / Fluid execution</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>5: Expert / Can teach others</div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button onClick={() => setShowSelfAssessment(false)} style={{ background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }}>Cancel Assessment</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EmployeeSkills;
