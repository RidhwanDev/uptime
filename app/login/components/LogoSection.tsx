import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, Animated } from "react-native";
import { colors, spacing, typography } from "../../../src/theme";

interface LogoSectionProps {
  onAnimationComplete?: () => void;
}

export function LogoSection({ onAnimationComplete }: LogoSectionProps) {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete?.();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.logoContainer,
        {
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        },
      ]}
    >
      <View style={styles.logoWrapper}>
        <Image
          source={require("../../../assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.appName}>Social Uptime</Text>
      <Text style={styles.tagline}>Stay Consistent. Get Featured.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    paddingTop: spacing.xl,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});

