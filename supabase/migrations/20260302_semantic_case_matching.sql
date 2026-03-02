-- Function for GLOBAL cross-patient semantic search (Anonymized)
create or replace function match_global_clinical_cases (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  search_type text -- 'symptoms' or 'diagnosis'
)
returns table (
  case_id uuid,
  content text,
  similarity float,
  occurrence_date timestamptz
)
language plpgsql
security definer -- Bypass RAG restrictions for global pattern matching
as $$
begin
  if search_type = 'symptoms' then
    return query
    select 
      mr.id as case_id,
      mr.symptoms as content,
      1 - (mr.symptoms_embedding <=> query_embedding) as similarity,
      mr.date as occurrence_date
    from public.medical_records mr
    where 1 - (mr.symptoms_embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count;
  else
    return query
    select 
      mr.id as case_id,
      mr.solutions as content, -- Using solutions as 'diagnosis/treatment' proxy
      1 - (mr.solutions_embedding <=> query_embedding) as similarity,
      mr.date as occurrence_date
    from public.medical_records mr
    where 1 - (mr.solutions_embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count;
  end if;
end;
$$;
