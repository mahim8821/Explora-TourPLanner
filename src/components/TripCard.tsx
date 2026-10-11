import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Trip } from '../data/trips';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={typeof trip.imageUrl === 'string' ? { uri: trip.imageUrl } : trip.imageUrl}
        style={styles.imageBg}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay} />

        {/* Top Badge */}
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>✓</Text>
            <Text style={styles.badgeText}>Reserve zone</Text>
          </View>
        </View>

        {/* Bottom Content */}
        <View style={styles.bottomContent}>
          <Text style={styles.title} numberOfLines={1}>{trip.title}</Text>
          <Text style={styles.location} numberOfLines={1}>{trip.location}</Text>
          <Text style={styles.description} numberOfLines={3}>{trip.description}</Text>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <View style={styles.priceBtn}>
              <Text style={styles.priceText}>৳{trip.budget.toLocaleString()}</Text>
            </View>
            <View style={styles.startBtn}>
              <Text style={styles.startBtnText}>Start journey ➔</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    borderRadius: 32,
    overflow: 'hidden',
    height: 440,
    backgroundColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  imageBg: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  imageStyle: {
    borderRadius: 32,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 32,
  },
  topRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 12,
    color: '#0F3F35',
    fontWeight: '900',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
  bottomContent: {
    marginTop: 'auto',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  location: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: '#F9FAFB',
    lineHeight: 18,
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 14,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },
  startBtn: {
    backgroundColor: '#0F3F35',
    paddingHorizontal: 20,
    height: 46,
    justifyContent: 'center',
    borderRadius: 14,
  },
  startBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  }
});
