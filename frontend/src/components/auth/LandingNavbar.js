import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SchoolRounded } from '@mui/icons-material';

const NAV_ITEMS = [
  { href: '#campusassist-features', label: 'Features' },
  { href: '#campusassist-roles', label: 'Roles' },
  { href: '#campusassist-about', label: 'About' },
];

export default function LandingNavbar({ dark = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 8);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.10)',
        background: scrolled
          ? dark ? 'rgba(10,15,30,0.92)' : 'rgba(255,255,255,0.92)'
          : dark ? 'rgba(10,15,30,0.60)' : 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        boxShadow: scrolled ? (dark ? '0 12px 28px rgba(0,0,0,0.4)' : '0 12px 28px rgba(15,23,42,0.08)') : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 24px' }}>
        <a href="#campusassist-about" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <span style={{
            display: 'inline-flex', width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
            borderRadius: 12, background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', color: '#fff',
            boxShadow: '0 8px 20px rgba(29,78,216,0.30)',
          }}>
            <SchoolRounded sx={{ fontSize: 20 }} />
          </span>
          <span>
            <span style={{ display: 'block', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: dark ? '#fff' : '#0f172a' }}>
              CampusAssist
            </span>
            <span style={{ display: 'block', fontSize: 11, color: dark ? 'rgba(255,255,255,0.45)' : '#64748b' }}>
              Metropolitan University
            </span>
          </span>
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {NAV_ITEMS.map((item) => {
            const isHover = hovered === item.label;
            return (
              <a
                key={item.label}
                href={item.href}
                onMouseEnter={() => setHovered(item.label)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  fontSize: 14, fontWeight: 500,
                  color: isHover ? (dark ? '#fff' : '#1d4ed8') : (dark ? 'rgba(255,255,255,0.65)' : '#475569'),
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <a
          href="#campusassist-auth"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, padding: '8px 18px', fontSize: 14, fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.2s',
            background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(29,78,216,0.30)',
          }}
        >
          Sign In →
        </a>
      </div>
    </motion.header>
  );
}
