import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];
export type TestResult = Database['public']['Tables']['test_results']['Row'];
export type MedicalConsent = Database['public']['Tables']['medical_consents']['Row'];

export class DataAccessLayer {
  constructor(private supabase: SupabaseClient<Database>) {}

  // --- Common ---
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  // --- Patient Side ---
  
  /**
   * Fetch all medical history for the current patient.
   * Useful for AI context or home remedy suggestions.
   */
  async getPatientHistory(patientId: string) {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select('*, doctor:profiles(full_name)')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  /**
   * Fetch all test results for the current patient.
   */
  async getPatientTests(patientId: string) {
    const { data, error } = await this.supabase
      .from('test_results')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  /**
   * Manage consents (Patient gives permission to a Doctor)
   */
  async grantConsent(patientId: string, doctorId: string) {
    const { data, error } = await this.supabase
      .from('medical_consents')
      .upsert({ patient_id: patientId, doctor_id: doctorId, status: 'active' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async revokeConsent(patientId: string, doctorId: string) {
    const { error } = await this.supabase
      .from('medical_consents')
      .update({ status: 'revoked' })
      .match({ patient_id: patientId, doctor_id: doctorId });
    if (error) throw error;
  }

  // --- Doctor Side ---

  /**
   * Search for a patient (Doctors search by name/email to request consent)
   */
  async searchPatient(query: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .ilike('full_name', `%${query}%`)
      .limit(10);
    if (error) throw error;
    return data;
  }

  /**
   * Fetch a patient's history IF consent exists.
   * Supabase RLS will automatically enforce the consent check based on our policies.
   */
  async getPatientHistoryWithConsent(patientId: string) {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  /**
   * Write a new prescription (Medical Record)
   */
  async createMedicalRecord(record: Database['public']['Tables']['medical_records']['Insert']) {
    const { data, error } = await this.supabase
      .from('medical_records')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Add test results for a patient
   */
  async addTestResult(test: Database['public']['Tables']['test_results']['Insert']) {
    const { data, error } = await this.supabase
      .from('test_results')
      .insert(test)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
