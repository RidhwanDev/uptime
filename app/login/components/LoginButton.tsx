import React, { useRef } from "react";
import { Pressable, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../../src/theme";

interface LoginButtonProps {
  isLoading: boolean;
  onPress: () => void;
}

export function LoginButton({ isLoading, onPress }: LoginButtonProps) {
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
      <Pressable
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={handlePress}
        disabled={isLoading}
      >
        <LinearGradient
          colors={isLoading ? ["#333", "#333"] : ["#FF0050", "#FF3366"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.loginButtonGradient}
        >
          {isLoading ? (
            <Text style={styles.loginButtonText}>Connecting...</Text>
          ) : (
            <>
              <Ionicons name="musical-notes" size={22} color="#FFF" />
              <Text style={styles.loginButtonText}>Continue with TikTok</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
  loginButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: "#FFF",
  },
});

