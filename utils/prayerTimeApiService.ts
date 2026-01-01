
import { UserLocation } from './locationService';

/**
 * Prayer Time API Service - Fetches city-specific prayer times from Aladhan API
 * 
 * This service uses the Aladhan API (https://aladhan.com/prayer-times-api) to fetch
 * accurate, city-specific prayer times based on the user's exact GPS coordinates.
 * 
 * Unlike calculation-based methods that use broad regional parameters, this API
 * provides prayer times that are specific to the user's exact location.
 */

export interface ApiPrayerTimes {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  sunrise?: Date;
  sunset?: Date;
  midnight?: Date;
}

export interface ApiPrayerTimesResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Sunset: string;
      Maghrib: string;
      Isha: string;
      Imsak: string;
      Midnight: string;
      Firstthird: string;
      Lastthird: string;
    };
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
        };
        month: {
          number: number;
          en: string;
        };
        year: string;
      };
      hijri: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
          ar: string;
        };
        month: {
          number: number;
          en: string;
          ar: string;
        };
        year: string;
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: {
        id: number;
        name: string;
        params: any;
      };
      latitudeAdjustmentMethod: string;
      midnightMode: string;
      school: string;
      offset: any;
    };
  };
}

/**
 * Calculation methods supported by Aladhan API
 * These are more accurate than broad regional calculations
 */
export const API_CALCULATION_METHODS = {
  // Method 2: Islamic Society of North America (ISNA)
  ISNA: 2,
  // Method 1: University of Islamic Sciences, Karachi
  Karachi: 1,
  // Method 3: Muslim World League
  MWL: 3,
  // Method 4: Umm Al-Qura University, Makkah
  UmmAlQura: 4,
  // Method 5: Egyptian General Authority of Survey
  Egyptian: 5,
  // Method 7: Institute of Geophysics, University of Tehran
  Tehran: 7,
  // Method 8: Gulf Region
  Gulf: 8,
  // Method 9: Kuwait
  Kuwait: 9,
  // Method 10: Qatar
  Qatar: 10,
  // Method 11: Majlis Ugama Islam Singapura, Singapore
  Singapore: 11,
  // Method 12: Union Organization islamic de France
  France: 12,
  // Method 13: Diyanet İşleri Başkanlığı, Turkey
  Turkey: 13,
  // Method 14: Spiritual Administration of Muslims of Russia
  Russia: 14,
  // Method 15: Moonsighting Committee Worldwide
  Moonsighting: 15,
  // Method 16: Dubai (unofficial)
  Dubai: 16,
};

/**
 * Map our internal calculation method names to Aladhan API method IDs
 */
export function mapCalculationMethodToApiId(methodName: string): number {
  const mapping: Record<string, number> = {
    'NorthAmerica': API_CALCULATION_METHODS.ISNA,
    'MuslimWorldLeague': API_CALCULATION_METHODS.MWL,
    'Egyptian': API_CALCULATION_METHODS.Egyptian,
    'Karachi': API_CALCULATION_METHODS.Karachi,
    'UmmAlQura': API_CALCULATION_METHODS.UmmAlQura,
    'Dubai': API_CALCULATION_METHODS.Dubai,
    'Qatar': API_CALCULATION_METHODS.Qatar,
    'Kuwait': API_CALCULATION_METHODS.Kuwait,
    'MoonsightingCommittee': API_CALCULATION_METHODS.Moonsighting,
    'Singapore': API_CALCULATION_METHODS.Singapore,
    'Tehran': API_CALCULATION_METHODS.Tehran,
    'Turkey': API_CALCULATION_METHODS.Turkey,
  };

  return mapping[methodName] || API_CALCULATION_METHODS.ISNA;
}

/**
 * Fetch prayer times from Aladhan API for a specific location
 * 
 * @param location - User's GPS coordinates
 * @param methodId - Calculation method ID (defaults to ISNA)
 * @param date - Date for which to fetch prayer times (defaults to today)
 * @returns Prayer times for the specified location and date
 */
export async function fetchPrayerTimesFromApi(
  location: UserLocation,
  methodId: number = API_CALCULATION_METHODS.ISNA,
  date?: Date
): Promise<ApiPrayerTimes> {
  try {
    const targetDate = date || new Date();
    const timestamp = Math.floor(targetDate.getTime() / 1000);

    // Build API URL with coordinates and method
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.latitude}&longitude=${location.longitude}&method=${methodId}`;

    console.log('🌐 Fetching prayer times from Aladhan API...');
    console.log('📍 Location:', {
      lat: location.latitude.toFixed(4),
      lng: location.longitude.toFixed(4),
    });
    console.log('🔗 API URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: ApiPrayerTimesResponse = await response.json();

    if (data.code !== 200 || data.status !== 'OK') {
      throw new Error(`API returned error: ${data.status}`);
    }

    console.log('✅ Prayer times fetched successfully from API');
    console.log('📍 Location confirmed:', {
      lat: data.data.meta.latitude,
      lng: data.data.meta.longitude,
      timezone: data.data.meta.timezone,
      method: data.data.meta.method.name,
    });

    // Parse the prayer times
    const timings = data.data.timings;
    const dateStr = data.data.date.gregorian.date;

    // Helper function to parse time string (format: "HH:MM")
    const parseTime = (timeStr: string): Date => {
      // Remove timezone info if present (e.g., "05:30 (EST)")
      const cleanTime = timeStr.split(' ')[0];
      const [hours, minutes] = cleanTime.split(':').map(Number);
      
      const date = new Date(targetDate);
      date.setHours(hours, minutes, 0, 0);
      
      return date;
    };

    const prayerTimes: ApiPrayerTimes = {
      fajr: parseTime(timings.Fajr),
      dhuhr: parseTime(timings.Dhuhr),
      asr: parseTime(timings.Asr),
      maghrib: parseTime(timings.Maghrib),
      isha: parseTime(timings.Isha),
      sunrise: parseTime(timings.Sunrise),
      sunset: parseTime(timings.Sunset),
      midnight: parseTime(timings.Midnight),
    };

    console.log('🕌 Prayer times:', {
      fajr: timings.Fajr,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
    });

    return prayerTimes;
  } catch (error) {
    console.error('❌ Error fetching prayer times from API:', error);
    throw error;
  }
}

/**
 * Fetch prayer times with automatic method selection based on location
 * 
 * This function can automatically select the best calculation method
 * based on the user's geographic location.
 * 
 * @param location - User's GPS coordinates
 * @param preferredMethod - Optional preferred calculation method
 * @returns Prayer times for the specified location
 */
export async function fetchPrayerTimesWithAutoMethod(
  location: UserLocation,
  preferredMethod?: string
): Promise<ApiPrayerTimes> {
  try {
    // If a preferred method is specified, use it
    if (preferredMethod) {
      const methodId = mapCalculationMethodToApiId(preferredMethod);
      return await fetchPrayerTimesFromApi(location, methodId);
    }

    // Otherwise, use ISNA as default (most widely accepted in North America)
    return await fetchPrayerTimesFromApi(location, API_CALCULATION_METHODS.ISNA);
  } catch (error) {
    console.error('❌ Error fetching prayer times with auto method:', error);
    throw error;
  }
}

/**
 * Get location name from coordinates using reverse geocoding API
 * 
 * @param location - User's GPS coordinates
 * @returns City name and country
 */
export async function getLocationNameFromApi(
  location: UserLocation
): Promise<string | null> {
  try {
    const url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`;

    const response = await fetch(url);
    const data: ApiPrayerTimesResponse = await response.json();

    if (data.code === 200 && data.status === 'OK') {
      const timezone = data.data.meta.timezone;
      // Extract city name from timezone (e.g., "America/Chicago" -> "Chicago")
      const parts = timezone.split('/');
      if (parts.length > 1) {
        return parts[parts.length - 1].replace(/_/g, ' ');
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting location name from API:', error);
    return null;
  }
}

/**
 * Validate API response and check if prayer times are reasonable
 * 
 * @param prayerTimes - Prayer times to validate
 * @returns True if prayer times are valid
 */
export function validatePrayerTimes(prayerTimes: ApiPrayerTimes): boolean {
  try {
    // Check if all required prayer times are present
    if (!prayerTimes.fajr || !prayerTimes.dhuhr || !prayerTimes.asr || 
        !prayerTimes.maghrib || !prayerTimes.isha) {
      console.error('❌ Missing required prayer times');
      return false;
    }

    // Check if prayer times are in correct order
    const times = [
      prayerTimes.fajr,
      prayerTimes.dhuhr,
      prayerTimes.asr,
      prayerTimes.maghrib,
      prayerTimes.isha,
    ];

    for (let i = 0; i < times.length - 1; i++) {
      if (times[i] >= times[i + 1]) {
        console.error('❌ Prayer times are not in correct order');
        return false;
      }
    }

    // Check if times are within reasonable bounds (not in the past or too far in future)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const time of times) {
      if (time > tomorrow) {
        console.error('❌ Prayer time is too far in the future');
        return false;
      }
    }

    console.log('✅ Prayer times validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error validating prayer times:', error);
    return false;
  }
}
