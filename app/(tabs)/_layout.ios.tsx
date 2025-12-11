
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor={colors.primary}
      iconColor={colors.textSecondary}
      barTintColor="#000000"
    >
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="iman" name="(iman)">
        <Icon sf="chart.pie.fill" />
        <Label>Iman</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="learning" name="(learning)">
        <Icon sf="book.fill" />
        <Label>Learn</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="wellness" name="(wellness)">
        <Icon sf="heart.fill" />
        <Label>Wellness</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
