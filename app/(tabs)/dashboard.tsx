import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
  Pressable,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography } from "../../src/theme";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  fetchAllUserVideos,
  calculateUptimeStats,
  UptimeStats,
  TikTokVideo,
} from "../../src/services/tiktokVideos";
import { fullSyncForUser } from "../../src/services/supabaseSync";

// Open video in TikTok app or browser
const openTikTokVideo = (videoId: string) => {
  // Try TikTok app first, fall back to web
  const tiktokAppUrl = `tiktok://video/${videoId}`;
  const tiktokWebUrl = `https://www.tiktok.com/@/video/${videoId}`;

  Linking.canOpenURL(tiktokAppUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(tiktokAppUrl);
      } else {
        Linking.openURL(tiktokWebUrl);
      }
    })
    .catch(() => {
      Linking.openURL(tiktokWebUrl);
    });
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<UptimeStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    if (!user?.accessToken) {
      setError("Not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const videos = await fetchAllUserVideos(user.accessToken, 100);
      const uptimeStats = calculateUptimeStats(videos, 30);
      setStats(uptimeStats);

      // Sync to Supabase in background (non-blocking)
      if (user.id && videos.length > 0) {
        fullSyncForUser(user.id, videos).then((success) => {
          if (success) {
            console.log("✅ Synced to Supabase");
          } else {
            console.warn("⚠️ Supabase sync failed (non-critical)");
          }
        });
      }
    } catch (err) {
      console.error("Error loading videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.accessToken, user?.id]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadVideos();
  }, [loadVideos]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Format large numbers (1000 -> 1K, 1000000 -> 1M)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              Hey, {user?.displayName || "Creator"}!
            </Text>
            <Text style={styles.subtitle}>
              {stats?.currentStreak && stats.currentStreak >= 7
                ? "You're on fire! A whole week of consistency! 🔥"
                : stats?.currentStreak && stats.currentStreak >= 3
                ? "Great momentum! Keep pushing! 💪"
                : stats?.postedToday
                ? "Nice work today! ✨"
                : "Ready to post today? 🎬"}
            </Text>
          </View>
          {user?.avatarUrl && (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.headerAvatar}
            />
          )}
        </View>

        {error && (
          <Pressable onPress={onRefresh} style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        )}

        {/* Hero Stats Card */}
        <LinearGradient
          colors={["#FF0050", "#FF3366", "#FF6B8A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>CURRENT STREAK</Text>
              <View style={styles.streakRow}>
                <Text style={styles.heroNumber}>
                  {stats?.currentStreak || 0}
                </Text>
                <Text style={styles.heroDays}>days</Text>
              </View>
              <Text style={styles.heroSubtext}>
                {stats?.postedToday
                  ? "You posted today! ✓"
                  : "Post today to keep it going!"}
              </Text>
            </View>
            <View style={styles.heroRight}>
              <View style={styles.flameContainer}>
                <Text style={styles.flameEmoji}>🔥</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Streak Calendar */}
        <StreakCalendar
          postDates={stats?.postDates}
          daysPosted={stats?.daysPosted || 0}
          totalDays={stats?.totalDays || 30}
        />

        {/* Quick Stats Row */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <LinearGradient
              colors={["#00F2EA", "#00D4AA"]}
              style={styles.quickStatIcon}
            >
              <Ionicons name="trending-up" size={16} color="#000" />
            </LinearGradient>
            <Text style={styles.quickStatValue}>
              {stats?.uptimePercentage || 0}%
            </Text>
            <Text style={styles.quickStatLabel}>Uptime</Text>
          </View>

          <View style={styles.quickStatDivider} />

          <View style={styles.quickStatItem}>
            <LinearGradient
              colors={["#FFB800", "#FF8C00"]}
              style={styles.quickStatIcon}
            >
              <Ionicons name="eye" size={16} color="#000" />
            </LinearGradient>
            <Text style={styles.quickStatValue}>
              {formatNumber(stats?.streakViews || 0)}
            </Text>
            <Text style={styles.quickStatLabel}>Streak Views</Text>
          </View>

          <View style={styles.quickStatDivider} />

          <View style={styles.quickStatItem}>
            <LinearGradient
              colors={["#A855F7", "#7C3AED"]}
              style={styles.quickStatIcon}
            >
              <Ionicons name="heart" size={16} color="#FFF" />
            </LinearGradient>
            <Text style={styles.quickStatValue}>
              {formatNumber(stats?.streakLikes || 0)}
            </Text>
            <Text style={styles.quickStatLabel}>Streak Likes</Text>
          </View>
        </View>

        {/* Recent Posts */}
        {stats?.recentVideos && stats.recentVideos.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Posts</Text>
              <Text style={styles.sectionCount}>
                {stats.recentVideos.length} videos
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.videosContainer}
            >
              {stats.recentVideos.map((video, index) => (
                <VideoThumbnail
                  key={video.id}
                  video={video}
                  formatDate={formatDate}
                  index={index}
                />
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Generate calendar grid with proper week alignment
function generateCalendarWeeks(numWeeks: number): string[][] {
  const weeks: string[][] = [];
  const today = new Date();

  // Start from the beginning of the week, numWeeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - numWeeks * 7 + (7 - today.getDay()));

  for (let week = 0; week < numWeeks; week++) {
    const weekDays: string[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + week * 7 + day);
      weekDays.push(date.toISOString().split("T")[0]);
    }
    weeks.push(weekDays);
  }

  return weeks;
}

function StreakCalendar({
  postDates,
  daysPosted,
  totalDays,
}: {
  postDates?: Set<string>;
  daysPosted: number;
  totalDays: number;
}) {
  const weeks = generateCalendarWeeks(3);
  const today = new Date().toISOString().split("T")[0];
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>Activity</Text>
        <Text style={styles.calendarSubtitle}>Last 3 weeks</Text>
      </View>

      {/* Day labels */}
      <View style={styles.calendarRow}>
        {dayLabels.map((label, index) => (
          <View key={index} style={styles.calendarCell}>
            <Text style={styles.calendarDayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar weeks */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.calendarRow}>
          {week.map((dateStr) => {
            const isPosted = postDates?.has(dateStr);
            const isToday = dateStr === today;
            const isFuture = dateStr > today;

            return (
              <View key={dateStr} style={styles.calendarCell}>
                <View
                  style={[
                    styles.calendarDay,
                    isFuture && styles.calendarDayFuture,
                    !isFuture &&
                      !isPosted &&
                      !isToday &&
                      styles.calendarDayEmpty,
                    isPosted && styles.calendarDayPosted,
                    isToday && !isPosted && styles.calendarDayToday,
                    isToday && isPosted && styles.calendarDayTodayPosted,
                  ]}
                >
                  {isPosted && <View style={styles.calendarDayFill} />}
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend and Days Posted */}
      <View style={styles.calendarFooter}>
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.calendarDayEmpty]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.calendarDayPosted]}>
              <View style={styles.legendDotFill} />
            </View>
            <Text style={styles.legendText}>Posted</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.calendarDayToday]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
        <Text style={styles.daysPostedText}>
          {daysPosted}/{totalDays} days
        </Text>
      </View>
    </View>
  );
}

function VideoThumbnail({
  video,
  formatDate,
  index,
}: {
  video: TikTokVideo;
  formatDate: (ts: number) => string;
  index: number;
}) {
  const handlePress = () => {
    if (video.id) {
      openTikTokVideo(video.id);
    }
  };

  return (
    <Pressable
      style={[styles.videoItem, index === 0 && { marginLeft: 0 }]}
      onPress={handlePress}
    >
      {video.cover_image_url ? (
        <Image
          source={{ uri: video.cover_image_url }}
          style={styles.videoThumbnail}
        />
      ) : (
        <View style={[styles.videoThumbnail, styles.videoPlaceholder]}>
          <Ionicons name="videocam" size={28} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.videoOverlay}>
        <View style={styles.videoOverlayContent}>
          <Text style={styles.videoDate}>
            {video.create_time ? formatDate(video.create_time) : "—"}
          </Text>
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing["2xl"],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSize["xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.error + "15",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  retryText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  heroCard: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  // Streak Calendar styles
  calendarContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  calendarTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  calendarSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  calendarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 0,
    marginBottom: 4,
  },
  calendarCell: {
    flex: 1,
    alignItems: "center",
  },
  calendarDayLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 4,
  },
  calendarDay: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  calendarDayEmpty: {
    backgroundColor: colors.backgroundTertiary,
  },
  calendarDayFuture: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderWidth: 1,
    opacity: 0.3,
  },
  calendarDayPosted: {
    backgroundColor: colors.primary + "30",
    borderColor: colors.primary,
  },
  calendarDayToday: {
    backgroundColor: colors.accent + "20",
    borderColor: colors.accent,
  },
  calendarDayTodayPosted: {
    backgroundColor: colors.primary + "30",
    borderColor: colors.accent,
  },
  calendarDayFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  calendarFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  calendarLegend: {
    flexDirection: "row",
    gap: spacing.md,
  },
  daysPostedText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  legendDotFill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  legendText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  heroNumber: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: "#FFF",
    lineHeight: 52,
  },
  heroDays: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: "rgba(255,255,255,0.9)",
    marginLeft: spacing.sm,
  },
  heroSubtext: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.85)",
    marginTop: spacing.xs,
  },
  heroRight: {
    marginLeft: spacing.lg,
  },
  flameContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  flameEmoji: {
    fontSize: 28,
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quickStatItem: {
    flex: 1,
    alignItems: "center",
  },
  quickStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  quickStatValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  quickStatLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  sectionCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  videosContainer: {
    paddingBottom: spacing.md,
  },
  videoItem: {
    marginLeft: spacing.md,
    position: "relative",
  },
  videoThumbnail: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: colors.surfaceDark,
  },
  videoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  videoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  videoOverlayContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoDate: {
    fontSize: typography.fontSize.xs,
    color: "#FFF",
    fontWeight: typography.fontWeight.medium,
  },
});
