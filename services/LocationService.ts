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
 * Check if location services are enabled on the device
 */
export async function isLocationEnabled(): Promise<boolean> {
  try {
    if (typeof Location.hasServicesEnabledAsync === 'function') {
      return await Location.hasServicesEnabledAsync();
    }
    // Fallback: if we can't check, assume enabled if permission is granted
    return await hasLocationPermission();
  } catch (error) {
    console.warn('Error checking if location services are enabled:', error);
    // Default to true to allow the attempt
    return true;
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
        if (cached) {
          console.log('⚠️ Using cached location - permission not granted');
          return cached;
        }
        throw new Error('Location permission is required for accurate prayer times');
      }
    }

    // Check if location services are enabled
    const servicesEnabled = await isLocationEnabled();
    if (!servicesEnabled) {
      const cached = await getCachedLocation();
      if (cached) {
        console.log('⚠️ Using cached location - location services disabled');
        return cached;
      }
      throw new Error('Location services are disabled. Please enable location services in your device settings.');
    }

    // Get GPS coordinates with high accuracy, with timeout
    console.log('📍 Getting GPS location...');
    let position;
    try {
      // Try high accuracy first
      position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Location request timed out')), 15000)
        ),
      ]) as Location.LocationObject;
    } catch (highAccuracyError: any) {
      console.warn('High accuracy location failed, trying balanced accuracy:', highAccuracyError.message);
      // Fallback to balanced accuracy
      try {
        position = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Location request timed out')), 10000)
          ),
        ]) as Location.LocationObject;
      } catch (balancedError: any) {
        console.warn('Balanced accuracy location failed, trying low accuracy:', balancedError.message);
        // Last resort: try low accuracy
        try {
          position = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Location request timed out')), 8000)
            ),
          ]) as Location.LocationObject;
        } catch (lowAccuracyError: any) {
          // All accuracy levels failed
          const cached = await getCachedLocation();
          if (cached) {
            console.log('⚠️ Using cached location - GPS unavailable');
            return cached;
          }
          throw new Error('Unable to get location. Please check that location services are enabled and GPS signal is available.');
        }
      }
    }

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
    console.error('❌ Error getting location:', error);
    
    // Try cached location as fallback
    const cached = await getCachedLocation();
    if (cached) {
      console.log('⚠️ Using cached location due to error:', error.message || error);
      return cached;
    }

    // Provide more helpful error messages based on error type
    const errorMessage = error.message || String(error);
    if (errorMessage.includes('kCLErrorDomain') || errorMessage.includes('error 0')) {
      throw new Error('Location services are unavailable. Please check that location services are enabled in your device settings and that you have a GPS signal.');
    } else if (errorMessage.includes('permission')) {
      throw new Error('Location permission is required for accurate prayer times. Please grant location permission in your device settings.');
    } else if (errorMessage.includes('timeout')) {
      throw new Error('Location request timed out. Please ensure you have GPS signal and try again.');
    } else {
      throw new Error(errorMessage || 'Failed to get location. Please check your location settings and try again.');
    }
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
