import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator, BottomTabBarProps} from '@react-navigation/bottom-tabs';

import BrowsingScreen from '../screens/BrowsingScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import BookmarkScreen from '../screens/BookmarkScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MenuScreen from '../screens/MenuScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import HeatmapScreen from '../screens/HeatmapScreen';
import ContentDetailScreen from '../screens/ContentDetailScreen';

import {Trip} from '../data/trips';
import {AppContent} from '../firebase/contentService';
import {Typography} from '../theme/typography';
import {Spacing} from '../theme/spacing';
import {useAppSelector} from '../store';
import {useTheme} from '../theme/ThemeContext';

// ─── Route Types ────────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  TripDetail: {trip: Trip};
  Browsing: undefined; // alias so BookmarkScreen can navigate here directly
  AdminDashboard: undefined;
  Heatmap: undefined;
  ContentDetail: { content: AppContent };
};

export type TabParamList = {
  Places: undefined;
  Saved: undefined;
  Profile: undefined;
  Menu: undefined;
};

// ─── Minimal Tab Icons ──────────────────────────────────────────────────────
// Pure View/geometry icons — no emojis, no libraries needed

function IconExplore({ color, size = 22 }: { color: string; size?: number }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer circle */}
      <View style={{ width: s, height: s, borderRadius: s / 2, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        {/* Inner diamond/compass */}
        <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
      </View>
    </View>
  );
}

function IconBookmark({ color, size = 22 }: { color: string; size?: number }) {
  const w = size * 0.6;
  const h = size * 0.85;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Bookmark shape: rectangle + V-notch at bottom */}
      <View style={{ width: w, height: h, borderWidth: 1.5, borderColor: color, borderRadius: 3, overflow: 'hidden' }}>
        {/* V-notch: two diagonal lines at bottom */}
        <View style={[
          { position: 'absolute', bottom: -1, left: -1, width: w * 0.55, height: h * 0.32,
            borderTopRightRadius: 2, backgroundColor: color, transform: [{ rotate: '35deg' }, { translateY: 4 }] }
        ]} />
        <View style={[
          { position: 'absolute', bottom: -1, right: -1, width: w * 0.55, height: h * 0.32,
            borderTopLeftRadius: 2, backgroundColor: color, transform: [{ rotate: '-35deg' }, { translateY: 4 }] }
        ]} />
      </View>
    </View>
  );
}

function IconProfile({ color, size = 22 }: { color: string; size?: number }) {
  const headR = size * 0.22;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      {/* Head circle */}
      <View style={{ width: headR * 2, height: headR * 2, borderRadius: headR, borderWidth: 1.5, borderColor: color }} />
      {/* Shoulders arc (rectangle with top rounded) */}
      <View style={{ width: size * 0.72, height: size * 0.34, borderTopLeftRadius: size * 0.36, borderTopRightRadius: size * 0.36, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0 }} />
    </View>
  );
}

function IconMenu({ color, size = 22 }: { color: string; size?: number }) {
  const lineW = size * 0.75;
  const gap = size * 0.22;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', gap }}>
      <View style={{ width: lineW, height: 1.5, borderRadius: 1, backgroundColor: color }} />
      <View style={{ width: lineW * 0.7, height: 1.5, borderRadius: 1, backgroundColor: color }} />
      <View style={{ width: lineW, height: 1.5, borderRadius: 1, backgroundColor: color }} />
    </View>
  );
}

const ICON_MAP: Record<string, (color: string) => React.ReactNode> = {
  Places:  color => <IconExplore  color={color} />,
  Saved:   color => <IconBookmark color={color} />,
  Profile: color => <IconProfile  color={color} />,
  Menu:    color => <IconMenu     color={color} />,
};

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────

function CustomTabBar({state, descriptors, navigation}: BottomTabBarProps) {
  const bookmarkCount = useAppSelector(s => s.bookmarks.items.length);
  const {colors} = useTheme();

  return (
    <View style={[tabStyles.container, {backgroundColor: colors.surface, borderTopColor: colors.border}]}>
      <View style={tabStyles.bar}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              id={`tab-${route.name.toLowerCase()}`}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              onPress={onPress}
              style={tabStyles.tab}
              activeOpacity={0.7}
            >
              {/* Active indicator */}
              {isFocused && <View style={[tabStyles.activePill, {backgroundColor: colors.primary}]} />}

              {/* Minimal icon */}
              <View style={tabStyles.iconWrap}>
                {ICON_MAP[route.name]?.(isFocused ? colors.primary : colors.textMuted)}
                {route.name === 'Saved' && bookmarkCount > 0 && (
                  <View style={[tabStyles.badge, {backgroundColor: colors.primary}]}>
                    <Text style={tabStyles.badgeText}>
                      {bookmarkCount > 9 ? '9+' : bookmarkCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Label */}
              <Text style={[tabStyles.label, {color: isFocused ? colors.primary : colors.textMuted}]}>
                {String(label)}
              </Text>
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  iconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    color: '#fff',
  },
  label: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: Typography.weight.medium,
  },
});

// ─── Navigators ──────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}
    >
      <Tab.Screen name="Places"  component={BrowsingScreen} />
      <Tab.Screen name="Saved"   component={BookmarkScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Menu"    component={MenuScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const {colors} = useTheme();
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{
          presentation: 'card',
          contentStyle: {backgroundColor: colors.background},
        }}
      />
      <Stack.Screen name="Browsing" component={BrowsingScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="Heatmap" component={HeatmapScreen} />
      <Stack.Screen name="ContentDetail" component={ContentDetailScreen} />
    </Stack.Navigator>
  );
}
