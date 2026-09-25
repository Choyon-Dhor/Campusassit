import React from 'react';
import { motion } from 'framer-motion';

export default function RoleCard({ icon, title, description, tint, chips, dark = false }) {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      style={{
        borderRadius: 20, padding: 20,
        border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
        background: dark
          ? `linear-gradient(145deg, ${tint}18 0%, rgba(255,255,255,0.03) 60%)`
          : `linear-gradient(170deg, ${tint}10 0%, #fff 45%)`,
        backdropFilter: dark ? 'blur(12px)' : 'none',
        boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.20)' : '0 10px 24px rgba(15,23,42,0.05)',
      }}
    >
      <div style={{
        marginBottom: 16, display: 'inline-flex', width: 44, height: 44,
        alignItems: 'center', justifyContent: 'center', borderRadius: 14,
        backgroundColor: `${tint}25`, color: tint,
      }}>
        {icon}
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: dark ? '#fff' : '#0f172a' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: dark ? 'rgba(255,255,255,0.50)' : '#64748b' }}>{description}</p>
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chips.map((chip) => (
          <span
            key={chip}
            style={{
              display: 'inline-flex', alignItems: 'center', borderRadius: 999,
              border: dark ? `1px solid ${tint}40` : '1px solid #e2e8f0',
              background: dark ? `${tint}18` : '#f8fafc',
              padding: '3px 12px', fontSize: 12, fontWeight: 600,
              color: dark ? tint : '#475569',
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </motion.article>
  );
}
