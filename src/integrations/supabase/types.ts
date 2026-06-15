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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clusters: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          designation: string | null
          id: string
          location: string | null
          name: string
          phone: string | null
          phones: string[]
          photos: string[]
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          designation?: string | null
          id?: string
          location?: string | null
          name: string
          phone?: string | null
          phones?: string[]
          photos?: string[]
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          designation?: string | null
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
          phones?: string[]
          photos?: string[]
          sort_order?: number | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          donation_date: string
          donor_id: string
          id: string
          notes: string | null
          receipt_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          donation_date?: string
          donor_id: string
          id?: string
          notes?: string | null
          receipt_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          donation_date?: string
          donor_id?: string
          id?: string
          notes?: string | null
          receipt_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          address: string | null
          cluster_id: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          photos: string[]
          sub_cluster_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cluster_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          photos?: string[]
          sub_cluster_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cluster_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          photos?: string[]
          sub_cluster_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donors_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donors_sub_cluster_id_fkey"
            columns: ["sub_cluster_id"]
            isOneToOne: false
            referencedRelation: "sub_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      dua_replies: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          created_at: string
          dua_request_id: string
          id: string
          reply_text: string
          sender_type: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          dua_request_id: string
          id?: string
          reply_text: string
          sender_type?: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          dua_request_id?: string
          id?: string
          reply_text?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dua_replies_dua_request_id_fkey"
            columns: ["dua_request_id"]
            isOneToOne: false
            referencedRelation: "dua_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      dua_requests: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          created_at: string
          donor_id: string
          id: string
          message: string
          reply: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          donor_id: string
          id?: string
          message: string
          reply?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          donor_id?: string
          id?: string
          message?: string
          reply?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dua_requests_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      initiatives: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_cluster_orders: {
        Row: {
          cluster_id: string
          created_at: string
          id: string
          month: string
          sort_order: number
        }
        Insert: {
          cluster_id: string
          created_at?: string
          id?: string
          month: string
          sort_order?: number
        }
        Update: {
          cluster_id?: string
          created_at?: string
          id?: string
          month?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_cluster_orders_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_sub_cluster_orders: {
        Row: {
          created_at: string
          id: string
          month: string
          sort_order: number
          sub_cluster_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          sort_order?: number
          sub_cluster_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          sort_order?: number
          sub_cluster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_sub_cluster_orders_sub_cluster_id_fkey"
            columns: ["sub_cluster_id"]
            isOneToOne: false
            referencedRelation: "sub_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      org_media: {
        Row: {
          created_at: string
          id: string
          sort_order: number | null
          title: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number | null
          title?: string | null
          type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number | null
          title?: string | null
          type?: string
          url?: string
        }
        Relationships: []
      }
      organization_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          platform: string
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      spiritual_gatherings: {
        Row: {
          created_at: string
          date_info: string | null
          day_of_week: string | null
          description: string | null
          id: string
          recurring: boolean | null
          sort_order: number | null
          time_info: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_info?: string | null
          day_of_week?: string | null
          description?: string | null
          id?: string
          recurring?: boolean | null
          sort_order?: number | null
          time_info?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_info?: string | null
          day_of_week?: string | null
          description?: string | null
          id?: string
          recurring?: boolean | null
          sort_order?: number | null
          time_info?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sub_clusters: {
        Row: {
          cluster_id: string
          created_at: string
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          cluster_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          cluster_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_clusters_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
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
