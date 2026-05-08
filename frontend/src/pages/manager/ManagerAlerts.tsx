import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
  _id: string;
  name: string;
  email: string;
  currentRole: string;
  targetRole: string;
  gapScore: number;
  department: string;
  avatar: string;
  lastActive: string;
  inactiveDays: number;
  improvementPercent?: number;
  weeklyGoalHours: number;
  aiPathGenerated: boolean;
}

interface Alert {
  _id: string;
  type: 'critical' | 'inactive' | 'info' | 'positive';
  severity: 'critical' | 'warning' | 'info' | 'positive';
  employee: Employee;
  message: string;
  triggeredAt: string;
  nudgedToday: boolean;
  aiPathExists: boolean;
}

// ─── Per-type theme config ────────────────────────────────────────────────────

const THEME = {
  critical: {
    icon: '🔴',
    glow: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
    bg: 'rgba(239,68,68,0.08)',
    accent: '#fca5a5',
    badge: 'rgba(239,68,68,0.2)',
    label: 'CRITICAL',
  },
  inactive: {
    icon: '🟡',
    glow: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    bg: 'rgba(245,158,11,0.08)',
    accent: '#fcd34d',
    badge: 'rgba(245,158,11,0.2)',
    label: 'INACTIVE',
  },
  info: {
    icon: 'ℹ️',
    glow: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.35)',
    bg: 'rgba(56,189,248,0.08)',
    accent: '#7dd3fc',
    badge: 'rgba(56,189,248,0.2)',
    label: 'INFO',
  },
  positive: {
    icon: '🟢',
    glow: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
    bg: 'rgba(16,185,129,0.08)',
    accent: '#6ee7b7',
    badge: 'rgba(16,185,129,0.2)',
    label: 'ACHIEVEMENT',
  },
} as const;

// ─── Goal Popover ─────────────────────────────────────────────────────────────

const GoalPopover: React.FC<{
  employeeId: string;
  employeeName: string;
  currentGoal: number;
  mode: 'set' | 'adjust';
  onClose: () => void;
  onSaved: (hours: number) => void;
}> = ({ employeeId, employeeName, currentGoal, mode, onClose, onSaved }) => {
  const [hours, setHours] = useState(currentGoal || 10);
  const [saving, setSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/manager/employee-goal/${employeeId}`, { weeklyGoalHours: hours });
      toast.success(`Goal set to ${hours}h/week for ${employeeName}`);
      onSaved(hours);
      onClose();
    } catch {
      toast.error('Failed to update goal');
    } finally {
      setSaving(false);
    }
  };

  const firstNameStr = employeeName.split(' ')[0];
  const suggestions = mode === 'adjust'
    ? [currentGoal - 2, currentGoal - 4].filter(v => v > 0)
    : [];

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: 0,
        zIndex: 200,
        background: 'linear-gradient(135deg,#1e293b,#0f172a)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '14px',
        padding: '1.25rem',
        width: '280px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      }}
    >
      <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.25rem 0' }}>
        {mode === 'adjust' ? `Adjust Goal for ${firstNameStr}` : `Set Weekly Goal for ${firstNameStr}`}
      </p>
      {mode === 'adjust' && (
        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.75rem 0' }}>
          Current goal: {currentGoal}h/week
        </p>
      )}

      {mode === 'adjust' ? (
        <>
          <input
            type="range" min={1} max={20} value={hours}
            onChange={e => setHours(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#f59e0b', marginBottom: '0.4rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.75rem' }}>
            <span>1h</span>
            <span style={{ color: '#fcd34d', fontWeight: 700 }}>{hours}h/week</span>
            <span>20h</span>
          </div>
          {suggestions.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {suggestions.map(v => (
                <button
                  key={v}
                  onClick={() => setHours(v)}
                  style={{ flex: 1, padding: '0.3rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  Reduce to {v}h
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>Hours per week</label>
          <input
            type="number" min={1} max={40} value={hours}
            onChange={e => setHours(Number(e.target.value))}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#f1f5f9', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onClose}
          style={{ flex: 1, padding: '0.45rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem' }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          style={{ flex: 1, padding: '0.45rem', background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.5)', color: '#93c5fd', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.78rem' }}
        >
          {saving ? 'Saving…' : 'Save Goal'}
        </button>
      </div>
    </div>
  );
};

// ─── Praise Modal ─────────────────────────────────────────────────────────────

const PraiseModal: React.FC<{
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ employee, isOpen, onClose, onSuccess }) => {
  const [message, setMessage] = useState(`Excellent work this week, ${employee.name.split(' ')[0]}!\nYour dedication to improving your skills is truly impressive. Keep it up!`);
  const [certType, setCertType] = useState('excellence');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSending(true);
    try {
      await api.post('/manager/send-praise', {
        employeeId: employee._id,
        message,
        certificateType: certType,
        achievementText: `Improved readiness by ${employee.improvementPercent || 15}% this week`,
        improvementPercent: employee.improvementPercent || 15
      });
      toast.success(`🏆 Certificate sent to ${employee.name.split(' ')[0]}! They can view it in Achievements.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Failed to send praise. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
        width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏆 Send Praise to {employee.name}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
          <strong>Achievement:</strong> "Improved readiness by {employee.improvementPercent || 15}% this week — currently at {employee.gapScore}%!"
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Personalize your message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '8px', padding: '0.75rem', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Certificate Type:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { id: 'excellence', label: '🌟 Excellence Award' },
              { id: 'most_improved', label: '📈 Most Improved' },
              { id: 'skill_champion', label: '💪 Skill Champion' },
              { id: 'consistency_star', label: '🔥 Consistency Star' }
            ].map((type) => (
              <label key={type.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: certType === type.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${certType === type.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <input type="radio" name="cert_type" value={type.id} checked={certType === type.id} onChange={(e) => setCertType(e.target.value)} style={{ accentColor: '#6366f1' }} />
                <span style={{ color: certType === type.id ? '#f8fafc' : '#cbd5e1', fontWeight: certType === type.id ? 600 : 400 }}>{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={sending || !message.trim()} style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: sending || !message.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: sending || !message.trim() ? 0.7 : 1, transition: 'all 0.2s' }}>
            {sending ? 'Sending...' : '🏆 Send Praise & Certificate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── AlertCard ────────────────────────────────────────────────────────────────

const AlertCard: React.FC<{
  alert: Alert;
  onDismiss: (id: string) => void;
}> = ({ alert, onDismiss }) => {
  const navigate = useNavigate();
  const theme = THEME[alert.type] || THEME.info;
  const emp = alert.employee;

  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeDone, setNudgeDone] = useState(false);
  const [pathLoading, setPathLoading] = useState(false);
  const [pathDone, setPathDone] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const [showGoalPopover, setShowGoalPopover] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(emp.weeklyGoalHours || 10);
  const [showPraiseModal, setShowPraiseModal] = useState(false);
  const [praiseSent, setPraiseSent] = useState(false);
  
  const [nudgesUsed, setNudgesUsed] = useState(0);
  const [nudgesRemaining, setNudgesRemaining] = useState(5);

  useEffect(() => {
    const fetchNudgeCount = async () => {
      try {
        const res = await api.get(`/manager/nudge-count/${emp._id}`);
        setNudgesUsed(res.data.nudgesUsed);
        setNudgesRemaining(res.data.nudgesRemaining);
        if (res.data.nudgesRemaining <= 0) {
          setNudgeDone(true);
        }
      } catch (err) {
        // silent fail
      }
    };
    fetchNudgeCount();
    
    if (localStorage.getItem(`praise_${emp._id}`)) {
      setPraiseSent(true);
    }
  }, [emp._id]);

  // Restore state from localStorage on mount
  useEffect(() => {
    if (localStorage.getItem(`path_${emp._id}`) === 'done' || alert.aiPathExists) {
      setPathDone(true);
    }
  }, [emp._id, alert.aiPathExists]);

  // Sync server-side nudgedToday
  useEffect(() => {
    if (alert.nudgedToday) setNudgeDone(true);
  }, [alert.nudgedToday]);

  // ── Handlers ──

  const handleNudge = async () => {
    setNudgeLoading(true);
    try {
      const res = await api.post(`/manager/nudge/${emp._id}`);
      setNudgesUsed(res.data.nudgesUsed || nudgesUsed + 1);
      setNudgesRemaining(res.data.nudgesRemaining ?? (nudgesRemaining - 1));
      
      if (res.data.nudgesRemaining <= 0) {
        setNudgeDone(true);
      }
      
      toast.success(`Nudge sent! (${res.data.nudgesUsed || nudgesUsed + 1}/5 today)`);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setNudgeDone(true);
        toast.error('Daily nudge limit reached (5/5). Resets at midnight.');
      } else {
        toast.error('Failed to send nudge. Try again.');
      }
    } finally {
      setNudgeLoading(false);
    }
  };

  const handleGeneratePath = async () => {
    setPathLoading(true);
    try {
      await api.post(`/ai/learning-path/${emp._id}`, { forceRegenerate: false });
      setPathDone(true);
      localStorage.setItem(`path_${emp._id}`, 'done');
      toast.success(`✅ AI Learning Path generated for ${emp.name}!`);
    } catch (err: any) {
      if (err?.response?.data?.quotaError) {
        toast.error('AI quota exceeded. Try again tomorrow.');
      } else {
        toast.error('Failed to generate path. Try again.');
      }
    } finally {
      setPathLoading(false);
    }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await api.post(`/manager/alerts/${alert._id}/dismiss`);
      localStorage.setItem(`dismissed_alert_${alert._id}`, Date.now().toString());
      toast.success('Alert dismissed for 7 days');
      setTimeout(() => onDismiss(alert._id), 280);
    } catch {
      toast.error('Could not dismiss alert');
      setDismissing(false);
    }
  };

  const handleShare = async () => {
    setShareLoading(true);
    try {
      await api.post('/manager/share-achievement', {
        employeeId: emp._id,
        message: `${emp.name} improved their readiness by ${emp.improvementPercent ?? 12}% — currently at ${emp.gapScore}%!`,
      });
      setShareDone(true);
      toast.success('Achievement shared with Admin! 📤');
    } catch {
      toast.error('Failed to share achievement');
    } finally {
      setShareLoading(false);
    }
  };

  // ── Shared button styles ──

  const btn = (color: string, active = true) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.38rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: active ? 'pointer' : 'not-allowed',
    transition: 'all 0.15s',
    background: color,
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#f1f5f9',
    flexShrink: 0 as const,
  });

  const ghostBtn = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.38rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#64748b',
    marginLeft: 'auto',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: dismissing ? 0 : 1, scale: dismissing ? 0.97 : 1, y: 0 }}
      exit={{ opacity: 0, x: 30, height: 0, overflow: 'hidden', marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '14px',
        padding: '1.1rem 1.35rem',
        boxShadow: `0 0 24px ${theme.glow}`,
        pointerEvents: dismissing ? 'none' : 'auto',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          {/* Avatar */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${theme.accent}25`, border: `1.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: theme.accent, flexShrink: 0 }}>
            {emp.avatar}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>{emp.name}</span>
              <span style={{ background: theme.badge, color: theme.accent, padding: '0.1rem 0.5rem', borderRadius: '20px', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em' }}>{theme.label}</span>
            </div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.1rem' }}>{emp.currentRole} · {emp.department}</div>
          </div>
        </div>
        {/* Readiness badge */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: emp.gapScore < 40 ? '#f87171' : emp.gapScore < 70 ? '#fbbf24' : '#34d399' }}>
            {emp.gapScore}%
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>readiness</div>
        </div>
      </div>

      {/* Message */}
      <p style={{ margin: '0 0 0.9rem 0', fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.55 }}>
        <span style={{ fontSize: '1rem', marginRight: '0.4rem' }}>{theme.icon}</span>
        {alert.message}
      </p>

      {/* ── Action buttons by type ── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>

        {/* CRITICAL */}
        {alert.type === 'critical' && <>
          <button style={btn('rgba(99,102,241,0.2)')} onClick={() => navigate(`/employees/${emp._id}`)}>
            👁 View Profile
          </button>
          <button
            style={btn(nudgeDone ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.25)', !nudgeDone && !nudgeLoading)}
            onClick={handleNudge}
            disabled={nudgeDone || nudgeLoading}
          >
            {nudgeDone ? '✓ Limit Reached (5/5)' : nudgeLoading ? '⏳ Sending…' : `💬 Nudge (${nudgesRemaining} left)`}
          </button>
          <button style={btn('rgba(99,102,241,0.2)')} onClick={() => navigate(`/employees/${emp._id}/learning`)}>
            📈 View Progress
          </button>
          {(!pathDone && !alert.aiPathExists) && (
            <button
              style={btn('rgba(168,85,247,0.25)', !pathLoading)}
              onClick={handleGeneratePath}
              disabled={pathLoading}
            >
              {pathLoading ? '⏳ Generating…' : '🤖 Generate AI Path'}
            </button>
          )}
          <button style={ghostBtn} onClick={handleDismiss}>✕ Dismiss</button>
        </>}

        {/* INACTIVE */}
        {alert.type === 'inactive' && <>
          <button
            style={btn(nudgeDone ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.25)', !nudgeDone && !nudgeLoading)}
            onClick={handleNudge}
            disabled={nudgeDone || nudgeLoading}
          >
            {nudgeDone ? '✓ Limit Reached (5/5)' : nudgeLoading ? '⏳ Sending…' : `💬 Nudge (${nudgesRemaining} left)`}
          </button>
          <button style={btn('rgba(99,102,241,0.2)')} onClick={() => navigate(`/employees/${emp._id}/learning`)}>
            📋 View Progress
          </button>
          <div style={{ position: 'relative' }}>
            <button
              style={btn('rgba(245,158,11,0.2)')}
              onClick={() => setShowGoalPopover(v => !v)}
            >
              📅 Set Weekly Goal
            </button>
            {showGoalPopover && (
              <GoalPopover
                employeeId={emp._id}
                employeeName={emp.name}
                currentGoal={currentGoal}
                mode="set"
                onClose={() => setShowGoalPopover(false)}
                onSaved={h => setCurrentGoal(h)}
              />
            )}
          </div>
          <button style={ghostBtn} onClick={handleDismiss}>✕ Dismiss</button>
        </>}

        {/* INFO — no AI path */}
        {alert.type === 'info' && <>
          <button
            style={btn(pathDone ? 'rgba(16,185,129,0.2)' : 'rgba(168,85,247,0.25)', !pathDone && !pathLoading)}
            onClick={handleGeneratePath}
            disabled={pathDone || pathLoading}
          >
            {pathLoading ? '⏳ Generating…' : pathDone ? '✓ Path Ready' : '🤖 Generate AI Path'}
          </button>
          <button
            style={btn(nudgeDone ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.25)', !nudgeDone && !nudgeLoading)}
            onClick={handleNudge}
            disabled={nudgeDone || nudgeLoading}
          >
            {nudgeDone ? '✓ Limit Reached (5/5)' : nudgeLoading ? '⏳ Sending…' : `💬 Nudge (${nudgesRemaining} left)`}
          </button>
          <button style={btn('rgba(99,102,241,0.2)')} onClick={() => navigate(`/employees/${emp._id}/learning`)}>
            📋 View Progress
          </button>
          <button style={ghostBtn} onClick={handleDismiss}>✕ Dismiss</button>
        </>}

        {/* POSITIVE */}
        {alert.type === 'positive' && <>
          <button
            style={btn(praiseSent ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.4) 100%)', !praiseSent)}
            onClick={() => setShowPraiseModal(true)}
            disabled={praiseSent}
          >
            {praiseSent ? '✓ Praise Sent 🏆' : '🎉 Send Praise'}
          </button>
          <button style={btn('rgba(99,102,241,0.2)')} onClick={() => navigate(`/employees/${emp._id}/learning`)}>
            👁 View Progress
          </button>
          <button
            style={btn(shareDone ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.25)', !shareDone && !shareLoading)}
            onClick={handleShare}
            disabled={shareDone || shareLoading}
          >
            {shareLoading ? '⏳…' : shareDone ? '✓ Shared' : '📤 Share with Admin'}
          </button>
          <button style={ghostBtn} onClick={handleDismiss}>✕ Dismiss</button>
        </>}

      </div>
      <PraiseModal 
        employee={emp} 
        isOpen={showPraiseModal} 
        onClose={() => setShowPraiseModal(false)}
        onSuccess={() => {
          setPraiseSent(true);
          localStorage.setItem(`praise_${emp._id}`, Date.now().toString());
        }}
      />
    </motion.div>
  );
};

// ─── Alert type filter tabs ──────────────────────────────────────────────────

const TABS = [
  { key: 'all',      label: 'All',         icon: '🔔' },
  { key: 'critical', label: 'Critical',    icon: '🔴' },
  { key: 'inactive', label: 'Inactive',    icon: '🟡' },
  { key: 'info',     label: 'No AI Path',  icon: 'ℹ️' },
  { key: 'positive', label: 'Achievements',icon: '🟢' },
] as const;

const THEME_COLOR: Record<string, string> = {
  all:      '#94a3b8',
  critical: '#ef4444',
  inactive: '#f59e0b',
  info:     '#38bdf8',
  positive: '#10b981',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ManagerAlerts: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Filter out locally dismissed alerts (7-day suppression)
  const filterDismissed = useCallback((list: Alert[]) =>
    list.filter(a => {
      const t = localStorage.getItem(`dismissed_alert_${a._id}`);
      if (!t) return true;
      return Date.now() - parseInt(t) > 7 * 24 * 60 * 60 * 1000;
    }), []);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/manager/alerts');
      const raw: Alert[] = res.data?.alerts || res.data || [];
      setAlerts(filterDismissed(raw));
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filterDismissed]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // Real-time: listen for critical_alert socket events
  useSocket({
    department: user?.department,
    events: {
      critical_alert: ({ employee, score }: any) => {
        const newAlert: Alert = {
          _id: `rt_${Date.now()}`,
          type: 'critical',
          severity: 'critical',
          employee: {
            _id: employee._id,
            name: employee.name,
            email: employee.email || '',
            currentRole: employee.currentRole || '',
            targetRole: employee.targetRole || '',
            gapScore: score,
            department: employee.department || '',
            avatar: employee.name.charAt(0).toUpperCase(),
            lastActive: 'Just now',
            inactiveDays: 0,
            weeklyGoalHours: 10,
            aiPathGenerated: false,
          },
          message: `Score dropped to ${score}% — needs immediate attention`,
          triggeredAt: new Date().toISOString(),
          nudgedToday: false,
          aiPathExists: false,
        };
        setAlerts(prev => [newAlert, ...prev]);
        toast.error(`⚠️ ${employee.name} dropped to critical gap score!`);
      },
    },
  });

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a._id !== id));
  };

  const filteredAlerts = activeTab === 'all'
    ? alerts
    : alerts.filter(a => a.type === activeTab);

  const counts = TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all' ? alerts.length : alerts.filter(a => a.type === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Alerts <span className="gradient-text">&amp; Notifications</span>
          </h1>
          <p style={{ color: '#94a3b8', margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''} requiring your attention
          </p>
        </div>
        <button
          onClick={loadAlerts}
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {TABS.map(tab => {
          const count = counts[tab.key] || 0;
          const active = activeTab === tab.key;
          const color = THEME_COLOR[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s',
                background: active ? `${color}25` : 'rgba(255,255,255,0.04)',
                border: active ? `1.5px solid ${color}60` : '1px solid rgba(255,255,255,0.07)',
                color: active ? color : '#64748b',
                boxShadow: active ? `0 0 12px ${color}30` : 'none',
              }}
            >
              {tab.icon} {tab.label}
              {count > 0 && (
                <span style={{ fontSize: '0.65rem', padding: '0.05rem 0.45rem', borderRadius: '999px', background: active ? `${color}30` : 'rgba(255,255,255,0.08)', color: active ? color : '#94a3b8', fontWeight: 700 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '110px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#94a3b8' }}>
            {activeTab === 'all' ? 'All clear! No active alerts.' : `No ${activeTab.replace('_', ' ')} alerts right now.`}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.4rem' }}>Your team is doing great!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <AnimatePresence initial={false}>
            {filteredAlerts.map(alert => (
              <AlertCard key={alert._id} alert={alert} onDismiss={handleDismiss} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:0.4; }
          50% { opacity:0.7; }
        }
      `}</style>
    </div>
  );
};

export default ManagerAlerts;
