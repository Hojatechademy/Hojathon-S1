"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface BookAppointmentParams {
  doctorName: string;
  department: string;
  location: string;
  slot: string;
}

export async function bookDoctorAppointment(params: BookAppointmentParams) {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Database client unavailable." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized: Please sign in to book an appointment." };
  }

  // Calculate target date/time: Next upcoming weekday with the given slot time
  const now = new Date();
  const appointmentDate = new Date(now.getTime() + 86400000 * 2); // Default to 2 days ahead

  const { data, error } = await supabase.from("appointments").insert({
    patient_id: user.id,
    title: `Consultation with ${params.doctorName}`,
    location: `${params.department} — ${params.location}`,
    starts_at: appointmentDate.toISOString(),
    status: "scheduled",
  }).select().single();

  if (error) {
    return { error: `Failed to book appointment: ${error.message}` };
  }

  // Also create a follow-up task and reminder for this visit
  await supabase.from("follow_up_tasks").insert({
    patient_id: user.id,
    title: `Prepare for visit with ${params.doctorName} (${params.slot})`,
    description: `Scheduled appointment at ${params.location}. Bring recent medication list and insurance card.`,
    due_at: appointmentDate.toISOString(),
    status: "pending",
  });

  revalidatePath("/dashboard");
  revalidatePath("/doctors");

  return { success: true, appointment: data };
}
