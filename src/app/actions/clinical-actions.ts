'use server'

import { createClient } from '@/utils/supabase/server'
import { DataAccessLayer } from '@/lib/dal'
import { generateEmbedding } from '@/lib/ai/google'
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
    // The DAL uses the Database type, which now includes these columns.
    await dal.createMedicalRecord({
      patient_id: patientId,
      doctor_id: data.doctor_id,
      date: data.date,
      symptoms: data.symptoms,
      solutions: data.solutions,
      suggested_tests: data.suggested_tests,
      symptoms_embedding: symptomsEmbedding as any,
      solutions_embedding: solutionsEmbedding as any,
    })

    revalidatePath(`/dashboard/patient/${patientId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to create and index medical record:', error)
    return { success: false, error: "Medical indexing failed. Record was not saved." }
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
    return { success: true }
  } catch (error) {
    console.error('Failed to create and index test result:', error)
    return { success: false, error: "Test result indexing failed. Record was not saved." }
  }
}
