import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleDarkMode, toggleNotifications, toggleLocation } from '../store/slices/settingsSlice';

// ─── Sub-components ──────────────────────────────────────────────────────────

type SettingRowProps = {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  id: string;
  colors: AppColors;
};

function SettingRow({ label, description, value, onToggle, id, colors }: SettingRowProps) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      <View style={rowStyles.info}>
        <Text style={[rowStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[rowStyles.desc, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Switch
        nativeID={id}
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceElevated, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textMuted}
        ios_backgroundColor={colors.surfaceElevated}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.base, paddingHorizontal: Spacing.base, borderBottomWidth: StyleSheet.hairlineWidth },
  info: { flex: 1, marginRight: Spacing.md },
  label: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium },
  desc: { fontSize: Typography.size.xs, marginTop: 2 },
});

type MenuItemProps = {
  label: string;
  danger?: boolean;
  onPress?: () => void;
  colors: AppColors;
  isLast?: boolean;
};

function MenuItem({ label, danger = false, onPress, colors, isLast }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        miStyles.item,
        { borderBottomColor: colors.border },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={[miStyles.label, { color: danger ? colors.error : colors.text }]}>{label}</Text>
      {!danger && <Text style={[miStyles.chevron, { color: colors.textMuted }]}>›</Text>}
    </TouchableOpacity>
  );
}

const miStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.base, paddingHorizontal: Spacing.base, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { flex: 1, fontSize: Typography.size.base },
  chevron: { fontSize: 20, lineHeight: 22 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const dispatch = useAppDispatch();
  const { darkMode, notifications, locationEnabled } = useAppSelector(s => s.settings);
  const { user } = useAppSelector(s => s.auth);
  const isAdmin = user?.role === 'admin';
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Preferences */}
        <Text style={styles.groupLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow id="dark-mode-toggle" label="Dark Mode" description="Switch between dark and light appearance" value={darkMode} onToggle={() => dispatch(toggleDarkMode())} colors={colors} />
          <SettingRow id="notifications-toggle" label="Notifications" description="Trip updates, new destinations, offers" value={notifications} onToggle={() => dispatch(toggleNotifications())} colors={colors} />
          <SettingRow id="location-toggle" label="Location" description="Use your location for nearby suggestions" value={locationEnabled} onToggle={() => dispatch(toggleLocation())} colors={colors} />
        </View>

        {/* Account */}
        <Text style={styles.groupLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <MenuItem onPress={() => (navigation as any).navigate('Profile')} label="Edit Profile" colors={colors} />
          <MenuItem label="Privacy & Security" colors={colors} />
          <MenuItem label="Payment Methods" colors={colors} />
          <MenuItem label="Language & Region" colors={colors} isLast />
        </View>

        {/* Features */}
        <Text style={styles.groupLabel}>FEATURES</Text>
        <View style={styles.card}>
          <MenuItem
            label="My Bangladesh Map"
            colors={colors}
            onPress={() => navigation.navigate('Heatmap')}
            isLast
          />
        </View>

        {/* Support */}
        <Text style={styles.groupLabel}>SUPPORT</Text>
        <View style={styles.card}>
          <MenuItem label="Help & Feedback" colors={colors} />
          <MenuItem label="Rate the App" colors={colors} />
          <MenuItem label="Terms of Service" colors={colors} />
          <MenuItem label="Privacy Policy" colors={colors} isLast />
        </View>

        {/* Danger */}
        <Text style={styles.groupLabel}>ACCOUNT ACTIONS</Text>
        <View style={styles.card}>
          <MenuItem label="Log Out" colors={colors} onPress={undefined} />
          <MenuItem label="Delete Account" colors={colors} danger isLast />
        </View>

        {/* Admin - only visible to admins */}
        {isAdmin && (
          <>
            <Text style={styles.groupLabel}>ADMIN</Text>
            <View style={styles.card}>
              <MenuItem
                label="Admin Dashboard"
                colors={colors}
                onPress={() => navigation.navigate('AdminDashboard')}
                isLast
              />
            </View>
          </>
        )}

        <Text style={styles.versionText}>Explora v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles Factory ──────────────────────────────────────────────────────────

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      paddingTop: 60,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: Typography.weight.heavy,
      color: c.text,
    },
    scroll: { paddingTop: Spacing.xl },
    groupLabel: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      color: c.textMuted,
      letterSpacing: 1,
      marginHorizontal: Spacing.xl,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    card: {
      marginHorizontal: Spacing.xl,
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
      marginBottom: Spacing.md,
    },
    versionText: {
      textAlign: 'center',
      fontSize: Typography.size.xs,
      color: c.textMuted,
      marginTop: Spacing.xl,
    },
  });
}
