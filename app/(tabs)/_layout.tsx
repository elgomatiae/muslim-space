
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary || '#9333EA',
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border || '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 88 : 68,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              ios_icon_name={focused ? 'house.fill' : 'house'}
              android_material_icon_name="home"
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(iman)"
        options={{
          title: 'Iman',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              ios_icon_name={focused ? 'chart.pie.fill' : 'chart.pie'}
              android_material_icon_name="pie-chart"
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(learning)"
        options={{
          title: 'Learning',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              ios_icon_name={focused ? 'book.fill' : 'book'}
              android_material_icon_name="menu-book"
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(wellness)"
        options={{
          title: 'Wellness',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              ios_icon_name={focused ? 'heart.fill' : 'heart'}
              android_material_icon_name="favorite"
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              ios_icon_name={focused ? 'person.fill' : 'person'}
              android_material_icon_name="person"
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
