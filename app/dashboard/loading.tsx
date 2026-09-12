import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { LayoutDashboard } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 transition-colors">
      {/* Header skeleton */}
      <div className="border-b border-slate-200/80 bg-white/85 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200/80 shadow-xs p-1 dark:bg-slate-800 dark:ring-slate-700">
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
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-5 space-y-3 dark:border-rose-900/50 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-6 w-44 rounded-md" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-6 w-44 rounded-md" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 h-[460px] dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-6 w-36 rounded-md" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
