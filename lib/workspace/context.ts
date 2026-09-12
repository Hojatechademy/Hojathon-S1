import { createClient } from "@/lib/supabase/server";
import type { PatientContext, PatientProfile, FollowUpTask, Appointment, Reminder } from "@/lib/contracts";

export async function getFollowUpContext(): Promise<PatientContext | { error: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase client is not configured. Check environment variables." };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Unauthorized: Patient session not found." };
  }

  // 1. Fetch or create patient profile
  let profile: PatientProfile | null = null;
  const { data: profileData, error: profileError } = await supabase
    .from("patient_profiles")
    .select("id, display_name, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileData) {
    profile = profileData as PatientProfile;
  } else if (!profileError || profileError.code === "PGRST116") {
    // Attempt to initialize profile if not yet created
    const fallbackName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Patient";
    const { data: newProfile, error: insertError } = await supabase
      .from("patient_profiles")
      .insert({ id: user.id, display_name: fallbackName })
      .select("id, display_name, created_at, updated_at")
      .maybeSingle();

    if (!insertError && newProfile) {
      profile = newProfile as PatientProfile;
    }
  }

  // 2. Fetch tasks
  const { data: tasksData, error: tasksError } = await supabase
    .from("follow_up_tasks")
    .select("id, patient_id, title, description, due_at, status, created_at, updated_at")
    .eq("patient_id", user.id)
    .order("due_at", { ascending: true, nullsFirst: false });

  // 3. Fetch appointments
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, patient_id, title, starts_at, location, status, created_at, updated_at")
    .eq("patient_id", user.id)
    .order("starts_at", { ascending: true });

  // 4. Fetch reminders
  const { data: remindersData, error: remindersError } = await supabase
    .from("reminders")
    .select("id, patient_id, task_id, remind_at, status, created_at")
    .eq("patient_id", user.id)
    .order("remind_at", { ascending: true });

  if (tasksError || appointmentsError || remindersError) {
    // If any table fetch encounters an issue (e.g. migration in progress), log as warning and return safe defaults
    console.warn("Notice: Patient workspace query note:", {
      tasks: tasksError?.message,
      appointments: appointmentsError?.message,
      reminders: remindersError?.message,
    });
  }

  return {
    profile,
    tasks: (tasksData || []) as FollowUpTask[],
    appointments: (appointmentsData || []) as Appointment[],
    reminders: (remindersData || []) as Reminder[],
  };
}
