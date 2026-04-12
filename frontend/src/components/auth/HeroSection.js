import React from 'react';
import { motion } from 'framer-motion';
import {
  CampaignRounded,
  DirectionsBusFilledRounded,
  EventAvailableRounded,
} from '@mui/icons-material';
import FloatingPreviewCard from './FloatingPreviewCard';

const campusImageUrl =
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80';

export default function HeroSection() {
  return (
    <section id="campusassist-about" className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.10)]"
      >
        <div className="relative min-h-[540px] overflow-hidden lg:min-h-[640px]">
          <img
            src={campusImageUrl}
            alt="Students walking through a university campus"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/52 via-slate-950/24 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/58 via-slate-950/28 at-40% to-transparent" />

          <FloatingPreviewCard
            className="left-4 top-8 hidden sm:block"
            icon={<CampaignRounded fontSize="small" />}
            eyebrow="Updates"
            title="Department notice published"
            tone="blue"
          />
          <FloatingPreviewCard
            className="right-4 top-12 hidden md:block"
            icon={<DirectionsBusFilledRounded fontSize="small" />}
            eyebrow="Transport"
            title="Main gate bus in 12 min"
            tone="amber"
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="absolute inset-x-0 bottom-0 p-5 sm:p-6"
          >
            <div className="max-w-[620px] rounded-2xl border border-white/45 bg-white/88 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.20)] backdrop-blur-md sm:p-6">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-campus-100 bg-campus-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-campus-700">
                <EventAvailableRounded sx={{ fontSize: 14 }} />
                Designed for students, teachers, and admins
              </span>

              <h1 className="mb-3 max-w-[14ch] font-display text-4xl font-extrabold leading-[0.95] tracking-[-0.03em] text-slate-900 sm:text-5xl">
                Smarter academic life starts here.
              </h1>

              <p className="m-0 max-w-[54ch] text-sm leading-7 text-slate-600 sm:text-base">
                CampusAssist brings announcements, routine, classrooms, resources, consultations,
                deadlines, results, and collaboration into one modern campus workspace.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <motion.a
                  whileHover={{ y: -2 }}
                  href="#campusassist-features"
                  className="inline-flex items-center justify-center rounded-xl bg-campus-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(29,78,216,0.24)] transition hover:bg-campus-700"
                >
                  Explore features
                </motion.a>
                <motion.a
                  whileHover={{ y: -2 }}
                  href="#campusassist-roles"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-campus-200 hover:text-campus-700"
                >
                  See who it is for
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
