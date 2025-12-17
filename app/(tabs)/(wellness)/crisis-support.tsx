
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";

interface CrisisHotline {
  id: string;
  name: string;
  phone_number: string;
  country: string;
  description: string;
  available_hours: string;
  website: string;
}

export default function CrisisSupportScreen() {
  const [hotlines, setHotlines] = useState<CrisisHotline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHotlines();
  }, []);

  const loadHotlines = async () => {
    try {
      const { data, error } = await supabase
        .from('crisis_hotlines')
        .select('*')
        .eq('is_active', true)
        .order('country', { ascending: true });

      if (error) {
        console.error('Error loading hotlines:', error);
      } else {
        setHotlines(data || []);
      }
    } catch (error) {
      console.error('Error loading hotlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: string, name: string) => {
    Alert.alert(
      'Call Crisis Hotline',
      `Do you want to call ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
            Linking.openURL(`tel:${cleanNumber}`);
          },
        },
      ]
    );
  };

  const handleWebsite = (website: string) => {
    if (website) {
      Linking.openURL(website);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Banner */}
        <View style={styles.emergencyBanner}>
          <LinearGradient
            colors={colors.gradientRed}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emergencyGradient}
          >
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.card}
            />
            <Text style={styles.emergencyTitle}>Crisis Support</Text>
            <Text style={styles.emergencyText}>
              If you are in immediate danger, call emergency services (911) or go to your nearest emergency room.
            </Text>
          </LinearGradient>
        </View>

        {/* Important Message */}
        <View style={styles.messageCard}>
          <IconSymbol
            ios_icon_name="heart.fill"
            android_material_icon_name="favorite"
            size={28}
            color={colors.error}
          />
          <View style={styles.messageContent}>
            <Text style={styles.messageTitle}>You Are Not Alone</Text>
            <Text style={styles.messageText}>
              If you&apos;re having thoughts of suicide or self-harm, please reach out for help immediately. Your life has value and meaning. These feelings are temporary, and help is available.
            </Text>
          </View>
        </View>

        {/* Islamic Perspective */}
        <View style={styles.islamicCard}>
          <View style={styles.islamicHeader}>
            <IconSymbol
              ios_icon_name="book.closed.fill"
              android_material_icon_name="auto-stories"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.islamicTitle}>Islamic Perspective</Text>
          </View>
          <Text style={styles.islamicText}>
            In Islam, life is sacred and a trust from Allah. The Prophet Muhammad ﷺ said: &quot;Whoever relieves a believer&apos;s distress, Allah will relieve his distress on the Day of Resurrection.&quot; Seeking help is a sign of strength, not weakness. Allah is the Most Merciful and always ready to forgive and help.
          </Text>
          <View style={styles.verseCard}>
            <Text style={styles.verseArabic}>فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا</Text>
            <Text style={styles.verseTranslation}>
              &quot;Indeed, with hardship comes ease.&quot; - Quran 94:6
            </Text>
          </View>
        </View>

        {/* Crisis Hotlines */}
        <View style={styles.hotlinesContainer}>
          <Text style={styles.sectionTitle}>Crisis Hotlines</Text>
          <Text style={styles.sectionSubtitle}>
            Free, confidential support available 24/7
          </Text>
          {loading ? (
            <Text style={styles.emptyText}>Loading hotlines...</Text>
          ) : hotlines.length === 0 ? (
            <Text style={styles.emptyText}>No hotlines available</Text>
          ) : (
            hotlines.map((hotline, index) => (
              <React.Fragment key={index}>
                <View style={styles.hotlineCard}>
                  <View style={styles.hotlineHeader}>
                    <View style={styles.hotlineIconContainer}>
                      <IconSymbol
                        ios_icon_name="phone.fill"
                        android_material_icon_name="phone"
                        size={24}
                        color={colors.card}
                      />
                    </View>
                    <View style={styles.hotlineHeaderText}>
                      <Text style={styles.hotlineName}>{hotline.name}</Text>
                      <Text style={styles.hotlineCountry}>{hotline.country}</Text>
                    </View>
                  </View>
                  <Text style={styles.hotlineDescription}>{hotline.description}</Text>
                  <View style={styles.hotlineInfo}>
                    <IconSymbol
                      ios_icon_name="clock.fill"
                      android_material_icon_name="schedule"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.hotlineHours}>{hotline.available_hours}</Text>
                  </View>
                  <View style={styles.hotlineActions}>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handleCall(hotline.phone_number, hotline.name)}
                    >
                      <LinearGradient
                        colors={colors.gradientSecondary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.callGradient}
                      >
                        <IconSymbol
                          ios_icon_name="phone.fill"
                          android_material_icon_name="phone"
                          size={20}
                          color={colors.card}
                        />
                        <Text style={styles.callText}>{hotline.phone_number}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    {hotline.website && (
                      <TouchableOpacity
                        style={styles.websiteButton}
                        onPress={() => handleWebsite(hotline.website)}
                      >
                        <IconSymbol
                          ios_icon_name="globe"
                          android_material_icon_name="language"
                          size={20}
                          color={colors.primary}
                        />
                        <Text style={styles.websiteText}>Website</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </React.Fragment>
            ))
          )}
        </View>

        {/* Immediate Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Immediate Steps to Take</Text>
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Call a crisis hotline or emergency services</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Tell someone you trust how you&apos;re feeling</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Remove any means of self-harm from your environment</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Stay with someone or in a safe public place</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <Text style={styles.stepText}>Make an appointment with a mental health professional</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  emergencyBanner: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    ...shadows.colored,
  },
  emergencyGradient: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emergencyTitle: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emergencyText: {
    ...typography.body,
    color: colors.card,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    flexDirection: 'row',
    gap: spacing.lg,
    borderWidth: 2,
    borderColor: colors.error + '30',
    ...shadows.medium,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  messageText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  islamicCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  islamicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  islamicTitle: {
    ...typography.h3,
    color: colors.text,
  },
  islamicText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  verseCard: {
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  verseArabic: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  verseTranslation: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hotlinesContainer: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  hotlineCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  hotlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  hotlineIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineHeaderText: {
    flex: 1,
  },
  hotlineName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hotlineCountry: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  hotlineDescription: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  hotlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  hotlineHours: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  hotlineActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  callButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  callGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  callText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  websiteText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  stepsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  stepsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  stepsList: {
    gap: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  stepText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  bottomPadding: {
    height: 120,
  },
});
