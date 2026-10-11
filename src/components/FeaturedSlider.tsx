import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Trip } from '../data/trips';
import { Spacing, Radius } from '../theme/spacing';

const { width: W } = Dimensions.get('window');
const CARD_WIDTH = W * 0.72;

interface Props {
  trips: Trip[];
  onPress: (trip: Trip) => void;
}

export default function FeaturedSlider({ trips, onPress }: Props) {
  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + Spacing.md}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {trips.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            activeOpacity={0.9}
            onPress={() => onPress(trip)}
            style={styles.cardWrap}
          >
            <ImageBackground
              source={typeof trip.imageUrl === 'string' ? { uri: trip.imageUrl } : trip.imageUrl}
              style={styles.card}
              imageStyle={styles.imageStyle}
            >
              <View style={styles.overlay} />
              
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⭐ Featured</Text>
              </View>

              <View style={styles.bottomInfo}>
                <Text style={styles.title} numberOfLines={1}>{trip.title}</Text>
                <Text style={styles.meta} numberOfLines={1}>{trip.location} • ৳{trip.budget.toLocaleString()}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginVertical: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  cardWrap: {
    width: CARD_WIDTH,
    height: 320,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  imageStyle: {
    borderRadius: 28,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 28,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111',
  },
  bottomInfo: {
    marginTop: 'auto',
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  meta: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  }
});
