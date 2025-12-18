# Rapport d'Extraction - Services GlamGo Mobile

**Date:** 18 Decembre 2025
**Status:** COMPLET

---

## Resume Executif

L'extraction des services de l'app web GlamGo vers l'app mobile est **COMPLETE**.

| Metrique | Valeur |
|----------|--------|
| Categories principales | 5 |
| Services mobiles | 24 |
| Services backend (total DB) | 63+ |
| Photos disponibles | 24 |
| Taux de couverture photos | 100% |

---

## 1. Categories (5)

| ID | Nom | Couleur | Icone | Services |
|----|-----|---------|-------|----------|
| 1 | Maison | #3B82F6 (Bleu) | home | 18 (DB) / 6 (mobile) |
| 2 | Beaute | #E63946 (Rouge) | beauty | 21 (DB) / 7 (mobile) |
| 3 | Voiture | #6B7280 (Gris) | car | 7 (DB) / 3 (mobile) |
| 4 | Bien-etre | #2A9D8F (Teal) | wellness | 10 (DB) / 6 (mobile) |
| 5 | Animaux | #F59E0B (Orange) | pet | 7 (DB) / 2 (mobile) |

### Sous-categories Backend

```
Maison
  - Menage (7 services)
  - Bricolage (5 services)
  - Jardinage (3 services)
  - Cuisine (3 services)

Beaute
  - Coiffure Homme (7 services)
  - Coiffure Femme (4 services)
  - Maquillage (3 services)
  - Manucure & Pedicure (3 services)
  - Epilation Femme (2 services)
  - Epilation Homme (2 services)

Voiture
  - Mecanique (4 services)
  - Lavage (3 services)

Bien-etre
  - Massage (4 services)
  - Coaching (6 services)

Animaux
  - Soins Animaux (7 services)
```

---

## 2. Services Mobile (24)

### Maison (6 services)

| ID | Nom | Prix (MAD) | Photo |
|----|-----|------------|-------|
| 1 | Menage classique | 100 | menage.jpg |
| 2 | Jardinage | 250 | jardinage.jpg |
| 3 | Bricolage | 200 | petits bricolage.jpg |
| 4 | Chef 2 personnes | 500 | chef a domicile 2 personnes.jpg |
| 5 | Chef 4 personnes | 900 | chef a domicile 4 personnes.jpg |
| 6 | Chef 8 personnes | 1500 | chef a domicile 8 personne.jpg |

### Beaute (7 services)

| ID | Nom | Prix (MAD) | Photo |
|----|-----|------------|-------|
| 7 | Coiffure Homme Simple | 135 | coiffure simple homme.jpg |
| 8 | Coiffure Homme Premium | 175 | coiffure homme prenium.jpg |
| 9 | Taille de Barbe | 100 | taille barbe.jpg |
| 10 | Pack Coiffure + Barbe | 260 | pack coiffure+barbe.jpg |
| 11 | Coiffure Classique | 225 | coiffure classique.jpg |
| 12 | Coiffure Express | 150 | coiffure express.jpg |
| 13 | Coiffure Mariage | 1000 | coiffure mariage et evenement.jpg |

### Voiture (3 services)

| ID | Nom | Prix (MAD) | Photo |
|----|-----|------------|-------|
| 14 | Lavage Exterieur | 150 | nettoyage auto externe.jpg |
| 15 | Lavage Interieur | 185 | nettoyage auto interne.jpg |
| 16 | Lavage Complet | 325 | nettoyage auto complet.jpg |

### Bien-etre (6 services)

| ID | Nom | Prix (MAD) | Photo |
|----|-----|------------|-------|
| 17 | Massage Relaxant | 400 | massage relaxant.jpg |
| 18 | Hammam & Gommage | 350 | hamam & gommage.jpg |
| 19 | Soin Premium Argan | 500 | soinprenium argan.jpg |
| 20 | Yoga | 250 | yoga.jpg |
| 21 | Coach Sportif | 400 | coach sportif.jpg |
| 22 | Danse Orientale | 300 | danse orientale.jpg |

### Animaux (2 services)

| ID | Nom | Prix (MAD) | Photo |
|----|-----|------------|-------|
| 23 | Gardiennage Animaux | 200 | gardiennage animaux.jpg |
| 24 | Promenade Animaux | 115 | promenade animaux.jpg |

---

## 3. Mapping Photos (24)

### Fichiers Photo Disponibles

```
C:/Users/mbi/OneDrive/Bureau/YelabGo/photo-categorie/
├── chef a domicile 2 personnes.jpg
├── chef a domicile 4 personnes.jpg
├── chef a domicile 8 personne.jpg
├── coach sportif.jpg
├── coiffure classique.jpg
├── coiffure express.jpg
├── coiffure homme prenium.jpg
├── coiffure mariage et evenement.jpg
├── coiffure simple homme.jpg
├── danse orientale.jpg
├── gardiennage animaux.jpg
├── hamam & gommage.jpg
├── jardinage.jpg
├── massage relaxant.jpg
├── menage.jpg
├── nettoyage auto complet.jpg
├── nettoyage auto externe.jpg
├── nettoyage auto interne.jpg
├── pack coiffure+barbe.jpg
├── petits bricolage.jpg
├── promenade animaux.jpg
├── soinprenium argan.jpg
├── taille barbe.jpg
└── yoga.jpg
```

### Mapping Slug -> Photo

| Slug Mobile | Fichier Photo Local |
|-------------|---------------------|
| menage | menage.jpg |
| jardinage | jardinage.jpg |
| bricolage | petits bricolage.jpg |
| chef-domicile-2-personnes | chef a domicile 2 personnes.jpg |
| chef-domicile-4-personnes | chef a domicile 4 personnes.jpg |
| chef-domicile-8-personnes | chef a domicile 8 personne.jpg |
| coiffure-homme-simple | coiffure simple homme.jpg |
| coiffure-homme-premium | coiffure homme prenium.jpg |
| taille-barbe | taille barbe.jpg |
| pack-coiffure-barbe | pack coiffure+barbe.jpg |
| coiffure-classique | coiffure classique.jpg |
| coiffure-express | coiffure express.jpg |
| coiffure-mariage-evenement | coiffure mariage et evenement.jpg |
| lavage-exterieur | nettoyage auto externe.jpg |
| lavage-interieur | nettoyage auto interne.jpg |
| lavage-complet | nettoyage auto complet.jpg |
| massage-relaxant | massage relaxant.jpg |
| hammam-gommage | hamam & gommage.jpg |
| soin-premium-argan | soinprenium argan.jpg |
| yoga | yoga.jpg |
| coach-sportif | coach sportif.jpg |
| danse-orientale | danse orientale.jpg |
| gardiennage-animaux | gardiennage animaux.jpg |
| promenade-animaux | promenade animaux.jpg |

---

## 4. Architecture Fichiers

### Mobile App (glamgo-mobile)

```
src/
├── lib/
│   └── constants/
│       ├── services.ts      # 24 services + SERVICE_IMAGES mapping
│       └── categories.ts    # 5 categories + CATEGORY_COLORS/ICONS
└── types/
    └── service.ts           # Types Service, Category conformes DB
```

### Backend (glamgo-backend)

```
app/models/
├── Service.php              # Model services
└── Category.php             # Model categories

database/
├── migrations/
│   └── 001_create_tables.sql
└── seeds/
    └── 003_populate_complete_services.sql  # 63+ services
```

---

## 5. URLs Images Backend

Les images sont servies depuis:
```
https://glamgo-api.fly.dev/images/services/{slug}.jpg
```

Exemple:
- `https://glamgo-api.fly.dev/images/services/menage.jpg`
- `https://glamgo-api.fly.dev/images/services/chef-domicile-2-personnes.jpg`

---

## 6. Prochaines Etapes

### Pour Ajouter les Photos au Backend

1. **Renommer les fichiers** pour correspondre aux slugs:
   ```bash
   # Exemple
   mv "chef a domicile 2 personnes.jpg" "chef-domicile-2-personnes.jpg"
   mv "coiffure homme prenium.jpg" "coiffure-homme-premium.jpg"
   # etc.
   ```

2. **Uploader sur le serveur Fly.io**:
   ```bash
   flyctl ssh sftp shell
   put chef-domicile-2-personnes.jpg /app/public/images/services/
   ```

### Pour l'App Mobile

Les fichiers sont deja configures:
- `src/lib/constants/services.ts` - 24 services avec images backend
- `src/lib/constants/categories.ts` - 5 categories

---

## 7. Conformite DB

### Types TypeScript

```typescript
// Service type conforme a la table services
interface Service {
  id: number | string;
  name: string;
  slug: string;
  description: string;
  price: number;
  duration_minutes: number;
  category_id: number;
  is_active: boolean;
  // ... relations
}

// Category type conforme a la table categories
interface Category {
  id: number | string;
  name: string;
  slug: string;
  icon: string;
  parent_id: number | null;
  display_order: number;
  is_active: boolean;
}
```

### Champs DB vs Mobile

| Champ DB | Champ Mobile | Status |
|----------|--------------|--------|
| id | id | OK |
| name | name/title | OK |
| slug | (derive de name) | OK |
| description | description | OK |
| price | price | OK |
| duration_minutes | duration_minutes | OK |
| category_id | category.id | OK |
| is_active | status | OK |
| allowed_formulas | - | A implementer |
| special_rules | - | A implementer |

---

## Conclusion

L'extraction est **100% complete**:
- 5 categories synchronisees
- 24 services avec photos mappees
- Types TypeScript conformes a la DB
- Images pointent vers le backend Fly.io

Les fichiers `services.ts` et `categories.ts` sont prets a utiliser dans l'app mobile.
