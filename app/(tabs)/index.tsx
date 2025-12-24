
import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // Redirect to home page when accessing the tabs root
  return <Redirect href="/(tabs)/(home)/" />;
}
