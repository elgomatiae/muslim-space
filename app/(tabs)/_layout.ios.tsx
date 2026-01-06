
import React from 'react';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: '#FFFFFF', // White background
          borderTopColor: colors.border,
          height: 88,
          paddingBottom: 20,
          paddingTop: 8,
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
        name="(iman)"
        options={{
          title: 'Iman',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              ios_icon_name={focused ? 'heart.fill' : 'heart'}
              android_material_icon_name="favorite"
              size={36}
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
              ios_icon_name={focused ? 'heart.circle.fill' : 'heart.circle'}
              android_material_icon_name="spa"
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
