
# Online Prayer Times API Integration

## Overview

The app now fetches **city-specific prayer times** from the **Aladhan API** (https://aladhan.com/prayer-times-api) instead of using broad regional calculations. This provides much more accurate prayer times based on your exact GPS location.

## What Changed?

### Before
- Used the `adhan` library to calculate prayer times locally
- Applied broad regional calculation methods (e.g., "North America ISNA")
- Same calculation parameters for entire regions
- Could be inaccurate for specific cities

### After
- Fetches prayer times from Aladhan API based on exact GPS coordinates
- City-specific prayer times for your exact location
- More accurate times that match local mosque schedules
- Automatic fallback to local calculation if API is unavailable

## How It Works

1. **Location Detection**: App gets your GPS coordinates (latitude, longitude)
2. **API Request**: Sends coordinates to Aladhan API with your preferred calculation method
3. **City-Specific Times**: API returns prayer times specific to your exact location
4. **Caching**: Times are cached locally to reduce API calls and save battery
5. **Fallback**: If API is unavailable, falls back to local calculation

## Example

**User in Aurora, IL:**
- **Old System**: Used "North America (ISNA)" calculation for entire North America
- **New System**: Fetches times specifically for Aurora, IL coordinates (41.7606°N, 88.3201°W)
- **Result**: More accurate times that match local mosques in Aurora

## API Details

### Aladhan API
- **URL**: https://api.aladhan.com/v1/timings
- **Method**: GET
- **Parameters**:
  - `latitude`: Your GPS latitude
  - `longitude`: Your GPS longitude
  - `method`: Calculation method ID (1-16)
- **Response**: JSON with prayer times for your exact location

### Supported Calculation Methods
1. University of Islamic Sciences, Karachi
2. Islamic Society of North America (ISNA) - **Default**
3. Muslim World League
4. Umm Al-Qura University, Makkah
5. Egyptian General Authority of Survey
7. Institute of Geophysics, University of Tehran
8. Gulf Region
9. Kuwait
10. Qatar
11. Majlis Ugama Islam Singapura, Singapore
12. Union Organization islamic de France
13. Diyanet İşleri Başkanlığı, Turkey
14. Spiritual Administration of Muslims of Russia
15. Moonsighting Committee Worldwide
16. Dubai (unofficial)

## Benefits

### 1. **City-Specific Accuracy**
- Times are calculated for your exact location
- No more broad regional approximations
- Matches local mosque schedules better

### 2. **Automatic Updates**
- Times update automatically when you travel
- Detects significant location changes (>5km)
- Always shows times for your current city

### 3. **Reliable Source**
- Aladhan API is widely used and trusted
- Maintained by Islamic scholars and developers
- Free and open-source

### 4. **Smart Caching**
- Reduces API calls to save battery
- Caches times for 24 hours
- Only fetches new times when needed

### 5. **Fallback Protection**
- If API is unavailable, uses local calculation
- Never leaves you without prayer times
- Seamless user experience

## User Interface

### Location Indicator
The app now shows:
- 🌐 **Globe icon**: Times fetched from online API
- 📍 **Location icon**: Times calculated locally (fallback)
- **City name**: Your current location
- **Accuracy badge**: GPS accuracy (if < 100m)

### Example Display
```
🌐 Online times for Aurora, IL  ±25m
```

## Privacy & Data

### What's Sent to API
- Your GPS coordinates (latitude, longitude)
- Calculation method preference
- Current date/time

### What's NOT Sent
- Your name or identity
- Email address
- Any personal information
- Device information

### Data Storage
- Prayer times are cached locally on your device
- No personal data is stored on external servers
- You can clear cache anytime in settings

## Troubleshooting

### Times Still Inaccurate?
1. **Check Location Permissions**: Ensure app has location access
2. **Enable High Accuracy**: Go to device settings → Location → High accuracy mode
3. **Refresh Times**: Pull down on home screen to refresh
4. **Try Different Method**: Go to Settings → Prayer Settings → Change calculation method
5. **Manual Adjustment**: Use fine-tuning offsets in Prayer Settings

### API Not Working?
- App automatically falls back to local calculation
- You'll see 📍 icon instead of 🌐 icon
- Times will still be reasonably accurate
- Try refreshing when internet is available

### Location Not Detected?
- Enable location services on your device
- Grant location permission to the app
- Move to an area with better GPS signal
- App will use last known location as fallback

## Technical Details

### Files Modified
- `utils/prayerTimeApiService.ts` - New API service
- `utils/prayerTimeService.ts` - Updated to use API
- `app/(tabs)/(home)/index.tsx` - Updated UI to show source

### API Response Example
```json
{
  "code": 200,
  "status": "OK",
  "data": {
    "timings": {
      "Fajr": "05:30",
      "Dhuhr": "12:45",
      "Asr": "16:15",
      "Maghrib": "18:30",
      "Isha": "20:00"
    },
    "meta": {
      "latitude": 41.7606,
      "longitude": -88.3201,
      "timezone": "America/Chicago",
      "method": {
        "id": 2,
        "name": "Islamic Society of North America (ISNA)"
      }
    }
  }
}
```

### Caching Strategy
- **Cache Duration**: 24 hours
- **Cache Key**: Date + Location + Method
- **Invalidation**: New day, location change (>5km), method change
- **Storage**: AsyncStorage (local device storage)

### Error Handling
1. **API Unavailable**: Falls back to local calculation
2. **Invalid Response**: Validates times before using
3. **Network Error**: Uses cached times if available
4. **Location Error**: Uses last known location or default (Mecca)

## Future Enhancements

### Planned Features
- [ ] Offline mode with pre-downloaded times
- [ ] Multiple location support (home, work, etc.)
- [ ] Qibla direction from API
- [ ] Hijri calendar integration
- [ ] Prayer time notifications with API times

### Community Feedback
We're continuously improving the prayer time accuracy. If you notice any issues:
1. Check your location permissions
2. Try different calculation methods
3. Report issues with your city name and coordinates
4. Suggest improvements in app feedback

## Credits

- **Aladhan API**: https://aladhan.com
- **Adhan Library**: https://github.com/batoulapps/adhan-js (fallback)
- **Islamic Scholars**: For calculation method parameters

## References

- [Aladhan API Documentation](https://aladhan.com/prayer-times-api)
- [Islamic Prayer Times Calculation Methods](https://en.wikipedia.org/wiki/Islamic_prayer_times)
- [GPS Accuracy in Mobile Apps](https://developer.android.com/guide/topics/location/strategies)

---

**Last Updated**: January 2025
**Version**: 2.0.0
