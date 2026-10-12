import React, {useState} from 'react';
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
import CommunityFeedScreen from '../screens/CommunityFeedScreen';
import CreatePostModal from '../components/CreatePostModal';

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
  Feed: undefined;
  Menu: undefined;
};

export type TabParamList = {
  Places: undefined;
  Feed: undefined;
  Saved: undefined;
  Profile: undefined;
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

function IconFeed({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.78,
          height: size * 0.64,
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 2.5, alignItems: 'center' }}>
          <View style={{ width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: color }} />
          <View style={{ width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: color }} />
          <View style={{ width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: color }} />
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 2,
          left: size * 0.22,
          width: 4,
          height: 4,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

const ICON_MAP: Record<string, (color: string) => React.ReactNode> = {
  Places:  color => <IconExplore  color={color} />,
  Feed:    color => <IconFeed     color={color} />,
  Saved:   color => <IconBookmark color={color} />,
  Profile: color => <IconProfile  color={color} />,
  Menu:    color => <IconMenu     color={color} />,
};

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────

function CustomTabBar({state, descriptors, navigation}: BottomTabBarProps) {
  const bookmarkCount = useAppSelector(s => s.bookmarks.items.length);
  const {colors, isDark} = useTheme();
  const [createPostVisible, setCreatePostVisible] = useState(false);

  // Split routes around center floating add button
  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2, 4);

  const activeColor = '#FF9F0A'; // Warm amber from reference design

  const renderTab = (route: typeof state.routes[0], index: number) => {
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
        {/* Minimal icon */}
        <View style={tabStyles.iconWrap}>
          {ICON_MAP[route.name]?.(isFocused ? activeColor : colors.textMuted)}
          {route.name === 'Saved' && bookmarkCount > 0 && (
            <View style={[tabStyles.badge, {backgroundColor: activeColor}]}>
              <Text style={tabStyles.badgeText}>
                {bookmarkCount > 9 ? '9+' : bookmarkCount}
              </Text>
            </View>
          )}
        </View>

        {/* Label */}
        <Text
          style={[
            tabStyles.label,
            {
              color: isFocused ? activeColor : colors.textMuted,
              fontWeight: isFocused ? '600' : '500',
            },
          ]}
        >
          {String(label)}
        </Text>

        {/* Subtle active dot */}
        {isFocused && (
          <View style={[tabStyles.activeDot, {backgroundColor: activeColor}]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[tabStyles.container, {backgroundColor: colors.surface, borderTopColor: colors.border}]}>
      <View style={tabStyles.bar}>
        {/* Left Tabs (Places, Feed) */}
        {leftRoutes.map((route, idx) => renderTab(route, idx))}

        {/* ── Modern & Minimal Floating Add Post Button (Mockup Ref) ── */}
        <View style={tabStyles.floatingCenterWrap} pointerEvents="box-none">
          {/* Sculpted Dock Pedestal (curves smoothly above navbar) */}
          <View
            style={[
              tabStyles.dockPedestal,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />

          {/* Ambient Translucent Halo */}
          <View
            style={[
              tabStyles.ambientHalo,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 159, 10, 0.16)'
                  : 'rgba(255, 159, 10, 0.14)',
              },
            ]}
          />

          {/* Floating Action Button */}
          <TouchableOpacity
            id="tab-add-post"
            accessibilityRole="button"
            accessibilityLabel="Add Post"
            onPress={() => setCreatePostVisible(true)}
            style={[
              tabStyles.floatingCenterBtn,
              {
                backgroundColor: '#FF9F0A',
                shadowColor: '#FF9F0A',
              },
            ]}
            activeOpacity={0.85}
          >
            {/* Minimal Precision Vector Plus Icon */}
            <View style={tabStyles.plusIconWrap}>
              <View style={tabStyles.plusBarH} />
              <View style={tabStyles.plusBarV} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Right Tabs (Saved, Profile) */}
        {rightRoutes.map((route, idx) => renderTab(route, idx + 2))}
      </View>

      {/* ── Create Post Modal ── */}
      <CreatePostModal
        visible={createPostVisible}
        onClose={() => setCreatePostVisible(false)}
        onPostCreated={() => {
          setCreatePostVisible(false);
          navigation.navigate('Feed');
        }}
      />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    position: 'relative',
    overflow: 'visible',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: Spacing.sm,
    overflow: 'visible',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
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
  },

  // ── Floating Center Add Button ──────────────────────────────
  floatingCenterWrap: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 20,
    elevation: 20,
  },
  dockPedestal: {
    position: 'absolute',
    top: -20,
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ambientHalo: {
    position: 'absolute',
    top: -14,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  floatingCenterBtn: {
    position: 'absolute',
    top: -10,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  plusIconWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBarH: {
    width: 16,
    height: 2.6,
    borderRadius: 1.3,
    backgroundColor: '#FFFFFF',
  },
  plusBarV: {
    position: 'absolute',
    width: 2.6,
    height: 16,
    borderRadius: 1.3,
    backgroundColor: '#FFFFFF',
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
      <Tab.Screen name="Feed"    component={CommunityFeedScreen} options={{tabBarLabel: 'Community'}} />
      <Tab.Screen name="Saved"   component={BookmarkScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
      <Stack.Screen name="Menu" component={MenuScreen} />
    </Stack.Navigator>
  );
}
