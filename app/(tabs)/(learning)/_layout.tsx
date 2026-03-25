import { Stack } from 'expo-router';
import { miniTabStackScreenOptions, TAB_ROOT_HREFS } from '@/components/navigation/miniTabStack';

export default function LearningLayout() {
  return <Stack screenOptions={miniTabStackScreenOptions(TAB_ROOT_HREFS.learning)} />;
}
