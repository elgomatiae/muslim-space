
import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useTranslation } from '@/contexts/I18nContext';
import { BannerAdBar } from '@/components/ads/BannerAdBar';
import { FLOATING_TAB_BAR_OFFSET_FROM_BOTTOM } from '@/components/FloatingTabBar';
import { ProtectedRoute } from '@/components/ProtectedRoute';

/**
 * Single tabs layout for iOS, Android, and web — same native-style tab bar everywhere.
 * (Previously split across _layout.tsx / _layout.ios.tsx / _layout.web.tsx.)
 */
export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#1E293B',
            tabBarInactiveTintColor: '#64748B',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: 'rgba(148,163,184,0.35)',
              position: 'absolute',
              left: 10,
              right: 10,
              bottom: 0,
              height: 82,
              borderRadius: 26,
              paddingBottom: 10,
              paddingTop: 7,
              shadowColor: '#0F172A',
              shadowOpacity: 0.14,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
              marginTop: 2,
            },
          }}
        >
          <Tabs.Screen
            name="(home)"
            options={{
              title: t('tabs.home'),
              tabBarIcon: ({ color, focused }) => (
                <View style={{ paddingVertical: 4, marginTop: 3 }}>
                  <IconSymbol
                    ios_icon_name={focused ? 'square.grid.2x2.fill' : 'square.grid.2x2'}
                    android_material_icon_name="dashboard"
                    size={20}
                    color={color}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="(learning)"
            options={{
              title: t('tabs.learning'),
              tabBarIcon: ({ color, focused }) => (
                <View style={{ paddingVertical: 4, marginTop: 3 }}>
                  <IconSymbol
                    ios_icon_name={focused ? 'graduationcap.fill' : 'graduationcap'}
                    android_material_icon_name="library-books"
                    size={20}
                    color={color}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="(iman)"
            options={{
              title: t('tabs.iman'),
              tabBarIcon: ({ color, focused }) => (
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focused ? 'rgba(129,140,248,0.35)' : 'rgba(148,163,184,0.2)',
                    marginTop: 3,
                    marginBottom: 6,
                  }}
                >
                  <IconSymbol
                    ios_icon_name={focused ? 'moon.stars.fill' : 'moon.stars'}
                    android_material_icon_name="nights-stay"
                    size={19}
                    color={focused ? '#111827' : '#64748B'}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="(wellness)"
            options={{
              title: t('tabs.wellness'),
              tabBarIcon: ({ color, focused }) => (
                <View style={{ paddingVertical: 4, marginTop: 3 }}>
                  <IconSymbol
                    ios_icon_name={focused ? 'heart.text.square.fill' : 'heart.text.square'}
                    android_material_icon_name="favorite-border"
                    size={20}
                    color={color}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t('tabs.profile'),
              tabBarIcon: ({ color, focused }) => (
                <View style={{ paddingVertical: 4, marginTop: 3 }}>
                  <IconSymbol
                    ios_icon_name={focused ? 'person.crop.circle.fill' : 'person.crop.circle'}
                    android_material_icon_name="account-circle"
                    size={20}
                    color={color}
                  />
                </View>
              ),
            }}
          />
        </Tabs>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: Math.max(0, FLOATING_TAB_BAR_OFFSET_FROM_BOTTOM),
            zIndex: 900,
          }}
        >
          <BannerAdBar />
        </View>
      </View>
    </ProtectedRoute>
  );
}
