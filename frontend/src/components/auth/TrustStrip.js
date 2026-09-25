import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleRounded } from '@mui/icons-material';

export default function TrustStrip({ items, dark = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
        borderRadius: 20, padding: 16,
        border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
        background: dark ? 'rgba(255,255,255,0.04)' : '#fff',
        backdropFilter: dark ? 'blur(12px)' : 'none',
        boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.20)' : '0 10px 24px rgba(15,23,42,0.05)',
      }}
    >
      {items.map((item) => (
        <span
          key={item}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999,
            border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #e2e8f0',
            background: dark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
            padding: '6px 14px', fontSize: 12, fontWeight: 600,
            color: dark ? 'rgba(255,255,255,0.70)' : '#475569',
          }}
        >
          <CheckCircleRounded sx={{ fontSize: 14, color: '#22c55e' }} />
          {item}
        </span>
      ))}
    </motion.div>
  );
}
