<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Provider;
use App\Helpers\JWT;
use App\Helpers\Password;

class ProviderController extends Controller
{
    private Provider $providerModel;

    public function __construct()
    {
        $this->providerModel = new Provider();
    }

    /**
     * Connexion d'un prestataire
     */
    public function login(): void
    {
        $data = $this->getJsonInput();

        $errors = $this->validate($data, [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        $provider = $this->providerModel->findByEmail($data['email']);

        if (!$provider || !Password::verify($data['password'], $provider['password'])) {
            $this->error('Email ou mot de passe incorrect', 401);
        }

        // Générer le token JWT
        $token = JWT::encode([
            'user_id' => $provider['id'],
            'user_type' => 'provider',
            'email' => $provider['email']
        ]);

        unset($provider['password']);

        $this->success([
            'token' => $token,
            'provider' => $provider
        ], 'Connexion réussie');
    }

    /**
     * Inscription d'un prestataire
     */
    public function register(): void
    {
        // Supporter FormData (multipart) et JSON
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
        } else {
            $data = $this->getJsonInput();
        }

        $errors = $this->validate($data, [
            'email' => 'required|email',
            'password' => 'required|min:6',
            'first_name' => 'required|min:2',
            'last_name' => 'required|min:2',
            'phone' => 'required'
        ]);

        if (!empty($errors)) {
            $this->error('Erreurs de validation', 422, $errors);
        }

        // Verifier si l'email existe deja
        if ($this->providerModel->findByEmail($data['email'])) {
            $this->error('Cet email est deja utilise', 409);
        }

        // Gerer l'upload de la photo de profil
        $avatarPath = null;
        if (isset($_FILES['profile_photo']) && $_FILES['profile_photo']['error'] === UPLOAD_ERR_OK) {
            $avatarPath = $this->handleProfilePhotoUpload($_FILES['profile_photo']);
            if (!$avatarPath) {
                $this->error('Erreur lors de l\'upload de la photo de profil', 400);
            }
        }

        // Preparer les donnees du prestataire avec tous les champs
        $providerData = [
            'email' => $data['email'],
            'password' => Password::hash($data['password']),
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'],
            'is_verified' => 0,
            'is_available' => 0
        ];

        // Ajouter la photo si uploadee
        if ($avatarPath) {
            $providerData['avatar'] = $avatarPath;
        }

        // Ajouter les champs optionnels s'ils sont fournis
        $optionalFields = [
            'date_of_birth', 'cin_number', 'professional_license',
            'address', 'city', 'latitude', 'longitude',
            'bio', 'experience_years', 'starting_price'
        ];

        foreach ($optionalFields as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                $providerData[$field] = $data[$field];
            }
        }

        // Champs JSON
        $jsonFields = ['specialties', 'coverage_area', 'availability_schedule'];
        foreach ($jsonFields as $field) {
            if (isset($data[$field])) {
                // Si c'est une chaine JSON, la garder telle quelle
                if (is_string($data[$field])) {
                    $providerData[$field] = $data[$field];
                } elseif (is_array($data[$field]) || is_object($data[$field])) {
                    $providerData[$field] = json_encode($data[$field]);
                }
            }
        }

        // Mapper intervention_radius vers intervention_radius_km
        if (isset($data['intervention_radius'])) {
            $providerData['intervention_radius_km'] = (int) $data['intervention_radius'];
        }

        // Copier latitude/longitude vers current_latitude/current_longitude pour la recherche
        if (isset($data['latitude']) && isset($data['longitude'])) {
            $providerData['current_latitude'] = $data['latitude'];
            $providerData['current_longitude'] = $data['longitude'];
        }

        // Creer le prestataire
        $providerId = $this->providerModel->create($providerData);

        // Generer le token JWT
        $token = JWT::encode([
            'user_id' => $providerId,
            'user_type' => 'provider',
            'email' => $data['email']
        ]);

        $provider = $this->providerModel->find($providerId);
        unset($provider['password']);

        $this->success([
            'token' => $token,
            'provider' => $provider
        ], 'Inscription reussie', 201);
    }

    /**
     * Gere l'upload de la photo de profil
     */
    private function handleProfilePhotoUpload(array $file): ?string
    {
        // Validation du type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedTypes)) {
            return null;
        }

        // Validation de la taille (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            return null;
        }

        // Creer le repertoire si necessaire
        $uploadDir = __DIR__ . '/../../public/uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generer un nom unique
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'provider_' . time() . '_' . uniqid() . '.' . $extension;
        $destination = $uploadDir . $filename;

        // Deplacer le fichier
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            return null;
        }

        return '/uploads/avatars/' . $filename;
    }

    /**
     * Récupère le profil du prestataire
     */
    public function profile(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $provider = $this->providerModel->find($providerId);

        if (!$provider) {
            $this->error('Prestataire non trouvé', 404);
        }

        unset($provider['password']);

        // Ajouter les services
        $provider['services'] = $this->providerModel->getServices($providerId);

        $this->success($provider);
    }

    /**
     * Met à jour le profil du prestataire
     */
    public function updateProfile(): void
    {
        $providerId = $_SERVER['USER_ID'];
        $data = $this->getJsonInput();

        // Liste etendue des champs modifiables
        $allowedFields = [
            'first_name', 'last_name', 'phone', 'is_available',
            'email', 'date_of_birth', 'cin_number', 'professional_license',
            'address', 'city', 'latitude', 'longitude',
            'bio', 'experience_years', 'starting_price',
            'specialties', 'coverage_area', 'availability_schedule'
        ];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                // Convertir les tableaux/objets en JSON pour le stockage
                if (in_array($field, ['specialties', 'coverage_area', 'availability_schedule'])) {
                    $updateData[$field] = is_array($data[$field]) || is_object($data[$field])
                        ? json_encode($data[$field])
                        : $data[$field];
                } else {
                    $updateData[$field] = $data[$field];
                }
            }
        }

        // Mapper intervention_radius vers intervention_radius_km
        if (isset($data['intervention_radius'])) {
            $updateData['intervention_radius_km'] = (int) $data['intervention_radius'];
        }

        if (empty($updateData)) {
            $this->error('Aucune donnee a mettre a jour', 400);
        }

        $this->providerModel->update($providerId, $updateData);

        $provider = $this->providerModel->find($providerId);
        unset($provider['password']);

        $this->success($provider, 'Profil mis a jour');
    }

    /**
     * Upload de la photo de profil du prestataire
     */
    public function uploadProfileImage(): void
    {
        $providerId = $_SERVER['USER_ID'];

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
        $provider = $this->providerModel->find($providerId);
        if ($provider && !empty($provider['avatar']) && strpos($provider['avatar'], '/uploads/') !== false) {
            $oldFile = __DIR__ . '/../../public' . $provider['avatar'];
            if (file_exists($oldFile)) {
                unlink($oldFile);
            }
        }

        // Generer un nom unique
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'provider_' . $providerId . '_' . time() . '.' . $extension;
        $destination = $uploadDir . $filename;

        // Deplacer le fichier
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            $this->error('Erreur lors de l\'enregistrement de l\'image', 500);
        }

        // Mettre a jour l'avatar en base
        $avatarPath = '/uploads/avatars/' . $filename;
        $this->providerModel->update($providerId, ['avatar' => $avatarPath]);

        $this->success([
            'avatar' => $avatarPath
        ], 'Photo de profil mise a jour');
    }

    /**
     * Upload des documents d'identite du prestataire (CIN)
     */
    public function uploadDocuments(): void
    {
        $providerId = $_SERVER['USER_ID'];

        // Recuperer les donnees du formulaire
        $cinNumber = $_POST['cin_number'] ?? null;
        $charterAccepted = $_POST['charter_accepted'] ?? false;

        // Validation du numero CIN
        if (!$cinNumber) {
            $this->error('Numero CIN requis', 400);
        }

        // Creer le repertoire des documents si necessaire
        $uploadDir = __DIR__ . '/../../public/uploads/documents/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $cinFrontPath = null;
        $cinBackPath = null;

        // Upload CIN recto
        if (isset($_FILES['cin_front']) && $_FILES['cin_front']['error'] === UPLOAD_ERR_OK) {
            $cinFrontPath = $this->uploadDocumentFile($_FILES['cin_front'], $providerId, 'cin_front', $uploadDir);
        }

        // Upload CIN verso
        if (isset($_FILES['cin_back']) && $_FILES['cin_back']['error'] === UPLOAD_ERR_OK) {
            $cinBackPath = $this->uploadDocumentFile($_FILES['cin_back'], $providerId, 'cin_back', $uploadDir);
        }

        // Mettre a jour les informations du prestataire
        $updateData = [
            'cin_number' => strtoupper($cinNumber),
            'charter_accepted' => $charterAccepted === 'true' || $charterAccepted === true ? true : false
        ];

        if ($cinFrontPath) {
            $updateData['cin_front_path'] = $cinFrontPath;
        }
        if ($cinBackPath) {
            $updateData['cin_back_path'] = $cinBackPath;
        }

        $this->providerModel->update($providerId, $updateData);

        $this->success([
            'cin_number' => strtoupper($cinNumber),
            'cin_front_uploaded' => !empty($cinFrontPath),
            'cin_back_uploaded' => !empty($cinBackPath),
            'charter_accepted' => $charterAccepted
        ], 'Documents enregistres avec succes');
    }

    /**
     * Helper pour uploader un fichier de document
     */
    private function uploadDocumentFile(array $file, int $providerId, string $docType, string $uploadDir): ?string
    {
        // Validation du type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedTypes)) {
            return null;
        }

        // Validation de la taille (max 10MB)
        if ($file['size'] > 10 * 1024 * 1024) {
            return null;
        }

        // Generer un nom unique
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = $docType . '_' . $providerId . '_' . time() . '.' . $extension;
        $destination = $uploadDir . $filename;

        // Deplacer le fichier
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            return null;
        }

        return '/uploads/documents/' . $filename;
    }

}
