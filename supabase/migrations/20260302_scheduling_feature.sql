-- Table for managing daily appointment queues
create table if not exists public.appointment_queue (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.profiles(id) on delete cascade not null,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  appointment_date date not null,
  queue_number integer not null,
  status text default 'pending' check (status in ('pending', 'skipped')),
  created_at timestamptz default now(),
  
  -- A patient can only have one active appointment per doctor per day
  unique(doctor_id, patient_id, appointment_date)
);

-- Index for faster lookups of current queue
create index if not exists idx_appointment_queue_lookup on public.appointment_queue(doctor_id, appointment_date, queue_number);

-- RLS Policies
alter table public.appointment_queue enable row level security;

-- Patients can view their own appointments
create policy "Patients can view their own appointments"
  on public.appointment_queue for select
  using (auth.uid() = patient_id);

-- Doctors can view their own queues
create policy "Doctors can view their own queues"
  on public.appointment_queue for select
  using (auth.uid() = doctor_id);

-- Patients can insert appointments (booking)
-- Includes the "1 day prior" lock: appointment_date must be strictly > current_date
create policy "Patients can book appointments"
  on public.appointment_queue for insert
  with check (
    auth.uid() = patient_id 
    and appointment_date > current_date
  );

-- Doctors can update status (skip) or delete (done) appointments
create policy "Doctors can manage their queue"
  on public.appointment_queue for all
  using (auth.uid() = doctor_id);

-- Function to handle auto-incrementing queue_number per doctor/date safely
create or replace function public.get_next_queue_number(p_doctor_id uuid, p_date date)
returns integer
language plpgsql
security definer
as $$
declare
  next_val integer;
begin
  select coalesce(max(queue_number), 0) + 1
  into next_val
  from public.appointment_queue
  where doctor_id = p_doctor_id and appointment_date = p_date;
  return next_val;
end;
$$;
