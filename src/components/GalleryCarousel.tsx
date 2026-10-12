import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { Radius, Spacing, Shadow } from '../theme/spacing';

export interface GalleryItemData {
  id?: string;
  source?: any;
  uri?: string;
  title?: string;
  location?: string;
}

export type GalleryImageInput = string | number | GalleryItemData;

interface GalleryCarouselProps {
  images: GalleryImageInput[];
  autoPlayInterval?: number;
}

interface NormalizedGalleryItem {
  id: string;
  source: any;
  title?: string;
  location?: string;
}

export default function GalleryCarousel({
  images,
  autoPlayInterval = 2800,
}: GalleryCarouselProps) {
  const { colors, isDark } = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const ITEM_WIDTH = Math.round(SCREEN_WIDTH * 0.70);
  const ITEM_HEIGHT = Math.round(ITEM_WIDTH * 1.34);
  const SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

  // Normalize images into uniform shape
  const normalizedImages: NormalizedGalleryItem[] = useMemo(() => {
    if (!images || !Array.isArray(images)) return [];
    return images.map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `img_${index}`,
          source: { uri: item },
          title: `Photo ${index + 1}`,
        };
      }
      if (typeof item === 'number') {
        return {
          id: `img_${index}`,
          source: item,
          title: `Photo ${index + 1}`,
        };
      }
      if (item && typeof item === 'object') {
        const src = item.source || (item.uri ? { uri: item.uri } : item);
        return {
          id: item.id || `img_${index}`,
          source: typeof src === 'string' ? { uri: src } : src,
          title: item.title,
          location: item.location,
        };
      }
      return {
        id: `img_${index}`,
        source: item,
        title: `Photo ${index + 1}`,
      };
    });
  }, [images]);

  const totalCount = normalizedImages.length;

  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const isUserInteracting = useRef(false);

  // Full-screen Lightbox modal state
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Keep ref in sync
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Auto-play sliding right-to-left continuously
  useEffect(() => {
    if (totalCount <= 1) return;

    const interval = setInterval(() => {
      if (isUserInteracting.current) return;

      const nextIndex = (activeIndexRef.current + 1) % totalCount;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * ITEM_WIDTH,
        animated: true,
      });
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [totalCount, autoPlayInterval, ITEM_WIDTH]);

  // Reanimated scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleScrollBegin = () => {
    isUserInteracting.current = true;
  };

  const handleScrollEnd = (offsetX: number) => {
    const newIndex = Math.max(0, Math.min(Math.round(offsetX / ITEM_WIDTH), totalCount - 1));
    activeIndexRef.current = newIndex;
    setActiveIndex(newIndex);
    // Resume auto-play after 3.2 seconds of idle
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 3200);
  };

  const scrollToItem = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalCount) return;
      scrollViewRef.current?.scrollTo({
        x: index * ITEM_WIDTH,
        animated: true,
      });
      activeIndexRef.current = index;
      setActiveIndex(index);
    },
    [totalCount, ITEM_WIDTH]
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxVisible(true);
  };

  const activeItem = normalizedImages[activeIndex];

  if (totalCount === 0) return null;

  return (
    <View style={[styles.container, { height: ITEM_HEIGHT + 74 }]}>
      {/* ── 1. Ambient Blurred Backdrop ─────────────────────────────────── */}
      <View style={styles.ambientContainer} pointerEvents="none">
        {activeItem?.source && (
          <Image
            source={activeItem.source}
            blurRadius={Platform.OS === 'ios' ? 36 : 20}
            style={styles.ambientImage}
            resizeMode="cover"
          />
        )}
        <View
          style={[
            styles.ambientOverlay,
            {
              backgroundColor: isDark
                ? 'rgba(26,29,22,0.82)'
                : 'rgba(255,255,255,0.85)',
            },
          ]}
        />
      </View>

      {/* ── 2. Visual 3D Deck Layer with Blurry Faded Animation ─────────── */}
      <View style={styles.visualLayer} pointerEvents="none">
        {normalizedImages.map((item, index) => {
          // Render blur overlay only for near cards to keep GPU/memory ultra light
          const isNear = Math.abs(index - activeIndex) <= 3;
          return (
            <GalleryItem
              key={item.id}
              item={item}
              index={index}
              scrollX={scrollX}
              itemWidth={ITEM_WIDTH}
              itemHeight={ITEM_HEIGHT}
              screenWidth={SCREEN_WIDTH}
              isNear={isNear}
              isDark={isDark}
            />
          );
        })}
      </View>

      {/* ── 3. Gesture Layer (Transparent ScrollView) ───────────────────── */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onTouchStart={handleScrollBegin}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={e => handleScrollEnd(e.nativeEvent.contentOffset.x)}
        onMomentumScrollEnd={e => handleScrollEnd(e.nativeEvent.contentOffset.x)}
        contentContainerStyle={{
          paddingHorizontal: SPACING,
          width: ITEM_WIDTH * totalCount + SPACING * 2,
        }}
        style={StyleSheet.absoluteFill}
      >
        {normalizedImages.map((item, index) => (
          <TouchableOpacity
            key={`touch_${item.id}`}
            activeOpacity={0.9}
            style={{ width: ITEM_WIDTH, height: ITEM_HEIGHT + 40 }}
            onPress={() => {
              if (index === activeIndex) {
                openLightbox(index);
              } else {
                scrollToItem(index);
              }
            }}
          />
        ))}
      </Animated.ScrollView>

      {/* ── 4. Edge Blurry Faded Gradient Masks ─────────────────────────── */}
      <View style={[styles.edgeFade, styles.edgeLeft]} pointerEvents="none">
        <Svg width={55} height="100%">
          <Defs>
            <LinearGradient id="galleryFadeLeft" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.background} stopOpacity="1" />
              <Stop offset="0.6" stopColor={colors.background} stopOpacity="0.6" />
              <Stop offset="1" stopColor={colors.background} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect width={55} height="100%" fill="url(#galleryFadeLeft)" />
        </Svg>
      </View>

      <View style={[styles.edgeFade, styles.edgeRight]} pointerEvents="none">
        <Svg width={55} height="100%">
          <Defs>
            <LinearGradient id="galleryFadeRight" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.background} stopOpacity="0" />
              <Stop offset="0.4" stopColor={colors.background} stopOpacity="0.6" />
              <Stop offset="1" stopColor={colors.background} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width={55} height="100%" fill="url(#galleryFadeRight)" />
        </Svg>
      </View>

      {/* ── 5. Bottom Floating Control Bar ───────────────────────────────── */}
      <View style={styles.controlBarWrap} pointerEvents="box-none">
        <View
          style={[
            styles.controlBar,
            {
              backgroundColor: isDark ? 'rgba(38,41,32,0.85)' : 'rgba(255,255,255,0.92)',
              borderColor: isDark ? 'rgba(236,229,211,0.12)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          {/* Photo Counter */}
          <View style={styles.counterWrap}>
            <Text style={[styles.counterText, { color: colors.text }]}>
              <Text style={{ fontWeight: '800', color: colors.primary }}>
                {String(activeIndex + 1).padStart(2, '0')}
              </Text>{' '}
              /{' '}
              {String(totalCount).padStart(2, '0')}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.controlDivider, { backgroundColor: colors.border }]} />

          {/* Full-screen Expand Button */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => openLightbox(activeIndex)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.controlBtnIcon, { color: colors.text }]}>⤢</Text>
            <Text style={[styles.controlBtnText, { color: colors.textSecondary }]}>View</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 6. Full-screen Lightbox Modal ───────────────────────────────── */}
      <Modal
        visible={lightboxVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxVisible(false)}
      >
        <Pressable
          style={styles.lightboxBackdrop}
          onPress={() => setLightboxVisible(false)}
        >
          <View style={styles.lightboxHeader}>
            <View>
              <Text style={styles.lightboxTitle} numberOfLines={1}>
                {normalizedImages[lightboxIndex]?.title || 'Explora Gallery'}
              </Text>
              {normalizedImages[lightboxIndex]?.location && (
                <Text style={styles.lightboxLocation} numberOfLines={1}>
                  📍 {normalizedImages[lightboxIndex].location}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.lightboxCloseBtn}
              onPress={() => setLightboxVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.lightboxCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Large Image */}
          <Pressable style={styles.lightboxImageWrap} onPress={e => e.stopPropagation()}>
            <Image
              source={normalizedImages[lightboxIndex]?.source}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </Pressable>

          {/* Bottom Footer with Navigation */}
          <View style={styles.lightboxFooter} pointerEvents="box-none">
            <TouchableOpacity
              style={[
                styles.lightboxNavBtn,
                lightboxIndex === 0 && styles.lightboxNavBtnDisabled,
              ]}
              disabled={lightboxIndex === 0}
              onPress={() => setLightboxIndex(prev => Math.max(0, prev - 1))}
            >
              <Text style={styles.lightboxNavIcon}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.lightboxCounter}>
              {lightboxIndex + 1} / {totalCount}
            </Text>

            <TouchableOpacity
              style={[
                styles.lightboxNavBtn,
                lightboxIndex === totalCount - 1 && styles.lightboxNavBtnDisabled,
              ]}
              disabled={lightboxIndex === totalCount - 1}
              onPress={() => setLightboxIndex(prev => Math.min(totalCount - 1, prev + 1))}
            >
              <Text style={styles.lightboxNavIcon}>›</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── GalleryItem Component (Blurry Faded Card) ────────────────────────────────

interface GalleryItemProps {
  item: NormalizedGalleryItem;
  index: number;
  scrollX: SharedValue<number>;
  itemWidth: number;
  itemHeight: number;
  screenWidth: number;
  isNear: boolean;
  isDark: boolean;
}

function GalleryItem({
  item,
  index,
  scrollX,
  itemWidth,
  itemHeight,
  screenWidth,
  isNear,
  isDark,
}: GalleryItemProps) {
  const animatedCardStyle = useAnimatedStyle(() => {
    const position = (index * itemWidth - scrollX.value) / itemWidth;

    // Scale down items further from center
    const scale = interpolate(
      position,
      [-3, -2, -1, 0, 1, 2, 3],
      [0.64, 0.74, 0.88, 1, 0.88, 0.74, 0.64],
      Extrapolation.CLAMP
    );

    // Smooth non-linear horizontal translation for elegant 3D deck look
    const factor = itemWidth * 0.68;
    const translateX = interpolate(
      position,
      [-4, -3, -2, -1, 0, 1, 2, 3, 4],
      [
        -factor * 2.5,
        -factor * 2.0,
        -factor * 1.5,
        -factor * 0.95,
        0,
        factor * 0.95,
        factor * 1.5,
        factor * 2.0,
        factor * 2.5,
      ],
      Extrapolation.CLAMP
    );

    // Faded opacity: Center is 1, sides fade smoothly to 0
    const opacity = interpolate(
      Math.abs(position),
      [0, 0.75, 1.3, 2.2, 3],
      [1, 0.92, 0.65, 0.22, 0],
      Extrapolation.CLAMP
    );

    // zIndex ordering so center sits on top
    const zIndex = interpolate(
      Math.abs(position),
      [0, 1, 2, 3],
      [100, 50, 20, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { scale }],
      opacity,
      zIndex: Math.round(zIndex),
    };
  });

  // Blurry overlay: Fades in as position deviates from 0!
  const blurOverlayStyle = useAnimatedStyle(() => {
    const position = (index * itemWidth - scrollX.value) / itemWidth;
    // 0 = crisp, sharp. >= 0.5 = turns blurry and faded!
    const blurOpacity = interpolate(
      Math.abs(position),
      [0, 0.35, 0.9, 1.8],
      [0, 0.35, 0.92, 1],
      Extrapolation.CLAMP
    );
    return { opacity: blurOpacity };
  });

  // Frosted soft fog tint overlay
  const tintOverlayStyle = useAnimatedStyle(() => {
    const position = (index * itemWidth - scrollX.value) / itemWidth;
    const tintOpacity = interpolate(
      Math.abs(position),
      [0, 0.6, 1.5],
      [0, 0.15, 0.4],
      Extrapolation.CLAMP
    );
    return { opacity: tintOpacity };
  });

  // Caption fade out when card leaves center
  const captionStyle = useAnimatedStyle(() => {
    const position = (index * itemWidth - scrollX.value) / itemWidth;
    const captionOpacity = interpolate(
      Math.abs(position),
      [0, 0.45, 0.9],
      [1, 0.3, 0],
      Extrapolation.CLAMP
    );
    return { opacity: captionOpacity };
  });

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        {
          width: itemWidth,
          height: itemHeight,
          left: (screenWidth - itemWidth) / 2,
        },
        animatedCardStyle,
      ]}
    >
      {/* 1. Base Sharp Image */}
      <Image source={item.source} style={styles.image} resizeMode="cover" />

      {/* 2. Blurry Faded Overlay (True optical blur dynamically fading in) */}
      {isNear && (
        <Animated.Image
          source={item.source}
          blurRadius={Platform.OS === 'ios' ? 24 : 14}
          style={[styles.image, StyleSheet.absoluteFill, blurOverlayStyle]}
          resizeMode="cover"
        />
      )}

      {/* 3. Soft Frosted Fog Overlay */}
      <Animated.View
        style={[
          styles.tintOverlay,
          { backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.35)' },
          tintOverlayStyle,
        ]}
      />

      {/* 4. Bottom Vignette for Caption Legibility */}
      <View style={styles.bottomVignette} pointerEvents="none" />

      {/* 5. Caption Pill (Fades in center, fades out on sides) */}
      {(item.title || item.location) && (
        <Animated.View style={[styles.captionWrap, captionStyle]}>
          {item.title && (
            <Text style={styles.captionTitle} numberOfLines={1}>
              {item.title}
            </Text>
          )}
          {item.location && (
            <Text style={styles.captionLocation} numberOfLines={1}>
              📍 {item.location}
            </Text>
          )}
        </Animated.View>
      )}

      {/* 6. Subtle Glass Border & Highlight */}
      <View
        style={[
          styles.glassBorder,
          { borderColor: isDark ? 'rgba(236,229,211,0.18)' : 'rgba(255,255,255,0.7)' },
        ]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },

  // Ambient Glow Backdrop
  ambientContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  ambientImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.35,
    transform: [{ scale: 1.25 }],
  },
  ambientOverlay: {
    ...StyleSheet.absoluteFill,
  },

  // Visual 3D Layer
  visualLayer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Each Card
  itemContainer: {
    position: 'absolute',
    top: 14,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: '#1E211A',
    ...Shadow.glow('#0F3F35'),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFill,
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    opacity: 0.65,
  },
  captionWrap: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(15,18,13,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  captionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  captionLocation: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  glassBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.xl,
    borderWidth: 1.2,
  },

  // Edge Faded Masks
  edgeFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 55,
    zIndex: 120,
  },
  edgeLeft: {
    left: 0,
  },
  edgeRight: {
    right: 0,
  },

  // Control Bar
  controlBarWrap: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 130,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 10,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  controlBtnIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  controlDivider: {
    width: 1,
    height: 14,
  },
  counterWrap: {
    paddingHorizontal: 4,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Lightbox Modal
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,12,8,0.96)',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  lightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lightboxTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  lightboxLocation: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  lightboxCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  lightboxImageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  lightboxNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxNavBtnDisabled: {
    opacity: 0.3,
  },
  lightboxNavIcon: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },
  lightboxCounter: {
    color: '#ECE5D3',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
