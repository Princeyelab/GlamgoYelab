#!/bin/bash

# =====================================================
# SCRIPT DE MIGRATION - GLAMGO DATABASE
# =====================================================
# Ce script exécute les migrations sur la base de données
# Usage: bash backend/database/migrate.sh [migration_file]
# =====================================================

set -e  # Arrêter en cas d'erreur

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_CONTAINER="glamgo-mysql"
DB_USER="glamgo_user"
DB_PASSWORD="glamgo_password"
DB_NAME="glamgo"
MIGRATION_FILE="${1:-backend/database/migrations/002_add_bidding_system.sql}"
BACKUP_DIR="backup/sql"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🚀 MIGRATION DE LA BASE DE DONNÉES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier que le conteneur Docker est en cours d'exécution
echo -e "${YELLOW}📦 Vérification du conteneur Docker...${NC}"
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}❌ Le conteneur $DB_CONTAINER n'est pas en cours d'exécution${NC}"
    echo "   Démarrez-le avec: docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✅ Conteneur $DB_CONTAINER actif${NC}"

# Vérifier que le fichier de migration existe
echo ""
echo -e "${YELLOW}📄 Vérification du fichier de migration...${NC}"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Fichier de migration introuvable: $MIGRATION_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Fichier trouvé: $MIGRATION_FILE${NC}"
echo "   Taille: $(du -h "$MIGRATION_FILE" | cut -f1)"

# Créer le dossier de backup si nécessaire
echo ""
echo -e "${YELLOW}📁 Préparation du backup...${NC}"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre_migration_$(basename "$MIGRATION_FILE" .sql)_$(date +%Y%m%d_%H%M%S).sql"

# Backup de la base de données AVANT migration
echo -e "${YELLOW}💾 Création du backup pré-migration...${NC}"
if docker exec "$DB_CONTAINER" mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE" 2>&1; then
    echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
    echo "   Taille: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo -e "${RED}❌ Échec de la création du backup${NC}"
    exit 1
fi

# Afficher l'état AVANT migration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 ÉTAT AVANT MIGRATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Tables actuelles :"
docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES;" 2>&1 | grep -v "password" | grep -v Warning

# Exécuter la migration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔄 EXÉCUTION DE LA MIGRATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⏳ Migration en cours...${NC}"
echo ""

# Capturer la sortie de la migration
MIGRATION_OUTPUT=$(docker exec -i "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE" 2>&1)
MIGRATION_EXIT_CODE=$?

# Filtrer les warnings de password
MIGRATION_OUTPUT=$(echo "$MIGRATION_OUTPUT" | grep -v "password" | grep -v "Warning: Using a password")

# Afficher le résultat
if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ MIGRATION RÉUSSIE !${NC}"
    echo ""
    echo "Résumé de la migration :"
    echo "$MIGRATION_OUTPUT" | tail -10
else
    echo -e "${RED}❌ ERREUR LORS DE LA MIGRATION${NC}"
    echo ""
    echo "Détails de l'erreur :"
    echo "$MIGRATION_OUTPUT"
    echo ""
    echo -e "${YELLOW}🔄 Le backup est disponible ici : $BACKUP_FILE${NC}"
    echo "   Pour restaurer : docker exec -i $DB_CONTAINER mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < $BACKUP_FILE"
    exit 1
fi

# Afficher l'état APRÈS migration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 ÉTAT APRÈS MIGRATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Tables actuelles :"
docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES;" 2>&1 | grep -v "password" | grep -v Warning

# Vérifier les nouvelles tables
echo ""
echo -e "${YELLOW}🔍 Vérification des nouvelles tables...${NC}"
TABLES_TO_CHECK=("bids" "negotiations" "provider_stats")
ALL_TABLES_OK=true

for table in "${TABLES_TO_CHECK[@]}"; do
    if docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE '$table';" 2>&1 | grep -q "$table"; then
        echo -e "${GREEN}✅ Table $table créée${NC}"
    else
        echo -e "${RED}❌ Table $table non trouvée${NC}"
        ALL_TABLES_OK=false
    fi
done

# Vérifier les colonnes ajoutées
echo ""
echo -e "${YELLOW}🔍 Vérification des colonnes ajoutées...${NC}"

# Orders
echo "Colonnes de orders :"
ORDERS_COLS=$(docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE orders;" 2>&1 | grep -E "(pricing_mode|user_proposed_price|accepted_bid_id|bid_expiry_time)" | grep -v "password" | wc -l)
if [ "$ORDERS_COLS" -eq 4 ]; then
    echo -e "${GREEN}✅ 4 colonnes ajoutées à orders${NC}"
else
    echo -e "${YELLOW}⚠️  $ORDERS_COLS/4 colonnes trouvées dans orders${NC}"
fi

# Services
echo "Colonnes de services :"
SERVICES_COLS=$(docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE services;" 2>&1 | grep -E "(allow_bidding|min_suggested_price|max_suggested_price)" | grep -v "password" | wc -l)
if [ "$SERVICES_COLS" -eq 3 ]; then
    echo -e "${GREEN}✅ 3 colonnes ajoutées à services${NC}"
else
    echo -e "${YELLOW}⚠️  $SERVICES_COLS/3 colonnes trouvées dans services${NC}"
fi

# Backup POST-migration
echo ""
echo -e "${YELLOW}💾 Création du backup post-migration...${NC}"
POST_BACKUP_FILE="$BACKUP_DIR/post_migration_$(basename "$MIGRATION_FILE" .sql)_$(date +%Y%m%d_%H%M%S).sql"
if docker exec "$DB_CONTAINER" mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$POST_BACKUP_FILE" 2>&1; then
    echo -e "${GREEN}✅ Backup post-migration créé: $POST_BACKUP_FILE${NC}"
    echo "   Taille: $(du -h "$POST_BACKUP_FILE" | cut -f1)"
else
    echo -e "${RED}❌ Échec de la création du backup post-migration${NC}"
fi

# Résumé final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ALL_TABLES_OK" = true ]; then
    echo -e "${GREEN}✅ MIGRATION TERMINÉE AVEC SUCCÈS${NC}"
else
    echo -e "${YELLOW}⚠️  MIGRATION TERMINÉE AVEC AVERTISSEMENTS${NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Backups créés :"
echo "   Pré-migration  : $BACKUP_FILE"
echo "   Post-migration : $POST_BACKUP_FILE"
echo ""
echo "🔄 Pour annuler la migration :"
echo "   bash test-rollback-002.sh --real"
echo ""
echo "📖 Documentation :"
echo "   MIGRATION_002_REPORT.md"
echo "   ROLLBACK_002_GUIDE.md"
echo ""
