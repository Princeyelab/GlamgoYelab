<?php

/**
 * ChatController - Gestion du système de chat
 *
 * Permet la communication entre utilisateurs et prestataires
 * avec traduction automatique des messages
 */
class ChatController extends Controller
{
    /**
     * Récupère tous les messages d'une conversation (commande)
     *
     * GET /api/orders/{id}/chat
     *
     * Note: Accessible aux utilisateurs et prestataires (avec validation d'accès)
     *
     * @param array $params Paramètres de la route
     * @return void
     */
    public function getMessages(array $params = []): void
    {
        // Vérifier que l'ID est fourni
        if (!isset($params['id']) || !is_numeric($params['id'])) {
            $this->error('ID de commande invalide', 400);
        }

        $orderId = (int) $params['id'];

        // Authentifier et déterminer le type d'utilisateur
        $authInfo = $this->authenticate();

        if (!$authInfo) {
            $this->error('Authentification requise', 401);
        }

        try {
            // Récupérer la commande pour vérifier l'accès
            $order = Order::findById($orderId);

            if (!$order) {
                $this->error('Commande non trouvée', 404);
            }

            // Vérifier l'accès
            if ($authInfo['type'] === 'user') {
                if ((int)$order['user_id'] !== $authInfo['id']) {
                    $this->error('Vous n\'avez pas accès à cette conversation', 403);
                }
            } elseif ($authInfo['type'] === 'provider') {
                if ((int)$order['provider_id'] !== $authInfo['id']) {
                    $this->error('Vous n\'avez pas accès à cette conversation', 403);
                }
            }

            // Récupérer tous les messages
            $messages = Message::getByOrderId($orderId);

            // Formater les messages
            $formattedMessages = array_map(function($message) {
                return [
                    'id' => (int)$message['id'],
                    'sender_type' => $message['sender_type'],
                    'sender_id' => (int)$message['sender_id'],
                    'sender_name' => $message['sender_first_name'] . ' ' . $message['sender_last_name'],
                    'content' => $message['content'],
                    'translated_content' => $message['translated_content'],
                    'target_lang' => $message['target_lang'],
                    'created_at' => $message['created_at'],
                    'time_ago' => $this->getTimeAgo($message['created_at'])
                ];
            }, $messages);

            $this->success([
                'order_id' => $orderId,
                'messages' => $formattedMessages,
                'total' => count($formattedMessages)
            ], 'Messages récupérés avec succès');

        } catch (Exception $e) {
            $this->error('Erreur lors de la récupération des messages: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Envoie un nouveau message dans une conversation
     *
     * POST /api/orders/{id}/chat
     * Body: { content, target_lang (optionnel) }
     *
     * Note: Accessible aux utilisateurs et prestataires
     *
     * @param array $params Paramètres de la route
     * @return void
     */
    public function postMessage(array $params = []): void
    {
        // Vérifier que l'ID est fourni
        if (!isset($params['id']) || !is_numeric($params['id'])) {
            $this->error('ID de commande invalide', 400);
        }

        $orderId = (int) $params['id'];

        // Authentifier et déterminer le type d'utilisateur
        $authInfo = $this->authenticate();

        if (!$authInfo) {
            $this->error('Authentification requise', 401);
        }

        // Récupérer les données JSON
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'content' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $content = trim($data['content']);
        $targetLang = $data['target_lang'] ?? 'fr';

        // Vérifier que le message n'est pas vide
        if (empty($content)) {
            $this->error('Le message ne peut pas être vide', 400);
        }

        try {
            // Récupérer la commande pour vérifier l'accès
            $order = Order::findById($orderId);

            if (!$order) {
                $this->error('Commande non trouvée', 404);
            }

            // Déterminer sender_type et sender_id
            $senderType = $authInfo['type'];
            $senderId = $authInfo['id'];

            // Vérifier l'accès
            if ($senderType === 'user') {
                if ((int)$order['user_id'] !== $senderId) {
                    $this->error('Vous n\'avez pas accès à cette conversation', 403);
                }
            } elseif ($senderType === 'provider') {
                if ((int)$order['provider_id'] !== $senderId) {
                    $this->error('Vous n\'avez pas accès à cette conversation', 403);
                }
            }

            // TRADUCTION AUTOMATIQUE (simulation)
            $translatedContent = $this->translate($content, $targetLang);

            // Créer le message
            $messageId = Message::create([
                'order_id' => $orderId,
                'sender_type' => $senderType,
                'sender_id' => $senderId,
                'content' => $content,
                'translated_content' => $translatedContent,
                'target_lang' => $targetLang
            ]);

            // Logger l'envoi du message
            error_log("💬 [CHAT] Nouveau message dans commande #$orderId de $senderType #$senderId");
            error_log("   Message: " . substr($content, 0, 50) . (strlen($content) > 50 ? '...' : ''));
            error_log("   Traduit: " . substr($translatedContent, 0, 50) . (strlen($translatedContent) > 50 ? '...' : ''));

            // Récupérer le message créé avec les informations de l'expéditeur
            $message = Message::findById($messageId);

            $this->success([
                'message' => [
                    'id' => (int)$message['id'],
                    'order_id' => $orderId,
                    'sender_type' => $message['sender_type'],
                    'sender_id' => (int)$message['sender_id'],
                    'sender_name' => $message['sender_first_name'] . ' ' . $message['sender_last_name'],
                    'content' => $message['content'],
                    'translated_content' => $message['translated_content'],
                    'target_lang' => $message['target_lang'],
                    'created_at' => $message['created_at']
                ]
            ], 'Message envoyé avec succès', 201);

        } catch (Exception $e) {
            $this->error('Erreur lors de l\'envoi du message: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Simule la traduction automatique d'un texte
     *
     * Dans une implémentation réelle, cette fonction ferait appel à une API
     * comme Google Translate, DeepL, ou Azure Translator
     *
     * @param string $text Texte à traduire
     * @param string $targetLang Langue cible (fr, en, ar, es, etc.)
     * @return string Texte traduit (simulé)
     */
    private function translate(string $text, string $targetLang): string
    {
        // SIMULATION DE TRADUCTION
        // Dans une vraie implémentation, on appellerait une API :
        //
        // Option 1: Google Cloud Translation API
        // $translate = new Google\Cloud\Translate\V2\TranslateClient(['key' => 'YOUR_API_KEY']);
        // $result = $translate->translate($text, ['target' => $targetLang]);
        // return $result['text'];
        //
        // Option 2: DeepL API
        // $translator = new \DeepL\Translator('YOUR_AUTH_KEY');
        // $result = $translator->translateText($text, null, $targetLang);
        // return $result->text;
        //
        // Option 3: Azure Translator
        // $response = Http::post('https://api.cognitive.microsofttranslator.com/translate', [
        //     'api-version' => '3.0',
        //     'to' => $targetLang
        // ], [['text' => $text]]);
        // return $response[0]['translations'][0]['text'];

        // Pour cette démo, on simule en préfixant le texte
        $prefix = match($targetLang) {
            'en' => '[TRANSLATED TO ENGLISH]',
            'ar' => '[مترجم إلى العربية]',
            'es' => '[TRADUCIDO AL ESPAÑOL]',
            'de' => '[ÜBERSETZT AUF DEUTSCH]',
            default => '[TRADUIT EN FRANÇAIS]'
        };

        return $prefix . ' ' . $text;
    }

    /**
     * Authentifie l'utilisateur ou le prestataire à partir du token JWT
     *
     * @return array|null Array avec 'type' (user/provider) et 'id', ou null si non authentifié
     */
    private function authenticate(): ?array
    {
        // Extraire le token depuis les headers
        $token = JWT::getTokenFromHeaders();

        if (!$token) {
            return null;
        }

        // Décoder et valider le token
        $payload = JWT::decode($token);

        if (!$payload) {
            return null;
        }

        // Déterminer le type (user ou provider)
        if (isset($payload['user_id'])) {
            // Token utilisateur
            return [
                'type' => 'user',
                'id' => (int)$payload['user_id']
            ];
        } elseif (isset($payload['provider_id'])) {
            // Token prestataire
            return [
                'type' => 'provider',
                'id' => (int)$payload['provider_id']
            ];
        }

        return null;
    }

    /**
     * Calcule le temps écoulé depuis une date
     *
     * @param string $datetime Date/heure
     * @return string Temps écoulé (ex: "il y a 5 minutes")
     */
    private function getTimeAgo(string $datetime): string
    {
        $timestamp = strtotime($datetime);
        $diff = time() - $timestamp;

        if ($diff < 60) {
            return "à l'instant";
        } elseif ($diff < 3600) {
            $mins = floor($diff / 60);
            return "il y a $mins minute" . ($mins > 1 ? 's' : '');
        } elseif ($diff < 86400) {
            $hours = floor($diff / 3600);
            return "il y a $hours heure" . ($hours > 1 ? 's' : '');
        } elseif ($diff < 604800) {
            $days = floor($diff / 86400);
            return "il y a $days jour" . ($days > 1 ? 's' : '');
        } else {
            return date('d/m/Y à H:i', $timestamp);
        }
    }
}
