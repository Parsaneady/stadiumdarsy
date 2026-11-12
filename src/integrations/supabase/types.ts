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
      advisor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      announcement_banners: {
        Row: {
          created_at: string
          id: string
          link_url: string | null
          sort_order: number
          storage_path: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_url?: string | null
          sort_order?: number
          storage_path: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_url?: string | null
          sort_order?: number
          storage_path?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bite_logs: {
        Row: {
          bite_id: string
          blank: number
          correct: number
          created_at: string
          date: string
          deleted_at: string | null
          distraction: string
          distractions_note: string
          energy: string
          id: string
          minutes: number
          source: string
          tests_done: number
          updated_at: string
          user_id: string
          wrong: number
        }
        Insert: {
          bite_id: string
          blank?: number
          correct?: number
          created_at?: string
          date: string
          deleted_at?: string | null
          distraction?: string
          distractions_note?: string
          energy?: string
          id?: string
          minutes?: number
          source?: string
          tests_done?: number
          updated_at?: string
          user_id: string
          wrong?: number
        }
        Update: {
          bite_id?: string
          blank?: number
          correct?: number
          created_at?: string
          date?: string
          deleted_at?: string | null
          distraction?: string
          distractions_note?: string
          energy?: string
          id?: string
          minutes?: number
          source?: string
          tests_done?: number
          updated_at?: string
          user_id?: string
          wrong?: number
        }
        Relationships: [
          {
            foreignKeyName: "bite_logs_user_id_bite_id_fkey"
            columns: ["user_id", "bite_id"]
            isOneToOne: false
            referencedRelation: "bites"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      bite_progress: {
        Row: {
          bite_id: string
          last_done_at: string | null
          minutes_done: number
          next_review_at: string | null
          status: string
          tests_blank: number
          tests_correct: number
          tests_done: number
          tests_wrong: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bite_id: string
          last_done_at?: string | null
          minutes_done?: number
          next_review_at?: string | null
          status?: string
          tests_blank?: number
          tests_correct?: number
          tests_done?: number
          tests_wrong?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bite_id?: string
          last_done_at?: string | null
          minutes_done?: number
          next_review_at?: string | null
          status?: string
          tests_blank?: number
          tests_correct?: number
          tests_done?: number
          tests_wrong?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bite_progress_user_id_bite_id_fkey"
            columns: ["user_id", "bite_id"]
            isOneToOne: true
            referencedRelation: "bites"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      bites: {
        Row: {
          book: string
          chapter: string
          created_at: string
          grade_origin: number
          id: string
          kind: string
          legacy_ref: string | null
          manually_completed: boolean
          mode: string
          needs_review: boolean
          page_from: number | null
          page_to: number | null
          parent_bite_id: string | null
          phase: string
          planned_date: string | null
          slot_time: string | null
          subject: string
          subject_type: string
          target_minutes: number
          target_tests: number
          test_source: string
          title: string
          updated_at: string
          user_id: string
          weight: string
        }
        Insert: {
          book?: string
          chapter?: string
          created_at?: string
          grade_origin?: number
          id?: string
          kind?: string
          legacy_ref?: string | null
          manually_completed?: boolean
          mode?: string
          needs_review?: boolean
          page_from?: number | null
          page_to?: number | null
          parent_bite_id?: string | null
          phase?: string
          planned_date?: string | null
          slot_time?: string | null
          subject: string
          subject_type?: string
          target_minutes?: number
          target_tests?: number
          test_source?: string
          title: string
          updated_at?: string
          user_id: string
          weight?: string
        }
        Update: {
          book?: string
          chapter?: string
          created_at?: string
          grade_origin?: number
          id?: string
          kind?: string
          legacy_ref?: string | null
          manually_completed?: boolean
          mode?: string
          needs_review?: boolean
          page_from?: number | null
          page_to?: number | null
          parent_bite_id?: string | null
          phase?: string
          planned_date?: string | null
          slot_time?: string | null
          subject?: string
          subject_type?: string
          target_minutes?: number
          target_tests?: number
          test_source?: string
          title?: string
          updated_at?: string
          user_id?: string
          weight?: string
        }
        Relationships: [
          {
            foreignKeyName: "bites_parent_bite_id_fkey"
            columns: ["parent_bite_id"]
            isOneToOne: false
            referencedRelation: "bites"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          event_date: string
          id: string
          persian_day: number | null
          persian_month: number | null
          persian_year: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          id?: string
          persian_day?: number | null
          persian_month?: number | null
          persian_year?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          persian_day?: number | null
          persian_month?: number | null
          persian_year?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          bite_summary: Json
          completed_sessions: number
          created_at: string
          date: string
          feedback: string | null
          id: string
          overall_score: number
          sessions: Json | null
          total_sessions: number
          total_study_hours: number
          total_tests: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bite_summary?: Json
          completed_sessions?: number
          created_at?: string
          date: string
          feedback?: string | null
          id?: string
          overall_score?: number
          sessions?: Json | null
          total_sessions?: number
          total_study_hours?: number
          total_tests?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bite_summary?: Json
          completed_sessions?: number
          created_at?: string
          date?: string
          feedback?: string | null
          id?: string
          overall_score?: number
          sessions?: Json | null
          total_sessions?: number
          total_study_hours?: number
          total_tests?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          average_percentage: number | null
          blank_answers: number
          correct_answers: number
          created_at: string
          exam_id: string | null
          exam_type: string
          id: string
          lesson_name: string | null
          lessons_data: Json | null
          pension_exam_id: string | null
          pension_id: string | null
          percentage: number | null
          total_questions: number
          user_id: string
          wrong_answers: number
        }
        Insert: {
          average_percentage?: number | null
          blank_answers?: number
          correct_answers?: number
          created_at?: string
          exam_id?: string | null
          exam_type: string
          id?: string
          lesson_name?: string | null
          lessons_data?: Json | null
          pension_exam_id?: string | null
          pension_id?: string | null
          percentage?: number | null
          total_questions?: number
          user_id: string
          wrong_answers?: number
        }
        Update: {
          average_percentage?: number | null
          blank_answers?: number
          correct_answers?: number
          created_at?: string
          exam_id?: string | null
          exam_type?: string
          id?: string
          lesson_name?: string | null
          lessons_data?: Json | null
          pension_exam_id?: string | null
          pension_id?: string | null
          percentage?: number | null
          total_questions?: number
          user_id?: string
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_pension_exam_id_fkey"
            columns: ["pension_exam_id"]
            isOneToOne: false
            referencedRelation: "pension_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_exam_results_pension"
            columns: ["pension_id"]
            isOneToOne: false
            referencedRelation: "pensions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          created_by: string
          exam_type: string
          id: string
          lessons: Json | null
          pension_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          exam_type: string
          id?: string
          lessons?: Json | null
          pension_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          exam_type?: string
          id?: string
          lessons?: Json | null
          pension_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_exams_pension"
            columns: ["pension_id"]
            isOneToOne: false
            referencedRelation: "pensions"
            referencedColumns: ["id"]
          },
        ]
      }
      pension_announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          pension_id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          pension_id: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          pension_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pension_announcements_pension_id_fkey"
            columns: ["pension_id"]
            isOneToOne: false
            referencedRelation: "pensions"
            referencedColumns: ["id"]
          },
        ]
      }
      pension_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          pension_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          pension_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          pension_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pension_chat_messages_pension_id_fkey"
            columns: ["pension_id"]
            isOneToOne: false
            referencedRelation: "pensions"
            referencedColumns: ["id"]
          },
        ]
      }
      pension_exams: {
        Row: {
          answer_key: Json | null
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number | null
          end_time: string
          exam_type: string
          id: string
          is_active: boolean | null
          lessons: Json | null
          pdf_url: string | null
          pension_id: string
          question_count: number
          start_time: string
          title: string
        }
        Insert: {
          answer_key?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          end_time: string
          exam_type?: string
          id?: string
          is_active?: boolean | null
          lessons?: Json | null
          pdf_url?: string | null
          pension_id: string
          question_count?: number
          start_time: string
          title: string
        }
        Update: {
          answer_key?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string
          exam_type?: string
          id?: string
          is_active?: boolean | null
          lessons?: Json | null
          pdf_url?: string | null
          pension_id?: string
          question_count?: number
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pension_exams_pension_id_fkey"
            columns: ["pension_id"]
            isOneToOne: false
            referencedRelation: "pensions"
            referencedColumns: ["id"]
          },
        ]
      }
      pension_invites: {
        Row: {
          created_at: string
          id: string
          invited_user_id: string
          pension_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_user_id: string
          pension_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_user_id?: string
          pension_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pension_invites_pension_id_fkey"
            columns: ["pension_id"]
            isOneToOne: false
            referencedRelation: "pensions"
            referencedColumns: ["id"]
          },
        ]
      }
      pension_members: {
        Row: {
          id: string
          joined_at: string
          pension_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          pension_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          pension_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pension_members_pension_id_fkey"
            columns: ["pension_id"]
            isOneToOne: false
            referencedRelation: "pensions"
            referencedColumns: ["id"]
          },
        ]
      }
      pensions: {
        Row: {
          created_at: string
          id: string
          invite_code: string | null
          invite_enabled: boolean | null
          leader_id: string
          max_members: number | null
          member_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string | null
          invite_enabled?: boolean | null
          leader_id: string
          max_members?: number | null
          member_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string | null
          invite_enabled?: boolean | null
          leader_id?: string
          max_members?: number | null
          member_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          id: string
          minutes: number
          subject: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          minutes: number
          subject: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          minutes?: number
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_minutes: number | null
          display_name: string | null
          email: string | null
          exam_date: string | null
          field: string | null
          first_name: string | null
          grade: number | null
          id: string
          last_name: string | null
          onboarded: boolean
          total_study_minutes: number | null
          total_tests: number | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_minutes?: number | null
          display_name?: string | null
          email?: string | null
          exam_date?: string | null
          field?: string | null
          first_name?: string | null
          grade?: number | null
          id?: string
          last_name?: string | null
          onboarded?: boolean
          total_study_minutes?: number | null
          total_tests?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_minutes?: number | null
          display_name?: string | null
          email?: string | null
          exam_date?: string | null
          field?: string | null
          first_name?: string | null
          grade?: number | null
          id?: string
          last_name?: string | null
          onboarded?: boolean
          total_study_minutes?: number | null
          total_tests?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      study_activities: {
        Row: {
          activity_date: string
          activity_type: string
          bite_id: string | null
          color: string | null
          created_at: string
          end_time: string | null
          id: string
          is_active: boolean | null
          start_time: string
          study_mode: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          bite_id?: string | null
          color?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time: string
          study_mode?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          bite_id?: string | null
          color?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time?: string
          study_mode?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_activities_bite_id_fkey"
            columns: ["bite_id"]
            isOneToOne: false
            referencedRelation: "bites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_books: {
        Row: {
          answers: Json | null
          correct_answers: Json | null
          created_at: string
          id: string
          marked_questions: Json | null
          name: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          correct_answers?: Json | null
          created_at?: string
          id?: string
          marked_questions?: Json | null
          name: string
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          correct_answers?: Json | null
          created_at?: string
          id?: string
          marked_questions?: Json | null
          name?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          daily_backbone: Json
          id: string
          last_study_date: string | null
          last_weekly_reset: string | null
          pomodoro_cycles: number
          pomodoro_long_break: number
          pomodoro_short_break: number
          pomodoro_study_duration: number
          streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_backbone?: Json
          id?: string
          last_study_date?: string | null
          last_weekly_reset?: string | null
          pomodoro_cycles?: number
          pomodoro_long_break?: number
          pomodoro_short_break?: number
          pomodoro_study_duration?: number
          streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_backbone?: Json
          id?: string
          last_study_date?: string | null
          last_weekly_reset?: string | null
          pomodoro_cycles?: number
          pomodoro_long_break?: number
          pomodoro_short_break?: number
          pomodoro_study_duration?: number
          streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_study_status: {
        Row: {
          created_at: string
          current_subject: string | null
          id: string
          is_studying: boolean | null
          last_active: string | null
          started_at: string | null
          study_mode: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_subject?: string | null
          id?: string
          is_studying?: boolean | null
          last_active?: string | null
          started_at?: string | null
          study_mode?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_subject?: string | null
          id?: string
          is_studying?: boolean | null
          last_active?: string | null
          started_at?: string | null
          study_mode?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wake_up_logs: {
        Row: {
          created_at: string
          id: string
          logged_date: string
          pension_id: string
          user_id: string
          wake_time: string
        }
        Insert: {
          created_at?: string
          id?: string
          logged_date?: string
          pension_id: string
          user_id: string
          wake_time: string
        }
        Update: {
          created_at?: string
          id?: string
          logged_date?: string
          pension_id?: string
          user_id?: string
          wake_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "wake_up_logs_pension_id_fkey"
            columns: ["pension_id"]
            isOneToOne: false
            referencedRelation: "pensions"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plans: {
        Row: {
          created_at: string
          day_index: number
          day_name: string
          id: string
          sessions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_index: number
          day_name: string
          id?: string
          sessions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_index?: number
          day_name?: string
          id?: string
          sessions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pension_admin_or_leader: {
        Args: { _pension_id: string }
        Returns: boolean
      }
      is_pension_member: { Args: { _pension_id: string }; Returns: boolean }
      is_sargarooh: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "سرگروه" | "member"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "سرگروه", "member"],
    },
  },
} as const
