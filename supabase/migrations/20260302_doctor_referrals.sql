-- Create referrals table
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  from_doctor_id uuid references public.profiles(id) on delete cascade not null,
  to_doctor_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  notes text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'completed')),
  created_at timestamptz default now()
);

-- RLS for referrals
alter table public.referrals enable row level security;

-- Policy: Doctors can see referrals they sent
create policy "Doctors can view referrals they sent"
  on public.referrals for select
  using (auth.uid() = from_doctor_id);

-- Policy: Doctors can see referrals sent to them
create policy "Doctors can view referrals sent to them"
  on public.referrals for select
  using (auth.uid() = to_doctor_id);

-- Policy: Patients can see who they were referred to
create policy "Patients can view their own referrals"
  on public.referrals for select
  using (auth.uid() = patient_id);

-- Granting temporary access: 
-- When a referral is created, the 'to_doctor' should gain access to the patient's records.
-- We can handle this via a trigger that automatically creates a 'medical_consent' entry.

create or replace function public.handle_referral_consent()
returns trigger as $$
begin
  insert into public.medical_consents (patient_id, doctor_id, status)
  values (new.patient_id, new.to_doctor_id, 'active')
  on conflict (patient_id, doctor_id) do update
  set status = 'active';
  return new;
end;
$$ language plpgsql;

create trigger on_referral_created
  after insert on public.referrals
  for each row execute procedure public.handle_referral_consent();
