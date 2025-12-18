# DONNEES SERVICES GLAMGO

## Source
Donnees extraites de l'app web GlamGo production.
Date extraction : 18 Decembre 2025

## Structure

### Categories (5)
| ID | Nom | Services | Icone | Couleur |
|----|-----|----------|-------|---------|
| 1 | Maison | 6 | home | #3B82F6 |
| 2 | Beaute | 11 | beauty | #E63946 |
| 3 | Voiture | 3 | car | #6B7280 |
| 4 | Bien-etre | 6 | wellness | #2A9D8F |
| 5 | Animaux | 2 | pet | #F59E0B |

### Services (28)
Tous les services avec :
- ID, titre, slug, description
- Prix en MAD, duree en minutes
- Images depuis API : https://glamgo-api.fly.dev/images/services/
- Relations : category, provider
- Metriques : rating, reviews_count

## Photos
Photos locales : `C:/Users/mbi/OneDrive/Bureau/YelabGo/photo-categorie/`
Photos API : `https://glamgo-api.fly.dev/images/services/[filename]`

Mapping 100% : 24/24 services ont leur photo

## Usage

```typescript
import { SERVICES, POPULAR_SERVICES, getServicesByCategory, getServiceById } from './services';
import { CATEGORIES, getCategoryById } from './categories';

// Tous les services
const allServices = SERVICES;

// 6 services populaires
const popular = POPULAR_SERVICES;

// Services par categorie
const beautyServices = getServicesByCategory(2);

// Service par ID
const service = getServiceById(1);

// Categorie par ID
const category = getCategoryById(2);
```

## Format Service

```typescript
interface Service {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string; // 'MAD'
  duration_minutes: number;
  images: string[];
  rating: number;
  reviews_count: number;
  category_id: number;
  category: { id: number; name: string; color: string };
  provider: { id: number; name: string };
  status: 'active' | 'inactive' | 'draft';
  is_featured?: boolean;
  isNew?: boolean;
}
```

## Format Categorie

```typescript
interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  services_count: number;
  image: string;
  display_order: number;
  is_active: boolean;
}
```

## Synchronisation
Pour mettre a jour :
1. Exporter depuis DB production
2. Mapper nouvelles photos
3. Regenerer services.ts et categories.ts
4. Tester dans app

## Important
NE PAS modifier manuellement sans synchroniser avec DB !
