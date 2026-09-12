import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PatientHeader } from "@/components/workspace/patient-header";
import { DoctorsView } from "@/components/doctors/doctors-view";
import { getHospitalDoctors } from "@/lib/doctors/data";

export const metadata = {
  title: "Available Doctors & Appointments | Care Follow-up",
  description: "Browse hospital physicians, view consultation timings, and inspect available appointment slots.",
};

export default async function DoctorsPage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Patient";

  const doctors = await getHospitalDoctors();

  return (
    <div className="min-h-screen bg-slate-50/70">
      <PatientHeader displayName={displayName} email={user.email} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DoctorsView doctors={doctors} />
      </main>
    </div>
  );
}
