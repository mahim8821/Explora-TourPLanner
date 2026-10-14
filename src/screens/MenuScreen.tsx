import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Switch, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleDarkMode, toggleNotifications, toggleLocation } from '../store/slices/settingsSlice';

// ─── Sub-components ──────────────────────────────────────────────────────────

type SettingRowProps = {
  icon?: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  id: string;
  colors: AppColors;
};

function SettingRow({ icon, label, description, value, onToggle, id, colors }: SettingRowProps) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      {icon ? <Text style={rowStyles.icon}>{icon}</Text> : null}
      <View style={rowStyles.info}>
        <Text style={[rowStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[rowStyles.desc, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Switch
        nativeID={id}
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceElevated, true: '#FF9F0A80' }}
        thumbColor={value ? '#FF9F0A' : colors.textMuted}
        ios_backgroundColor={colors.surfaceElevated}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: { fontSize: 18, marginRight: Spacing.md },
  info: { flex: 1, marginRight: Spacing.md },
  label: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium },
  desc: { fontSize: Typography.size.xs, marginTop: 2 },
});

type MenuItemProps = {
  icon?: string;
  label: string;
  danger?: boolean;
  onPress?: () => void;
  colors: AppColors;
  isLast?: boolean;
};

function MenuItem({ icon, label, danger = false, onPress, colors, isLast }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        miStyles.item,
        { borderBottomColor: colors.border },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? <Text style={miStyles.icon}>{icon}</Text> : null}
      <Text style={[miStyles.label, { color: danger ? colors.error : colors.text }]}>{label}</Text>
      {!danger && <Text style={[miStyles.chevron, { color: colors.textMuted }]}>›</Text>}
    </TouchableOpacity>
  );
}

const miStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: { fontSize: 18, marginRight: Spacing.md },
  label: { flex: 1, fontSize: Typography.size.base, fontWeight: Typography.weight.medium },
  chevron: { fontSize: 20, lineHeight: 22 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { darkMode, notifications, locationEnabled } = useAppSelector(s => s.settings);
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSignOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Explora?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your bookmarks, explored districts, and profile data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Support Contact', 'Please contact support@explorabangladesh.com to finalize account deletion.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 54) }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 85 },
        ]}
      >
        {/* Preferences */}
        <Text style={styles.groupLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow
            id="dark-mode-toggle"
            label="Dark Mode"
            description="Switch between dark and light appearance"
            value={darkMode}
            onToggle={() => dispatch(toggleDarkMode())}
            colors={colors}
          />
          <SettingRow
            id="notifications-toggle"
            label="Notifications"
            description="Trip updates, new destinations, and offers"
            value={notifications}
            onToggle={() => dispatch(toggleNotifications())}
            colors={colors}
          />
          <SettingRow
            id="location-toggle"
            label="Location Services"
            description="Suggest nearby spots and local Bangladesh routes"
            value={locationEnabled}
            onToggle={() => dispatch(toggleLocation())}
            colors={colors}
          />
        </View>

        {/* Features */}
        <Text style={styles.groupLabel}>EXPLORER FEATURES</Text>
        <View style={styles.card}>
          <MenuItem
            label="My Bangladesh Map (Heatmap)"
            colors={colors}
            onPress={() => navigation.navigate('Heatmap')}
          />
          <MenuItem
            label="Community Stories & Feed"
            colors={colors}
            onPress={() => (navigation as any).navigate('Feed')}
            isLast
          />
        </View>

        {/* Account */}
        <Text style={styles.groupLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <MenuItem
            onPress={() => (navigation as any).navigate('Profile')}
            label="Edit Profile"
            colors={colors}
          />
          <MenuItem
            label="Privacy & Security"
            colors={colors}
            onPress={() => Alert.alert('Privacy & Security', 'Your data is secured via Firebase Authentication and end-to-end security rules.')}
          />
          <MenuItem
            label="Payment & Currency (BDT / ৳)"
            colors={colors}
            onPress={() => Alert.alert('Payment Methods', 'Explora supports bKash, Nagad, and local card gateways for tour bookings.')}
          />
          <MenuItem
            label="Language & Region (Bangladesh)"
            colors={colors}
            onPress={() => Alert.alert('Language', 'Explora is optimized for English and Bengali (বাংলা).')}
            isLast
          />
        </View>

        {/* Support */}
        <Text style={styles.groupLabel}>SUPPORT & LEGAL</Text>
        <View style={styles.card}>
          <MenuItem
            label="Help & Feedback"
            colors={colors}
            onPress={() => Alert.alert('Help & Support', 'Reach our travel support team at support@explorabangladesh.com')}
          />
          <MenuItem
            label="Rate Explora on App Store"
            colors={colors}
            onPress={() => Alert.alert('Thank You!', 'We appreciate your review and support for domestic tourism.')}
          />
          <MenuItem
            label="Terms of Service"
            colors={colors}
            onPress={() => Alert.alert('Terms of Service', 'Standard terms apply for domestic trip bookings and community uploads.')}
          />
          <MenuItem
            label="Privacy Policy"
            colors={colors}
            onPress={() => Alert.alert('Privacy Policy', 'We value your privacy and never sell personal location data.')}
            isLast
          />
        </View>


        {/* Account Actions */}
        <Text style={styles.groupLabel}>ACCOUNT ACTIONS</Text>
        <View style={styles.card}>
          <MenuItem
            label="Log Out"
            colors={colors}
            onPress={handleSignOut}
          />
          <MenuItem
            label="Delete Account"
            colors={colors}
            danger
            onPress={handleDeleteAccount}
            isLast
          />
        </View>

        <Text style={styles.versionText}>Explora v1.0.0 •Mahim</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles Factory ──────────────────────────────────────────────────────────

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: Typography.weight.heavy,
      color: c.text,
    },
    scroll: { paddingTop: Spacing.base },
    groupLabel: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      color: c.textMuted,
      letterSpacing: 1,
      marginHorizontal: Spacing.xl,
      marginBottom: Spacing.xs,
      marginTop: Spacing.base,
    },
    card: {
      marginHorizontal: Spacing.xl,
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    versionText: {
      textAlign: 'center',
      fontSize: Typography.size.xs,
      color: c.textMuted,
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
  });
}

