# Schéma de Base de Données - Marrakech Services

## 📊 Diagramme Entités-Relations

```
┌─────────────────────┐
│      USERS          │
├─────────────────────┤
│ • id (PK)          │
│ • email (UNIQUE)    │
│ • password_hash     │
│ • first_name        │
│ • last_name         │
│ • phone             │
│ • profile_picture   │
│ • referral_code     │
│ • created_at        │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐        ┌─────────────────────┐
│    ADDRESSES        │        │     ORDERS          │
├─────────────────────┤        ├─────────────────────┤
│ • id (PK)          │◄───────│ • id (PK)          │
│ • user_id (FK)     │   N:1  │ • user_id (FK)     │
│ • full_address     │        │ • provider_id (FK)  │
│ • lat, lon         │        │ • service_id (FK)   │
│ • is_default       │        │ • address_id (FK)   │
└─────────────────────┘        │ • status            │
                               │ • order_time        │
                               │ • scheduled_time    │
         ┌─────────────────────│ • final_price       │
         │                     │ • tip_amount        │
         │                     └─────────────────────┘
         │                              │
         │                              │ 1:1
         │                              ▼
         │                     ┌─────────────────────┐
         │                     │     REVIEWS         │
         │                     ├─────────────────────┤
         │                     │ • id (PK)          │
         │                     │ • order_id (FK)    │
         │                     │ • user_id (FK)     │
         │                     │ • provider_id (FK) │
         │                     │ • rating (1-5)     │
         │                     │ • comment          │
         │                     └─────────────────────┘
         │                              │
         │                              │
         ▼                              ▼
┌─────────────────────┐        ┌─────────────────────┐
│    PROVIDERS        │────────│  PROVIDER_SERVICES  │
├─────────────────────┤   1:N  ├─────────────────────┤
│ • id (PK)          │        │ • id (PK)          │
│ • email (UNIQUE)    │        │ • provider_id (FK) │
│ • password_hash     │        │ • service_id (FK)  │
│ • first_name        │        └─────────────────────┘
│ • last_name         │                 │
│ • phone             │                 │ N:1
│ • status            │                 ▼
│ • current_lat/lon   │        ┌─────────────────────┐
│ • rating            │        │     SERVICES        │
│ • is_verified       │        ├─────────────────────┤
└─────────────────────┘        │ • id (PK)          │
                               │ • category_id (FK)  │
                               │ • name              │
                               │ • description       │
                               │ • duration_minutes  │
                               │ • price             │
                               │ • image_url         │
                               └─────────────────────┘
                                        │
                                        │ N:1
                                        ▼
                               ┌─────────────────────┐
                               │    CATEGORIES       │
                               ├─────────────────────┤
                               │ • id (PK)          │
                               │ • name              │
                               │ • description       │
                               │ • image_url         │
                               │ • display_order     │
                               └─────────────────────┘
```

## 🔗 Relations Détaillées

### 1. Users ↔ Addresses (1:N)
```
Un utilisateur peut avoir plusieurs adresses
Une adresse appartient à un seul utilisateur
```

### 2. Users ↔ Orders (1:N)
```
Un utilisateur peut passer plusieurs commandes
Une commande est passée par un seul utilisateur
```

### 3. Providers ↔ Orders (1:N)
```
Un prestataire peut accepter plusieurs commandes
Une commande est acceptée par un seul prestataire (ou aucun si pending)
```

### 4. Services ↔ Orders (1:N)
```
Un service peut être commandé plusieurs fois
Une commande concerne un seul service
```

### 5. Addresses ↔ Orders (1:N)
```
Une adresse peut être utilisée pour plusieurs commandes
Une commande utilise une seule adresse
```

### 6. Orders ↔ Reviews (1:1)
```
Une commande peut avoir une seule évaluation
Une évaluation concerne une seule commande
```

### 7. Providers ↔ Services (N:N via provider_services)
```
Un prestataire peut proposer plusieurs services
Un service peut être proposé par plusieurs prestataires
Table pivot : provider_services
```

### 8. Categories ↔ Services (1:N)
```
Une catégorie contient plusieurs services
Un service appartient à une seule catégorie
```

## 📋 Détail des Tables

### Table: users
| Colonne               | Type          | Contraintes           |
|-----------------------|---------------|-----------------------|
| id                    | INT           | PK, AUTO_INCREMENT    |
| email                 | VARCHAR(255)  | UNIQUE, NOT NULL      |
| password_hash         | VARCHAR(255)  | NOT NULL              |
| first_name            | VARCHAR(100)  | NOT NULL              |
| last_name             | VARCHAR(100)  | NOT NULL              |
| phone                 | VARCHAR(20)   |                       |
| profile_picture_url   | VARCHAR(500)  |                       |
| referral_code         | VARCHAR(10)   | UNIQUE, NOT NULL      |
| created_at            | TIMESTAMP     | DEFAULT CURRENT_TS    |
| updated_at            | TIMESTAMP     | ON UPDATE CURRENT_TS  |

**Index:** email, referral_code

---

### Table: providers
| Colonne               | Type          | Contraintes           |
|-----------------------|---------------|-----------------------|
| id                    | INT           | PK, AUTO_INCREMENT    |
| email                 | VARCHAR(255)  | UNIQUE, NOT NULL      |
| password_hash         | VARCHAR(255)  | NOT NULL              |
| first_name            | VARCHAR(100)  | NOT NULL              |
| last_name             | VARCHAR(100)  | NOT NULL              |
| phone                 | VARCHAR(20)   | NOT NULL              |
| profile_picture_url   | VARCHAR(500)  |                       |
| status                | ENUM          | online/offline/busy   |
| current_lat           | DECIMAL(10,8) |                       |
| current_lon           | DECIMAL(11,8) |                       |
| rating                | DECIMAL(3,2)  | DEFAULT 0.00          |
| total_reviews         | INT           | DEFAULT 0             |
| is_verified           | BOOLEAN       | DEFAULT FALSE         |
| created_at            | TIMESTAMP     | DEFAULT CURRENT_TS    |
| updated_at            | TIMESTAMP     | ON UPDATE CURRENT_TS  |

**Index:** email, status, location (lat,lon), rating, status_location (composite)

---

### Table: addresses
| Colonne               | Type          | Contraintes           |
|-----------------------|---------------|-----------------------|
| id                    | INT           | PK, AUTO_INCREMENT    |
| user_id               | INT           | FK → users, NOT NULL  |
| full_address          | TEXT          | NOT NULL              |
| lat                   | DECIMAL(10,8) | NOT NULL              |
| lon                   | DECIMAL(11,8) | NOT NULL              |
| is_default            | BOOLEAN       | DEFAULT FALSE         |
| created_at            | TIMESTAMP     | DEFAULT CURRENT_TS    |
| updated_at            | TIMESTAMP     | ON UPDATE CURRENT_TS  |

**Index:** user_id, (user_id, is_default)

**FK:** user_id → users(id) ON DELETE CASCADE

---

### Table: categories
| Colonne               | Type          | Contraintes           |
|-----------------------|---------------|-----------------------|
| id                    | INT           | PK, AUTO_INCREMENT    |
| name                  | VARCHAR(100)  | NOT NULL              |
| description           | TEXT          |                       |
| image_url             | VARCHAR(500)  |                       |
| display_order         | INT           | DEFAULT 0             |
| is_active             | BOOLEAN       | DEFAULT TRUE          |
| created_at            | TIMESTAMP     | DEFAULT CURRENT_TS    |
| updated_at            | TIMESTAMP     | ON UPDATE CURRENT_TS  |

**Index:** display_order, is_active

---

### Table: services
| Colonne               | Type          | Contraintes           |
|-----------------------|---------------|-----------------------|
| id                    | INT           | PK, AUTO_INCREMENT    |
| category_id           | INT           | FK → categories       |
| name                  | VARCHAR(255)  | NOT NULL              |
| description           | TEXT          |                       |
| duration_minutes      | INT           | NOT NULL              |
| price                 | DECIMAL(10,2) | NOT NULL              |
| image_url             | VARCHAR(500)  |                       |
| is_active             | BOOLEAN       | DEFAULT TRUE          |
| created_at            | TIMESTAMP     | DEFAULT CURRENT_TS    |
| updated_at            | TIMESTAMP     | ON UPDATE CURRENT_TS  |

**Index:** category_id, is_active, price

**FK:** category_id → categories(id) ON DELETE CASCADE

---

### Table: provider_services (PIVOT)
| Colonne               | Type          | Contraintes           |
|-----------------------|---------------|-----------------------|
| id                    | INT           | PK, AUTO_INCREMENT    |
| provider_id           | INT           | FK → providers        |
| service_id            | INT           | FK → services         |
| created_at            | TIMESTAMP     | DEFAULT CURRENT_TS    |

**Index:** provider_id, service_id

**Unique:** (provider_id, service_id)

**FK:**
- provider_id → providers(id) ON DELETE CASCADE
- service_id → services(id) ON DELETE CASCADE

---

### Table: orders
| Colonne               | Type          | Contraintes           |
|-----------------------|---------------|-----------------------|
| id                    | INT           | PK, AUTO_INCREMENT    |
| user_id               | INT           | FK → users            |
| provider_id           | INT           | FK → providers (NULL) |
| service_id            | INT           | FK → services         |
| address_id            | INT           | FK → addresses        |
| status                | ENUM          | 6 valeurs (voir ci-dessous) |
| order_time            | DATETIME      | NOT NULL              |
| scheduled_time        | DATETIME      | NULL (= maintenant)   |
| final_price           | DECIMAL(10,2) | NOT NULL              |
| tip_amount            | DECIMAL(10,2) | DEFAULT 0.00          |
| cancellation_reason   | TEXT          |                       |
| created_at            | TIMESTAMP     | DEFAULT CURRENT_TS    |
| updated_at            | TIMESTAMP     | ON UPDATE CURRENT_TS  |

**Status ENUM:**
- pending
- accepted
- en_route
- in_progress
- completed
- cancelled

**Index:** user_id, provider_id, service_id, status, order_time, scheduled_time, (provider_id, status), (user_id, status)

**FK:**
- user_id → users(id) ON DELETE CASCADE
- provider_id → providers(id) ON DELETE SET NULL
- service_id → services(id) ON DELETE RESTRICT
- address_id → addresses(id) ON DELETE RESTRICT

---

### Table: reviews
| Colonne               | Type          | Contraintes           |
|-----------------------|---------------|-----------------------|
| id                    | INT           | PK, AUTO_INCREMENT    |
| order_id              | INT           | FK → orders, UNIQUE   |
| user_id               | INT           | FK → users            |
| provider_id           | INT           | FK → providers        |
| rating                | INT           | NOT NULL, CHECK 1-5   |
| comment               | TEXT          |                       |
| created_at            | TIMESTAMP     | DEFAULT CURRENT_TS    |
| updated_at            | TIMESTAMP     | ON UPDATE CURRENT_TS  |

**Index:** provider_id, rating, created_at

**Unique:** order_id

**FK:**
- order_id → orders(id) ON DELETE CASCADE
- user_id → users(id) ON DELETE CASCADE
- provider_id → providers(id) ON DELETE CASCADE

---

## 🎯 Flux de Données Typique

### 1. Création de Commande
```
User sélectionne un Service
  ↓
System trouve Providers disponibles (via provider_services)
  ↓
User choisit une Address et crée Order (status: pending)
  ↓
Provider accepte Order (status: accepted, provider_id assigné)
  ↓
Provider se déplace (status: en_route)
  ↓
Provider commence (status: in_progress)
  ↓
Provider termine (status: completed)
  ↓
User crée Review (rating + comment + tip)
```

### 2. Recherche de Prestataires
```
User choisit Category
  ↓
System affiche Services de cette Category
  ↓
User sélectionne Service
  ↓
System trouve Providers:
  - via provider_services WHERE service_id = X
  - avec status = 'online'
  - avec is_verified = TRUE
  - triés par rating DESC ou distance ASC
```

## 📈 Volumétrie Estimée

| Table             | Croissance       | Retention    |
|-------------------|------------------|--------------|
| users             | +100/jour        | Permanente   |
| providers         | +10/jour         | Permanente   |
| categories        | Statique (~20)   | Permanente   |
| services          | +5/mois          | Permanente   |
| provider_services | +50/jour         | Permanente   |
| addresses         | +200/jour        | Permanente   |
| orders            | +500/jour        | Permanente   |
| reviews           | +300/jour        | Permanente   |

**Total estimé après 1 an :**
- Users: ~36,000
- Orders: ~180,000
- Reviews: ~110,000

## 🔐 Sécurité

### Données Sensibles
- `password_hash` : Hashé avec bcrypt (cost 12)
- `email` : Index pour recherche rapide
- `current_lat/lon` : Precision limitée à 8/11 décimales

### Contraintes de Suppression
- Users supprimés → Addresses et Orders supprimées (CASCADE)
- Providers supprimés → provider_id dans Orders devient NULL (SET NULL)
- Services supprimés → Bloqué si Orders existent (RESTRICT)

---

**Document créé le** : 2025-01-13
**Version de la base** : 1.0
**Moteur** : InnoDB
**Encodage** : utf8mb4_unicode_ci
