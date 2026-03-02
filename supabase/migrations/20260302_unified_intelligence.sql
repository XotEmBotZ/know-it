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
alter table public.medical_records add column if not exists symptoms_embedding vector(1536);
alter table public.medical_records add column if not exists solutions_embedding vector(1536);
alter table public.medical_records add column if not exists fts_tokens tsvector;

-- Add embedding to test_results
alter table public.test_results add column if not exists embedding vector(1536);
alter table public.test_results add column if not exists fts_tokens tsvector;

-- Create triggers for full-text search
create or replace function public.medical_records_fts_trigger() returns trigger as $$
begin
  new.fts_tokens := to_tsvector('english', coalesce(new.symptoms, '') || ' ' || coalesce(new.solutions, ''));
  return new;
end;
$$ language plpgsql;

create trigger tr_medical_records_fts
  before insert or update on public.medical_records
  for each row execute procedure public.medical_records_fts_trigger();

create or replace function public.test_results_fts_trigger() returns trigger as $$
begin
  new.fts_tokens := to_tsvector('english', coalesce(new.test_name, '') || ' ' || coalesce(new.results, ''));
  return new;
end;
$$ language plpgsql;

create trigger tr_test_results_fts
  before insert or update on public.test_results
  for each row execute procedure public.test_results_fts_trigger();

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

-- Function for HYBRID search (Similarity + Keyword)
create or replace function match_patient_knowledge_hybrid (
  p_patient_id uuid,
  query_text text,
  query_embedding vector(1536),
  match_count int default 7
)
returns table (
  id uuid,
  content text,
  source_type text,
  rank_score float
)
language plpgsql
as $$
begin
  return query
  with vector_matches as (
    -- Vector similarity from medical_records (symptoms)
    select 
      mr.id,
      'Symptom: ' || coalesce(mr.symptoms, '') || ' | Solution: ' || coalesce(mr.solutions, '') as content,
      'medical_record' as source_type,
      (1 - (mr.symptoms_embedding <=> query_embedding))::float as similarity
    from public.medical_records mr
    where mr.patient_id = p_patient_id
    
    union all

    -- Vector similarity from test_results
    select 
      tr.id,
      'Test: ' || tr.test_name || ' | Results: ' || coalesce(tr.results, '') as content,
      'test_result' as source_type,
      (1 - (tr.embedding <=> query_embedding))::float as similarity
    from public.test_results tr
    where tr.patient_id = p_patient_id

    union all

    -- Vector similarity from document_vault
    select 
      dv.id,
      dv.extracted_text as content,
      'document' as source_type,
      (1 - (dv.embedding <=> query_embedding))::float as similarity
    from public.document_vault dv
    where dv.patient_id = p_patient_id
  ),
  fts_matches as (
    -- Full-text search from medical_records
    select 
      mr.id,
      ts_rank_cd(mr.fts_tokens, plainto_tsquery('english', query_text)) as rank
    from public.medical_records mr
    where mr.patient_id = p_patient_id
    and mr.fts_tokens @@ plainto_tsquery('english', query_text)

    union all

    -- Full-text search from test_results
    select 
      tr.id,
      ts_rank_cd(tr.fts_tokens, plainto_tsquery('english', query_text)) as rank
    from public.test_results tr
    where tr.patient_id = p_patient_id
    and tr.fts_tokens @@ plainto_tsquery('english', query_text)
  )
  select 
    vm.id,
    vm.content,
    vm.source_type,
    (coalesce(vm.similarity, 0) + coalesce(fm.rank, 0))::float as rank_score
  from vector_matches vm
  left join fts_matches fm on vm.id = fm.id
  order by rank_score desc
  limit match_count;
end;
$$;
