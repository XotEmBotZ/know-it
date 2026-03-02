-- Updated Function for GLOBAL cross-patient semantic search with nested history
create or replace function match_global_clinical_cases (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  search_type text
)
returns table (
  case_id uuid,
  symptoms text,
  solutions text,
  suggested_tests text[],
  similarity float,
  occurrence_date timestamptz,
  related_tests jsonb -- Anonymized test results for this case
)
language plpgsql
security definer
as $$
begin
  return query
  with matches as (
    select 
      mr.id as matched_mr_id,
      mr.patient_id as matched_patient_id,
      mr.symptoms,
      mr.solutions,
      mr.suggested_tests,
      mr.date as occurrence_date,
      case 
        when search_type = 'symptoms' then 1 - (mr.symptoms_embedding <=> query_embedding)
        else 1 - (mr.solutions_embedding <=> query_embedding)
      end as sim
    from public.medical_records mr
    where (
      case 
        when search_type = 'symptoms' then 1 - (mr.symptoms_embedding <=> query_embedding)
        else 1 - (mr.solutions_embedding <=> query_embedding)
      end
    ) > match_threshold
    order by sim desc
    limit match_count
  )
  select 
    m.matched_mr_id as case_id,
    m.symptoms,
    m.solutions,
    m.suggested_tests,
    m.sim::float as similarity,
    m.occurrence_date,
    (
      select jsonb_agg(jsonb_build_object('test_name', tr.test_name, 'results', tr.results, 'date', tr.date))
      from public.test_results tr
      where tr.patient_id = m.matched_patient_id
      and (tr.date <= m.occurrence_date + interval '30 days' and tr.date >= m.occurrence_date - interval '30 days')
    ) as related_tests
  from matches m;
end;
$$;
