#!/bin/bash

# =====================================================
# TEST DU ROLLBACK 002 - SYSTÈME D'ENCHÈRES
# =====================================================
# Ce script teste le rollback de la migration 002
# ATTENTION : Ce test est DESTRUCTIF en mode réel
# =====================================================

set -e  # Arrêter en cas d'erreur

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔄 TEST DU ROLLBACK 002${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Mode simulation par défaut
SIMULATION=true
if [ "$1" == "--real" ]; then
    SIMULATION=false
    echo -e "${RED}⚠️  MODE RÉEL ACTIVÉ - LE ROLLBACK SERA VRAIMENT EXÉCUTÉ${NC}"
    read -p "Êtes-vous sûr ? (tapez 'OUI' pour confirmer) : " confirm
    if [ "$confirm" != "OUI" ]; then
        echo "Annulé."
        exit 0
    fi
else
    echo -e "${YELLOW}ℹ️  Mode simulation (utilisez --real pour exécuter vraiment)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ÉTAT AVANT ROLLBACK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier les tables existantes
echo ""
echo "Tables actuelles :"
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "SHOW TABLES;" 2>&1 | grep -v Warning

# Vérifier les colonnes de orders
echo ""
echo "Colonnes de la table orders liées aux enchères :"
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "DESCRIBE orders;" 2>&1 | grep -E "(pricing_mode|user_proposed_price|accepted_bid_id|bid_expiry_time)" || echo "  Aucune colonne liée aux enchères trouvée"

# Vérifier les colonnes de services
echo ""
echo "Colonnes de la table services liées aux enchères :"
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "DESCRIBE services;" 2>&1 | grep -E "(allow_bidding|min_suggested_price|max_suggested_price)" || echo "  Aucune colonne liée aux enchères trouvée"

# Compter les données
echo ""
echo "Données actuelles :"
docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "
SELECT
    (SELECT COUNT(*) FROM bids) as bids_count,
    (SELECT COUNT(*) FROM negotiations) as negotiations_count,
    (SELECT COUNT(*) FROM provider_stats) as provider_stats_count,
    (SELECT COUNT(*) FROM orders WHERE pricing_mode = 'bidding') as bidding_orders_count;
" 2>&1 | grep -v Warning

if [ "$SIMULATION" = true ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 SIMULATION DU ROLLBACK"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Le rollback effectuerait les actions suivantes :"
    echo ""
    echo "1. ✅ Supprimer la vue v_bidding_orders_summary"
    echo "2. ✅ Supprimer la FK fk_orders_accepted_bid"
    echo "3. ✅ Supprimer l'index idx_pricing_mode_status"
    echo "4. ✅ Supprimer 4 colonnes de la table orders:"
    echo "   - bid_expiry_time"
    echo "   - accepted_bid_id"
    echo "   - user_proposed_price"
    echo "   - pricing_mode"
    echo "5. ✅ Supprimer 3 colonnes de la table services:"
    echo "   - max_suggested_price"
    echo "   - min_suggested_price"
    echo "   - allow_bidding"
    echo "6. ✅ Supprimer les tables dans l'ordre :"
    echo "   - negotiations"
    echo "   - provider_stats"
    echo "   - bids"
    echo ""
    echo -e "${GREEN}✅ Simulation terminée${NC}"
    echo ""
    echo "Pour exécuter vraiment le rollback, utilisez :"
    echo -e "${YELLOW}bash test-rollback-002.sh --real${NC}"
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  EXÉCUTION DU ROLLBACK RÉEL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Créer un backup avant rollback
    echo "Création d'un backup de sécurité..."
    docker exec glamgo-mysql mysqldump -u glamgo_user -pglamgo_password glamgo > backup/pre_rollback_$(date +%Y%m%d_%H%M%S).sql 2>&1
    echo -e "${GREEN}✅ Backup créé${NC}"

    # Exécuter le rollback
    echo ""
    echo "Exécution du script de rollback..."
    docker exec -i glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo < backend/database/migrations/002_rollback_bidding_system.sql 2>&1 | grep -v Warning

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 ÉTAT APRÈS ROLLBACK"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Vérifier les tables
    echo ""
    echo "Tables restantes :"
    docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "SHOW TABLES;" 2>&1 | grep -v Warning

    # Vérifier que les tables ont été supprimées
    echo ""
    echo "Vérification des tables supprimées :"
    if docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "SHOW TABLES LIKE 'bids';" 2>&1 | grep -q "bids"; then
        echo -e "${RED}❌ La table bids existe encore${NC}"
    else
        echo -e "${GREEN}✅ Table bids supprimée${NC}"
    fi

    if docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "SHOW TABLES LIKE 'negotiations';" 2>&1 | grep -q "negotiations"; then
        echo -e "${RED}❌ La table negotiations existe encore${NC}"
    else
        echo -e "${GREEN}✅ Table negotiations supprimée${NC}"
    fi

    if docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "SHOW TABLES LIKE 'provider_stats';" 2>&1 | grep -q "provider_stats"; then
        echo -e "${RED}❌ La table provider_stats existe encore${NC}"
    else
        echo -e "${GREEN}✅ Table provider_stats supprimée${NC}"
    fi

    # Vérifier les colonnes de orders
    echo ""
    echo "Vérification des colonnes orders :"
    docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "DESCRIBE orders;" 2>&1 | grep -E "(pricing_mode|user_proposed_price|accepted_bid_id|bid_expiry_time)" && echo -e "${RED}❌ Des colonnes existent encore${NC}" || echo -e "${GREEN}✅ Toutes les colonnes supprimées${NC}"

    # Vérifier les colonnes de services
    echo ""
    echo "Vérification des colonnes services :"
    docker exec glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo -e "DESCRIBE services;" 2>&1 | grep -E "(allow_bidding|min_suggested_price|max_suggested_price)" && echo -e "${RED}❌ Des colonnes existent encore${NC}" || echo -e "${GREEN}✅ Toutes les colonnes supprimées${NC}"

    echo ""
    echo -e "${GREEN}✅ Rollback terminé${NC}"
    echo ""
    echo "Pour restaurer, utilisez :"
    echo "docker exec -i glamgo-mysql mysql -u glamgo_user -pglamgo_password glamgo < backend/database/migrations/002_add_bidding_system.sql"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test terminé"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
