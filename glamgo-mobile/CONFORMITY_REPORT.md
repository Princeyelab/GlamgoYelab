# 📋 RAPPORT DE CONFORMITÉ - GlamGo Mobile vs Backend/Web

> **Date de génération**: 17 Décembre 2025
> **Analysé par**: Claude Code Assistant
> **Version Mobile**: Expo SDK 54 / React Native

---

## 📊 RÉSUMÉ EXÉCUTIF

| Entité | Conformité | Statut | Actions Requises |
|--------|------------|--------|------------------|
| **Service** | ⚠️ Partielle | 60% | 8 corrections |
| **Category** | ⚠️ Partielle | 50% | 6 corrections |
| **Provider** | ✅ Bonne | 85% | 3 corrections |
| **Booking/Order** | ❌ Critique | 40% | 12 corrections |
| **Review** | ⚠️ Partielle | 65% | 5 corrections |

**Score Global de Conformité: 60%**

---

## 🗄️ SCHÉMA BASE DE DONNÉES (Référence)

### Table `services`
```sql
id INT AUTO_INCREMENT PRIMARY KEY
category_id INT NOT NULL
name VARCHAR(255) NOT NULL
slug VARCHAR(255) UNIQUE NOT NULL
description TEXT
image VARCHAR(255)
price DECIMAL(10, 2) NOT NULL
duration_minutes INT NOT NULL
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Table `categories`
```sql
id INT AUTO_INCREMENT PRIMARY KEY
name VARCHAR(100) NOT NULL
slug VARCHAR(100) UNIQUE NOT NULL
description TEXT
icon VARCHAR(255)
parent_id INT NULL (sous-catégories)
is_active BOOLEAN DEFAULT TRUE
display_order INT DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Table `providers`
```sql
id INT AUTO_INCREMENT PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
password VARCHAR(255) NOT NULL
first_name VARCHAR(100) NOT NULL
last_name VARCHAR(100) NOT NULL
phone VARCHAR(20) NOT NULL
avatar VARCHAR(255)
is_verified BOOLEAN DEFAULT FALSE
is_available BOOLEAN DEFAULT TRUE
current_latitude DECIMAL(10, 8)
current_longitude DECIMAL(11, 8)
rating DECIMAL(3, 2) DEFAULT 0.00
total_reviews INT DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Table `orders`
```sql
id INT AUTO_INCREMENT PRIMARY KEY
user_id INT NOT NULL
provider_id INT NULL
service_id INT NOT NULL
address_id INT NOT NULL
status ENUM('pending', 'accepted', 'on_way', 'in_progress', 'completed', 'cancelled')
scheduled_at DATETIME NULL
accepted_at DATETIME NULL
started_at DATETIME NULL
completed_at DATETIME NULL
price DECIMAL(10, 2) NOT NULL
tip DECIMAL(10, 2) DEFAULT 0.00
total DECIMAL(10, 2) NOT NULL
payment_status ENUM('pending', 'paid', 'refunded')
payment_method VARCHAR(50) NULL
notes TEXT NULL
cancellation_reason TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Table `reviews`
```sql
id INT AUTO_INCREMENT PRIMARY KEY
order_id INT NOT NULL
user_id INT NOT NULL
provider_id INT NOT NULL
rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5)
comment TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## 🔍 ANALYSE DÉTAILLÉE PAR ENTITÉ

---

## 1️⃣ SERVICE

### Type Mobile Actuel (`src/types/service.ts`)
```typescript
export interface Service {
  id: string;                    // ❌ Devrait être number
  name: string;                  // ✅ OK
  description: string;           // ✅ OK
  category: ServiceCategory;     // ⚠️ Devrait être category_id
  price: number;                 // ✅ OK
  currency?: string;             // ⚠️ Non présent en DB
  image: string;                 // ✅ OK
  rating: number;                // ⚠️ Champ calculé (pas en DB)
  reviewsCount: number;          // ⚠️ Champ calculé (pas en DB)
  provider: ServiceProvider;     // ❌ N'existe pas en DB
  isNew?: boolean;               // ❌ N'existe pas en DB
  isFavorite?: boolean;          // ⚠️ Feature client-side
  createdAt?: string;            // ✅ OK
}
```

### Différences Identifiées

| Champ Mobile | Champ DB | Statut | Action |
|--------------|----------|--------|--------|
| `id: string` | `id: INT` | ❌ | Changer en `number \| string` |
| `category: object` | `category_id: INT` | ⚠️ | Ajouter `category_id: number` |
| `slug` | `slug: VARCHAR` | ❌ MANQUANT | Ajouter `slug: string` |
| `duration_minutes` | `duration_minutes: INT` | ❌ MANQUANT | Ajouter `duration_minutes: number` |
| `is_active` | `is_active: BOOLEAN` | ❌ MANQUANT | Ajouter `isActive?: boolean` |
| `provider` | N/A | ❌ INVALIDE | Supprimer (pas de relation directe) |
| `isNew` | N/A | ❌ INVALIDE | Calculer côté client |
| `rating` | N/A | ⚠️ | Marquer comme calculé |
| `reviewsCount` | N/A | ⚠️ | Marquer comme calculé |

### Type Corrigé Proposé
```typescript
export interface Service {
  // Champs DB
  id: number | string;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  image?: string;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;

  // Champs calculés par API
  category?: ServiceCategory;
  category_name?: string;
  average_rating?: number;
  total_reviews?: number;

  // Champs UI (client-side)
  isFavorite?: boolean;
  currency?: string;
}
```

---

## 2️⃣ CATEGORY

### Type Mobile Actuel (`src/types/service.ts`)
```typescript
export interface Category {
  id: string;                    // ❌ Devrait être number
  name: string;                  // ✅ OK
  icon?: string;                 // ✅ OK
  color?: string;                // ⚠️ Non présent en DB
  servicesCount?: number;        // ⚠️ Champ calculé
  image?: string;                // ⚠️ DB a seulement icon
}
```

### Différences Identifiées

| Champ Mobile | Champ DB | Statut | Action |
|--------------|----------|--------|--------|
| `id: string` | `id: INT` | ❌ | Changer en `number \| string` |
| `slug` | `slug: VARCHAR` | ❌ MANQUANT | Ajouter |
| `description` | `description: TEXT` | ❌ MANQUANT | Ajouter |
| `parent_id` | `parent_id: INT` | ❌ MANQUANT | Ajouter |
| `is_active` | `is_active: BOOLEAN` | ❌ MANQUANT | Ajouter |
| `display_order` | `display_order: INT` | ❌ MANQUANT | Ajouter |
| `color` | N/A | ⚠️ | Feature UI (OK) |
| `image` | N/A | ⚠️ | Utiliser icon à la place |

### Type Corrigé Proposé
```typescript
export interface Category {
  // Champs DB
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: number | null;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;

  // Champs calculés
  services_count?: number;

  // Champs UI
  color?: string;
  image?: string;
}
```

---

## 3️⃣ PROVIDER

### Type Mobile Actuel (`src/types/provider.ts`)
Le type Provider est **bien structuré** avec de nombreux alias pour la compatibilité.

### Points Positifs ✅
- Gestion multiple des photos (`avatar`, `profile_photo`, `photo_url`)
- Support des champs de distance calculés
- Support du price_breakdown
- Alias pour `is_verified` / `isVerified`

### Différences Mineures

| Champ Mobile | Champ DB | Statut |
|--------------|----------|--------|
| `email` | `email: VARCHAR` | ❌ MANQUANT |
| `phone` | `phone: VARCHAR` | ❌ MANQUANT |
| `business_name` | N/A | ⚠️ À ajouter en DB? |

### Type - Ajouts Recommandés
```typescript
// Ajouter dans Provider interface
email?: string;          // Pour profil
phone?: string;          // Pour contact
created_at?: string;
updated_at?: string;
```

---

## 4️⃣ BOOKING/ORDER ⚠️ CRITIQUE

### Type Mobile Actuel (`src/types/booking.ts`)
```typescript
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  service: { id: string; name: string; image: string; };
  provider: { id: string; name: string; avatar?: string; };
  date: string;              // "2024-12-18"
  time: string;              // "14:30"
  status: BookingStatus;
  price: number;
  currency?: string;
  address: string;
  notes?: string;
  createdAt?: string;
}
```

### ❌ PROBLÈMES CRITIQUES

#### 1. Statuts Manquants
```
Mobile: 'pending' | 'confirmed' | 'cancelled' | 'completed'
DB:     'pending' | 'accepted' | 'on_way' | 'in_progress' | 'completed' | 'cancelled'

MANQUANTS: 'accepted', 'on_way', 'in_progress'
'confirmed' devrait être 'accepted'
```

#### 2. Champs Manquants

| Champ DB | Importance | Description |
|----------|------------|-------------|
| `user_id` | 🔴 Haute | ID utilisateur |
| `service_id` | 🔴 Haute | ID service (pas objet) |
| `provider_id` | 🔴 Haute | ID provider (pas objet) |
| `address_id` | 🔴 Haute | ID adresse (pas string) |
| `scheduled_at` | 🔴 Haute | DateTime unique (pas date+time) |
| `accepted_at` | 🟡 Moyenne | Timestamp acceptation |
| `started_at` | 🟡 Moyenne | Timestamp début |
| `completed_at` | 🟡 Moyenne | Timestamp fin |
| `tip` | 🟡 Moyenne | Pourboire |
| `total` | 🔴 Haute | Prix total |
| `payment_status` | 🔴 Haute | Statut paiement |
| `payment_method` | 🟡 Moyenne | Méthode paiement |
| `cancellation_reason` | 🟡 Moyenne | Raison annulation |

### Type Corrigé Proposé
```typescript
export type OrderStatus =
  | 'pending'      // En attente de provider
  | 'accepted'     // Provider a accepté
  | 'on_way'       // Provider en route
  | 'in_progress'  // Service en cours
  | 'completed'    // Terminé
  | 'cancelled';   // Annulé

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Order {
  // Champs DB principaux
  id: number | string;
  user_id: number;
  provider_id?: number | null;
  service_id: number;
  address_id: number;

  // Statuts
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;

  // Dates
  scheduled_at?: string;    // ISO DateTime
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;

  // Prix
  price: number;
  tip?: number;
  total: number;
  currency?: string;

  // Autres
  notes?: string;
  cancellation_reason?: string;

  // Objets enrichis (pour affichage)
  service?: {
    id: number | string;
    name: string;
    image?: string;
  };
  provider?: {
    id: number | string;
    name: string;
    avatar?: string;
  };
  address?: {
    id: number;
    label: string;
    address_line: string;
    city: string;
  };
}

// Alias pour compatibilité
export type Booking = Order;
export type BookingStatus = OrderStatus;
```

---

## 5️⃣ REVIEW

### Type Mobile Actuel (`src/types/review.ts`)
```typescript
export interface Review {
  id: string;
  user: { id: string; name: string; avatar?: string; };
  service?: { id: string; name: string; };
  rating: number;
  comment: string;
  date: string;
  isVerified?: boolean;
  helpfulCount?: number;
  providerResponse?: { text: string; date: string; };
}
```

### Différences Identifiées

| Champ Mobile | Champ DB | Statut |
|--------------|----------|--------|
| `order_id` | `order_id: INT` | ❌ MANQUANT |
| `provider_id` | `provider_id: INT` | ❌ MANQUANT |
| `user_id` | `user_id: INT` | ⚠️ Présent dans user.id |
| `date` | `created_at` | ⚠️ Renommer |
| `isVerified` | N/A | ⚠️ Feature UI |
| `helpfulCount` | N/A | ⚠️ À ajouter en DB? |
| `providerResponse` | N/A | ⚠️ À ajouter en DB? |
| `service` | N/A | ⚠️ Via order_id |

### Notes Web (ReviewModal.js)
Le web envoie aussi:
- `service_quality` (1-5)
- `punctuality` (1-5)
- `professionalism` (1-5)

Ces champs ne sont **pas dans le schéma DB actuel** mais sont utilisés.

### Type Corrigé Proposé
```typescript
export interface Review {
  // Champs DB
  id: number | string;
  order_id: number;
  user_id: number;
  provider_id: number;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
  updated_at?: string;

  // Champs détaillés (si supportés)
  service_quality?: number;
  punctuality?: number;
  professionalism?: number;

  // Objets enrichis
  user?: {
    id: number | string;
    name: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  };
  service?: {
    id: number | string;
    name: string;
  };

  // Champs API
  provider_response?: string;
  provider_response_date?: string;

  // Champs UI
  is_verified?: boolean;
  helpful_count?: number;
}
```

---

## 📋 PLAN D'ACTION PRIORITAIRE

### 🔴 Priorité HAUTE (Bloquant)

#### 1. Corriger BookingStatus
```typescript
// src/types/booking.ts - Ligne 3
// AVANT:
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// APRÈS:
export type OrderStatus = 'pending' | 'accepted' | 'on_way' | 'in_progress' | 'completed' | 'cancelled';
```

#### 2. Ajouter champs manquants Order
- `user_id`, `provider_id`, `service_id`, `address_id`
- `scheduled_at` (remplacer date+time)
- `payment_status`, `total`

#### 3. Ajouter slug aux Services/Categories

### 🟡 Priorité MOYENNE

#### 4. Normaliser les ID types
Utiliser `number | string` partout pour compatibilité

#### 5. Ajouter duration_minutes à Service

#### 6. Ajouter order_id et provider_id à Review

### 🟢 Priorité BASSE

#### 7. Ajouter parent_id à Category (sous-catégories)

#### 8. Ajouter display_order à Category

#### 9. Uniformiser nommage (snake_case vs camelCase)

---

## 🔗 MAPPING API ENDPOINTS

| Endpoint Web | Mobile Equivalent | Status |
|--------------|-------------------|--------|
| `GET /api/services` | `GET /api/services` | ✅ |
| `GET /api/categories` | `GET /api/categories` | ✅ |
| `GET /api/providers/{id}` | À implémenter | ⚠️ |
| `GET /api/providers/{id}/reviews` | À implémenter | ⚠️ |
| `POST /api/orders` | À implémenter | ⚠️ |
| `GET /api/orders/{id}` | À implémenter | ⚠️ |
| `PUT /api/orders/{id}/status` | À implémenter | ⚠️ |
| `POST /api/orders/{id}/review` | À implémenter | ⚠️ |
| `GET /api/nearby-providers` | À implémenter | ⚠️ |

---

## 📁 FICHIERS À MODIFIER

| Fichier | Modifications |
|---------|---------------|
| `src/types/service.ts` | Ajouter slug, duration_minutes, category_id |
| `src/types/booking.ts` | Refactoring complet (renommer Order) |
| `src/types/review.ts` | Ajouter order_id, provider_id |
| `src/types/provider.ts` | Ajouter email, phone (optionnel) |
| `src/types/index.ts` | Créer fichier d'export centralisé |

---

## ✅ CHECKLIST DE CONFORMITÉ

- [ ] BookingStatus aligné avec OrderStatus DB
- [ ] Service a slug et duration_minutes
- [ ] Category a slug, parent_id, display_order
- [ ] Review a order_id et provider_id
- [ ] Tous les ID supportent number | string
- [ ] PaymentStatus type créé
- [ ] Timestamps uniformisés (created_at, updated_at)
- [ ] Tests de mapping API fonctionnels

---

## 📝 NOTES IMPORTANTES

### Bidding System
Le backend supporte un **système d'enchères (InDrive-style)** avec:
- `bids` table
- Statuts: 'pending', 'accepted', 'rejected', 'expired', 'withdrawn'
- Prix suggéré vs prix final

**Action**: Créer `src/types/bid.ts` si le mobile doit supporter les enchères.

### Formula Pricing
Le backend a un système de **formules de prix**:
- Standard, Premium, Express
- Multiplicateurs différents
- Distance fees

**Action**: Créer `src/types/pricing.ts` pour les calculs de prix.

### Provider Priority
Système de priorité prestataire:
- Badges (gold, silver, bronze, new)
- Score calculé

**Action**: Le type Provider mobile le supporte déjà ✅

---

**Généré le**: 17 Décembre 2025
**Pour**: GlamGo Mobile App - Équipe de développement
