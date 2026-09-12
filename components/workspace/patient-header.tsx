"use client";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { LogOut, HeartPulse, User, LayoutDashboard, Stethoscope, ShieldCheck } from "lucide-react";
import { useTransition } from "react";
import Link from "next/link";
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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand Logo & Context */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 text-white shadow-sm ring-1 ring-teal-700/20 transition-transform group-hover:scale-105">
                <HeartPulse className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors">
                    Care Follow-up
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20">
                    <ShieldCheck className="h-3 w-3" />
                    Patient Portal
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">{formattedDate}</p>
              </div>
            </Link>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-sm shadow-xs">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-[11px] font-bold text-white uppercase tracking-wider">
                {(displayName || "P").charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-none">
                  {displayName || "Patient"}
                </span>
                {email && (
                  <span className="text-[10px] text-slate-500 truncate max-w-[140px] sm:max-w-[180px]">
                    {email}
                  </span>
                )}
              </div>
            </div>

            <form action={handleSignOut}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={isPending}
                className="gap-1.5 h-8 px-2.5 text-xs text-slate-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isPending ? "Signing out..." : "Sign Out"}</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-2 pt-1 border-t border-slate-100" aria-label="Workspace Navigation">
          <Link href="/dashboard">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isDashboard
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Follow-up Dashboard</span>
            </span>
          </Link>

          <Link href="/doctors">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isDoctors
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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


