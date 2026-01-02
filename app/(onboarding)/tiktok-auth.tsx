import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "../../src/theme";
import { Button } from "../../src/components";
import { useAuth } from "../../src/contexts/AuthContext";
import { authenticateWithTikTok } from "../../src/services/tiktokAuth";

export default function TikTokAuthScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTikTokAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authenticateWithTikTok();

      if (result.success && result.tokens && result.userInfo) {
        // Store tokens and user info using auth context
        await login(result.tokens, result.userInfo);
        
        // Redirect to dashboard
        router.replace("/(tabs)/dashboard");
      } else {
        setError(result.error || "Authentication failed. Please try again.");
      }
    } catch (err) {
      console.error("TikTok auth error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Connect TikTok</Text>
        <Text style={styles.subtitle}>
          Connect your TikTok account to track your daily posts
        </Text>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          title={isLoading ? "Connecting..." : "Log in with TikTok"}
          onPress={handleTikTokAuth}
          variant="primary"
          size="large"
          style={styles.button}
          disabled={isLoading}
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  button: {
    marginBottom: spacing.md,
  },
  errorContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.error + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
