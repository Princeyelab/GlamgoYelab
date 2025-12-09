# GlamGo Design System - Composants UI

Documentation des composants UI créés pour le Design System GlamGo.

## Installation

```bash
npm install lucide-react  # Icônes (déjà installé)
```

## Structure des Composants

Tous les composants sont dans `src/components/ui/` et exportés via `src/components/ui/index.js`.

```javascript
import { Button, Card, Input, Badge, BottomNav } from '@/components/ui';
```

---

## 1. BUTTON Component

Bouton principal avec variantes, tailles et support icônes.

### Props

| Prop       | Type      | Default     | Description                                   |
|------------|-----------|-------------|-----------------------------------------------|
| variant    | string    | 'primary'   | primary, secondary, outline, ghost, danger    |
| size       | string    | 'md'        | sm (36px), md (48px), lg (56px)               |
| icon       | ReactNode | -           | Icône (lucide-react)                          |
| loading    | boolean   | false       | État de chargement avec spinner               |
| disabled   | boolean   | false       | Bouton désactivé                              |
| fullWidth  | boolean   | false       | Prend toute la largeur                        |

### Exemples

```jsx
import { Button } from '@/components/ui';
import { Heart, Send } from 'lucide-react';

// Variants
<Button variant="primary">Réserver</Button>
<Button variant="secondary">Annuler</Button>
<Button variant="outline">En savoir plus</Button>
<Button variant="ghost">Fermer</Button>
<Button variant="danger">Supprimer</Button>

// Sizes
<Button size="sm">Petit</Button>
<Button size="md">Moyen</Button>
<Button size="lg">Grand</Button>

// With Icons
<Button icon={<Heart />}>Favoris</Button>
<Button variant="primary" icon={<Send />}>Envoyer</Button>

// States
<Button loading>Chargement...</Button>
<Button disabled>Indisponible</Button>
<Button fullWidth>Largeur complète</Button>
```

### Caractéristiques

- Hauteur touch-friendly (48px minimum)
- Transitions fluides
- Focus states accessibles
- Active states avec feedback tactile
- Spinner de chargement intégré
- Support RTL automatique

---

## 2. CARD Component

Système de cartes modulaire pour afficher services, prestataires, etc.

### Composants

- `Card` - Container principal
- `CardImage` - Image avec badge support
- `CardContent` - Zone de contenu
- `CardTitle` - Titre avec line-clamp
- `CardDescription` - Description avec line-clamp
- `CardFooter` - Footer pour actions

### Props

#### Card
| Prop       | Type      | Default | Description                    |
|------------|-----------|---------|--------------------------------|
| hoverable  | boolean   | true    | Animation hover et transform   |
| onClick    | function  | -       | Click handler                  |

#### CardImage
| Prop        | Type      | Default | Description                   |
|-------------|-----------|---------|-------------------------------|
| src         | string    | -       | URL de l'image                |
| alt         | string    | -       | Texte alternatif              |
| badge       | ReactNode | -       | Badge à afficher              |
| aspectRatio | string    | '4/3'   | Ratio d'aspect (ex: '16/9')   |

#### CardTitle / CardDescription
| Prop  | Type   | Default | Description                |
|-------|--------|---------|----------------------------|
| lines | number | 2 / 3   | Nombre de lignes max       |

### Exemple

```jsx
import {
  Card,
  CardImage,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Badge,
} from '@/components/ui';

<Card hoverable onClick={() => navigate('/service/123')}>
  <CardImage
    src="/images/massage-relaxant.jpg"
    alt="Massage Relaxant"
    badge={<Badge variant="accent">Bien-être</Badge>}
  />
  <CardContent>
    <CardTitle>Massage Relaxant</CardTitle>
    <CardDescription lines={3}>
      Massage complet du corps pour une relaxation totale...
    </CardDescription>
  </CardContent>
  <CardFooter>
    <span className="price">250 MAD</span>
    <Button size="sm">Réserver</Button>
  </CardFooter>
</Card>
```

### Caractéristiques

- Rounded-lg (20px border-radius)
- Shadow-sm avec hover:shadow-md
- Hover transform: translateY(-4px)
- Lazy loading des images
- Text clamp automatique
- Responsive

---

## 3. INPUT Component

Inputs, textarea et select avec label et error support.

### Composants

- `Input` - Input text/email/password/etc
- `Textarea` - Zone de texte multiline
- `Select` - Dropdown select

### Props

| Prop        | Type      | Default | Description                    |
|-------------|-----------|---------|--------------------------------|
| label       | string    | -       | Label du champ                 |
| error       | string    | -       | Message d'erreur               |
| helperText  | string    | -       | Texte d'aide                   |
| leftIcon    | ReactNode | -       | Icône à gauche                 |
| rightIcon   | ReactNode | -       | Icône à droite                 |
| required    | boolean   | false   | Champ requis (*)               |

### Exemples

```jsx
import { Input, Textarea, Select } from '@/components/ui';
import { Search, Mail } from 'lucide-react';

// Input basique
<Input
  label="Nom complet"
  placeholder="Entrez votre nom"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>

// Avec icônes
<Input
  label="Email"
  type="email"
  leftIcon={<Mail size={20} />}
  helperText="Nous ne partagerons jamais votre email"
/>

// Avec erreur
<Input
  label="Téléphone"
  error="Format invalide"
  value={phone}
/>

// Textarea
<Textarea
  label="Description"
  rows={5}
  helperText="Minimum 50 caractères"
/>

// Select
<Select
  label="Catégorie"
  placeholder="Sélectionnez..."
  required
>
  <option value="beaute">Beauté</option>
  <option value="bien-etre">Bien-être</option>
</Select>
```

### Caractéristiques

- Hauteur touch-friendly (56px)
- Border-radius: 20px (rounded-xl)
- Focus states avec ring
- Support error/helper text
- Icônes left/right
- Support RTL
- Accessible (ARIA)

---

## 4. BADGE Component

Badges pill-shaped pour catégories, status, notifications.

### Composants

- `Badge` - Badge principal
- `BadgeGroup` - Container pour plusieurs badges
- `StatusBadge` - Badge status avec mapping auto
- `NotificationBadge` - Badge notification circulaire

### Props

#### Badge
| Prop    | Type      | Default   | Description                                  |
|---------|-----------|-----------|----------------------------------------------|
| variant | string    | 'default' | default, primary, secondary, accent, success, warning, error |
| size    | string    | 'md'      | sm (24px), md (32px), lg (40px)              |
| dot     | boolean   | false     | Affiche un point de couleur                  |
| icon    | ReactNode | -         | Icône                                        |

#### StatusBadge
| Prop   | Type   | Default | Description                               |
|--------|--------|---------|-------------------------------------------|
| status | string | -       | pending, confirmed, in_progress, completed, cancelled, active, inactive, etc. |

#### NotificationBadge
| Prop  | Type   | Default | Description                     |
|-------|--------|---------|---------------------------------|
| count | number | -       | Nombre de notifications         |
| max   | number | 99      | Max avant affichage "99+"       |

### Exemples

```jsx
import { Badge, BadgeGroup, StatusBadge, NotificationBadge } from '@/components/ui';
import { Star } from 'lucide-react';

// Variants
<Badge variant="primary">Populaire</Badge>
<Badge variant="success">Disponible</Badge>
<Badge variant="warning">En attente</Badge>
<Badge variant="error">Complet</Badge>

// Sizes
<Badge size="sm">Petit</Badge>
<Badge size="md">Moyen</Badge>
<Badge size="lg">Grand</Badge>

// Avec dot
<Badge variant="success" dot>En ligne</Badge>
<Badge variant="error" dot>Hors ligne</Badge>

// Avec icône
<Badge variant="accent" icon={<Star size={14} />}>
  Top Prestataire
</Badge>

// Badge Group
<BadgeGroup>
  <Badge>Beauté</Badge>
  <Badge>Bien-être</Badge>
  <Badge>Domicile</Badge>
</BadgeGroup>

// Status Badge
<StatusBadge status="pending" />
<StatusBadge status="confirmed" />
<StatusBadge status="completed" />

// Notification Badge
<div style={{ position: 'relative' }}>
  <Button>Messages</Button>
  <NotificationBadge count={5} />
</div>
```

### Caractéristiques

- Pill shape (border-radius: 999px)
- Couleurs sémantiques
- Dot indicator
- Mapping auto pour status
- Badge notification avec count

---

## 5. BOTTOM NAVIGATION Component

Navigation bottom mobile app-like (masquée sur desktop).

### Composants

- `BottomNav` - Barre de navigation
- `BottomNavSpacer` - Spacer pour éviter overlay

### Props

| Prop          | Type   | Default | Description                          |
|---------------|--------|---------|--------------------------------------|
| notifications | object | {}      | Count par item { orders: 2, ... }    |
| language      | string | 'fr'    | Langue (fr/ar)                       |

### Exemple

```jsx
import { BottomNav, BottomNavSpacer } from '@/components/ui';

function Layout({ children }) {
  return (
    <>
      <main>{children}</main>

      {/* Spacer pour éviter que le contenu soit caché */}
      <BottomNavSpacer />

      {/* Navigation (visible uniquement mobile) */}
      <BottomNav
        notifications={{
          orders: 3,
          messages: 12,
        }}
        language="fr"
      />
    </>
  );
}
```

### Items de Navigation

1. **Accueil** (Home) - `/`
2. **Rechercher** (Search) - `/services`
3. **Commandes** (Orders) - `/orders`
4. **Messages** (Messages) - `/messages`
5. **Profil** (Profile) - `/profile`

### Caractéristiques

- Fixed bottom, height: 64px
- 5 items avec icônes Lucide
- Active state avec couleur primary
- Badge notifications
- md:hidden (masqué sur desktop)
- Support RTL
- Safe area iOS (bottom inset)
- Animation slide-up
- Touch feedback

---

## Page de Test

Accédez à `/design-test` pour voir tous les composants en action.

```bash
npm run dev
# Ouvrir http://localhost:3000/design-test
```

La page contient:
- Tous les variants de Button
- Exemples de Cards avec mock data
- Tous les types d'Input
- Tous les variants de Badge
- Aperçu mobile du BottomNav

---

## Fichiers Créés

```
src/components/ui/
├── Button.jsx + Button.module.scss (existant)
├── Card.jsx + Card.module.scss (nouveau)
├── Input.jsx + Input.module.scss (nouveau)
├── Badge.jsx + Badge.module.scss (nouveau)
├── BottomNav.jsx + BottomNav.module.scss (nouveau)
└── index.js (mis à jour)

src/app/design-test/
├── page.jsx (nouveau)
└── page.module.scss (nouveau)

src/styles/
└── _variables.scss (mis à jour avec $max-width-container et $max-width-mobile)
```

---

## Build Status

Build Next.js réussi:
- Compiled successfully in 3.9min
- 32 routes générées
- 0 erreurs
- Warnings SASS (uniquement sur ancien fichier SatisfactionModal, non critique)

---

## Prochaines Étapes

Composants à ajouter:
- Avatar - Photos de profil rondes
- Rating - Étoiles de notation
- Modal - Boîtes de dialogue
- Toast - Notifications temporaires
- Spinner - Indicateurs de chargement
- Skeleton - Loading placeholders

---

## Utilisation dans les Pages

```jsx
// Dans n'importe quelle page Next.js
'use client';

import {
  Button,
  Card,
  CardImage,
  CardContent,
  CardTitle,
  Input,
  Badge,
  BottomNav,
} from '@/components/ui';

export default function ServicesPage() {
  return (
    <div>
      {/* Votre contenu */}
      <BottomNav notifications={{ messages: 5 }} />
    </div>
  );
}
```

---

## Support RTL

Tous les composants supportent le RTL (arabe):
- Padding/margin inversés automatiquement
- Icônes left/right inversées
- Text-align adaptatif
- Border-left/right inversés

---

## Accessibilité

Tous les composants sont accessibles:
- ARIA labels
- Focus states visibles
- Keyboard navigation
- Screen reader friendly
- Touch-friendly (min 44x44px)

---

Créé le: 2025-12-09
Build: Next.js 16.0.7
Dependencies: lucide-react ^0.x
