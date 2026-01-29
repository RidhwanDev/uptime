import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "../src/theme";
import { AuthProvider } from "../src/contexts/AuthContext";

const getTitleFromPath = (path: string): string => {
  console.log(path);
  return (
    path
      .split("/")
      ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      ?.join(" ") || "Profile"
  );
};
export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: "Back" }}
          />
          <Stack.Screen
            name="settings"
            options={({ route, navigation }) => {
              console.log("navigation", navigation.getState().routes.path);
              console.log("route", route);
              console.log(getTitleFromPath(route.path || ""));
              return {
                headerShown: false,
                // headerBackTitle: "Profile",
                title: getTitleFromPath(route.path || ""),
              };
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
