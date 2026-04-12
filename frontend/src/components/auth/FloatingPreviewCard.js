import React from 'react';
import { motion } from 'framer-motion';

export default function FloatingPreviewCard({ className = '', icon, eyebrow, title, tone = 'blue' }) {
  const toneClasses = {
    blue: 'from-blue-100 to-sky-50',
    emerald: 'from-emerald-100 to-teal-50',
    amber: 'from-amber-100 to-orange-50',
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: [0, -6, 0] }}
      transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
      whileHover={{ y: [0, -8, 0] }}
      className={`absolute z-10 w-[185px] rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-[0_16px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl ${className}`}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${toneClasses[tone] || toneClasses.blue} opacity-65`} />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/40 via-transparent to-transparent" />
      <div className="relative flex items-start gap-2.5">
        <div className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white/90 to-white/60 text-campus-600 shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">{eyebrow}</p>
          <p className="m-0 text-xs font-semibold leading-5 text-slate-950">{title}</p>
        </div>
      </div>
    </motion.article>
  );
}
