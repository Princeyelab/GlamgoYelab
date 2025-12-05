#!/bin/bash

echo "========================================"
echo "Test de l'Authentification"
echo "Marrakech Services API"
echo "========================================"
echo ""

API_URL="http://localhost:8081"

# Test 1: Inscription
echo "1. TEST INSCRIPTION"
echo "==================="
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser'$(date +%s)'@marrakech.com",
    "password": "password123",
    "first_name": "Hassan",
    "last_name": "Mansouri",
    "phone": "0623456789"
  }')

echo "$REGISTER_RESPONSE" | json_pp 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extraire le token
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Erreur: Token non reçu lors de l'inscription"
    exit 1
fi

echo "✅ Token reçu: ${TOKEN:0:50}..."
echo ""

# Test 2: Récupération du profil avec le token
echo "2. TEST RÉCUPÉRATION PROFIL (avec token)"
echo "========================================="
curl -s -X GET $API_URL/api/profile \
  -H "Authorization: Bearer $TOKEN" | json_pp 2>/dev/null
echo ""
echo ""

# Test 3: Connexion avec les utilisateurs de test
echo "3. TEST CONNEXION (utilisateur existant)"
echo "========================================="
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | json_pp 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""
echo ""

# Test 4: Erreur de connexion (mauvais mot de passe)
echo "4. TEST ERREUR CONNEXION (mauvais password)"
echo "============================================"
curl -s -X POST $API_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "wrongpassword"
  }' | json_pp 2>/dev/null
echo ""
echo ""

# Test 5: Vérification du token
echo "5. TEST VÉRIFICATION TOKEN"
echo "=========================="
curl -s -X POST $API_URL/api/verify-token \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\"
  }" | json_pp 2>/dev/null
echo ""
echo ""

# Test 6: Erreur de validation
echo "6. TEST ERREUR VALIDATION (email invalide)"
echo "==========================================="
curl -s -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123",
    "first_name": "Test"
  }' | json_pp 2>/dev/null
echo ""
echo ""

# Test 7: Email déjà utilisé
echo "7. TEST EMAIL DÉJÀ UTILISÉ"
echo "=========================="
curl -s -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@test.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }' | json_pp 2>/dev/null
echo ""
echo ""

# Test 8: Profil sans token (erreur)
echo "8. TEST PROFIL SANS TOKEN (erreur)"
echo "==================================="
curl -s -X GET $API_URL/api/profile | json_pp 2>/dev/null
echo ""
echo ""

echo "========================================"
echo "✅ Tests terminés!"
echo "========================================"
