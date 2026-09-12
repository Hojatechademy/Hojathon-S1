'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Chapter, StudentProfile, ProfileUpdateResult } from '@/lib/types';
import { fetchChapter } from '@/lib/api';
import Navbar from '@/components/Navbar';
import PdfViewer from '@/components/PdfViewer';
import ChatPanel from '@/components/ChatPanel';
import HamburgerMenu from '@/components/HamburgerMenu';
import PracticeDrawer from '@/components/PracticeDrawer';
import ExamPrepDrawer from '@/components/ExamPrepDrawer';
import FlashcardsDrawer from '@/components/FlashcardsDrawer';
import MasteryAnalyticsDrawer from '@/components/MasteryAnalyticsDrawer';
import UploadModal from '@/components/UploadModal';
import RubricDrawer from '@/components/RubricDrawer';
import {
  BookOpen,
  MessageSquare,
  Sparkles,
  Award,
  GraduationCap,
  Layers,
  BarChart2,
  ChevronLeft,
  ClipboardCheck
} from 'lucide-react';

export default function ChapterStudyPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.chapterId as string;

  const [chapter, setChapter] = useState<(Chapter & { subject_name?: string }) | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile layout tab toggle ('pdf' | 'chat')
  const [mobileTab, setMobileTab] = useState<'pdf' | 'chat'>('pdf');

  // Drawers
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isExamPrepOpen, setIsExamPrepOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);

  // Chat quick prefill
  const [prefilledChatPrompt, setPrefilledChatPrompt] = useState<string>('');

  useEffect(() => {
    if (!chapterId) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchChapter(chapterId);
        setChapter(data.chapter);
        setStudent(data.student);
      } catch (err: any) {
        setError(err.message || 'Failed to load chapter');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [chapterId]);

  const handleAskAboutPage = (pageNum: number) => {
    setPrefilledChatPrompt(
      `Can you explain the main concepts, equations, and insights on Page ${pageNum} of ${chapter?.title || 'this chapter'}?`
    );
    setMobileTab('chat');
  };

  const handleProfileUpdate = (update: ProfileUpdateResult) => {
    if (student) {
      setStudent({
        ...student,
        xp: update.total_xp,
        rank: update.new_rank,
        topic_mastery: {
          ...student.topic_mastery,
          [chapterId]: update.chapter_mastery
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold mb-1">Loading Chapter Context & PDF...</h3>
        <p className="text-xs text-slate-400">Initializing GCP ADC Vertex AI Tutor</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-950 text-red-600 mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Chapter Not Found</h2>
        <p className="text-xs text-slate-500 mb-4 max-w-sm">{error || "This chapter doesn't exist."}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
        >
          Return to All Subjects
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden select-none">
      {/* Navbar with Hamburger trigger */}
      <Navbar
        student={student}
        subjectName={chapter.subject_name}
        chapterTitle={chapter.title}
        onOpenMenu={() => setIsMenuOpen(true)}
        showBackToHome={true}
      />

      {/* Quick Study Action Strip (Desktop) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-2 hidden sm:flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-800 dark:text-slate-100">{chapter.title}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">{chapter.difficulty}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPracticeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Practice Questions</span>
          </button>

          <button
            onClick={() => setIsExamPrepOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold hover:bg-blue-100 transition text-xs"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Exam Prep</span>
          </button>

          <button
            onClick={() => setIsFlashcardsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold hover:bg-emerald-100 transition text-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcards</span>
          </button>

          <button
            onClick={() => setIsRubricOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold hover:bg-rose-100 transition text-xs"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Rubric Tool</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="sm:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <button
          onClick={() => setMobileTab('pdf')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
            mobileTab === 'pdf'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-transparent text-slate-500'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Textbook PDF</span>
        </button>

        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
            mobileTab === 'chat'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-transparent text-slate-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI Tutor Chat</span>
        </button>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden p-2 sm:p-4 gap-3 sm:gap-4">
        {/* Left Pane: Interactive PDF Viewer */}
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileTab === 'pdf' ? 'flex flex-col' : 'hidden sm:flex sm:flex-col'
          }`}
        >
          <PdfViewer
            chapterId={chapter.id}
            chapterTitle={chapter.title}
            pdfFilename={chapter.pdf_filename}
            onAskAboutPage={handleAskAboutPage}
          />
        </div>

        {/* Right Pane: Contextual AI Tutor Chat */}
        <div
          className={`w-full sm:w-[420px] lg:w-[480px] xl:w-[520px] h-full shrink-0 ${
            mobileTab === 'chat' ? 'flex flex-col' : 'hidden sm:flex sm:flex-col'
          }`}
        >
          <ChatPanel
            chapterId={chapter.id}
            chapterTitle={chapter.title}
            studentRank={student?.rank}
            initialPrompt={prefilledChatPrompt}
            onClearInitialPrompt={() => setPrefilledChatPrompt('')}
            onOpenPractice={() => setIsPracticeOpen(true)}
            onOpenExamPrep={() => setIsExamPrepOpen(true)}
            onOpenRubric={() => setIsRubricOpen(true)}
            onProfileUpdated={handleProfileUpdate}
          />
        </div>
      </div>

      {/* Hamburger Options Menu Drawer */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        chapterTitle={chapter.title}
        student={student}
        onOpenPractice={() => setIsPracticeOpen(true)}
        onOpenExamPrep={() => setIsExamPrepOpen(true)}
        onOpenFlashcards={() => setIsFlashcardsOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenRubric={() => setIsRubricOpen(true)}
      />

      {/* Practice Questions Drawer */}
      <PracticeDrawer
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        chapterId={chapter.id}
        chapterTitle={chapter.title}
        studentRank={student?.rank}
        onProfileUpdated={handleProfileUpdate}
      />

      {/* Exam Prep Drawer */}
      <ExamPrepDrawer
        isOpen={isExamPrepOpen}
        onClose={() => setIsExamPrepOpen(false)}
        chapterId={chapter.id}
        chapterTitle={chapter.title}
      />

      {/* Flashcards Drawer */}
      <FlashcardsDrawer
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        chapterId={chapter.id}
        chapterTitle={chapter.title}
      />

      {/* Scoring Rubric Drawer */}
      <RubricDrawer
        isOpen={isRubricOpen}
        onClose={() => setIsRubricOpen(false)}
        defaultSubject={chapter.subject_name || 'Physics'}
        chapterTitle={chapter.title}
      />

      {/* Analytics Drawer */}
      <MasteryAnalyticsDrawer
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        student={student}
        onStudentUpdated={(p) => setStudent(p)}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          router.push('/');
        }}
      />
    </div>
  );
}
