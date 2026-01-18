import React, { useState, useEffect, useCallback, useRef } from "react";
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
import PagerView from "react-native-pager-view";
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUserStats, setCurrentUserStats] = useState<LeaderboardUser | null>(null);
  const pagerRef = useRef<PagerView>(null);
  const [activePage, setActivePage] = useState(0);

  const loadLeaderboard = useCallback(async () => {
    try {
      // Load data sorted by streak (API supports streak/uptime)
      const data = await fetchLeaderboard("streak", 20);
      
      // Transform data to our format
      const transformed: LeaderboardUser[] = data.map((entry) => ({
        id: entry.id,
        rank: entry.rank_by_streak,
        handle: entry.tiktok_handle || "Unknown",
        avatarUrl: entry.avatar_url || "",
        currentStreak: entry.current_streak,
        uptimePercent: Math.round(entry.uptime_30d),
        totalPosts: entry.total_posts,
      }));

      setLeaderboard(transformed);

      // Find current user in leaderboard
      if (user?.id) {
        const userEntry = transformed.find(e => e.id === user.id);
        if (userEntry) {
          setCurrentUserRank(userEntry.rank);
          setCurrentUserStats(userEntry);
        } else {
          // Get rank from API if not in top results
          const rank = await getUserRank(user.id);
          if (rank) {
            setCurrentUserRank(rank.rankByStreak);
          }
        }
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top creators by consistency</Text>
      </View>

      {/* Tab Indicators */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activePage === 0 && styles.tabActive]}
          onPress={() => handleTabPress(0)}
        >
          <Ionicons
            name="flame"
            size={16}
            color={activePage === 0 ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              activePage === 0 && styles.tabLabelActive,
            ]}
          >
            Streak
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activePage === 1 && styles.tabActive]}
          onPress={() => handleTabPress(1)}
        >
          <Ionicons
            name="trending-up"
            size={16}
            color={activePage === 1 ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              activePage === 1 && styles.tabLabelActive,
            ]}
          >
            Uptime
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activePage === 2 && styles.tabActive]}
          onPress={() => handleTabPress(2)}
        >
          <Ionicons
            name="videocam"
            size={16}
            color={activePage === 2 ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              activePage === 2 && styles.tabLabelActive,
            ]}
          >
            Posts
          </Text>
        </Pressable>
      </View>

      {/* Swipeable Pager View */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => handlePageChange(e.nativeEvent.position)}
      >
        {/* Streak View */}
        <LeaderboardView
          key="streak"
          sortBy="streak"
          leaderboard={leaderboard}
          currentUserEntry={currentUserEntry}
          user={user}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
        />

        {/* Uptime View */}
        <LeaderboardView
          key="uptime"
          sortBy="uptime"
          leaderboard={leaderboard}
          currentUserEntry={currentUserEntry}
          user={user}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
        />

        {/* Posts View */}
        <LeaderboardView
          key="posts"
          sortBy="posts"
          leaderboard={leaderboard}
          currentUserEntry={currentUserEntry}
          user={user}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      </PagerView>
    </View>
  );
}

// LeaderboardView component for each swipeable page
function LeaderboardView({
  sortBy,
  leaderboard,
  currentUserEntry,
  user,
  isLoading,
  isRefreshing,
  onRefresh,
}: {
  sortBy: SortOption;
  leaderboard: LeaderboardUser[];
  currentUserEntry: LeaderboardUser;
  user: { id?: string } | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  // Sort leaderboard by the specified sort type
  const sorted = [...leaderboard].sort((a, b) => {
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

  // Re-assign ranks after sort
  sorted.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Get current user entry with correct rank for this sort
  const userEntry = sorted.find((e) => e.id === user?.id);
  const displayUserEntry: LeaderboardUser = userEntry || {
    ...currentUserEntry,
    rank: 0,
  };

  if (isLoading && sorted.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
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
      {sorted.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No data yet</Text>
          <Text style={styles.emptySubtext}>Be the first on the leaderboard!</Text>
        </View>
      ) : (
        <>
          {/* Top 3 Podium */}
          <View style={styles.podium}>
            {sorted[1] ? (
              <PodiumItem user={sorted[1]} place={2} />
            ) : (
              <PodiumPlaceholder place={2} />
            )}
            <PodiumItem user={sorted[0]} place={1} />
            {sorted[2] ? (
              <PodiumItem user={sorted[2]} place={3} />
            ) : (
              <PodiumPlaceholder place={3} />
            )}
          </View>

          {/* Rest of Leaderboard */}
          {sorted.length > 3 && (
            <View style={styles.list}>
              {sorted.slice(3).map((item) => (
                <LeaderboardRow
                  key={item.id}
                  user={item}
                  rank={item.rank}
                  sortBy={sortBy}
                  isCurrentUser={item.id === user?.id}
                />
              ))}
            </View>
          )}
        </>
      )}

      {/* Current User Position */}
      {displayUserEntry.rank > 0 && (
        <View style={styles.currentUserSection}>
          <Text style={styles.currentUserLabel}>Your Position</Text>
          <LeaderboardRow
            user={displayUserEntry}
            rank={displayUserEntry.rank}
            sortBy={sortBy}
            isCurrentUser
          />
        </View>
      )}
    </ScrollView>
  );
}

function PodiumItem({
  user,
  place,
}: {
  user: LeaderboardUser;
  place: 1 | 2 | 3;
}) {
  const ringColors: Record<1 | 2 | 3, string> = {
    1: "#FFD700", // Gold
    2: "#C0C0C0", // Silver
    3: "#CD7F32", // Bronze
  };
  const avatarSizes = { 1: 80, 2: 64, 3: 64 };
  const ringWidth = { 1: 4, 2: 3, 3: 3 };
  const placeLabels = { 1: "1st", 2: "2nd", 3: "3rd" };

  return (
    <View style={[styles.podiumItem, place === 1 && styles.podiumItemFirst]}>
      {/* Place Badge */}
      <View style={[styles.placeBadge, { backgroundColor: ringColors[place] }]}>
        <Text style={styles.placeBadgeText}>{placeLabels[place]}</Text>
      </View>

      {/* Avatar with Chrome Ring */}
      <View style={styles.podiumAvatarContainer}>
        {/* Outer glow for 1st place */}
        {place === 1 && <View style={styles.avatarGlow} />}
        
        {/* Chrome ring */}
        <LinearGradient
          colors={[ringColors[place], ringColors[place] + "80", ringColors[place]]}
          style={[
            styles.avatarRing,
            {
              width: avatarSizes[place] + ringWidth[place] * 2 + 4,
              height: avatarSizes[place] + ringWidth[place] * 2 + 4,
              borderRadius: (avatarSizes[place] + ringWidth[place] * 2 + 4) / 2,
            },
          ]}
        >
          {user.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={[
                styles.podiumAvatar,
                {
                  width: avatarSizes[place],
                  height: avatarSizes[place],
                  borderRadius: avatarSizes[place] / 2,
                },
              ]}
            />
          ) : (
            <View
              style={[
                styles.podiumAvatar,
                styles.podiumAvatarPlaceholder,
                {
                  width: avatarSizes[place],
                  height: avatarSizes[place],
                  borderRadius: avatarSizes[place] / 2,
                },
              ]}
            >
              <Ionicons name="person" size={place === 1 ? 28 : 22} color={colors.textSecondary} />
            </View>
          )}
        </LinearGradient>

        {/* Crown for 1st place */}
        {place === 1 && <Text style={styles.crown}>👑</Text>}
      </View>

      {/* Handle */}
      <Text style={styles.podiumHandle} numberOfLines={1}>
        @{user.handle}
      </Text>

      {/* Stats */}
      <View style={styles.podiumStats}>
        <View style={styles.podiumStatItem}>
          <Ionicons name="flame" size={14} color={colors.primary} />
          <Text style={styles.podiumStatValue}>{user.currentStreak}</Text>
        </View>
      </View>
    </View>
  );
}

function PodiumPlaceholder({ place }: { place: 2 | 3 }) {
  const avatarSizes = { 2: 64, 3: 64 };
  const placeLabels = { 2: "2nd", 3: "3rd" };
  const ringColors = { 2: "#C0C0C0", 3: "#CD7F32" };

  return (
    <View style={styles.podiumItem}>
      {/* Place Badge */}
      <View style={[styles.placeBadge, styles.placeBadgeEmpty]}>
        <Text style={styles.placeBadgeTextEmpty}>{placeLabels[place]}</Text>
      </View>

      {/* Empty Avatar */}
      <View style={styles.podiumAvatarContainer}>
        <View
          style={[
            styles.avatarRingEmpty,
            {
              width: avatarSizes[place] + 10,
              height: avatarSizes[place] + 10,
              borderRadius: (avatarSizes[place] + 10) / 2,
            },
          ]}
        >
          <View
            style={[
              styles.podiumAvatar,
              styles.podiumAvatarEmpty,
              {
                width: avatarSizes[place],
                height: avatarSizes[place],
                borderRadius: avatarSizes[place] / 2,
              },
            ]}
          >
            <Ionicons name="person-add" size={20} color={colors.textTertiary} />
          </View>
        </View>
      </View>

      {/* Waiting text */}
      <Text style={styles.podiumHandleEmpty}>Waiting...</Text>

      {/* Empty stats */}
      <View style={styles.podiumStats}>
        <Text style={styles.podiumStatEmpty}>—</Text>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary + "30",
  },
  tabLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  pager: {
    flex: 1,
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
    alignItems: "flex-start",
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  podiumItem: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  podiumItemFirst: {
    marginTop: -spacing.md,
  },
  placeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  placeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: "#000",
  },
  placeBadgeEmpty: {
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeBadgeTextEmpty: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
  },
  podiumAvatarContainer: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  avatarGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 100,
    backgroundColor: "#FFD700",
    opacity: 0.3,
  },
  avatarRing: {
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  avatarRingEmpty: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  podiumAvatar: {
    borderWidth: 2,
    borderColor: colors.background,
  },
  podiumAvatarPlaceholder: {
    backgroundColor: colors.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
  },
  podiumAvatarEmpty: {
    backgroundColor: colors.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  crown: {
    position: "absolute",
    top: -20,
    left: "50%",
    marginLeft: -12,
    fontSize: 24,
  },
  podiumHandle: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    maxWidth: 90,
    textAlign: "center",
  },
  podiumHandleEmpty: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
    fontStyle: "italic",
  },
  podiumStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  podiumStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  podiumStatValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  podiumStatEmpty: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
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
