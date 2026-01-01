import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { Button } from '../../src/components';

export default function TimezoneSelectionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Select Timezone</Text>
        <Text style={styles.subtitle}>
          Choose your timezone to track your daily posting schedule
        </Text>
        <Button
          title="Continue"
          onPress={() => {
            // TODO: Implement timezone selection
            // For now, navigate to main app
            router.replace('/(tabs)/dashboard');
          }}
          variant="primary"
          size="large"
          style={styles.button}
        />
        <Button
          title="Back"
          onPress={() => router.back()}
          variant="ghost"
          size="medium"
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
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    marginBottom: spacing.md,
  },
});

