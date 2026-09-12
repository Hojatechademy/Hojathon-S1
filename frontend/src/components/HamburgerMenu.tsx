'use client';

import React from 'react';
import {
  X,
  Award,
  GraduationCap,
  Layers,
  BarChart3,
  Upload,
  BookOpen,
  Sparkles,
  ChevronRight,
  Flame,
  ShieldCheck,
  ClipboardCheck
} from 'lucide-react';
import { StudentProfile } from '@/lib/types';
import RankBadge from './RankBadge';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle?: string;
  student: StudentProfile | null;
  onOpenPractice: () => void;
  onOpenExamPrep: () => void;
  onOpenFlashcards: () => void;
  onOpenAnalytics: () => void;
  onOpenUpload: () => void;
  onOpenRubric: () => void;
}

export default function HamburgerMenu({
  isOpen,
  onClose,
  chapterTitle,
  student,
  onOpenPractice,
  onOpenExamPrep,
  onOpenFlashcards,
  onOpenAnalytics,
  onOpenUpload,
  onOpenRubric
}: HamburgerMenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'rubric',
      title: 'Scoring Rubric Analyzer',
      desc: 'Input any question, subject, and maximum marks to generate analytical scoring rubrics, mark distribution, and model answers.',
      icon: ClipboardCheck,
      badge: 'Rubric Tool',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      action: () => {
        onClose();
        onOpenRubric();
      }
    },
    {
      id: 'practice',
      title: 'Practice Questions & AI Evaluation',
      desc: 'Adaptive questions matched to your rank. Submit answers for instant AI grading & XP score.',
      icon: Award,
      badge: 'Rank Adaptive',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      action: () => {
        onClose();
        onOpenPractice();
      }
    },
    {
      id: 'exam_prep',
      title: 'Rapid Exam Preparation',
      desc: 'High-yield cheat sheets, essential scientific laws, examiner pitfalls, and memory mnemonics.',
      icon: GraduationCap,
      badge: 'High Yield',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      action: () => {
        onClose();
        onOpenExamPrep();
      }
    },
    {
      id: 'flashcards',
      title: 'Interactive Flashcards',
      desc: 'Flippable 3D memory cards for active recall and spaced repetition retention.',
      icon: Layers,
      badge: 'Active Recall',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      action: () => {
        onClose();
        onOpenFlashcards();
      }
    },
    {
      id: 'analytics',
      title: 'Mastery Diagnostics & Learning Pace',
      desc: 'View topic mastery matrix, AI-diagnosed concept gaps, and set your learning pace.',
      icon: BarChart3,
      badge: 'Personalized',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      action: () => {
        onClose();
        onOpenAnalytics();
      }
    },
    {
      id: 'upload',
      title: 'Upload Custom PDF Chapter',
      desc: 'Add any custom textbook or notes PDF to start AI tutoring and generating practice tests.',
      icon: Upload,
      badge: 'New',
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      action: () => {
        onClose();
        onOpenUpload();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Study Options & Tools
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {chapterTitle || 'Personalized AI Agent Tools'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Quick Rank Card */}
        {student?.rank && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
            <RankBadge rank={student.rank} xp={student.xp} size="sm" />
          </div>
        )}

        {/* Menu Options List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
            Personalized Learning Tools
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full text-left p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-sm group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 transition-colors shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {item.title}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>GCP Vertex AI Powered</span>
          </div>
          <span>Eduro Platform</span>
        </div>
      </div>
    </div>
  );
}
