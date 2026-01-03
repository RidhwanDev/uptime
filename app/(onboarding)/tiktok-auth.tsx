import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { colors, spacing, typography } from "../../src/theme";
import { Button } from "../../src/components";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  authenticateWithTikTok,
  completeAuthWithUrl,
  getTikTokRedirectUri,
} from "../../src/services/tiktokAuth";

export default function TikTokAuthScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [pastedUrl, setPastedUrl] = useState("");

  useEffect(() => {
    setRedirectUri(getTikTokRedirectUri());
  }, []);

  const handleTikTokAuth = async () => {
    setIsLoading(true);
    setError(null);
    setShowUrlInput(false);

    try {
      const result = await authenticateWithTikTok();

      if (result.success && result.tokens && result.userInfo) {
        await login(result.tokens, result.userInfo);
        router.replace("/(tabs)/dashboard");
      } else if (result.error === "SHOW_URL_INPUT") {
        // Browser was closed - show URL input fallback
        setShowUrlInput(true);
        setError(
          "Copy the full URL from the browser (even if it shows 'Forbidden') and paste it below."
        );
      } else {
        setError(result.error || "Authentication failed. Please try again.");
      }
    } catch (err) {
      console.error("TikTok auth error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setPastedUrl(text);
    }
  };

  const handleSubmitUrl = async () => {
    if (!pastedUrl.trim()) {
      Alert.alert("Error", "Please paste the redirect URL");
      return;
    }

    if (!pastedUrl.includes("code=")) {
      Alert.alert(
        "Invalid URL",
        "The URL should contain a 'code' parameter. Make sure you copied the full URL from the browser."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await completeAuthWithUrl(pastedUrl);

      if (result.success && result.tokens && result.userInfo) {
        await login(result.tokens, result.userInfo);
        router.replace("/(tabs)/dashboard");
      } else {
        setError(result.error || "Authentication failed. Please try again.");
      }
    } catch (err) {
      console.error("TikTok auth error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Connect TikTok</Text>
        <Text style={styles.subtitle}>
          Connect your TikTok account to track your daily posts
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!showUrlInput ? (
          <Button
            title={isLoading ? "Connecting..." : "Log in with TikTok"}
            onPress={handleTikTokAuth}
            variant="primary"
            size="large"
            style={styles.button}
            disabled={isLoading}
          />
        ) : (
          <View style={styles.urlInputContainer}>
            <Text style={styles.instructionText}>
              1. Copy the full URL from your browser's address bar{"\n"}
              2. Paste it below{"\n"}
              3. Tap "Complete Login"
            </Text>

            <TextInput
              style={styles.urlInput}
              placeholder="Paste the redirect URL here..."
              placeholderTextColor={colors.textSecondary}
              value={pastedUrl}
              onChangeText={setPastedUrl}
              multiline
              numberOfLines={3}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.buttonRow}>
              <Button
                title="Paste from Clipboard"
                onPress={handlePasteFromClipboard}
                variant="secondary"
                size="medium"
                style={styles.pasteButton}
              />
            </View>

            <Button
              title={isLoading ? "Completing..." : "Complete Login"}
              onPress={handleSubmitUrl}
              variant="primary"
              size="large"
              style={styles.button}
              disabled={isLoading || !pastedUrl.trim()}
            />

            <Button
              title="Try Again"
              onPress={() => {
                setShowUrlInput(false);
                setPastedUrl("");
                setError(null);
              }}
              variant="secondary"
              size="medium"
              style={styles.button}
            />
          </View>
        )}

        {/* Debug info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugLabel}>Redirect URI for TikTok:</Text>
          <Text style={styles.debugText} selectable>
            {redirectUri}
          </Text>
        </View>
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
    flexGrow: 1,
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
    backgroundColor: colors.error + "20",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: "center",
  },
  urlInputContainer: {
    marginBottom: spacing.lg,
  },
  instructionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  urlInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textDark,
    fontSize: typography.fontSize.sm,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  buttonRow: {
    marginBottom: spacing.sm,
  },
  pasteButton: {
    marginBottom: spacing.sm,
  },
  debugContainer: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    opacity: 0.7,
  },
  debugLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontFamily: "monospace",
  },
});
