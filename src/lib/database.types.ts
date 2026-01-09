// Database types for Supabase
// These match the schema in supabase/schema.sql

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          tiktok_user_id: string;
          tiktok_handle: string | null;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string | null;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          created_at: string;
          updated_at: string;
          last_login_at: string;
        };
        Insert: {
          id?: string;
          tiktok_user_id: string;
          tiktok_handle?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string;
        };
        Update: {
          id?: string;
          tiktok_user_id?: string;
          tiktok_handle?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string;
        };
      };
      daily_posts: {
        Row: {
          id: string;
          user_id: string;
          post_date: string;
          video_id: string | null;
          video_url: string | null;
          cover_image_url: string | null;
          verified_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_date: string;
          video_id?: string | null;
          video_url?: string | null;
          cover_image_url?: string | null;
          verified_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_date?: string;
          video_id?: string | null;
          video_url?: string | null;
          cover_image_url?: string | null;
          verified_at?: string;
        };
      };
      user_stats: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          uptime_30d: number;
          days_posted_30d: number;
          total_posts: number;
          last_post_date: string | null;
          last_synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          uptime_30d?: number;
          days_posted_30d?: number;
          total_posts?: number;
          last_post_date?: string | null;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          uptime_30d?: number;
          days_posted_30d?: number;
          total_posts?: number;
          last_post_date?: string | null;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          source?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          id: string;
          tiktok_user_id: string;
          tiktok_handle: string | null;
          avatar_url: string | null;
          current_streak: number;
          longest_streak: number;
          uptime_30d: number;
          days_posted_30d: number;
          total_posts: number;
          last_post_date: string | null;
          last_synced_at: string;
          rank_by_streak: number;
          rank_by_uptime: number;
        };
      };
    };
    Functions: {
      calculate_user_stats: {
        Args: { p_user_id: string };
        Returns: void;
      };
    };
  };
}

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type DailyPost = Database["public"]["Tables"]["daily_posts"]["Row"];
export type DailyPostInsert =
  Database["public"]["Tables"]["daily_posts"]["Insert"];
export type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];
export type LeaderboardEntry =
  Database["public"]["Views"]["leaderboard"]["Row"];
