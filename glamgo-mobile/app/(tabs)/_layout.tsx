import { Tabs } from 'expo-router';
import CustomTabBar from '../../src/components/navigation/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
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
