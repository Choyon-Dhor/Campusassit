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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import AuthPanel from './AuthPanel';
import FeatureGrid from './FeatureGrid';
import HeroSection from './HeroSection';
import LandingNavbar from './LandingNavbar';
import RoleSection from './RoleSection';
import StatCard from './StatCard';
import TrustStrip from './TrustStrip';

const stats = [
  { value: 8, suffix: '+', label: 'academic tools in one workspace', delay: 0 },
  { value: 3, suffix: '', label: 'role-based experiences', delay: 120 },
  { value: 1, suffix: '', label: 'central campus platform', delay: 240 },
];

const features = [
  {
    title: 'Announcements',
    description: 'Keep every class and department aligned with timely updates.',
    icon: <CampaignRounded />,
    tint: '#2f7df6',
  },
  {
    title: 'Smart Classrooms',
    description: 'Coordinate attendance, materials, and activity in one flow.',
    icon: <HubRounded />,
    tint: '#0ea5e9',
  },
  {
    title: 'Resource Sharing',
    description: 'Access notes, slides, and files without switching tools.',
    icon: <MenuBookRounded />,
    tint: '#22c55e',
  },
  {
    title: 'Study Groups',
    description: 'Collaborate with peers through focused group spaces.',
    icon: <GroupsRounded />,
    tint: '#8b5cf6',
  },
  {
    title: 'Routine, Results, Deadlines',
    description: 'Follow your academic timeline with less friction.',
    icon: <CalendarMonthRounded />,
    tint: '#f59e0b',
  },
  {
    title: 'Consultations and Transport',
    description: 'Book consultations and track bus schedules quickly.',
    icon: <DirectionsBusFilledRounded />,
    tint: '#06b6d4',
  },
];

const roles = [
  {
    title: 'Students',
    description: 'Track routine, results, resources, study groups, and deadlines from one workspace.',
    icon: <SchoolRounded />,
    tint: '#2f7df6',
    chips: ['Routine', 'Results', 'Resources'],
  },
  {
    title: 'Teachers',
    description: 'Share updates, manage classrooms, consultations, and attendance with less friction.',
    icon: <AutoStoriesRounded />,
    tint: '#0ea5e9',
    chips: ['Announcements', 'Classrooms', 'Consultations'],
  },
  {
    title: 'Admins',
    description: 'Oversee users, schedules, and operations through one coordinated system.',
    icon: <AdminPanelSettingsRounded />,
    tint: '#22c55e',
    chips: ['User Control', 'Oversight', 'Operations'],
  },
];

const trustItems = [
  'Centralized academic tools',
  'Role-based access',
  'Smart collaboration',
  'Faster academic coordination',
];

export default function LandingAuthPage({ initialTab = 'sign-in' }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f8fafc_38%,#ffffff_100%)] text-slate-900">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[360px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.16),transparent_24%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.06] [background-image:radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:22px_22px]" />

      <LandingNavbar />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6 lg:px-8 lg:pb-20 lg:pt-8">
        <section className="grid gap-8 lg:grid-cols-[55%_45%] lg:items-start xl:grid-cols-[52%_48%]">
          <div className="order-2 lg:order-1 space-y-6">
            <HeroSection />
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
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
              <AuthPanel initialTab={initialTab} />
            </div>
          </motion.div>
        </section>

        <div className="mt-14 space-y-10 lg:mt-16">
          <FeatureGrid features={features} />
          <RoleSection roles={roles} />
          <TrustStrip items={trustItems} />
        </div>

        <footer className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 font-display text-base font-semibold text-slate-900">CampusAssist</p>
            <p className="m-0">Smart academic management for modern university life.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <a href="#campusassist-features" className="transition hover:text-campus-700">
              Features
            </a>
            <a href="#campusassist-roles" className="transition hover:text-campus-700">
              Roles
            </a>
            <a href="#campusassist-auth" className="transition hover:text-campus-700">
              Sign In
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
