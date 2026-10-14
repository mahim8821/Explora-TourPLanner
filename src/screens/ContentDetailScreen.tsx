import React from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, Dimensions, Linking, Alert,
  StatusBar, Platform, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'ContentDetail'>;
const { width, height } = Dimensions.get('window');

export default function ContentDetailScreen({ route, navigation }: Props) {
  const { content } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const handleOpenMedia = async () => {
    if (!content.mediaUrl) return;
    try {
      const supported = await Linking.canOpenURL(content.mediaUrl);
      if (supported) {
        await Linking.openURL(content.mediaUrl);
      } else {
        Alert.alert('Unable to open URL', 'The link could not be opened on your device.');
      }
    } catch {
      Alert.alert('Error', 'Could not open the media link.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: content.title,
        message: `${content.title}\n\n${content.caption || content.description}\n\nExplore Bangladesh with Explora App!`,
        url: content.mediaUrl || content.coverImageUrl,
      });
    } catch (e: any) {
      console.log('Share error:', e);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('vlog') || type.toLowerCase().includes('video')) return '🎬';
    if (type.toLowerCase().includes('story')) return '📖';
    if (type.toLowerCase().includes('article')) return '📰';
    return '✨';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
      >
        {/* Cover Image & Hero */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: content.coverImageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          {/* Top Navigation Bar */}
          <View style={[styles.topBar, { top: Math.max(insets.top, 16) + 8 }]}>
            <TouchableOpacity
              style={styles.navIconBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Text style={styles.navIconText}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navIconBtn}
              onPress={handleShare}
              activeOpacity={0.8}
              accessibilityLabel="Share content"
              accessibilityRole="button"
            >
              <Text style={[styles.navIconText, { fontSize: 16 }]}>📤</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Bottom Info */}
          <View style={styles.heroMeta}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeIcon}>{getTypeIcon(content.type)}</Text>
              <Text style={styles.typeBadgeText}>{content.type}</Text>
            </View>
            <Text style={styles.heroTitle}>{content.title}</Text>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentWrap}>
          {content.caption ? (
            <View style={styles.quoteCard}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.captionText}>{content.caption}</Text>
            </View>
          ) : null}

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview & Story</Text>
            <Text style={styles.descriptionText}>{content.description}</Text>
          </View>

          {/* How to Reach / Road Guidelines */}
          {content.howToReach ? (
            <View style={styles.guidelinesCard}>
              <View style={styles.guidelinesHeader}>
                <Text style={{ fontSize: 20 }}>🧭</Text>
                <Text style={styles.guidelinesTitle}>How to Reach & Road Guide</Text>
              </View>
              <Text style={styles.guidelinesBody}>{content.howToReach}</Text>
            </View>
          ) : null}

          {/* Gallery Section */}
          {content.galleryUrls && content.galleryUrls.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Photo Gallery</Text>
                <Text style={styles.sectionMeta}>{content.galleryUrls.length} photos</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {content.galleryUrls.map((uri, i) => (
                  <View key={i} style={styles.galleryImageCard}>
                    <Image source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Media / Video CTA */}
          {content.mediaUrl ? (
            <TouchableOpacity
              style={styles.mediaBtn}
              onPress={handleOpenMedia}
              activeOpacity={0.85}
              accessibilityLabel="Watch Media or Video"
              accessibilityRole="button"
            >
              <Text style={styles.mediaBtnIcon}>▶</Text>
              <Text style={styles.mediaBtnText}>Watch Featured Video</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    heroWrapper: {
      width,
      height: height * 0.46,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    topBar: {
      position: 'absolute',
      left: Spacing.lg,
      right: Spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    navIconBtn: {
      width: 42,
      height: 42,
      borderRadius: Radius.full,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    navIconText: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 32,
      marginTop: -2,
    },
    heroMeta: {
      position: 'absolute',
      bottom: Spacing.xl,
      left: Spacing.lg,
      right: Spacing.lg,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingHorizontal: Spacing.md,
      paddingVertical: 5,
      borderRadius: Radius.full,
      marginBottom: Spacing.sm,
      gap: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    typeBadgeIcon: {
      fontSize: 12,
    },
    typeBadgeText: {
      color: '#FFFFFF',
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroTitle: {
      color: '#FFFFFF',
      fontSize: 26,
      fontWeight: Typography.weight.heavy,
      lineHeight: 32,
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    contentWrap: {
      backgroundColor: c.background,
      borderTopLeftRadius: Radius['2xl'],
      borderTopRightRadius: Radius['2xl'],
      marginTop: -24,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
    },
    quoteCard: {
      backgroundColor: c.surfaceElevated,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      borderLeftWidth: 4,
      borderLeftColor: c.primary,
      position: 'relative',
    },
    quoteMark: {
      position: 'absolute',
      top: -2,
      left: 10,
      fontSize: 32,
      color: c.primary,
      opacity: 0.2,
      fontWeight: '900',
    },
    captionText: {
      color: c.text,
      fontSize: Typography.size.base,
      fontStyle: 'italic',
      lineHeight: 24,
      paddingLeft: Spacing.xs,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    sectionTitle: {
      fontSize: Typography.size.lg,
      fontWeight: Typography.weight.bold,
      color: c.text,
      marginBottom: Spacing.xs,
    },
    sectionMeta: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
      fontWeight: Typography.weight.medium,
    },
    descriptionText: {
      fontSize: Typography.size.base,
      color: c.textSecondary,
      lineHeight: 25,
      marginTop: Spacing.xs,
    },
    guidelinesCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    guidelinesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    guidelinesTitle: {
      fontSize: Typography.size.base,
      fontWeight: Typography.weight.bold,
      color: c.text,
    },
    guidelinesBody: {
      fontSize: Typography.size.sm,
      color: c.textSecondary,
      lineHeight: 22,
    },
    galleryScroll: {
      gap: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    galleryImageCard: {
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    galleryImage: {
      width: 160,
      height: 120,
    },
    mediaBtn: {
      backgroundColor: c.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.base,
      borderRadius: Radius.xl,
      gap: Spacing.sm,
      marginTop: Spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    mediaBtnIcon: {
      color: c.textInverse,
      fontSize: 16,
    },
    mediaBtnText: {
      color: c.textInverse,
      fontSize: Typography.size.base,
      fontWeight: Typography.weight.bold,
    },
  });
}
