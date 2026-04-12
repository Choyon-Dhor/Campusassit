import React from 'react';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'sign-in', label: 'Sign In' },
  { id: 'sign-up', label: 'Sign Up' },
];

export default function AuthTabs({ value, onChange }) {
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
      className="relative grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1"
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
            className={`relative z-10 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              active ? 'text-campus-800' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {active ? (
              <motion.span
                layoutId="auth-tab-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                className="absolute inset-0 -z-10 rounded-lg border border-campus-100 bg-white shadow-sm"
              />
            ) : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
