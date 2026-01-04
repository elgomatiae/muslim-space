
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

// Purple accent color for selected tabs
const PURPLE_ACCENT = '#8B5CF6';
const PURPLE_GLOW = 'rgba(139, 92, 246, 0.4)';

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  isCenter?: boolean; // Flag for center elevated tab
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const scaleAnim = useSharedValue(1);

  // Improved active tab detection with better logging
  const activeTabIndex = React.useMemo(() => {
    let bestMatch = -1;
    let bestMatchScore = 0;

    console.log('🔍 FloatingTabBar - Current pathname:', pathname);

    tabs.forEach((tab, index) => {
      let score = 0;

      // Exact match
      if (pathname === tab.route) {
        score = 100;
      } 
      // Starts with route (for nested routes)
      else if (pathname.startsWith(tab.route as string)) {
        score = 80;
      } 
      // Contains tab name
      else if (pathname.includes(tab.name)) {
        score = 60;
      }

      console.log(`  Tab ${index} (${tab.name}): score=${score}, route=${tab.route}`);

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    console.log(`✅ Active tab index: ${bestMatch} (${bestMatch >= 0 ? tabs[bestMatch].name : 'none'})`);
    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, tabs]);

  const handleTabPress = (route: Href, index: number) => {
    console.log(`🔘 Tab pressed: ${tabs[index].name} -> ${route}`);
    
    // Animate center tab press
    if (tabs[index].isCenter) {
      scaleAnim.value = withSpring(0.9, {}, () => {
        scaleAnim.value = withSpring(1);
      });
    }
    router.push(route);
  };

  const centerTabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 95}
          style={styles.blurContainer}
          tint={theme.dark ? 'dark' : 'light'}
        >
          <View style={[
            styles.background,
            { backgroundColor: theme.dark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
          ]} />
          
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;
              const isCenter = tab.isCenter;

              // Render center tab differently
              if (isCenter) {
                return (
                  <View key={index} style={styles.centerTabWrapper}>
                    <Animated.View style={[styles.centerTabContainer, centerTabAnimStyle]}>
                      <TouchableOpacity
                        style={[
                          styles.centerTab,
                          { backgroundColor: theme.dark ? '#1F1F1F' : '#FFFFFF' },
                          isActive && styles.centerTabActive,
                        ]}
                        onPress={() => handleTabPress(tab.route, index)}
                        activeOpacity={0.8}
                      >
                        <IconSymbol
                          android_material_icon_name={tab.icon}
                          ios_icon_name={tab.icon}
                          size={32}
                          color={isActive ? PURPLE_ACCENT : (theme.dark ? '#FFFFFF' : '#000000')}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                    <Text
                      style={[
                        styles.centerTabLabel,
                        { color: theme.dark ? '#98989D' : '#8E8E93' },
                        isActive && { color: PURPLE_ACCENT, fontWeight: '700' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                );
              }

              // Regular tabs
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.tab}
                  onPress={() => handleTabPress(tab.route, index)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.tabContent,
                    isActive && styles.tabContentActive,
                  ]}>
                    <IconSymbol
                      android_material_icon_name={tab.icon}
                      ios_icon_name={tab.icon}
                      size={24}
                      color={isActive ? PURPLE_ACCENT : (theme.dark ? '#98989D' : '#8E8E93')}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: theme.dark ? '#98989D' : '#8E8E93' },
                        isActive && { color: PURPLE_ACCENT, fontWeight: '700' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    pointerEvents: 'box-none',
  },
  blurContainer: {
    borderRadius: 30,
    overflow: 'visible', // Changed from 'hidden' to allow center tab to overflow
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    // Enhanced shadow for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 60,
  },
  tabContentActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  centerTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40, // Elevate above the tab bar
    zIndex: 100,
    flex: 1,
  },
  centerTabContainer: {
    marginBottom: 6,
  },
  centerTab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    // Enhanced shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 16,
  },
  centerTabActive: {
    borderColor: PURPLE_ACCENT,
    borderWidth: 4,
    shadowColor: PURPLE_ACCENT,
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 20,
  },
  centerTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
});
