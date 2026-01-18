import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NOTIFICATION_PREFS_KEY = "notification_preferences";
const NOTIFICATION_IDS_KEY = "notification_ids";

interface NotificationPreferences {
  daily_reminder: boolean;
  weekly_leaderboard: boolean;
  badge_earned: boolean;
  featured_content: boolean;
}

interface NotificationIds {
  daily_reminder?: string;
  weekly_leaderboard?: string;
  featured_content?: string;
}

/**
 * Request notification permissions
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF0050",
      });
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}

/**
 * Get notification preferences from storage
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const prefsStr = await SecureStore.getItemAsync(NOTIFICATION_PREFS_KEY);
    if (prefsStr) {
      return JSON.parse(prefsStr);
    }
  } catch (error) {
    console.error("Error getting notification preferences:", error);
  }

  // Default preferences
  return {
    daily_reminder: true,
    weekly_leaderboard: true,
    badge_earned: true,
    featured_content: false,
  };
}

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      NOTIFICATION_PREFS_KEY,
      JSON.stringify(preferences)
    );
  } catch (error) {
    console.error("Error saving notification preferences:", error);
  }
}

/**
 * Get stored notification IDs
 */
async function getNotificationIds(): Promise<NotificationIds> {
  try {
    const idsStr = await SecureStore.getItemAsync(NOTIFICATION_IDS_KEY);
    if (idsStr) {
      return JSON.parse(idsStr);
    }
  } catch (error) {
    console.error("Error getting notification IDs:", error);
  }
  return {};
}

/**
 * Save notification IDs
 */
async function saveNotificationIds(ids: NotificationIds): Promise<void> {
  try {
    await SecureStore.setItemAsync(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error("Error saving notification IDs:", error);
  }
}

/**
 * Schedule daily reminder notification
 * @param hour - Hour of day (0-23), defaults to 9 AM
 */
export async function scheduleDailyReminder(hour: number = 9): Promise<string | null> {
  try {
    // Cancel existing daily reminder
    await cancelDailyReminder();

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn("Notification permissions not granted");
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Post! 📱",
        body: "Don't break your streak! Post a TikTok video today to keep your momentum going.",
        sound: true,
        data: { type: "daily_reminder" },
      },
      trigger: {
        hour,
        minute: 0,
        repeats: true,
      },
    });

    // Save notification ID
    const ids = await getNotificationIds();
    ids.daily_reminder = notificationId;
    await saveNotificationIds(ids);

    console.log("✅ Daily reminder scheduled for", hour, ":00");
    return notificationId;
  } catch (error) {
    console.error("Error scheduling daily reminder:", error);
    return null;
  }
}

/**
 * Cancel daily reminder notification
 */
export async function cancelDailyReminder(): Promise<void> {
  try {
    const ids = await getNotificationIds();
    if (ids.daily_reminder) {
      await Notifications.cancelScheduledNotificationAsync(ids.daily_reminder);
      delete ids.daily_reminder;
      await saveNotificationIds(ids);
    }
  } catch (error) {
    console.error("Error canceling daily reminder:", error);
  }
}

/**
 * Schedule weekly leaderboard results notification
 * @param dayOfWeek - Day of week (0 = Sunday, 6 = Saturday), defaults to Sunday
 * @param hour - Hour of day, defaults to 20 (8 PM)
 */
export async function scheduleWeeklyLeaderboard(
  dayOfWeek: number = 0,
  hour: number = 20
): Promise<string | null> {
  try {
    // Cancel existing weekly notification
    await cancelWeeklyLeaderboard();

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn("Notification permissions not granted");
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weekly Leaderboard Results 🏆",
        body: "Check where you placed this week! Keep up the consistency!",
        sound: true,
        data: { type: "weekly_leaderboard" },
      },
      trigger: {
        weekday: dayOfWeek === 0 ? 1 : dayOfWeek + 1, // iOS uses 1-7 (Sunday = 1)
        hour,
        minute: 0,
        repeats: true,
      },
    });

    // Save notification ID
    const ids = await getNotificationIds();
    ids.weekly_leaderboard = notificationId;
    await saveNotificationIds(ids);

    console.log("✅ Weekly leaderboard notification scheduled");
    return notificationId;
  } catch (error) {
    console.error("Error scheduling weekly leaderboard:", error);
    return null;
  }
}

/**
 * Cancel weekly leaderboard notification
 */
export async function cancelWeeklyLeaderboard(): Promise<void> {
  try {
    const ids = await getNotificationIds();
    if (ids.weekly_leaderboard) {
      await Notifications.cancelScheduledNotificationAsync(ids.weekly_leaderboard);
      delete ids.weekly_leaderboard;
      await saveNotificationIds(ids);
    }
  } catch (error) {
    console.error("Error canceling weekly leaderboard:", error);
  }
}

/**
 * Send immediate badge achievement notification
 */
export async function sendBadgeAchievement(
  badgeName: string,
  description: string
): Promise<void> {
  try {
    const prefs = await getNotificationPreferences();
    if (!prefs.badge_earned) {
      return; // User has disabled badge notifications
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 Achievement Unlocked: ${badgeName}`,
        body: description,
        sound: true,
        data: { type: "badge_earned", badgeName },
      },
      trigger: null, // Immediate
    });

    console.log("✅ Badge achievement notification sent:", badgeName);
  } catch (error) {
    console.error("Error sending badge achievement:", error);
  }
}

/**
 * Schedule featured content notification
 */
export async function scheduleFeaturedContent(
  title: string,
  body: string,
  scheduledTime?: Date
): Promise<string | null> {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn("Notification permissions not granted");
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `✨ ${title}`,
        body,
        sound: true,
        data: { type: "featured_content" },
      },
      trigger: scheduledTime
        ? scheduledTime
        : null, // Immediate if no time specified
    });

    console.log("✅ Featured content notification scheduled");
    return notificationId;
  } catch (error) {
    console.error("Error scheduling featured content:", error);
    return null;
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await saveNotificationIds({});
    console.log("✅ All notifications canceled");
  } catch (error) {
    console.error("Error canceling all notifications:", error);
  }
}

/**
 * Update notification schedules based on preferences
 */
export async function updateNotificationSchedules(
  preferences: NotificationPreferences
): Promise<void> {
  try {
    // Save preferences
    await saveNotificationPreferences(preferences);

    // Request permissions if any notification is enabled
    const anyEnabled = Object.values(preferences).some((v) => v);
    if (anyEnabled) {
      await requestPermissions();
    }

    // Schedule or cancel based on preferences
    if (preferences.daily_reminder) {
      await scheduleDailyReminder(); // Default 9 AM
    } else {
      await cancelDailyReminder();
    }

    if (preferences.weekly_leaderboard) {
      await scheduleWeeklyLeaderboard(); // Default Sunday 8 PM
    } else {
      await cancelWeeklyLeaderboard();
    }

    // Badge achievements are immediate, no scheduling needed
    // Featured content is scheduled manually when content is released
  } catch (error) {
    console.error("Error updating notification schedules:", error);
  }
}

/**
 * Check for badge achievements based on stats
 */
export async function checkBadgeAchievements(
  currentStreak: number,
  uptimePercent: number,
  totalPosts: number,
  previousStreak?: number,
  previousUptime?: number,
  previousPosts?: number
): Promise<void> {
  const achievements: Array<{ name: string; description: string }> = [];

  // Streak achievements
  if (currentStreak >= 7 && (!previousStreak || previousStreak < 7)) {
    achievements.push({
      name: "Week Warrior",
      description: "You've posted for 7 days straight! 🔥",
    });
  }
  if (currentStreak >= 30 && (!previousStreak || previousStreak < 30)) {
    achievements.push({
      name: "Monthly Master",
      description: "30 days of consistency! You're unstoppable! 💪",
    });
  }
  if (currentStreak >= 100 && (!previousStreak || previousStreak < 100)) {
    achievements.push({
      name: "Century Club",
      description: "100 days of posting! Legend status! 👑",
    });
  }

  // Uptime achievements
  if (uptimePercent >= 50 && (!previousUptime || previousUptime < 50)) {
    achievements.push({
      name: "Halfway Hero",
      description: "50% uptime! You're more consistent than half the creators! ⭐",
    });
  }
  if (uptimePercent >= 80 && (!previousUptime || previousUptime < 80)) {
    achievements.push({
      name: "Uptime Elite",
      description: "80% uptime! You're in the top tier! 🏆",
    });
  }
  if (uptimePercent >= 95 && (!previousUptime || previousUptime < 95)) {
    achievements.push({
      name: "Near Perfect",
      description: "95% uptime! Almost perfect consistency! 🌟",
    });
  }

  // Post count achievements
  if (totalPosts >= 50 && (!previousPosts || previousPosts < 50)) {
    achievements.push({
      name: "Content Creator",
      description: "50 posts! You're building a library! 📚",
    });
  }
  if (totalPosts >= 100 && (!previousPosts || previousPosts < 100)) {
    achievements.push({
      name: "Century Content",
      description: "100 posts! That's a lot of content! 🎬",
    });
  }

  // Send notifications for all new achievements
  for (const achievement of achievements) {
    await sendBadgeAchievement(achievement.name, achievement.description);
  }
}

