/**
 * TikTok Video List API Service
 * Fetches user's public videos to calculate uptime and streak
 * https://developers.tiktok.com/doc/tiktok-api-v2-video-list
 */

const TIKTOK_VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";

// Video fields we want to fetch
const VIDEO_FIELDS = [
  "id",
  "create_time",
  "cover_image_url",
  "title",
  "video_description",
].join(",");

export interface TikTokVideo {
  id: string;
  create_time: number; // Unix timestamp in seconds
  cover_image_url?: string;
  title?: string;
  video_description?: string;
}

export interface VideoListResponse {
  videos: TikTokVideo[];
  cursor?: number;
  hasMore: boolean;
  error?: string;
}

export interface UptimeStats {
  currentStreak: number;
  longestStreak: number;
  uptimePercentage: number;
  totalDays: number;
  daysPosted: number;
  postedToday: boolean;
  recentVideos: TikTokVideo[];
  postDates: Set<string>; // For calendar view
}

/**
 * Fetch videos from TikTok API
 */
export async function fetchUserVideos(
  accessToken: string,
  cursor?: number,
  maxCount: number = 20
): Promise<VideoListResponse> {
  try {
    const url = `${TIKTOK_VIDEO_LIST_URL}?fields=${VIDEO_FIELDS}`;
    
    const body: { max_count: number; cursor?: number } = {
      max_count: maxCount,
    };
    
    if (cursor) {
      body.cursor = cursor;
    }

    console.log("📹 Fetching videos from TikTok...");
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("📥 Video list response status:", response.status);

    // Check for errors (TikTok returns error.code = "ok" on success)
    const hasError = data.error && data.error.code && data.error.code !== "ok";
    if (!response.ok || hasError) {
      console.error("❌ Video list error:", data);
      return {
        videos: [],
        hasMore: false,
        error: data.error?.message || "Failed to fetch videos",
      };
    }

    const videos = data.data?.videos || [];
    console.log(`✅ Fetched ${videos.length} videos`);

    return {
      videos,
      cursor: data.data?.cursor,
      hasMore: data.data?.has_more || false,
    };
  } catch (error) {
    console.error("❌ Error fetching videos:", error);
    return {
      videos: [],
      hasMore: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch all videos (paginated) up to a limit
 */
export async function fetchAllUserVideos(
  accessToken: string,
  maxVideos: number = 100
): Promise<TikTokVideo[]> {
  const allVideos: TikTokVideo[] = [];
  let cursor: number | undefined;
  let hasMore = true;

  while (hasMore && allVideos.length < maxVideos) {
    const result = await fetchUserVideos(accessToken, cursor);
    
    if (result.error) {
      console.error("Error fetching videos:", result.error);
      break;
    }

    allVideos.push(...result.videos);
    cursor = result.cursor;
    hasMore = result.hasMore;

    // Small delay to avoid rate limiting
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return allVideos;
}

/**
 * Get date string in YYYY-MM-DD format from timestamp
 */
function getDateString(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  return date.toISOString().split("T")[0];
}

/**
 * Get today's date string
 */
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calculate uptime stats from videos
 */
export function calculateUptimeStats(
  videos: TikTokVideo[],
  daysToAnalyze: number = 30
): UptimeStats {
  // Get unique post dates
  const postDates = new Set<string>();
  for (const video of videos) {
    if (video.create_time) {
      postDates.add(getDateString(video.create_time));
    }
  }

  const today = getTodayString();
  const postedToday = postDates.has(today);

  // Calculate days in the analysis period
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysToAnalyze + 1);

  // Count days posted in the period
  let daysPosted = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= now) {
    const dateStr = currentDate.toISOString().split("T")[0];
    if (postDates.has(dateStr)) {
      daysPosted++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate uptime percentage
  const uptimePercentage = Math.round((daysPosted / daysToAnalyze) * 100);

  // Calculate current streak (consecutive days ending today or yesterday)
  let currentStreak = 0;
  const checkDate = new Date(now);
  
  // If no post today, start from yesterday
  if (!postedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (postDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = Array.from(postDates).sort();
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Get recent videos (sorted by create_time descending)
  const recentVideos = [...videos]
    .sort((a, b) => (b.create_time || 0) - (a.create_time || 0))
    .slice(0, 5);

  return {
    currentStreak,
    longestStreak,
    uptimePercentage,
    totalDays: daysToAnalyze,
    daysPosted,
    postedToday,
    recentVideos,
    postDates,
  };
}

