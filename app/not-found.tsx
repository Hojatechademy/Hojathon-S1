import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-teal-50/20 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 text-center transition-colors">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 ring-1 ring-slate-200/80 dark:ring-slate-700 shadow-xs mb-4 p-2">
        <Image
          src="/careflowlogo.png"
          alt="CareFollow Logo"
          width={52}
          height={52}
          className="h-full w-full object-contain rounded-xl"
        />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">404 - Record Not Found</h1>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
        The requested clinical page or workspace view could not be located in your patient account.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button size="sm" className="gap-2 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-semibold shadow-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Follow-up Dashboard</span>
          </Button>
        </Link>
      </div>
    </main>
  );
}

