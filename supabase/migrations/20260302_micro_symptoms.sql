-- Create micro_symptoms table for granular symptom tracking
create table if not exists public.micro_symptoms (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  medical_record_id uuid references public.medical_records(id) on delete cascade,
  symptom_type text not null,
  temporal_marker text,
  severity integer check (severity >= 1 and severity <= 10),
  duration text,
  occurrence_date timestamptz default now(),
  created_at timestamptz default now()
);

-- RLS for micro_symptoms
alter table public.micro_symptoms enable row level security;

-- Policy: Patients can view their own micro-symptoms
create policy "Patients can view their own micro-symptoms"
  on public.micro_symptoms for select
  using (auth.uid() = patient_id);

-- Policy: Doctors can view micro-symptoms with consent
create policy "Doctors can view micro-symptoms with consent"
  on public.micro_symptoms for select
  using (
    exists (
      select 1 from public.medical_consents
      where medical_consents.patient_id = micro_symptoms.patient_id
      and medical_consents.doctor_id = auth.uid()
      and medical_consents.status = 'active'
    )
  );

-- Policy: Doctors can insert micro-symptoms for patients they have consent for
create policy "Doctors can insert micro-symptoms with consent"
  on public.micro_symptoms for insert
  with check (
    exists (
      select 1 from public.medical_consents
      where medical_consents.patient_id = micro_symptoms.patient_id
      and medical_consents.doctor_id = auth.uid()
      and medical_consents.status = 'active'
    )
  );

-- Index for temporal analysis
create index if not exists idx_micro_symptoms_patient_date on public.micro_symptoms(patient_id, occurrence_date);
