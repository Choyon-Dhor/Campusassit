import React from 'react';
import { motion } from 'framer-motion';
import RoleCard from './RoleCard';

export default function RoleSection({ roles }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
      id="campusassist-roles"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)] md:p-8"
    >
      <div className="mb-7 max-w-3xl">
        <span className="mb-3 inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
          Built for every role
        </span>
        <h2 className="mb-2 font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Built for students, teachers, and admins
        </h2>
        <p className="m-0 max-w-2xl text-base leading-7 text-slate-600">
          One connected platform with role-specific workflows and a shared academic context.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {roles.map((role) => (
          <RoleCard key={role.title} {...role} />
        ))}
      </div>
    </motion.section>
  );
}
