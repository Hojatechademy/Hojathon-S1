'use client';

import React from 'react';
import Link from 'next/link';
import { StudentProfile } from '@/lib/types';
import RankBadge from './RankBadge';
import { Sparkles, Menu, Flame, ChevronRight, BookOpen, Cloud, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  student?: StudentProfile | null;
  subjectName?: string;
  chapterTitle?: string;
  onOpenMenu?: () => void;
  showBackToHome?: boolean;
}

export default function Navbar({
  student,
  subjectName,
  chapterTitle,
  onOpenMenu,
  showBackToHome = false
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / Navigation Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {showBackToHome ? (
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Return to Subjects"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Subjects</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Eduro AI
                </span>
                <span className="text-[10px] text-slate-400 font-medium -mt-1 tracking-wider uppercase">
                  Personalized Learning
                </span>
              </div>
            </Link>
          )}

          {subjectName && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800 truncate">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{subjectName}</span>
              {chapterTitle && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate max-w-[240px] text-slate-600 dark:text-slate-300 font-medium">
                    {chapterTitle}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: GCP ADC status, Streak, Rank & Hamburger Drawer */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* GCP ADC Active Pill */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
            title="Google Cloud Application Default Credentials (ADC) connected to Vertex AI"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>GCP ADC • Vertex AI</span>
          </div>

          {/* Daily Streak */}
          {student && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-xs font-bold text-orange-600 dark:text-orange-400"
              title="Daily Learning Streak"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>{student.streak_days}d</span>
            </div>
          )}

          {/* Student Rank */}
          {student?.rank && (
            <div className="hidden sm:block">
              <RankBadge rank={student.rank} xp={student.xp} size="sm" />
            </div>
          )}

          {/* Hamburger Menu Trigger */}
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300/60 dark:border-slate-700 transition active:scale-95 shadow-sm"
              aria-label="Open Study Tools Menu"
            >
              <Menu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Study Tools</span>
              {/* Pulsing indicator */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
