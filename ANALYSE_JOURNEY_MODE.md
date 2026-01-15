# 📍 Analyse du Mode Trajet GPS - Journey Screen

## Fichier analysé
`glamgo-mobile/app/(provider)/booking/journey/[id].tsx`

---

## 1. 🎣 HOOKS UTILISÉS

### Hooks React de base
```typescript
import { useState, useEffect, useRef } from 'react';

// États principaux
const [status, setStatus] = useState<JourneyStatus>('on_way');
const [booking, setBooking] = useState<BookingDetails>(INITIAL_BOOKING);
const [isLoading, setIsLoading] = useState(true);
const [hasError, setHasError] = useState(false);
const [isCancelled, setIsCancelled] = useState(false);

// Géolocalisation
const [providerLocation, setProviderLocation] = useState({
  latitude: 33.5631,
  longitude: -7.5998,
});

// Métriques
const [eta, setEta] = useState(0);              // Temps d'arrivée estimé (minutes)
const [distance, setDistance] = useState(0);    // Distance en km
const [elapsedTime, setElapsedTime] = useState(0); // Temps écoulé (minutes)

// UI
const [showCancellationModal, setShowCancellationModal] = useState(false);
```

### Hooks Expo Router
```typescript
import { useLocalSearchParams, useRouter } from 'expo-router';

const { id } = useLocalSearchParams<{ id: string }>();  // Récupère l'ID de la commande depuis l'URL
const router = useRouter();                              // Navigation
```

### Hooks personnalisés
```typescript
import { useLanguage } from '../../../../src/contexts/LanguageContext';

const { t, isRTL, language } = useLanguage();
// t(): Fonction de traduction
// isRTL: Boolean pour texte RTL (arabe)
// language: Langue actuelle
```

### Refs
```typescript
const mapRef = useRef<MapView>(null);              // Référence à la MapView
const pulseAnim = useRef(new Animated.Value(1));   // Animation pulse du marker
```

---

## 2. 📱 COMPOSANTS REACT NATIVE UTILISÉS

### Composants de base
```typescript
import {
  View,           // Container
  Text,           // Texte
  StyleSheet,     // Styles
  TouchableOpacity, // Bouton tactile
  Alert,          // Alertes natives
  Linking,        // Ouvrir liens/apps externes
  Platform,       // Détection iOS/Android
  Dimensions,     // Dimensions écran
  Animated,       // Animations
  ActivityIndicator, // Loader
} from 'react-native';
```

### Composants externes
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
```

### Composants personnalisés
```typescript
import EmergencyButton from '../../../../src/components/features/EmergencyButton';
import CancellationModal from '../../../../src/components/features/CancellationModal';
```

---

## 3. 🗺️ GÉOLOCALISATION

### A. Demande de permissions (useEffect - lignes 296-338)

```typescript
useEffect(() => {
  let locationSubscription: Location.LocationSubscription | null = null;

  const startLocationTracking = async () => {
    // 1. Demander la permission
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync();

    if (permStatus !== 'granted') {
      Alert.alert(
        t('journeyScreen.permissionRequired'),
        t('journeyScreen.locationRequired')
      );
      return;
    }

    // 2. Obtenir la position actuelle
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setProviderLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {}

    // 3. Démarrer le suivi continu
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,      // Mise à jour toutes les 5 secondes
        distanceInterval: 10,     // Ou tous les 10 mètres
      },
      (location) => {
        setProviderLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );
  };

  startLocationTracking();

  // Cleanup: arrêter le suivi quand le composant se démonte
  return () => {
    if (locationSubscription) {
      locationSubscription.remove();
    }
  };
}, []);
```

### B. Calcul de distance et ETA (useEffect - lignes 340-354)

```typescript
useEffect(() => {
  if (!booking.clientLocation || !providerLocation) return;

  const clientLat = booking.clientLocation.latitude;
  const clientLng = booking.clientLocation.longitude;

  // Formule de Haversine simplifiée
  const distKm = Math.sqrt(
    Math.pow((clientLat - providerLocation.latitude) * 111, 2) +
    Math.pow(
      (clientLng - providerLocation.longitude) * 111 *
      Math.cos(clientLat * Math.PI / 180),
      2
    )
  );

  setDistance(Math.round(distKm * 10) / 10);  // Arrondi à 1 décimale
  setEta(Math.max(1, Math.round(distKm * 2))); // 2 min par km (estimation)
}, [providerLocation, booking.clientLocation]);
```

**Explication du calcul:**
- `111` = km par degré de latitude/longitude approximatif
- `Math.cos(lat)` = correction pour la longitude en fonction de la latitude
- ETA = distance × 2 minutes (vitesse estimée de 30 km/h)

---

## 4. 🔄 GESTION DES STATUTS

### A. Type et configuration

```typescript
type JourneyStatus = 'on_way' | 'arrived' | 'in_progress' | 'completed';

const STATUS_GRADIENTS: Record<JourneyStatus, {
  icon: string;
  gradient: [string, string];
}> = {
  on_way: {
    icon: '🚗',
    gradient: ['#3B82F6', '#1D4ED8'],  // Bleu
  },
  arrived: {
    icon: '📍',
    gradient: ['#8B5CF6', '#6D28D9'],  // Violet
  },
  in_progress: {
    icon: '✂️',
    gradient: [colors.primary, '#BE185D'],  // Rose
  },
  completed: {
    icon: '✅',
    gradient: ['#10B981', '#059669'],  // Vert
  },
};
```

### B. Chargement du statut initial (useEffect - lignes 132-209)

```typescript
useEffect(() => {
  const loadBookingData = async () => {
    try {
      const orderData = await getProviderOrderDetail(parseInt(id, 10));

      // Mapper le statut de l'API au statut local
      if (orderData.status === 'cancelled') {
        setIsCancelled(true);
      } else if (orderData.status === 'in_progress' || orderData.status === 'started') {
        setStatus('in_progress');
      } else if (orderData.status === 'completed' || orderData.status === 'completed_pending_review') {
        setStatus('completed');
      } else if (orderData.status === 'arrived') {
        setStatus('arrived');
      } else if (orderData.status === 'on_way') {
        setStatus('on_way');
      }
    } catch (error) {
      setHasError(true);
    }
  };

  loadBookingData();
}, [id]);
```

### C. Polling pour détecter les changements de statut (useEffect - lignes 256-293)

```typescript
useEffect(() => {
  if (!id || status === 'completed' || isCancelled) return;

  const checkOrderStatus = async () => {
    try {
      const orderData = await getProviderOrderDetail(parseInt(id, 10));

      // Détecter si annulé
      if (orderData?.status === 'cancelled') {
        setIsCancelled(true);
        return;
      }

      // Détecter transition arrived → in_progress
      if (status === 'arrived' && orderData?.status === 'in_progress') {
        setStatus('in_progress');
        setElapsedTime(0);
        hapticFeedback.success();
        Alert.alert(
          t('journeyScreen.clientConfirmed'),
          t('journeyScreen.clientConfirmedMessage')
        );
      }
    } catch (error) {
      if (error?.response?.status === 403) {
        setIsCancelled(true);
      }
    }
  };

  const interval = setInterval(checkOrderStatus, 5000); // Toutes les 5 secondes
  return () => clearInterval(interval);
}, [status, id, isCancelled]);
```

### D. Transitions de statut manuelles

#### 1. on_way → arrived (lignes 366-391)
```typescript
const handleArrivedAtClient = () => {
  hapticFeedback.medium();
  Alert.alert(
    t('journeyScreen.arrivedAtClient'),
    t('journeyScreen.confirmArrival'),
    [
      { text: t('journeyScreen.cancel'), style: 'cancel' },
      {
        text: t('journeyScreen.confirm'),
        onPress: async () => {
          try {
            await arriveAtClient(parseInt(id, 10)); // API call
            setStatus('arrived');
            hapticFeedback.success();
            Alert.alert(
              t('journeyScreen.arrivalConfirmed'),
              t('journeyScreen.waitingClientConfirmation')
            );
          } catch (error) {
            hapticFeedback.error();
            Alert.alert(t('journeyScreen.error'), error?.response?.data?.message);
          }
        },
      },
    ]
  );
};
```

#### 2. in_progress → completed (lignes 393-423)
```typescript
const handleCompleteService = () => {
  hapticFeedback.medium();
  Alert.alert(
    t('journeyScreen.completeService'),
    t('journeyScreen.confirmCompletion'),
    [
      { text: t('journeyScreen.cancel'), style: 'cancel' },
      {
        text: t('journeyScreen.finish'),
        onPress: async () => {
          try {
            await completeOrder(parseInt(id, 10)); // API call
            setStatus('completed');
            hapticFeedback.success();

            // Retour au dashboard après 2 secondes
            setTimeout(() => {
              router.back();
            }, 2000);
          } catch (error) {
            // Même en cas d'erreur, on considère terminé
            setStatus('completed');
            hapticFeedback.success();
            setTimeout(() => router.back(), 2000);
          }
        },
      },
    ]
  );
};
```

---

## 5. 🌐 API CALLS

### Imports
```typescript
import {
  getProviderOrderDetail,  // Récupérer détails commande
  arriveAtClient,          // Marquer arrivée
  completeOrder,           // Terminer prestation
  updateProviderLocation,  // (Importé mais pas utilisé dans ce fichier)
} from '../../../../src/lib/api/providerAPI';
```

### 1. Chargement des détails (ligne 141)
```typescript
const orderData = await getProviderOrderDetail(parseInt(id, 10));

// Structure de la réponse:
// {
//   id: number,
//   status: string,
//   user_name: string,
//   user_phone: string,
//   service: { title: string, price: number },
//   address: string,
//   client_latitude: number,
//   client_longitude: number,
//   notes: string,
//   ...
// }
```

### 2. Marquer arrivée (ligne 378)
```typescript
await arriveAtClient(parseInt(id, 10));
// PUT /api/provider/orders/{id}/arrive
// Change le statut de 'on_way' → 'arrived'
```

### 3. Terminer commande (ligne 405)
```typescript
await completeOrder(parseInt(id, 10));
// PUT /api/provider/orders/{id}/complete
// Change le statut de 'in_progress' → 'completed'
```

### 4. Polling régulier (ligne 262)
```typescript
// Appelé toutes les 5 secondes pour vérifier les changements
const orderData = await getProviderOrderDetail(parseInt(id, 10));
```

---

## 6. ⏱️ TIMER - Temps écoulé pendant la prestation

### Compteur (useEffect - lignes 231-240)

```typescript
useEffect(() => {
  // Actif uniquement pendant 'in_progress'
  if (status !== 'in_progress') return;

  const interval = setInterval(() => {
    setElapsedTime(prev => prev + 1); // +1 minute
  }, 60000); // Toutes les 60 secondes

  return () => clearInterval(interval);
}, [status]);
```

### Affichage (ligne 614)
```typescript
{status === 'in_progress' &&
  t('journeyScreen.elapsedTime').replace('{min}', elapsedTime.toString())
}
// Exemple: "Temps écoulé: 15 min"
```

**Note:** Le timer est en **minutes**, pas en secondes.

---

## 7. 🗺️ CARTE ET MARKERS

### A. Configuration MapView (lignes 545-588)

```typescript
<MapView
  ref={mapRef}
  style={styles.map}
  initialRegion={{
    // Centre la carte entre le prestataire et le client
    latitude: (providerLocation.latitude + booking.clientLocation.latitude) / 2,
    longitude: (providerLocation.longitude + booking.clientLocation.longitude) / 2,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
  showsUserLocation={false}  // Désactivé car on a un marker personnalisé
  showsCompass={false}
>
  {/* Markers ici */}
</MapView>
```

### B. Marker Prestataire avec animation pulse (lignes 558-567)

```typescript
{/* Marker animé du prestataire */}
<Marker
  coordinate={providerLocation}
  anchor={{ x: 0.5, y: 0.5 }}
>
  <Animated.View style={[
    styles.providerMarker,
    { transform: [{ scale: pulseAnim }] }  // Animation
  ]}>
    <LinearGradient
      colors={statusGradient.gradient}  // Gradient selon statut
      style={styles.providerMarkerInner}
    >
      <Text style={styles.providerMarkerIcon}>🚗</Text>
    </LinearGradient>
  </Animated.View>
</Marker>
```

**Animation pulse (lignes 211-229):**
```typescript
useEffect(() => {
  const pulse = Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,       // Grandir à 130%
        duration: 1000,     // En 1 seconde
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,         // Revenir à 100%
        duration: 1000,
        useNativeDriver: true,
      }),
    ])
  );
  pulse.start();
  return () => pulse.stop();
}, []);
```

### C. Marker Client (lignes 570-577)

```typescript
<Marker
  coordinate={booking.clientLocation}
  anchor={{ x: 0.5, y: 1 }}  // Ancrage en bas pour afficher la "queue"
>
  <View style={styles.clientMarker}>
    <View style={styles.clientMarkerInner}>
      <Text style={styles.clientAvatarMarker}>
        {booking.clientAvatar}  {/* Ex: "JD" pour John Doe */}
      </Text>
    </View>
    <View style={styles.clientMarkerTail} />  {/* Triangle pointant vers le bas */}
  </View>
</Marker>
```

### D. Ligne de route (Polyline) - lignes 580-587

```typescript
{/* Ligne pointillée entre prestataire et client */}
{status === 'on_way' && (
  <Polyline
    coordinates={[providerLocation, booking.clientLocation]}
    strokeWidth={4}
    strokeColor={colors.primary}
    lineDashPattern={[10, 5]}  // Pointillés: 10px ligne, 5px espace
  />
)}
```

### E. Contrôles de la carte (lignes 591-598)

```typescript
<View style={styles.mapControls}>
  {/* Bouton retour */}
  <TouchableOpacity onPress={() => router.back()}>
    <Text>←</Text>
  </TouchableOpacity>

  {/* Bouton centrer la carte */}
  <TouchableOpacity onPress={handleCenterMap}>
    <Text>🎯</Text>
  </TouchableOpacity>
</View>
```

**Fonction de centrage (lignes 425-434):**
```typescript
const handleCenterMap = () => {
  hapticFeedback.light();
  mapRef.current?.fitToCoordinates(
    [providerLocation, booking.clientLocation],  // Afficher ces 2 points
    {
      edgePadding: {
        top: 100,
        right: 50,
        bottom: 350,  // Plus d'espace en bas pour le bottom sheet
        left: 50
      },
      animated: true,
    }
  );
};
```

---

## 8. 🎨 INTERFACE UTILISATEUR

### A. Bannière de statut (lignes 601-624)

```typescript
<LinearGradient
  colors={statusGradient.gradient}  // Couleur selon statut
  style={styles.statusBanner}
>
  <View style={styles.statusBannerLeft}>
    <Text style={styles.statusIcon}>{statusGradient.icon}</Text>
    <View>
      <Text style={styles.statusTitle}>{statusTitle}</Text>
      <Text style={styles.statusSubtitle}>
        {/* Texte dynamique selon statut */}
        {status === 'on_way' &&
          t('journeyScreen.arrivalIn').replace('{min}', Math.ceil(eta).toString())
        }
        {status === 'arrived' && t('journeyScreen.waitingForClient')}
        {status === 'in_progress' &&
          t('journeyScreen.elapsedTime').replace('{min}', elapsedTime.toString())
        }
      </Text>
    </View>
  </View>

  {/* Distance (uniquement en route) */}
  {status === 'on_way' && (
    <View style={styles.distanceContainer}>
      <Text style={styles.distanceValue}>{distance.toFixed(1)}</Text>
      <Text style={styles.distanceUnit}>km</Text>
    </View>
  )}
</LinearGradient>
```

### B. Bottom Sheet avec infos client (lignes 627-752)

Structure:
1. **Handle** pour glisser
2. **Carte client** avec avatar, nom, service, prix
3. **Adresse**
4. **Notes** (si présentes)
5. **Actions rapides** (GPS, Chat, Annuler)
6. **Bouton principal** selon le statut

```typescript
<View style={styles.bottomSheet}>
  {/* Barre de préhension */}
  <View style={styles.sheetHandle} />

  {/* Carte client */}
  <View style={styles.clientCard}>
    <View style={styles.clientCardHeader}>
      {/* Avatar */}
      <LinearGradient colors={[colors.primary, '#8B5CF6']}>
        <Text>{booking.clientAvatar}</Text>
      </LinearGradient>

      {/* Infos */}
      <View>
        <Text>{booking.clientName}</Text>
        <Text>{booking.service}</Text>
      </View>

      {/* Prix */}
      <View style={styles.priceTag}>
        <Text>{booking.price} DH</Text>
      </View>
    </View>

    {/* Adresse */}
    <View style={styles.addressRow}>
      <Text>📍 {booking.address}</Text>
    </View>

    {/* Notes (optionnel) */}
    {booking.notes && (
      <View style={styles.notesContainer}>
        <Text>📝 {t('journeyScreen.notes')}</Text>
        <Text>{booking.notes}</Text>
      </View>
    )}

    {/* Actions rapides */}
    <View style={styles.quickActions}>
      {/* GPS */}
      <TouchableOpacity onPress={handleOpenMaps}>
        <Text>🗺️</Text>
        <Text>{t('journeyScreen.gps')}</Text>
      </TouchableOpacity>

      {/* Chat */}
      <TouchableOpacity onPress={() => router.push(`/chat/${booking.id}`)}>
        <Text>💬</Text>
        <Text>{t('journeyScreen.chat')}</Text>
      </TouchableOpacity>

      {/* Annuler (seulement si on_way) */}
      {status === 'on_way' && (
        <TouchableOpacity onPress={() => setShowCancellationModal(true)}>
          <Text>❌</Text>
          <Text>{t('journeyScreen.cancel')}</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>

  {/* BOUTON PRINCIPAL - Varie selon le statut */}

  {/* Si on_way: Bouton "Je suis arrivé" */}
  {status === 'on_way' && (
    <TouchableOpacity onPress={handleArrivedAtClient}>
      <LinearGradient colors={['#8B5CF6', '#6D28D9']}>
        <Text>📍 {t('journeyScreen.iArrived')}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )}

  {/* Si arrived: Carte d'attente */}
  {status === 'arrived' && (
    <View style={styles.waitingCard}>
      <Text>⏳</Text>
      <View>
        <Text>{t('journeyScreen.waitingConfirmation')}</Text>
        <Text>{t('journeyScreen.clientMustConfirm')}</Text>
      </View>
    </View>
  )}

  {/* Si in_progress: Bouton "Terminer" */}
  {status === 'in_progress' && (
    <TouchableOpacity onPress={handleCompleteService}>
      <LinearGradient colors={['#10B981', '#059669']}>
        <Text>✅ {t('journeyScreen.finishService')}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )}
</View>
```

### C. Actions externes

#### Ouvrir GPS natif (lignes 356-364)
```typescript
const handleOpenMaps = () => {
  hapticFeedback.light();
  const { latitude, longitude } = booking.clientLocation;

  // URL différente selon la plateforme
  const url = Platform.select({
    ios: `maps://app?daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });

  if (url) Linking.openURL(url);
};
```

---

## 9. 📊 ÉTATS D'AFFICHAGE

Le composant gère **5 états d'affichage** différents:

### 1. Loading (lignes 440-452)
```typescript
if (isLoading) {
  return (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color={colors.white} />
      <Text>{t('journeyScreen.loading')}</Text>
    </View>
  );
}
```

### 2. Error (lignes 455-478)
```typescript
if (hasError || !booking.id) {
  return (
    <View style={styles.centerContent}>
      <Text style={styles.stateIcon}>❌</Text>
      <Text>{t('journeyScreen.bookingNotFound')}</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text>{t('journeyScreen.back')}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 3. Cancelled (lignes 481-507)
```typescript
if (isCancelled) {
  return (
    <View style={styles.centerContent}>
      <Text style={styles.stateIcon}>❌</Text>
      <Text>{t('journeyScreen.orderCancelled')}</Text>
      <TouchableOpacity onPress={() => router.replace('/(provider)/bookings')}>
        <Text>{t('journeyScreen.backToOrders')}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 4. Completed (lignes 510-540)
```typescript
if (status === 'completed') {
  return (
    <View style={styles.centerContent}>
      <Text style={styles.stateIcon}>✅</Text>
      <Text>{t('journeyScreen.serviceCompleted')}</Text>

      {/* Affichage des gains */}
      <View style={styles.completedEarnings}>
        <Text>{t('journeyScreen.earnings')}</Text>
        <Text>+{booking.price} DH</Text>
      </View>

      <TouchableOpacity onPress={() => router.replace('/(provider)')}>
        <Text>{t('journeyScreen.backToDashboard')}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 5. Mode trajet actif (lignes 542-778)
Interface complète avec carte, markers, bottom sheet, etc.

---

## 10. 🎭 AUTRES FONCTIONNALITÉS

### Event Listener (lignes 243-254)
```typescript
useEffect(() => {
  // Écouter les événements d'annulation depuis d'autres écrans
  const unsubscribe = appEvents.on(EVENTS.REFRESH_PROVIDER_BOOKINGS, async () => {
    if (!id) return;
    try {
      const orderData = await getProviderOrderDetail(parseInt(id, 10));
      if (orderData?.status === 'cancelled') {
        setIsCancelled(true);
      }
    } catch (error) {}
  });

  return unsubscribe;  // Cleanup
}, [id]);
```

### Bouton d'urgence (lignes 755-763)
```typescript
{['on_way', 'arrived', 'in_progress'].includes(status) && (
  <View style={styles.emergencyContainer}>
    <EmergencyButton
      orderId={booking.id}
      clientName={booking.clientName}
      isProvider={true}
    />
  </View>
)}
```

### Modal d'annulation (lignes 766-776)
```typescript
<CancellationModal
  visible={showCancellationModal}
  onClose={() => setShowCancellationModal(false)}
  onSuccess={() => {
    setShowCancellationModal(false);
    router.replace('/(provider)/bookings');
  }}
  orderId={booking.id}
  userType="provider"
  orderStatus={status}
/>
```

---

## 11. 🎨 SUPPORT RTL (Arabe)

Le composant supporte complètement le RTL:

```typescript
const { t, isRTL, language } = useLanguage();

// Exemples d'utilisation:
<Text style={[styles.statusTitle, isRTL && styles.textRTL]}>
  {statusTitle}
</Text>

<View style={[styles.statusBannerLeft, isRTL && styles.statusBannerLeftRTL]}>
  {/* Contenu inversé pour RTL */}
</View>

// Styles RTL
textRTL: {
  textAlign: 'right',
  writingDirection: 'rtl',
},
statusBannerLeftRTL: {
  flexDirection: 'row-reverse',  // Inverse l'ordre des éléments
},
```

---

## 12. 📦 RÉSUMÉ DES FONCTIONNALITÉS CLÉS

### ✅ Géolocalisation
- Suivi GPS en temps réel (5s/10m)
- Calcul distance et ETA automatique
- Marker animé avec pulse
- Ligne de route pointillée

### ✅ Statuts
- 4 statuts: on_way → arrived → in_progress → completed
- Polling toutes les 5s
- Transitions manuelles + auto (arrived → in_progress)
- UI adaptée à chaque statut

### ✅ Timer
- Compteur temps écoulé en minutes
- Actif uniquement pendant in_progress

### ✅ API
- `getProviderOrderDetail()` - Chargement + polling
- `arriveAtClient()` - Marquer arrivée
- `completeOrder()` - Terminer prestation

### ✅ UX
- 5 états d'affichage (loading, error, cancelled, completed, active)
- Animations (pulse, gradients)
- Haptic feedback
- Bottom sheet avec infos complètes
- Actions rapides (GPS, Chat, Annuler)
- Bouton urgence
- Support RTL complet

---

## 🎯 POINTS D'ATTENTION POUR L'ADAPTATION WEB

### À adapter:
1. **Géolocalisation**: Utiliser `navigator.geolocation.watchPosition()` au lieu de `expo-location`
2. **Carte**: Utiliser Google Maps JavaScript API ou Mapbox au lieu de `react-native-maps`
3. **Animations**: Remplacer `Animated` par CSS animations ou Framer Motion
4. **Haptic**: Retirer ou remplacer par des effets visuels
5. **Linking**: Utiliser `window.open()` pour GPS

### À conserver:
- Structure des états
- Logique de polling
- Calcul distance/ETA
- Gestion des statuts
- Event listeners
- Support RTL

---

Date de création: 2026-01-12
