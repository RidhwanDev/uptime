import { Stack } from "expo-router";
import { colors } from "../../../src/theme";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerBackVisible: true,
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerShown: true,
      }}
    />
  );
}
