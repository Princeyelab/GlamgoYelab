/**
 * Script pour appliquer automatiquement les traductions à tous les fichiers
 */

const fs = require('fs');
const path = require('path');

// === TOUTES LES TRADUCTIONS POUR L'APPLICATION ===
const allTranslations = {
  // Booking page
  'booking.loading': { fr: 'Chargement...', ar: 'جاري التحميل...' },
  'booking.serviceNotFound': { fr: 'Service non trouvé', ar: 'الخدمة غير موجودة' },
  'booking.backToServices': { fr: 'Retour aux services', ar: 'العودة إلى الخدمات' },
  'booking.backToService': { fr: '← Retour au service', ar: '← العودة إلى الخدمة' },
  'booking.requestCreated': { fr: "Demande d'offres créée !", ar: 'تم إنشاء طلب العروض!' },
  'booking.reservationConfirmed': { fr: 'Réservation confirmée !', ar: 'تم تأكيد الحجز!' },
  'booking.requestCreatedDesc': { fr: "Votre demande d'offres a été créée. Les prestataires vont commencer à vous envoyer leurs propositions.", ar: 'تم إنشاء طلب العروض. سيبدأ مقدمو الخدمات في إرسال عروضهم.' },
  'booking.reservationConfirmedDesc': { fr: 'Votre réservation a été enregistrée avec succès.', ar: 'تم تسجيل حجزك بنجاح.' },
  'booking.redirecting': { fr: 'Vous allez être redirigé vers vos commandes...', ar: 'سيتم توجيهك إلى طلباتك...' },
  'booking.requestOffers': { fr: "💰 Demander des offres", ar: '💰 طلب العروض' },
  'booking.finalize': { fr: 'Finaliser la réservation', ar: 'إتمام الحجز' },
  'booking.biddingMode': { fr: '🎯 Mode enchères', ar: '🎯 وضع المزاد' },
  'booking.biddingDesc': { fr: "Proposez votre prix et recevez des offres de plusieurs prestataires. Vous pourrez ensuite choisir la meilleure offre.", ar: 'اقترح سعرك واستلم عروضاً من عدة مقدمي خدمات. يمكنك بعد ذلك اختيار أفضل عرض.' },
  'booking.proposedPrice': { fr: 'Votre prix proposé (MAD)', ar: 'السعر المقترح (درهم)' },
  'booking.minPrice': { fr: 'Prix minimum:', ar: 'الحد الأدنى للسعر:' },
  'booking.noMaxLimit': { fr: '(sans limite maximale)', ar: '(بدون حد أقصى)' },
  'booking.serviceDate': { fr: 'Date du service', ar: 'تاريخ الخدمة' },
  'booking.serviceTime': { fr: 'Heure du service', ar: 'وقت الخدمة' },
  'booking.selectTime': { fr: 'Sélectionnez une heure', ar: 'اختر الوقت' },
  'booking.daytime': { fr: 'Journée', ar: 'النهار' },
  'booking.nighttime': { fr: '🌙 Nuit (supplément)', ar: '🌙 ليل (رسوم إضافية)' },
  'booking.biddingDuration': { fr: 'Durée des enchères (heures)', ar: 'مدة المزاد (ساعات)' },
  'booking.hours12': { fr: '12 heures', ar: '12 ساعة' },
  'booking.hours24': { fr: '24 heures (recommandé)', ar: '24 ساعة (موصى به)' },
  'booking.hours48': { fr: '48 heures', ar: '48 ساعة' },
  'booking.hours72': { fr: '72 heures', ar: '72 ساعة' },
  'booking.address': { fr: 'Adresse', ar: 'العنوان' },
  'booking.date': { fr: 'Date', ar: 'التاريخ' },
  'booking.time': { fr: 'Heure', ar: 'الوقت' },
  'booking.required': { fr: '*', ar: '*' },
  'booking.fillRequired': { fr: 'Veuillez remplir tous les champs obligatoires', ar: 'يرجى ملء جميع الحقول المطلوبة' },
  'booking.createError': { fr: 'Erreur lors de la création de la commande', ar: 'خطأ أثناء إنشاء الطلب' },
  'booking.hideProviders': { fr: 'Masquer les prestataires', ar: 'إخفاء مقدمي الخدمات' },
  'booking.showProviders': { fr: 'Voir les prestataires à proximité', ar: 'عرض مقدمي الخدمات القريبين' },
  'booking.change': { fr: 'Changer', ar: 'تغيير' },
  'booking.paymentMethod': { fr: 'Mode de paiement', ar: 'طريقة الدفع' },
  'booking.cardPayment': { fr: '💳 Carte bancaire', ar: '💳 بطاقة بنكية' },
  'booking.cardPaymentDesc': { fr: 'Le paiement sera automatiquement effectué à la fin du service. Commission GlamGo : 20%', ar: 'سيتم الدفع تلقائياً عند انتهاء الخدمة. عمولة GlamGo: 20%' },
  'booking.cashPayment': { fr: '💵 Espèces', ar: '💵 نقداً' },
  'booking.cashPaymentDesc': { fr: 'Payez en espèces au prestataire. La commission GlamGo (20%) sera prélevée sur sa carte', ar: 'ادفع نقداً لمقدم الخدمة. سيتم خصم عمولة GlamGo (20%) من بطاقته' },
  'booking.additionalNotes': { fr: 'Notes supplémentaires', ar: 'ملاحظات إضافية' },
  'booking.notesPlaceholder': { fr: 'Instructions spéciales, accès, etc.', ar: 'تعليمات خاصة، طريقة الوصول، إلخ.' },
  'booking.summary': { fr: 'Récapitulatif', ar: 'الملخص' },
  'booking.service': { fr: 'Service', ar: 'الخدمة' },
  'booking.yourProposedPrice': { fr: 'Votre prix proposé', ar: 'السعر المقترح' },
  'booking.biddingDurationLabel': { fr: 'Durée des enchères', ar: 'مدة المزاد' },
  'booking.provider': { fr: 'Prestataire', ar: 'مقدم الخدمة' },
  'booking.estimatedDuration': { fr: 'Durée estimée', ar: 'المدة المتوقعة' },
  'booking.payment': { fr: 'Paiement', ar: 'الدفع' },
  'booking.formula': { fr: 'Formule', ar: 'الصيغة' },
  'booking.standard': { fr: '⚡ Standard', ar: '⚡ قياسي' },
  'booking.recurring': { fr: '🔄 Récurrent', ar: '🔄 متكرر' },
  'booking.premium': { fr: '⭐ Premium', ar: '⭐ بريميوم' },
  'booking.urgent': { fr: '🚨 Urgence', ar: '🚨 عاجل' },
  'booking.night': { fr: '🌙 Nuit', ar: '🌙 ليلي' },
  'booking.basePrice': { fr: 'Prix de base', ar: 'السعر الأساسي' },
  'booking.recurringDiscount': { fr: '🔄 Réduction récurrent', ar: '🔄 خصم متكرر' },
  'booking.premiumSupplement': { fr: '⭐ Supplément premium', ar: '⭐ رسوم بريميوم' },
  'booking.urgentSupplement': { fr: '🚨 Supplément urgence', ar: '🚨 رسوم العجلة' },
  'booking.nightSupplement': { fr: '🌙 Supplément nuit', ar: '🌙 رسوم ليلية' },
  'booking.standardFormula': { fr: 'Formule standard', ar: 'صيغة قياسية' },
  'booking.distanceFee': { fr: '🚗 Frais de distance', ar: '🚗 رسوم المسافة' },
  'booking.subtotal': { fr: 'Sous-total', ar: 'المجموع الفرعي' },
  'booking.commission': { fr: '🏷️ Commission GlamGo (20%)', ar: '🏷️ عمولة GlamGo (20%)' },
  'booking.totalToPay': { fr: 'Total à payer', ar: 'المجموع المستحق' },
  'booking.creating': { fr: 'Création en cours...', ar: 'جاري الإنشاء...' },
  'booking.reserving': { fr: 'Réservation en cours...', ar: 'جاري الحجز...' },
  'booking.createRequest': { fr: "💰 Créer la demande d'offres", ar: '💰 إنشاء طلب العروض' },
  'booking.confirmReservation': { fr: 'Confirmer la réservation', ar: 'تأكيد الحجز' },
  'booking.nightFormulaIncluded': { fr: 'Formule nuit - supplément inclus', ar: 'صيغة ليلية - الرسوم مشمولة' },
  'booking.selectFormula': { fr: 'Sélectionnez la formule', ar: 'اختر الصيغة' },
  'booking.toIncludeSupplement': { fr: 'pour inclure ce supplément', ar: 'لتضمين هذه الرسوم' },
  'booking.addressPlaceholder': { fr: 'Ex: 123 Avenue Mohammed V, Guéliz, Marrakech', ar: 'مثال: 123 شارع محمد الخامس، جيليز، مراكش' },

  // Services page
  'services.title': { fr: 'Nos Services', ar: 'خدماتنا' },
  'services.subtitle': { fr: 'Découvrez notre gamme complète de services de beauté', ar: 'اكتشفي مجموعتنا الكاملة من خدمات التجميل' },
  'services.allCategories': { fr: 'Toutes les catégories', ar: 'جميع الفئات' },
  'services.search': { fr: 'Rechercher un service...', ar: 'البحث عن خدمة...' },
  'services.noResults': { fr: 'Aucun service trouvé', ar: 'لم يتم العثور على خدمات' },
  'services.noResultsDesc': { fr: 'Essayez de modifier votre recherche ou de changer de catégorie.', ar: 'حاولي تعديل البحث أو تغيير الفئة.' },
  'services.resetFilters': { fr: 'Réinitialiser les filtres', ar: 'إعادة تعيين الفلاتر' },
  'services.from': { fr: 'À partir de', ar: 'ابتداءً من' },
  'services.viewDetails': { fr: 'Voir détails', ar: 'عرض التفاصيل' },
  'services.book': { fr: 'Réserver', ar: 'حجز' },
  'services.loadError': { fr: 'Erreur lors du chargement des services', ar: 'خطأ أثناء تحميل الخدمات' },
  'services.categoriesError': { fr: 'Erreur lors du chargement des catégories', ar: 'خطأ أثناء تحميل الفئات' },

  // Service detail
  'serviceDetail.description': { fr: 'Description', ar: 'الوصف' },
  'serviceDetail.includes': { fr: 'Ce service comprend', ar: 'تشمل هذه الخدمة' },
  'serviceDetail.duration': { fr: 'Durée', ar: 'المدة' },
  'serviceDetail.about': { fr: 'environ', ar: 'حوالي' },
  'serviceDetail.minutes': { fr: 'minutes', ar: 'دقيقة' },
  'serviceDetail.price': { fr: 'Prix', ar: 'السعر' },
  'serviceDetail.category': { fr: 'Catégorie', ar: 'الفئة' },
  'serviceDetail.bookNow': { fr: 'Réserver maintenant', ar: 'احجزي الآن' },
  'serviceDetail.similar': { fr: 'Services similaires', ar: 'خدمات مشابهة' },

  // Formulas
  'formulas.title': { fr: 'Nos Formules', ar: 'صيغنا' },
  'formulas.subtitle': { fr: 'Choisissez la formule qui vous convient', ar: 'اختاري الصيغة المناسبة لك' },
  'formulas.recommended': { fr: 'Recommandé', ar: 'موصى به' },
  'formulas.popular': { fr: 'Populaire', ar: 'شائع' },

  // Bidding
  'bidding.title': { fr: 'Enchères', ar: 'المزادات' },
  'bidding.subtitle': { fr: 'Recevez des offres de prestataires', ar: 'استلمي عروضاً من مقدمي الخدمات' },
  'bidding.howItWorks': { fr: 'Comment ça marche', ar: 'كيف يعمل' },
  'bidding.step1': { fr: 'Choisissez votre service', ar: 'اختاري خدمتك' },
  'bidding.step2': { fr: 'Proposez votre prix', ar: 'اقترحي سعرك' },
  'bidding.step3': { fr: 'Recevez des offres', ar: 'استلمي العروض' },
  'bidding.step4': { fr: 'Choisissez le meilleur', ar: 'اختاري الأفضل' },

  // Onboarding
  'onboarding.welcome': { fr: 'Bienvenue sur GlamGo', ar: 'مرحباً بك في GlamGo' },
  'onboarding.tagline': { fr: 'Votre beauté, à domicile', ar: 'جمالك، في منزلك' },
  'onboarding.start': { fr: 'Commencer', ar: 'ابدأي' },
  'onboarding.next': { fr: 'Suivant', ar: 'التالي' },
  'onboarding.previous': { fr: 'Précédent', ar: 'السابق' },
  'onboarding.finish': { fr: 'Terminer', ar: 'إنهاء' },
  'onboarding.skip': { fr: 'Passer', ar: 'تخطي' },

  // How it works
  'howItWorks.title': { fr: 'Comment ça marche ?', ar: 'كيف يعمل؟' },
  'howItWorks.subtitle': { fr: 'Découvrez comment réserver un service', ar: 'اكتشفي كيفية حجز خدمة' },
  'howItWorks.forClients': { fr: 'Pour les clients', ar: 'للعملاء' },
  'howItWorks.forProviders': { fr: 'Pour les prestataires', ar: 'لمقدمي الخدمات' },
  'howItWorks.step': { fr: 'Étape', ar: 'الخطوة' },
  'howItWorks.chooseService': { fr: 'Choisissez un service', ar: 'اختاري خدمة' },
  'howItWorks.bookOnline': { fr: 'Réservez en ligne', ar: 'احجزي عبر الإنترنت' },
  'howItWorks.enjoyService': { fr: 'Profitez du service', ar: 'استمتعي بالخدمة' },
  'howItWorks.rateExperience': { fr: 'Évaluez votre expérience', ar: 'قيّمي تجربتك' },

  // Common
  'common.loading': { fr: 'Chargement...', ar: 'جاري التحميل...' },
  'common.error': { fr: 'Erreur', ar: 'خطأ' },
  'common.success': { fr: 'Succès', ar: 'نجاح' },
  'common.cancel': { fr: 'Annuler', ar: 'إلغاء' },
  'common.confirm': { fr: 'Confirmer', ar: 'تأكيد' },
  'common.save': { fr: 'Enregistrer', ar: 'حفظ' },
  'common.edit': { fr: 'Modifier', ar: 'تعديل' },
  'common.delete': { fr: 'Supprimer', ar: 'حذف' },
  'common.close': { fr: 'Fermer', ar: 'إغلاق' },
  'common.yes': { fr: 'Oui', ar: 'نعم' },
  'common.no': { fr: 'Non', ar: 'لا' },
  'common.hours': { fr: 'heures', ar: 'ساعة' },
};

// Générer le code à ajouter dans LanguageContext.js
function generateTranslationCode() {
  let frCode = '\n    // === AUTO-GENERATED TRANSLATIONS ===\n';
  let arCode = '\n    // === AUTO-GENERATED TRANSLATIONS ===\n';

  Object.entries(allTranslations).forEach(([key, value]) => {
    frCode += `    '${key}': '${value.fr.replace(/'/g, "\\'")}',\n`;
    arCode += `    '${key}': '${value.ar}',\n`;
  });

  return { frCode, arCode };
}

const { frCode, arCode } = generateTranslationCode();

console.log('=== Traductions à ajouter dans LanguageContext.js ===\n');
console.log('--- SECTION FRANÇAISE (à ajouter dans fr: {}) ---');
console.log(frCode);
console.log('\n--- SECTION ARABE (à ajouter dans ar: {}) ---');
console.log(arCode);

// Écrire dans un fichier pour faciliter le copier-coller
fs.writeFileSync('scripts/translations-to-add.txt',
  '=== SECTION FRANÇAISE ===\n' + frCode +
  '\n\n=== SECTION ARABE ===\n' + arCode
);

console.log('\n✅ Code sauvegardé dans scripts/translations-to-add.txt');
console.log(`\n📊 Total: ${Object.keys(allTranslations).length} traductions générées`);
