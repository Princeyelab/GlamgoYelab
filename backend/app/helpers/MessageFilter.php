<?php

namespace App\Helpers;

/**
 * Filtre les messages pour bloquer les coordonnées et contenus inappropries
 * Empêche le partage de numéros de téléphone, emails, insultes, racisme, menaces
 * Sécurité GlamGo : communication securisee et respectueuse
 */
class MessageFilter
{
    /**
     * Patterns de détection des coordonnées
     */
    private static array $patterns = [
        'phone' => [
            '/\b0[5-7]\d{8}\b/',                      // Maroc : 0612345678
            '/\b\+212\s?\d{9}\b/',                    // Maroc : +212 612345678
            '/\b00212\s?\d{9}\b/',                    // Maroc : 00212 612345678
            '/\b\d{10,}\b/',                          // Générique : 10+ chiffres consécutifs
            '/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/',   // Format international
            '/\b\d{2}[-.\s]\d{2}[-.\s]\d{2}[-.\s]\d{2}[-.\s]\d{2}\b/', // Format FR: 06 12 34 56 78
        ],
        'email' => [
            '/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i',
            '/\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/i', // Avec espaces
        ],
        'whatsapp' => [
            '/whatsapp/i',
            '/what\'?s\s*app/i',
            '/wa\.me/i',
            '/chat\.whatsapp/i',
            '/api\.whatsapp/i',
        ],
        'social' => [
            '/facebook\.com/i',
            '/fb\.com/i',
            '/instagram\.com/i',
            '/insta(?:gram)?[\s:@]/i',
            '/snapchat/i',
            '/snap[\s:@]/i',
            '/telegram/i',
            '/t\.me\//i',
            '/tiktok/i',
            '/twitter\.com/i',
            '/x\.com/i',
        ],
        'contact_keywords' => [
            '/mon\s+num[eé]ro/i',
            '/mon\s+t[eé]l[eé]?phone/i',
            '/mon\s+whats/i',
            '/appel(?:le|ez)?[\-\s]+moi/i',
            '/contacte[zr]?[\-\s]+moi/i',
            '/[eé]cri(?:s|vez)?[\-\s]+moi\s+sur/i',
            '/rejoins?[\-\s]+moi\s+sur/i',
        ]
    ];

    /**
     * Mots interdits - Insultes en francais
     */
    private static array $insultsFr = [
        'connard', 'connasse', 'salaud', 'salope', 'pute', 'putain',
        'merde', 'encule', 'enculer', 'nique', 'niquer', 'ntm',
        'fdp', 'fils de pute', 'batard', 'bâtard', 'abruti', 'debile',
        'cretin', 'ordure', 'pourriture', 'dechet', 'bouffon', 'tocard',
        'branleur', 'trouduc', 'trou du cul', 'ta gueule', 'ftg'
    ];

    /**
     * Mots interdits - Racisme en francais
     */
    private static array $racismFr = [
        'negre', 'nègre', 'negro', 'nigga', 'noir de merde', 'sale noir',
        'bougnoule', 'bougnoul', 'arabe de merde', 'sale arabe', 'bicot', 'raton',
        'melon', 'feuj', 'youpin', 'youtre', 'sale juif', 'juif de merde',
        'chinetoque', 'bride', 'bridé', 'sale chinois', 'chintok',
        'gwer', 'gaouri', 'roumi', 'sale blanc', 'sale francais',
        'bamboula', 'macaque', 'singe', 'gorille'
    ];

    /**
     * Mots interdits - Menaces en francais
     */
    private static array $threatsFr = [
        'je vais te tuer', 'je te tue', 'je vais te buter', 'je te bute',
        'je vais te frapper', 'tu vas mourir', 'tu es mort', 't\'es mort',
        'crever', 'creve', 'je sais ou tu habites', 'je connais ton adresse',
        'tu vas voir', 'tu vas payer', 'je vais te retrouver', 'vengeance',
        'viol', 'violer', 'agression'
    ];

    /**
     * Mots interdits - Insultes en arabe (darija + standard)
     */
    private static array $insultsAr = [
        'زمل', 'زامل', 'قحبة', 'قحب', 'كلب', 'حمار', 'بغل',
        'تبون', 'تبونك', 'نيك', 'زب', 'زبي', 'حشيش',
        'مقود', 'معيور', 'معيورة', 'لحوى', 'سربي', 'سرباي',
        'خنزير', 'بهيم', 'حيوان', 'بوزبال',
        'كس', 'كسك', 'طيز', 'خرا', 'عاهرة', 'شرموط', 'شرموطة',
        'منيك', 'ابن الشرموطة', 'ابن القحبة', 'ولد الزنا',
        'ملعون', 'ابن الحرام'
    ];

    /**
     * Mots interdits - Racisme en arabe
     */
    private static array $racismAr = [
        'عزي', 'حرطاني', 'عبد', 'وصيف', 'كحلوش'
    ];

    /**
     * Mots interdits - Menaces en arabe
     */
    private static array $threatsAr = [
        'غادي نقتلك', 'انقتلك', 'غادي نضربك', 'نضربك',
        'غادي تموت', 'موت', 'تقتل', 'قتل', 'اغتصاب'
    ];

    /**
     * Messages types pour chaque violation
     */
    private static array $violationLabels = [
        'phone' => 'numéros de téléphone',
        'email' => 'adresses email',
        'whatsapp' => 'références WhatsApp',
        'social' => 'liens vers réseaux sociaux',
        'contact_keywords' => 'tentatives de partage de contact',
        'insult' => 'langage injurieux',
        'racism' => 'propos racistes ou discriminatoires',
        'threat' => 'menaces'
    ];

    /**
     * Normalise le texte pour la detection (supprime accents, minuscules)
     */
    private static function normalizeText(string $text): string
    {
        $text = mb_strtolower($text, 'UTF-8');
        // Normaliser les accents
        $text = preg_replace('/[àáâãäå]/u', 'a', $text);
        $text = preg_replace('/[èéêë]/u', 'e', $text);
        $text = preg_replace('/[ìíîï]/u', 'i', $text);
        $text = preg_replace('/[òóôõö]/u', 'o', $text);
        $text = preg_replace('/[ùúûü]/u', 'u', $text);
        $text = preg_replace('/[ç]/u', 'c', $text);
        // Leet speak
        $text = str_replace(['0', '1', '3', '4', '5', '7', '8'], ['o', 'i', 'e', 'a', 's', 't', 'b'], $text);
        return $text;
    }

    /**
     * Vérifie si un message contient des coordonnées interdites ou contenu inapproprie
     *
     * @param string $content Contenu du message
     * @return array ['is_clean' => bool, 'violations' => array, 'filtered_content' => string]
     */
    public static function checkMessage(string $content): array
    {
        $violations = [];
        $isClean = true;
        $normalizedContent = self::normalizeText($content);

        // Vérifier chaque catégorie de patterns (contacts)
        foreach (self::$patterns as $type => $patterns) {
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $content)) {
                    $violations[] = $type;
                    $isClean = false;
                    break;
                }
            }
        }

        // Vérifier les insultes francaises
        foreach (self::$insultsFr as $word) {
            $normalizedWord = self::normalizeText($word);
            if (strpos($normalizedContent, $normalizedWord) !== false) {
                $violations[] = 'insult';
                $isClean = false;
                break;
            }
        }

        // Vérifier le racisme francais
        foreach (self::$racismFr as $word) {
            $normalizedWord = self::normalizeText($word);
            if (strpos($normalizedContent, $normalizedWord) !== false) {
                $violations[] = 'racism';
                $isClean = false;
                break;
            }
        }

        // Vérifier les menaces francaises
        foreach (self::$threatsFr as $word) {
            $normalizedWord = self::normalizeText($word);
            if (strpos($normalizedContent, $normalizedWord) !== false) {
                $violations[] = 'threat';
                $isClean = false;
                break;
            }
        }

        // Vérifier les insultes arabes
        foreach (self::$insultsAr as $word) {
            if (mb_strpos($content, $word, 0, 'UTF-8') !== false) {
                $violations[] = 'insult';
                $isClean = false;
                break;
            }
        }

        // Vérifier le racisme arabe
        foreach (self::$racismAr as $word) {
            if (mb_strpos($content, $word, 0, 'UTF-8') !== false) {
                $violations[] = 'racism';
                $isClean = false;
                break;
            }
        }

        // Vérifier les menaces arabes
        foreach (self::$threatsAr as $word) {
            if (mb_strpos($content, $word, 0, 'UTF-8') !== false) {
                $violations[] = 'threat';
                $isClean = false;
                break;
            }
        }

        // Supprimer les doublons
        $violations = array_unique($violations);

        // Créer le contenu filtré (censuré)
        $filteredContent = $content;
        if (!$isClean) {
            // Censurer les patterns
            foreach (self::$patterns as $type => $patterns) {
                foreach ($patterns as $pattern) {
                    $filteredContent = preg_replace($pattern, '[CENSURÉ]', $filteredContent);
                }
            }
            // Censurer les mots interdits
            $allForbiddenWords = array_merge(
                self::$insultsFr, self::$racismFr, self::$threatsFr,
                self::$insultsAr, self::$racismAr, self::$threatsAr
            );
            foreach ($allForbiddenWords as $word) {
                $filteredContent = str_ireplace($word, str_repeat('*', mb_strlen($word)), $filteredContent);
            }
        }

        return [
            'is_clean' => $isClean,
            'violations' => $violations,
            'filtered_content' => $filteredContent
        ];
    }

    /**
     * Génère un message d'avertissement pour l'utilisateur
     *
     * @param array $violations Types de violations détectées
     * @return string Message d'avertissement formaté
     */
    public static function getWarningMessage(array $violations): string
    {
        // Messages specifiques pour les violations graves
        if (in_array('racism', $violations)) {
            return "Message bloqué : Les propos racistes ou discriminatoires sont strictement interdits sur GlamGo. Tout manquement peut entraîner la suspension de votre compte.";
        }
        if (in_array('threat', $violations)) {
            return "Message bloqué : Les menaces sont strictement interdites et peuvent être signalées aux autorités compétentes.";
        }
        if (in_array('insult', $violations)) {
            return "Message bloqué : Merci de communiquer de manière respectueuse. Les insultes ne sont pas tolérées.";
        }

        $detected = array_map(function ($v) {
            return self::$violationLabels[$v] ?? $v;
        }, $violations);

        $list = implode(', ', $detected);

        return "Message bloqué : Le partage de {$list} n'est pas autorisé. Utilisez uniquement le chat GlamGo pour communiquer de manière sécurisée.";
    }

    /**
     * Génère un message d'avertissement en arabe
     *
     * @param array $violations Types de violations détectées
     * @return string Message d'avertissement en arabe
     */
    public static function getWarningMessageArabic(array $violations): string
    {
        $labels = [
            'phone' => 'أرقام الهاتف',
            'email' => 'عناوين البريد الإلكتروني',
            'whatsapp' => 'واتساب',
            'social' => 'روابط الشبكات الاجتماعية',
            'contact_keywords' => 'معلومات الاتصال',
            'insult' => 'الإهانات',
            'racism' => 'التمييز العنصري',
            'threat' => 'التهديدات'
        ];

        $detected = array_map(function ($v) use ($labels) {
            return $labels[$v] ?? $v;
        }, $violations);

        $list = implode('، ', $detected);

        // Messages specifiques pour les violations graves
        if (in_array('racism', $violations)) {
            return "تم حظر الرسالة: الكلام العنصري ممنوع منعا باتا في GlamGo.";
        }
        if (in_array('threat', $violations)) {
            return "تم حظر الرسالة: التهديدات ممنوعة وقد يتم إبلاغ السلطات.";
        }
        if (in_array('insult', $violations)) {
            return "تم حظر الرسالة: يرجى التحدث باحترام.";
        }

        return "تم حظر الرسالة: مشاركة {$list} غير مسموح بها. استخدم دردشة GlamGo فقط للتواصل بشكل آمن.";
    }

    /**
     * Vérifie si le chat est encore actif pour une commande
     *
     * @param array $order Données de la commande
     * @param int $daysAfterCompletion Nombre de jours après completion où le chat reste actif
     * @return array ['is_active' => bool, 'reason' => string|null]
     */
    public static function isChatActive(array $order, int $daysAfterCompletion = 7): array
    {
        // Commande annulée = chat désactivé
        if ($order['status'] === 'cancelled') {
            return [
                'is_active' => false,
                'reason' => 'Le chat est désactivé pour les commandes annulées'
            ];
        }

        // Commande terminée = vérifier délai
        if ($order['status'] === 'completed' && isset($order['completed_at'])) {
            $completedDate = new \DateTime($order['completed_at']);
            $now = new \DateTime();
            $diffDays = $now->diff($completedDate)->days;

            if ($diffDays > $daysAfterCompletion) {
                return [
                    'is_active' => false,
                    'reason' => "Le chat est désactivé {$daysAfterCompletion} jours après la fin de la prestation"
                ];
            }
        }

        return [
            'is_active' => true,
            'reason' => null
        ];
    }

    /**
     * Vérifie si un utilisateur peut envoyer un message à une commande
     *
     * @param array $order Données de la commande
     * @param int $userId ID utilisateur (client)
     * @param int|null $providerId ID prestataire
     * @return array ['can_send' => bool, 'reason' => string|null]
     */
    public static function canSendMessage(array $order, ?int $userId = null, ?int $providerId = null): array
    {
        // Vérifier l'accès
        if ($userId && $order['user_id'] != $userId) {
            return [
                'can_send' => false,
                'reason' => 'Vous n\'avez pas accès à cette commande'
            ];
        }

        if ($providerId && $order['provider_id'] != $providerId) {
            return [
                'can_send' => false,
                'reason' => 'Vous n\'avez pas accès à cette commande'
            ];
        }

        // Vérifier si le chat est actif
        $chatStatus = self::isChatActive($order);
        if (!$chatStatus['is_active']) {
            return [
                'can_send' => false,
                'reason' => $chatStatus['reason']
            ];
        }

        return [
            'can_send' => true,
            'reason' => null
        ];
    }

    /**
     * Obtient le nombre de caractères maximum autorisés
     */
    public static function getMaxMessageLength(): int
    {
        return 1000;
    }

    /**
     * Obtient les types de fichiers autorisés pour les images
     */
    public static function getAllowedImageTypes(): array
    {
        return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    }

    /**
     * Obtient la taille maximum des images en bytes
     */
    public static function getMaxImageSize(): int
    {
        return 5 * 1024 * 1024; // 5 MB
    }
}
