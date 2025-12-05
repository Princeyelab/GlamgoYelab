<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Review;
use App\Models\Order;

class ReviewController extends Controller
{
    private Review $reviewModel;
    private Order $orderModel;

    public function __construct()
    {
        $this->reviewModel = new Review();
        $this->orderModel = new Order();
    }

    /**
     * Crée une évaluation pour une commande
     */
    public function create(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'rating' => 'required|numeric'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // Vérifier que la commande existe et appartient à l'utilisateur
        $order = $this->orderModel->find((int)$orderId);
        if (!$order) {
            $this->error('Commande non trouvée', 404);
        }

        if ($order['user_id'] != $userId) {
            $this->error('Accès refusé', 403);
        }

        // Vérifier que la commande est terminée
        if ($order['status'] !== 'completed') {
            $this->error('La commande doit être terminée pour être évaluée', 400);
        }

        // Vérifier qu'il n'y a pas déjà d'évaluation
        if ($this->reviewModel->hasReview((int)$orderId)) {
            $this->error('Cette commande a déjà été évaluée', 400);
        }

        // Valider la note principale (1-5)
        $rating = (int)$data['rating'];
        if ($rating < 1 || $rating > 5) {
            $this->error('La note doit être entre 1 et 5', 400);
        }

        // Valider les notes détaillées si fournies
        $serviceQuality = isset($data['service_quality']) ? (int)$data['service_quality'] : null;
        $punctuality = isset($data['punctuality']) ? (int)$data['punctuality'] : null;
        $professionalism = isset($data['professionalism']) ? (int)$data['professionalism'] : null;

        foreach ([$serviceQuality, $punctuality, $professionalism] as $score) {
            if ($score !== null && ($score < 1 || $score > 5)) {
                $this->error('Toutes les notes doivent être entre 1 et 5', 400);
            }
        }

        // Créer l'évaluation
        $review = $this->reviewModel->createReview([
            'order_id' => (int)$orderId,
            'user_id' => $userId,
            'provider_id' => $order['provider_id'],
            'rating' => $rating,
            'comment' => $data['comment'] ?? null,
            'service_quality' => $serviceQuality,
            'punctuality' => $punctuality,
            'professionalism' => $professionalism
        ]);

        if (!$review) {
            $this->error('Erreur lors de la création de l\'avis', 500);
        }

        $this->success($review, 'Merci pour votre avis !', 201);
    }

    /**
     * Récupère l'avis d'une commande
     */
    public function getOrderReview(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'];

        // Vérifier que la commande appartient à l'utilisateur
        $order = $this->orderModel->find((int)$orderId);
        if (!$order || $order['user_id'] != $userId) {
            $this->error('Commande non trouvée', 404);
        }

        $review = $this->reviewModel->getReviewByOrderId((int)$orderId);

        $this->success($review);
    }

    /**
     * Récupère les avis d'un prestataire (public)
     */
    public function getProviderReviews(string $providerId): void
    {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $reviews = $this->reviewModel->getProviderReviews((int)$providerId, $limit, $offset);
        $stats = $this->reviewModel->getProviderReviewStats((int)$providerId);

        $this->success([
            'reviews' => $reviews,
            'stats' => $stats
        ]);
    }

    /**
     * Récupère les statistiques d'un prestataire
     */
    public function getProviderStats(string $providerId): void
    {
        $stats = $this->reviewModel->getProviderReviewStats((int)$providerId);
        $this->success($stats);
    }

    /**
     * Vérifie si une commande peut être évaluée
     */
    public function canReview(string $orderId): void
    {
        $userId = $_SERVER['USER_ID'];

        $order = $this->orderModel->find((int)$orderId);
        if (!$order || $order['user_id'] != $userId) {
            $this->error('Commande non trouvée', 404);
        }

        $canReview = $order['status'] === 'completed' && !$this->reviewModel->hasReview((int)$orderId);

        $this->success([
            'can_review' => $canReview,
            'reason' => $canReview ? null : ($order['status'] !== 'completed' ? 'not_completed' : 'already_reviewed')
        ]);
    }
}
