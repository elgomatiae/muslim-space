# Access Gate Implementation Guide

## Overview

The Access Gate feature has been successfully integrated into your app. Users can watch a rewarded interstitial ad to unlock premium features for 24 hours.

## Configuration

- **App ID**: `ca-app-pub-2757517181313212~3571222456`
- **Ad Unit ID**: `ca-app-pub-2757517181313212/8725693825` (Rewarded Interstitial)
- **Access Duration**: 24 hours after watching an ad

## Files Created

1. **`components/access/AccessGate.tsx`** - The modal component that displays the ad
2. **`components/access/WithAccessGate.tsx`** - HOC wrapper for protecting features
3. **`hooks/useAccessGate.ts`** - Hook for managing access state

## Usage Examples

### Option 1: Using the Hook Directly

```tsx
import { useAccessGate } from '@/hooks/useAccessGate';
import { AccessGate } from '@/components/access/AccessGate';

function MyFeature() {
  const { checkAccess, showGate, gateVisible, onGateClose, onGateGranted } = useAccessGate();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess().then(setHasAccess);
  }, []);

  const handleFeatureAccess = async () => {
    const access = await checkAccess();
    if (!access) {
      showGate(() => {
        setHasAccess(true);
        // Feature unlocked!
      });
    } else {
      // User has access, proceed
      setHasAccess(true);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handleFeatureAccess}>
        <Text>Access Premium Feature</Text>
      </TouchableOpacity>
      
      <AccessGate
        visible={gateVisible}
        onClose={onGateClose}
        onAccessGranted={onGateGranted}
        title="Unlock Premium Feature"
        description="Watch a short ad to unlock this feature for 24 hours"
      />
    </>
  );
}
```

### Option 2: Using the HOC Wrapper

```tsx
import { WithAccessGate } from '@/components/access/WithAccessGate';

function MyPremiumFeature() {
  return (
    <WithAccessGate
      featureName="Premium Feature"
      featureDescription="Watch a short ad to unlock this feature"
      onAccessGranted={() => {
        console.log('Access granted!');
      }}
    >
      {/* Your premium content here */}
      <View>
        <Text>This is premium content!</Text>
      </View>
    </WithAccessGate>
  );
}
```

### Option 3: Manual Check Before Navigation

```tsx
import { useAccessGate } from '@/hooks/useAccessGate';
import { router } from 'expo-router';

function NavigationButton() {
  const { checkAccess, showGate } = useAccessGate();

  const handleNavigate = async () => {
    const hasAccess = await checkAccess();
    
    if (hasAccess) {
      router.push('/premium-feature');
    } else {
      showGate(() => {
        // After watching ad, navigate
        router.push('/premium-feature');
      });
    }
  };

  return (
    <TouchableOpacity onPress={handleNavigate}>
      <Text>Go to Premium Feature</Text>
    </TouchableOpacity>
  );
}
```

## Integration Points

You can add the access gate to any premium feature. Common places to add it:

1. **Premium Learning Content** - Lock certain lectures or quizzes
2. **Advanced Wellness Features** - Lock advanced meditation or journaling features
3. **Community Features** - Lock certain community interactions
4. **Iman Tracker Advanced Features** - Lock advanced tracking features

## Example: Adding to a Screen

```tsx
// app/(tabs)/(learning)/premium-lectures.tsx
import { WithAccessGate } from '@/components/access/WithAccessGate';

export default function PremiumLectures() {
  return (
    <WithAccessGate
      featureName="Premium Lectures"
      featureDescription="Watch an ad to access premium Islamic lectures for 24 hours"
    >
      <ScrollView>
        {/* Your premium lecture content */}
      </ScrollView>
    </WithAccessGate>
  );
}
```

## Testing

### Development Mode
- Uses test ad unit ID: `ca-app-pub-3940256099942544/1712485313`
- Test ads will always load successfully
- No real ads will be shown in development

### Production Mode
- Uses your actual ad unit ID: `ca-app-pub-2757517181313212/8725693825`
- Real ads will be shown to users
- Access is stored locally and expires after 24 hours

## Access Storage

Access is stored in AsyncStorage with the key `@access_granted`. The storage includes:
- Timestamp of when access was granted
- Automatic expiration after 24 hours

## Notes

- Access is device-specific (stored locally)
- Access expires after 24 hours
- Users can watch multiple ads to extend access
- The ad must be fully watched to grant access
- If the ad fails to load, users can retry

## Next Steps

1. **Choose which features to protect** - Decide which premium features should require watching an ad
2. **Add the access gate** - Wrap those features with `WithAccessGate` or use the hook
3. **Test in development** - Test with test ads first
4. **Build and test** - Build for production and test with real ads
5. **Monitor** - Check AdMob dashboard for ad performance
