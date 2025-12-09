# User Story US-DESIGN-001 : Refonte Design App-Like Mobile-First

```yaml
ID: US-DESIGN-001
Titre: Refonte Design App-Like Mobile-First pour GlamGo
Description: En tant que Product Owner de GlamGo, je veux une refonte complète du design avec une approche App-Like et Mobile-First afin d'améliorer drastiquement l'expérience utilisateur, augmenter les conversions et préparer la future transition vers des applications natives iOS/Android.
Type: Feature
Priorité: Critical

Contexte:
  Le design actuel de GlamGo présente plusieurs lacunes :
  - Esthétique datée qui nuit à la crédibilité
  - UX non optimisée pour mobile (pourtant 80%+ du trafic)
  - Utilisation de SCSS custom difficile à maintenir
  - Absence de Design System cohérent
  - Navigation peu intuitive sur mobile
  - Conversion faible sur les pages clés

  Cette refonte vise à créer une expérience premium, moderne et performante qui :
  - Positionne GlamGo comme leader technologique du secteur
  - Maximise les conversions (objectif : +30% de réservations)
  - Prépare le terrain pour les apps natives futures

Critères d'acceptation:

Fonctionnels:
- [ ] Design Mobile-First avec breakpoint principal à 375px
- [ ] Bottom Navigation sur mobile avec 5 items maximum (Accueil, Recherche, Réservations, Messages, Profil)
- [ ] Cards avec border-radius 20px et shadows soft cohérentes
- [ ] Palette de couleurs stricte respectée sur toutes les pages
- [ ] Typographie : Inter pour body text, Poppins pour headings
- [ ] Touch targets minimum 44x44px sur tous les éléments interactifs
- [ ] CTAs orientés bénéfice avec microcopy persuasif
- [ ] Preuve sociale visible (ratings étoiles, "X personnes ont réservé", avis)
- [ ] Formulaires simplifiés au maximum (max 3-4 champs par page)
- [ ] Design System documenté avec tous les composants atomiques
- [ ] 7 pages principales redessinées : Home, Recherche, Détail Service, Profil Prestataire, Réservation, Dashboard Client, Dashboard Prestataire

Techniques:
- [ ] Migration complète de SCSS vers Tailwind CSS
- [ ] Aucun style custom SCSS résiduel (sauf cas exceptionnels documentés)
- [ ] Configuration Tailwind avec palette personnalisée GlamGo
- [ ] Composants React parfaitement responsive (mobile, tablet, desktop)
- [ ] Code modulaire avec composants réutilisables (Design System)
- [ ] Support RTL arabe maintenu sur tous les composants
- [ ] Performance : First Contentful Paint < 1.5s sur mobile 4G
- [ ] Accessibilité WCAG AA minimum (contraste, navigation clavier, ARIA)
- [ ] Tests Playwright pour chaque page redessinée

i18n:
- [ ] Toutes les nouvelles copies FR traduites en AR
- [ ] Validation RTL sur tous les nouveaux composants
- [ ] Microcopy CTAs optimisée pour les deux langues

Architecture Impact:

  Base de données:
    - Tables affectées: Aucune modification structurelle
    - Migrations nécessaires: Non
    - Note: Pas d'impact DB, uniquement couche présentation

  API:
    - Endpoints créés: Aucun nouveau endpoint
    - Endpoints modifiés: Aucun
    - Note: Utilisation des endpoints existants, possible optimisation des payloads si besoin

  Frontend:
    - Refonte totale de l'architecture styling
    - Migration SCSS → Tailwind CSS
    - Création Design System complet
    - Refonte composants: Header, Footer, ServiceCard, ProviderCard, BookingForm, Navigation
    - Refonte pages: Home, Search, Service Detail, Provider Profile, Booking Flow, Client Dashboard, Provider Dashboard
    - Nouveau composant: BottomNavigation (mobile)
    - Optimisation: Lazy loading images, code splitting

  Infrastructure:
    - Docker: Ajout dépendances Tailwind CSS dans Dockerfile
    - Fly.io: Aucun changement configuration
    - Build: Augmentation potentielle du temps de build initial (génération Tailwind)
    - RAM: Aucun impact (Tailwind compile-time)

  i18n:
    - Langues: FR, AR
    - Nouvelles clés à traduire: ~150-200 (microcopy CTAs, nouveaux éléments UI)
    - Validation RTL obligatoire sur tous les nouveaux composants

Phases de la mission:

Phase 1 - Audit Design Actuel (2-3 jours): ✅ TERMINÉ (09 Déc 2025)
  Agent: @design-glamgo
  - [x] Audit complet des 35+ composants actuels
  - [x] Identification pain points UX (20 problèmes identifiés : 7 critiques, 7 majeurs, 6 mineurs)
  - [x] Analyse concurrentielle (références : Airbnb, Uber, Revolut, Glovo)
  - [x] Benchmark design moderne et directives strictes
  - [x] Documentation findings (4 documents livrés)
  - Livrable: ✅ 4 Documents Markdown (design/audit/)
    - rapport-audit-complet.md (60 pages)
    - problemes-prioritaires.md (20 pages)
    - comparaison-avant-apres.md (30 pages)
    - synthese-executive-po.md (12 pages)

Phase 2 - Création Design System (3-5 jours):
  Agent: @design-glamgo
  - [ ] Définition palette de couleurs :
      * Primaire (action/CTA) : 1 couleur + nuances
      * Secondaire (support) : 1 couleur + nuances
      * Grays : 8-10 nuances (du blanc au noir)
      * Sémantiques : Success, Warning, Error, Info
  - [ ] Typographie :
      * Import Google Fonts : Inter (body), Poppins (headings)
      * Scale typographique (6-8 tailles)
      * Line heights et letter spacing
  - [ ] Spacing scale (4px base : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64...)
  - [ ] Border radius (4px, 8px, 12px, 20px principal, 9999px pour pills)
  - [ ] Shadows (3 niveaux : soft, medium, strong)
  - [ ] Composants atomiques : Buttons, Inputs, Cards, Badges, Avatars, Tags
  - [ ] Icônes : Choix icon library (Heroicons, Lucide, Feather)
  - [ ] Documentation Figma ou Storybook
  - Livrable: "GlamGo Design System v2.0" (Figma + doc)

Phase 3 - Wireframes 7 Pages Principales (3-4 jours):
  Agent: @design-glamgo
  - [ ] Wireframes Mobile (375px) pour :
      1. Home (nouvelle structure)
      2. Recherche / Listing services
      3. Détail Service
      4. Profil Prestataire
      5. Flux Réservation (2-3 étapes)
      6. Dashboard Client
      7. Dashboard Prestataire
  - [ ] Wireframes Desktop (1440px) pour les mêmes pages
  - [ ] Flows utilisateur annotés
  - [ ] Notes interactions (modals, animations, transitions)
  - Livrable: Wireframes Figma avec annotations

Phase 4 - Maquettes UI Haute Fidélité (5-7 jours):
  Agent: @design-glamgo
  - [ ] Maquettes Mobile-First (375px) avec Design System appliqué
  - [ ] Maquettes Tablet (768px)
  - [ ] Maquettes Desktop (1440px)
  - [ ] États interactifs : Hover, Active, Disabled, Loading
  - [ ] Dark mode (optionnel mais recommandé)
  - [ ] Prototypes interactifs Figma pour user testing
  - [ ] Validation preuve sociale : Emplacement ratings, avis, badges
  - [ ] Validation CTAs : Microcopy persuasif testé
  - Livrable: Maquettes Figma complètes + prototypes interactifs

Phase 5 - Configuration Tailwind & Design Tokens (2-3 jours):
  Agent: @frontend-glamgo
  - [ ] Installation Tailwind CSS v3+ avec Next.js 16
  - [ ] Configuration tailwind.config.js :
      * Palette couleurs custom (extend colors)
      * Typographie custom (fontFamily)
      * Spacing scale si besoin
      * Border radius custom
      * Box shadows custom
      * Breakpoints (default OK ou ajuster)
  - [ ] Création fichiers design tokens :
      * colors.js (export palette)
      * typography.js (export font config)
  - [ ] Configuration PostCSS
  - [ ] Suppression progressive des fichiers SCSS (backup d'abord)
  - [ ] Tests build local et Fly.io staging
  - Livrable: Configuration Tailwind fonctionnelle + documentation

Phase 6 - Implémentation Composants Design System (1 semaine):
  Agent: @frontend-glamgo
  - [ ] Création composants atomiques réutilisables :
      * Button (variants : primary, secondary, outline, ghost)
      * Input / TextArea (avec états error, disabled)
      * Card (variant : default, elevated, bordered)
      * Badge / Tag
      * Avatar (avec fallback initiales)
      * Rating Stars (read-only et interactive)
      * BottomNavigation (mobile)
      * Modal / Dialog
      * Spinner / Loading states
  - [ ] Tests unitaires Jest pour chaque composant
  - [ ] Storybook optionnel mais recommandé
  - [ ] Documentation usage de chaque composant
  - Livrable: Bibliothèque composants dans src/components/ui/

Phase 7 - Refonte Pages Principales (2 semaines):
  Agent: @frontend-glamgo

  Semaine 1:
  - [ ] Refonte page Home :
      * Hero moderne avec CTA principal
      * Section catégories avec cards
      * Section prestataires populaires
      * Preuve sociale (stats, avis récents)
      * Footer complet
  - [ ] Refonte page Recherche :
      * Filtres simplifiés (drawer mobile)
      * Listing cards services optimisé
      * Pagination ou infinite scroll
      * Map view optionnelle
  - [ ] Refonte page Détail Service :
      * Hero image ou carousel
      * Infos service (prix, durée, description)
      * CTA "Réserver maintenant" sticky mobile
      * Section avis avec ratings
      * Services similaires
  - [ ] Refonte page Profil Prestataire :
      * Header avec avatar, nom, rating global
      * Bio / Présentation
      * Portfolio photos (si applicable)
      * Liste services proposés
      * Avis clients
      * CTA contact ou réserver

  Semaine 2:
  - [ ] Refonte Flux Réservation :
      * Étape 1 : Choix date/heure (calendrier moderne)
      * Étape 2 : Infos contact (pré-remplies si connecté)
      * Étape 3 : Confirmation et paiement
      * Progress indicator clair
      * Récapitulatif sticky
  - [ ] Refonte Dashboard Client :
      * Vue réservations à venir
      * Historique réservations
      * Favoris / Prestataires suivis
      * Navigation claire
  - [ ] Refonte Dashboard Prestataire :
      * Vue réservations à traiter
      * Calendrier disponibilités
      * Statistiques (revenus, avis)
      * Gestion services
      * Gestion profil

Phase 8 - Optimisation Performance & Responsive (3-4 jours):
  Agent: @frontend-glamgo
  - [ ] Optimisation images :
      * Lazy loading avec Next.js Image
      * WebP format avec fallback
      * Responsive images (srcset)
  - [ ] Code splitting pages
  - [ ] Tests responsive sur tous breakpoints :
      * Mobile : 375px, 390px, 414px
      * Tablet : 768px, 834px, 1024px
      * Desktop : 1280px, 1440px, 1920px
  - [ ] Tests performance Lighthouse (mobile + desktop)
  - [ ] Optimisation First Contentful Paint
  - [ ] Optimisation Cumulative Layout Shift
  - Livrable: Rapport Lighthouse score > 90 mobile

Phase 9 - Support RTL Arabe (2-3 jours):
  Agent: @i18n-glamgo
  - [ ] Traduction des 150-200 nouvelles clés i18n
  - [ ] Validation API DeepL pour les microcopy CTAs
  - [ ] Tests RTL sur tous les nouveaux composants :
      * Inversion layout avec Tailwind (rtl: prefix)
      * Validation spacing et alignment
      * Validation icônes (flip si directionnel)
  - [ ] Tests navigation RTL
  - [ ] Screenshots validation AR pour chaque page
  - Livrable: App 100% fonctionnelle en arabe RTL

Phase 10 - Tests UX/UI Exhaustifs (5-7 jours):
  Agent: @qa-glamgo
  - [ ] Tests Playwright E2E pour les 7 pages redessinées :
      * Scénario : Navigation complète mobile
      * Scénario : Flux réservation complet
      * Scénario : Inscription prestataire
      * Scénario : Recherche et filtres
      * Scénario : Gestion profil
  - [ ] Tests cross-browser :
      * Chrome (Android + Desktop)
      * Safari (iOS + macOS)
      * Firefox (Desktop)
  - [ ] Tests cross-device (via BrowserStack ou similaire) :
      * iPhone 12/13/14 (Safari)
      * Samsung Galaxy (Chrome)
      * iPad (Safari)
  - [ ] Tests accessibilité :
      * Axe DevTools audit
      * Navigation clavier complète
      * Screen reader (VoiceOver, NVDA)
  - [ ] Tests performance :
      * Lighthouse mobile score > 90
      * PageSpeed Insights validation
      * WebPageTest audit
  - [ ] User testing (5-10 utilisateurs réels) :
      * Enregistrement sessions Hotjar ou similaire
      * Feedback qualitatif
      * Identification points de friction
  - [ ] Documentation bugs et improvements
  - Livrable: Rapport QA complet + liste bugs/improvements

Phase 11 - Corrections & Polissage (3-5 jours):
  Agents: @frontend-glamgo + @design-glamgo
  - [ ] Correction bugs identifiés en phase QA
  - [ ] Ajustements design suite au user testing
  - [ ] Polissage animations et micro-interactions
  - [ ] Validation finale par Product Owner
  - [ ] Validation finale par mentor design
  - Livrable: Version Release Candidate

Phase 12 - Documentation & Déploiement (2 jours):
  Agents: @frontend-glamgo + @devops-glamgo
  - [ ] Documentation composants et Design System
  - [ ] Guide de contribution design pour futurs devs
  - [ ] Mise à jour README avec nouvelles conventions
  - [ ] Déploiement staging Fly.io pour validation finale
  - [ ] Validation monitoring (pas de régression performance)
  - [ ] Déploiement production avec rollback plan
  - [ ] Monitoring post-déploiement (24-48h)
  - Livrable: Design v2.0 en production

Dépendances:
  - Aucune dépendance externe (mission isolée frontend)
  - Dépendance interne : Phases séquentielles (1→2→3→4 pour design, puis 5→6→7→8 pour dev)
  - Design System doit être validé avant implémentation (go/no-go après Phase 4)
  - User testing peut révéler besoin ajustements (buffer prévu en Phase 11)

Risques & Mitigations:

Risque 1 - Dérive du scope de la refonte:
  Description: Tentation d'ajouter features pendant la refonte UI
  Impact: Retard planning, budget dépassé
  Mitigation:
    - Scope freeze après validation Phase 4
    - Toute nouvelle feature → backlog post-refonte
    - Validation PO à chaque phase gate

Risque 2 - Régression fonctionnelle:
  Description: La refonte casse des features existantes
  Impact: Bugs production, mécontentement utilisateurs
  Mitigation:
    - Tests Playwright complets avant/après
    - Code review strict sur chaque PR
    - Déploiement staging avec tests smoke complets
    - Rollback plan préparé

Risque 3 - Performance dégradée:
  Description: Le nouveau design consomme plus de ressources
  Impact: Contraintes RAM Fly.io (512MB frontend)
  Mitigation:
    - Tests Lighthouse à chaque phase
    - Code splitting agressif
    - Lazy loading systématique
    - Monitoring RAM en staging

Risque 4 - Adoption utilisateurs difficile:
  Description: Changement trop radical, utilisateurs perdus
  Impact: Baisse temporaire engagement, support surchargé
  Mitigation:
    - User testing avant déploiement (Phase 10)
    - Changelog clair et tutorial onboarding
    - Déploiement progressif (A/B test possible)
    - Support client renforcé J+0 à J+7

Risque 5 - Complexité RTL sous-estimée:
  Description: Tailwind RTL + composants complexes difficile
  Impact: Bugs layout en arabe
  Mitigation:
    - Tests RTL dès Phase 6 (composants atomiques)
    - Agent @i18n-glamgo impliqué dès le début
    - Validation native speaker arabe

Risque 6 - Migration Tailwind incomplète:
  Description: Mix SCSS/Tailwind crée incohérences
  Impact: Code difficile à maintenir, bugs style
  Mitigation:
    - Audit complet fichiers SCSS avant suppression
    - Migration par composant, pas global
    - Tests visuels après chaque migration

Estimation par agent:

  @design-glamgo:
    Phase 1 (Audit): 3 jours
    Phase 2 (Design System): 5 jours
    Phase 3 (Wireframes): 4 jours
    Phase 4 (Maquettes): 7 jours
    Phase 11 (Ajustements): 2 jours
    Total: 21 jours (~4 semaines)

  @frontend-glamgo:
    Phase 5 (Config Tailwind): 3 jours
    Phase 6 (Composants DS): 5 jours
    Phase 7 (Refonte pages): 10 jours
    Phase 8 (Performance): 4 jours
    Phase 11 (Corrections): 3 jours
    Phase 12 (Doc): 1 jour
    Total: 26 jours (~5 semaines)

  @i18n-glamgo:
    Phase 9 (RTL + Traductions): 3 jours
    Total: 3 jours

  @qa-glamgo:
    Phase 10 (Tests exhaustifs): 7 jours
    Total: 7 jours

  @devops-glamgo:
    Phase 12 (Déploiement): 1 jour
    Total: 1 jour

  TOTAL PROJET: ~8-10 semaines (en parallèle optimisé)

  Calendrier optimisé:
    - Semaines 1-4 : Design (Phases 1-4) → @design-glamgo
    - Semaines 5-9 : Développement (Phases 5-8) → @frontend-glamgo
    - Semaine 9 : i18n (Phase 9) → @i18n-glamgo (en parallèle dev)
    - Semaines 9-10 : QA (Phase 10) → @qa-glamgo
    - Semaine 10 : Corrections + Déploiement (Phases 11-12) → Multi-agents

Definition of Done:

Design:
- [ ] Design System complet documenté (Figma)
- [ ] 7 pages principales designées en haute fidélité
- [ ] Prototypes interactifs validés
- [ ] Validation mentor design obtenue
- [ ] Validation Product Owner obtenue

Développement:
- [ ] Migration Tailwind CSS 100% complète (0 SCSS custom résiduel)
- [ ] 30+ composants réutilisables créés et documentés
- [ ] 7 pages principales implémentées et responsive
- [ ] Bottom Navigation fonctionnelle sur mobile
- [ ] Code review approuvée par lead dev

Performance:
- [ ] Lighthouse score mobile > 90
- [ ] First Contentful Paint < 1.5s (mobile 4G)
- [ ] Cumulative Layout Shift < 0.1
- [ ] Bundle size optimisé (< 500KB JS initial)
- [ ] Tests performance sur Fly.io staging validés

i18n:
- [ ] 100% des nouvelles UI traduites FR/AR
- [ ] Tests RTL passés sur tous composants
- [ ] Validation native speaker arabe
- [ ] Screenshots AR archivés pour référence

Tests:
- [ ] Couverture tests Playwright > 80% des flows critiques
- [ ] Tests cross-browser passés (Chrome, Safari, Firefox)
- [ ] Tests cross-device passés (iPhone, Android, iPad)
- [ ] Tests accessibilité WCAG AA passés
- [ ] User testing complété (5-10 utilisateurs)

Production:
- [ ] Déployé sur Fly.io staging et validé (24h minimum)
- [ ] Déployé en production sans erreur
- [ ] Monitoring post-déploiement OK (48h)
- [ ] Aucune régression fonctionnelle détectée
- [ ] Métriques conversion trackées (baseline établi)

Documentation:
- [ ] Design System documenté (Figma + Markdown)
- [ ] Guide composants Tailwind créé
- [ ] README mis à jour avec nouvelles conventions
- [ ] Changelog détaillé publié
- [ ] Guide migration pour futurs devs

KPIs de succès (à mesurer post-déploiement):
- [ ] Taux de conversion réservations : +30% (objectif)
- [ ] Taux de rebond mobile : -20%
- [ ] Temps moyen session : +40%
- [ ] Net Promoter Score (NPS) : +15 points
- [ ] Satisfaction design (survey) : > 4.5/5

---

## Notes importantes

### Philosophie Mobile-First
Cette refonte adopte une philosophie **Mobile-First stricte** :
1. Tout design commence à 375px (iPhone standard)
2. Progressive enhancement pour tablet/desktop
3. Touch-first : tous les éléments interactifs >= 44x44px
4. Bottom Navigation : navigation principale en bas (thumb zone)
5. Gestures : swipe, pull-to-refresh si applicable

### Inspiration Design
Les références à suivre :
- **Airbnb** : Cards services, photos immersives, reviews
- **Uber** : Simplicité réservation, tracking real-time, bottom sheets
- **Revolut** : Design System cohérent, micro-interactions, données visuelles
- **Glovo** : Catégories visuelles, CTA persuasifs, preuve sociale

### Tailwind CSS Best Practices
- Utiliser `@apply` uniquement si absolument nécessaire (préférer classes utilitaires)
- Créer des composants React réutilisables, pas des classes CSS custom
- Utiliser `clsx` ou `classnames` pour conditional classes
- Documenter les classes custom dans tailwind.config.js
- Utiliser les variants Tailwind (hover:, focus:, active:, disabled:, rtl:)

### Accessibilité (WCAG AA minimum)
- Contraste couleurs >= 4.5:1 pour texte normal
- Contraste couleurs >= 3:1 pour texte large
- Navigation clavier complète (focus visible)
- ARIA labels sur éléments interactifs
- Textes alternatifs images
- Structure sémantique HTML5

### Conversion Optimization
Chaque page doit être optimisée pour la conversion :
- **Hero** : Value proposition claire en < 3 secondes
- **CTAs** : Orientés bénéfice, pas action ("Trouver mon pro" vs "Rechercher")
- **Preuve sociale** : Ratings, avis, badges ("Top prestataire 2025")
- **Urgency** : "X personnes ont réservé aujourd'hui", disponibilités limitées
- **Trust signals** : Paiement sécurisé, garantie satisfaction, etc.

### Coordination avec agents spécialisés
Cette mission nécessite une collaboration étroite :
- **@design-glamgo** : Responsable vision design, créativité, cohérence
- **@frontend-glamgo** : Responsable implémentation technique, performance
- **@i18n-glamgo** : Responsable RTL, traductions, culture locale
- **@qa-glamgo** : Responsable validation qualité, tests, feedback utilisateurs
- **@devops-glamgo** : Responsable déploiement, monitoring, rollback

### Validation Gates
Points de validation obligatoires avant de continuer :
1. **Après Phase 2** : Design System validé par PO + mentor
2. **Après Phase 4** : Maquettes validées par PO + mentor + user testing
3. **Après Phase 8** : Performance validée (Lighthouse > 90)
4. **Après Phase 10** : QA validée (tous tests passés)
5. **Avant Phase 12** : Go/No-Go déploiement production

### Rollback Plan
En cas de problème en production :
1. Rollback immédiat vers version précédente (< 5 min)
2. Investigation root cause
3. Fix sur branche dédiée
4. Re-test complet staging
5. Re-déploiement quand validé

---

## Prochaines étapes immédiates

1. **Validation scope** : Product Owner valide cette user story
2. **Validation mentor** : Mentor design valide l'approche
3. **Kick-off meeting** : Réunion tous les agents concernés
4. **Lancement Phase 1** : @design-glamgo commence l'audit design
5. **Setup tracking** : Créer board Trello/Jira pour suivi (optionnel)

---

*User Story créée le 2025-12-09*
*Statut : EN ATTENTE DE VALIDATION*
*Créée par : Chef de Projet GlamGo*
```

---

## Résumé Exécutif

Cette refonte design est une **mission critique** qui transformera radicalement l'expérience utilisateur GlamGo. Elle représente un investissement de **8-10 semaines** et mobilise **5 agents spécialisés**.

**Bénéfices attendus :**
- Design moderne qui inspire confiance et crédibilité
- Expérience mobile optimale (80%+ du trafic)
- Code maintenable et évolutif (Tailwind CSS)
- Préparation apps natives iOS/Android
- Augmentation conversions (+30% objectif)

**Risques principaux :**
- Régression fonctionnelle (mitigé par tests exhaustifs)
- Performance RAM Fly.io (mitigé par optimisation continue)
- Adoption utilisateurs (mitigé par user testing + déploiement progressif)

**Investissement :**
- @design-glamgo : 4 semaines
- @frontend-glamgo : 5 semaines
- @i18n-glamgo : 3 jours
- @qa-glamgo : 7 jours
- @devops-glamgo : 1 jour

**Go/No-Go :** Validation requise avant lancement Phase 1.