import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import type { MainTabParamList } from './types';
import {
  DashboardScreen,
  LeaderboardScreen,
  FeaturedScreen,
  ProfileScreen,
} from '../screens';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const HomeIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20 }}>🏠</Text>
);

const LeaderboardIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20 }}>🏆</Text>
);

const FeaturedIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20 }}>⭐</Text>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 20 }}>👤</Text>
);

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color }) => <LeaderboardIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Featured"
        component={FeaturedScreen}
        options={{
          tabBarIcon: ({ color }) => <FeaturedIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

