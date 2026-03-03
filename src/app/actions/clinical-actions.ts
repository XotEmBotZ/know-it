'use server'

import { createClient } from '@/utils/supabase/server'
import { DataAccessLayer } from '@/lib/dal'
import { generateEmbedding, chatModel } from '@/lib/ai/google'
import { formatSystemPrompt } from '@/lib/ai/prompts'
import { revalidatePath } from 'next/cache'

export async function createMedicalRecordAction(patientId: string, data: any) {
  try {
    // 1. Generate embeddings FIRST. If this fails, the catch block will handle it 
    // and NOTHING will be added to the DB.
    const [symptomsEmbedding, solutionsEmbedding] = await Promise.all([
      generateEmbedding(data.symptoms || ''),
      generateEmbedding(data.solutions || ''),
    ]);

    const supabase = await createClient()
    const dal = new DataAccessLayer(supabase)

    // 2. Insert record WITH embeddings.
    await dal.addMedicalRecord({
      patient_id: patientId,
      doctor_id: data.doctor_id,
      date: data.date,
      symptoms: data.symptoms,
      solutions: data.solutions,
      suggested_tests: data.suggested_tests,
      image_url: data.image_url,
      symptoms_embedding: symptomsEmbedding as any,
      solutions_embedding: solutionsEmbedding as any,
    })

    revalidatePath(`/dashboard/patient/${patientId}`)
    revalidatePath(`/dashboard`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to create and index medical record:', error)
    return { success: false, error: "Medical indexing failed. Record was not saved: " + message }
  }
}

export async function updateMedicalRecordAction(recordId: string, patientId: string, data: any) {
  try {
    const supabase = await createClient()
    const dal = new DataAccessLayer(supabase)

    // Generate new embeddings for updated text
    const [symptomsEmbedding, solutionsEmbedding] = await Promise.all([
      generateEmbedding(data.symptoms || ''),
      generateEmbedding(data.solutions || ''),
    ]);

    const { error } = await supabase
      .from('medical_records')
      .update({
        symptoms: data.symptoms,
        solutions: data.solutions,
        suggested_tests: data.suggested_tests,
        symptoms_embedding: symptomsEmbedding as any,
        solutions_embedding: solutionsEmbedding as any,
      })
      .eq('id', recordId)

    if (error) throw error

    revalidatePath(`/dashboard/patient/${patientId}`)
    revalidatePath(`/dashboard`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to update medical record:', error)
    return { success: false, error: message }
  }
}

export async function deleteMedicalRecordAction(recordId: string, patientId: string) {
  try {
    const supabase = await createClient()
    
    // Get record to check for image
    const { data: record } = await supabase
      .from('medical_records')
      .select('image_url')
      .eq('id', recordId)
      .single()

    if (record?.image_url) {
      await supabase.storage.from('prescriptions').remove([record.image_url])
    }

    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId)

    if (error) throw error

    revalidatePath(`/dashboard/patient/${patientId}`)
    revalidatePath(`/dashboard`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to delete medical record:', error)
    return { success: false, error: message }
  }
}

export async function removePrescriptionImageAction(recordId: string, patientId: string) {
  try {
    const supabase = await createClient()
    
    const { data: record, error: fetchError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', recordId)
      .single()

    if (fetchError || !record) throw new Error('Record not found')

    // 1. Delete from storage if exists
    if (record.image_url) {
      await supabase.storage
        .from('prescriptions')
        .remove([record.image_url])
    }

    // 2. Check if we should delete the whole record or just the image field
    const hasSymptoms = record.symptoms && record.symptoms.trim().length > 0
    const hasSolutions = record.solutions && record.solutions.trim().length > 0
    const hasTests = record.suggested_tests && record.suggested_tests.length > 0
    
    const shouldDeleteRecord = !hasSymptoms && !hasSolutions && !hasTests

    if (shouldDeleteRecord) {
      const { error: deleteError } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId)
      if (deleteError) throw deleteError
    } else {
      const { error: updateError } = await supabase
        .from('medical_records')
        .update({ image_url: null })
        .eq('id', recordId)
      if (updateError) throw updateError
    }

    // 3. Revalidate and return
    revalidatePath(`/dashboard/patient/${patientId}`)
    revalidatePath(`/dashboard`)
    
    return { success: true, deleted: shouldDeleteRecord }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to remove prescription image:', error)
    return { success: false, error: message }
  }
}

export async function addTestResultAction(patientId: string, data: any) {
  try {
    // 1. Generate embedding FIRST.
    const combinedText = `${data.test_name} ${data.results || ''}`;
    const embedding = await generateEmbedding(combinedText);

    const supabase = await createClient()
    const dal = new DataAccessLayer(supabase)

    // 2. Insert record WITH embedding.
    await dal.addTestResult({
      patient_id: patientId,
      test_name: data.test_name,
      results: data.results,
      date: data.date,
      embedding: embedding as any,
    })

    revalidatePath(`/dashboard/patient/${patientId}`)
    revalidatePath(`/dashboard`)
    return { success: true }
  } catch (error) {
    console.error('Failed to create and index test result:', error)
    return { success: false, error: "Test result indexing failed. Record was not saved." }
  }
}

export async function analyzeGlobalSymptomTrendsAction(
  symptoms: string,
  startDate: string,
  endDate: string
) {
  try {
    const supabase = await createClient();
    
    // 1. Verify user role is 'doctor'
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'doctor') {
      throw new Error('Unauthorized: Only doctors can access epidemiological trends.');
    }

    const embedding = await generateEmbedding(symptoms);

    // 2. Fetch anonymized cases from the backend using the new security definer RPC
    const { data: cases, error } = await supabase.rpc('match_epidemiological_cases', {
      query_embedding: embedding,
      query_text: symptoms,
      start_date: startDate,
      end_date: endDate,
      match_threshold: 0.3,
      match_count: 100 
    });

    if (error) throw error;
    if (!cases || cases.length === 0) {
      return { success: true, report: "No similar clinical cases found within the selected timeframe." };
    }

    // 3. Format the context for Gemma - STRICTLY NO NAMES OR PII
    let clinicalContext = `ANONYMIZED TREND DATA: FOUND ${cases.length} SIMILAR CASES FROM ${startDate} TO ${endDate}:\n\n`;
    
    cases.forEach((c: any, i: number) => {
      clinicalContext += `CASE #${i + 1} (Timeline: ${c.occurrence_date}):\n`;
      clinicalContext += `- Symptoms: ${c.symptoms}\n`;
      clinicalContext += `- Solutions/Interventions: ${c.solutions || 'None recorded'}\n`;
      clinicalContext += `- Anonymized Demographics: ${JSON.stringify(c.patient_metadata)}\n\n`;
    });

    // 4. Call Gemini with the Epidemiologist role
    const systemPrompt = formatSystemPrompt('Global Analysis Engine', clinicalContext, 'epidemiologist');
    
    const result = await chatModel.generateContent(`System Instruction: ${systemPrompt}\n\nTask: Perform a deep reasoning analysis on these anonymized cases. Identify clusters and trends.`);
    const report = result.response.text();

    return { success: true, report };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Epidemiological analysis failed:', error);
    return { success: false, error: "Access Denied or Analysis Failed: " + message };
  }
}

export async function globalCaseSearchAction(query: string, type: 'symptoms' | 'diagnosis') {
  try {
    const embedding = await generateEmbedding(query);
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('match_global_clinical_cases', {
      query_embedding: embedding,
      query_text: query, // Pass raw text for keyword fallback
      match_threshold: 0.3,
      match_count: 50,
      search_type: type
    });

    if (error) throw error;
    return { success: true, results: data };
  } catch (error) {
    console.error('Global search failed:', error);
    return { success: false, error: "Semantic search failed." };
  }
}

