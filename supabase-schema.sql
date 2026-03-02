-- Supabase Schema Export
-- Project: know-it
-- Date: 2026-03-02

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_referral_consent()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.medical_consents (patient_id, doctor_id, status)
  values (new.patient_id, new.to_doctor_id, 'active')
  on conflict (patient_id, doctor_id) do update
  set status = 'active';
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_next_queue_number(p_doctor_id uuid, p_date date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  next_val integer;
begin
  select coalesce(max(queue_number), 0) + 1
  into next_val
  from public.appointment_queue
  where doctor_id = p_doctor_id and appointment_date = p_date;
  return next_val;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_medical_records_fts_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.fts_tokens := setweight(to_tsvector('english', coalesce(new.symptoms, '')), 'A') || 
                    setweight(to_tsvector('english', coalesce(new.solutions, '')), 'B');
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_test_results_fts_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.fts_tokens := setweight(to_tsvector('english', coalesce(new.test_name, '')), 'A') || 
                    setweight(to_tsvector('english', coalesce(new.results, '')), 'B');
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.tr_test_results_fts_fn()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.fts_tokens := to_tsvector('english', COALESCE(NEW.test_name, '') || ' ' || COALESCE(NEW.results, ''));
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_medical_record_indices(p_id uuid, p_symptoms_embedding vector, p_solutions_embedding vector)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update public.medical_records
  set 
    symptoms_embedding = p_symptoms_embedding,
    solutions_embedding = p_solutions_embedding,
    fts_tokens = setweight(to_tsvector('english', coalesce(symptoms, '')), 'A') || 
                 setweight(to_tsvector('english', coalesce(solutions, '')), 'B')
  where id = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_test_result_indices(p_id uuid, p_embedding vector)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update public.test_results
  set 
    embedding = p_embedding,
    fts_tokens = setweight(to_tsvector('english', coalesce(test_name, '')), 'A') || 
                 setweight(to_tsvector('english', coalesce(results, '')), 'B')
  where id = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.match_patient_knowledge(query_embedding vector, match_threshold double precision, match_count integer, p_patient_id uuid)
 RETURNS TABLE(id uuid, content text, source_type text, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  (
    select mr.id, 'Symptom: ' || coalesce(mr.symptoms, '') as content,
      'medical_record', 1 - (mr.symptoms_embedding <=> query_embedding)
    from public.medical_records mr where mr.patient_id = p_patient_id
    union all
    select dv.id, dv.extracted_text, 'document', 1 - (dv.embedding <=>
      query_embedding)
    from public.document_vault dv where dv.patient_id = p_patient_id
  )
  order by similarity desc
  limit match_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.match_patient_knowledge_hybrid(p_patient_id uuid, query_text text, query_embedding vector, match_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, content text, source_type text, rank_score double precision)
 LANGUAGE plpgsql
AS $function$
begin
  return query
  with vector_matches as (
    select 
      mr.id, 
      'Symptom: ' || coalesce(mr.symptoms, '') || ' | Solution: ' || coalesce(mr.solutions, '') as content,
      'medical_record' as source_type,
      1 - (mr.symptoms_embedding <=> query_embedding) as similarity,
      row_number() over (order by mr.symptoms_embedding <=> query_embedding) as rank
    from public.medical_records mr
    where mr.patient_id = p_patient_id
    and mr.symptoms_embedding is not null
    
    union all
    
    select 
      mr.id, 
      'Symptom: ' || coalesce(mr.symptoms, '') || ' | Solution: ' || coalesce(mr.solutions, '') as content,
      'medical_record' as source_type,
      1 - (mr.solutions_embedding <=> query_embedding) as similarity,
      row_number() over (order by mr.solutions_embedding <=> query_embedding) as rank
    from public.medical_records mr
    where mr.patient_id = p_patient_id
    and mr.solutions_embedding is not null

    union all

    select 
      tr.id,
      'Test: ' || tr.test_name || ' | Results: ' || coalesce(tr.results, '') as content,
      'test_result' as source_type,
      1 - (tr.embedding <=> query_embedding) as similarity,
      row_number() over (order by tr.embedding <=> query_embedding) as rank
    from public.test_results tr
    where tr.patient_id = p_patient_id
    and tr.embedding is not null
  ),
  fts_matches as (
    select 
      mr.id,
      'Symptom: ' || coalesce(mr.symptoms, '') || ' | Solution: ' || coalesce(mr.solutions, '') as content,
      'medical_record' as source_type,
      ts_rank_cd(mr.fts_tokens, plainto_tsquery('english', query_text)) as rank_score,
      row_number() over (order by ts_rank_cd(mr.fts_tokens, plainto_tsquery('english', query_text)) desc) as rank
    from public.medical_records mr
    where mr.patient_id = p_patient_id
    and mr.fts_tokens @@ plainto_tsquery('english', query_text)

    union all

    select 
      tr.id,
      'Test: ' || tr.test_name || ' | Results: ' || coalesce(tr.results, '') as content,
      'test_result' as source_type,
      ts_rank_cd(tr.fts_tokens, plainto_tsquery('english', query_text)) as rank_score,
      row_number() over (order by ts_rank_cd(tr.fts_tokens, plainto_tsquery('english', query_text)) desc) as rank
    from public.test_results tr
    where tr.patient_id = p_patient_id
    and tr.fts_tokens @@ plainto_tsquery('english', query_text)
  )
  select 
    coalesce(v.id, f.id) as id,
    coalesce(v.content, f.content) as content,
    coalesce(v.source_type, f.source_type) as source_type,
    (
      coalesce(1.0 / (v.rank + 60), 0.0) + 
      coalesce(1.0 / (f.rank + 60), 0.0)
    )::float as rank_score
  from vector_matches v
  full outer join fts_matches f on v.id = f.id
  order by rank_score desc
  limit match_count;
end;
$function$;

-- TABLES

CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    role text CHECK (role = ANY (ARRAY['patient'::text, 'doctor'::text])),
    full_name text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.medical_records (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES public.profiles(id),
    doctor_id uuid REFERENCES public.profiles(id),
    date date DEFAULT CURRENT_DATE,
    symptoms text,
    solutions text,
    suggested_tests text[],
    created_at timestamp with time zone DEFAULT now(),
    fts_tokens tsvector,
    symptoms_embedding vector(1536),
    solutions_embedding vector(1536)
);

CREATE TABLE public.test_results (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES public.profiles(id),
    test_name text NOT NULL,
    date date DEFAULT CURRENT_DATE,
    results text,
    created_at timestamp with time zone DEFAULT now(),
    fts_tokens tsvector,
    embedding vector(1536)
);

CREATE TABLE public.medical_consents (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES public.profiles(id),
    doctor_id uuid REFERENCES public.profiles(id),
    status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'revoked'::text])),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (patient_id, doctor_id)
);

CREATE TABLE public.referrals (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES public.profiles(id),
    from_doctor_id uuid REFERENCES public.profiles(id),
    to_doctor_id uuid REFERENCES public.profiles(id),
    reason text NOT NULL,
    notes text,
    status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'completed'::text])),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.appointment_queue (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid REFERENCES public.profiles(id),
    patient_id uuid REFERENCES public.profiles(id),
    appointment_date date,
    queue_number integer,
    status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'skipped'::text])),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (doctor_id, patient_id, appointment_date)
);

-- INDEXES
CREATE INDEX idx_medical_records_fts ON public.medical_records USING gin (fts_tokens);
CREATE INDEX idx_medical_records_symptoms_embedding ON public.medical_records USING hnsw (symptoms_embedding vector_cosine_ops);
CREATE INDEX idx_medical_records_solutions_embedding ON public.medical_records USING hnsw (solutions_embedding vector_cosine_ops);
CREATE INDEX idx_test_results_fts ON public.test_results USING gin (fts_tokens);
CREATE INDEX idx_test_results_embedding ON public.test_results USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_appointment_queue_lookup ON public.appointment_queue USING btree (doctor_id, appointment_date, queue_number);

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.medical_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can delete their own pending or revoked requests." ON public.medical_consents FOR DELETE TO authenticated USING ((auth.uid() = doctor_id) AND (status = ANY (ARRAY['pending'::text, 'revoked'::text])));
CREATE POLICY "Doctors can request consent." ON public.medical_consents FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update their own requests." ON public.medical_consents FOR UPDATE WITH CHECK ((auth.uid() = doctor_id) AND (status = 'pending'::text));
CREATE POLICY "Patients can manage consents." ON public.medical_consents FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Users can see their own consents." ON public.medical_consents FOR SELECT USING ((auth.uid() = patient_id) OR (auth.uid() = doctor_id));

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can insert medical records for their patients" ON public.medical_records FOR INSERT TO authenticated WITH CHECK ((auth.uid() = doctor_id) AND (EXISTS (SELECT 1 FROM medical_consents WHERE ((medical_consents.doctor_id = auth.uid()) AND (medical_consents.patient_id = medical_records.patient_id) AND (medical_consents.status = 'active'::text)))));
CREATE POLICY "Doctors can view medical records for their patients" ON public.medical_records FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM medical_consents WHERE ((medical_consents.doctor_id = auth.uid()) AND (medical_consents.patient_id = medical_records.patient_id) AND (medical_consents.status = 'active'::text))));
CREATE POLICY "Patients can see their own records." ON public.medical_records FOR SELECT USING (auth.uid() = patient_id);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can insert test results for their patients" ON public.test_results FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM medical_consents WHERE ((medical_consents.doctor_id = auth.uid()) AND (medical_consents.patient_id = test_results.patient_id) AND (medical_consents.status = 'active'::text))));
CREATE POLICY "Doctors can view test results for their patients" ON public.test_results FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM medical_consents WHERE ((medical_consents.doctor_id = auth.uid()) AND (medical_consents.patient_id = test_results.patient_id) AND (medical_consents.status = 'active'::text))));
CREATE POLICY "Patients can insert their own test results." ON public.test_results FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can see their own test results." ON public.test_results FOR SELECT USING (auth.uid() = patient_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can create referrals." ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_doctor_id);
CREATE POLICY "Doctors can see referrals where they are the recipient." ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = to_doctor_id);
CREATE POLICY "Doctors can see referrals where they are the sender." ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = from_doctor_id);
CREATE POLICY "Doctors can update referrals where they are the recipient." ON public.referrals FOR UPDATE TO authenticated USING (auth.uid() = to_doctor_id) WITH CHECK (auth.uid() = to_doctor_id);
CREATE POLICY "Patients can see referrals made for them." ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = patient_id);

ALTER TABLE public.appointment_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can manage their queue" ON public.appointment_queue FOR ALL USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can view their own queues" ON public.appointment_queue FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Patients can book appointments" ON public.appointment_queue FOR INSERT WITH CHECK ((auth.uid() = patient_id) AND (appointment_date > CURRENT_DATE));
CREATE POLICY "Patients can view their own appointments" ON public.appointment_queue FOR SELECT USING (auth.uid() = patient_id);

-- TRIGGERS
CREATE TRIGGER on_referral_created AFTER INSERT ON public.referrals FOR EACH ROW EXECUTE FUNCTION handle_referral_consent();
CREATE TRIGGER tr_medical_records_fts BEFORE INSERT OR UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION fn_medical_records_fts_update();
CREATE TRIGGER tr_test_results_fts BEFORE INSERT OR UPDATE ON public.test_results FOR EACH ROW EXECUTE FUNCTION tr_test_results_fts_fn();
