
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = '@cached_location';
const LOCATION_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const SIGNIFICANT_DISTANCE_CHANGE = 5000; // 5km in meters

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface LocationStatus {
  isEnabled: boolean;
  hasPermission: boolean;
  lastUpdate: number | null;
  accuracy: number | null;
  error: string | null;
}

/**
 * Enhanced location service - handles all location-related operations with improved accuracy
 */

// Check if location services are enabled on device
export async function isLocationEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.log('Error checking location services:', error);
    return false;
  }
}

// Check location permission status
export async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Error checking location permission:', error);
    return false;
  }
}

// Request location permission
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Error requesting location permission:', error);
    return false;
  }
}

// Get cached location
async function getCachedLocation(): Promise<UserLocation | null> {
  try {
    const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const location: UserLocation = JSON.parse(cached);
    
    // Check if cache is still valid (within 24 hours)
    const now = Date.now();
    if (now - location.timestamp < LOCATION_CACHE_EXPIRY) {
      console.log('Using cached location:', {
        lat: location.latitude.toFixed(4),
        lng: location.longitude.toFixed(4),
        accuracy: location.accuracy,
        age: Math.round((now - location.timestamp) / 1000 / 60) + ' minutes'
      });
      return location;
    }

    console.log('Cached location expired');
    return null;
  } catch (error) {
    console.log('Error reading cached location:', error);
    return null;
  }
}

// Save location to cache
async function cacheLocation(location: UserLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
    console.log('Location cached successfully:', {
      lat: location.latitude.toFixed(4),
      lng: location.longitude.toFixed(4),
      accuracy: location.accuracy
    });
  } catch (error) {
    console.log('Error caching location:', error);
  }
}

// Calculate distance between two coordinates (in meters)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Check if location has changed significantly
export async function hasLocationChangedSignificantly(
  newLocation: UserLocation
): Promise<boolean> {
  const cached = await getCachedLocation();
  if (!cached) return true;

  const distance = calculateDistance(
    cached.latitude,
    cached.longitude,
    newLocation.latitude,
    newLocation.longitude
  );

  console.log(`Location change: ${Math.round(distance)}m`);
  return distance > SIGNIFICANT_DISTANCE_CHANGE;
}

// Get user's current location with high accuracy
export async function getUserLocation(useHighAccuracy: boolean = true): Promise<UserLocation | null> {
  try {
    // First check if location services are enabled
    const servicesEnabled = await isLocationEnabled();
    if (!servicesEnabled) {
      console.log('Location services are disabled');
      return await getCachedLocation();
    }

    // Check permission
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      console.log('Location permission not granted');
      return await getCachedLocation();
    }

    // Try to get current position with high accuracy
    console.log('Getting current location with high accuracy...');
    const position = await Location.getCurrentPositionAsync({
      accuracy: useHighAccuracy 
        ? Location.Accuracy.High 
        : Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 0,
    });

    const location: UserLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy || undefined,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
    };

    // Cache the location
    await cacheLocation(location);

    console.log('Location retrieved successfully:', {
      lat: location.latitude.toFixed(4),
      lng: location.longitude.toFixed(4),
      accuracy: location.accuracy ? `${Math.round(location.accuracy)}m` : 'unknown'
    });
    
    return location;
  } catch (error) {
    console.log('Error getting current location:', error);
    // Return cached location as fallback
    return await getCachedLocation();
  }
}

// Get location with fallback to default (Mecca coordinates)
export async function getLocationWithFallback(): Promise<UserLocation> {
  const location = await getUserLocation();
  
  if (location) {
    return location;
  }

  // Default to Mecca coordinates if no location available
  console.log('Using default location (Mecca)');
  return {
    latitude: 21.4225,
    longitude: 39.8262,
    timestamp: Date.now(),
    accuracy: undefined,
  };
}

// Get last known location (faster but may be outdated)
export async function getLastKnownLocation(): Promise<UserLocation | null> {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      return await getCachedLocation();
    }

    const position = await Location.getLastKnownPositionAsync({
      maxAge: 300000, // 5 minutes
      requiredAccuracy: 100, // 100 meters
    });

    if (!position) {
      return await getCachedLocation();
    }

    const location: UserLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy || undefined,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
    };

    console.log('Last known location retrieved:', {
      lat: location.latitude.toFixed(4),
      lng: location.longitude.toFixed(4),
      accuracy: location.accuracy ? `${Math.round(location.accuracy)}m` : 'unknown'
    });

    return location;
  } catch (error) {
    console.log('Error getting last known location:', error);
    return await getCachedLocation();
  }
}

// Watch location changes (for real-time updates)
export async function watchLocation(
  callback: (location: UserLocation) => void,
  errorCallback?: (error: string) => void
): Promise<Location.LocationSubscription | null> {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      errorCallback?.('Location permission not granted');
      return null;
    }

    const servicesEnabled = await isLocationEnabled();
    if (!servicesEnabled) {
      errorCallback?.('Location services are disabled');
      return null;
    }

    console.log('Starting location watch...');
    
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 60000, // Update every minute
        distanceInterval: 100, // Or when moved 100 meters
      },
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy || undefined,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        };

        console.log('Location updated:', {
          lat: location.latitude.toFixed(4),
          lng: location.longitude.toFixed(4),
          accuracy: location.accuracy ? `${Math.round(location.accuracy)}m` : 'unknown'
        });

        // Cache the new location
        cacheLocation(location);
        
        // Call the callback
        callback(location);
      },
      (error) => {
        console.log('Location watch error:', error);
        errorCallback?.(error.message);
      }
    );

    return subscription;
  } catch (error) {
    console.log('Error starting location watch:', error);
    errorCallback?.(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Get location status
export async function getLocationStatus(): Promise<LocationStatus> {
  try {
    const isEnabled = await isLocationEnabled();
    const hasPermission = await checkLocationPermission();
    const cached = await getCachedLocation();

    return {
      isEnabled,
      hasPermission,
      lastUpdate: cached?.timestamp || null,
      accuracy: cached?.accuracy || null,
      error: null,
    };
  } catch (error) {
    return {
      isEnabled: false,
      hasPermission: false,
      lastUpdate: null,
      accuracy: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Clear cached location
export async function clearLocationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
    console.log('Location cache cleared');
  } catch (error) {
    console.log('Error clearing location cache:', error);
  }
}

// Format location for display
export function formatLocation(location: UserLocation): string {
  const lat = location.latitude.toFixed(4);
  const lng = location.longitude.toFixed(4);
  const accuracy = location.accuracy 
    ? ` (±${Math.round(location.accuracy)}m)` 
    : '';
  return `${lat}, ${lng}${accuracy}`;
}

// Get location name using reverse geocoding
export async function getLocationName(location: UserLocation): Promise<string | null> {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const addresses = await Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      const parts = [
        address.city,
        address.region,
        address.country,
      ].filter(Boolean);
      
      return parts.join(', ');
    }

    return null;
  } catch (error) {
    console.log('Error getting location name:', error);
    return null;
  }
}
