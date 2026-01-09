import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography } from "../../src/theme";
import { useAuth } from "../../src/contexts/AuthContext";

// Mock data for leaderboard
const MOCK_LEADERBOARD = [
  {
    id: "1",
    rank: 1,
    handle: "contentqueen",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    currentStreak: 45,
    uptimePercent: 100,
    totalPosts: 156,
  },
  {
    id: "2",
    rank: 2,
    handle: "dailyvibes",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
    currentStreak: 32,
    uptimePercent: 97,
    totalPosts: 134,
  },
  {
    id: "3",
    rank: 3,
    handle: "creativesoul",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
    currentStreak: 28,
    uptimePercent: 93,
    totalPosts: 98,
  },
  {
    id: "4",
    rank: 4,
    handle: "tiktoker_pro",
    avatarUrl: "https://i.pravatar.cc/150?img=4",
    currentStreak: 21,
    uptimePercent: 87,
    totalPosts: 112,
  },
  {
    id: "5",
    rank: 5,
    handle: "viralmaker",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    currentStreak: 18,
    uptimePercent: 83,
    totalPosts: 89,
  },
  {
    id: "6",
    rank: 6,
    handle: "trendsetterx",
    avatarUrl: "https://i.pravatar.cc/150?img=6",
    currentStreak: 14,
    uptimePercent: 77,
    totalPosts: 67,
  },
  {
    id: "7",
    rank: 7,
    handle: "clips_daily",
    avatarUrl: "https://i.pravatar.cc/150?img=7",
    currentStreak: 12,
    uptimePercent: 73,
    totalPosts: 54,
  },
  {
    id: "8",
    rank: 8,
    handle: "funnymoments",
    avatarUrl: "https://i.pravatar.cc/150?img=8",
    currentStreak: 9,
    uptimePercent: 67,
    totalPosts: 45,
  },
  {
    id: "9",
    rank: 9,
    handle: "lifestyle_hub",
    avatarUrl: "https://i.pravatar.cc/150?img=9",
    currentStreak: 7,
    uptimePercent: 60,
    totalPosts: 38,
  },
  {
    id: "10",
    rank: 10,
    handle: "dance_fever",
    avatarUrl: "https://i.pravatar.cc/150?img=10",
    currentStreak: 5,
    uptimePercent: 53,
    totalPosts: 29,
  },
];

type SortOption = "streak" | "uptime" | "posts";

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortOption>("streak");

  // Sort the leaderboard based on selected option
  const sortedLeaderboard = [...MOCK_LEADERBOARD].sort((a, b) => {
    switch (sortBy) {
      case "streak":
        return b.currentStreak - a.currentStreak;
      case "uptime":
        return b.uptimePercent - a.uptimePercent;
      case "posts":
        return b.totalPosts - a.totalPosts;
      default:
        return 0;
    }
  });

  // Add current user to bottom if not in top 10
  const currentUserEntry = {
    id: "current",
    rank: 42,
    handle: user?.tiktokHandle || "You",
    avatarUrl: user?.avatarUrl || "",
    currentStreak: 4,
    uptimePercent: 17,
    totalPosts: 5,
    isCurrentUser: true,
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Top creators by consistency</Text>
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <SortButton
            label="Streak"
            icon="flame"
            active={sortBy === "streak"}
            onPress={() => setSortBy("streak")}
          />
          <SortButton
            label="Uptime"
            icon="trending-up"
            active={sortBy === "uptime"}
            onPress={() => setSortBy("uptime")}
          />
          <SortButton
            label="Posts"
            icon="videocam"
            active={sortBy === "posts"}
            onPress={() => setSortBy("posts")}
          />
        </View>

        {/* Top 3 Podium */}
        <View style={styles.podium}>
          {/* 2nd Place */}
          <PodiumItem user={sortedLeaderboard[1]} place={2} />
          {/* 1st Place */}
          <PodiumItem user={sortedLeaderboard[0]} place={1} />
          {/* 3rd Place */}
          <PodiumItem user={sortedLeaderboard[2]} place={3} />
        </View>

        {/* Rest of Leaderboard */}
        <View style={styles.list}>
          {sortedLeaderboard.slice(3).map((item, index) => (
            <LeaderboardRow
              key={item.id}
              user={item}
              rank={index + 4}
              sortBy={sortBy}
            />
          ))}
        </View>

        {/* Current User Position */}
        <View style={styles.currentUserSection}>
          <Text style={styles.currentUserLabel}>Your Position</Text>
          <LeaderboardRow
            user={currentUserEntry}
            rank={currentUserEntry.rank}
            sortBy={sortBy}
            isCurrentUser
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SortButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.sortButton, active && styles.sortButtonActive]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={14}
        color={active ? colors.text : colors.textSecondary}
      />
      <Text style={[styles.sortButtonText, active && styles.sortButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function PodiumItem({
  user,
  place,
}: {
  user: (typeof MOCK_LEADERBOARD)[0];
  place: 1 | 2 | 3;
}) {
  const heights = { 1: 100, 2: 70, 3: 50 };
  const gradients: Record<1 | 2 | 3, [string, string]> = {
    1: ["#FFD700", "#FFA500"], // Gold
    2: ["#C0C0C0", "#A0A0A0"], // Silver
    3: ["#CD7F32", "#8B4513"], // Bronze
  };
  const avatarSizes = { 1: 56, 2: 48, 3: 44 };

  return (
    <View style={[styles.podiumItem, place === 1 && styles.podiumItemFirst]}>
      {/* Avatar */}
      <View style={styles.podiumAvatarContainer}>
        {user.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            style={[
              styles.podiumAvatar,
              { width: avatarSizes[place], height: avatarSizes[place] },
            ]}
          />
        ) : (
          <View
            style={[
              styles.podiumAvatar,
              styles.podiumAvatarPlaceholder,
              { width: avatarSizes[place], height: avatarSizes[place] },
            ]}
          >
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
        )}
        {/* Crown for 1st place */}
        {place === 1 && <Text style={styles.crown}>👑</Text>}
      </View>

      {/* Handle */}
      <Text style={styles.podiumHandle} numberOfLines={1}>
        @{user.handle}
      </Text>

      {/* Streak */}
      <View style={styles.podiumStreakContainer}>
        <Text style={styles.podiumStreak}>{user.currentStreak}</Text>
        <Ionicons name="flame" size={12} color={colors.primary} />
      </View>

      {/* Pedestal */}
      <LinearGradient
        colors={gradients[place]}
        style={[styles.pedestal, { height: heights[place] }]}
      >
        <Text style={styles.pedestalNumber}>{place}</Text>
      </LinearGradient>
    </View>
  );
}

function LeaderboardRow({
  user,
  rank,
  sortBy,
  isCurrentUser = false,
}: {
  user: (typeof MOCK_LEADERBOARD)[0];
  rank: number;
  sortBy: SortOption;
  isCurrentUser?: boolean;
}) {
  const getStatValue = () => {
    switch (sortBy) {
      case "streak":
        return (
          <View style={styles.statBadge}>
            <Ionicons name="flame" size={12} color={colors.primary} />
            <Text style={styles.statValue}>{user.currentStreak}</Text>
          </View>
        );
      case "uptime":
        return (
          <View style={styles.statBadge}>
            <Ionicons name="trending-up" size={12} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {user.uptimePercent}%
            </Text>
          </View>
        );
      case "posts":
        return (
          <View style={styles.statBadge}>
            <Ionicons name="videocam" size={12} color="#A855F7" />
            <Text style={[styles.statValue, { color: "#A855F7" }]}>
              {user.totalPosts}
            </Text>
          </View>
        );
    }
  };

  return (
    <View
      style={[
        styles.row,
        isCurrentUser && styles.rowCurrentUser,
      ]}
    >
      {/* Rank */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, isCurrentUser && styles.rankCurrentUser]}>
          {rank}
        </Text>
      </View>

      {/* Avatar */}
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.rowAvatar} />
      ) : (
        <View style={[styles.rowAvatar, styles.rowAvatarPlaceholder]}>
          <Ionicons name="person" size={16} color={colors.textSecondary} />
        </View>
      )}

      {/* Handle */}
      <View style={styles.rowInfo}>
        <Text
          style={[styles.rowHandle, isCurrentUser && styles.rowHandleCurrentUser]}
          numberOfLines={1}
        >
          @{user.handle}
        </Text>
        <Text style={styles.rowSubtext}>
          {user.uptimePercent}% uptime · {user.totalPosts} posts
        </Text>
      </View>

      {/* Stat */}
      {getStatValue()}
    </View>
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sortContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
  },
  sortButtonActive: {
    backgroundColor: colors.primary + "30",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sortButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  sortButtonTextActive: {
    color: colors.text,
    fontWeight: typography.fontWeight.semibold,
  },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  podiumItem: {
    alignItems: "center",
    flex: 1,
  },
  podiumItemFirst: {
    marginBottom: spacing.sm,
  },
  podiumAvatarContainer: {
    position: "relative",
    marginBottom: spacing.xs,
  },
  podiumAvatar: {
    borderRadius: 100,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  podiumAvatarPlaceholder: {
    backgroundColor: colors.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
  },
  crown: {
    position: "absolute",
    top: -16,
    left: "50%",
    marginLeft: -10,
    fontSize: 20,
  },
  podiumHandle: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
    maxWidth: 80,
    textAlign: "center",
  },
  podiumStreakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: spacing.xs,
  },
  podiumStreak: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  pedestal: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  pedestalNumber: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: "#000",
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rowCurrentUser: {
    backgroundColor: colors.primary + "20",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rankContainer: {
    width: 28,
    alignItems: "center",
  },
  rank: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  rankCurrentUser: {
    color: colors.primary,
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rowAvatarPlaceholder: {
    backgroundColor: colors.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
  },
  rowInfo: {
    flex: 1,
  },
  rowHandle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  rowHandleCurrentUser: {
    color: colors.primary,
  },
  rowSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  currentUserSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  currentUserLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
