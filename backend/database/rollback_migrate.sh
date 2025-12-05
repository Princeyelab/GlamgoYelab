#!/bin/bash

# =====================================================
# Script de rollback - Système d'enchères
# =====================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_CONTAINER="glamgo-mysql"
DB_NAME="marrakech_services"
DB_USER="root"
DB_PASS="root"
ROLLBACK_FILE="005_rollback_bidding_system.sql"

echo -e "${RED}=================================================${NC}"
echo -e "${RED}   ROLLBACK MIGRATION 005${NC}"
echo -e "${RED}=================================================${NC}"
echo ""

# Vérifier que Docker est lancé
echo -e "${YELLOW}🔍 Vérification de Docker...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas lancé.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker est actif${NC}"
echo ""

# Vérifier que le conteneur MySQL existe et est actif
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${YELLOW}📦 Démarrage du conteneur MySQL...${NC}"
    docker-compose up -d mysql-db
    sleep 10
fi
echo ""

# Avertissement
echo -e "${RED}⚠️  ATTENTION : Cette opération va :${NC}"
echo -e "   1. Supprimer les tables : bids, negotiations, provider_stats"
echo -e "   2. Supprimer les colonnes ajoutées à 'orders' et 'services'"
echo -e "   3. ${RED}SUPPRIMER TOUTES LES OFFRES ET NÉGOCIATIONS${NC}"
echo ""
echo -e "${YELLOW}Cette opération est ${RED}IRRÉVERSIBLE${YELLOW} sauf si vous avez un backup !${NC}"
echo ""
read -p "Êtes-vous ABSOLUMENT SÛR de vouloir continuer ? (tapez 'CONFIRMER') : " CONFIRM

if [ "$CONFIRM" != "CONFIRMER" ]; then
    echo -e "${GREEN}❌ Rollback annulé - Aucune modification effectuée${NC}"
    exit 0
fi
echo ""

# Exécuter le rollback
echo -e "${BLUE}🔄 Exécution du rollback...${NC}"
echo -e "${YELLOW}Fichier : migrations/$ROLLBACK_FILE${NC}"
echo ""

if docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "migrations/$ROLLBACK_FILE" 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Rollback exécuté avec succès !${NC}"
else
    echo ""
    echo -e "${RED}❌ Erreur lors du rollback${NC}"
    exit 1
fi
echo ""

# Vérifier que les tables ont été supprimées
echo -e "${YELLOW}🔍 Vérification...${NC}"
TABLES=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null)

if echo "$TABLES" | grep -q "bids" || echo "$TABLES" | grep -q "negotiations" || echo "$TABLES" | grep -q "provider_stats"; then
    echo -e "${RED}❌ Erreur : Certaines tables existent encore${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Tables supprimées : bids, negotiations, provider_stats${NC}"
fi
echo ""

# Vérifier que les colonnes ont été supprimées
echo -e "${YELLOW}📋 Structure de la table 'orders' après rollback :${NC}"
docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "DESCRIBE orders;" 2>/dev/null
echo ""

echo -e "${YELLOW}📋 Structure de la table 'services' après rollback :${NC}"
docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "DESCRIBE services;" 2>/dev/null
echo ""

# Résumé final
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}   ✅ ROLLBACK TERMINÉ${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo -e "${BLUE}📊 Statut :${NC}"
echo -e "   - Base de données restaurée à l'état avant migration 005"
echo -e "   - Toutes les offres et négociations ont été supprimées"
echo -e "   - Les colonnes ajoutées ont été retirées"
echo ""
echo -e "${YELLOW}📝 N'oubliez pas de :${NC}"
echo -e "   1. Restaurer les fichiers PHP (voir backup/RESTORE_INSTRUCTIONS.md)"
echo -e "   2. Redémarrer les conteneurs Docker"
echo -e "   3. Tester que l'application fonctionne correctement"
echo ""
