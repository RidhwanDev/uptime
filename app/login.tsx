import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Alert, Animated, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../src/theme";
import { useAuth } from "../src/contexts/AuthContext";
import { authenticateWithTikTok } from "../src/services/tiktokAuth";
import {
  FloatingComments,
  LogoSection,
  FeaturesSection,
  LoginButton,
  TermsText,
} from "./login/components";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Wait for logo animation, then animate content
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    return () => clearTimeout(timer);
  }, []);

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
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#0B0A14", "#1A1528", "#0B0A14"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <FloatingComments />

      <LinearGradient
        colors={[
          "transparent",
          "rgba(11, 10, 20, 0.3)",
          "rgba(11, 10, 20, 0.9)",
          colors.background,
        ]}
        locations={[0, 0.35, 0.65, 0.85]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <LogoSection />
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <FeaturesSection />
          <LoginButton isLoading={isLoading} onPress={handleTikTokLogin} />
          <TermsText />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: height * 0.2,
    paddingBottom: spacing["2xl"],
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
  },
});
