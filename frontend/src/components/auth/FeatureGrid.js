import React from 'react';
import { motion } from 'framer-motion';
import FeatureCard from './FeatureCard';

export default function FeatureGrid({ features, dark = false }) {
  return (
    <motion.section
      id="campusassist-features"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
      style={{
        borderRadius: 28, padding: 32,
        border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
        background: dark ? 'rgba(255,255,255,0.03)' : '#fff',
        backdropFilter: dark ? 'blur(16px)' : 'none',
        boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.25)' : '0 16px 36px rgba(15,23,42,0.06)',
      }}
    >
      <div style={{ marginBottom: 28, maxWidth: 680 }}>
        <span style={{
          display: 'inline-flex', marginBottom: 12, borderRadius: 999,
          border: dark ? '1px solid rgba(59,130,246,0.30)' : '1px solid #bfdbfe',
          background: dark ? 'rgba(59,130,246,0.12)' : '#eff6ff',
          padding: '4px 14px', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.18em', color: '#60a5fa',
        }}>
          Why CampusAssist
        </span>
        <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.03em', color: dark ? '#fff' : '#0f172a' }}>
          One platform for campus life
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: dark ? 'rgba(255,255,255,0.50)' : '#64748b', maxWidth: 600 }}>
          CampusAssist replaces scattered academic tools with one coordinated platform for
          Metropolitan University communication, scheduling, and collaboration.
        </p>
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {features.map((f) => <FeatureCard key={f.title} {...f} dark={dark} />)}
      </div>
    </motion.section>
  );
}
