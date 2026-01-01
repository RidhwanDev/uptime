import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="sign-up"
        options={{ title: 'Sign Up' }}
      />
      <Stack.Screen
        name="sign-in"
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen
        name="tiktok-auth"
        options={{ title: 'Connect TikTok' }}
      />
      <Stack.Screen
        name="timezone-selection"
        options={{ title: 'Select Timezone' }}
      />
    </Stack>
  );
}

