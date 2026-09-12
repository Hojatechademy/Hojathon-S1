'use client';

import React, { useState, useEffect } from 'react';
import { ExamPrepData } from '@/lib/types';
import { fetchExamPrep } from '@/lib/api';
import {
  X,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  FileCheck,
  BrainCircuit,
  Bookmark,
  ChevronRight
} from 'lucide-react';

interface ExamPrepDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle: string;
}

export default function ExamPrepDrawer({
  isOpen,
  onClose,
  chapterId,
  chapterTitle
}: ExamPrepDrawerProps) {
  const [data, setData] = useState<ExamPrepData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !data) {
      loadExamPrep();
    }
  }, [isOpen, chapterId]);

  const loadExamPrep = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchExamPrep(chapterId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load exam prep sheet');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Rapid Exam Preparation
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  High Yield
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formula sheet, common traps, and memory mnemonics for {chapterTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 animate-spin">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                GCP Vertex AI Generating Exam Cheat Sheet...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* Section 1: High Yield Concepts */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span>High-Yield Concept Cheat Sheet</span>
                </h3>
                <div className="space-y-2.5">
                  {data.cheat_sheet.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {item.concept}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {item.exam_importance}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Essential Formulas */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <Bookmark className="w-4 h-4 text-indigo-600" />
                  <span>Essential Formulas & Scientific Laws</span>
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Law / Concept</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Formula</th>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700">Condition / Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {data.essential_formulas_or_laws.map((f, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{f.name}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20">{f.formula}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{f.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Frequent Exam Traps */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Frequent Examiner Traps to Avoid</span>
                </h3>
                <div className="space-y-2">
                  {data.frequent_exam_traps.map((trap, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        !
                      </span>
                      <p className="text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                        {trap}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Memory Mnemonics */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <BrainCircuit className="w-4 h-4 text-purple-600" />
                  <span>Memory Mnemonics</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.memory_mnemonics.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60"
                    >
                      <div className="font-extrabold text-sm text-purple-700 dark:text-purple-300 font-mono mb-1">
                        {m.acronym}
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {m.stands_for}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {m.context}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
