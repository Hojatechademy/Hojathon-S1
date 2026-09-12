'use client';

import React from 'react';
import { RankInfo } from '@/lib/types';
import { Award, Zap } from 'lucide-react';

interface RankBadgeProps {
  rank?: RankInfo;
  xp?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function RankBadge({ rank, xp = 0, showProgress = true, size = 'md' }: RankBadgeProps) {
  if (!rank) return null;

  const colorClasses: Record<string, { bg: string; text: string; border: string; bar: string; badge: string }> = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-500 text-white'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      bar: 'bg-blue-500',
      badge: 'bg-blue-500 text-white'
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      bar: 'bg-indigo-500',
      badge: 'bg-indigo-500 text-white'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      bar: 'bg-purple-500',
      badge: 'bg-purple-500 text-white'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      bar: 'bg-amber-500',
      badge: 'bg-amber-500 text-white'
    }
  };

  const scheme = colorClasses[rank.color] || colorClasses.emerald;

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${scheme.bg} ${scheme.text} ${scheme.border}`}>
        <Award className="w-3.5 h-3.5" />
        <span>Lvl {rank.rank_id} • {rank.name}</span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl border ${scheme.bg} ${scheme.border} transition-all`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm ${scheme.badge}`}>
            {rank.rank_id}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold text-sm ${scheme.text}`}>{rank.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/70 dark:bg-black/30 font-medium text-slate-600 dark:text-slate-300">
                Lvl {rank.rank_id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {rank.difficulty_label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-black/40 border border-slate-200/60 dark:border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{xp} XP</span>
        </div>
      </div>

      {showProgress && rank.xp_to_next > 0 && (
        <div className="mt-2.5">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Next rank in {rank.xp_to_next} XP</span>
            <span>{rank.progress_pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${scheme.bar} transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(100, Math.max(5, rank.progress_pct))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
