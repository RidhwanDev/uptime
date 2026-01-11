import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../src/theme";

export default function PostingScheduleScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          title: "Posting Schedule",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Schedule */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleIconContainer}>
            <Ionicons name="calendar" size={32} color={colors.primary} />
          </View>
          <Text style={styles.scheduleTitle}>Your Current Goal</Text>
          <Text style={styles.scheduleValue}>Post Every Day</Text>
          <Text style={styles.scheduleDescription}>
            Stay consistent by posting at least one TikTok video every day to
            maintain your streak and climb the leaderboard.
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Simple & Effective</Text>
              <Text style={styles.infoText}>
                Daily posting is the best way to grow on TikTok and build a loyal
                audience.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="time" size={20} color={colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Any Time Works</Text>
              <Text style={styles.infoText}>
                Post whenever suits you best - morning, afternoon, or night. We
                check once per day.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="sync" size={20} color={colors.warning} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Auto-Sync</Text>
              <Text style={styles.infoText}>
                Open the app to sync your latest posts. We'll detect new videos
                automatically.
              </Text>
            </View>
          </View>
        </View>

        {/* Coming Soon */}
        <View style={styles.comingSoon}>
          <Ionicons name="sparkles" size={24} color={colors.primary} />
          <Text style={styles.comingSoonTitle}>More Options Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Custom posting schedules, weekly goals, and rest days are on the way!
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
  scheduleCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  scheduleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  scheduleTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scheduleValue: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  scheduleDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  infoSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoItem: {
    flexDirection: "row",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  comingSoon: {
    backgroundColor: colors.primary + "10",
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary + "30",
    borderStyle: "dashed",
  },
  comingSoonTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  comingSoonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

