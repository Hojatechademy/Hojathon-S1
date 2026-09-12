create extension if not exists "pgcrypto";

create type public.follow_up_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
create type public.appointment_status as enum ('scheduled', 'missed', 'rescheduled', 'completed', 'cancelled');
create type public.reminder_status as enum ('pending', 'sent', 'dismissed');

create table public.patient_profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.follow_up_tasks (id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade, title text not null check (char_length(title) between 1 and 160), description text, due_at timestamptz, status public.follow_up_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.appointments (id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade, title text not null, starts_at timestamptz not null, location text, status public.appointment_status not null default 'scheduled', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.reminders (id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade, task_id uuid references public.follow_up_tasks(id) on delete cascade, remind_at timestamptz not null, status public.reminder_status not null default 'pending', created_at timestamptz not null default now());

create index follow_up_tasks_patient_status_idx on public.follow_up_tasks(patient_id, status);
create index appointments_patient_start_idx on public.appointments(patient_id, starts_at);
create index reminders_patient_status_idx on public.reminders(patient_id, status);

alter table public.patient_profiles enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.appointments enable row level security;
alter table public.reminders enable row level security;
create policy "patients manage own profile" on public.patient_profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "patients manage own tasks" on public.follow_up_tasks for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);
create policy "patients manage own appointments" on public.appointments for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);
create policy "patients manage own reminders" on public.reminders for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);
