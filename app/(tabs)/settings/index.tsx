import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Linking,
  Switch,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography } from "../../../src/theme";
import { useAuth } from "../../../src/contexts/AuthContext";
import {
  fetchAllAchievements,
  fetchUserAchievements,
  getUserStats,
  getUserRank,
  updateUserPrivacy,
  getUserPrivacy,
  checkAndAwardAchievements,
} from "../../../src/services/supabaseSync";
import type { UserStats } from "../../../src/lib/database.types";
import Constants from "expo-constants";

const APP_VERSION = Constants.expoConfig?.version || "1.0.0";

interface AchievementDisplay {
  id: string;
  icon: string;
  label: string;
  unlocked: boolean;
  color: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<AchievementDisplay[]>([]);
  const [isPublicProfile, setIsPublicProfile] = useState(true);

  // Load profile data
  const loadProfileData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all data in parallel
      const [stats, rank, allAchievements, userAchievementIds, privacy] =
        await Promise.all([
          getUserStats(user.id),
          getUserRank(user.id),
          fetchAllAchievements(),
          fetchUserAchievements(user.id),
          getUserPrivacy(user.id),
        ]);

      setUserStats(stats);
      setUserRank(rank?.rankByStreak || null);
      setIsPublicProfile(privacy ?? true);

      // Map achievements to display format
      const achievementDisplays: AchievementDisplay[] = allAchievements.map(
        (a) => ({
          id: a.id,
          icon: a.icon,
          label: a.name,
          unlocked: userAchievementIds.includes(a.id),
          color: a.color,
        })
      );

      setAchievements(achievementDisplays);

      // Check for new achievements after loading stats
      await checkAndAwardAchievements(user.id);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

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

  const handlePostingSchedule = () => {
    router.push("/settings/posting-schedule");
  };

  const handleNotifications = () => {
    router.push("/settings/notifications");
  };

  const handleAccount = () => {
    router.push("/settings/account");
  };

  const handlePrivacy = async () => {
    if (!user?.id) return;

    const newValue = !isPublicProfile;
    setIsPublicProfile(newValue); // Optimistic update

    const success = await updateUserPrivacy(user.id, newValue);

    if (!success) {
      // Revert on failure
      setIsPublicProfile(!newValue);
      Alert.alert(
        "Error",
        "Failed to update privacy setting. Please try again."
      );
    }
  };

  const handleHelpSupport = () => {
    Alert.alert("Help & Support", "Need help with Uptime?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Email Support",
        onPress: () =>
          Linking.openURL("mailto:support@uptime.app?subject=Uptime%20Support"),
      },
      {
        text: "Visit Website",
        onPress: () => Linking.openURL("https://ridhwan.io/uptime"),
      },
    ]);
  };

  const handleTermsOfService = () => {
    Linking.openURL("https://ridhwan.io/uptime/terms");
  };

  const handleAbout = () => {
    Alert.alert(
      "About Uptime",
      `Uptime helps TikTok creators stay consistent with daily posting.\n\nVersion: ${APP_VERSION}\nBuilt with ❤️ by ridhwan.io`,
      [
        { text: "OK" },
        {
          text: "Visit Website",
          onPress: () => Linking.openURL("https://ridhwan.io/uptime"),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          title: "Profile",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
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
            {userRank && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{userRank}</Text>
              </View>
            )}
          </View>
          <Text style={styles.displayName}>{user?.displayName || "User"}</Text>
          <Text style={styles.userId}>@{user?.tiktokHandle || "unknown"}</Text>
        </View>

        {/* Stats Row - Compact */}
        <View style={styles.statsRow}>
          <StatCard
            value={userStats?.longest_streak || 0}
            label="Best Streak"
            icon="trophy"
            color="#FFB800"
          />
          <StatCard
            value={userStats?.total_posts || 0}
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
              {achievements.filter((a) => a.unlocked).length}/
              {achievements.length} unlocked
            </Text>
          </View>
          {isLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ paddingVertical: spacing.md }}
            />
          ) : achievements.length === 0 ? (
            <Text style={styles.noAchievementsText}>
              No achievements available yet
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="time-outline"
            label="Posting Schedule"
            sublabel="Every day"
            onPress={handlePostingSchedule}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            sublabel="Manage alerts"
            onPress={handleNotifications}
          />
          <MenuItemToggle
            icon="shield-checkmark-outline"
            label="Public Profile"
            value={isPublicProfile}
            onToggle={handlePrivacy}
          />
        </View>

        {/* Account Section */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="person-outline"
            label="Account"
            sublabel="Manage your account"
            onPress={handleAccount}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={handleHelpSupport}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={handleTermsOfService}
          />
          <MenuItem
            icon="information-circle-outline"
            label="About"
            sublabel={`Version ${APP_VERSION}`}
            onPress={handleAbout}
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
  achievement: AchievementDisplay;
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

function MenuItemToggle({
  icon,
  label,
  value,
  onToggle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.menuItem}>
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: colors.backgroundTertiary,
          true: colors.primary + "60",
        }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
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
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
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
  noAchievementsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: "italic",
    paddingVertical: spacing.md,
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
