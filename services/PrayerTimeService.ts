/**
 * PrayerTimeService - Calculate accurate prayer times based on exact GPS location
 * Uses the adhan library for astronomical calculations
 */

import { Coordinates, CalculationMethod, PrayerTimes, Madhab, HighLatitudeRule } from 'adhan';
import { UserLocation, getCurrentLocation } from './LocationService';
import { supabase } from '@/app/integrations/supabase/client';

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
  city: string;
  prayers: PrayerTime[];
  fajr: PrayerTime;
  dhuhr: PrayerTime;
  asr: PrayerTime;
  maghrib: PrayerTime;
  isha: PrayerTime;
}

/**
 * Format date to HH:MM string
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculate prayer times for a specific location and date
 * Uses astronomical calculations based on exact GPS coordinates
 */
export async function calculatePrayerTimes(
  location: UserLocation,
  date: Date = new Date()
): Promise<DailyPrayerTimes> {
  try {
    console.log('🕌 Calculating prayer times for:', location.city);
    console.log(`   Coordinates: ${location.latitude}, ${location.longitude}`);

    // Create coordinates from GPS location
    const coordinates = new Coordinates(location.latitude, location.longitude);

    // Use ISNA (North America) method as default - widely accepted
    const method = CalculationMethod.NorthAmerica();
    method.madhab = Madhab.Shafi; // Standard for Asr calculation
    method.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight; // For high latitude locations

    // Calculate prayer times using astronomical calculations
    const prayerTimes = new PrayerTimes(coordinates, date, method);

    // Create prayer time objects
    const fajr: PrayerTime = {
      name: 'Fajr',
      arabicName: 'الفجر',
      time: formatTime(prayerTimes.fajr),
      date: prayerTimes.fajr,
      completed: false,
    };

    const dhuhr: PrayerTime = {
      name: 'Dhuhr',
      arabicName: 'الظهر',
      time: formatTime(prayerTimes.dhuhr),
      date: prayerTimes.dhuhr,
      completed: false,
    };

    const asr: PrayerTime = {
      name: 'Asr',
      arabicName: 'العصر',
      time: formatTime(prayerTimes.asr),
      date: prayerTimes.asr,
      completed: false,
    };

    const maghrib: PrayerTime = {
      name: 'Maghrib',
      arabicName: 'المغرب',
      time: formatTime(prayerTimes.maghrib),
      date: prayerTimes.maghrib,
      completed: false,
    };

    const isha: PrayerTime = {
      name: 'Isha',
      arabicName: 'العشاء',
      time: formatTime(prayerTimes.isha),
      date: prayerTimes.isha,
      completed: false,
    };

    const prayers = [fajr, dhuhr, asr, maghrib, isha];
    const dateString = date.toISOString().split('T')[0];

    const result: DailyPrayerTimes = {
      date: dateString,
      location,
      city: location.city,
      prayers,
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
    };

    console.log('✅ Prayer times calculated:');
    console.log(`   Fajr: ${fajr.time}`);
    console.log(`   Dhuhr: ${dhuhr.time}`);
    console.log(`   Asr: ${asr.time}`);
    console.log(`   Maghrib: ${maghrib.time}`);
    console.log(`   Isha: ${isha.time}`);

    return result;
  } catch (error) {
    console.error('❌ Error calculating prayer times:', error);
    throw error;
  }
}

/**
 * Get prayer times for today using user's current location
 */
export async function getTodayPrayerTimes(userId?: string): Promise<DailyPrayerTimes> {
  try {
    // Get user's exact location
    const location = await getCurrentLocation();
    
    // Calculate prayer times
    const prayerTimes = await calculatePrayerTimes(location);

    // Save to database if userId provided
    if (userId) {
      try {
        await supabase.from('prayer_times').upsert({
          user_id: userId,
          date: prayerTimes.date,
          city: prayerTimes.city,
          latitude: location.latitude,
          longitude: location.longitude,
          fajr_time: prayerTimes.fajr.time,
          dhuhr_time: prayerTimes.dhuhr.time,
          asr_time: prayerTimes.asr.time,
          maghrib_time: prayerTimes.maghrib.time,
          isha_time: prayerTimes.isha.time,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        });
        console.log('✅ Prayer times saved to database');
      } catch (dbError: any) {
        // Non-critical - continue even if database save fails
        if (dbError.code !== 'PGRST205') {
          console.error('Could not save prayer times to database:', dbError);
        }
      }
    }

    return prayerTimes;
  } catch (error: any) {
    console.error('❌ Error getting prayer times:', error);
    throw error;
  }
}

/**
 * Get prayer times for tomorrow using user's current location
 */
export async function getTomorrowPrayerTimes(userId?: string): Promise<DailyPrayerTimes> {
  try {
    // Get user's exact location
    const location = await getCurrentLocation();
    
    // Calculate prayer times for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const prayerTimes = await calculatePrayerTimes(location, tomorrow);

    return prayerTimes;
  } catch (error: any) {
    console.error('❌ Error getting tomorrow prayer times:', error);
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

  // If all prayers have passed, return tomorrow's Fajr
  return null;
}

/**
 * Get time remaining until next prayer
 */
export function getTimeUntilNextPrayer(nextPrayer: PrayerTime): string {
  const now = new Date();
  const diff = nextPrayer.date.getTime() - now.getTime();

  if (diff <= 0) return 'Now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Mark a prayer as completed
 */
export async function markPrayerCompleted(
  userId: string,
  prayerName: string
): Promise<void> {
  try {
    console.log(`✅ Marking ${prayerName} as completed for user ${userId}`);
    
    // This will be integrated with Iman Tracker
    // For now, just log it
  } catch (error) {
    console.error('Error marking prayer as completed:', error);
  }
}
