/**
 * Traductions des services et categories
 * Ce fichier contient les traductions des noms et descriptions
 * des services et categories de la base de donnees
 * Supporte: FR, AR, EN, ES
 */

// Type pour les traductions quadrilingues
type Translation = { fr: string; ar: string; en: string; es: string; de: string };

// Traductions des categories
export const categoryTranslations: Record<string, Translation> = {
  // Fallback defaults
  'Service': { fr: 'Service', ar: 'خدمة', en: 'Service', es: 'Servicio', de: 'Dienst' },
  'Prestataire': { fr: 'Prestataire', ar: 'مقدم الخدمة', en: 'Provider', es: 'Proveedor', de: 'Anbieter' },

  // Main categories (exact matches from API)
  'Maison': { fr: 'Maison', ar: 'المنزل', en: 'Home', es: 'Hogar', de: 'Haus' },
  'Maison & Ménage': { fr: 'Maison & Ménage', ar: 'المنزل والتنظيف', en: 'Home & Cleaning', es: 'Hogar y Limpieza', de: 'Haus & Haushalt' },
  'Maison & Menage': { fr: 'Maison & Ménage', ar: 'المنزل والتنظيف', en: 'Home & Cleaning', es: 'Hogar y Limpieza', de: 'Haus & Haushalt' },
  'Beaute': { fr: 'Beauté', ar: 'الجمال', en: 'Beauty', es: 'Belleza', de: 'Schönheit' },
  'Beauté': { fr: 'Beauté', ar: 'الجمال', en: 'Beauty', es: 'Belleza', de: 'Schönheit' },
  'Voiture': { fr: 'Voiture', ar: 'السيارة', en: 'Car', es: 'Coche', de: 'Auto' },
  'Auto': { fr: 'Auto', ar: 'السيارة', en: 'Auto', es: 'Auto', de: 'Auto' },
  'Bien-etre': { fr: 'Bien-être', ar: 'الرفاهية', en: 'Wellness', es: 'Bienestar', de: 'Wohlbefinden' },
  'Bien-être': { fr: 'Bien-être', ar: 'الرفاهية', en: 'Wellness', es: 'Bienestar', de: 'Wohlbefinden' },
  'Animaux': { fr: 'Animaux', ar: 'الحيوانات', en: 'Pets', es: 'Mascotas', de: 'Tiere' },
  'Animaux de compagnie': { fr: 'Animaux de compagnie', ar: 'الحيوانات الأليفة', en: 'Pets', es: 'Mascotas', de: 'Haustiere' },

  // Additional categories
  'Coiffure': { fr: 'Coiffure', ar: 'تصفيف الشعر', en: 'Hairdressing', es: 'Peluquería', de: 'Frisur' },
  'Maquillage': { fr: 'Maquillage', ar: 'المكياج', en: 'Makeup', es: 'Maquillaje', de: 'Make-up' },
  'Manucure': { fr: 'Manucure', ar: 'العناية بالاظافر', en: 'Manicure', es: 'Manicura', de: 'Maniküre' },
  'Pédicure': { fr: 'Pédicure', ar: 'باديكير', en: 'Pedicure', es: 'Pedicura', de: 'Fußpflegerin' },
  'Epilation': { fr: 'Epilation', ar: 'ازالة الشعر', en: 'Hair Removal', es: 'Depilación', de: 'Haarentfernung' },
  'Épilation': { fr: 'Épilation', ar: 'ازالة الشعر', en: 'Hair Removal', es: 'Depilación', de: 'Haarentfernung' },
  'Massage': { fr: 'Massage', ar: 'التدليك', en: 'Massage', es: 'Masaje', de: 'Massage' },
  'Ménage': { fr: 'Ménage', ar: 'التنظيف', en: 'Cleaning', es: 'Limpieza', de: 'Haushalt' },
  'Menage': { fr: 'Menage', ar: 'التنظيف', en: 'Cleaning', es: 'Limpieza', de: 'Menage' },
};

// Traductions des services - EXACT MATCHES from API/constants
export const serviceTranslations: Record<string, {
  title: Translation;
  description: Translation;
}> = {
  // === MAISON ===
  'Menage classique': {
    title: { fr: 'Ménage classique', ar: 'تنظيف منزلي كلاسيكي', en: 'Standard Cleaning', es: 'Limpieza estándar', de: 'Klassischer Haushalt' },
    description: {
      fr: 'Nettoyage standard de votre logement avec produits fournis. Inclut aspirateur, serpillière et dépoussiérage.',
      ar: 'تنظيف قياسي لمنزلك مع توفير المنتجات. يشمل المكنسة الكهربائية والممسحة وازالة الغبار.',
      en: 'Standard cleaning of your home with products provided. Includes vacuuming, mopping and dusting.', es: 'Limpieza estándar de su hogar con productos incluidos. Incluye aspiradora, fregado y desempolvado.', de: 'Standardreinigung Ihrer Unterkunft mit bereitgestellten Produkten. Beinhaltet Staubsauger, Wischmopp und Staubwischen.' }
  },
  'Ménage classique': {
    title: { fr: 'Ménage classique', ar: 'تنظيف منزلي كلاسيكي', en: 'Standard Cleaning', es: 'Limpieza estándar', de: 'Klassischer Haushalt' },
    description: {
      fr: 'Nettoyage standard de votre logement avec produits fournis. Inclut aspirateur, serpillière et dépoussiérage.',
      ar: 'تنظيف قياسي لمنزلك مع توفير المنتجات. يشمل المكنسة الكهربائية والممسحة وازالة الغبار.',
      en: 'Standard cleaning of your home with products provided. Includes vacuuming, mopping and dusting.', es: 'Limpieza estándar de su hogar con productos incluidos. Incluye aspiradora, fregado y desempolvado.', de: 'Standardreinigung Ihrer Unterkunft mit bereitgestellten Produkten. Beinhaltet Staubsauger, Wischmopp und Staubwischen.' }
  },
  'Ménage': {
    title: { fr: 'Ménage', ar: 'التنظيف', en: 'Cleaning', es: 'Limpieza', de: 'Haushalt' },
    description: {
      fr: 'Service de ménage professionnel à domicile.',
      ar: 'خدمة تنظيف منزلي احترافية.',
      en: 'Professional home cleaning service.', es: 'Servicio de limpieza profesional a domicilio.', de: 'Professionelle Haushaltshilfe zu Hause.' }
  },
  'Menage': {
    title: { fr: 'Ménage', ar: 'التنظيف', en: 'Cleaning', es: 'Limpieza', de: 'Haushalt' },
    description: {
      fr: 'Service de ménage professionnel à domicile.',
      ar: 'خدمة تنظيف منزلي احترافية.',
      en: 'Professional home cleaning service.', es: 'Servicio de limpieza profesional a domicilio.', de: 'Professionelle Haushaltshilfe zu Hause.' }
  },
  'Jardinage': {
    title: { fr: 'Jardinage', ar: 'البستنة', en: 'Gardening', es: 'Jardinería', de: 'Gartenarbeit' },
    description: {
      fr: 'Entretien de vos espaces verts : tonte pelouse, taille haies, desherbage et plantation de fleurs.',
      ar: 'العناية بالمساحات الخضراء: قص العشب، تقليم الاسوار، ازالة الاعشاب وزراعة الزهور.',
      en: 'Maintenance of your green spaces: lawn mowing, hedge trimming, weeding and flower planting.', es: 'Mantenimiento de sus espacios verdes: corte de césped, poda de setos, deshierbe y plantación de flores.', de: 'Pflege Ihrer Grünflächen: Rasen mähen, Hecken schneiden, Unkraut jäten und Blumen pflanzen.' }
  },
  'Bricolage': {
    title: { fr: 'Bricolage', ar: 'الاصلاحات المنزلية', en: 'Handyman', es: 'Bricolaje', de: 'Heimwerken' },
    description: {
      fr: 'Petits travaux et reparations : montage meubles, percage, fixations murales et petite plomberie.',
      ar: 'اعمال صغيرة واصلاحات: تركيب الاثاث، الثقب، التثبيتات الجدارية والسباكة الصغيرة.',
      en: 'Small jobs and repairs: furniture assembly, drilling, wall fixtures and minor plumbing.', es: 'Pequeños trabajos y reparaciones: montaje de muebles, taladrado, fijaciones murales y pequeña fontanería.', de: 'Kleinere Arbeiten und Reparaturen: Montage von Möbeln, Bohren, Wandbefestigungen und kleine Klempnerarbeiten.' }
  },
  'Chef a domicile': {
    title: { fr: 'Chef a domicile', ar: 'طباخ منزلي', en: 'Private Chef', es: 'Chef a domicilio', de: 'Chefkoch zu Hause' },
    description: {
      fr: 'Chef professionnel prepare vos repas a domicile. Menu personnalise selon vos gouts. A partir de 2 personnes.',
      ar: 'طباخ محترف يحضر وجباتك في المنزل. قائمة طعام مخصصة حسب ذوقك. ابتداء من شخصين.',
      en: 'Professional chef prepares your meals at home. Personalized menu according to your taste. From 2 people.', es: 'Chef profesional prepara sus comidas en casa. Menú personalizado según sus gustos. A partir de 2 personas.', de: 'Professioneller Koch bereitet Ihre Mahlzeiten zu Hause zu. Menü nach Ihrem Geschmack. Ab 2 Personen.' }
  },

  // === BEAUTE - COIFFURE HOMME ===
  'Coiffure Homme Simple': {
    title: { fr: 'Coiffure Homme Simple', ar: 'قص شعر رجالي بسيط', en: 'Simple Men\'s Haircut', es: 'Corte de cabello masculino simple', de: 'Einfacher Herrenhaarschnitt' },
    description: {
      fr: 'Coupe de cheveux classique pour homme. Shampooing et coiffage inclus.',
      ar: 'قص شعر كلاسيكي للرجال. يشمل الشامبو والتصفيف.',
      en: 'Classic men\'s haircut. Shampoo and styling included.',
      es: 'Corte de cabello clásico para hombre. Champú y peinado incluidos.',
      de: 'Klassischer Herrenhaarschnitt. Shampoo und Styling inklusive.'
    }
  },
  'Coiffure Homme Premium': {
    title: { fr: 'Coiffure Homme Premium', ar: 'قص شعر رجالي فاخر', en: 'Premium Men\'s Haircut', es: 'Corte de cabello masculino premium', de: 'Premium Herrenhaarschnitt' },
    description: {
      fr: 'Coupe tendance personnalisee avec produits haut de gamme. Conseil coiffure inclus.',
      ar: 'قصة عصرية مخصصة بمنتجات عالية الجودة. استشارة تصفيف مشمولة.',
      en: 'Personalized trendy cut with premium products. Styling advice included.', es: 'Corte moderno personalizado con productos de alta gama. Asesoramiento de peinado incluido.', de: 'Individuell gestalteter Trendschnitt mit hochwertigen Produkten. Frisurberatung inklusive.' }
  },
  'Taille de Barbe': {
    title: { fr: 'Taille de Barbe', ar: 'تهذيب اللحية', en: 'Beard Trim', es: 'Recorte de barba', de: 'Barttrimmen' },
    description: {
      fr: 'Taille et modelage de barbe professionnel. Finitions au rasoir.',
      ar: 'تهذيب وتشكيل اللحية باحترافية. تشطيبات بالموس.',
      en: 'Professional beard trimming and shaping. Razor finishing.', es: 'Recorte y modelado profesional de barba. Acabado con navaja.', de: 'Professionelles Trimmen und Modellieren von Bärten. Feinschliff mit dem Rasiermesser.' }
  },
  'Pack Coiffure + Barbe': {
    title: { fr: 'Pack Coiffure + Barbe', ar: 'باقة قص شعر + لحية', en: 'Haircut + Beard Package', es: 'Paquete corte + barba', de: 'Packung Frisur + Bart' },
    description: {
      fr: 'Formule complete : coupe de cheveux et taille de barbe. Le duo parfait.',
      ar: 'باقة كاملة: قص الشعر وتهذيب اللحية. الثنائي المثالي.',
      en: 'Complete package: haircut and beard trim. The perfect duo.', es: 'Paquete completo: corte de cabello y recorte de barba. El dúo perfecto.', de: 'Formel complete: Haarschnitt und Bartstutzen. Das perfekte Duo.' }
  },

  // === BEAUTE - COIFFURE FEMME ===
  'Coiffure Classique': {
    title: { fr: 'Coiffure Classique', ar: 'تصفيف شعر كلاسيكي', en: 'Classic Hairstyle', es: 'Peinado clásico', de: 'Klassische Frisur' },
    description: {
      fr: 'Coupe et brushing classique pour femme. Shampooing et soin inclus.',
      ar: 'قص وتصفيف كلاسيكي للنساء. يشمل الشامبو والعناية.',
      en: 'Classic cut and blow-dry for women. Shampoo and care included.', es: 'Corte y secado clásicos para mujeres. Champú y tratamiento incluidos.', de: 'Klassischer Haarschnitt und Brushing für Frauen. Shampoo und Pflege inklusive.' }
  },
  'Coiffure Express': {
    title: { fr: 'Coiffure Express', ar: 'تصفيف شعر سريع', en: 'Express Hairstyle', es: 'Coiffure Express', de: 'Express-Frisur' },
    description: {
      fr: 'Brushing rapide pour un look impeccable en peu de temps.',
      ar: 'تصفيف سريع للحصول على مظهر مثالي في وقت قصير.',
      en: 'Quick blow-dry for an impeccable look in no time.', es: 'Secado rápido para un look impecable en un abrir y cerrar de ojos.', de: 'Schnelles Brushing für einen makellosen Look in kurzer Zeit.' }
  },
  'Coiffure Mariage': {
    title: { fr: 'Coiffure Mariage', ar: 'تسريحة عروس', en: 'Wedding Hairstyle', es: 'Peluquería de boda', de: 'Frisur Hochzeit' },
    description: {
      fr: 'Coiffure de mariee sur mesure. Essai prealable recommande.',
      ar: 'تسريحة عروس مخصصة. يُنصح بتجربة مسبقة.',
      en: 'Custom bridal hairstyle. Prior trial recommended.', es: 'Peinado de novia a medida. Se recomienda prueba previa.', de: 'Brautfrisur nach Maß. Vorherige Anprobe empfohlen.' }
  },
  'Coiffure Mariage & Événement': {
    title: { fr: 'Coiffure Mariage & Événement', ar: 'تسريحة عروس ومناسبات', en: 'Wedding & Event Hairstyle', es: 'Peluquería de bodas y eventos', de: 'Frisur Hochzeit & Event' },
    description: {
      fr: 'Coiffure elaborate pour mariage et evenements speciaux. Accessoires fournis.',
      ar: 'تسريحة متقنة للأعراس والمناسبات الخاصة. الإكسسوارات متوفرة.',
      en: 'Elaborate hairstyle for weddings and special events. Accessories provided.', es: 'Peinados elaborados para bodas y eventos especiales. Accesorios incluidos.', de: 'Elaborate Frisur für Hochzeiten und besondere Anlässe. Zubehör wird mitgeliefert.' }
  },

  // === VOITURE ===
  'Nettoyage Auto Externe': {
    title: { fr: 'Nettoyage Auto Externe', ar: 'تنظيف السيارة الخارجي', en: 'Exterior Car Wash', es: 'Autolimpieza exterior', de: 'Externe Autoreinigung' },
    description: {
      fr: 'Lavage exterieur complet : carrosserie, vitres, jantes. Finition brillante.',
      ar: 'غسيل خارجي كامل: الهيكل، النوافذ، الجنوط. لمسة نهائية لامعة.',
      en: 'Complete exterior wash: bodywork, windows, rims. Shiny finish.', es: 'Lavado exterior completo: carrocería, cristales, llantas. Acabado brillante.', de: 'Komplette Außenwäsche: Karosserie, Fenster, Felgen. Glänzendes Finish.' }
  },
  'Nettoyage Auto Interne': {
    title: { fr: 'Nettoyage Auto Interne', ar: 'تنظيف السيارة الداخلي', en: 'Interior Car Cleaning', es: 'Autolimpieza interna', de: 'Auto Interne Reinigung' },
    description: {
      fr: 'Nettoyage interieur approfondi : sieges, tableau de bord, moquettes.',
      ar: 'تنظيف داخلي عميق: المقاعد، لوحة القيادة، السجاد.',
      en: 'Deep interior cleaning: seats, dashboard, carpets.', es: 'Limpieza a fondo del interior: asientos, salpicadero, alfombrillas.', de: 'Gründliche Innenreinigung: Sitze, Armaturenbrett, Teppiche.' }
  },
  'Nettoyage Auto Complet': {
    title: { fr: 'Nettoyage Auto Complet', ar: 'تنظيف السيارة الكامل', en: 'Complete Car Cleaning', es: 'Limpieza completa de automóviles', de: 'Vollständige Autoreinigung' },
    description: {
      fr: 'Nettoyage integral interieur et exterieur. Votre vehicule comme neuf.',
      ar: 'تنظيف شامل داخلي وخارجي. سيارتك كالجديدة.',
      en: 'Full interior and exterior cleaning. Your vehicle like new.', es: 'Limpieza completa interior y exterior. Su vehículo como nuevo.', de: 'Vollständige Innen- und Außenreinigung. Ihr Fahrzeug wie neu.' }
  },

  // === BIEN-ETRE ===
  'Massage Relaxant': {
    title: { fr: 'Massage Relaxant', ar: 'تدليك استرخائي', en: 'Relaxing Massage', es: 'Masaje relajante', de: 'Entspannende Massage' },
    description: {
      fr: 'Massage doux pour evacuer le stress et les tensions. Huiles essentielles incluses.',
      ar: 'تدليك لطيف لإزالة التوتر والضغط. الزيوت العطرية مشمولة.',
      en: 'Gentle massage to relieve stress and tension. Essential oils included.', es: 'Masaje suave para aliviar el estrés y la tensión. Aceites esenciales incluidos.', de: 'Sanfte Massage zum Abbau von Stress und Verspannungen. Ätherische Öle enthalten.' }
  },
  'Hammam & Gommage': {
    title: { fr: 'Hammam & Gommage', ar: 'حمام وتقشير', en: 'Hammam & Scrub', es: 'Hammam y exfoliación', de: 'Hammam & Peeling' },
    description: {
      fr: 'Rituel hammam traditionnel avec gommage au savon noir. Peau douce garantie.',
      ar: 'طقوس الحمام التقليدية مع تقشير بالصابون الأسود. بشرة ناعمة مضمونة.',
      en: 'Traditional hammam ritual with black soap scrub. Soft skin guaranteed.', es: 'Ritual tradicional de hammam con exfoliación con jabón negro. Piel suave garantizada.', de: 'Traditionelles Hammam-Ritual mit einem Peeling aus schwarzer Seife. Garantiert zarte Haut.' }
  },
  'Soin Premium Argan': {
    title: { fr: 'Soin Premium Argan', ar: 'علاج فاخر بالارغان', en: 'Premium Argan Treatment', es: 'Tratamiento Premium de Argán', de: 'Premium-Pflege Argan' },
    description: {
      fr: 'Soin luxueux a l\'huile d\'argan du Maroc. Hydratation intense.',
      ar: 'علاج فاخر بزيت الأرغان المغربي. ترطيب مكثف.',
      en: 'Luxurious treatment with Moroccan argan oil. Intense hydration.',
      es: 'Tratamiento lujoso con aceite de argán marroquí. Hidratación intensa.',
      de: 'Luxusbehandlung mit marokkanischem Arganöl. Intensive Feuchtigkeitspflege.'
    }
  },
  'Yoga': {
    title: { fr: 'Yoga', ar: 'يوغا', en: 'Yoga', es: 'Yoga', de: 'Yoga' },
    description: {
      fr: 'Seance de yoga personnalisee a domicile. Tous niveaux acceptes.',
      ar: 'جلسة يوغا مخصصة في المنزل. جميع المستويات مقبولة.',
      en: 'Personalized yoga session at home. All levels welcome.', es: 'Sesión personalizada de yoga a domicilio. Se aceptan todos los niveles.', de: 'Individuelle Yogastunde bei Ihnen zu Hause. Alle Niveaus werden akzeptiert.' }
  },
  'Coach Sportif': {
    title: { fr: 'Coach Sportif', ar: 'مدرب رياضي', en: 'Personal Trainer', es: 'Entrenador deportivo', de: 'Sportlicher Coach' },
    description: {
      fr: 'Entrainement sportif personnalise selon vos objectifs. Programme sur mesure.',
      ar: 'تدريب رياضي مخصص حسب أهدافك. برنامج حسب الطلب.',
      en: 'Personalized sports training according to your goals. Custom program.', es: 'Entrenamiento deportivo adaptado a sus objetivos. Programa a medida.', de: 'Individuell auf Ihre Ziele abgestimmtes Sporttraining. Maßgeschneidertes Programm.' }
  },
  'Danse Orientale': {
    title: { fr: 'Danse Orientale', ar: 'رقص شرقي', en: 'Oriental Dance', es: 'Danza oriental', de: 'Orientalischer Tanz' },
    description: {
      fr: 'Cours de danse orientale a domicile. Debutants bienvenus.',
      ar: 'دروس الرقص الشرقي في المنزل. المبتدئون مرحب بهم.',
      en: 'Oriental dance lessons at home. Beginners welcome.', es: 'Clases de danza oriental a domicilio. Se admiten principiantes.', de: 'Bauchtanzunterricht bei Ihnen zu Hause. Anfänger willkommen.' }
  },
  'Hijama': {
    title: { fr: 'Hijama', ar: 'الحجامة', en: 'Cupping Therapy', es: 'Hijama', de: 'Hijama' },
    description: {
      fr: 'Therapie traditionnelle par ventouses. Praticien certifie.',
      ar: 'العلاج التقليدي بالحجامة. ممارس معتمد.',
      en: 'Traditional cupping therapy. Certified practitioner.', es: 'Terapia tradicional con ventosas. Profesional certificado.', de: 'Traditionelle Therapie mit Schröpfgläsern. Zertifizierter Praktiker.' }
  },

  // === ANIMAUX ===
  "Gardiennage d'Animaux": {
    title: { fr: "Gardiennage d'Animaux", ar: 'رعاية الحيوانات', en: 'Pet Sitting', es: 'Cuidado de mascotas', de: 'Tierbetreuung' },
    description: {
      fr: 'Garde de vos animaux a domicile. Soins, repas et promenades inclus.',
      ar: 'رعاية حيواناتك في المنزل. العناية والوجبات والتمشية مشمولة.',
      en: 'Pet care at your home. Care, meals and walks included.', es: 'Cuidado de sus mascotas a domicilio. Cuidados, comidas y paseos incluidos.', de: 'Betreuung Ihrer Haustiere zu Hause. Pflege, Mahlzeiten und Spaziergänge inklusive.' }
  },
  "Promenade d'Animaux": {
    title: { fr: "Promenade d'Animaux", ar: 'تمشية الحيوانات', en: 'Pet Walking', es: 'Paseo de mascotas', de: 'Tierspaziergänge' },
    description: {
      fr: 'Promenade quotidienne pour votre chien. Duree et frequence au choix.',
      ar: 'نزهة يومية لكلبك. المدة والتكرار حسب الاختيار.',
      en: 'Daily walk for your dog. Duration and frequency of your choice.', es: 'Paseo diario para su perro. Duración y frecuencia a elección.', de: 'Täglicher Spaziergang für Ihren Hund. Dauer und Frequenz frei wählbar.' }
  },

  // === EPILATION ===
  'Smooth Femme': {
    title: { fr: 'Smooth Femme', ar: 'ازالة شعر نسائي', en: 'Women\'s Hair Removal', es: 'Depilación femenina', de: 'Damen-Haarentfernung' },
    description: {
      fr: 'Epilation zones au choix pour femme. Cire chaude de qualite.',
      ar: 'إزالة الشعر للمناطق المختارة للنساء. شمع ساخن عالي الجودة.',
      en: 'Hair removal for selected areas for women. Quality hot wax.', es: 'Depilación de zonas a elegir para mujeres. Cera caliente de calidad.', de: 'Haarentfernung an beliebigen Stellen für Frauen. Qualitativ hochwertiges Warmwachs.' }
  },
  'Smooth Femme Full': {
    title: { fr: 'Smooth Femme Full', ar: 'ازالة شعر نسائي كامل', en: 'Full Women\'s Hair Removal', es: 'Depilación femenina completa', de: 'Komplette Damen-Haarentfernung' },
    description: {
      fr: 'Epilation complete corps entier pour femme. Resultat longue duree.',
      ar: 'إزالة شعر كاملة للجسم للنساء. نتيجة طويلة الأمد.',
      en: 'Complete full body hair removal for women. Long-lasting result.', es: 'Depilación completa de cuerpo entero para mujeres. Resultado de larga duración.', de: 'Ganzkörperenthaarung für Frauen. Langanhaltendes Ergebnis.' }
  },
  'Smooth Homme': {
    title: { fr: 'Smooth Homme', ar: 'ازالة شعر رجالي', en: 'Men\'s Hair Removal', es: 'Depilación masculina', de: 'Herren-Haarentfernung' },
    description: {
      fr: 'Epilation zones au choix pour homme. Discretion assuree.',
      ar: 'إزالة الشعر للمناطق المختارة للرجال. السرية مضمونة.',
      en: 'Hair removal for selected areas for men. Discretion assured.', es: 'Depilación de zonas a elegir para hombres. Discreción asegurada.', de: 'Enthaarung beliebiger Bereiche für Männer. Diskretion garantiert.' }
  },
  'Smooth Homme Full': {
    title: { fr: 'Smooth Homme Full', ar: 'ازالة شعر رجالي كامل', en: 'Full Men\'s Hair Removal', es: 'Depilación masculina completa', de: 'Komplette Herren-Haarentfernung' },
    description: {
      fr: 'Epilation complete corps entier pour homme. Peau lisse garantie.',
      ar: 'إزالة شعر كاملة للجسم للرجال. بشرة ناعمة مضمونة.',
      en: 'Complete full body hair removal for men. Smooth skin guaranteed.', es: 'Depilación completa de cuerpo entero para hombres. Piel suave garantizada.', de: 'Komplette Ganzkörperenthaarung für Männer. Glatte Haut garantiert.' }
  },

  // === MANUCURE ===
  'Manucure Classique': {
    title: { fr: 'Manucure Classique', ar: 'مانيكير كلاسيكي', en: 'Classic Manicure', es: 'Manicura clásica', de: 'Klassische Maniküre' },
    description: {
      fr: 'Soin des ongles complet avec pose de vernis classique.',
      ar: 'عناية كاملة بالأظافر مع وضع طلاء كلاسيكي.',
      en: 'Complete nail care with classic polish application.', es: 'Cuidado completo de las uñas con aplicación clásica de esmalte.', de: 'Umfassende Nagelpflege mit klassischer Lackierung.' }
  },
  'Manucure Gel / Semi-permanent': {
    title: { fr: 'Manucure Gel / Semi-permanent', ar: 'مانيكير جل / شبه دائم', en: 'Gel / Semi-permanent Manicure', es: 'Manicura con gel / Semipermanente', de: 'Maniküre Gel / Semipermanent' },
    description: {
      fr: 'Manucure avec vernis gel longue tenue. Jusqu\'a 3 semaines de beaute.',
      ar: 'مانيكير بطلاء جل طويل الأمد. جمال يدوم حتى 3 أسابيع.',
      en: 'Manicure with long-lasting gel polish. Up to 3 weeks of beauty.',
      es: 'Manicura con esmalte de gel de larga duración. Hasta 3 semanas de belleza.',
      de: 'Maniküre mit lang anhaltendem Gel-Lack. Bis zu 3 Wochen Schönheit.'
    }
  },

  // === MAQUILLAGE ===
  'Maquillage Jour': {
    title: { fr: 'Maquillage Jour', ar: 'مكياج نهاري', en: 'Day Makeup', es: 'Maquillaje de día', de: 'Make-up für den Tag' },
    description: {
      fr: 'Maquillage naturel et frais pour le quotidien. Teint parfait.',
      ar: 'مكياج طبيعي ومنعش لليوم. بشرة مثالية.',
      en: 'Natural and fresh makeup for everyday. Perfect complexion.', es: 'Maquillaje fresco y natural para el día a día. Tez perfecta.', de: 'Natürliches und frisches Make-up für den Alltag. Perfekter Teint.' }
  },
  'Maquillage Mariage': {
    title: { fr: 'Maquillage Mariage', ar: 'مكياج زفاف', en: 'Wedding Makeup', es: 'Maquillaje de boda', de: 'Make-up für Hochzeiten' },
    description: {
      fr: 'Maquillage de mariee sophistique. Essai prealable recommande.',
      ar: 'مكياج عروس راقي. يُنصح بتجربة مسبقة.',
      en: 'Sophisticated bridal makeup. Prior trial recommended.', es: 'Maquillaje de novia sofisticado. Se recomienda realizar una prueba preliminar.', de: 'Sophistisches Braut-Make-up. Vorheriger Versuch empfohlen.' }
  },
};

/**
 * Fonction utilitaire pour obtenir la traduction d'un service
 * Utilise une correspondance exacte puis une recherche partielle
 */
export function getServiceTranslation(
  title: string,
  language: 'fr' | 'ar' | 'en' | 'es' | 'de'
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
  'Standard': { fr: 'Standard', ar: 'عادي', en: 'Standard', es: 'Estándar', de: 'Standard' },
  'standard': { fr: 'Standard', ar: 'عادي', en: 'Standard', es: 'Estándar', de: 'Standard' },
  'Premium': { fr: 'Premium', ar: 'مميز', en: 'Premium', es: 'Premium', de: 'Premium' },
  'premium': { fr: 'Premium', ar: 'مميز', en: 'Premium', es: 'Premium', de: 'Premium' },
  'Urgent': { fr: 'Urgent', ar: 'عاجل', en: 'Urgent', es: 'Urgente', de: 'Dringend' },
  'urgent': { fr: 'Urgent', ar: 'عاجل', en: 'Urgent', es: 'Urgente', de: 'Dringend' },
  'Récurrent': { fr: 'Récurrent', ar: 'متكرر', en: 'Recurring', es: 'Recurrente', de: 'Wiederkehrend' },
  'Recurrent': { fr: 'Récurrent', ar: 'متكرر', en: 'Recurring', es: 'Recurrente', de: 'Wiederkehrend' },
  'récurrent': { fr: 'Récurrent', ar: 'متكرر', en: 'Recurring', es: 'Recurrente', de: 'Wiederkehrend' },
  'recurrent': { fr: 'Récurrent', ar: 'متكرر', en: 'Recurring', es: 'Recurrente', de: 'Wiederkehrend' },
  'Nuit': { fr: 'Nuit', ar: 'ليلي', en: 'Night', es: 'Noche', de: 'Nacht' },
  'nuit': { fr: 'Nuit', ar: 'ليلي', en: 'Night', es: 'Noche', de: 'Nacht' },
  // Autres formules
  'Essentiel': { fr: 'Essentiel', ar: 'الاساسي', en: 'Essential', es: 'Esencial', de: 'Essential' },
  'VIP': { fr: 'VIP', ar: 'كبار العملاء', en: 'VIP', es: 'VIP', de: 'VIP' },
  'Decouverte': { fr: 'Découverte', ar: 'اكتشاف', en: 'Discovery', es: 'Descubrimiento', de: 'Entdeckung' },
  'Découverte': { fr: 'Découverte', ar: 'اكتشاف', en: 'Discovery', es: 'Descubrimiento', de: 'Entdeckung' },
  'Classique': { fr: 'Classique', ar: 'كلاسيكي', en: 'Classic', es: 'Clásico', de: 'Klassisch' },
  'Intensif': { fr: 'Intensif', ar: 'مكثف', en: 'Intensive', es: 'Intensivo', de: 'Intensiv' },
  'Starter': { fr: 'Starter', ar: 'البداية', en: 'Starter', es: 'Iniciación', de: 'Starter' },
  'Pro': { fr: 'Pro', ar: 'احترافي', en: 'Pro', es: 'Pro', de: 'Pro' },
  'Business': { fr: 'Business', ar: 'اعمال', en: 'Business', es: 'Negocios', de: 'Business' },
  'Gratuit': { fr: 'Gratuit', ar: 'مجاني', en: 'Free', es: 'Gratuito', de: 'Kostenlos' },
  'Free': { fr: 'Free', ar: 'مجاني', en: 'Free', es: 'Gratis', de: 'Kostenlos' },
};

/**
 * Fonction utilitaire pour obtenir la traduction d'une formule
 */
export function getFormulaTranslation(
  name: string,
  language: 'fr' | 'ar' | 'en' | 'es' | 'de'
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
  language: 'fr' | 'ar' | 'en' | 'es' | 'de'
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
