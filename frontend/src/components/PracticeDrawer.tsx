'use client';

import React, { useState, useEffect } from 'react';
import {
  PracticeQuestion,
  QuizEvaluationResult,
  ProfileUpdateResult,
  RankInfo
} from '@/lib/types';
import { generatePracticeQuestions, submitPracticeAnswers } from '@/lib/api';
import confetti from 'canvas-confetti';
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Zap,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Trophy,
  ChevronRight
} from 'lucide-react';
import RankBadge from './RankBadge';

interface PracticeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle: string;
  studentRank?: RankInfo;
  onProfileUpdated?: (update: ProfileUpdateResult) => void;
}

export default function PracticeDrawer({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  studentRank,
  onProfileUpdated
}: PracticeDrawerProps) {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<QuizEvaluationResult | null>(null);
  const [profileUpdate, setProfileUpdate] = useState<ProfileUpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && questions.length === 0) {
      loadQuestions();
    }
  }, [isOpen, chapterId]);

  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    setEvaluation(null);
    setProfileUpdate(null);
    setSubmissions({});
    setShowHints({});
    try {
      const data = await generatePracticeQuestions(chapterId, 3);
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate practice questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (evaluation) return; // Prevent changing after submission
    setSubmissions((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleTextAnswerChange = (questionId: string, text: string) => {
    if (evaluation) return;
    setSubmissions((prev) => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleSubmit = async () => {
    if (questions.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitPracticeAnswers(chapterId, questions, submissions);
      setEvaluation(result.evaluation);
      setProfileUpdate(result.profile_update);

      if (onProfileUpdated) {
        onProfileUpdated(result.profile_update);
      }

      // Celebrate if high score or ranked up!
      if (result.profile_update.ranked_up || (result.evaluation.earned_score / result.evaluation.max_score) >= 0.7) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Adaptive Practice Questions
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  AI Evaluated
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calibrated to {studentRank?.name || 'Your Rank'} ({studentRank?.difficulty_label || 'Foundational'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadQuestions}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Generate New Question Set"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Rank & XP Status Banner */}
          {studentRank && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <RankBadge rank={studentRank} size="sm" />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Difficulty calibrated to your mastery
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                {questions.length} Questions
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 mb-3 animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                GCP Vertex AI Generating Custom Questions...
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Analyzing chapter content and formulating questions matched to your rank level.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, qIndex) => {
                const isSelected = submissions[q.id] !== undefined;
                const evalItem = evaluation?.evaluations?.find((e) => e.question_id === q.id);

                return (
                  <div
                    key={q.id || qIndex}
                    className={`p-5 rounded-2xl border transition-all ${
                      evalItem
                        ? evalItem.is_correct
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 shadow-sm'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Question {qIndex + 1} of {questions.length}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {q.difficulty}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          +{q.xp_reward || 30} XP
                        </span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4 leading-relaxed">
                      {q.question}
                    </p>

                    {/* Options (Multiple Choice) */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="space-y-2 mb-3">
                        {q.options.map((option, optIdx) => {
                          const isPicked = submissions[q.id] === optIdx;
                          const isCorrectOption = q.correct_option_index === optIdx;

                          let optionStyle =
                            'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';

                          if (isPicked && !evaluation) {
                            optionStyle = 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20';
                          }

                          if (evaluation) {
                            if (isCorrectOption) {
                              optionStyle = 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-medium';
                            } else if (isPicked && !isCorrectOption) {
                              optionStyle = 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 line-through';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              disabled={!!evaluation}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${optionStyle}`}
                            >
                              <span className="w-5 h-5 rounded-full border border-current shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{option}</span>
                              {evaluation && isCorrectOption && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              {evaluation && isPicked && !isCorrectOption && (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Free Text Input (Short Answer) */}
                    {q.type === 'short_answer' && (
                      <div className="mb-3">
                        <textarea
                          rows={2}
                          value={submissions[q.id] || ''}
                          onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                          disabled={!!evaluation}
                          placeholder="Type your explanation or calculated answer here..."
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {/* Hint Accordion */}
                    {q.hint && !evaluation && (
                      <div className="mt-2">
                        {showHints[q.id] ? (
                          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                            <span>
                              <b>Hint:</b> {q.hint}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowHints((p) => ({ ...p, [q.id]: true }))}
                            className="text-[11px] text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>Need a hint?</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* AI Feedback & Explanation Post-Submission */}
                    {evalItem && (
                      <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5">
                          {evalItem.is_correct ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer!
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Concept Check Needed
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{evalItem.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Evaluation Results Card */}
              {evaluation && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Quiz Results & AI Evaluation
                      </h3>
                    </div>
                    <div className="text-sm font-extrabold px-3 py-1 rounded-full bg-indigo-600 text-white shadow-sm">
                      {evaluation.earned_score} / {evaluation.max_score} Correct (
                      {Math.round((evaluation.earned_score / evaluation.max_score) * 100)}%)
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 mb-4 leading-relaxed font-medium">
                    {evaluation.summary_feedback}
                  </p>

                  {/* Profile Update Details */}
                  {profileUpdate && (
                    <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> XP Earned:
                        </span>
                        <span className="font-extrabold text-emerald-600">+{profileUpdate.xp_gained} XP</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300">Chapter Mastery:</span>
                        <span className="font-bold text-indigo-600">{profileUpdate.chapter_mastery}%</span>
                      </div>

                      {profileUpdate.ranked_up && (
                        <div className="mt-2 p-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center justify-between animate-pulse">
                          <span>🎉 LEVEL UP! Promoted to {profileUpdate.new_rank.name}!</span>
                          <span>Lvl {profileUpdate.new_rank.rank_id}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-indigo-200/60 dark:border-slate-700">
                    <p className="text-[11px] text-slate-500">
                      Subsequent practice sets will automatically adjust in difficulty.
                    </p>
                    <button
                      onClick={loadQuestions}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition active:scale-95"
                    >
                      Next Adaptive Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        {!evaluation && questions.length > 0 && !isLoading && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500">
              {Object.keys(submissions).length} of {questions.length} answered
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(submissions).length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI Checking Answers...</span>
                </>
              ) : (
                <>
                  <span>Submit for AI Evaluation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
