import React from 'react';
import { motion } from 'framer-motion';
import RoleCard from './RoleCard';

export default function RoleSection({ roles, dark = false }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
      id="campusassist-roles"
      style={{
        borderRadius: 28, padding: 32,
        border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
        background: dark ? 'rgba(255,255,255,0.03)' : '#fff',
        backdropFilter: dark ? 'blur(16px)' : 'none',
        boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.25)' : '0 16px 36px rgba(15,23,42,0.06)',
      }}
    >
      <div style={{ marginBottom: 28, maxWidth: 600 }}>
        <span style={{
          display: 'inline-flex', marginBottom: 12, borderRadius: 999,
          border: dark ? '1px solid rgba(14,165,233,0.30)' : '1px solid #bae6fd',
          background: dark ? 'rgba(14,165,233,0.12)' : '#f0f9ff',
          padding: '4px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.18em', color: '#38bdf8',
        }}>
          Built for every role
        </span>
        <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.03em', color: dark ? '#fff' : '#0f172a' }}>
          Built for students, teachers & admins
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: dark ? 'rgba(255,255,255,0.50)' : '#64748b' }}>
          One connected platform with role-specific workflows — each user gets exactly what they need.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {roles.map((role) => (
          <RoleCard key={role.title} {...role} dark={dark} />
        ))}
      </div>
    </motion.section>
  );
}
