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
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          name: string
          note: string | null
          position: number
          poster: string | null
          slug: string
          source: string
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          name: string
          note?: string | null
          position?: number
          poster?: string | null
          slug: string
          source?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          position?: number
          poster?: string | null
          slug?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          share_code: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          share_code?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          share_code?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          name: string
          poster: string | null
          slug: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          poster?: string | null
          slug: string
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          poster?: string | null
          slug?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      movie_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          slug: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          slug: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          slug?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "movie_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_ratings: {
        Row: {
          created_at: string
          id: string
          name: string
          poster: string | null
          score: number
          slug: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          poster?: string | null
          score: number
          slug: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          poster?: string | null
          score?: number
          slug?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          poster: string | null
          read: boolean
          slug: string | null
          source: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          poster?: string | null
          read?: boolean
          slug?: string | null
          source?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          poster?: string | null
          read?: boolean
          slug?: string | null
          source?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      series_follows: {
        Row: {
          created_at: string
          id: string
          known_episodes: number
          last_checked_at: string | null
          name: string
          poster: string | null
          slug: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          known_episodes?: number
          last_checked_at?: string | null
          name: string
          poster?: string | null
          slug: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          known_episodes?: number
          last_checked_at?: string | null
          name?: string
          poster?: string | null
          slug?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      view_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          lang: string
          name: string
          poster: string | null
          slug: string
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          lang?: string
          name: string
          poster?: string | null
          slug: string
          source?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          lang?: string
          name?: string
          poster?: string | null
          slug?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          duration_seconds: number
          ep_index: number
          episode_name: string | null
          episode_slug: string | null
          finished: boolean
          id: string
          name: string
          position_seconds: number
          poster: string | null
          slug: string
          source: string
          srv_index: number
          user_id: string
          watched_at: string
        }
        Insert: {
          duration_seconds?: number
          ep_index?: number
          episode_name?: string | null
          episode_slug?: string | null
          finished?: boolean
          id?: string
          name: string
          position_seconds?: number
          poster?: string | null
          slug: string
          source?: string
          srv_index?: number
          user_id: string
          watched_at?: string
        }
        Update: {
          duration_seconds?: number
          ep_index?: number
          episode_name?: string | null
          episode_slug?: string | null
          finished?: boolean
          id?: string
          name?: string
          position_seconds?: number
          poster?: string | null
          slug?: string
          source?: string
          srv_index?: number
          user_id?: string
          watched_at?: string
        }
        Relationships: []
      }
      watch_parties: {
        Row: {
          chat_mode: string
          closed: boolean
          code: string
          created_at: string
          ep_index: number
          host_id: string
          id: string
          is_playing: boolean
          name: string
          position_seconds: number
          poster: string | null
          slug: string
          source: string
          srv_index: number
          updated_at: string
        }
        Insert: {
          chat_mode?: string
          closed?: boolean
          code: string
          created_at?: string
          ep_index?: number
          host_id: string
          id?: string
          is_playing?: boolean
          name: string
          position_seconds?: number
          poster?: string | null
          slug: string
          source?: string
          srv_index?: number
          updated_at?: string
        }
        Update: {
          chat_mode?: string
          closed?: boolean
          code?: string
          created_at?: string
          ep_index?: number
          host_id?: string
          id?: string
          is_playing?: boolean
          name?: string
          position_seconds?: number
          poster?: string | null
          slug?: string
          source?: string
          srv_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      watch_party_messages: {
        Row: {
          content: string
          created_at: string
          display_name: string | null
          id: string
          party_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          party_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          party_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_party_messages_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "watch_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          name: string
          note: string | null
          poster: string | null
          slug: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          note?: string | null
          poster?: string | null
          slug: string
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          poster?: string | null
          slug?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gold_board: {
        Args: { _kind?: string; _limit?: number; _period?: string }
        Returns: {
          kind: string
          name: string
          poster: string
          prev_rank: number
          rank: number
          slug: string
          source: string
          views: number
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
