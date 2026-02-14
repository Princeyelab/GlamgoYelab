<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;

class ProviderCustomServiceController extends Controller
{
    private const MAX_SERVICES = 10;
    private const MAX_IMAGES = 5;

    /**
     * Liste les services personnalisés du prestataire connecté
     */
    public function index(): void
    {
        $providerId = $_SERVER['USER_ID'];

        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT
                    pcs.*,
                    c.name as category_name,
                    c.slug as category_slug
                FROM provider_custom_services pcs
                LEFT JOIN categories c ON pcs.category_id = c.id
                WHERE pcs.provider_id = ?
                ORDER BY pcs.created_at DESC
            ");
            $stmt->execute([$providerId]);
            $services = $stmt->fetchAll();

            // Charger toutes les catégories pour le mapping
            $catStmt = $db->query("SELECT id, name, slug FROM categories");
            $allCategories = [];
            foreach ($catStmt->fetchAll() as $cat) {
                $allCategories[(int)$cat['id']] = $cat;
            }

            // Décoder les images JSON et résoudre les noms de catégories multiples
            foreach ($services as &$service) {
                $service['images'] = json_decode($service['images'] ?? '[]', true);
                $categoryIds = json_decode($service['category_ids'] ?? '[]', true);
                // Si category_ids est vide, utiliser category_id
                if (empty($categoryIds) && !empty($service['category_id'])) {
                    $categoryIds = [(int)$service['category_id']];
                }
                $service['category_ids'] = $categoryIds;
                $service['category_names'] = array_values(array_filter(array_map(
                    fn($cid) => $allCategories[(int)$cid]['name'] ?? null,
                    $categoryIds
                )));
            }

            $this->success([
                'services' => $services,
                'count' => count($services),
                'max_allowed' => self::MAX_SERVICES
            ]);

        } catch (\Exception $e) {
            $this->error('Erreur lors de la récupération des services: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Crée un nouveau service personnalisé
     */
    public function create(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'name' => 'required|min:3|max:100',
            'category_id' => 'required|numeric',
            'price' => 'required|numeric',
            'duration_minutes' => 'required|numeric'
        ]);

        // Validation numérique additionnelle
        if (empty($errors)) {
            if (isset($data['price']) && floatval($data['price']) < 1) {
                $errors['price'][] = "Le prix doit être d'au moins 1 MAD";
            }
            if (isset($data['duration_minutes'])) {
                $duration = intval($data['duration_minutes']);
                if ($duration < 15 || $duration > 300) {
                    $errors['duration_minutes'][] = "La durée doit être entre 15 et 300 minutes";
                }
            }
            if (isset($data['description']) && mb_strlen($data['description']) > 500) {
                $errors['description'][] = "La description ne doit pas dépasser 500 caractères";
            }
        }

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        try {
            $db = Database::getInstance();

            // Vérifier la limite
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM provider_custom_services WHERE provider_id = ?");
            $stmt->execute([$providerId]);
            $count = $stmt->fetch()['count'];

            if ($count >= self::MAX_SERVICES) {
                $this->error("Limite atteinte: vous ne pouvez pas créer plus de " . self::MAX_SERVICES . " services personnalisés", 400);
            }

            // Construire la liste des category IDs
            $categoryIds = [];
            if (!empty($data['category_ids']) && is_array($data['category_ids'])) {
                $categoryIds = array_map('intval', $data['category_ids']);
            } else {
                $categoryIds = [intval($data['category_id'])];
            }

            // Vérifier que toutes les catégories existent
            foreach ($categoryIds as $catId) {
                $stmt = $db->prepare("SELECT id FROM categories WHERE id = ?");
                $stmt->execute([$catId]);
                if (!$stmt->fetch()) {
                    $this->error("Catégorie invalide: $catId", 400);
                }
            }

            // Catégorie principale = première de la liste
            $primaryCategoryId = $categoryIds[0];

            // Créer le service
            $stmt = $db->prepare("
                INSERT INTO provider_custom_services
                (provider_id, category_id, category_ids, name, description, price, duration_minutes, images, is_active)
                VALUES (?, ?, ?::jsonb, ?, ?, ?, ?, '[]'::jsonb, TRUE)
                RETURNING id
            ");
            $stmt->execute([
                $providerId,
                $primaryCategoryId,
                json_encode($categoryIds),
                trim($data['name']),
                trim($data['description'] ?? ''),
                floatval($data['price']),
                intval($data['duration_minutes'])
            ]);

            $newId = $stmt->fetch()['id'];

            // Récupérer le service créé avec noms de catégories
            $stmt = $db->prepare("
                SELECT pcs.*, c.name as category_name
                FROM provider_custom_services pcs
                LEFT JOIN categories c ON pcs.category_id = c.id
                WHERE pcs.id = ?
            ");
            $stmt->execute([$newId]);
            $service = $stmt->fetch();
            $service['images'] = [];
            $service['category_ids'] = $categoryIds;

            // Résoudre les noms de catégories
            $catStmt = $db->query("SELECT id, name FROM categories");
            $allCats = [];
            foreach ($catStmt->fetchAll() as $cat) {
                $allCats[(int)$cat['id']] = $cat['name'];
            }
            $service['category_names'] = array_values(array_filter(array_map(
                fn($cid) => $allCats[(int)$cid] ?? null,
                $categoryIds
            )));

            $this->success([
                'service' => $service
            ], 'Service créé avec succès', 201);

        } catch (\Exception $e) {
            $this->error('Erreur lors de la création: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Affiche un service personnalisé
     */
    public function show(string $id): void
    {
        $providerId = $_SERVER['USER_ID'];

        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT pcs.*, c.name as category_name, c.slug as category_slug
                FROM provider_custom_services pcs
                LEFT JOIN categories c ON pcs.category_id = c.id
                WHERE pcs.id = ? AND pcs.provider_id = ?
            ");
            $stmt->execute([$id, $providerId]);
            $service = $stmt->fetch();

            if (!$service) {
                $this->error('Service non trouvé', 404);
            }

            $service['images'] = json_decode($service['images'] ?? '[]', true);

            $this->success(['service' => $service]);

        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Met à jour un service personnalisé
     */
    public function update(string $id): void
    {
        $providerId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        // Validation
        $errors = $this->validate($data, [
            'name' => 'min:3|max:100',
            'category_id' => 'numeric',
            'price' => 'numeric|min:1',
            'duration_minutes' => 'numeric|min:15|max:300'
        ]);

        if (empty($errors) && isset($data['description']) && mb_strlen($data['description']) > 500) {
            $errors['description'][] = "La description ne doit pas dépasser 500 caractères";
        }

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        try {
            $db = Database::getInstance();

            // Vérifier que le service appartient au prestataire
            $stmt = $db->prepare("SELECT id FROM provider_custom_services WHERE id = ? AND provider_id = ?");
            $stmt->execute([$id, $providerId]);
            if (!$stmt->fetch()) {
                $this->error('Service non trouvé', 404);
            }

            // Gérer les catégories multiples
            $categoryIds = null;
            if (!empty($data['category_ids']) && is_array($data['category_ids'])) {
                $categoryIds = array_map('intval', $data['category_ids']);
                // Vérifier que toutes les catégories existent
                foreach ($categoryIds as $catId) {
                    $stmt = $db->prepare("SELECT id FROM categories WHERE id = ?");
                    $stmt->execute([$catId]);
                    if (!$stmt->fetch()) {
                        $this->error("Catégorie invalide: $catId", 400);
                    }
                }
            } elseif (isset($data['category_id'])) {
                $stmt = $db->prepare("SELECT id FROM categories WHERE id = ?");
                $stmt->execute([$data['category_id']]);
                if (!$stmt->fetch()) {
                    $this->error('Catégorie invalide', 400);
                }
                $categoryIds = [intval($data['category_id'])];
            }

            // Construire la requête de mise à jour
            $updates = [];
            $params = [];

            if (isset($data['name'])) {
                $updates[] = "name = ?";
                $params[] = trim($data['name']);
            }
            if (isset($data['description'])) {
                $updates[] = "description = ?";
                $params[] = trim($data['description']);
            }
            if ($categoryIds !== null) {
                $updates[] = "category_id = ?";
                $params[] = $categoryIds[0]; // Première catégorie = principale
                $updates[] = "category_ids = ?::jsonb";
                $params[] = json_encode($categoryIds);
            }
            if (isset($data['price'])) {
                $updates[] = "price = ?";
                $params[] = floatval($data['price']);
            }
            if (isset($data['duration_minutes'])) {
                $updates[] = "duration_minutes = ?";
                $params[] = intval($data['duration_minutes']);
            }
            if (isset($data['is_active'])) {
                $updates[] = "is_active = ?";
                $isActive = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                $params[] = $isActive === true ? 't' : 'f';
            }

            if (empty($updates)) {
                $this->error('Aucune donnée à mettre à jour', 400);
            }

            $updates[] = "updated_at = CURRENT_TIMESTAMP";
            $params[] = $id;
            $params[] = $providerId;

            $sql = "UPDATE provider_custom_services SET " . implode(', ', $updates) . " WHERE id = ? AND provider_id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Récupérer le service mis à jour
            $stmt = $db->prepare("
                SELECT pcs.*, c.name as category_name
                FROM provider_custom_services pcs
                LEFT JOIN categories c ON pcs.category_id = c.id
                WHERE pcs.id = ?
            ");
            $stmt->execute([$id]);
            $service = $stmt->fetch();
            $service['images'] = json_decode($service['images'] ?? '[]', true);
            $service['category_ids'] = json_decode($service['category_ids'] ?? '[]', true);
            if (empty($service['category_ids']) && !empty($service['category_id'])) {
                $service['category_ids'] = [(int)$service['category_id']];
            }

            // Résoudre les noms de catégories
            $catStmt = $db->query("SELECT id, name FROM categories");
            $allCats = [];
            foreach ($catStmt->fetchAll() as $cat) {
                $allCats[(int)$cat['id']] = $cat['name'];
            }
            $service['category_names'] = array_values(array_filter(array_map(
                fn($cid) => $allCats[(int)$cid] ?? null,
                $service['category_ids']
            )));

            $this->success([
                'service' => $service
            ], 'Service mis à jour');

        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Supprime un service personnalisé
     * Vérifie qu'il n'y a pas de réservations actives avant suppression
     */
    public function delete(string $id): void
    {
        $providerId = $_SERVER['USER_ID'];

        try {
            $db = Database::getInstance();

            // Récupérer le service pour supprimer les images
            $stmt = $db->prepare("SELECT id, images FROM provider_custom_services WHERE id = ? AND provider_id = ?");
            $stmt->execute([(int)$id, (int)$providerId]);
            $service = $stmt->fetch();

            if (!$service) {
                $this->error('Service non trouvé', 404);
                return;
            }

            // Vérifier s'il y a des réservations actives liées à ce service
            $activeStatuses = ['pending', 'accepted', 'on_way', 'arrived', 'in_progress'];
            $placeholders = implode(',', array_fill(0, count($activeStatuses), '?'));
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM orders WHERE custom_service_id = ? AND status IN ($placeholders)");
            $stmt->execute(array_merge([(int)$id], $activeStatuses));
            $activeCount = (int)$stmt->fetch()['count'];

            if ($activeCount > 0) {
                $this->error(
                    "Impossible de supprimer ce service : il y a $activeCount réservation(s) active(s) en cours. Attendez que toutes les réservations soient terminées ou annulées.",
                    409
                );
                return;
            }

            // Supprimer les fichiers images (ignorer les erreurs)
            $images = json_decode($service['images'] ?? '[]', true) ?: [];
            foreach ($images as $imagePath) {
                try {
                    $fullPath = __DIR__ . '/../../public' . $imagePath;
                    if (file_exists($fullPath)) {
                        @unlink($fullPath);
                    }
                } catch (\Exception $imgEx) {
                    // Ignore image deletion errors
                }
            }

            // Supprimer le service
            $stmt = $db->prepare("DELETE FROM provider_custom_services WHERE id = ? AND provider_id = ?");
            $stmt->execute([(int)$id, (int)$providerId]);

            $this->success(null, 'Service supprimé');

        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Upload des images pour un service
     */
    public function uploadImages(string $id): void
    {
        $providerId = $_SERVER['USER_ID'];

        try {
            $db = Database::getInstance();

            // Vérifier que le service appartient au prestataire
            $stmt = $db->prepare("SELECT id, images FROM provider_custom_services WHERE id = ? AND provider_id = ?");
            $stmt->execute([$id, $providerId]);
            $service = $stmt->fetch();

            if (!$service) {
                $this->error('Service non trouvé', 404);
            }

            $existingImages = json_decode($service['images'] ?? '[]', true);

            // PHP reçoit 'images' ou 'images[]' selon le client
            $filesKey = isset($_FILES['images']) ? 'images' : (isset($_FILES['images[]']) ? 'images[]' : null);
            if (!$filesKey) {
                $this->error('Aucune image fournie', 400);
            }

            $files = $_FILES[$filesKey];
            $uploadedImages = [];

            // Gérer le cas d'un seul fichier ou plusieurs
            if (!is_array($files['name'])) {
                $files = [
                    'name' => [$files['name']],
                    'type' => [$files['type']],
                    'tmp_name' => [$files['tmp_name']],
                    'error' => [$files['error']],
                    'size' => [$files['size']]
                ];
            }

            $uploadDir = __DIR__ . '/../../public/uploads/custom-services/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            foreach ($files['name'] as $index => $name) {
                if ($files['error'][$index] !== UPLOAD_ERR_OK) {
                    continue;
                }

                // Vérifier la limite
                if (count($existingImages) + count($uploadedImages) >= self::MAX_IMAGES) {
                    break;
                }

                // Vérifier le type
                $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!in_array($files['type'][$index], $allowedTypes)) {
                    continue;
                }

                // Vérifier la taille (5MB max)
                if ($files['size'][$index] > 5 * 1024 * 1024) {
                    continue;
                }

                // Générer un nom unique
                $extension = pathinfo($name, PATHINFO_EXTENSION);
                $filename = "service_{$id}_" . uniqid() . '.' . $extension;
                $filepath = $uploadDir . $filename;

                if (move_uploaded_file($files['tmp_name'][$index], $filepath)) {
                    $uploadedImages[] = '/uploads/custom-services/' . $filename;
                }
            }

            if (empty($uploadedImages)) {
                $this->error('Aucune image valide uploadée', 400);
            }

            // Mettre à jour les images
            $allImages = array_merge($existingImages, $uploadedImages);
            $stmt = $db->prepare("UPDATE provider_custom_services SET images = ?::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([json_encode($allImages), $id]);

            $this->success([
                'images' => $allImages,
                'uploaded_count' => count($uploadedImages)
            ], 'Images uploadées');

        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Supprime une image d'un service
     */
    public function deleteImage(string $id, string $index): void
    {
        $providerId = $_SERVER['USER_ID'];
        $imageIndex = intval($index);

        try {
            $db = Database::getInstance();

            // Vérifier que le service appartient au prestataire
            $stmt = $db->prepare("SELECT id, images FROM provider_custom_services WHERE id = ? AND provider_id = ?");
            $stmt->execute([$id, $providerId]);
            $service = $stmt->fetch();

            if (!$service) {
                $this->error('Service non trouvé', 404);
            }

            $images = json_decode($service['images'] ?? '[]', true);

            if (!isset($images[$imageIndex])) {
                $this->error('Image non trouvée', 404);
            }

            // Supprimer le fichier
            $imagePath = $images[$imageIndex];
            $fullPath = __DIR__ . '/../../public' . $imagePath;
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            // Retirer de la liste
            array_splice($images, $imageIndex, 1);

            // Mettre à jour
            $stmt = $db->prepare("UPDATE provider_custom_services SET images = ?::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([json_encode($images), $id]);

            $this->success([
                'images' => $images
            ], 'Image supprimée');

        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Récupère les services personnalisés d'un prestataire (route publique)
     */
    public function getProviderCustomServices(string $providerId): void
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT
                    pcs.id,
                    pcs.name,
                    pcs.description,
                    pcs.price,
                    pcs.duration_minutes,
                    pcs.images,
                    pcs.category_id,
                    pcs.category_ids,
                    c.name as category_name,
                    c.slug as category_slug
                FROM provider_custom_services pcs
                LEFT JOIN categories c ON pcs.category_id = c.id
                WHERE pcs.provider_id = ? AND pcs.is_active = TRUE
                ORDER BY pcs.created_at DESC
            ");
            $stmt->execute([$providerId]);
            $services = $stmt->fetchAll();

            // Charger toutes les catégories pour le mapping
            $catStmt = $db->query("SELECT id, name FROM categories");
            $allCats = [];
            foreach ($catStmt->fetchAll() as $cat) {
                $allCats[(int)$cat['id']] = $cat['name'];
            }

            // Décoder les images JSON et résoudre catégories multiples
            foreach ($services as &$service) {
                $service['images'] = json_decode($service['images'] ?? '[]', true);
                $service['is_custom'] = true;
                $categoryIds = json_decode($service['category_ids'] ?? '[]', true);
                if (empty($categoryIds) && !empty($service['category_id'])) {
                    $categoryIds = [(int)$service['category_id']];
                }
                $service['category_ids'] = $categoryIds;
                $service['category_names'] = array_values(array_filter(array_map(
                    fn($cid) => $allCats[(int)$cid] ?? null,
                    $categoryIds
                )));
            }

            $this->success([
                'services' => $services,
                'count' => count($services)
            ]);

        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage(), 500);
        }
    }
}
