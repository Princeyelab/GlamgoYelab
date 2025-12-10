# Checklist de Test RTL/Arabe - GlamGo

## Test Rapide (5 minutes)

### 1. Changement de Langue
- [ ] Ouvrir la page d'accueil
- [ ] Cliquer sur le sélecteur de langue (Header)
- [ ] Sélectionner "العربية"
- [ ] **Vérifier:** Tout le texte passe en arabe instantanément
- [ ] **Vérifier:** Direction de la page devient RTL (texte aligné à droite)
- [ ] Recharger la page (F5)
- [ ] **Vérifier:** La langue arabe persiste

### 2. Navigation
- [ ] **Vérifier:** Menu de navigation est inversé (éléments de droite à gauche)
- [ ] **Vérifier:** Logo reste à sa position (ou se déplace selon design)
- [ ] **Vérifier:** Boutons d'action sont correctement positionnés

### 3. Formulaires
- [ ] Aller sur /login
- [ ] **Vérifier:** Labels alignés à droite
- [ ] **Vérifier:** Inputs ont texte aligné à droite
- [ ] **Vérifier:** Placeholder en arabe
- [ ] **Vérifier:** Bouton "Connexion" en arabe

---

## Test Complet (30 minutes)

### Pages Client

#### Accueil (/)
- [ ] Titre principal en arabe: "خدمات منزلية في مراكش"
- [ ] Sous-titre en arabe
- [ ] Barre de recherche avec placeholder arabe
- [ ] Catégories affichées correctement
- [ ] Section "Comment ça marche" en arabe
- [ ] CTA "Créer un compte" en arabe
- [ ] Pas de texte en français visible

#### Services (/services)
- [ ] Titre "جميع خدماتنا"
- [ ] Filtres en arabe
- [ ] Liste des services
- [ ] Cartes de services alignées RTL
- [ ] Prix affichés correctement (LTR pour les chiffres)

#### Service Detail (/services/[id])
- [ ] Nom du service traduit (via DeepL)
- [ ] Description traduite
- [ ] Prix affiché
- [ ] Bouton "Réserver maintenant" en arabe
- [ ] Étoiles de notation correctement affichées

#### Login (/login)
- [ ] Titre "تسجيل الدخول"
- [ ] Formulaire aligné RTL
- [ ] Messages d'erreur en arabe
- [ ] Lien "Mot de passe oublié" en arabe
- [ ] Lien "Vous êtes prestataire ?" en arabe

#### Register (/register)
- [ ] Étapes 1-4 en arabe
- [ ] Formulaire multi-étapes fonctionnel
- [ ] Messages de validation en arabe
- [ ] Conditions générales en arabe
- [ ] Sélecteur d'adresse avec suggestions

#### Booking (/booking/[id])
- [ ] Sélection de prestataire
- [ ] Sélection de date/heure
- [ ] Récapitulatif en arabe
- [ ] Prix total affiché
- [ ] Bouton "Confirmer la réservation" en arabe

#### Profile (/profile)
- [ ] Informations personnelles en arabe
- [ ] Labels de formulaire en arabe
- [ ] Bouton "Enregistrer" en arabe
- [ ] Messages de confirmation en arabe

#### Orders (/orders)
- [ ] Liste des commandes
- [ ] Statuts en arabe
- [ ] Dates formatées correctement
- [ ] Détails de commande accessibles

---

### Pages Prestataire

#### Provider Login (/provider/login)
- [ ] Titre en arabe
- [ ] Formulaire RTL
- [ ] Messages en arabe

#### Provider Dashboard (/provider/dashboard)
- [ ] Statistiques en arabe
- [ ] Menu latéral en arabe
- [ ] Commandes listées en arabe

#### Provider Profile (/provider/profile)
- [ ] Formulaire complet en arabe
- [ ] Upload de documents fonctionnel
- [ ] Localisation sur carte

---

### Test Responsive

#### Mobile (375px)
- [ ] Header mobile avec menu hamburger
- [ ] Menu hamburger à gauche (RTL)
- [ ] Cartes de services empilées
- [ ] Formulaires utilisables
- [ ] Pas de débordement horizontal

#### Tablet (768px)
- [ ] Layout adapté
- [ ] Navigation tablette
- [ ] Grilles de services (2 colonnes)

#### Desktop (1440px+)
- [ ] Layout desktop complet
- [ ] Navigation horizontale inversée
- [ ] Grilles de services (3 colonnes)
- [ ] Sidebar si applicable

---

### Test Visuel Détaillé

#### Alignement
- [ ] Textes alignés à droite en mode AR
- [ ] Textes alignés à gauche en mode FR
- [ ] Pas de mélange d'alignements

#### Icônes
- [ ] Flèches inversées (← devient →)
- [ ] Chevrons inversés
- [ ] Icônes non-directionnelles non affectées (étoiles, cœurs, etc.)

#### Espacement
- [ ] Marges inversées correctement
- [ ] Padding inversé correctement
- [ ] Pas d'espacement bizarre

#### Typographie
- [ ] Police Noto Sans Arabic chargée
- [ ] Taille de police lisible
- [ ] Line-height adapté pour l'arabe
- [ ] Pas de caractères tronqués

#### Couleurs
- [ ] Couleurs primaire/secondaire conservées
- [ ] Pas de problème de contraste

---

### Test d'Interaction

#### Formulaires
- [ ] Focus visible sur les inputs
- [ ] Validation en temps réel
- [ ] Messages d'erreur positionnés correctement
- [ ] Boutons submit accessibles

#### Navigation
- [ ] Navigation au clavier (Tab)
- [ ] Tab order correct en RTL (droite → gauche)
- [ ] Liens cliquables
- [ ] Retour arrière fonctionnel

#### Modales
- [ ] Bouton fermer à gauche (RTL)
- [ ] Contenu de la modale aligné RTL
- [ ] Boutons d'action ordonnés RTL

#### Dropdowns
- [ ] Menus déroulants s'ouvrent correctement
- [ ] Contenu aligné RTL
- [ ] Sélection fonctionnelle

---

### Test de Contenu

#### Traductions Complètes
- [ ] Aucun texte en français dans les pages converties
- [ ] Messages d'erreur en arabe
- [ ] Messages de succès en arabe
- [ ] Placeholders en arabe
- [ ] Tooltips en arabe (si applicable)

#### Interpolation
- [ ] Variables insérées correctement (ex: "Bonjour {name}")
- [ ] Dates formatées selon locale arabe
- [ ] Chiffres affichés correctement (LTR dans contexte RTL)

#### Contenu Dynamique
- [ ] Noms de services traduits (DeepL)
- [ ] Descriptions traduites
- [ ] Catégories traduites

---

### Test de Données Mixtes

#### Numéros de Téléphone
- [ ] Affichés LTR même en mode AR
- [ ] Format: +212 6 00 00 00 00
- [ ] Cliquables (tel: links)

#### Emails
- [ ] Affichés LTR
- [ ] Cliquables (mailto: links)

#### Prix
- [ ] Chiffres LTR
- [ ] Devise "MAD" ou "DH" positionnée correctement
- [ ] Format: 100.00 MAD ou 100 DH

#### Dates
- [ ] Format arabe si possible
- [ ] Sinon format numérique universel
- [ ] Jours de semaine traduits

---

### Test d'Accessibilité

#### Screen Reader
- [ ] Contenu annoncé en arabe
- [ ] ARIA labels en arabe
- [ ] Navigation logique

#### Contraste
- [ ] Ratio de contraste conforme WCAG
- [ ] Texte lisible sur tous les fonds

#### Focus
- [ ] Indicateurs de focus visibles
- [ ] Ordre de focus logique (RTL)

---

### Test de Performance

#### Chargement
- [ ] Police arabe charge rapidement
- [ ] Pas de FOUT (Flash of Unstyled Text)
- [ ] Pas de layout shift

#### Switch de Langue
- [ ] Changement instantané (<100ms)
- [ ] Pas de rechargement complet
- [ ] État de l'application préservé

---

### Test de Cas Limites

#### Texte Long
- [ ] Titres longs ne débordent pas
- [ ] Descriptions longues wrappées correctement
- [ ] Boutons avec texte long restent cliquables

#### Texte Court
- [ ] Pas de problème d'alignement
- [ ] Centrage correct si applicable

#### Nombres
- [ ] Grands nombres (1,000,000) formatés correctement
- [ ] Nombres décimaux (10.50) affichés correctement

#### Caractères Spéciaux
- [ ] Emojis affichés correctement
- [ ] Symboles (€, $, %, etc.) positionnés correctement

---

## Checklist de Non-Régression

### Fonctionnalités FR Intactes
- [ ] Tout fonctionne toujours en mode français
- [ ] Switch FR → AR → FR fonctionne
- [ ] Aucune fonctionnalité cassée

### Données
- [ ] Soumission de formulaires fonctionne
- [ ] API calls fonctionnent en AR et FR
- [ ] Données sauvegardées correctement

### Authentification
- [ ] Login fonctionne
- [ ] Register fonctionne
- [ ] Reset password fonctionne
- [ ] Session persistante

---

## Bugs Connus à Vérifier

### ⚠️ À Corriger
- [ ] /bidding/page.js - 11 messages d'erreur hardcodés
- [ ] /booking/[id]/page.js - 2 messages d'erreur hardcodés

### ℹ️ Mineurs (Console)
- [ ] /onboarding/client/page.js - 2 console.error
- [ ] /provider/profile/page.js - 1 console.warn

---

## Rapport de Bug Template

```
**Page:** /path/to/page
**Langue:** AR / FR
**Device:** Desktop / Mobile / Tablet
**Browser:** Chrome / Firefox / Safari
**Description:** Description du problème
**Attendu:** Comportement attendu
**Actuel:** Comportement actuel
**Screenshot:** [si applicable]
```

---

## Test Passé ✅

Une fois tous les tests passés:
- [ ] Remplir le tableau de conformité
- [ ] Noter les bugs dans un tracker
- [ ] Valider avec un speaker natif arabe
- [ ] Obtenir validation UX/UI
- [ ] Prêt pour déploiement

---

**Version:** 1.0
**Date:** 10 décembre 2025
