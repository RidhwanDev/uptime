import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { OnboardingStack } from './OnboardingStack';
// Temporarily commenting out to isolate the error
// import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  // TODO: Add auth state check here
  // For now, show onboarding flow
  const isAuthenticated = false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingStack} />
      {/* Temporarily commented out
      {isAuthenticated && (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
      */}
    </Stack.Navigator>
  );
};

