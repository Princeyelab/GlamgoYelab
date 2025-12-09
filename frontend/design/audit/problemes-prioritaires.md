# Liste Problèmes Prioritaires - GlamGo Design Audit

**Date:** 09 Décembre 2025
**Référence:** Rapport audit complet (design/audit/rapport-audit-complet.md)

---

## RÉSUMÉ EXÉCUTIF

Sur **35+ composants analysés**, **20 problèmes majeurs** identifiés.

**Distribution** :
- 🔴 CRITIQUES : **7 problèmes** (bloquants App-Like)
- 🟡 MAJEURS : **7 problèmes** (impact important)
- 🟢 MINEURS : **6 problèmes** (améliorations)

**Temps total estimé corrections** : **6-7 semaines** (phases 5-11)

---

## 🔴 CRITIQUES (7) - Action Immédiate Requise

### 1. Absence Bottom Navigation Mobile
**Problème** : Navigation top classique, pas App-Like
**Impact** : UX mobile dégradée, zone thumb inaccessible
**Écart directive** : US-DESIGN-001 exige Bottom Nav 5 items (Home, Search, Orders, Messages, Profile)
**Solution** :
- Créer `components/ui/BottomNavigation.jsx`
- Height: 64px
- Items: 5 max
- Touch targets: 44x44px minimum
- Icons: 24x24px (Heroicons)
- Active state: primary color + bold

**Effort** : 3 jours (design + dev)
**Phase** : 6 (Composants Design System)
**Assigné** : @design-glamgo + @frontend-glamgo

---

### 2. Palette Couleurs Non Conforme
**Problème** :
- Primary actuel: #FF6B6B (rouge clair) vs **#E63946** requis (rouge punch)
- Secondary actuel: #4ECDC4 (cyan) vs **#F4A261** requis (orange)
- Accent absent: **#2A9D8F** requis (teal success)

**Impact** : Identité visuelle incohérente, palette trop froide, manque de chaleur

**Solution** :
```js
// tailwind.config.js
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
}
```

**Effort** : 2 jours (config Tailwind + validation)
**Phase** : 5 (Configuration Tailwind)
**Assigné** : @design-glamgo + @frontend-glamgo

---

### 3. Tailwind CSS Absent
**Problème** : 100% SCSS custom, aucun Tailwind installé
**Impact** :
- Code difficile à maintenir
- Incohérences de style possibles
- Bundle CSS plus lourd (pas de purge)
- Pas de JIT compilation

**Solution** :
1. Installer Tailwind CSS v3+
2. Configurer `tailwind.config.js` (palette, typo, radius, shadows)
3. Créer design tokens (`colors.js`, `typography.js`)
4. Migrer composants un par un (35+)
5. Supprimer SCSS modules progressivement

**Effort** : 3 semaines (migration complète)
**Phase** : 5-7 (Config + Composants + Pages)
**Assigné** : @frontend-glamgo

---

### 4. Typographie Non Conforme
**Problème** :
- Fonts actuelles: System fonts (Apple/Segoe UI/Roboto)
- Fonts requises: **Inter** (body) + **Poppins** (headings)

**Impact** : Manque de personnalité, look générique

**Solution** :
```js
// tailwind.config.js
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  heading: ['Poppins', 'sans-serif'],
}
```
```jsx
// layout.js
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ weights: [400, 500, 600, 700], variable: '--font-poppins' });
```

**Effort** : 1 jour (config + import)
**Phase** : 5 (Configuration Tailwind)
**Assigné** : @frontend-glamgo

---

### 5. Border-Radius Trop Petits
**Problème** :
- Actuel: Cards 8px, Buttons 8px
- Requis: Cards **20px minimum**, Buttons **pill shape (9999px)**

**Impact** : Look daté, trop "carré", pas App-Like

**Solution** :
```js
// tailwind.config.js
borderRadius: {
  'md': '16px',
  'lg': '20px',
  'xl': '24px',
  'full': '9999px',
}
```
```jsx
// ServiceCard
<div className="rounded-[20px]"> // 20px au lieu de 8px

// Button
<button className="rounded-full h-14"> // Pill shape
```

**Effort** : 1 jour (config + migration)
**Phase** : 5-7
**Assigné** : @frontend-glamgo

---

### 6. CTAs Non Orientés Bénéfice
**Problème** : Textes orientés action vs bénéfice

**Exemples actuels** :
- ❌ "Se connecter"
- ❌ "S'inscrire"
- ❌ "Devenir prestataire"
- ❌ "Voir tous les services"
- ❌ "Créer un compte"

**Exemples requis** :
- ✅ "Me connecter"
- ✅ "Commencer gratuitement"
- ✅ "Offrir mes services"
- ✅ "Découvrir plus de pros"
- ✅ "Trouver mon prestataire"

**Impact** : Conversion sous-optimale (-20 à -30% estimé)

**Solution** : Réécrire toutes les clés i18n (FR + AR)

**Fichiers** :
- `locales/fr.json` : 150-200 clés à réécrire
- `locales/ar.json` : Traduction DeepL

**Effort** : 2 jours (réécriture + validation)
**Phase** : 7 (Refonte pages)
**Assigné** : @design-glamgo + @i18n-glamgo

---

### 7. Social Proof Absent
**Problème** : Aucune preuve sociale visible

**Absent** :
- Stats Hero ("12 000+ clients", "4.8/5 étoiles")
- "X personnes ont réservé aujourd'hui"
- Badges "Popular", "Top Rated" sur cards
- Reviews avec photos clients

**Impact** : Taux de conversion faible, manque de crédibilité

**Solution** :
1. Hero : Ajouter stats bar
   ```jsx
   <div className="stats">
     <div>12 000+ clients</div>
     <div>4.8/5 étoiles</div>
     <div>35 prestataires certifiés</div>
   </div>
   ```

2. ServiceCard : Badge dynamique
   ```jsx
   {total_reviews > 50 && (
     <Badge className="absolute top-4 right-4 backdrop-blur-md bg-white/80">
       Popular
     </Badge>
   )}
   ```

3. ReviewCard avec photos
   ```jsx
   <ReviewCard
     avatar="/avatars/1.jpg"
     name="Sarah M."
     rating={5}
     comment="Service impeccable !"
     photos={['/reviews/1.jpg']}
   />
   ```

**Effort** : 3 jours (design + dev + intégration)
**Phase** : 7 (Refonte pages)
**Assigné** : @design-glamgo + @frontend-glamgo

---

## 🟡 MAJEURS (7) - Haute Priorité

### 8. Buttons Non Pill Shape
**Problème** : Border-radius 8px vs pill shape requis
**Solution** : `className="rounded-full h-14 px-8"`
**Effort** : 1 jour
**Phase** : 6 (Composants DS)

---

### 9. Buttons Height < 56px
**Problème** : Height actuel ~40-44px vs 56px minimum requis
**Solution** : `className="h-14"` (56px)
**Effort** : 1 jour
**Phase** : 6

---

### 10. Hamburger Menu Non Optimal
**Problème** : Menu slide-in 280px depuis droite, overlay gris 50%
**Solution** : Bottom sheet moderne plein écran (Material Design 3 style)
**Effort** : 2 jours
**Phase** : 7

---

### 11. Images Non Optimisées
**Problème** : `<img>` classique vs `next/image`
**Solution** :
```jsx
import Image from 'next/image';

<Image
  src={imageUrl}
  alt={name}
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```
**Effort** : 2 jours (migration 35+ composants)
**Phase** : 8 (Performance)

---

### 12. Social Login Absent
**Problème** : Formulaire classique uniquement
**Solution** : Boutons OAuth Google + Apple avant formulaire
**Effort** : 3 jours (intégration NextAuth.js)
**Phase** : 7

---

### 13. Touch Targets < 44px
**Problème** : Plusieurs endroits (NavLink, dropdown items, mobile menu button)
**Solution** : Revue systématique, `min-h-[44px]` partout
**Effort** : 2 jours
**Phase** : 6-7

---

### 14. Shadows Non Material Design 3
**Problème** : Shadows Tailwind v2 (multiples couches) vs MD3 (soft single layer)
**Solution** :
```js
boxShadow: {
  'sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
  'md': '0 4px 16px rgba(0, 0, 0, 0.08)',
  'lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
}
```
**Effort** : 1 jour
**Phase** : 5

---

## 🟢 MINEURS (6) - Améliorations

### 15. Logo Height 32px Mobile (Trop Petit)
**Solution** : 40px minimum
**Effort** : 30 min
**Phase** : 7

---

### 16. Hover Effects Subtils
**Solution** : `translateY(-6px)` au lieu de `-4px`
**Effort** : 1 jour
**Phase** : 11 (Polissage)

---

### 17. Active States Absents
**Solution** : `active:scale-[0.98]` sur tous interactifs
**Effort** : 1 jour
**Phase** : 6-7

---

### 18. Badges Sans Blur Backdrop
**Solution** : `className="backdrop-blur-md bg-white/80"`
**Effort** : 1 jour
**Phase** : 6

---

### 19. Icons React Icons Datés
**Solution** : Migration vers Heroicons ou Lucide
**Effort** : 2 jours
**Phase** : 6-7

---

### 20. User Menu Dropdown 200px (Trop Petit)
**Solution** : `min-w-[240px]`
**Effort** : 30 min
**Phase** : 7

---

## PLAN D'ACTION PRIORISÉ

### Sprint 1 (Semaine 1) - CRITIQUES 1-3
- [ ] Configuration Tailwind CSS
- [ ] Migration palette couleurs
- [ ] Migration typographie (Inter/Poppins)
- **Livrable** : Tailwind config fonctionnel

### Sprint 2 (Semaine 2) - CRITIQUES 4-5 + MAJEURS 8-9
- [ ] Migration border-radius
- [ ] Création composant Button (pill shape, 56px height)
- [ ] Création composant BottomNavigation
- **Livrable** : 2 composants atomiques Tailwind

### Sprint 3 (Semaine 3) - CRITIQUES 6-7
- [ ] Réécriture CTAs (clés i18n)
- [ ] Ajout social proof (stats Hero, badges, reviews)
- [ ] Migration ServiceCard vers Tailwind
- **Livrable** : Home page avec social proof

### Sprint 4 (Semaine 4) - MAJEURS 10-14
- [ ] Refonte hamburger menu (bottom sheet)
- [ ] Migration images vers next/image
- [ ] Social login (OAuth Google/Apple)
- [ ] Revue touch targets
- [ ] Migration shadows MD3
- **Livrable** : Navigation + auth optimisées

### Sprint 5 (Semaines 5-6) - MIGRATION COMPLÈTE
- [ ] Migration 35+ composants restants vers Tailwind
- [ ] Refonte 7 pages principales
- [ ] Suppression SCSS modules
- **Livrable** : App 100% Tailwind

### Sprint 6 (Semaine 7) - MINEURS + POLISSAGE
- [ ] Corrections mineurs (15-20)
- [ ] Micro-animations
- [ ] Tests UX/UI
- **Livrable** : Version polie

---

## MÉTRIQUES DE SUCCÈS

**Avant refonte** :
- Bottom Nav mobile : ❌ Absent
- Palette conforme : ❌ 0/3 couleurs
- Tailwind CSS : ❌ 0%
- Border-radius cards : ❌ 8px
- CTAs orientés bénéfice : ❌ 0%
- Social proof : ❌ Absent

**Après refonte** :
- Bottom Nav mobile : ✅ Présent (5 items, 64px, 44px touch)
- Palette conforme : ✅ 3/3 couleurs (#E63946, #F4A261, #2A9D8F)
- Tailwind CSS : ✅ 100% migration
- Border-radius cards : ✅ 20px
- CTAs orientés bénéfice : ✅ 100% clés réécrites
- Social proof : ✅ Stats + badges + reviews photos

**KPIs attendus** :
- Taux conversion réservations : **+30%**
- Taux rebond mobile : **-20%**
- Temps session : **+40%**
- NPS : **+15 points**
- Satisfaction design : **> 4.5/5**

---

**FIN LISTE PROBLÈMES**

**Prochaine étape** : Validation PO → Lancement Sprint 1 (Config Tailwind)
