import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Stethoscope,
  Activity,
  AlertTriangle,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-teal-50/20 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-slate-200/80 shadow-xs dark:bg-slate-800 dark:ring-slate-700">
              <Image
                src="/careflowlogo.png"
                alt="CareFollow Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain rounded-lg"
                priority
              />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Care Follow-up
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-700/40">
                Patient Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm" className="font-semibold bg-teal-700 hover:bg-teal-800 text-white h-9 px-4 shadow-xs dark:bg-teal-600 dark:hover:bg-teal-700">
                Patient Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3.5 py-1 text-xs font-semibold text-teal-900 shadow-2xs dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
            <span className="flex h-2 w-2 rounded-full bg-teal-600 animate-pulse"></span>
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
            <span>Safe, Stateful Administrative Care Portal</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl sm:leading-tight">
            Never lose track of your{" "}
            <span className="bg-gradient-to-r from-teal-800 via-teal-600 to-emerald-600 bg-clip-text text-transparent dark:from-teal-400 dark:via-teal-300 dark:to-emerald-400">
              post-care follow-up actions
            </span>
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-base text-slate-600 dark:text-slate-300 sm:text-lg leading-relaxed">
            A calm, stateful workspace where patients track missed visits, upcoming clinic appointments, and required follow-up actions—all coordinated with an administrative AI assistant.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold h-12 px-7 shadow-xs dark:bg-teal-600 dark:hover:bg-teal-700">
                <span>Enter Patient Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-slate-700 border-slate-300 bg-white hover:bg-slate-50 h-12 px-6 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Instant Demo Sign-In</span>
              </Button>
            </Link>
          </div>

          {/* Hero Preview Card */}
          <div className="mt-14 max-w-3xl mx-auto rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-glass backdrop-blur-sm text-left dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Live Follow-up State</span>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
                Active Patient Session
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-rose-200/90 bg-rose-50/50 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/20">
                <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs font-semibold">
                  <span>Missed Visits</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="text-xl font-extrabold text-rose-900 dark:text-rose-200 mt-1">1 Action</div>
                <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">Cardiology Follow-up</div>
              </div>

              <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-semibold">
                  <span>Pending Tasks</span>
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-xl font-extrabold text-amber-900 dark:text-amber-200 mt-1">2 Orders</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">Labs & Blood Pressure Log</div>
              </div>

              <div className="rounded-xl border border-teal-200/90 bg-teal-50/50 p-3.5 dark:border-teal-900/50 dark:bg-teal-950/20">
                <div className="flex items-center justify-between text-teal-800 dark:text-teal-300 text-xs font-semibold">
                  <span>Upcoming Visits</span>
                  <Calendar className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                </div>
                <div className="text-xl font-extrabold text-teal-900 dark:text-teal-200 mt-1">1 Scheduled</div>
                <div className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">Primary Care Checkup</div>
              </div>
            </div>
          </div>

          {/* Three Feature Pillars */}
          <div className="mt-16 grid w-full max-w-4xl mx-auto grid-cols-1 gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 mb-3.5 dark:bg-teal-950/60 dark:text-teal-400">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Post-Care Task Tracker</h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Stay on top of critical post-discharge instructions, lab tests, and medication refills with clear due dates.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 mb-3.5 dark:bg-teal-950/60 dark:text-teal-400">
                <Stethoscope className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Hospital Doctor Schedules</h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Directly explore attending hospital doctors, consultation hours, and open appointment slots to reschedule care easily.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 mb-3.5 dark:bg-teal-950/60 dark:text-teal-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Stateful Follow-up Agent</h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ask questions about next steps and allow the AI assistant to perform validated administrative updates on your workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image
              src="/careflowlogo.png"
              alt="CareFollow Logo"
              width={22}
              height={22}
              className="h-5.5 w-5.5 object-contain rounded"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Care Follow-up Agent Workspace</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            For administrative follow-up coordination only. Does not provide medical diagnoses or prescriptions.
          </p>
        </div>
      </footer>
    </main>
  );
}

