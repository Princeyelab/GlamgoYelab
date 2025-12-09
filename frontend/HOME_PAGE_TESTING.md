# Guide de Test - Page HOME App-Like

## Démarrage du serveur de développement

```bash
cd C:\Dev\YelabGo\frontend
npm run dev
```

Ouvrir le navigateur sur : http://localhost:3000

## Tests visuels à effectuer

### 1. Hero Section
- [ ] Titre visible et centré
- [ ] Texte "en quelques clics" en couleur primary (#E63946)
- [ ] Search bar avec bordure grise visible
- [ ] Icône Search visible à gauche
- [ ] Bouton "Rechercher" visible à droite
- [ ] Badge "Marrakech" avec icône MapPin visible
- [ ] Gradient de fond subtil visible

### 2. Search Bar
- [ ] Cliquer dans l'input → border devient primary/30
- [ ] Taper du texte → texte visible
- [ ] Appuyer sur Entrée → redirection vers /services?q={query}
- [ ] Cliquer sur bouton "Rechercher" → même comportement
- [ ] Placeholder lisible et grisé

### 3. Categories Grid
- [ ] 8 catégories visibles
- [ ] Icônes colorées (bleu, rose, indigo, violet, rouge, vert, orange, jaune)
- [ ] Texte nom de catégorie lisible
- [ ] Compteur "X services" visible
- [ ] Hover sur catégorie → background gris-50
- [ ] Hover sur icône → scale 1.1 (agrandissement)
- [ ] Cliquer → redirection vers /services?category={slug}

### 4. Services Populaires
- [ ] 6 services visibles
- [ ] Images chargées (ou placeholder si 404)
- [ ] Badge "Populaire" visible en haut à droite de l'image
- [ ] Icône Sparkles visible dans le badge
- [ ] Titre service lisible (2 lignes max)
- [ ] Description lisible (clamp 2 lignes)
- [ ] Rating avec étoile jaune visible
- [ ] Nombre d'avis entre parenthèses
- [ ] Prix "À partir de XXX MAD" en bold primary
- [ ] Hover sur card → shadow augmente + lift effect
- [ ] Hover sur titre → texte devient primary
- [ ] Cliquer → redirection vers /services/{id}

### 5. Stats Section
- [ ] Titre "Pourquoi choisir GlamGo ?" visible
- [ ] Sous-titre visible
- [ ] 4 stats visibles (2 colonnes mobile, 4 colonnes desktop)
- [ ] Icônes dans des carrés avec gradient de fond
- [ ] Valeurs en gros (3xl ou 4xl)
- [ ] Labels en petit texte gris
- [ ] Hover sur stat → background blanc + shadow

### 6. CTA Section
- [ ] Background gradient coloré (rouge → orange)
- [ ] Texte blanc contrasté et lisible
- [ ] 2 boutons visibles
- [ ] Bouton "Explorer les services" variant secondary
- [ ] Bouton "Devenir prestataire" variant outline blanc
- [ ] Icônes dans les boutons visibles
- [ ] Hover sur boutons → effets visuels
- [ ] Cliquer "Explorer" → redirection /services
- [ ] Cliquer "Devenir prestataire" → redirection /provider/register

### 7. Bottom Navigation (Mobile uniquement)
- [ ] Visible sur mobile (< 768px)
- [ ] Masqué sur desktop (>= 768px)
- [ ] 5 items visibles
- [ ] Item "Accueil" actif (couleur primary)
- [ ] Icônes visibles et bien espacées
- [ ] Labels lisibles
- [ ] Fixed en bas de la page
- [ ] Ne chevauche pas le contenu (grâce au spacer)

## Tests responsive

### Mobile (375px)
```
1. Ouvrir DevTools (F12)
2. Mode responsive (Ctrl+Shift+M)
3. Sélectionner iPhone SE (375px)
4. Vérifier :
   - Hero title sur 2 lignes
   - Search bar occupe toute la largeur
   - Categories scroll horizontal (flèche → visible)
   - Services scroll horizontal (flèche → visible)
   - Stats en 2 colonnes
   - CTA buttons stack vertical
   - Bottom Nav visible et fixe
```

### Tablet (768px)
```
1. Sélectionner iPad (768px)
2. Vérifier :
   - Categories grid 4 colonnes
   - Services grid 2 colonnes
   - Stats grid 4 colonnes
   - CTA buttons inline
   - Bottom Nav masqué
```

### Desktop (1280px+)
```
1. Sélectionner Laptop L (1440px)
2. Vérifier :
   - Categories grid 8 colonnes
   - Services grid 3 colonnes
   - Stats grid 4 colonnes
   - Max-width 1280px centré
   - Whitespace équilibré
```

## Tests de navigation

### Liens de catégories
```
1. Cliquer sur "Maison" → /services?category=maison
2. Cliquer sur "Beauté" → /services?category=beaute
3. Cliquer sur "Voiture" → /services?category=voiture
...etc
```

### Liens de services
```
1. Cliquer sur "Coiffure à domicile" → /services/1
2. Cliquer sur "Massage relaxant" → /services/2
3. Cliquer sur "Nettoyage maison" → /services/3
...etc
```

### Liens "Voir tout"
```
1. Cliquer sur "Voir tout" (Categories) → /services
2. Cliquer sur "Voir tout" (Services) → /services
```

### Bottom Nav
```
1. Cliquer sur "Rechercher" → /services
2. Cliquer sur "Commandes" → /orders
3. Cliquer sur "Messages" → /messages
4. Cliquer sur "Profil" → /profile
```

## Tests d'interaction

### Hover states
```
1. Hover sur catégorie → background gris
2. Hover sur service card → shadow + lift
3. Hover sur stat → background blanc + shadow
4. Hover sur bouton CTA → couleur change
```

### Focus states
```
1. Tab sur search input → border visible
2. Tab sur liens → outline visible
3. Tab sur boutons → outline visible
```

### Transitions
```
1. Vérifier que toutes les transitions sont smooth
2. Pas de lag ou saccades
3. Transitions < 300ms
```

## Tests de performance

### Temps de chargement
```
1. Ouvrir DevTools → Network
2. Rafraîchir la page (Ctrl+R)
3. Vérifier :
   - DOMContentLoaded < 1s
   - Load < 2s
   - Pas d'erreurs 404 (sauf images mock)
```

### Images
```
1. Vérifier que les images manquantes affichent un placeholder ou 404 gracieux
2. Vérifier lazy loading (images hors viewport ne chargent pas immédiatement)
3. Aspect-ratio 4/3 respecté (pas de layout shift)
```

## Tests d'accessibilité

### Contraste
```
1. Texte gris sur fond blanc → contraste suffisant
2. Texte blanc sur fond gradient → contraste suffisant
3. Prix primary sur fond blanc → contraste suffisant
```

### Navigation clavier
```
1. Tab pour naviguer entre éléments
2. Enter pour activer liens/boutons
3. Focus visible sur tous les éléments interactifs
```

### Lecteur d'écran
```
1. aria-label sur BottomNav
2. aria-current sur item actif
3. alt text sur images
```

## Tests fonctionnels

### Search Bar
```
Test 1: Recherche simple
1. Taper "coiffure"
2. Appuyer sur Entrée
3. Vérifier redirection vers /services?q=coiffure

Test 2: Recherche vide
1. Laisser champ vide
2. Appuyer sur Entrée
3. Vérifier qu'il ne se passe rien (trim)

Test 3: Recherche avec espaces
1. Taper "  massage  "
2. Appuyer sur Entrée
3. Vérifier redirection avec trim
```

### Categories
```
Test 1: Click catégorie
1. Cliquer sur "Beauté"
2. Vérifier URL = /services?category=beaute

Test 2: Scroll horizontal mobile
1. Mode mobile 375px
2. Swiper horizontalement
3. Vérifier que toutes les 8 catégories sont accessibles
```

### Services
```
Test 1: Click service
1. Cliquer sur un service
2. Vérifier URL = /services/{id}

Test 2: Scroll horizontal mobile
1. Mode mobile 375px
2. Swiper horizontalement
3. Vérifier que tous les 6 services sont accessibles
```

### CTA Buttons
```
Test 1: Explorer les services
1. Cliquer sur "Explorer les services"
2. Vérifier redirection /services

Test 2: Devenir prestataire
1. Cliquer sur "Devenir prestataire"
2. Vérifier redirection /provider/register
```

## Tests de régression

### Après modifications futures
```
1. Build réussit sans erreurs
2. Aucune erreur console
3. Tous les tests ci-dessus passent
4. Design cohérent avec Design System
5. Responsive fonctionne
6. Navigation fonctionne
```

## Checklist finale

Avant de valider la page :
- [ ] Tous les tests visuels passent
- [ ] Tous les tests responsive passent
- [ ] Tous les tests de navigation passent
- [ ] Tous les tests d'interaction passent
- [ ] Tous les tests de performance passent
- [ ] Tous les tests d'accessibilité passent
- [ ] Tous les tests fonctionnels passent
- [ ] Build production réussit
- [ ] Aucune erreur console
- [ ] Design cohérent avec mockups/directives

## Bugs connus et solutions

### Images 404
```
Problème: Certaines images de services n'existent pas
Solution: Remplacer les chemins par des images réelles ou placeholder
```

### Bottom Nav sur tablet
```
Problème: Bottom Nav pourrait être visible sur certaines tablettes
Solution: Vérifier breakpoint md (768px) est correct
```

### Scroll horizontal saccadé
```
Problème: Scroll horizontal pas smooth sur certains navigateurs
Solution: Ajouter scroll-behavior: smooth ou utiliser CSS scroll-snap
```

## Outils de test recommandés

1. **Chrome DevTools** - Tests responsive et performance
2. **Lighthouse** - Audit performance, accessibilité, SEO
3. **axe DevTools** - Tests d'accessibilité
4. **React DevTools** - Inspection composants
5. **Network throttling** - Test connexions lentes

## Commandes utiles

```bash
# Lancer le dev server
npm run dev

# Build production
npm run build

# Lancer production en local
npm run start

# Linter
npm run lint

# Tests (si configurés)
npm run test
```

## Résultat attendu

Page HOME moderne, responsive, performante, accessible, avec toutes les directives du mentor respectées.

✅ **Status**: READY FOR TESTING
