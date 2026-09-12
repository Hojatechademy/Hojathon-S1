"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase client is not available. Please verify environment variables." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase client is not available. Please verify environment variables." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split("@")[0],
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Create initial profile if user was created immediately (e.g. auto-confirm enabled)
  if (data.user) {
    await supabase.from("patient_profiles").upsert({
      id: data.user.id,
      display_name: displayName || email.split("@")[0] || "Patient",
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInAsDemoPatient() {
  const demoEmail = "demo.patient@carefollowup.local";
  const demoPassword = "DemoPassword123!";

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase client is not configured." };
  }

  // Try signing in
  let { data, error } = await supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  if (error) {
    // If user doesn't exist, sign up
    const signUpResult = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        data: {
          display_name: "Sarah Jenkins",
        },
      },
    });

    if (signUpResult.error) {
      return { error: `Demo sign-in failed: ${signUpResult.error.message}` };
    }

    if (signUpResult.data.user) {
      // Create profile and initial sample data for Sarah Jenkins
      const userId = signUpResult.data.user.id;
      await supabase.from("patient_profiles").upsert({
        id: userId,
        display_name: "Sarah Jenkins",
      });

      // Populate demo tasks
      await supabase.from("follow_up_tasks").insert([
        {
          patient_id: userId,
          title: "Schedule Cardiology Post-Discharge Checkup",
          description: "Required within 14 days of discharge following blood pressure observation.",
          status: "pending",
          due_at: new Date(Date.now() + 86400000 * 3).toISOString(),
        },
        {
          patient_id: userId,
          title: "Complete Fasting Lipid Panel Lab Work",
          description: "Routine follow-up lab to be drawn before cardiology visit.",
          status: "in_progress",
          due_at: new Date(Date.now() + 86400000 * 5).toISOString(),
        },
      ]);

      // Populate demo appointments (including a missed one to trigger the core demo flow)
      await supabase.from("appointments").insert([
        {
          patient_id: userId,
          title: "Initial Cardiology Consultation",
          starts_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          location: "Heart & Vascular Pavilion, Suite 300",
          status: "missed",
        },
        {
          patient_id: userId,
          title: "Primary Care Wellness Follow-up",
          starts_at: new Date(Date.now() + 86400000 * 10).toISOString(),
          location: "Downtown Health Clinic",
          status: "scheduled",
        },
      ]);

      // Populate demo reminder
      await supabase.from("reminders").insert([
        {
          patient_id: userId,
          remind_at: new Date(Date.now() + 86400000 * 1).toISOString(),
          status: "pending",
        },
      ]);
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
