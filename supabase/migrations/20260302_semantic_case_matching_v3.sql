-- Ultimate Function for Global Anonymized Clinical Pattern Discovery
create or replace function match_global_clinical_cases (
  query_embedding vector(1536),
  query_text text,
  match_threshold float,
  match_count int,
  search_type text
)
returns table (
  case_id uuid,
  matched_symptoms text,
  matched_solutions text,
  matched_suggested_tests text[],
  similarity float,
  occurrence_date timestamptz,
  related_tests jsonb,
  patient_clinical_history jsonb -- Nested anonymized history of other visits
)
language plpgsql
security definer -- Critical: Bypasses RAG to allow global research matching
as $$
begin
  return query
  with matched_records as (
    select 
      mr.id as matched_mr_id,
      mr.patient_id as matched_patient_id,
      mr.symptoms,
      mr.solutions,
      mr.suggested_tests,
      mr.date as occurrence_date,
      (
        case 
          when search_type = 'symptoms' then 
            coalesce(1 - (mr.symptoms_embedding <=> query_embedding), 0) + 
            (case when mr.symptoms ilike '%' || query_text || '%' then 0.8 else 0 end)
          else 
            coalesce(1 - (mr.solutions_embedding <=> query_embedding), 0) + 
            (case when mr.solutions ilike '%' || query_text || '%' then 0.8 else 0 end)
        end
      ) as total_score
    from public.medical_records mr
    where 
      (
        case 
          when search_type = 'symptoms' then 
            (1 - (mr.symptoms_embedding <=> query_embedding) > match_threshold) OR (mr.symptoms ilike '%' || query_text || '%')
          else 
            (1 - (mr.solutions_embedding <=> query_embedding) > match_threshold) OR (mr.solutions ilike '%' || query_text || '%')
        end
      )
    order by total_score desc
    limit match_count
  )
  select 
    m.matched_mr_id as case_id,
    m.symptoms as matched_symptoms,
    m.solutions as matched_solutions,
    m.suggested_tests as matched_suggested_tests,
    m.total_score::float as similarity,
    m.occurrence_date,
    -- Aggregate ALL test results for this patient (Anonymized)
    (
      select jsonb_agg(jsonb_build_object('test_name', tr.test_name, 'results', tr.results, 'date', tr.date))
      from public.test_results tr
      where tr.patient_id = m.matched_patient_id
    ) as related_tests,
    -- Aggregate OTHER medical records for this patient (Anonymized History)
    (
      select jsonb_agg(jsonb_build_object('symptoms', h.symptoms, 'solutions', h.solutions, 'date', h.date))
      from public.medical_records h
      where h.patient_id = m.matched_patient_id
      and h.id != m.matched_mr_id -- Don't include the current matched record again
    ) as patient_clinical_history
  from matched_records m;
end;
$$;
