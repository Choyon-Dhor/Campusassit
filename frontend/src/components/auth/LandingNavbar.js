import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SchoolRounded } from '@mui/icons-material';

const navItems = [
  { href: '#campusassist-features', label: 'Features' },
  { href: '#campusassist-roles', label: 'Roles' },
  { href: '#campusassist-about', label: 'About' },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`sticky top-0 z-40 border-b border-slate-200/80 transition ${
        scrolled
          ? 'bg-white/92 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl'
          : 'bg-white/75 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-6 lg:px-8">
        <a href="#campusassist-about" className="flex items-center gap-3 no-underline">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-campus-600 to-campus-500 text-white shadow-[0_10px_20px_rgba(29,78,216,0.22)]">
            <SchoolRounded sx={{ fontSize: 20 }} />
          </span>
          <span>
            <span className="block font-display text-base font-bold tracking-tight text-slate-900">
              CampusAssist
            </span>
            <span className="block text-xs text-slate-500">Connect. Learn. Manage.</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative px-1 py-1 text-sm font-medium text-slate-600 transition hover:text-campus-700"
            >
              {item.label}
              <span className="absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-campus-600 transition-transform duration-200 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <a
          href="#campusassist-auth"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-campus-200 hover:text-campus-700"
        >
          Sign In
        </a>
      </div>
    </motion.header>
  );
}
