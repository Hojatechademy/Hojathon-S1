import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Stethoscope, Building2, Sparkles, Clock, Calendar } from "lucide-react";

export default function DoctorsLoading() {
  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 transition-colors">
      {/* Header skeleton */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 ring-1 ring-slate-200/80 dark:ring-slate-700 shadow-xs p-1">
                <Image
                  src="/careflowlogo.png"
                  alt="CareFollow Logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="h-7 w-36 rounded-lg" />
            <Skeleton className="h-7 w-48 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Main skeleton content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Banner with Animated Indicator */}
        <div className="relative overflow-hidden rounded-2xl border border-teal-200/90 dark:border-teal-900/60 bg-gradient-to-r from-teal-50/90 via-white to-teal-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-teal-950/40 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-100/90 dark:bg-teal-950/70 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600"></span>
                </span>
                <Building2 className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                <span>Loading Hospital Physician Directory...</span>
              </div>
              <div className="h-8 w-72 sm:w-96 rounded-lg bg-slate-200/70 dark:bg-slate-800 animate-shimmer" />
              <div className="h-4 w-64 sm:w-80 rounded-md bg-slate-200/60 dark:bg-slate-800/80 animate-shimmer" />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-white/90 dark:bg-slate-800 px-4 py-3 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100/80 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 animate-pulse">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>

          <div className="pt-5">
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-teal-100/70 dark:border-teal-900/40 mt-4">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>

        {/* Doctor cards skeleton grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-200/80 dark:bg-slate-800 animate-shimmer flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <Stethoscope className="h-5 w-5 opacity-40" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>

              <div className="space-y-2 py-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="flex gap-1.5">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              </div>

              <div className="pt-2">
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
