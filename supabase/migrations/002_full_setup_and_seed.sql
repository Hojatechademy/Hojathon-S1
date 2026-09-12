-- ==============================================================================
-- CARE FOLLOW-UP AGENT: FULL DATABASE MIGRATION & SEED SCRIPT
-- Copy and run this script in your Supabase Project's SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. Enable Extensions
create extension if not exists "pgcrypto";

-- 2. Create Enums (Idempotent)
do $$ begin
    create type public.follow_up_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type public.appointment_status as enum ('scheduled', 'missed', 'rescheduled', 'completed', 'cancelled');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type public.reminder_status as enum ('pending', 'sent', 'dismissed');
exception
    when duplicate_object then null;
end $$;

-- 3. Patient Profiles Table
create table if not exists public.patient_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Follow-up Tasks (Follow-up Actions)
create table if not exists public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  due_at timestamptz,
  status public.follow_up_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Appointments & Visits
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  location text,
  status public.appointment_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. In-App Reminders
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  task_id uuid references public.follow_up_tasks(id) on delete cascade,
  remind_at timestamptz not null,
  status public.reminder_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- 7. Available Hospital Doctors & Timings
create table if not exists public.hospital_doctors (
  id text primary key,
  name text not null,
  specialty text not null,
  department text not null,
  location text not null,
  experience text not null,
  available_days text[] not null,
  timing text not null,
  available_slots text[] not null,
  status text not null default 'available',
  avatar_initials text not null,
  created_at timestamptz not null default now()
);

-- 8. Indexes for Fast Reads
create index if not exists follow_up_tasks_patient_status_idx on public.follow_up_tasks(patient_id, status);
create index if not exists appointments_patient_start_idx on public.appointments(patient_id, starts_at);
create index if not exists reminders_patient_status_idx on public.reminders(patient_id, status);

-- 9. Row Level Security (RLS)
alter table public.patient_profiles enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.appointments enable row level security;
alter table public.reminders enable row level security;
alter table public.hospital_doctors enable row level security;

-- 10. RLS Policies
drop policy if exists "patients manage own profile" on public.patient_profiles;
create policy "patients manage own profile" on public.patient_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "patients manage own tasks" on public.follow_up_tasks;
create policy "patients manage own tasks" on public.follow_up_tasks
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

drop policy if exists "patients manage own appointments" on public.appointments;
create policy "patients manage own appointments" on public.appointments
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

drop policy if exists "patients manage own reminders" on public.reminders;
create policy "patients manage own reminders" on public.reminders
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

drop policy if exists "anyone can view doctors" on public.hospital_doctors;
create policy "anyone can view doctors" on public.hospital_doctors
  for select using (true);

-- 11. Seed Hospital Doctors & Timings
insert into public.hospital_doctors (id, name, specialty, department, location, experience, available_days, timing, available_slots, status, avatar_initials)
values
  ('doc-1', 'Dr. Elena Vance, MD', 'Interventional Cardiology', 'Heart & Vascular Pavilion', 'Pavilion A, Suite 302', '14 years experience', ARRAY['Mon', 'Tue', 'Thu', 'Fri'], '08:30 AM – 03:30 PM', ARRAY['09:00 AM', '10:30 AM', '01:15 PM', '02:45 PM'], 'available', 'EV'),
  ('doc-2', 'Dr. Marcus Chen, MD', 'Internal Medicine & Primary Care', 'Downtown Health Clinic', 'Main Clinic, Floor 2, Room 210', '11 years experience', ARRAY['Mon', 'Wed', 'Thu', 'Fri', 'Sat'], '09:00 AM – 05:00 PM', ARRAY['09:30 AM', '11:00 AM', '02:00 PM', '04:15 PM'], 'available', 'MC'),
  ('doc-3', 'Dr. Sarah Al-Mansoor, MD', 'Endocrinology & Metabolic Care', 'Specialty Outpatient Wing', 'Pavilion B, Room 114', '9 years experience', ARRAY['Tue', 'Wed', 'Thu'], '10:00 AM – 04:00 PM', ARRAY['10:30 AM', '01:30 PM', '03:00 PM'], 'in_consultation', 'SA'),
  ('doc-4', 'Dr. Robert Sterling, MD', 'Pulmonology & Respiratory Care', 'Chest & Lung Institute', 'Building C, Suite 405', '18 years experience', ARRAY['Mon', 'Tue', 'Wed', 'Fri'], '08:00 AM – 02:00 PM', ARRAY['08:30 AM', '10:00 AM', '11:30 AM', '01:00 PM'], 'available', 'RS'),
  ('doc-5', 'Dr. Aisha Patel, MD', 'Neurology & Stroke Follow-up', 'Neuroscience Center', 'West Wing, Suite 108', '12 years experience', ARRAY['Wed', 'Thu', 'Fri'], '09:30 AM – 04:30 PM', ARRAY['10:00 AM', '02:30 PM', '03:45 PM'], 'available', 'AP'),
  ('doc-6', 'Dr. David Kim, MD', 'Orthopedic Surgery & Rehabilitation', 'Musculoskeletal Institute', 'Pavilion A, Suite 120', '16 years experience', ARRAY['Mon', 'Wed', 'Fri'], '08:00 AM – 03:00 PM', ARRAY['08:45 AM', '11:15 AM', '01:45 PM'], 'off_duty', 'DK')
on conflict (id) do update set
  name = excluded.name,
  specialty = excluded.specialty,
  department = excluded.department,
  location = excluded.location,
  timing = excluded.timing,
  available_slots = excluded.available_slots,
  status = excluded.status;
