import { Tabs } from 'expo-router';
import CustomTabBar from '../../src/components/navigation/CustomTabBar';

export default function ClientLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} mode="client" />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
