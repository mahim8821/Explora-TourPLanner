import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, Dimensions, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleSavedTrip } from '../store/slices/savedTripsSlice';
import { createBooking, hasUserBookedTrip } from '../firebase/bookingService';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;
const { height } = Dimensions.get('window');

const TRIP_HIGHLIGHTS = [
  { icon: '🏕️', title: 'Camp & Stay', desc: 'Pre-arranged scenic campsite / eco-resort' },
  { icon: '🧭', title: 'Local Guides', desc: 'Experienced regional trek leader' },
  { icon: '🥘', title: 'Local Cuisine', desc: 'Authentic local breakfast & meals' },
  { icon: '📸', title: 'Photo Stops', desc: 'Unmapped viewpoints & waterfalls' },
];

export default function TripDetailScreen({ route, navigation }: Props) {
  const { trip } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { items: savedTrips } = useAppSelector(s => s.savedTrips);
  const { user } = useAppSelector(s => s.auth);
  const { colors, isDark } = useTheme();

  const isSaved = savedTrips.some(t => t.id === trip.id);
  const isSoldOut = trip.slotsAvailable <= 0;
  const [joining, setJoining] = useState(false);

  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const handleJoin = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to book your spot on this tour.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => (navigation as any).navigate('Profile') },
      ]);
      return;
    }
    if (isSoldOut) {
      Alert.alert('Sold Out', 'Sorry, all slots for this departure have been booked.');
      return;
    }

    setJoining(true);
    try {
      const alreadyBooked = await hasUserBookedTrip(user.uid, trip.id);
      if (alreadyBooked) {
        Alert.alert('Already Booked', `You have already requested a booking for "${trip.title}".`);
        return;
      }

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      await createBooking({
        userId: user.uid,
        userEmail: user.email ?? '',
        userName: user.displayName ?? 'Explorer',
        tripId: trip.id,
        tripTitle: trip.title,
        date: dateStr,
      });

      Alert.alert(
        'Booking Requested! 🎉',
        `Your booking for "${trip.title}" has been submitted successfully and is pending admin confirmation.`,
        [{ text: 'Awesome', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Booking Error', e.message || 'Could not complete booking request.');
    } finally {
      setJoining(false);
    }
  };

  const bookedCount = Math.max(0, trip.totalSlots - trip.slotsAvailable);
  const occupancyPercent = Math.min(100, Math.round((bookedCount / Math.max(1, trip.totalSlots)) * 100));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroWrap}>
          <Image
            source={typeof trip.imageUrl === 'string' ? { uri: trip.imageUrl } : trip.imageUrl}
            style={styles.heroImage}
          />
          <View style={styles.heroGradientOverlay} />

          {/* Floating Back Button */}
          <TouchableOpacity
            style={[styles.floatingBackBtn, { top: Math.max(insets.top + 8, 48) }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.8}
          >
            <Text style={styles.floatingBackIcon}>←</Text>
          </TouchableOpacity>

          {/* Floating Save Button */}
          <TouchableOpacity
            style={[
              styles.floatingSaveBtn,
              { top: Math.max(insets.top + 8, 48) },
              isSaved && { backgroundColor: 'rgba(255, 159, 10, 0.9)' },
            ]}
            onPress={() => dispatch(toggleSavedTrip(trip))}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save this tour'}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingSaveIcon}>{isSaved ? '🔖' : '🤍'}</Text>
          </TouchableOpacity>

          {/* Category Pill on Image */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{trip.category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Content Sheet */}
        <View style={styles.content}>
          {/* Title & Location */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{trip.title}</Text>
          </View>
          <Text style={styles.location}>📍 {trip.location}</Text>

          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{trip.durationDays} Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SLOTS LEFT</Text>
              <Text
                style={[
                  styles.statValue,
                  trip.slotsAvailable <= 3 && { color: '#FF3B30' },
                ]}
              >
                {trip.slotsAvailable}/{trip.totalSlots}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>PRICE</Text>
              <Text style={[styles.statValue, { color: '#FF9F0A' }]}>৳{trip.budget.toLocaleString()}</Text>
            </View>
          </View>

          {/* Booking Urgency / Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Trip Occupancy</Text>
              <Text style={styles.progressValue}>{occupancyPercent}% Booked</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${occupancyPercent}%` },
                  trip.slotsAvailable <= 3 && { backgroundColor: '#FF3B30' },
                ]}
              />
            </View>
          </View>

          {/* About Section */}
          <Text style={styles.sectionTitle}>Overview & Itinerary</Text>
          <Text style={styles.description}>{trip.description}</Text>

          {/* Highlights */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>What's Included</Text>
          <View style={styles.highlightsGrid}>
            {TRIP_HIGHLIGHTS.map((item, idx) => (
              <View key={idx} style={styles.highlightItem}>
                <Text style={styles.highlightIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                  <Text style={styles.highlightDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Booking Dock */}
      <View
        style={[
          styles.bottomDock,
          {
            paddingBottom: Math.max(insets.bottom, 14),
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.dockPriceCol}>
          <Text style={styles.dockPriceLabel}>TOTAL PRICE</Text>
          <Text style={styles.dockPriceText}>৳{trip.budget.toLocaleString()}</Text>
          <Text style={styles.dockPerPerson}>per explorer</Text>
        </View>

        <TouchableOpacity
          id="join-trip-action-btn"
          style={[
            styles.joinButton,
            { backgroundColor: isSoldOut ? colors.surfaceElevated : '#FF9F0A' },
            joining && { opacity: 0.7 },
          ]}
          onPress={handleJoin}
          activeOpacity={0.85}
          disabled={joining || isSoldOut}
          accessibilityRole="button"
          accessibilityLabel={isSoldOut ? 'Tour Sold Out' : 'Join Tour Now'}
        >
          {joining ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.joinButtonText,
                isSoldOut && { color: colors.textMuted },
              ]}
            >
              {isSoldOut ? 'Sold Out' : 'Join Tour Now →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scrollContent: {},
    heroWrap: {
      position: 'relative',
      width: '100%',
      height: height * 0.44,
    },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroGradientOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    floatingBackBtn: {
      position: 'absolute',
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
    },
    floatingBackIcon: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', lineHeight: 22 },
    floatingSaveBtn: {
      position: 'absolute',
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
    },
    floatingSaveIcon: { fontSize: 18 },
    categoryBadge: {
      position: 'absolute',
      bottom: 42,
      left: Spacing.xl,
      backgroundColor: 'rgba(255,255,255,0.95)',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#0F3F35',
      letterSpacing: 0.8,
    },

    content: {
      padding: Spacing.xl,
      backgroundColor: c.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      marginTop: -28,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    title: {
      fontSize: 26,
      fontWeight: Typography.weight.heavy,
      color: c.text,
      flex: 1,
      lineHeight: 32,
    },
    location: {
      fontSize: Typography.size.sm,
      color: c.textSecondary,
      marginBottom: Spacing.lg,
    },

    statsContainer: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.lg,
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: c.border },
    statLabel: {
      color: c.textMuted,
      fontSize: 9.5,
      fontWeight: '700',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    statValue: { color: c.text, fontSize: 15, fontWeight: Typography.weight.bold },

    progressContainer: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    progressLabel: { fontSize: Typography.size.xs, fontWeight: '600', color: c.textMuted },
    progressValue: { fontSize: Typography.size.xs, fontWeight: '700', color: c.text },
    progressBarBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: '#FF9F0A',
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: Typography.weight.bold,
      color: c.text,
      marginBottom: Spacing.sm,
    },
    description: {
      fontSize: Typography.size.base,
      color: c.textSecondary,
      lineHeight: 24,
    },

    highlightsGrid: {
      gap: Spacing.md,
      marginTop: Spacing.xs,
    },
    highlightItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      gap: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    highlightIcon: { fontSize: 22 },
    highlightTitle: { fontSize: Typography.size.sm, fontWeight: '700', color: c.text },
    highlightDesc: { fontSize: Typography.size.xs, color: c.textMuted, marginTop: 2 },

    bottomDock: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    dockPriceCol: { flex: 1 },
    dockPriceLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: c.textMuted,
      letterSpacing: 0.8,
    },
    dockPriceText: {
      fontSize: 22,
      fontWeight: Typography.weight.heavy,
      color: c.text,
      marginTop: 1,
    },
    dockPerPerson: { fontSize: 10, color: c.textMuted },
    joinButton: {
      paddingHorizontal: 24,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#FF9F0A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    joinButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
}

