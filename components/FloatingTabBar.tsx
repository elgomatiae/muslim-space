
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { getScreenWidth } from '@/utils/screenDimensions';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';

const screenWidth = getScreenWidth();

/** marginBottom (0) + rail height (82) — distance from screen bottom to top of rail. Safe-area inset is separate (SafeAreaView). */
export const FLOATING_TAB_BAR_OFFSET_FROM_BOTTOM = 0 + 82;

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  isMainFeature?: boolean;
  iosIcon?: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth,
  borderRadius = 22,
  bottomMargin
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  // New from-scratch layout: centered rail with equal tab slots.
  const calculatedWidth = containerWidth ?? Math.min(screenWidth - 22, 540);

  const activeTabIndex = React.useMemo(() => {
    // Prefer Expo Router segments for grouped routes; this is reliable on web.
    if (segments.length >= 2 && segments[0] === '(tabs)') {
      const activeLeaf = segments[1];
      const idx = tabs.findIndex((tab) => tab.name === activeLeaf);
      if (idx >= 0) return idx;
    }

    const clean = (value: string) => {
      const noQuery = value.split('?')[0].split('#')[0];
      const normalized = noQuery.replace(/\/+/g, '/').replace(/\/$/, '');
      return normalized || '/';
    };

    const normalizedPath = clean(pathname);

    let best = 0;
    let bestLen = -1;
    tabs.forEach((tab, idx) => {
      const route = String(tab.route);
      const routeNoGroups = clean(route.replace(/\/\([^/]+\)/g, ''));
      const tabBase =
        routeNoGroups !== '/'
          ? routeNoGroups
          : tab.name === '(home)'
            ? '/'
            : `/${tab.name.replace(/[()]/g, '')}`;

      if (
        normalizedPath === tabBase ||
        normalizedPath.startsWith(`${tabBase}/`) ||
        (tabBase === '/' && normalizedPath === '/')
      ) {
        if (route.length > bestLen) {
          best = idx;
          bestLen = route.length;
        }
      }
    });
    return best;
  }, [pathname, segments, tabs]);

  const handleTabPress = (route: Href) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={[styles.container, { width: calculatedWidth, marginBottom: bottomMargin ?? 0 }]}>
        <BlurView intensity={70} style={[styles.rail, { borderRadius }]}>
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;

              return (
                <TouchableOpacity
                  key={`tab-${tab.name}-${index}`}
                  style={styles.tab}
                  onPress={() => handleTabPress(tab.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.tabInner}>
                    <View style={[styles.iconOrb, isActive && styles.iconOrbActive]}>
                      <IconSymbol
                        android_material_icon_name={tab.icon}
                        ios_icon_name={tab.iosIcon || tab.icon}
                        size={19}
                        color={isActive ? '#111827' : '#64748B'}
                      />
                    </View>
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
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
    alignItems: 'center',
    pointerEvents: 'box-none' as any,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        zIndex: 9999,
      },
    }),
  },
  container: {
    marginHorizontal: 20,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        pointerEvents: 'auto' as any,
      },
    }),
  },
  rail: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 82,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconOrb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  iconOrbActive: {
    backgroundColor: 'rgba(129, 140, 248, 0.35)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#1E293B',
    fontWeight: '800',
  },
});
