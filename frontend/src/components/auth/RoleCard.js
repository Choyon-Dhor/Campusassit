import React from 'react';
import { motion } from 'framer-motion';

export default function RoleCard({ icon, title, description, tint, chips }) {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
      style={{ backgroundImage: `linear-gradient(170deg, ${tint}10 0%, rgba(255,255,255,1) 45%)` }}
    >
      <div
        className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${tint}1f`, color: tint }}
      >
        {icon}
      </div>
      <h3 className="mb-1.5 font-display text-xl font-semibold text-slate-900">{title}</h3>
      <p className="m-0 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {chip}
          </span>
        ))}
      </div>
    </motion.article>
  );
}
