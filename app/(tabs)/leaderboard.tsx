import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography } from "../../src/theme";
import { useAuth } from "../../src/contexts/AuthContext";
import { fetchLeaderboard, getUserRank } from "../../src/services/supabaseSync";
import { LeaderboardEntry } from "../../src/lib/database.types";

type SortOption = "streak" | "uptime" | "posts";

interface LeaderboardUser {
  id: string;
  rank: number;
  handle: string;
  avatarUrl: string;
  currentStreak: number;
  uptimePercent: number;
  totalPosts: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortOption>("streak");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUserStats, setCurrentUserStats] = useState<LeaderboardUser | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const sortType = sortBy === "posts" ? "streak" : sortBy; // API only supports streak/uptime
      const data = await fetchLeaderboard(sortType, 20);
      
      // Transform data to our format
      const transformed: LeaderboardUser[] = data.map((entry, index) => ({
        id: entry.id,
        rank: sortBy === "streak" ? entry.rank_by_streak : entry.rank_by_uptime,
        handle: entry.tiktok_handle || "Unknown",
        avatarUrl: entry.avatar_url || "",
        currentStreak: entry.current_streak,
        uptimePercent: Math.round(entry.uptime_30d),
        totalPosts: entry.total_posts,
      }));

      // Sort locally if needed
      const sorted = [...transformed].sort((a, b) => {
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

      // Re-assign ranks after local sort
      sorted.forEach((item, index) => {
        item.rank = index + 1;
      });

      setLeaderboard(sorted);

      // Find current user in leaderboard
      if (user?.id) {
        const userEntry = sorted.find(e => e.id === user.id);
        if (userEntry) {
          setCurrentUserRank(userEntry.rank);
          setCurrentUserStats(userEntry);
        } else {
          // Get rank from API if not in top results
          const rank = await getUserRank(user.id);
          if (rank) {
            setCurrentUserRank(sortBy === "streak" ? rank.rankByStreak : rank.rankByUptime);
          }
        }
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sortBy, user?.id]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Current user entry for display
  const currentUserEntry: LeaderboardUser = currentUserStats || {
    id: user?.id || "current",
    rank: currentUserRank || 0,
    handle: user?.tiktokHandle || "You",
    avatarUrl: user?.avatarUrl || "",
    currentStreak: 0,
    uptimePercent: 0,
    totalPosts: 0,
    isCurrentUser: true,
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
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

        {leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>Be the first on the leaderboard!</Text>
          </View>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <View style={styles.podium}>
                {/* 2nd Place */}
                <PodiumItem user={leaderboard[1]} place={2} />
                {/* 1st Place */}
                <PodiumItem user={leaderboard[0]} place={1} />
                {/* 3rd Place */}
                <PodiumItem user={leaderboard[2]} place={3} />
              </View>
            )}

            {/* Rest of Leaderboard */}
            <View style={styles.list}>
              {leaderboard.slice(3).map((item) => (
                <LeaderboardRow
                  key={item.id}
                  user={item}
                  rank={item.rank}
                  sortBy={sortBy}
                  isCurrentUser={item.id === user?.id}
                />
              ))}
            </View>
          </>
        )}

        {/* Current User Position */}
        {currentUserEntry.rank > 0 && (
          <View style={styles.currentUserSection}>
            <Text style={styles.currentUserLabel}>Your Position</Text>
            <LeaderboardRow
              user={currentUserEntry}
              rank={currentUserEntry.rank}
              sortBy={sortBy}
              isCurrentUser
            />
          </View>
        )}
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
  user: LeaderboardUser;
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
  user: LeaderboardUser;
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["3xl"],
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
