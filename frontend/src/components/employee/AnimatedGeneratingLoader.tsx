import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const statements = [
  "Analyzing your skill gaps...",
  "Identifying learning order...",
  "Finding YouTube resources...",
  "Building weekly schedule...",
  "Finalizing your roadmap..."
];

const AnimatedGeneratingLoader: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 0-3s, 3-6s, 6-10s, 10-15s
    const intervals = [3000, 3000, 4000, 5000, 10000];
    let timeoutId: any;

    const nextStep = (currentStep: number) => {
      if (currentStep < statements.length - 1) {
        timeoutId = setTimeout(() => {
          setStep(currentStep + 1);
          nextStep(currentStep + 1);
        }, intervals[currentStep]);
      }
    };

    nextStep(0);

    return () => clearTimeout(timeoutId);
  }, []);

  const progress = Math.min(100, (step + 1) * 20);

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      padding: '4rem 2rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', 
      border: '1px solid rgba(255,255,255,0.1)', minHeight: '400px'
    }}>
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        style={{ fontSize: '3rem', marginBottom: '1.5rem' }}
      >
        🤖
      </motion.div>
      
      <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', margin: '0 0 2rem 0', fontWeight: 700 }}>Generating Your Roadmap</h2>
      
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
          <span>Generating...</span>
          <span style={{ fontWeight: 700, color: '#6366f1' }}>{progress}%</span>
        </div>
        
        {/* Progress Bar */}
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '2rem', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut", duration: 0.5 }}
            style={{ height: '100%', background: 'linear-gradient(to right, #6366f1, #a855f7)', borderRadius: '4px' }}
          />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {statements.map((stmt, idx) => (
            <div key={idx} style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', 
              color: idx < step ? '#10b981' : idx === step ? '#e2e8f0' : '#475569',
              transition: 'color 0.3s ease'
            }}>
              <span style={{ 
                opacity: idx <= step ? 1 : 0.5,
                background: idx < step ? 'rgba(16,185,129,0.2)' : idx === step ? 'rgba(99,102,241,0.2)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                width: '24px', height: '24px', borderRadius: '50%', fontSize: '0.8rem'
              }}>
                {idx < step ? '✅' : idx === step ? '🔄' : '⏳'}
              </span>
              <span style={{ fontWeight: idx === step ? 600 : 400, fontSize: '0.9rem' }}>{stmt}</span>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: '#64748b' }}>
          Usually takes 15-20 seconds
        </div>
      </div>
    </div>
  );
};

export default AnimatedGeneratingLoader;
