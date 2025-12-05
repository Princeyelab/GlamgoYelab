#!/bin/bash

echo "=================================="
echo "Test de l'API Marrakech Services"
echo "=================================="
echo ""

# Test 1: Page d'accueil
echo "1. Test de la page d'accueil (GET /)"
echo "-----------------------------------"
curl -s http://localhost:8081/ | json_pp
echo ""
echo ""

# Test 2: Health check
echo "2. Test du health check (GET /health)"
echo "--------------------------------------"
curl -s http://localhost:8081/health | json_pp
echo ""
echo ""

# Test 3: Route inexistante (404)
echo "3. Test d'une route inexistante (GET /nonexistent)"
echo "--------------------------------------------------"
curl -s http://localhost:8081/nonexistent | json_pp
echo ""
echo ""

echo "=================================="
echo "Tests terminés!"
echo "=================================="
