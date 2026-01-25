import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../../src/theme";

export function TermsText() {
  return (
    <Text style={styles.terms}>
      By continuing, you agree to our{" "}
      <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
      <Text style={styles.termsLink}>Privacy Policy</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  terms: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});

