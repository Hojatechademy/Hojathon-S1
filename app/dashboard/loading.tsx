import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Header skeleton */}
      <div className="border-b border-slate-200 bg-white p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Main skeleton content */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            <Skeleton className="h-10 w-64 rounded-md" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
