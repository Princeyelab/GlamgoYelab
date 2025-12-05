-- =============================================================================
-- Migration 013: Système de satisfaction post-prestation
-- GlamGo - Marrakech
-- Date: 2025-11-28
-- Description: Workflow complet de fin de prestation avec questionnaire obligatoire
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table principale: Questionnaires de satisfaction
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL UNIQUE COMMENT 'Un questionnaire par commande',
    user_id INT NOT NULL COMMENT 'Client qui évalue',
    provider_id INT NOT NULL COMMENT 'Prestataire évalué',

    -- Réponses questionnaire (questions obligatoires)
    quality_rating INT NOT NULL COMMENT 'Note qualité générale 1-5',
    punctuality BOOLEAN NOT NULL COMMENT 'Prestataire ponctuel ?',
    price_respected BOOLEAN NOT NULL COMMENT 'Prix annoncé respecté ?',

    -- Réponses optionnelles
    professionalism_rating INT DEFAULT NULL COMMENT 'Note professionnalisme 1-5 (optionnel)',

    -- Commentaire et médias
    comment TEXT DEFAULT NULL COMMENT 'Commentaire libre (max 1000 chars)',
    photos JSON DEFAULT NULL COMMENT 'URLs photos avant/après (optionnel)',

    -- Métadonnées
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date soumission',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP client pour anti-fraude',

    -- Contraintes
    CONSTRAINT chk_quality_rating CHECK (quality_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_professionalism_rating CHECK (professionalism_rating IS NULL OR professionalism_rating BETWEEN 1 AND 5),

    -- Clés étrangères
    CONSTRAINT fk_survey_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_survey_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_survey_provider FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,

    -- Index
    INDEX idx_surveys_provider (provider_id, submitted_at),
    INDEX idx_surveys_user (user_id),
    INDEX idx_surveys_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Questionnaires de satisfaction post-prestation';

-- -----------------------------------------------------------------------------
-- Modification table orders: Ajout statut completed_pending_review
-- -----------------------------------------------------------------------------
-- Note: MySQL n'a pas de ALTER TYPE, on doit modifier l'ENUM directement

-- Vérifier si la colonne existe déjà avec le bon ENUM
-- Si erreur, cela signifie que la migration a déjà été appliquée
ALTER TABLE orders MODIFY COLUMN status ENUM(
    'pending',
    'accepted',
    'on_way',
    'in_progress',
    'completed_pending_review',
    'completed',
    'cancelled'
) NOT NULL DEFAULT 'pending' COMMENT 'Statut commande avec étape review';

-- Ajouter colonne pour stocker la date de fin côté prestataire
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_completed_at TIMESTAMP NULL DEFAULT NULL
    COMMENT 'Date fin prestation signalée par prestataire';

-- -----------------------------------------------------------------------------
-- Index pour performances
-- -----------------------------------------------------------------------------
-- Index sur statut en attente de review (pour notifications automatiques)
CREATE INDEX IF NOT EXISTS idx_orders_pending_review ON orders(status, user_id)
    COMMENT 'Optimise recherche commandes en attente évaluation';

-- Index sur date soumission pour dashboard admin
CREATE INDEX IF NOT EXISTS idx_surveys_submitted ON satisfaction_surveys(submitted_at DESC)
    COMMENT 'Optimise tri chronologique avis';

-- -----------------------------------------------------------------------------
-- Table statistiques prestataires (optionnel - dénormalisation pour perf)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_satisfaction_stats (
    provider_id INT PRIMARY KEY,
    total_reviews INT NOT NULL DEFAULT 0,
    avg_quality_rating DECIMAL(3,2) DEFAULT NULL,
    avg_professionalism DECIMAL(3,2) DEFAULT NULL,
    punctuality_rate DECIMAL(5,2) DEFAULT NULL COMMENT 'Pourcentage ponctualité',
    price_respect_rate DECIMAL(5,2) DEFAULT NULL COMMENT 'Pourcentage respect prix',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_stats_provider FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cache statistiques satisfaction par prestataire';

-- -----------------------------------------------------------------------------
-- Trigger: Mise à jour auto des stats après insertion questionnaire
-- -----------------------------------------------------------------------------
DELIMITER //

DROP TRIGGER IF EXISTS trg_update_provider_stats//

CREATE TRIGGER trg_update_provider_stats
AFTER INSERT ON satisfaction_surveys
FOR EACH ROW
BEGIN
    -- Calculer les nouvelles statistiques
    DECLARE v_total INT;
    DECLARE v_avg_quality DECIMAL(3,2);
    DECLARE v_avg_prof DECIMAL(3,2);
    DECLARE v_punctuality DECIMAL(5,2);
    DECLARE v_price_respect DECIMAL(5,2);

    SELECT
        COUNT(*),
        AVG(quality_rating),
        AVG(professionalism_rating),
        (SUM(CASE WHEN punctuality = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100,
        (SUM(CASE WHEN price_respected = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100
    INTO v_total, v_avg_quality, v_avg_prof, v_punctuality, v_price_respect
    FROM satisfaction_surveys
    WHERE provider_id = NEW.provider_id;

    -- Upsert dans la table de stats
    INSERT INTO provider_satisfaction_stats
        (provider_id, total_reviews, avg_quality_rating, avg_professionalism, punctuality_rate, price_respect_rate)
    VALUES
        (NEW.provider_id, v_total, v_avg_quality, v_avg_prof, v_punctuality, v_price_respect)
    ON DUPLICATE KEY UPDATE
        total_reviews = v_total,
        avg_quality_rating = v_avg_quality,
        avg_professionalism = v_avg_prof,
        punctuality_rate = v_punctuality,
        price_respect_rate = v_price_respect;

    -- Mettre à jour le rating dans la table providers
    UPDATE providers SET rating = v_avg_quality WHERE id = NEW.provider_id;
END//

DELIMITER ;

-- -----------------------------------------------------------------------------
-- Données initiales pour tests (optionnel, décommenter si besoin)
-- -----------------------------------------------------------------------------
-- INSERT INTO satisfaction_surveys (order_id, user_id, provider_id, quality_rating, punctuality, price_respected, professionalism_rating, comment)
-- VALUES
--     (1, 1, 1, 5, TRUE, TRUE, 5, 'Excellent service, très professionnel !'),
--     (2, 2, 1, 4, TRUE, TRUE, 4, 'Bon travail, rien à redire.');

-- =============================================================================
-- FIN MIGRATION 013
-- =============================================================================
