import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

interface SkillRec {
  skillName: string;
  importance: number;
  reason: string;
}

interface SavedProject {
  title: string;
  description: string;
  requiredSkills: SkillRec[];
  savedAt: string;
}

const ProjectSkillMapper: React.FC = () => {
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState<SkillRec[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  useEffect(() => {
    loadSavedProjects();
  }, []);

  const loadSavedProjects = async () => {
    try {
      const res = await api.get('/employee/saved-projects');
      setSavedProjects(res.data.savedProjects || []);
    } catch (err) {
      console.error(err);
    }
  };

  const analyze = async () => {
    if (!description.trim()) { toast.error('Please enter a project description'); return; }
    setLoading(true);
    try {
      const res = await api.post('/ai/skill-recommendations', { projectDescription: description });
      const raw = res.data.skills;
      setSkills(Array.isArray(raw) ? raw : []);
      toast.success('✨ Skills Analyzed!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to analyze project');
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    if (!skills.length) return;
    setSaving(true);
    try {
      const res = await api.post('/employee/saved-projects', {
        title: title || 'Untitled Project',
        description,
        requiredSkills: skills
      });
      setSavedProjects(res.data.savedProjects);
      toast.success('Project saved!');
      setSkills([]);
      setDescription('');
      setTitle('');
    } catch (err) {
      toast.error('Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const importanceColor = (n: number) =>
    n >= 8 ? '#ef4444' : n >= 5 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 600px', minWidth: 300 }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Project <span className="gradient-text">Skill Mapper</span>
          </h1>
          <p style={{ color: '#94a3b8' }}>Describe a project and AI will identify the top 10 skills needed</p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
            Project Title (Optional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., GenAI Documentation Site"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '0.75rem', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', marginBottom: '1rem'
            }}
          />

          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
            Project Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project in detail... e.g., 'Build a real-time collaborative document editor with WebSockets, React frontend, and Node.js backend with MongoDB'"
            rows={5}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '0.75rem', color: '#e2e8f0', fontSize: '0.9rem',
              resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            className="btn-primary"
            onClick={analyze}
            disabled={loading || !description.trim()}
            style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing...</> : '🔍 Analyze Required Skills'}
          </button>
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, height: 80, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        )}

        {skills.length > 0 && !loading && (
          <>
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontWeight: 700, color: '#e2e8f0' }}>Top 10 Required Skills</h2>
                <span style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', color: '#c4b5fd', padding: '0.2rem 0.6rem', borderRadius: 12, border: '1px solid rgba(99,102,241,0.3)' }}>
                  ✨ AI Generated
                </span>
              </div>
              <button 
                onClick={saveProject} 
                className="btn-primary" 
                disabled={saving}
                style={{ background: '#10b981', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                {saving ? '⏳ Saving...' : '💾 Save to Profile'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {skills.map((skill, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-card"
                  style={{ padding: '1rem', borderLeft: `3px solid ${importanceColor(skill.importance)}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{skill.skillName}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: 6,
                      background: `${importanceColor(skill.importance)}22`, color: importanceColor(skill.importance)
                    }}>
                      {skill.importance}/10
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>{skill.reason}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {!skills.length && !loading && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
            <p style={{ color: '#94a3b8' }}>Describe your project above to discover which skills you need</p>
          </div>
        )}
      </div>

      {/* Saved Projects Sidebar */}
      <div style={{ flex: '1 1 300px', maxWidth: 400 }}>
        <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>📌 Saved Projects</h3>
        {savedProjects.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
            No saved projects yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {savedProjects.slice().reverse().map((p, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0', fontWeight: 600 }}>{p.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {p.requiredSkills.slice(0, 4).map((sk, i) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', color: '#cbd5e1' }}>
                      {sk.skillName}
                    </span>
                  ))}
                  {p.requiredSkills.length > 4 && (
                    <span style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', color: '#64748b' }}>
                      +{p.requiredSkills.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSkillMapper;
