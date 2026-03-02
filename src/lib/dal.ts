import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];
export type TestResult = Database['public']['Tables']['test_results']['Row'];
export type MedicalConsent = Database['public']['Tables']['medical_consents']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];

export class DataAccessLayer {
  constructor(private supabase: SupabaseClient<Database>) {}

  // --- Referral System ---

  async createReferral(referral: Database['public']['Tables']['referrals']['Insert']): Promise<Referral> {
    const { data, error } = await this.supabase
      .from('referrals')
      .insert(referral)
      .select()
      .single();
    if (error) throw error;
    return data as Referral;
  }

  async getReferralForDoctorAndPatient(doctorId: string, patientId: string) {
    const { data, error } = await this.supabase
      .from('referrals')
      .select('*, from_doctor:profiles!referrals_from_doctor_id_fkey(full_name)')
      .eq('to_doctor_id', doctorId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getReferralsForDoctor(doctorId: string) {
    const { data, error } = await this.supabase
      .from('referrals')
      .select('*, patient:profiles!referrals_patient_id_fkey(full_name), from_doctor:profiles!referrals_from_doctor_id_fkey(full_name)')
      .eq('to_doctor_id', doctorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getReferralsFromDoctor(doctorId: string) {
    const { data, error } = await this.supabase
      .from('referrals')
      .select('*, patient:profiles!referrals_patient_id_fkey(full_name), to_doctor:profiles!referrals_to_doctor_id_fkey(full_name)')
      .eq('from_doctor_id', doctorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async searchSpecialists(query: string): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor')
      .ilike('full_name', `%${query}%`)
      .limit(10);
    if (error) throw error;
    return data as Profile[];
  }

  // --- Common ---
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data as Profile;
  }

  async getPrescriptionUrl(path: string): Promise<string | null> {
    const { data, error } = await this.supabase.storage
      .from('prescriptions')
      .createSignedUrl(path, 3600); // 1 hour
    if (error) return null;
    return data.signedUrl;
  }

  // --- Patient Side ---
  
  async getPatientHistory(patientId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select('*, doctor:profiles!medical_records_doctor_id_fkey(full_name)')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;

    const recordsWithUrls = await Promise.all((data || []).map(async (record) => {
      if (record.image_url) {
        const signedUrl = await this.getPrescriptionUrl(record.image_url);
        return { ...record, signed_url: signedUrl };
      }
      return record;
    }));

    return recordsWithUrls;
  }

  async getPatientTests(patientId: string): Promise<TestResult[]> {
    const { data, error } = await this.supabase
      .from('test_results')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as TestResult[];
  }

  async grantConsent(patientId: string, doctorId: string) {
    const { data, error } = await this.supabase
      .from('medical_consents')
      .upsert(
        { patient_id: patientId, doctor_id: doctorId, status: 'active' },
        { onConflict: 'patient_id,doctor_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async revokeConsent(patient_id: string, doctor_id: string) {
    const { error } = await this.supabase
      .from('medical_consents')
      .update({ status: 'revoked' })
      .match({ patient_id, doctor_id });
    if (error) throw error;
  }

  async deleteConsent(patient_id: string, doctor_id: string) {
    const { error } = await this.supabase
      .from('medical_consents')
      .delete()
      .match({ patient_id, doctor_id })
      .in('status', ['revoked', 'pending']);
    if (error) throw error;
  }

  async getConsentsForPatient(patientId: string) {
    const { data, error } = await this.supabase
      .from('medical_consents')
      .select('*, doctor:profiles!medical_consents_doctor_id_fkey(full_name, id, metadata)')
      .eq('patient_id', patientId);
    if (error) throw error;
    return data;
  }

  // --- Doctor Side ---

  async searchDoctor(query: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor')
      .or(`full_name.ilike.%${query}%,metadata->>medical_id.ilike.%${query}%`)
      .limit(10);
    if (error) throw error;
    return data;
  }

  async requestConsent(doctorId: string, patientId: string) {
    const { data, error } = await this.supabase
      .from('medical_consents')
      .upsert(
        { patient_id: patientId, doctor_id: doctorId, status: 'pending' },
        { onConflict: 'patient_id,doctor_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getConsentsForDoctor(doctorId: string) {
    const { data, error } = await this.supabase
      .from('medical_consents')
      .select('*, patient:profiles!medical_consents_patient_id_fkey(full_name, id)')
      .eq('doctor_id', doctorId)
      .neq('status', 'revoked');
    if (error) throw error;
    return data;
  }

  async searchPatient(query?: string) {
    let q = this.supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient');
    
    if (query) {
      q = q.ilike('full_name', `%${query}%`);
    }

    const { data, error } = await q.limit(10);
    if (error) throw error;
    return data;
  }

  async getPatientHistoryWithConsent(patientId: string): Promise<MedicalRecord[]> {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as MedicalRecord[];
  }

  async createMedicalRecord(record: Database['public']['Tables']['medical_records']['Insert']): Promise<MedicalRecord> {
    const { data, error } = await this.supabase
      .from('medical_records')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data as MedicalRecord;
  }

  async addTestResult(test: Database['public']['Tables']['test_results']['Insert']): Promise<TestResult> {
    const { data, error } = await this.supabase
      .from('test_results')
      .insert(test)
      .select()
      .single();
    if (error) throw error;
    return data as TestResult;
  }

  // --- Temporary Access ---

  async createTemporaryAccessToken(tokenId: string, medicalRecordId: string, patientId: string, expiresAt: string) {
    const { data, error } = await this.supabase
      .from('temporary_access_tokens')
      .insert({
        id: tokenId,
        medical_record_id: medicalRecordId,
        patient_id: patientId,
        expires_at: expiresAt
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getRecordByToken(tokenId: string) {
    const { data, error } = await this.supabase
      .rpc('get_record_by_token', { p_token_id: tokenId });
    if (error) throw error;
    const record = data?.[0] || null;
    
    if (record && record.image_url) {
      const signedUrl = await this.getPrescriptionUrl(record.image_url);
      return { ...record, signed_url: signedUrl };
    }
    
    return record;
  }
}
