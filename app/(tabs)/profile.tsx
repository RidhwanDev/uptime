import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography } from "../../src/theme";
import { useAuth } from "../../src/contexts/AuthContext";

// Mock stats - will come from API/database later
const MOCK_STATS = {
  currentStreak: 4,
  longestStreak: 12,
  uptimePercent: 17,
  totalPosts: 5,
  daysActive: 30,
  rank: 42,
};

// Achievement badges
const ACHIEVEMENTS = [
  {
    id: "1",
    icon: "flame",
    label: "First Streak",
    unlocked: true,
    color: "#FF6B6B",
  },
  {
    id: "2",
    icon: "calendar",
    label: "7 Day Streak",
    unlocked: false,
    color: "#4ECDC4",
  },
  {
    id: "3",
    icon: "trophy",
    label: "Top 10",
    unlocked: false,
    color: "#FFE66D",
  },
  {
    id: "4",
    icon: "star",
    label: "30 Day Streak",
    unlocked: false,
    color: "#A855F7",
  },
  {
    id: "5",
    icon: "rocket",
    label: "100 Posts",
    unlocked: false,
    color: "#00F2EA",
  },
  {
    id: "6",
    icon: "medal",
    label: "#1 Weekly",
    unlocked: false,
    color: "#FF0050",
  },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {user?.tiktokHandle?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{MOCK_STATS.rank}</Text>
            </View>
          </View>
          <Text style={styles.displayName}>{user?.displayName || "User"}</Text>
          <Text style={styles.userId}>@{user?.tiktokHandle || "unknown"}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            value={MOCK_STATS.currentStreak}
            label="Current Streak"
            icon="flame"
            color="#FF0050"
          />
          <StatCard
            value={MOCK_STATS.longestStreak}
            label="Best Streak"
            icon="trophy"
            color="#FFB800"
          />
          <StatCard
            value={`${MOCK_STATS.uptimePercent}%`}
            label="Uptime"
            icon="trending-up"
            color="#00F2EA"
          />
          <StatCard
            value={MOCK_STATS.totalPosts}
            label="Total Posts"
            icon="videocam"
            color="#A855F7"
          />
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionSubtitle}>
              {ACHIEVEMENTS.filter((a) => a.unlocked).length}/
              {ACHIEVEMENTS.length} unlocked
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {ACHIEVEMENTS.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </ScrollView>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="time-outline"
            label="Posting Schedule"
            sublabel="Daily at any time"
            onPress={() => {}}
          />
          <MenuItem
            icon="globe-outline"
            label="Timezone"
            sublabel="Auto-detected"
            onPress={() => {}}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            sublabel="Enabled"
            onPress={() => {}}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy"
            sublabel="Public profile"
            onPress={() => {}}
          />
        </View>

        {/* Account Section */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
          <MenuItem
            icon="information-circle-outline"
            label="About"
            sublabel="Version 1.0.0"
            onPress={() => {}}
          />
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        {/* Footer */}
        <Text style={styles.footerText}>
          Connected to TikTok • @{user?.tiktokHandle || "unknown"}
        </Text>
      </ScrollView>
    </View>
  );
}

function StatCard({
  value,
  label,
  icon,
  color,
}: {
  value: string | number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[color + "30", color + "10"]}
        style={styles.statIconContainer}
      >
        <Ionicons name={icon} size={18} color={color} />
      </LinearGradient>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AchievementBadge({
  achievement,
}: {
  achievement: (typeof ACHIEVEMENTS)[0];
}) {
  return (
    <View
      style={[
        styles.achievementBadge,
        !achievement.unlocked && styles.achievementLocked,
      ]}
    >
      <View
        style={[
          styles.achievementIcon,
          {
            backgroundColor: achievement.unlocked
              ? achievement.color + "30"
              : colors.backgroundTertiary,
          },
        ]}
      >
        <Ionicons
          name={achievement.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={achievement.unlocked ? achievement.color : colors.textTertiary}
        />
      </View>
      <Text
        style={[
          styles.achievementLabel,
          !achievement.unlocked && styles.achievementLabelLocked,
        ]}
      >
        {achievement.label}
      </Text>
      {!achievement.unlocked && (
        <Ionicons name="lock-closed" size={10} color={colors.textTertiary} />
      )}
    </View>
  );
}

function MenuItem({
  icon,
  label,
  sublabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemLabel}>{label}</Text>
        {sublabel && <Text style={styles.menuItemSublabel}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  rankBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rankText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: "#000",
  },
  displayName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  userId: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xl,
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
  achievementsScroll: {
    gap: spacing.sm,
  },
  achievementBadge: {
    alignItems: "center",
    width: 70,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  achievementLabel: {
    fontSize: 10,
    color: colors.text,
    textAlign: "center",
    marginBottom: 2,
  },
  achievementLabelLocked: {
    color: colors.textSecondary,
  },
  menuSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  menuItemSublabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.error + "15",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error + "30",
    marginTop: spacing.md,
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
