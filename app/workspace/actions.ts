"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(taskId: string, newStatus: "pending" | "in_progress" | "completed" | "cancelled") {
  const supabase = await createClient();
  if (!supabase) return { error: "Database not connected." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase
    .from("follow_up_tasks")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("patient_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function seedSamplePatientData() {
  const supabase = await createClient();
  if (!supabase) return { error: "Database not connected." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized." };

  const userId = user.id;

  // 1. Ensure profile
  await supabase.from("patient_profiles").upsert({
    id: userId,
    display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "Patient",
  });

  // 2. Clear existing sample records to avoid clutter
  await supabase.from("follow_up_tasks").delete().eq("patient_id", userId);
  await supabase.from("appointments").delete().eq("patient_id", userId);
  await supabase.from("reminders").delete().eq("patient_id", userId);

  // 3. Insert fresh sample follow-up actions
  const { data: insertedTasks } = await supabase.from("follow_up_tasks").insert([
    {
      patient_id: userId,
      title: "Schedule Cardiology Post-Discharge Checkup",
      description: "Required within 14 days of discharge following observation. Review echo results with Dr. Elena Vance.",
      status: "pending",
      due_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
    {
      patient_id: userId,
      title: "Complete Fasting Lipid Panel Lab Work",
      description: "Routine follow-up lab to be drawn at Hospital Outpatient Lab before next visit.",
      status: "in_progress",
      due_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    },
    {
      patient_id: userId,
      title: "Daily Blood Pressure Log & Weight Monitoring",
      description: "Record morning and evening vitals in the patient tracker.",
      status: "completed",
      due_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ]).select();

  // 4. Insert appointments (with 1 missed to demonstrate alert banner)
  await supabase.from("appointments").insert([
    {
      patient_id: userId,
      title: "Cardiology Post-Discharge Consultation",
      starts_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      location: "Heart & Vascular Pavilion, Suite 302",
      status: "missed",
    },
    {
      patient_id: userId,
      title: "Primary Care Wellness & Medication Review",
      starts_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      location: "Downtown Health Clinic, Room 210",
      status: "scheduled",
    },
  ]);

  // 5. Insert reminder
  const taskId = insertedTasks?.[0]?.id || null;
  await supabase.from("reminders").insert([
    {
      patient_id: userId,
      task_id: taskId,
      remind_at: new Date(Date.now() + 86400000 * 1).toISOString(),
      status: "pending",
    },
  ]);

  revalidatePath("/dashboard");
  return { success: true };
}
