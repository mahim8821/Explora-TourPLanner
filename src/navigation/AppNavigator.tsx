import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';

import BrowsingScreen from '../screens/BrowsingScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import BookmarkScreen from '../screens/BookmarkScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MenuScreen from '../screens/MenuScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import HeatmapScreen from '../screens/HeatmapScreen';
import ContentDetailScreen from '../screens/ContentDetailScreen';
import CommunityFeedScreen from '../screens/CommunityFeedScreen';

import { Trip } from '../data/trips';
import { AppContent } from '../firebase/contentService';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { useAppSelector } from '../store';
import { useTheme } from '../theme/ThemeContext';

// ─── Route Types ────────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  TripDetail: { trip: Trip };
  Browsing: undefined; // alias so BookmarkScreen can navigate here directly
  AdminDashboard: undefined;
  Heatmap: undefined;
  ContentDetail: { content: AppContent };
  Feed: undefined;
  Menu: undefined;
};

export type TabParamList = {
  Places: undefined;
  Feed: undefined;
  Saved: undefined;
  Profile: undefined;
  Settings: undefined;
};

// ─── Minimal Vector Tab Icons ───────────────────────────────────────────────

function IconExplore({ color, size = 22 }: { color: string; size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: s,
          height: s,
          borderRadius: s / 2,
          borderWidth: 1.8,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Diamond needle */}
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 1.5,
            backgroundColor: color,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    </View>
  );
}

function IconFeed({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.84,
          height: size * 0.68,
          borderRadius: 6,
          borderWidth: 1.8,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
        </View>
      </View>
      {/* Speech bubble tail */}
      <View
        style={{
          position: 'absolute',
          bottom: 2,
          left: size * 0.22,
          width: 5,
          height: 5,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

function IconBookmark({ color, size = 22 }: { color: string; size?: number }) {
  const w = size * 0.62;
  const h = size * 0.86;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: w,
          height: h,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 3.5,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            bottom: -1,
            left: -1,
            width: w * 0.58,
            height: h * 0.35,
            borderTopRightRadius: 2,
            backgroundColor: color,
            transform: [{ rotate: '36deg' }, { translateY: 4 }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: w * 0.58,
            height: h * 0.35,
            borderTopLeftRadius: 2,
            backgroundColor: color,
            transform: [{ rotate: '-36deg' }, { translateY: 4 }],
          }}
        />
      </View>
    </View>
  );
}

function IconProfile({ color, size = 22 }: { color: string; size?: number }) {
  const headR = size * 0.22;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <View
        style={{
          width: headR * 2,
          height: headR * 2,
          borderRadius: headR,
          borderWidth: 1.8,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.76,
          height: size * 0.36,
          borderTopLeftRadius: size * 0.38,
          borderTopRightRadius: size * 0.38,
          borderWidth: 1.8,
          borderColor: color,
          borderBottomWidth: 0,
        }}
      />
    </View>
  );
}

function IconSettings({ color, size = 22 }: { color: string; size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      {/* 4 crossed teeth */}
      <View style={{ position: 'absolute', width: 2.2, height: s, backgroundColor: color, borderRadius: 1.1 }} />
      <View style={{ position: 'absolute', width: s, height: 2.2, backgroundColor: color, borderRadius: 1.1 }} />
      <View
        style={{
          position: 'absolute',
          width: 2.2,
          height: s,
          backgroundColor: color,
          borderRadius: 1.1,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 2.2,
          height: s,
          backgroundColor: color,
          borderRadius: 1.1,
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* Gear rim */}
      <View
        style={{
          width: s * 0.72,
          height: s * 0.72,
          borderRadius: (s * 0.72) / 2,
          borderWidth: 2,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        <View style={{ width: 4.5, height: 4.5, borderRadius: 2.25, backgroundColor: color }} />
      </View>
    </View>
  );
}

const ICON_MAP: Record<string, (color: string) => React.ReactNode> = {
  Places:   color => <IconExplore  color={color} />,
  Feed:     color => <IconFeed     color={color} />,
  Saved:    color => <IconBookmark color={color} />,
  Profile:  color => <IconProfile  color={color} />,
  Settings: color => <IconSettings color={color} />,
  Menu:     color => <IconSettings color={color} />,
};

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const bookmarkCount = useAppSelector(s => s.bookmarks.items.length);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const activeColor = '#FF9F0A'; // Warm amber from brand palette

  return (
    <View
      style={[
        tabStyles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 22 : 10),
        },
      ]}
    >
      <View style={tabStyles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const tabColor = isFocused ? activeColor : colors.textMuted;

          return (
            <TouchableOpacity
              key={route.key}
              id={`tab-${route.name.toLowerCase()}`}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || String(label)}
              onPress={onPress}
              onLongPress={onLongPress}
              style={tabStyles.tab}
              activeOpacity={0.7}
            >
              {/* Highlight pill behind active icon */}
              <View
                style={[
                  tabStyles.iconWrap,
                  isFocused && {
                    backgroundColor: isDark
                      ? 'rgba(255, 159, 10, 0.14)'
                      : 'rgba(255, 159, 10, 0.12)',
                  },
                ]}
              >
                {ICON_MAP[route.name]?.(tabColor)}

                {/* Badge for Saved trips */}
                {route.name === 'Saved' && bookmarkCount > 0 && (
                  <View style={[tabStyles.badge, { backgroundColor: activeColor }]}>
                    <Text style={tabStyles.badgeText}>
                      {bookmarkCount > 9 ? '9+' : bookmarkCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Tab Label */}
              <Text
                style={[
                  tabStyles.label,
                  {
                    color: tabColor,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {String(label)}
              </Text>

              {/* Active Indicator Micro-Dot */}
              <View
                style={[
                  tabStyles.activeDot,
                  { backgroundColor: isFocused ? activeColor : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  iconWrap: {
    width: 38,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
    lineHeight: 11,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});

// ─── Navigators ──────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Places"
        component={BrowsingScreen}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name="Feed"
        component={CommunityFeedScreen}
        options={{ tabBarLabel: 'Community' }}
      />
      <Tab.Screen
        name="Saved"
        component={BookmarkScreen}
        options={{ tabBarLabel: 'Saved' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
      <Tab.Screen
        name="Settings"
        component={MenuScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{
          presentation: 'card',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen name="Browsing" component={BrowsingScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="Heatmap" component={HeatmapScreen} />
      <Stack.Screen name="ContentDetail" component={ContentDetailScreen} />
      <Stack.Screen name="Menu" component={MenuScreen} />
    </Stack.Navigator>
  );
}

