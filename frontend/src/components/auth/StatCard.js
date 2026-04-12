import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ value, suffix = '', label, delay = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frameId;
    let startTime;
    const duration = 700 + delay;

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.round(progress * value));
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [delay, value]);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="mb-1.5 font-display text-3xl font-extrabold tracking-tight text-slate-900">
        {count}
        <span className="text-campus-600">{suffix}</span>
      </div>
      <p className="m-0 text-xs leading-5 text-slate-600">{label}</p>
    </motion.article>
  );
}
