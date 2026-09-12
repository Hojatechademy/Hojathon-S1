import { createClient } from "@/lib/supabase/server";
import { getFollowUpContext } from "@/lib/workspace/context";
import { WorkspaceView } from "@/components/workspace/workspace-view";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Patient Dashboard | Care Follow-up",
  description: "View and manage your healthcare follow-up actions, visits, and reminders.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-rose-200 bg-white p-6 shadow-sm text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-600" />
          <h1 className="mt-3 text-lg font-bold text-slate-900">Database Configuration Missing</h1>
          <p className="mt-2 text-sm text-slate-600">
            Please verify that <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> are set in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">.env.local</code>.
          </p>
        </div>
      </main>
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const contextResult = await getFollowUpContext();

  if ("error" in contextResult) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-3 text-lg font-bold text-slate-900">Unable to load patient records</h1>
          <p className="mt-2 text-sm text-slate-600">{contextResult.error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dashboard">
              <Button size="sm">Retry</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">Back to Login</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <WorkspaceView
      initialContext={contextResult}
      userEmail={user.email}
    />
  );
}
