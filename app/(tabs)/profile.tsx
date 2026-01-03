import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { Card, Button } from '../../src/components';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header with Avatar */}
        <View style={styles.profileHeader}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {user?.tiktokHandle?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.displayName}>{user?.tiktokHandle || 'User'}</Text>
          <Text style={styles.userId}>@{user?.tiktokHandle || 'unknown'}</Text>
        </View>

        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Personal Stats</Text>
          <Text style={styles.cardText}>Coming soon - Your stats will appear here</Text>
        </Card>

        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <Text style={styles.cardText}>Daily posting commitment</Text>
        </Card>

        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Recent Posts</Text>
          <Text style={styles.cardText}>Verified posts will appear here</Text>
        </Card>

        <Button
          title="Settings"
          onPress={() => console.log('Settings pressed')}
          variant="outline"
          size="medium"
          style={styles.button}
        />

        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="secondary"
          size="medium"
          style={styles.logoutButton}
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
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholderText: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  displayName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userId: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.lg,
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
  button: {
    marginTop: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
});

