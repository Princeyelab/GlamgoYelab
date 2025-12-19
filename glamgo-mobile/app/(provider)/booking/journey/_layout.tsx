/**
 * Journey Layout - GlamGo Mobile
 * Layout pour le mode trajet du prestataire
 */

import { Stack } from 'expo-router';
import { colors } from '../../../../src/lib/constants/theme';

export default function JourneyLayout() {
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
