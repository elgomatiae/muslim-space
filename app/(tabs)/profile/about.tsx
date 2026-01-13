
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Constants from 'expo-constants';

export default function AboutScreen() {
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log(`Don't know how to open URI: ${url}`);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const aboutSections = [
    {
      title: 'App Information',
      items: [
        { label: 'Version', value: appVersion },
        { label: 'Build', value: buildNumber },
        { label: 'Platform', value: Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web' },
      ],
    },
    {
      title: 'Features',
      items: [
        { label: 'Prayer Times', value: 'Accurate prayer times based on your location' },
        { label: 'Iman Tracker', value: 'Track your spiritual growth across three dimensions' },
        { label: 'Quran & Hadith', value: 'Daily verses and sayings of the Prophet (PBUH)' },
        { label: 'Wellness Hub', value: 'Mental and physical health resources' },
        { label: 'Learning Center', value: 'Expand your Islamic knowledge' },
        { label: 'Achievements', value: 'Unlock achievements as you progress' },
      ],
    },
    {
      title: 'Support',
      items: [
        { 
          label: 'Privacy Policy', 
          value: 'View our privacy policy',
          action: () => handleOpenLink('https://example.com/privacy'),
        },
        { 
          label: 'Terms of Service', 
          value: 'Read our terms of service',
          action: () => handleOpenLink('https://example.com/terms'),
        },
        { 
          label: 'Contact Us', 
          value: 'Get in touch with our team',
          action: () => handleOpenLink('mailto:support@example.com'),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* App Header Card */}
        <View style={styles.appHeaderCard}>
          <LinearGradient
            colors={colors.gradientPrimary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.appHeaderGradient}
          >
            <View style={styles.appIconContainer}>
              <IconSymbol
                ios_icon_name="moon.stars.fill"
                android_material_icon_name="self-improvement"
                size={64}
                color={colors.card}
              />
            </View>
            <Text style={styles.appName}>Muslim Lifestyle</Text>
            <Text style={styles.appTagline}>Your Companion for Spiritual Growth</Text>
          </LinearGradient>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            A comprehensive app designed to help you track your Islamic lifestyle, prayers, Quran reading, and spiritual growth. 
            May Allah accept your efforts and guide you on the straight path.
          </Text>
        </View>

        {/* Sections */}
        {aboutSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.infoRow,
                    itemIndex < section.items.length - 1 && styles.infoRowWithBorder,
                    item.action && styles.infoRowAction,
                  ]}
                  onPress={item.action}
                  disabled={!item.action}
                  activeOpacity={item.action ? 0.7 : 1}
                >
                  <View style={styles.infoLeft}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                  {item.action && (
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credits</Text>
          <View style={styles.card}>
            <View style={styles.creditRow}>
              <Text style={styles.creditText}>
                Built with ❤️ for the Muslim community
              </Text>
            </View>
            <View style={styles.creditRow}>
              <Text style={styles.creditText}>
                Prayer times calculated using astronomical algorithms
              </Text>
            </View>
            <View style={styles.creditRow}>
              <Text style={styles.creditText}>
                Quran verses and Hadiths from authentic sources
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Muslim Lifestyle
          </Text>
          <Text style={styles.footerText}>
            All rights reserved
          </Text>
          <Text style={styles.footerDua}>
            رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ
          </Text>
          <Text style={styles.footerDuaTranslation}>
            "Our Lord, accept from us. Indeed, You are the Hearing, the Knowing."
          </Text>
        </View>

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
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  appHeaderCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  appHeaderGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.h2,
    color: colors.card,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  appTagline: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
    textAlign: 'center',
  },
  descriptionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  infoRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowAction: {
    paddingRight: spacing.sm,
  },
  infoLeft: {
    flex: 1,
  },
  infoLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.small,
    color: colors.textSecondary,
  },
  creditRow: {
    paddingVertical: spacing.sm,
  },
  creditText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  footerText: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  footerDua: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  footerDuaTranslation: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
