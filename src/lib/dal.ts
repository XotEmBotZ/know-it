import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];
export type TestResult = Database['public']['Tables']['test_results']['Row'];
export type MedicalConsent = Database['public']['Tables']['medical_consents']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];
export type AppointmentQueue = Database['public']['Tables']['appointment_queue']['Row'];

export class DataAccessLayer {
  constructor(private supabase: SupabaseClient<Database>) {}

  // --- Common ---
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Profile | null;
    } catch (e) {
      return null;
    }
  }

  async getPrescriptionUrl(path: string): Promise<string | null> {
    const { data, error } = await this.supabase.storage
      .from('prescriptions')
      .createSignedUrl(path, 3600); // 1 hour
    if (error) return null;
    return data.signedUrl;
  }

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
    try {
      const { data, error } = await this.supabase
        .from('referrals')
        .select('*, from_doctor:profiles!referrals_from_doctor_id_fkey(full_name)')
        .eq('to_doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) { return []; }
  }

  async getReferralsForDoctor(doctorId: string) {
    try {
      const { data, error } = await this.supabase
        .from('referrals')
        .select('*, patient:profiles!referrals_patient_id_fkey(full_name), from_doctor:profiles!referrals_from_doctor_id_fkey(full_name)')
        .eq('to_doctor_id', doctorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) { return []; }
  }

  async getReferralsFromDoctor(doctorId: string) {
    try {
      const { data, error } = await this.supabase
        .from('referrals')
        .select('*, patient:profiles!referrals_patient_id_fkey(full_name), to_doctor:profiles!referrals_to_doctor_id_fkey(full_name)')
        .eq('from_doctor_id', doctorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) { return []; }
  }

  async searchSpecialists(query: string): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor')
      .ilike('full_name', `%${query}%`)
      .limit(20);
    if (error) throw error;
    return data as Profile[];
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

  async getConsentsForPatient(patientId: string) {
    const { data, error } = await this.supabase
      .from('medical_consents')
      .select('*, doctor:profiles!medical_consents_doctor_id_fkey(full_name, id, metadata)')
      .eq('patient_id', patientId);
    if (error) throw error;
    return data;
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

  async revokeConsent(patientId: string, doctorId: string) {
    const { error: consentError } = await this.supabase
      .from('medical_consents')
      .update({ status: 'revoked' })
      .match({ patient_id: patientId, doctor_id: doctorId });
    if (consentError) throw consentError;

    // Also cancel any pending/future appointments for this doctor-patient pair
    const { error: appError } = await this.supabase
      .from('appointment_queue')
      .delete()
      .match({ patient_id: patientId, doctor_id: doctorId });
    if (appError) throw appError;
  }

  async deleteConsent(patientId: string, doctorId: string) {
    const { error } = await this.supabase
      .from('medical_consents')
      .delete()
      .match({ patient_id: patientId, doctor_id: doctorId })
      .in('status', ['revoked', 'pending']);
    if (error) throw error;
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

  async addMedicalRecord(record: Database['public']['Tables']['medical_records']['Insert']): Promise<MedicalRecord> {
    const { data, error } = await this.supabase
      .from('medical_records')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data as MedicalRecord;
  }

  async addTestResult(result: Database['public']['Tables']['test_results']['Insert']): Promise<TestResult> {
    const { data, error } = await this.supabase
      .from('test_results')
      .insert(result)
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

  // --- Queue & Scheduling ---
  async bookAppointment(doctorId: string, patientId: string, date: string) {
    const { data: queueNumberData, error: qError } = await (this.supabase as any).rpc('get_next_queue_number', { p_doctor_id: doctorId, p_date: date });
    if (qError) throw qError;
    const queueNumber = Number(queueNumberData);
    const { data, error } = await this.supabase
      .from('appointment_queue')
      .insert({ doctor_id: doctorId, patient_id: patientId, appointment_date: date, queue_number: queueNumber, status: 'pending' })
      .select().single();
    if (error) throw error;
    return data;
  }

  async getDoctorAllPendingAppointments(doctorId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await this.supabase
        .from('appointment_queue')
        .select('*, patient:profiles!appointment_queue_patient_id_fkey(full_name, id)')
        .eq('doctor_id', doctorId)
        .eq('status', 'pending')
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('queue_number', { ascending: true });
      if (error) throw error;
      return data;
    } catch (e) { return []; }
  }

  async getPatientAppointments(patientId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await this.supabase
        .from('appointment_queue')
        .select('*, doctor:profiles!appointment_queue_doctor_id_fkey(full_name, id)')
        .eq('patient_id', patientId)
        .eq('status', 'pending')
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true });
      if (error) throw error;
      return data;
    } catch (e) { return []; }
  }

  async markAppointmentDone(id: string) { 
    const { error } = await this.supabase.from('appointment_queue').delete().eq('id', id); 
    if (error) throw error;
  }
  
  async skipAppointment(id: string) { 
    const { error } = await this.supabase.from('appointment_queue').update({ status: 'skipped' }).eq('id', id); 
    if (error) throw error;
  }
  
  async cancelAppointment(id: string, patientId: string) {
    const { error } = await this.supabase
      .from('appointment_queue')
      .delete()
      .match({ id, patient_id: patientId });
    if (error) throw error;
  }

  async getQueueAheadCount(doctorId: string, date: string, queueNumber: number) {
    try {
      const { count, error } = await this.supabase
        .from('appointment_queue')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .eq('status', 'pending')
        .lt('queue_number', queueNumber);
      if (error) throw error;
      return count || 0;
    } catch (e) {
      return 0;
    }
  }
}
