
import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";

interface ProfileOption {
  title: string;
  icon: string;
  color: string;
}

interface StatItem {
  value: string;
  label: string;
  icon: string;
  color: string;
}

export default function ProfileScreen() {
  const stats: StatItem[] = [
    { value: '15', label: 'Days Active', icon: 'calendar', color: colors.primary },
    { value: '42', label: 'Prayers', icon: 'schedule', color: colors.accent },
    { value: '8', label: 'Day Streak', icon: 'local-fire-department', color: colors.error },
  ];

  const profileOptions: ProfileOption[] = [
    { title: 'Edit Profile', icon: 'edit', color: colors.primary },
    { title: 'Notifications', icon: 'notifications', color: colors.accent },
    { title: 'Prayer Settings', icon: 'settings', color: colors.info },
    { title: 'About', icon: 'info', color: colors.secondary },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <IconSymbol
              ios_icon_name="person-circle"
              android_material_icon_name="account-circle"
              size={88}
              color={colors.card}
            />
          </View>
          <Text style={styles.name}>User Name</Text>
          <Text style={styles.email}>user@example.com</Text>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
            <IconSymbol
              ios_icon_name="pencil"
              android_material_icon_name="edit"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <React.Fragment key={index}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                  <IconSymbol
                    ios_icon_name={stat.icon}
                    android_material_icon_name={stat.icon}
                    size={26}
                    color={colors.card}
                  />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Options List */}
        <View style={styles.optionsContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="settings"
                android_material_icon_name="settings"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          {profileOptions.map((option, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.optionCard}
                activeOpacity={0.7}
                onPress={() => console.log(`Pressed ${option.title}`)}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIconContainer, { backgroundColor: option.color }]}>
                    <IconSymbol
                      ios_icon_name={option.icon}
                      android_material_icon_name={option.icon}
                      size={24}
                      color={colors.card}
                    />
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                </View>
                <IconSymbol
                  ios_icon_name="chevron-right"
                  android_material_icon_name="chevron-right"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7}>
          <IconSymbol
            ios_icon_name="logout"
            android_material_icon_name="logout"
            size={22}
            color={colors.error}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 56 : 20,
    paddingHorizontal: spacing.xl,
  },
  profileHeader: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
    ...shadows.colored,
  },
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    marginBottom: spacing.lg,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  editButtonText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxxl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  optionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  logoutButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.error,
    ...shadows.medium,
  },
  logoutText: {
    ...typography.h4,
    color: colors.error,
  },
  bottomPadding: {
    height: 120,
  },
});
