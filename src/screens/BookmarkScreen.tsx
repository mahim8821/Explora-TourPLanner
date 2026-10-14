import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  StatusBar, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../store';
import { removeBookmark } from '../store/slices/bookmarksSlice';
import { removeSavedTrip } from '../store/slices/savedTripsSlice';
import { Destination } from '../api/types';
import { Trip } from '../data/trips';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterTab = 'All' | 'Trips' | 'Destinations';

export default function BookmarkScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { items: destinations } = useAppSelector(s => s.bookmarks);
  const { items: trips } = useAppSelector(s => s.savedTrips);
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const sections = useMemo(() => {
    const list: any[] = [];
    if ((activeTab === 'All' || activeTab === 'Destinations') && destinations.length > 0) {
      list.push({
        title: 'Destinations',
        data: destinations.map(d => ({ type: 'destination' as const, data: d })),
      });
    }
    if ((activeTab === 'All' || activeTab === 'Trips') && trips.length > 0) {
      list.push({
        title: 'Curated Tours',
        data: trips.map(t => ({ type: 'trip' as const, data: t })),
      });
    }
    return list;
  }, [activeTab, destinations, trips]);

  const totalSaved = destinations.length + trips.length;

  const handleCardPress = (item: { type: 'destination'; data: Destination } | { type: 'trip'; data: Trip }) => {
    if (item.type === 'trip') {
      navigation.navigate('TripDetail', { trip: item.data as Trip });
    }
  };

  const renderItem = ({ item }: { item: { type: 'destination'; data: Destination } | { type: 'trip'; data: Trip } }) => {
    const isDestination = item.type === 'destination';
    const d = item.data as any;
    const title = isDestination ? d.name : d.title;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${title}`}
      >
        <Image
          source={typeof d.imageUrl === 'string' ? { uri: d.imageUrl } : d.imageUrl}
          style={styles.cardImg}
        />
        <View style={styles.cardBody}>
          <View style={styles.cardMain}>
            <Text style={styles.cardName} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              📍 {isDestination ? d.country : d.location}
            </Text>
            <View style={styles.cardMeta}>
              {isDestination ? (
                <>
                  <View style={styles.chipPill}><Text style={styles.chipText}>⭐ {d.rating}</Text></View>
                  <View style={styles.chipPill}><Text style={styles.chipText}>${d.price}/day</Text></View>
                </>
              ) : (
                <>
                  <View style={styles.chipPill}><Text style={styles.chipText}>👥 {d.slotsAvailable} left</Text></View>
                  <View style={[styles.chipPill, { backgroundColor: isDark ? 'rgba(255,159,10,0.15)' : 'rgba(255,159,10,0.1)' }]}>
                    <Text style={[styles.chipText, { color: '#FF9F0A', fontWeight: '700' }]}>৳{d.budget}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${title} from saved`}
            onPress={() =>
              isDestination
                ? dispatch(removeBookmark((d as Destination).id))
                : dispatch(removeSavedTrip((d as Trip).id))
            }
          >
            <Text style={styles.removeTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 54) }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Saved</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {totalSaved} {totalSaved === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        {/* Filter Segment Tabs */}
        {totalSaved > 0 && (
          <View style={styles.tabFilterRow}>
            {(['All', 'Trips', 'Destinations'] as FilterTab[]).map(tab => {
              const active = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabFilterPill,
                    active && { backgroundColor: isDark ? colors.surfaceElevated : colors.primary },
                  ]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabFilterText,
                      { color: active ? (isDark ? colors.text : '#FFF') : colors.textMuted },
                      active && { fontWeight: '700' },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {totalSaved === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>🔖</Text>
          </View>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptySub}>
            Tap the bookmark icon on any destination or tour to save your dream Bangladesh adventures here.
          </Text>
          <TouchableOpacity
            id="start-exploring-btn"
            style={[styles.exploreBtn, { backgroundColor: '#FF9F0A' }]}
            onPress={() => navigation.navigate('Browsing')}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreTxt}>Start Exploring Bangladesh →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.data.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 16) + 85 },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 28, fontWeight: Typography.weight.heavy, color: c.text },
    countBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
    countBadgeText: { fontSize: Typography.size.xs, fontWeight: '700', color: c.textMuted },

    tabFilterRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: Spacing.md,
    },
    tabFilterPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
    },
    tabFilterText: {
      fontSize: Typography.size.xs,
      fontWeight: '500',
    },

    list: { padding: Spacing.xl, gap: Spacing.sm },

    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      flexDirection: 'row',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    cardImg: { width: 100, height: 100, resizeMode: 'cover' },
    cardBody: { flex: 1, padding: Spacing.md, flexDirection: 'row', alignItems: 'center' },
    cardMain: { flex: 1, gap: 4 },
    cardName: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: c.text },
    cardSub: { fontSize: Typography.size.xs, color: c.textSecondary },
    cardMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
    chipPill: {
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    chipText: { fontSize: Typography.size.xs, color: c.textMuted },

    removeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.sm,
    },
    removeTxt: { fontSize: 12, color: c.textMuted, fontWeight: '700' },

    // Empty
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing['3xl'],
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? 'rgba(255,159,10,0.12)' : 'rgba(255,159,10,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    emptyIcon: { fontSize: 34 },
    emptyTitle: {
      fontSize: Typography.size.xl,
      fontWeight: Typography.weight.bold,
      color: c.text,
      marginBottom: Spacing.sm,
    },
    emptySub: {
      fontSize: Typography.size.sm,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: Spacing['2xl'],
      maxWidth: 290,
    },
    exploreBtn: {
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.md,
      borderRadius: Radius.full,
      shadowColor: '#FF9F0A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    exploreTxt: {
      color: '#FFFFFF',
      fontSize: Typography.size.sm,
      fontWeight: '800',
    },

    sectionHeader: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      color: c.textMuted,
      marginBottom: Spacing.sm,
      marginTop: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });
}

