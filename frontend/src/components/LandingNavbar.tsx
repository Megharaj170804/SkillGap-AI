import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getDashboardRoute = (role: string) => {
  const routes: Record<string, string> = {
    admin: '/admin/overview',
    manager: '/manager/overview',
    employee: '/employee/overview',
  };
  return routes[role] || '/';
};

const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDashboard = () => {
    if (isAuthenticated && user) navigate(getDashboardRoute(user.role));
    else navigate('/login');
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      padding: '0.9rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(10,10,26,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(109,40,217,0.2)' : '1px solid transparent',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '10px',
          background: 'linear-gradient(135deg, #6d28d9, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', fontWeight: 800, color: 'white',
          boxShadow: '0 4px 16px rgba(109,40,217,0.4)',
        }}>S</div>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: '1.1rem', color: '#f9fafb',
        }}>SkillGap <span style={{ color: '#6d28d9' }}>Platform</span></span>
      </Link>

      {/* Desktop Nav Links */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="landing-nav-links">
        {[
          { label: 'Features', id: 'features' },
          { label: 'How It Works', id: 'how-it-works' },
          { label: 'Personas', id: 'personas' },
          { label: 'Testimonials', id: 'testimonials' },
        ].map(link => (
          <button key={link.id} onClick={() => scrollTo(link.id)} style={{
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
            transition: 'color 0.2s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f9fafb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
          >{link.label}</button>
        ))}
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} className="landing-nav-cta">
        {isAuthenticated && user ? (
          <button onClick={handleDashboard} style={{
            padding: '0.5rem 1.25rem', borderRadius: '8px',
            background: 'linear-gradient(135deg, #6d28d9, #06b6d4)',
            border: 'none', color: 'white', fontWeight: 600,
            cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit',
          }}>My Dashboard</button>
        ) : (
          <>
            <Link to="/login" style={{
              padding: '0.5rem 1.25rem', borderRadius: '8px',
              border: '1px solid rgba(109,40,217,0.5)', color: '#c4b5fd',
              textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#6d28d9';
                (e.currentTarget as HTMLAnchorElement).style.color = '#f9fafb';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(109,40,217,0.5)';
                (e.currentTarget as HTMLAnchorElement).style.color = '#c4b5fd';
              }}
            >Sign In</Link>
            <Link to="/login" style={{
              padding: '0.5rem 1.25rem', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
              border: 'none', color: 'white', fontWeight: 600,
              textDecoration: 'none', fontSize: '0.875rem',
              boxShadow: '0 4px 16px rgba(109,40,217,0.4)',
              transition: 'all 0.2s',
            }}>Get Started Free</Link>
          </>
        )}

        {/* Hamburger */}
        <button
          className="landing-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          style={{
            display: 'none', background: 'none', border: 'none',
            color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1,
          }}
        >{mobileOpen ? '✕' : '☰'}</button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: '60px', left: 0, right: 0,
          background: 'rgba(10,10,26,0.98)', backdropFilter: 'blur(20px)',
          padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
          borderBottom: '1px solid rgba(109,40,217,0.2)',
        }}>
          {[
            { label: 'Features', id: 'features' },
            { label: 'How It Works', id: 'how-it-works' },
            { label: 'Personas', id: 'personas' },
            { label: 'Testimonials', id: 'testimonials' },
          ].map(link => (
            <button key={link.id} onClick={() => scrollTo(link.id)} style={{
              background: 'none', border: 'none', color: '#9ca3af',
              cursor: 'pointer', fontSize: '1rem', fontWeight: 500,
              textAlign: 'left', fontFamily: 'inherit',
            }}>{link.label}</button>
          ))}
          <Link to="/login" style={{
            padding: '0.75rem', borderRadius: '8px', textAlign: 'center',
            background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
            color: 'white', fontWeight: 600, textDecoration: 'none',
          }}>Sign In / Get Started</Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .landing-nav-links { display: none !important; }
          .landing-nav-cta a, .landing-nav-cta button:not(.landing-hamburger) { display: none !important; }
          .landing-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
};

export default LandingNavbar;
