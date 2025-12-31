
# Location-Based Prayer Times Guide

## Overview

The Muslim Life Hub app now uses **accurate location tracking** to calculate precise prayer times based on your current location. This guide explains how the system works and how to ensure you get the most accurate prayer times.

## Features

### 1. **High-Accuracy Location Tracking**
- Uses GPS with high accuracy mode for precise coordinates
- Automatically caches location to reduce battery usage
- Falls back to last known location when GPS is unavailable
- Shows location accuracy in meters (±XXm)

### 2. **Automatic Prayer Time Calculation**
- Calculates prayer times using the Adhan library
- Supports multiple calculation methods (Muslim World League, Egyptian, etc.)
- Updates automatically when location changes significantly (>5km)
- Caches prayer times for 24 hours

### 3. **Location Information Display**
- Shows city/region name using reverse geocoding
- Displays location accuracy badge
- Warns when location permission is not granted
- Updates in real-time when you pull to refresh

### 4. **Smart Caching**
- Location cached for 24 hours to save battery
- Prayer times cached until next day
- Automatic refresh at midnight
- Manual refresh available via pull-to-refresh

## How It Works

### Location Tracking Flow

1. **Permission Check**
   - App checks if location services are enabled
   - Requests location permission if not granted
   - Falls back to cached location if permission denied

2. **Location Acquisition**
   - Uses `Location.getCurrentPositionAsync()` with high accuracy
   - Timeout after 5 seconds to prevent hanging
   - Falls back to last known location if current fails
   - Defaults to Mecca coordinates if all else fails

3. **Location Caching**
   - Saves location with timestamp
   - Includes accuracy, altitude, and other metadata
   - Valid for 24 hours
   - Cleared on manual refresh

### Prayer Time Calculation Flow

1. **Check Cache**
   - Looks for cached prayer times for today
   - Validates location hasn't changed significantly
   - Returns cached times if valid

2. **Calculate Fresh Times**
   - Gets current location (or cached if recent)
   - Uses selected calculation method
   - Calculates all 5 daily prayers
   - Caches results with location info

3. **Display Times**
   - Shows next prayer prominently
   - Displays countdown to next prayer
   - Lists all 5 prayers with completion status
   - Shows location info and accuracy

## Calculation Methods

The app supports multiple calculation methods for different regions:

- **Muslim World League** (Default) - Used worldwide
- **Egyptian General Authority** - Egypt
- **University of Islamic Sciences, Karachi** - Pakistan, Bangladesh
- **Umm al-Qura University** - Saudi Arabia
- **Dubai** - UAE
- **Qatar** - Qatar
- **Kuwait** - Kuwait
- **Moonsighting Committee** - USA
- **Singapore** - Singapore
- **ISNA** - North America
- **Tehran** - Iran
- **Turkey** - Turkey

## Location Accuracy

### Accuracy Levels

- **< 50m** - Excellent (GPS with clear sky view)
- **50-100m** - Good (GPS with some obstruction)
- **100-500m** - Fair (Network-assisted location)
- **> 500m** - Poor (Cell tower triangulation)

### Improving Accuracy

1. **Enable Location Services**
   - Go to device Settings > Location
   - Turn on Location Services
   - Set to High Accuracy mode

2. **Grant App Permissions**
   - Allow "While Using App" permission
   - Grant permission when prompted
   - Check Settings > Apps > Muslim Life Hub > Permissions

3. **Ensure Clear Sky View**
   - GPS works best outdoors
   - Near windows if indoors
   - Away from tall buildings

4. **Wait for GPS Lock**
   - First location may take 10-30 seconds
   - Subsequent locations are faster
   - Pull to refresh to force update

## Troubleshooting

### Prayer Times Not Updating

**Problem:** Prayer times show default times or old times

**Solutions:**
1. Check location permission is granted
2. Enable location services on device
3. Pull down to refresh the home screen
4. Go to Settings > Location and verify GPS is working
5. Try moving to an area with better GPS signal

### Location Permission Denied

**Problem:** App shows "Enable location for accurate times"

**Solutions:**
1. Go to device Settings
2. Find Muslim Life Hub app
3. Tap Permissions > Location
4. Select "While Using App"
5. Return to app and pull to refresh

### Inaccurate Prayer Times

**Problem:** Prayer times don't match local mosque times

**Solutions:**
1. Verify your location is correct (check location name)
2. Try a different calculation method in settings
3. Ensure location accuracy is < 100m
4. Contact local mosque to confirm their calculation method
5. Pull to refresh to get fresh location

### Location Shows Wrong City

**Problem:** Location name shows incorrect city

**Solutions:**
1. This is usually due to reverse geocoding approximation
2. Check the coordinates are correct (lat/lng)
3. Prayer times are still accurate based on coordinates
4. Pull to refresh to update location

## Battery Optimization

The app is designed to minimize battery usage:

1. **Caching**
   - Location cached for 24 hours
   - Prayer times cached until next day
   - Reduces GPS usage

2. **Smart Updates**
   - Only updates when location changes > 5km
   - Automatic refresh only at midnight
   - Manual refresh available anytime

3. **Efficient GPS Usage**
   - Uses balanced accuracy when possible
   - High accuracy only when needed
   - Quick timeout to prevent hanging

## Privacy

Your location data is:
- ✅ Only used for prayer time calculation
- ✅ Stored locally on your device
- ✅ Never sent to external servers
- ✅ Cached for convenience only
- ✅ Can be cleared anytime

## Best Practices

1. **Grant Location Permission**
   - Required for accurate prayer times
   - Only used when app is open
   - No background tracking

2. **Keep Location Services On**
   - Enables automatic updates
   - Improves accuracy
   - Minimal battery impact

3. **Refresh Regularly**
   - Pull to refresh when traveling
   - Updates location and prayer times
   - Ensures accuracy

4. **Check Accuracy Badge**
   - Green badge = good accuracy
   - No badge = low accuracy
   - Pull to refresh if needed

5. **Choose Right Calculation Method**
   - Use local mosque's method
   - Check with community
   - Adjust in settings if needed

## Technical Details

### Location Service API

```typescript
// Get current location with high accuracy
const location = await getUserLocation(true);

// Get last known location (faster)
const lastKnown = await getLastKnownLocation();

// Watch location changes
const subscription = await watchLocation(
  (location) => {
    console.log('Location updated:', location);
  }
);

// Get location status
const status = await getLocationStatus();
```

### Prayer Time Service API

```typescript
// Get prayer times (with caching)
const prayers = await getPrayerTimes();

// Force refresh with fresh location
const freshPrayers = await refreshPrayerTimes();

// Get next prayer
const next = getNextPrayer(prayers);

// Get time until prayer
const timeUntil = getTimeUntilPrayer(next);
```

## Support

If you continue to experience issues:

1. Check the troubleshooting section above
2. Verify device location settings
3. Try restarting the app
4. Contact support with:
   - Device model
   - OS version
   - Location accuracy shown
   - Screenshot of issue

## Updates

The location and prayer time system is continuously improved:

- ✅ Enhanced accuracy algorithms
- ✅ Better error handling
- ✅ Improved caching strategy
- ✅ More calculation methods
- 🔄 Background location updates (coming soon)
- 🔄 Qibla direction (coming soon)
- 🔄 Nearby mosques (coming soon)

---

**Last Updated:** January 2025
**Version:** 1.0.0
