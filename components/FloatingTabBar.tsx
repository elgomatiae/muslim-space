
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  iosIcon?: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize animation value at the top level
  const animatedValue = useSharedValue(0);
  
  // Create scale values for each tab - moved outside useMemo
  const scaleValue0 = useSharedValue(1);
  const scaleValue1 = useSharedValue(1);
  const scaleValue2 = useSharedValue(1);
  const scaleValue3 = useSharedValue(1);
  const scaleValue4 = useSharedValue(1);
  
  // Store scale values in an array using useMemo (without calling hooks inside)
  const scaleValues = React.useMemo(() => {
    return [scaleValue0, scaleValue1, scaleValue2, scaleValue3, scaleValue4].slice(0, tabs.length);
  }, [scaleValue0, scaleValue1, scaleValue2, scaleValue3, scaleValue4, tabs]);

  // Find the center tab index (should be Iman)
  const centerTabIndex = Math.floor(tabs.length / 2);

  // Improved active tab detection with better path matching
  const activeTabIndex = React.useMemo(() => {
    console.log('Current pathname:', pathname);
    
    // Find the best matching tab based on the current pathname
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;
      const tabRoute = tab.route as string;

      // Exact route match gets highest score
      if (pathname === tabRoute) {
        score = 100;
      }
      // Check if pathname starts with tab route (for nested routes)
      else if (pathname.startsWith(tabRoute)) {
        score = 80;
      }
      // Check if pathname contains the tab name
      else if (pathname.includes(tab.name)) {
        score = 60;
      }
      // Check for partial matches in the route
      else if (tabRoute.includes('/(tabs)/') && pathname.includes(tabRoute.split('/(tabs)/')[1])) {
        score = 40;
      }

      console.log(`Tab ${tab.name} (${tabRoute}) score: ${score}`);

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    console.log('Active tab index:', bestMatch);
    // Default to first tab if no match found
    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, tabs]);

  React.useEffect(() => {
    if (activeTabIndex >= 0) {
      animatedValue.value = withSpring(activeTabIndex, {
        damping: 20,
        stiffness: 120,
        mass: 1,
      });

      // Animate scale for active tab
      scaleValues.forEach((scale, index) => {
        if (index === activeTabIndex) {
          scale.value = withSpring(1.1, {
            damping: 15,
            stiffness: 150,
          });
        } else {
          scale.value = withSpring(1, {
            damping: 15,
            stiffness: 150,
          });
        }
      });
    }
  }, [activeTabIndex, animatedValue, scaleValues]);

  const handleTabPress = (route: Href, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };

  const tabWidth = 100 / tabs.length;

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            animatedValue.value,
            [0, tabs.length - 1],
            [0, tabWidth * (tabs.length - 1)]
          ),
        },
      ],
      width: `${tabWidth}%`,
    };
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <View style={styles.container}>
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;
              const isCenterTab = index === centerTabIndex;

              // Center tab (Iman) gets special treatment - BIGGER and ELEVATED
              if (isCenterTab) {
                return (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={styles.centerTabWrapper}
                      onPress={() => handleTabPress(tab.route, index)}
                      activeOpacity={0.8}
                    >
                      <AnimatedCenterTab
                        scaleValue={scaleValues[index]}
                        isActive={isActive}
                        tab={tab}
                      />
                      <Text
                        style={[
                          styles.centerTabLabel,
                          isActive && styles.centerTabLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              }

              // Regular tabs
              return (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={styles.tab}
                    onPress={() => handleTabPress(tab.route, index)}
                    activeOpacity={0.7}
                  >
                    <AnimatedRegularTab
                      scaleValue={scaleValues[index]}
                      isActive={isActive}
                      tab={tab}
                    />
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </BlurView>
    </SafeAreaView>
  );
}

// Separate component for animated center tab to avoid hooks in callbacks
function AnimatedCenterTab({ 
  scaleValue, 
  isActive, 
  tab 
}: { 
  scaleValue: Animated.SharedValue<number>; 
  isActive: boolean; 
  tab: TabBarItem;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <Animated.View style={[styles.centerTab, animatedStyle]}>
      <LinearGradient
        colors={isActive ? colors.gradientOcean : colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.centerTabGradient}
      >
        <View style={styles.centerIconContainer}>
          <IconSymbol
            android_material_icon_name={tab.icon}
            ios_icon_name={tab.iosIcon || tab.icon}
            size={36}
            color="#FFFFFF"
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// Separate component for animated regular tab to avoid hooks in callbacks
function AnimatedRegularTab({ 
  scaleValue, 
  isActive, 
  tab 
}: { 
  scaleValue: Animated.SharedValue<number>; 
  isActive: boolean; 
  tab: TabBarItem;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <Animated.View style={[styles.tabContent, animatedStyle]}>
      <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
        <IconSymbol
          android_material_icon_name={tab.icon}
          ios_icon_name={tab.iosIcon || tab.icon}
          size={24}
          color={isActive ? colors.primary : colors.textSecondary}
        />
      </View>
      <Text
        style={[
          styles.tabLabel,
          isActive && styles.tabLabelActive,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0px -4px 12px rgba(139, 92, 246, 0.15)',
      },
    }),
  },
  blurContainer: {
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    width: '100%',
    position: 'relative',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 110,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: colors.highlight,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  // Center tab (Iman) special styles - REDUCED SIZE
  centerTabWrapper: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginTop: -35,
  },
  centerTab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0px 6px 12px rgba(139, 92, 246, 0.4)',
      },
    }),
  },
  centerTabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  centerIconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.textSecondary,
  },
  centerTabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
