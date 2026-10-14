import React, { useState, useRef, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [activeDivisionTab, setActiveDivisionTab] = useState<string>('All');
  const [isSharing, setIsSharing] = useState<boolean>(false);
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

  const divisionsList = useMemo(() => ['All', ...Object.keys(groupedDistricts)], [groupedDistricts]);

  // ── Toggle a district ────────────────────────────────────────────────────
  const toggleDistrict = (name: string) => {
    setSelectedDistricts(prev =>
      prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]
    );
  };

  const toggleDivision = (divisionDistricts: typeof districtsData.districts) => {
    const names = divisionDistricts.map(d => d.name);
    const allSelected = names.every(n => selectedDistricts.includes(n));
    if (allSelected) {
      setSelectedDistricts(prev => prev.filter(n => !names.includes(n)));
    } else {
      setSelectedDistricts(prev => Array.from(new Set([...prev, ...names])));
    }
  };

  const selectAll = () => {
    setSelectedDistricts(districtsData.districts.map(d => d.name));
  };

  const clearAll = () => setSelectedDistricts([]);

  // ── Save map as image ────────────────────────────────────────────────────
  const saveImage = async () => {
    try {
      if (!mapRef.current) {
        Alert.alert('Notice', 'Map is not ready yet. Please wait a moment.');
        return;
      }

      setIsSharing(true);
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
    } finally {
      setIsSharing(false);
    }
  };

  const percent = Math.round((selectedDistricts.length / 64) * 100);

  // Filter divisions based on selected tab
  const displayedDivisions = useMemo(() => {
    if (activeDivisionTab === 'All') return Object.entries(groupedDistricts);
    return Object.entries(groupedDistricts).filter(([div]) => div === activeDivisionTab);
  }, [activeDivisionTab, groupedDistricts]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backBtnArrow}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>আমার দেখা বাংলাদেশ</Text>
            <Text style={styles.headerSub}>Personal Travel Footprint</Text>
          </View>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterNum}>{selectedDistricts.length}</Text>
          <Text style={styles.counterDen}>/64</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 20) + 32 }]}
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
              fillColor={isDark ? colors.surfaceElevated : '#E5E7EB'}
              selectedColor={colors.primary}
              strokeColor={colors.background}
              strokeWidth={0.8}
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
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={selectAll}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select all 64 districts"
          >
            <Text style={styles.actionBtnText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            onPress={clearAll}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Clear all districts"
          >
            <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.saveBtn]}
            onPress={saveImage}
            disabled={isSharing}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Share your Bangladesh map image"
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>📤 Share Map</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Division Jump Filters ─────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>FILTER BY DIVISION</Text>
          <Text style={styles.sectionSub}>{displayedDivisions.length} region{displayedDivisions.length > 1 ? 's' : ''}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.divisionTabsScroll}
        >
          {divisionsList.map(div => {
            const isActive = activeDivisionTab === div;
            return (
              <TouchableOpacity
                key={div}
                onPress={() => setActiveDivisionTab(div)}
                style={[styles.divTab, isActive && styles.divTabActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.divTabTxt, isActive && styles.divTabTxtActive]}>
                  {div}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── District list ───────────────────────────────────────────────── */}
        {displayedDivisions.map(([division, districts]) => {
          const selectedCount = districts.filter(d => selectedDistricts.includes(d.name)).length;
          const allDivisionSelected = selectedCount === districts.length;
          return (
            <View key={division} style={styles.divisionCard}>
              <View style={styles.divisionHeader}>
                <View>
                  <Text style={styles.divisionName}>{division} Division</Text>
                  <Text style={styles.divisionMeta}>{selectedCount} of {districts.length} visited</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleDivision(districts)}
                  style={[
                    styles.divBatchBtn,
                    allDivisionSelected && styles.divBatchBtnActive
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.divBatchBtnText, allDivisionSelected && styles.divBatchBtnTextActive]}>
                    {allDivisionSelected ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
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
                      accessibilityLabel={`${d.name}, ${selected ? 'visited' : 'not visited'}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
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
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtnArrow: {
      fontSize: 28,
      color: c.text,
      lineHeight: 32,
      marginTop: -2,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: Typography.weight.heavy,
      color: c.text,
      letterSpacing: -0.5,
    },
    headerSub: {
      fontSize: Typography.size.xs,
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
      fontSize: 26,
      fontWeight: Typography.weight.heavy,
      color: primary,
    },
    counterDen: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.medium,
      color: primary,
      opacity: 0.7,
    },
    scroll: {
      paddingHorizontal: Spacing.lg,
    },
    mapCard: {
      backgroundColor: cardBg,
      borderRadius: Radius.xl,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        android: {
          elevation: 4,
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
      height: 6,
      backgroundColor: c.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: primary,
      borderRadius: 3,
    },
    progressText: {
      fontSize: Typography.size.xs,
      color: primary,
      fontWeight: Typography.weight.bold,
      minWidth: 85,
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
      paddingVertical: Spacing.sm + 4,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
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
      backgroundColor: isDark ? c.surfaceElevated : '#1F2937',
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontWeight: Typography.weight.bold,
      fontSize: Typography.size.sm,
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
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    sectionSub: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
    },
    divisionTabsScroll: {
      gap: Spacing.xs,
      paddingBottom: Spacing.md,
    },
    divTab: {
      paddingHorizontal: Spacing.base,
      paddingVertical: 7,
      borderRadius: Radius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    divTabActive: {
      backgroundColor: primary,
      borderColor: primary,
    },
    divTabTxt: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semiBold,
      color: c.textSecondary,
    },
    divTabTxtActive: {
      color: c.textInverse,
      fontWeight: Typography.weight.bold,
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
      fontSize: Typography.size.base,
      fontWeight: Typography.weight.bold,
      color: c.text,
    },
    divisionMeta: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
      marginTop: 2,
    },
    divBatchBtn: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: Radius.md,
      backgroundColor: c.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    divBatchBtnActive: {
      backgroundColor: primary + '20',
      borderColor: primary,
    },
    divBatchBtnText: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semiBold,
      color: c.textSecondary,
    },
    divBatchBtnTextActive: {
      color: primary,
      fontWeight: Typography.weight.bold,
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
      paddingVertical: 7,
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
      fontWeight: Typography.weight.bold,
    },
  });
}
