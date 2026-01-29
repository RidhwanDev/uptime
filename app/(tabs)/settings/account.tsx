import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../../src/theme";
import { useAuth } from "../../../src/contexts/AuthContext";
import { deleteUserAccount } from "../../../src/services/supabaseSync";

export default function AccountSettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete:\n\n• Your profile\n• All your posts and stats\n• Your achievements\n• Your leaderboard position",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              "Final Confirmation",
              "This will permanently delete your account. Are you absolutely sure?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete My Account",
                  style: "destructive",
                  onPress: async () => {
                    if (!user?.id || !user?.tiktokUserId) {
                      Alert.alert("Error", "Unable to identify user account.");
                      return;
                    }

                    try {
                      const success = await deleteUserAccount(
                        user.id,
                        user.tiktokUserId
                      );

                      if (success) {
                        // Logout and redirect to login
                        await logout();
                        router.replace("/login");
                      } else {
                        Alert.alert(
                          "Error",
                          "Failed to delete account. Please try again or contact support."
                        );
                      }
                    } catch (error) {
                      console.error("Error deleting account:", error);
                      Alert.alert(
                        "Error",
                        "An unexpected error occurred. Please try again or contact support."
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          title: "Account",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>TikTok Handle</Text>
              <Text style={styles.infoValue}>
                @{user?.tiktokHandle || "unknown"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Display Name</Text>
              <Text style={styles.infoValue}>
                {user?.displayName || user?.tiktokHandle || "User"}
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <Ionicons
                name="warning"
                size={20}
                color={colors.error}
                style={styles.dangerIcon}
              />
              <View style={styles.dangerTextContainer}>
                <Text style={styles.dangerTitle}>Delete Account</Text>
                <Text style={styles.dangerDescription}>
                  Permanently delete your account and all associated data. This
                  action cannot be undone. This deletes your Social Uptime
                  account, it does not affect your TikTok account.
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </Pressable>
          </View>
        </View>

        {/* Info Footer */}
        <View style={styles.footer}>
          <Ionicons
            name="information-circle"
            size={16}
            color={colors.textTertiary}
          />
          <Text style={styles.footerText}>
            If you're having issues with your account, consider contacting
            support before deleting.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  dangerCard: {
    backgroundColor: colors.error + "10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error + "30",
    padding: spacing.md,
    gap: spacing.md,
  },
  dangerHeader: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dangerIcon: {
    marginTop: 2,
  },
  dangerTextContainer: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  dangerDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.error + "20",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error + "40",
  },
  deleteButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    alignItems: "flex-start",
    marginTop: spacing.md,
  },
  footerText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});
