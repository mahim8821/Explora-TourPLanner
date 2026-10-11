import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, SafeAreaView, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../theme';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleSavedTrip } from '../store/slices/savedTripsSlice';
import { createBooking, hasUserBookedTrip } from '../firebase/bookingService';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;
const { height } = Dimensions.get('window');

export default function TripDetailScreen({ route, navigation }: Props) {
  const { trip } = route.params;
  const dispatch = useAppDispatch();
  const { items: savedTrips } = useAppSelector(s => s.savedTrips);
  const { user } = useAppSelector(s => s.auth);
  const isSaved = savedTrips.some(t => t.id === trip.id);
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!user) {
      Alert.alert('Not Signed In', 'Please sign in to book a trip.');
      return;
    }
    setJoining(true);
    try {
      // Check for duplicate booking
      const alreadyBooked = await hasUserBookedTrip(user.uid, trip.id);
      if (alreadyBooked) {
        Alert.alert('Already Booked', `You have already booked the ${trip.title} trip.`);
        return;
      }

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      await createBooking({
        userId: user.uid,
        userEmail: user.email ?? '',
        userName: user.displayName ?? 'Unknown',
        tripId: trip.id,
        tripTitle: trip.title,
        date: dateStr,
      });

      Alert.alert(
        'Booking Requested! 🎉',
        `Your booking for "${trip.title}" has been submitted and is pending admin approval.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        <Image source={typeof trip.imageUrl === 'string' ? { uri: trip.imageUrl } : trip.imageUrl} style={styles.heroImage} />

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={() => dispatch(toggleSavedTrip(trip))}>
          <Text style={styles.saveButtonIcon}>{isSaved ? '🔖' : '🤍'}</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{trip.title}</Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>৳{trip.budget}</Text>
            </View>
          </View>

          <Text style={styles.location}>📍 {trip.location}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{trip.durationDays} Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={[styles.statValue, trip.slotsAvailable < 5 && { color: '#ff4444' }]}>
                {trip.slotsAvailable}/{trip.totalSlots}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Budget</Text>
              <Text style={styles.statValue}>৳{trip.budget}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About this Trip</Text>
          <Text style={styles.description}>{trip.description}</Text>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.joinButton, joining && { opacity: 0.7 }]}
          onPress={handleJoin}
          activeOpacity={0.8}
          disabled={joining}
        >
          {joining
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={styles.joinButtonText}>Join Trip Now</Text>
          }
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 100 },
  heroImage: { width: '100%', height: height * 0.45 },
  backButton: {
    position: 'absolute', top: 50, left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  saveButton: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  saveButtonIcon: { fontSize: 18 },
  content: {
    padding: 24,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    marginTop: -30,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, flex: 1, marginRight: 16 },
  priceTag: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  priceText: { color: '#000', fontWeight: '900', fontSize: 18 },
  location: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 24 },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16, padding: 20, marginBottom: 32,
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: theme.colors.border },
  statLabel: { color: theme.colors.textSecondary, fontSize: 13, marginBottom: 4 },
  statValue: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text, marginBottom: 12 },
  description: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 24 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.background,
    padding: 20, paddingBottom: 30,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  joinButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
});
