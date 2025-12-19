/**
 * Booking Layout - GlamGo Mobile
 * Layout pour la gestion des réservations prestataire
 */

import { Stack } from 'expo-router';
import { colors } from '../../../src/lib/constants/theme';

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.white },
        animation: 'slide_from_right',
      }}
    />
  );
}
