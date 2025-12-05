<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\User;

class UserController extends Controller
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * Récupère le profil de l'utilisateur connecté
     */
    public function profile(): void
    {
        $userId = $_SERVER['USER_ID'];

        $user = $this->userModel->find($userId);

        if (!$user) {
            $this->error('Utilisateur non trouvé', 404);
        }

        unset($user['password']);

        // Ajouter le nombre de parrainages
        $user['referrals_count'] = $this->userModel->countReferrals($userId);

        $this->success($user);
    }

    /**
     * Met à jour le profil
     */
    public function updateProfile(): void
    {
        $userId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        $allowedFields = ['first_name', 'last_name', 'phone', 'whatsapp', 'date_of_birth', 'address', 'city', 'latitude', 'longitude'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        if (empty($updateData)) {
            $this->error('Aucune donnée à mettre à jour', 400);
        }

        $this->userModel->update($userId, $updateData);

        $user = $this->userModel->find($userId);
        unset($user['password']);

        $this->success($user, 'Profil mis à jour');
    }

    /**
     * Upload de la photo de profil
     */
    public function uploadProfileImage(): void
    {
        $userId = $_SERVER['USER_ID'];

        // Verifier qu'un fichier a ete envoye
        if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] !== UPLOAD_ERR_OK) {
            $this->error('Aucune image fournie ou erreur d\'upload', 400);
        }

        $file = $_FILES['profile_image'];

        // Validation du type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedTypes)) {
            $this->error('Format non autorise. Utilisez JPG, PNG ou WEBP', 400);
        }

        // Validation de la taille (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            $this->error('Fichier trop volumineux (max 5 MB)', 400);
        }

        // Creer le repertoire si necessaire
        $uploadDir = __DIR__ . '/../../public/uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Supprimer l'ancienne photo si elle existe
        $user = $this->userModel->find($userId);
        if ($user && !empty($user['avatar']) && strpos($user['avatar'], '/uploads/') !== false) {
            $oldFile = __DIR__ . '/../../public' . $user['avatar'];
            if (file_exists($oldFile)) {
                unlink($oldFile);
            }
        }

        // Generer un nom unique
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'user_' . $userId . '_' . time() . '.' . $extension;
        $destination = $uploadDir . $filename;

        // Deplacer le fichier
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            $this->error('Erreur lors de l\'enregistrement de l\'image', 500);
        }

        // Mettre a jour l'avatar en base
        $avatarPath = '/uploads/avatars/' . $filename;
        $this->userModel->update($userId, ['avatar' => $avatarPath]);

        $this->success([
            'avatar' => $avatarPath
        ], 'Photo de profil mise a jour');
    }

    /**
     * Upload d'avatar (alias pour compatibilite)
     */
    public function uploadAvatar(): void
    {
        $this->uploadProfileImage();
    }
}
