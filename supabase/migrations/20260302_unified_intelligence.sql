-- Enable pgvector
create extension if not exists vector;

-- Create document_vault for fragmented data
create table if not exists public.document_vault (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  storage_url text not null,
  extracted_text text,
  embedding vector(1536), -- Assuming 1536 for OpenAI-compatible embeddings
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Add embedding to medical_records for semantic search
alter table public.medical_records add column if not exists embedding vector(1536);

-- Add embedding to test_results
alter table public.test_results add column if not exists embedding vector(1536);

-- RLS for document_vault
alter table public.document_vault enable row level security;

-- Policy: Patients can view their own documents
create policy "Patients can view their own documents"
  on public.document_vault for select
  using (auth.uid() = patient_id);

-- Policy: Doctors can view documents with consent
create policy "Doctors can view documents with consent"
  on public.document_vault for select
  using (
    exists (
      select 1 from public.medical_consents
      where medical_consents.patient_id = document_vault.patient_id
      and medical_consents.doctor_id = auth.uid()
      and medical_consents.status = 'active'
    )
  );

-- Function for similarity search (Hybrid: Records + Documents)
create or replace function match_patient_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_patient_id uuid
)
returns table (
  id uuid,
  content text,
  source_type text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  (
    -- Search in medical_records
    select 
      mr.id,
      'Symptom: ' || coalesce(mr.symptoms, '') || ' | Solution: ' || coalesce(mr.solutions, '') as content,
      'medical_record' as source_type,
      1 - (mr.embedding <=> query_embedding) as similarity
    from public.medical_records mr
    where mr.patient_id = p_patient_id
    and 1 - (mr.embedding <=> query_embedding) > match_threshold

    union all

    -- Search in document_vault (Fragmented data)
    select 
      dv.id,
      dv.extracted_text as content,
      'document' as source_type,
      1 - (dv.embedding <=> query_embedding) as similarity
    from public.document_vault dv
    where dv.patient_id = p_patient_id
    and 1 - (dv.embedding <=> query_embedding) > match_threshold
  )
  order by similarity desc
  limit match_count;
end;
$$;
