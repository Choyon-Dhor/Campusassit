import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ value, suffix = '', label, delay = 0, dark = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 700 + delay;
    let frameId;
    let t0;
    const tick = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.round(p * value));
      if (p < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [delay, value]);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      style={{
        borderRadius: 16, padding: 16,
        border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #e2e8f0',
        background: dark ? 'rgba(255,255,255,0.05)' : '#fff',
        backdropFilter: dark ? 'blur(12px)' : 'none',
        boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.20)' : '0 10px 24px rgba(15,23,42,0.06)',
      }}
    >
      <div style={{ marginBottom: 6, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: dark ? '#fff' : '#0f172a' }}>
        {count}<span style={{ color: '#3b82f6' }}>{suffix}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: dark ? 'rgba(255,255,255,0.50)' : '#64748b' }}>{label}</p>
    </motion.article>
  );
}
