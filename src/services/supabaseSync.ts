/**
 * Supabase Sync Service
 * Handles syncing user data and videos between TikTok API and Supabase
 */

import { supabase } from "../lib/supabase";
import type {
  User,
  DailyPostInsert,
  LeaderboardEntry,
  UserStats,
} from "../lib/database.types";
import { TikTokVideo } from "./tiktokVideos";

// Type helpers for when Supabase isn't fully configured
type SupabaseResponse<T> = { data: T | null; error: any };

// ============================================
// USER MANAGEMENT
// ============================================

interface UserData {
  tiktokUserId: string;
  tiktokHandle: string; // @username
  displayName?: string; // Display name
  avatarUrl?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Create or update user on login
 */
export async function upsertUser(userData: UserData): Promise<User | null> {
  try {
    console.log("📝 Upserting user to Supabase:", userData.tiktokHandle);
    console.log(
      "📝 User data:",
      JSON.stringify({
        tiktok_user_id: userData.tiktokUserId,
        tiktok_handle: userData.tiktokHandle,
        avatar_url: userData.avatarUrl ? "✓ has avatar" : "✗ no avatar",
      })
    );

    const tokenExpiresAt = new Date(
      Date.now() + userData.expiresIn * 1000
    ).toISOString();

    const payload = {
      tiktok_user_id: userData.tiktokUserId,
      tiktok_handle: userData.tiktokHandle,
      display_name: userData.displayName || userData.tiktokHandle,
      avatar_url: userData.avatarUrl,
      access_token: userData.accessToken,
      refresh_token: userData.refreshToken,
      token_expires_at: tokenExpiresAt,
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("📤 Sending to Supabase...");

    const { data, error } = (await (supabase.from("users") as any)
      .upsert(payload, { onConflict: "tiktok_user_id" })
      .select()
      .single()) as SupabaseResponse<User>;

    if (error) {
      console.error("❌ Error upserting user:", JSON.stringify(error, null, 2));
      console.error("❌ Error code:", error.code);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error details:", error.details);
      return null;
    }

    console.log("✅ User upserted successfully!");
    console.log("✅ User ID:", data?.id);
    console.log("✅ Full response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("❌ Exception upserting user:", error);
    return null;
  }
}

/**
 * Get user by TikTok user ID
 */
export async function getUserByTikTokId(
  tiktokUserId: string
): Promise<User | null> {
  try {
    const { data, error } = (await (supabase.from("users") as any)
      .select("*")
      .eq("tiktok_user_id", tiktokUserId)
      .single()) as SupabaseResponse<User>;

    if (error) {
      console.error("❌ Error fetching user:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Exception fetching user:", error);
    return null;
  }
}

// ============================================
// VIDEO SYNC
// ============================================

/**
 * Sync TikTok videos to daily_posts table
 * Only stores one post per day (the first one we encounter)
 */
export async function syncVideosToDatabase(
  userId: string,
  videos: TikTokVideo[]
): Promise<{ synced: number; errors: number }> {
  try {
    console.log(`📹 Syncing ${videos.length} videos for user ${userId}`);

    let synced = 0;
    let errors = 0;

    // Group videos by date (take first video per day)
    const videosByDate = new Map<string, TikTokVideo>();

    for (const video of videos) {
      if (!video.create_time) continue;

      const date = new Date(video.create_time * 1000)
        .toISOString()
        .split("T")[0];

      // Only keep the first video for each date
      if (!videosByDate.has(date)) {
        videosByDate.set(date, video);
      }
    }

    // Insert each unique date
    for (const [date, video] of videosByDate) {
      const post: DailyPostInsert = {
        user_id: userId,
        post_date: date,
        video_id: video.id,
        cover_image_url: video.cover_image_url,
      };

      const { error } = await (supabase.from("daily_posts") as any).upsert(
        post,
        {
          onConflict: "user_id,post_date",
          ignoreDuplicates: true,
        }
      );

      if (error) {
        console.error(`❌ Error syncing video for ${date}:`, error);
        errors++;
      } else {
        synced++;
      }
    }

    console.log(`✅ Synced ${synced} days, ${errors} errors`);
    return { synced, errors };
  } catch (error) {
    console.error("❌ Exception syncing videos:", error);
    return { synced: 0, errors: 1 };
  }
}

/**
 * Trigger stats recalculation after syncing videos
 */
export async function recalculateUserStats(userId: string): Promise<boolean> {
  try {
    console.log("📊 Recalculating stats for user:", userId);

    const { error } = await (supabase.rpc as any)("calculate_user_stats", {
      p_user_id: userId,
    });

    if (error) {
      console.error("❌ Error recalculating stats:", error);
      return false;
    }

    console.log("✅ Stats recalculated successfully");
    return true;
  } catch (error) {
    console.error("❌ Exception recalculating stats:", error);
    return false;
  }
}

/**
 * Full sync: videos + stats recalculation
 */
export async function fullSyncForUser(
  userId: string,
  videos: TikTokVideo[]
): Promise<boolean> {
  try {
    // Step 1: Sync videos
    const { synced, errors } = await syncVideosToDatabase(userId, videos);

    if (errors > 0 && synced === 0) {
      console.error("❌ All video syncs failed");
      return false;
    }

    // Step 2: Recalculate stats
    const statsUpdated = await recalculateUserStats(userId);

    return statsUpdated;
  } catch (error) {
    console.error("❌ Full sync failed:", error);
    return false;
  }
}

// ============================================
// LEADERBOARD
// ============================================

/**
 * Fetch leaderboard from Supabase
 */
export async function fetchLeaderboard(
  sortBy: "streak" | "uptime" = "streak",
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  try {
    console.log("🏆 Fetching leaderboard from Supabase");

    const orderColumn =
      sortBy === "streak" ? "rank_by_streak" : "rank_by_uptime";

    const { data, error } = (await (supabase.from("leaderboard") as any)
      .select("*")
      .order(orderColumn, { ascending: true })
      .limit(limit)) as SupabaseResponse<LeaderboardEntry[]>;

    if (error) {
      console.error("❌ Error fetching leaderboard:", error);
      return [];
    }

    console.log(`✅ Fetched ${data?.length || 0} leaderboard entries`);
    return data || [];
  } catch (error) {
    console.error("❌ Exception fetching leaderboard:", error);
    return [];
  }
}

/**
 * Get user's rank on the leaderboard
 */
export async function getUserRank(
  userId: string
): Promise<{ rankByStreak: number; rankByUptime: number } | null> {
  try {
    const { data, error } = (await (supabase.from("leaderboard") as any)
      .select("rank_by_streak, rank_by_uptime")
      .eq("id", userId)
      .single()) as SupabaseResponse<{
      rank_by_streak: number;
      rank_by_uptime: number;
    }>;

    if (error) {
      console.error("❌ Error fetching user rank:", error);
      return null;
    }

    return {
      rankByStreak: data?.rank_by_streak || 0,
      rankByUptime: data?.rank_by_uptime || 0,
    };
  } catch (error) {
    console.error("❌ Exception fetching user rank:", error);
    return null;
  }
}

// ============================================
// USER STATS
// ============================================

/**
 * Get user stats from Supabase (cached version)
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const { data, error } = (await (supabase.from("user_stats") as any)
      .select("*")
      .eq("user_id", userId)
      .single()) as SupabaseResponse<UserStats>;

    if (error) {
      console.error("❌ Error fetching user stats:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Exception fetching user stats:", error);
    return null;
  }
}

/**
 * Get user's daily posts for calendar view
 */
export async function getUserDailyPosts(
  userId: string,
  days: number = 30
): Promise<Set<string>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = (await (supabase.from("daily_posts") as any)
      .select("post_date")
      .eq("user_id", userId)
      .gte(
        "post_date",
        startDate.toISOString().split("T")[0]
      )) as SupabaseResponse<{ post_date: string }[]>;

    if (error) {
      console.error("❌ Error fetching daily posts:", error);
      return new Set();
    }

    return new Set(data?.map((p) => p.post_date) || []);
  } catch (error) {
    console.error("❌ Exception fetching daily posts:", error);
    return new Set();
  }
}
