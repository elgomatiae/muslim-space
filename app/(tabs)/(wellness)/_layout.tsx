import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { miniTabStackScreenOptions, TAB_ROOT_HREFS } from '@/components/navigation/miniTabStack';

export default function WellnessLayout() {
  return (
    <Stack
      screenOptions={({ route }) => ({
        ...miniTabStackScreenOptions(TAB_ROOT_HREFS.wellness)({ route }),
        contentStyle: { backgroundColor: colors.background },
      })}
    />
  );
}
