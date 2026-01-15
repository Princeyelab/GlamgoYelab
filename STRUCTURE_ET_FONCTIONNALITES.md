# 📱 Structure et Fonctionnalités - GlamGo

## 🌐 Web App (Next.js) - Frontend

### 📂 Structure de l'application

```
frontend/
├── src/
│   ├── app/                          # Pages Next.js (App Router)
│   │   ├── page.js                   # Page d'accueil
│   │   ├── login/                    # Connexion client
│   │   ├── register/                 # Inscription client
│   │   ├── profile/                  # Profil client
│   │   ├── services/                 # Liste des services
│   │   ├── booking/[id]/             # Détails de réservation
│   │   ├── orders/                   # Historique commandes client
│   │   ├── orders/[id]/              # Détails commande client
│   │   ├── addresses/                # Gestion adresses client
│   │   ├── notifications/            # Notifications client
│   │   ├── bidding/                  # Mode enchères client
│   │   ├── formulas/                 # Formules/packs client
│   │   ├── how-it-works/             # Comment ça marche
│   │   │   ├── client/               # Guide client
│   │   │   └── provider/             # Guide prestataire
│   │   ├── onboarding/
│   │   │   └── client/               # Onboarding client
│   │   ├── forgot-password/          # Mot de passe oublié client
│   │   ├── reset-password/           # Réinitialisation mdp client
│   │   ├── terms/                    # CGU
│   │   ├── privacy/                  # Politique de confidentialité
│   │   │
│   │   └── provider/                 # 🔧 ESPACE PRESTATAIRE
│   │       ├── login/                # Connexion prestataire
│   │       ├── register/             # Inscription prestataire
│   │       ├── dashboard/            # Dashboard prestataire ⭐
│   │       ├── profile/              # Profil prestataire
│   │       ├── services/             # Gestion services prestataire
│   │       ├── earnings/             # Revenus prestataire
│   │       ├── notifications/        # Notifications prestataire
│   │       ├── bidding/              # Mode enchères prestataire
│   │       ├── charter/              # Charte prestataire
│   │       ├── onboarding/           # Onboarding prestataire
│   │       ├── forgot-password/      # Mot de passe oublié
│   │       └── reset-password/       # Réinitialisation mdp
│   │
│   ├── components/                   # Composants réutilisables
│   │   ├── AddressAutocomplete/      # Autocomplétion adresse
│   │   ├── Button/                   # Bouton personnalisé
│   │   ├── Card/                     # Carte UI
│   │   ├── Chat/                     # Chat en temps réel
│   │   ├── ChatBot/                  # Chatbot IA
│   │   ├── ClientLayout/             # Layout client
│   │   ├── ClientLocationSharing/    # Partage localisation client
│   │   ├── CurrencySelector/         # Sélecteur devise
│   │   ├── DatePicker/               # Sélecteur de date
│   │   ├── DistanceFeeExplainer/     # Explications frais distance
│   │   ├── EmergencyButton/          # Bouton d'urgence
│   │   ├── EmergencyButtonProvider/  # Provider bouton urgence
│   │   ├── FormulaSelector/          # Sélecteur formule
│   │   ├── GuestSelector/            # Sélecteur nb personnes
│   │   ├── Header/                   # En-tête
│   │   ├── HomeContent/              # Contenu page accueil
│   │   ├── LanguageSwitcher/         # Changement langue
│   │   ├── LiveLocationTracker/      # Suivi GPS temps réel
│   │   ├── LocationPicker/           # Sélecteur localisation
│   │   ├── LocationTracker/          # Tracker GPS
│   │   ├── NavigationProgress/       # Barre progression
│   │   ├── NearbyProvidersList/      # Liste prestataires proches
│   │   ├── NightShiftWarning/        # Alerte service de nuit
│   │   ├── NotificationDropdown/     # Menu notifications
│   │   ├── PackSelector/             # Sélecteur pack
│   │   ├── PaymentMethodSetup/       # Configuration paiement
│   │   ├── Price/                    # Affichage prix
│   │   ├── PriceBreakdown/           # Détail prix
│   │   ├── ProviderCard/             # Carte prestataire
│   │   ├── ProviderLocationMap/      # Carte localisation prestataire
│   │   ├── ProviderMessagesDropdown/ # Menu messages prestataire
│   │   ├── ProviderNotificationDropdown/ # Notifications prestataire
│   │   ├── ProviderPriorityBadge/    # Badge priorité prestataire
│   │   ├── ProviderUnreadBadge/      # Badge non-lus prestataire
│   │   ├── ReviewModal/              # Modal avis
│   │   ├── SatisfactionModal/        # Modal satisfaction
│   │   ├── ServiceCard/              # Carte service
│   │   ├── ServiceSelector/          # Sélecteur service
│   │   ├── ServicesFilter/           # Filtres services
│   │   ├── ServicesHero/             # Hero services
│   │   ├── TermsModal/               # Modal CGU
│   │   ├── TranslatedText/           # Texte traduit
│   │   ├── UnreadBadge/              # Badge non-lus
│   │   └── WelcomePopup/             # Popup bienvenue
│   │
│   ├── contexts/                     # Contextes React
│   │   └── LanguageContext.js        # Contexte multilingue
│   │
│   └── lib/                          # Librairies utilitaires
│       ├── apiClient.js              # Client API
│       ├── textUtils.js              # Utilitaires texte
│       ├── serviceImages.js          # Images services
│       └── translations/             # Traductions
│           ├── en.js                 # Anglais
│           ├── fr.js                 # Français
│           ├── ar.js                 # Arabe
│           ├── es.js                 # Espagnol
│           └── de.js                 # Allemand
│
└── public/                           # Assets statiques
    └── images/services/              # Images des services
```

### ✨ Fonctionnalités Web App

#### 👤 CÔTÉ CLIENT

**Authentification & Profil**
- ✅ Inscription/Connexion client
- ✅ Réinitialisation mot de passe
- ✅ Gestion profil (photo, infos)
- ✅ Gestion adresses multiples
- ✅ Notifications en temps réel

**Réservation de services**
- ✅ Catalogue de services avec images
- ✅ Filtres par catégorie
- ✅ Sélection date/heure
- ✅ Sélection adresse
- ✅ Calcul frais de déplacement automatique
- ✅ Détail des prix avec breakdown
- ✅ Mode enchères (plusieurs prestataires)
- ✅ Sélection formules/packs
- ✅ Sélecteur nombre de personnes
- ✅ Alerte service de nuit

**Suivi de commande**
- ✅ Timer 4 minutes (attente acceptation)
- ✅ Suivi GPS en temps réel du prestataire
- ✅ Chat avec le prestataire
- ✅ Statuts: pending → accepted → on_way → arrived → in_progress → completed
- ✅ Bouton d'urgence
- ✅ Partage de localisation
- ✅ Notifications push

**Paiement & Historique**
- ✅ Paiement en ligne sécurisé
- ✅ Pourboires
- ✅ Historique des commandes
- ✅ Factures PDF
- ✅ Avis et évaluations

**Annulation**
- ✅ Annulation avec calcul de frais
- ✅ Raisons d'annulation
- ✅ Remboursement automatique

#### 🔧 CÔTÉ PRESTATAIRE

**Authentification & Profil**
- ✅ Inscription/Connexion prestataire
- ✅ Onboarding complet
- ✅ Charte prestataire
- ✅ Profil professionnel
- ✅ Gestion services proposés
- ✅ Rayon d'intervention

**Dashboard Prestataire**
- ✅ Statistiques temps réel (jour/semaine/mois)
- ✅ Commandes disponibles avec timer 4 min ⏱️
- ✅ Commandes en cours
- ✅ Blocage acceptation si commande active
- ✅ Bouton disponibilité ON/OFF
- ✅ Mise à jour localisation GPS

**Gestion des commandes**
- ✅ Acceptation/Refus commandes pending
- ✅ Filtrage géographique automatique
- ✅ Démarrage trajet (on_way)
- ✅ Arrivée chez client (arrived)
- ✅ Début prestation (in_progress)
- ✅ Fin prestation (completed)
- ✅ Chat avec client
- ✅ Bouton d'urgence
- ✅ GPS tracking temps réel

**Revenus & Paiements**
- ✅ Suivi revenus (jour/semaine/mois)
- ✅ Commission GlamGo (15%)
- ✅ Historique gains
- ✅ Pourboires reçus
- ✅ Système de paiement

**Mode Enchères**
- ✅ Voir commandes en enchères
- ✅ Faire des offres
- ✅ Suivi des enchères

**Notifications**
- ✅ Nouvelles commandes disponibles
- ✅ Acceptation/Refus client
- ✅ Messages client
- ✅ Fin de prestation

#### 🌍 MULTILINGUE
- ✅ Français (FR)
- ✅ Anglais (EN)
- ✅ Arabe (AR) avec RTL
- ✅ Espagnol (ES)
- ✅ Allemand (DE)

---

## 📱 Application Mobile (React Native + Expo)

### 📂 Structure de l'application

```
glamgo-mobile/
├── app/                              # Routes Expo Router
│   ├── _layout.tsx                   # Layout racine
│   ├── index.tsx                     # Page d'accueil
│   │
│   ├── (client)/                     # 👤 ESPACE CLIENT
│   │   ├── _layout.tsx               # Layout avec tab navigation
│   │   ├── index.tsx                 # Dashboard client
│   │   ├── services.tsx              # Catalogue services
│   │   ├── bookings.tsx              # Mes réservations
│   │   ├── favorites.tsx             # Prestataires favoris
│   │   └── profile.tsx               # Profil client
│   │
│   ├── (provider)/                   # 🔧 ESPACE PRESTATAIRE
│   │   ├── _layout.tsx               # Layout avec tab navigation
│   │   ├── index.tsx                 # Dashboard prestataire ⭐
│   │   ├── bookings.tsx              # Gestion commandes
│   │   ├── earnings.tsx              # Revenus
│   │   ├── services.tsx              # Services proposés
│   │   ├── custom-services.tsx       # Services personnalisés
│   │   ├── formulas.tsx              # Formules/packs
│   │   ├── onboarding.tsx            # Configuration initiale
│   │   ├── profile.tsx               # Profil prestataire
│   │   └── booking/
│   │       └── journey/[id].tsx      # Mode trajet GPS ⭐
│   │
│   ├── auth/                         # Authentification
│   │   ├── login.tsx                 # Connexion
│   │   ├── signup-client.tsx         # Inscription client
│   │   ├── signup-provider.tsx       # Inscription prestataire
│   │   ├── forgot-password.tsx       # Mot de passe oublié
│   │   ├── select-plan.tsx           # Choix plan prestataire
│   │   └── subscription-payment.tsx  # Paiement abonnement
│   │
│   ├── booking/                      # Réservation
│   │   ├── create.tsx                # Créer réservation
│   │   ├── confirmation.tsx          # Confirmation réservation
│   │   ├── track/[id].tsx            # Suivi commande ⭐
│   │   ├── payment/[id].tsx          # Paiement
│   │   └── review/[id].tsx           # Évaluation
│   │
│   ├── chat/[id].tsx                 # Chat temps réel
│   ├── notifications.tsx             # Centre notifications
│   ├── search.tsx                    # Recherche services
│   ├── settings.tsx                  # Paramètres
│   ├── edit-profile.tsx              # Modifier profil
│   ├── how-it-works.tsx              # Comment ça marche
│   │
│   ├── services/[id].tsx             # Détails service
│   ├── providers/[id].tsx            # Profil prestataire
│   └── reviews/[id].tsx              # Avis & évaluations
│
├── src/
│   ├── components/                   # Composants réutilisables
│   │   ├── ui/                       # Composants UI de base
│   │   │   ├── Button.tsx            # Boutons
│   │   │   ├── Card.tsx              # Cartes
│   │   │   ├── Badge.tsx             # Badges
│   │   │   ├── Input.tsx             # Champs texte
│   │   │   └── ...
│   │   │
│   │   ├── features/                 # Composants fonctionnels
│   │   │   ├── AddressAutocomplete.tsx       # Autocomplétion adresse
│   │   │   ├── BookingCard.tsx               # Carte réservation
│   │   │   ├── CancellationModal.tsx         # Modal annulation
│   │   │   ├── CategoryCard.tsx              # Carte catégorie
│   │   │   ├── ChatBot.tsx                   # Chatbot IA
│   │   │   ├── ClientGlobalModals.tsx        # Modals client
│   │   │   ├── CreditCardForm.tsx            # Formulaire CB
│   │   │   ├── CurrencySelector.tsx          # Sélecteur devise
│   │   │   ├── DistanceFeeAlert.tsx          # Alerte frais distance
│   │   │   ├── EmergencyButton.tsx           # Bouton urgence
│   │   │   ├── FormulaSelector.tsx           # Sélecteur formule
│   │   │   ├── GlobalEmergencyButton.tsx     # Bouton urgence global
│   │   │   ├── GuestSelector.tsx             # Sélecteur personnes
│   │   │   ├── LanguageSelector.tsx          # Changement langue
│   │   │   ├── NearbyProvidersMap.tsx        # Carte prestataires
│   │   │   ├── PackSelector.tsx              # Sélecteur pack
│   │   │   ├── PaymentMethodSelector.tsx     # Sélecteur paiement
│   │   │   ├── PendingBookingBanner.tsx      # Bannière commande pending ⏱️
│   │   │   ├── PendingOrdersBanner.tsx       # Bannière prestataire ⏱️
│   │   │   ├── PriceBreakdownCard.tsx        # Détail prix
│   │   │   ├── ProviderCard.tsx              # Carte prestataire
│   │   │   ├── ProviderProfileModal.tsx      # Modal profil prestataire
│   │   │   ├── ProviderSelector.tsx          # Sélecteur prestataire
│   │   │   ├── RadiusSelector.tsx            # Rayon intervention
│   │   │   ├── ReviewCard.tsx                # Carte avis
│   │   │   ├── RibForm.tsx                   # Formulaire RIB
│   │   │   ├── SatisfactionModal.tsx         # Modal satisfaction
│   │   │   ├── ServiceCard.tsx               # Carte service
│   │   │   └── Skeleton*.tsx                 # Loaders squelette
│   │   │
│   │   ├── navigation/               # Composants navigation
│   │   │   └── CustomTabBar.tsx      # Tab bar personnalisée
│   │   │
│   │   └── layout/                   # Composants layout
│   │       └── SafeAreaWrapper.tsx   # Wrapper safe area
│   │
│   ├── contexts/                     # Contextes React
│   │   └── LanguageContext.tsx       # Contexte multilingue
│   │
│   ├── hooks/                        # Hooks personnalisés
│   │   ├── useLocation.ts            # Hook géolocalisation
│   │   ├── useNotifications.ts       # Hook notifications
│   │   └── useTheme.ts               # Hook thème
│   │
│   ├── i18n/                         # Internationalization
│   │   └── translations/
│   │       ├── fr.ts                 # Français
│   │       ├── en.ts                 # Anglais
│   │       ├── ar.ts                 # Arabe
│   │       ├── es.ts                 # Espagnol
│   │       ├── de.ts                 # Allemand
│   │       └── services.ts           # Traductions services
│   │
│   ├── lib/                          # Librairies
│   │   ├── api/                      # Clients API
│   │   │   ├── client.ts             # Client API de base
│   │   │   ├── authAPI.ts            # API auth
│   │   │   ├── providerAPI.ts        # API prestataire
│   │   │   └── bookingAPI.ts         # API réservations
│   │   │
│   │   ├── store/                    # Redux store
│   │   │   ├── store.ts              # Configuration store
│   │   │   └── slices/               # Slices Redux
│   │   │       ├── authSlice.ts      # Auth state
│   │   │       ├── bookingSlice.ts   # Bookings state
│   │   │       └── uiSlice.ts        # UI state
│   │   │
│   │   ├── constants/                # Constantes
│   │   │   └── theme.ts              # Thème de l'app
│   │   │
│   │   ├── utils/                    # Utilitaires
│   │   │   ├── geoUtils.ts           # Calculs géographiques
│   │   │   ├── dateUtils.ts          # Manipulation dates
│   │   │   ├── haptics.ts            # Retours haptiques
│   │   │   ├── errorHandler.ts       # Gestion erreurs
│   │   │   ├── accessibility.ts      # Accessibilité
│   │   │   └── cancelledOrdersCache.ts # Cache annulations ⭐
│   │   │
│   │   └── helpers/                  # Helpers
│   │       └── bookingStatus.ts      # Helpers statuts
│   │
│   └── types/                        # Types TypeScript
│       ├── booking.ts
│       ├── provider.ts
│       └── user.ts
│
└── assets/                           # Assets (images, fonts)
```

### ✨ Fonctionnalités App Mobile

#### 👤 CÔTÉ CLIENT

**Authentification & Profil**
- ✅ Inscription/Connexion avec biométrie
- ✅ Authentification Touch ID / Face ID
- ✅ Gestion profil avec photo
- ✅ Notifications push natives
- ✅ Multilingue (5 langues)

**Découverte & Réservation**
- ✅ Dashboard avec services populaires
- ✅ Catalogue services avec images
- ✅ Recherche avancée
- ✅ Favoris prestataires
- ✅ Carte interactive prestataires proches
- ✅ Sélection date/heure native
- ✅ Géolocalisation automatique
- ✅ Calcul frais déplacement
- ✅ Formules et packs
- ✅ Sélecteur nombre de personnes

**Suivi de commande en temps réel ⭐**
- ✅ Timer 4 minutes avec compte à rebours
- ✅ Bannière persistante commande pending
- ✅ Suivi GPS en direct du prestataire
- ✅ Carte interactive avec itinéraire
- ✅ Chat temps réel
- ✅ Notifications statut
- ✅ Bouton d'urgence global
- ✅ Partage localisation

**Paiement & Historique**
- ✅ Paiement intégré (Stripe)
- ✅ Apple Pay / Google Pay
- ✅ Pourboires
- ✅ Historique commandes
- ✅ Factures téléchargeables
- ✅ Avis et notes

**Annulation & Support**
- ✅ Annulation avec calcul frais
- ✅ Modal annulation détaillée
- ✅ Raisons prédéfinies
- ✅ Chatbot support IA

#### 🔧 CÔTÉ PRESTATAIRE

**Dashboard Prestataire ⭐**
- ✅ Statistiques temps réel avec graphiques
- ✅ Revenus jour/semaine/mois
- ✅ Commandes disponibles avec timer
- ✅ Badge notifications commandes
- ✅ Blocage multi-acceptation
- ✅ Bouton disponibilité animé
- ✅ GPS et rayon d'intervention
- ✅ Filtrage automatique distance

**Gestion commandes avancée**
- ✅ Acceptation/Refus avec feedback haptique
- ✅ Liste organisée (pending/upcoming/in_progress)
- ✅ Bannière commandes en attente ⏱️
- ✅ Auto-expiration 4 minutes
- ✅ Cache annulations local

**Mode Trajet GPS ⭐**
- ✅ Navigation vers client
- ✅ Tracking GPS continu
- ✅ Mise à jour position toutes les 10s
- ✅ Carte avec itinéraire
- ✅ Distance et temps restant
- ✅ Bouton "J'arrive"
- ✅ Chat durant trajet
- ✅ Bouton urgence

**Prestation & Paiement**
- ✅ Début prestation
- ✅ Timer prestation
- ✅ Fin prestation
- ✅ Calcul automatique gains
- ✅ Commission 15% GlamGo
- ✅ Historique revenus
- ✅ Statistiques performance

**Services & Configuration**
- ✅ Onboarding guidé
- ✅ Gestion services proposés
- ✅ Services personnalisés
- ✅ Formules et packs
- ✅ Configuration rayon
- ✅ Horaires disponibilité

#### 🎨 UX/UI Mobile

**Design**
- ✅ Dark mode
- ✅ Animations fluides
- ✅ Retours haptiques
- ✅ Loaders squelette
- ✅ Pull-to-refresh
- ✅ Swipe gestures

**Performance**
- ✅ Cache local (AsyncStorage)
- ✅ Optimistic UI updates
- ✅ Offline support partiel
- ✅ Images optimisées
- ✅ Lazy loading

**Accessibilité**
- ✅ VoiceOver / TalkBack
- ✅ Tailles texte dynamiques
- ✅ Contraste élevé
- ✅ Navigation clavier

---

## 🔄 Fonctionnalités communes aux 2 apps

### ✅ Système de commandes complet
- Timer 4 minutes avec auto-annulation
- Statuts: pending → accepted → on_way → arrived → in_progress → completed → cancelled
- Chat temps réel client-prestataire
- Suivi GPS en direct
- Notifications push

### ✅ Paiement & Facturation
- Paiement sécurisé Stripe
- Calcul automatique frais distance
- Pourboires
- Factures PDF
- Historique transactions

### ✅ Multilingue
- 5 langues (FR, EN, AR, ES, DE)
- RTL pour l'arabe
- Traductions services

### ✅ Sécurité
- Authentification JWT
- Bouton d'urgence
- Partage localisation
- Notifications critiques

---

## 📊 Comparaison Web vs Mobile

| Fonctionnalité | Web App | App Mobile |
|---|---|---|
| **Dashboard prestataire** | ✅ Complet | ✅ Complet + |
| **Timer 4 min** | ✅ Basique | ✅ Avancé avec bannière |
| **GPS Tracking** | ✅ Carte statique | ✅ Navigation temps réel |
| **Mode trajet** | ❌ | ✅ Dédié |
| **Notifications** | ✅ Web push | ✅ Push natives |
| **Biométrie** | ❌ | ✅ Touch ID/Face ID |
| **Offline** | ❌ | ✅ Partiel |
| **Performances** | ✅ Bonnes | ✅ Excellentes |
| **UX** | ✅ Desktop/Mobile | ✅ Native optimisée |

---

## 🚀 Technologies utilisées

### Web App
- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript
- **Styling**: SCSS Modules
- **State**: React Context
- **Maps**: Google Maps API
- **Paiement**: Stripe
- **Chat**: WebSockets

### App Mobile
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State**: Redux Toolkit
- **Styling**: StyleSheet + Theme
- **Maps**: react-native-maps
- **Location**: expo-location
- **Storage**: AsyncStorage
- **Notifications**: expo-notifications
- **Paiement**: Stripe SDK

---

## 📝 Notes importantes

### ⏱️ Système de Timer 4 minutes
- Les commandes pending expirent après 4 minutes
- Auto-annulation automatique en base de données
- Notifications envoyées au client
- Cache local pour éviter réapparition

### 🔒 Blocage multi-acceptation
- Un prestataire ne peut avoir qu'une seule commande active
- Vérification au moment de l'acceptation
- Modal explicite si commande en cours
- Statuts bloquants: accepted, on_way, arrived, in_progress

### 🗺️ Géolocalisation
- Filtrage automatique par distance
- Calcul frais déplacement dynamique
- Suivi GPS temps réel en mode trajet
- Mise à jour position toutes les 10s

### 💰 Système de paiement
- Commission GlamGo: 15%
- Pourboires facultatifs
- Frais d'annulation selon conditions
- Remboursement automatique si applicable

---

Date de création: 2026-01-12
