import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const proficiencyColors: Record<number, string> = {
  0: 'rgba(255,255,255,0.04)',
  1: 'rgba(239,68,68,0.2)',
  2: 'rgba(245,158,11,0.2)',
  3: 'rgba(99,102,241,0.2)',
  4: 'rgba(16,185,129,0.2)',
  5: 'rgba(16,185,129,0.35)',
};
const proficiencyBorder: Record<number, string> = {
  0: 'rgba(255,255,255,0.08)',
  1: 'rgba(239,68,68,0.5)',
  2: 'rgba(245,158,11,0.5)',
  3: 'rgba(99,102,241,0.5)',
  4: 'rgba(16,185,129,0.5)',
  5: 'rgba(16,185,129,0.8)',
};

const AdminSkillsMatrix: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const saveTimeouts = useRef<Record<string, any>>({});

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchRoles(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Get all unique skills across all roles
  const allSkills = Array.from(
    new Set(roles.flatMap((r) => (r.requiredSkills || []).map((s: any) => s.skillName)))
  ).sort();

  const getLevel = (role: any, skillName: string): number => {
    const skill = (role.requiredSkills || []).find((s: any) => s.skillName === skillName);
    return skill?.minimumLevel || 0;
  };

  const handleCellChange = (role: any, skillName: string, newLevel: number) => {
    const cellKey = `${role._id}-${skillName}`;
    setSavingCell(cellKey);

    // Optimistic update
    setRoles((prev) => prev.map((r) => {
      if (r._id !== role._id) return r;
      let skills = [...(r.requiredSkills || [])];
      const idx = skills.findIndex((s: any) => s.skillName === skillName);
      if (newLevel === 0) {
        skills = skills.filter((s: any) => s.skillName !== skillName);
      } else if (idx === -1) {
        skills.push({ skillName, minimumLevel: newLevel, priority: 'important' });
      } else {
        skills[idx] = { ...skills[idx], minimumLevel: newLevel };
      }
      return { ...r, requiredSkills: skills };
    }));

    // Debounced save
    clearTimeout(saveTimeouts.current[cellKey]);
    saveTimeouts.current[cellKey] = setTimeout(async () => {
      try {
        const updatedRole = roles.find((r) => r._id === role._id);
        if (!updatedRole) return;
        let skills = [...(updatedRole.requiredSkills || [])];
        const idx = skills.findIndex((s: any) => s.skillName === skillName);
        if (newLevel === 0) skills = skills.filter((s: any) => s.skillName !== skillName);
        else if (idx === -1) skills.push({ skillName, minimumLevel: newLevel, priority: 'important' });
        else skills[idx] = { ...skills[idx], minimumLevel: newLevel };
        await api.put(`/roles/${role._id}`, { requiredSkills: skills });
      } catch { showToast('Failed to save cell.'); }
      finally { setSavingCell(null); }
    }, 1000);
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setSavingRole(true);
    try {
      await api.post('/roles', { roleName: newRoleName.trim(), requiredSkills: [] });
      await fetchRoles();
      setNewRoleName('');
      setShowAddModal(false);
      showToast('Role added!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add role.');
    } finally { setSavingRole(false); }
  };

  const handleDeleteRole = async (role: any, force = false) => {
    try {
      await api.delete(`/roles/${role._id}${force ? '?force=true' : ''}`);
      await fetchRoles();
      setDeleteConfirm(null);
      showToast('Role deleted.');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.canForce && !force) {
        setDeleteConfirm({ ...role, warning: data.message });
      } else {
        showToast(data?.message || 'Delete failed.');
      }
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#10b981', color: 'white', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 600, zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Skills <span className="gradient-text">Matrix Builder</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Define required skills per role. Click any cell to set proficiency level.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Role</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading skills matrix...</div>
      ) : roles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No roles found. Add your first role to start building the matrix.</div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600, background: 'rgba(99,102,241,0.05)', whiteSpace: 'nowrap', minWidth: 160 }}>Role / Skill</th>
                  {allSkills.map((skill) => (
                    <th key={skill} style={{ padding: '1rem 0.75rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600, background: 'rgba(99,102,241,0.05)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{skill}</th>
                  ))}
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600, background: 'rgba(99,102,241,0.05)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', background: 'rgba(99,102,241,0.02)' }}>
                      <div>{role.roleName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400, marginTop: '0.2rem' }}>{(role.requiredSkills || []).length} skills</div>
                    </td>
                    {allSkills.map((skill) => {
                      const level = getLevel(role, skill);
                      const cellKey = `${role._id}-${skill}`;
                      const isEditing = editingCell === cellKey;
                      const isSaving = savingCell === cellKey;
                      return (
                        <td key={skill} style={{ padding: '0.65rem', textAlign: 'center' }}
                          onClick={() => setEditingCell(isEditing ? null : cellKey)}>
                          {isEditing ? (
                            <select value={level} onChange={(e) => { handleCellChange(role, skill, +e.target.value); setEditingCell(null); }}
                              autoFocus
                              style={{ background: '#1a1a2e', border: '1px solid #6366f1', borderRadius: '6px', color: '#f1f5f9', padding: '0.3rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                              {[0, 1, 2, 3, 4, 5].map((l) => <option key={l} value={l} style={{ background: '#1a1a2e' }}>{l === 0 ? 'Not req.' : `Level ${l}`}</option>)}
                            </select>
                          ) : (
                            <motion.div whileHover={{ scale: 1.15 }} style={{
                              width: 32, height: 32, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: proficiencyColors[level] || proficiencyColors[0],
                              border: `1.5px solid ${proficiencyBorder[level] || proficiencyBorder[0]}`,
                              color: level > 0 ? '#f1f5f9' : '#334155',
                              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                            }}>
                              {isSaving ? '⌛' : level > 0 ? level : '—'}
                            </motion.div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => handleDeleteRole(role)}
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        {[['—', 0], ['L1 Beginner', 1], ['L2 Basic', 2], ['L3 Intermediate', 3], ['L4 Advanced', 4], ['L5 Expert', 5]].map(([label, lvl]) => (
          <span key={lvl} style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: proficiencyColors[lvl as number], border: `1.5px solid ${proficiencyBorder[lvl as number]}`, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {/* Add Role Modal */}
      {createPortal(
      <AnimatePresence>
      {showAddModal && (
        <>
          <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }} />
          <motion.div initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            style={{ position: 'fixed', top: '50%', left: '50%', width: '460px', maxWidth: '95vw', background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '2rem', zIndex: 301 }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontWeight: 700, color: '#f1f5f9' }}>Add New Role</h2>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>ROLE NAME</label>
            <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="e.g. ML Engineer"
              onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAddRole} disabled={savingRole} className="btn-primary" style={{ opacity: savingRole ? 0.7 : 1 }}>
                {savingRole ? 'Adding...' : 'Add Role'}
              </button>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>,
      document.body
      )}

      {/* Delete Confirmation */}
      {createPortal(
      <AnimatePresence>
      {deleteConfirm && (
        <>
          <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }} />
          <motion.div initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            style={{ position: 'fixed', top: '50%', left: '50%', width: 440, background: '#1a1a2e', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '2rem', zIndex: 301 }}>
            <h3 style={{ color: '#f1f5f9', margin: '0 0 1rem 0' }}>Delete Role: {deleteConfirm.roleName}?</h3>
            {deleteConfirm.warning && (
              <p style={{ color: '#fca5a5', margin: '0 0 0.75rem 0', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                ⚠️ {deleteConfirm.warning}
              </p>
            )}
            <p style={{ color: '#94a3b8', margin: '0 0 2rem 0' }}>
              {deleteConfirm.warning ? 'Proceed with force delete?' : 'This cannot be undone.'}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              {deleteConfirm.warning && (
                <button onClick={() => handleDeleteRole(deleteConfirm, true)}
                  style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>
                  Force Delete
                </button>
              )}
              {!deleteConfirm.warning && (
                <button onClick={() => handleDeleteRole(deleteConfirm)}
                  style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>
                  Delete
                </button>
              )}
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

export default AdminSkillsMatrix;
