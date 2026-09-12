"use client";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Stethoscope, ShieldCheck } from "lucide-react";
import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { usePathname } from "next/navigation";

interface PatientHeaderProps {
  displayName?: string;
  email?: string;
}

export function PatientHeader({ displayName, email }: PatientHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  const isDashboard = pathname === "/dashboard" || pathname === "/";
  const isDoctors = pathname.startsWith("/doctors");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all dark:border-slate-800 dark:bg-slate-900/85">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand Logo & Context */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 p-1 transition-transform group-hover:scale-105 dark:bg-slate-800 dark:ring-slate-700">
                <Image
                  src="/careflowlogo.png"
                  alt="CareFollow Logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain rounded-lg"
                  priority
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors dark:text-white dark:group-hover:text-teal-400">
                    Care Follow-up
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-700/40">
                    <ShieldCheck className="h-3 w-3" />
                    Patient Portal
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{formattedDate}</p>
              </div>
            </Link>
          </div>

          {/* User Profile, Theme Toggle & Sign Out */}
          <div className="flex items-center justify-between gap-2.5 sm:justify-end">
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-sm shadow-xs dark:border-slate-800 dark:bg-slate-800/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-[11px] font-bold text-white uppercase tracking-wider dark:bg-teal-600">
                {(displayName || "P").charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-none dark:text-slate-200">
                  {displayName || "Patient"}
                </span>
                {email && (
                  <span className="text-[10px] text-slate-500 truncate max-w-[130px] sm:max-w-[170px] dark:text-slate-400">
                    {email}
                  </span>
                )}
              </div>
            </div>

            <ThemeToggle />

            <form action={handleSignOut}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={isPending}
                className="gap-1.5 h-9 px-2.5 text-xs text-slate-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isPending ? "Signing out..." : "Sign Out"}</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80" aria-label="Workspace Navigation">
          <Link href="/dashboard" prefetch={true}>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isDashboard
                  ? "bg-teal-700 text-white shadow-xs dark:bg-teal-600"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Follow-up Dashboard</span>
            </span>
          </Link>

          <Link href="/doctors" prefetch={true}>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isDoctors
                  ? "bg-teal-700 text-white shadow-xs dark:bg-teal-600"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Available Doctors & Timings</span>
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}


