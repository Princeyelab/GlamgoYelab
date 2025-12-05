#!/bin/bash
# Script d'initialisation automatique de la base de données
# Exécuté automatiquement par Docker au premier démarrage

set -e

echo "====================================="
echo "Initialisation de Marrakech Services"
echo "====================================="

# Attendre que MySQL soit prêt
sleep 5

# Exécuter le schéma
echo "Création du schéma..."
mysql -u marrakech_user -pmarrakech_password marrakech_services < /docker-entrypoint-initdb.d/schema.sql

# Exécuter les seeds
echo "Insertion des données de test..."
mysql -u marrakech_user -pmarrakech_password marrakech_services < /docker-entrypoint-initdb.d/seeds.sql

echo "====================================="
echo "Base de données initialisée avec succès!"
echo "====================================="

# Afficher les statistiques
mysql -u marrakech_user -pmarrakech_password marrakech_services -e "
    SELECT 'Users' AS table_name, COUNT(*) AS count FROM users
    UNION ALL
    SELECT 'Providers', COUNT(*) FROM providers
    UNION ALL
    SELECT 'Categories', COUNT(*) FROM categories
    UNION ALL
    SELECT 'Services', COUNT(*) FROM services
    UNION ALL
    SELECT 'Orders', COUNT(*) FROM orders;
"
