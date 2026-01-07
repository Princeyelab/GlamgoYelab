/**
 * Traductions des services et categories
 * Ce fichier contient les traductions des noms et descriptions
 * des services et categories de la base de donnees
 * Supporte: FR, AR, EN
 */

// Type pour les traductions trilingues
type Translation = { fr: string; ar: string; en: string };

// Traductions des categories
export const categoryTranslations: Record<string, Translation> = {
  // Fallback defaults
  'Service': { fr: 'Service', ar: 'خدمة', en: 'Service' },
  'Prestataire': { fr: 'Prestataire', ar: 'مقدم الخدمة', en: 'Provider' },

  // Main categories (exact matches from API)
  'Maison': { fr: 'Maison', ar: 'المنزل', en: 'Home' },
  'Maison & Ménage': { fr: 'Maison & Ménage', ar: 'المنزل والتنظيف', en: 'Home & Cleaning' },
  'Maison & Menage': { fr: 'Maison & Ménage', ar: 'المنزل والتنظيف', en: 'Home & Cleaning' },
  'Beaute': { fr: 'Beauté', ar: 'الجمال', en: 'Beauty' },
  'Beauté': { fr: 'Beauté', ar: 'الجمال', en: 'Beauty' },
  'Voiture': { fr: 'Voiture', ar: 'السيارة', en: 'Car' },
  'Auto': { fr: 'Auto', ar: 'السيارة', en: 'Auto' },
  'Bien-etre': { fr: 'Bien-être', ar: 'الرفاهية', en: 'Wellness' },
  'Bien-être': { fr: 'Bien-être', ar: 'الرفاهية', en: 'Wellness' },
  'Animaux': { fr: 'Animaux', ar: 'الحيوانات', en: 'Pets' },
  'Animaux de compagnie': { fr: 'Animaux de compagnie', ar: 'الحيوانات الأليفة', en: 'Pets' },

  // Additional categories
  'Coiffure': { fr: 'Coiffure', ar: 'تصفيف الشعر', en: 'Hairdressing' },
  'Maquillage': { fr: 'Maquillage', ar: 'المكياج', en: 'Makeup' },
  'Manucure': { fr: 'Manucure', ar: 'العناية بالاظافر', en: 'Manicure' },
  'Pédicure': { fr: 'Pédicure', ar: 'باديكير', en: 'Pedicure' },
  'Epilation': { fr: 'Epilation', ar: 'ازالة الشعر', en: 'Hair Removal' },
  'Épilation': { fr: 'Épilation', ar: 'ازالة الشعر', en: 'Hair Removal' },
  'Massage': { fr: 'Massage', ar: 'التدليك', en: 'Massage' },
  'Ménage': { fr: 'Ménage', ar: 'التنظيف', en: 'Cleaning' },
  'Menage': { fr: 'Menage', ar: 'التنظيف', en: 'Cleaning' },
};

// Traductions des services - EXACT MATCHES from API/constants
export const serviceTranslations: Record<string, {
  title: Translation;
  description: Translation;
}> = {
  // === MAISON ===
  'Menage classique': {
    title: { fr: 'Ménage classique', ar: 'تنظيف منزلي كلاسيكي', en: 'Standard Cleaning' },
    description: {
      fr: 'Nettoyage standard de votre logement avec produits fournis. Inclut aspirateur, serpillière et dépoussiérage.',
      ar: 'تنظيف قياسي لمنزلك مع توفير المنتجات. يشمل المكنسة الكهربائية والممسحة وازالة الغبار.',
      en: 'Standard cleaning of your home with products provided. Includes vacuuming, mopping and dusting.'
    }
  },
  'Ménage classique': {
    title: { fr: 'Ménage classique', ar: 'تنظيف منزلي كلاسيكي', en: 'Standard Cleaning' },
    description: {
      fr: 'Nettoyage standard de votre logement avec produits fournis. Inclut aspirateur, serpillière et dépoussiérage.',
      ar: 'تنظيف قياسي لمنزلك مع توفير المنتجات. يشمل المكنسة الكهربائية والممسحة وازالة الغبار.',
      en: 'Standard cleaning of your home with products provided. Includes vacuuming, mopping and dusting.'
    }
  },
  'Ménage': {
    title: { fr: 'Ménage', ar: 'التنظيف', en: 'Cleaning' },
    description: {
      fr: 'Service de ménage professionnel à domicile.',
      ar: 'خدمة تنظيف منزلي احترافية.',
      en: 'Professional home cleaning service.'
    }
  },
  'Menage': {
    title: { fr: 'Ménage', ar: 'التنظيف', en: 'Cleaning' },
    description: {
      fr: 'Service de ménage professionnel à domicile.',
      ar: 'خدمة تنظيف منزلي احترافية.',
      en: 'Professional home cleaning service.'
    }
  },
  'Jardinage': {
    title: { fr: 'Jardinage', ar: 'البستنة', en: 'Gardening' },
    description: {
      fr: 'Entretien de vos espaces verts : tonte pelouse, taille haies, desherbage et plantation de fleurs.',
      ar: 'العناية بالمساحات الخضراء: قص العشب، تقليم الاسوار، ازالة الاعشاب وزراعة الزهور.',
      en: 'Maintenance of your green spaces: lawn mowing, hedge trimming, weeding and flower planting.'
    }
  },
  'Bricolage': {
    title: { fr: 'Bricolage', ar: 'الاصلاحات المنزلية', en: 'Handyman' },
    description: {
      fr: 'Petits travaux et reparations : montage meubles, percage, fixations murales et petite plomberie.',
      ar: 'اعمال صغيرة واصلاحات: تركيب الاثاث، الثقب، التثبيتات الجدارية والسباكة الصغيرة.',
      en: 'Small jobs and repairs: furniture assembly, drilling, wall fixtures and minor plumbing.'
    }
  },
  'Chef a domicile': {
    title: { fr: 'Chef a domicile', ar: 'طباخ منزلي', en: 'Private Chef' },
    description: {
      fr: 'Chef professionnel prepare vos repas a domicile. Menu personnalise selon vos gouts. A partir de 2 personnes.',
      ar: 'طباخ محترف يحضر وجباتك في المنزل. قائمة طعام مخصصة حسب ذوقك. ابتداء من شخصين.',
      en: 'Professional chef prepares your meals at home. Personalized menu according to your taste. From 2 people.'
    }
  },

  // === BEAUTE - COIFFURE HOMME ===
  'Coiffure Homme Simple': {
    title: { fr: 'Coiffure Homme Simple', ar: 'قص شعر رجالي بسيط', en: 'Simple Men\'s Haircut' },
    description: {
      fr: 'Coupe de cheveux classique pour homme. Shampooing et coiffage inclus.',
      ar: 'قص شعر كلاسيكي للرجال. يشمل الشامبو والتصفيف.',
      en: 'Classic men\'s haircut. Shampoo and styling included.'
    }
  },
  'Coiffure Homme Premium': {
    title: { fr: 'Coiffure Homme Premium', ar: 'قص شعر رجالي فاخر', en: 'Premium Men\'s Haircut' },
    description: {
      fr: 'Coupe tendance personnalisee avec produits haut de gamme. Conseil coiffure inclus.',
      ar: 'قصة عصرية مخصصة بمنتجات عالية الجودة. استشارة تصفيف مشمولة.',
      en: 'Personalized trendy cut with premium products. Styling advice included.'
    }
  },
  'Taille de Barbe': {
    title: { fr: 'Taille de Barbe', ar: 'تهذيب اللحية', en: 'Beard Trim' },
    description: {
      fr: 'Taille et modelage de barbe professionnel. Finitions au rasoir.',
      ar: 'تهذيب وتشكيل اللحية باحترافية. تشطيبات بالموس.',
      en: 'Professional beard trimming and shaping. Razor finishing.'
    }
  },
  'Pack Coiffure + Barbe': {
    title: { fr: 'Pack Coiffure + Barbe', ar: 'باقة قص شعر + لحية', en: 'Haircut + Beard Package' },
    description: {
      fr: 'Formule complete : coupe de cheveux et taille de barbe. Le duo parfait.',
      ar: 'باقة كاملة: قص الشعر وتهذيب اللحية. الثنائي المثالي.',
      en: 'Complete package: haircut and beard trim. The perfect duo.'
    }
  },

  // === BEAUTE - COIFFURE FEMME ===
  'Coiffure Classique': {
    title: { fr: 'Coiffure Classique', ar: 'تصفيف شعر كلاسيكي', en: 'Classic Hairstyle' },
    description: {
      fr: 'Coupe et brushing classique pour femme. Shampooing et soin inclus.',
      ar: 'قص وتصفيف كلاسيكي للنساء. يشمل الشامبو والعناية.',
      en: 'Classic cut and blow-dry for women. Shampoo and care included.'
    }
  },
  'Coiffure Express': {
    title: { fr: 'Coiffure Express', ar: 'تصفيف شعر سريع', en: 'Express Hairstyle' },
    description: {
      fr: 'Brushing rapide pour un look impeccable en peu de temps.',
      ar: 'تصفيف سريع للحصول على مظهر مثالي في وقت قصير.',
      en: 'Quick blow-dry for an impeccable look in no time.'
    }
  },
  'Coiffure Mariage': {
    title: { fr: 'Coiffure Mariage', ar: 'تسريحة عروس', en: 'Wedding Hairstyle' },
    description: {
      fr: 'Coiffure de mariee sur mesure. Essai prealable recommande.',
      ar: 'تسريحة عروس مخصصة. يُنصح بتجربة مسبقة.',
      en: 'Custom bridal hairstyle. Prior trial recommended.'
    }
  },
  'Coiffure Mariage & Événement': {
    title: { fr: 'Coiffure Mariage & Événement', ar: 'تسريحة عروس ومناسبات', en: 'Wedding & Event Hairstyle' },
    description: {
      fr: 'Coiffure elaborate pour mariage et evenements speciaux. Accessoires fournis.',
      ar: 'تسريحة متقنة للأعراس والمناسبات الخاصة. الإكسسوارات متوفرة.',
      en: 'Elaborate hairstyle for weddings and special events. Accessories provided.'
    }
  },

  // === VOITURE ===
  'Nettoyage Auto Externe': {
    title: { fr: 'Nettoyage Auto Externe', ar: 'تنظيف السيارة الخارجي', en: 'Exterior Car Wash' },
    description: {
      fr: 'Lavage exterieur complet : carrosserie, vitres, jantes. Finition brillante.',
      ar: 'غسيل خارجي كامل: الهيكل، النوافذ، الجنوط. لمسة نهائية لامعة.',
      en: 'Complete exterior wash: bodywork, windows, rims. Shiny finish.'
    }
  },
  'Nettoyage Auto Interne': {
    title: { fr: 'Nettoyage Auto Interne', ar: 'تنظيف السيارة الداخلي', en: 'Interior Car Cleaning' },
    description: {
      fr: 'Nettoyage interieur approfondi : sieges, tableau de bord, moquettes.',
      ar: 'تنظيف داخلي عميق: المقاعد، لوحة القيادة، السجاد.',
      en: 'Deep interior cleaning: seats, dashboard, carpets.'
    }
  },
  'Nettoyage Auto Complet': {
    title: { fr: 'Nettoyage Auto Complet', ar: 'تنظيف السيارة الكامل', en: 'Complete Car Cleaning' },
    description: {
      fr: 'Nettoyage integral interieur et exterieur. Votre vehicule comme neuf.',
      ar: 'تنظيف شامل داخلي وخارجي. سيارتك كالجديدة.',
      en: 'Full interior and exterior cleaning. Your vehicle like new.'
    }
  },

  // === BIEN-ETRE ===
  'Massage Relaxant': {
    title: { fr: 'Massage Relaxant', ar: 'تدليك استرخائي', en: 'Relaxing Massage' },
    description: {
      fr: 'Massage doux pour evacuer le stress et les tensions. Huiles essentielles incluses.',
      ar: 'تدليك لطيف لإزالة التوتر والضغط. الزيوت العطرية مشمولة.',
      en: 'Gentle massage to relieve stress and tension. Essential oils included.'
    }
  },
  'Hammam & Gommage': {
    title: { fr: 'Hammam & Gommage', ar: 'حمام وتقشير', en: 'Hammam & Scrub' },
    description: {
      fr: 'Rituel hammam traditionnel avec gommage au savon noir. Peau douce garantie.',
      ar: 'طقوس الحمام التقليدية مع تقشير بالصابون الأسود. بشرة ناعمة مضمونة.',
      en: 'Traditional hammam ritual with black soap scrub. Soft skin guaranteed.'
    }
  },
  'Soin Premium Argan': {
    title: { fr: 'Soin Premium Argan', ar: 'علاج فاخر بالارغان', en: 'Premium Argan Treatment' },
    description: {
      fr: 'Soin luxueux a l\'huile d\'argan du Maroc. Hydratation intense.',
      ar: 'علاج فاخر بزيت الأرغان المغربي. ترطيب مكثف.',
      en: 'Luxurious treatment with Moroccan argan oil. Intense hydration.'
    }
  },
  'Yoga': {
    title: { fr: 'Yoga', ar: 'يوغا', en: 'Yoga' },
    description: {
      fr: 'Seance de yoga personnalisee a domicile. Tous niveaux acceptes.',
      ar: 'جلسة يوغا مخصصة في المنزل. جميع المستويات مقبولة.',
      en: 'Personalized yoga session at home. All levels welcome.'
    }
  },
  'Coach Sportif': {
    title: { fr: 'Coach Sportif', ar: 'مدرب رياضي', en: 'Personal Trainer' },
    description: {
      fr: 'Entrainement sportif personnalise selon vos objectifs. Programme sur mesure.',
      ar: 'تدريب رياضي مخصص حسب أهدافك. برنامج حسب الطلب.',
      en: 'Personalized sports training according to your goals. Custom program.'
    }
  },
  'Danse Orientale': {
    title: { fr: 'Danse Orientale', ar: 'رقص شرقي', en: 'Oriental Dance' },
    description: {
      fr: 'Cours de danse orientale a domicile. Debutants bienvenus.',
      ar: 'دروس الرقص الشرقي في المنزل. المبتدئون مرحب بهم.',
      en: 'Oriental dance lessons at home. Beginners welcome.'
    }
  },
  'Hijama': {
    title: { fr: 'Hijama', ar: 'الحجامة', en: 'Cupping Therapy' },
    description: {
      fr: 'Therapie traditionnelle par ventouses. Praticien certifie.',
      ar: 'العلاج التقليدي بالحجامة. ممارس معتمد.',
      en: 'Traditional cupping therapy. Certified practitioner.'
    }
  },

  // === ANIMAUX ===
  "Gardiennage d'Animaux": {
    title: { fr: "Gardiennage d'Animaux", ar: 'رعاية الحيوانات', en: 'Pet Sitting' },
    description: {
      fr: 'Garde de vos animaux a domicile. Soins, repas et promenades inclus.',
      ar: 'رعاية حيواناتك في المنزل. العناية والوجبات والتمشية مشمولة.',
      en: 'Pet care at your home. Care, meals and walks included.'
    }
  },
  "Promenade d'Animaux": {
    title: { fr: "Promenade d'Animaux", ar: 'تمشية الحيوانات', en: 'Pet Walking' },
    description: {
      fr: 'Promenade quotidienne pour votre chien. Duree et frequence au choix.',
      ar: 'نزهة يومية لكلبك. المدة والتكرار حسب الاختيار.',
      en: 'Daily walk for your dog. Duration and frequency of your choice.'
    }
  },

  // === EPILATION ===
  'Smooth Femme': {
    title: { fr: 'Smooth Femme', ar: 'ازالة شعر نسائي', en: 'Women\'s Hair Removal' },
    description: {
      fr: 'Epilation zones au choix pour femme. Cire chaude de qualite.',
      ar: 'إزالة الشعر للمناطق المختارة للنساء. شمع ساخن عالي الجودة.',
      en: 'Hair removal for selected areas for women. Quality hot wax.'
    }
  },
  'Smooth Femme Full': {
    title: { fr: 'Smooth Femme Full', ar: 'ازالة شعر نسائي كامل', en: 'Full Women\'s Hair Removal' },
    description: {
      fr: 'Epilation complete corps entier pour femme. Resultat longue duree.',
      ar: 'إزالة شعر كاملة للجسم للنساء. نتيجة طويلة الأمد.',
      en: 'Complete full body hair removal for women. Long-lasting result.'
    }
  },
  'Smooth Homme': {
    title: { fr: 'Smooth Homme', ar: 'ازالة شعر رجالي', en: 'Men\'s Hair Removal' },
    description: {
      fr: 'Epilation zones au choix pour homme. Discretion assuree.',
      ar: 'إزالة الشعر للمناطق المختارة للرجال. السرية مضمونة.',
      en: 'Hair removal for selected areas for men. Discretion assured.'
    }
  },
  'Smooth Homme Full': {
    title: { fr: 'Smooth Homme Full', ar: 'ازالة شعر رجالي كامل', en: 'Full Men\'s Hair Removal' },
    description: {
      fr: 'Epilation complete corps entier pour homme. Peau lisse garantie.',
      ar: 'إزالة شعر كاملة للجسم للرجال. بشرة ناعمة مضمونة.',
      en: 'Complete full body hair removal for men. Smooth skin guaranteed.'
    }
  },

  // === MANUCURE ===
  'Manucure Classique': {
    title: { fr: 'Manucure Classique', ar: 'مانيكير كلاسيكي', en: 'Classic Manicure' },
    description: {
      fr: 'Soin des ongles complet avec pose de vernis classique.',
      ar: 'عناية كاملة بالأظافر مع وضع طلاء كلاسيكي.',
      en: 'Complete nail care with classic polish application.'
    }
  },
  'Manucure Gel / Semi-permanent': {
    title: { fr: 'Manucure Gel / Semi-permanent', ar: 'مانيكير جل / شبه دائم', en: 'Gel / Semi-permanent Manicure' },
    description: {
      fr: 'Manucure avec vernis gel longue tenue. Jusqu\'a 3 semaines de beaute.',
      ar: 'مانيكير بطلاء جل طويل الأمد. جمال يدوم حتى 3 أسابيع.',
      en: 'Manicure with long-lasting gel polish. Up to 3 weeks of beauty.'
    }
  },

  // === MAQUILLAGE ===
  'Maquillage Jour': {
    title: { fr: 'Maquillage Jour', ar: 'مكياج نهاري', en: 'Day Makeup' },
    description: {
      fr: 'Maquillage naturel et frais pour le quotidien. Teint parfait.',
      ar: 'مكياج طبيعي ومنعش لليوم. بشرة مثالية.',
      en: 'Natural and fresh makeup for everyday. Perfect complexion.'
    }
  },
  'Maquillage Mariage': {
    title: { fr: 'Maquillage Mariage', ar: 'مكياج زفاف', en: 'Wedding Makeup' },
    description: {
      fr: 'Maquillage de mariee sophistique. Essai prealable recommande.',
      ar: 'مكياج عروس راقي. يُنصح بتجربة مسبقة.',
      en: 'Sophisticated bridal makeup. Prior trial recommended.'
    }
  },
};

/**
 * Fonction utilitaire pour obtenir la traduction d'un service
 * Utilise une correspondance exacte puis une recherche partielle
 */
export function getServiceTranslation(
  title: string,
  language: 'fr' | 'ar' | 'en'
): { title: string; description?: string } {
  if (!title) return { title: '' };

  // 1. Correspondance exacte
  const exactMatch = serviceTranslations[title];
  if (exactMatch) {
    return {
      title: exactMatch.title[language],
      description: exactMatch.description?.[language],
    };
  }

  // 2. Correspondance insensible a la casse
  const lowerTitle = title.toLowerCase();
  for (const [key, value] of Object.entries(serviceTranslations)) {
    if (key.toLowerCase() === lowerTitle) {
      return {
        title: value.title[language],
        description: value.description?.[language],
      };
    }
  }

  // 3. Correspondance partielle (le titre contient la cle ou vice versa)
  for (const [key, value] of Object.entries(serviceTranslations)) {
    if (lowerTitle.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerTitle)) {
      return {
        title: value.title[language],
        description: value.description?.[language],
      };
    }
  }

  // 4. Retourner le titre original si pas de traduction
  return { title };
}

// Traductions des formules d'abonnement
export const formulaTranslations: Record<string, Translation> = {
  // Formules principales de reservation
  'Standard': { fr: 'Standard', ar: 'عادي', en: 'Standard' },
  'standard': { fr: 'Standard', ar: 'عادي', en: 'Standard' },
  'Premium': { fr: 'Premium', ar: 'مميز', en: 'Premium' },
  'premium': { fr: 'Premium', ar: 'مميز', en: 'Premium' },
  'Urgent': { fr: 'Urgent', ar: 'عاجل', en: 'Urgent' },
  'urgent': { fr: 'Urgent', ar: 'عاجل', en: 'Urgent' },
  'Récurrent': { fr: 'Récurrent', ar: 'متكرر', en: 'Recurring' },
  'Recurrent': { fr: 'Récurrent', ar: 'متكرر', en: 'Recurring' },
  'récurrent': { fr: 'Récurrent', ar: 'متكرر', en: 'Recurring' },
  'recurrent': { fr: 'Récurrent', ar: 'متكرر', en: 'Recurring' },
  'Nuit': { fr: 'Nuit', ar: 'ليلي', en: 'Night' },
  'nuit': { fr: 'Nuit', ar: 'ليلي', en: 'Night' },
  // Autres formules
  'Essentiel': { fr: 'Essentiel', ar: 'الاساسي', en: 'Essential' },
  'VIP': { fr: 'VIP', ar: 'كبار العملاء', en: 'VIP' },
  'Decouverte': { fr: 'Découverte', ar: 'اكتشاف', en: 'Discovery' },
  'Découverte': { fr: 'Découverte', ar: 'اكتشاف', en: 'Discovery' },
  'Classique': { fr: 'Classique', ar: 'كلاسيكي', en: 'Classic' },
  'Intensif': { fr: 'Intensif', ar: 'مكثف', en: 'Intensive' },
  'Starter': { fr: 'Starter', ar: 'البداية', en: 'Starter' },
  'Pro': { fr: 'Pro', ar: 'احترافي', en: 'Pro' },
  'Business': { fr: 'Business', ar: 'اعمال', en: 'Business' },
  'Gratuit': { fr: 'Gratuit', ar: 'مجاني', en: 'Free' },
  'Free': { fr: 'Free', ar: 'مجاني', en: 'Free' },
};

/**
 * Fonction utilitaire pour obtenir la traduction d'une formule
 */
export function getFormulaTranslation(
  name: string,
  language: 'fr' | 'ar' | 'en'
): string {
  if (!name) return '';

  const exactMatch = formulaTranslations[name];
  if (exactMatch) {
    return exactMatch[language];
  }

  // Correspondance insensible a la casse
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(formulaTranslations)) {
    if (key.toLowerCase() === lowerName) {
      return value[language];
    }
  }

  return name;
}

/**
 * Fonction utilitaire pour obtenir la traduction d'une categorie
 */
export function getCategoryTranslation(
  name: string,
  language: 'fr' | 'ar' | 'en'
): string {
  if (!name) return '';

  // 1. Correspondance exacte
  const exactMatch = categoryTranslations[name];
  if (exactMatch) {
    return exactMatch[language];
  }

  // 2. Correspondance insensible a la casse
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(categoryTranslations)) {
    if (key.toLowerCase() === lowerName) {
      return value[language];
    }
  }

  // 3. Retourner le nom original si pas de traduction
  return name;
}
