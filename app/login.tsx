import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "../src/theme";
import { Button } from "../src/components";
import { useAuth } from "../src/contexts/AuthContext";
import { authenticateWithTikTok } from "../src/services/tiktokAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { bypassLogin, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleBypass = async () => {
    await bypassLogin();
    router.replace("/(tabs)/dashboard");
  };

  const handleTikTokLogin = async () => {
    setIsLoading(true);
    try {
      const result = await authenticateWithTikTok();

      if (result.success && result.tokens && result.userInfo) {
        await login(result.tokens, result.userInfo);
        router.replace("/(tabs)/dashboard");
      } else {
        Alert.alert(
          "Authentication Failed",
          result.error || "Please try again."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Social Uptime</Text>
          <Text style={styles.subtitle}>Social Attendance for Creators</Text>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            Commit to daily posting, track your streak, and compete on the
            leaderboard. Get featured when you stay consistent!
          </Text>
        </View>

        <Button
          title={isLoading ? "Connecting..." : "Log in with TikTok"}
          onPress={handleTikTokLogin}
          variant="primary"
          size="large"
          style={styles.button}
          disabled={isLoading}
        />

        {/* DEV ONLY - Bypass button */}
        <Button
          title="🚧 DEV: Bypass Login"
          onPress={handleBypass}
          variant="secondary"
          size="medium"
          style={styles.devButton}
        />
        <Text style={styles.devNote}>
          Development only - bypasses authentication
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    marginBottom: spacing["3xl"],
    alignItems: "center",
  },
  title: {
    fontSize: typography.fontSize["5xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  description: {
    marginBottom: spacing["2xl"],
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    textAlign: "center",
  },
  button: {
    marginTop: spacing.md,
  },
  devButton: {
    marginTop: spacing.xl,
    opacity: 0.7,
  },
  devNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
});
