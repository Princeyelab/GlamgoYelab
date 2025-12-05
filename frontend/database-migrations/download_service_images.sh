#!/bin/bash
# =====================================================
# Script de téléchargement des images de services GlamGo
# Télécharge les images depuis Unsplash vers le dossier public
# =====================================================

# Répertoire de destination
IMAGES_DIR="./public/images/services"

# Créer le répertoire si nécessaire
mkdir -p "$IMAGES_DIR"

echo "📸 Téléchargement des images de services GlamGo..."
echo "=================================================="

# Liste des images avec leurs requêtes Unsplash
declare -A IMAGES=(
    ["bricolage.jpg"]="handyman tools repair"
    ["coiffure-express.jpg"]="hair salon hairdresser"
    ["coiffure-classique.jpg"]="hairstylist beauty salon"
    ["coiffure-mariage.jpg"]="bridal hair wedding hairstyle"
    ["jardinage.jpg"]="gardening garden maintenance"
    ["menage.jpg"]="house cleaning home service"
    ["promenade-chien.jpg"]="dog walking pet care"
    ["gardiennage-animaux.jpg"]="pet sitting dog care"
    ["auto-interne.jpg"]="car interior cleaning detailing"
    ["auto-externe.jpg"]="car wash exterior cleaning"
    ["auto-complet.jpg"]="car detailing professional wash"
    ["chef-2pers.jpg"]="private chef cooking home"
    ["chef-4pers.jpg"]="chef cooking dinner party"
    ["chef-8pers.jpg"]="catering chef event cooking"
    ["massage-relaxant.jpg"]="massage relaxation spa"
    ["hammam-gommage.jpg"]="moroccan hammam spa traditional"
    ["soin-argan.jpg"]="argan oil beauty treatment"
    ["danse-orientale.jpg"]="belly dance oriental dance"
    ["yoga.jpg"]="yoga home practice instructor"
    ["coach-sportif.jpg"]="personal trainer fitness coaching"
)

# Compteurs
DOWNLOADED=0
SKIPPED=0
ERRORS=0

for filename in "${!IMAGES[@]}"; do
    filepath="$IMAGES_DIR/$filename"
    query="${IMAGES[$filename]}"

    # Vérifier si l'image existe déjà
    if [ -f "$filepath" ]; then
        echo "✓ $filename existe déjà"
        ((SKIPPED++))
        continue
    fi

    # URL Unsplash Source (redirection automatique vers une image)
    encoded_query=$(echo "$query" | sed 's/ /%20/g')
    url="https://source.unsplash.com/800x600/?${encoded_query}"

    echo -n "⬇️  Téléchargement $filename... "

    # Télécharger avec curl
    if curl -sL -o "$filepath" "$url" 2>/dev/null; then
        # Vérifier que le fichier est une image valide
        if file "$filepath" | grep -qE 'image|JPEG|PNG'; then
            echo "✅"
            ((DOWNLOADED++))
        else
            echo "❌ Format invalide"
            rm -f "$filepath"
            ((ERRORS++))
        fi
    else
        echo "❌ Erreur de téléchargement"
        ((ERRORS++))
    fi

    # Pause pour éviter le rate limiting
    sleep 1
done

echo ""
echo "=================================================="
echo "📊 Résumé:"
echo "   ✅ Téléchargés : $DOWNLOADED"
echo "   ⏭️  Ignorés    : $SKIPPED"
echo "   ❌ Erreurs    : $ERRORS"
echo ""
echo "📁 Images dans : $IMAGES_DIR"

# Lister les fichiers
echo ""
echo "📂 Fichiers présents:"
ls -la "$IMAGES_DIR"/*.jpg 2>/dev/null || echo "   Aucune image trouvée"
