import type { Doctor } from "@/lib/contracts";
import { createClient } from "@/lib/supabase/server";

export const HOSPITAL_DOCTORS: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Elena Vance, MD",
    specialty: "Interventional Cardiology",
    department: "Heart & Vascular Pavilion",
    location: "Pavilion A, Suite 302",
    experience: "14 years experience",
    availableDays: ["Mon", "Tue", "Thu", "Fri"],
    timing: "08:30 AM – 03:30 PM",
    availableSlots: ["09:00 AM", "10:30 AM", "01:15 PM", "02:45 PM"],
    status: "available",
    avatarInitials: "EV",
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Chen, MD",
    specialty: "Internal Medicine & Primary Care",
    department: "Downtown Health Clinic",
    location: "Main Clinic, Floor 2, Room 210",
    experience: "11 years experience",
    availableDays: ["Mon", "Wed", "Thu", "Fri", "Sat"],
    timing: "09:00 AM – 05:00 PM",
    availableSlots: ["09:30 AM", "11:00 AM", "02:00 PM", "04:15 PM"],
    status: "available",
    avatarInitials: "MC",
  },
  {
    id: "doc-3",
    name: "Dr. Sarah Al-Mansoor, MD",
    specialty: "Endocrinology & Metabolic Care",
    department: "Specialty Outpatient Wing",
    location: "Pavilion B, Room 114",
    experience: "9 years experience",
    availableDays: ["Tue", "Wed", "Thu"],
    timing: "10:00 AM – 04:00 PM",
    availableSlots: ["10:30 AM", "01:30 PM", "03:00 PM"],
    status: "in_consultation",
    avatarInitials: "SA",
  },
  {
    id: "doc-4",
    name: "Dr. Robert Sterling, MD",
    specialty: "Pulmonology & Respiratory Care",
    department: "Chest & Lung Institute",
    location: "Building C, Suite 405",
    experience: "18 years experience",
    availableDays: ["Mon", "Tue", "Wed", "Fri"],
    timing: "08:00 AM – 02:00 PM",
    availableSlots: ["08:30 AM", "10:00 AM", "11:30 AM", "01:00 PM"],
    status: "available",
    avatarInitials: "RS",
  },
  {
    id: "doc-5",
    name: "Dr. Aisha Patel, MD",
    specialty: "Neurology & Stroke Follow-up",
    department: "Neuroscience Center",
    location: "West Wing, Suite 108",
    experience: "12 years experience",
    availableDays: ["Wed", "Thu", "Fri"],
    timing: "09:30 AM – 04:30 PM",
    availableSlots: ["10:00 AM", "02:30 PM", "03:45 PM"],
    status: "available",
    avatarInitials: "AP",
  },
  {
    id: "doc-6",
    name: "Dr. David Kim, MD",
    specialty: "Orthopedic Surgery & Rehabilitation",
    department: "Musculoskeletal Institute",
    location: "Pavilion A, Suite 120",
    experience: "16 years experience",
    availableDays: ["Mon", "Wed", "Fri"],
    timing: "08:00 AM – 03:00 PM",
    availableSlots: ["08:45 AM", "11:15 AM", "01:45 PM"],
    status: "off_duty",
    avatarInitials: "DK",
  },
];

export async function getHospitalDoctors(): Promise<Doctor[]> {
  try {
    const supabase = await createClient();
    if (!supabase) return HOSPITAL_DOCTORS;

    const { data, error } = await supabase
      .from("hospital_doctors")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return HOSPITAL_DOCTORS;
    }

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      department: d.department,
      location: d.location,
      experience: d.experience,
      availableDays: d.available_days || [],
      timing: d.timing,
      availableSlots: d.available_slots || [],
      status: d.status,
      avatarInitials: d.avatar_initials || d.name.slice(0, 2),
    }));
  } catch {
    return HOSPITAL_DOCTORS;
  }
}
