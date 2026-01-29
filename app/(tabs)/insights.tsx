import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Image,
  Linking,
  Dimensions,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography } from "../../src/theme";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  fetchAllUserVideos,
  TikTokVideo,
} from "../../src/services/tiktokVideos";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============================================
// TYPES
// ============================================

interface VideoInsight extends TikTokVideo {
  engagementRate: number;
  likesPerView: number;
  commentsPerView: number;
  sharesPerView: number;
  postingHour: number;
  postingDay: number;
  rank?: number;
}

interface TimeSlotPerformance {
  hour: number;
  label: string;
  avgViews: number;
  avgEngagement: number;
  videoCount: number;
}

interface EngagementCorrelation {
  metric: "likes" | "comments" | "shares";
  correlation: "positive" | "neutral" | "weak";
  insight: string;
}

interface InsightsData {
  topVideos: VideoInsight[];
  allVideos: VideoInsight[];
  bestPostingTimes: TimeSlotPerformance[];
  engagementCorrelations: EngagementCorrelation[];
  recommendations: string[];
  averageViews: number;
  averageLikes: number;
  averageComments: number;
  averageShares: number;
  averageEngagementRate: number;
  totalVideos: number;
  bestDayOfWeek: string;
  bestHour: number;
  bestHourRange: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const openTikTokVideo = (videoId: string) => {
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
    .catch(() => Linking.openURL(tiktokWebUrl));
};

const formatNumber = (num: number): string => {
  if (num >= 1000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getDayName = (dayIndex: number): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayIndex];
};

const getHourLabel = (hour: number): string => {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
};

// ============================================
// DATA PROCESSING
// ============================================

function calculateInsights(videos: TikTokVideo[]): InsightsData {
  if (videos.length === 0) {
    return {
      topVideos: [],
      allVideos: [],
      bestPostingTimes: [],
      engagementCorrelations: [],
      recommendations: ["Start posting to see what works for you."],
      averageViews: 0,
      averageLikes: 0,
      averageComments: 0,
      averageShares: 0,
      averageEngagementRate: 0,
      totalVideos: 0,
      bestDayOfWeek: "—",
      bestHour: 12,
      bestHourRange: "—",
    };
  }

  // Enrich videos with calculated metrics
  const enrichedVideos: VideoInsight[] = videos
    .filter((v) => v.create_time && v.view_count !== undefined)
    .map((video) => {
      const views = video.view_count || 1;
      const likes = video.like_count || 0;
      const comments = video.comment_count || 0;
      const shares = video.share_count || 0;
      const date = new Date(video.create_time * 1000);

      return {
        ...video,
        engagementRate: ((likes + comments + shares) / views) * 100,
        likesPerView: (likes / views) * 100,
        commentsPerView: (comments / views) * 100,
        sharesPerView: (shares / views) * 100,
        postingHour: date.getHours(),
        postingDay: date.getDay(),
      };
    });

  // Sort by views and assign ranks
  const sortedByViews = [...enrichedVideos].sort(
    (a, b) => (b.view_count || 0) - (a.view_count || 0)
  );
  sortedByViews.forEach((video, index) => {
    video.rank = index + 1;
  });

  const topVideos = sortedByViews.slice(0, 5);

  // Calculate averages
  const totalViews = enrichedVideos.reduce(
    (sum, v) => sum + (v.view_count || 0),
    0
  );
  const totalLikes = enrichedVideos.reduce(
    (sum, v) => sum + (v.like_count || 0),
    0
  );
  const totalComments = enrichedVideos.reduce(
    (sum, v) => sum + (v.comment_count || 0),
    0
  );
  const totalShares = enrichedVideos.reduce(
    (sum, v) => sum + (v.share_count || 0),
    0
  );
  const totalEngagement = enrichedVideos.reduce(
    (sum, v) => sum + v.engagementRate,
    0
  );

  const averageViews = Math.round(totalViews / enrichedVideos.length);
  const averageLikes = Math.round(totalLikes / enrichedVideos.length);
  const averageComments = Math.round(totalComments / enrichedVideos.length);
  const averageShares = Math.round(totalShares / enrichedVideos.length);
  const averageEngagementRate = totalEngagement / enrichedVideos.length;

  // Best posting times analysis
  const hourlyPerformance: Map<
    number,
    { views: number[]; engagement: number[] }
  > = new Map();

  for (const video of enrichedVideos) {
    const hour = video.postingHour;
    if (!hourlyPerformance.has(hour)) {
      hourlyPerformance.set(hour, { views: [], engagement: [] });
    }
    hourlyPerformance.get(hour)!.views.push(video.view_count || 0);
    hourlyPerformance.get(hour)!.engagement.push(video.engagementRate);
  }

  const bestPostingTimes: TimeSlotPerformance[] = Array.from(
    hourlyPerformance.entries()
  )
    .map(([hour, data]) => ({
      hour,
      label: getHourLabel(hour),
      avgViews: Math.round(
        data.views.reduce((a, b) => a + b, 0) / data.views.length
      ),
      avgEngagement:
        data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length,
      videoCount: data.views.length,
    }))
    .filter((slot) => slot.videoCount >= 2)
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, 5);

  // Best day of week
  const dayPerformance: Map<number, number[]> = new Map();
  for (const video of enrichedVideos) {
    const day = video.postingDay;
    if (!dayPerformance.has(day)) {
      dayPerformance.set(day, []);
    }
    dayPerformance.get(day)!.push(video.view_count || 0);
  }

  let bestDay = 0;
  let bestDayAvg = 0;
  for (const [day, views] of dayPerformance.entries()) {
    const avg = views.reduce((a, b) => a + b, 0) / views.length;
    if (avg > bestDayAvg) {
      bestDayAvg = avg;
      bestDay = day;
    }
  }

  const bestHour = bestPostingTimes.length > 0 ? bestPostingTimes[0].hour : 12;
  const bestHourRange = `${getHourLabel(bestHour)} - ${getHourLabel(
    (bestHour + 2) % 24
  )}`;

  const engagementCorrelations = calculateEngagementCorrelations(
    enrichedVideos,
    averageViews
  );

  const recommendations = generateRecommendations(
    enrichedVideos,
    topVideos,
    bestPostingTimes,
    bestDay,
    engagementCorrelations
  );

  return {
    topVideos,
    allVideos: sortedByViews,
    bestPostingTimes,
    engagementCorrelations,
    recommendations,
    averageViews,
    averageLikes,
    averageComments,
    averageShares,
    averageEngagementRate,
    totalVideos: enrichedVideos.length,
    bestDayOfWeek: getDayName(bestDay),
    bestHour,
    bestHourRange,
  };
}

function calculateEngagementCorrelations(
  videos: VideoInsight[],
  avgViews: number
): EngagementCorrelation[] {
  if (videos.length < 5) return [];

  const correlations: EngagementCorrelation[] = [];
  const highPerformers = videos.filter((v) => (v.view_count || 0) > avgViews);
  const lowPerformers = videos.filter((v) => (v.view_count || 0) <= avgViews);

  if (highPerformers.length < 2 || lowPerformers.length < 2) return [];

  const highLikesRate =
    highPerformers.reduce((s, v) => s + v.likesPerView, 0) /
    highPerformers.length;
  const lowLikesRate =
    lowPerformers.reduce((s, v) => s + v.likesPerView, 0) /
    lowPerformers.length;

  const highCommentsRate =
    highPerformers.reduce((s, v) => s + v.commentsPerView, 0) /
    highPerformers.length;
  const lowCommentsRate =
    lowPerformers.reduce((s, v) => s + v.commentsPerView, 0) /
    lowPerformers.length;

  const highSharesRate =
    highPerformers.reduce((s, v) => s + v.sharesPerView, 0) /
    highPerformers.length;
  const lowSharesRate =
    lowPerformers.reduce((s, v) => s + v.sharesPerView, 0) /
    lowPerformers.length;

  const likesDiff = ((highLikesRate - lowLikesRate) / lowLikesRate) * 100;
  if (likesDiff > 20) {
    correlations.push({
      metric: "likes",
      correlation: "positive",
      insight: `Your top videos get ${Math.round(
        likesDiff
      )}% more likes per view. High like rates signal content people love.`,
    });
  } else if (likesDiff > 5) {
    correlations.push({
      metric: "likes",
      correlation: "neutral",
      insight:
        "Like rates are similar across your videos. Focus on hooks and watch time instead.",
    });
  }

  const commentsDiff =
    ((highCommentsRate - lowCommentsRate) / Math.max(lowCommentsRate, 0.01)) *
    100;
  if (commentsDiff > 30) {
    correlations.push({
      metric: "comments",
      correlation: "positive",
      insight: `Videos with more comments tend to perform better for you. Try ending with a question or hot take.`,
    });
  } else {
    correlations.push({
      metric: "comments",
      correlation: "weak",
      insight:
        "Comments don't strongly predict your view count. Focus on the first 3 seconds instead.",
    });
  }

  const sharesDiff =
    ((highSharesRate - lowSharesRate) / Math.max(lowSharesRate, 0.01)) * 100;
  if (sharesDiff > 50) {
    correlations.push({
      metric: "shares",
      correlation: "positive",
      insight: `Shares are a strong signal for you — top videos get ${Math.round(
        sharesDiff
      )}% more shares. Make content people want to send to friends.`,
    });
  }

  return correlations;
}

function generateRecommendations(
  videos: VideoInsight[],
  topVideos: VideoInsight[],
  bestTimes: TimeSlotPerformance[],
  bestDay: number,
  correlations: EngagementCorrelation[]
): string[] {
  const recommendations: string[] = [];

  if (videos.length < 5) {
    recommendations.push("Post more videos to unlock personalized insights.");
    return recommendations;
  }

  if (bestTimes.length > 0) {
    const bestTime = bestTimes[0];
    recommendations.push(
      `Your best performing time is around ${
        bestTime.label
      }. Videos posted then average ${formatNumber(bestTime.avgViews)} views.`
    );
  }

  recommendations.push(
    `${getDayName(
      bestDay
    )} is your strongest day. Consider batching content for this day.`
  );

  if (topVideos.length > 0) {
    const topVideo = topVideos[0];
    const topVideoTime = new Date(topVideo.create_time * 1000);
    recommendations.push(
      `Your best video was posted on ${getDayName(
        topVideoTime.getDay()
      )} at ${formatTime(topVideo.create_time)}. What made that timing work?`
    );
  }

  const shareCorrelation = correlations.find(
    (c) => c.metric === "shares" && c.correlation === "positive"
  );
  if (shareCorrelation) {
    recommendations.push(
      "Make shareable content — it's your superpower. Think: relatable, surprising, or useful."
    );
  }

  const commentCorrelation = correlations.find(
    (c) => c.metric === "comments" && c.correlation === "positive"
  );
  if (commentCorrelation) {
    recommendations.push(
      "Your audience wants to talk. End videos with questions or controversial takes."
    );
  }

  return recommendations.slice(0, 4);
}

// ============================================
// VIDEO DETAIL MODAL
// ============================================

interface VideoDetailModalProps {
  video: VideoInsight | null;
  insights: InsightsData | null;
  visible: boolean;
  onClose: () => void;
}

function VideoDetailModal({
  video,
  insights,
  visible,
  onClose,
}: VideoDetailModalProps) {
  if (!video || !insights) return null;

  const viewsVsAvg =
    insights.averageViews > 0
      ? ((video.view_count || 0) / insights.averageViews - 1) * 100
      : 0;
  const likesVsAvg =
    insights.averageLikes > 0
      ? ((video.like_count || 0) / insights.averageLikes - 1) * 100
      : 0;
  const commentsVsAvg =
    insights.averageComments > 0
      ? ((video.comment_count || 0) / insights.averageComments - 1) * 100
      : 0;
  const sharesVsAvg =
    insights.averageShares > 0
      ? ((video.share_count || 0) / insights.averageShares - 1) * 100
      : 0;
  const engagementVsAvg =
    insights.averageEngagementRate > 0
      ? ((video.engagementRate || 0) / insights.averageEngagementRate - 1) * 100
      : 0;

  // Determine performance verdict
  const isTopPerformer = viewsVsAvg > 50;
  const isAboveAverage = viewsVsAvg > 0;
  const isBelowAverage = viewsVsAvg < 0;
  const isUnderperformer = viewsVsAvg < -30;

  // Timing analysis
  const isOptimalTime = video.postingHour === insights.bestHour;
  const isOptimalDay = getDayName(video.postingDay) === insights.bestDayOfWeek;

  // Generate video-specific insights
  const getVideoInsights = (): string[] => {
    const videoInsights: string[] = [];

    if (isTopPerformer) {
      videoInsights.push(
        `🏆 This is one of your top performers — ${Math.round(
          viewsVsAvg
        )}% above your average views.`
      );
    } else if (isAboveAverage) {
      videoInsights.push(
        `✓ This video performed above your average by ${Math.round(
          viewsVsAvg
        )}%.`
      );
    } else if (isUnderperformer) {
      videoInsights.push(
        `This video got ${Math.abs(
          Math.round(viewsVsAvg)
        )}% fewer views than your average. The hook or topic might not have landed.`
      );
    } else if (isBelowAverage) {
      videoInsights.push(
        `Slightly below your average by ${Math.abs(
          Math.round(viewsVsAvg)
        )}%. Not bad, but room to improve.`
      );
    }

    // Timing insights
    if (isOptimalTime && isOptimalDay) {
      videoInsights.push(
        `⏰ Posted at your optimal time (${getHourLabel(
          video.postingHour
        )} on ${getDayName(video.postingDay)}). Timing was on point.`
      );
    } else if (!isOptimalTime && !isOptimalDay) {
      videoInsights.push(
        `Consider posting at ${getHourLabel(insights.bestHour)} on ${
          insights.bestDayOfWeek
        } — that's when your content typically performs best.`
      );
    } else if (!isOptimalTime) {
      videoInsights.push(
        `Your best time is around ${getHourLabel(
          insights.bestHour
        )}. This was posted at ${getHourLabel(video.postingHour)}.`
      );
    }

    // Engagement insights
    if (engagementVsAvg > 30) {
      videoInsights.push(
        `💬 High engagement rate (${video.engagementRate.toFixed(
          1
        )}%). People are interacting with this content.`
      );
    } else if (engagementVsAvg < -30) {
      videoInsights.push(
        `Lower engagement than usual. Try adding a call-to-action or question next time.`
      );
    }

    // Shares insight
    if (sharesVsAvg > 50) {
      videoInsights.push(
        `📤 This video got shared a lot — ${Math.round(
          sharesVsAvg
        )}% more than average. Think about what made it shareable.`
      );
    }

    // Comments insight
    if (commentsVsAvg > 50) {
      videoInsights.push(
        `💭 Sparked conversation — ${Math.round(
          commentsVsAvg
        )}% more comments than usual. This topic resonated.`
      );
    }

    return videoInsights;
  };

  const videoInsights = getVideoInsights();

  const getPerformanceColor = (diff: number) => {
    if (diff > 20) return colors.success;
    if (diff < -20) return colors.error;
    return colors.textSecondary;
  };

  const formatDiff = (diff: number) => {
    if (diff > 0) return `+${Math.round(diff)}%`;
    return `${Math.round(diff)}%`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Pressable onPress={onClose} style={modalStyles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={modalStyles.headerTitle}>Video Breakdown</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={modalStyles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Video Preview */}
          <View style={modalStyles.videoPreview}>
            {video.cover_image_url ? (
              <Image
                source={{ uri: video.cover_image_url }}
                style={modalStyles.thumbnail}
              />
            ) : (
              <View
                style={[
                  modalStyles.thumbnail,
                  modalStyles.thumbnailPlaceholder,
                ]}
              >
                <Ionicons
                  name="videocam"
                  size={40}
                  color={colors.textSecondary}
                />
              </View>
            )}
            <View style={modalStyles.videoMeta}>
              <View style={modalStyles.rankBadge}>
                <Text style={modalStyles.rankText}>#{video.rank}</Text>
              </View>
              <Text style={modalStyles.videoDate}>
                {formatDate(video.create_time)}
              </Text>
              <Text style={modalStyles.videoTime}>
                {getDayName(video.postingDay)} at{" "}
                {formatTime(video.create_time)}
              </Text>
            </View>
          </View>

          {/* Performance Verdict */}
          <View
            style={[
              modalStyles.verdictCard,
              {
                backgroundColor: isTopPerformer
                  ? colors.success + "15"
                  : isAboveAverage
                  ? colors.accent + "15"
                  : isUnderperformer
                  ? colors.error + "15"
                  : colors.backgroundSecondary,
                borderLeftColor: isTopPerformer
                  ? colors.success
                  : isAboveAverage
                  ? colors.accent
                  : isUnderperformer
                  ? colors.error
                  : colors.border,
              },
            ]}
          >
            <Text style={modalStyles.verdictTitle}>
              {isTopPerformer
                ? "🔥 Top Performer"
                : isAboveAverage
                ? "✓ Above Average"
                : isUnderperformer
                ? "Needs Work"
                : "Average"}
            </Text>
            <Text style={modalStyles.verdictText}>
              Ranked #{video.rank} out of {insights.totalVideos} videos
            </Text>
          </View>

          {/* Metrics Grid */}
          <View style={modalStyles.metricsCard}>
            <Text style={modalStyles.sectionTitle}>Performance</Text>

            <View style={modalStyles.metricsGrid}>
              <View style={modalStyles.metricItem}>
                <View style={modalStyles.metricHeader}>
                  <Ionicons
                    name="eye-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={modalStyles.metricLabel}>Views</Text>
                </View>
                <Text style={modalStyles.metricValue}>
                  {formatNumber(video.view_count || 0)}
                </Text>
                <Text
                  style={[
                    modalStyles.metricDiff,
                    { color: getPerformanceColor(viewsVsAvg) },
                  ]}
                >
                  {formatDiff(viewsVsAvg)} vs avg
                </Text>
              </View>

              <View style={modalStyles.metricItem}>
                <View style={modalStyles.metricHeader}>
                  <Ionicons
                    name="heart-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={modalStyles.metricLabel}>Likes</Text>
                </View>
                <Text style={modalStyles.metricValue}>
                  {formatNumber(video.like_count || 0)}
                </Text>
                <Text
                  style={[
                    modalStyles.metricDiff,
                    { color: getPerformanceColor(likesVsAvg) },
                  ]}
                >
                  {formatDiff(likesVsAvg)} vs avg
                </Text>
              </View>

              <View style={modalStyles.metricItem}>
                <View style={modalStyles.metricHeader}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={modalStyles.metricLabel}>Comments</Text>
                </View>
                <Text style={modalStyles.metricValue}>
                  {formatNumber(video.comment_count || 0)}
                </Text>
                <Text
                  style={[
                    modalStyles.metricDiff,
                    { color: getPerformanceColor(commentsVsAvg) },
                  ]}
                >
                  {formatDiff(commentsVsAvg)} vs avg
                </Text>
              </View>

              <View style={modalStyles.metricItem}>
                <View style={modalStyles.metricHeader}>
                  <Ionicons
                    name="share-social-outline"
                    size={16}
                    color={colors.success}
                  />
                  <Text style={modalStyles.metricLabel}>Shares</Text>
                </View>
                <Text style={modalStyles.metricValue}>
                  {formatNumber(video.share_count || 0)}
                </Text>
                <Text
                  style={[
                    modalStyles.metricDiff,
                    { color: getPerformanceColor(sharesVsAvg) },
                  ]}
                >
                  {formatDiff(sharesVsAvg)} vs avg
                </Text>
              </View>
            </View>

            {/* Engagement Rate */}
            <View style={modalStyles.engagementRow}>
              <Text style={modalStyles.engagementLabel}>Engagement Rate</Text>
              <View style={modalStyles.engagementValue}>
                <Text style={modalStyles.engagementNumber}>
                  {video.engagementRate.toFixed(2)}%
                </Text>
                <Text
                  style={[
                    modalStyles.engagementDiff,
                    { color: getPerformanceColor(engagementVsAvg) },
                  ]}
                >
                  ({formatDiff(engagementVsAvg)} vs avg)
                </Text>
              </View>
            </View>
          </View>

          {/* Insights */}
          <View style={modalStyles.insightsCard}>
            <Text style={modalStyles.sectionTitle}>What This Tells You</Text>
            {videoInsights.map((insight, index) => (
              <View key={index} style={modalStyles.insightItem}>
                <Text style={modalStyles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>

          {/* Open in TikTok */}
          <Pressable
            style={modalStyles.tiktokButton}
            onPress={() => openTikTokVideo(video.id)}
          >
            <Ionicons name="logo-tiktok" size={20} color={colors.text} />
            <Text style={modalStyles.tiktokButtonText}>View on TikTok</Text>
            <Ionicons
              name="open-outline"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>

          <View style={{ height: spacing["2xl"] }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============================================
// COMPONENTS
// ============================================

function TopVideoCard({
  video,
  rank,
  onPress,
}: {
  video: VideoInsight;
  rank: number;
  onPress: () => void;
}) {
  const rankColors = [
    "#FFD700",
    "#C0C0C0",
    "#CD7F32",
    colors.textSecondary,
    colors.textSecondary,
  ];

  return (
    <Pressable style={styles.topVideoCard} onPress={onPress}>
      <View style={styles.topVideoRank}>
        <Text
          style={[styles.topVideoRankText, { color: rankColors[rank - 1] }]}
        >
          #{rank}
        </Text>
      </View>

      {video.cover_image_url ? (
        <Image
          source={{ uri: video.cover_image_url }}
          style={styles.topVideoThumbnail}
        />
      ) : (
        <View style={[styles.topVideoThumbnail, styles.topVideoPlaceholder]}>
          <Ionicons name="videocam" size={24} color={colors.textSecondary} />
        </View>
      )}

      <View style={styles.topVideoInfo}>
        <Text style={styles.topVideoViews}>
          {formatNumber(video.view_count || 0)} views
        </Text>
        <Text style={styles.topVideoDate}>{formatDate(video.create_time)}</Text>
        <View style={styles.topVideoMeta}>
          <Text style={styles.topVideoMetaText}>
            Posted {getDayName(video.postingDay).slice(0, 3)} at{" "}
            {getHourLabel(video.postingHour)}
          </Text>
        </View>
      </View>

      <View style={styles.topVideoEngagement}>
        <View style={styles.engagementRow}>
          <Ionicons name="heart" size={12} color={colors.primary} />
          <Text style={styles.engagementText}>
            {formatNumber(video.like_count || 0)}
          </Text>
        </View>
        {video.comment_count !== undefined && (
          <View style={styles.engagementRow}>
            <Ionicons name="chatbubble" size={12} color={colors.accent} />
            <Text style={styles.engagementText}>
              {formatNumber(video.comment_count || 0)}
            </Text>
          </View>
        )}
        {video.share_count !== undefined && (
          <View style={styles.engagementRow}>
            <Ionicons name="share-social" size={12} color={colors.success} />
            <Text style={styles.engagementText}>
              {formatNumber(video.share_count || 0)}
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function BestTimesCard({
  times,
  bestDayOfWeek,
}: {
  times: TimeSlotPerformance[];
  bestDayOfWeek: string;
}) {
  if (times.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time-outline" size={20} color={colors.warning} />
          <Text style={styles.cardTitle}>Best Times to Post</Text>
        </View>
        <Text style={styles.cardEmpty}>
          Post more videos to discover your best times.
        </Text>
      </View>
    );
  }

  const maxViews = Math.max(...times.map((t) => t.avgViews));

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="time-outline" size={20} color={colors.warning} />
        <Text style={styles.cardTitle}>Best Times to Post</Text>
      </View>

      <Text style={styles.cardSubtitle}>
        {bestDayOfWeek}s around {times[0]?.label} work best for you
      </Text>

      <View style={styles.timeBarsContainer}>
        {times.map((slot, index) => (
          <View key={slot.hour} style={styles.timeBarRow}>
            <Text style={styles.timeBarLabel}>{slot.label}</Text>
            <View style={styles.timeBarTrack}>
              <LinearGradient
                colors={
                  index === 0
                    ? ["#FFB800", "#FF8C00"]
                    : [colors.textTertiary, colors.textTertiary]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.timeBarFill,
                  { width: `${(slot.avgViews / maxViews) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.timeBarValue}>
              {formatNumber(slot.avgViews)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function EngagementInsightsCard({
  correlations,
}: {
  correlations: EngagementCorrelation[];
}) {
  if (correlations.length === 0) {
    return null;
  }

  const getIcon = (metric: string) => {
    switch (metric) {
      case "likes":
        return "heart";
      case "comments":
        return "chatbubble";
      case "shares":
        return "share-social";
      default:
        return "analytics";
    }
  };

  const getColor = (metric: string) => {
    switch (metric) {
      case "likes":
        return colors.primary;
      case "comments":
        return colors.accent;
      case "shares":
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="bulb-outline" size={20} color={colors.accent} />
        <Text style={styles.cardTitle}>What's Working</Text>
      </View>

      {correlations.map((correlation, index) => (
        <View
          key={correlation.metric}
          style={[
            styles.correlationItem,
            index > 0 && styles.correlationItemBorder,
          ]}
        >
          <View
            style={[
              styles.correlationIcon,
              { backgroundColor: getColor(correlation.metric) + "20" },
            ]}
          >
            <Ionicons
              name={getIcon(correlation.metric) as any}
              size={16}
              color={getColor(correlation.metric)}
            />
          </View>
          <Text style={styles.correlationText}>{correlation.insight}</Text>
        </View>
      ))}
    </View>
  );
}

function RecommendationsCard({
  recommendations,
}: {
  recommendations: string[];
}) {
  return (
    <View style={styles.recommendationsCard}>
      <View style={styles.cardHeader}>
        <Ionicons name="compass-outline" size={20} color={colors.success} />
        <Text style={styles.cardTitle}>What to Try</Text>
      </View>

      {recommendations.map((rec, index) => (
        <View key={index} style={styles.recommendationItem}>
          <View style={styles.recommendationBullet}>
            <Text style={styles.recommendationNumber}>{index + 1}</Text>
          </View>
          <Text style={styles.recommendationText}>{rec}</Text>
        </View>
      ))}
    </View>
  );
}

function StatsOverview({
  averageViews,
  totalVideos,
  bestDayOfWeek,
  bestHourRange,
}: {
  averageViews: number;
  totalVideos: number;
  bestDayOfWeek: string;
  bestHourRange: string;
}) {
  return (
    <View style={styles.statsGrid}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{formatNumber(averageViews)}</Text>
        <Text style={styles.statLabel}>Avg Views</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{totalVideos}</Text>
        <Text style={styles.statLabel}>Videos</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{bestDayOfWeek.slice(0, 3)}</Text>
        <Text style={styles.statLabel}>Best Day</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{bestHourRange.split(" - ")[0]}</Text>
        <Text style={styles.statLabel}>Best Time</Text>
      </View>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function InsightsScreen() {
  const { user, getValidAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoInsight | null>(null);

  const loadInsights = useCallback(async () => {
    if (!user) {
      setError("Not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const accessToken = await getValidAccessToken();

      if (!accessToken) {
        setError("Failed to get access token. Please log in again.");
        setIsLoading(false);
        return;
      }

      const videos = await fetchAllUserVideos(accessToken, 200);
      const insightData = calculateInsights(videos);
      setInsights(insightData);
    } catch (err) {
      console.error("Error loading insights:", err);
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, getValidAccessToken]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadInsights();
  }, [loadInsights]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing your content...</Text>
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
          <Text style={styles.pageTitle}>Insights</Text>
          <Text style={styles.pageSubtitle}>
            What's working for you, based on your actual data.
          </Text>
        </View>

        {error && (
          <Pressable onPress={onRefresh} style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        )}

        {insights && (
          <>
            {/* Quick Stats */}
            <StatsOverview
              averageViews={insights.averageViews}
              totalVideos={insights.totalVideos}
              bestDayOfWeek={insights.bestDayOfWeek}
              bestHourRange={insights.bestHourRange}
            />

            {/* Top Performing Videos */}
            {insights.topVideos.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Top Performing Videos</Text>
                  <Text style={styles.sectionSubtitle}>Tap for details</Text>
                </View>
                {insights.topVideos.map((video, index) => (
                  <TopVideoCard
                    key={video.id}
                    video={video}
                    rank={index + 1}
                    onPress={() => setSelectedVideo(video)}
                  />
                ))}
              </View>
            )}

            {/* Best Posting Times */}
            <BestTimesCard
              times={insights.bestPostingTimes}
              bestDayOfWeek={insights.bestDayOfWeek}
            />

            {/* Engagement Insights */}
            <EngagementInsightsCard
              correlations={insights.engagementCorrelations}
            />

            {/* Recommendations */}
            <RecommendationsCard recommendations={insights.recommendations} />
          </>
        )}

        {!insights && !error && (
          <View style={styles.emptyState}>
            <Ionicons
              name="bar-chart-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyStateTitle}>No data yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start posting to see what works for you.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Video Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        insights={insights}
        visible={selectedVideo !== null}
        onClose={() => setSelectedVideo(null)}
      />
    </View>
  );
}

// ============================================
// MODAL STYLES
// ============================================

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  videoPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  thumbnail: {
    width: 100,
    height: 140,
    borderRadius: 12,
  },
  thumbnailPlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  videoMeta: {
    marginLeft: spacing.md,
    flex: 1,
  },
  rankBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  rankText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  videoDate: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  videoTime: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verdictCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  verdictTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  verdictText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metricsCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metricItem: {
    width: "50%",
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  metricDiff: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  engagementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  engagementLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  engagementValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  engagementNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  engagementDiff: {
    fontSize: typography.fontSize.xs,
  },
  insightsCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  insightItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  insightText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.6,
  },
  tiktokButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tiktokButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
});

// ============================================
// MAIN STYLES
// ============================================

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
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  pageSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  statsGrid: {
    flexDirection: "row",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
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
  sectionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  topVideoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  topVideoRank: {
    width: 28,
    alignItems: "center",
  },
  topVideoRankText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  topVideoThumbnail: {
    width: 50,
    height: 70,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  topVideoPlaceholder: {
    backgroundColor: colors.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  topVideoInfo: {
    flex: 1,
  },
  topVideoViews: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  topVideoDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  topVideoMeta: {
    marginTop: spacing.xs,
  },
  topVideoMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  topVideoEngagement: {
    alignItems: "flex-end",
    marginRight: spacing.sm,
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  engagementText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardEmpty: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontStyle: "italic",
  },
  timeBarsContainer: {
    gap: spacing.sm,
  },
  timeBarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBarLabel: {
    width: 45,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  timeBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: "hidden",
  },
  timeBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  timeBarValue: {
    width: 40,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: "right",
  },
  correlationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
  },
  correlationItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  correlationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  correlationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  recommendationsCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  recommendationBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  recommendationNumber: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  recommendationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["3xl"],
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
