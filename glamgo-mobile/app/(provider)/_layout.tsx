import { Tabs } from 'expo-router';
import CustomTabBar from '../../src/components/navigation/CustomTabBar';

export default function ProviderLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} mode="provider" />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
