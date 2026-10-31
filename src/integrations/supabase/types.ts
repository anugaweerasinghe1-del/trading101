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
      api_rate_limits: {
        Row: {
          bucket: string
          expires_at: string
          request_count: number
          subject: string
          window_start: string
        }
        Insert: {
          bucket: string
          expires_at: string
          request_count?: number
          subject: string
          window_start: string
        }
        Update: {
          bucket?: string
          expires_at?: string
          request_count?: number
          subject?: string
          window_start?: string
        }
        Relationships: []
      }
      duels: {
        Row: {
          score_mode: string
          settled_at: string | null
          creator_cycle_id: string | null
          opponent_cycle_id: string | null
          creator_final_value: number | null
          opponent_final_value: number | null

          code: string
          created_at: string
          creator_id: string
          creator_start_value: number
          ends_at: string
          id: string
          opponent_id: string | null
          opponent_start_value: number | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          score_mode?: string
          settled_at?: string | null
          creator_cycle_id?: string | null
          opponent_cycle_id?: string | null
          creator_final_value?: number | null
          opponent_final_value?: number | null

          code: string
          created_at?: string
          creator_id: string
          creator_start_value?: number
          ends_at?: string
          id?: string
          opponent_id?: string | null
          opponent_start_value?: number | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          score_mode?: string
          settled_at?: string | null
          creator_cycle_id?: string | null
          opponent_cycle_id?: string | null
          creator_final_value?: number | null
          opponent_final_value?: number | null

          code?: string
          created_at?: string
          creator_id?: string
          creator_start_value?: number
          ends_at?: string
          id?: string
          opponent_id?: string | null
          opponent_start_value?: number | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_articles: {
        Row: {
          is_published: boolean
          content: string
          created_at: string
          focus_asset: string
          id: string
          sentiment: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          is_published?: boolean
          content?: string
          created_at?: string
          focus_asset: string
          id?: string
          sentiment?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          is_published?: boolean
          content?: string
          created_at?: string
          focus_asset?: string
          id?: string
          sentiment?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          asset_id: string
          price: number
          source: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          price: number
          source?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          price?: number
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      practice_portfolios: {
        Row: {
          cash: number
          created_at: string
          realized_pnl: number
          trades_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cash?: number
          created_at?: string
          realized_pnl?: number
          trades_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cash?: number
          created_at?: string
          realized_pnl?: number
          trades_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_positions: {
        Row: {
          asset_id: string
          asset_type: string
          avg_price: number
          created_at: string
          last_price: number
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          asset_type: string
          avg_price: number
          created_at?: string
          last_price: number
          quantity: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          asset_type?: string
          avg_price?: number
          created_at?: string
          last_price?: number
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          country: string | null
          created_at: string
          id: string
          is_public: boolean
          show_public_trades: boolean
          updated_at: string
          username: string
        }
        Insert: {
          bio?: string | null
          country?: string | null
          created_at?: string
          id: string
          is_public?: boolean
          show_public_trades?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          bio?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          show_public_trades?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          owner_reply: string | null
          owner_reply_updated_at: string | null
          deleted_at: string | null
          content: string
          created_at: string
          id: string
          ip_hash: string
          is_featured: boolean
          is_visible: boolean
          name: string | null
          rating: number
          updated_at: string
        }
        Insert: {
          owner_reply?: string | null
          owner_reply_updated_at?: string | null
          deleted_at?: string | null
          content: string
          created_at?: string
          id?: string
          ip_hash: string
          is_featured?: boolean
          is_visible?: boolean
          name?: string | null
          rating?: number
          updated_at?: string
        }
        Update: {
          owner_reply?: string | null
          owner_reply_updated_at?: string | null
          deleted_at?: string | null
          content?: string
          created_at?: string
          id?: string
          ip_hash?: string
          is_featured?: boolean
          is_visible?: boolean
          name?: string | null
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          email: string
          id: string
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      trader_stats: {
        Row: {
          badges: number
          created_at: string
          max_drawdown: number
          pnl_pct: number
          portfolio_value: number
          trades: number
          updated_at: string
          user_id: string
          win_rate: number
        }
        Insert: {
          badges?: number
          created_at?: string
          max_drawdown?: number
          pnl_pct?: number
          portfolio_value?: number
          trades?: number
          updated_at?: string
          user_id: string
          win_rate?: number
        }
        Update: {
          badges?: number
          created_at?: string
          max_drawdown?: number
          pnl_pct?: number
          portfolio_value?: number
          trades?: number
          updated_at?: string
          user_id?: string
          win_rate?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_review_engagement: {
        Args: { p_review_ids?: string[] }
        Returns: { review_id: string; like_count: number; liked_by_me: boolean }[]
      }
      set_review_like: {
        Args: { p_review_id: string; p_liked: boolean }
        Returns: { review_id: string; like_count: number; liked_by_me: boolean }[]
      }
      get_public_practice_members: {
        Args: { p_limit?: number; p_username?: string | null }
        Returns: { user_id: string; username: string; country: string | null; portfolio_value: number | null; pnl_pct: number | null; trades: number; portfolio_status: string; practice_rank: number | null; priced_at: string | null; observed_at: string | null; price_status: string }[]
      }

      get_my_account_practice_snapshot: { Args: Record<PropertyKey, never>; Returns: Json }
      export_my_verified_practice_history: { Args: Record<PropertyKey, never>; Returns: Json }
      verify_my_practice_history_export: { Args: { p_document: Json }; Returns: Json }
      get_public_practice_trades: {
        Args: { p_username: string; p_limit?: number }
        Returns: { asset_id: string; side: string; quantity: number; price: number; fee: number; total: number; realized_pnl: number | null; price_source: string; created_at: string }[]
      }
      get_previous_practice_results: {
        Args: { p_limit?: number }
        Returns: { user_id: string; username: string; country: string | null; portfolio_value: number; pnl_pct: number; trades: number; reported_at: string }[]
      }
      get_practice_duel_score: { Args: { p_duel_id: string }; Returns: Json }
      get_public_practice_duels: { Args: { p_limit?: number }; Returns: Json }
      initialize_practice_portfolio: { Args: { p_import?: Json }; Returns: Json }
      record_practice_trade: { Args: { p_asset_id: string; p_side: string; p_quantity: number; p_request_id: string }; Returns: Json }
      start_ranked_practice: { Args: Record<PropertyKey, never>; Returns: Json }
      create_practice_duel: { Args: { p_code: string }; Returns: string }
      get_cloud_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          country: string
          pnl_pct: number
          portfolio_value: number
          priced_at: string
          trades: number
          user_id: string
          username: string
        }[]
      }
      hit_rate_limit: {
        Args: {
          _bucket: string
          _max: number
          _subject: string
          _window_seconds: number
        }
        Returns: boolean
      }
      join_practice_duel: { Args: { p_duel_id: string }; Returns: boolean }
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
    Enums: {},
  },
} as const
