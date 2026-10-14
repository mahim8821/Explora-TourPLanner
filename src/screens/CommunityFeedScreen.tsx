import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Modal,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Spacing, Radius } from '../theme/spacing';
import { useAppSelector } from '../store';
import {
  CommunityPost,
  subscribeToCommunityPosts,
  toggleLikePost,
  deleteCommunityPost,
  INITIAL_SEED_POSTS,
} from '../firebase/communityService';
import CommunityPostCard from '../components/CommunityPostCard';
import CreatePostModal from '../components/CreatePostModal';
import CommentsModal from '../components/CommentsModal';

// Filter tags
const FILTER_TAGS = [
  { id: 'All', label: 'All' },
  { id: 'Trending', label: 'Trending' },
  { id: 'Waterfall', label: 'Waterfalls' },
  { id: 'Cave', label: 'Caves' },
  { id: 'Hills', label: 'Hills' },
  { id: 'Lake', label: 'Lakes & Haor' },
  { id: 'Forest', label: 'Forests' },
];

export default function CommunityFeedScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAppSelector(s => s.auth);

  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_SEED_POSTS);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [activeCommentsPost, setActiveCommentsPost] = useState<CommunityPost | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Subscribe to real-time posts from Firestore
  useEffect(() => {
    const unsub = subscribeToCommunityPosts(newPosts => {
      setPosts(newPosts);
      setLoading(false);
    });
    return unsub;
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (selectedUserFilter && post.userId !== selectedUserFilter) {
        return false;
      }
      if (selectedTag === 'Trending') {
        return post.likes.length >= 3 || post.rating >= 4.9;
      }
      if (selectedTag !== 'All') {
        return post.category === selectedTag;
      }
      return true;
    });
  }, [posts, selectedTag, selectedUserFilter]);

  // Extract distinct explorers for the story ring row
  const explorers = useMemo(() => {
    const seen = new Set<string>();
    const list: { userId: string; userName: string; avatar: string }[] = [];

    posts.forEach(p => {
      if (!seen.has(p.userId)) {
        seen.add(p.userId);
        list.push({
          userId: p.userId,
          userName: p.userName,
          avatar:
            p.userAvatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              p.userName
            )}&background=0F3F35&color=fff&size=80`,
        });
      }
    });

    return list;
  }, [posts]);

  // Like Toggle
  const handleLikePress = async (post: CommunityPost) => {
    const currentUserId = user?.uid || 'guest_user';
    const isLiked = post.likes.includes(currentUserId);

    // Optimistic UI update
    setPosts(prev =>
      prev.map(p => {
        if (p.id === post.id) {
          const updatedLikes = isLiked
            ? p.likes.filter(id => id !== currentUserId)
            : [...p.likes, currentUserId];
          return { ...p, likes: updatedLikes };
        }
        return p;
      })
    );

    try {
      await toggleLikePost(post.id, currentUserId, isLiked);
    } catch (e) {
      console.warn('Like toggle failed:', e);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await deleteCommunityPost(postId);
    } catch (e) {
      console.warn('Failed to delete post:', e);
    }
  };

  const currentUserId = user?.uid || 'guest_user';

  // ── Header Component for FlatList ──────────────────────────────────────────
  const ListHeader = (
    <View style={styles.listHeaderWrap}>
      {/* ── 1. Top Bar with Title and Add (+) Button ─────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.titleWrap}>
          <Text style={[styles.appTitle, { color: colors.text }]}>Explora</Text>
          <View style={[styles.brandDot, { backgroundColor: '#FF8A00' }]} />
          <View style={[styles.communityBadge, { backgroundColor: isDark ? 'rgba(255, 138, 0, 0.15)' : 'rgba(255, 138, 0, 0.12)' }]}>
            <Text style={styles.communityBadgeText}>COMMUNITY</Text>
          </View>
        </View>

        {/* Circular Add (+) Button */}
        <TouchableOpacity
          id="community-header-add-btn"
          accessibilityRole="button"
          accessibilityLabel="Add Post"
          accessibilityHint="Open form to share a hidden travel spot"
          style={[
            styles.addCircleBtn,
            {
              backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.75}
        >
          <Text style={[styles.addCircleIcon, { color: '#FF8A00' }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. Stories / Active Explorers Row (Exact Ring Style from Ref) ── */}
      <View style={styles.storiesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesScroll}
        >
          {/* Current User Story ("Add Gem") */}
          <TouchableOpacity
            style={styles.storyItem}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Share your story or hidden spot"
          >
            <View style={[styles.storyAvatarRing, { borderColor: '#FF8A00' }]}>
              <Image
                source={{
                  uri:
                    user?.photoURL ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
                }}
                style={styles.storyAvatar}
              />
              {/* Plus Badge */}
              <View style={[styles.storyPlusBadge, { backgroundColor: '#FF8A00' }]}>
                <Text style={styles.storyPlusText}>+</Text>
              </View>
            </View>
            <Text style={[styles.storyUsername, { color: colors.textMuted }]} numberOfLines={1}>
              Your Story
            </Text>
          </TouchableOpacity>

          {/* Other Active Explorers */}
          {explorers.map(exp => {
            const isSelected = selectedUserFilter === exp.userId;
            return (
              <TouchableOpacity
                key={exp.userId}
                style={styles.storyItem}
                onPress={() => {
                  setSelectedUserFilter(prev => (prev === exp.userId ? null : exp.userId));
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.storyAvatarRing,
                    {
                      borderColor: isSelected ? '#FF8A00' : isDark ? '#3A4030' : '#E5E7EB',
                      borderWidth: isSelected ? 2.5 : 2,
                    },
                  ]}
                >
                  <Image source={{ uri: exp.avatar }} style={styles.storyAvatar} />
                </View>
                <Text
                  style={[
                    styles.storyUsername,
                    { color: isSelected ? colors.primary : colors.textMuted },
                    isSelected && { fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {exp.userName.toLowerCase().split(' ')[0] || 'explorer'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 3. Minimal Filter Chips ─────────────────────────────────────── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TAGS.map(item => {
            const active = selectedTag === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active
                      ? isDark
                        ? colors.surfaceElevated
                        : colors.primary
                      : 'transparent',
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedTag(item.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: active ? (isDark ? colors.text : '#FFF') : colors.textMuted },
                    active && { fontWeight: '800' },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.feedContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#FF8A00" />
              <Text style={[styles.emptySubtitle, { color: colors.textMuted, marginTop: 12 }]}>
                Discovering community stories...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🧭</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No hidden places here</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {selectedUserFilter
                  ? "This explorer hasn't shared posts in this category yet."
                  : 'Be the first to upload and share an unmapped spot!'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                {(selectedTag !== 'All' || selectedUserFilter) && (
                  <TouchableOpacity
                    style={[styles.emptySecondaryBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      setSelectedTag('All');
                      setSelectedUserFilter(null);
                    }}
                  >
                    <Text style={[styles.emptySecondaryBtnText, { color: colors.text }]}>Reset Filters</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: '#FF8A00' }]}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <Text style={styles.emptyBtnText}>+ Share Hidden Place</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }
        renderItem={({ item }) => (
          <CommunityPostCard
            post={item}
            currentUserId={currentUserId}
            onLikePress={handleLikePress}
            onCommentPress={post => setActiveCommentsPost(post)}
            onDeletePress={handleDeletePost}
            onImagePress={url => setPreviewImageUrl(url)}
          />
        )}
      />

      {/* ── Floating Action Button: Add Post (Only on Community Feed) ── */}
      <TouchableOpacity
        id="community-feed-add-post-fab"
        accessibilityRole="button"
        accessibilityLabel="Share Hidden Spot"
        accessibilityHint="Opens form to upload photos and create a community post"
        onPress={() => setCreateModalVisible(true)}
        style={[
          styles.floatingAddPostBtn,
          {
            backgroundColor: '#FF9F0A',
            bottom: Math.max(insets.bottom, 16) + 72,
          },
        ]}
        activeOpacity={0.88}
      >
        <View style={styles.fabIconWrap}>
          <View style={styles.fabBarH} />
          <View style={styles.fabBarV} />
        </View>
        <Text style={styles.fabLabel}>Share Gem</Text>
      </TouchableOpacity>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <CreatePostModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />

      <CommentsModal
        visible={Boolean(activeCommentsPost)}
        post={activeCommentsPost ? (posts.find(p => p.id === activeCommentsPost.id) || activeCommentsPost) : null}
        onClose={() => setActiveCommentsPost(null)}
        onCommentAdded={newComment => {
          if (activeCommentsPost) {
            setPosts(prev =>
              prev.map(p => {
                if (p.id === activeCommentsPost.id) {
                  const existing = p.comments || [];
                  if (existing.some(c => c.id === newComment.id)) {
                    return p;
                  }
                  return {
                    ...p,
                    commentsCount: (p.commentsCount || 0) + 1,
                    comments: [...existing, newComment],
                  };
                }
                return p;
              })
            );
          }
        }}
      />

      {/* Lightbox */}
      {previewImageUrl && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewImageUrl(null)}>
          <Pressable style={styles.lightboxBackdrop} onPress={() => setPreviewImageUrl(null)}>
            <TouchableOpacity
              style={styles.lightboxCloseBtn}
              onPress={() => setPreviewImageUrl(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.lightboxCloseText}>✕</Text>
            </TouchableOpacity>
            <Image source={{ uri: previewImageUrl }} style={styles.lightboxImage} resizeMode="contain" />
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  listHeaderWrap: {
    marginBottom: Spacing.md,
  },

  // 1. Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  brandDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  addCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircleIcon: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 22,
  },

  // 2. Stories / Explorers Row
  storiesSection: {
    paddingVertical: Spacing.sm,
  },
  storiesScroll: {
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 62,
  },
  storyAvatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    padding: 2.5,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  storyPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: 17,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.5,
    borderColor: '#1A1D16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyPlusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  storyUsername: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },

  // 3. Filter Pills
  filterBar: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Feed
  feedContent: {
    paddingTop: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptySecondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  communityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    marginLeft: 4,
  },
  communityBadgeText: {
    color: '#FF8A00',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // Floating Action Button
  floatingAddPostBtn: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#FF9F0A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  fabIconWrap: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBarH: {
    width: 14,
    height: 2.2,
    borderRadius: 1.1,
    backgroundColor: '#FFFFFF',
  },
  fabBarV: {
    position: 'absolute',
    width: 2.2,
    height: 14,
    borderRadius: 1.1,
    backgroundColor: '#FFFFFF',
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Lightbox
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  lightboxCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  lightboxImage: {
    width: '94%',
    height: '80%',
  },
});
