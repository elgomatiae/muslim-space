
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS } from 'react-native';

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={DynamicColorIOS({
        dark: 'rgba(0, 0, 0, 0.95)',
        light: 'rgba(255, 255, 255, 0.95)',
      })}
      tintColor={DynamicColorIOS({
        dark: '#A78BFA',
        light: '#8B5CF6',
      })}
      iconColor={DynamicColorIOS({
        dark: '#D1D5DB',
        light: '#6B7280',
      })}
      labelStyle={{
        color: DynamicColorIOS({
          dark: '#E5E7EB',
          light: '#374151',
        }),
        fontSize: 10,
        fontWeight: '600',
      }}
      labelVisibilityMode="labeled"
      disableTransparentOnScrollEdge
      blurEffect="systemChromeMaterial"
    >
      <NativeTabs.Trigger name="(home)">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="(learning)">
        <Icon sf={{ default: 'book', selected: 'book.fill' }} />
        <Label>Learn</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="(iman)">
        <Icon sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }} />
        <Label>Iman</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="(wellness)">
        <Icon sf={{ default: 'heart', selected: 'heart.fill' }} />
        <Label>Wellness</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="admin-panel" hidden />
    </NativeTabs>
  );
}
