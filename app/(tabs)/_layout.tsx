
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define the tabs configuration with Iman Tracker in the middle
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: '(learning)',
      route: '/(tabs)/(learning)/',
      icon: 'school',
      label: 'Learning',
    },
    {
      name: '(iman)',
      route: '/(tabs)/(iman)/',
      icon: 'favorite',
      label: 'Iman',
      isMainFeature: true, // Flag to make this icon larger
    },
    {
      name: '(wellness)',
      route: '/(tabs)/(wellness)/',
      icon: 'spa',
      label: 'Wellness',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: '#FFFFFF' }, // White background
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="learning" name="(learning)" />
        <Stack.Screen key="iman" name="(iman)" />
        <Stack.Screen key="wellness" name="(wellness)" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
