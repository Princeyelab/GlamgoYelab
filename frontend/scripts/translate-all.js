/**
 * Script de traduction automatique - Traduit toutes les pages en une fois
 */

const fs = require('fs');
const path = require('path');

// Pages à traduire
const pagesToTranslate = [
  'src/app/services/page.js',
  'src/app/services/[id]/page.js',
  'src/app/bidding/page.js',
  'src/app/formulas/page.js',
  'src/app/onboarding/client/page.js',
  'src/app/how-it-works/page.js',
  'src/app/how-it-works/client/page.js',
  'src/app/how-it-works/provider/page.js',
];

// Fonction pour ajouter l'import useLanguage si absent
function addLanguageImport(content) {
  if (content.includes("import { useLanguage }") || content.includes("from '@/contexts/LanguageContext'")) {
    return content;
  }

  // Ajouter après le dernier import
  const lastImportIndex = content.lastIndexOf("import ");
  const endOfLastImport = content.indexOf(";", lastImportIndex) + 1;

  return content.slice(0, endOfLastImport) +
    "\nimport { useLanguage } from '@/contexts/LanguageContext';" +
    content.slice(endOfLastImport);
}

// Fonction pour ajouter le hook useLanguage dans le composant
function addLanguageHook(content) {
  if (content.includes("const { t") || content.includes("const {t")) {
    return content;
  }

  // Chercher le pattern "export default function" ou "export function"
  const funcMatch = content.match(/export\s+(default\s+)?function\s+\w+\s*\([^)]*\)\s*\{/);
  if (funcMatch) {
    const insertPos = content.indexOf(funcMatch[0]) + funcMatch[0].length;
    return content.slice(0, insertPos) +
      "\n  const { t, language } = useLanguage();" +
      content.slice(insertPos);
  }

  return content;
}

// Dictionnaire de remplacement FR -> clé de traduction
const replacements = [
  // Services page
  [/['"]Nos Services['"]/g, "t('servicesPage.title')"],
  [/['"]Découvrez notre gamme complète de services de beauté['"]/g, "t('servicesPage.subtitle')"],
  [/['"]Toutes les catégories['"]/g, "t('servicesPage.allCategories')"],
  [/['"]Rechercher un service\.\.\.['"]/g, "t('servicesPage.searchPlaceholder')"],
  [/['"]Aucun service trouvé['"]/g, "t('servicesPage.noServices')"],
  [/['"]Essayez de modifier votre recherche ou de changer de catégorie\.['"]/g, "t('servicesPage.tryModifySearch')"],
  [/['"]Réinitialiser les filtres['"]/g, "t('servicesPage.resetFilters')"],
  [/['"]À partir de['"]/g, "t('servicesPage.startingFrom')"],
  [/['"]Voir détails['"]/g, "t('servicesPage.viewDetails')"],
  [/['"]Réserver['"]/g, "t('servicesPage.book')"],
  [/['"]Erreur lors du chargement des services['"]/g, "t('servicesPage.loadError')"],
  [/['"]Erreur lors du chargement des catégories['"]/g, "t('servicesPage.categoriesError')"],
  [/['"]Chargement\.\.\.['"]/g, "t('common.loading')"],

  // Service detail
  [/['"]Description['"]/g, "t('serviceDetail.description')"],
  [/['"]Ce service comprend['"]/g, "t('serviceDetail.includes')"],
  [/['"]Durée['"]/g, "t('serviceDetail.duration')"],
  [/['"]environ['"]/g, "t('serviceDetail.about')"],
  [/['"]minutes['"]/g, "t('serviceDetail.minutes')"],
  [/['"]Prix['"]/g, "t('serviceDetail.price')"],
  [/['"]Catégorie['"]/g, "t('serviceDetail.category')"],
  [/['"]Réserver maintenant['"]/g, "t('serviceDetail.bookNow')"],
  [/['"]Services similaires['"]/g, "t('serviceDetail.similarServices')"],
  [/['"]Retour aux services['"]/g, "t('serviceDetail.backToServices')"],
  [/['"]Service non trouvé['"]/g, "t('serviceDetail.notFound')"],

  // Formulas
  [/['"]Nos Formules['"]/g, "t('formulasPage.title')"],
  [/['"]Choisissez la formule qui vous convient['"]/g, "t('formulasPage.subtitle')"],
  [/['"]Recommandé['"]/g, "t('formulasPage.recommended')"],
  [/['"]Populaire['"]/g, "t('formulasPage.popular')"],
  [/['"]Standard['"]/g, "t('formulasPage.standard')"],
  [/['"]Récurrent['"]/g, "t('formulasPage.recurring')"],
  [/['"]Premium['"]/g, "t('formulasPage.premium')"],
  [/['"]Urgence['"]/g, "t('formulasPage.urgent')"],
  [/['"]Nuit['"]/g, "t('formulasPage.night')"],

  // Bidding
  [/['"]Enchères['"]/g, "t('biddingPage.title')"],
  [/['"]Recevez des offres de prestataires['"]/g, "t('biddingPage.subtitle')"],
  [/['"]Comment ça marche['"]/g, "t('biddingPage.howItWorks')"],
  [/['"]Choisissez votre service['"]/g, "t('biddingPage.step1')"],
  [/['"]Proposez votre prix['"]/g, "t('biddingPage.step2')"],
  [/['"]Recevez des offres['"]/g, "t('biddingPage.step3')"],
  [/['"]Choisissez le meilleur['"]/g, "t('biddingPage.step4')"],

  // Onboarding
  [/['"]Bienvenue sur GlamGo['"]/g, "t('onboarding.welcome')"],
  [/['"]Votre beauté, à domicile['"]/g, "t('onboarding.tagline')"],
  [/['"]Commencer['"]/g, "t('onboarding.start')"],
  [/['"]Suivant['"]/g, "t('onboarding.next')"],
  [/['"]Précédent['"]/g, "t('onboarding.previous')"],
  [/['"]Terminer['"]/g, "t('onboarding.finish')"],
  [/['"]Passer['"]/g, "t('onboarding.skip')"],

  // How it works
  [/['"]Comment ça marche \?['"]/g, "t('howItWorks.title')"],
  [/['"]Découvrez comment réserver un service['"]/g, "t('howItWorks.subtitle')"],
  [/['"]Pour les clients['"]/g, "t('howItWorks.forClients')"],
  [/['"]Pour les prestataires['"]/g, "t('howItWorks.forProviders')"],
  [/['"]Étape['"]/g, "t('howItWorks.step')"],
  [/['"]Choisissez un service['"]/g, "t('howItWorks.chooseService')"],
  [/['"]Réservez en ligne['"]/g, "t('howItWorks.bookOnline')"],
  [/['"]Profitez du service['"]/g, "t('howItWorks.enjoyService')"],
  [/['"]Évaluez votre expérience['"]/g, "t('howItWorks.rateExperience')"],

  // Common
  [/['"]Retour['"]/g, "t('common.back')"],
  [/['"]Annuler['"]/g, "t('common.cancel')"],
  [/['"]Confirmer['"]/g, "t('common.confirm')"],
  [/['"]Enregistrer['"]/g, "t('common.save')"],
  [/['"]Modifier['"]/g, "t('common.edit')"],
  [/['"]Supprimer['"]/g, "t('common.delete')"],
  [/['"]Fermer['"]/g, "t('common.close')"],
  [/['"]Erreur['"]/g, "t('common.error')"],
  [/['"]Succès['"]/g, "t('common.success')"],
];

// Traiter chaque fichier
let processedCount = 0;
let errorCount = 0;

pagesToTranslate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Ajouter l'import
    content = addLanguageImport(content);

    // Ajouter le hook
    content = addLanguageHook(content);

    // Appliquer les remplacements
    replacements.forEach(([pattern, replacement]) => {
      content = content.replace(pattern, replacement);
    });

    // Sauvegarder si modifié
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Traduit: ${filePath}`);
      processedCount++;
    } else {
      console.log(`➡️  Pas de changement: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Erreur sur ${filePath}:`, err.message);
    errorCount++;
  }
});

console.log(`\n=== Résumé ===`);
console.log(`✅ ${processedCount} fichiers traduits`);
console.log(`❌ ${errorCount} erreurs`);
console.log(`\n⚠️  N'oubliez pas d'ajouter les clés de traduction dans LanguageContext.js`);
