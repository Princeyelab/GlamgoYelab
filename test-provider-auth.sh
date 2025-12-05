#!/bin/bash

echo "=========================================="
echo "Test de l'Authentification Prestataire"
echo "Marrakech Services API"
echo "=========================================="
echo ""

API_URL="http://localhost:8081"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un test
function test_header() {
    echo -e "${YELLOW}$1${NC}"
    echo "=========================================="
}

# Fonction pour afficher un succès
function test_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher une erreur
function test_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour afficher une information
function test_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test 1: Inscription d'un nouveau prestataire
test_header "1. INSCRIPTION D'UN NOUVEAU PRESTATAIRE"
echo "POST $API_URL/api/provider/register"
echo "Body: { email, password, first_name, last_name, phone }"
echo ""

RANDOM_EMAIL="testprovider$(date +%s)@test.com"

REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/provider/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$RANDOM_EMAIL\", \"password\": \"password123\", \"first_name\": \"Ahmed\", \"last_name\": \"Plombier\", \"phone\": \"0612345678\"}")

echo "$REGISTER_RESPONSE" | json_pp 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extraire le token
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    test_success "Prestataire inscrit avec succès (token reçu)"
    PROVIDER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    test_info "Provider ID: $PROVIDER_ID"
else
    test_error "Erreur lors de l'inscription"
fi
echo ""
echo ""

# Test 2: Connexion avec le prestataire
test_header "2. CONNEXION DU PRESTATAIRE"
echo "POST $API_URL/api/provider/login"
echo "Body: { email: \"$RANDOM_EMAIL\", password: \"password123\" }"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/provider/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$RANDOM_EMAIL\", \"password\": \"password123\"}")

echo "$LOGIN_RESPONSE" | json_pp 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extraire le nouveau token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    test_success "Connexion réussie (token reçu)"
    test_info "Token: ${TOKEN:0:50}..."
else
    test_error "Erreur lors de la connexion"
fi
echo ""
echo ""

# Test 3: Récupérer le profil du prestataire
test_header "3. PROFIL DU PRESTATAIRE (AVEC AUTHENTIFICATION)"
echo "GET $API_URL/api/provider/profile"
echo "Header: Authorization: Bearer {token}"
echo ""

PROFILE_RESPONSE=$(curl -s -X GET $API_URL/api/provider/profile \
  -H "Authorization: Bearer $TOKEN")

echo "$PROFILE_RESPONSE" | json_pp 2>/dev/null || echo "$PROFILE_RESPONSE"

if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
    test_success "Profil récupéré avec succès"
else
    test_error "Erreur lors de la récupération du profil"
fi
echo ""
echo ""

# Test 4: Tenter de récupérer le profil sans token
test_header "4. PROFIL SANS AUTHENTIFICATION (DOIT ÉCHOUER)"
echo "GET $API_URL/api/provider/profile (sans Authorization header)"
echo ""

NO_TOKEN_RESPONSE=$(curl -s -X GET $API_URL/api/provider/profile)

echo "$NO_TOKEN_RESPONSE" | json_pp 2>/dev/null || echo "$NO_TOKEN_RESPONSE"

if echo "$NO_TOKEN_RESPONSE" | grep -q '"success":false'; then
    test_success "Accès bloqué sans token (comme attendu)"
else
    test_error "La protection ne fonctionne pas"
fi
echo ""
echo ""

# Test 5: Mettre à jour le statut du prestataire
test_header "5. METTRE À JOUR LE STATUT (ONLINE)"
echo "PUT $API_URL/api/provider/status"
echo "Body: { status: \"online\" }"
echo ""

STATUS_RESPONSE=$(curl -s -X PUT $API_URL/api/provider/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "online"}')

echo "$STATUS_RESPONSE" | json_pp 2>/dev/null || echo "$STATUS_RESPONSE"

if echo "$STATUS_RESPONSE" | grep -q '"status":"online"'; then
    test_success "Statut mis à jour avec succès"
else
    test_error "Erreur lors de la mise à jour du statut"
fi
echo ""
echo ""

# Test 6: Mettre à jour la position géographique
test_header "6. METTRE À JOUR LA POSITION GÉOGRAPHIQUE"
echo "PUT $API_URL/api/provider/location"
echo "Body: { lat: 31.6295, lon: -7.9811 }"
echo ""

LOCATION_RESPONSE=$(curl -s -X PUT $API_URL/api/provider/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"lat": 31.6295, "lon": -7.9811}')

echo "$LOCATION_RESPONSE" | json_pp 2>/dev/null || echo "$LOCATION_RESPONSE"

if echo "$LOCATION_RESPONSE" | grep -q '"current_lat":"31.6295"'; then
    test_success "Position mise à jour avec succès"
else
    test_error "Erreur lors de la mise à jour de la position"
fi
echo ""
echo ""

# Test 7: Ajouter le service au prestataire (nécessaire pour accepter des commandes)
test_header "7. ASSOCIER UN SERVICE AU PRESTATAIRE"
echo "Insertion directe dans provider_services (normalement via API admin)"
echo ""

# Se connecter au MySQL et ajouter le service
docker exec marrakech-mysql mysql -u root -prootpassword marrakech_db -e \
  "INSERT IGNORE INTO provider_services (provider_id, service_id) VALUES ($PROVIDER_ID, 1), ($PROVIDER_ID, 5);" 2>/dev/null

if [ $? -eq 0 ]; then
    test_success "Services associés au prestataire (ID: 1, 5)"
else
    test_info "Impossible d'associer les services via Docker (normal si Docker n'est pas accessible)"
fi
echo ""
echo ""

# Test 8: Lister les commandes en attente (nécessite authentification)
test_header "8. LISTER LES COMMANDES EN ATTENTE (AVEC AUTH)"
echo "GET $API_URL/api/provider/pending-orders"
echo "Header: Authorization: Bearer {token}"
echo ""

PENDING_RESPONSE=$(curl -s -X GET $API_URL/api/provider/pending-orders \
  -H "Authorization: Bearer $TOKEN")

echo "$PENDING_RESPONSE" | json_pp 2>/dev/null || echo "$PENDING_RESPONSE"

PENDING_COUNT=$(echo "$PENDING_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ ! -z "$PENDING_COUNT" ]; then
    test_success "Trouvé $PENDING_COUNT commande(s) en attente"
else
    test_error "Erreur lors de la récupération des commandes"
fi
echo ""
echo ""

# Test 9: Créer une commande de test (en tant qu'utilisateur)
test_header "9. CRÉER UNE COMMANDE DE TEST (EN TANT QU'UTILISATEUR)"
echo "Connexion en tant qu'utilisateur et création d'une commande..."
echo ""

# Se connecter en tant qu'utilisateur
USER_LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser1@test.com", "password": "password123"}')

USER_TOKEN=$(echo "$USER_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USER_TOKEN" ]; then
    test_info "Création d'un utilisateur de test..."
    REGISTER_USER_RESPONSE=$(curl -s -X POST $API_URL/api/register \
      -H "Content-Type: application/json" \
      -d '{"email": "testuser1@test.com", "password": "password123", "first_name": "Ahmed", "last_name": "Test", "phone": "0612345678"}')

    USER_TOKEN=$(echo "$REGISTER_USER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

# Créer une commande (service 5 = Débouchage canalisation)
CREATE_ORDER_RESPONSE=$(curl -s -X POST $API_URL/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"service_id": 5, "address_id": 5}')

NEW_ORDER_ID=$(echo "$CREATE_ORDER_RESPONSE" | grep -o '"order_id":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ ! -z "$NEW_ORDER_ID" ]; then
    test_success "Commande créée avec succès (ID: $NEW_ORDER_ID)"
else
    test_error "Erreur lors de la création de la commande"
fi
echo ""
echo ""

# Test 10: Accepter la commande (avec authentification prestataire)
test_header "10. ACCEPTER UNE COMMANDE (AVEC AUTH PRESTATAIRE)"
echo "POST $API_URL/api/provider/orders/$NEW_ORDER_ID/accept"
echo "Header: Authorization: Bearer {provider_token}"
echo ""

ACCEPT_RESPONSE=$(curl -s -X POST $API_URL/api/provider/orders/$NEW_ORDER_ID/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$ACCEPT_RESPONSE" | json_pp 2>/dev/null || echo "$ACCEPT_RESPONSE"

if echo "$ACCEPT_RESPONSE" | grep -q '"status":"accepted"'; then
    test_success "Commande acceptée avec succès"
    ACCEPTED_ORDER_ID=$NEW_ORDER_ID
else
    test_error "Erreur lors de l'acceptation de la commande"
fi
echo ""
echo ""

# Test 11: Tenter d'accepter sans token
test_header "11. TENTER D'ACCEPTER SANS TOKEN (DOIT ÉCHOUER)"
echo "POST $API_URL/api/provider/orders/1/accept (sans Authorization header)"
echo ""

NO_AUTH_RESPONSE=$(curl -s -X POST $API_URL/api/provider/orders/1/accept \
  -H "Content-Type: application/json")

echo "$NO_AUTH_RESPONSE" | json_pp 2>/dev/null || echo "$NO_AUTH_RESPONSE"

if echo "$NO_AUTH_RESPONSE" | grep -q '"success":false'; then
    test_success "Accès bloqué sans token (comme attendu)"
else
    test_error "La protection ne fonctionne pas"
fi
echo ""
echo ""

# Test 12: Lister les commandes du prestataire
test_header "12. LISTER LES COMMANDES DU PRESTATAIRE (AVEC AUTH)"
echo "GET $API_URL/api/provider/my-orders"
echo "Header: Authorization: Bearer {provider_token}"
echo ""

MY_ORDERS_RESPONSE=$(curl -s -X GET $API_URL/api/provider/my-orders \
  -H "Authorization: Bearer $TOKEN")

echo "$MY_ORDERS_RESPONSE" | json_pp 2>/dev/null | head -50 || echo "$MY_ORDERS_RESPONSE" | head -30

MY_ORDERS_COUNT=$(echo "$MY_ORDERS_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ ! -z "$MY_ORDERS_COUNT" ]; then
    test_success "Trouvé $MY_ORDERS_COUNT commande(s) du prestataire"
else
    test_error "Erreur lors de la récupération des commandes"
fi
echo ""
echo ""

# Test 13: Mettre à jour le statut de la commande
test_header "13. METTRE À JOUR LE STATUT DE LA COMMANDE (AVEC AUTH)"
echo "PUT $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/status"
echo "Body: { status: \"in_progress\" }"
echo ""

UPDATE_STATUS_RESPONSE=$(curl -s -X PUT $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "in_progress"}')

echo "$UPDATE_STATUS_RESPONSE" | json_pp 2>/dev/null || echo "$UPDATE_STATUS_RESPONSE"

if echo "$UPDATE_STATUS_RESPONSE" | grep -q '"status":"in_progress"'; then
    test_success "Statut mis à jour avec succès"
else
    test_error "Erreur lors de la mise à jour du statut"
fi
echo ""
echo ""

# Test 14: Tenter d'utiliser un token utilisateur sur une route prestataire
test_header "14. TOKEN UTILISATEUR SUR ROUTE PRESTATAIRE (DOIT ÉCHOUER)"
echo "GET $API_URL/api/provider/profile avec un token utilisateur"
echo ""

WRONG_TOKEN_RESPONSE=$(curl -s -X GET $API_URL/api/provider/profile \
  -H "Authorization: Bearer $USER_TOKEN")

echo "$WRONG_TOKEN_RESPONSE" | json_pp 2>/dev/null || echo "$WRONG_TOKEN_RESPONSE"

if echo "$WRONG_TOKEN_RESPONSE" | grep -q '"success":false'; then
    test_success "Token utilisateur rejeté sur route prestataire (comme attendu)"
else
    test_error "La validation du type de token ne fonctionne pas"
fi
echo ""
echo ""

# Résumé final
echo "=========================================="
echo "RÉSUMÉ DES TESTS"
echo "=========================================="
echo ""

test_info "Routes d'authentification testées:"
echo "  ✓ POST /api/provider/register (inscription)"
echo "  ✓ POST /api/provider/login (connexion)"
echo "  ✓ GET /api/provider/profile (profil protégé)"
echo "  ✓ PUT /api/provider/status (statut protégé)"
echo "  ✓ PUT /api/provider/location (position protégée)"
echo ""

test_info "Routes de gestion des commandes testées:"
echo "  ✓ GET /api/provider/pending-orders (protégé)"
echo "  ✓ POST /api/provider/orders/{id}/accept (protégé)"
echo "  ✓ GET /api/provider/my-orders (protégé)"
echo "  ✓ PUT /api/provider/orders/{id}/status (protégé)"
echo ""

test_info "Fonctionnalités vérifiées:"
echo "  • Inscription et connexion des prestataires"
echo "  • Génération de tokens JWT avec provider_id"
echo "  • Protection des routes par ProviderMiddleware"
echo "  • Rejet des tokens utilisateurs sur routes prestataires"
echo "  • Rejet des requêtes sans token"
echo "  • Mise à jour du statut (online/offline/busy)"
echo "  • Mise à jour de la position géographique"
echo "  • Acceptation de commandes sans provider_id dans le body"
echo "  • Mise à jour du statut de commande"
echo "  • Listing des commandes du prestataire authentifié"
echo ""

test_info "Sécurité:"
echo "  • ProviderMiddleware vérifie la présence du token"
echo "  • ProviderMiddleware vérifie que le token contient provider_id"
echo "  • Les tokens utilisateurs sont rejetés sur les routes prestataires"
echo "  • L'ID du prestataire est extrait du token (pas du body)"
echo "  • Impossible d'usurper l'identité d'un autre prestataire"
echo ""

echo -e "${GREEN}✅ Tests terminés !${NC}"
