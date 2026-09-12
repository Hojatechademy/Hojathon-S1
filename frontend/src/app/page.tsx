'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Subject, Chapter, StudentProfile } from '@/lib/types';
import { fetchSubjects, fetchHealth } from '@/lib/api';
import Navbar from '@/components/Navbar';
import RankBadge from '@/components/RankBadge';
import HamburgerMenu from '@/components/HamburgerMenu';
import PracticeDrawer from '@/components/PracticeDrawer';
import ExamPrepDrawer from '@/components/ExamPrepDrawer';
import FlashcardsDrawer from '@/components/FlashcardsDrawer';
import MasteryAnalyticsDrawer from '@/components/MasteryAnalyticsDrawer';
import UploadModal from '@/components/UploadModal';
import RubricDrawer from '@/components/RubricDrawer';
import {
  Atom,
  Cpu,
  Dna,
  Calculator,
  BookOpen,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  BarChart,
  Upload,
  Cloud,
  Layers,
  Award,
  GraduationCap,
  ClipboardCheck
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Atom: Atom,
  Cpu: Cpu,
  Dna: Dna,
  Calculator: Calculator,
  BookOpen: BookOpen
};

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('physics');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawers & Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isExamPrepOpen, setIsExamPrepOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('physics_ch1');
  const [selectedChapterTitle, setSelectedChapterTitle] = useState<string>("Newton's Laws of Motion");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSubjects();
      setSubjects(data.subjects || []);
      setStudent(data.student || null);
      if (data.subjects && data.subjects.length > 0) {
        setActiveSubjectId(data.subjects[0].id);
        if (data.subjects[0].chapters.length > 0) {
          setSelectedChapterId(data.subjects[0].chapters[0].id);
          setSelectedChapterTitle(data.subjects[0].chapters[0].title);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load curriculum');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        student={student}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Hero Section with Personalized Learning Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white p-6 sm:p-10 shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>GCP ADC Vertex AI • Adaptive Education Platform</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Master Any Subject with an AI Tutor That Adapts to Your Rank
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
              Select a chapter to read the authentic textbook PDF, converse with the context-aware
              AI agent, and take adaptive practice tests that calibrate to your learning level.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {activeSubject?.chapters?.[0] && (
                <Link
                  href={`/chapter/${activeSubject.chapters[0].id}`}
                  className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-blue-50 font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Start Reading Chapter 1</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white font-semibold text-xs border border-white/20 transition active:scale-95 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Custom PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Student Adaptive Profile Card */}
        {student && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <RankBadge rank={student.rank} xp={student.xp} size="md" />
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  Study Pace
                </span>
                <h4 className="text-sm font-extrabold capitalize text-slate-800 dark:text-slate-100 mt-0.5">
                  {student.preferred_pace} Mode
                </h4>
                <p className="text-[11px] text-slate-500">
                  {student.completed_chapters.length} Chapters Mastered
                </p>
              </div>

              <button
                onClick={() => setIsAnalyticsOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition"
              >
                Diagnostics
              </button>
            </div>
          </div>
        )}

        {/* Subjects Selection Tabs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Select Subject</span>
            </h2>
            <span className="text-xs text-slate-500">
              {subjects.length} Curricula Available
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {subjects.map((sub) => {
              const Icon = iconMap[sub.icon] || BookOpen;
              const isSelected = activeSubjectId === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubjectId(sub.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${sub.color} text-white flex items-center justify-center mb-3 shadow-sm`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {sub.chapters.length} Chapters
                  </p>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chapters for Selected Subject */}
        {activeSubject && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeSubject.name} Chapters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeSubject.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedChapterId(activeSubject.chapters[0]?.id || 'physics_ch1');
                    setSelectedChapterTitle(activeSubject.chapters[0]?.title || 'Practice');
                    setIsPracticeOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Practice Questions</span>
                </button>

                <button
                  onClick={() => {
                    setIsRubricOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Rubric Tool</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSubject.chapters.map((ch) => (
                <div
                  key={ch.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Chapter {ch.chapter_number}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {ch.estimated_mins} mins
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      {ch.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ch.summary}
                    </p>

                    {/* Topic Pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ch.key_topics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {ch.student_mastery !== undefined && (
                        <span>Mastery: <b className="text-indigo-600">{ch.student_mastery}%</b></span>
                      )}
                    </div>

                    <Link
                      href={`/chapter/${ch.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
                    >
                      <span>Study Chapter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Hamburger Options Menu */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        chapterTitle={selectedChapterTitle}
        student={student}
        onOpenPractice={() => setIsPracticeOpen(true)}
        onOpenExamPrep={() => setIsExamPrepOpen(true)}
        onOpenFlashcards={() => setIsFlashcardsOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenRubric={() => setIsRubricOpen(true)}
      />

      {/* Study Drawers */}
      <PracticeDrawer
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        chapterId={selectedChapterId}
        chapterTitle={selectedChapterTitle}
        studentRank={student?.rank}
        onProfileUpdated={(up) => {
          if (student) {
            setStudent({
              ...student,
              xp: up.total_xp,
              rank: up.new_rank
            });
          }
        }}
      />

      {/* Scoring Rubric Drawer */}
      <RubricDrawer
        isOpen={isRubricOpen}
        onClose={() => setIsRubricOpen(false)}
        defaultSubject={activeSubject?.name || 'Physics'}
        chapterTitle={selectedChapterTitle}
      />

      <ExamPrepDrawer
        isOpen={isExamPrepOpen}
        onClose={() => setIsExamPrepOpen(false)}
        chapterId={selectedChapterId}
        chapterTitle={selectedChapterTitle}
      />

      <FlashcardsDrawer
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        chapterId={selectedChapterId}
        chapterTitle={selectedChapterTitle}
      />

      <MasteryAnalyticsDrawer
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        student={student}
        onStudentUpdated={(p) => setStudent(p)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
