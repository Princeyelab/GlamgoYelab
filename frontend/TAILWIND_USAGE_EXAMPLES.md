# Exemples d'utilisation Tailwind CSS - GlamGo

Guide pratique pour utiliser le nouveau système Tailwind CSS dans GlamGo.

---

## 1. Utiliser le composant Button

### Import
```jsx
import { Button } from '@/components/ui';
// ou
import { Button } from '@/components/ui/Button';
```

### Exemples basiques
```jsx
// Bouton primary (CTA principal)
<Button variant="primary" size="md">
  Commencer maintenant
</Button>

// Bouton secondary (CTA secondaire)
<Button variant="secondary" size="md">
  En savoir plus
</Button>

// Bouton outline (action tertiaire)
<Button variant="outline" size="md">
  Annuler
</Button>

// Bouton ghost (action discrète)
<Button variant="ghost" size="sm">
  Voir les détails
</Button>
```

### Tailles
```jsx
// Small (40px height)
<Button variant="primary" size="sm">Petit bouton</Button>

// Medium (56px height - recommandé)
<Button variant="primary" size="md">Bouton moyen</Button>

// Large (64px height)
<Button variant="primary" size="lg">Grand bouton</Button>
```

### États
```jsx
// Loading state
<Button variant="primary" loading={isSubmitting}>
  {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
</Button>

// Disabled
<Button variant="primary" disabled>
  Bouton désactivé
</Button>
```

### Classes custom
```jsx
// Ajouter classes Tailwind supplémentaires
<Button
  variant="primary"
  className="w-full mt-4"
>
  Bouton pleine largeur
</Button>
```

---

## 2. Utiliser les couleurs GlamGo

### Background
```jsx
// Primary (rouge)
<div className="bg-primary text-white p-4">
  Fond rouge primaire
</div>

// Secondary (orange)
<div className="bg-secondary text-white p-4">
  Fond orange secondaire
</div>

// Accent (teal)
<div className="bg-accent text-white p-4">
  Fond teal accent
</div>

// Hover variants
<button className="bg-primary hover:bg-primary-hover">
  Bouton avec hover
</button>
```

### Text
```jsx
// Texte coloré
<p className="text-primary">Texte rouge primaire</p>
<p className="text-secondary">Texte orange secondaire</p>
<p className="text-accent">Texte teal accent</p>

// Grays
<p className="text-gray-900">Texte très foncé</p>
<p className="text-gray-700">Texte foncé</p>
<p className="text-gray-500">Texte moyen</p>
<p className="text-gray-300">Texte clair</p>
```

### Border
```jsx
<div className="border-2 border-primary">
  Bordure rouge primaire
</div>
```

---

## 3. Border Radius (App-Like)

### Cards (20px minimum)
```jsx
// Card moderne avec radius 20px
<div className="bg-white rounded-lg p-6 shadow-md">
  <h3 className="font-display text-xl">Titre card</h3>
  <p className="text-gray-700">Contenu de la card...</p>
</div>
```

### Buttons (pill shape)
```jsx
// Bouton pill shape automatique via composant Button
<Button variant="primary">Bouton pill</Button>

// Ou manuellement
<button className="rounded-full px-8 h-14 bg-primary text-white">
  Bouton custom pill
</button>
```

### Autres radius
```jsx
<div className="rounded-sm">Radius 12px</div>
<div className="rounded-md">Radius 16px</div>
<div className="rounded-lg">Radius 20px (cards)</div>
<div className="rounded-xl">Radius 24px</div>
<div className="rounded-full">Radius pill (boutons)</div>
```

---

## 4. Shadows (Material Design 3)

```jsx
// Petit shadow (subtil)
<div className="shadow-sm">Shadow subtil</div>

// Medium shadow (cards default)
<div className="shadow-md">Shadow moyen</div>

// Large shadow (cards hover)
<div className="shadow-lg">Shadow large</div>

// Extra large shadow (modals, overlays)
<div className="shadow-xl">Shadow extra large</div>

// Shadow au hover
<div className="shadow-md hover:shadow-lg transition-shadow">
  Card avec shadow au hover
</div>
```

---

## 5. Typographie

### Fonts
```jsx
// Body text (Inter)
<p className="font-sans">Texte en Inter</p>

// Headings (Poppins)
<h1 className="font-display">Titre en Poppins</h1>

// Poids
<p className="font-normal">Normal (400)</p>
<p className="font-medium">Medium (500)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-bold">Bold (700)</p>
```

### Tailles (responsive)
```jsx
// Headings avec breakpoints
<h1 className="text-4xl md:text-5xl font-display">
  Grand titre responsive
</h1>

<h2 className="text-3xl md:text-4xl font-display">
  Sous-titre responsive
</h2>

// Body text
<p className="text-base">Texte normal 16px</p>
<p className="text-lg">Texte large 18px</p>
<p className="text-sm">Texte petit 14px</p>
```

---

## 6. Animations et transitions

### Hover effects
```jsx
// Translation + shadow
<div className="hover:-translate-y-1 hover:shadow-lg transition-all">
  Card avec hover effect
</div>

// Scale (boutons)
<button className="active:scale-[0.98] transition-transform">
  Bouton avec scale active
</button>

// Opacity
<div className="opacity-0 hover:opacity-100 transition-opacity">
  Apparition au hover
</div>
```

### Loading spinner
```jsx
<svg className="animate-spin h-5 w-5 text-white">
  {/* SVG spinner path */}
</svg>
```

---

## 7. Layout responsive

### Grid
```jsx
// 1 col mobile, 2 cols tablet, 3 cols desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="bg-white rounded-lg p-6">Item 1</div>
  <div className="bg-white rounded-lg p-6">Item 2</div>
  <div className="bg-white rounded-lg p-6">Item 3</div>
</div>
```

### Flex
```jsx
// Header horizontal
<header className="flex items-center justify-between px-6 h-16">
  <div className="font-display text-xl">GlamGo</div>
  <nav className="flex gap-4">
    <a href="/services">Services</a>
    <a href="/orders">Commandes</a>
  </nav>
</header>

// Stack vertical avec gap
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Spacing
```jsx
// Padding
<div className="p-4">Padding 16px</div>
<div className="px-6 py-4">Padding horizontal 24px, vertical 16px</div>

// Margin
<div className="mt-6">Margin top 24px</div>
<div className="mb-4">Margin bottom 16px</div>
<div className="mx-auto">Margin horizontal auto (centrage)</div>
```

---

## 8. Fonction cn() utility

### Import
```jsx
import { cn } from '@/lib/utils';
```

### Usage basique
```jsx
// Classes conditionnelles
<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)}>
  Contenu
</div>
```

### Merge avec props className
```jsx
function MyComponent({ className, ...props }) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg p-4",
        className
      )}
      {...props}
    >
      Contenu
    </div>
  );
}

// Usage
<MyComponent className="mt-6 shadow-lg" />
// Résultat: bg-white rounded-lg p-4 mt-6 shadow-lg
```

### Variants complexes
```jsx
const variants = {
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-white",
  outline: "border-2 border-primary text-primary"
};

function Button({ variant = "primary", className, children }) {
  return (
    <button className={cn(
      "rounded-full px-8 h-14",
      variants[variant],
      className
    )}>
      {children}
    </button>
  );
}
```

---

## 9. Support RTL (Arabe)

### Avec Tailwind rtl: prefix
```jsx
// Margin left en LTR, margin right en RTL
<div className="ml-4 rtl:mr-4 rtl:ml-0">
  Contenu avec spacing RTL-aware
</div>

// Text align
<p className="text-left rtl:text-right">
  Texte aligné selon direction
</p>

// Icons
<div className="flex items-center gap-2 rtl:flex-row-reverse">
  <Icon />
  <span>Texte à droite de l'icône (LTR) ou gauche (RTL)</span>
</div>
```

---

## 10. Classes utilitaires custom (globals.css)

### Classes pré-définies
```jsx
// Boutons pré-stylés
<button className="btn-primary">Bouton primary</button>
<button className="btn-secondary">Bouton secondary</button>
<button className="btn-outline">Bouton outline</button>

// Cards
<div className="card">
  Card avec hover effect
</div>

// Inputs
<input className="input" placeholder="Email..." />
```

---

## Exemples complets

### Card Service
```jsx
<div className="card">
  <img
    src="/service.jpg"
    alt="Service"
    className="w-full h-48 object-cover rounded-t-lg"
  />
  <div className="p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
        Beauté
      </span>
      <span className="text-2xl font-bold text-gray-900">
        150 MAD
      </span>
    </div>
    <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
      Coiffure à domicile
    </h3>
    <p className="text-gray-600 text-sm mb-4">
      Coupe et coiffage professionnels dans le confort de votre domicile.
    </p>
    <div className="flex items-center gap-1 mb-4">
      <span className="text-yellow-400">★★★★★</span>
      <span className="text-sm text-gray-600">(24 avis)</span>
    </div>
    <Button variant="primary" className="w-full">
      Réserver maintenant
    </Button>
  </div>
</div>
```

### Formulaire Login
```jsx
<div className="bg-white rounded-lg p-8 shadow-lg max-w-md mx-auto">
  <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6">
    Connexion
  </h2>
  <form className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email
      </label>
      <input
        type="email"
        className="input"
        placeholder="votre@email.com"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Mot de passe
      </label>
      <input
        type="password"
        className="input"
        placeholder="••••••••"
      />
    </div>
    <Button variant="primary" className="w-full">
      Me connecter
    </Button>
    <button
      type="button"
      className="text-sm text-primary hover:underline w-full text-center"
    >
      Mot de passe oublié ?
    </button>
  </form>
</div>
```

---

## Ressources

### Documentation officielle
- Tailwind CSS: https://tailwindcss.com/docs
- Tailwind UI: https://tailwindui.com/

### Outils
- Tailwind CSS IntelliSense (VS Code extension)
- Tailwind Playground: https://play.tailwindcss.com/

### GlamGo
- Migration guide: `TAILWIND_MIGRATION.md`
- Rapport audit: `design/audit/rapport-audit-complet.md`
- Design System: `tailwind.config.js`
