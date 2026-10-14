import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, StatusBar,
  ScrollView, TouchableOpacity, Image, TextInput, Animated, ImageBackground, Dimensions, ActivityIndicator, Platform
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { TRIPS, TripCategory, Trip } from '../data/trips';
import TripCard from '../components/TripCard';
import BangladeshMap from '../components/BangladeshMap';
import FeaturedSlider from '../components/FeaturedSlider';
import GalleryCarousel from '../components/GalleryCarousel';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useAppSelector } from '../store';
import { subscribeToTrips, FirestoreTrip } from '../firebase/tripService';
import { subscribeToContent, AppContent } from '../firebase/contentService';
import { fetchLiveWeather, getCachedWeather, WeatherData } from '../services/weatherService';
import WeatherModal from '../components/WeatherModal';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Convert a FirestoreTrip to the Trip shape TripCard/FeaturedSlider expect
function toTrip(ft: FirestoreTrip): Trip {
  return {
    id: ft.id,
    title: ft.title,
    location: ft.location,
    durationDays: ft.durationDays,
    budget: ft.budget,
    slotsAvailable: ft.slotsAvailable,
    totalSlots: ft.totalSlots,
    description: ft.description,
    category: ft.category,
    imageUrl: ft.imageUrl, // string URL — both components already handle this
  };
}

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORIES: { label: TripCategory; icon?: string }[] = [
  { label: 'All' },
  { label: 'Beach' },
  { label: 'Hiking' },
  { label: 'Camping' },
  { label: 'Retreat' },
];

// ─── App Logo icon ────────────────────────────────────────────────────────────

function ExploraLogo({ color }: { color: string }) {
  const s = 22;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ring */}
      <View style={{
        width: s, height: s, borderRadius: s / 2,
        borderWidth: 2, borderColor: color,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Diagonal needle pointing NE */}
        <View style={{
          position: 'absolute',
          width: 2, height: s * 0.44,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }],
          top: s * 0.06,
          right: s * 0.25,
        }} />
        {/* Diagonal tail pointing SW */}
        <View style={{
          position: 'absolute',
          width: 2, height: s * 0.32,
          backgroundColor: color + '55',
          borderRadius: 1,
          transform: [{ rotate: '45deg' }],
          bottom: s * 0.08,
          left: s * 0.2,
        }} />
      </View>
    </View>
  );
}

// ─── Heatmap Promo Card ──────────────────────────────────────────────────────

// Some pre-lit districts for visual demo
// const DEMO_DISTRICTS = ['Dhaka', 'Chattogram', 'Sylhet', 'Cox\'s Bazar', 'Rangamati', 'Khulna', 'Barishal'];

// function HeatmapPromoCard({ onPress }: { onPress: () => void }) {
//   const { colors, isDark } = useTheme();
//   const pulseAnim = useRef(new Animated.Value(1)).current;
//   const glowAnim = useRef(new Animated.Value(0)).current;

//   const styles = useMemo(() => getPromoStyles(colors, isDark), [colors, isDark]);

//   useEffect(() => {
//     // Subtle pulse on the CTA button
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
//         Animated.timing(pulseAnim, { toValue: 1.00, duration: 900, useNativeDriver: true }),
//       ])
//     ).start();
//     // Glow fade-in
//     Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
//   }, []);

//   return (
//     <Animated.View style={[styles.card, { opacity: glowAnim }]}>
//       {/* ── Background layers ─────────────────────────────────────────────── */}
//       <View style={styles.bgDark} />
//       <View style={styles.bgAccentTR} />
//       <View style={styles.bgAccentBL} />

//       {/* ── Content ───────────────────────────────────────────────────────── */}
//       <View style={styles.row}>

//         {/* Left: map preview ───────────────────────────────────── */}
//         <View style={styles.mapPreviewWrap}>
//           <BangladeshMap
//             width={115}
//             height={145}
//             selectedDistricts={DEMO_DISTRICTS}
//             fillColor={colors.surfaceElevated}
//             selectedColor={colors.primary}
//             strokeColor={colors.background}
//             strokeWidth={0.8}
//           />
//           {/* Floating badge on map */}
//           <View style={styles.mapBadge}>
//             <Text style={styles.mapBadgeText}>64 Districts</Text>
//           </View>
//         </View>

//         {/* Right: text + features ──────────────────────────────── */}
//         <View style={styles.textCol}>
//           {/* NEW badge */}
//           <View style={styles.newBadge}>
//             <Text style={styles.newBadgeText}>✦ NEW FEATURE</Text>
//           </View>

//           <Text style={styles.title}>আমার দেখা{`\n`}বাংলাদেশ</Text>
//           <Text style={styles.subtitle}>Track your journey across all 64 districts</Text>


//         </View>
//       </View>

//       {/* ── CTA Button ────────────────────────────────────────────────────── */}
//       <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
//         <TouchableOpacity style={styles.cta} onPress={onPress} activeOpacity={0.8}>
//           <Text style={styles.ctaText}>Track your explored District  →</Text>
//         </TouchableOpacity>
//       </Animated.View>
//     </Animated.View>
//   );
// }

function getPromoStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    card: {
      marginHorizontal: Spacing.xl,
      marginBottom: Spacing.lg,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      position: 'relative',
      padding: Spacing.base,
      paddingBottom: Spacing.md,
      borderWidth: 1,
      borderColor: c.borderStrong,
    },
    bgDark: {
      ...StyleSheet.absoluteFill,
      backgroundColor: c.surface,
    },
    bgAccentTR: {
      position: 'absolute',
      top: -40,
      right: -40,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: c.primaryLight,
    },
    bgAccentBL: {
      position: 'absolute',
      bottom: -30,
      left: -20,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: c.primaryLight,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
      gap: Spacing.md,
    },
    mapPreviewWrap: {
      position: 'relative',
      borderRadius: Radius.lg,
      overflow: 'hidden',
      backgroundColor: c.surfaceElevated,
    },
    mapBadge: {
      position: 'absolute',
      bottom: 6,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    mapBadgeText: {
      fontSize: 9,
      color: c.primary,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    textCol: {
      flex: 1,
      paddingTop: 2,
    },
    newBadge: {
      alignSelf: 'flex-start',
      backgroundColor: c.primary,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 8,
    },
    newBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: c.background,
      letterSpacing: 0.8,
    },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: c.text,
      lineHeight: 22,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 11,
      color: c.textSecondary,
      lineHeight: 15,
      marginBottom: 10,
    },
    cta: {
      backgroundColor: c.primary,
      borderRadius: Radius.lg,
      paddingVertical: 12,
      alignItems: 'center',
    },
    ctaText: {
      color: c.background,
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: 0.3,
    },
  });
}



// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BrowsingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const { user } = useAppSelector(s => s.auth);
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<TripCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Real-time Firestore trips ──────────────────────────────────────────────
  // Start with local trips as a fallback; replace with Firestore data as soon
  // as the first snapshot arrives so the screen is never blank.
  const [allTrips, setAllTrips] = useState<Trip[]>(TRIPS);
  const [contents, setContents] = useState<AppContent[]>([]);
  const [firestoreReady, setFirestoreReady] = useState(false);

  useEffect(() => {
    const unsub = subscribeToTrips(fsTrips => {
      if (fsTrips.length > 0) {
        // Firestore has data — use it
        setAllTrips(fsTrips.map(toTrip));
      } else {
        // Firestore empty (not seeded yet) — keep showing local data
        setAllTrips(TRIPS);
      }
      setFirestoreReady(true);
    });
    return unsub;
  }, []);

  // ── Live Weather & Location Data ──────────────────────────────────────────
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherModalVisible, setWeatherModalVisible] = useState(false);

  useEffect(() => {
    // 1. Instantly display cached weather with 0ms delay
    getCachedWeather().then(cached => {
      if (cached) setWeather(cached);
    });

    // 2. Fetch live real-time GPS & Open-Meteo weather
    setWeatherLoading(true);
    fetchLiveWeather()
      .then(data => setWeather(data))
      .catch(err => console.warn('Weather fetch error:', err))
      .finally(() => setWeatherLoading(false));
  }, []);

  const handleRefreshWeather = async () => {
    setWeatherLoading(true);
    try {
      const data = await fetchLiveWeather(true);
      setWeather(data);
    } catch (e: any) {
      console.warn('Weather refresh error:', e);
    } finally {
      setWeatherLoading(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const firstName = user?.displayName?.split(' ')[0] ?? 'Explorer';
  const avatarUrl = user?.photoURL
    ? user.photoURL
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=FF6B35&color=fff&size=80`;

  const filteredTrips = useMemo(() => {
    return allTrips.filter(t => {
      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [allTrips, selectedCategory, searchQuery]);

  // ── All Gallery Images (Uploaded images: Stories, Vlogs, Featured & Trips) ──
  const allGalleryImages = useMemo(() => {
    const list: { id: string; source: any; title: string; location?: string }[] = [];
    const seen = new Set<string>();

    const add = (source: any, title: string, location?: string, prefix = 'upload') => {
      if (!source) return;
      const key = typeof source === 'string' ? source : `${prefix}_${title}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: `${prefix}_${list.length}`,
          source,
          title,
          location,
        });
      }
    };

    // 1. Stories & Vlogs (Cover photos, uploaded gallery photos, image media)
    contents.forEach(c => {
      if (c.coverImageUrl) {
        add(c.coverImageUrl, c.title, `${c.type || 'Story'} Cover`, 'story_cover');
      }
      if (Array.isArray(c.galleryUrls)) {
        c.galleryUrls.forEach((url, idx) => {
          add(url, `${c.title} • Photo ${idx + 1}`, `${c.type || 'Story'} Gallery`, 'story_gallery');
        });
      }
      if (c.mediaUrl && !c.mediaUrl.endsWith('.mp4') && !c.mediaUrl.endsWith('.mov')) {
        add(c.mediaUrl, c.title, `${c.type || 'Story'} Media`, 'story_media');
      }
    });

    // 2. All Trips & Featured tours (Uploaded via admin/Firestore or local)
    allTrips.forEach(t => {
      if (t.imageUrl) {
        add(t.imageUrl, t.title, t.location, 'trip');
      }
    });

    // 3. Fallback default trips
    TRIPS.forEach(t => {
      if (t.imageUrl) {
        add(t.imageUrl, t.title, t.location, 'trip');
      }
    });

    return list;
  }, [allTrips, contents]);


  const ListHeader = (
    <>
      <ImageBackground
        source={require('../assets/images/trips/bandarban.jpg')}
        style={[styles.heroHeader, { paddingTop: insets.top + 8 }]}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />

        {/* ── Top Bar (Location, Live Weather & Profile Avatar) ── */}
        <View style={styles.heroTopBar}>
          <TouchableOpacity
            style={styles.heroWeatherBadge}
            onPress={() => setWeatherModalVisible(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Live weather and location updates"
          >
            {/* Top row: Location & Live pulse */}
            <View style={styles.heroLocationRow}>
              <View style={styles.locationDot} />
              <Text style={styles.heroLocationText} numberOfLines={1}>
                {(weather?.district || weather?.locationName || 'Dhaka').toUpperCase()}
              </Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.liveIndicatorText}>LIVE</Text>
              </View>
            </View>

            {/* Bottom row: Clean typographic metrics without emojis */}
            <View style={styles.heroWeatherRow}>
              <Text style={styles.weatherTempText}>
                {weather ? `${weather.temperature}°C` : '28°C'}
              </Text>
              <Text style={styles.weatherDotSep}>•</Text>
              <Text style={styles.weatherConditionText} numberOfLines={1}>
                {(weather?.condition || 'Partly Cloudy').toUpperCase()}
              </Text>
              {weather ? (
                <>
                  <Text style={styles.weatherDotSep}>•</Text>
                  <Text style={styles.weatherFeelsText}>FEELS {weather.feelsLike}°</Text>
                </>
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => (navigation as any).navigate('Profile')}>
            <View>
              <Image source={{ uri: avatarUrl }} style={styles.heroAvatar} />
              <View style={styles.notificationDot} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Hero Text ───────────────────────────── */}
        <Text style={styles.heroTitle}>Explore the hidden stories</Text>

        {/* ── Search & Mic Row ────────────────────── */}
        <View style={styles.heroSearchRow}>
          <View style={styles.heroSearchWrap}>
            <Text style={styles.heroSearchIcon}>⌕</Text>
            <TextInput
              style={styles.heroSearchInput}
              placeholder="Where do you want to go?"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Text style={[styles.clearTxt, { color: '#888' }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ImageBackground>

      {/* ── Categories ────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map(cat => {
          const active = selectedCategory === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[
                styles.catPill,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border
                },
              ]}
              onPress={() => setSelectedCategory(cat.label)}
              activeOpacity={0.78}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, { color: active ? '#fff' : colors.textSecondary }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>



      {/* ── Heatmap Promo Card ──────────────────
      {selectedCategory === 'All' && searchQuery === '' && (
        <HeatmapPromoCard onPress={() => navigation.navigate('Heatmap')} />
      )} */}

      {/* ── Featured Slider ─────────────────────
      {selectedCategory === 'All' && searchQuery === '' && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>FEATURED</Text>
          </View>
          <FeaturedSlider
            trips={allTrips.slice(0, 5)}
            onPress={trip => navigation.navigate('TripDetail', { trip })}
          />
        </>
      )} */}

      {/* ── Stories & Vlogs ───────────────────── */}
      {contents.length > 0 && selectedCategory === 'All' && searchQuery === '' && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>STORIES & VLOGS</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={(SCREEN_WIDTH * 0.72) + 16} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.lg }}>
            {contents.map(c => (
              <TouchableOpacity key={c.id} activeOpacity={0.9} style={{ width: SCREEN_WIDTH * 0.72, height: 360, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 }} onPress={() => navigation.navigate('ContentDetail', { content: c })}>
                <ImageBackground source={{ uri: c.coverImageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' }} style={{ flex: 1, padding: Spacing.lg, justifyContent: 'space-between' }} imageStyle={{ borderRadius: 28 }}>
                  <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 28 }} />
                  <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#111' }}>{c.type.toUpperCase()}</Text>
                  </View>
                  <View style={{ marginTop: 'auto' }}>
                    <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }} numberOfLines={2}>{c.title}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* ── Section label ─────────────────────── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>
          {selectedCategory === 'All' ? 'ALL TRIPS' : selectedCategory.toUpperCase()}
        </Text>
        <Text style={styles.sectionCount}>{filteredTrips.length} trips</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <FlatList
        data={filteredTrips}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() => navigation.navigate('TripDetail', { trip: item })}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !firestoreReady ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptySub, { color: colors.textMuted, marginTop: 12 }]}>
                Loading tours across Bangladesh...
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧭</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No trips found</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {searchQuery.trim()
                  ? `No destinations match "${searchQuery}".`
                  : `No tours currently listed in ${selectedCategory}.`}
              </Text>
              {(searchQuery.trim().length > 0 || selectedCategory !== 'All') && (
                <TouchableOpacity
                  style={[styles.resetBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetBtnText}>Reset Search & Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        ListFooterComponent={
          selectedCategory === 'All' && searchQuery === '' && allGalleryImages.length > 0 ? (
            <View style={{ marginTop: Spacing.xl, paddingBottom: Spacing.xl }}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>GALLERY</Text>
                <Text style={styles.sectionCount}>{allGalleryImages.length} photos</Text>
              </View>
              <GalleryCarousel images={allGalleryImages} />
            </View>
          ) : null
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Live Weather Details Modal ─────────── */}
      <WeatherModal
        visible={weatherModalVisible}
        onClose={() => setWeatherModalVisible(false)}
        weather={weather}
        loading={weatherLoading}
        onRefresh={handleRefreshWeather}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },

    heroHeader: {
      width: SCREEN_WIDTH,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
      position: 'relative',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      marginBottom: Spacing.lg,
      minHeight: 220,
      justifyContent: 'space-between',
    },
    heroImage: {

      resizeMode: 'cover',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    heroTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroWeatherBadge: {
      backgroundColor: 'rgba(0, 0, 0, 0.48)',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.16)',
      maxWidth: SCREEN_WIDTH - 90,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    heroLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
    },
    locationDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#10B981',
      marginRight: 6,
    },
    heroLocationText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 1.2,
      fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif-medium' }),
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.25)',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: Radius.full,
      marginLeft: 6,
      gap: 3,
    },
    liveIndicatorDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#10B981',
    },
    liveIndicatorText: {
      fontSize: 8,
      fontWeight: '800',
      color: '#10B981',
      letterSpacing: 0.6,
    },
    heroWeatherRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    weatherTempText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
      fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif-medium' }),
    },
    weatherDotSep: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.4)',
      marginHorizontal: 5,
    },
    weatherConditionText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FCD34D',
      letterSpacing: 0.8,
      fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif-medium' }),
    },
    weatherFeelsText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.75)',
      letterSpacing: 0.6,
    },
    heroAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: '#FFF',
    },
    notificationDot: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 12,
      height: 12,
      backgroundColor: '#FF3B30',
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#FFF',
    },
    heroTitle: {
      fontFamily: Platform.select({
        ios: 'Didot',
        android: 'serif',
        default: 'serif',
      }),
      fontSize: 22,
      fontWeight: '400',
      color: '#FFFFFF',
      lineHeight: 40,
      letterSpacing: 2,
      marginBottom: 25,
      textShadowColor: 'rgba(0, 0, 0, 0.4)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 1,
    },
    heroSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    heroSearchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderRadius: 25,
      height: 52,
      paddingHorizontal: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    heroSearchIcon: {
      fontSize: 22,
      color: '#888',
      marginRight: Spacing.sm,
    },
    heroSearchInput: {
      flex: 1,
      fontSize: 15,
      color: '#000',
      height: 52,
      paddingVertical: 0,
    },
    clearBtn: { padding: Spacing.xs },
    clearTxt: { fontSize: 13 },
    micBtn: {
      width: 52,
      height: 52,
      backgroundColor: '#0F3F35', // dark green
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    micIcon: {
      fontSize: 20,
    },

    // Categories
    categoriesScroll: { marginBottom: Spacing.md },
    categories: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
    },
    catPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      borderRadius: 20,
      gap: 5,
    },
    catIcon: { fontSize: 15 },
    catLabel: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semiBold,
    },

    // Section row
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.sm,
      paddingTop: Spacing.xs,
    },
    sectionLabel: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      color: c.textMuted,
      letterSpacing: 1,
    },
    sectionCount: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
    },

    // Empty
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      paddingHorizontal: Spacing.xl,
    },
    emptyIcon: { fontSize: 44, marginBottom: Spacing.sm },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 6,
    },
    emptySub: {
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: Spacing.lg,
      maxWidth: 280,
    },
    resetBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: Radius.full,
    },
    resetBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },

    listContent: { paddingBottom: 48 },
  });
}
