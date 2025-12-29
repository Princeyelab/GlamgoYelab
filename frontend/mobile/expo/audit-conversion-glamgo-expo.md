# Audit Complet - Conversion GlamGo Web vers Mobile Expo

**Date de l'audit**: 16 decembre 2025
**Version analysee**: Production actuelle
**Auteur**: Expert Mobile Expo/React Native
**Projet**: GlamGo - Application de services a domicile
**Localisation**: Marrakech, Maroc

---

## 1. Resume Executif

### 1.1 Vue d'ensemble

GlamGo est une application web mature de services a domicile (coiffure, massage, menage, beaute, etc.) deployee a Marrakech, Maroc. L'application presente un ecosysteme complet avec:

- **Frontend**: Next.js 14.2.3 + React 18 + SCSS modules
- **Backend**: PHP 8.2 API REST
- **Base de donnees**: MySQL
- **Users cibles**: 60% mobile, double profil (clients + prestataires)
- **Multi-langue**: 7 langues supportees (FR, EN, AR avec RTL complet, ES, DE, BER-Tifinagh, BER-Latin)

### 1.2 Faisabilite de la conversion

| Critere | Evaluation | Commentaire |
|---------|------------|-------------|
| Complexite fonctionnelle | Elevee | 50+ features, bidding, chat, geoloc temps reel |
| Reusabilite du code | 40-50% | Logic business, types, validations reutilisables |
| Architecture API | Excellente | API REST bien structuree, prete pour mobile |
| Design System | Solide | Tokens SCSS bien definis, adaptation RN possible |
| Complexite i18n | Haute | RTL Arabic + 6 autres langues + traduction dynamique DeepL |

### 1.3 Recommandation

**GO pour la conversion mobile avec Expo managed workflow.**

L'application web est suffisamment mature et l'architecture API est prete. La conversion vers Expo permettra:
- Deploiement iOS + Android simultanee via EAS Build (sans Mac local)
- 95% de code partage entre plateformes
- OTA updates pour corrections rapides
- Performances natives superieures au web mobile

---

## 2. Inventaire Complet des Features

### 2.1 Authentification & Utilisateurs

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Login client | P0 | Faible | Email/password, remember me |
| Login prestataire | P0 | Faible | Systeme de token separe |
| Inscription client | P0 | Moyenne | Validation, onboarding |
| Inscription prestataire | P0 | Haute | Multi-etapes, upload photo, specialites |
| Mot de passe oublie | P1 | Faible | Email reset flow |
| Profil client | P0 | Faible | Lecture/edition |
| Profil prestataire | P0 | Moyenne | Specialites, disponibilite, horaires |
| Biometrie (Face ID/Touch ID) | P1 | Faible | expo-local-authentication |
| Session duale client/provider | P1 | Moyenne | Tokens separes localStorage |

### 2.2 Services & Catalogue

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Liste des categories | P0 | Faible | API /categories |
| Liste des services | P0 | Faible | API /services avec filtres |
| Detail service | P0 | Faible | Prix, description, formules |
| Recherche services | P1 | Moyenne | Texte + filtres |
| Systeme de formules | P0 | Haute | 5 types: standard, recurring, premium, urgent, night |
| Calcul de prix dynamique | P0 | Haute | Formule + distance + nuit + duree |
| Prestataires a proximite | P0 | Haute | Geolocalisation + tri priorite |

### 2.3 Reservation & Commandes

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Creation commande classique | P0 | Haute | Multi-etapes, adresse, date, formule |
| Creation commande bidding (InDrive) | P1 | Haute | Prix propose, encheres prestataires |
| Liste des commandes client | P0 | Faible | Historique + actives |
| Detail commande | P0 | Moyenne | Status, prestataire, chat, localisation |
| Annulation commande | P0 | Moyenne | Frais selon delai |
| Confirmation arrivee | P1 | Faible | Client confirme |
| Confirmation completion | P0 | Faible | Client confirme fin service |
| Systeme d'encheres (bids) | P1 | Haute | Reception, acceptation, rejet d'offres |

### 2.4 Systeme Prestataire

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Dashboard prestataire | P0 | Moyenne | Stats, commandes, revenus |
| Gestion disponibilite | P0 | Faible | Toggle on/off |
| Gestion services proposes | P1 | Moyenne | Ajout/suppression services |
| Commandes entrantes | P0 | Haute | Liste, acceptation, gestion |
| Accepter commande | P0 | Faible | Un clic |
| Demarrer trajet | P0 | Faible | Passe en "on_way" |
| Commencer prestation | P0 | Faible | Passe en "in_progress" |
| Terminer prestation | P0 | Faible | Passe en "completed" |
| Creer une offre (bid) | P1 | Moyenne | Prix propose, message, delai |
| Localisation temps reel | P0 | Haute | Envoi position GPS continu |
| Commandes disponibles bidding | P1 | Moyenne | Liste commandes ouvertes |

### 2.5 Chat & Communication

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Chat client-prestataire | P0 | Haute | Temps reel, polling 3s |
| Messages rapides predefinies | P1 | Faible | FR + AR |
| Upload images chat | P1 | Haute | Moderation NSFW, confirmation |
| Traduction automatique FR/AR | P1 | Haute | DeepL API |
| Moderation contenu | P0 | Haute | Blocage insultes, contacts |
| Indicateurs lu/non lu | P1 | Faible | Statut lecture |
| Presence en ligne | P2 | Moyenne | Indicateur online |

### 2.6 Notifications

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Notifications in-app client | P0 | Moyenne | Dropdown, liste complete |
| Notifications in-app prestataire | P0 | Moyenne | Idem |
| Push notifications | P0 | Haute | FCM via expo-notifications |
| Badge compteur non lus | P0 | Faible | Temps reel |
| Types: commande, message, statut | P0 | Faible | Icones differenciees |

### 2.7 Geolocalisation

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Autocompletion adresse Maroc | P0 | Haute | Google Places + Nominatim fallback |
| Detection position client | P0 | Moyenne | expo-location |
| Suivi temps reel prestataire | P0 | Haute | Carte + polling 10s |
| Calcul distance | P1 | Moyenne | Pour frais deplacement |
| Affichage carte | P0 | Haute | react-native-maps |
| Position client pour prestataire | P1 | Moyenne | Inverse tracking |

### 2.8 Paiements

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Paiement especes | P0 | Faible | Confirmation double |
| Historique transactions | P1 | Faible | Liste |
| Commission GlamGo 20% | P0 | Faible | Calcul automatique |
| Apple Pay / Google Pay | P2 | Haute | @stripe/stripe-react-native |

### 2.9 Evaluations & Satisfaction

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Avis apres prestation | P0 | Moyenne | Note 1-5 + commentaire |
| Questionnaire satisfaction | P1 | Moyenne | Multi-criteres |
| Affichage note prestataire | P0 | Faible | Badge + etoiles |
| Systeme priorite prestataires | P1 | Haute | Score base sur notes |

### 2.10 Securite & Urgence

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Bouton urgence client | P0 | Moyenne | Signalement rapide |
| Bouton urgence prestataire | P0 | Moyenne | Idem cote provider |
| Moderation chat | P0 | Haute | Insultes FR/AR + contacts |
| Detection NSFW images | P1 | Haute | ML cote client |

### 2.11 Internationalisation

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| 7 langues statiques | P0 | Haute | FR, EN, AR, ES, DE, BER-Tifinagh, BER-Latin |
| RTL Arabic complet | P0 | Tres haute | Layout, texte, navigation |
| Traduction dynamique DeepL | P1 | Haute | Services, messages |
| Chiffres arabes | P1 | Faible | toArabicNumerals() |
| Detection langue device | P0 | Faible | expo-localization |

### 2.12 Autres Features

| Feature Web | Priorite Mobile | Complexite | Notes |
|-------------|-----------------|------------|-------|
| Conversion devise | P2 | Faible | MAD + 9 devises |
| Detection horaire nuit | P0 | Faible | 22h-6h, supplements |
| Pages informatives | P2 | Faible | Conditions, confidentialite |
| Partage natif | P1 | Faible | expo-sharing |

---

## 3. Analyse Technique Detaillee

### 3.1 Architecture Frontend Web Actuelle

```
src/
├── app/                     # Pages Next.js (App Router)
│   ├── (auth)/              # Non implemente (layout group)
│   ├── booking/[id]/        # Reservation avec ID service
│   ├── login/               # Connexion client
│   ├── register/            # Inscription client
│   ├── services/            # Liste services
│   ├── services/[id]/       # Detail service
│   ├── orders/              # Liste commandes client
│   ├── orders/[id]/         # Detail commande
│   ├── profile/             # Profil client
│   ├── notifications/       # Notifications client
│   ├── provider/            # Section prestataire
│   │   ├── login/           # Connexion prestataire
│   │   ├── register/        # Inscription prestataire
│   │   ├── onboarding/      # Onboarding prestataire
│   │   ├── dashboard/       # Dashboard prestataire
│   │   ├── profile/         # Profil prestataire
│   │   ├── services/        # Services proposes
│   │   └── notifications/   # Notifications prestataire
│   ├── page.js              # Homepage
│   └── layout.js            # Layout racine (providers)
├── components/              # 50+ composants reutilisables
├── contexts/                # Contextes React
│   ├── AuthContext.js       # Authentification
│   ├── LanguageContext.js   # i18n + RTL (800+ lignes)
│   └── CurrencyContext.js   # Conversion devises
├── hooks/                   # Hooks personnalises
│   ├── useNearbyProviders.js
│   ├── usePriceCalculation.js
│   └── useNightShiftDetection.js
├── lib/                     # Utilitaires et services
│   ├── api.js               # Helper API simple
│   ├── apiClient.js         # Client API complet (1000+ lignes)
│   ├── currency.js          # Conversion devises
│   ├── translationService.js # DeepL integration
│   ├── contentModeration.js # Moderation chat (450 lignes)
│   └── providerPriority.js  # Systeme priorite
├── styles/                  # SCSS global
│   ├── globals.scss
│   ├── _variables.scss      # Design tokens
│   ├── _mixins.scss
│   ├── rtl.scss             # Styles RTL
│   └── glassmorphism.scss
└── locales/                 # Fichiers i18n (dans LanguageContext)
```

### 3.2 Design System - Tokens Existants

**Couleurs (SCSS Variables)**
```scss
// Principales
$primary-color: #FF6B6B;    // Rouge corail
$primary-dark: #E85555;
$primary-light: #FF9B9B;
$secondary-color: #4ECDC4;  // Turquoise
$secondary-dark: #3BBFB5;
$secondary-light: #7ED9D2;

// Status
$success: #28A745;
$warning: #FFC107;
$error: #DC3545;
$info: #17A2B8;

// Neutres
$gray-100 a $gray-900;
$white: #FFFFFF;
$black: #1A1A1A;
```

**Typographie**
```scss
$font-size-xs: 0.75rem;    // 12px
$font-size-sm: 0.875rem;   // 14px
$font-size-base: 1rem;     // 16px
$font-size-lg: 1.125rem;   // 18px
$font-size-xl: 1.25rem;    // 20px
$font-size-2xl: 1.5rem;    // 24px
$font-size-3xl: 1.875rem;  // 30px
$font-size-4xl: 2.25rem;   // 36px
```

**Espacements**
```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;
```

**Border Radius**
```scss
$radius-sm: 4px;
$radius-md: 8px;
$radius-lg: 12px;
$radius-xl: 16px;
$radius-full: 9999px;
```

### 3.3 API Client - Endpoints Documentes

Le fichier `apiClient.js` documente 80+ methodes API organisees par domaine:

**Authentification**
- POST /auth/login
- POST /auth/register
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /provider/login
- POST /provider/register
- POST /provider/forgot-password

**Services & Categories**
- GET /categories
- GET /categories/:id/services
- GET /services
- GET /services/:id
- GET /services/:id/formulas
- GET /services/:id/price-preview
- GET /services/:id/nearby-providers

**Commandes**
- GET /orders
- GET /orders/:id
- POST /orders
- PATCH /orders/:id/cancel
- PATCH /orders/:id/confirm-arrival
- PATCH /orders/:id/confirm-complete
- GET /orders/:id/location

**Encheres (Bidding)**
- POST /orders/bidding
- GET /orders/:id/bids
- POST /bids
- PUT /bids/:id/accept
- PUT /bids/:id/reject
- DELETE /bids/:id

**Provider**
- GET /provider/profile
- PUT /provider/profile
- POST /provider/profile/image
- GET /provider/orders
- PATCH /provider/orders/:id/accept
- PATCH /provider/orders/:id/start
- PATCH /provider/orders/:id/begin
- PATCH /provider/orders/:id/complete
- POST /provider/location
- GET /provider/available-orders

**Chat**
- GET /orders/:id/messages
- POST /orders/:id/messages
- POST /orders/:id/messages/upload

**Notifications**
- GET /notifications
- PATCH /notifications/:id/read
- PATCH /notifications/read-all
- GET /notifications/unread-count
- GET /provider/notifications

**Paiements**
- POST /payments
- GET /payments/:id
- GET /payments/order/:id
- POST /payments/:id/confirm-client
- POST /payments/:id/confirm-provider

**Pricing**
- POST /pricing/calculate
- POST /pricing/check-night

**Evaluations**
- POST /orders/:id/review
- GET /orders/:id/review
- POST /orders/:id/satisfaction

**Urgence**
- POST /orders/:id/emergency

### 3.4 Systeme i18n Actuel

Le `LanguageContext.js` (800+ lignes) implemente:

1. **7 langues supportees**:
   - Francais (fr) - defaut
   - English (en)
   - Arabic (ar) - RTL
   - Espanol (es)
   - Deutsch (de)
   - Berbere Tifinagh (ber-tifinagh)
   - Berbere Latin (ber-latin)

2. **Fonctionnalites**:
   - `t(key, params)` - Traduction avec interpolation
   - `isRTL` - Boolean pour layout RTL
   - `language` - Code langue courante
   - `setLanguage()` - Changement de langue
   - `toArabicNumerals()` - Conversion chiffres arabes
   - `translateDynamic()` - Traduction DeepL temps reel
   - `translateDynamicBatch()` - Traduction batch DeepL

3. **RTL Implementation**:
   - `I18nManager.forceRTL` equivalent CSS
   - Class `body.rtl` pour styles globaux
   - Direction inversee automatique

---

## 4. Mapping Composants Web vers React Native

### 4.1 Composants UI de Base

| Composant Web (HTML/CSS) | React Native | Expo Module |
|--------------------------|--------------|-------------|
| `<div>` | `<View>` | - |
| `<span>`, `<p>` | `<Text>` | - |
| `<input type="text">` | `<TextInput>` | - |
| `<button>` | `<TouchableOpacity>` / `<Pressable>` | - |
| `<img>` | `<Image>` | expo-image (optimise) |
| `<a href>` | `<Link>` | expo-router |
| `<form>` | `<View>` + React Hook Form | - |
| `<select>` | Custom Picker / @react-native-picker/picker | - |
| `<textarea>` | `<TextInput multiline>` | - |
| `<iframe>` (maps) | `<MapView>` | react-native-maps |

### 4.2 Composants Specifiques GlamGo

| Composant Web | Equivalent React Native | Notes |
|---------------|------------------------|-------|
| `Chat.js` | `<Chat />` RN | Polling, images, moderation |
| `NotificationDropdown.js` | `<NotificationList />` | Modal ou screen |
| `LocationTracker.js` | `<MapTracker />` | react-native-maps |
| `AddressAutocomplete.js` | `<AddressInput />` | Google Places + fallback |
| `FormulaSelector.js` | `<FormulaCard />` | Cards selectionnables |
| `ServiceCard.js` | `<ServiceCard />` RN | Adaptation styles |
| `ProviderCard.js` | `<ProviderCard />` RN | Avatar, rating, distance |
| `PriceBreakdown.js` | `<PriceBreakdown />` RN | Idem |
| `ReviewModal.js` | `<ReviewSheet />` | Bottom Sheet |
| `EmergencyButton.js` | `<EmergencyFAB />` | FloatingActionButton |

### 4.3 Librairies Web vers Expo

| Librairie Web | Equivalent Expo/RN | Notes |
|---------------|-------------------|-------|
| next/navigation | expo-router | Similaire (file-based) |
| next/image | expo-image | Optimisation auto |
| SCSS Modules | StyleSheet.create() | Ou NativeWind |
| localStorage | AsyncStorage / expo-secure-store | Tokens dans SecureStore |
| sessionStorage | In-memory state | Redux ou contexte |
| fetch | fetch (natif) | Memes intercepteurs |
| window.location | expo-linking | Deep links |
| navigator.geolocation | expo-location | Plus robuste |
| Google Maps iframe | react-native-maps | Native |
| File input | expo-image-picker | Camera + galerie |

---

## 5. Architecture Mobile Proposee

### 5.1 Structure du Projet Expo

```
glamgo-mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Groupe auth (non authentifie)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   ├── provider-login.tsx
│   │   └── provider-register.tsx
│   ├── (client)/                 # Groupe client authentifie
│   │   ├── _layout.tsx           # Tab navigator client
│   │   ├── (tabs)/
│   │   │   ├── index.tsx         # Home - Services
│   │   │   ├── orders.tsx        # Mes commandes
│   │   │   ├── messages.tsx      # Conversations
│   │   │   └── profile.tsx       # Mon profil
│   │   ├── services/[id].tsx     # Detail service
│   │   ├── booking/[id].tsx      # Reservation
│   │   ├── orders/[id].tsx       # Detail commande
│   │   └── notifications.tsx     # Notifications
│   ├── (provider)/               # Groupe prestataire authentifie
│   │   ├── _layout.tsx           # Tab navigator provider
│   │   ├── (tabs)/
│   │   │   ├── dashboard.tsx     # Dashboard
│   │   │   ├── orders.tsx        # Commandes
│   │   │   ├── available.tsx     # Commandes dispo (bidding)
│   │   │   └── profile.tsx       # Profil
│   │   ├── orders/[id].tsx       # Detail commande provider
│   │   ├── services.tsx          # Mes services
│   │   └── notifications.tsx
│   ├── _layout.tsx               # Root layout (providers)
│   └── +not-found.tsx
├── src/
│   ├── components/
│   │   ├── ui/                   # Design system
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── ...
│   │   ├── forms/
│   │   │   ├── AddressInput.tsx
│   │   │   ├── DateTimePicker.tsx
│   │   │   └── FormulaSelector.tsx
│   │   ├── maps/
│   │   │   ├── MapView.tsx
│   │   │   ├── MapTracker.tsx
│   │   │   └── ProviderMarker.tsx
│   │   ├── chat/
│   │   │   ├── ChatView.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── QuickMessages.tsx
│   │   │   └── ImageUpload.tsx
│   │   ├── services/
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── ServiceList.tsx
│   │   │   └── CategoryFilter.tsx
│   │   ├── orders/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderStatus.tsx
│   │   │   ├── BidCard.tsx
│   │   │   └── PriceBreakdown.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── EmergencyButton.tsx
│   │       ├── LanguageSelector.tsx
│   │       ├── NotificationBadge.tsx
│   │       └── LoadingScreen.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   ├── useNearbyProviders.ts
│   │   ├── usePriceCalculation.ts
│   │   ├── useNightShift.ts
│   │   ├── useNotifications.ts
│   │   ├── useOfflineQueue.ts
│   │   └── useChat.ts
│   ├── store/                    # Redux Toolkit
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── servicesSlice.ts
│   │   │   ├── ordersSlice.ts
│   │   │   ├── chatSlice.ts
│   │   │   ├── notificationsSlice.ts
│   │   │   └── locationSlice.ts
│   │   └── persist.ts            # Redux Persist config
│   ├── api/
│   │   ├── client.ts             # Axios instance
│   │   ├── interceptors.ts       # Auth, retry, offline
│   │   ├── endpoints/
│   │   │   ├── auth.ts
│   │   │   ├── services.ts
│   │   │   ├── orders.ts
│   │   │   ├── chat.ts
│   │   │   └── ...
│   │   └── offlineQueue.ts       # Mutation queue
│   ├── i18n/
│   │   ├── index.ts              # i18next config
│   │   ├── locales/
│   │   │   ├── fr.json
│   │   │   ├── en.json
│   │   │   ├── ar.json
│   │   │   ├── es.json
│   │   │   ├── de.json
│   │   │   ├── ber-tifinagh.json
│   │   │   └── ber-latin.json
│   │   └── rtl.ts                # RTL utilities
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── dateTime.ts
│   │   ├── validation.ts
│   │   ├── contentModeration.ts
│   │   └── platform.ts
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── config.ts
│   └── types/
│       ├── api.ts
│       ├── navigation.ts
│       ├── models.ts
│       └── index.ts
├── assets/
│   ├── images/
│   ├── fonts/
│   │   ├── NotoSansArabic-*.ttf
│   │   └── NotoSansTifinagh-*.ttf
│   └── icons/
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── babel.config.js
├── tsconfig.json
├── metro.config.js
└── package.json
```

### 5.2 Navigation Structure

```
Root Navigator (Stack)
├── (auth) - Stack Navigator
│   ├── login
│   ├── register
│   ├── forgot-password
│   ├── provider-login
│   └── provider-register
│
├── (client) - Tab Navigator
│   ├── Home (Services)
│   │   └── [Stack] services/[id], booking/[id]
│   ├── Orders
│   │   └── [Stack] orders/[id]
│   ├── Messages
│   │   └── [Stack] chat/[orderId]
│   └── Profile
│       └── [Stack] notifications, settings
│
└── (provider) - Tab Navigator
    ├── Dashboard
    ├── Orders
    │   └── [Stack] orders/[id]
    ├── Available (Bidding)
    │   └── [Stack] orders/[id]/bid
    └── Profile
        └── [Stack] services, notifications, settings
```

### 5.3 State Management

**Redux Toolkit Slices:**

```typescript
// authSlice.ts
interface AuthState {
  isAuthenticated: boolean;
  userType: 'client' | 'provider' | null;
  user: User | null;
  provider: Provider | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// servicesSlice.ts
interface ServicesState {
  categories: Category[];
  services: Service[];
  selectedService: Service | null;
  formulas: Formula[];
  filters: ServiceFilters;
  isLoading: boolean;
}

// ordersSlice.ts
interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  bids: Bid[];
  providerOrders: Order[];
  availableOrders: Order[];
  isLoading: boolean;
}

// locationSlice.ts
interface LocationState {
  userLocation: Coordinates | null;
  providerLocation: Coordinates | null;
  nearbyProviders: Provider[];
  selectedAddress: Address | null;
  isTracking: boolean;
}

// chatSlice.ts
interface ChatState {
  conversations: Record<string, Message[]>;
  unreadCount: number;
  isConnected: boolean;
}

// notificationsSlice.ts
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  pushToken: string | null;
}
```

### 5.4 Strategie Offline-First

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Components                          │
├─────────────────────────────────────────────────────────────┤
│                    Redux Store                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Cached Data │  │ Pending Ops  │  │ Sync Status      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                 Persistence Layer                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Redux Persist + AsyncStorage            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            SQLite (expo-sqlite) - Heavy Data         │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   API Layer                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐   │
│  │ API Client   │  │ Offline Queue │  │ Retry Logic    │   │
│  └──────────────┘  └───────────────┘  └────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│               Network Monitor (NetInfo)                     │
└─────────────────────────────────────────────────────────────┘
```

**Donnees mises en cache:**
- Categories et services (TTL: 1h)
- Profil utilisateur/prestataire (TTL: 5min)
- Commandes actives (TTL: 30s)
- Messages recents (TTL: 1min)
- Traductions DeepL (persistant)

**Operations en file d'attente (Offline Queue):**
- Creation de commande
- Envoi de message
- Mise a jour localisation
- Acceptation/rejet d'offre
- Changement de statut commande

**Synchronisation:**
```typescript
// offlineQueue.ts
interface QueuedOperation {
  id: string;
  type: 'CREATE_ORDER' | 'SEND_MESSAGE' | 'UPDATE_LOCATION' | ...;
  payload: any;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
}

const syncQueue = async () => {
  const queue = await getQueue();
  for (const op of queue) {
    try {
      await executeOperation(op);
      await removeFromQueue(op.id);
    } catch (error) {
      if (op.retryCount < op.maxRetries) {
        await incrementRetry(op.id);
      } else {
        await moveToFailed(op);
      }
    }
  }
};
```

---

## 6. Plan de Migration i18n

### 6.1 Configuration i18next

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import es from './locales/es.json';
import de from './locales/de.json';
import berTifinagh from './locales/ber-tifinagh.json';
import berLatin from './locales/ber-latin.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    const savedLang = await AsyncStorage.getItem('user_language');
    if (savedLang) {
      callback(savedLang);
      return;
    }
    const deviceLang = Localization.locale.split('-')[0];
    callback(deviceLang);
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    await AsyncStorage.setItem('user_language', language);
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
      es: { translation: es },
      de: { translation: de },
      'ber-tifinagh': { translation: berTifinagh },
      'ber-latin': { translation: berLatin },
    },
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

### 6.2 Gestion RTL

```typescript
// src/i18n/rtl.ts
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

export const RTL_LANGUAGES = ['ar'];

export const isRTL = (language: string) => RTL_LANGUAGES.includes(language);

export const setRTL = async (language: string) => {
  const shouldBeRTL = isRTL(language);

  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);

    // Necessite un reload de l'app
    await Updates.reloadAsync();
  }
};

// Hook pour les styles RTL
export const useRTLStyles = () => {
  const { i18n } = useTranslation();
  const isRTL = RTL_LANGUAGES.includes(i18n.language);

  return {
    isRTL,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    textAlign: isRTL ? 'right' : 'left',
    marginStart: (value: number) => isRTL ? { marginRight: value } : { marginLeft: value },
    marginEnd: (value: number) => isRTL ? { marginLeft: value } : { marginRight: value },
  };
};
```

### 6.3 Migration des Traductions

Les traductions existantes dans `LanguageContext.js` (800+ lignes) doivent etre extraites vers des fichiers JSON separes:

```json
// locales/fr.json (extrait)
{
  "common": {
    "loading": "Chargement...",
    "error": "Erreur",
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "save": "Enregistrer",
    "delete": "Supprimer",
    "back": "Retour",
    "next": "Suivant",
    "search": "Rechercher",
    "filter": "Filtrer"
  },
  "auth": {
    "login": "Connexion",
    "register": "Inscription",
    "logout": "Deconnexion",
    "email": "Email",
    "password": "Mot de passe",
    "forgotPassword": "Mot de passe oublie ?",
    "rememberMe": "Se souvenir de moi"
  },
  "services": {
    "title": "Services",
    "search": "Rechercher un service",
    "noResults": "Aucun service trouve",
    "bookNow": "Reserver maintenant"
  },
  "orders": {
    "title": "Mes commandes",
    "pending": "En attente",
    "accepted": "Acceptee",
    "onWay": "En route",
    "inProgress": "En cours",
    "completed": "Terminee",
    "cancelled": "Annulee"
  },
  "chat": {
    "title": "Discussion",
    "placeholder": "Votre message...",
    "send": "Envoyer",
    "quickMessages": {
      "ok": "OK, merci",
      "whereAreYou": "Ou etes-vous ?",
      "arrived": "Je suis arrive(e)"
    }
  },
  "formula": {
    "standard": "Standard",
    "recurring": "Abonnement",
    "premium": "Premium",
    "urgent": "Urgent",
    "night": "Nuit"
  }
}
```

---

## 7. Plan de Developpement

### 7.1 Phase 1 - Setup & Fondations (Semaines 1-2)

**Sprint 1.1 - Setup Projet (5 jours)**
- [ ] Initialiser projet Expo managed workflow
- [ ] Configurer TypeScript
- [ ] Configurer EAS Build (eas.json)
- [ ] Installer et configurer dependencies de base
- [ ] Configurer ESLint, Prettier
- [ ] Setup variables d'environnement
- [ ] Creer structure de dossiers

**Sprint 1.2 - Design System (5 jours)**
- [ ] Migrer tokens couleurs, typographie, espacements
- [ ] Creer composants UI de base (Button, Input, Card, etc.)
- [ ] Implementer theme light/dark
- [ ] Creer composants de layout
- [ ] Documenter le Design System

**Livrables Phase 1:**
- Projet Expo fonctionnel avec build de test
- Design System complet avec 15+ composants

### 7.2 Phase 2 - Core Features (Semaines 3-4)

**Sprint 2.1 - Authentification (5 jours)**
- [ ] Implementer login client
- [ ] Implementer login prestataire
- [ ] Implementer inscription client
- [ ] Implementer inscription prestataire (multi-etapes)
- [ ] Configurer SecureStore pour tokens
- [ ] Implementer biometrie (FaceID/TouchID)
- [ ] Gerer sessions duales

**Sprint 2.2 - Navigation & Services (5 jours)**
- [ ] Configurer Expo Router
- [ ] Implementer navigation client (tabs + stack)
- [ ] Implementer navigation prestataire
- [ ] Page liste services avec categories
- [ ] Page detail service avec formules
- [ ] Systeme de filtres et recherche

**Livrables Phase 2:**
- Auth complete (2 profils)
- Navigation fonctionnelle
- Catalogue services complet

### 7.3 Phase 3 - Reservations & Orders (Semaines 5-6)

**Sprint 3.1 - Booking Flow (5 jours)**
- [ ] Page reservation complete
- [ ] Composant AddressInput (Google Places + fallback)
- [ ] Date/Time picker
- [ ] Composant FormulaSelector
- [ ] Calcul de prix en temps reel
- [ ] Detection horaire nuit
- [ ] Prestataires a proximite

**Sprint 3.2 - Order Management (5 jours)**
- [ ] Liste commandes client
- [ ] Detail commande avec statuts
- [ ] Actions client (confirmer, annuler)
- [ ] Dashboard prestataire
- [ ] Liste commandes prestataire
- [ ] Actions prestataire (accepter, demarrer, terminer)

**Livrables Phase 3:**
- Booking flow complet
- Gestion commandes 2 cotes

### 7.4 Phase 4 - Communication & Localisation (Semaines 7-8)

**Sprint 4.1 - Chat & Notifications (5 jours)**
- [ ] Chat temps reel (polling)
- [ ] Messages rapides
- [ ] Upload images avec moderation
- [ ] Push notifications (FCM)
- [ ] Notifications in-app
- [ ] Badges non lus

**Sprint 4.2 - Geolocalisation (5 jours)**
- [ ] Integration react-native-maps
- [ ] Suivi prestataire temps reel
- [ ] Partage position client
- [ ] Calcul distance
- [ ] Directions vers Google Maps

**Livrables Phase 4:**
- Chat fonctionnel
- Notifications push
- Tracking GPS complet

### 7.5 Phase 5 - Bidding & Features Avancees (Semaines 9-10)

**Sprint 5.1 - Systeme Encheres (5 jours)**
- [ ] Creation commande bidding
- [ ] Liste offres recues
- [ ] Accepter/rejeter offre
- [ ] Cote prestataire: commandes disponibles
- [ ] Creer une offre

**Sprint 5.2 - Features Complementaires (5 jours)**
- [ ] Evaluations et satisfaction
- [ ] Bouton urgence
- [ ] Moderation contenu chat
- [ ] Systeme priorite prestataires
- [ ] Historique paiements

**Livrables Phase 5:**
- Systeme bidding complet
- Features secondaires

### 7.6 Phase 6 - i18n & Polish (Semaines 11-12)

**Sprint 6.1 - Internationalisation (5 jours)**
- [ ] Configuration i18next
- [ ] Migration 7 langues
- [ ] Implementation RTL Arabic
- [ ] Traduction dynamique DeepL
- [ ] Tests toutes langues

**Sprint 6.2 - Offline & Performance (5 jours)**
- [ ] Redux Persist
- [ ] Offline queue
- [ ] Optimisation images
- [ ] Lazy loading
- [ ] Profiling performance

**Livrables Phase 6:**
- 7 langues fonctionnelles
- Mode offline
- App optimisee

### 7.7 Phase 7 - Testing & Deployment (Semaines 13-14)

**Sprint 7.1 - Testing (5 jours)**
- [ ] Tests unitaires (Jest)
- [ ] Tests composants (RTL)
- [ ] Tests E2E (Detox) - prioritaires
- [ ] Tests sur devices reels
- [ ] Bug fixes

**Sprint 7.2 - Deployment (5 jours)**
- [ ] Builds production EAS
- [ ] Metadata stores
- [ ] Screenshots et assets
- [ ] Soumission TestFlight
- [ ] Soumission Play Internal
- [ ] Corrections review

**Livrables Phase 7:**
- Apps sur TestFlight et Play Internal
- Documentation deployment

---

## 8. Dependances Recommandees

### 8.1 package.json

```json
{
  "name": "glamgo-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "build:preview": "eas build --profile preview",
    "build:production": "eas build --profile production"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-status-bar": "~1.12.1",
    "expo-splash-screen": "~0.27.0",
    "expo-secure-store": "~13.0.0",
    "expo-location": "~17.0.0",
    "expo-notifications": "~0.28.0",
    "expo-image-picker": "~15.0.0",
    "expo-image": "~1.12.0",
    "expo-linking": "~6.3.0",
    "expo-localization": "~15.0.0",
    "expo-local-authentication": "~14.0.0",
    "expo-file-system": "~17.0.0",
    "expo-sharing": "~12.0.0",
    "expo-updates": "~0.25.0",
    "expo-sqlite": "~14.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-safe-area-context": "~4.10.0",
    "react-native-screens": "~3.31.0",
    "react-native-maps": "1.14.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-native-async-storage/async-storage": "1.23.0",
    "@reduxjs/toolkit": "^2.2.0",
    "react-redux": "^9.1.0",
    "redux-persist": "^6.0.0",
    "axios": "^1.6.0",
    "i18next": "^23.10.0",
    "react-i18next": "^14.1.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "date-fns": "^3.6.0",
    "@gorhom/bottom-sheet": "^4.6.0",
    "react-native-svg": "15.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.0",
    "typescript": "~5.3.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.4.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0"
  }
}
```

### 8.2 app.json

```json
{
  "expo": {
    "name": "GlamGo",
    "slug": "glamgo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF6B6B"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.glamgo.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "GlamGo utilise votre position pour trouver les prestataires proches.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "GlamGo suit votre position pour le suivi des commandes.",
        "NSCameraUsageDescription": "GlamGo utilise la camera pour les photos de profil et du chat.",
        "NSPhotoLibraryUsageDescription": "GlamGo accede a vos photos pour les envoyer dans le chat.",
        "NSFaceIDUsageDescription": "GlamGo utilise Face ID pour une connexion securisee."
      },
      "config": {
        "googleMapsApiKey": "YOUR_IOS_GOOGLE_MAPS_API_KEY"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FF6B6B"
      },
      "package": "com.glamgo.app",
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_GOOGLE_MAPS_API_KEY"
        }
      },
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "GlamGo suit votre position pour le suivi des commandes."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#FF6B6B"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "GlamGo accede a vos photos pour les envoyer dans le chat."
        }
      ],
      "expo-localization"
    ],
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    },
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

### 8.3 eas.json

```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 9. Risques et Mitigations

### 9.1 Risques Techniques

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Complexite RTL Arabic | Elevee | Eleve | Tests precoces, composants dedies, expert RTL |
| Performance reseau Marrakech | Moyenne | Eleve | Offline-first, compression, retry logic |
| Integration Google Maps quota | Faible | Moyen | Fallback OpenStreetMap, cache agressif |
| Push notifications iOS | Moyenne | Moyen | Tests TestFlight precoces, APN certificats |
| Temps build EAS | Faible | Faible | Builds nocturnes, cache |

### 9.2 Risques Projet

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Scope creep | Elevee | Eleve | MVP strict, backlog priorise |
| Retards review stores | Moyenne | Moyen | Soumission beta precoce, guidelines |
| Evolution API backend | Faible | Moyen | Versionning API, backward compat |
| Ressources testing devices | Moyenne | Moyen | Cloud testing (BrowserStack) |

### 9.3 Risques Business

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Adoption utilisateurs | Moyenne | Eleve | Migration progressive, incentives |
| Maintenance double codebase | Moyenne | Moyen | Priorite mobile, web en maintenance |
| Couts EAS | Faible | Faible | Free tier suffisant pour debut |

---

## 10. Estimation Budget

### 10.1 Developpement (14 semaines)

| Phase | Semaines | Effort (j/h) | Cout estime* |
|-------|----------|--------------|--------------|
| Setup & Fondations | 2 | 80h | 4,000 EUR |
| Core Features | 2 | 80h | 4,000 EUR |
| Reservations & Orders | 2 | 80h | 4,000 EUR |
| Communication & Localisation | 2 | 80h | 4,000 EUR |
| Bidding & Features Avancees | 2 | 80h | 4,000 EUR |
| i18n & Polish | 2 | 80h | 4,000 EUR |
| Testing & Deployment | 2 | 80h | 4,000 EUR |
| **Total Developpement** | **14** | **560h** | **28,000 EUR** |

*Base: 50 EUR/h developpeur senior React Native

### 10.2 Couts Recurrents

| Service | Cout mensuel | Notes |
|---------|--------------|-------|
| EAS Build (Free tier) | 0 EUR | 30 builds/mois gratuits |
| EAS Build (Production) | 99 USD | Si > 30 builds |
| Apple Developer Program | 99 USD/an | Obligatoire iOS |
| Google Play Developer | 25 USD unique | Obligatoire Android |
| Firebase (Free tier) | 0 EUR | FCM + Analytics |
| Google Maps API | ~50 EUR | Selon usage |
| DeepL API | ~20 EUR | Traductions dynamiques |

### 10.3 Cout Total Premiere Annee

| Poste | Cout |
|-------|------|
| Developpement | 28,000 EUR |
| Apple Developer | 99 EUR |
| Google Play | 25 EUR |
| Services cloud (12 mois) | ~840 EUR |
| **Total** | **~29,000 EUR** |

---

## 11. Prochaines Etapes Immediates

### 11.1 Actions J+1 a J+7

1. **Validation du rapport** par les stakeholders
2. **Creation du repository** `glamgo-mobile`
3. **Setup Expo project** avec TypeScript
4. **Configuration EAS** et premier build de test
5. **Creation du Design System** de base
6. **Documentation technique** initiale

### 11.2 Checklist Pre-Developpement

- [ ] Comptes Apple Developer et Google Play actifs
- [ ] Cles API Google Maps (iOS + Android)
- [ ] Compte Firebase avec projet GlamGo
- [ ] Acces API DeepL
- [ ] Devices de test (Android + iOS)
- [ ] Environnement local configure (Node 18+, Expo CLI, EAS CLI)
- [ ] Variables d'environnement API backend

### 11.3 Contacts et Responsabilites

| Role | Responsabilite | Contact |
|------|----------------|---------|
| Tech Lead Mobile | Architecture, code review, decisions techniques | A definir |
| Dev React Native | Implementation features | A definir |
| Backend | Optimisations API mobile | @backend-glamgo |
| QA | Tests cross-platform | @qa-glamgo |
| Product Owner | Priorisation, validation | @chef-projet-glamgo |
| Designer | Assets mobiles, UI/UX | @designer-glamgo |

---

## 12. Conclusion

L'application web GlamGo presente une base solide pour une conversion mobile native. L'architecture API REST bien structuree, le Design System coherent et les fonctionnalites metier matures permettent d'envisager une conversion reussie en 14 semaines.

**Points forts:**
- API REST complete et documentee
- Systeme i18n mature (7 langues, RTL)
- Logic business complexe deja validee
- Design tokens bien definis

**Defis principaux:**
- Complexite RTL Arabic
- Mode offline pour reseau Marrakech
- Integration bidding temps reel
- Tests sur devices varies

**Recommandation finale:**
Demarrer le developpement avec une approche MVP, en priorisant les features P0 (auth, services, booking, chat, notifications) pour une premiere version livrable en 8 semaines, suivie d'iterations pour les features P1/P2.

---

*Document genere le 16 decembre 2025*
*Version 1.0*
