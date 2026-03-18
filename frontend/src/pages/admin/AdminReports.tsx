import React, { useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Report {
  id: string;
  name: string;
  desc: string;
  icon: string;
  format: string;
  action: () => void;
}

const AdminReports: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('token') || '';

  const downloadFile = async (id: string, url: string, filename: string) => {
    setGenerating(id);
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const reports: Report[] = [
    {
      id: 'company-pdf',
      name: 'Company Skills Report',
      desc: 'Multi-page PDF: cover, KPI summary, department breakdown, top skill gaps, employee list.',
      icon: '📊',
      format: 'PDF',
      action: () => downloadFile('company-pdf', `${API_URL}/export/company-report/pdf`, `company-report-${today}.pdf`),
    },
    {
      id: 'employees-csv',
      name: 'Employee Readiness Export',
      desc: 'Full CSV export of all employees with name, department, role, readiness score, and skills.',
      icon: '👥',
      format: 'CSV',
      action: () => downloadFile('employees-csv', `${API_URL}/export/employees/csv`, `employees-export-${today}.csv`),
    },
    {
      id: 'critical-csv',
      name: 'Critical Gap Employees Export',
      desc: 'CSV of only employees with readiness score below 40% — for urgent intervention.',
      icon: '⚠️',
      format: 'CSV',
      action: () => downloadFile('critical-csv', `${API_URL}/export/employees/csv?filter=critical`, `critical-gaps-${today}.csv`),
    },
    {
      id: 'analytics-json',
      name: 'Platform Analytics Data',
      desc: 'Aggregated analytics: skill gaps, department breakdown, role distribution.',
      icon: '📈',
      format: 'JSON',
      action: async () => {
        setGenerating('analytics-json');
        try {
          const res = await fetch(`${API_URL}/export/analytics`, { headers: { Authorization: `Bearer ${getToken()}` } });
          const data = await res.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `platform-analytics-${today}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch {}
        finally { setGenerating(null); }
      },
    },
  ];

  const formatColor = (f: string) => ({ PDF: '#ef4444', CSV: '#6366f1', JSON: '#10b981' }[f] || '#94a3b8');

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Reports <span className="gradient-text">&amp; Export</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Generate and download real data reports from the platform.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {reports.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{r.name}</h3>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{r.desc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ background: `${formatColor(r.format)}20`, color: formatColor(r.format), border: `1px solid ${formatColor(r.format)}50`, padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                {r.format}
              </span>
              <button onClick={r.action} disabled={!!generating}
                style={{ background: generating === r.id ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', padding: '0.4rem 1rem', borderRadius: '8px', cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {generating === r.id ? '⏳ Generating...' : '⬇ Download'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Individual Employee PDF Section */}
      <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#f1f5f9' }}>📄 Individual Employee Reports</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
          Generate a personalized PDF report for any employee including their skill profile, gap analysis, AI learning path, and career advice.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            💡 Access individual employee PDFs from the Employee Management page → click an employee → view drawer → export button, or directly via:
          </p>
          <code style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.3rem 0.75rem', borderRadius: '6px', color: '#a5b4fc', fontSize: '0.8rem' }}>
            GET /api/export/employee/:id/pdf
          </code>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
