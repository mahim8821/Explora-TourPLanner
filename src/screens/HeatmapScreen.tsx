import React, { useState, useRef, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, StatusBar, Platform,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import BangladeshMap from '../components/BangladeshMap';
import districtsData from '../data/districts.json';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

// ── Division mapping ─────────────────────────────────────────────────────────
const DIVISION_NAMES: Record<string, string> = {
  '1': 'Barishal',
  '2': 'Chattogram',
  '3': 'Dhaka',
  '4': 'Khulna',
  '5': 'Rajshahi',
  '6': 'Rangpur',
  '7': 'Sylhet',
  '8': 'Mymensingh',
};


export default function HeatmapScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const mapRef = useRef<View>(null);
  const navigation = useNavigation();

  // ── Group districts by division ──────────────────────────────────────────
  const groupedDistricts = useMemo(() => {
    const groups: Record<string, typeof districtsData.districts> = {};
    districtsData.districts.forEach(d => {
      const div = DIVISION_NAMES[d.division_id] ?? 'Other';
      if (!groups[div]) groups[div] = [];
      groups[div].push(d);
    });
    return groups;
  }, []);

  // ── Toggle a district ────────────────────────────────────────────────────
  const toggleDistrict = (name: string) => {
    setSelectedDistricts(prev =>
      prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]
    );
  };

  const selectAll = () => {
    setSelectedDistricts(districtsData.districts.map(d => d.name));
  };

  const clearAll = () => setSelectedDistricts([]);

  // ── Save map as image ────────────────────────────────────────────────────
  const saveImage = async () => {
    try {
      if (!mapRef.current) {
        Alert.alert('Error', 'Map is not ready yet.');
        return;
      }

      const uri = await captureRef(mapRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Bangladesh Heatmap',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on your device.');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Share Failed', err?.message ?? 'Could not share the image.');
    }
  };

  const percent = Math.round((selectedDistricts.length / 64) * 100);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={{ fontSize: 26, color: colors.text, lineHeight: 28 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>আমার দেখা বাংলাদেশ</Text>
            <Text style={styles.headerSub}>My Bangladesh</Text>
          </View>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterNum}>{selectedDistricts.length}</Text>
          <Text style={styles.counterDen}>/64</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Map card ───────────────────────────────────────────────────── */}
        <View style={styles.mapCard}>
          <View
            ref={mapRef}
            collapsable={false}
            style={styles.mapInner}
          >
            <BangladeshMap
              width={340}
              height={430}
              selectedDistricts={selectedDistricts}
              onDistrictPress={toggleDistrict}
              fillColor={isDark ? colors.surfaceElevated : colors.border}
              selectedColor={colors.primary}
              strokeColor={colors.background}
              strokeWidth={0.7}
            />
          </View>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
            <Text style={styles.progressText}>{percent}% explored</Text>
          </View>
        </View>

        {/* ── Action buttons ──────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={selectAll}>
            <Text style={styles.actionBtnText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={clearAll}>
            <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={saveImage}>
            <Text style={styles.saveBtnText}>📤 Share Image</Text>
          </TouchableOpacity>
        </View>

        {/* ── District list ───────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Select Districts</Text>
        {Object.entries(groupedDistricts).map(([division, districts]) => {
          const selectedCount = districts.filter(d => selectedDistricts.includes(d.name)).length;
          return (
            <View key={division} style={styles.divisionCard}>
              <View style={styles.divisionHeader}>
                <Text style={styles.divisionName}>{division}</Text>
                <View style={styles.divisionCount}>
                  <Text style={styles.divisionCountText}>{selectedCount}/{districts.length}</Text>
                </View>
              </View>
              <View style={styles.badgesWrap}>
                {districts.map(d => {
                  const selected = selectedDistricts.includes(d.name);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => toggleDistrict(d.name)}
                      style={[styles.badge, selected && styles.badgeActive]}
                      activeOpacity={0.7}
                    >
                      {selected && <View style={styles.badgeDot} />}
                      <Text style={[styles.badgeText, selected && styles.badgeTextActive]}>
                        {d.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(c: AppColors, isDark: boolean) {
  const cardBg = c.surface;
  const primary = c.primary;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    backBtn: {
      marginRight: Spacing.sm,
      padding: Spacing.xs,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: Typography.weight.heavy,
      color: c.text,
      letterSpacing: -0.5,
    },
    headerSub: {
      fontSize: Typography.size.sm,
      color: c.textMuted,
      marginTop: 2,
    },
    counterBadge: {
      flexDirection: 'row',
      alignItems: 'baseline',
      backgroundColor: c.surfaceElevated,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.xl,
    },
    counterNum: {
      fontSize: 28,
      fontWeight: Typography.weight.heavy,
      color: primary,
    },
    counterDen: {
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.medium,
      color: primary,
      opacity: 0.7,
    },
    scroll: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    mapCard: {
      backgroundColor: cardBg,
      borderRadius: Radius.xl,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    mapInner: {
      backgroundColor: c.surfaceElevated,
      borderRadius: Radius.lg,
      overflow: 'hidden',
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      width: '100%',
      paddingHorizontal: Spacing.sm,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      backgroundColor: c.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: primary,
      borderRadius: 2,
    },
    progressText: {
      fontSize: Typography.size.xs,
      color: primary,
      fontWeight: Typography.weight.medium,
      minWidth: 70,
      textAlign: 'right',
    },
    actionRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: primary,
      paddingVertical: Spacing.sm + 2,
      borderRadius: Radius.lg,
      alignItems: 'center',
    },
    actionBtnText: {
      color: c.textInverse,
      fontWeight: Typography.weight.bold,
      fontSize: Typography.size.sm,
    },
    actionBtnOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: primary,
    },
    actionBtnOutlineText: {
      color: primary,
    },
    saveBtn: {
      flex: 1.3,
      backgroundColor: c.textSecondary,
    },
    saveBtnText: {
      color: c.textInverse,
      fontWeight: Typography.weight.bold,
      fontSize: Typography.size.sm,
    },
    sectionTitle: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      color: c.textMuted,
      letterSpacing: 1,
      marginBottom: Spacing.md,
      textTransform: 'uppercase',
    },
    divisionCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    divisionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    divisionName: {
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.bold,
      color: c.text,
    },
    divisionCount: {
      backgroundColor: c.surfaceElevated,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.md,
    },
    divisionCountText: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      color: primary,
    },
    badgesWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    badgeActive: {
      backgroundColor: primary,
      borderColor: primary,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.textInverse,
    },
    badgeText: {
      fontSize: Typography.size.sm,
      color: c.textSecondary,
    },
    badgeTextActive: {
      color: c.textInverse,
      fontWeight: Typography.weight.medium,
    },
  });
}
