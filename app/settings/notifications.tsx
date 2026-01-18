import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../src/theme";
import {
  getNotificationPreferences,
  updateNotificationSchedules,
  requestPermissions,
} from "../../src/services/notifications";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "daily_reminder",
      title: "Daily Reminder",
      description: "Get a reminder to post and sync your content each day",
      icon: "alarm",
      iconColor: colors.primary,
      enabled: true,
    },
    {
      id: "weekly_leaderboard",
      title: "Weekly Leaderboard Results",
      description: "See where you placed when the weekly leaderboard closes",
      icon: "trophy",
      iconColor: colors.warning,
      enabled: true,
    },
    {
      id: "badge_earned",
      title: "Badge Achievements",
      description: "Celebrate when you unlock new badges and milestones",
      icon: "medal",
      iconColor: colors.accent,
      enabled: true,
    },
    {
      id: "featured_content",
      title: "New Featured Content",
      description: "Get notified when new creator interviews are released",
      icon: "star",
      iconColor: "#A855F7",
      enabled: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setSettings((prev) =>
        prev.map((setting) => ({
          ...setting,
          enabled: prefs[setting.id as keyof typeof prefs] ?? setting.enabled,
        }))
      );
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetting = async (id: string) => {
    const newSettings = settings.map((setting) =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    );
    setSettings(newSettings);

    // Request permissions if enabling
    const setting = newSettings.find((s) => s.id === id);
    if (setting?.enabled) {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive reminders.",
          [{ text: "OK" }]
        );
        // Revert the toggle
        setSettings(settings);
        return;
      }
    }

    // Update notification schedules
    try {
      const preferences = {
        daily_reminder: newSettings.find((s) => s.id === "daily_reminder")?.enabled ?? false,
        weekly_leaderboard: newSettings.find((s) => s.id === "weekly_leaderboard")?.enabled ?? false,
        badge_earned: newSettings.find((s) => s.id === "badge_earned")?.enabled ?? false,
        featured_content: newSettings.find((s) => s.id === "featured_content")?.enabled ?? false,
      };
      await updateNotificationSchedules(preferences);
    } catch (error) {
      console.error("Error updating notification schedules:", error);
      Alert.alert("Error", "Failed to update notification settings. Please try again.");
      // Revert the toggle
      setSettings(settings);
    }
  };

  const enabledCount = settings.filter((s) => s.enabled).length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          title: "Notifications",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="notifications" size={28} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Stay in the Loop</Text>
          <Text style={styles.headerSubtitle}>
            {enabledCount} of {settings.length} notifications enabled
          </Text>
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          {settings.map((setting, index) => (
            <View
              key={setting.id}
              style={[
                styles.settingItem,
                index === settings.length - 1 && styles.settingItemLast,
              ]}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: setting.iconColor + "20" },
                ]}
              >
                <Ionicons
                  name={setting.icon}
                  size={20}
                  color={setting.iconColor}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDescription}>
                  {setting.description}
                </Text>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{
                  false: colors.backgroundTertiary,
                  true: colors.primary + "60",
                }}
                thumbColor={setting.enabled ? colors.primary : colors.textSecondary}
              />
            </View>
          ))}
        </View>

        {/* Info Footer */}
        <View style={styles.footer}>
          <Ionicons name="information-circle" size={16} color={colors.textTertiary} />
          <Text style={styles.footerText}>
            You can change these settings at any time. Notifications help you stay
            consistent and never miss important updates.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  settingsList: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  footerText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});

