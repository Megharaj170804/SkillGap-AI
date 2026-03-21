import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const SUGGESTIONS = [
  'What should I learn next?',
  'How long to reach my target role?',
  'What are my strongest skills?',
];

const AIChatBot: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ai_chat_history');
    if (saved) return JSON.parse(saved);
    return [{ role: 'ai', text: 'Hi! I\'m your AI learning assistant. Ask me anything about your career or skills! 🚀' }];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) return null;

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    
    const contextHistory = messages.slice(-10); // Send last 10 messages
    const nextMessages = [...messages, { role: 'user', text: msg } as Message];
    setMessages(nextMessages);
    
    setLoading(true);
    try {
      const employeeId = (user as any)?.employeeRef;
      const res = await api.post('/ai/chat', { message: msg, employeeId, history: contextHistory });
      setMessages((prev) => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Sorry, I\'m having trouble responding right now. Please try again!' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    const initial = [{ role: 'ai', text: 'Hi! I\'m your AI learning assistant. Ask me anything about your career or skills! 🚀' } as Message];
    setMessages(initial);
    localStorage.removeItem('ai_chat_history');
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 4px 24px rgba(99,102,241,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
        }}
        title="AI Chat Assistant"
      >
        {open ? '✕' : '🤖'}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            style={{
              position: 'fixed', bottom: 100, right: 28, zIndex: 999,
              width: 360, height: 520, display: 'flex', flexDirection: 'column',
              background: 'rgba(15,15,26,0.97)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20,
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', borderBottom: '1px solid rgba(99,102,241,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem', margin: 0 }}>AI Learning Assistant</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: 0 }}>✨ Powered by Gemini AI</p>
                </div>
              </div>
              <button 
                onClick={clearChat}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 6, cursor: 'pointer' }}
                title="Clear Chat History"
              >
                Clear
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '0.6rem 0.9rem', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)',
                    color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5,
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '0.6rem 0.9rem', background: 'rgba(255,255,255,0.07)', borderRadius: '16px 16px 16px 4px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                          style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.8rem', transition: 'background 0.2s', outline: 'none' }}
                   onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                   onMouseOut={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.5rem' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
                placeholder="Ask me anything..."
                disabled={loading}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '0.5rem 0.75rem', color: '#e2e8f0', fontSize: '0.85rem',
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{ padding: '0.5rem 0.75rem', borderRadius: 10, border: 'none', background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
              >
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatBot;
