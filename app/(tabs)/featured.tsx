import React from "react";
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

// Coming soon interview teasers
const UPCOMING_INTERVIEWS = [
  {
    id: "1",
    title: "How I Built a 1M Following",
    guest: "Top Creator TBA",
    description: "Secrets to consistent growth and engagement",
    gradient: ["#FF0050", "#FF6B8A"] as [string, string],
    icon: "rocket",
  },
  {
    id: "2",
    title: "Daily Posting Strategies",
    guest: "Top Creator TBA",
    description: "How the best creators stay consistent",
    gradient: ["#00F2EA", "#00D4AA"] as [string, string],
    icon: "calendar",
  },
  {
    id: "3",
    title: "From 0 to Viral",
    guest: "Top Creator TBA",
    description: "Breaking down viral content formulas",
    gradient: ["#A855F7", "#7C3AED"] as [string, string],
    icon: "trending-up",
  },
];

export default function FeaturedScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Featured</Text>
          <Text style={styles.subtitle}>Spotlight on top creators</Text>
        </View>

        {/* Video of the Week */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Video of the Week</Text>
          </View>
          <Pressable style={styles.featuredVideoCard}>
            <LinearGradient
              colors={["#1a1625", "#2d2a3d"]}
              style={styles.featuredVideoPlaceholder}
            >
              <View style={styles.playButtonContainer}>
                <LinearGradient
                  colors={["#FF0050", "#FF3366"]}
                  style={styles.playButton}
                >
                  <Ionicons name="play" size={32} color="#FFF" />
                </LinearGradient>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </LinearGradient>
            <View style={styles.featuredVideoInfo}>
              <Text style={styles.featuredVideoTitle}>
                Weekly featured video will appear here
              </Text>
              <Text style={styles.featuredVideoDescription}>
                The best performing video from creators who met their daily posting commitment
              </Text>
            </View>
          </Pressable>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How to Get Featured</Text>
          <View style={styles.howItWorksSteps}>
            <HowItWorksStep
              number="1"
              title="Stay Consistent"
              description="Post daily to maintain your streak"
            />
            <HowItWorksStep
              number="2"
              title="Build Engagement"
              description="Create content that resonates"
            />
            <HowItWorksStep
              number="3"
              title="Get Selected"
              description="Top performing eligible video wins"
            />
          </View>
        </View>

        {/* Creator Interviews - Coming Soon */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎙️ Creator Interviews</Text>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>COMING SOON</Text>
            </View>
          </View>
          <Text style={styles.interviewsSubtitle}>
            Exclusive conversations with top creators about their journey, strategies, and tips for success
          </Text>
          
          {/* Interview Teasers */}
          <View style={styles.interviewsGrid}>
            {UPCOMING_INTERVIEWS.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </View>

          {/* Notify Me */}
          <Pressable style={styles.notifyButton}>
            <Ionicons name="notifications-outline" size={18} color={colors.text} />
            <Text style={styles.notifyButtonText}>Notify me when interviews launch</Text>
          </Pressable>
        </View>

        {/* Footer CTA */}
        <View style={styles.footerCta}>
          <Text style={styles.footerCtaEmoji}>✨</Text>
          <Text style={styles.footerCtaText}>
            Keep posting daily to increase your chances of being featured!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function HowItWorksStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

function InterviewCard({
  interview,
}: {
  interview: (typeof UPCOMING_INTERVIEWS)[0];
}) {
  return (
    <Pressable style={styles.interviewCard}>
      <LinearGradient
        colors={interview.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.interviewIconContainer}
      >
        <Ionicons
          name={interview.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color="#FFF"
        />
      </LinearGradient>
      <View style={styles.interviewContent}>
        <Text style={styles.interviewTitle}>{interview.title}</Text>
        <Text style={styles.interviewGuest}>{interview.guest}</Text>
        <Text style={styles.interviewDescription} numberOfLines={2}>
          {interview.description}
        </Text>
      </View>
      <View style={styles.interviewLock}>
        <Ionicons name="lock-closed" size={14} color={colors.textTertiary} />
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
  header: {
    marginBottom: spacing.lg,
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  newBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: "#000",
    letterSpacing: 0.5,
  },
  featuredVideoCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
  },
  featuredVideoPlaceholder: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  playButtonContainer: {
    opacity: 0.8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 4,
  },
  comingSoonBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  featuredVideoInfo: {
    padding: spacing.md,
  },
  featuredVideoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featuredVideoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  howItWorksCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  howItWorksTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  howItWorksSteps: {
    gap: spacing.md,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: "#FFF",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  stepDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  interviewsSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  interviewsGrid: {
    gap: spacing.sm,
  },
  interviewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  interviewIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  interviewContent: {
    flex: 1,
  },
  interviewTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  interviewGuest: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginTop: 1,
  },
  interviewDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  interviewLock: {
    opacity: 0.5,
  },
  notifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  notifyButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  footerCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "15",
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  footerCtaEmoji: {
    fontSize: 20,
  },
  footerCtaText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.fontSize.sm * 1.4,
  },
});
