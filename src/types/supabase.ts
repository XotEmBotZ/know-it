export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string | null
          full_name: string | null
          role: string
          metadata: Json | null
        }
        Insert: {
          id: string
          created_at?: string | null
          full_name?: string | null
          role: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string | null
          full_name?: string | null
          role?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          id: string
          created_at: string | null
          patient_id: string
          doctor_id: string
          date: string | null
          symptoms: string | null
          solutions: string | null
          suggested_tests: string[] | null
          symptoms_embedding: string | null
          solutions_embedding: string | null
          fts_tokens: any | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          patient_id: string
          doctor_id: string
          date?: string | null
          symptoms?: string | null
          solutions?: string | null
          suggested_tests?: string[] | null
          symptoms_embedding?: string | null
          solutions_embedding?: string | null
          fts_tokens?: any | null
        }
        Update: {
          id?: string
          created_at?: string | null
          patient_id?: string
          doctor_id?: string
          date?: string | null
          symptoms?: string | null
          solutions?: string | null
          suggested_tests?: string[] | null
          symptoms_embedding?: string | null
          solutions_embedding?: string | null
          fts_tokens?: any | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          id: string
          created_at: string | null
          patient_id: string
          test_name: string
          results: string | null
          date: string | null
          embedding: string | null
          fts_tokens: any | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          patient_id: string
          test_name: string
          results?: string | null
          date?: string | null
          embedding?: string | null
          fts_tokens?: any | null
        }
        Update: {
          id?: string
          created_at?: string | null
          patient_id?: string
          test_name?: string
          results?: string | null
          date?: string | null
          embedding?: string | null
          fts_tokens?: any | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_consents: {
        Row: {
          id: string
          created_at: string | null
          patient_id: string
          doctor_id: string
          status: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          patient_id: string
          doctor_id: string
          status?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          patient_id?: string
          doctor_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_consents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          id: string
          created_at: string | null
          patient_id: string
          from_doctor_id: string
          to_doctor_id: string
          reason: string
          notes: string | null
          status: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          patient_id: string
          from_doctor_id: string
          to_doctor_id: string
          reason: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          patient_id?: string
          from_doctor_id?: string
          to_doctor_id?: string
          reason?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_from_doctor_id_fkey"
            columns: ["from_doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_to_doctor_id_fkey"
            columns: ["to_doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_queue: {
        Row: {
          id: string
          created_at: string | null
          patient_id: string
          doctor_id: string
          appointment_date: string
          queue_number: number
          status: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          patient_id: string
          doctor_id: string
          appointment_date: string
          queue_number: number
          status?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          patient_id?: string
          doctor_id?: string
          appointment_date?: string
          queue_number?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_queue_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      temporary_access_tokens: {
        Row: {
          id: string
          created_at: string | null
          medical_record_id: string
          patient_id: string
          expires_at: string
        }
        Insert: {
          id?: string
          created_at?: string | null
          medical_record_id: string
          patient_id: string
          expires_at: string
        }
        Update: {
          id?: string
          created_at?: string | null
          medical_record_id?: string
          patient_id?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "temporary_access_tokens_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporary_access_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_record_by_token: {
        Args: {
          p_token_id: string
        }
        Returns: {
          id: string
          patient_name: string
          doctor_name: string
          date: string
          symptoms: string
          solutions: string
          suggested_tests: string[]
          expires_at: string
        }[]
      }
      match_patient_knowledge_hybrid: {
        Args: {
          p_patient_id: string
          query_text: string
          query_embedding: string
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          source_type: string
          rank_score: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
