import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';

interface SearchResult {
  employees: { _id: string; name: string; currentRole: string; department: string }[];
  roles: { _id: string; roleName: string }[];
}

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer.current);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setQuery('');
    setOpen(false);
    setResults(null);
  };

  const hasResults = results && (results.employees.length > 0 || results.roles.length > 0);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="🔍 Search..."
        style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '0.4rem 0.75rem', color: '#e2e8f0', fontSize: '0.85rem',
          width: 200, outline: 'none', fontFamily: 'inherit', transition: 'width 0.3s',
        }}
        onFocusCapture={(e) => { (e.target as HTMLInputElement).style.width = '260px'; }}
        onBlurCapture={(e) => { (e.target as HTMLInputElement).style.width = '200px'; }}
      />

      <AnimatePresence>
        {open && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 999,
              width: 300, background: 'rgba(15,15,26,0.98)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12,
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)', overflow: 'hidden',
            }}
          >
            {loading && <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Searching...</div>}

            {!loading && !hasResults && <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No results found</div>}

            {!loading && results && results.employees.length > 0 && (
              <div>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>Employees</div>
                {results.employees.map((e) => (
                  <div
                    key={e._id}
                    onClick={() => go(`/employees/${e._id}`)}
                    style={{ padding: '0.6rem 1rem', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    onMouseEnter={(el) => (el.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                    onMouseLeave={(el) => (el.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '1rem' }}>👤</span>
                    <div>
                      <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{e.name}</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>{e.currentRole} · {e.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && results && results.roles.length > 0 && (
              <div>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>Roles</div>
                {results.roles.map((r) => (
                  <div key={r._id} style={{ padding: '0.6rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>🏷️</span>
                    <p style={{ color: '#e2e8f0', fontSize: '0.85rem', margin: 0 }}>{r.roleName}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
