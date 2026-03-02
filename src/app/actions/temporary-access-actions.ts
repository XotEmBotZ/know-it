'use server'

import { createClient } from '@/utils/supabase/server'
import { DataAccessLayer } from '@/lib/dal'

export async function createTemporaryAccessTokenAction(medicalRecordId: string, durationMinutes: number) {
  try {
    const supabase = await createClient()
    
    // Get current user to ensure they own the record
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // Ensure the record belongs to the patient
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .select('patient_id')
      .eq('id', medicalRecordId)
      .single()

    if (recordError || !record) throw new Error('Medical record not found')
    if (record.patient_id !== user.id) throw new Error('Unauthorized')

    const expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString()
    
    const { data, error } = await supabase
      .from('temporary_access_tokens')
      .insert({
        medical_record_id: medicalRecordId,
        patient_id: user.id,
        expires_at: expiresAt
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, tokenId: data.id }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to create temporary access token:', error)
    return { success: false, error: message }
  }
}

export async function getRecordByTokenAction(tokenId: string) {
  try {
    const supabase = await createClient()
    const dal = new DataAccessLayer(supabase)
    const record = await dal.getRecordByToken(tokenId)
    
    if (!record) {
      return { success: false, error: 'Access expired or invalid token' }
    }

    return { success: true, record }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to get record by token:', error)
    return { success: false, error: message }
  }
}
