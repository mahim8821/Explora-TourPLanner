import React, { useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Dimensions, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Destination } from '../api/types';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleBookmark } from '../store/slices/bookmarksSlice';
import GalleryCarousel from '../components/GalleryCarousel';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.44;
type NavProps = NativeStackNavigationProp<RootStackParamList>;

interface Props { destination: Destination; }

export default function DestinationDetailScreen({ destination }: Props) {
  const navigation = useNavigation<NavProps>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { items: bookmarks } = useAppSelector(s => s.bookmarks);
  const { colors, isDark } = useTheme();

  const isBookmarked = bookmarks.some(b => b.id === destination.id);
  const scrollY = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const headerScale = scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.2, 1], extrapolate: 'clamp' });
  const headerOpacity = scrollY.interpolate({ inputRange: [0, HEADER_HEIGHT - 80], outputRange: [1, 0], extrapolate: 'clamp' });
  const navBg = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT - 120, HEADER_HEIGHT - 60],
    outputRange: ['rgba(0,0,0,0)', isDark ? '#1A1D16' : '#FFFFFF'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Animated Header */}
      <Animated.View style={[styles.navBar, { backgroundColor: navBg, paddingTop: Math.max(insets.top + 8, 48) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.8}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bookmarkNavBtn, isBookmarked && { backgroundColor: '#FF9F0A' }]}
          onPress={() => dispatch(toggleBookmark(destination))}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
          activeOpacity={0.8}
        >
          <Text style={styles.bookmarkNavIcon}>{isBookmarked ? '🔖' : '🤍'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 100 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <View style={styles.heroContainer}>
          <Animated.Image
            source={{ uri: destination.images[0] || destination.imageUrl }}
            style={[styles.heroImage, { transform: [{ scale: headerScale }] }]}
          />
          <Animated.View style={[styles.heroOverlay, { opacity: headerOpacity }]}>
            <View style={styles.heroMeta}>
              <View style={styles.weatherBadge}>
                <Text style={styles.weatherText}>{destination.weather.icon} {destination.weather.temperature}°C</Text>
              </View>
              <View style={styles.heroBottom}>
                <View style={{ flex: 1, marginRight: Spacing.md }}>
                  <Text style={styles.heroName}>{destination.name}</Text>
                  <Text style={styles.heroCountry}>📍 {destination.country} · {destination.region}</Text>
                </View>
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingNum}>⭐ {destination.rating}</Text>
                  <Text style={styles.reviewCount}>({destination.reviewCount.toLocaleString()})</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>${destination.price}</Text>
              <Text style={styles.statLabel}>Per Day</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statValue}>{destination.duration}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🌤️</Text>
              <Text style={styles.statValue}>{destination.bestTimeToVisit.split(',')[0]}</Text>
              <Text style={styles.statLabel}>Best Time</Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {destination.tags.map((tag: string) => (
              <View key={tag} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></View>
            ))}
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>About Destination</Text>
            <Text style={styles.description}>{destination.description}</Text>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Key Highlights</Text>
            {destination.highlights.map((h: string, i: number) => (
              <View key={i} style={styles.highlightRow}>
                <View style={styles.highlightDot} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Photo Gallery</Text>
            <GalleryCarousel images={destination.images} />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Bottom CTA Bar */}
      <View
        style={[
          styles.ctaContainer,
          {
            paddingBottom: Math.max(insets.bottom, 14),
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaPrice}>${destination.price} <Text style={styles.ctaPerDay}>/day avg</Text></Text>
          <Text style={styles.ctaBest}>Best season: {destination.bestTimeToVisit}</Text>
        </View>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => Alert.alert('Plan Trip', `Trip planner for ${destination.name} will open customized routes.`)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaBtnText}>Plan Trip 🗺️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    navBar: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: Spacing.md, paddingHorizontal: Spacing.xl,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: Radius.full,
      backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { fontSize: 20, color: '#FFFFFF', fontWeight: Typography.weight.bold },
    bookmarkNavBtn: {
      width: 40, height: 40, borderRadius: Radius.full,
      backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    },
    bookmarkNavIcon: { fontSize: 18 },
    heroContainer: { width, height: HEADER_HEIGHT, overflow: 'hidden' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroOverlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    heroMeta: { padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
    weatherBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      marginBottom: Spacing.md,
    },
    weatherText: { fontSize: Typography.size.sm, color: '#FFFFFF', fontWeight: Typography.weight.semiBold },
    heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    heroName: { fontSize: Typography.size['3xl'], fontWeight: Typography.weight.heavy, color: '#FFFFFF' },
    heroCountry: { fontSize: Typography.size.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    ratingPill: {
      backgroundColor: '#FF9F0A',
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    ratingNum: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
    reviewCount: { fontSize: Typography.size.xs, color: 'rgba(255,255,255,0.85)' },
    content: {
      backgroundColor: c.background,
      borderTopLeftRadius: Radius['2xl'],
      borderTopRightRadius: Radius['2xl'],
      marginTop: -Radius['2xl'],
      paddingTop: Spacing.xl,
    },
    statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.xl },
    statCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: Radius.xl,
      padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.border,
    },
    statIcon: { fontSize: 20 },
    statValue: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: c.text, textAlign: 'center' },
    statLabel: { fontSize: Typography.size.xs, color: c.textMuted },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.xl },
    tag: {
      backgroundColor: c.surface, borderRadius: Radius.full,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.border,
    },
    tagText: { fontSize: Typography.size.xs, color: '#FF9F0A', fontWeight: Typography.weight.semiBold },
    sectionBlock: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
    sectionTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: c.text, marginBottom: Spacing.md },
    description: { fontSize: Typography.size.base, color: c.textSecondary, lineHeight: Typography.size.base * 1.6 },
    highlightRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
    highlightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9F0A' },
    highlightText: { fontSize: Typography.size.base, color: c.textSecondary, flex: 1 },
    ctaContainer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl, paddingTop: Spacing.base,
      shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 8,
    },
    ctaLeft: { gap: 2 },
    ctaPrice: { fontSize: Typography.size.xl, fontWeight: Typography.weight.heavy, color: c.text },
    ctaPerDay: { fontSize: Typography.size.sm, fontWeight: Typography.weight.regular, color: c.textMuted },
    ctaBest: { fontSize: Typography.size.xs, color: c.textMuted },
    ctaBtn: {
      backgroundColor: '#FF9F0A',
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.md,
      borderRadius: Radius.full,
      shadowColor: '#FF9F0A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
    ctaBtnText: { color: '#FFFFFF', fontSize: Typography.size.base, fontWeight: Typography.weight.bold },
  });
}

