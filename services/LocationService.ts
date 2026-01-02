
/**
 * LocationService - Fresh implementation for accurate location tracking
 * Uses expo-location for GPS coordinates
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = '@location_cache';
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  accuracy?: number;
  timestamp: number;
}

interface CachedLocation extends UserLocation {
  cachedAt: number;
}

/**
 * Request location permissions from the user
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    console.log('Requesting location permission...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('Location permission status:', status);
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
    console.error('Error checking location permission:', error);
    return false;
  }
}

/**
 * Get cached location if available and not expired
 */
async function getCachedLocation(): Promise<UserLocation | null> {
  try {
    const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const cachedLocation: CachedLocation = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - cachedLocation.cachedAt < LOCATION_CACHE_DURATION) {
      console.log('Using cached location:', cachedLocation.city);
      return {
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        city: cachedLocation.city,
        country: cachedLocation.country,
        accuracy: cachedLocation.accuracy,
        timestamp: cachedLocation.timestamp,
      };
    }

    console.log('Cached location expired');
    return null;
  } catch (error) {
    console.error('Error reading cached location:', error);
    return null;
  }
}

/**
 * Cache location for future use
 */
async function cacheLocation(location: UserLocation): Promise<void> {
  try {
    const cachedLocation: CachedLocation = {
      ...location,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cachedLocation));
    console.log('Location cached successfully');
  } catch (error) {
    console.error('Error caching location:', error);
  }
}

/**
 * Get current user location with high accuracy
 */
export async function getCurrentLocation(useCache: boolean = true): Promise<UserLocation> {
  try {
    // Try to use cached location first
    if (useCache) {
      const cached = await getCachedLocation();
      if (cached) return cached;
    }

    // Check permission
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    console.log('Fetching current location...');

    // Get current position with high accuracy
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    console.log('Location obtained:', {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });

    // Reverse geocode to get city name
    let city: string | undefined;
    let country: string | undefined;

    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        city = address.city || address.subregion || address.region;
        country = address.country;
        console.log('Reverse geocoded:', { city, country });
      }
    } catch (geocodeError) {
      console.warn('Reverse geocoding failed:', geocodeError);
    }

    const location: UserLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      city,
      country,
      accuracy: position.coords.accuracy || undefined,
      timestamp: position.timestamp,
    };

    // Cache the location
    await cacheLocation(location);

    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    
    // Try to return cached location as fallback
    const cached = await getCachedLocation();
    if (cached) {
      console.log('Returning cached location as fallback');
      return cached;
    }

    throw error;
  }
}

/**
 * Clear cached location
 */
export async function clearLocationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
    console.log('Location cache cleared');
  } catch (error) {
    console.error('Error clearing location cache:', error);
  }
}

/**
 * Get location display name
 */
export function getLocationDisplayName(location: UserLocation): string {
  if (location.city && location.country) {
    return `${location.city}, ${location.country}`;
  }
  if (location.city) {
    return location.city;
  }
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
}
