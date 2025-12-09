# Refonte Page HOME - Mode App-Like

## Date
2025-12-09

## Objectif
Refonte complète de la page d'accueil (/) en mode App-Like selon les directives strictes du mentor.

## Fichier modifié
- `src/app/page.js` - Nouvelle page HOME moderne et app-like

## Composants UI utilisés
- `Button` - Boutons modernes avec variantes (primary, secondary, outline, accent)
- `Badge` - Badges pour tags "Populaire"
- `BottomNav` - Navigation bottom mobile fixe
- `BottomNavSpacer` - Spacer pour éviter le chevauchement
- Icônes de `lucide-react` (Search, MapPin, Star, Users, CheckCircle, TrendingUp, etc.)

## Structure de la page

### 1. Hero Section
- Gradient subtil (from-primary/5 via-white to-accent/5)
- Titre accrocheur sur 2 lignes avec accent couleur primary
- Search bar prominente avec icône Search
- Bouton "Rechercher" intégré dans la search bar
- Badge de localisation (Marrakech)
- Whitespace abondant (pt-8 pb-12 md:pt-16 md:pb-20)

### 2. Categories Grid (8 catégories)
- Icônes colorées pour chaque catégorie (HomeIcon, Sparkles, Car, Scissors, Heart, PawPrint, Wrench, ChefHat)
- Couleurs vives (bg-blue-500, bg-pink-500, bg-indigo-500, etc.)
- Scroll horizontal sur mobile
- Grid 4 colonnes sur tablet, 8 colonnes sur desktop
- Hover effect avec scale-110 sur les icônes
- Compteur de services par catégorie

Catégories :
1. Maison (12 services)
2. Beauté (18 services)
3. Voiture (8 services)
4. Coiffure (10 services)
5. Bien-être (15 services)
6. Animaux (6 services)
7. Réparation (9 services)
8. Chef (5 services)

### 3. Services Populaires (6 services)
- Cards avec border-radius: 20px (rounded-lg)
- Images avec aspect-ratio 4/3
- Badge "Populaire" en overlay avec icône Sparkles
- Hover effect : shadow-xl et translate-y-1
- Rating avec étoiles + nombre d'avis
- Prix "À partir de XXX MAD"
- Scroll horizontal sur mobile
- Grid 2 colonnes tablet, 3 colonnes desktop

Services affichés :
1. Coiffure à domicile (150 MAD, 4.8/5, 234 avis)
2. Massage relaxant (200 MAD, 4.9/5, 189 avis)
3. Nettoyage maison (120 MAD, 4.7/5, 456 avis)
4. Lavage auto premium (180 MAD, 4.6/5, 312 avis)
5. Promenade animaux (80 MAD, 4.9/5, 178 avis)
6. Chef à domicile (350 MAD, 5.0/5, 92 avis)

### 4. Social Proof - Stats
- Titre "Pourquoi choisir GlamGo ?"
- 4 stats en grid (2 colonnes mobile, 4 colonnes desktop)
- Icônes avec gradient background (from-primary/10 to-accent/10)
- Hover effect avec shadow

Stats :
- 500+ Prestataires vérifiés (Users icon)
- 10K+ Services effectués (CheckCircle icon)
- 4.8/5 Note moyenne (Star icon)
- 95% Clients satisfaits (TrendingUp icon)

### 5. CTA Section
- Background gradient (from-primary via-primary-hover to-accent)
- Titre blanc accrocheur
- 2 boutons CTA :
  1. "Explorer les services" (variant secondary + shadow-xl)
  2. "Devenir prestataire" (variant outline avec background transparent)
- Icônes dans les boutons (Search, Users)

### 6. Bottom Navigation
- Navigation fixe en bas (mobile uniquement, md:hidden)
- 5 items : Accueil (active), Rechercher, Commandes, Messages, Profil
- Spacer pour éviter le chevauchement avec le contenu

## Design System respecté

### Couleurs
- Primary: #E63946 (Rouge GlamGo)
- Primary-hover: #D62839
- Secondary: #F4A261 (Orange)
- Accent: #2A9D8F (Turquoise)
- Gray-50, Gray-100, etc.

### Border Radius
- Cards : rounded-lg (20px selon Tailwind config)
- Buttons : rounded-full (pill shape)
- Categories : rounded-lg
- Search bar : rounded-full

### Spacing
- Sections : py-12 md:py-16 (48px mobile, 64px desktop)
- Container max-width : 7xl (1280px)
- Gaps : gap-4 (16px), gap-6 (24px)

### Typography
- H1 : text-4xl md:text-5xl lg:text-6xl (36px → 48px → 60px)
- H2 : text-2xl md:text-3xl (24px → 30px)
- Body : text-base (16px)
- Small : text-sm (14px)

### Hover effects
- Cards : hover:shadow-xl hover:-translate-y-1
- Categories : hover:scale-110 transition-transform
- Buttons : hover:bg-primary-hover shadow-lg

## Mobile-First Design
- Search bar responsive (py-4 md:py-5)
- Categories scroll horizontal mobile, grid desktop
- Services scroll horizontal mobile, grid desktop
- Stats grid 2 cols mobile, 4 cols desktop
- CTA buttons stacked mobile (flex-col), inline desktop (flex-row)
- Bottom Nav visible uniquement sur mobile (md:hidden)

## Mock Data
Toutes les données sont en mock data (CATEGORIES, POPULAR_SERVICES, STATS) en attendant l'intégration API.

## Routes de navigation
- `/services` - Catalogue de services
- `/services?category={slug}` - Services par catégorie
- `/services/{id}` - Page détail service
- `/provider/register` - Inscription prestataire

## Fonctionnalités interactives
- Search bar fonctionnelle (redirection vers `/services?q={query}`)
- Hover states sur tous les éléments cliquables
- Transitions smooth (duration-200, duration-300)
- Bottom Nav avec état "active" sur Accueil

## Compilation
- Build réussi sans erreurs
- Warnings non-bloquants (liés à SatisfactionModal, ancien composant)
- Exit code : 0

## Points techniques
- Client component ('use client')
- Next.js App Router
- Tailwind CSS classes
- lucide-react icons
- useRouter pour navigation programmatique
- useState pour search query

## Accessibilité
- Attributs aria-label, aria-current
- Textes alt sur images
- Focus states sur liens et boutons
- Contraste colors respecté

## Performance
- Images lazy loading
- Transitions GPU-accelerated (transform, opacity)
- Hover states optimisés
- No layout shift (aspect-ratio défini)

## Prochaines étapes
1. Intégrer l'API backend pour récupérer les vraies données
2. Ajouter i18n (FR/AR) avec LanguageContext
3. Implémenter la recherche avancée
4. Ajouter le filtre par localisation
5. Tests E2E sur mobile/desktop
6. Optimiser les images (next/image)
