import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../store';
import { setUser, UserRole } from '../store/slices/authSlice';
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
  const insets = useSafeAreaInsets();
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

  // Role metadata and portal entry details
  const currentRole = (user?.role || profile?.role || 'traveler') as UserRole;
  const isStaff = currentRole === 'admin' || currentRole === 'operator' || currentRole === 'moderator';

  const roleMeta = useMemo(() => {
    switch (currentRole) {
      case 'admin':
        return {
          label: 'Platform Administrator',
          color: '#8B5CF6',
          bg: '#8B5CF618',
          border: '#8B5CF644',
          portalTitle: 'Admin Management Console',
          portalDesc: 'Full platform access: tours, bookings, staff roles & audit trail',
          portalAction: 'Enter Admin Panel',
          roleTag: 'Super Admin',
        };
      case 'operator':
        return {
          label: 'Tour Operator',
          color: '#10B981',
          bg: '#10B98118',
          border: '#10B98144',
          portalTitle: 'Tour Operator Portal',
          portalDesc: 'Manage assigned itineraries, departures & tour bookings',
          portalAction: 'Enter Operator Portal',
          roleTag: 'Operator',
        };
      case 'moderator':
        return {
          label: 'Community Moderator',
          color: '#3B82F6',
          bg: '#3B82F618',
          border: '#3B82F644',
          portalTitle: 'Community Moderation Desk',
          portalDesc: 'Review reported content & enforce safety guidelines',
          portalAction: 'Enter Moderation Desk',
          roleTag: 'Moderator',
        };
      default:
        return {
          label: 'Explorer (Traveler)',
          color: colors.primary,
          bg: colors.primary + '14',
          border: colors.primary + '33',
          portalTitle: 'Operator & Admin Portal',
          portalDesc: 'Authorized tour operators and staff can access their control console',
          portalAction: 'Enter Admin Panel',
          roleTag: 'Staff Login',
        };
    }
  }, [currentRole, colors.primary]);
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
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Display name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const trimmedBio = bio.trim();

      const updates: Partial<UserProfile> = {
        displayName: trimmedName,
        bio: trimmedBio,
      };
      if (profilePhoto) updates.photoURL = profilePhoto;
      if (coverPhoto) updates.coverPhotoURL = coverPhoto;

      // 1. Save to Firestore (creates or merges without throwing)
      await updateUserProfile(currentUid, updates);

      // 2. Update Firebase Auth Profile (name + photo)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: trimmedName,
          photoURL: profilePhoto || auth.currentUser.photoURL,
        });
      }

      // 3. Update Redux auth state so all screens update immediately
      if (user) {
        dispatch(
          setUser({
            ...user,
            displayName: trimmedName,
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

  const handleCancelEdit = () => {
    setName(profile?.displayName ?? user?.displayName ?? 'Explorer');
    setBio(profile?.bio ?? 'Adventure seeker & travel enthusiast 🌏');
    setProfilePhoto(profile?.photoURL ?? user?.photoURL ?? null);
    setCoverPhoto(profile?.coverPhotoURL ?? null);
    setEditing(false);
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
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 50) }]}>
        {editing ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancelEdit}
            disabled={saving}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.headerTitle}>Profile</Text>
        )}

        <TouchableOpacity
          id="edit-profile-btn"
          style={[styles.editBtn, editing && { backgroundColor: '#FF9F0A', borderColor: '#FF9F0A' }]}
          onPress={() => {
            if (editing) { handleSave(); }
            else { setEditing(true); }
          }}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.editBtnText, editing && { color: '#fff', fontWeight: '800' }]}>
              {editing ? 'Save' : 'Edit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 85 }]}
        bounces={false}
      >

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

          {/* Prominent Role Badge */}
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: roleMeta.bg, borderColor: roleMeta.border },
            ]}
          >
            <Text style={[styles.roleBadgeTxt, { color: roleMeta.color }]}>
              {roleMeta.label}
            </Text>
          </View>

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
            { num: String(confirmedTrips), label: 'Confirmed\nTrips', onPress: undefined },
            { num: String(pendingTrips), label: 'Pending\nTrips', onPress: undefined },
            {
              num: String(bookmarks.length + (bookings.length ? 0 : 0)),
              label: 'Saved\nPlaces',
              onPress: () => (navigation as any).navigate('Saved'),
            },
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={s.onPress}
                disabled={!s.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </TouchableOpacity>
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
          {bookings.length === 0 ? (
            <View style={styles.emptyBookingsCard}>
              <Text style={{ fontSize: 26, marginBottom: 6 }}>🎒</Text>
              <Text style={[styles.emptyBookingTitle, { color: colors.text }]}>No booked tours yet</Text>
              <Text style={[styles.emptyBookingSubtitle, { color: colors.textMuted }]}>
                Join an upcoming curated tour across Bangladesh's most scenic destinations.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBookingBtn, { backgroundColor: colors.primary }]}
                onPress={() => (navigation as any).navigate('Places')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBookingBtnText}>Browse Tours →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookings.slice(0, 5).map(b => (
              <View key={b.id} style={[styles.bookingRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bookingTitle, { color: colors.text }]}>{b.tripTitle}</Text>
                  <Text style={[styles.bookingDate, { color: colors.textMuted }]}>{b.date}</Text>
                </View>
                <View style={[styles.statusPill, {
                  backgroundColor:
                    b.status === 'Confirmed' ? '#10b98122' :
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
            ))
          )}
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

        {/* Staff & Management Console Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {isStaff ? 'STAFF MANAGEMENT CONSOLE' : 'OPERATOR & ADMIN ACCESS'}
          </Text>
          <TouchableOpacity
            id="enter-admin-panel-btn"
            style={[
              styles.portalCard,
              {
                backgroundColor: isDark
                  ? (isStaff ? '#13211B' : colors.surface)
                  : (isStaff ? '#F3FAF6' : colors.surface),
                borderColor: isStaff ? roleMeta.border : colors.border,
              },
            ]}
            onPress={() => navigation.navigate('AdminDashboard')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={roleMeta.portalAction}
          >
            <View style={styles.portalCardTop}>
              <View style={[styles.portalIconBox, { backgroundColor: roleMeta.color + '20' }]}>
                <Text style={{ fontSize: 18, color: roleMeta.color, fontWeight: '800' }}>✦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.portalTitleRow}>
                  <Text style={[styles.portalTitle, { color: colors.text }]}>
                    {roleMeta.portalTitle}
                  </Text>
                  <View style={[styles.roleTagPill, { backgroundColor: roleMeta.color + '22' }]}>
                    <Text style={[styles.roleTagPillText, { color: roleMeta.color }]}>
                      {roleMeta.roleTag}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.portalSubtitle, { color: colors.textMuted }]}>
                  {roleMeta.portalDesc}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.portalCtaBar,
                { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              <Text style={[styles.portalCtaText, { color: roleMeta.color }]}>
                {roleMeta.portalAction}
              </Text>
              <Text style={[styles.portalCtaArrow, { color: roleMeta.color }]}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

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
    cancelBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
    },
    cancelBtnText: {
      fontSize: Typography.size.sm,
      fontWeight: '600',
    },
    emptyBookingsCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      marginTop: Spacing.xs,
    },
    emptyBookingTitle: {
      fontSize: Typography.size.base,
      fontWeight: '700',
      marginBottom: 4,
    },
    emptyBookingSubtitle: {
      fontSize: Typography.size.xs,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: Spacing.base,
      maxWidth: 260,
    },
    emptyBookingBtn: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
    },
    emptyBookingBtnText: {
      color: '#FFFFFF',
      fontSize: Typography.size.xs,
      fontWeight: '700',
    },
    scroll: { paddingBottom: 40 },

    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      borderWidth: 1,
      alignSelf: 'center',
    },
    roleBadgeTxt: {
      fontSize: Typography.size.xs,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    portalCard: {
      borderRadius: Radius.xl,
      borderWidth: 1.5,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    portalCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.base,
      gap: Spacing.md,
    },
    portalIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    portalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.xs,
      marginBottom: 3,
    },
    portalTitle: {
      fontSize: Typography.size.sm,
      fontWeight: '700',
      flex: 1,
    },
    roleTagPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radius.full,
    },
    roleTagPillText: {
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    portalSubtitle: {
      fontSize: Typography.size.xs,
      lineHeight: 16,
    },
    portalCtaBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    portalCtaText: {
      fontSize: Typography.size.xs,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    portalCtaArrow: {
      fontSize: 16,
      fontWeight: '800',
    },

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
