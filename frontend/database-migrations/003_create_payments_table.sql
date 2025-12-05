-- Migration: Création de la table payments pour gérer les paiements et pourboires
-- Date: 2025-01-22
-- Description: Gestion des paiements en espèces avec système de pourboire et commission 20%

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,

  -- Références
  order_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  provider_id BIGINT NOT NULL,

  -- Montants détaillés
  service_amount DECIMAL(10,2) NOT NULL COMMENT 'Montant du service négocié',
  tip_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Pourboire (0% commission)',
  subtotal DECIMAL(10,2) NOT NULL COMMENT 'service_amount + tip_amount',

  -- Commission (20% sur service uniquement, pas sur pourboire)
  platform_commission_rate DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Taux de commission en %',
  platform_commission DECIMAL(10,2) NOT NULL COMMENT '20% du service_amount',

  -- Total
  total_amount DECIMAL(10,2) NOT NULL COMMENT 'Montant total payé par le client',
  provider_earnings DECIMAL(10,2) NOT NULL COMMENT 'Ce que reçoit le prestataire (service - commission + pourboire)',

  -- Informations de paiement
  payment_method ENUM('cash') DEFAULT 'cash' COMMENT 'Méthode de paiement (espèces uniquement pour le moment)',
  payment_status ENUM('pending', 'confirmed', 'disputed', 'refunded') DEFAULT 'pending',

  -- Confirmation
  confirmed_by_client BOOLEAN DEFAULT FALSE,
  confirmed_by_provider BOOLEAN DEFAULT FALSE,
  client_confirmed_at TIMESTAMP NULL,
  provider_confirmed_at TIMESTAMP NULL,

  -- Métadonnées
  payment_notes TEXT COMMENT 'Notes sur le paiement',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Index et contraintes
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,

  INDEX idx_order (order_id),
  INDEX idx_user (user_id),
  INDEX idx_provider (provider_id),
  INDEX idx_status (payment_status),
  INDEX idx_created (created_at)
);

-- Trigger pour calculer automatiquement les montants
DELIMITER $$

CREATE TRIGGER before_payment_insert
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
  -- Calculer le sous-total
  SET NEW.subtotal = NEW.service_amount + NEW.tip_amount;

  -- Calculer la commission (20% sur service uniquement)
  SET NEW.platform_commission = NEW.service_amount * (NEW.platform_commission_rate / 100);

  -- Total = service + pourboire
  SET NEW.total_amount = NEW.subtotal;

  -- Ce que reçoit le prestataire = service - commission + 100% du pourboire
  SET NEW.provider_earnings = (NEW.service_amount - NEW.platform_commission) + NEW.tip_amount;
END$$

CREATE TRIGGER before_payment_update
BEFORE UPDATE ON payments
FOR EACH ROW
BEGIN
  -- Recalculer en cas de modification
  SET NEW.subtotal = NEW.service_amount + NEW.tip_amount;
  SET NEW.platform_commission = NEW.service_amount * (NEW.platform_commission_rate / 100);
  SET NEW.total_amount = NEW.subtotal;
  SET NEW.provider_earnings = (NEW.service_amount - NEW.platform_commission) + NEW.tip_amount;
END$$

DELIMITER ;

-- Exemples de calculs :
-- Service : 150 MAD, Pourboire : 30 MAD
-- Commission : 150 * 20% = 30 MAD
-- Total client : 150 + 30 = 180 MAD
-- Prestataire reçoit : (150 - 30) + 30 = 150 MAD
-- GlamGo reçoit : 30 MAD

-- Service : 200 MAD, Pourboire : 0 MAD
-- Commission : 200 * 20% = 40 MAD
-- Total client : 200 MAD
-- Prestataire reçoit : 200 - 40 = 160 MAD
-- GlamGo reçoit : 40 MAD
