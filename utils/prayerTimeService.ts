
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getUserLocation, 
  getLocationWithFallback, 
  UserLocation,
  hasLocationChangedSignificantly,
  getLastKnownLocation,
} from './locationService';

const PRAYER_TIMES_CACHE_KEY = '@prayer_times_cache';
const PRAYER_COMPLETION_KEY = '@prayer_completion';
const CALCULATION_METHOD_KEY = '@calculation_method';

export interface PrayerTime {
  name: string;
  arabicName: string;
  time: string;
  date: Date;
  completed: boolean;
}

export interface PrayerTimesData {
  prayers: PrayerTime[];
  date: string;
  location: UserLocation;
  calculationMethod: string;
}

const PRAYER_NAMES = {
  fajr: { english: 'Fajr', arabic: 'الفجر' },
  dhuhr: { english: 'Dhuhr', arabic: 'الظهر' },
  asr: { english: 'Asr', arabic: 'العصر' },
  maghrib: { english: 'Maghrib', arabic: 'المغرب' },
  isha: { english: 'Isha', arabic: 'العشاء' },
};

// Available calculation methods
export const CALCULATION_METHODS = {
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Egyptian General Authority',
  Karachi: 'University of Islamic Sciences, Karachi',
  UmmAlQura: 'Umm al-Qura University, Makkah',
  Dubai: 'Dubai',
  Qatar: 'Qatar',
  Kuwait: 'Kuwait',
  MoonsightingCommittee: 'Moonsighting Committee',
  Singapore: 'Singapore',
  NorthAmerica: 'Islamic Society of North America',
  Tehran: 'Institute of Geophysics, University of Tehran',
  Turkey: 'Turkey',
};

/**
 * Enhanced prayer time service - calculates and manages prayer times with improved accuracy
 */

// Get saved calculation method
export async function getCalculationMethod(): Promise<string> {
  try {
    const method = await AsyncStorage.getItem(CALCULATION_METHOD_KEY);
    return method || 'MuslimWorldLeague';
  } catch (error) {
    console.log('Error getting calculation method:', error);
    return 'MuslimWorldLeague';
  }
}

// Save calculation method
export async function saveCalculationMethod(method: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CALCULATION_METHOD_KEY, method);
    console.log('Calculation method saved:', method);
  } catch (error) {
    console.log('Error saving calculation method:', error);
  }
}

// Get calculation method parameters
function getCalculationParams(methodName: string): any {
  switch (methodName) {
    case 'Egyptian':
      return CalculationMethod.Egyptian();
    case 'Karachi':
      return CalculationMethod.Karachi();
    case 'UmmAlQura':
      return CalculationMethod.UmmAlQura();
    case 'Dubai':
      return CalculationMethod.Dubai();
    case 'Qatar':
      return CalculationMethod.Qatar();
    case 'Kuwait':
      return CalculationMethod.Kuwait();
    case 'MoonsightingCommittee':
      return CalculationMethod.MoonsightingCommittee();
    case 'Singapore':
      return CalculationMethod.Singapore();
    case 'NorthAmerica':
      return CalculationMethod.NorthAmerica();
    case 'Tehran':
      return CalculationMethod.Tehran();
    case 'Turkey':
      return CalculationMethod.Turkey();
    case 'MuslimWorldLeague':
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

// Format time to readable string
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Get today's date string (YYYY-MM-DD)
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Calculate prayer times for a location
export async function calculatePrayerTimes(
  location: UserLocation,
  methodName?: string
): Promise<PrayerTime[]> {
  try {
    console.log('Calculating prayer times for location:', {
      lat: location.latitude.toFixed(4),
      lng: location.longitude.toFixed(4),
      accuracy: location.accuracy ? `${Math.round(location.accuracy)}m` : 'unknown'
    });

    const coordinates = new Coordinates(location.latitude, location.longitude);
    const method = methodName || await getCalculationMethod();
    const params = getCalculationParams(method);
    const date = new Date();
    
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    const prayers: PrayerTime[] = [
      {
        name: PRAYER_NAMES.fajr.english,
        arabicName: PRAYER_NAMES.fajr.arabic,
        time: formatTime(prayerTimes.fajr),
        date: prayerTimes.fajr,
        completed: false,
      },
      {
        name: PRAYER_NAMES.dhuhr.english,
        arabicName: PRAYER_NAMES.dhuhr.arabic,
        time: formatTime(prayerTimes.dhuhr),
        date: prayerTimes.dhuhr,
        completed: false,
      },
      {
        name: PRAYER_NAMES.asr.english,
        arabicName: PRAYER_NAMES.asr.arabic,
        time: formatTime(prayerTimes.asr),
        date: prayerTimes.asr,
        completed: false,
      },
      {
        name: PRAYER_NAMES.maghrib.english,
        arabicName: PRAYER_NAMES.maghrib.arabic,
        time: formatTime(prayerTimes.maghrib),
        date: prayerTimes.maghrib,
        completed: false,
      },
      {
        name: PRAYER_NAMES.isha.english,
        arabicName: PRAYER_NAMES.isha.arabic,
        time: formatTime(prayerTimes.isha),
        date: prayerTimes.isha,
        completed: false,
      },
    ];

    console.log('Prayer times calculated successfully using', method);
    return prayers;
  } catch (error) {
    console.error('Error calculating prayer times:', error);
    throw error;
  }
}

// Get cached prayer times
async function getCachedPrayerTimes(): Promise<PrayerTimesData | null> {
  try {
    const cached = await AsyncStorage.getItem(PRAYER_TIMES_CACHE_KEY);
    if (!cached) return null;

    const data: PrayerTimesData = JSON.parse(cached);
    
    // Check if cache is for today
    if (data.date === getTodayString()) {
      // Convert date strings back to Date objects
      data.prayers = data.prayers.map(p => ({
        ...p,
        date: new Date(p.date),
      }));
      console.log('Using cached prayer times from', data.calculationMethod);
      return data;
    }

    console.log('Cached prayer times are outdated');
    return null;
  } catch (error) {
    console.log('Error reading cached prayer times:', error);
    return null;
  }
}

// Cache prayer times
async function cachePrayerTimes(data: PrayerTimesData): Promise<void> {
  try {
    await AsyncStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(data));
    console.log('Prayer times cached successfully');
  } catch (error) {
    console.log('Error caching prayer times:', error);
  }
}

// Get prayer completion status
async function getPrayerCompletionStatus(): Promise<Record<string, boolean>> {
  try {
    const today = getTodayString();
    const cached = await AsyncStorage.getItem(`${PRAYER_COMPLETION_KEY}_${today}`);
    if (!cached) return {};
    return JSON.parse(cached);
  } catch (error) {
    console.log('Error reading prayer completion status:', error);
    return {};
  }
}

// Save prayer completion status
export async function savePrayerCompletionStatus(completionStatus: Record<string, boolean>): Promise<void> {
  try {
    const today = getTodayString();
    await AsyncStorage.setItem(`${PRAYER_COMPLETION_KEY}_${today}`, JSON.stringify(completionStatus));
    console.log('Prayer completion status saved');
  } catch (error) {
    console.log('Error saving prayer completion status:', error);
  }
}

// Get prayer times (with caching and location awareness)
export async function getPrayerTimes(forceRefresh: boolean = false): Promise<PrayerTime[]> {
  try {
    // Try to get cached prayer times first (if not forcing refresh)
    if (!forceRefresh) {
      const cached = await getCachedPrayerTimes();
      if (cached) {
        // Check if location has changed significantly
        const currentLocation = await getLastKnownLocation();
        if (currentLocation) {
          const locationChanged = await hasLocationChangedSignificantly(currentLocation);
          if (locationChanged) {
            console.log('Location changed significantly, recalculating prayer times...');
            // Location changed, recalculate
            return await getPrayerTimes(true);
          }
        }

        // Apply completion status
        const completionStatus = await getPrayerCompletionStatus();
        cached.prayers = cached.prayers.map(p => ({
          ...p,
          completed: completionStatus[p.name.toLowerCase()] || false,
        }));
        return cached.prayers;
      }
    }

    // Calculate new prayer times
    console.log('Calculating fresh prayer times...');
    const location = await getLocationWithFallback();
    const method = await getCalculationMethod();
    const prayers = await calculatePrayerTimes(location, method);

    // Apply completion status
    const completionStatus = await getPrayerCompletionStatus();
    const prayersWithStatus = prayers.map(p => ({
      ...p,
      completed: completionStatus[p.name.toLowerCase()] || false,
    }));

    // Cache the prayer times
    await cachePrayerTimes({
      prayers: prayersWithStatus,
      date: getTodayString(),
      location,
      calculationMethod: method,
    });

    return prayersWithStatus;
  } catch (error) {
    console.error('Error getting prayer times:', error);
    // Return default prayer times as fallback
    return getDefaultPrayerTimes();
  }
}

// Refresh prayer times (force recalculation with fresh location)
export async function refreshPrayerTimes(): Promise<PrayerTime[]> {
  try {
    console.log('Refreshing prayer times with fresh location...');
    
    // Clear cache
    await AsyncStorage.removeItem(PRAYER_TIMES_CACHE_KEY);
    
    // Get fresh location with high accuracy
    const location = await getUserLocation(true);
    const finalLocation = location || await getLocationWithFallback();
    
    const method = await getCalculationMethod();
    const prayers = await calculatePrayerTimes(finalLocation, method);

    // Apply completion status
    const completionStatus = await getPrayerCompletionStatus();
    const prayersWithStatus = prayers.map(p => ({
      ...p,
      completed: completionStatus[p.name.toLowerCase()] || false,
    }));

    // Cache the new prayer times
    await cachePrayerTimes({
      prayers: prayersWithStatus,
      date: getTodayString(),
      location: finalLocation,
      calculationMethod: method,
    });

    return prayersWithStatus;
  } catch (error) {
    console.error('Error refreshing prayer times:', error);
    return await getPrayerTimes();
  }
}

// Get next prayer
export function getNextPrayer(prayers: PrayerTime[]): PrayerTime | null {
  const now = new Date();
  
  for (const prayer of prayers) {
    if (prayer.date > now) {
      return prayer;
    }
  }

  // If no prayer is left today, return Fajr (next day)
  return prayers[0] || null;
}

// Get current prayer (the one that just passed or is happening now)
export function getCurrentPrayer(prayers: PrayerTime[]): PrayerTime | null {
  const now = new Date();
  let currentPrayer: PrayerTime | null = null;
  
  for (const prayer of prayers) {
    if (prayer.date <= now) {
      currentPrayer = prayer;
    } else {
      break;
    }
  }

  return currentPrayer;
}

// Get time until prayer
export function getTimeUntilPrayer(prayer: PrayerTime): string {
  const now = new Date();
  const diff = prayer.date.getTime() - now.getTime();

  if (diff < 0) {
    return 'Passed';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Get time since prayer
export function getTimeSincePrayer(prayer: PrayerTime): string {
  const now = new Date();
  const diff = now.getTime() - prayer.date.getTime();

  if (diff < 0) {
    return 'Not yet';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  return `${minutes}m ago`;
}

// Get cached prayer times data (including location info)
export async function getCachedPrayerTimesData(): Promise<PrayerTimesData | null> {
  return await getCachedPrayerTimes();
}

// Clear prayer times cache
export async function clearPrayerTimesCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PRAYER_TIMES_CACHE_KEY);
    console.log('Prayer times cache cleared');
  } catch (error) {
    console.log('Error clearing prayer times cache:', error);
  }
}

// Default prayer times (fallback)
function getDefaultPrayerTimes(): PrayerTime[] {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return [
    {
      name: PRAYER_NAMES.fajr.english,
      arabicName: PRAYER_NAMES.fajr.arabic,
      time: '5:30 AM',
      date: new Date(today.getTime() + 5.5 * 60 * 60 * 1000),
      completed: false,
    },
    {
      name: PRAYER_NAMES.dhuhr.english,
      arabicName: PRAYER_NAMES.dhuhr.arabic,
      time: '12:45 PM',
      date: new Date(today.getTime() + 12.75 * 60 * 60 * 1000),
      completed: false,
    },
    {
      name: PRAYER_NAMES.asr.english,
      arabicName: PRAYER_NAMES.asr.arabic,
      time: '4:15 PM',
      date: new Date(today.getTime() + 16.25 * 60 * 60 * 1000),
      completed: false,
    },
    {
      name: PRAYER_NAMES.maghrib.english,
      arabicName: PRAYER_NAMES.maghrib.arabic,
      time: '6:30 PM',
      date: new Date(today.getTime() + 18.5 * 60 * 60 * 1000),
      completed: false,
    },
    {
      name: PRAYER_NAMES.isha.english,
      arabicName: PRAYER_NAMES.isha.arabic,
      time: '8:00 PM',
      date: new Date(today.getTime() + 20 * 60 * 60 * 1000),
      completed: false,
    },
  ];
}
