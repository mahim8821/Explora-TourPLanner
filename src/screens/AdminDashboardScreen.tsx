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

// Seed data (remote URLs instead of require() for Firestore)
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

// ─── Add/Edit Trip Modal ──────────────────────────────────────────────────────

const CATEGORIES_LIST = ['Camping', 'Hiking', 'Beach', 'Retreat', 'All'];

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

  useEffect(() => { setForm(initial ?? EMPTY_FORM); }, [initial, visible]);

  const set = (k: keyof TripFormData) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const pickImage = async () => {
    // Request gallery permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
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
      Alert.alert('✅ Uploaded', 'Image uploaded successfully.');
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const TEXT_FIELDS: [string, keyof TripFormData][] = [
    ['Tour Title', 'title'],
    ['Location', 'location'],
    ['Duration (days)', 'durationDays'],
    ['Budget (৳)', 'budget'],
    ['Slots Available', 'slotsAvailable'],
    ['Total Slots', 'totalSlots'],
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={mStyles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[mStyles.cancel, { color: colors.error }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[mStyles.modalTitle, { color: colors.text }]}>
            {initial?.title ? 'Edit Tour' : 'Add New Tour'}
          </Text>
          <TouchableOpacity onPress={() => onSave(form)} disabled={uploading}>
            <Text style={[mStyles.cancel, { color: uploading ? colors.textMuted : colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ padding: Spacing.lg }} keyboardShouldPersistTaps="handled">

          {/* ── Image Picker ── */}
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Tour Image</Text>

            {/* Preview */}
            {form.imageUrl ? (
              <Image
                source={{ uri: form.imageUrl }}
                style={[mStyles.imagePreview, { backgroundColor: colors.surfaceElevated }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[mStyles.imagePlaceholder, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={{ fontSize: 32 }}>🖼️</Text>
                <Text style={[mStyles.placeholderTxt, { color: colors.textMuted }]}>No image selected</Text>
              </View>
            )}

            {/* Pick button */}
            <TouchableOpacity
              style={[mStyles.pickBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.6 : 1 }]}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={mStyles.pickBtnTxt}>📷 Pick from Gallery</Text>
              }
            </TouchableOpacity>
          </View>

          {/* ── Text Fields ── */}
          {TEXT_FIELDS.map(([label, key]) => (
            <View key={key} style={mStyles.field}>
              <Text style={[mStyles.label, { color: colors.textMuted }]}>{label}</Text>
              <TextInput
                style={[mStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={form[key]}
                onChangeText={set(key)}
                placeholder={label}
                placeholderTextColor={colors.textMuted}
                keyboardType={['durationDays', 'budget', 'slotsAvailable', 'totalSlots'].includes(key) ? 'numeric' : 'default'}
              />
            </View>
          ))}

          {/* ── Category Chips ── */}
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Category</Text>
            <View style={mStyles.chipsRow}>
              {CATEGORIES_LIST.filter(c => c !== 'All').map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    mStyles.chip,
                    { borderColor: colors.border, backgroundColor: form.category === cat ? colors.primary : colors.surface }
                  ]}
                  onPress={() => setForm(f => ({ ...f, category: cat }))}
                >
                  <Text style={[mStyles.chipTxt, { color: form.category === cat ? '#fff' : colors.textSecondary }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Description ── */}
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Description</Text>
            <TextInput
              style={[mStyles.input, mStyles.multiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.description}
              onChangeText={set('description')}
              placeholder="Describe the trip experience..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, paddingTop: Spacing['2xl'],
  },
  modalTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  cancel: { fontSize: Typography.size.base, fontWeight: Typography.weight.semiBold },
  field: { marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.size.xs, fontWeight: Typography.weight.medium,
    marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    fontSize: Typography.size.base,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },

  // Image picker
  imagePreview: { width: '100%', height: 180, borderRadius: Radius.xl, marginBottom: Spacing.sm },
  imagePlaceholder: {
    width: '100%', height: 140, borderRadius: Radius.xl, borderWidth: 1,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, marginBottom: Spacing.sm,
  },
  placeholderTxt: { fontSize: Typography.size.sm },
  pickBtn: {
    paddingVertical: Spacing.md, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  pickBtnTxt: { color: '#fff', fontSize: Typography.size.base, fontWeight: Typography.weight.semiBold },

  // Category chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1,
  },
  chipTxt: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
});

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

  useEffect(() => { setForm(initial ?? EMPTY_CONTENT_FORM); }, [initial, visible]);

  const set = (k: keyof ContentFormData) => (v: string) => setForm(f => ({ ...f, [k]: v }));

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
    } catch (e: any) { Alert.alert('Upload Failed', e.message); } 
    finally { setUploading(false); }
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
    } catch (e: any) { Alert.alert('Upload Failed', e.message); } 
    finally { setUploading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={mStyles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={[mStyles.cancel, { color: colors.error }]}>Cancel</Text></TouchableOpacity>
          <Text style={[mStyles.modalTitle, { color: colors.text }]}>{initial ? 'EDIT CONTENT' : 'ADD CONTENT'}</Text>
          <TouchableOpacity onPress={() => onSave(form)} disabled={uploading}>
            <Text style={[mStyles.cancel, { color: uploading ? colors.textMuted : colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ padding: Spacing.lg }}>
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Content Type</Text>
            <View style={mStyles.chipsRow}>
              {['Vlog / Video', 'Story', 'Article'].map(type => (
                <TouchableOpacity key={type}
                  style={[mStyles.chip, { borderColor: colors.border, backgroundColor: form.type === type ? colors.primary : colors.surface }]}
                  onPress={() => setForm(f => ({ ...f, type }))}
                >
                  <Text style={[mStyles.chipTxt, { color: form.type === type ? '#fff' : colors.textSecondary }]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Title</Text>
            <TextInput style={[mStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.title} onChangeText={set('title')} placeholder="Enter content title" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Caption</Text>
            <TextInput style={[mStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.caption} onChangeText={set('caption')} placeholder="Short catchy caption" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Description / Details</Text>
            <TextInput style={[mStyles.input, mStyles.multiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.description} onChangeText={set('description')} placeholder="Write the full description/details" placeholderTextColor={colors.textMuted} multiline />
          </View>
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>How To Reach / Road Guideline</Text>
            <TextInput style={[mStyles.input, mStyles.multiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.howToReach} onChangeText={set('howToReach')} placeholder="Provide directions or road guidelines" placeholderTextColor={colors.textMuted} multiline />
          </View>
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Cover Image Upload (Alternative to URL)</Text>
            {form.coverImageUrl ? <Image source={{uri: form.coverImageUrl}} style={mStyles.imagePreview} /> : null}
            <TouchableOpacity style={[mStyles.pickBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} onPress={pickImage} disabled={uploading}>
              <Text style={{ color: colors.text }}>Choose File {form.coverImageUrl ? '(1 file)' : 'No file chosen'}</Text>
            </TouchableOpacity>
          </View>
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>Or Media URL (Imgur, YouTube, etc.)</Text>
            <TextInput style={[mStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.mediaUrl} onChangeText={set('mediaUrl')} placeholder="https://..." placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="url" />
          </View>
          <View style={mStyles.field}>
            <Text style={[mStyles.label, { color: colors.textMuted }]}>📸 Gallery Images <Text style={{fontSize: 10, color: colors.textMuted, textTransform: 'none'}}>(optional, for View Gallery)</Text></Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10}}>
              {form.galleryUrls.map((uri, i) => (
                 <Image key={i} source={{uri}} style={{width: 60, height: 60, borderRadius: 8}} />
              ))}
            </View>
            <TouchableOpacity style={[mStyles.pickBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} onPress={pickGalleryImages} disabled={uploading}>
              <Text style={{ color: colors.text }}>Choose Files {form.galleryUrls.length ? `(${form.galleryUrls.length} files)` : 'No files chosen'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

  // Guard: only admin may view this
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have admin privileges.');
      navigation.goBack();
    }
  }, [currentUser]);

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

  // Fetch users (one-time for now, refreshed per tab change)
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
      Alert.alert('Done', 'Sample trips seeded to Firestore.');
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
    if (!form.title.trim()) { Alert.alert('Validation', 'Title is required.'); return; }
    setTripModalVisible(false);
    try {
      const payload = {
        title: form.title.trim(),
        location: form.location.trim(),
        durationDays: parseInt(form.durationDays) || 1,
        budget: parseInt(form.budget) || 0,
        slotsAvailable: parseInt(form.slotsAvailable) || 0,
        totalSlots: parseInt(form.totalSlots) || 0,
        category: (form.category as any) || 'Camping',
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim() || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      };
      if (editingTrip) {
        await updateTrip(editingTrip.id, payload);
        Alert.alert('Updated', 'Tour updated successfully.');
      } else {
        await addTrip(payload);
        Alert.alert('Added', 'New tour added successfully.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveContent = async (form: ContentFormData) => {
    if (!form.title.trim()) { Alert.alert('Validation', 'Title is required.'); return; }
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
        Alert.alert('Added', 'New content added successfully.');
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
    Alert.alert('Delete Tour', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteTrip(id); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleDeleteContent = (id: string, title: string) => {
    Alert.alert('Delete Content', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteContent(id); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleUpdateBooking = async (id: string, status: 'Confirmed' | 'Cancelled') => {
    try { await updateBookingStatus(id, status); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDeleteBooking = (id: string) => {
    Alert.alert('Delete Booking', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteBooking(id); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleDeleteUser = (uid: string, name: string) => {
    Alert.alert('Delete User', `Remove "${name}" from the database?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteUserDocument(uid);
          await fetchUsers();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleToggleRole = async (uid: string, current: string) => {
    const next = current === 'admin' ? 'user' : 'admin';
    try {
      await setUserRole(uid, next);
      await fetchUsers();
      Alert.alert('Updated', `User role changed to "${next}".`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // ── Status badge color ───────────────────────────────────────────────────────

  const statusColor = (s: string) => {
    if (s === 'Confirmed') return '#10b981';
    if (s === 'Cancelled') return colors.error;
    return '#f59e0b';
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.listSub, { marginTop: Spacing.md }]}>Loading data…</Text>
      </View>
    );
  }

  const pendingCount = bookings.filter(b => b.status === 'Pending').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        {pendingCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeTxt}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map(tab => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, { color: isActive ? '#fff' : colors.textMuted }]}>
                  {tab}
                  {tab === 'Bookings' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Overview ── */}
        {activeTab === 'Overview' && (
          <View>
            <View style={styles.overviewCards}>
              <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
                <Text style={styles.statLabel}>Total Users</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{users.length || '…'}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                <Text style={styles.statLabel}>Active Tours</Text>
                <Text style={[styles.statValue, { color: '#10b981' }]}>{trips.length}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
                <Text style={styles.statLabel}>Bookings</Text>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>{bookings.length}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>{pendingCount}</Text>
              </View>
            </View>

            {trips.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>No tours in Firestore yet.</Text>
                <TouchableOpacity
                  style={[styles.seedBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSeedTrips}
                  disabled={seeding}
                >
                  {seeding
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.seedBtnTxt}>🌱 Seed Sample Tours</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>RECENT BOOKINGS</Text>
            {bookings.slice(0, 5).map(b => (
              <View key={b.id} style={styles.listItem}>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{b.userName}</Text>
                  <Text style={styles.listSub}>{b.tripTitle} • {b.date}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor(b.status) + '22' }]}>
                  <Text style={[styles.statusTxt, { color: statusColor(b.status) }]}>{b.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Tours ── */}
        {activeTab === 'Tours' && (
          <View>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleOpenAdd}>
              <Text style={styles.addBtnTxt}>+ Add New Tour</Text>
            </TouchableOpacity>
            {trips.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>No tours yet. Seed or add tours.</Text>
                <TouchableOpacity
                  style={[styles.seedBtn, { backgroundColor: '#10b981' }]}
                  onPress={handleSeedTrips}
                  disabled={seeding}
                >
                  {seeding
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.seedBtnTxt}>🌱 Seed Sample Tours</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
            {trips.map(tour => (
              <View key={tour.id} style={styles.listItem}>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{tour.title}</Text>
                  <Text style={styles.listSub}>{tour.location} • ৳{tour.budget} • {tour.slotsAvailable}/{tour.totalSlots} slots</Text>
                  <View style={[styles.catTag, { backgroundColor: colors.primary + '18' }]}>
                    <Text style={[styles.catTagTxt, { color: colors.primary }]}>{tour.category}</Text>
                  </View>
                </View>
                <View style={styles.listActions}>
                  <TouchableOpacity onPress={() => handleOpenEdit(tour)}>
                    <Text style={styles.actionEdit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteTrip(tour.id, tour.title)}>
                    <Text style={[styles.actionDelete, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Bookings ── */}
        {activeTab === 'Bookings' && (
          <View>
            {bookings.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>No bookings yet.</Text>
              </View>
            )}
            {bookings.map(b => (
              <View key={b.id} style={styles.listItem}>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{b.userName}</Text>
                  <Text style={styles.listSub}>{b.tripTitle} • {b.date}</Text>
                  <Text style={[styles.listSub, { color: colors.textMuted, fontSize: 11 }]}>{b.userEmail}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[styles.statusPill, { backgroundColor: statusColor(b.status) + '22' }]}>
                    <Text style={[styles.statusTxt, { color: statusColor(b.status) }]}>{b.status}</Text>
                  </View>
                  {b.status === 'Pending' && (
                    <View style={styles.listActions}>
                      <TouchableOpacity onPress={() => handleUpdateBooking(b.id, 'Confirmed')}>
                        <Text style={styles.actionConfirm}>✓ Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleUpdateBooking(b.id, 'Cancelled')}>
                        <Text style={[styles.actionDelete, { color: colors.error }]}>✕ Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {b.status !== 'Pending' && (
                    <TouchableOpacity onPress={() => handleDeleteBooking(b.id)}>
                      <Text style={[styles.actionDelete, { color: colors.error, fontSize: 11 }]}>Remove</Text>
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
            {users.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>No users found. Try refreshing.</Text>
                <TouchableOpacity style={[styles.seedBtn, { backgroundColor: colors.primary }]} onPress={fetchUsers}>
                  <Text style={styles.seedBtnTxt}>⟳ Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
            {users.map(u => (
              <View key={u.uid} style={styles.listItem}>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{u.displayName ?? 'Unknown'}</Text>
                  <Text style={styles.listSub}>{u.email}</Text>
                  <View style={[styles.rolePill, { backgroundColor: u.role === 'admin' ? colors.primary + '22' : colors.surface }]}>
                    <Text style={[styles.roleTxt, { color: u.role === 'admin' ? colors.primary : colors.textMuted }]}>
                      {u.role === 'admin' ? '⭐ Admin' : '👤 User'}
                    </Text>
                  </View>
                </View>
                {u.uid !== currentUser?.uid && (
                  <View style={styles.listActions}>
                    <TouchableOpacity onPress={() => handleToggleRole(u.uid, u.role)}>
                      <Text style={styles.actionEdit}>{u.role === 'admin' ? 'Demote' : 'Promote'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteUser(u.uid, u.displayName ?? 'User')}>
                      <Text style={[styles.actionDelete, { color: colors.error }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {u.uid === currentUser?.uid && (
                  <Text style={[styles.listSub, { color: colors.primary }]}>You</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Content ── */}
        {activeTab === 'Content' && (
          <View>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleOpenAddContent}>
              <Text style={styles.addBtnTxt}>+ Add Content</Text>
            </TouchableOpacity>

            {contents.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>No content found.</Text>
              </View>
            )}

            {contents.map(c => (
              <View key={c.id} style={styles.listItem}>
                {c.coverImageUrl ? (
                   <Image source={{uri: c.coverImageUrl}} style={{width: 50, height: 50, borderRadius: 8, marginRight: 12}} />
                ) : (
                   <View style={{width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center'}}>
                     <Text style={{fontSize: 20}}>🎬</Text>
                   </View>
                )}
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{c.title}</Text>
                  <Text style={styles.listSub} numberOfLines={1}>{c.description || 'No description'}</Text>
                  <View style={[styles.catTag, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.catTagTxt, { color: colors.primary }]}>{c.type}</Text>
                  </View>
                </View>
                <View style={styles.listActions}>
                  <TouchableOpacity onPress={() => handleOpenEditContent(c)}>
                    <Text style={styles.actionEdit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteContent(c.id, c.title)}>
                    <Text style={[styles.actionDelete, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Trip Add/Edit Modal */}
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

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
      paddingTop: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    backBtn: { padding: Spacing.sm },
    backTxt: { color: c.primary, fontSize: Typography.size.base, fontWeight: Typography.weight.medium },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: Typography.weight.bold, color: c.text, textAlign: 'center' },
    badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    badgeTxt: { color: '#fff', fontSize: 11, fontWeight: Typography.weight.bold },

    tabsContainer: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, backgroundColor: c.surface },
    tabsScroll: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
    tab: { paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: c.background, borderWidth: 1, borderColor: c.border },
    tabText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },

    content: { flex: 1, padding: Spacing.lg },

    sectionHeader: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.lg },

    overviewCards: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.md },
    statCard: {
      width: '47%',
      backgroundColor: c.surface,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderLeftWidth: 4,
    },
    statLabel: { fontSize: Typography.size.sm, color: c.textMuted },
    statValue: { fontSize: 28, fontWeight: Typography.weight.bold, marginTop: Spacing.xs },

    emptyBox: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
    emptyTxt: { fontSize: Typography.size.base, marginBottom: Spacing.md },
    seedBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.xl },
    seedBtnTxt: { color: '#fff', fontWeight: Typography.weight.bold },

    addBtn: { paddingVertical: Spacing.md, borderRadius: Radius.lg, alignItems: 'center', marginBottom: Spacing.lg },
    addBtnTxt: { color: '#fff', fontSize: Typography.size.base, fontWeight: Typography.weight.bold },

    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      marginBottom: Spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    listInfo: { flex: 1, gap: 2 },
    listTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: c.text },
    listSub: { fontSize: Typography.size.xs, color: c.textMuted },
    listActions: { flexDirection: 'row', gap: Spacing.md },
    actionEdit: { color: '#3b82f6', fontWeight: Typography.weight.medium, fontSize: Typography.size.sm },
    actionDelete: { fontWeight: Typography.weight.medium, fontSize: Typography.size.sm },
    actionConfirm: { color: '#10b981', fontWeight: Typography.weight.medium, fontSize: Typography.size.sm },

    statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
    statusTxt: { fontSize: 11, fontWeight: Typography.weight.semiBold },

    catTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
    catTagTxt: { fontSize: 10, fontWeight: Typography.weight.semiBold },

    rolePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
    roleTxt: { fontSize: 10, fontWeight: Typography.weight.semiBold },
  });
}
