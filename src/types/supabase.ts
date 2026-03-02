export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointment_queue: {
        Row: {
          appointment_date: string
          created_at: string | null
          doctor_id: string
          id: string
          patient_id: string
          queue_number: number
          status: string | null
        }
        Insert: {
          appointment_date: string
          created_at?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          queue_number: number
          status?: string | null
        }
        Update: {
          appointment_date?: string
          created_at?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
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
      document_vault: {
        Row: {
          created_at: string | null
          embedding: string | null
          extracted_text: string | null
          id: string
          metadata: Json | null
          name: string
          patient_id: string
          storage_url: string
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          extracted_text?: string | null
          id?: string
          metadata?: Json | null
          name: string
          patient_id: string
          storage_url: string
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          extracted_text?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          patient_id?: string
          storage_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_vault_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
          embedding: string | null
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
          embedding?: string | null
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
          embedding?: string | null
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
      referrals: {
        Row: {
          created_at: string | null
          from_doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          reason: string
          status: string | null
          to_doctor_id: string
        }
        Insert: {
          created_at?: string | null
          from_doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          reason: string
          status?: string | null
          to_doctor_id: string
        }
        Update: {
          created_at?: string | null
          from_doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string
          status?: string | null
          to_doctor_id?: string
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
      test_results: {
        Row: {
          created_at: string | null
          date: string | null
          embedding: string | null
          id: string
          patient_id: string
          results: string | null
          test_name: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          embedding?: string | null
          id?: string
          patient_id: string
          results?: string | null
          test_name: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          embedding?: string | null
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
      get_next_queue_number: {
        Args: { p_date: string; p_doctor_id: string }
        Returns: number
      }
      match_patient_knowledge: {
        Args: {
          match_count: number
          match_threshold: number
          p_patient_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          source_type: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
