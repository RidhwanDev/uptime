import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { Button } from '../../src/components';
import { useAuth } from '../../src/contexts/AuthContext';
import { authenticateWithTikTok } from '../../src/services/tiktokAuth';

export default function SignInScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleTikTokLogin = async () => {
    setIsLoading(true);
    try {
      const result = await authenticateWithTikTok();

      if (result.success && result.tokens && result.userInfo) {
        await login(result.tokens, result.userInfo);
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Please try again.'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Sign in screen - Coming soon</Text>
        <Button
          title={isLoading ? "Connecting..." : "Continue with TikTok"}
          onPress={handleTikTokLogin}
          variant="primary"
          size="large"
          style={styles.button}
          disabled={isLoading}
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

