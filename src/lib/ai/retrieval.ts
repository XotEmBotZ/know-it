import { createClient } from '@/utils/supabase/server';
import { generateEmbedding } from './google';
import { TaskType } from '@google/generative-ai';

export async function retrievePatientContext(patientId: string, query: string) {
  const supabase = await createClient();
  
  try {
    const queryEmbedding = await generateEmbedding(query, TaskType.RETRIEVAL_QUERY);

    const { data: matches, error } = await supabase.rpc('match_patient_knowledge_hybrid', {
      p_patient_id: patientId,
      query_text: query,
      query_embedding: queryEmbedding,
      match_count: 7
    });

    if (error) {
      console.error('Error retrieving patient context:', error);
      return '';
    }

    if (!matches || matches.length === 0) {
      return 'No relevant medical history found for this query.';
    }

    const context = matches
      .map((m: any) => `[Source: ${m.source_type}] ${m.content}`)
      .join('\n\n');

    return context;
  } catch (error) {
    console.error('Retrieval failed:', error);
    return '';
  }
}
