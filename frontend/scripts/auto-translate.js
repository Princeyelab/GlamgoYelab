/**
 * Script de traduction automatique FR -> AR
 * Extrait les textes français des fichiers et les remplace par des appels t()
 */

const fs = require('fs');
const path = require('path');

// Dictionnaire de traduction FR -> AR pour l'application GlamGo
const translations = {
  // === BOOKING PAGE ===
  "Chargement...": "جاري التحميل...",
  "Service non trouvé": "الخدمة غير موجودة",
  "Retour aux services": "العودة إلى الخدمات",
  "Retour au service": "العودة إلى الخدمة",
  "Demande d'offres créée !": "تم إنشاء طلب العروض!",
  "Réservation confirmée !": "تم تأكيد الحجز!",
  "Votre demande d'offres a été créée. Les prestataires vont commencer à vous envoyer leurs propositions.": "تم إنشاء طلب العروض. سيبدأ مقدمو الخدمات في إرسال عروضهم.",
  "Votre réservation a été enregistrée avec succès.": "تم تسجيل حجزك بنجاح.",
  "Vous allez être redirigé vers vos commandes...": "سيتم توجيهك إلى طلباتك...",
  "Demander des offres": "طلب العروض",
  "Finaliser la réservation": "إتمام الحجز",
  "Mode enchères": "وضع المزاد",
  "Proposez votre prix et recevez des offres de plusieurs prestataires. Vous pourrez ensuite choisir la meilleure offre.": "اقترح سعرك واستلم عروضاً من عدة مقدمي خدمات. يمكنك بعد ذلك اختيار أفضل عرض.",
  "Votre prix proposé (MAD)": "السعر المقترح (درهم)",
  "Prix minimum:": "الحد الأدنى للسعر:",
  "sans limite maximale": "بدون حد أقصى",
  "Date du service": "تاريخ الخدمة",
  "Heure du service": "وقت الخدمة",
  "Sélectionnez une heure": "اختر الوقت",
  "Journée": "النهار",
  "Nuit (supplément)": "ليل (رسوم إضافية)",
  "Durée des enchères (heures)": "مدة المزاد (ساعات)",
  "12 heures": "12 ساعة",
  "24 heures (recommandé)": "24 ساعة (موصى به)",
  "48 heures": "48 ساعة",
  "72 heures": "72 ساعة",
  "Adresse": "العنوان",
  "Date": "التاريخ",
  "Heure": "الوقت",
  "Veuillez remplir tous les champs obligatoires": "يرجى ملء جميع الحقول المطلوبة",
  "Erreur lors de la création de la commande": "خطأ أثناء إنشاء الطلب",
  "Masquer les prestataires": "إخفاء مقدمي الخدمات",
  "Voir les prestataires à proximité": "عرض مقدمي الخدمات القريبين",
  "Changer": "تغيير",
  "Mode de paiement": "طريقة الدفع",
  "Carte bancaire": "بطاقة بنكية",
  "Le paiement sera automatiquement effectué à la fin du service. Commission GlamGo : 20%": "سيتم الدفع تلقائياً عند انتهاء الخدمة. عمولة GlamGo: 20%",
  "Espèces": "نقداً",
  "Payez en espèces au prestataire. La commission GlamGo (20%) sera prélevée sur sa carte": "ادفع نقداً لمقدم الخدمة. سيتم خصم عمولة GlamGo (20%) من بطاقته",
  "Notes supplémentaires": "ملاحظات إضافية",
  "Instructions spéciales, accès, etc.": "تعليمات خاصة، طريقة الوصول، إلخ.",
  "Récapitulatif": "الملخص",
  "Service": "الخدمة",
  "Votre prix proposé": "السعر المقترح",
  "Date du service": "تاريخ الخدمة",
  "Durée des enchères": "مدة المزاد",
  "Prestataire": "مقدم الخدمة",
  "Durée estimée": "المدة المتوقعة",
  "Paiement": "الدفع",
  "Formule": "الصيغة",
  "Standard": "قياسي",
  "Récurrent": "متكرر",
  "Premium": "بريميوم",
  "Urgence": "عاجل",
  "Nuit": "ليلي",
  "Prix de base": "السعر الأساسي",
  "Réduction récurrent": "خصم متكرر",
  "Supplément premium": "رسوم بريميوم",
  "Supplément urgence": "رسوم العجلة",
  "Supplément nuit": "رسوم ليلية",
  "Formule standard": "صيغة قياسية",
  "Frais de distance": "رسوم المسافة",
  "Sous-total": "المجموع الفرعي",
  "Commission GlamGo (20%)": "عمولة GlamGo (20%)",
  "Total à payer": "المجموع المستحق",
  "Création en cours...": "جاري الإنشاء...",
  "Réservation en cours...": "جاري الحجز...",
  "Créer la demande d'offres": "إنشاء طلب العروض",
  "Confirmer la réservation": "تأكيد الحجز",
  "Formule nuit - supplément inclus": "صيغة ليلية - الرسوم مشمولة",
  "Sélectionnez la formule": "اختر الصيغة",
  "pour inclure ce supplément": "لتضمين هذه الرسوم",

  // === SERVICES PAGE ===
  "Nos Services": "خدماتنا",
  "Découvrez notre gamme complète de services de beauté": "اكتشفي مجموعتنا الكاملة من خدمات التجميل",
  "Toutes les catégories": "جميع الفئات",
  "Rechercher un service...": "البحث عن خدمة...",
  "Aucun service trouvé": "لم يتم العثور على خدمات",
  "Essayez de modifier votre recherche ou de changer de catégorie.": "حاولي تعديل البحث أو تغيير الفئة.",
  "Réinitialiser les filtres": "إعادة تعيين الفلاتر",
  "À partir de": "ابتداءً من",
  "Voir détails": "عرض التفاصيل",
  "Réserver": "حجز",
  "Erreur lors du chargement des services": "خطأ أثناء تحميل الخدمات",
  "Erreur lors du chargement des catégories": "خطأ أثناء تحميل الفئات",

  // === SERVICE DETAIL PAGE ===
  "Description": "الوصف",
  "Ce service comprend": "تشمل هذه الخدمة",
  "Durée": "المدة",
  "environ": "حوالي",
  "minutes": "دقيقة",
  "Prix": "السعر",
  "Catégorie": "الفئة",
  "Réserver maintenant": "احجزي الآن",
  "Services similaires": "خدمات مشابهة",

  // === FORMULAS PAGE ===
  "Nos Formules": "صيغنا",
  "Choisissez la formule qui vous convient": "اختاري الصيغة المناسبة لك",
  "Recommandé": "موصى به",
  "Populaire": "شائع",

  // === BIDDING PAGE ===
  "Enchères": "المزادات",
  "Recevez des offres de prestataires": "استلمي عروضاً من مقدمي الخدمات",
  "Comment ça marche": "كيف يعمل",
  "Choisissez votre service": "اختاري خدمتك",
  "Proposez votre prix": "اقترحي سعرك",
  "Recevez des offres": "استلمي العروض",
  "Choisissez le meilleur": "اختاري الأفضل",

  // === ONBOARDING CLIENT ===
  "Bienvenue sur GlamGo": "مرحباً بك في GlamGo",
  "Votre beauté, à domicile": "جمالك، في منزلك",
  "Commencer": "ابدأي",
  "Suivant": "التالي",
  "Précédent": "السابق",
  "Terminer": "إنهاء",
  "Passer": "تخطي",

  // === HOW IT WORKS ===
  "Comment ça marche ?": "كيف يعمل؟",
  "Découvrez comment réserver un service": "اكتشفي كيفية حجز خدمة",
  "Pour les clients": "للعملاء",
  "Pour les prestataires": "لمقدمي الخدمات",
  "Étape": "الخطوة",
  "Choisissez un service": "اختاري خدمة",
  "Réservez en ligne": "احجزي عبر الإنترنت",
  "Profitez du service": "استمتعي بالخدمة",
  "Évaluez votre expérience": "قيّمي تجربتك",

  // === COMMON ===
  "Chargement": "جاري التحميل",
  "Erreur": "خطأ",
  "Succès": "نجاح",
  "Annuler": "إلغاء",
  "Confirmer": "تأكيد",
  "Enregistrer": "حفظ",
  "Modifier": "تعديل",
  "Supprimer": "حذف",
  "Fermer": "إغلاق",
  "Oui": "نعم",
  "Non": "لا",
  "ou": "أو",
  "et": "و",
  "de": "من",
  "à": "إلى",
  "le": "ال",
  "la": "ال",
  "les": "ال",
  "un": "واحد",
  "une": "واحدة",
  "MAD": "درهم",
  "min": "دقيقة",
  "h": "س",
  "km": "كم",
};

// Fichiers à traiter
const filesToProcess = [
  'src/app/booking/[id]/page.js',
  'src/app/services/page.js',
  'src/app/services/[id]/page.js',
  'src/app/bidding/page.js',
  'src/app/formulas/page.js',
  'src/app/onboarding/client/page.js',
  'src/app/how-it-works/page.js',
  'src/app/how-it-works/client/page.js',
  'src/app/how-it-works/provider/page.js',
];

// Générer les traductions pour LanguageContext
function generateLanguageContextAdditions() {
  let frTranslations = '';
  let arTranslations = '';

  Object.entries(translations).forEach(([fr, ar], index) => {
    const key = `app.text${index}`;
    frTranslations += `    '${key}': '${fr.replace(/'/g, "\\'")}',\n`;
    arTranslations += `    '${key}': '${ar}',\n`;
  });

  return { frTranslations, arTranslations };
}

// Afficher les statistiques
console.log('=== Script de traduction automatique GlamGo ===\n');
console.log(`Nombre de traductions disponibles: ${Object.keys(translations).length}`);
console.log('\nFichiers à traiter:');
filesToProcess.forEach(f => console.log(`  - ${f}`));

console.log('\n=== Traductions disponibles ===\n');
Object.entries(translations).slice(0, 10).forEach(([fr, ar]) => {
  console.log(`FR: "${fr}"`);
  console.log(`AR: "${ar}"\n`);
});
console.log('... et plus encore');

// Export des traductions en JSON
const output = {
  fr: {},
  ar: {}
};

Object.entries(translations).forEach(([fr, ar], index) => {
  const key = `t${index}`;
  output.fr[key] = fr;
  output.ar[key] = ar;
});

fs.writeFileSync('scripts/translations-export.json', JSON.stringify(output, null, 2));
console.log('\n✅ Traductions exportées vers scripts/translations-export.json');
