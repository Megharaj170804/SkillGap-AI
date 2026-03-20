import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const reportTemplates = [
  { id: 'summary', name: 'Team Weekly Digest', desc: 'Summary of team learning activity, progress, and alerts for the past week.', icon: '📋', format: 'PDF', lastGenerated: 'Never' },
  { id: 'csv', name: 'Member Progress Export', desc: 'Full data export of all team members\' learning progress and readiness.', icon: '📊', format: 'CSV', lastGenerated: 'Never' },
];

const ManagerReports: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = async (id: string, format: string) => {
    setGenerating(id);
    const url = id === 'csv' ? '/manager/reports/team-csv' : '/manager/reports/team-summary';
    const mimeType = format === 'PDF' ? 'application/pdf' : 'text/csv';
    const ext = format.toLowerCase();
    
    try {
      const res = await api.get(url, { responseType: 'blob' });
      
      const blobURL = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      const link = document.createElement('a');
      link.href = blobURL;
      link.setAttribute('download', `team_report_${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('Failed to generate report', err);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const formatColor = (f: string) => ({ PDF: '#ef4444', CSV: '#6366f1' }[f] || '#94a3b8');

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My <span className="gradient-text">Reports</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Generate and share team reports with stakeholders.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {reportTemplates.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>{r.icon}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{r.name}</h3>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{r.desc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ background: `${formatColor(r.format)}20`, color: formatColor(r.format), border: `1px solid ${formatColor(r.format)}50`, padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>{r.format}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Last: {r.lastGenerated}</span>
              </div>
              <button onClick={() => handleGenerate(r.id, r.format)} disabled={!!generating} style={{ background: generating === r.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc', padding: '0.4rem 1rem', borderRadius: '8px', cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                {generating === r.id ? '⏳ Generating...' : '⬇ Generate'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 700, color: '#f1f5f9' }}>📤 Shareable Report Links</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Generate public links that expire after 7 days for stakeholder sharing.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { name: 'Team Weekly Digest – Current', link: 'https://skillgap.app/reports/shared/xyz123', expires: 'In 7 days' },
          ].map(link => (
            <div key={link.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>{link.name}</div>
                <code style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.4rem', display: 'block', background: 'rgba(99, 102, 241, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{link.link}</code>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Expires: {link.expires}</span>
                <button onClick={() => toast('Link copied to clipboard (mock)', { icon: '🔗' })} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Copy Link</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => toast('Custom shareable report creation coming soon.', { icon: 'ℹ️' })} className="btn-secondary" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>+ Share a New Report</button>
      </div>
    </div>
  );
};

export default ManagerReports;
