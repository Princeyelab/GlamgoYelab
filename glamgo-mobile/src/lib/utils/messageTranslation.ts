/**
 * Message Translation Utility
 * Détecte et traduit automatiquement les messages du chat
 */

export type MessageLanguage = 'fr' | 'en' | 'ar' | 'es';

interface TranslationDict {
  [key: string]: {
    en?: string;
    fr?: string;
    ar?: string;
    es?: string;
  };
}

// Dictionnaire de traductions pour phrases courantes
const translations: TranslationDict = {
  // Salutations
  "bonjour": { en: "Hello", ar: "مرحبا", es: "Hola" },
  "salut": { en: "Hi", ar: "مرحبا", es: "Hola" },
  "hello": { fr: "Bonjour", ar: "مرحبا", es: "Hola" },
  "hi": { fr: "Salut", ar: "مرحبا", es: "Hola" },
  "مرحبا": { fr: "Bonjour", en: "Hello", es: "Hola" },
  "السلام عليكم": { fr: "Bonjour", en: "Hello", es: "Hola" },
  "أهلا": { fr: "Salut", en: "Hi", es: "Hola" },
  "صباح الخير": { fr: "Bonjour", en: "Good morning", es: "Buenos días" },
  "مساء الخير": { fr: "Bonsoir", en: "Good evening", es: "Buenas tardes" },

  // Réponses
  "oui": { en: "Yes", ar: "نعم", es: "Sí" },
  "non": { en: "No", ar: "لا", es: "No" },
  "yes": { fr: "Oui", ar: "نعم", es: "Sí" },
  "no": { fr: "Non", ar: "لا", es: "No" },
  "ok": { fr: "D'accord", ar: "حسنا", es: "Vale" },
  "d'accord": { en: "Okay", ar: "حسنا", es: "De acuerdo" },
  "نعم": { fr: "Oui", en: "Yes", es: "Sí" },
  "لا": { fr: "Non", en: "No", es: "No" },
  "حسنا": { fr: "D'accord", en: "Okay", es: "Vale" },
  "موافق": { fr: "D'accord", en: "Okay", es: "De acuerdo" },

  // Remerciements
  "merci": { en: "Thank you", ar: "شكرا", es: "Gracias" },
  "merci beaucoup": { en: "Thank you very much", ar: "شكرا جزيلا", es: "Muchas gracias" },
  "thank you": { fr: "Merci", ar: "شكرا", es: "Gracias" },
  "thanks": { fr: "Merci", ar: "شكرا", es: "Gracias" },
  "شكرا": { fr: "Merci", en: "Thank you", es: "Gracias" },
  "شكرا جزيلا": { fr: "Merci beaucoup", en: "Thank you very much", es: "Muchas gracias" },
  "شكرا لك": { fr: "Merci", en: "Thank you", es: "Gracias" },

  // Excuses
  "désolé": { en: "Sorry", ar: "آسف", es: "Lo siento" },
  "pardon": { en: "Excuse me", ar: "عفوا", es: "Perdón" },
  "sorry": { fr: "Désolé", ar: "آسف", es: "Lo siento" },
  "excuse me": { fr: "Excusez-moi", ar: "عفوا", es: "Disculpe" },
  "آسف": { fr: "Désolé", en: "Sorry", es: "Lo siento" },
  "عفوا": { fr: "Pardon", en: "Excuse me", es: "Perdón" },
  "أعتذر": { fr: "Je m'excuse", en: "I apologize", es: "Me disculpo" },

  // Localisation
  "je suis en route": { en: "I'm on my way", ar: "أنا في الطريق", es: "Estoy en camino" },
  "j'arrive": { en: "I'm coming", ar: "أنا قادم", es: "Ya voy" },
  "j'arrive dans 5 minutes": { en: "I'll arrive in 5 minutes", ar: "سأصل خلال 5 دقائق", es: "Llegaré en 5 minutos" },
  "je suis arrivé": { en: "I have arrived", ar: "وصلت", es: "He llegado" },
  "i'm on my way": { fr: "Je suis en route", ar: "أنا في الطريق", es: "Estoy en camino" },
  "i'm coming": { fr: "J'arrive", ar: "أنا قادم", es: "Ya voy" },
  "i have arrived": { fr: "Je suis arrivé", ar: "وصلت", es: "He llegado" },
  "où êtes-vous": { en: "Where are you", ar: "أين أنت", es: "¿Dónde está?" },
  "where are you": { fr: "Où êtes-vous", ar: "أين أنت", es: "¿Dónde estás?" },
  "أنا في الطريق": { fr: "Je suis en route", en: "I'm on my way", es: "Estoy en camino" },
  "أنا قادم": { fr: "J'arrive", en: "I'm coming", es: "Ya voy" },
  "سأصل خلال 5 دقائق": { fr: "J'arrive dans 5 minutes", en: "I'll arrive in 5 minutes", es: "Llegaré en 5 minutos" },
  "وصلت": { fr: "Je suis arrivé", en: "I have arrived", es: "He llegado" },
  "أين أنت": { fr: "Où êtes-vous", en: "Where are you", es: "¿Dónde estás?" },
  "أين موقعك": { fr: "Où es-tu", en: "Where is your location", es: "¿Dónde está tu ubicación?" },

  // Service
  "je commence": { en: "I'm starting", ar: "أبدأ الآن", es: "Empiezo" },
  "c'est terminé": { en: "It's done", ar: "انتهى", es: "Está terminado" },
  "c'est fait": { en: "It's done", ar: "تم", es: "Está hecho" },
  "i'm starting": { fr: "Je commence", ar: "أبدأ الآن", es: "Empiezo" },
  "it's done": { fr: "C'est fait", ar: "تم", es: "Está hecho" },
  "finished": { fr: "Terminé", ar: "انتهى", es: "Terminado" },
  "أبدأ الآن": { fr: "Je commence", en: "I'm starting", es: "Empiezo" },
  "انتهى": { fr: "C'est terminé", en: "It's done", es: "Está terminado" },
  "تم": { fr: "C'est fait", en: "It's done", es: "Está hecho" },
  "انتهيت": { fr: "J'ai terminé", en: "I'm finished", es: "He terminado" },

  // Attente
  "j'attends": { en: "I'm waiting", ar: "أنتظر", es: "Estoy esperando" },
  "je vous attends": { en: "I'm waiting for you", ar: "أنتظرك", es: "Te estoy esperando" },
  "i'm waiting": { fr: "J'attends", ar: "أنتظر", es: "Estoy esperando" },
  "أنتظر": { fr: "J'attends", en: "I'm waiting", es: "Estoy esperando" },
  "أنتظرك": { fr: "Je vous attends", en: "I'm waiting for you", es: "Te estoy esperando" },

  // Compliments
  "parfait": { en: "Perfect", ar: "ممتاز", es: "Perfecto" },
  "très bien": { en: "Very good", ar: "جيد جدا", es: "Muy bien" },
  "excellent": { fr: "Excellent", ar: "ممتاز", es: "Excelente" },
  "perfect": { fr: "Parfait", ar: "ممتاز", es: "Perfecto" },
  "great": { fr: "Super", ar: "رائع", es: "Genial" },
  "ممتاز": { fr: "Parfait", en: "Perfect", es: "Perfecto" },
  "جيد جدا": { fr: "Très bien", en: "Very good", es: "Muy bien" },
  "جيد": { fr: "Bien", en: "Good", es: "Bien" },
  "رائع": { fr: "Super", en: "Great", es: "Genial" },
  "جميل": { fr: "Beau", en: "Beautiful", es: "Hermoso" },

  // Questions
  "combien de temps": { en: "How long", ar: "كم من الوقت", es: "Cuánto tiempo" },
  "quelle heure": { en: "What time", ar: "أي وقت", es: "Qué hora" },
  "how long": { fr: "Combien de temps", ar: "كم من الوقت", es: "Cuánto tiempo" },
  "what time": { fr: "Quelle heure", ar: "أي وقت", es: "Qué hora" },
  "كم من الوقت": { fr: "Combien de temps", en: "How long", es: "Cuánto tiempo" },
  "أي وقت": { fr: "Quelle heure", en: "What time", es: "Qué hora" },
  "متى": { fr: "Quand", en: "When", es: "Cuándo" },

  // Problèmes
  "problème": { en: "Problem", ar: "مشكلة", es: "Problema" },
  "je suis perdu": { en: "I'm lost", ar: "أنا ضائع", es: "Estoy perdido" },
  "je ne trouve pas": { en: "I can't find", ar: "لا أجد", es: "No encuentro" },
  "problem": { fr: "Problème", ar: "مشكلة", es: "Problema" },
  "i'm lost": { fr: "Je suis perdu", ar: "أنا ضائع", es: "Estoy perdido" },
  "مشكلة": { fr: "Problème", en: "Problem", es: "Problema" },
  "أنا ضائع": { fr: "Je suis perdu", en: "I'm lost", es: "Estoy perdido" },
  "لا أجد": { fr: "Je ne trouve pas", en: "I can't find", es: "No encuentro" },
  "لا أستطيع": { fr: "Je ne peux pas", en: "I can't", es: "No puedo" },

  // Phrases supplémentaires courantes
  "d'accord": { en: "Okay", ar: "حسنا", es: "De acuerdo" },
  "très bien": { en: "Very good", ar: "جيد جدا", es: "Muy bien" },
  "bien": { en: "Good", ar: "جيد", es: "Bien" },
  "super": { en: "Great", ar: "رائع", es: "Genial" },
  "à bientôt": { en: "See you soon", ar: "أراك قريبا", es: "Hasta pronto" },
  "à tout à l'heure": { en: "See you later", ar: "أراك لاحقا", es: "Hasta luego" },
  "au revoir": { en: "Goodbye", ar: "وداعا", es: "Adiós" },
  "bonne journée": { en: "Have a nice day", ar: "يوم سعيد", es: "Que tenga buen día" },
  "de rien": { en: "You're welcome", ar: "على الرحب والسعة", es: "De nada" },
  "pas de problème": { en: "No problem", ar: "لا مشكلة", es: "No hay problema" },
  "avec plaisir": { en: "With pleasure", ar: "بكل سرور", es: "Con gusto" },

  // Espagnol → autres langues
  "hola": { fr: "Bonjour", en: "Hello", ar: "مرحبا" },
  "adiós": { fr: "Au revoir", en: "Goodbye", ar: "وداعا" },
  "hasta luego": { fr: "À plus tard", en: "See you later", ar: "أراك لاحقا" },
  "hasta pronto": { fr: "À bientôt", en: "See you soon", ar: "أراك قريبا" },
  "sí": { fr: "Oui", en: "Yes", ar: "نعم" },
  "vale": { fr: "D'accord", en: "Okay", ar: "حسنا" },
  "por favor": { fr: "S'il vous plaît", en: "Please", ar: "من فضلك" },
  "muchas gracias": { fr: "Merci beaucoup", en: "Thank you very much", ar: "شكرا جزيلا" },
  "de nada": { fr: "De rien", en: "You're welcome", ar: "على الرحب والسعة" },
  "lo siento": { fr: "Désolé", en: "Sorry", ar: "آسف" },
  "perdón": { fr: "Pardon", en: "Excuse me", ar: "عفوا" },
  "disculpe": { fr: "Excusez-moi", en: "Excuse me", ar: "عفوا" },
  "estoy en camino": { fr: "Je suis en route", en: "I'm on my way", ar: "أنا في الطريق" },
  "ya voy": { fr: "J'arrive", en: "I'm coming", ar: "أنا قادم" },
  "he llegado": { fr: "Je suis arrivé", en: "I have arrived", ar: "وصلت" },
  "¿dónde estás?": { fr: "Où es-tu", en: "Where are you", ar: "أين أنت" },
  "¿dónde está?": { fr: "Où êtes-vous", en: "Where are you", ar: "أين أنت" },
  "empiezo": { fr: "Je commence", en: "I'm starting", ar: "أبدأ الآن" },
  "está hecho": { fr: "C'est fait", en: "It's done", ar: "تم" },
  "está terminado": { fr: "C'est terminé", en: "It's done", ar: "انتهى" },
  "he terminado": { fr: "J'ai terminé", en: "I'm finished", ar: "انتهيت" },
  "estoy esperando": { fr: "J'attends", en: "I'm waiting", ar: "أنتظر" },
  "te estoy esperando": { fr: "Je t'attends", en: "I'm waiting for you", ar: "أنتظرك" },
  "perfecto": { fr: "Parfait", en: "Perfect", ar: "ممتاز" },
  "muy bien": { fr: "Très bien", en: "Very good", ar: "جيد جدا" },
  "excelente": { fr: "Excellent", en: "Excellent", ar: "ممتاز" },
  "genial": { fr: "Super", en: "Great", ar: "رائع" },
  "hermoso": { fr: "Beau", en: "Beautiful", ar: "جميل" },
  "cuánto tiempo": { fr: "Combien de temps", en: "How long", ar: "كم من الوقت" },
  "qué hora": { fr: "Quelle heure", en: "What time", ar: "أي وقت" },
  "cuándo": { fr: "Quand", en: "When", ar: "متى" },
  "problema": { fr: "Problème", en: "Problem", ar: "مشكلة" },
  "estoy perdido": { fr: "Je suis perdu", en: "I'm lost", ar: "أنا ضائع" },
  "no encuentro": { fr: "Je ne trouve pas", en: "I can't find", ar: "لا أجد" },
  "no puedo": { fr: "Je ne peux pas", en: "I can't", ar: "لا أستطيع" },
  "buenos días": { fr: "Bonjour", en: "Good morning", ar: "صباح الخير" },
  "buenas tardes": { fr: "Bon après-midi", en: "Good afternoon", ar: "مساء الخير" },
  "buenas noches": { fr: "Bonne nuit", en: "Good night", ar: "تصبح على خير" },

  // Phrases de service supplémentaires
  "s'il vous plaît": { en: "Please", ar: "من فضلك", es: "Por favor" },
  "je peux": { en: "I can", ar: "أستطيع", es: "Puedo" },
  "je ne peux pas": { en: "I can't", ar: "لا أستطيع", es: "No puedo" },
  "combien ça coûte": { en: "How much does it cost", ar: "كم يكلف", es: "Cuánto cuesta" },
  "le prix": { en: "The price", ar: "السعر", es: "El precio" },
  "paiement": { en: "Payment", ar: "دفع", es: "Pago" },
  "confirmez": { en: "Confirm", ar: "تأكيد", es: "Confirme" },
  "vérifiez": { en: "Check", ar: "تحقق", es: "Verifique" },
  "urgent": { en: "Urgent", ar: "عاجل", es: "Urgente" },
  "retard": { en: "Delay", ar: "تأخير", es: "Retraso" },
  "aide": { en: "Help", ar: "مساعدة", es: "Ayuda" },
  "besoin d'aide": { en: "Need help", ar: "أحتاج مساعدة", es: "Necesito ayuda" },
  "terminé": { en: "Finished", ar: "منتهي", es: "Terminado" },
  "fini": { en: "Done", ar: "تم", es: "Listo" },

  // Espagnol → autres (phrases de service)
  "gracias": { fr: "Merci", en: "Thank you", ar: "شكرا" },
  "por favor": { fr: "S'il vous plaît", en: "Please", ar: "من فضلك" },
  "puedo": { fr: "Je peux", en: "I can", ar: "أستطيع" },
  "cuánto cuesta": { fr: "Combien ça coûte", en: "How much does it cost", ar: "كم يكلف" },
  "el precio": { fr: "Le prix", en: "The price", ar: "السعر" },
  "pago": { fr: "Paiement", en: "Payment", ar: "دفع" },
  "confirme": { fr: "Confirmez", en: "Confirm", ar: "تأكيد" },
  "verifique": { fr: "Vérifiez", en: "Check", ar: "تحقق" },
  "urgente": { fr: "Urgent", en: "Urgent", ar: "عاجل" },
  "retraso": { fr: "Retard", en: "Delay", ar: "تأخير" },
  "ayuda": { fr: "Aide", en: "Help", ar: "مساعدة" },
  "necesito ayuda": { fr: "Besoin d'aide", en: "Need help", ar: "أحتاج مساعدة" },
  "terminado": { fr: "Terminé", en: "Finished", ar: "منتهي" },
  "listo": { fr: "Prêt", en: "Ready", ar: "جاهز" },
  "no hay problema": { fr: "Pas de problème", en: "No problem", ar: "لا مشكلة" },
  "con gusto": { fr: "Avec plaisir", en: "With pleasure", ar: "بكل سرور" },
  "claro": { fr: "Bien sûr", en: "Of course", ar: "بالطبع" },
  "espere": { fr: "Attendez", en: "Wait", ar: "انتظر" },
  "un momento": { fr: "Un moment", en: "One moment", ar: "لحظة واحدة" },
  "llegaré en 5 minutos": { fr: "J'arrive dans 5 minutes", en: "I'll arrive in 5 minutes", ar: "سأصل خلال 5 دقائق" },
};

/**
 * Détecte la langue d'un message
 */
export function detectMessageLanguage(text: string): MessageLanguage {
  const lowerText = text.toLowerCase().trim();

  // Détection par caractères arabes
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar';
  }

  // Mots français courants
  const frenchWords = ['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'le', 'la', 'les', 'un', 'une', 'des', 'est', 'sont', 'suis', 'êtes'];
  const hasFrench = frenchWords.some(word =>
    lowerText.split(/\s+/).includes(word)
  );

  // Mots anglais courants
  const englishWords = ['i', 'you', 'he', 'she', 'we', 'they', 'am', 'is', 'are', 'the', 'a', 'an'];
  const hasEnglish = englishWords.some(word =>
    lowerText.split(/\s+/).includes(word)
  );

  // Mots espagnols courants (plus de mots pour meilleure détection)
  const spanishWords = [
    'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'soy', 'eres', 'es', 'somos', 'sois', 'son',
    'estoy', 'estás', 'está', 'estamos', 'están',
    'gracias', 'hola', 'por favor', 'por', 'favor',
    'sí', 'vale', 'adiós', 'hasta', 'donde', 'dónde',
    'qué', 'cuándo', 'cómo', 'porque', 'pero', 'muy',
    'bien', 'bueno', 'buena', 'buenos', 'buenas',
    'día', 'días', 'noche', 'tarde', 'mañana',
    'tengo', 'tiene', 'hay', 'hacer', 'voy', 'va',
    'puedo', 'puede', 'quiero', 'quiere',
  ];
  const hasSpanish = spanishWords.some(word =>
    lowerText.split(/\s+/).includes(word)
  );

  if (hasFrench) return 'fr';
  if (hasSpanish) return 'es';
  if (hasEnglish) return 'en';

  // Par défaut, français (langue principale de l'app)
  return 'fr';
}

/**
 * Traduit un message vers une langue cible
 */
export function translateMessage(text: string, targetLang: MessageLanguage): string {
  const lowerText = text.toLowerCase().trim();
  const sourceLang = detectMessageLanguage(text);

  // Pas besoin de traduire si même langue
  if (sourceLang === targetLang) {
    return text;
  }

  // Chercher traduction exacte
  const exactTranslation = translations[lowerText]?.[targetLang];
  if (exactTranslation) {
    return exactTranslation;
  }

  // Chercher des phrases partielles
  let translatedText = text;
  let hasTranslation = false;

  for (const [key, trans] of Object.entries(translations)) {
    if (lowerText.includes(key.toLowerCase())) {
      const translation = trans[targetLang];
      if (translation) {
        // Remplacer en préservant la casse
        const regex = new RegExp(key, 'gi');
        translatedText = translatedText.replace(regex, translation);
        hasTranslation = true;
      }
    }
  }

  // Si aucune traduction trouvée, retourner original avec indication
  if (!hasTranslation) {
    return text; // Pas de traduction disponible
  }

  return translatedText;
}

/**
 * Vérifie si une traduction est disponible pour ce message
 */
export function hasTranslation(text: string, targetLang: MessageLanguage): boolean {
  const lowerText = text.toLowerCase().trim();
  const sourceLang = detectMessageLanguage(text);

  if (sourceLang === targetLang) {
    return false;
  }

  // Vérifier traduction exacte
  if (translations[lowerText]?.[targetLang]) {
    return true;
  }

  // Vérifier traductions partielles
  for (const key of Object.keys(translations)) {
    if (lowerText.includes(key.toLowerCase()) && translations[key][targetLang]) {
      return true;
    }
  }

  return false;
}
