import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../../src/theme";

export function FeaturesSection() {
  return (
    <View style={styles.features}>
      <View style={styles.featureItem}>
        <View
          style={[
            styles.featureIcon,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Ionicons name="flame" size={18} color={colors.primary} />
        </View>
        <Text style={styles.featureText}>Track your streak</Text>
      </View>
      <View style={styles.featureDivider} />
      <View style={styles.featureItem}>
        <View
          style={[
            styles.featureIcon,
            { backgroundColor: colors.warning + "20" },
          ]}
        >
          <Ionicons name="trophy" size={18} color={colors.warning} />
        </View>
        <Text style={styles.featureText}>Compete globally</Text>
      </View>
      <View style={styles.featureDivider} />
      <View style={styles.featureItem}>
        <View
          style={[
            styles.featureIcon,
            { backgroundColor: colors.accent + "20" },
          ]}
        >
          <Ionicons name="star" size={18} color={colors.accent} />
        </View>
        <Text style={styles.featureText}>Get featured</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  features: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  featureItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  featureDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
});

