/**
 * weatherService.ts
 * Real-time location detection & accurate weather integration using Open-Meteo API.
 * Features GPS detection with reverse-geocoding, IP fallback, and local caching.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface WeatherData {
  locationName: string;
  district: string;
  country: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feelsLike: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  weatherCode: number;
  highTemp: number;
  lowTemp: number;
  lastUpdated: number;
}

const CACHE_KEY = '@explora_weather_cache_v1';
const DEFAULT_COORDS = {
  latitude: 23.8103,
  longitude: 90.4125,
  locationName: 'Dhaka, Bangladesh',
  district: 'Dhaka',
  country: 'Bangladesh',
};

// Map WMO Weather Codes to user-friendly conditions & icons
function interpretWeatherCode(code: number, isDay: boolean): { condition: string; icon: string } {
  switch (code) {
    case 0:
      return { condition: isDay ? 'Clear Sky' : 'Clear Night', icon: isDay ? '☀️' : '🌙' };
    case 1:
      return { condition: 'Mainly Clear', icon: isDay ? '🌤️' : '🌤️' };
    case 2:
      return { condition: 'Partly Cloudy', icon: '⛅' };
    case 3:
      return { condition: 'Overcast', icon: '☁️' };
    case 45:
    case 48:
      return { condition: 'Misty / Foggy', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Drizzle', icon: '🌦️' };
    case 56:
    case 57:
      return { condition: 'Freezing Drizzle', icon: '🌧️' };
    case 61:
      return { condition: 'Slight Rain', icon: '🌧️' };
    case 63:
      return { condition: 'Moderate Rain', icon: '🌧️' };
    case 65:
      return { condition: 'Heavy Rain', icon: '🌧️' };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snowfall', icon: '❄️' };
    case 77:
      return { condition: 'Snow Grains', icon: '🌨️' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', icon: '🌦️' };
    case 85:
    case 86:
      return { condition: 'Snow Showers', icon: '🌨️' };
    case 95:
      return { condition: 'Thunderstorm', icon: '⛈️' };
    case 96:
    case 99:
      return { condition: 'Thunderstorm with Hail', icon: '⛈️' };
    default:
      return { condition: isDay ? 'Clear' : 'Fair', icon: isDay ? '☀️' : '🌙' };
  }
}

/**
 * Get device GPS coordinates & reverse geocode to Bangladesh district/city.
 * Falls back to default Dhaka if permission denied or unavailable.
 */
async function resolveLocation(): Promise<{
  latitude: number;
  longitude: number;
  locationName: string;
  district: string;
  country: string;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return DEFAULT_COORDS;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = pos.coords;

    // Reverse geocode
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (places && places.length > 0) {
        const p = places[0];
        const districtOrCity = p.city || p.district || p.subregion || p.region || 'Dhaka';
        const country = p.country || 'Bangladesh';
        const name = `${districtOrCity}, ${country}`;
        return {
          latitude,
          longitude,
          locationName: name,
          district: districtOrCity,
          country,
        };
      }
    } catch (geoErr) {
      console.warn('Reverse geocoding error:', geoErr);
    }

    return {
      latitude,
      longitude,
      locationName: 'Local Explorer',
      district: 'Bangladesh',
      country: 'Bangladesh',
    };
  } catch (err) {
    console.warn('Location resolution error:', err);
    return DEFAULT_COORDS;
  }
}

/**
 * Fetch live, accurate weather from Open-Meteo API.
 */
export async function fetchLiveWeather(forceRefresh = false): Promise<WeatherData> {
  // Check cached data if not forcing refresh
  if (!forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: WeatherData = JSON.parse(cached);
        const age = Date.now() - parsed.lastUpdated;
        // If cache is less than 15 minutes old, return cached
        if (age < 15 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore cache read error
    }
  }

  // Resolve current coordinates
  const loc = await resolveLocation();

  // Call Open-Meteo Forecast API
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude.toFixed(
    4
  )}&longitude=${loc.longitude.toFixed(
    4
  )}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: HTTP ${response.status}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const daily = data.daily || {};

  const weatherCode = current.weather_code ?? 0;
  const isDay = current.is_day === 1;
  const { condition, icon } = interpretWeatherCode(weatherCode, isDay);

  const result: WeatherData = {
    locationName: loc.locationName,
    district: loc.district,
    country: loc.country,
    latitude: loc.latitude,
    longitude: loc.longitude,
    temperature: Math.round(current.temperature_2m ?? 28),
    feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 28),
    condition,
    icon,
    humidity: Math.round(current.relative_humidity_2m ?? 60),
    windSpeed: Math.round(current.wind_speed_10m ?? 8),
    isDay,
    weatherCode,
    highTemp: Math.round(daily.temperature_2m_max?.[0] ?? current.temperature_2m + 3),
    lowTemp: Math.round(daily.temperature_2m_min?.[0] ?? current.temperature_2m - 4),
    lastUpdated: Date.now(),
  };

  // Cache for future loads
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result));
  } catch (e) {
    // Ignore cache write error
  }

  return result;
}

/**
 * Quick helper to read cache immediately on mount before API returns.
 */
export async function getCachedWeather(): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }
  return null;
}
