#!/bin/bash

# =====================================================
# TEST DU SYSTÈME D'ENCHÈRES (BIDDING)
# =====================================================
# Teste toutes les nouvelles routes du système InDrive-style
# =====================================================

set -e  # Arrêter dès la première erreur

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8080/api"
TIMESTAMP=$(date +%s)
TEST_USER_EMAIL="bidding_user_${TIMESTAMP}@glamgo.test"
TEST_PROVIDER1_EMAIL="provider1_${TIMESTAMP}@glamgo.test"
TEST_PROVIDER2_EMAIL="provider2_${TIMESTAMP}@glamgo.test"
TEST_PROVIDER3_EMAIL="provider3_${TIMESTAMP}@glamgo.test"
TEST_PASSWORD="TestPassword123!"

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=12

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎯 TEST DU SYSTÈME D'ENCHÈRES (BIDDING)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}API URL:${NC} $API_URL"
echo -e "${YELLOW}Timestamp:${NC} $TIMESTAMP"
echo ""

# Fonction pour afficher le résultat d'un test
test_result() {
    local test_name="$1"
    local http_code="$2"
    local expected_code="$3"

    if [ "$http_code" == "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name (HTTP $http_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name (HTTP $http_code, attendu $expected_code)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Fonction pour extraire une valeur JSON (simple)
extract_json_value() {
    local json="$1"
    local key="$2"
    echo "$json" | grep -oP "\"$key\":\s*\"?[^,}\"]*\"?" | sed "s/\"$key\":\s*\"\?\([^,}\"]*\)\"\?/\1/"
}

# =====================================================
# SETUP : Créer utilisateur et prestataires
# =====================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📦 SETUP : Création des comptes de test${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Créer utilisateur
echo -e "${YELLOW}Création utilisateur...${NC}"

TEMP_USER=$(mktemp)
cat > "$TEMP_USER" <<EOF
{
  "email": "$TEST_USER_EMAIL",
  "password": "$TEST_PASSWORD",
  "first_name": "User",
  "last_name": "Test",
  "phone": "0612345678"
}
EOF

USER_REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    --data-binary "@$TEMP_USER")

rm -f "$TEMP_USER"

HTTP_CODE=$(echo "$USER_REGISTER" | tail -n1)
test_result "Inscription utilisateur" "$HTTP_CODE" "201" || exit 1

USER_TOKEN=$(echo "$USER_REGISTER" | sed '$d' | grep -oP '"token":\s*"[^"]*"' | sed 's/"token":\s*"\(.*\)"/\1/')
USER_ID=$(echo "$USER_REGISTER" | sed '$d' | grep -oP '"id":\s*\d+' | head -1 | sed 's/"id":\s*//')
echo -e "${GREEN}✓ User ID: $USER_ID${NC}"
echo ""

# Créer 3 prestataires
for i in 1 2 3; do
    eval PROVIDER_EMAIL=\$TEST_PROVIDER${i}_EMAIL
    echo -e "${YELLOW}Création prestataire $i...${NC}"

    TEMP_PROVIDER=$(mktemp)
    cat > "$TEMP_PROVIDER" <<EOF
{
  "email": "$PROVIDER_EMAIL",
  "password": "$TEST_PASSWORD",
  "first_name": "Provider",
  "last_name": "Test$i",
  "phone": "06123456$(($i+70))",
  "company_name": "Company Test $i"
}
EOF

    PROVIDER_REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/provider/register" \
        -H "Content-Type: application/json" \
        --data-binary "@$TEMP_PROVIDER")

    rm -f "$TEMP_PROVIDER"

    HTTP_CODE=$(echo "$PROVIDER_REGISTER" | tail -n1)
    test_result "Inscription prestataire $i" "$HTTP_CODE" "201" || exit 1

    eval PROVIDER${i}_TOKEN=$(echo "$PROVIDER_REGISTER" | sed '$d' | grep -oP '"token":\s*"[^"]*"' | sed 's/"token":\s*"\(.*\)"/\1/')
    eval PROVIDER${i}_ID=$(echo "$PROVIDER_REGISTER" | sed '$d' | grep -oP '"id":\s*\d+' | head -1 | sed 's/"id":\s*//')

    echo -e "${GREEN}✓ Provider $i ID: $(eval echo \$PROVIDER${i}_ID)${NC}"
done
echo ""

# Récupérer un service disponible
echo -e "${YELLOW}Récupération d'un service...${NC}"
SERVICES=$(curl -s "$API_URL/services")
SERVICE_ID=$(echo "$SERVICES" | grep -oP '"id":\s*\d+' | head -1 | sed 's/"id":\s*//')
SERVICE_NAME=$(echo "$SERVICES" | grep -oP '"name":\s*"[^"]*"' | head -1 | sed 's/"name":\s*"\(.*\)"/\1/')
MIN_PRICE=$(echo "$SERVICES" | grep -oP '"min_suggested_price":\s*"?[0-9.]+"?' | head -1 | sed 's/"min_suggested_price":\s*"\?\([0-9.]*\)"\?/\1/')
MAX_PRICE=$(echo "$SERVICES" | grep -oP '"max_suggested_price":\s*"?[0-9.]+"?' | head -1 | sed 's/"max_suggested_price":\s*"\?\([0-9.]*\)"\?/\1/')

echo -e "${GREEN}✓ Service #$SERVICE_ID - $SERVICE_NAME${NC}"
echo -e "${GREEN}✓ Fourchette: ${MIN_PRICE}-${MAX_PRICE} MAD${NC}"
echo ""

# Ajouter le service aux profils des prestataires
echo -e "${YELLOW}Ajout du service aux profils prestataires...${NC}"
for i in 1 2 3; do
    eval TOKEN=\$PROVIDER${i}_TOKEN

    TEMP_SERVICE=$(mktemp)
    cat > "$TEMP_SERVICE" <<EOF
{
  "service_id": $SERVICE_ID
}
EOF

    ADD_SERVICE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/provider/services" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        --data-binary "@$TEMP_SERVICE")

    rm -f "$TEMP_SERVICE"

    HTTP_CODE=$(echo "$ADD_SERVICE" | tail -n1)
    if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓ Prestataire $i peut maintenant proposer ce service${NC}"
    else
        echo -e "${RED}✗ Erreur ajout service prestataire $i (HTTP $HTTP_CODE)${NC}"
        exit 1
    fi
done
echo ""

# =====================================================
# TEST 1 : Créer commande en mode BIDDING
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 1/12 : Créer commande en mode BIDDING${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

PROPOSED_PRICE=100

TEMP_JSON=$(mktemp)
cat > "$TEMP_JSON" <<EOF
{
  "service_id": $SERVICE_ID,
  "user_proposed_price": $PROPOSED_PRICE,
  "address": "456 Avenue de la Liberté, Marrakech",
  "notes": "Test du système d'enchères",
  "bid_expiry_hours": 24
}
EOF

echo -e "${YELLOW}Payload:${NC} $(cat $TEMP_JSON)"

BIDDING_ORDER=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/orders/bidding" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    --data-binary "@$TEMP_JSON")

rm -f "$TEMP_JSON"

HTTP_CODE=$(echo "$BIDDING_ORDER" | tail -n1)
RESPONSE_BODY=$(echo "$BIDDING_ORDER" | sed '$d')

test_result "POST /api/orders/bidding" "$HTTP_CODE" "201" || {
    echo -e "${RED}Réponse:${NC} $RESPONSE_BODY"
    exit 1
}

ORDER_ID=$(echo "$RESPONSE_BODY" | grep -oP '"id":\s*\d+' | head -1 | sed 's/"id":\s*//')
ORDER_PRICING_MODE=$(echo "$RESPONSE_BODY" | grep -oP '"pricing_mode":\s*"[^"]*"' | sed 's/"pricing_mode":\s*"\(.*\)"/\1/')

echo -e "${CYAN}Order ID: $ORDER_ID${NC}"
echo -e "${CYAN}Pricing Mode: $ORDER_PRICING_MODE${NC}"
echo ""

# =====================================================
# TEST 2 : Vérifier pricing_mode='bidding'
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 2/12 : Vérifier pricing_mode='bidding'${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$ORDER_PRICING_MODE" == "bidding" ]; then
    echo -e "${GREEN}✅ PASS${NC} - pricing_mode = 'bidding' (correct)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - pricing_mode = '$ORDER_PRICING_MODE' (attendu 'bidding')"
    ((TESTS_FAILED++))
    exit 1
fi
echo ""

# =====================================================
# TEST 3-5 : Créer 3 offres de prestataires différents
# =====================================================
declare -a BID_IDS
declare -a BID_PRICES

for i in 1 2 3; do
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}TEST $((i+2))/12 : Créer offre prestataire $i${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Prix différents : 90, 85, 95
    BID_PRICE=$((95 - (i * 5)))
    BID_PRICES[$i]=$BID_PRICE

    eval PROVIDER_TOKEN=\$PROVIDER${i}_TOKEN

    TEMP_BID=$(mktemp)
    cat > "$TEMP_BID" <<EOF
{
  "order_id": $ORDER_ID,
  "proposed_price": $BID_PRICE,
  "estimated_arrival_minutes": $((15 + i * 5)),
  "message": "Offre du prestataire $i"
}
EOF

    echo -e "${YELLOW}Payload:${NC} $(cat $TEMP_BID)"

    BID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/bids" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROVIDER_TOKEN" \
        --data-binary "@$TEMP_BID")

    rm -f "$TEMP_BID"

    HTTP_CODE=$(echo "$BID_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$BID_RESPONSE" | sed '$d')

    test_result "POST /api/bids (Provider $i - ${BID_PRICE} MAD)" "$HTTP_CODE" "201" || {
        echo -e "${RED}Réponse:${NC} $RESPONSE_BODY"
        exit 1
    }

    BID_ID=$(echo "$RESPONSE_BODY" | grep -oP '"id":\s*\d+' | head -1 | sed 's/"id":\s*//')
    BID_IDS[$i]=$BID_ID

    echo -e "${CYAN}Bid ID: $BID_ID - Prix: ${BID_PRICE} MAD${NC}"
    echo ""
done

# =====================================================
# TEST 6 : Récupérer toutes les offres
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 6/12 : Récupérer les offres de la commande${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

GET_BIDS=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/orders/$ORDER_ID/bids" \
    -H "Authorization: Bearer $USER_TOKEN")

HTTP_CODE=$(echo "$GET_BIDS" | tail -n1)
RESPONSE_BODY=$(echo "$GET_BIDS" | sed '$d')

test_result "GET /api/orders/$ORDER_ID/bids" "$HTTP_CODE" "200" || {
    echo -e "${RED}Réponse:${NC} $RESPONSE_BODY"
    exit 1
}

TOTAL_BIDS=$(echo "$RESPONSE_BODY" | grep -oP '"total_bids":\s*\d+' | sed 's/"total_bids":\s*//')
echo -e "${CYAN}Total offres: $TOTAL_BIDS${NC}"

if [ "$TOTAL_BIDS" == "3" ]; then
    echo -e "${GREEN}✓ 3 offres reçues (correct)${NC}"
else
    echo -e "${RED}✗ Nombre d'offres incorrect (attendu 3, reçu $TOTAL_BIDS)${NC}"
fi
echo ""

# =====================================================
# TEST 7 : Accepter la meilleure offre (85 MAD)
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 7/12 : Accepter la meilleure offre${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# La meilleure offre est Provider 2 (85 MAD)
BEST_BID_ID=${BID_IDS[2]}
BEST_BID_PRICE=${BID_PRICES[2]}

echo -e "${YELLOW}Acceptation offre #$BEST_BID_ID (${BEST_BID_PRICE} MAD)${NC}"

ACCEPT_BID=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/bids/$BEST_BID_ID/accept" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN")

HTTP_CODE=$(echo "$ACCEPT_BID" | tail -n1)
RESPONSE_BODY=$(echo "$ACCEPT_BID" | sed '$d')

test_result "PUT /api/bids/$BEST_BID_ID/accept" "$HTTP_CODE" "200" || {
    echo -e "${RED}Réponse:${NC} $RESPONSE_BODY"
    exit 1
}

echo -e "${GREEN}✓ Offre acceptée${NC}"
echo ""

# =====================================================
# TEST 8 : Vérifier status de la commande = 'accepted'
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 8/12 : Vérifier status='accepted' (SQL)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ORDER_STATUS=$(docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo \
    -se "SELECT status FROM orders WHERE id=$ORDER_ID" 2>/dev/null || echo "ERROR")

if [ "$ORDER_STATUS" == "accepted" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Order status = 'accepted'"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Order status = '$ORDER_STATUS' (attendu 'accepted')"
    ((TESTS_FAILED++))
fi
echo ""

# =====================================================
# TEST 9 : Vérifier prix final = prix de l'offre acceptée
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 9/12 : Vérifier prix final = ${BEST_BID_PRICE} MAD${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

FINAL_PRICE=$(docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo \
    -se "SELECT price FROM orders WHERE id=$ORDER_ID" 2>/dev/null || echo "ERROR")

if [ "$FINAL_PRICE" == "$BEST_BID_PRICE.00" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Prix final = $FINAL_PRICE MAD"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Prix final = $FINAL_PRICE MAD (attendu $BEST_BID_PRICE.00)"
    ((TESTS_FAILED++))
fi
echo ""

# =====================================================
# TEST 10 : Vérifier offre acceptée status='accepted'
# =====================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 10/12 : Vérifier bid accepté status='accepted'${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ACCEPTED_BID_STATUS=$(docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo \
    -se "SELECT status FROM bids WHERE id=$BEST_BID_ID" 2>/dev/null || echo "ERROR")

if [ "$ACCEPTED_BID_STATUS" == "accepted" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Bid #$BEST_BID_ID status = 'accepted'"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Bid #$BEST_BID_ID status = '$ACCEPTED_BID_STATUS'"
    ((TESTS_FAILED++))
fi
echo ""

# =====================================================
# TEST 11-12 : Vérifier autres offres status='rejected'
# =====================================================
for i in 1 3; do
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}TEST $((9+i))/12 : Vérifier bid $i status='rejected'${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    BID_ID=${BID_IDS[$i]}
    BID_STATUS=$(docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo \
        -se "SELECT status FROM bids WHERE id=$BID_ID" 2>/dev/null || echo "ERROR")

    if [ "$BID_STATUS" == "rejected" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Bid #$BID_ID status = 'rejected'"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - Bid #$BID_ID status = '$BID_STATUS' (attendu 'rejected')"
        ((TESTS_FAILED++))
    fi
    echo ""
done

# =====================================================
# RÉSUMÉ FINAL
# =====================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 RÉSUMÉ DES TESTS - SYSTÈME D'ENCHÈRES${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Tests réussis :${NC} $TESTS_PASSED / $TOTAL_TESTS"
echo -e "${RED}❌ Tests échoués :${NC} $TESTS_FAILED / $TOTAL_TESTS"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 TOUS LES TESTS SONT PASSÉS${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}✅ Le système d'enchères fonctionne parfaitement${NC}"
    echo -e "${GREEN}✅ Commande créée en mode bidding${NC}"
    echo -e "${GREEN}✅ 3 offres créées et récupérées${NC}"
    echo -e "${GREEN}✅ Meilleure offre acceptée (${BEST_BID_PRICE} MAD)${NC}"
    echo -e "${GREEN}✅ Autres offres automatiquement rejetées${NC}"
    echo -e "${GREEN}✅ Prix final correctement mis à jour${NC}"
    echo ""
    echo -e "${CYAN}📦 Données de test :${NC}"
    echo -e "${CYAN}  • Order ID: $ORDER_ID${NC}"
    echo -e "${CYAN}  • Service: #$SERVICE_ID - $SERVICE_NAME${NC}"
    echo -e "${CYAN}  • Prix proposé user: $PROPOSED_PRICE MAD${NC}"
    echo -e "${CYAN}  • Offres reçues: ${BID_PRICES[1]}, ${BID_PRICES[2]}, ${BID_PRICES[3]} MAD${NC}"
    echo -e "${CYAN}  • Prix final: ${BEST_BID_PRICE} MAD${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ DES TESTS ONT ÉCHOUÉ${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${RED}⚠️  Le système d'enchères ne fonctionne pas correctement${NC}"
    echo ""
    echo -e "${YELLOW}Vérifiez :${NC}"
    echo "  1. BiddingController.php est bien créé"
    echo "  2. Les routes sont bien ajoutées dans api.php"
    echo "  3. Les logs : docker-compose logs php-backend"
    echo ""
    exit 1
fi
