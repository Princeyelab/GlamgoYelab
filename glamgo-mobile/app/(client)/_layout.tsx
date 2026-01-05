import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import CustomTabBar from '../../src/components/navigation/CustomTabBar';
import ChatBot from '../../src/components/features/ChatBot';
import GlobalEmergencyButton from '../../src/components/features/GlobalEmergencyButton';
import PendingBookingBanner from '../../src/components/features/PendingBookingBanner';

/**
 * Client Layout
 * Les modals globaux (arrivée, acceptation, satisfaction) sont maintenant
 * dans ClientGlobalModals au niveau du root layout pour être visibles partout.
 */
export default function ClientLayout() {
  return (
    <View style={{ flex: 1 }}>
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

      {/* Bannière timer pour commandes en attente */}
      <PendingBookingBanner />

      {/* ChatBot flottant */}
      <ChatBot />

      {/* Bouton d'urgence global - visible si prestation en cours */}
      <GlobalEmergencyButton isProvider={false} />
    </View>
  );
}
