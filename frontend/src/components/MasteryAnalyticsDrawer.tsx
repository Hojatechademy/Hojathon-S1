'use client';

import React, { useState } from 'react';
import { StudentProfile } from '@/lib/types';
import { updateStudentPace, resetStudentProfile } from '@/lib/api';
import RankBadge from './RankBadge';
import {
  X,
  BarChart3,
  Flame,
  Target,
  AlertCircle,
  Clock,
  RotateCcw,
  Check,
  TrendingUp,
  Award
} from 'lucide-react';

interface MasteryAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile | null;
  onStudentUpdated?: (profile: StudentProfile) => void;
}

export default function MasteryAnalyticsDrawer({
  isOpen,
  onClose,
  student,
  onStudentUpdated
}: MasteryAnalyticsDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen || !student) return null;

  const handlePaceChange = async (pace: 'casual' | 'balanced' | 'intensive') => {
    setIsUpdating(true);
    try {
      const updated = await updateStudentPace(pace);
      if (onStudentUpdated) onStudentUpdated(updated);
    } catch (err) {
      console.error('Failed to update pace:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset your student rank and quiz history?')) return;
    setIsResetting(true);
    try {
      const reset = await resetStudentProfile();
      if (onStudentUpdated) onStudentUpdated(reset);
    } catch (err) {
      console.error('Failed to reset profile:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const paceOptions = [
    { id: 'casual', label: 'Casual Pace', desc: 'Fundamentals, gentle analogies & no rush' },
    { id: 'balanced', label: 'Balanced Pace', desc: 'Standard mastery curriculum & regular practice' },
    { id: 'intensive', label: 'Exam Rush', desc: 'High-yield problem drills, formulas & rigorous tests' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Personalized Learning Profile
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mastery analytics, adaptive rank, and pacing controls
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
          {/* Rank Card */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Current Adaptive Rank</span>
            </h3>
            <RankBadge rank={student.rank} xp={student.xp} size="md" />
          </div>

          {/* Learning Pace Selector */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Learning Pace & Intensity</span>
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {paceOptions.map((opt) => {
                const isSelected = student.preferred_pace === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handlePaceChange(opt.id as any)}
                    disabled={isUpdating}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold block">{opt.label}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{opt.desc}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Mastery Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Topic Mastery Matrix</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(student.topic_mastery || {}).map(([topicId, mastery]) => {
                const label = topicId.replace('_', ' ').toUpperCase();
                return (
                  <div key={topicId} className="space-y-1">
                    <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                      <span>{label}</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{mastery}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weak Spots & Targeted Remediation */}
          {student.weak_spots && student.weak_spots.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>AI Diagnosed Concept Gaps</span>
              </h3>
              <p className="text-[11px] text-slate-500 mb-2">
                Identified from practice quiz misses. The AI tutor prioritizes these concepts in chat.
              </p>
              <div className="space-y-2">
                {student.weak_spots.map((spot, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-medium flex items-center gap-2"
                  >
                    <Target className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{spot}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset profile action */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Want to test rank progression from scratch?</span>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 transition text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
