import React from 'react';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'sign-in', label: 'Sign In' },
  { id: 'sign-up', label: 'Sign Up' },
];

export default function AuthTabs({ value, onChange, dark = false }) {
  const handleKeyDown = (event, currentIndex) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const nextIndex =
      event.key === 'ArrowRight'
        ? (currentIndex + 1) % tabs.length
        : (currentIndex - 1 + tabs.length) % tabs.length;
    onChange(tabs[nextIndex].id);
  };

  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 14,
        border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #e2e8f0',
        background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
        padding: 4, position: 'relative',
      }}
    >
      {tabs.map((tab, index) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`auth-tab-${tab.id}`}
            aria-controls={`auth-panel-${tab.id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            style={{
              position: 'relative', zIndex: 10, borderRadius: 10, padding: '9px 16px',
              fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: 'transparent', transition: 'all 0.2s',
              color: active
                ? dark ? '#fff' : '#1d4ed8'
                : dark ? 'rgba(255,255,255,0.40)' : '#64748b',
            }}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {active ? (
              <motion.span
                layoutId="auth-tab-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                style={{
                  position: 'absolute', inset: 0, zIndex: -1, borderRadius: 10,
                  border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(29,78,216,0.15)',
                  background: dark ? 'rgba(255,255,255,0.12)' : '#fff',
                  boxShadow: dark ? '0 4px 12px rgba(0,0,0,0.30)' : '0 2px 8px rgba(15,23,42,0.08)',
                }}
              />
            ) : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
