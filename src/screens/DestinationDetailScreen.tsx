import React, {useRef, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Dimensions, Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {Destination} from '../api/types';
import {Colors} from '../theme/colors';
import {Typography} from '../theme/typography';
import {Spacing, Radius, Shadow} from '../theme/spacing';
import {useAppDispatch, useAppSelector} from '../store';
import {toggleBookmark} from '../store/slices/bookmarksSlice';
import GalleryCarousel from '../components/GalleryCarousel';

const {width, height} = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.45;
type NavProps = NativeStackNavigationProp<RootStackParamList>;

interface Props { destination: Destination; }

export default function DestinationDetailScreen({destination}: Props) {
  const navigation = useNavigation<NavProps>();
  const dispatch = useAppDispatch();
  const {items: bookmarks} = useAppSelector(s => s.bookmarks);
  const isBookmarked = bookmarks.some(b => b.id === destination.id);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerScale = scrollY.interpolate({inputRange: [-100, 0], outputRange: [1.2, 1], extrapolate: 'clamp'});
  const headerOpacity = scrollY.interpolate({inputRange: [0, HEADER_HEIGHT - 80], outputRange: [1, 0], extrapolate: 'clamp'});
  const navBg = scrollY.interpolate({inputRange: [HEADER_HEIGHT - 120, HEADER_HEIGHT - 60], outputRange: ['rgba(13,27,42,0)', 'rgba(13,27,42,1)'], extrapolate: 'clamp'});

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Animated.View style={[styles.navBar, {backgroundColor: navBg}]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bookmarkNavBtn, isBookmarked && styles.bookmarkNavBtnActive]} onPress={() => dispatch(toggleBookmark(destination))}>
          <Text style={styles.bookmarkNavIcon}>{isBookmarked ? '🔖' : '🤍'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {useNativeDriver: false})}
        scrollEventThrottle={16}>
        <View style={styles.heroContainer}>
          <Animated.Image source={{uri: destination.images[0] || destination.imageUrl}} style={[styles.heroImage, {transform: [{scale: headerScale}]}]} />
          <Animated.View style={[styles.heroOverlay, {opacity: headerOpacity}]}>
            <View style={styles.heroMeta}>
              <View style={styles.weatherBadge}><Text style={styles.weatherText}>{destination.weather.icon} {destination.weather.temperature}°C</Text></View>
              <View style={styles.heroBottom}>
                <View>
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
            <View style={styles.statCard}><Text style={styles.statIcon}>💰</Text><Text style={styles.statValue}>${destination.price}</Text><Text style={styles.statLabel}>Per Day</Text></View>
            <View style={styles.statCard}><Text style={styles.statIcon}>📅</Text><Text style={styles.statValue}>{destination.duration}</Text><Text style={styles.statLabel}>Duration</Text></View>
            <View style={styles.statCard}><Text style={styles.statIcon}>🌤️</Text><Text style={styles.statValue}>{destination.bestTimeToVisit.split(',')[0]}</Text><Text style={styles.statLabel}>Best Time</Text></View>
          </View>

          <View style={styles.tagsRow}>
            {destination.tags.map((tag: string) => (
              <View key={tag} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></View>
            ))}
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{destination.description}</Text>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Top Highlights</Text>
            {destination.highlights.map((h: string, i: number) => (
              <View key={i} style={styles.highlightRow}>
                <View style={styles.highlightDot} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <GalleryCarousel images={destination.images} />
          </View>
          <View style={{height: 100}} />
        </View>
      </Animated.ScrollView>

      <View style={styles.ctaContainer}>
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaPrice}>${destination.price} <Text style={styles.ctaPerDay}>/day avg</Text></Text>
          <Text style={styles.ctaBest}>Best: {destination.bestTimeToVisit}</Text>
        </View>
        <TouchableOpacity style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>Plan Trip 🗺️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  navBar: {position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: Spacing.md, paddingHorizontal: Spacing.xl},
  backBtn: {width: 40, height: 40, borderRadius: Radius.full, backgroundColor: 'rgba(13,27,42,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.glassBorder},
  backIcon: {fontSize: 20, color: Colors.white, fontWeight: Typography.weight.bold},
  bookmarkNavBtn: {width: 40, height: 40, borderRadius: Radius.full, backgroundColor: 'rgba(13,27,42,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.glassBorder},
  bookmarkNavBtnActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  bookmarkNavIcon: {fontSize: 18},
  heroContainer: {width, height: HEADER_HEIGHT, overflow: 'hidden'},
  heroImage: {width: '100%', height: '100%', resizeMode: 'cover'},
  heroOverlay: {...StyleSheet.absoluteFill, justifyContent: 'flex-end', backgroundColor: 'rgba(13,27,42,0.35)'},
  heroMeta: {padding: Spacing.xl, paddingBottom: Spacing['2xl']},
  weatherBadge: {alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.glassBorderStrong},
  weatherText: {fontSize: Typography.size.sm, color: Colors.white, fontWeight: Typography.weight.semiBold},
  heroBottom: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'},
  heroName: {fontSize: Typography.size['3xl'], fontWeight: Typography.weight.heavy, color: Colors.white},
  heroCountry: {fontSize: Typography.size.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4},
  ratingPill: {backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center'},
  ratingNum: {fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.white},
  reviewCount: {fontSize: Typography.size.xs, color: 'rgba(255,255,255,0.7)'},
  content: {backgroundColor: Colors.background, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], marginTop: -Radius['2xl'], paddingTop: Spacing.xl},
  statsRow: {flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.xl},
  statCard: {flex: 1, backgroundColor: Colors.backgroundCard, borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.glassBorder},
  statIcon: {fontSize: 20},
  statValue: {fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textPrimary, textAlign: 'center'},
  statLabel: {fontSize: Typography.size.xs, color: Colors.textMuted},
  tagsRow: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.xl},
  tag: {backgroundColor: Colors.backgroundElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.glassBorder},
  tagText: {fontSize: Typography.size.xs, color: Colors.primary, fontWeight: Typography.weight.medium},
  sectionBlock: {paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl},
  sectionTitle: {fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing.md},
  description: {fontSize: Typography.size.base, color: Colors.textSecondary, lineHeight: Typography.size.base * 1.7},
  highlightRow: {flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm},
  highlightDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary},
  highlightText: {fontSize: Typography.size.base, color: Colors.textSecondary, flex: 1},
  ctaContainer: {position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.backgroundElevated, borderTopWidth: 1, borderTopColor: Colors.glassBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base, paddingBottom: Spacing.xl},
  ctaLeft: {gap: 2},
  ctaPrice: {fontSize: Typography.size.xl, fontWeight: Typography.weight.heavy, color: Colors.textPrimary},
  ctaPerDay: {fontSize: Typography.size.sm, fontWeight: Typography.weight.regular, color: Colors.textMuted},
  ctaBest: {fontSize: Typography.size.xs, color: Colors.textMuted},
  ctaBtn: {backgroundColor: Colors.primary, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: Radius.full, ...Shadow.glow(Colors.primary)},
  ctaBtnText: {color: Colors.white, fontSize: Typography.size.base, fontWeight: Typography.weight.bold},
});
