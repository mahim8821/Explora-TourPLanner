import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { Radius, Shadow } from '../theme/spacing';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.65;
const ITEM_HEIGHT = ITEM_WIDTH * 1.3;
const SPACING = (width - ITEM_WIDTH) / 2;

interface GalleryCarouselProps {
  images: any[];
}

export default function GalleryCarousel({ images }: GalleryCarouselProps) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={styles.container}>
      {/* Visual Layer */}
      <View style={styles.visualLayer} pointerEvents="none">
        {images.map((item, index) => {
          return (
            <GalleryItem
              key={index}
              item={item}
              index={index}
              scrollX={scrollX}
            />
          );
        })}
      </View>

      {/* Invisible Scroll Layer for Gestures */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: SPACING,
          width: ITEM_WIDTH * images.length + SPACING * 2,
        }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

interface GalleryItemProps {
  item: any;
  index: number;
  scrollX: SharedValue<number>;
}

function GalleryItem({ item, index, scrollX }: GalleryItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const position = (index * ITEM_WIDTH - scrollX.value) / ITEM_WIDTH;

    // Scale down items that are further away
    const scale = interpolate(
      position,
      [-3, -2, -1, 0, 1, 2, 3],
      [0.6, 0.7, 0.85, 1, 0.85, 0.7, 0.6],
      Extrapolation.CLAMP
    );

    // Calculate translation with non-linear spacing for a bunched-up 3D effect
    const translateFactor = ITEM_WIDTH * 0.65;
    const translateX = interpolate(
      position,
      [-4, -3, -2, -1, 0, 1, 2, 3, 4],
      [
        -translateFactor * 2.4,
        -translateFactor * 2.1,
        -translateFactor * 1.6,
        -translateFactor,
        0,
        translateFactor,
        translateFactor * 1.6,
        translateFactor * 2.1,
        translateFactor * 2.4,
      ],
      Extrapolation.CLAMP
    );

    // zIndex doesn't always animate smoothly, but we can compute it
    const zIndex = interpolate(
      Math.abs(position),
      [0, 1, 2, 3],
      [100, 50, 25, 0],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      Math.abs(position),
      [0, 1, 2, 3],
      [1, 0.9, 0.5, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX },
        { scale }
      ],
      zIndex: Math.round(zIndex),
      elevation: Math.round(zIndex), // For Android
      opacity,
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const position = (index * ITEM_WIDTH - scrollX.value) / ITEM_WIDTH;
    const opacity = interpolate(
      Math.abs(position),
      [0, 1, 2],
      [0, 0.4, 0.7],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <Animated.View style={[styles.itemContainer, animatedStyle]}>
      <Animated.Image source={typeof item === 'string' ? { uri: item } : item} style={styles.image} />
      <Animated.View style={[styles.overlay, overlayStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT + 60,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  visualLayer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    position: 'absolute',
    top: 30, // (containerHeight (ITEM_HEIGHT + 60) - ITEM_HEIGHT) / 2
    left: (width - ITEM_WIDTH) / 2,
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadow.glow(Colors.primary),
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
});
