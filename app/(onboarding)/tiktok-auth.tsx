import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "../../src/theme";
import { Button } from "../../src/components";

export default function TikTokAuthScreen() {
  const router = useRouter();

  const handleTikTokAuth = async () => {
    // TODO: Implement TikTok OAuth flow
    // After OAuth completes, you would:
    // 1. Store tokens
    // 2. Set auth state (update the isAuthenticated in _layout.tsx)
    // 3. Redirect to tabs - the root layout will handle showing tabs

    // Simulate OAuth completion
    // In real implementation, this would be:
    // const result = await TikTokOAuth.authenticate();
    // if (result.success) {
    //   await saveTokens(result.tokens);
    //   setAuthState(true); // Update auth context/state
    //   router.replace('/(tabs)/dashboard');
    // }

    // For now, just redirect to tabs
    // Once you implement auth state management, update _layout.tsx to check real auth
    router.replace("/(tabs)/dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Connect TikTok</Text>
        <Text style={styles.subtitle}>
          Connect your TikTok account to track your daily posts
        </Text>
        <Button
          title="Log in with TikTok"
          onPress={handleTikTokAuth}
          variant="primary"
          size="large"
          style={styles.button}
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
});
