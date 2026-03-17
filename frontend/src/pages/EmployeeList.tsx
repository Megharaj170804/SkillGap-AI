import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import EmployeeCard from '../components/EmployeeCard';
import { useAuth } from '../context/AuthContext';

interface Employee {
  _id: string;
  name: string;
  email: string;
  currentRole: string;
  targetRole: string;
  department: string;
}

const EmployeeList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.get('/employees')
      .then((res) => setEmployees(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load employees.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((e) => e._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.currentRole.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>All <span className="gradient-text">Employees</span></h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{employees.length} total employees</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            id="employee-search"
            type="text"
            className="form-input"
            placeholder="Search by name, dept, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
          {user?.role === 'admin' && (
            <button className="btn-primary" onClick={() => navigate('/employees/add')} id="add-emp-btn">+ Add Employee</button>
          )}
        </div>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>}
      {error && <div style={{ color: '#fca5a5', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', marginBottom: '1rem' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtered.map((emp) => (
            <div key={emp._id} style={{ position: 'relative' }}>
              <EmployeeCard
                id={emp._id}
                name={emp.name}
                currentRole={emp.currentRole}
                targetRole={emp.targetRole}
                department={emp.department}
              />
              {user?.role === 'admin' && (
                <button
                  className="btn-danger"
                  onClick={(e) => { e.stopPropagation(); handleDelete(emp._id, emp.name); }}
                  disabled={deleting === emp._id}
                  style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  {deleting === emp._id ? '...' : 'Delete'}
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>No employees found matching your search.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
