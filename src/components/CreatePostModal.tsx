import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { Spacing, Radius } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { uploadTripImage } from '../firebase/storageService';
import { addCommunityPost, CommunityPost } from '../firebase/communityService';
import { useAppSelector } from '../store';
import { auth } from '../firebase/config';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const DISTRICT_CHIPS = [
  'Bandarban',
  'Sylhet',
  'Rangamati',
  'Cox\'s Bazar',
  'Khagrachhari',
  'Chittagong',
  'Sunamganj',
  'Barishal',
  'Sundarbans',
  'Other',
];

const CATEGORIES: ('Waterfall' | 'Cave' | 'Hills' | 'Forest' | 'Lake' | 'Other')[] = [
  'Waterfall',
  'Cave',
  'Hills',
  'Forest',
  'Lake',
  'Other',
];

export default function CreatePostModal({
  visible,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAppSelector(s => s.auth);

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('Bandarban');
  const [category, setCategory] = useState<'Waterfall' | 'Cave' | 'Hills' | 'Forest' | 'Lake' | 'Other'>('Waterfall');
  const [rating, setRating] = useState(5);
  const [experience, setExperience] = useState('');
  const [review, setReview] = useState('');
  const [howToReach, setHowToReach] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // Pick Image from Camera Roll
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required to share photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDistrict('Bandarban');
    setCategory('Waterfall');
    setRating(5);
    setExperience('');
    setReview('');
    setHowToReach('');
    setLocalImageUri(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Place Name', 'Please enter the name of the hidden place.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Missing Location', 'Please provide where this place is located.');
      return;
    }
    if (!localImageUri) {
      Alert.alert('Photo Required', 'Please pick a photo of the hidden place.');
      return;
    }
    if (!experience.trim()) {
      Alert.alert('Share Experience', 'Please write a brief story or experience of this discovery.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload photo with robust multi-service hosting
      const uploadedImageUrl = await uploadTripImage(localImageUri);

      // 2. Prepare author details
      const authorName = user?.displayName || auth.currentUser?.displayName || 'Explorer';
      const authorAvatar = user?.photoURL || auth.currentUser?.photoURL || undefined;
      const authorId = user?.uid || auth.currentUser?.uid || `guest_${Date.now()}`;

      // 3. Save post to Firestore (clean payload)
      const postPayload: any = {
        userId: authorId,
        userName: authorName,
        title: title.trim(),
        location: location.trim(),
        district,
        category,
        imageUrl: uploadedImageUrl,
        experience: experience.trim(),
        review: review.trim(),
        rating,
      };

      if (authorAvatar) {
        postPayload.userAvatar = authorAvatar;
      }
      if (howToReach.trim()) {
        postPayload.howToReach = howToReach.trim();
      }

      await addCommunityPost(postPayload);

      Alert.alert('🎉 Discovery Shared!', 'Your hidden place discovery is now live in the community feed.');
      resetForm();
      onClose();
      onPostCreated?.();
    } catch (e: any) {
      Alert.alert('Upload Error', e.message || 'Failed to publish post. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Share Hidden Gem</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.shareBtn}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.shareBtnText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContent} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Photo Picker Box */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Place Photo *</Text>
          <TouchableOpacity
            style={[
              styles.imagePickerBox,
              {
                borderColor: localImageUri ? colors.primary : colors.border,
                backgroundColor: isDark ? colors.surface : '#F8F9FA',
              },
            ]}
            onPress={handlePickImage}
            activeOpacity={0.8}
            disabled={loading}
          >
            {localImageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: localImageUri }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.changeBadge}>
                  <Text style={styles.changeBadgeText}>Change Photo ↺</Text>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.cameraIcon}>📸</Text>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>Upload Photo of Unseen Place</Text>
                <Text style={[styles.pickerSubtitle, { color: colors.textMuted }]}>
                  High-res shots of hidden waterfalls, caves, trails
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Place Name / Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Name of Hidden Place *</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. Debotakhum Cave River or Jadipay Trail"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Location Details */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Location & Area *</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. Rowangchhari, Bandarban, Bangladesh"
              placeholderTextColor="#888"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* District Selector Chips */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>District / Region</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {DISTRICT_CHIPS.map(d => {
                const active = district === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : isDark ? colors.surface : '#EFEFEF',
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setDistrict(d)}
                  >
                    <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Category Chips */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Nature Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {CATEGORIES.map(c => {
                const active = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : isDark ? colors.surface : '#EFEFEF',
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Rating Stars Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Experience Rating ({rating} / 5 ⭐)</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starBtn}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={[styles.starIcon, { color: star <= rating ? '#FFB800' : '#444' }]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Experience Story */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Your Discovery Experience *</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              multiline
              numberOfLines={4}
              placeholder="Tell fellow explorers what it was like discovering this place, the atmosphere, and feelings..."
              placeholderTextColor="#888"
              value={experience}
              onChangeText={setExperience}
            />
          </View>

          {/* Review & Tips */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Explorer Tips & Advice (Review)</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              multiline
              numberOfLines={3}
              placeholder="Tips for fellow travelers (e.g. best time, guides needed, gear to carry, safety warnings)..."
              placeholderTextColor="#888"
              value={review}
              onChangeText={setReview}
            />
          </View>

          {/* How to Reach */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>How to Reach (Optional Guide)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. Bus to Thanchi → 3h boat to Remakri → Hike 1h"
              placeholderTextColor="#888"
              value={howToReach}
              onChangeText={setHowToReach}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 16 : 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  shareBtn: {
    backgroundColor: '#0F3F35',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },

  formContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.2,
  },

  // Image Picker
  imagePickerBox: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cameraIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerSubtitle: {
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  changeBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  inputGroup: {
    marginBottom: Spacing.lg,
  },
  textInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 85,
    textAlignVertical: 'top',
  },

  chipsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  starRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 30,
  },
});
