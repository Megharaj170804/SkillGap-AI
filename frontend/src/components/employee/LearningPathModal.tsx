import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prefs: any) => void;
  employeeRaw: any; // Original employee object
  rolesList: string[]; // List of available roles
}

const LearningPathModal: React.FC<Props> = ({ isOpen, onClose, onGenerate, employeeRaw, rolesList }) => {
  const [targetRole, setTargetRole] = useState(employeeRaw?.targetRole || '');
  const [skills, setSkills] = useState<{skillName: string, proficiencyLevel: number}[]>(employeeRaw?.skills || []);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState('📹 Video-focused');
  const [weekCount, setWeekCount] = useState(12);

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setTargetRole(employeeRaw?.targetRole || '');
      setSkills(employeeRaw?.skills ? [...employeeRaw.skills] : []);
    }
  }, [isOpen, employeeRaw]);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    if (skills.some(s => s.skillName.toLowerCase() === newSkillName.trim().toLowerCase())) return;
    setSkills([...skills, { skillName: newSkillName.trim(), proficiencyLevel: newSkillLevel }]);
    setNewSkillName('');
    setNewSkillLevel(1);
  };

  const handleRemoveSkill = (name: string) => {
    setSkills(skills.filter(s => s.skillName !== name));
  };

  const updateSkillLevel = (name: string, level: number) => {
    setSkills(skills.map(s => s.skillName === name ? { ...s, proficiencyLevel: level } : s));
  };

  const toggleFocusArea = (area: string) => {
    if (area === 'All') {
      setFocusAreas([]);
      return;
    }
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const submit = () => {
    if (!targetRole) {
      alert("Please select a target role.");
      return;
    }
    onGenerate({
      targetRole,
      skills,
      hoursPerWeek,
      focusAreas: focusAreas.length ? focusAreas : ['All'],
      learningStyle: learningStyle.replace(/^[^\w]+\s/, ''), // Remove emoji
      weekCount
    });
  };

  const renderStars = (level: number, onClick: (l: number) => void) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span 
            key={i} 
            onClick={() => onClick(i)}
            style={{ 
              cursor: 'pointer', 
              color: i <= level ? '#fbbf24' : '#475569',
              fontSize: '1.2rem'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', padding: '2rem',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflowY: 'auto'
        }}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          style={{
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem' }}>Customize Your Learning Path</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Target Role */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 600 }}>What role are you targeting?</label>
              <select 
                value={targetRole} 
                onChange={(e) => setTargetRole(e.target.value)}
                style={{ 
                  width: '100%', padding: '0.75rem', borderRadius: '8px', 
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${!targetRole ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, 
                  color: '#f1f5f9', outline: 'none'
                }}
              >
                <option value="">-- Select Target Role --</option>
                {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {!targetRole && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Required field</span>}
            </div>

            {/* Current Skills */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 600 }}>Confirm your current skills (we'll use this to personalize your path)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                {skills.map(s => (
                  <div key={s.skillName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 500, flex: 1 }}>{s.skillName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {renderStars(s.proficiencyLevel, (l) => updateSkillLevel(s.skillName, l))}
                      <button onClick={() => handleRemoveSkill(s.skillName)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.25rem' }}>×</button>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="New skill..." 
                    value={newSkillName} 
                    onChange={e => setNewSkillName(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                     {renderStars(newSkillLevel, setNewSkillLevel)}
                  </div>
                  <button onClick={handleAddSkill} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>+ Add</button>
                </div>
              </div>
            </div>

            {/* Learning Preferences */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 600 }}>Learning Preferences</label>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>How many hours per week can you study?</span>
                  <span style={{ color: '#6366f1', fontWeight: 700 }}>{hoursPerWeek}h</span>
                </div>
                <input 
                  type="range" min={2} max={20} step={1} value={hoursPerWeek} onChange={e => setHoursPerWeek(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Focus area preference?</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['All', 'Frontend', 'Backend', 'Cloud', 'DevOps', 'Data'].map(area => {
                    const active = area === 'All' ? focusAreas.length === 0 : focusAreas.includes(area);
                    return (
                      <button 
                        key={area}
                        onClick={() => toggleFocusArea(area)}
                        style={{
                          background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                          color: active ? '#a5b4fc' : '#cbd5e1',
                          padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem'
                        }}
                      >
                        {area}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Learning style?</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['📹 Video-focused', '📖 Reading-focused', '🛠️ Project-based', 'Mixed'].map(style => (
                    <button 
                      key={style}
                      onClick={() => setLearningStyle(style)}
                      style={{
                        background: learningStyle === style ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${learningStyle === style ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                        color: learningStyle === style ? '#6ee7b7' : '#cbd5e1',
                        padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem'
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Path Duration */}
            <div>
               <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 600 }}>Path Duration</label>
               <div style={{ display: 'flex', gap: '1rem' }}>
                  {[8, 12, 16].map(w => (
                    <label key={w} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="duration" 
                        value={w} 
                        checked={weekCount === w} 
                        onChange={() => setWeekCount(w)} 
                        style={{ accentColor: '#6366f1' }}
                      />
                      {w} weeks
                    </label>
                  ))}
               </div>
            </div>

          </div>

          <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#0f172a' }}>
            <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button onClick={submit} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>🤖 Generate My Roadmap</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LearningPathModal;
