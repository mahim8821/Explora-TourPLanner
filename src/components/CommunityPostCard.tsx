import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { CommunityPost } from '../firebase/communityService';
import { submitModerationReport, ReportReason } from '../firebase/moderationService';
import { useTheme } from '../theme/ThemeContext';
import { Radius, Spacing } from '../theme/spacing';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleBookmark } from '../store/slices/bookmarksSlice';
import { Destination } from '../api/types';

// ── Vector Icons matching clean & minimal reference ──────────────────────────

function IconComment({ size = 20, color = '#1E211A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 14.5a3 3 0 0 1-3 3H7.5L3.5 21V5.5a3 3 0 0 1 3-3h11.5a3 3 0 0 1 3 3v9z"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconBookmark({
  size = 20,
  color = '#1E211A',
  filled = false,
}: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.5h12a2 2 0 0 1 2 2v15.5l-8-5.2-8 5.2V5.5a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}

function IconHeart({
  size = 21,
  color = '#1E211A',
  filled = false,
}: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={filled ? '#FF4757' : color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? '#FF4757' : 'none'}
      />
    </Svg>
  );
}

function StatHeart({ size = 18, color = '#8E95A5' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </Svg>
  );
}

function StatEye({ size = 19, color = '#8E95A5' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-7.5 11-7.5 11 7.5 11 7.5-4 7.5-11 7.5-11-7.5-11-7.5z"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3.2} fill={color} />
    </Svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CommunityPostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  onLikePress: (post: CommunityPost) => void;
  onCommentPress: (post: CommunityPost) => void;
  onDeletePress?: (postId: string) => void;
  onImagePress?: (imageUrl: string) => void;
}

export default function CommunityPostCard({
  post,
  currentUserId,
  onLikePress,
  onCommentPress,
  onDeletePress,
  onImagePress,
}: CommunityPostCardProps) {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const bookmarks = useAppSelector(s => s.bookmarks.items);
  const currentUser = useAppSelector(s => s.auth.user);
  const [activeGuide, setActiveGuide] = useState<'tips' | 'route' | null>(null);

  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const isSaved = bookmarks.some(b => b.id === post.id);
  const likeCount = post.likes.length;

  // Authentic view count format (e.g. 19.1k, 4.3k, 850)
  const viewsText = useMemo(() => {
    const hash = post.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const views = Math.max(120, post.likes.length * 158 + (hash % 1600) + 420);
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return String(views);
  }, [post.id, post.likes.length]);

  // Format relative time
  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this unseen hidden place "${post.title}" in ${post.location} on Explora! Rating: ${post.rating}★`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const submitReport = async (reason: ReportReason, details: string) => {
    if (!currentUserId) {
      Alert.alert('Sign In Required', 'Please log in to report community posts.');
      return;
    }
    try {
      await submitModerationReport({
        targetType: 'post',
        targetId: post.id,
        targetTitle: post.title,
        targetAuthorName: post.userName,
        targetSnippet: post.experience || post.review || post.location,
        reporterId: currentUserId,
        reporterName: currentUser?.displayName || 'Community Member',
        reason,
        details,
      });
      Alert.alert(
        'Report Submitted',
        'Thank you for reporting. Our moderation team has received the alert and will review it.'
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err?.message || 'Unable to submit report.');
    }
  };

  const handleReportPost = () => {
    Alert.alert(
      'Report Post',
      'Select a reason for reporting this post to moderators:',
      [
        {
          text: 'Spam or Advertising',
          onPress: () => submitReport('spam', 'Spam / promotional content'),
        },
        {
          text: 'Inappropriate or Offensive',
          onPress: () => submitReport('inappropriate', 'Inappropriate or offensive imagery/text'),
        },
        {
          text: 'Misleading Info or Scam',
          onPress: () => submitReport('misleading', 'Misleading location, price, or scam info'),
        },
        {
          text: 'Harassment',
          onPress: () => submitReport('harassment', 'Hate speech or personal harassment'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMorePress = () => {
    const isOwner = currentUserId === post.userId;
    Alert.alert(
      post.title,
      `${post.location} • Posted by ${post.userName}`,
      [
        { text: 'Share Place ↗', onPress: handleShare },
        ...(!isOwner
          ? [
            {
              text: 'Report Post 🚩',
              style: 'destructive' as const,
              onPress: handleReportPost,
            },
          ]
          : []),
        ...(isOwner && onDeletePress
          ? [
            {
              text: 'Delete Discovery',
              style: 'destructive' as const,
              onPress: () => onDeletePress(post.id),
            },
          ]
          : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  // Toggle bookmark in global Redux store
  const handleToggleBookmark = () => {
    const destinationItem: Destination = {
      id: post.id,
      name: post.title,
      country: 'Bangladesh',
      region: post.district || post.location,
      description: post.experience || post.review || '',
      shortDescription: post.location,
      rating: post.rating || 5.0,
      reviewCount: post.commentsCount || 1,
      price: 0,
      currency: 'BDT',
      imageUrl: post.imageUrl || '',
      images: post.imageUrl ? [post.imageUrl] : [],
      category: 'adventure',
      tags: [post.category, post.district].filter(Boolean) as string[],
      coordinates: { latitude: 23.685, longitude: 90.3563 },
      weather: { temperature: 28, condition: 'Clear', icon: '☀️' },
      isTrending: post.likes.length >= 3,
      isFeatured: false,
      duration: '1-2 Days',
      bestTimeToVisit: 'Winter / Autumn',
      highlights: [post.location, post.category || 'Discovery'],
    };
    dispatch(toggleBookmark(destinationItem));
  };

  return (
    <View style={styles.cardContainer}>
      {/* ── 1. Author Row ──────────────────────────────────────────────── */}
      <View style={styles.authorRow}>
        <View style={styles.authorLeft}>
          <Image
            source={{
              uri:
                post.userAvatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  post.userName || 'Explorer'
                )}&background=0F3F35&color=fff&size=80`,
            }}
            style={styles.avatar}
          />
          <View style={styles.authorTextWrap}>
            <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
              {post.userName}
            </Text>
            <Text style={[styles.metaTime, { color: colors.textMuted }]}>
              {getTimeAgo(post.createdAt)}
              {post.district ? ` • ${post.district}` : ''}
            </Text>
          </View>
        </View>

        {/* Triple Dot Menu */}
        <TouchableOpacity
          onPress={handleMorePress}
          style={styles.moreBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.moreDots, { color: colors.textMuted }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. Photo Card with 3 Floating Minimal Action Buttons ───────── */}
      {post.imageUrl ? (
        <View style={styles.photoContainer}>
          <TouchableOpacity
            activeOpacity={0.96}
            onPress={() => onImagePress?.(post.imageUrl)}
            style={styles.imageWrap}
          >
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />

            {/* Subtle bottom gradient to make the location text and buttons pop */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id={`grad-${post.id}`} x1="0" y1="0.55" x2="0" y2="1">
                    <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                    <Stop offset="1" stopColor="#000000" stopOpacity="0.45" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill={`url(#grad-${post.id})`} />
              </Svg>
            </View>

            {/* Bottom-left subtle location tag inside photo */}
            <View style={styles.photoBottomLeftBadge} pointerEvents="none">
              <Text style={styles.photoBottomLeftText} numberOfLines={1}>
                {post.location}
              </Text>
            </View>

            {/* 3 Circular Floating Buttons: [Comment] [Save] [React] */}
            <View style={styles.floatingActionsRow}>
              {/* Button 1: Comment */}
              <TouchableOpacity
                style={styles.circleActionBtn}
                onPress={() => onCommentPress(post)}
                activeOpacity={0.78}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <IconComment size={20} color="#1E211A" />
              </TouchableOpacity>

              {/* Button 2: Save / Bookmark */}
              <TouchableOpacity
                style={styles.circleActionBtn}
                onPress={handleToggleBookmark}
                activeOpacity={0.78}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <IconBookmark
                  size={20}
                  color={isSaved ? '#0F3F35' : '#1E211A'}
                  filled={isSaved}
                />
              </TouchableOpacity>

              {/* Button 3: React / Heart */}
              <TouchableOpacity
                style={styles.circleActionBtn}
                onPress={() => onLikePress(post)}
                activeOpacity={0.78}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <IconHeart
                  size={21}
                  color={isLiked ? '#FF4757' : '#1E211A'}
                  filled={isLiked}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── 3. Minimal Stats Row (❤️ 33 • 👁 19.1k • ★ 4.9) ─────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statsLeft}>
          {/* Reacts Count */}
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => onLikePress(post)}
            activeOpacity={0.7}
          >
            <StatHeart
              size={18}
              color={isLiked ? '#FF4757' : isDark ? '#8E95A5' : '#717886'}
            />
            <Text style={[styles.statValue, { color: isDark ? '#ECE5D3' : '#111827' }]}>
              {likeCount}
            </Text>
          </TouchableOpacity>

          {/* Views Count */}
          <View style={styles.statItem}>
            <StatEye size={19} color={isDark ? '#8E95A5' : '#717886'} />
            <Text style={[styles.statValue, { color: isDark ? '#ECE5D3' : '#111827' }]}>
              {viewsText}
            </Text>
          </View>
        </View>

        {/* Rating Pill on Right */}
        <View style={[styles.ratingPill, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={[styles.ratingVal, { color: colors.primary }]}>
            {post.rating ? post.rating.toFixed(1) : '5.0'}
          </Text>
        </View>
      </View>

      {/* ── 4. Place Title & Clean Inline Caption ──────────────────────── */}
      <View style={styles.detailsBlock}>
        <Text style={[styles.placeTitle, { color: colors.text }]}>{post.title}</Text>

        {/* Inline Username + Experience Description */}
        <Text style={[styles.captionLine, { color: colors.textSecondary }]}>
          <Text style={[styles.captionAuthor, { color: colors.text }]}>
            {post.userName.toLowerCase().replace(/\s+/g, '_')}{' '}
          </Text>
          {post.experience}
        </Text>

        {/* ── Separate Clean Buttons for Tips & Route ─────────────────── */}
        {(post.review || post.howToReach) ? (
          <View style={styles.guideButtonsRow}>
            {post.review ? (
              <TouchableOpacity
                style={[
                  styles.guidePillBtn,
                  activeGuide === 'tips'
                    ? {
                      backgroundColor: isDark ? '#0F3F35' : colors.primary,
                      borderColor: isDark ? '#0F3F35' : colors.primary,
                    }
                    : {
                      backgroundColor: isDark ? 'rgba(236,229,211,0.06)' : '#F3F4F6',
                      borderColor: isDark ? 'rgba(236,229,211,0.1)' : '#E5E7EB',
                    },
                ]}
                onPress={() => setActiveGuide(prev => (prev === 'tips' ? null : 'tips'))}
                activeOpacity={0.75}
              >

                <Text
                  style={[
                    styles.guidePillText,
                    {
                      color:
                        activeGuide === 'tips'
                          ? '#FFFFFF'
                          : isDark
                            ? colors.text
                            : '#374151',
                    },
                  ]}
                >
                  Tips
                </Text>
                <Text
                  style={[
                    styles.guidePillArrow,
                    {
                      color:
                        activeGuide === 'tips'
                          ? '#FFFFFF'
                          : colors.textMuted,
                    },
                  ]}
                >
                  {activeGuide === 'tips' ? '▴' : '▾'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {post.howToReach ? (
              <TouchableOpacity
                style={[
                  styles.guidePillBtn,
                  activeGuide === 'route'
                    ? {
                      backgroundColor: isDark ? '#0F3F35' : colors.primary,
                      borderColor: isDark ? '#0F3F35' : colors.primary,
                    }
                    : {
                      backgroundColor: isDark ? 'rgba(236,229,211,0.06)' : '#F3F4F6',
                      borderColor: isDark ? 'rgba(236,229,211,0.1)' : '#E5E7EB',
                    },
                ]}
                onPress={() => setActiveGuide(prev => (prev === 'route' ? null : 'route'))}
                activeOpacity={0.75}
              >

                <Text
                  style={[
                    styles.guidePillText,
                    {
                      color:
                        activeGuide === 'route'
                          ? '#FFFFFF'
                          : isDark
                            ? colors.text
                            : '#374151',
                    },
                  ]}
                >
                  Route
                </Text>
                <Text
                  style={[
                    styles.guidePillArrow,
                    {
                      color:
                        activeGuide === 'route'
                          ? '#FFFFFF'
                          : colors.textMuted,
                    },
                  ]}
                >
                  {activeGuide === 'route' ? '▴' : '▾'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Expanded Tips Box */}
        {activeGuide === 'tips' && post.review ? (
          <View
            style={[
              styles.guideContentBox,
              {
                backgroundColor: isDark ? 'rgba(38,41,32,0.7)' : '#F9FAFB',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.guideBoxHeader}>
              <View style={styles.guideBoxTitleWrap}>
                <Text style={styles.guideBoxBadgeIcon}>💡</Text>
                <Text style={[styles.guideBoxTitle, { color: colors.text }]}>Traveler Tips</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveGuide(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.guideCloseBtn}
              >
                <Text style={[styles.guideCloseText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.guideBodyText, { color: colors.textSecondary }]}>
              {post.review}
            </Text>
          </View>
        ) : null}

        {/* Expanded Route Box */}
        {activeGuide === 'route' && post.howToReach ? (
          <View
            style={[
              styles.guideContentBox,
              {
                backgroundColor: isDark ? 'rgba(38,41,32,0.7)' : '#F9FAFB',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.guideBoxHeader}>
              <View style={styles.guideBoxTitleWrap}>
                <Text style={styles.guideBoxBadgeIcon}>🧭</Text>
                <Text style={[styles.guideBoxTitle, { color: colors.text }]}>How to Reach</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveGuide(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.guideCloseBtn}
              >
                <Text style={[styles.guideCloseText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.guideBodyText, { color: colors.textSecondary }]}>
              {post.howToReach}
            </Text>
          </View>
        ) : null}

        {/* Comments Link Button */}
        <TouchableOpacity
          onPress={() => onCommentPress(post)}
          style={styles.viewCommentsBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewCommentsText, { color: colors.textMuted }]}>
            {post.commentsCount > 0
              ? `View all ${post.commentsCount} comments`
              : 'Add a comment or travel tip...'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },

  // Author Row
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#333',
  },
  authorTextWrap: {
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metaTime: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  moreBtn: {
    padding: 6,
  },
  moreDots: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Photo
  photoContainer: {
    width: '100%',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 270,
    backgroundColor: '#1E211A',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  photoBottomLeftBadge: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    maxWidth: '50%',
  },
  photoBottomLeftText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 3 Floating Circular Action Buttons (Comment, Save, Heart)
  floatingActionsRow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  circleActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },

  // Stats Row (❤️ 33 • 👁 19.1k)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  ratingStar: {
    fontSize: 11,
    color: '#FFB800',
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Details
  detailsBlock: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  placeTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  captionLine: {
    fontSize: 13,
    lineHeight: 18,
  },
  captionAuthor: {
    fontWeight: '800',
  },

  // Separate Guide Buttons (Tips & Route)
  guideButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  guidePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 16,
    borderWidth: 1,
  },
  guidePillIcon: {
    fontSize: 12,
  },
  guidePillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  guidePillArrow: {
    fontSize: 10,
    marginLeft: 1,
  },
  guideContentBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  guideBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  guideBoxTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guideBoxBadgeIcon: {
    fontSize: 13,
  },
  guideBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  guideCloseBtn: {
    padding: 4,
  },
  guideCloseText: {
    fontSize: 13,
    fontWeight: '600',
  },
  guideBodyText: {
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Comments
  viewCommentsBtn: {
    marginTop: 8,
    paddingVertical: 2,
  },
  viewCommentsText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
