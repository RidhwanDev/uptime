import { Stack } from "expo-router";
import { colors } from "../../src/theme";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerBackTitle: "Profile",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    />
  );
}

