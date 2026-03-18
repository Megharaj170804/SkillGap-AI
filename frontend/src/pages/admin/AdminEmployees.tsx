import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useSocket, connectSocket } from '../../hooks/useSocket';

const scoreColor = (n: number) => n >= 70 ? '#10b981' : n >= 40 ? '#f59e0b' : '#ef4444';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ─── Toast ────────────────────────────────────────────────────── */
let _toastId = 0;
const _toastListeners: Array<(t: any) => void> = [];
const showToast = (msg: string, type: 'success' | 'warning' | 'info' = 'info') => {
  const id = ++_toastId;
  _toastListeners.forEach((fn) => fn({ id, msg, type }));
};
const Toast = () => {
  const [toasts, setToasts] = useState<any[]>([]);
  useEffect(() => {
    const h = (t: any) => { setToasts((p) => [...p, t]); setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 4000); };
    _toastListeners.push(h);
    return () => { const i = _toastListeners.indexOf(h); if (i > -1) _toastListeners.splice(i, 1); };
  }, []);
  const bg = (t: string) => t === 'success' ? '#10b981' : t === 'warning' ? '#f59e0b' : '#6366f1';
  return createPortal(
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <AnimatePresence>
      {toasts.map((t) => (
        <motion.div key={t.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          style={{ background: bg(t.type), color: 'white', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: 340 }}>
          {t.msg}
        </motion.div>
      ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

/* ─── Add/Edit Employee Modal ──────────────────────────────────── */
const EmployeeModal = ({ employee, onClose, onSaved, roles }: any) => {
  const isEdit = !!employee;
  const [form, setForm] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    password: '',
    department: employee?.department || '',
    currentRole: employee?.currentRole || '',
    targetRole: employee?.targetRole || '',
    skills: employee?.skills || [],
  });
  const [errors, setErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState({ skillName: '', proficiencyLevel: 3 });

  const validate = async () => {
    const e: any = {};
    if (!form.name || form.name.length < 2) e.name = 'Name is required (min 2 chars)';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!isEdit && (!form.password || form.password.length < 6)) e.password = 'Password required (min 6 chars)';
    if (!form.department) e.department = 'Department required';
    if (!form.currentRole) e.currentRole = 'Current role required';
    if (!form.targetRole) e.targetRole = 'Target role required';
    if (form.skills.length === 0) e.skills = 'At least 1 skill required';

    if (!isEdit && form.email && !e.email) {
      try {
        const res = await api.get(`/employees/check-email?email=${encodeURIComponent(form.email)}`);
        if (!res.data.available) e.email = 'Email already in use';
      } catch {}
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!(await validate())) return;
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/employees/${employee._id}`, { name: form.name, department: form.department, currentRole: form.currentRole, targetRole: form.targetRole, skills: form.skills });
      } else {
        await api.post('/employees', form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.message || 'Failed to save employee' });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!skillInput.skillName.trim()) return;
    setForm((f) => ({ ...f, skills: [...f.skills, { ...skillInput, yearsOfExperience: 0 }] }));
    setSkillInput({ skillName: '', proficiencyLevel: 3 });
  };

  const removeSkill = (i: number) => setForm((f) => ({ ...f, skills: f.skills.filter((_: any, idx: number) => idx !== i) }));

  const departments = ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'HR', 'Operations'];
  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' };
  const errStyle: React.CSSProperties = { color: '#fca5a5', fontSize: '0.75rem', marginTop: '0.25rem' };
  const labelStyle: React.CSSProperties = { fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', display: 'block' };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }} />
      <motion.div initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
        style={{ position: 'fixed', top: '50%', left: '50%', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', background: '#1a1a2e', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '20px', padding: '2rem', zIndex: 301 }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 700, color: '#f1f5f9' }}>
          {isEdit ? 'Edit Employee' : 'Add New Employee'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[{ key: 'name', label: 'Full Name', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, ...(!isEdit ? [{ key: 'password', label: 'Password', type: 'password' }] : []), { key: 'currentRole', label: 'Current Role', type: 'text' }].map(({ key, label, type }) => (
            <div key={key}>
              <label style={labelStyle}>{label.toUpperCase()}</label>
              <input type={type} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={`Enter ${label}...`} style={inputStyle} />
              {errors[key] && <div style={errStyle}>{errors[key]}</div>}
            </div>
          ))}
          <div>
            <label style={labelStyle}>DEPARTMENT</label>
            <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="" style={{ background: '#1a1a2e' }}>Choose department...</option>
              {departments.map((d) => <option key={d} value={d} style={{ background: '#1a1a2e' }}>{d}</option>)}
            </select>
            {errors.department && <div style={errStyle}>{errors.department}</div>}
          </div>
          <div>
            <label style={labelStyle}>TARGET ROLE</label>
            <select value={form.targetRole} onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="" style={{ background: '#1a1a2e' }}>Choose target role...</option>
              {(roles || []).map((r: any) => <option key={r._id} value={r.roleName} style={{ background: '#1a1a2e' }}>{r.roleName}</option>)}
            </select>
            {errors.targetRole && <div style={errStyle}>{errors.targetRole}</div>}
          </div>

          {/* Skills */}
          <div>
            <label style={labelStyle}>SKILLS</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input value={skillInput.skillName} onChange={(e) => setSkillInput((s) => ({ ...s, skillName: e.target.value }))} placeholder="Skill name..." style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && addSkill()} />
              <select value={skillInput.proficiencyLevel} onChange={(e) => setSkillInput((s) => ({ ...s, proficiencyLevel: +e.target.value }))} style={{ ...inputStyle, width: '80px' }}>
                {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l} style={{ background: '#1a1a2e' }}>L{l}</option>)}
              </select>
              <button onClick={addSkill} style={{ background: '#6366f1', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {form.skills.map((s: any, i: number) => (
                <span key={i} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' }}
                  onClick={() => removeSkill(i)}>
                  {s.skillName} L{s.proficiencyLevel} ×
                </span>
              ))}
            </div>
            {errors.skills && <div style={errStyle}>{errors.skills}</div>}
          </div>

          {errors.submit && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>{errors.submit}</div>}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? '⏳ Saving...' : isEdit ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </motion.div>
    </>
  );
};

/* ─── Main Component ───────────────────────────────────────────── */
const AdminEmployees: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [employees, setEmployees] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState(searchParams.get('dept') || 'All');
  const [filterMode, setFilterMode] = useState(searchParams.get('filter') || 'All');
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; name: string } | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const searchDebounce = useRef<any>(null);

  const departments = ['All', 'Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'HR', 'Operations'];
  const filters = ['All', 'critical', 'on-track', 'inactive'];

  const fetchEmployees = useCallback(async (params?: any) => {
    setLoading(true);
    try {
      const res = await api.get('/employees', {
        params: {
          page: params?.page || currentPage,
          limit: 10,
          search: params?.search ?? search,
          dept: params?.dept ?? (deptFilter === 'All' ? '' : deptFilter),
          filter: params?.filter ?? (filterMode === 'All' ? '' : filterMode),
        },
      });
      setEmployees(res.data.employees || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, deptFilter, filterMode]);

  useEffect(() => { fetchEmployees(); }, [currentPage, deptFilter, filterMode]);
  useEffect(() => { api.get('/roles').then((r) => setRoles(r.data)).catch(() => {}); }, []);

  // Debounced search
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setCurrentPage(1);
      fetchEmployees({ search: val, page: 1 });
    }, 400);
  };

  // Socket
  useSocket({
    events: {
      stats_updated: () => fetchEmployees(),
      new_employee_added: ({ employee }: any) => {
        showToast(`✅ ${employee.name} added to ${employee.department}`, 'success');
        fetchEmployees();
      },
      bulk_progress: (data: any) => {
        setBulkProgress(data);
        if (data.complete) {
          setTimeout(() => { setBulkProgress(null); fetchEmployees(); }, 1500);
        }
      },
    },
  });

  useEffect(() => {
    const s = connectSocket();
    s.emit('join_room', 'admin_room');
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => {
    if (selectedIds.size === employees.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(employees.map((e) => e._id)));
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/employees/${id}`);
      showToast('Employee deleted.', 'success');
      setDeleteConfirm(null);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Delete failed.', 'warning');
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) { await api.delete(`/employees/${id}`).catch(() => {}); }
    setSelectedIds(new Set());
    fetchEmployees();
    showToast(`Deleted ${selectedIds.size} employees.`, 'success');
  };

  const handleGenerateAI = async (empId: string, empName: string) => {
    setAiLoading(empId);
    try {
      await api.post(`/ai/learning-path/${empId}`);
      showToast(`✅ AI path generated for ${empName}!`, 'success');
      fetchEmployees();
    } catch (err) {
      showToast(`Failed to generate path for ${empName}`, 'warning');
    } finally {
      setAiLoading(null);
    }
  };

  const handleBulkAI = async () => {
    setBulkProgress({ done: 0, total: employees.length, name: 'Starting...' });
    try {
      await api.post('/admin/bulk-ai-paths');
    } catch {}
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (deptFilter !== 'All') params.set('dept', deptFilter);
    if (filterMode !== 'All') params.set('filter', filterMode);
    if (search) params.set('search', search);
    window.location.href = `${API_URL}/export/employees/csv?${params.toString()}&authorization=${token}`;
  };

  const SortIcon = () => <span style={{ marginLeft: 4, opacity: 0.3 }}>↕</span>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <Toast />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Employee <span className="gradient-text">Management</span></h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>{total} employees total</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={handleExportCSV}>📥 Export CSV</button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Employee</button>
        </div>
      </div>

      {/* Bulk Progress Modal */}
      {createPortal(
      <AnimatePresence>
        {bulkProgress && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400 }} />
            <motion.div initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
              style={{ position: 'fixed', top: '50%', left: '50%', width: 460, background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '2rem', zIndex: 401 }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#f1f5f9' }}>🤖 Generating AI Learning Paths</h3>
              <p style={{ color: '#94a3b8', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Processing: {bulkProgress.name}</p>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, marginBottom: '1rem' }}>
                <motion.div style={{ height: '100%', background: '#6366f1', borderRadius: 5 }}
                  animate={{ width: `${(bulkProgress.done / Math.max(bulkProgress.total, 1)) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
              <div style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>
                {bulkProgress.done} / {bulkProgress.total} employees
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="🔍 Search by name or email..." value={search} onChange={(e) => handleSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 1rem', color: '#f1f5f9', outline: 'none' }} />
        <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 1rem', color: '#f1f5f9' }}>
          {departments.map((d) => <option key={d} value={d} style={{ background: '#1a1a2e' }}>{d}</option>)}
        </select>
        <select value={filterMode} onChange={(e) => { setFilterMode(e.target.value); setCurrentPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem 1rem', color: '#f1f5f9' }}>
          {filters.map((f) => <option key={f} value={f} style={{ background: '#1a1a2e' }}>{f === 'All' ? 'All Status' : f}</option>)}
        </select>
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <button onClick={handleBulkAI}
              style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              🤖 Generate AI Paths ({selectedIds.size})
            </button>
            <button onClick={handleBulkDelete}
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              🗑️ Delete ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th style={{ padding: '1rem', width: 40 }}>
                  <input type="checkbox" checked={selectedIds.size === employees.length && employees.length > 0} onChange={selectAll} />
                </th>
                {['Name', 'Department', 'Current Role', 'Readiness', 'Actions'].map((col) => (
                  <th key={col} style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {col} {col !== 'Actions' && <SortIcon />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading employees...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No employees match your filters.</td></tr>
              ) : employees.map((emp, i) => (
                <motion.tr key={emp._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: selectedIds.has(emp._id) ? 'rgba(99,102,241,0.07)' : 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = selectedIds.has(emp._id) ? 'rgba(99,102,241,0.07)' : 'transparent')}>
                  <td style={{ padding: '0.9rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(emp._id)} onChange={() => toggleSelect(emp._id)} />
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }} onClick={() => setSelectedEmployee(emp)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, #6366f1, ${scoreColor(emp.gapScore || 0)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {emp.name?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#94a3b8' }} onClick={() => setSelectedEmployee(emp)}>{emp.department}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#94a3b8' }} onClick={() => setSelectedEmployee(emp)}>{emp.currentRole}</td>
                  <td style={{ padding: '0.9rem 1rem' }} onClick={() => setSelectedEmployee(emp)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ height: '100%', width: `${emp.gapScore || 0}%`, background: scoreColor(emp.gapScore || 0), borderRadius: 3 }} />
                      </div>
                      <span style={{ color: scoreColor(emp.gapScore || 0), fontWeight: 700, minWidth: 36 }}>{emp.gapScore || 0}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditEmployee(emp); }}
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(emp._id); }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer' }}>← Prev</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setCurrentPage(p)}
                style={{ background: p === currentPage ? '#6366f1' : 'transparent', border: `1px solid ${p === currentPage ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, color: p === currentPage ? 'white' : '#94a3b8', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', minWidth: 36 }}>
                {p}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))} disabled={currentPage === pages}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer' }}>Next →</button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {createPortal(
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400 }} />
            <motion.div initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
              style={{ position: 'fixed', top: '50%', left: '50%', width: 420, background: '#1a1a2e', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '2rem', zIndex: 401 }}>
              <h3 style={{ color: '#f1f5f9', margin: '0 0 1rem 0' }}>Delete Employee?</h3>
              <p style={{ color: '#94a3b8', margin: '0 0 2rem 0' }}>This will permanently delete the employee and all their data. This cannot be undone.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm!)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>Delete</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Employee View Drawer */}
      {createPortal(
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEmployee(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
              style={{ position: 'fixed', top: 0, right: 0, width: 440, height: '100vh', background: '#0f1626', borderLeft: '1px solid rgba(99,102,241,0.3)', zIndex: 201, overflowY: 'auto', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, #6366f1, ${scoreColor(selectedEmployee.gapScore || 0)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem', color: 'white', marginBottom: '0.75rem' }}>
                    {selectedEmployee.name?.[0]}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#f1f5f9' }}>{selectedEmployee.name}</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#6366f1', fontWeight: 600 }}>{selectedEmployee.currentRole}</p>
                  <p style={{ margin: '0.1rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>{selectedEmployee.email}</p>
                </div>
                <button onClick={() => setSelectedEmployee(null)}
                  style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#94a3b8', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[['Department', selectedEmployee.department], ['Target Role', selectedEmployee.targetRole || 'Not set'], ['Skills', selectedEmployee.skills?.length || 0], ['AI Path', selectedEmployee.aiLearningPath?.length > 0 ? 'Generated' : 'Pending']].map(([k, v]) => (
                  <div key={k} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.25rem' }}>{k}</div>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>{String(v)}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#94a3b8' }}>Readiness Score</span>
                  <span style={{ fontWeight: 700, color: scoreColor(selectedEmployee.gapScore || 0) }}>{selectedEmployee.gapScore || 0}%</span>
                </div>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5 }}>
                  <div style={{ height: '100%', width: `${selectedEmployee.gapScore || 0}%`, background: scoreColor(selectedEmployee.gapScore || 0), borderRadius: 5 }} />
                </div>
              </div>

              {selectedEmployee.skills?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#94a3b8', marginBottom: '0.75rem', fontSize: '0.82rem', fontWeight: 600 }}>CURRENT SKILLS</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedEmployee.skills.slice(0, 8).map((s: any) => (
                      <span key={s.skillName} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem' }}>
                        {s.skillName} L{s.proficiencyLevel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => handleGenerateAI(selectedEmployee._id, selectedEmployee.name)} disabled={!!aiLoading} className="btn-primary" style={{ width: '100%', opacity: aiLoading ? 0.7 : 1 }}>
                  {aiLoading === selectedEmployee._id ? '⏳ Generating...' : '🤖 Generate AI Learning Path'}
                </button>
                <button onClick={() => { setEditEmployee(selectedEmployee); setSelectedEmployee(null); }}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.7rem', borderRadius: '10px', cursor: 'pointer', width: '100%' }}>
                  ✏️ Edit Details
                </button>
                <button onClick={() => setDeleteConfirm(selectedEmployee._id)}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.7rem', borderRadius: '10px', cursor: 'pointer', width: '100%' }}>
                  🗑️ Delete Employee
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Modals */}
      {createPortal(
      <AnimatePresence>
        {(showAddModal || editEmployee) && (
          <EmployeeModal
            employee={editEmployee}
            roles={roles}
            onClose={() => { setShowAddModal(false); setEditEmployee(null); }}
            onSaved={() => { fetchEmployees(); showToast(editEmployee ? 'Employee updated!' : 'Employee added!', 'success'); }}
          />
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
};

export default AdminEmployees;
