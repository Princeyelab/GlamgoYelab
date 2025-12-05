# Gestion des Services Prestataire - GlamGo

## 📋 Vue d'ensemble

Une page complète permettant aux prestataires de gérer leur catalogue de services avec une **visualisation claire du mode enchères**.

## 🎯 Problème résolu

**Avant** : Le mode enchères n'était pas visible dans l'interface prestataire
**Maintenant** : Affichage clair et distinct du mode enchères vs prix fixe pour chaque service

## ✅ Fonctionnalités

### 1. Page de gestion des services (`/provider/services`)

#### Deux onglets principaux

**A. Mes Services**
- Liste des services que le prestataire propose actuellement
- Affichage détaillé de chaque service avec :
  - **Badge "Mode Enchères"** visible sur l'image si activé 🎯
  - Image du service
  - Nom et catégorie
  - Description courte
  - **Section dédiée selon le mode** :
    - **Mode Enchères** : Fourchette de prix suggérée, description du fonctionnement
    - **Prix Fixe** : Prix et durée estimée
  - Bouton "Retirer ce service"

**B. Services Disponibles**
- Catalogue complet des services de la plateforme
- Services non encore ajoutés par le prestataire
- Même affichage détaillé avec distinction mode enchères
- Bouton "Ajouter à mes services"

### 2. Affichage du mode enchères

#### Badge visuel sur l'image
```
🎯 Mode Enchères
```
- Positionné en haut à droite de l'image
- Couleur orange/jaune pour attirer l'attention
- Animation de pulsation subtile

#### Section d'information détaillée

**Pour les services en mode enchères :**
```
💰 Système d'enchères activé

Fourchette suggérée:
150 MAD - 300 MAD

Les clients proposent leur prix et vous faites une contre-offre
```

**Pour les services à prix fixe :**
```
Prix fixe: 200 MAD
⏱ 45 minutes
```

### 3. Actions rapides depuis le dashboard

Ajout de 3 cartes d'actions rapides sur le dashboard :

1. **📋 Mes Services** → `/provider/services`
   - Gérez vos services et tarifs

2. **💰 Enchères** → `/provider/bidding`
   - Consultez les offres disponibles

3. **👤 Mon Profil** → `/provider/profile`
   - Modifiez vos informations

## 🎨 Design

### Visuels distinctifs

#### Badge "Mode Enchères"
- Dégradé orange/jaune
- Ombre portée
- Animation pulse
- Icône 🎯
- Texte en gras

#### Section mode enchères
- Fond gris clair
- Bordure arrondie
- Icône 💰 pour attirer l'attention
- Code couleur warning ($warning)

#### Section prix fixe
- Fond gris clair
- Affichage simple et clair
- Icône ⏱ pour la durée

### Responsive
- Grid qui s'adapte automatiquement
- Mobile : 1 colonne
- Tablette : 2 colonnes
- Desktop : 3+ colonnes

### Animations
- Hover sur les cartes : élévation et ombre
- Badge enchères : pulsation douce
- Transition fluide entre les onglets

## 🔧 Fichiers créés

```
src/app/provider/services/
├── page.js                    # Page principale
└── page.module.scss           # Styles dédiés

src/app/provider/dashboard/
├── page.js                    # Ajout actions rapides (lignes 329-351)
└── page.module.scss           # Styles actions rapides (lignes 108-166)

GESTION-SERVICES-PRESTATAIRE.md  # Cette documentation
```

## 📊 Structure des données

### Service avec mode enchères
```javascript
{
  id: 1,
  name: "Coiffure à domicile",
  description: "Service de coiffure professionnelle...",
  category_name: "Coiffure",
  image: "/images/services/coiffure.jpg",
  allow_bidding: true,  // ✅ Mode enchères activé
  min_suggested_price: 150,
  max_suggested_price: 300,
  base_price: null,
  price: null,
  estimated_duration: null
}
```

### Service à prix fixe
```javascript
{
  id: 2,
  name: "Manucure classique",
  description: "Soin complet des ongles...",
  category_name: "Esthétique",
  image: "/images/services/manucure.jpg",
  allow_bidding: false,  // ❌ Prix fixe
  min_suggested_price: null,
  max_suggested_price: null,
  base_price: 80,
  price: 80,
  estimated_duration: "30 min"
}
```

## 🔌 API Backend utilisée

### Endpoints
```javascript
// Récupérer tous les services
GET /services
Response: {
  success: true,
  data: [/* array of services */]
}

// Récupérer les services du prestataire
GET /provider/services
Authorization: Bearer {provider_token}
Response: {
  success: true,
  data: [/* array of provider services */]
}

// Ajouter un service
POST /provider/services
Authorization: Bearer {provider_token}
Body: {
  service_id: 1
}
Response: {
  success: true,
  message: "Service ajouté avec succès"
}

// Retirer un service
DELETE /provider/services/{serviceId}
Authorization: Bearer {provider_token}
Response: {
  success: true,
  message: "Service retiré avec succès"
}
```

## 🎯 Logique de détection du mode enchères

```javascript
// Dans le composant
const isBiddingEnabled = service.allow_bidding === 1 || service.allow_bidding === true;

// Affichage conditionnel
{isBiddingEnabled && (
  <div className={styles.biddingBadge}>
    🎯 Mode Enchères
  </div>
)}
```

## 🔄 Flux utilisateur

### Consultation des services

1. Prestataire sur `/provider/dashboard`
2. Clic sur "📋 Mes Services"
3. Redirection vers `/provider/services`
4. Par défaut, onglet "Mes Services" actif
5. Visualisation de tous ses services avec mode clairement indiqué

### Ajout d'un service

1. Clic sur l'onglet "Services Disponibles"
2. Parcours de la liste
3. **Identification visuelle du mode** :
   - Badge orange sur l'image = Mode enchères
   - Pas de badge = Prix fixe
4. Lecture des détails (fourchette prix ou prix fixe)
5. Clic sur "Ajouter à mes services"
6. Confirmation visuelle (message de succès)
7. Service ajouté à l'onglet "Mes Services"

### Retrait d'un service

1. Onglet "Mes Services"
2. Sélection du service à retirer
3. Clic sur "Retirer ce service"
4. Confirmation par popup
5. Service retiré de la liste
6. Message de succès

## 📱 États de l'interface

### État vide - Mes Services
```
📋

Aucun service ajouté

Commencez par ajouter des services depuis l'onglet "Services Disponibles"

[Parcourir les services]
```

### État vide - Services Disponibles
```
✅

Tous les services sont ajoutés

Vous proposez déjà tous les services disponibles sur la plateforme
```

### État chargement
```
⏳

Chargement...
```

### État erreur
```
❌ Erreur lors du chargement des services
```

### État succès
```
✅ Service ajouté avec succès
```

## 🎨 Palette de couleurs

```scss
// Badge enchères
background: linear-gradient(135deg, $warning, darken($warning, 10%));
// $warning = #FFC107 (orange/jaune)

// Section enchères
background: $gray-50;
border: 1px solid $gray-200;
color: $warning;

// Section prix fixe
background: $gray-50;
border: 1px solid $gray-200;
color: $gray-700;
```

## 🔍 Éléments clés du code

### Filtrage des services disponibles
```javascript
const providerServiceIds = providerServices.map(s => s.id || s.service_id);
const availableServices = allServices.filter(s => !providerServiceIds.includes(s.id));
```

### Composant ServiceCard réutilisable
```javascript
<ServiceCard
  service={service}
  isProviderService={true/false}
  onAdd={handleAddService}
  onRemove={handleRemoveService}
  actionLoading={actionLoading}
/>
```

### Détection mode enchères
```javascript
const isBiddingEnabled = service.allow_bidding === 1 || service.allow_bidding === true;
```

## 🚀 Navigation

### Depuis le dashboard
```
/provider/dashboard
  ↓ (clic "Mes Services")
/provider/services
```

### Retour au dashboard
```
/provider/services
  ↓ (clic "← Retour au dashboard")
/provider/dashboard
```

### Vers le profil
```
/provider/services
  ↓ (clic nom prestataire)
/provider/profile
```

## ✅ Checklist de test

### Affichage
- [ ] Badge "Mode Enchères" visible sur les services concernés
- [ ] Fourchette de prix affichée pour les enchères
- [ ] Prix fixe affiché pour les autres services
- [ ] Images des services chargées correctement
- [ ] Catégories affichées

### Fonctionnalités
- [ ] Onglets "Mes Services" / "Services Disponibles" fonctionnels
- [ ] Ajout d'un service fonctionne
- [ ] Retrait d'un service fonctionne
- [ ] Confirmation avant retrait
- [ ] Messages de succès/erreur affichés
- [ ] État vide géré correctement

### Navigation
- [ ] Liens rapides depuis dashboard fonctionnels
- [ ] Retour au dashboard fonctionne
- [ ] Navigation vers profil fonctionne
- [ ] Header responsive

### Responsive
- [ ] Mobile : 1 colonne
- [ ] Tablette : 2 colonnes
- [ ] Desktop : 3+ colonnes
- [ ] Actions rapides s'adaptent

## 🐛 Gestion des erreurs

### Erreur de chargement
```javascript
try {
  const response = await apiClient.getAllServices();
  if (response.success) {
    setAllServices(response.data || []);
  }
} catch (err) {
  setError('Erreur lors du chargement des services');
}
```

### Erreur d'ajout/retrait
```javascript
if (response.success) {
  setSuccess('Service ajouté avec succès');
  await loadServices(); // Recharger pour synchroniser
} else {
  setError(response.message || 'Erreur lors de l\'ajout');
}
```

## 📊 Statistiques d'utilisation

Le dashboard affiche maintenant :
- Nombre de services proposés par le prestataire
- Nombre de services disponibles à ajouter
- Accès rapide à la gestion

## 🔮 Améliorations futures possibles

- [ ] Recherche/filtrage de services par catégorie
- [ ] Tri par nom, prix, popularité
- [ ] Configuration des prix personnalisés par service
- [ ] Activation/désactivation temporaire d'un service
- [ ] Statistiques par service (demandes, revenus)
- [ ] Modification de la fourchette de prix pour les enchères

## 📄 Documentation liée

- `ESPACE-PRESTATAIRE.md` - Documentation complète de l'espace prestataire
- `BACKEND-INTEGRATION.md` - Intégration backend
- `README-DEMARRAGE.md` - Guide de démarrage

---

**Date de création** : Novembre 2025
**Version** : 1.0
**Projet** : GlamGo - Plateforme de services à domicile (Maroc)
**Fonctionnalité** : Gestion des services prestataire avec affichage du mode enchères
