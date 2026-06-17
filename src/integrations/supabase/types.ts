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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          path: string | null
          payload: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          path?: string | null
          payload?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          path?: string | null
          payload?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          client_id: string
          created_at: string
          guests: number
          id: string
          offer_id: string | null
          owner_id: string
          property_id: string
          status: string
          total_price: number
        }
        Insert: {
          check_in: string
          check_out: string
          client_id: string
          created_at?: string
          guests: number
          id?: string
          offer_id?: string | null
          owner_id: string
          property_id: string
          status?: string
          total_price: number
        }
        Update: {
          check_in?: string
          check_out?: string
          client_id?: string
          created_at?: string
          guests?: number
          id?: string
          offer_id?: string | null
          owner_id?: string
          property_id?: string
          status?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          client_id: string
          created_at: string
          id: string
          last_message_at: string
          offer_id: string
          owner_id: string
          property_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          offer_id: string
          owner_id: string
          property_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          offer_id?: string
          owner_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_id: string
          rate: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_id: string
          rate?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_id?: string
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_note: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["complaint_target"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["complaint_target"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["complaint_target"]
          updated_at?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          meta: Json
          path: string | null
          stack: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          meta?: Json
          path?: string | null
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          meta?: Json
          path?: string | null
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          chat_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          chat_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          chat_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          id: string
          message: string | null
          owner_id: string
          price_per_night: number
          property_id: string
          request_id: string
          status: string
          total_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          owner_id: string
          price_per_night: number
          property_id: string
          request_id: string
          status?: string
          total_price: number
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          owner_id?: string
          price_per_night?: number
          property_id?: string
          request_id?: string
          status?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          client_id: string
          created_at: string
          currency: string
          external_id: string | null
          id: string
          meta: Json
          method: Database["public"]["Enums"]["payment_method"]
          owner_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          client_id: string
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          meta?: Json
          method?: Database["public"]["Enums"]["payment_method"]
          owner_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          client_id?: string
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          meta?: Json
          method?: Database["public"]["Enums"]["payment_method"]
          owner_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          destination: string | null
          id: string
          note: string | null
          owner_id: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          destination?: string | null
          id?: string
          note?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          destination?: string | null
          id?: string
          note?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          global_user_id: string | null
          id: string
          is_landlord: boolean
          mode: string
          phone: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          global_user_id?: string | null
          id: string
          is_landlord?: boolean
          mode?: string
          phone?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          global_user_id?: string | null
          id?: string
          is_landlord?: boolean
          mode?: string
          phone?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[]
          area: number | null
          beds: number | null
          city: string
          created_at: string
          currency: string
          description: string | null
          district: string | null
          guests: number | null
          id: string
          lat: number | null
          lng: number | null
          owner_id: string
          photos: string[]
          price_per_night: number
          rating: number
          reviews_count: number
          rooms: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[]
          area?: number | null
          beds?: number | null
          city: string
          created_at?: string
          currency?: string
          description?: string | null
          district?: string | null
          guests?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          owner_id: string
          photos?: string[]
          price_per_night: number
          rating?: number
          reviews_count?: number
          rooms?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[]
          area?: number | null
          beds?: number | null
          city?: string
          created_at?: string
          currency?: string
          description?: string | null
          district?: string | null
          guests?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          owner_id?: string
          photos?: string[]
          price_per_night?: number
          rating?: number
          reviews_count?: number
          rooms?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          amenities: string[]
          budget_max: number
          check_in: string
          check_out: string
          city: string
          client_id: string
          created_at: string
          district: string | null
          expires_at: string
          guests: number
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          amenities?: string[]
          budget_max: number
          check_in: string
          check_out: string
          city: string
          client_id: string
          created_at?: string
          district?: string | null
          expires_at?: string
          guests?: number
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          amenities?: string[]
          budget_max?: number
          check_in?: string
          check_out?: string
          city?: string
          client_id?: string
          created_at?: string
          district?: string | null
          expires_at?: string
          guests?: number
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          booking_id: string
          created_at: string
          id: string
          property_id: string
          rating: number
          text: string | null
        }
        Insert: {
          author_id: string
          booking_id: string
          created_at?: string
          id?: string
          property_id: string
          rating: number
          text?: string | null
        }
        Update: {
          author_id?: string
          booking_id?: string
          created_at?: string
          id?: string
          property_id?: string
          rating?: number
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      verification_requests: {
        Row: {
          created_at: string
          doc_url: string
          id: string
          review_note: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_url: string
          id?: string
          review_note?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_url?: string
          id?: string
          review_note?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      owner_ratings: {
        Row: {
          avg_rating: number | null
          owner_id: string | null
          reviews_count: number | null
        }
        Relationships: []
      }
      property_ratings: {
        Row: {
          avg_rating: number | null
          property_id: string | null
          reviews_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_review_booking: { Args: { _booking_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_property_available: {
        Args: {
          _check_in: string
          _check_out: string
          _exclude_booking_id?: string
          _property_id: string
        }
        Returns: boolean
      }
      is_request_client: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      complaint_status: "open" | "reviewing" | "resolved" | "rejected"
      complaint_target: "property" | "owner" | "client"
      notification_type:
        | "message"
        | "offer_new"
        | "offer_accepted"
        | "offer_declined"
        | "booking_created"
        | "booking_cancelled"
        | "verification_update"
      payment_method: "card" | "kaspi" | "jasyn_wallet" | "manual"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      payout_status: "pending" | "paid" | "failed"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      complaint_status: ["open", "reviewing", "resolved", "rejected"],
      complaint_target: ["property", "owner", "client"],
      notification_type: [
        "message",
        "offer_new",
        "offer_accepted",
        "offer_declined",
        "booking_created",
        "booking_cancelled",
        "verification_update",
      ],
      payment_method: ["card", "kaspi", "jasyn_wallet", "manual"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      payout_status: ["pending", "paid", "failed"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
