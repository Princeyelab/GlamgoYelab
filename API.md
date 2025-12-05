# Documentation API - GlamGo

Base URL : `http://localhost:8080/api`

Toutes les réponses sont au format JSON avec la structure :
```json
{
  "success": true/false,
  "message": "Message descriptif",
  "data": { ... }
}
```

## Authentification

Les routes protégées nécessitent un header Authorization :
```
Authorization: Bearer {token}
```

---

## 1. Authentification & Inscription

### POST /auth/register
Inscription d'un nouvel utilisateur

**Body :**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "Ahmed",
  "last_name": "Benali",
  "phone": "0612345678",
  "referral_code": "ABC12345" // Optionnel
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "Ahmed",
      "last_name": "Benali",
      "phone": "0612345678",
      "referral_code": "XYZ98765",
      "created_at": "2025-01-13 10:00:00"
    }
  }
}
```

### POST /auth/login
Connexion

**Body :**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": { ... }
  }
}
```

### POST /auth/forgot-password
Demande de réinitialisation de mot de passe

**Body :**
```json
{
  "email": "user@example.com"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Si cet email existe, un lien de réinitialisation a été envoyé"
}
```

---

## 2. Profil Utilisateur

### GET /user/profile
Récupère le profil de l'utilisateur connecté

**Headers :** Authorization Bearer

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Ahmed",
    "last_name": "Benali",
    "phone": "0612345678",
    "avatar": null,
    "referral_code": "XYZ98765",
    "referrals_count": 5
  }
}
```

### PUT /user/profile
Met à jour le profil

**Headers :** Authorization Bearer

**Body :**
```json
{
  "first_name": "Ahmed",
  "last_name": "El Benali",
  "phone": "0612345679"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Profil mis à jour",
  "data": { ... }
}
```

---

## 3. Adresses

### GET /user/addresses
Liste toutes les adresses de l'utilisateur

**Headers :** Authorization Bearer

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "label": "Maison",
      "address_line": "Rue Yougoslavie, Guéliz",
      "city": "Marrakech",
      "postal_code": "40000",
      "latitude": 31.6295,
      "longitude": -7.9811,
      "is_default": true,
      "created_at": "2025-01-13 10:00:00"
    }
  ]
}
```

### POST /user/addresses
Crée une nouvelle adresse

**Headers :** Authorization Bearer

**Body :**
```json
{
  "label": "Maison",
  "address_line": "Rue Yougoslavie, Guéliz",
  "city": "Marrakech",
  "postal_code": "40000",
  "latitude": 31.6295,
  "longitude": -7.9811,
  "is_default": true
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Adresse créée",
  "data": {
    "id": 1
  }
}
```

### PUT /user/addresses/{id}
Met à jour une adresse

**Headers :** Authorization Bearer

**Body :** Mêmes champs que POST (tous optionnels)

### DELETE /user/addresses/{id}
Supprime une adresse

**Headers :** Authorization Bearer

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Adresse supprimée"
}
```

---

## 4. Catégories & Services

### GET /categories
Liste toutes les catégories avec sous-catégories

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Beauté",
      "slug": "beaute",
      "description": "Services de beauté et bien-être",
      "icon": "beauty.svg",
      "parent_id": null,
      "sub_categories": [
        {
          "id": 5,
          "name": "Coiffure",
          "slug": "coiffure",
          "parent_id": 1
        }
      ]
    }
  ]
}
```

### GET /categories/{id}
Détail d'une catégorie

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Beauté",
    "slug": "beaute",
    "description": "Services de beauté et bien-être",
    "sub_categories": [ ... ]
  }
}
```

### GET /categories/{id}/services
Liste les services d'une catégorie

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category_id": 5,
      "name": "Coupe Homme",
      "slug": "coupe-homme",
      "description": "Coupe de cheveux classique pour homme",
      "image": null,
      "price": 80.00,
      "duration_minutes": 30,
      "is_active": true
    }
  ]
}
```

### GET /services
Liste tous les services

**Query Params :**
- `search` : Recherche par nom/description
- `category_id` : Filtrer par catégorie

**Exemples :**
- `/services` - Tous les services
- `/services?category_id=5` - Services de la catégorie 5
- `/services?search=coupe` - Recherche "coupe"

**Réponse 200 :**
```json
{
  "success": true,
  "data": [ ... ]
}
```

### GET /services/{id}
Détail d'un service

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Coupe Homme",
    "price": 80.00,
    "duration_minutes": 30,
    ...
  }
}
```

---

## 5. Commandes

### POST /orders
Créer une nouvelle commande

**Headers :** Authorization Bearer

**Body :**
```json
{
  "service_id": 1,
  "address_id": 1,
  "scheduled_at": "2025-01-15 14:00:00", // null = maintenant
  "notes": "Merci d'être à l'heure"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Commande créée",
  "data": {
    "id": 1,
    "user_id": 1,
    "service_id": 1,
    "service_name": "Coupe Homme",
    "address_id": 1,
    "address_line": "Rue Yougoslavie, Guéliz",
    "status": "pending",
    "price": 80.00,
    "tip": 0.00,
    "total": 80.00,
    "created_at": "2025-01-13 10:00:00"
  }
}
```

### GET /orders
Liste les commandes de l'utilisateur

**Headers :** Authorization Bearer

**Query Params :**
- `status` : Filtrer par statut (pending, accepted, on_way, in_progress, completed, cancelled)

**Exemples :**
- `/orders` - Toutes les commandes
- `/orders?status=completed` - Commandes terminées

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "service_name": "Coupe Homme",
      "status": "pending",
      "price": 80.00,
      "created_at": "2025-01-13 10:00:00",
      "provider_first_name": null,
      "provider_last_name": null
    }
  ]
}
```

### GET /orders/{id}
Détail d'une commande

**Headers :** Authorization Bearer

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "provider_id": 2,
    "service_id": 1,
    "service_name": "Coupe Homme",
    "service_description": "...",
    "user_first_name": "Ahmed",
    "provider_first_name": "Mohamed",
    "provider_phone": "0612345678",
    "address_line": "Rue Yougoslavie",
    "latitude": 31.6295,
    "longitude": -7.9811,
    "status": "accepted",
    "price": 80.00,
    "tip": 0.00,
    "total": 80.00,
    "created_at": "2025-01-13 10:00:00",
    "accepted_at": "2025-01-13 10:05:00"
  }
}
```

### PATCH /orders/{id}/cancel
Annuler une commande

**Headers :** Authorization Bearer

**Body :**
```json
{
  "reason": "Je ne suis plus disponible"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Commande annulée"
}
```

---

## 6. Évaluations

### POST /orders/{id}/review
Évaluer une commande terminée

**Headers :** Authorization Bearer

**Body :**
```json
{
  "rating": 5,
  "comment": "Excellent service !",
  "tip": 20.00
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Évaluation créée",
  "data": {
    "id": 1,
    "order_id": 1,
    "rating": 5,
    "comment": "Excellent service !",
    "created_at": "2025-01-13 10:00:00"
  }
}
```

---

## 7. Chat

### GET /orders/{id}/messages
Récupère les messages d'une commande

**Headers :** Authorization Bearer

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 1,
      "sender_type": "user",
      "sender_id": 1,
      "content": "Bonjour, serez-vous à l'heure ?",
      "translated_content": null,
      "is_read": true,
      "created_at": "2025-01-13 10:00:00"
    }
  ]
}
```

### POST /orders/{id}/messages
Envoyer un message

**Headers :** Authorization Bearer

**Body :**
```json
{
  "content": "Bonjour, je serai là dans 10 minutes"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Message envoyé",
  "data": { ... }
}
```

---

## 8. Géolocalisation

### GET /orders/{id}/location
Récupère la position du prestataire

**Headers :** Authorization Bearer

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "latitude": 31.6295,
    "longitude": -7.9811,
    "updated_at": "2025-01-13 10:05:00"
  }
}
```

---

## 9. Parrainage

### GET /user/referral-code
Récupère le code de parrainage de l'utilisateur

**Headers :** Authorization Bearer

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "referral_code": "XYZ98765",
    "referrals_count": 5
  }
}
```

---

## Codes d'Erreur

- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Accès refusé
- `404` - Ressource non trouvée
- `409` - Conflit (ex: email déjà utilisé)
- `422` - Erreurs de validation
- `500` - Erreur serveur

**Format d'erreur :**
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect"
}
```

**Format d'erreur de validation :**
```json
{
  "success": false,
  "message": "Erreurs de validation",
  "errors": {
    "email": ["Le champ email est requis", "Le champ email doit être un email valide"],
    "password": ["Le champ password doit contenir au moins 6 caractères"]
  }
}
```
