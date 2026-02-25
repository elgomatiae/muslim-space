
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useTranslation } from '@/contexts/I18nContext';

export default function TabLayout() {
  const { t } = useTranslation();
  
  // Define the tabs configuration with Iman Tracker in the middle
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: t('tabs.home'),
    },
    {
      name: '(learning)',
      route: '/(tabs)/(learning)/',
      icon: 'school',
      label: t('tabs.learning'),
    },
    {
      name: '(iman)',
      route: '/(tabs)/(iman)/',
      icon: 'target',
      iosIcon: 'target',
      label: t('tabs.iman'),
      isMainFeature: true,
    },
    {
      name: '(wellness)',
      route: '/(tabs)/(wellness)/',
      icon: 'spa',
      label: t('tabs.wellness'),
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: t('tabs.profile'),
    },
  ];

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  );
}
