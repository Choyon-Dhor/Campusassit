import React from 'react';
import { motion } from 'framer-motion';
import {
  CampaignRounded, DirectionsBusFilledRounded,
  EventAvailableRounded, AssignmentRounded, NotificationsActiveRounded,
} from '@mui/icons-material';

const CAMPUS_IMG = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80';

const TONE = {
  blue:  { bg: 'rgba(29,78,216,0.14)',  border: 'rgba(96,165,250,0.25)',  icon: '#60a5fa', text: '#93c5fd' },
  amber: { bg: 'rgba(245,158,11,0.14)', border: 'rgba(251,191,36,0.25)',  icon: '#fbbf24', text: '#fcd34d' },
  rose:  { bg: 'rgba(225,29,72,0.14)',  border: 'rgba(251,113,133,0.25)', icon: '#fb7185', text: '#fda4af' },
  green: { bg: 'rgba(34,197,94,0.14)',  border: 'rgba(74,222,128,0.25)',  icon: '#4ade80', text: '#86efac' },
};

const CARDS = [
  { id: 'notice',   pos: { top: '5%', left: '4%' },        icon: <CampaignRounded sx={{ fontSize: 16 }} />,             eyebrow: 'MU Notice',       title: 'Class Postponed — CSE Dept.', sub: '2 min ago',     tone: 'blue',  delay: 0    },
  { id: 'bus',      pos: { top: '8%', right: '4%' },        icon: <DirectionsBusFilledRounded sx={{ fontSize: 16 }} />,  eyebrow: 'Bus 11-0018',     title: 'Medina Market → Campus',      sub: 'Departs 08:10 AM', tone: 'amber', delay: 0.3  },
  { id: 'deadline', pos: { bottom: '30%', right: '4%' },    icon: <AssignmentRounded sx={{ fontSize: 16 }} />,           eyebrow: 'CSE-411 Deadline',title: 'FFT Assignment Due',          sub: 'In 5 days',    tone: 'rose',  delay: 0.55 },
  { id: 'notif',    pos: { bottom: '28%', left: '4%' },     icon: <NotificationsActiveRounded sx={{ fontSize: 16 }} />,  eyebrow: 'Result Published',title: 'Summer 2024 — CGPA 3.98',    sub: 'Just now',     tone: 'green', delay: 0.2  },
];

const floatTransition = (delay) => ({
  opacity: { delay: delay + 0.5, duration: 0.4 },
  y: { delay: delay + 0.5, duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
});

export default function HeroSection({ dark = false }) {
  return (
    <section id="campusassist-about" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'relative', overflow: 'hidden', borderRadius: 28,
          border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #e2e8f0',
          boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.5)' : '0 24px 60px rgba(15,23,42,0.10)',
        }}
      >
        <div style={{ position: 'relative', minHeight: 560, overflow: 'hidden' }}>
          <img src={CAMPUS_IMG} alt="Metropolitan University campus" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

          <div style={{ position: 'absolute', inset: 0, background: dark
            ? 'linear-gradient(135deg, rgba(10,15,30,0.70) 0%, rgba(10,15,30,0.40) 50%, transparent 100%)'
            : 'linear-gradient(to right, rgba(15,23,42,0.55), rgba(15,23,42,0.25), transparent)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: dark
            ? 'linear-gradient(to top, rgba(10,15,30,0.85) 0%, rgba(10,15,30,0.35) 40%, transparent 100%)'
            : 'linear-gradient(to top, rgba(15,23,42,0.60) 0%, rgba(15,23,42,0.28) 40%, transparent 100%)' }}
          />

          {CARDS.map(({ id, pos, icon, eyebrow, title, sub, tone, delay }) => {
            const t = TONE[tone];
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: [0, -6, 0] }}
                transition={floatTransition(delay)}
                style={{
                  position: 'absolute', ...pos,
                  background: t.bg, backdropFilter: 'blur(16px)',
                  border: `1px solid ${t.border}`, borderRadius: 16,
                  padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                  minWidth: 190, maxWidth: 230, zIndex: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                }}
              >
                <span style={{ display: 'inline-flex', width: 32, height: 32, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: t.bg, color: t.icon }}>
                  {icon}
                </span>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.text }}>{eyebrow}</p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{title}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{sub}</p>
                </div>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            style={{ position: 'absolute', inset: '0 0 0 0', bottom: 0, display: 'flex', alignItems: 'flex-end', padding: 24 }}
          >
            <div style={{
              maxWidth: 620, borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.15)',
              background: dark ? 'rgba(10,15,30,0.72)' : 'rgba(255,255,255,0.88)',
              padding: '20px 24px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.25)', backdropFilter: 'blur(16px)',
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
                borderRadius: 999, padding: '4px 12px', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.18em',
                background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa',
              }}>
                <EventAvailableRounded sx={{ fontSize: 13 }} />
                Metropolitan University · CSE Department
              </span>
              <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', color: dark ? '#fff' : '#0f172a' }}>
                Smarter academic<br />life starts here.
              </h1>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: dark ? 'rgba(255,255,255,0.60)' : '#475569', maxWidth: 480 }}>
                CampusAssist brings MU announcements, class routine, smart classrooms, results, bus schedules, and collaboration into one campus workspace.
              </p>
              <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <motion.a whileHover={{ y: -2 }} href="#campusassist-features" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 600, textDecoration: 'none', color: '#fff', background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', boxShadow: '0 10px 24px rgba(29,78,216,0.30)' }}>
                  Explore features
                </motion.a>
                <motion.a whileHover={{ y: -2 }} href="#campusassist-auth" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 600, textDecoration: 'none', color: dark ? '#fff' : '#1e293b', background: dark ? 'rgba(255,255,255,0.10)' : '#fff', border: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0' }}>
                  Sign in now
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
