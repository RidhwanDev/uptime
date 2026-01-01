import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../src/theme';
import { Button } from '../src/components';

export default function LoginScreen() {
  const router = useRouter();

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

        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            Commit to daily posting, track your streak, and compete on the leaderboard.
            Get featured when you stay consistent!
          </Text>
        </View>

        <Button
          title="Log in with TikTok"
          onPress={() => router.push('/(onboarding)/tiktok-auth')}
          variant="primary"
          size="large"
          style={styles.button}
        />
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing['3xl'],
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  description: {
    marginBottom: spacing['2xl'],
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
});

