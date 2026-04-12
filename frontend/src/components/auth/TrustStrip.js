import React from 'react';
import { motion } from 'framer-motion';

export default function TrustStrip({ items }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
    >
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600"
        >
          <span className="h-2 w-2 rounded-full bg-campus-500" />
          {item}
        </span>
      ))}
    </motion.div>
  );
}
