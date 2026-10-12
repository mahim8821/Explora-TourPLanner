import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CommunityComment, CommunityPost, addCommentToPost } from '../firebase/communityService';
import { useTheme } from '../theme/ThemeContext';
import { Spacing, Radius } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { useAppSelector } from '../store';

interface CommentsModalProps {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onCommentAdded?: (newComment: CommunityComment) => void;
}

export default function CommentsModal({
  visible,
  post,
  onClose,
  onCommentAdded,
}: CommentsModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAppSelector(s => s.auth);

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Local list of comments for instant responsive updates
  const commentsList: CommunityComment[] = post?.comments || [];

  const handleSendComment = async () => {
    if (!commentText.trim() || !post) return;

    setSubmitting(true);
    const textToSend = commentText.trim();
    setCommentText('');

    try {
      const authorName = user?.displayName || 'Explorer';
      const authorAvatar = user?.photoURL || undefined;
      const authorId = user?.uid || `guest_${Date.now()}`;

      const created = await addCommentToPost(post.id, {
        userId: authorId,
        userName: authorName,
        userAvatar: authorAvatar,
        text: textToSend,
      });

      onCommentAdded?.(created);
    } catch (e) {
      console.warn('Failed to add comment:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(mins / (1000 * 3600));
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.dragHandle} />
          <View style={styles.headerTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Comments & Tips</Text>
              <Text style={[styles.postTitleSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {post.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments List */}
        <FlatList
          data={commentsList}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No comments yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                Be the first explorer to ask a question or share advice!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <Image
                source={{
                  uri:
                    item.userAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      item.userName
                    )}&background=0F3F35&color=fff&size=60`,
                }}
                style={styles.commentAvatar}
              />
              <View
                style={[
                  styles.commentBubble,
                  {
                    backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.commentMetaRow}>
                  <Text style={[styles.commentAuthor, { color: colors.text }]}>{item.userName}</Text>
                  <Text style={[styles.commentTime, { color: colors.textMuted }]}>
                    {getTimeAgo(item.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.commentBody, { color: colors.text }]}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: isDark ? colors.surface : colors.white,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.inputField,
              {
                backgroundColor: isDark ? colors.background : '#F3F4F6',
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Ask a question or share a tip..."
            placeholderTextColor="#888"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: commentText.trim() ? colors.primary : colors.surfaceElevated },
            ]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text
                style={[
                  styles.sendBtnText,
                  { color: commentText.trim() ? '#FFF' : colors.textMuted },
                ]}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,150,150,0.4)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  postTitleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '700',
  },

  listContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 240,
  },

  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginTop: 2,
  },
  commentBubble: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 10,
  },
  commentBody: {
    fontSize: 13,
    lineHeight: 18,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  inputField: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
