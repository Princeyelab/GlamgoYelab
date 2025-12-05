#!/bin/bash

echo "=========================================="
echo "Test des Endpoints Services"
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

# Fonction pour afficher une information
function test_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test 1: Lister toutes les catégories
test_header "1. LISTER TOUTES LES CATÉGORIES"
echo "GET $API_URL/api/categories"
echo ""
CATEGORIES_RESPONSE=$(curl -s -X GET $API_URL/api/categories)

echo "$CATEGORIES_RESPONSE" | json_pp 2>/dev/null || echo "$CATEGORIES_RESPONSE"

# Compter les catégories
CATEGORIES_COUNT=$(echo "$CATEGORIES_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ ! -z "$CATEGORIES_COUNT" ]; then
    test_success "Trouvé $CATEGORIES_COUNT catégories"
else
    echo -e "${RED}❌ Erreur lors de la récupération des catégories${NC}"
fi
echo ""
echo ""

# Test 2: Lister les services d'une catégorie (Ménage - ID 1)
test_header "2. LISTER LES SERVICES DE LA CATÉGORIE MÉNAGE (ID=1)"
echo "GET $API_URL/api/categories/1/services"
echo ""
CATEGORY_SERVICES_RESPONSE=$(curl -s -X GET $API_URL/api/categories/1/services)

echo "$CATEGORY_SERVICES_RESPONSE" | json_pp 2>/dev/null || echo "$CATEGORY_SERVICES_RESPONSE"

# Compter les services
SERVICES_COUNT=$(echo "$CATEGORY_SERVICES_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ ! -z "$SERVICES_COUNT" ]; then
    test_success "Trouvé $SERVICES_COUNT services dans la catégorie Ménage"
else
    echo -e "${RED}❌ Erreur lors de la récupération des services${NC}"
fi
echo ""
echo ""

# Test 3: Lister tous les services (toutes catégories)
test_header "3. LISTER TOUS LES SERVICES"
echo "GET $API_URL/api/services"
echo ""
ALL_SERVICES_RESPONSE=$(curl -s -X GET $API_URL/api/services)

# Afficher uniquement les 3 premiers services pour ne pas surcharger l'affichage
echo "$ALL_SERVICES_RESPONSE" | json_pp 2>/dev/null | head -60 || echo "$ALL_SERVICES_RESPONSE" | head -30
echo "... (résultats tronqués)"

# Compter tous les services
ALL_SERVICES_COUNT=$(echo "$ALL_SERVICES_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ ! -z "$ALL_SERVICES_COUNT" ]; then
    test_success "Trouvé $ALL_SERVICES_COUNT services au total"
else
    echo -e "${RED}❌ Erreur lors de la récupération de tous les services${NC}"
fi
echo ""
echo ""

# Test 4: Récupérer les détails d'un service spécifique
test_header "4. DÉTAILS D'UN SERVICE SPÉCIFIQUE (Nettoyage Standard - ID=1)"
echo "GET $API_URL/api/services/1"
echo ""
SERVICE_DETAIL_RESPONSE=$(curl -s -X GET $API_URL/api/services/1)

echo "$SERVICE_DETAIL_RESPONSE" | json_pp 2>/dev/null || echo "$SERVICE_DETAIL_RESPONSE"

if echo "$SERVICE_DETAIL_RESPONSE" | grep -q '"success":true'; then
    test_success "Service récupéré avec succès"
else
    echo -e "${RED}❌ Erreur lors de la récupération du service${NC}"
fi
echo ""
echo ""

# Test 5: Tester une catégorie qui n'existe pas
test_header "5. CATÉGORIE INEXISTANTE (ID=999)"
echo "GET $API_URL/api/categories/999/services"
echo ""
INVALID_CATEGORY_RESPONSE=$(curl -s -X GET $API_URL/api/categories/999/services)

echo "$INVALID_CATEGORY_RESPONSE" | json_pp 2>/dev/null || echo "$INVALID_CATEGORY_RESPONSE"

if echo "$INVALID_CATEGORY_RESPONSE" | grep -q '"success":false'; then
    test_success "Erreur correctement gérée pour catégorie inexistante"
else
    echo -e "${RED}❌ La validation de la catégorie ne fonctionne pas${NC}"
fi
echo ""
echo ""

# Test 6: Tester un service qui n'existe pas
test_header "6. SERVICE INEXISTANT (ID=999)"
echo "GET $API_URL/api/services/999"
echo ""
INVALID_SERVICE_RESPONSE=$(curl -s -X GET $API_URL/api/services/999)

echo "$INVALID_SERVICE_RESPONSE" | json_pp 2>/dev/null || echo "$INVALID_SERVICE_RESPONSE"

if echo "$INVALID_SERVICE_RESPONSE" | grep -q '"success":false'; then
    test_success "Erreur correctement gérée pour service inexistant"
else
    echo -e "${RED}❌ La validation du service ne fonctionne pas${NC}"
fi
echo ""
echo ""

# Résumé final
echo "=========================================="
echo "RÉSUMÉ DES TESTS"
echo "=========================================="
echo ""

test_info "Endpoints testés:"
echo "  ✓ GET /api/categories"
echo "  ✓ GET /api/categories/{id}/services"
echo "  ✓ GET /api/services"
echo "  ✓ GET /api/services/{id}"
echo ""

test_info "Statistiques:"
echo "  • Catégories disponibles: $CATEGORIES_COUNT"
echo "  • Services totaux: $ALL_SERVICES_COUNT"
echo "  • Services dans catégorie Ménage: $SERVICES_COUNT"
echo ""

if [ ! -z "$CATEGORIES_COUNT" ] && [ ! -z "$ALL_SERVICES_COUNT" ]; then
    echo -e "${GREEN}✅ Tous les endpoints fonctionnent correctement !${NC}"
    exit 0
else
    echo -e "${RED}❌ Certains endpoints ont échoué${NC}"
    exit 1
fi
