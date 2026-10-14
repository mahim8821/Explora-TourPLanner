import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { WeatherData } from '../services/weatherService';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

interface WeatherModalProps {
  visible: boolean;
  onClose: () => void;
  weather: WeatherData | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function WeatherModal({
  visible,
  onClose,
  weather,
  loading,
  onRefresh,
}: WeatherModalProps) {
  const { colors, isDark } = useTheme();

  if (!weather) return null;

  const getTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#14211A' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <Text style={[styles.districtTitle, { color: colors.text }]}>
                      {weather.district}
                    </Text>
                    <View style={[styles.livePill, { backgroundColor: '#10B98122' }]}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  </View>
                  <Text style={[styles.countryText, { color: colors.textMuted }]}>
                    {weather.locationName}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}
                >
                  <Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Main Weather Hero in Modal */}
              <View style={styles.weatherHero}>
                <Text style={styles.heroIcon}>{weather.icon}</Text>
                <View style={styles.tempWrap}>
                  <Text style={[styles.temperatureText, { color: colors.text }]}>
                    {weather.temperature}°
                  </Text>
                  <Text style={[styles.conditionTitle, { color: colors.primary }]}>
                    {weather.condition}
                  </Text>
                </View>
              </View>

              {/* Temperature Range Bar */}
              <View
                style={[
                  styles.tempRangeBar,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                ]}
              >
                <Text style={[styles.rangeItem, { color: colors.textSecondary }]}>
                  High: <Text style={{ fontWeight: '800', color: colors.text }}>{weather.highTemp}°C</Text>
                </Text>
                <View style={[styles.barDivider, { backgroundColor: colors.border }]} />
                <Text style={[styles.rangeItem, { color: colors.textSecondary }]}>
                  Low: <Text style={{ fontWeight: '800', color: colors.text }}>{weather.lowTemp}°C</Text>
                </Text>
                <View style={[styles.barDivider, { backgroundColor: colors.border }]} />
                <Text style={[styles.rangeItem, { color: colors.textSecondary }]}>
                  Feels: <Text style={{ fontWeight: '800', color: colors.text }}>{weather.feelsLike}°C</Text>
                </Text>
              </View>

              {/* Metric Grid */}
              <View style={styles.metricsGrid}>
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Humidity</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{weather.humidity}%</Text>
                </View>

                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Wind Speed</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{weather.windSpeed} km/h</Text>
                </View>

                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Time of Day</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {weather.isDay ? 'Daytime' : 'Night'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Forecast Data</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>Open-Meteo</Text>
                </View>
              </View>

              {/* Footer info & Refresh button */}
              <View style={styles.footerRow}>
                <Text style={[styles.updatedText, { color: colors.textMuted }]}>
                  Updated {getTimeAgo(weather.lastUpdated)}
                </Text>

                <TouchableOpacity
                  style={[styles.refreshBtn, { backgroundColor: colors.primary }]}
                  onPress={onRefresh}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.refreshBtnText}>Refresh Forecast</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationPin: {
    fontSize: 16,
  },
  districtTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  countryText: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  weatherHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    marginVertical: Spacing.sm,
  },
  heroIcon: {
    fontSize: 48,
  },
  tempWrap: {
    flex: 1,
  },
  temperatureText: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 48,
  },
  conditionTitle: {
    fontSize: Typography.size.base,
    fontWeight: '700',
  },
  tempRangeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    marginVertical: Spacing.md,
  },
  rangeItem: {
    fontSize: Typography.size.xs,
  },
  barDivider: {
    width: 1,
    height: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: Typography.size.base,
    fontWeight: '800',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
    paddingTop: Spacing.md,
  },
  updatedText: {
    fontSize: 11,
    fontWeight: '500',
  },
  refreshBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  refreshBtnText: {
    color: '#FFF',
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
});
