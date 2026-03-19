import React, { useEffect, useMemo, memo, useState } from 'react';
import { Link } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import CountUp from '../components/CountUp';
import api from '../services/api';

interface PlatformStats {
  totalEmployees: number;
  withLearningPath: number;
  totalCoursesCompleted: number;
  totalHours: number;
  avgReadiness: number;
}

/* ─── SCROLL REVEAL HOOK ─────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('lp-visible');
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── PARTICLES ──────────────────────────────────────────────────────────── */
// Pre-generate stable particle data (outside component to avoid re-creation on each render)
const PARTICLE_DATA = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x: (i * 37.3 + 11) % 100,
  y: (i * 61.8 + 23) % 100,
  size: (i % 4) + 2,
  duration: (i % 8) + 6,
  delay: (i % 6),
  color: i % 3 === 0 ? '#6d28d9' : i % 3 === 1 ? '#06b6d4' : '#7c3aed',
}));

const Particles: React.FC = memo(() => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {PARTICLE_DATA.map(p => (
      <div key={p.id} style={{
        position: 'absolute',
        left: `${p.x}%`, top: `${p.y}%`,
        width: `${p.size}px`, height: `${p.size}px`,
        background: p.color, borderRadius: '50%',
        opacity: 0.35,
        animation: `lpFloat ${p.duration}s ease-in-out infinite`,
        animationDelay: `${p.delay}s`,
      }} />
    ))}
  </div>
));

/* ─── HERO MOCKUP ────────────────────────────────────────────────────────── */
const DashboardMockup: React.FC = () => (
  <div style={{
    position: 'relative',
    width: '100%', maxWidth: '820px',
    margin: '0 auto',
    animation: 'lpHoverFloat 4s ease-in-out infinite',
  }}>
    {/* Glow */}
    <div style={{
      position: 'absolute', inset: '-30px',
      background: 'radial-gradient(ellipse at center, rgba(109,40,217,0.35) 0%, rgba(6,182,212,0.15) 50%, transparent 70%)',
      filter: 'blur(30px)', pointerEvents: 'none',
    }} />
    {/* Browser frame */}
    <div style={{
      borderRadius: '12px', overflow: 'hidden',
      border: '1px solid rgba(109,40,217,0.4)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(109,40,217,0.2)',
      position: 'relative', background: '#111827',
    }}>
      {/* Browser chrome */}
      <div style={{
        background: '#0f172a', padding: '0.6rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          margin: '0 auto', background: '#1e293b', borderRadius: '6px',
          padding: '0.2rem 1.5rem', fontSize: '0.7rem', color: '#475569',
        }}>skillgap-platform.app/admin/overview</div>
      </div>
      {/* Dashboard content */}
      <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', background: '#0a0a1a', minHeight: '300px' }}>
        {/* Sidebar */}
        <div style={{ background: '#111827', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'linear-gradient(135deg,#6d28d9,#06b6d4)' }} />
            <div style={{ height: '10px', background: '#374151', borderRadius: '4px', width: '80px' }} />
          </div>
          {[72, 90, 60, 85, 50].map((w, i) => (
            <div key={i} style={{ height: '8px', background: i === 0 ? 'rgba(109,40,217,0.6)' : '#374151', borderRadius: '4px', marginBottom: '0.6rem', width: `${w}%` }} />
          ))}
        </div>
        {/* Main area */}
        <div>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '0.8rem' }}>
            {[
              { label: '1,247', color: '#6d28d9' },
              { label: '94.2%', color: '#06b6d4' },
              { label: '847', color: '#10b981' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#111827', borderRadius: '8px', padding: '0.6rem', border: `1px solid ${s.color}33` }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{ height: '6px', background: '#374151', borderRadius: '3px', marginTop: '0.4rem', width: '70%' }} />
              </div>
            ))}
          </div>
          {/* Chart bars */}
          <div style={{ background: '#111827', borderRadius: '8px', padding: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ height: '8px', background: '#374151', borderRadius: '4px', width: '50%', marginBottom: '0.6rem' }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: '60px' }}>
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75].map((h, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: '4px 4px 0 0', height: `${h}%`,
                  background: i % 2 === 0 ? 'linear-gradient(to top, #6d28d9, #7c3aed88)' : 'linear-gradient(to top, #06b6d4, #06b6d488)',
                }} />
              ))}
            </div>
          </div>
          {/* Table rows */}
          <div style={{ background: '#111827', borderRadius: '8px', padding: '0.5rem' }}>
            {[80, 65, 90].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem 0.4rem', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: ['#6d28d9','#06b6d4','#10b981'][i] + '44' }} />
                {[70, 45, 30].map((w, j) => (
                  <div key={j} style={{ height: '8px', background: '#374151', borderRadius: '4px', width: `${w}%`, alignSelf: 'center' }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  useScrollReveal();

  // ── Real-time stats from backend ──────────────────────────────────────────
  const [stats, setStats] = useState<PlatformStats | null>(null);
  useEffect(() => {
    api.get('/stats')
      .then(res => setStats(res.data))
      .catch(() => {/* silently fail — fallback to 0 */});
  }, []);

  const features = useMemo(() => [
    { icon: '🎯', title: 'AI Skill Gap Analysis', desc: 'Instantly identify gaps between current skills and target roles using intelligent comparison algorithms power by Google Gemini.' },
    { icon: '🤖', title: 'Gemini Learning Paths', desc: 'Get a personalized 12-week roadmap with real YouTube links, courses, and daily study plans — generated by Google Gemini AI.' },
    { icon: '📊', title: 'Manager Team Dashboard', desc: 'Managers get real-time visibility into team skill coverage, progress tracking, and AI-powered team insights.' },
    { icon: '🏆', title: 'Achievements & Gamification', desc: 'Keep employees motivated with streaks, achievement badges, department leaderboards, and progress milestones.' },
    { icon: '⚡', title: 'Real-Time Updates', desc: 'Socket.IO powered live updates — see skill changes, nudges, and activity feed update instantly without refresh.' },
    { icon: '📈', title: 'Advanced Analytics', desc: 'Company-wide analytics, department comparisons, learning hours tracking, and exportable PDF/CSV reports.' },
  ], []);

  const steps = useMemo(() => [
    { num: '01', icon: '👤', title: 'Create Your Profile', desc: 'Add your current skills, experience level, and set your target role. Our platform maps your entire skill landscape.' },
    { num: '02', icon: '🔍', title: 'AI Analyzes Your Gaps', desc: 'Google Gemini analyzes your profile against role requirements and identifies exactly what skills you need to develop.' },
    { num: '03', icon: '🚀', title: 'Follow Your Learning Path', desc: 'Get a week-by-week roadmap with curated YouTube videos, free courses, and hands-on projects tailored just for you.' },
  ], []);

  const personas = useMemo(() => [
    {
      icon: '👑', role: 'Admin', tagline: 'Full Platform Control',
      gradient: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
      features: ['Company-wide analytics', 'Employee & department management', 'Skills matrix builder', 'Bulk AI path generation', 'Platform reports & exports', 'AI Control Center'],
      featured: false,
    },
    {
      icon: '👔', role: 'Manager', tagline: 'Lead Your Team',
      gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
      features: ['Real-time team overview', 'Team skill coverage heatmap', 'AI team insights', 'Project skill planner', 'Send nudges to team', 'Team progress tracker'],
      featured: true,
    },
    {
      icon: '🎓', role: 'Employee', tagline: 'Grow Your Career',
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      features: ['Personal gap analysis', 'AI learning path (12 weeks)', 'AI career advisor', 'Achievement badges', 'Skill progress tracker', 'AI chat assistant'],
      featured: false,
    },
  ], []);

  const testimonials = useMemo(() => [
    {
      quote: 'The AI learning path completely changed how our team approaches upskilling. Our average readiness score went from 52% to 78% in just 3 months.',
      author: 'Sarah Chen', role: 'Engineering Manager at TechCorp',
    },
    {
      quote: 'Having a personalized roadmap with actual YouTube links made learning so much more actionable. I got promoted within 6 months of following my path.',
      author: 'Rahul Sharma', role: 'Senior Developer',
    },
    {
      quote: "The manager dashboard gives me everything I need. I can see exactly which skills my team is missing before starting any project.",
      author: 'Raj Kumar', role: 'Team Lead at StartupXYZ',
    },
  ], []);

  const techStack = useMemo(() => ['React.js', 'Node.js', 'MongoDB', 'Socket.IO', 'Google Gemini AI', 'Express.js', 'JWT Auth', 'TypeScript'], []);

  return (
    <div style={{ background: '#0a0a1a', color: '#f9fafb', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      <style>{`
        @keyframes lpFloat {
          0%, 100% { transform: translateY(0px) }
          50% { transform: translateY(-22px) }
        }
        @keyframes lpHoverFloat {
          0%, 100% { transform: translateY(0px) }
          50% { transform: translateY(-12px) }
        }
        @keyframes lpBounce {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(10px) }
        }
        @keyframes lpMarquee {
          from { transform: translateX(0) }
          to { transform: translateX(-50%) }
        }
        @keyframes lpPulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(109,40,217,0.3) }
          50% { box-shadow: 0 0 40px rgba(109,40,217,0.6), 0 0 80px rgba(109,40,217,0.2) }
        }
        @keyframes lpFadeUp {
          from { opacity: 0; transform: translateY(40px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes lpDotTravel {
          0% { left: 0 }
          100% { left: calc(100% - 12px) }
        }

        .lp-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .lp-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .lp-card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .lp-card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(109,40,217,0.25) !important;
          border-color: rgba(109,40,217,0.6) !important;
        }
        .lp-btn-glow:hover {
          box-shadow: 0 0 30px rgba(109,40,217,0.6), 0 8px 24px rgba(109,40,217,0.3) !important;
          transform: translateY(-2px);
        }
        .lp-btn-glow { transition: all 0.25s ease; }
        .lp-gradient-text {
          background: linear-gradient(135deg, #6d28d9, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-grid-bg {
          background-image: linear-gradient(rgba(109,40,217,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(109,40,217,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .lp-stagger-1 { transition-delay: 0.1s !important; }
        .lp-stagger-2 { transition-delay: 0.2s !important; }
        .lp-stagger-3 { transition-delay: 0.3s !important; }
        .lp-stagger-4 { transition-delay: 0.4s !important; }
        .lp-stagger-5 { transition-delay: 0.5s !important; }
        .lp-stagger-6 { transition-delay: 0.6s !important; }

        @media (max-width: 768px) {
          .lp-hero-title { font-size: 2.4rem !important; }
          .lp-features-grid { grid-template-columns: 1fr !important; }
          .lp-steps-row { flex-direction: column !important; }
          .lp-steps-connector { display: none !important; }
          .lp-personas-row { flex-direction: column !important; }
          .lp-stats-row { grid-template-columns: 1fr 1fr !important; }
          .lp-testimonials-grid { grid-template-columns: 1fr !important; }
          .lp-footer-grid { grid-template-columns: 1fr 1fr !important; }
          .lp-hero-btns { flex-direction: column !important; align-items: center !important; }
          .lp-hero-stats { flex-direction: column !important; gap: 1rem !important; }
        }
        @media (max-width: 480px) {
          .lp-footer-grid { grid-template-columns: 1fr !important; }
          .lp-stats-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <LandingNavbar />

      {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
      <section id="hero" className="lp-grid-bg" style={{
        minHeight: '100vh', position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '8rem 2rem 4rem',
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(109,40,217,0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.1) 0%, transparent 50%),
          #0a0a1a
        `,
      }}>
        <Particles />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '880px', width: '100%' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.4)',
            borderRadius: '100px', padding: '0.4rem 1.1rem',
            marginBottom: '2rem', fontSize: '0.85rem', color: '#c4b5fd',
            fontWeight: 600, animation: 'lpPulseGlow 3s ease-in-out infinite',
          }}>
            <span>🤖</span> AI-Powered Personalized Learning & Skill-Gap Analysis Platform
          </div>

          {/* Headline */}
          <h1 className="lp-hero-title" style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 800, lineHeight: 1.1,
            marginBottom: '1.5rem', color: '#f9fafb',
            animation: 'lpFadeUp 0.8s ease forwards',
          }}>
            <span className="lp-gradient-text">Bridge the Gap</span> Between<br />
            Where You Are and<br />
            Where You Want to Be
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#9ca3af',
            maxWidth: '660px', margin: '0 auto 2.5rem', lineHeight: 1.7,
            animation: 'lpFadeUp 0.8s 0.2s ease both',
          }}>
            SkillGap Platform uses <strong style={{ color: '#c4b5fd' }}>Google Gemini AI</strong> to analyze
            employee profiles, identify skill gaps, and generate personalized learning roadmaps —
            helping individuals grow and teams thrive.
          </p>

          {/* Stats — real-time from backend */}
          <div className="lp-hero-stats" style={{
            display: 'flex', justifyContent: 'center', gap: '3rem',
            marginBottom: '2.5rem', animation: 'lpFadeUp 0.8s 0.35s ease both',
          }}>
            {[
              { value: stats?.totalEmployees ?? 0, suffix: '+', label: 'Employees' },
              { value: stats?.avgReadiness ?? 0, suffix: '%', label: 'Avg Readiness' },
              { value: stats?.withLearningPath ?? 0, suffix: '', label: 'AI Learning Paths' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2rem', fontWeight: 800, color: '#f9fafb',
                }}>
                  <CountUp key={s.value} end={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="lp-hero-btns" style={{
            display: 'flex', gap: '1rem', justifyContent: 'center',
            flexWrap: 'wrap', marginBottom: '4rem',
            animation: 'lpFadeUp 0.8s 0.5s ease both',
          }}>
            <Link to="/login" className="lp-btn-glow" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.9rem 2rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
              color: 'white', fontWeight: 700, fontSize: '1rem',
              textDecoration: 'none', minHeight: '44px',
              boxShadow: '0 8px 24px rgba(109,40,217,0.4)',
            }}>🚀 Get Started Free</Link>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.9rem 2rem', borderRadius: '12px',
                background: 'transparent', border: '1px solid rgba(109,40,217,0.4)',
                color: '#c4b5fd', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', fontFamily: 'inherit', minHeight: '44px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6d28d9';
                e.currentTarget.style.background = 'rgba(109,40,217,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(109,40,217,0.4)';
                e.currentTarget.style.background = 'transparent';
              }}
            >▶ See Features</button>
          </div>

          {/* Mockup */}
          <div style={{ animation: 'lpFadeUp 0.8s 0.65s ease both' }}>
            <DashboardMockup />
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%',
          transform: 'translateX(-50%)',
          animation: 'lpBounce 2s ease-in-out infinite',
          color: '#6b7280', fontSize: '1.5rem',
        }}>↓</div>
      </section>

      {/* ═══════════════════════════════ FEATURES ═══════════════════════════ */}
      <section id="features" style={{ padding: '6rem 2rem', background: '#0d0d1f' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem',
            }}>Everything You Need to <span className="lp-gradient-text">Close Skill Gaps</span></h2>
            <p style={{ color: '#9ca3af', fontSize: '1.05rem' }}>Powerful features designed for individuals and teams</p>
          </div>

          <div className="lp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
            {features.map((f, i) => (
              <div key={i} className={`lp-reveal lp-card-hover lp-stagger-${i + 1}`} style={{
                background: '#111827', borderRadius: '14px', padding: '1.75rem',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '12px',
                  background: 'rgba(109,40,217,0.2)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', marginBottom: '1rem',
                  border: '1px solid rgba(109,40,217,0.3)',
                }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.05rem', fontWeight: 700, color: '#f9fafb', marginBottom: '0.6rem',
                }}>{f.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section id="how-it-works" style={{ padding: '6rem 2rem', background: '#0a0a1a' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem',
            }}>Get Started in <span className="lp-gradient-text">3 Simple Steps</span></h2>
            <p style={{ color: '#9ca3af', fontSize: '1.05rem' }}>From signup to personalized learning path in minutes</p>
          </div>

          <div className="lp-steps-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '0', position: 'relative' }}>
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div className={`lp-reveal lp-stagger-${i + 1}`} style={{
                  flex: 1, textAlign: 'center', padding: '0 1.5rem',
                }}>
                  {/* Number badge */}
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '3.5rem', fontWeight: 800, lineHeight: 1,
                    background: 'linear-gradient(135deg, #6d28d9, #06b6d4)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', marginBottom: '0.5rem',
                  }}>{step.num}</div>

                  <div style={{
                    width: 70, height: 70, borderRadius: '18px',
                    background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', margin: '0 auto 1.25rem',
                  }}>{step.icon}</div>

                  <h3 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.15rem', fontWeight: 700, color: '#f9fafb', marginBottom: '0.75rem',
                  }}>{step.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.7 }}>{step.desc}</p>
                </div>

                {i < steps.length - 1 && (
                  <div className="lp-steps-connector" style={{
                    flex: '0 0 60px', position: 'relative', top: '80px',
                    height: '2px',
                    background: 'linear-gradient(90deg, rgba(109,40,217,0.6), rgba(6,182,212,0.6))',
                    borderTop: '2px dashed rgba(109,40,217,0.4)',
                    overflow: 'visible',
                  }}>
                    <div style={{
                      position: 'absolute', top: '-5px', width: '12px', height: '12px',
                      borderRadius: '50%', background: '#6d28d9',
                      boxShadow: '0 0 12px rgba(109,40,217,0.8)',
                      animation: 'lpDotTravel 2.5s ease-in-out infinite',
                    }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="lp-reveal" style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link to="/login" className="lp-btn-glow" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.85rem 2rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6d28d9, #06b6d4)',
              color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: '1rem',
              boxShadow: '0 8px 24px rgba(109,40,217,0.3)',
            }}>Start Your Journey →</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ PERSONAS ════════════════════════════ */}
      <section id="personas" style={{ padding: '6rem 2rem', background: '#0d0d1f' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem',
            }}>Built for <span className="lp-gradient-text">Every Role</span> in Your Organization</h2>
            <p style={{ color: '#9ca3af', fontSize: '1.05rem' }}>Different dashboards, perfectly designed for each persona</p>
          </div>

          <div className="lp-personas-row" style={{
            display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
          }}>
            {personas.map((p, i) => (
              <div key={i} className={`lp-reveal lp-card-hover lp-stagger-${i + 1}`} style={{
                flex: p.featured ? '1.1' : '1',
                background: '#111827',
                borderRadius: '16px',
                overflow: 'hidden',
                border: p.featured ? '1px solid rgba(6,182,212,0.4)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: p.featured ? '0 20px 60px rgba(6,182,212,0.15)' : 'none',
                position: 'relative',
              }}>
                {p.featured && (
                  <div style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                    borderRadius: '100px', padding: '0.2rem 0.75rem',
                    fontSize: '0.7rem', fontWeight: 700, color: 'white',
                  }}>Most Popular</div>
                )}

                {/* Card header */}
                <div style={{ background: p.gradient, padding: '1.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{p.icon}</div>
                  <h3 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.3rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem',
                  }}>{p.role}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 500 }}>
                    {p.role} Dashboard
                  </p>
                </div>

                {/* Features */}
                <div style={{ padding: '1.5rem' }}>
                  {p.features.map((feat, j) => (
                    <div key={j} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.4rem 0', color: '#d1d5db', fontSize: '0.875rem',
                      borderBottom: j < p.features.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✅</span> {feat}
                    </div>
                  ))}

                  <Link to="/login" style={{
                    display: 'block', textAlign: 'center',
                    marginTop: '1.25rem', padding: '0.7rem',
                    background: p.gradient, borderRadius: '10px',
                    color: 'white', fontWeight: 700, textDecoration: 'none',
                    fontSize: '0.9rem', transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
                  >{p.tagline} →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ STATS ═══════════════════════════════ */}
      <section style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, rgba(109,40,217,0.2) 0%, rgba(6,182,212,0.1) 100%), #0a0a1a',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="lp-stats-row" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: '2rem', marginBottom: '3rem',
          }}>
            {[
              { icon: '👥', label: 'Employees on Platform', value: stats?.totalEmployees ?? 0, suffix: '' },
              { icon: '🤖', label: 'AI Learning Paths Active', value: stats?.withLearningPath ?? 0, suffix: '' },
              { icon: '📚', label: 'Courses Completed', value: stats?.totalCoursesCompleted ?? 0, suffix: '' },
              { icon: '⏱️', label: 'Learning Hours Logged', value: stats?.totalHours ?? 0, suffix: 'h' },
            ].map((s, i) => (
              <div key={i} className={`lp-reveal lp-stagger-${i + 1}`} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2.5rem', fontWeight: 800, color: '#f9fafb',
                }}>
                  <CountUp key={s.value} end={s.value} suffix={s.suffix} />
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Marquee ticker */}
          <div style={{
            overflow: 'hidden',
            borderTop: '1px solid rgba(109,40,217,0.2)',
            borderBottom: '1px solid rgba(109,40,217,0.2)',
            padding: '0.8rem 0',
          }}>
            <div style={{
              display: 'flex', gap: '2rem',
              animation: 'lpMarquee 20s linear infinite',
              width: 'max-content',
            }}>
              {['Node.js', 'React', 'AWS', 'Docker', 'Python', 'MongoDB', 'System Design', 'Machine Learning', 'DevOps', 'TypeScript', 'PostgreSQL', 'REST APIs',
                'Node.js', 'React', 'AWS', 'Docker', 'Python', 'MongoDB', 'System Design', 'Machine Learning', 'DevOps', 'TypeScript', 'PostgreSQL', 'REST APIs',
              ].map((skill, i) => (
                <span key={i} style={{
                  color: '#7c3aed', fontWeight: 600, fontSize: '0.875rem',
                  whiteSpace: 'nowrap', padding: '0 0.5rem',
                }}>• {skill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ TESTIMONIALS ════════════════════════ */}
      <section id="testimonials" style={{ padding: '6rem 2rem', background: '#0d0d1f' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem',
            }}>Trusted by <span className="lp-gradient-text">Teams Worldwide</span></h2>
          </div>

          <div className="lp-testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
            {testimonials.map((t, i) => (
              <div key={i} className={`lp-reveal lp-card-hover lp-stagger-${i + 1}`} style={{
                background: '#111827', borderRadius: '14px', padding: '2rem',
                border: '1px solid rgba(255,255,255,0.06)', position: 'relative',
              }}>
                {/* Quote mark */}
                <div style={{
                  position: 'absolute', top: '1rem', right: '1.5rem',
                  fontFamily: 'Georgia, serif', fontSize: '5rem', lineHeight: 1,
                  color: 'rgba(109,40,217,0.2)', userSelect: 'none',
                }}>"</div>

                <div style={{ display: 'flex', marginBottom: '0.75rem' }}>
                  {'⭐⭐⭐⭐⭐'.split('').map((s, j) => <span key={j}>{s}</span>)}
                </div>

                <p style={{ color: '#d1d5db', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '1.25rem', fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>

                <div>
                  <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.9rem' }}>— {t.author}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ TECH STACK ══════════════════════════ */}
      <section style={{ padding: '4rem 2rem', background: '#0a0a1a' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div className="lp-reveal">
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#f9fafb', marginBottom: '0.75rem',
            }}>Powered by <span className="lp-gradient-text">Modern Technology</span></h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Built with the best tools for performance and scalability
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
              {techStack.map((tech, i) => (
                <div key={i} style={{
                  padding: '0.5rem 1.1rem', borderRadius: '100px',
                  background: 'rgba(109,40,217,0.08)',
                  border: '1px solid rgba(109,40,217,0.25)',
                  color: '#c4b5fd', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'all 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(109,40,217,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(109,40,217,0.6)';
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(109,40,217,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(109,40,217,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(109,40,217,0.25)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >{tech}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ FINAL CTA ═══════════════════════════ */}
      <section style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #6d28d9 0%, #0891b2 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="lp-reveal" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 800,
            color: 'white', marginBottom: '1rem',
          }}>Ready to Close Your Skill Gaps?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            Join thousands of employees and managers already using SkillGap Platform to accelerate their careers.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '1rem 2.25rem', borderRadius: '12px',
              background: 'white', color: '#6d28d9',
              fontWeight: 800, fontSize: '1rem', textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)', minHeight: '44px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = 'none'}
            >🚀 Get Started Now — It's Free</Link>
            <a href="mailto:support@skillgap.com" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '1rem 2.25rem', borderRadius: '12px',
              background: 'transparent', border: '2px solid rgba(255,255,255,0.5)',
              color: 'white', fontWeight: 700, fontSize: '1rem',
              textDecoration: 'none', minHeight: '44px', transition: 'all 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'white'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.5)'}
            >📧 Contact Us</a>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
            No credit card required • Free to use • AI-powered
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════ FOOTER ══════════════════════════════ */}
      <footer style={{
        background: '#060612',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '1.25rem 2rem',
        textAlign: 'center',
      }}>
        <p style={{ color: '#4b5563', fontSize: '0.85rem', margin: 0 }}>
          © 2026 SkillGap Platform. Built with ❤️ by Megharaj
        </p>
      </footer>

    </div>
  );
};

export default LandingPage;

