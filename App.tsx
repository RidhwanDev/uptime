import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "./src/theme";
import { Button, Card } from "./src/components";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Uptime</Text>
          <Text style={styles.subtitle}>Social Attendance for Creators</Text>
        </View>

        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Welcome!</Text>
          <Text style={styles.cardText}>
            This is your design system in action. Beautiful components ready to
            use.
          </Text>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Get Started"
            onPress={() => console.log("Get Started pressed!")}
            variant="primary"
            size="large"
          />
          <Button
            title="Learn More"
            onPress={() => console.log("Learn More pressed!")}
            variant="outline"
            size="medium"
            style={styles.secondaryButton}
          />
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
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
  card: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
});
