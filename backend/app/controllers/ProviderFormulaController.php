<?php
/**
 * ProviderFormulaController - GlamGo Backend
 * Gestion des formules de reservation par prestataire
 */

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Formula;

class ProviderFormulaController extends Controller
{
    private Formula $formulaModel;

    public function __construct()
    {
        $this->formulaModel = new Formula();
    }

    /**
     * GET /api/booking-formulas
     * Liste toutes les formules disponibles
     */
    public function getAllFormulas(): void
    {
        try {
            $formulas = $this->formulaModel->getAllActive();

            // Convertir price_modifier en float
            foreach ($formulas as &$formula) {
                $formula['price_modifier'] = (float) $formula['price_modifier'];
            }

            $this->success($formulas);
        } catch (\Exception $e) {
            error_log('[ProviderFormulaController] getAllFormulas error: ' . $e->getMessage());
            $this->error('Erreur lors de la recuperation des formules', 500);
        }
    }

    /**
     * GET /api/provider/formulas
     * Liste les formules du prestataire connecte
     */
    public function getProviderFormulas(): void
    {
        try {
            $providerId = $this->getProviderId();
            if (!$providerId) {
                $this->error('Non autorise', 401);
                return;
            }

            $formulas = $this->formulaModel->getProviderFormulas($providerId);

            // Convertir price_modifier en float
            foreach ($formulas as &$formula) {
                $formula['price_modifier'] = (float) $formula['price_modifier'];
            }

            $this->success($formulas);
        } catch (\Exception $e) {
            error_log('[ProviderFormulaController] getProviderFormulas error: ' . $e->getMessage());
            $this->error('Erreur lors de la recuperation des formules', 500);
        }
    }

    /**
     * POST /api/provider/formulas
     * Ajouter une ou plusieurs formules au prestataire
     * Body: { formula_ids: [1, 2, 3] } ou { formula_id: 1 }
     */
    public function addFormulas(): void
    {
        try {
            $providerId = $this->getProviderId();
            if (!$providerId) {
                $this->error('Non autorise', 401);
                return;
            }

            $data = $this->getJsonInput();

            // Support pour un seul ID ou plusieurs
            $formulaIds = [];
            if (isset($data['formula_ids']) && is_array($data['formula_ids'])) {
                $formulaIds = $data['formula_ids'];
            } elseif (isset($data['formula_id'])) {
                $formulaIds = [(int) $data['formula_id']];
            }

            if (empty($formulaIds)) {
                $this->error('Aucune formule specifiee', 400);
                return;
            }

            $added = 0;
            $errors = [];

            foreach ($formulaIds as $formulaId) {
                // Verifier que la formule existe
                $formula = $this->formulaModel->find((int)$formulaId);
                if (!$formula) {
                    $errors[] = "Formule ID $formulaId non trouvee";
                    continue;
                }

                if ($this->formulaModel->addToProvider($providerId, (int)$formulaId)) {
                    $added++;
                }
            }

            $this->success([
                'message' => "$added formule(s) ajoutee(s)",
                'added' => $added,
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            error_log('[ProviderFormulaController] addFormulas error: ' . $e->getMessage());
            $this->error('Erreur lors de l\'ajout des formules', 500);
        }
    }

    /**
     * DELETE /api/provider/formulas/{id}
     * Retirer une formule du prestataire
     */
    public function removeFormula(string $formulaId): void
    {
        try {
            $providerId = $this->getProviderId();
            if (!$providerId) {
                $this->error('Non autorise', 401);
                return;
            }

            // Verifier que la liaison existe
            if (!$this->formulaModel->providerHasFormula($providerId, (int)$formulaId)) {
                $this->error('Formule non trouvee dans votre liste', 404);
                return;
            }

            $this->formulaModel->removeFromProvider($providerId, (int)$formulaId);

            $this->success(['message' => 'Formule retiree']);
        } catch (\Exception $e) {
            error_log('[ProviderFormulaController] removeFormula error: ' . $e->getMessage());
            $this->error('Erreur lors de la suppression de la formule', 500);
        }
    }

    /**
     * PUT /api/provider/formulas
     * Mettre a jour toutes les formules du prestataire (remplace toutes)
     * Body: { formula_ids: [1, 2, 3] }
     */
    public function updateFormulas(): void
    {
        try {
            $providerId = $this->getProviderId();
            if (!$providerId) {
                $this->error('Non autorise', 401);
                return;
            }

            $data = $this->getJsonInput();
            $formulaIds = $data['formula_ids'] ?? [];

            if (!is_array($formulaIds)) {
                $this->error('formula_ids doit etre un tableau', 400);
                return;
            }

            // Supprimer toutes les formules existantes
            $this->formulaModel->removeAllFromProvider($providerId);

            // Ajouter les nouvelles
            $added = 0;
            foreach ($formulaIds as $formulaId) {
                // Verifier que la formule existe
                $formula = $this->formulaModel->find((int)$formulaId);
                if (!$formula) {
                    continue;
                }

                if ($this->formulaModel->addToProvider($providerId, (int)$formulaId)) {
                    $added++;
                }
            }

            $this->success([
                'message' => "Formules mises a jour ($added actives)",
                'count' => $added
            ]);
        } catch (\Exception $e) {
            error_log('[ProviderFormulaController] updateFormulas error: ' . $e->getMessage());
            $this->error('Erreur lors de la mise a jour des formules', 500);
        }
    }

    /**
     * GET /api/providers/by-formula/{slug}
     * Trouver les prestataires ayant une formule specifique
     */
    public function getProvidersByFormula(string $formulaSlug): void
    {
        try {
            $providers = $this->formulaModel->getProvidersByFormulaSlug($formulaSlug);
            $this->success($providers);
        } catch (\Exception $e) {
            error_log('[ProviderFormulaController] getProvidersByFormula error: ' . $e->getMessage());
            $this->error('Erreur lors de la recherche', 500);
        }
    }

    /**
     * Obtenir l'ID du prestataire connecte
     */
    private function getProviderId(): ?int
    {
        $userType = $_SERVER['USER_TYPE'] ?? null;
        $userId = $_SERVER['USER_ID'] ?? null;

        if ($userType === 'provider' && $userId) {
            return (int) $userId;
        }

        return null;
    }
}
