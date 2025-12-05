#!/bin/bash

echo "=========================================="
echo "Test du Middleware d'Authentification"
echo "Marrakech Services API"
echo "=========================================="
echo ""

API_URL="http://localhost:8081"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# Fonction pour afficher un échec
function test_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Se connecter pour obtenir un token valide
test_header "1. CONNEXION POUR OBTENIR UN TOKEN"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | json_pp 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extraire le token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    test_error "Token non reçu lors de la connexion"
    echo ""
    echo "❌ Impossible de continuer les tests sans token"
    exit 1
fi

test_success "Token reçu: ${TOKEN:0:50}..."
echo ""
echo ""

# Test 2: Accès au profil AVEC token (devrait fonctionner grâce au middleware)
test_header "2. ACCÈS AU PROFIL AVEC TOKEN VALIDE"
echo "Le middleware devrait valider le token et autoriser l'accès"
echo ""
PROFILE_RESPONSE=$(curl -s -X GET $API_URL/api/profile \
  -H "Authorization: Bearer $TOKEN")

echo "$PROFILE_RESPONSE" | json_pp 2>/dev/null || echo "$PROFILE_RESPONSE"

# Vérifier si la requête a réussi
if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
    test_success "Accès autorisé avec token valide"
else
    test_error "Accès refusé alors que le token est valide"
fi
echo ""
echo ""

# Test 3: Accès au profil SANS token (devrait échouer)
test_header "3. ACCÈS AU PROFIL SANS TOKEN"
echo "Le middleware devrait bloquer l'accès et retourner 401"
echo ""
NO_TOKEN_RESPONSE=$(curl -s -X GET $API_URL/api/profile)

echo "$NO_TOKEN_RESPONSE" | json_pp 2>/dev/null || echo "$NO_TOKEN_RESPONSE"

# Vérifier si la requête a échoué avec 401
if echo "$NO_TOKEN_RESPONSE" | grep -q '"success":false'; then
    test_success "Accès bloqué sans token (comme attendu)"
else
    test_error "Accès autorisé sans token (le middleware ne fonctionne pas)"
fi
echo ""
echo ""

# Test 4: Accès au profil avec token INVALIDE (devrait échouer)
test_header "4. ACCÈS AU PROFIL AVEC TOKEN INVALIDE"
echo "Le middleware devrait détecter le token invalide et retourner 401"
echo ""
INVALID_TOKEN_RESPONSE=$(curl -s -X GET $API_URL/api/profile \
  -H "Authorization: Bearer invalid_token_12345")

echo "$INVALID_TOKEN_RESPONSE" | json_pp 2>/dev/null || echo "$INVALID_TOKEN_RESPONSE"

# Vérifier si la requête a échoué
if echo "$INVALID_TOKEN_RESPONSE" | grep -q '"success":false'; then
    test_success "Accès bloqué avec token invalide (comme attendu)"
else
    test_error "Accès autorisé avec token invalide (le middleware ne fonctionne pas)"
fi
echo ""
echo ""

# Test 5: Accès au profil avec token EXPIRÉ (simulé avec un mauvais format)
test_header "5. ACCÈS AU PROFIL AVEC TOKEN MAL FORMATÉ"
echo "Le middleware devrait détecter le format invalide et retourner 401"
echo ""
MALFORMED_TOKEN_RESPONSE=$(curl -s -X GET $API_URL/api/profile \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc")

echo "$MALFORMED_TOKEN_RESPONSE" | json_pp 2>/dev/null || echo "$MALFORMED_TOKEN_RESPONSE"

# Vérifier si la requête a échoué
if echo "$MALFORMED_TOKEN_RESPONSE" | grep -q '"success":false'; then
    test_success "Accès bloqué avec token mal formaté (comme attendu)"
else
    test_error "Accès autorisé avec token mal formaté (le middleware ne fonctionne pas)"
fi
echo ""
echo ""

# Test 6: Accès à une route publique (login) sans token (devrait fonctionner)
test_header "6. ACCÈS À UNE ROUTE PUBLIQUE (LOGIN) SANS TOKEN"
echo "Les routes publiques ne devraient pas nécessiter de middleware"
echo ""
PUBLIC_ROUTE_RESPONSE=$(curl -s -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "password123"
  }')

echo "$PUBLIC_ROUTE_RESPONSE" | json_pp 2>/dev/null || echo "$PUBLIC_ROUTE_RESPONSE"

# Vérifier si la requête a réussi
if echo "$PUBLIC_ROUTE_RESPONSE" | grep -q '"success":true'; then
    test_success "Route publique accessible sans token"
else
    test_error "Route publique bloquée (ne devrait pas être protégée)"
fi
echo ""
echo ""

# Test 7: Vérifier que le middleware stocke l'utilisateur dans les globals
test_header "7. VÉRIFICATION DES DONNÉES UTILISATEUR (via middleware)"
echo "Le middleware devrait charger les données utilisateur dans le contrôleur"
echo ""

# On vérifie que le profil retourné contient bien les données de l'utilisateur
if echo "$PROFILE_RESPONSE" | grep -q '"email":"user1@test.com"'; then
    test_success "Les données utilisateur sont correctement chargées par le middleware"
else
    test_error "Les données utilisateur ne sont pas chargées correctement"
fi
echo ""
echo ""

# Test 8: Test avec un header Authorization mal formaté (sans "Bearer")
test_header "8. HEADER AUTHORIZATION MAL FORMATÉ (sans 'Bearer')"
echo "Le middleware devrait rejeter les headers sans préfixe 'Bearer'"
echo ""
BAD_HEADER_RESPONSE=$(curl -s -X GET $API_URL/api/profile \
  -H "Authorization: $TOKEN")

echo "$BAD_HEADER_RESPONSE" | json_pp 2>/dev/null || echo "$BAD_HEADER_RESPONSE"

# Vérifier si la requête a échoué
if echo "$BAD_HEADER_RESPONSE" | grep -q '"success":false'; then
    test_success "Header mal formaté rejeté (comme attendu)"
else
    test_error "Header mal formaté accepté (devrait être rejeté)"
fi
echo ""
echo ""

# Résumé final
echo "=========================================="
echo "RÉSUMÉ DES TESTS"
echo "=========================================="
echo ""

# Compter les succès et échecs
SUCCESS_COUNT=0
ERROR_COUNT=0

# Test 2
if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
    ((SUCCESS_COUNT++))
else
    ((ERROR_COUNT++))
fi

# Test 3
if echo "$NO_TOKEN_RESPONSE" | grep -q '"success":false'; then
    ((SUCCESS_COUNT++))
else
    ((ERROR_COUNT++))
fi

# Test 4
if echo "$INVALID_TOKEN_RESPONSE" | grep -q '"success":false'; then
    ((SUCCESS_COUNT++))
else
    ((ERROR_COUNT++))
fi

# Test 5
if echo "$MALFORMED_TOKEN_RESPONSE" | grep -q '"success":false'; then
    ((SUCCESS_COUNT++))
else
    ((ERROR_COUNT++))
fi

# Test 6
if echo "$PUBLIC_ROUTE_RESPONSE" | grep -q '"success":true'; then
    ((SUCCESS_COUNT++))
else
    ((ERROR_COUNT++))
fi

# Test 7
if echo "$PROFILE_RESPONSE" | grep -q '"email":"user1@test.com"'; then
    ((SUCCESS_COUNT++))
else
    ((ERROR_COUNT++))
fi

# Test 8
if echo "$BAD_HEADER_RESPONSE" | grep -q '"success":false'; then
    ((SUCCESS_COUNT++))
else
    ((ERROR_COUNT++))
fi

echo -e "${GREEN}Tests réussis: $SUCCESS_COUNT${NC}"
echo -e "${RED}Tests échoués: $ERROR_COUNT${NC}"
echo ""

if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests du middleware ont réussi !${NC}"
    exit 0
else
    echo -e "${RED}❌ Certains tests ont échoué. Vérifiez l'implémentation du middleware.${NC}"
    exit 1
fi
