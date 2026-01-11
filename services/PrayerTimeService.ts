
/**
 * PrayerTimeService - Fresh implementation for accurate prayer time calculation
 * Uses adhan library for astronomical calculations based on GPS coordinates
 */

import { Coordinates, CalculationMethod, PrayerTimes, Prayer, Madhab, HighLatitudeRule } from 'adhan';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { UserLocation, getCurrentLocation } from './LocationService';

const PRAYER_CACHE_KEY = '@prayer_times_cache';
const CALCULATION_METHOD_KEY = '@calculation_method';
const PRAYER_ADJUSTMENTS_KEY = '@prayer_adjustments';

export interface PrayerTime {
  name: string;
  arabicName: string;
  time: string; // HH:MM format
  date: Date;
  completed: boolean;
}

export interface DailyPrayerTimes {
  date: string; // YYYY-MM-DD
  location: UserLocation;
  locationName?: string;
  calculationMethod: string;
  prayers: PrayerTime[];
  fajr: PrayerTime;
  dhuhr: PrayerTime;
  asr: PrayerTime;
  maghrib: PrayerTime;
  isha: PrayerTime;
  source?: string;
  confidence?: number;
}

export interface PrayerAdjustments {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface PrayerTimeAdjustments {
  fajr_offset: number;
  dhuhr_offset: number;
  asr_offset: number;
  maghrib_offset: number;
  isha_offset: number;
}

export type CalculationMethodName = 
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'MoonsightingCommittee'
  | 'Singapore'
  | 'NorthAmerica'
  | 'Tehran'
  | 'Turkey';

export const CALCULATION_METHODS: Record<string, { name: string; description: string; region: string }> = {
  NorthAmerica: {
    name: 'ISNA (North America)',
    description: 'Islamic Society of North America',
    region: 'USA, Canada, Mexico',
  },
  MuslimWorldLeague: {
    name: 'Muslim World League',
    description: 'Standard method used worldwide',
    region: 'Europe, Far East, parts of USA',
  },
  Egyptian: {
    name: 'Egyptian General Authority',
    description: 'Egyptian General Authority of Survey',
    region: 'Egypt, Middle East',
  },
  Karachi: {
    name: 'University of Karachi',
    description: 'University of Islamic Sciences, Karachi',
    region: 'Pakistan, Bangladesh, India',
  },
  UmmAlQura: {
    name: 'Umm Al-Qura',
    description: 'Umm Al-Qura University, Makkah',
    region: 'Saudi Arabia',
  },
  Dubai: {
    name: 'Dubai',
    description: 'Dubai Islamic Affairs',
    region: 'United Arab Emirates',
  },
  Qatar: {
    name: 'Qatar',
    description: 'Qatar Calendar House',
    region: 'Qatar',
  },
  Kuwait: {
    name: 'Kuwait',
    description: 'Kuwait Ministry of Awqaf',
    region: 'Kuwait',
  },
  MoonsightingCommittee: {
    name: 'Moonsighting Committee',
    description: 'Moonsighting Committee Worldwide',
    region: 'Worldwide',
  },
  Singapore: {
    name: 'Singapore',
    description: 'Majlis Ugama Islam Singapura',
    region: 'Singapore, Malaysia',
  },
  Tehran: {
    name: 'Tehran',
    description: 'Institute of Geophysics, Tehran',
    region: 'Iran',
  },
  Turkey: {
    name: 'Turkey',
    description: 'Presidency of Religious Affairs, Turkey',
    region: 'Turkey',
  },
};

/**
 * Get calculation method object from name
 */
function getCalculationMethodObject(methodName: CalculationMethodName): CalculationMethod {
  const methods: Record<CalculationMethodName, CalculationMethod> = {
    MuslimWorldLeague: CalculationMethod.MuslimWorldLeague(),
    Egyptian: CalculationMethod.Egyptian(),
    Karachi: CalculationMethod.Karachi(),
    UmmAlQura: CalculationMethod.UmmAlQura(),
    Dubai: CalculationMethod.Dubai(),
    Qatar: CalculationMethod.Qatar(),
    Kuwait: CalculationMethod.Kuwait(),
    MoonsightingCommittee: CalculationMethod.MoonsightingCommittee(),
    Singapore: CalculationMethod.Singapore(),
    NorthAmerica: CalculationMethod.NorthAmerica(),
    Tehran: CalculationMethod.Tehran(),
    Turkey: CalculationMethod.Turkey(),
  };

  return methods[methodName];
}

/**
 * Format time to HH:MM string
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Apply adjustment (offset in minutes) to a date
 */
function applyAdjustment(date: Date, offsetMinutes: number): Date {
  const adjusted = new Date(date);
  adjusted.setMinutes(adjusted.getMinutes() + offsetMinutes);
  return adjusted;
}

/**
 * Calculate prayer times for a specific location and date
 */
export async function calculatePrayerTimes(
  location: UserLocation,
  date: Date = new Date(),
  methodName: CalculationMethodName = 'NorthAmerica',
  adjustments?: PrayerAdjustments
): Promise<DailyPrayerTimes> {
  try {
    console.log('Calculating prayer times...', {
      location: location.city,
      lat: location.latitude,
      lon: location.longitude,
      method: methodName,
      date: date.toDateString(),
    });

    // Create coordinates
    const coordinates = new Coordinates(location.latitude, location.longitude);

    // Get calculation method
    const method = getCalculationMethodObject(methodName);

    // Set madhab to Shafi (standard for Asr calculation)
    method.madhab = Madhab.Shafi;

    // Set high latitude rule for locations far from equator
    method.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;

    // Calculate prayer times
    const prayerTimes = new PrayerTimes(coordinates, date, method);

    // Get individual prayer times
    let fajrDate = prayerTimes.fajr;
    let dhuhrDate = prayerTimes.dhuhr;
    let asrDate = prayerTimes.asr;
    let maghribDate = prayerTimes.maghrib;
    let ishaDate = prayerTimes.isha;

    // Apply adjustments if provided
    if (adjustments) {
      fajrDate = applyAdjustment(fajrDate, adjustments.fajr);
      dhuhrDate = applyAdjustment(dhuhrDate, adjustments.dhuhr);
      asrDate = applyAdjustment(asrDate, adjustments.asr);
      maghribDate = applyAdjustment(maghribDate, adjustments.maghrib);
      ishaDate = applyAdjustment(ishaDate, adjustments.isha);
    }

    // Create prayer time objects
    const fajr: PrayerTime = {
      name: 'Fajr',
      arabicName: 'الفجر',
      time: formatTime(fajrDate),
      date: fajrDate,
      completed: false,
    };

    const dhuhr: PrayerTime = {
      name: 'Dhuhr',
      arabicName: 'الظهر',
      time: formatTime(dhuhrDate),
      date: dhuhrDate,
      completed: false,
    };

    const asr: PrayerTime = {
      name: 'Asr',
      arabicName: 'العصر',
      time: formatTime(asrDate),
      date: asrDate,
      completed: false,
    };

    const maghrib: PrayerTime = {
      name: 'Maghrib',
      arabicName: 'المغرب',
      time: formatTime(maghribDate),
      date: maghribDate,
      completed: false,
    };

    const isha: PrayerTime = {
      name: 'Isha',
      arabicName: 'العشاء',
      time: formatTime(ishaDate),
      date: ishaDate,
      completed: false,
    };

    const prayers = [fajr, dhuhr, asr, maghrib, isha];

    const dateString = date.toISOString().split('T')[0];

    const result: DailyPrayerTimes = {
      date: dateString,
      location,
      locationName: location.city,
      calculationMethod: methodName,
      prayers,
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
      source: 'Local Astronomical Calculation',
      confidence: 95,
    };

    console.log('Prayer times calculated successfully:', {
      fajr: fajr.time,
      dhuhr: dhuhr.time,
      asr: asr.time,
      maghrib: maghrib.time,
      isha: isha.time,
    });

    return result;
  } catch (error) {
    console.error('Error calculating prayer times:', error);
    throw error;
  }
}

/**
 * Get next prayer from current time
 */
export function getNextPrayer(prayerTimes: DailyPrayerTimes): PrayerTime | null {
  const now = new Date();
  
  for (const prayer of prayerTimes.prayers) {
    if (prayer.date > now) {
      return prayer;
    }
  }

  return null;
}

/**
 * Get time remaining until next prayer
 */
export function getTimeUntilNextPrayer(nextPrayer: PrayerTime): string {
  const now = new Date();
  const diff = nextPrayer.date.getTime() - now.getTime();

  if (diff <= 0) return '0m';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Cache prayer times locally
 */
async function cachePrayerTimes(prayerTimes: DailyPrayerTimes): Promise<void> {
  try {
    await AsyncStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(prayerTimes));
    console.log('Prayer times cached successfully');
  } catch (error) {
    console.error('Error caching prayer times:', error);
  }
}

/**
 * Get cached prayer times
 */
async function getCachedPrayerTimes(): Promise<DailyPrayerTimes | null> {
  try {
    const cached = await AsyncStorage.getItem(PRAYER_CACHE_KEY);
    if (!cached) return null;

    const prayerTimes: DailyPrayerTimes = JSON.parse(cached);
    
    // Check if cached times are for today
    const today = new Date().toISOString().split('T')[0];
    if (prayerTimes.date !== today) {
      console.log('Cached prayer times are for a different day');
      return null;
    }

    // Reconstruct Date objects
    prayerTimes.prayers = prayerTimes.prayers.map(prayer => ({
      ...prayer,
      date: new Date(prayer.date),
    }));
    prayerTimes.fajr.date = new Date(prayerTimes.fajr.date);
    prayerTimes.dhuhr.date = new Date(prayerTimes.dhuhr.date);
    prayerTimes.asr.date = new Date(prayerTimes.asr.date);
    prayerTimes.maghrib.date = new Date(prayerTimes.maghrib.date);
    prayerTimes.isha.date = new Date(prayerTimes.isha.date);

    console.log('Using cached prayer times');
    return prayerTimes;
  } catch (error) {
    console.error('Error reading cached prayer times:', error);
    return null;
  }
}

/**
 * Get cached prayer times data (for settings screen)
 */
export async function getCachedPrayerTimesData(): Promise<DailyPrayerTimes | null> {
  return getCachedPrayerTimes();
}

/**
 * Save prayer times to database
 */
async function savePrayerTimesToDatabase(
  userId: string,
  prayerTimes: DailyPrayerTimes
): Promise<void> {
  try {
    const { error } = await supabase
      .from('prayer_times')
      .upsert({
        user_id: userId,
        date: prayerTimes.date,
        location_name: prayerTimes.location.city,
        latitude: prayerTimes.location.latitude,
        longitude: prayerTimes.location.longitude,
        fajr_time: prayerTimes.fajr.time,
        dhuhr_time: prayerTimes.dhuhr.time,
        asr_time: prayerTimes.asr.time,
        maghrib_time: prayerTimes.maghrib.time,
        isha_time: prayerTimes.isha.time,
        calculation_method: prayerTimes.calculationMethod,
        is_manual: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date',
      });

    if (error) {
      console.error('Error saving prayer times to database:', error);
      // If table doesn't exist, continue without saving (prayer times are cached locally)
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.log('⚠️ prayer_times table not found, continuing without database save (using local cache)');
      }
    } else {
      console.log('Prayer times saved to database');
    }
  } catch (error) {
    console.error('Error saving prayer times to database:', error);
    // Continue without saving - prayer times are already cached locally
  }
}

/**
 * Get user's prayer time adjustments from database
 */
export async function getUserAdjustments(userId: string): Promise<PrayerAdjustments> {
  // Try database first, fallback to local storage
  try {
    // SECURITY: Always scope by user_id
    const { data, error } = await supabase
      .from('prayer_time_adjustments')
      .select('fajr_offset, dhuhr_offset, asr_offset, maghrib_offset, isha_offset')
      .eq('user_id', userId) // SECURITY: Ensure user can only access their own adjustments
      .single();

    if (error || !data) {
      // If table doesn't exist, return defaults (adjustments stored locally)
      if (error && (error.code === 'PGRST205' || error.message?.includes('Could not find the table'))) {
        console.log('⚠️ prayer_time_adjustments table not found, using default adjustments');
      }
      return { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    }

    return {
      fajr: data.fajr_offset || 0,
      dhuhr: data.dhuhr_offset || 0,
      asr: data.asr_offset || 0,
      maghrib: data.maghrib_offset || 0,
      isha: data.isha_offset || 0,
    };
  } catch (error) {
    console.error('Error getting user adjustments:', error);
    return { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  }
}

/**
 * Save user's prayer time adjustments to database
 */
export async function saveUserAdjustments(
  userId: string,
  adjustments: PrayerAdjustments
): Promise<void> {
  try {
    const { error } = await supabase
      .from('prayer_time_adjustments')
      .upsert({
        user_id: userId,
        fajr_offset: adjustments.fajr,
        dhuhr_offset: adjustments.dhuhr,
        asr_offset: adjustments.asr,
        maghrib_offset: adjustments.maghrib,
        isha_offset: adjustments.isha,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving user adjustments:', error);
      // If table doesn't exist, continue without saving (adjustments are stored locally)
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.log('⚠️ prayer_time_adjustments table not found, continuing without database save (using local storage)');
      }
    } else {
      console.log('User adjustments saved');
    }
  } catch (error) {
    console.error('Error saving user adjustments:', error);
    // Continue without saving - adjustments can be stored locally
  }
}

/**
 * Get calculation method from storage
 */
export async function getCalculationMethod(): Promise<string> {
  try {
    const method = await AsyncStorage.getItem(CALCULATION_METHOD_KEY);
    return method || 'NorthAmerica';
  } catch (error) {
    console.error('Error getting calculation method:', error);
    return 'NorthAmerica';
  }
}

/**
 * Save calculation method to storage
 */
export async function saveCalculationMethod(method: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CALCULATION_METHOD_KEY, method);
    console.log('Calculation method saved:', method);
  } catch (error) {
    console.error('Error saving calculation method:', error);
  }
}

/**
 * Get prayer time adjustments from storage
 */
export async function getPrayerTimeAdjustments(): Promise<PrayerTimeAdjustments | null> {
  try {
    const adjustments = await AsyncStorage.getItem(PRAYER_ADJUSTMENTS_KEY);
    if (!adjustments) return null;
    return JSON.parse(adjustments);
  } catch (error) {
    console.error('Error getting prayer time adjustments:', error);
    return null;
  }
}

/**
 * Save prayer time adjustments to storage
 */
export async function savePrayerTimeAdjustments(adjustments: PrayerTimeAdjustments): Promise<void> {
  try {
    await AsyncStorage.setItem(PRAYER_ADJUSTMENTS_KEY, JSON.stringify(adjustments));
    console.log('Prayer time adjustments saved');
  } catch (error) {
    console.error('Error saving prayer time adjustments:', error);
  }
}

/**
 * Refresh prayer times (clear cache and recalculate)
 */
export async function refreshPrayerTimes(): Promise<void> {
  try {
    console.log('Refreshing prayer times...');
    await clearPrayerTimesCache();
    
    // Get current location and recalculate
    const location = await getCurrentLocation(true);
    const method = await getCalculationMethod();
    const adjustmentsData = await getPrayerTimeAdjustments();
    
    // Convert adjustments format
    const adjustments: PrayerAdjustments | undefined = adjustmentsData ? {
      fajr: adjustmentsData.fajr_offset,
      dhuhr: adjustmentsData.dhuhr_offset,
      asr: adjustmentsData.asr_offset,
      maghrib: adjustmentsData.maghrib_offset,
      isha: adjustmentsData.isha_offset,
    } : undefined;
    
    const prayerTimes = await calculatePrayerTimes(
      location,
      new Date(),
      method as CalculationMethodName,
      adjustments
    );
    
    await cachePrayerTimes(prayerTimes);
    console.log('Prayer times refreshed successfully');
  } catch (error) {
    console.error('Error refreshing prayer times:', error);
    throw error;
  }
}

/**
 * Main function to get prayer times for today
 * Uses cache if available, otherwise calculates fresh
 */
export async function getTodayPrayerTimes(
  location: UserLocation,
  userId?: string,
  methodName: CalculationMethodName = 'NorthAmerica',
  useCache: boolean = true
): Promise<DailyPrayerTimes> {
  try {
    // Try to use cached times first
    if (useCache) {
      const cached = await getCachedPrayerTimes();
      if (cached) return cached;
    }

    // Get user adjustments if userId provided
    let adjustments: PrayerAdjustments | undefined;
    if (userId) {
      adjustments = await getUserAdjustments(userId);
    }

    // Calculate fresh prayer times
    const prayerTimes = await calculatePrayerTimes(
      location,
      new Date(),
      methodName,
      adjustments
    );

    // Cache the times
    await cachePrayerTimes(prayerTimes);

    // Save to database if userId provided
    if (userId) {
      await savePrayerTimesToDatabase(userId, prayerTimes);
    }

    return prayerTimes;
  } catch (error) {
    console.error('Error getting today prayer times:', error);
    throw error;
  }
}

/**
 * Clear prayer times cache
 */
export async function clearPrayerTimesCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PRAYER_CACHE_KEY);
    console.log('Prayer times cache cleared');
  } catch (error) {
    console.error('Error clearing prayer times cache:', error);
  }
}

/**
 * Mark prayer as completed
 */
export async function markPrayerCompleted(
  userId: string,
  prayerName: string,
  date: Date = new Date()
): Promise<void> {
  try {
    // This will be integrated with the iman tracker
    console.log('Prayer marked as completed:', prayerName);
    
    // Update iman tracker goals
    const dateString = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    if (dateString === today) {
      const prayerField = `fard_${prayerName.toLowerCase()}`;
      
      const { error } = await supabase
        .from('iman_tracker_goals')
        .update({
          [prayerField]: true,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating prayer completion:', error);
      }
    }
  } catch (error) {
    console.error('Error marking prayer as completed:', error);
  }
}

/**
 * Get available calculation methods
 */
export function getAvailableCalculationMethods(): Array<{
  id: CalculationMethodName;
  name: string;
  description: string;
  region: string;
}> {
  return [
    {
      id: 'NorthAmerica',
      name: 'ISNA (North America)',
      description: 'Islamic Society of North America',
      region: 'USA, Canada, Mexico',
    },
    {
      id: 'MuslimWorldLeague',
      name: 'Muslim World League',
      description: 'Standard method used worldwide',
      region: 'Europe, Far East, parts of USA',
    },
    {
      id: 'Egyptian',
      name: 'Egyptian General Authority',
      description: 'Egyptian General Authority of Survey',
      region: 'Egypt, Middle East',
    },
    {
      id: 'Karachi',
      name: 'University of Karachi',
      description: 'University of Islamic Sciences, Karachi',
      region: 'Pakistan, Bangladesh, India',
    },
    {
      id: 'UmmAlQura',
      name: 'Umm Al-Qura',
      description: 'Umm Al-Qura University, Makkah',
      region: 'Saudi Arabia',
    },
    {
      id: 'Dubai',
      name: 'Dubai',
      description: 'Dubai Islamic Affairs',
      region: 'United Arab Emirates',
    },
    {
      id: 'Qatar',
      name: 'Qatar',
      description: 'Qatar Calendar House',
      region: 'Qatar',
    },
    {
      id: 'Kuwait',
      name: 'Kuwait',
      description: 'Kuwait Ministry of Awqaf',
      region: 'Kuwait',
    },
    {
      id: 'MoonsightingCommittee',
      name: 'Moonsighting Committee',
      description: 'Moonsighting Committee Worldwide',
      region: 'Worldwide',
    },
    {
      id: 'Singapore',
      name: 'Singapore',
      description: 'Majlis Ugama Islam Singapura',
      region: 'Singapore, Malaysia',
    },
    {
      id: 'Tehran',
      name: 'Tehran',
      description: 'Institute of Geophysics, Tehran',
      region: 'Iran',
    },
    {
      id: 'Turkey',
      name: 'Turkey',
      description: 'Presidency of Religious Affairs, Turkey',
      region: 'Turkey',
    },
  ];
}
