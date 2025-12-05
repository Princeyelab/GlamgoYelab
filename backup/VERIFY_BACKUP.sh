#!/bin/bash

# Script de vérification de l'intégrité du backup
# Usage: bash backup/VERIFY_BACKUP.sh

echo "🔍 Vérification de l'intégrité du backup..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
SUCCESS=0
FAILED=0

# Fonction de vérification
check_file() {
    local source=$1
    local backup=$2
    
    if [ -f "$source" ] && [ -f "$backup" ]; then
        echo -e "${GREEN}✅${NC} $backup existe"
        ((SUCCESS++))
    else
        echo -e "${RED}❌${NC} $backup manquant ou source introuvable"
        ((FAILED++))
    fi
}

# Vérifier les fichiers
echo "📁 Vérification des fichiers backup..."
check_file "backend/public/index.php" "backup/index.php.backup"
check_file "backend/routes/api.php" "backup/api.php.backup"
check_file "backend/app/models/Order.php" "backup/Order.php.backup"
check_file "backend/app/controllers/OrderController.php" "backup/OrderController.php.backup"

# Vérifier les fichiers de documentation
echo ""
echo "📝 Vérification des fichiers de documentation..."
check_file "backup/RESTORE_INSTRUCTIONS.md" "backup/RESTORE_INSTRUCTIONS.md"
check_file "backup/BACKUP_SUMMARY.md" "backup/BACKUP_SUMMARY.md"
check_file "backup/CHECKSUMS.txt" "backup/CHECKSUMS.txt"

# Vérifier les checksums
echo ""
echo "🔐 Vérification des checksums..."
cd backup
if sha256sum -c CHECKSUMS.txt > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Tous les checksums sont valides"
    ((SUCCESS++))
else
    echo -e "${RED}❌${NC} Erreur de checksum détectée"
    ((FAILED++))
fi
cd ..

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "📊 Résumé: ${GREEN}$SUCCESS succès${NC} | ${RED}$FAILED échecs${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Backup complet et intègre${NC}"
    exit 0
else
    echo -e "${RED}❌ Des problèmes ont été détectés${NC}"
    exit 1
fi
