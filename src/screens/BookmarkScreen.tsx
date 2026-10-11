import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, StatusBar, Image } from 'react-native';
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

export default function BookmarkScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { items: destinations } = useAppSelector(s => s.bookmarks);
  const { items: trips } = useAppSelector(s => s.savedTrips);
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const sections: any[] = [];
  if (destinations.length > 0)
    sections.push({ title: 'Destinations', data: destinations.map(d => ({ type: 'destination' as const, data: d })) });
  if (trips.length > 0)
    sections.push({ title: 'Trips', data: trips.map(t => ({ type: 'trip' as const, data: t })) });
  const totalSaved = destinations.length + trips.length;

  const renderItem = ({ item }: { item: { type: 'destination', data: Destination } | { type: 'trip', data: Trip } }) => {
    const isDestination = item.type === 'destination';
    const d = item.data as any;

    return (
      <View style={styles.card}>
        <Image
          source={typeof d.imageUrl === 'string' ? { uri: d.imageUrl } : d.imageUrl}
          style={styles.cardImg}
        />
        <View style={styles.cardBody}>
          <View style={styles.cardMain}>
            <Text style={styles.cardName} numberOfLines={1}>
              {isDestination ? d.name : d.title}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {isDestination ? d.country : d.location}
            </Text>
            <View style={styles.cardMeta}>
              {isDestination ? (
                <>
                  <Text style={styles.metaChip}>⭐ {d.rating}</Text>
                  <Text style={styles.metaChip}>${d.price}/day</Text>
                </>
              ) : (
                <>
                  <Text style={styles.metaChip}>👥 {d.slotsAvailable} slots</Text>
                  <Text style={styles.metaChip}>৳{d.budget}</Text>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => isDestination
              ? dispatch(removeBookmark((d as Destination).id))
              : dispatch(removeSavedTrip((d as Trip).id))
            }
          >
            <Text style={styles.removeTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.headerSub}>
          {totalSaved} item{totalSaved !== 1 ? 's' : ''}
        </Text>
      </View>

      {totalSaved === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptySub}>
            Tap the bookmark icon on any destination or trip to save it here
          </Text>
          <TouchableOpacity
            id="start-exploring-btn"
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Browsing')}
          >
            <Text style={styles.exploreTxt}>Start Exploring</Text>
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
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      paddingTop: 60,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headerTitle: { fontSize: 28, fontWeight: Typography.weight.heavy, color: c.text },
    headerSub: { fontSize: Typography.size.sm, color: c.textMuted, marginTop: 2 },

    list: { padding: Spacing.xl, gap: Spacing.sm },

    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      flexDirection: 'row',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    cardImg: { width: 96, height: 96, resizeMode: 'cover' },
    cardBody: { flex: 1, padding: Spacing.md, flexDirection: 'row', alignItems: 'center' },
    cardMain: { flex: 1, gap: 3 },
    cardName: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: c.text },
    cardSub: { fontSize: Typography.size.sm, color: c.textSecondary },
    cardMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
    metaChip: { fontSize: Typography.size.xs, color: c.textMuted },

    removeBtn: { padding: Spacing.sm },
    removeTxt: { fontSize: 14, color: c.textMuted },

    // Empty
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['4xl'] },
    emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: c.text, marginBottom: Spacing.sm },
    emptySub: { fontSize: Typography.size.base, color: c.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'] },
    exploreBtn: { backgroundColor: c.primary, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: Radius.full },
    exploreTxt: { color: c.white, fontSize: Typography.size.base, fontWeight: Typography.weight.semiBold },

    sectionHeader: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semiBold, color: c.textMuted, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
  });
}
