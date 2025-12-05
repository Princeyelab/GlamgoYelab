#!/bin/bash

echo "=========================================="
echo "Test des Endpoints Prestataires"
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

# Test 1: Lister les commandes en attente
test_header "1. LISTER LES COMMANDES EN ATTENTE"
echo "GET $API_URL/api/provider/pending-orders"
echo ""

PENDING_ORDERS_RESPONSE=$(curl -s -X GET $API_URL/api/provider/pending-orders)

echo "$PENDING_ORDERS_RESPONSE" | json_pp 2>/dev/null || echo "$PENDING_ORDERS_RESPONSE"

PENDING_COUNT=$(echo "$PENDING_ORDERS_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ ! -z "$PENDING_COUNT" ]; then
    test_success "Trouvé $PENDING_COUNT commande(s) en attente"
else
    test_error "Erreur lors de la récupération des commandes"
fi
echo ""
echo ""

# Test 2: Créer une nouvelle commande pour les tests
test_header "2. CRÉER UNE NOUVELLE COMMANDE POUR LES TESTS"
echo "Connexion et création d'une commande..."
echo ""

# Se connecter
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser1@test.com", "password": "password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    test_error "Impossible de se connecter"
else
    # Créer une commande (service 5 = Débouchage canalisation)
    CREATE_ORDER_RESPONSE=$(curl -s -X POST $API_URL/api/orders \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"service_id": 5, "address_id": 5}')

    NEW_ORDER_ID=$(echo "$CREATE_ORDER_RESPONSE" | grep -o '"order_id":[0-9]*' | grep -o '[0-9]*' | head -1)

    if [ ! -z "$NEW_ORDER_ID" ]; then
        test_success "Commande créée avec succès (ID: $NEW_ORDER_ID)"
    else
        test_error "Erreur lors de la création de la commande"
    fi
fi
echo ""
echo ""

# Test 3: Accepter une commande
test_header "3. ACCEPTER UNE COMMANDE"
echo "POST $API_URL/api/provider/orders/$NEW_ORDER_ID/accept"
echo "Body: { provider_id: 1 }"
echo ""

ACCEPT_RESPONSE=$(curl -s -X POST $API_URL/api/provider/orders/$NEW_ORDER_ID/accept \
  -H "Content-Type: application/json" \
  -d '{"provider_id": 1}')

echo "$ACCEPT_RESPONSE" | json_pp 2>/dev/null || echo "$ACCEPT_RESPONSE"

if echo "$ACCEPT_RESPONSE" | grep -q '"status":"accepted"'; then
    test_success "Commande acceptée avec succès"
    ACCEPTED_ORDER_ID=$NEW_ORDER_ID
else
    test_error "Erreur lors de l'acceptation de la commande"
fi
echo ""
echo ""

# Test 4: Tenter d'accepter une commande déjà acceptée
test_header "4. TENTER D'ACCEPTER UNE COMMANDE DÉJÀ ACCEPTÉE"
echo "POST $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/accept"
echo ""

DOUBLE_ACCEPT_RESPONSE=$(curl -s -X POST $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/accept \
  -H "Content-Type: application/json" \
  -d '{"provider_id": 1}')

echo "$DOUBLE_ACCEPT_RESPONSE" | json_pp 2>/dev/null || echo "$DOUBLE_ACCEPT_RESPONSE"

if echo "$DOUBLE_ACCEPT_RESPONSE" | grep -q '"success":false'; then
    test_success "Erreur correctement détectée (commande déjà acceptée)"
else
    test_error "La validation ne fonctionne pas"
fi
echo ""
echo ""

# Test 5: Mettre à jour le statut d'une commande
test_header "5. METTRE À JOUR LE STATUT D'UNE COMMANDE"
echo "PUT $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/status"
echo "Body: { provider_id: 1, status: 'en_route' }"
echo ""

UPDATE_STATUS_RESPONSE=$(curl -s -X PUT $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"provider_id": 1, "status": "en_route"}')

echo "$UPDATE_STATUS_RESPONSE" | json_pp 2>/dev/null || echo "$UPDATE_STATUS_RESPONSE"

if echo "$UPDATE_STATUS_RESPONSE" | grep -q '"status":"en_route"'; then
    test_success "Statut mis à jour avec succès"
else
    test_error "Erreur lors de la mise à jour du statut"
fi
echo ""
echo ""

# Test 6: Mettre à jour le statut à 'in_progress'
test_header "6. METTRE À JOUR LE STATUT À 'IN_PROGRESS'"
echo "PUT $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/status"
echo "Body: { provider_id: 1, status: 'in_progress' }"
echo ""

UPDATE_PROGRESS_RESPONSE=$(curl -s -X PUT $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"provider_id": 1, "status": "in_progress"}')

echo "$UPDATE_PROGRESS_RESPONSE" | json_pp 2>/dev/null || echo "$UPDATE_PROGRESS_RESPONSE"

if echo "$UPDATE_PROGRESS_RESPONSE" | grep -q '"status":"in_progress"'; then
    test_success "Statut changé à 'in_progress'"
else
    test_error "Erreur lors de la mise à jour"
fi
echo ""
echo ""

# Test 7: Compléter la commande
test_header "7. COMPLÉTER LA COMMANDE"
echo "PUT $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/status"
echo "Body: { provider_id: 1, status: 'completed' }"
echo ""

COMPLETE_RESPONSE=$(curl -s -X PUT $API_URL/api/provider/orders/$ACCEPTED_ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"provider_id": 1, "status": "completed"}')

echo "$COMPLETE_RESPONSE" | json_pp 2>/dev/null || echo "$COMPLETE_RESPONSE"

if echo "$COMPLETE_RESPONSE" | grep -q '"status":"completed"'; then
    test_success "Commande complétée avec succès"
else
    test_error "Erreur lors de la complétion"
fi
echo ""
echo ""

# Test 8: Lister les commandes du prestataire
test_header "8. LISTER LES COMMANDES DU PRESTATAIRE"
echo "GET $API_URL/api/provider/my-orders"
echo ""

MY_ORDERS_RESPONSE=$(curl -s -X GET $API_URL/api/provider/my-orders \
  -H "Content-Type: application/json" \
  -d '{"provider_id": 1}')

echo "$MY_ORDERS_RESPONSE" | json_pp 2>/dev/null | head -50 || echo "$MY_ORDERS_RESPONSE" | head -30

MY_ORDERS_COUNT=$(echo "$MY_ORDERS_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ ! -z "$MY_ORDERS_COUNT" ]; then
    test_success "Trouvé $MY_ORDERS_COUNT commande(s) du prestataire"
else
    test_error "Erreur lors de la récupération des commandes"
fi
echo ""
echo ""

# Résumé final
echo "=========================================="
echo "RÉSUMÉ DES TESTS"
echo "=========================================="
echo ""

test_info "Endpoints testés:"
echo "  ✓ GET /api/provider/pending-orders"
echo "  ✓ POST /api/provider/orders/{id}/accept"
echo "  ✓ GET /api/provider/my-orders"
echo "  ✓ PUT /api/provider/orders/{id}/status"
echo ""

test_info "Fonctionnalités vérifiées:"
echo "  • Liste des commandes en attente"
echo "  • Acceptation de commande (changement statut + provider_id)"
echo "  • Validation : commande déjà acceptée"
echo "  • Mise à jour du statut (en_route, in_progress, completed)"
echo "  • Liste des commandes du prestataire"
echo "  • Cycle de vie complet d'une commande"
echo ""

test_info "Cycle de vie d'une commande:"
echo "  pending → accepted → en_route → in_progress → completed"
echo ""

echo -e "${GREEN}✅ Tests terminés !${NC}"
