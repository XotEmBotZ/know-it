-- Migration: Research Papers and Document Vault
-- Description: Adds tables for research papers and patient document storage with vector search.

-- 1. Document Vault for Patient Uploads (already used in some RPCs but table might be missing)
CREATE TABLE IF NOT EXISTS public.document_vault (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    extracted_text text,
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding vector(1536),
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Research Papers Table
CREATE TABLE IF NOT EXISTS public.research_papers (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    authors text,
    journal text,
    publication_date date,
    abstract text,
    full_text text,
    extracted_problems text, -- AI-identified problems/challenges in the paper
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding vector(1536), -- Embedding of the abstract/summary
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_document_vault_patient_id ON public.document_vault(patient_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_embedding ON public.document_vault USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_research_papers_embedding ON public.research_papers USING hnsw (embedding vector_cosine_ops);

-- 4. RLS Policies
ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can manage their own documents" ON public.document_vault FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can see documents for their patients" ON public.document_vault FOR SELECT USING (EXISTS (SELECT 1 FROM medical_consents WHERE medical_consents.doctor_id = auth.uid() AND medical_consents.patient_id = document_vault.patient_id AND medical_consents.status = 'active'));

ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Research papers are viewable by everyone" ON public.research_papers FOR SELECT USING (true);
-- Only authenticated admins (not defined in role yet, so using authenticated for now) can insert/update
CREATE POLICY "Authenticated users can insert research papers" ON public.research_papers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Updated Match Function to include Research Papers
CREATE OR REPLACE FUNCTION public.match_clinical_knowledge(
    query_embedding vector, 
    match_threshold double precision, 
    match_count integer, 
    p_patient_id uuid DEFAULT NULL,
    include_research boolean DEFAULT true
)
 RETURNS TABLE(id uuid, content text, source_type text, similarity double precision, metadata jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  (
    -- Patient Records
    select mr.id, 'Symptom: ' || coalesce(mr.symptoms, '') || ' | Solution: ' || coalesce(mr.solutions, '') as content,
      'medical_record', 1 - (mr.symptoms_embedding <=> query_embedding), '{}'::jsonb
    from public.medical_records mr where mr.patient_id = p_patient_id and mr.symptoms_embedding is not null
    
    union all
    
    -- Patient Documents
    select dv.id, dv.extracted_text, 'document', 1 - (dv.embedding <=> query_embedding), dv.metadata
    from public.document_vault dv where dv.patient_id = p_patient_id and dv.embedding is not null
    
    union all
    
    -- Research Papers
    select rp.id, 'Paper: ' || rp.title || ' | Abstract: ' || coalesce(rp.abstract, '') as content,
      'research_paper', 1 - (rp.embedding <=> query_embedding), rp.metadata
    from public.research_papers rp where include_research = true and rp.embedding is not null
  )
  order by similarity desc
  limit match_count;
end;
$function$;
