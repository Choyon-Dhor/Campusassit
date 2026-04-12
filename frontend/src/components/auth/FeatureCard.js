import React from 'react';
import { motion } from 'framer-motion';

export default function FeatureCard({ icon, title, description, tint }) {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition"
      style={{ backgroundImage: `linear-gradient(170deg, ${tint}0f 0%, rgba(255,255,255,1) 42%)` }}
    >
      <div
        className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${tint}1f`, color: tint }}
      >
        {icon}
      </div>
      <h3 className="mb-1.5 font-display text-lg font-semibold text-slate-900">{title}</h3>
      <p className="m-0 text-sm leading-6 text-slate-600">{description}</p>
    </motion.article>
  );
}
