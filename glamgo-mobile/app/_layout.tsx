import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../src/lib/store';
import { colors, spacing, typography } from '../src/lib/constants/theme';
import { ClientGlobalModals } from '../src/components/features/ClientGlobalModals';
import { CurrencyProvider } from '../src/contexts/CurrencyContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { initCancelledOrdersCache } from '../src/lib/utils/cancelledOrdersCache';
import { initSatisfiedOrdersCache } from '../src/lib/utils/satisfiedOrdersCache';
import {
  useFonts,
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import {
  Cairo_300Light,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';

// Empecher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignorer l'erreur si le splash screen n'est pas disponible (dev mode)
});

// Composant de chargement pour PersistGate
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Latin fonts
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    // Arabic fonts
    Cairo_300Light,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  useEffect(() => {
    // Initialiser les caches au démarrage
    initCancelledOrdersCache();
    initSatisfiedOrdersCache();

    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignorer l'erreur si le splash screen n'est pas disponible
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <LanguageProvider>
          <CurrencyProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="how-it-works" />
              <Stack.Screen name="(client)" />
              <Stack.Screen name="(provider)" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="services" />
              <Stack.Screen name="providers" />
              <Stack.Screen name="reviews" />
              <Stack.Screen name="booking" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="search" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="test-components" />
            </Stack>
            {/* Modals globaux pour les clients - visibles partout */}
            <ClientGlobalModals />
          </CurrencyProvider>
        </LanguageProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    fontFamily: 'Roboto_400Regular',
  },
});
