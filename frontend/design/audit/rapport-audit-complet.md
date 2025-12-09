# Rapport d'Audit Design Complet - GlamGo

**Date:** 09 Décembre 2025
**Auditeur:** @design-glamgo
**User Story:** US-DESIGN-001 - Refonte Design App-Like Mobile-First
**Statut:** AUDIT TERMINÉ

---

## Executive Summary

L'audit révèle que **GlamGo possède déjà une base solide en termes d'architecture responsive et de bonnes pratiques**, mais souffre de **lacunes critiques** pour devenir une application moderne de type App-Like. L'application actuelle présente :

- **POINTS POSITIFS** : Architecture Mobile-First déjà en place, système SCSS bien structuré avec variables et mixins, support RTL arabe fonctionnel, composants React modulaires.
- **POINTS CRITIQUES** : Absence de Bottom Navigation mobile, palette de couleurs non conforme aux directives (rouge/cyan vs rouge/orange), border-radius trop petits (8-12px vs 20px requis), CTAs non orientés bénéfice, absence de Tailwind CSS, esthétique datée.

**Verdict :** La migration vers Tailwind CSS et la refonte design sont **NÉCESSAIRES** pour atteindre les standards App-Like modernes. Estimation : **8-10 semaines** de travail.

---

## 1. STRUCTURE DU PROJET

### 1.1 Architecture Frontend Actuelle

```
frontend/src/
├── app/                    # Pages Next.js 16 (App Router)
│   ├── page.js            # Home
│   ├── services/          # Services
│   ├── orders/            # Réservations
│   ├── profile/           # Profil utilisateur
│   ├── provider/          # Espace prestataire
│   └── [...autres pages]
├── components/            # Composants React
│   ├── Header/           # Navigation top (classique)
│   ├── ServiceCard/      # Cards services
│   ├── CategoryCard/     # Cards catégories
│   ├── Button/           # Boutons
│   └── [...35+ composants]
├── contexts/             # Contextes React
├── hooks/                # Custom hooks
├── lib/                  # Utilitaires
└── styles/               # SCSS global
    ├── globals.scss      # Styles globaux
    ├── _variables.scss   # Variables design
    └── _mixins.scss      # Mixins réutilisables
```

**CONSTAT** : Architecture propre et modulaire. Bonne séparation des responsabilités. 35+ composants déjà créés.

---

## 2. NAVIGATION ACTUELLE

### 2.1 Header Classique (Top Navigation)

**Type** : Navigation desktop classique avec hamburger menu mobile

**Caractéristiques** :
- Position : `sticky top`
- Mobile : Hamburger menu slide-in (280px width)
- Desktop : Navigation horizontale avec dropdowns
- Tablette : Hybride (nav visible + hamburger pour extras)

**PROBLÈMES IDENTIFIÉS** :

#### 🔴 CRITIQUE : Absence de Bottom Navigation Mobile
- **Impact** : Expérience non App-Like, navigation difficile en zone thumb
- **Écart directive** : US-DESIGN-001 exige Bottom Nav avec 5 items max (Home, Search, Orders, Messages, Profile)
- **Solution** : Créer composant `BottomNavigation.jsx` avec items fixes, height 64px, touch targets 44x44px

#### 🟡 MAJEUR : Hamburger menu non optimal
- **Problème** : Menu slide-in depuis la droite (RTL non optimal), overlay gris 50%
- **Meilleure pratique** : Bottom sheet ou drawer plein écran
- **Solution** : Remplacer par bottom sheet moderne (Material Design 3 style)

#### 🟢 MINEUR : Icônes pas assez visibles
- **Problème** : FaUserCircle, FaComments (React Icons) gris, peu contrastés
- **Solution** : Adopter Heroicons ou Lucide (plus modernes), couleur primaire active

---

## 3. DESIGN SYSTEM ACTUEL (SCSS)

### 3.1 Palette de Couleurs

**ACTUELLE** :
```scss
$primary-color: #FF6B6B;      // Rouge corail
$primary-dark: #E85555;
$primary-light: #FF9B9B;

$secondary-color: #4ECDC4;    // Cyan/Turquoise
$secondary-dark: #3BBFB5;
$secondary-light: #7ED9D2;

// Grays
$gray-100 à $gray-900         // 9 nuances (bien)

// Status
$success: #28A745;            // Vert standard
$warning: #FFC107;            // Jaune/Orange
$error: #DC3545;              // Rouge
```

**🔴 CRITIQUE : Palette NON CONFORME aux directives**

**DIRECTIVE STRICTE** :
```scss
Primary: #E63946 (Red - Main actions)
Secondary: #F4A261 (Orange - Secondary actions)
Accent: #2A9D8F (Green - Success)
```

**ÉCARTS** :
- Primary actuel (#FF6B6B) ≠ Primary requis (#E63946) → Trop clair, manque de punch
- Secondary actuel (#4ECDC4 cyan) ≠ Secondary requis (#F4A261 orange) → **TOTALEMENT DIFFÉRENT**
- Accent manquant : #2A9D8F (teal) non présent

**IMPACT** : Identité visuelle incohérente, manque de warmth (chaleur), palette trop froide.

**ACTION IMMÉDIATE** : Remplacer toutes les couleurs dans `tailwind.config.js` lors de la migration.

---

### 3.2 Border Radius

**ACTUEL** :
```scss
$radius-sm: 0.25rem;    // 4px
$radius-md: 0.5rem;     // 8px
$radius-lg: 0.75rem;    // 12px
$radius-xl: 1rem;       // 16px
$radius-2xl: 1.5rem;    // 24px
$radius-full: 9999px;
```

**🟡 MAJEUR : Radius trop petits**

**DIRECTIVE STRICTE** :
```
Radius-md: 16px
Radius-lg: 20px
Radius-xl: 24px
Radius-full: 9999px (pills)
```

**ÉCARTS** :
- Radius principal des cards : 8-12px actuel vs **20px MINIMUM requis**
- Buttons : 8px actuel vs **pill shape (9999px) requis**

**IMPACT** : Look trop "carré", manque de modernité, pas App-Like.

**ACTION** : Augmenter tous les radius de +8-12px lors de la migration Tailwind.

---

### 3.3 Shadows

**ACTUEL** :
```scss
$shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
$shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), ...
$shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), ...
$shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), ...
```

**🟢 MINEUR : Shadows corrects mais pas Material Design 3**

**DIRECTIVE STRICTE** :
```
Shadow-sm: 0 2px 8px rgba(0,0,0,0.06)
Shadow-md: 0 4px 16px rgba(0,0,0,0.08)
Shadow-lg: 0 8px 32px rgba(0,0,0,0.12)
```

**ÉCARTS** :
- Shadows actuelles : style Tailwind CSS v2 (multiples couches)
- Shadows requises : style Material Design 3 (single layer, plus soft)

**IMPACT** : Esthétique légèrement plus dure, moins "douce".

**ACTION** : Remplacer par shadows MD3 dans `tailwind.config.js`.

---

### 3.4 Typographie

**ACTUEL** :
```scss
$font-family-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...
```

**🔴 CRITIQUE : Typographie NON CONFORME**

**DIRECTIVE STRICTE** :
```
Fonts: Inter (body), Poppins (headings)
```

**ÉCARTS** :
- Font actuelle : System fonts (Apple/Segoe UI/Roboto)
- Fonts requises : **Inter** pour body, **Poppins** pour headings

**IMPACT** : Manque de personnalité, look "générique".

**ACTION** :
1. Installer `@next/font/google` (déjà en place)
2. Charger Inter + Poppins depuis Google Fonts
3. Appliquer dans `layout.js` et Tailwind config

---

## 4. COMPOSANTS CRITIQUES

### 4.1 ServiceCard

**Fichier** : `components/ServiceCard/ServiceCard.module.scss`

**ANALYSE** :

✅ **POINTS POSITIFS** :
- Mobile-First parfaitement implémenté
- Responsive (150px → 180px → 200px image height)
- Hover effect (transform scale image)
- Text clamp (2 lignes titre, 3 lignes description)
- Footer avec price + rating bien agencé

🔴 **CRITIQUES** :
1. **Border-radius : 8px** (ligne 24) vs **20px requis**
   ```scss
   // ACTUEL
   border-radius: $radius-md; // 8px

   // REQUIS
   border-radius: 20px; // radius-lg directive
   ```

2. **Hover translateY(-4px)** : Trop subtil
   ```scss
   // ACTUEL (mixin card ligne 265)
   transform: translateY(-4px);

   // MEILLEUR
   transform: translateY(-6px);
   ```

3. **Absence de badges "Popular", "Top Rated"**
   - Pas de social proof stratégique
   - Directive : "Strategic badges: Popular, Top Rated"

4. **Category badge : 10px → 12px mobile** : Trop petit
   ```scss
   // ACTUEL
   font-size: 10px; // mobile

   // MEILLEUR
   font-size: 12px; // 14px minimum requis
   ```

🟡 **MAJEURS** :
1. **Rating étoile non remplie** (★ unicode vs filled star icon)
2. **Prix pas assez visible** (18px → 20px → 24px) : OK mais pourrait être plus gros
3. **CTA "Réserver" manquant** : Card cliquable mais pas de bouton explicite

**RECOMMANDATIONS** :
- Migrer vers Tailwind avec `rounded-[20px]`
- Ajouter badge absolu "Popular" si `total_reviews > 50`
- Remplacer étoile unicode par Heroicon `StarIcon` filled
- Ajouter micro-animation hover sur card entière (not just image)

---

### 4.2 Header / Navigation

**Fichier** : `components/Header/Header.module.scss`

**ANALYSE** :

✅ **POINTS POSITIFS** :
- Sticky header fonctionnel
- Mobile menu slide-in smooth
- Dropdown "Comment ça marche" bien pensé
- Responsive parfait (mobile/tablet/desktop)
- RTL support intégré

🔴 **CRITIQUES** :
1. **Absence Bottom Navigation mobile** (déjà mentionné)
2. **Logo height 32px mobile** : Trop petit
   ```scss
   // ACTUEL
   height: 32px; // mobile

   // MEILLEUR
   height: 40px; // Plus visible
   ```

3. **NavLink underline animation** : Présent mais uniquement sur active
   ```scss
   // Ligne 143 : underline uniquement si active
   // MEILLEUR : underline au hover aussi
   ```

4. **User menu dropdown** : 200px min-width trop petit
   ```scss
   // ACTUEL
   min-width: 200px;

   // MEILLEUR
   min-width: 240px; // Plus spacieux
   ```

🟡 **MAJEURS** :
1. **Mobile menu 280px** : OK mais pourrait être 300px
2. **Hamburger icon** : Custom CSS (3 lignes) vs Heroicon moderne
3. **FaUserCircle** : React Icons daté vs Avatar component moderne

**RECOMMANDATIONS** :
- Créer `BottomNavigation.jsx` avec 5 items fixes
- Remplacer hamburger custom par Heroicon `Bars3Icon`
- Créer composant `Avatar` réutilisable (initiales + photo)
- Augmenter logo size mobile (40px min)

---

### 4.3 Button Component

**Fichier** : `components/Button/` (non lu mais inféré depuis Header)

**ANALYSE** :

✅ **POINTS POSITIFS** :
- Variants : primary, secondary, outline (ligne 198-200 Header)
- Sizes : small, large (ligne 199, 204 Header)

🔴 **CRITIQUES** :
1. **Border-radius probablement 8px** vs **pill shape requis**
   ```scss
   // Mixin button-base ligne 200 (_mixins.scss)
   border-radius: $radius-md; // 8px

   // REQUIS
   border-radius: 9999px; // Pill shape
   ```

2. **Height minimum 56px requis** (directive)
   - Actuel : Probablement 40-44px (inféré depuis padding)
   - Requis : **56px minimum** pour touch-friendly

3. **Texte CTA non orienté bénéfice**
   - Exemples actuels (Header ligne 199, 204) :
     - "Se connecter" ❌
     - "S'inscrire" ❌
   - Exemples requis :
     - "Commencer maintenant" ✅
     - "Trouver mon pro" ✅

**RECOMMANDATIONS** :
- Migrer vers Tailwind : `rounded-full h-14` (56px)
- Réécrire tous les textes CTA (voir section 7)
- Ajouter variante `loading` avec spinner

---

### 4.4 HomeContent

**Fichier** : `components/HomeContent/HomeContent.js`

**ANALYSE** :

✅ **POINTS POSITIFS** :
- Structure claire : Hero, Categories, How It Works, Popular, CTA
- Icônes Heroicons SVG (SearchIcon, CalendarIcon, etc.) : EXCELLENT
- Section "Comment ça marche" avec 4 étapes : PARFAIT
- Grid responsive : 2 cols mobile, 3 cols tablet/desktop

🔴 **CRITIQUES** :
1. **Hero gradient** : Linear-gradient 135deg ok mais couleurs non conformes
   ```scss
   // Ligne 9 page.module.scss
   background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
   // Actuel : #FF6B6B → #4ECDC4 (rouge → cyan)
   // Requis : #E63946 → #F4A261 (rouge → orange)
   ```

2. **SearchBar dans Hero** : Présent mais pas de style App-Like
   - Manque d'elevation (shadow)
   - Border-radius probablement 12px vs 20px requis

3. **Section "How It Works" icons** : 60-80px circles
   - OK mais gradient non conforme (couleurs)

4. **CTA finale "Créer un compte"** : ❌ Texte non orienté bénéfice
   ```js
   // Ligne 167 HomeContent.js
   {t('home.createAccount')} // "Créer un compte"

   // MEILLEUR
   "Commencer gratuitement" ✅
   ```

🟡 **MAJEURS** :
1. **Absence de social proof dans Hero**
   - Directive : "X people booked today", ratings visibles
   - Actuel : Aucun chiffre, aucune stat

2. **Section Popular Services** : Pas de tri par popularité visible
   - Manque badge "Top Rated", "Most Booked"

**RECOMMANDATIONS** :
- Ajouter dans Hero : "12 000+ clients satisfaits" + "4.8/5 étoiles"
- Ajouter badges dynamiques sur ServiceCard (Popular, Top Rated)
- Réécrire CTAs : "Trouver mon service" vs "Créer un compte"

---

## 5. STYLES SCSS vs TAILWIND

### 5.1 État Actuel

**SCSS** :
- ✅ Variables bien définies (`_variables.scss`)
- ✅ Mixins réutilisables (`_mixins.scss`)
- ✅ Module CSS par composant (`.module.scss`)
- ✅ Support RTL intégré (`body.rtl` dans `globals.scss`)

**Tailwind** :
- ❌ **ABSENT** : Aucun `tailwind.config.js` trouvé
- ❌ Aucune classe Tailwind dans les composants
- ❌ Migration 0% effectuée

**🔴 CRITIQUE : Tailwind CSS requis mais non installé**

**DIRECTIVE** : "Migration complète de SCSS vers Tailwind CSS"

**IMPACT** :
- Code difficile à maintenir (SCSS custom partout)
- Incohérences de style possibles
- Bundle CSS plus lourd (SCSS non purgé)
- Pas de JIT compilation (Tailwind v3 feature)

---

### 5.2 Plan de Migration Tailwind

**PHASE 1 : Installation (1 jour)**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**PHASE 2 : Configuration `tailwind.config.js` (1 jour)**
```js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E63946',
          dark: '#D62828',
          light: '#F1808A',
        },
        secondary: {
          DEFAULT: '#F4A261',
          dark: '#E76F51',
          light: '#F8C9A3',
        },
        accent: {
          DEFAULT: '#2A9D8F',
          dark: '#1E7970',
          light: '#4CC9BC',
        },
        gray: {
          900: '#1A1A1A',
          700: '#4A4A4A',
          500: '#8E8E8E',
          300: '#D1D1D1',
          100: '#F5F5F5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Body
        heading: ['Poppins', 'sans-serif'], // Headings
      },
      borderRadius: {
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
```

**PHASE 3 : Migration composants (3 semaines)**
- Semaine 1 : Composants atomiques (Button, Card, Input, Badge)
- Semaine 2 : Composants features (ServiceCard, Header, BottomNav)
- Semaine 3 : Pages (Home, Services, Profile, etc.)

**PHASE 4 : Nettoyage SCSS (3 jours)**
- Supprimer tous les `.module.scss`
- Garder uniquement `globals.scss` pour resets
- Backup avant suppression (Git tag)

---

## 6. RESPONSIVE & MOBILE-FIRST

### 6.1 Breakpoints Actuels

```scss
// _variables.scss
$breakpoint-xs: 320px;
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;

// _mixins.scss (Mobile-First)
$mobile-max: 767px;
$tablet-min: 768px;
$desktop-min: 1024px;
```

**✅ EXCELLENT : Mobile-First déjà en place**

**Constat** :
- Tous les composants commencent par mobile (375px de facto)
- Utilisation correcte de `@include tablet-up`, `@include desktop`
- Progressive enhancement bien appliqué

**🟢 MINEUR : Breakpoints non Tailwind standard**

**Tailwind default** :
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

**GlamGo actuel** : Identique → Parfait !

**Recommandation** : Garder les breakpoints actuels lors de la migration Tailwind.

---

### 6.2 Touch Targets

**DIRECTIVE** : Minimum 44x44px pour tous les éléments interactifs

**AUDIT** :

✅ **CONFORMES** :
- Header logo : 32-50px height → OK
- Mobile menu button : 40x40px → ❌ LIMITE (devrait être 44px)
- User icon : 36-40px → ❌ LIMITE

🔴 **NON CONFORMES** :
1. **NavLink** : Pas de height/padding définis
   ```scss
   // Header.module.scss ligne 118
   .navLink {
     font-size: 14-16px;
     // Pas de padding vertical explicite
   }

   // REQUIS
   .navLink {
     padding: 12px 16px; // 44px height minimum
   }
   ```

2. **Category badges** : 10-12px font + 2-8px padding
   ```scss
   // ServiceCard.module.scss ligne 82-88
   padding: 2px $spacing-xs; // Mobile ~10px height total

   // REQUIS
   padding: 8px 16px; // 28-32px height minimum (badge ok)
   ```

3. **Dropdown items** : Padding probablement < 44px
   ```scss
   // Header.module.scss ligne 530
   .dropdownItem {
     padding: $spacing-sm $spacing-md; // 8px 16px = 32px height
   }

   // REQUIS
   padding: 12px 16px; // 44px height minimum
   ```

**RECOMMANDATION** : Systématiquement utiliser `min-h-[44px]` Tailwind sur tous les interactifs.

---

## 7. CONVERSION OPTIMIZATION (CRO)

### 7.1 Social Proof

**DIRECTIVE** :
- Ratings visibles
- "X people booked today"
- Reviews avec photos
- Badges "Popular", "Top Rated"

**ACTUEL** :

✅ **PRÉSENT** :
- Ratings étoiles sur ServiceCard (ligne 107-114 ServiceCard.js)
- Total reviews affiché : `(12)` format

🔴 **ABSENT** :
1. **"X personnes ont réservé aujourd'hui"** : Nulle part
2. **Reviews avec photos** : Pas de composant ReviewWithPhoto
3. **Badges stratégiques** : Pas de "Popular", "Top Rated"
4. **Stats Hero** : Pas de "12 000+ clients", "4.8/5 étoiles"

**IMPACT** : Taux de conversion sous-optimal, manque de crédibilité.

**RECOMMANDATIONS** :
1. Ajouter dans Hero :
   ```jsx
   <div className="stats">
     <div>12 000+ clients</div>
     <div>4.8/5 étoiles</div>
     <div>35 prestataires certifiés</div>
   </div>
   ```

2. ServiceCard : Badge absolu "Popular" si `total_reviews > 50`
   ```jsx
   {total_reviews > 50 && (
     <Badge className="absolute top-4 right-4">Popular</Badge>
   )}
   ```

3. Créer `ReviewCard` avec photo client :
   ```jsx
   <ReviewCard
     avatar="/avatars/1.jpg"
     name="Sarah M."
     rating={5}
     comment="Service impeccable !"
     photos={['/reviews/1.jpg']}
   />
   ```

---

### 7.2 CTAs (Call-to-Actions)

**DIRECTIVE** : CTAs orientés bénéfice, pas action

**EXEMPLES REQUIS** :
- ❌ "Envoyer" → ✅ "Commencer maintenant"
- ❌ "Submit" → ✅ "Réserver mon service"
- ❌ "S'inscrire" → ✅ "Créer mon compte gratuit"

**AUDIT ACTUEL** :

🔴 **NON CONFORMES** (exemples Header.js) :
```js
// Ligne 199
{t('nav.login')} // "Se connecter" ❌

// Ligne 204
{t('nav.register')} // "S'inscrire" ❌

// Ligne 194
{t('nav.becomeProvider')} // "Devenir prestataire" ❌ (trop générique)
```

🔴 **NON CONFORMES** (exemples HomeContent.js) :
```js
// Ligne 102
{t('home.viewAllCategories')} // "Voir toutes les catégories" ❌

// Ligne 153
{t('home.viewAllServices')} // "Voir tous les services" ❌

// Ligne 167
{t('home.createAccount')} // "Créer un compte" ❌
```

**RECOMMANDATIONS** : Réécrire toutes les clés i18n

**Fichier** : `locales/fr.json` (à créer/modifier)
```json
{
  "nav": {
    "login": "Me connecter",
    "register": "Commencer gratuitement",
    "becomeProvider": "Offrir mes services"
  },
  "home": {
    "viewAllCategories": "Explorer tous les services",
    "viewAllServices": "Découvrir plus de pros",
    "createAccount": "Trouver mon prestataire",
    "heroButton": "Réserver maintenant"
  },
  "service": {
    "bookNow": "Réserver ce service",
    "contactProvider": "Contacter le pro"
  }
}
```

---

### 7.3 Formulaires Simplifiés

**DIRECTIVE** : Max 3-4 champs par page, auto-fill addresses

**AUDIT** : (Composants formulaires non lus en détail, mais inféré)

**RECOMMANDATIONS** :
1. **Login** : Email + Password + "Mot de passe oublié" (2 champs) ✅
2. **Register** : Nom + Email + Password (3 champs) ✅
3. **Booking** : Diviser en 3 étapes (max 3 champs/étape)
   - Étape 1 : Date + Heure + Adresse
   - Étape 2 : Infos contact (si non connecté)
   - Étape 3 : Confirmation + Paiement

4. **AddressAutocomplete** : Déjà présent (Google Places) ✅

**POINT POSITIF** : `AddressAutocomplete` component déjà créé (ligne Google Places autocomplete styles dans globals.scss).

---

### 7.4 Social Login

**DIRECTIVE** : Social login first (Google, Apple)

**AUDIT** : Non visible dans les composants lus

🔴 **CRITIQUE : Social login absent**

**RECOMMANDATIONS** :
1. Ajouter boutons OAuth avant formulaire classique
   ```jsx
   <div className="social-login">
     <Button variant="outline" icon={<GoogleIcon />}>
       Continuer avec Google
     </Button>
     <Button variant="outline" icon={<AppleIcon />}>
       Continuer avec Apple
     </Button>
   </div>
   <Divider>ou</Divider>
   <Form>...</Form>
   ```

2. Intégrer NextAuth.js (recommandé pour Next.js 16)

---

## 8. TYPOGRAPHIE

### 8.1 Fonts Actuelles

```scss
// _variables.scss ligne 46
$font-family-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...
```

**🔴 CRITIQUE : Fonts système vs Inter/Poppins requis**

**DIRECTIVE** : Inter (body), Poppins (headings)

**IMPACT** : Manque de personnalité, look générique.

---

### 8.2 Sizes

**ACTUEL** :
```scss
$font-size-xs: 0.75rem;    // 12px ✅
$font-size-sm: 0.875rem;   // 14px ✅
$font-size-base: 1rem;     // 16px ✅
$font-size-lg: 1.125rem;   // 18px ✅
$font-size-xl: 1.25rem;    // 20px ✅
$font-size-2xl: 1.5rem;    // 24px ✅
$font-size-3xl: 1.875rem;  // 30px ✅
$font-size-4xl: 2.25rem;   // 36px ✅
$font-size-5xl: 3rem;      // 48px ✅
```

**✅ CONFORME** aux directives (14px, 16px, 18px, 20px, 24px, 32px)

**Recommandation** : Garder cette scale dans Tailwind config.

---

### 8.3 Weights

**ACTUEL** :
```scss
$font-weight-light: 300;     ✅
$font-weight-normal: 400;    ✅
$font-weight-medium: 500;    ✅
$font-weight-semibold: 600;  ✅
$font-weight-bold: 700;      ✅
$font-weight-extrabold: 800; ✅
```

**✅ CONFORME** aux directives (400, 500, 600, 700)

---

## 9. CARDS & HOVER STATES

### 9.1 ServiceCard

**Border-radius** : 8px ❌ → 20px requis ✅
**Shadow** : `$shadow-md` → `$shadow-xl` on hover ✅
**Hover transform** : `translateY(-4px)` → OK mais pourrait être -6px
**Active state** : ❌ ABSENT

**DIRECTIVE** : `Active: scale(0.98)`

**RECOMMANDATION** :
```scss
&:active {
  transform: scale(0.98) translateY(-2px);
}
```

---

### 9.2 Badges

**ACTUEL** : Category badge avec `border-radius: $radius-full` ✅

**DIRECTIVE** : Badges absolute positioned, blur backdrop

**ABSENT** : Blur backdrop (`backdrop-filter: blur(8px)`)

**RECOMMANDATION** :
```jsx
<Badge className="absolute top-4 right-4 backdrop-blur-md bg-white/80">
  Popular
</Badge>
```

---

## 10. PAGES PRINCIPALES

### 10.1 Home (page.js)

**ACTUEL** :
- Hero avec gradient ✅
- SearchBar ✅
- Categories grid (2/3 cols) ✅
- How It Works (4 steps) ✅
- Popular Services ✅
- CTA finale ✅

**🟡 MAJEURS** :
1. Gradient couleurs non conformes
2. Social proof absent dans Hero
3. CTAs textes non orientés bénéfice

---

### 10.2 Services (listing)

**AUDIT** : Non lu en détail

**RECOMMANDATIONS** :
- Filtres dans bottom sheet mobile (pas sidebar)
- Infinite scroll vs pagination
- Map view toggle optionnel
- Tri par : "Populaires", "Mieux notés", "Prix"

---

### 10.3 Service Detail

**AUDIT** : Non lu en détail

**RECOMMANDATIONS** :
- Hero carousel images (swipeable mobile)
- CTA "Réserver maintenant" sticky bottom mobile
- Section avis avec photos
- Services similaires en fin

---

### 10.4 Provider Dashboard

**AUDIT** : Fichier `app/provider/dashboard/page.module.scss` existe

**RECOMMANDATIONS** :
- Calendrier disponibilités moderne
- Statistiques visuelles (charts)
- Navigation claire (tabs ou sidebar)

---

## 11. SUPPORT RTL (Arabe)

### 11.1 État Actuel

**✅ EXCELLENT : RTL support complet**

**CONSTAT** (globals.scss lignes 240-395) :
- `body.rtl` avec `direction: rtl`
- Font arabe : Noto Sans Arabic ✅
- Inversions directionnelles complètes :
  - `.text-left` → `.text-right`
  - `.icon-left` → `.icon-right`
  - Flexbox inversé
  - Tables RTL
  - Forms RTL

**RECOMMANDATION** : Migrer ce support vers Tailwind avec `rtl:` prefix

**Tailwind RTL** :
```jsx
<div className="ml-4 rtl:mr-4 rtl:ml-0">
  Content
</div>
```

---

## 12. PERFORMANCE

### 12.1 Images

**ACTUEL** : `<img>` tag classique (ServiceCard ligne 78-82)

**🟡 MAJEUR : Pas d'optimisation Next.js**

**DIRECTIVE** : Lazy loading avec Next.js Image

**RECOMMANDATION** :
```jsx
import Image from 'next/image';

<Image
  src={imageUrl}
  alt={name}
  width={400}
  height={300}
  className={styles.image}
  loading="lazy"
  placeholder="blur"
/>
```

---

### 12.2 Bundle Size

**AUDIT** : Non mesuré (nécessite `npm run build`)

**RECOMMANDATIONS** :
1. Code splitting pages (déjà fait par Next.js App Router ✅)
2. Lazy load heavy components :
   ```jsx
   const Chat = dynamic(() => import('@/components/Chat'), { ssr: false });
   ```
3. Tree-shaking icons :
   ```jsx
   // ❌ MAUVAIS
   import { FaUserCircle } from 'react-icons/fa';

   // ✅ BON
   import FaUserCircle from 'react-icons/fa/FaUserCircle';
   ```

---

## 13. ACCESSIBILITÉ (A11Y)

### 13.1 Contraste Couleurs

**DIRECTIVE** : WCAG AA minimum (4.5:1 texte normal, 3:1 texte large)

**AUDIT** : Couleurs actuelles

✅ **CONFORMES** :
- Gray-700 (#495057) sur White → ~8.6:1 ✅
- Primary (#FF6B6B) sur White → ~3.8:1 ⚠️ (limite pour texte normal)

🟡 **À VÉRIFIER** :
- Primary requis (#E63946) sur White → À calculer
- Secondary requis (#F4A261) sur White → À calculer

**RECOMMANDATION** : Vérifier contraste avec WebAIM Contrast Checker.

---

### 13.2 Navigation Clavier

**AUDIT** : Non testé manuellement

**RECOMMANDATIONS** :
1. Focus visible sur tous les interactifs
2. Échappement ferme les modals (ESC key)
3. Tab order logique
4. Skip to content link

**Tailwind focus states** :
```jsx
<button className="focus:ring-2 focus:ring-primary focus:outline-none">
  Click me
</button>
```

---

### 13.3 ARIA Labels

**AUDIT** : `aria-label="Menu"` présent sur hamburger (Header.js ligne 213) ✅

**RECOMMANDATIONS** : Systématiser sur :
- Boutons icon-only
- Links icon-only
- Form inputs (avec label visible ou aria-label)

---

## 14. COMPARAISON AVANT/APRÈS ATTENDUE

### 14.1 Navigation

| Aspect | AVANT (Actuel) | APRÈS (App-Like) |
|--------|----------------|-------------------|
| **Type** | Top navigation classique | Bottom Navigation mobile (5 items) |
| **Mobile menu** | Hamburger slide-in 280px | Bottom sheet moderne plein écran |
| **Touch targets** | 36-40px (limite) | 44x44px minimum garanti |
| **Icons** | React Icons (FaUserCircle) | Heroicons modernes |

---

### 14.2 Composants

| Composant | AVANT (Actuel) | APRÈS (App-Like) |
|-----------|----------------|-------------------|
| **ServiceCard radius** | 8px | **20px** |
| **ServiceCard hover** | translateY(-4px) | translateY(-6px) + scale(0.98) active |
| **ServiceCard badges** | Aucun | "Popular", "Top Rated" |
| **Button radius** | 8px | **Pill shape (9999px)** |
| **Button height** | ~40-44px | **56px minimum** |
| **Button text** | "S'inscrire" | "Commencer gratuitement" |

---

### 14.3 Design System

| Élément | AVANT (Actuel) | APRÈS (App-Like) |
|---------|----------------|-------------------|
| **Primary color** | #FF6B6B (rouge clair) | **#E63946** (rouge punch) |
| **Secondary color** | #4ECDC4 (cyan) | **#F4A261** (orange chaleureux) |
| **Accent color** | ❌ Absent | **#2A9D8F** (teal success) |
| **Font body** | System fonts | **Inter** |
| **Font headings** | System fonts | **Poppins** |
| **Shadows** | Tailwind v2 (multiples) | Material Design 3 (soft single) |

---

### 14.4 UX

| Aspect | AVANT (Actuel) | APRÈS (App-Like) |
|--------|----------------|-------------------|
| **Social proof Hero** | ❌ Absent | "12 000+ clients", "4.8/5 étoiles" |
| **Social login** | ❌ Absent | Google + Apple OAuth |
| **CTAs** | Orientés action ("S'inscrire") | Orientés bénéfice ("Commencer gratuitement") |
| **Formulaires** | Multiple champs | Max 3-4 champs/étape |
| **Reviews** | Texte seul | Avec photos clients |

---

## 15. PLAN DE REFONTE DÉTAILLÉ

### PHASE 1 : Audit Design Actuel (2-3 jours) ✅ TERMINÉ

**Livrables** :
- ✅ Ce rapport d'audit complet
- ✅ Liste problèmes prioritaires
- ✅ Benchmark concurrentiel (à compléter si besoin)

---

### PHASE 2 : Création Design System (3-5 jours)

**Tâches** :
1. Finaliser palette couleurs GlamGo :
   - Primary : #E63946 + nuances (-20%, +20%)
   - Secondary : #F4A261 + nuances
   - Accent : #2A9D8F + nuances
   - Grays : 900, 700, 500, 300, 100

2. Import Google Fonts :
   - Inter (weights: 400, 500, 600, 700)
   - Poppins (weights: 400, 500, 600, 700)

3. Définir spacing scale (4px base) ✅ Déjà fait

4. Définir border radius (16, 20, 24px, 9999px)

5. Définir shadows (Material Design 3)

6. Créer composants atomiques Figma :
   - Button (primary, secondary, outline, ghost)
   - Input / TextArea
   - Card (default, elevated)
   - Badge / Tag
   - Avatar
   - Rating Stars
   - BottomNavigation

**Livrables** :
- Figma "GlamGo Design System v2.0"
- Documentation composants (Notion ou Markdown)

---

### PHASE 3 : Wireframes 7 Pages (3-4 jours)

**Pages** :
1. Home (Mobile 375px + Desktop 1440px)
2. Recherche / Listing services
3. Détail Service
4. Profil Prestataire
5. Flux Réservation (3 étapes)
6. Dashboard Client
7. Dashboard Prestataire

**Livrables** :
- Wireframes Figma low-fidelity
- Flows utilisateur annotés
- Notes interactions (modals, animations)

---

### PHASE 4 : Maquettes UI Haute Fidélité (5-7 jours)

**Tâches** :
1. Maquettes Mobile (375px) pour 7 pages
2. Maquettes Tablet (768px)
3. Maquettes Desktop (1440px)
4. États interactifs (Hover, Active, Disabled, Loading)
5. Prototypes Figma interactifs

**Livrables** :
- Maquettes Figma complètes
- Prototypes cliquables pour user testing

---

### PHASE 5 : Configuration Tailwind (2-3 jours)

**Tâches** :
1. Installation Tailwind CSS v3+
2. Configuration `tailwind.config.js` (couleurs, fonts, radius, shadows)
3. Création design tokens (`colors.js`, `typography.js`)
4. Configuration PostCSS
5. Backup fichiers SCSS (Git tag)
6. Tests build local + Fly.io staging

**Livrables** :
- Tailwind config fonctionnel
- Documentation migration

---

### PHASE 6 : Implémentation Composants DS (1 semaine)

**Composants à créer** (dans `src/components/ui/`) :
1. Button (variants, sizes, loading state)
2. Input / TextArea (error, disabled states)
3. Card (variants)
4. Badge / Tag
5. Avatar (initiales + photo)
6. Rating Stars (read-only + interactive)
7. BottomNavigation (mobile)
8. Modal / Dialog
9. Spinner / Loading

**Livrables** :
- 9 composants atomiques Tailwind
- Tests unitaires Jest
- Documentation usage

---

### PHASE 7 : Refonte Pages (2 semaines)

**Semaine 1** :
- Home (Hero, Categories, How It Works, Popular, CTA)
- Recherche (Filtres bottom sheet, Listing, Map view)
- Détail Service (Hero, Infos, CTA sticky, Avis, Similaires)
- Profil Prestataire (Header, Bio, Portfolio, Services, Avis)

**Semaine 2** :
- Flux Réservation (3 étapes, Progress, Récapitulatif sticky)
- Dashboard Client (Réservations, Historique, Favoris)
- Dashboard Prestataire (Réservations, Calendrier, Stats, Gestion)

**Livrables** :
- 7 pages redessinées en Tailwind
- Responsive parfait (mobile/tablet/desktop)

---

### PHASE 8 : Optimisation Performance (3-4 jours)

**Tâches** :
1. Optimisation images (Next.js Image, lazy loading, WebP)
2. Code splitting pages (déjà fait par Next.js)
3. Tests responsive (9 breakpoints : 375, 390, 414, 768, 834, 1024, 1280, 1440, 1920px)
4. Tests Lighthouse (mobile + desktop, score > 90)
5. Optimisation FCP, CLS

**Livrables** :
- Rapport Lighthouse score > 90 mobile

---

### PHASE 9 : Support RTL Arabe (2-3 jours)

**Tâches** :
1. Traduction 150-200 nouvelles clés i18n
2. Validation DeepL pour microcopy CTAs
3. Tests RTL composants Tailwind (rtl: prefix)
4. Validation spacing, alignment, icons
5. Screenshots AR pour chaque page

**Livrables** :
- App 100% fonctionnelle en arabe RTL
- Screenshots validation

---

### PHASE 10 : Tests UX/UI (5-7 jours)

**Tâches** :
1. Tests Playwright E2E (7 pages)
2. Tests cross-browser (Chrome, Safari, Firefox)
3. Tests cross-device (iPhone, Android, iPad)
4. Tests accessibilité (Axe DevTools, navigation clavier, screen reader)
5. Tests performance (Lighthouse, PageSpeed, WebPageTest)
6. User testing (5-10 utilisateurs réels, Hotjar)

**Livrables** :
- Rapport QA complet
- Liste bugs/improvements

---

### PHASE 11 : Corrections & Polissage (3-5 jours)

**Tâches** :
1. Correction bugs Phase 10
2. Ajustements design suite user testing
3. Polissage animations et micro-interactions
4. Validation finale PO
5. Validation finale mentor design

**Livrables** :
- Version Release Candidate

---

### PHASE 12 : Documentation & Déploiement (2 jours)

**Tâches** :
1. Documentation composants Design System
2. Guide contribution design
3. Mise à jour README
4. Déploiement staging Fly.io
5. Validation monitoring
6. Déploiement production + rollback plan
7. Monitoring post-déploiement (24-48h)

**Livrables** :
- Design v2.0 en production
- Documentation complète

---

## 16. ESTIMATIONS DE TEMPS RÉALISTES

### Par Agent

**@design-glamgo** :
- Phase 1 (Audit) : **3 jours** ✅ FAIT
- Phase 2 (Design System) : **5 jours**
- Phase 3 (Wireframes) : **4 jours**
- Phase 4 (Maquettes) : **7 jours**
- Phase 11 (Ajustements) : **2 jours**
- **TOTAL** : **21 jours** (~4 semaines)

**@frontend-glamgo** :
- Phase 5 (Config Tailwind) : **3 jours**
- Phase 6 (Composants DS) : **5 jours**
- Phase 7 (Refonte pages) : **10 jours**
- Phase 8 (Performance) : **4 jours**
- Phase 11 (Corrections) : **3 jours**
- Phase 12 (Doc) : **1 jour**
- **TOTAL** : **26 jours** (~5 semaines)

**@i18n-glamgo** :
- Phase 9 (RTL + Traductions) : **3 jours**
- **TOTAL** : **3 jours**

**@qa-glamgo** :
- Phase 10 (Tests exhaustifs) : **7 jours**
- **TOTAL** : **7 jours**

**@devops-glamgo** :
- Phase 12 (Déploiement) : **1 jour**
- **TOTAL** : **1 jour**

### Calendrier Optimisé

**Semaines 1-4** : Design (Phases 1-4) → @design-glamgo
**Semaines 5-9** : Développement (Phases 5-8) → @frontend-glamgo
**Semaine 9** : i18n (Phase 9) → @i18n-glamgo (en parallèle)
**Semaines 9-10** : QA (Phase 10) → @qa-glamgo
**Semaine 10** : Corrections + Déploiement (Phases 11-12) → Multi-agents

**TOTAL PROJET** : **~8-10 semaines**

---

## 17. LISTE PROBLÈMES PAR PRIORITÉ

### 🔴 CRITIQUE (Bloque l'expérience App-Like)

1. **Absence Bottom Navigation mobile**
   - Impact : Navigation non App-Like, UX mobile dégradée
   - Effort : 3 jours (design + dev)
   - Phase : 6 (Composants DS)

2. **Palette couleurs non conforme**
   - Impact : Identité visuelle incohérente
   - Effort : 2 jours (config Tailwind)
   - Phase : 5 (Config Tailwind)

3. **Tailwind CSS absent**
   - Impact : Code non maintenable, performance sous-optimale
   - Effort : 3 semaines (migration complète)
   - Phase : 5-7 (Config + Composants + Pages)

4. **Typographie non conforme (Inter/Poppins requis)**
   - Impact : Manque de personnalité
   - Effort : 1 jour (config + import fonts)
   - Phase : 5 (Config Tailwind)

5. **Border-radius trop petits (8px vs 20px requis)**
   - Impact : Look daté, pas App-Like
   - Effort : 1 jour (config Tailwind + migration)
   - Phase : 5-7

6. **CTAs non orientés bénéfice**
   - Impact : Conversion sous-optimale
   - Effort : 2 jours (réécriture toutes clés i18n)
   - Phase : 7 (Refonte pages)

7. **Social proof absent**
   - Impact : Taux de conversion faible
   - Effort : 3 jours (ajout stats Hero + badges + reviews)
   - Phase : 7 (Refonte pages)

---

### 🟡 MAJEUR (Impact important)

8. **Buttons non pill shape**
   - Impact : Look non moderne
   - Effort : 1 jour
   - Phase : 6 (Composants DS)

9. **Buttons height < 56px**
   - Impact : Touch targets limites
   - Effort : 1 jour
   - Phase : 6

10. **Hamburger menu non optimal**
    - Impact : UX mobile moyenne
    - Effort : 2 jours (bottom sheet)
    - Phase : 7

11. **Images non optimisées (Next.js Image)**
    - Impact : Performance dégradée
    - Effort : 2 jours
    - Phase : 8 (Performance)

12. **Social login absent**
    - Impact : Friction inscription
    - Effort : 3 jours (OAuth Google/Apple)
    - Phase : 7

13. **Touch targets < 44px (plusieurs endroits)**
    - Impact : Accessibilité mobile
    - Effort : 2 jours (revue systématique)
    - Phase : 6-7

14. **Shadows non Material Design 3**
    - Impact : Esthétique moins douce
    - Effort : 1 jour (config Tailwind)
    - Phase : 5

---

### 🟢 MINEUR (Améliorations)

15. **Logo height 32px mobile (trop petit)**
    - Impact : Visibilité réduite
    - Effort : 30 minutes
    - Phase : 7

16. **Hover effects subtils**
    - Impact : Feedback visuel limité
    - Effort : 1 jour (ajout micro-animations)
    - Phase : 11 (Polissage)

17. **Active states absents**
    - Impact : Feedback tactile manquant
    - Effort : 1 jour
    - Phase : 6-7

18. **Badges sans blur backdrop**
    - Impact : Lisibilité badges sur photos
    - Effort : 1 jour
    - Phase : 6

19. **Icons React Icons datés**
    - Impact : Esthétique moins moderne
    - Effort : 2 jours (migration Heroicons)
    - Phase : 6-7

20. **User menu dropdown 200px (trop petit)**
    - Impact : Lisibilité réduite
    - Effort : 30 minutes
    - Phase : 7

---

## 18. SCREENSHOTS ANNOTÉS

**Note** : Screenshots non générés dans ce rapport (audit textuel).

**Recommandation** : Utiliser Figma pour générer screenshots annotés lors de Phase 3 (Wireframes).

**Zones à capturer** :
1. Home Hero (avant/après gradient couleurs)
2. ServiceCard (avant/après radius 20px + badges)
3. Header mobile (avant hamburger / après bottom nav)
4. Button (avant radius 8px / après pill)
5. Formulaire login (avant/après social login)

---

## 19. RISQUES IDENTIFIÉS

### Risque 1 : Régression fonctionnelle pendant migration Tailwind

**Probabilité** : Moyenne
**Impact** : Élevé
**Mitigation** :
- Tests Playwright avant migration (baseline)
- Migration par composant, pas global
- Code review strict
- Tests visuels automatisés (Percy, Chromatic)

---

### Risque 2 : Performance dégradée (contrainte RAM 512MB Fly.io)

**Probabilité** : Faible
**Impact** : Critique
**Mitigation** :
- Tailwind JIT compilation (pas de CSS inutilisé)
- Code splitting agressif
- Lazy loading images
- Monitoring RAM staging continu

---

### Risque 3 : RTL complexité sous-estimée

**Probabilité** : Moyenne
**Impact** : Moyen
**Mitigation** :
- Tests RTL dès Phase 6 (composants atomiques)
- Agent @i18n-glamgo impliqué tôt
- Validation native speaker arabe
- Utilisation `rtl:` Tailwind prefix systématique

---

### Risque 4 : User testing révèle problèmes majeurs

**Probabilité** : Moyenne
**Impact** : Moyen
**Mitigation** :
- User testing dès Phase 4 (prototypes Figma)
- Buffer 3-5 jours Phase 11 (corrections)
- Feedback itératif durant développement

---

## 20. CONCLUSION & NEXT STEPS

### Conclusion

GlamGo possède **une base technique solide** avec une architecture Mobile-First bien pensée et un support RTL fonctionnel. Cependant, pour atteindre les standards **App-Like modernes**, une refonte design complète est **NÉCESSAIRE**.

**Points clés** :
- ✅ Architecture propre, composants modulaires
- ✅ Responsive Mobile-First déjà en place
- ✅ Support RTL arabe fonctionnel
- ❌ Palette couleurs non conforme (cyan vs orange)
- ❌ Tailwind CSS absent (SCSS custom partout)
- ❌ Bottom Navigation mobile manquante
- ❌ CTAs non optimisés pour conversion
- ❌ Social proof absent

**Verdict final** : Refonte **APPROUVÉE** avec estimation **8-10 semaines**.

---

### Next Steps Immédiats

1. **Validation PO** : Product Owner valide ce rapport d'audit
2. **Validation Mentor** : Mentor design valide l'approche
3. **Kick-off meeting** : Réunion tous agents (design, frontend, i18n, qa, devops)
4. **Lancement Phase 2** : @design-glamgo commence création Design System Figma
5. **Setup Git branch** : `git checkout -b feature/design-v2-app-like`

---

### Prochains Livrables

**Semaine du 09-13 Décembre 2025** :
- ✅ Rapport audit (CE DOCUMENT)
- Design System Figma v2.0 (palette, typo, composants atomiques)

**Semaine du 16-20 Décembre 2025** :
- Wireframes 7 pages (Mobile + Desktop)
- Flows utilisateur annotés

**Semaine du 23-27 Décembre 2025** :
- Maquettes UI Haute Fidélité Mobile (375px)
- Prototypes Figma interactifs

**Début Janvier 2026** :
- Configuration Tailwind CSS
- Migration premiers composants
- User testing prototypes

---

## ANNEXES

### Annexe A : Composants à Migrer (35+)

**Composants existants** (détectés lors audit) :
1. Header
2. ServiceCard
3. CategoryCard
4. Button
5. SearchBar
6. HomeContent
7. AddressAutocomplete
8. Chat
9. ChatBot
10. ClientLayout
11. ClientLocationSharing
12. CurrencySelector
13. DistanceFeeExplainer
14. EmergencyButton
15. EmergencyButtonProvider
16. FormulaSelector
17. LanguageSwitcher
18. LiveLocationTracker
19. LocationPicker
20. LocationTracker
21. NavigationProgress
22. NearbyProvidersList
23. NightShiftWarning
24. NotificationDropdown
25. PaymentMethodSetup
26. Price
27. PriceBreakdown
28. ProviderCard
29. ProviderLocationMap
30. ProviderNotificationDropdown
31. ProviderPriorityBadge
32. ReviewModal
33. SatisfactionModal
34. ServiceSelector
35. ServicesFilter
36. ServicesHero
37. TermsModal
38. TranslatedText
39. UnreadBadge
40. WelcomePopup

**À créer** :
- BottomNavigation (NOUVEAU)
- Avatar (NOUVEAU)
- Badge (améliorer existant)
- Rating Stars (améliorer existant)
- Modal/Dialog (unifier modaux existants)

---

### Annexe B : Palette GlamGo Finale (Proposition)

```js
// tailwind.config.js
colors: {
  primary: {
    DEFAULT: '#E63946',
    50: '#FFF1F2',
    100: '#FFE1E4',
    200: '#FFC7CE',
    300: '#FF9DAB',
    400: '#FF6B7E',
    500: '#E63946', // Main
    600: '#D62828',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  secondary: {
    DEFAULT: '#F4A261',
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDC078',
    400: '#F4A261', // Main
    500: '#E76F51',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  accent: {
    DEFAULT: '#2A9D8F',
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#2A9D8F', // Main
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  gray: {
    900: '#1A1A1A',
    800: '#2D2D2D',
    700: '#4A4A4A',
    600: '#666666',
    500: '#8E8E8E',
    400: '#B0B0B0',
    300: '#D1D1D1',
    200: '#E5E5E5',
    100: '#F5F5F5',
    50: '#FAFAFA',
  },
}
```

---

### Annexe C : Clés i18n à Réécrire (Exemples)

**Fichier** : `locales/fr.json`

```json
{
  "nav": {
    "login": "Me connecter",
    "register": "Commencer gratuitement",
    "becomeProvider": "Offrir mes services",
    "home": "Accueil",
    "services": "Nos services",
    "bookings": "Mes réservations",
    "messages": "Messages",
    "profile": "Mon profil",
    "logout": "Se déconnecter"
  },
  "home": {
    "title": "Beauté et bien-être à domicile",
    "subtitle": "Réservez votre prestataire en quelques clics",
    "search": "Rechercher un service...",
    "categories": "Nos catégories",
    "categoriesSubtitle": "Trouvez le service qui vous correspond",
    "howItWorks": "Comment ça marche",
    "howItWorksSubtitle": "Réservez en 4 étapes simples",
    "step1Title": "Choisissez votre service",
    "step1Desc": "Parcourez notre sélection de services professionnels",
    "step2Title": "Sélectionnez la date",
    "step2Desc": "Choisissez le créneau qui vous convient",
    "step3Title": "Confirmez et payez",
    "step3Desc": "Paiement sécurisé en ligne",
    "step4Title": "Profitez du service",
    "step4Desc": "Votre pro arrive chez vous à l'heure",
    "popular": "Services populaires",
    "popularSubtitle": "Les plus réservés ce mois-ci",
    "viewAllCategories": "Explorer tous les services",
    "viewAllServices": "Découvrir plus de pros",
    "readyToStart": "Prêt à profiter de nos services ?",
    "signUpNow": "Rejoignez 12 000+ clients satisfaits",
    "createAccount": "Trouver mon prestataire",
    "statsClients": "12 000+ clients",
    "statsRating": "4.8/5 étoiles",
    "statsProviders": "35 prestataires certifiés"
  },
  "service": {
    "bookNow": "Réserver ce service",
    "contactProvider": "Contacter le pro",
    "from": "À partir de",
    "perService": "/ service",
    "duration": "Durée",
    "category": "Catégorie",
    "description": "Description",
    "reviews": "Avis clients",
    "similarServices": "Services similaires"
  },
  "booking": {
    "step1Title": "Choisissez votre créneau",
    "step2Title": "Vos informations",
    "step3Title": "Confirmation",
    "selectDate": "Date",
    "selectTime": "Heure",
    "selectAddress": "Adresse",
    "confirmBooking": "Confirmer ma réservation",
    "payNow": "Payer maintenant",
    "totalPrice": "Prix total"
  },
  "card": {
    "popular": "Populaire",
    "topRated": "Top avis",
    "newService": "Nouveau",
    "perService": "/ service",
    "bookingsToday": "{count} réservations aujourd'hui"
  }
}
```

**Fichier** : `locales/ar.json` (traductions DeepL)

```json
{
  "nav": {
    "login": "تسجيل الدخول",
    "register": "ابدأ مجانًا",
    "becomeProvider": "قدم خدماتك",
    ...
  },
  ...
}
```

---

### Annexe D : Ressources & Références

**Design Inspiration** :
- Airbnb : https://www.airbnb.com/
- Uber : https://www.uber.com/
- Revolut : https://www.revolut.com/
- Glovo : https://glovoapp.com/

**Tailwind CSS** :
- Docs : https://tailwindcss.com/docs
- Playground : https://play.tailwindcss.com/
- UI Components : https://tailwindui.com/ (payant), https://headlessui.com/ (gratuit)

**Icons** :
- Heroicons : https://heroicons.com/
- Lucide : https://lucide.dev/

**Fonts** :
- Google Fonts Inter : https://fonts.google.com/specimen/Inter
- Google Fonts Poppins : https://fonts.google.com/specimen/Poppins

**Accessibility** :
- WebAIM Contrast Checker : https://webaim.org/resources/contrastchecker/
- Axe DevTools : https://www.deque.com/axe/devtools/

**Performance** :
- Lighthouse : Chrome DevTools
- PageSpeed Insights : https://pagespeed.web.dev/
- WebPageTest : https://www.webpagetest.org/

**User Testing** :
- Hotjar : https://www.hotjar.com/
- Maze : https://maze.co/

---

**FIN DU RAPPORT**

---

**Statut** : AUDIT TERMINÉ ✅
**Prochaine étape** : Validation PO + Mentor → Lancement Phase 2 (Design System)
**Date livraison attendue v2.0** : Mi-Février 2026 (10 semaines)

