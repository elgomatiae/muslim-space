/**
 * LocationService - Get user's exact GPS location for accurate prayer times
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = '@user_location_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
  country?: string;
  accuracy?: number;
  timestamp: number;
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Check if location permission is granted
 */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

/**
 * Get cached location
 */
async function getCachedLocation(): Promise<UserLocation | null> {
  try {
    const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const location: UserLocation = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (24 hours)
    if (now - location.timestamp < CACHE_DURATION) {
      console.log('✅ Using cached location:', location.city);
      return location;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Cache location
 */
async function cacheLocation(location: UserLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
  } catch (error) {
    console.error('Error caching location:', error);
  }
}

/**
 * Get user's current location using GPS
 * Returns exact coordinates and city name for accurate prayer times
 */
export async function getCurrentLocation(useCache: boolean = true): Promise<UserLocation> {
  try {
    // Try cached location first
    if (useCache) {
      const cached = await getCachedLocation();
      if (cached) return cached;
    }

    // Check permission
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        const cached = await getCachedLocation();
        if (cached) return cached;
        throw new Error('Location permission is required for accurate prayer times');
      }
    }

    // Get GPS coordinates with high accuracy
    console.log('📍 Getting GPS location...');
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Reverse geocode to get city name
    let city = 'Unknown';
    let country: string | undefined;

    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        city = address.city || address.subregion || address.region || 'Unknown';
        country = address.country;
      }
    } catch (geocodeError) {
      console.warn('Could not get city name from coordinates');
    }

    const location: UserLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      city,
      country,
      accuracy: position.coords.accuracy || undefined,
      timestamp: Date.now(),
    };

    // Cache the location
    await cacheLocation(location);

    console.log(`✅ Location acquired: ${city} (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`);
    return location;
  } catch (error: any) {
    // Try cached location as fallback
    const cached = await getCachedLocation();
    if (cached) {
      console.log('⚠️ Using cached location due to error:', error.message);
      return cached;
    }

    throw new Error(error.message || 'Failed to get location');
  }
}

/**
 * Clear location cache
 */
export async function clearLocationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing location cache:', error);
  }
}
