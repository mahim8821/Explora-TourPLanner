import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../store';
import { setUser } from '../store/slices/authSlice';
import { getUserProfile, updateUserProfile, UserProfile } from '../firebase/userService';
import { subscribeToUserBookings, Booking } from '../firebase/bookingService';
import * as ImagePicker from 'expo-image-picker';
import { uploadTripImage } from '../firebase/storageService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const DEFAULT_INTERESTS = ['Mountains', 'Beaches', 'Nature', 'Camping', 'Photography', 'Food Tours'];

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items: bookmarks } = useAppSelector(s => s.bookmarks);
  const { user } = useAppSelector(s => s.auth);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);

  // Load profile from Firestore with auth fallback
  const loadProfile = useCallback(async () => {
    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) {
      setLoadingProfile(false);
      return;
    }
    try {
      const data = await getUserProfile(currentUid);
      if (data) {
        setProfile(data);
        setName(data.displayName ?? user?.displayName ?? auth.currentUser?.displayName ?? 'Explorer');
        setBio(data.bio ?? 'Adventure seeker & travel enthusiast 🌏');
        setProfilePhoto(data.photoURL ?? user?.photoURL ?? auth.currentUser?.photoURL ?? null);
        setCoverPhoto(data.coverPhotoURL ?? null);
      } else {
        setName(user?.displayName ?? auth.currentUser?.displayName ?? 'Explorer');
        setBio('Adventure seeker & travel enthusiast 🌏');
        setProfilePhoto(user?.photoURL ?? auth.currentUser?.photoURL ?? null);
      }
    } catch (e) {
      console.warn('Profile load error:', e);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Real-time bookings
  useEffect(() => {
    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) return;
    const unsub = subscribeToUserBookings(currentUid, setBookings);
    return unsub;
  }, [user?.uid]);

  const displayName = name || user?.displayName || auth.currentUser?.displayName || 'Explorer';
  const displayEmail = user?.email ?? auth.currentUser?.email ?? '';
  const photoURL = profilePhoto || profile?.photoURL || user?.photoURL || auth.currentUser?.photoURL
    ? (profilePhoto || profile?.photoURL || user?.photoURL || auth.currentUser?.photoURL)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F3F35&color=fff&size=200`;
  const defaultCover = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
  const displayCover = coverPhoto || profile?.coverPhotoURL || defaultCover;

  const handlePickImage = async (type: 'profile' | 'cover') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const pickedUri = result.assets[0].uri;
      if (type === 'profile') setProfilePhoto(pickedUri);
      else setCoverPhoto(pickedUri);

      setUploadingImage(true);
      try {
        const url = await uploadTripImage(pickedUri);
        if (type === 'profile') setProfilePhoto(url);
        else setCoverPhoto(url);
      } catch (e: any) {
        console.warn('Remote upload failed, local preview preserved:', e);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSave = async () => {
    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) {
      Alert.alert('Sign In Required', 'Please sign in to update your profile.');
      return;
    }
    setSaving(true);
    try {
      const trimmedName = name.trim();
      const trimmedBio = bio.trim();

      const updates: Partial<UserProfile> = {
        displayName: trimmedName || 'Explorer',
        bio: trimmedBio,
      };
      if (profilePhoto) updates.photoURL = profilePhoto;
      if (coverPhoto) updates.coverPhotoURL = coverPhoto;

      // 1. Save to Firestore (creates or merges without throwing)
      await updateUserProfile(currentUid, updates);

      // 2. Update Firebase Auth Profile (name + photo)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: trimmedName || auth.currentUser.displayName,
          photoURL: profilePhoto || auth.currentUser.photoURL,
        });
      }

      // 3. Update Redux auth state so all screens update immediately
      if (user) {
        dispatch(
          setUser({
            ...user,
            displayName: trimmedName || user.displayName,
            photoURL: profilePhoto || user.photoURL,
          })
        );
      }

      await loadProfile();
      setEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); }
          catch (err: any) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  // Derived stats
  const confirmedTrips = bookings.filter(b => b.status === 'Confirmed').length;
  const pendingTrips = bookings.filter(b => b.status === 'Pending').length;

  if (loadingProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          id="edit-profile-btn"
          style={[styles.editBtn, editing && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => {
            if (editing) { handleSave(); }
            else { setEditing(true); }
          }}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={[styles.editBtnText, editing && { color: '#fff' }]}>
                {editing ? 'Save' : 'Edit'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}>

        {/* Cover Photo */}
        <View style={styles.coverSection}>
          <Image source={{ uri: displayCover as string }} style={styles.coverImage} />
          {editing && (
            <TouchableOpacity style={styles.editCoverBtn} onPress={() => handlePickImage('cover')} disabled={uploadingImage}>
              <Text style={styles.editCoverTxt}>📷 Edit Cover</Text>
            </TouchableOpacity>
          )}
          {uploadingImage && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}
        </View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: photoURL as string }} style={styles.avatar} />
            {editing && (
              <TouchableOpacity style={styles.editAvatarBtn} onPress={() => handlePickImage('profile')} disabled={uploadingImage}>
                <Text style={styles.editAvatarTxt}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Role badge moved here so it flows better */}
          {user?.role === 'admin' && (
            <View style={[styles.adminBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}>
              <Text style={[styles.adminBadgeTxt, { color: colors.primary }]}>⭐ Admin Account</Text>
            </View>
          )}

          {editing ? (
            <TextInput
              style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.primary }]}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textMuted}
              placeholder="Your name"
            />
          ) : (
            <Text style={styles.name}>{displayName}</Text>
          )}

          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { num: String(confirmedTrips), label: 'Confirmed\nTrips' },
            { num: String(pendingTrips), label: 'Pending\nTrips' },
            { num: String(bookmarks.length), label: 'Saved\nPlaces' },
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About Me</Text>
          {editing ? (
            <TextInput
              style={[styles.bioInput, { color: colors.textSecondary }]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textMuted}
              placeholder="Tell us about yourself..."
            />
          ) : (
            <Text style={styles.bioText}>{bio || 'No bio yet.'}</Text>
          )}
        </View>

        {/* My Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>My Bookings</Text>
          {bookings.length === 0 && (
            <Text style={[styles.bioText, { color: colors.textMuted }]}>No bookings yet. Join a trip!</Text>
          )}
          {bookings.slice(0, 5).map(b => (
            <View key={b.id} style={[styles.bookingRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bookingTitle, { color: colors.text }]}>{b.tripTitle}</Text>
                <Text style={[styles.bookingDate, { color: colors.textMuted }]}>{b.date}</Text>
              </View>
              <View style={[styles.statusPill, {
                backgroundColor:
                  b.status === 'Confirmed' ? '#10b981' + '22' :
                  b.status === 'Cancelled' ? colors.error + '22' : '#f59e0b22'
              }]}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: Typography.weight.semiBold,
                  color: b.status === 'Confirmed' ? '#10b981' :
                         b.status === 'Cancelled' ? colors.error : '#f59e0b'
                }}>{b.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Travel Interests</Text>
          <View style={styles.tagsRow}>
            {(profile?.interests ?? DEFAULT_INTERESTS).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings & Preferences */}
        <TouchableOpacity
          id="profile-settings-btn"
          style={styles.settingsRowBtn}
          onPress={() => navigation.navigate('Menu')}
          activeOpacity={0.7}
        >
          <View style={styles.settingsRowLeft}>
            <View style={[styles.settingsIconCircle, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={{ fontSize: 16 }}>⚙️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>Settings & Preferences</Text>
              <Text style={[styles.settingsSubtitle, { color: colors.textMuted }]}>Dark mode, notifications, account</Text>
            </View>
          </View>
          <Text style={[styles.settingsChevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity id="sign-out-btn" style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      paddingTop: 60,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.background,
      zIndex: 10,
    },
    headerTitle: { fontSize: 24, fontWeight: Typography.weight.heavy, color: c.text },
    editBtn: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      minWidth: 60,
      alignItems: 'center',
    },
    editBtnText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semiBold, color: c.textSecondary },
    scroll: { paddingBottom: 40 },

    adminBadge: {
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      borderWidth: 1,
      alignSelf: 'center',
    },
    adminBadgeTxt: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semiBold },

    coverSection: { width: '100%', height: 180, position: 'relative' },
    coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    editCoverBtn: {
      position: 'absolute', right: Spacing.md, bottom: Spacing.md,
      backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    editCoverTxt: { color: '#fff', fontSize: Typography.size.sm, fontWeight: Typography.weight.medium },
    uploadOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
    },

    avatarSection: { alignItems: 'center', marginTop: -44, paddingHorizontal: Spacing.xl },
    avatarWrapper: { position: 'relative', marginBottom: Spacing.sm },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: c.background },
    editAvatarBtn: {
      position: 'absolute', bottom: 0, right: 0,
      backgroundColor: c.surface, width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
    },
    editAvatarTxt: { fontSize: 14 },

    name: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.heavy, color: c.text, marginBottom: 2, textAlign: 'center' },
    nameInput: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.heavy, borderBottomWidth: 1, textAlign: 'center', marginBottom: 2, paddingVertical: 2, minWidth: 180 },
    email: { fontSize: Typography.size.sm, color: c.textSecondary },

    statsRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.xl,
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      paddingVertical: Spacing.xl,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      marginBottom: Spacing.xl,
    },
    statCard: { flex: 1, alignItems: 'center', gap: Spacing.xs },
    statDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: c.border },
    statNum: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.heavy, color: c.primary },
    statLabel: { fontSize: Typography.size.xs, color: c.textMuted, textAlign: 'center', lineHeight: 16 },

    section: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl },
    sectionLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semiBold, color: c.textMuted, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.8 },
    bioText: { fontSize: Typography.size.base, color: c.textSecondary, lineHeight: 24 },
    bioInput: { fontSize: Typography.size.base, backgroundColor: c.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, lineHeight: 22 },

    bookingRow: { paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
    bookingTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semiBold },
    bookingDate: { fontSize: Typography.size.xs, marginTop: 2 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    tag: { backgroundColor: c.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    tagText: { fontSize: Typography.size.sm, color: c.textSecondary },

    settingsRowBtn: {
      marginHorizontal: Spacing.xl,
      marginBottom: Spacing.lg,
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      padding: Spacing.base,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    settingsRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      flex: 1,
    },
    settingsIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsTitle: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semiBold,
    },
    settingsSubtitle: {
      fontSize: Typography.size.xs,
      marginTop: 2,
    },
    settingsChevron: {
      fontSize: 22,
      fontWeight: '300',
    },

    signOutBtn: {
      marginHorizontal: Spacing.xl,
      backgroundColor: 'rgba(255,59,48,0.08)',
      borderRadius: Radius.xl,
      paddingVertical: Spacing.base,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,59,48,0.2)',
    },
    signOutText: { fontSize: Typography.size.base, fontWeight: Typography.weight.semiBold, color: '#FF3B30' },
  });
}
