import React from 'react';
import {
  AdminPanelSettingsRounded,
  AutoStoriesRounded,
  CampaignRounded,
  CalendarMonthRounded,
  DirectionsBusFilledRounded,
  GroupsRounded,
  HubRounded,
  MenuBookRounded,
  SchoolRounded,
  EmailRounded,
  LocationOnRounded,
  PhoneRounded,
  FacebookRounded,
  LinkedIn,
  GitHub,
  VerifiedRounded,
  TrendingUpRounded,
  EmojiEventsRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import AuthPanel from './AuthPanel';
import FeatureGrid from './FeatureGrid';
import HeroSection from './HeroSection';
import LandingNavbar from './LandingNavbar';
import RoleSection from './RoleSection';
import StatCard from './StatCard';
import TrustStrip from './TrustStrip';

const STATS = [
  { value: 310, suffix: '+', label: 'Active students', delay: 0 },
  { value: 94, suffix: '+', label: 'Faculty members', delay: 120 },
  { value: 8, suffix: '', label: 'Academic tools', delay: 240 },
];

const FEATURES = [
  {
    title: 'Smart Announcements',
    description: 'Official MU notices, department updates, and exam alerts delivered in real time.',
    icon: <CampaignRounded />,
    tint: '#2f7df6',
  },
  {
    title: 'Smart Classrooms',
    description: 'Attendance, assignments, resources, and marks — all in one classroom space.',
    icon: <HubRounded />,
    tint: '#0ea5e9',
  },
  {
    title: 'Resource Library',
    description: 'Upload and access lecture notes, slides, and question papers instantly.',
    icon: <MenuBookRounded />,
    tint: '#22c55e',
  },
  {
    title: 'Study Groups',
    description: 'Form batch and section-based study groups with peer collaboration tools.',
    icon: <GroupsRounded />,
    tint: '#8b5cf6',
  },
  {
    title: 'Routine, Results & Deadlines',
    description: 'View your class schedule, semester results, and upcoming assignment deadlines.',
    icon: <CalendarMonthRounded />,
    tint: '#f59e0b',
  },
  {
    title: 'Bus Schedule & Consultations',
    description: 'Track MU bus routes and book teacher consultation hours in advance.',
    icon: <DirectionsBusFilledRounded />,
    tint: '#06b6d4',
  },
];

const ROLES = [
  {
    title: 'Students',
    description: 'Track class routine, semester results, resources, study groups, and assignment deadlines from one workspace.',
    icon: <SchoolRounded />,
    tint: '#2f7df6',
    chips: ['Routine', 'Results', 'Resources'],
  },
  {
    title: 'Teachers',
    description: 'Manage classrooms, share resources, post announcements, and book consultation hours with students.',
    icon: <AutoStoriesRounded />,
    tint: '#0ea5e9',
    chips: ['Classrooms', 'Announcements', 'Consultations'],
  },
  {
    title: 'Admins',
    description: 'Oversee all users, manage routines, bus schedules, and university-wide operations.',
    icon: <AdminPanelSettingsRounded />,
    tint: '#22c55e',
    chips: ['User Control', 'Oversight', 'Operations'],
  },
];

const TRUST_ITEMS = [
  'Metropolitan University CSE',
  'Role-based secure access',
  'Real-time campus data',
  'Batch & section smart routing',
];

const MILESTONES = [
  { icon: <VerifiedRounded />, value: '100%', label: 'Official MU Data', color: '#22c55e' },
  { icon: <TrendingUpRounded />, value: '10+', label: 'Batches Covered', color: '#2f7df6' },
  { icon: <EmojiEventsRounded />, value: '480+', label: 'Assignments Seeded', color: '#f59e0b' },
];

const SOCIAL_LINKS = [
  { icon: <FacebookRounded sx={{ fontSize: 18 }} />, href: 'https://facebook.com' },
  { icon: <LinkedIn sx={{ fontSize: 18 }} />, href: 'https://linkedin.com' },
  { icon: <GitHub sx={{ fontSize: 18 }} />, href: 'https://github.com' },
];

const PLATFORM_LINKS = ['Features', 'Announcements', 'Smart Classrooms', 'Routine & Results', 'Bus Schedule'];
const USER_LINKS = ['Student Portal', 'Teacher Dashboard', 'Admin Panel', 'Study Groups', 'Consultations'];

const BG_STYLE = { background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1535 40%, #0a1628 70%, #060d1a 100%)' };
const GRID_OVERLAY = { backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)', backgroundSize: '28px 28px' };

export default function LandingAuthPage({ initialTab = 'sign-in' }) {
  return (
    <main className="min-h-screen text-white" style={BG_STYLE}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]" style={GRID_OVERLAY} />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.14) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }} />
      </div>

      <LandingNavbar dark />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6 lg:px-8 lg:pb-20 lg:pt-8">
        <section className="grid gap-8 lg:grid-cols-[55%_45%] lg:items-start xl:grid-cols-[52%_48%]">
          <div className="order-2 lg:order-1 space-y-6">
            <HeroSection dark />
            <div className="grid gap-3 sm:grid-cols-3">
              {STATS.map((stat) => (
                <StatCard key={stat.label} {...stat} dark />
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
            className="order-1 lg:order-2 flex justify-center lg:justify-start"
          >
            <div className="w-full lg:sticky lg:top-20">
              <AuthPanel initialTab={initialTab} dark />
            </div>
          </motion.div>
        </section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {MILESTONES.map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-4 rounded-2xl border p-5"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white" style={{ background: `${m.color}22`, color: m.color }}>
                {m.icon}
              </span>
              <div>
                <p className="mb-0 text-2xl font-bold text-white">{m.value}</p>
                <p className="m-0 text-sm text-slate-400">{m.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="mt-14 space-y-10 lg:mt-16">
          <FeatureGrid features={FEATURES} dark />
          <RoleSection roles={ROLES} dark />
          <TrustStrip items={TRUST_ITEMS} dark />
        </div>

        <footer className="mt-16 border-t pt-10" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                  <SchoolRounded sx={{ fontSize: 20 }} />
                </span>
                <div>
                  <p className="mb-0 font-display text-base font-bold text-white">CampusAssist</p>
                  <p className="m-0 text-xs text-slate-400">Metropolitan University, Sylhet</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-400">
                The official digital campus platform for Metropolitan University CSE students, teachers, and administrators.
              </p>
              <div className="mt-4 flex gap-3">
                {SOCIAL_LINKS.map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold text-white uppercase tracking-widest">Platform</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {PLATFORM_LINKS.map((l) => (
                  <li key={l}><a href="#campusassist-features" className="transition hover:text-white">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold text-white uppercase tracking-widest">For Users</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {USER_LINKS.map((l) => (
                  <li key={l}><a href="#campusassist-roles" className="transition hover:text-white">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold text-white uppercase tracking-widest">Contact</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2.5">
                  <LocationOnRounded sx={{ fontSize: 16, flexShrink: 0, marginTop: '2px', color: '#60a5fa' }} />
                  <span>Metropolitan University, Sylhet, Bangladesh</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <PhoneRounded sx={{ fontSize: 16, flexShrink: 0, color: '#60a5fa' }} />
                  <span>+880 821 712345</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <EmailRounded sx={{ fontSize: 16, flexShrink: 0, color: '#60a5fa' }} />
                  <a href="mailto:info@metrouni.edu.bd" className="hover:text-white transition">info@metrouni.edu.bd</a>
                </li>
              </ul>
              <a
                href="https://metrouni.edu.bd"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', boxShadow: '0 8px 20px rgba(29,78,216,0.3)' }}
              >
                Visit MU Website ↗
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="m-0">© {new Date().getFullYear()} CampusAssist · Metropolitan University CSE · All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Use</a>
              <a href="#" className="hover:text-white transition">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
