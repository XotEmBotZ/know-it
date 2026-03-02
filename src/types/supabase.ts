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
      medical_consents: {
        Row: {
          created_at: string | null
          doctor_id: string
          id: string
          patient_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
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
      medical_records: {
        Row: {
          created_at: string | null
          date: string | null
          doctor_id: string
          id: string
          patient_id: string
          solutions: string | null
          suggested_tests: string[] | null
          symptoms: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          solutions?: string | null
          suggested_tests?: string[] | null
          symptoms?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
          solutions?: string | null
          suggested_tests?: string[] | null
          symptoms?: string | null
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
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          metadata?: Json | null
          role: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          patient_id: string
          results: string | null
          test_name: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          patient_id: string
          results?: string | null
          test_name: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          patient_id?: string
          results?: string | null
          test_name?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
