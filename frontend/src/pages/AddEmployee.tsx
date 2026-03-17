import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface SkillInput {
  skillName: string;
  proficiencyLevel: number;
  yearsOfExperience: number;
}

const DEPARTMENTS = ['Engineering', 'Data Science', 'Design', 'Marketing', 'Product', 'Operations'];

const AddEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: 'Engineering',
    currentRole: '', targetRole: '',
  });
  const [skills, setSkills] = useState<SkillInput[]>([{ skillName: '', proficiencyLevel: 3, yearsOfExperience: 1 }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateSkill = (i: number, field: keyof SkillInput, value: string | number) => {
    const updated = [...skills];
    (updated[i] as any)[field] = value;
    setSkills(updated);
  };

  const addSkill = () => setSkills([...skills, { skillName: '', proficiencyLevel: 3, yearsOfExperience: 1 }]);
  const removeSkill = (i: number) => setSkills(skills.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, skills: skills.filter((s) => s.skillName.trim()) };
      await api.post('/employees', payload);
      setSuccess('Employee created successfully!');
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create employee.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
      <button onClick={() => navigate('/employees')} className="btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>← Back to Employees</button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Add <span className="gradient-text">New Employee</span></h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Create a new employee profile and login account</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic info */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem', color: '#e2e8f0' }}>Basic Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'jane@company.com' },
              { name: 'password', label: 'Login Password', type: 'password', placeholder: '••••••••' },
              { name: 'currentRole', label: 'Current Role', type: 'text', placeholder: 'Junior Developer' },
              { name: 'targetRole', label: 'Target Role', type: 'text', placeholder: 'Senior Developer' },
            ].map((field) => (
              <div key={field.name} style={{ gridColumn: field.name === 'currentRole' || field.name === 'targetRole' ? undefined : undefined }}>
                <label className="form-label">{field.label}</label>
                <input
                  id={`add-${field.name}`}
                  type={field.type}
                  name={field.name}
                  className="form-input"
                  placeholder={field.placeholder}
                  value={(form as any)[field.name]}
                  onChange={handleChange}
                  required={field.name !== 'targetRole'}
                />
              </div>
            ))}
            <div>
              <label className="form-label">Department</label>
              <select id="add-department" name="department" className="form-input" value={form.department} onChange={handleChange}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>Skills</h2>
            <button type="button" className="btn-secondary" onClick={addSkill} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} id="add-skill-btn">+ Add Skill</button>
          </div>
          {skills.map((skill, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center', marginBottom: '0.6rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Skill name (e.g. React)"
                value={skill.skillName}
                onChange={(e) => updateSkill(i, 'skillName', e.target.value)}
                id={`skill-name-${i}`}
              />
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Level {skill.proficiencyLevel}/5</label>
                <input
                  type="range" min={1} max={5} value={skill.proficiencyLevel}
                  onChange={(e) => updateSkill(i, 'proficiencyLevel', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                  id={`skill-level-${i}`}
                />
              </div>
              <input
                type="number" min={0} max={30}
                className="form-input"
                placeholder="Years exp."
                value={skill.yearsOfExperience}
                onChange={(e) => updateSkill(i, 'yearsOfExperience', parseFloat(e.target.value))}
                id={`skill-exp-${i}`}
              />
              <button type="button" onClick={() => removeSkill(i)}
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
            </div>
          ))}
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>{success}</div>}

        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading} id="create-emp-submit">
          {loading ? 'Creating Employee...' : 'Create Employee'}
        </button>
      </form>
    </div>
  );
};

export default AddEmployee;
