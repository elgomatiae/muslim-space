
/**
 * Prayer Time Helper Utilities
 * Ensures type-safe handling of prayer times throughout the app
 */

export interface PrayerTime {
  name: string;
  time: string | Date;
  date?: Date;
  isPast?: boolean;
}

/**
 * Safely converts a prayer time to a Date object
 */
export function toDate(time: string | Date | undefined | null): Date | null {
  if (!time) return null;
  
  if (time instanceof Date) {
    return time;
  }
  
  const parsed = new Date(time);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Safely formats a time for display
 */
export function formatPrayerTime(time: string | Date | undefined | null): string {
  const date = toDate(time);
  if (!date) return '--:--';
  
  try {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.error('Error formatting prayer time:', error);
    return '--:--';
  }
}

/**
 * Safely formats a full date and time
 */
export function formatFullDateTime(time: string | Date | undefined | null): string {
  const date = toDate(time);
  if (!date) return 'Invalid date';
  
  try {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting full date time:', error);
    return 'Invalid date';
  }
}

/**
 * Gets the next upcoming prayer
 */
export function getNextPrayer(prayers: PrayerTime[]): PrayerTime | null {
  if (!prayers || prayers.length === 0) return null;
  
  const now = new Date();
  
  for (const prayer of prayers) {
    // Try to get date from either 'date' property or 'time' property
    const prayerDate = prayer.date ? toDate(prayer.date) : toDate(prayer.time);
    if (prayerDate && prayerDate > now) {
      return prayer;
    }
  }
  
  return null;
}

/**
 * Formats time difference in a human-readable format
 */
export function formatTimeDifference(date: Date | string | null | undefined): string {
  const targetDate = toDate(date);
  if (!targetDate) return '--';
  
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) return '0m';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Checks if a prayer time has passed
 */
export function isPrayerTimePast(time: string | Date | undefined | null): boolean {
  const date = toDate(time);
  if (!date) return false;
  
  return date < new Date();
}

/**
 * Formats a date to YYYY-MM-DD format
 */
export function formatDateString(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return '';
  
  return d.toISOString().split('T')[0];
}

/**
 * Parses HH:MM time string and combines with today's date
 */
export function parseTimeString(timeString: string): Date | null {
  if (!timeString || typeof timeString !== 'string') return null;
  
  const parts = timeString.split(':');
  if (parts.length !== 2) return null;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  return date;
}
