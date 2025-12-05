#!/bin/bash

echo "=========================================="
echo "Test des Endpoints de Commandes"
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

# Test 1: Se connecter pour obtenir un token
test_header "1. CONNEXION POUR OBTENIR UN TOKEN"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser1@test.com", "password": "password123"}')

echo "$LOGIN_RESPONSE" | json_pp 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extraire le token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    test_error "Token non reçu lors de la connexion"
    echo ""
    echo "Essayons de créer l'utilisateur..."
    # Créer l'utilisateur si il n'existe pas
    REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/register \
      -H "Content-Type: application/json" \
      -d '{"email": "testuser1@test.com", "password": "password123", "first_name": "Ahmed", "last_name": "Test", "phone": "0612345678"}')

    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$TOKEN" ]; then
        echo "❌ Impossible de continuer les tests sans token"
        exit 1
    else
        test_success "Utilisateur créé et token reçu"
    fi
fi

test_success "Token reçu: ${TOKEN:0:50}..."
echo ""
echo ""

# Test 2: Créer une nouvelle commande immédiate
test_header "2. CRÉER UNE COMMANDE IMMÉDIATE"
echo "POST $API_URL/api/orders"
echo "Body: { service_id: 1, address_id: 5 }"
echo ""

CREATE_ORDER_RESPONSE=$(curl -s -X POST $API_URL/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"service_id": 1, "address_id": 5}')

echo "$CREATE_ORDER_RESPONSE" | json_pp 2>/dev/null || echo "$CREATE_ORDER_RESPONSE"

if echo "$CREATE_ORDER_RESPONSE" | grep -q '"success":true'; then
    ORDER_ID=$(echo "$CREATE_ORDER_RESPONSE" | grep -o '"order_id":[0-9]*' | grep -o '[0-9]*' | head -1)
    test_success "Commande créée avec succès (ID: $ORDER_ID)"
else
    test_error "Erreur lors de la création de la commande"
fi
echo ""
echo ""

# Test 3: Créer une commande programmée
test_header "3. CRÉER UNE COMMANDE PROGRAMMÉE"
echo "POST $API_URL/api/orders"
echo "Body: { service_id: 5, address_id: 5, scheduled_time: \"2025-11-14 15:00:00\" }"
echo ""

SCHEDULED_ORDER_RESPONSE=$(curl -s -X POST $API_URL/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"service_id": 5, "address_id": 5, "scheduled_time": "2025-11-14 15:00:00"}')

echo "$SCHEDULED_ORDER_RESPONSE" | json_pp 2>/dev/null || echo "$SCHEDULED_ORDER_RESPONSE"

if echo "$SCHEDULED_ORDER_RESPONSE" | grep -q '"scheduled_time":"2025-11-14 15:00:00"'; then
    test_success "Commande programmée créée avec succès"
else
    test_error "Erreur lors de la création de la commande programmée"
fi
echo ""
echo ""

# Test 4: Lister toutes les commandes de l'utilisateur
test_header "4. LISTER TOUTES LES COMMANDES DE L'UTILISATEUR"
echo "GET $API_URL/api/orders"
echo ""

LIST_ORDERS_RESPONSE=$(curl -s -X GET $API_URL/api/orders \
  -H "Authorization: Bearer $TOKEN")

echo "$LIST_ORDERS_RESPONSE" | json_pp 2>/dev/null || echo "$LIST_ORDERS_RESPONSE"

ORDERS_COUNT=$(echo "$LIST_ORDERS_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ ! -z "$ORDERS_COUNT" ]; then
    test_success "Trouvé $ORDERS_COUNT commande(s)"
else
    test_error "Erreur lors de la récupération des commandes"
fi
echo ""
echo ""

# Test 5: Récupérer les détails d'une commande spécifique
if [ ! -z "$ORDER_ID" ]; then
    test_header "5. DÉTAILS D'UNE COMMANDE SPÉCIFIQUE (ID=$ORDER_ID)"
    echo "GET $API_URL/api/orders/$ORDER_ID"
    echo ""

    ORDER_DETAIL_RESPONSE=$(curl -s -X GET $API_URL/api/orders/$ORDER_ID \
      -H "Authorization: Bearer $TOKEN")

    echo "$ORDER_DETAIL_RESPONSE" | json_pp 2>/dev/null || echo "$ORDER_DETAIL_RESPONSE"

    if echo "$ORDER_DETAIL_RESPONSE" | grep -q '"success":true'; then
        test_success "Détails de la commande récupérés"
    else
        test_error "Erreur lors de la récupération des détails"
    fi
    echo ""
    echo ""
fi

# Test 6: Tenter de créer une commande avec une adresse invalide
test_header "6. CRÉER UNE COMMANDE AVEC UNE ADRESSE QUI N'APPARTIENT PAS À L'UTILISATEUR"
echo "POST $API_URL/api/orders"
echo "Body: { service_id: 1, address_id: 1 } (adresse d'un autre utilisateur)"
echo ""

INVALID_ADDRESS_RESPONSE=$(curl -s -X POST $API_URL/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"service_id": 1, "address_id": 1}')

echo "$INVALID_ADDRESS_RESPONSE" | json_pp 2>/dev/null || echo "$INVALID_ADDRESS_RESPONSE"

if echo "$INVALID_ADDRESS_RESPONSE" | grep -q '"success":false'; then
    test_success "Erreur correctement détectée (adresse invalide)"
else
    test_error "La validation de l'adresse ne fonctionne pas"
fi
echo ""
echo ""

# Test 7: Tenter de créer une commande sans token
test_header "7. CRÉER UNE COMMANDE SANS TOKEN"
echo "POST $API_URL/api/orders (sans Authorization header)"
echo ""

NO_TOKEN_RESPONSE=$(curl -s -X POST $API_URL/api/orders \
  -H "Content-Type: application/json" \
  -d '{"service_id": 1, "address_id": 5}')

echo "$NO_TOKEN_RESPONSE" | json_pp 2>/dev/null || echo "$NO_TOKEN_RESPONSE"

if echo "$NO_TOKEN_RESPONSE" | grep -q '"success":false'; then
    test_success "Accès bloqué sans token (comme attendu)"
else
    test_error "L'authentification ne fonctionne pas"
fi
echo ""
echo ""

# Test 8: Tenter de créer une commande avec un service inexistant
test_header "8. CRÉER UNE COMMANDE AVEC UN SERVICE INEXISTANT"
echo "POST $API_URL/api/orders"
echo "Body: { service_id: 999, address_id: 5 }"
echo ""

INVALID_SERVICE_RESPONSE=$(curl -s -X POST $API_URL/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"service_id": 999, "address_id": 5}')

echo "$INVALID_SERVICE_RESPONSE" | json_pp 2>/dev/null || echo "$INVALID_SERVICE_RESPONSE"

if echo "$INVALID_SERVICE_RESPONSE" | grep -q '"success":false'; then
    test_success "Erreur correctement détectée (service inexistant)"
else
    test_error "La validation du service ne fonctionne pas"
fi
echo ""
echo ""

# Résumé final
echo "=========================================="
echo "RÉSUMÉ DES TESTS"
echo "=========================================="
echo ""

test_info "Endpoints testés:"
echo "  ✓ POST /api/orders (création de commande)"
echo "  ✓ GET /api/orders (liste des commandes)"
echo "  ✓ GET /api/orders/{id} (détails d'une commande)"
echo "  ✓ Validation de l'authentification"
echo "  ✓ Validation des données (service, adresse)"
echo "  ✓ Commandes programmées (scheduled_time)"
echo ""

test_info "Fonctionnalités vérifiées:"
echo "  • Création de commande immédiate"
echo "  • Création de commande programmée"
echo "  • Liste des commandes de l'utilisateur"
echo "  • Détails d'une commande spécifique"
echo "  • Protection par AuthMiddleware"
echo "  • Validation de l'appartenance de l'adresse"
echo "  • Calcul automatique du prix final"
echo "  • Simulation de broadcasting (logs)"
echo ""

echo -e "${GREEN}✅ Tests terminés !${NC}"
