
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define the tabs configuration with Iman in the center
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      iosIcon: 'house.fill',
      label: 'Home',
    },
    {
      name: '(learning)',
      route: '/(tabs)/(learning)/',
      icon: 'school',
      iosIcon: 'book.fill',
      label: 'Learn',
    },
    {
      name: '(iman)',
      route: '/(tabs)/(iman)/',
      icon: 'track-changes',
      iosIcon: 'chart.pie.fill',
      label: 'Iman',
    },
    {
      name: '(wellness)',
      route: '/(tabs)/(wellness)/',
      icon: 'favorite',
      iosIcon: 'heart.fill',
      label: 'Wellness',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      iosIcon: 'person.fill',
      label: 'Profile',
    },
  ];

  // For Android and Web, use Stack navigation with custom tab bar at the bottom
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen name="(home)" />
          <Stack.Screen name="(iman)" />
          <Stack.Screen name="(learning)" />
          <Stack.Screen name="(wellness)" />
          <Stack.Screen name="profile" />
          <Stack.Screen 
            name="admin-panel"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
        </Stack>
      </View>
      <FloatingTabBar tabs={tabs} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  content: {
    flex: 1,
  },
});
