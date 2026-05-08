import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Advice {
  strengths?: string[];
  improvements?: string[];
  uniqueInsight?: string;
  motivationalMessage?: string;
  shortTermAction?: string;
  error?: string;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

const EmployeeCareer: React.FC = () => {
  const { user } = useAuth();
  const empId = (user as any)?.employeeRef;
  const [loading, setLoading] = useState(false);
  
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [saved, setSaved] = useState<string[]>([]);

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const endOfChatRef = useRef<HTMLDivElement>(null);

  const loadAdvice = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/ai/career-advice/${empId}`);
      if (!res.data.advice?.error) {
        setAdvice(res.data.advice);
        if (res.data.advice.uniqueInsight && !saved.includes(res.data.advice.uniqueInsight)) {
            setSaved(prev => [res.data.advice.uniqueInsight, ...prev].filter((_, i) => i < 5));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically try to load cached advice on mount
    loadAdvice();
    // eslint-disable-next-line
  }, []);

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;
    
    const msg = chatMessage;
    setChatHistory(prev => [...prev, { sender: 'user', text: msg }]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', { 
        message: msg,
        employeeId: empId 
      });
      setChatHistory(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setChatLoading(false);
      endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>AI <span className="gradient-text">Career Advisor</span></h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Personalized AI insights on your career trajectory.</p>
      </div>

      {!advice && !loading ? (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
          <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>Get Your Personalized Career Analysis</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>Gemini AI analyzes your skills, gaps, and target role to generate a tailored career roadmap.</p>
          <button onClick={loadAdvice} className="btn-primary" style={{ minWidth: 220 }}>✨ Generate Career Advice</button>
        </div>
      ) : loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <p>Analyzing your profile...</p>
        </div>
      ) : advice ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button onClick={loadAdvice} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>🔄 Regenerate Insight</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Strengths */}
            <div className="glass-card" style={{ padding: '1.5rem', borderTop: '3px solid #10b981' }}>
              <h3 style={{ fontWeight: 700, color: '#10b981', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💪 Your Strengths</h3>
              {advice.strengths && advice.strengths.length > 0 ? advice.strengths.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{s}</span>
                </div>
              )) : <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Set your target role and skills to see strengths!</div>}
            </div>

            {/* Improvements */}
            <div className="glass-card" style={{ padding: '1.5rem', borderTop: '3px solid #f59e0b', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🎯 Areas to Improve</h3>
              <div style={{ flex: 1 }}>
                {advice.improvements && advice.improvements.length > 0 ? advice.improvements.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{s}</span>
                  </div>
                )) : <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No immediate gaps detected!</div>}
              </div>

              {advice.shortTermAction && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24', marginBottom: '0.5rem', fontWeight: 800 }}>Next 2-3 Days Action:</h4>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.875rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fde68a', fontSize: '0.875rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ flexShrink: 0 }}>⚡</span>
                    <span>{advice.shortTermAction}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Motivational Message */}
            <div className="glass-card" style={{ padding: '1.5rem', borderTop: '3px solid #6366f1' }}>
              <h3 style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🚀 AI Motivation</h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {advice.motivationalMessage || "Keep up the great work!"}
              </p>
            </div>
          </div>

          <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '2rem' }}>💡</span>
            <div>
              <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.5rem' }}>Career Insight</div>
              <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.7 }}>{advice.uniqueInsight || "Your potential is unlimited."}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
            {/* Follow-up Chat Box */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, color: '#f8fafc' }}>
                Ask Follow-up Questions 💬
              </div>
              <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {chatHistory.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: 'auto', marginBottom: 'auto' }}>
                    Type a question below to chat with your AI Career Advisor!
                  </div>
                )}
                {chatHistory.map((msg, idx) => (
                  <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? '#6366f1' : 'rgba(255,255,255,0.05)', color: msg.sender === 'user' ? 'white' : '#cbd5e1', padding: '0.75rem 1rem', borderRadius: '12px', borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px', borderBottomLeftRadius: msg.sender === 'ai' ? '2px' : '12px', maxWidth: '85%', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '12px', borderBottomLeftRadius: '2px', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <span className="pulse-dot" style={{ display: 'inline-block', width: 6, height: 6, background: '#a5b4fc', marginRight: 4 }} />
                    <span className="pulse-dot" style={{ display: 'inline-block', width: 6, height: 6, background: '#a5b4fc', marginRight: 4, animationDelay: '0.2s' }} />
                    <span className="pulse-dot" style={{ display: 'inline-block', width: 6, height: 6, background: '#a5b4fc', animationDelay: '0.4s' }} />
                  </div>
                )}
                <div ref={endOfChatRef} />
              </div>
              <form onSubmit={sendChatMessage} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.5rem' }}>
                <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="E.g., How long will it take to reach senior?" style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1rem', borderRadius: '24px', color: 'white', outline: 'none' }} />
                <button type="submit" disabled={chatLoading || !chatMessage.trim()} style={{ background: '#3b82f6', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: (!chatLoading && chatMessage.trim()) ? 'pointer' : 'not-allowed', opacity: (!chatLoading && chatMessage.trim()) ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ➤
                </button>
              </form>
            </div>

            {/* Saved Insights History */}
            {saved.length > 0 && (
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>📌 Saved Insights</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {saved.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                      className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>📝</span>
                      <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6, flex: 1 }}>{s}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default EmployeeCareer;
