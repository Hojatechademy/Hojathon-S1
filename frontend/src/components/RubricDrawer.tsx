'use client';

import React, { useState, useEffect } from 'react';
import { ScoringRubricData } from '@/lib/types';
import { generateRubric } from '@/lib/api';
import {
  X,
  ClipboardCheck,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Scale,
  Brain,
  FileText,
  Clock,
  RotateCcw,
  Lightbulb,
  Layers
} from 'lucide-react';

interface RubricDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
  chapterTitle?: string;
  initialQuestion?: string;
  initialMarks?: number;
}

const SAMPLE_QUESTIONS: Record<string, { q: string; marks: number }> = {
  Physics: {
    q: "State Newton's Second Law of Motion. Starting from the definition of momentum, derive the mathematical relationship F = ma for a body of constant mass, and explain why a rocket can accelerate in the vacuum of space.",
    marks: 5
  },
  'Computer Science': {
    q: "Explain Dijkstra's shortest path algorithm. Detail how a min-heap priority queue is utilized, write the relaxation step, and analyze both the worst-case time complexity and auxiliary space complexity.",
    marks: 10
  },
  Biology: {
    q: "Describe the three major biochemical stages of Cellular Respiration (Glycolysis, Citric Acid Cycle, and Oxidative Phosphorylation). Specify their cellular locations, electron carriers generated, and calculate the net theoretical ATP yield per glucose molecule.",
    marks: 10
  },
  Mathematics: {
    q: "State the Fundamental Theorem of Calculus. Verify its hypotheses and compute the exact definite integral of f(x) = 3x^2 - 4x + 1 on the interval [1, 3], interpreting the result geometrically as net signed area.",
    marks: 5
  }
};

export default function RubricDrawer({
  isOpen,
  onClose,
  defaultSubject = 'Physics',
  chapterTitle,
  initialQuestion = '',
  initialMarks = 10
}: RubricDrawerProps) {
  // Form State
  const [subject, setSubject] = useState(defaultSubject);
  const [question, setQuestion] = useState(initialQuestion);
  const [maxMarks, setMaxMarks] = useState<number>(initialMarks);

  // Result & UI State
  const [rubric, setRubric] = useState<ScoringRubricData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'criteria' | 'performance' | 'tips' | 'model'>('criteria');
  const [copied, setCopied] = useState(false);

  // Update default subject if prop changes
  useEffect(() => {
    if (defaultSubject && !rubric) {
      setSubject(defaultSubject);
    }
  }, [defaultSubject, rubric]);

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  if (!isOpen) return null;

  const handleApplySample = (subjKey: string) => {
    const sample = SAMPLE_QUESTIONS[subjKey] || SAMPLE_QUESTIONS['Physics'];
    setSubject(subjKey);
    setQuestion(sample.q);
    setMaxMarks(sample.marks);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a question to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await generateRubric(
        subject || 'General Academic',
        question.trim(),
        maxMarks || 10,
        chapterTitle
      );
      setRubric(data);
      setActiveTab('criteria');
    } catch (err: any) {
      setError(err.message || 'Failed to generate scoring rubric. Please check inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!rubric) return;

    let md = `# Scoring Rubric: ${rubric.subject}\n`;
    md += `**Question:** ${rubric.question}\n`;
    md += `**Total Marks:** ${rubric.max_marks} | **Cognitive Depth:** ${rubric.bloom_level} | **Difficulty:** ${rubric.difficulty}\n\n`;
    md += `### Summary\n${rubric.summary}\n\n`;

    md += `### Criteria Marking Breakdown\n`;
    rubric.criteria.forEach((c) => {
      md += `#### ${c.name} (${c.marks} Marks)\n`;
      md += `${c.description}\n`;
      md += `- **Key Marking Points:**\n`;
      c.key_marking_points.forEach((kp) => (md += `  * ${kp}\n`));
      md += `- **Partial Credit:** ${c.partial_credit_rules}\n\n`;
    });

    md += `### Performance Levels\n`;
    rubric.performance_levels.forEach((pl) => {
      md += `* **${pl.level}** (${pl.score_range}): ${pl.descriptor}\n`;
    });

    md += `\n### Examiner Traps & Deduction Pitfalls\n`;
    rubric.examiner_tips.forEach((tip) => {
      md += `* ${tip}\n`;
    });

    md += `\n### Exemplary Model Solution\n${rubric.model_answer}\n`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleResetForm = () => {
    setRubric(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Scoring Rubric Analyzer
                </h2>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Rubric Tool
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {chapterTitle ? `Grounded in ${chapterTitle} • ` : ''}Analyze questions with subject & marks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rubric && (
              <button
                onClick={handleResetForm}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Analyze Another Question"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Query</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close Rubric Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form when no rubric generated yet */}
          {!rubric && (
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Educational Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-indigo-50 dark:from-rose-950/30 dark:to-indigo-950/30 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-200">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span>AI Assessment & Mark Allocation Engine</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Provide an exam or practice question along with the subject and maximum mark. The tool
                  evaluates cognitive depth and outputs clear mark-distribution criteria, performance tiers,
                  common deduction traps, and a full model answer.
                </p>
              </div>

              {/* Subject Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>1. Subject</span>
                  <span className="text-[10px] lowercase text-slate-400 font-normal">select or type custom</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Physics', 'Computer Science', 'Biology', 'Mathematics'].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        subject.toLowerCase() === s.toLowerCase()
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics, Data Structures, Quantum Mechanics..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              {/* Maximum Mark Allocation */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>2. Maximum Marks</span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">{maxMarks} Marks Total</span>
                </label>
                <div className="flex items-center gap-2">
                  {[2, 5, 10, 15, 20].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setMaxMarks(preset)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        maxMarks === preset
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset}M
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={0.5}
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Question Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    3. Question / Assessment Prompt
                  </label>
                  <button
                    type="button"
                    onClick={() => handleApplySample(subject || 'Physics')}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3" />
                    <span>Try sample question</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter the complete question text to analyze and generate scoring rubrics for (e.g., 'Derive F = ma from Newton's Second Law...')..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none shadow-sm"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Cognitive Depth & Rubrics...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    <span>Generate Scoring Rubric ({maxMarks} Marks)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Rendered Rubric View */}
          {rubric && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Question Metadata Header Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-xs shadow-sm">
                      {rubric.max_marks} Marks
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                      {rubric.subject}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-[11px]">
                      {rubric.bloom_level}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{rubric.estimated_time_mins} mins</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Question Analyzed
                  </h4>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    &ldquo;{rubric.question}&rdquo;
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  {rubric.summary}
                </p>

                {/* Mark Distribution Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Mark Distribution</span>
                    <span>100% Total</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden">
                    {rubric.criteria.map((c, i) => {
                      const colors = [
                        'bg-rose-500',
                        'bg-blue-500',
                        'bg-emerald-500',
                        'bg-amber-500',
                        'bg-purple-500'
                      ];
                      const widthPct = Math.max(8, (c.marks / rubric.max_marks) * 100);
                      return (
                        <div
                          key={c.id || i}
                          style={{ width: `${widthPct}%` }}
                          className={`${colors[i % colors.length]} h-full transition-all`}
                          title={`${c.name}: ${c.marks} marks (${Math.round((c.marks / rubric.max_marks) * 100)}%)`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('criteria')}
                  className={`flex-1 py-2.5 border-b-2 flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'criteria'
                      ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Marking Criteria ({rubric.criteria.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('performance')}
                  className={`flex-1 py-2.5 border-b-2 flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'performance'
                      ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Performance Grid</span>
                </button>

                <button
                  onClick={() => setActiveTab('tips')}
                  className={`flex-1 py-2.5 border-b-2 flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'tips'
                      ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Examiner Traps</span>
                </button>

                <button
                  onClick={() => setActiveTab('model')}
                  className={`flex-1 py-2.5 border-b-2 flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'model'
                      ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Model Solution</span>
                </button>
              </div>

              {/* Tab 1: Criteria Breakdown */}
              {activeTab === 'criteria' && (
                <div className="space-y-4">
                  {rubric.criteria.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            Criterion {idx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {c.name}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-xs border border-rose-200 dark:border-rose-900">
                            {c.marks} Marks
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {Math.round((c.marks / rubric.max_marks) * 100)}% of total
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {c.description}
                      </p>

                      {/* Key Marking Points */}
                      {c.key_marking_points && c.key_marking_points.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Essential Marking Points & Keywords:
                          </span>
                          <ul className="space-y-1">
                            {c.key_marking_points.map((kp, kIdx) => (
                              <li
                                key={kIdx}
                                className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{kp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Partial Credit Rule */}
                      {c.partial_credit_rules && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                          <Scale className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Partial Credit Rule: </span>
                            <span>{c.partial_credit_rules}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Performance Levels Matrix */}
              {activeTab === 'performance' && (
                <div className="space-y-3">
                  {rubric.performance_levels.map((pl, idx) => {
                    const colorVariants = [
                      'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
                      'border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300',
                      'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
                      'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                    ];
                    const variant = colorVariants[idx % colorVariants.length];

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border ${variant} space-y-2 transition shadow-sm`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold">
                            {pl.level}
                          </h4>
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30">
                            {pl.score_range}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {pl.descriptor}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 3: Examiner Traps & Deduction Rules */}
              {activeTab === 'tips' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Examiner Marking Traps & Penalty Guidelines</span>
                    </div>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                      Examiners subtract marks systematically for these specific errors on this question:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {rubric.examiner_tips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-200"
                      >
                        <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {idx + 1}
                        </div>
                        <span className="leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Exemplary Model Solution */}
              {activeTab === 'model' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Full Marks Model Solution ({rubric.max_marks} / {rubric.max_marks})</span>
                    </div>
                    <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                      The ideal benchmark solution demonstrating full compliance with every criterion in this rubric:
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed overflow-x-auto">
                    {rubric.model_answer}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleCopyMarkdown}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full Rubric (Markdown)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleResetForm}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Analyze Another Question</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
