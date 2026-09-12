'use client';

import React, { useState, useEffect } from 'react';
import { Flashcard } from '@/lib/types';
import { fetchFlashcards } from '@/lib/api';
import {
  X,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  CheckCircle,
  HelpCircle,
  Trophy
} from 'lucide-react';

interface FlashcardsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle: string;
}

export default function FlashcardsDrawer({
  isOpen,
  onClose,
  chapterId,
  chapterTitle
}: FlashcardsDrawerProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && cards.length === 0) {
      loadFlashcards();
    }
  }, [isOpen, chapterId]);

  const loadFlashcards = async () => {
    setIsLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);
    try {
      const res = await fetchFlashcards(chapterId);
      setCards(res.flashcards || []);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleMastered = (id: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Recall Flashcards
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {masteredIds.size}/{cards.length} Mastered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Spaced repetition memory cards for {chapterTitle}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 animate-spin">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Generating Flashcards via Vertex AI...
              </p>
            </div>
          ) : currentCard ? (
            <div className="w-full max-w-md flex flex-col items-center space-y-6">
              {/* Progress Indicator */}
              <div className="flex items-center justify-between w-full text-xs text-slate-500">
                <span>
                  Card {currentIndex + 1} of {cards.length}
                </span>
                <span className="font-semibold text-teal-600">
                  Click card to flip
                </span>
              </div>

              {/* 3D Flashcard */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full h-80 cursor-pointer select-none perspective-1000"
              >
                <div
                  className={`w-full h-full rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 shadow-xl border ${
                    isFlipped
                      ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-700'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${
                        isFlipped
                          ? 'bg-indigo-800 text-indigo-200'
                          : 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                      }`}
                    >
                      {isFlipped ? 'Answer / Solution' : 'Prompt / Concept'}
                    </span>
                    <RotateCw className="w-4 h-4 opacity-50" />
                  </div>

                  <div className="my-auto text-center px-2">
                    <h3
                      className={`font-semibold leading-relaxed ${
                        isFlipped ? 'text-base sm:text-lg text-indigo-100' : 'text-lg sm:text-xl font-bold'
                      }`}
                    >
                      {isFlipped ? currentCard.back : currentCard.front}
                    </h3>
                  </div>

                  <div className="text-center">
                    {isFlipped && currentCard.key_takeaway ? (
                      <p className="text-[11px] text-indigo-300 bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-800/60">
                        💡 <b>Memory Hook:</b> {currentCard.key_takeaway}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Tap to reveal explanation
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between w-full gap-3 pt-2">
                <button
                  onClick={handlePrev}
                  className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  title="Previous Card"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => toggleMastered(currentCard.id)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                    masteredIds.has(currentCard.id)
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {masteredIds.has(currentCard.id) ? 'Mastered!' : 'Mark as Mastered'}
                  </span>
                </button>

                <button
                  onClick={handleNext}
                  className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  title="Next Card"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No flashcards available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
