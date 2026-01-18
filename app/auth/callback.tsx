import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator, Text, Alert } from "react-native";
import { colors, spacing, typography } from "../../src/theme";
import { useAuth } from "../../src/contexts/AuthContext";
import { completeAuthWithUrl } from "../../src/services/tiktokAuth";
import * as Linking from "expo-linking";

/**
 * OAuth callback handler
 * This route handles deep links like: socialuptime://auth/callback?code=...&state=...
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
  }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the full URL from params or initial URL
        const initialUrl = await Linking.getInitialURL();
        let callbackUrl: string | null = null;

        // Try to construct URL from params
        if (params.code || params.error) {
          // Build URL string manually since URL constructor might not work with custom schemes
          const parts: string[] = [];
          if (params.code)
            parts.push(`code=${encodeURIComponent(params.code)}`);
          if (params.state)
            parts.push(`state=${encodeURIComponent(params.state)}`);
          if (params.error)
            parts.push(`error=${encodeURIComponent(params.error)}`);
          callbackUrl = `socialuptime://auth/callback?${parts.join("&")}`;
        } else if (initialUrl && initialUrl.includes("auth/callback")) {
          callbackUrl = initialUrl;
        }

        if (!callbackUrl) {
          console.error("No callback URL found");
          setError("No callback URL found");
          setTimeout(() => router.replace("/login"), 2000);
          return;
        }

        console.log("📥 Processing callback URL:", callbackUrl);

        // Complete authentication
        const result = await completeAuthWithUrl(callbackUrl);

        if (result.success && result.tokens && result.userInfo) {
          await login(result.tokens, result.userInfo);
          router.replace("/(tabs)/dashboard");
        } else {
          setError(result.error || "Authentication failed");
          Alert.alert(
            "Authentication Failed",
            result.error || "Please try again.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/login"),
              },
            ]
          );
        }
      } catch (error) {
        console.error("Error handling auth callback:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setTimeout(() => router.replace("/login"), 2000);
      }
    };

    handleCallback();
  }, [params, router, login]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
        padding: spacing.lg,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text
        style={{
          marginTop: spacing.md,
          color: error ? colors.error : colors.textSecondary,
          textAlign: "center",
        }}
      >
        {error || "Completing login..."}
      </Text>
      {error && (
        <Text
          style={{
            marginTop: spacing.sm,
            color: colors.textTertiary,
            fontSize: typography.fontSize.sm,
            textAlign: "center",
          }}
        >
          Redirecting to login...
        </Text>
      )}
    </View>
  );
}
