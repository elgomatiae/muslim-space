
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';

// Import the hub screens
import MentalHealthHubScreen from './mental-health';
import PhysicalHealthHubScreen from './physical-health';

type TabType = 'mental' | 'physical';

export default function WellnessScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('mental');
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const switchTab = (tab: TabType) => {
    if (tab === activeTab) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate tab switch
    Animated.spring(slideAnim, {
      toValue: tab === 'mental' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    
    setActiveTab(tab);
  };

  const indicatorTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180], // Half of container width minus padding
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Tabs */}
      <View style={styles.header}>
        <LinearGradient
          colors={colors.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <IconSymbol
              ios_icon_name="heart.circle.fill"
              android_material_icon_name="favorite"
              size={40}
              color={colors.card}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Wellness Hub</Text>
              <Text style={styles.headerSubtitle}>Nurture mind, body, and soul</Text>
            </View>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <View style={styles.tabBackground}>
              <Animated.View 
                style={[
                  styles.tabIndicator,
                  {
                    transform: [{ translateX: indicatorTranslateX }],
                  }
                ]}
              />
              
              <TouchableOpacity
                style={styles.tab}
                onPress={() => switchTab('mental')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="brain.head.profile"
                  android_material_icon_name="psychology"
                  size={20}
                  color={activeTab === 'mental' ? colors.primary : colors.card}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'mental' && styles.tabTextActive
                ]}>
                  Mental
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tab}
                onPress={() => switchTab('physical')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="figure.run"
                  android_material_icon_name="directions-run"
                  size={20}
                  color={activeTab === 'physical' ? colors.primary : colors.card}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'physical' && styles.tabTextActive
                ]}>
                  Physical
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'mental' ? (
          <MentalHealthHubScreen />
        ) : (
          <PhysicalHealthHubScreen />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  headerGradient: {
    padding: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
  },
  tabContainer: {
    width: '100%',
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    width: '48%',
    height: '85%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    zIndex: 1,
  },
  tabText: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.8,
  },
  tabTextActive: {
    color: colors.primary,
    opacity: 1,
  },
  content: {
    flex: 1,
  },
});
