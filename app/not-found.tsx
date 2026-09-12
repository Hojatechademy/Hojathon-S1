import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeartPulse, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-teal-50/20 to-white px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-800 to-teal-600 text-white shadow-xs mb-4">
        <HeartPulse className="h-7 w-7" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">404 - Record Not Found</h1>
      <p className="mt-2 text-xs text-slate-500 max-w-sm leading-relaxed">
        The requested clinical page or workspace view could not be located in your patient account.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button size="sm" className="gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Follow-up Dashboard</span>
          </Button>
        </Link>
      </div>
    </main>
  );
}

