import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "./types";
import {
  WelcomeScreen,
  SignUpScreen,
  SignInScreen,
  TikTokAuthScreen,
  TimezoneSelectionScreen,
} from "../screens";
import { TestScreen } from "../screens/TestScreen";
import { colors } from "../theme";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={TestScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ title: "Sign Up" }}
      />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ title: "Sign In" }}
      />
      <Stack.Screen
        name="TikTokAuth"
        component={TikTokAuthScreen}
        options={{ title: "Connect TikTok" }}
      />
      <Stack.Screen
        name="TimezoneSelection"
        component={TimezoneSelectionScreen}
        options={{ title: "Select Timezone" }}
      />
    </Stack.Navigator>
  );
};
