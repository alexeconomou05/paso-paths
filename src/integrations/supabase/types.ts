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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          id: string
          job_id: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          student_id: string | null
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id?: string | null
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_id?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          employer_email: string
          employer_name: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          is_active: boolean | null
          job_description: string
          job_title: string
          location: string | null
          requirements: string | null
          salary_range: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employer_email: string
          employer_name: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          id?: string
          is_active?: boolean | null
          job_description: string
          job_title: string
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employer_email?: string
          employer_name?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          is_active?: boolean | null
          job_description?: string
          job_title?: string
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          cv_url: string | null
          email: string
          field_of_study: string | null
          full_name: string
          graduation_year: number | null
          id: string
          paso_document_url: string | null
          paso_number: string | null
          photo_url: string | null
          university: string | null
          updated_at: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          email: string
          field_of_study?: string | null
          full_name: string
          graduation_year?: number | null
          id: string
          paso_document_url?: string | null
          paso_number?: string | null
          photo_url?: string | null
          university?: string | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string
          field_of_study?: string | null
          full_name?: string
          graduation_year?: number | null
          id?: string
          paso_document_url?: string | null
          paso_number?: string | null
          photo_url?: string | null
          university?: string | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status: "submitted" | "reviewing" | "accepted" | "rejected"
      employment_type:
        | "internship"
        | "part_time"
        | "full_time"
        | "graduate_program"
      verification_status: "pending" | "approved" | "rejected"
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
    Enums: {
      application_status: ["submitted", "reviewing", "accepted", "rejected"],
      employment_type: [
        "internship",
        "part_time",
        "full_time",
        "graduate_program",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
