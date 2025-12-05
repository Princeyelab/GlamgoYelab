#!/bin/bash

# Script de démarrage automatique du backend et frontend
# Ce script vérifie si le backend est lancé et le démarre si nécessaire

echo "🚀 Démarrage de l'application YelabGo..."

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
  exit 1
fi

# Se déplacer vers le dossier racine du projet
cd "$(dirname "$0")/.."

# Vérifier si les conteneurs backend sont en cours d'exécution
echo "🔍 Vérification de l'état du backend..."
if ! docker-compose ps | grep -q "glamgo-nginx.*Up"; then
  echo "📦 Démarrage du backend (MySQL, PHP, Nginx)..."
  docker-compose up -d mysql-db php-backend nginx

  # Attendre que MySQL soit prêt
  echo "⏳ Attente du démarrage de MySQL..."
  for i in {1..30}; do
    if docker exec glamgo-mysql mysqladmin ping -h localhost --silent; then
      echo "✅ MySQL est prêt !"
      break
    fi
    sleep 1
  done

  echo "✅ Backend démarré avec succès !"
else
  echo "✅ Le backend est déjà en cours d'exécution"
fi

# Afficher l'état des services
echo ""
echo "📊 État des services :"
docker-compose ps

echo ""
echo "🌐 Services disponibles :"
echo "   - Backend API : http://localhost:8080"
echo "   - Frontend    : http://localhost:3000 (démarrage...)"
echo ""

# Démarrer le frontend
cd frontend
echo "🎨 Démarrage du frontend Next.js..."
npm run dev
