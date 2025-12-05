<?php

namespace App\Helpers;

class Translator
{
    /**
     * Dictionnaire français -> arabe (phrases courantes)
     */
    private static array $frToAr = [
        'bonjour' => 'مرحبا',
        'bonsoir' => 'مساء الخير',
        'merci' => 'شكرا',
        'merci beaucoup' => 'شكرا جزيلا',
        'oui' => 'نعم',
        'non' => 'لا',
        'je suis en route' => 'أنا في الطريق',
        'je suis arrivé' => 'وصلت',
        'j\'arrive' => 'سأصل قريبا',
        'j\'arrive dans' => 'سأصل خلال',
        'minutes' => 'دقائق',
        'minute' => 'دقيقة',
        'où êtes-vous' => 'أين أنت',
        'où êtes-vous ?' => 'أين أنت؟',
        'je suis là' => 'أنا هنا',
        'je suis devant' => 'أنا أمام',
        'attendez-moi' => 'انتظرني',
        'je vous attends' => 'أنتظرك',
        'd\'accord' => 'حسنا',
        'ok' => 'حسنا',
        'pas de problème' => 'لا مشكلة',
        'à bientôt' => 'إلى اللقاء',
        'au revoir' => 'مع السلامة',
        'service terminé' => 'انتهت الخدمة',
        'le service est terminé' => 'انتهت الخدمة',
        'êtes-vous satisfait' => 'هل أنت راضٍ',
        'excellent travail' => 'عمل ممتاز',
        'très bien' => 'جيد جدا',
        'bien' => 'جيد',
        'parfait' => 'ممتاز',
        'je commence' => 'أبدأ الآن',
        'c\'est fait' => 'تم',
        'terminé' => 'انتهى',
        'comment ça va' => 'كيف حالك',
        'ça va bien' => 'بخير',
        's\'il vous plaît' => 'من فضلك',
        'svp' => 'من فضلك',
        'je ne comprends pas' => 'لا أفهم',
        'pouvez-vous répéter' => 'هل يمكنك التكرار',
        'quel est votre numéro' => 'ما هو رقمك',
        'appelez-moi' => 'اتصل بي',
        'je vous appelle' => 'سأتصل بك',
        'un moment' => 'لحظة',
        'patientez' => 'انتظر',
        'je suis occupé' => 'أنا مشغول',
        'je suis disponible' => 'أنا متاح',
        'combien de temps' => 'كم من الوقت',
        'bientôt' => 'قريبا',
        'maintenant' => 'الآن',
        'plus tard' => 'لاحقا',
        'aujourd\'hui' => 'اليوم',
        'demain' => 'غدا',
    ];

    /**
     * Dictionnaire arabe -> français
     */
    private static array $arToFr = [
        'مرحبا' => 'bonjour',
        'مساء الخير' => 'bonsoir',
        'شكرا' => 'merci',
        'شكرا جزيلا' => 'merci beaucoup',
        'نعم' => 'oui',
        'لا' => 'non',
        'أنا في الطريق' => 'je suis en route',
        'وصلت' => 'je suis arrivé',
        'سأصل قريبا' => 'j\'arrive bientôt',
        'سأصل خلال' => 'j\'arrive dans',
        'دقائق' => 'minutes',
        'دقيقة' => 'minute',
        'أين أنت' => 'où êtes-vous',
        'أنا هنا' => 'je suis là',
        'أنا أمام' => 'je suis devant',
        'انتظرني' => 'attendez-moi',
        'أنتظرك' => 'je vous attends',
        'حسنا' => 'd\'accord',
        'لا مشكلة' => 'pas de problème',
        'إلى اللقاء' => 'à bientôt',
        'مع السلامة' => 'au revoir',
        'انتهت الخدمة' => 'service terminé',
        'هل أنت راضٍ' => 'êtes-vous satisfait',
        'عمل ممتاز' => 'excellent travail',
        'جيد جدا' => 'très bien',
        'جيد' => 'bien',
        'ممتاز' => 'parfait',
        'أبدأ الآن' => 'je commence',
        'تم' => 'c\'est fait',
        'انتهى' => 'terminé',
        'كيف حالك' => 'comment ça va',
        'بخير' => 'ça va bien',
        'من فضلك' => 's\'il vous plaît',
        'لا أفهم' => 'je ne comprends pas',
        'هل يمكنك التكرار' => 'pouvez-vous répéter',
        'ما هو رقمك' => 'quel est votre numéro',
        'اتصل بي' => 'appelez-moi',
        'سأتصل بك' => 'je vous appelle',
        'لحظة' => 'un moment',
        'انتظر' => 'patientez',
        'أنا مشغول' => 'je suis occupé',
        'أنا متاح' => 'je suis disponible',
        'كم من الوقت' => 'combien de temps',
        'قريبا' => 'bientôt',
        'الآن' => 'maintenant',
        'لاحقا' => 'plus tard',
        'اليوم' => 'aujourd\'hui',
        'غدا' => 'demain',
    ];

    /**
     * Détecte la langue du texte
     */
    public static function detectLanguage(string $text): string
    {
        // Vérifie si le texte contient des caractères arabes
        if (preg_match('/[\x{0600}-\x{06FF}]/u', $text)) {
            return 'ar';
        }
        return 'fr';
    }

    /**
     * Traduit le texte
     */
    public static function translate(string $text, string $targetLang = 'auto'): ?string
    {
        $sourceLang = self::detectLanguage($text);

        // Si la cible est auto, on traduit vers l'autre langue
        if ($targetLang === 'auto') {
            $targetLang = $sourceLang === 'fr' ? 'ar' : 'fr';
        }

        // Si même langue, pas de traduction
        if ($sourceLang === $targetLang) {
            return null;
        }

        $textLower = mb_strtolower(trim($text), 'UTF-8');

        if ($sourceLang === 'fr' && $targetLang === 'ar') {
            // Cherche une correspondance exacte d'abord
            if (isset(self::$frToAr[$textLower])) {
                return self::$frToAr[$textLower];
            }

            // Cherche des correspondances partielles
            $translated = $text;
            foreach (self::$frToAr as $fr => $ar) {
                $translated = str_ireplace($fr, $ar, $translated);
            }
            return $translated !== $text ? $translated : null;
        }

        if ($sourceLang === 'ar' && $targetLang === 'fr') {
            // Cherche une correspondance exacte d'abord
            if (isset(self::$arToFr[$textLower])) {
                return self::$arToFr[$textLower];
            }

            // Cherche des correspondances partielles
            $translated = $text;
            foreach (self::$arToFr as $ar => $fr) {
                $translated = str_replace($ar, $fr, $translated);
            }
            return $translated !== $text ? $translated : null;
        }

        return null;
    }
}
