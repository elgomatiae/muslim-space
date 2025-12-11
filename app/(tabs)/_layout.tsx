
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function TabLayout() {
  // Define the tabs configuration - Prayer tab removed
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: '(iman)',
      route: '/(tabs)/(iman)/',
      icon: 'track-changes',
      label: 'Iman',
    },
    {
      name: '(learning)',
      route: '/(tabs)/(learning)/',
      icon: 'school',
      label: 'Learn',
    },
    {
      name: '(wellness)',
      route: '/(tabs)/(wellness)/',
      icon: 'favorite',
      label: 'Wellness',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="iman" name="(iman)" />
        <Stack.Screen key="learning" name="(learning)" />
        <Stack.Screen key="wellness" name="(wellness)" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} containerWidth={screenWidth - 20} />
    </>
  );
}
