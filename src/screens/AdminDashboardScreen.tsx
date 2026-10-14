import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, TextInput, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useAppSelector } from '../store';
import * as ImagePicker from 'expo-image-picker';
import { uploadTripImage } from '../firebase/storageService';

// Services
import {
  subscribeToTrips,
  addTrip,
  updateTrip,
  deleteTrip,
  seedTripsIfEmpty,
  FirestoreTrip,
} from '../firebase/tripService';
import {
  subscribeToAllBookings,
  updateBookingStatus,
  deleteBooking,
  Booking,
} from '../firebase/bookingService';
import {
  getAllUsers,
  deleteUserDocument,
  setUserRole,
  UserProfile,
} from '../firebase/userService';
import {
  subscribeToContent,
  addContent,
  updateContent,
  deleteContent,
  AppContent,
} from '../firebase/contentService';

// Seed data
const SEED_TRIPS = [
  {
    title: 'Bandarban Tour',
    location: 'Bandarban, Bangladesh',
    durationDays: 2,
    budget: 3000,
    slotsAvailable: 30,
    totalSlots: 30,
    category: 'Camping' as const,
    description: 'Join us for an exciting 2-day group tour to the majestic hills of Bandarban.',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  },
  {
    title: 'Sylhet Border Hiking',
    location: 'Sylhet, Bangladesh',
    durationDays: 3,
    budget: 3500,
    slotsAvailable: 15,
    totalSlots: 20,
    category: 'Hiking' as const,
    description: 'A 3-day immersive hiking experience along the scenic borders of Sylhet.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  },
  {
    title: "Cox's Bazar Surfing Camp",
    location: "Cox's Bazar, Bangladesh",
    durationDays: 4,
    budget: 5500,
    slotsAvailable: 8,
    totalSlots: 15,
    category: 'Beach' as const,
    description: 'Hit the longest sea beach in the world for an exclusive 4-day surfing camp.',
    imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800',
  },
  {
    title: 'Kaptai Lake Retreat',
    location: 'Kaptai, Rangamati',
    durationDays: 2,
    budget: 4500,
    slotsAvailable: 2,
    totalSlots: 40,
    category: 'Retreat' as const,
    description: 'A peaceful 2-day retreat at Kaptai Lake.',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
  },
];

type TabType = 'Overview' | 'Tours' | 'Bookings' | 'Users' | 'Content';
const TABS: TabType[] = ['Overview', 'Tours', 'Bookings', 'Users', 'Content'];

const CATEGORIES_LIST = ['Camping', 'Hiking', 'Beach', 'Retreat'];

// ─── Add/Edit Trip Modal ──────────────────────────────────────────────────────

interface TripFormData {
  title: string;
  location: string;
  durationDays: string;
  budget: string;
  slotsAvailable: string;
  totalSlots: string;
  category: string;
  description: string;
  imageUrl: string;
}

const EMPTY_FORM: TripFormData = {
  title: '', location: '', durationDays: '', budget: '',
  slotsAvailable: '', totalSlots: '', category: 'Camping',
  description: '', imageUrl: '',
};

interface TripModalProps {
  visible: boolean;
  initial: TripFormData | null;
  colors: AppColors;
  onSave: (data: TripFormData) => void;
  onClose: () => void;
}

function TripModal({ visible, initial, colors, onSave, onClose }: TripModalProps) {
  const [form, setForm] = useState<TripFormData>(initial ?? EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM);
    setValidationError('');
  }, [initial, visible]);

  const set = (k: keyof TripFormData) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (validationError) setValidationError('');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access in Settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const localUri = result.assets[0].uri;
    setUploading(true);
    try {
      const downloadUrl = await uploadTripImage(localUri);
      setForm(f => ({ ...f, imageUrl: downloadUrl }));
      Alert.alert('Success', 'Cover image uploaded.');
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleValidateAndSave = () => {
    if (!form.title.trim()) {
      setValidationError('Please enter a tour title.');
      return;
    }
    if (!form.location.trim()) {
      setValidationError('Please specify a tour location.');
      return;
    }
    const budgetNum = parseInt(form.budget, 10);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setValidationError('Please enter a valid price in BDT.');
      return;
    }
    const totalSlotsNum = parseInt(form.totalSlots, 10);
    const slotsAvailNum = parseInt(form.slotsAvailable, 10);
    if (!isNaN(totalSlotsNum) && !isNaN(slotsAvailNum) && slotsAvailNum > totalSlotsNum) {
      setValidationError('Available slots cannot exceed total slots.');
      return;
    }

    onSave(form);
  };

  const TEXT_FIELDS: [string, keyof TripFormData, string][] = [
    ['Tour Title', 'title', 'e.g. Sajek Valley Sunrise Tour'],
    ['Location', 'location', 'e.g. Sajek, Rangamati'],
    ['Duration (days)', 'durationDays', 'e.g. 3'],
    ['Budget per Person (৳)', 'budget', 'e.g. 4500'],
    ['Slots Available', 'slotsAvailable', 'e.g. 15'],
    ['Total Capacity', 'totalSlots', 'e.g. 20'],
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[mStyles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={mStyles.headerBtn}>
            <Text style={[mStyles.cancel, { color: colors.error }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[mStyles.modalTitle, { color: colors.text }]}>
            {initial?.title ? 'Edit Tour' : 'Create New Tour'}
          </Text>
          <TouchableOpacity
            onPress={handleValidateAndSave}
            disabled={uploading}
            style={[mStyles.saveHeaderBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={mStyles.saveHeaderBtnTxt}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ padding: Spacing.lg }} keyboardShouldPersistTaps="handled">
          {validationError ? (
            <View style={[mStyles.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error }]}>
              <Text style={[mStyles.errorBannerText, { color: colors.error }]}>⚠️ {validationError}</Text>
            </View>
          ) : null}

          {/* ── Image Picker ── */}
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Tour Cover Image</Text>
            {form.imageUrl ? (
              <Image
                source={{ uri: form.imageUrl }}
                style={[mStyles.imagePreview, { backgroundColor: colors.surfaceElevated }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[mStyles.imagePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ fontSize: 32 }}>🏔️</Text>
                <Text style={[mStyles.placeholderTxt, { color: colors.textMuted }]}>No cover image chosen</Text>
              </View>
            )}

            <TouchableOpacity
              style={[mStyles.pickBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={pickImage}
              disabled={uploading}
              activeOpacity={0.7}
            >
              {uploading
                ? <ActivityIndicator color={colors.primary} size="small" />
                : <Text style={[mStyles.pickBtnTxt, { color: colors.text }]}>📷 {form.imageUrl ? 'Change Photo' : 'Upload Cover Photo'}</Text>
              }
            </TouchableOpacity>
          </View>

          {/* ── Category Chips ── */}
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Experience Category</Text>
            <View style={mStyles.chipsRow}>
              {CATEGORIES_LIST.map(cat => {
                const isSelected = form.category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      mStyles.chip,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                      }
                    ]}
                    onPress={() => setForm(f => ({ ...f, category: cat }))}
                  >
                    <Text style={[mStyles.chipTxt, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Text Fields ── */}
          {TEXT_FIELDS.map(([label, key, placeholder]) => (
            <View key={key} style={mStyles.field}>
              <Text style={[mStyles.label, { color: colors.textMuted }]}>{label}</Text>
              <TextInput
                style={[mStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={form[key]}
                onChangeText={set(key)}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={['durationDays', 'budget', 'slotsAvailable', 'totalSlots'].includes(key) ? 'numeric' : 'default'}
              />
            </View>
          ))}

          {/* ── Description ── */}
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Tour Itinerary & Details</Text>
            <TextInput
              style={[mStyles.input, mStyles.multiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.description}
              onChangeText={set('description')}
              placeholder="Outline the meeting points, daily schedule, and inclusions..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Content Modal ────────────────────────────────────────────────────────────

interface ContentFormData {
  type: string;
  title: string;
  description: string;
  caption: string;
  howToReach: string;
  coverImageUrl: string;
  mediaUrl: string;
  galleryUrls: string[];
}

const EMPTY_CONTENT_FORM: ContentFormData = {
  type: 'Vlog / Video', title: '', description: '', caption: '', howToReach: '', coverImageUrl: '', mediaUrl: '', galleryUrls: []
};

interface ContentModalProps {
  visible: boolean;
  initial: ContentFormData | null;
  colors: AppColors;
  onSave: (data: ContentFormData) => void;
  onClose: () => void;
}

function ContentModal({ visible, initial, colors, onSave, onClose }: ContentModalProps) {
  const [form, setForm] = useState<ContentFormData>(initial ?? EMPTY_CONTENT_FORM);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setForm(initial ?? EMPTY_CONTENT_FORM);
    setValidationError('');
  }, [initial, visible]);

  const set = (k: keyof ContentFormData) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (validationError) setValidationError('');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    setUploading(true);
    try {
      const downloadUrl = await uploadTripImage(result.assets[0].uri);
      setForm(f => ({ ...f, coverImageUrl: downloadUrl }));
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const pickGalleryImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(result.assets.map(a => uploadTripImage(a.uri)));
      setForm(f => ({ ...f, galleryUrls: [...f.galleryUrls, ...urls] }));
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleValidateAndSave = () => {
    if (!form.title.trim()) {
      setValidationError('Please enter a title for this story or vlog.');
      return;
    }
    if (!form.description.trim()) {
      setValidationError('Please provide a description.');
      return;
    }
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[mStyles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={mStyles.headerBtn}>
            <Text style={[mStyles.cancel, { color: colors.error }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[mStyles.modalTitle, { color: colors.text }]}>
            {initial ? 'Edit Content' : 'Publish Content'}
          </Text>
          <TouchableOpacity
            onPress={handleValidateAndSave}
            disabled={uploading}
            style={[mStyles.saveHeaderBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={mStyles.saveHeaderBtnTxt}>Publish</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ padding: Spacing.lg }}>
          {validationError ? (
            <View style={[mStyles.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error }]}>
              <Text style={[mStyles.errorBannerText, { color: colors.error }]}>⚠️ {validationError}</Text>
            </View>
          ) : null}

          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Content Format</Text>
            <View style={mStyles.chipsRow}>
              {['Vlog / Video', 'Story', 'Article'].map(type => {
                const isSelected = form.type === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      mStyles.chip,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                      }
                    ]}
                    onPress={() => setForm(f => ({ ...f, type }))}
                  >
                    <Text style={[mStyles.chipTxt, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Headline Title</Text>
            <TextInput
              style={[mStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.title}
              onChangeText={set('title')}
              placeholder="e.g. Hidden Waterfalls of Bandarban"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Catchy Hook / Caption</Text>
            <TextInput
              style={[mStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.caption}
              onChangeText={set('caption')}
              placeholder="A one-sentence highlight of this adventure..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Full Story / Article Content</Text>
            <TextInput
              style={[mStyles.input, mStyles.multiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.description}
              onChangeText={set('description')}
              placeholder="Write the full narrative, tips, and highlights..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>

          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>How To Reach / Route Guidelines</Text>
            <TextInput
              style={[mStyles.input, mStyles.multiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.howToReach}
              onChangeText={set('howToReach')}
              placeholder="Local bus, CNG, boat details, and checkpoints..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>

          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Cover Photo</Text>
            {form.coverImageUrl ? <Image source={{ uri: form.coverImageUrl }} style={mStyles.imagePreview} /> : null}
            <TouchableOpacity
              style={[mStyles.pickBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
              onPress={pickImage}
              disabled={uploading}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                📷 {form.coverImageUrl ? 'Change Cover Photo' : 'Choose Cover Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Media / Video Stream URL</Text>
            <TextInput
              style={[mStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.mediaUrl}
              onChangeText={set('mediaUrl')}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>
              Additional Gallery Shots ({form.galleryUrls.length})
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {form.galleryUrls.map((uri, i) => (
                <Image key={i} source={{ uri }} style={{ width: 64, height: 64, borderRadius: 8 }} />
              ))}
            </View>
            <TouchableOpacity
              style={[mStyles.pickBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
              onPress={pickGalleryImages}
              disabled={uploading}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>🖼️ Add Images to Gallery</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Admin Dashboard Screen ──────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const currentUser = useAppSelector(s => s.auth.user);

  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [trips, setTrips] = useState<FirestoreTrip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [editingTrip, setEditingTrip] = useState<FirestoreTrip | null>(null);

  const [contents, setContents] = useState<AppContent[]>([]);
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [editingContent, setEditingContent] = useState<AppContent | null>(null);

  const userRole = currentUser?.role || 'traveler';
  const isStaff = userRole === 'admin' || userRole === 'operator' || userRole === 'moderator';

  // Visible tabs adapted by role
  const visibleTabs = useMemo<TabType[]>(() => {
    if (userRole === 'operator') {
      return ['Overview', 'Tours', 'Bookings'];
    }
    if (userRole === 'moderator') {
      return ['Overview', 'Content'];
    }
    return ['Overview', 'Tours', 'Bookings', 'Users', 'Content'];
  }, [userRole]);

  // Guard: allow operator, moderator, or admin
  useEffect(() => {
    if (currentUser && !isStaff) {
      Alert.alert(
        'Access Denied',
        `Your account has the role "${userRole}". Only authorized Tour Operators, Moderators, and Platform Administrators can access this management console.`
      );
      navigation.goBack();
    }
  }, [currentUser, isStaff, userRole, navigation]);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabs, activeTab]);

  // Real-time trips subscription
  useEffect(() => {
    const unsub = subscribeToTrips(data => {
      setTrips(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Real-time content subscription
  useEffect(() => {
    const unsub = subscribeToContent(data => setContents(data));
    return unsub;
  }, []);

  // Real-time bookings subscription
  useEffect(() => {
    const unsub = subscribeToAllBookings(data => setBookings(data));
    return unsub;
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    const data = await getAllUsers();
    setUsers(data);
  }, []);

  useEffect(() => {
    if (activeTab === 'Users') fetchUsers();
  }, [activeTab, fetchUsers]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSeedTrips = async () => {
    setSeeding(true);
    try {
      await seedTripsIfEmpty(SEED_TRIPS);
      Alert.alert('Success', 'Sample tours seeded into Firestore.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingTrip(null);
    setTripModalVisible(true);
  };

  const handleOpenEdit = (trip: FirestoreTrip) => {
    setEditingTrip(trip);
    setTripModalVisible(true);
  };

  const handleSaveTrip = async (form: TripFormData) => {
    setTripModalVisible(false);
    try {
      const payload = {
        title: form.title.trim(),
        location: form.location.trim(),
        durationDays: parseInt(form.durationDays, 10) || 1,
        budget: parseInt(form.budget, 10) || 0,
        slotsAvailable: parseInt(form.slotsAvailable, 10) || 0,
        totalSlots: parseInt(form.totalSlots, 10) || 0,
        category: (form.category as any) || 'Camping',
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim() || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      };
      if (editingTrip) {
        await updateTrip(editingTrip.id, payload);
        Alert.alert('Updated', 'Tour details saved successfully.');
      } else {
        await addTrip(payload);
        Alert.alert('Created', 'New tour published successfully.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveContent = async (form: ContentFormData) => {
    setContentModalVisible(false);
    try {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        caption: form.caption.trim(),
        howToReach: form.howToReach.trim(),
        coverImageUrl: form.coverImageUrl.trim(),
        mediaUrl: form.mediaUrl.trim(),
        galleryUrls: form.galleryUrls,
      };
      if (editingContent) {
        await updateContent(editingContent.id, payload);
        Alert.alert('Updated', 'Content updated successfully.');
      } else {
        await addContent(payload);
        Alert.alert('Published', 'New story published successfully.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleOpenAddContent = () => {
    setEditingContent(null);
    setContentModalVisible(true);
  };

  const handleOpenEditContent = (content: AppContent) => {
    setEditingContent(content);
    setContentModalVisible(true);
  };

  const handleDeleteTrip = (id: string, title: string) => {
    Alert.alert('Delete Tour', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteTrip(id); }
          catch (e: any) { Alert.alert('Error', e.message); }
        }
      },
    ]);
  };

  const handleDeleteContent = (id: string, title: string) => {
    Alert.alert('Delete Content', `Are you sure you want to remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteContent(id); }
          catch (e: any) { Alert.alert('Error', e.message); }
        }
      },
    ]);
  };

  const handleUpdateBooking = async (id: string, status: 'Confirmed' | 'Cancelled') => {
    try {
      await updateBookingStatus(id, status);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteBooking = (id: string) => {
    Alert.alert('Delete Booking', 'Remove this booking record completely?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteBooking(id); }
          catch (e: any) { Alert.alert('Error', e.message); }
        }
      },
    ]);
  };

  const handleDeleteUser = (uid: string, name: string) => {
    Alert.alert('Delete User', `Permanently delete user account record for "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUserDocument(uid);
            await fetchUsers();
          } catch (e: any) { Alert.alert('Error', e.message); }
        }
      },
    ]);
  };

  const handleToggleRole = async (uid: string, current: string) => {
    const next = current === 'admin' ? 'user' : 'admin';
    try {
      await setUserRole(uid, next);
      await fetchUsers();
      Alert.alert('Role Updated', `User permissions changed to "${next}".`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'Confirmed') return '#10B981';
    if (s === 'Cancelled') return colors.error;
    return '#F59E0B';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingTxt, { color: colors.textMuted }]}>Connecting to Explora Cloud...</Text>
      </View>
    );
  }

  const pendingCount = bookings.filter(b => b.status === 'Pending').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>
            {userRole === 'operator' ? 'Operator Portal' : userRole === 'moderator' ? 'Moderation Desk' : 'Admin Console'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {userRole === 'operator' ? 'Tour & Booking Operations' : userRole === 'moderator' ? 'Community & Content Review' : 'Explora System Management'}
          </Text>
        </View>
        {pendingCount > 0 && (
          <View style={[styles.pendingBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.pendingBadgeTxt}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* ── Tabs Bar ── */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                  {tab}
                  {tab === 'Bookings' && pendingCount > 0 ? ` • ${pendingCount}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Tab Content ── */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 60 }}
      >
        {/* ── Overview ── */}
        {activeTab === 'Overview' && (
          <View>
            <View style={styles.overviewGrid}>
              <View style={[styles.statCard, { borderTopColor: colors.primary }]}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{users.length || '—'}</Text>
                <Text style={styles.statLabel}>Total Explorers</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: '#10B981' }]}>
                <Text style={styles.statIcon}>🗺️</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>{trips.length}</Text>
                <Text style={styles.statLabel}>Active Tours</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: '#F59E0B' }]}>
                <Text style={styles.statIcon}>🎟️</Text>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{bookings.length}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: colors.error }]}>
                <Text style={styles.statIcon}>⏳</Text>
                <Text style={[styles.statValue, { color: colors.error }]}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending Approval</Text>
              </View>
            </View>

            {trips.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🧭</Text>
                <Text style={styles.emptyCardTitle}>No Tours Found</Text>
                <Text style={styles.emptyCardSub}>Initialize sample trips to start testing bookings.</Text>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSeedTrips}
                  disabled={seeding}
                >
                  {seeding
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.primaryActionBtnTxt}>🌱 Seed Sample Tours</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>RECENT BOOKINGS</Text>
              <TouchableOpacity onPress={() => setActiveTab('Bookings')}>
                <Text style={[styles.sectionAction, { color: colors.primary }]}>View All →</Text>
              </TouchableOpacity>
            </View>

            {bookings.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardSub}>No bookings recorded yet.</Text>
              </View>
            ) : (
              bookings.slice(0, 5).map(b => (
                <View key={b.id} style={styles.cardItem}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarTxt}>{b.userName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{b.userName}</Text>
                    <Text style={styles.cardSub}>{b.tripTitle} • {b.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(b.status) + '1A' }]}>
                    <Text style={[styles.statusBadgeTxt, { color: statusColor(b.status) }]}>{b.status}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Tours ── */}
        {activeTab === 'Tours' && (
          <View>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary, marginBottom: Spacing.lg }]}
              onPress={handleOpenAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionBtnTxt}>+ Create New Tour</Text>
            </TouchableOpacity>

            {trips.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>No tours in database</Text>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#10B981', marginTop: 12 }]}
                  onPress={handleSeedTrips}
                  disabled={seeding}
                >
                  <Text style={styles.primaryActionBtnTxt}>🌱 Seed Sample Tours</Text>
                </TouchableOpacity>
              </View>
            )}

            {trips.map(tour => (
              <View key={tour.id} style={styles.tourCard}>
                <Image
                  source={{ uri: tour.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }}
                  style={styles.tourThumbnail}
                />
                <View style={styles.tourInfo}>
                  <View style={styles.tourHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{tour.title}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={[styles.categoryBadgeTxt, { color: colors.primary }]}>{tour.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub}>{tour.location} • {tour.durationDays} days</Text>
                  <Text style={styles.tourPrice}>৳{tour.budget} • <Text style={{ color: colors.textMuted }}>{tour.slotsAvailable}/{tour.totalSlots} slots left</Text></Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(tour)}
                      style={[styles.smallBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.smallBtnTxt, { color: colors.primary }]}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteTrip(tour.id, tour.title)}
                      style={[styles.smallBtn, { backgroundColor: colors.error + '12', borderColor: colors.error + '40' }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.smallBtnTxt, { color: colors.error }]}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Bookings ── */}
        {activeTab === 'Bookings' && (
          <View>
            {bookings.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🎟️</Text>
                <Text style={styles.emptyCardTitle}>No bookings yet</Text>
                <Text style={styles.emptyCardSub}>When users join tours, their reservations appear here.</Text>
              </View>
            )}

            {bookings.map(b => (
              <View key={b.id} style={styles.bookingCard}>
                <View style={styles.bookingTopRow}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarTxt}>{b.userName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cardTitle}>{b.userName}</Text>
                    <Text style={styles.cardSub}>{b.userEmail}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(b.status) + '1A' }]}>
                    <Text style={[styles.statusBadgeTxt, { color: statusColor(b.status) }]}>{b.status}</Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingTripName}>🗺️ {b.tripTitle}</Text>
                  <Text style={styles.bookingDate}>📅 Booked on {b.date}</Text>
                </View>

                <View style={styles.bookingActionsRow}>
                  {b.status === 'Pending' ? (
                    <>
                      <TouchableOpacity
                        onPress={() => handleUpdateBooking(b.id, 'Confirmed')}
                        style={[styles.bookingActionBtn, { backgroundColor: '#10B981' }]}
                      >
                        <Text style={styles.bookingActionBtnTxt}>✓ Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleUpdateBooking(b.id, 'Cancelled')}
                        style={[styles.bookingActionBtn, { backgroundColor: colors.error + '22', borderWidth: 1, borderColor: colors.error }]}
                      >
                        <Text style={[styles.bookingActionBtnTxt, { color: colors.error }]}>✕ Reject</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleDeleteBooking(b.id)}
                      style={[styles.bookingActionBtn, { backgroundColor: colors.surfaceElevated }]}
                    >
                      <Text style={[styles.bookingActionBtnTxt, { color: colors.textMuted }]}>Remove Record</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Users ── */}
        {activeTab === 'Users' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>REGISTERED ACCOUNTS ({users.length})</Text>
              <TouchableOpacity onPress={fetchUsers} style={styles.refreshBtn}>
                <Text style={[styles.sectionAction, { color: colors.primary }]}>⟳ Refresh</Text>
              </TouchableOpacity>
            </View>

            {users.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardSub}>No users found. Tap refresh.</Text>
              </View>
            )}

            {users.map(u => {
              const isCurrent = u.uid === currentUser?.uid;
              const isAdmin = u.role === 'admin';
              return (
                <View key={u.uid} style={styles.userCard}>
                  <View style={[styles.cardAvatar, { backgroundColor: isAdmin ? colors.primary : colors.surfaceElevated }]}>
                    <Text style={[styles.cardAvatarTxt, { color: isAdmin ? '#fff' : colors.text }]}>
                      {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.cardTitle}>{u.displayName || 'Explorer'}</Text>
                      {isCurrent && <Text style={[styles.youTag, { color: colors.primary }]}>[You]</Text>}
                    </View>
                    <Text style={styles.cardSub}>{u.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: isAdmin ? colors.primary + '18' : colors.surfaceElevated }]}>
                      <Text style={[styles.roleBadgeTxt, { color: isAdmin ? colors.primary : colors.textMuted }]}>
                        {isAdmin ? '🛡️ Administrator' : '👤 Traveler'}
                      </Text>
                    </View>
                  </View>

                  {!isCurrent && (
                    <View style={styles.userActionCol}>
                      <TouchableOpacity
                        onPress={() => handleToggleRole(u.uid, u.role)}
                        style={[styles.smallBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                      >
                        <Text style={[styles.smallBtnTxt, { color: colors.textSecondary }]}>
                          {isAdmin ? 'Demote' : 'Promote'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteUser(u.uid, u.displayName ?? 'User')}
                        style={[styles.smallBtn, { backgroundColor: colors.error + '12', borderColor: colors.error + '30', marginTop: 4 }]}
                      >
                        <Text style={[styles.smallBtnTxt, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── Content ── */}
        {activeTab === 'Content' && (
          <View>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary, marginBottom: Spacing.lg }]}
              onPress={handleOpenAddContent}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionBtnTxt}>+ Publish Story or Vlog</Text>
            </TouchableOpacity>

            {contents.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📖</Text>
                <Text style={styles.emptyCardTitle}>No Stories or Vlogs</Text>
                <Text style={styles.emptyCardSub}>Add travel guides, vlog features, or community stories.</Text>
              </View>
            )}

            {contents.map(c => (
              <View key={c.id} style={styles.contentCard}>
                {c.coverImageUrl ? (
                  <Image source={{ uri: c.coverImageUrl }} style={styles.contentThumb} />
                ) : (
                  <View style={[styles.contentThumbPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={{ fontSize: 24 }}>🎬</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.tourHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={[styles.categoryBadgeTxt, { color: colors.primary }]}>{c.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub} numberOfLines={2}>{c.caption || c.description || 'No summary'}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => handleOpenEditContent(c)}
                      style={[styles.smallBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                    >
                      <Text style={[styles.smallBtnTxt, { color: colors.primary }]}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteContent(c.id, c.title)}
                      style={[styles.smallBtn, { backgroundColor: colors.error + '12', borderColor: colors.error + '40' }]}
                    >
                      <Text style={[styles.smallBtnTxt, { color: colors.error }]}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Trip Modal */}
      <TripModal
        visible={tripModalVisible}
        initial={editingTrip ? {
          title: editingTrip.title,
          location: editingTrip.location,
          durationDays: String(editingTrip.durationDays),
          budget: String(editingTrip.budget),
          slotsAvailable: String(editingTrip.slotsAvailable),
          totalSlots: String(editingTrip.totalSlots),
          category: editingTrip.category,
          description: editingTrip.description,
          imageUrl: editingTrip.imageUrl,
        } : null}
        colors={colors}
        onSave={handleSaveTrip}
        onClose={() => setTripModalVisible(false)}
      />

      {/* Content Modal */}
      <ContentModal
        visible={contentModalVisible}
        initial={editingContent ? {
          type: editingContent.type,
          title: editingContent.title,
          description: editingContent.description,
          caption: editingContent.caption || '',
          howToReach: editingContent.howToReach || '',
          coverImageUrl: editingContent.coverImageUrl,
          mediaUrl: editingContent.mediaUrl,
          galleryUrls: editingContent.galleryUrls,
        } : null}
        colors={colors}
        onSave={handleSaveContent}
        onClose={() => setContentModalVisible(false)}
      />
    </View>
  );
}

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const mStyles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cancel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  saveHeaderBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  saveHeaderBtnTxt: {
    color: '#fff',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  errorBanner: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  field: { marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.base,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  imagePreview: {
    width: '100%',
    height: 170,
    borderRadius: Radius.xl,
    marginBottom: Spacing.sm,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  placeholderTxt: { fontSize: Typography.size.sm },
  pickBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pickBtnTxt: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipTxt: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semiBold },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    centerBox: { alignItems: 'center', justifyContent: 'center' },
    loadingTxt: { marginTop: Spacing.md, fontSize: Typography.size.sm },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      gap: Spacing.sm,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: Radius.full,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtnText: {
      fontSize: 26,
      color: c.text,
      lineHeight: 30,
      marginTop: -2,
    },
    headerTextWrap: { flex: 1 },
    headerTitle: {
      fontSize: 20,
      fontWeight: Typography.weight.heavy,
      color: c.text,
    },
    headerSubtitle: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
      marginTop: 1,
    },
    pendingBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    pendingBadgeTxt: {
      color: '#fff',
      fontSize: 12,
      fontWeight: Typography.weight.bold,
    },

    tabsContainer: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    tabsScroll: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
    },
    tab: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: 8,
      borderRadius: Radius.full,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    tabText: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
    },

    content: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
    },

    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: c.surface,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderTopWidth: 4,
    },
    statIcon: { fontSize: 20, marginBottom: 4 },
    statValue: {
      fontSize: 26,
      fontWeight: Typography.weight.heavy,
    },
    statLabel: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
      marginTop: 2,
    },

    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      marginTop: Spacing.xs,
    },
    sectionTitle: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      color: c.textMuted,
      letterSpacing: 0.8,
    },
    sectionAction: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
    },
    refreshBtn: { padding: 4 },

    primaryActionBtn: {
      paddingVertical: Spacing.md,
      borderRadius: Radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryActionBtnTxt: {
      color: '#fff',
      fontSize: Typography.size.base,
      fontWeight: Typography.weight.bold,
    },

    emptyCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      marginBottom: Spacing.md,
    },
    emptyCardTitle: {
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.bold,
      color: c.text,
      marginBottom: 4,
    },
    emptyCardSub: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
      textAlign: 'center',
    },

    cardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      marginBottom: Spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    cardAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardAvatarTxt: {
      fontSize: 16,
      fontWeight: Typography.weight.bold,
      color: c.primary,
    },
    cardContent: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    cardTitle: {
      fontSize: Typography.size.base,
      fontWeight: Typography.weight.bold,
      color: c.text,
    },
    cardSub: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
      marginTop: 2,
    },

    tourCard: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      overflow: 'hidden',
      marginBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing.sm,
    },
    tourThumbnail: {
      width: 90,
      height: 90,
      borderRadius: Radius.lg,
    },
    tourInfo: {
      flex: 1,
      marginLeft: Spacing.md,
      justifyContent: 'center',
    },
    tourHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radius.md,
    },
    categoryBadgeTxt: {
      fontSize: 10,
      fontWeight: Typography.weight.bold,
      textTransform: 'uppercase',
    },
    tourPrice: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.bold,
      color: c.primary,
      marginTop: 2,
    },
    actionRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: 6,
    },
    smallBtn: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: Radius.md,
      borderWidth: StyleSheet.hairlineWidth,
    },
    smallBtnTxt: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
    },

    bookingCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    bookingTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bookingDetails: {
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    bookingTripName: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.bold,
      color: c.text,
    },
    bookingDate: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
      marginTop: 2,
    },
    bookingActionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    bookingActionBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookingActionBtnTxt: {
      color: '#fff',
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
    },

    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      padding: Spacing.md,
      borderRadius: Radius.xl,
      marginBottom: Spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    youTag: {
      fontSize: 10,
      fontWeight: Typography.weight.bold,
    },
    roleBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radius.md,
      marginTop: 4,
    },
    roleBadgeTxt: {
      fontSize: 10,
      fontWeight: Typography.weight.bold,
    },
    userActionCol: {
      alignItems: 'flex-end',
    },

    contentCard: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    contentThumb: {
      width: 75,
      height: 75,
      borderRadius: Radius.lg,
    },
    contentThumbPlaceholder: {
      width: 75,
      height: 75,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: Radius.full,
    },
    statusBadgeTxt: {
      fontSize: 11,
      fontWeight: Typography.weight.bold,
    },
  });
}
