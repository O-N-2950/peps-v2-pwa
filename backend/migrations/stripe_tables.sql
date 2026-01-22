-- ============================================
-- MIGRATION: TABLES STRIPE POUR PEP'S V2
-- Date: 2026-01-22
-- Description: Création des tables pour gérer les abonnements et paiements Stripe
-- ============================================

-- 1. TABLE ABONNEMENTS
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pack_size INTEGER NOT NULL, -- Nombre d'accès (1, 2, 3, ..., 5000)
    price_annual DECIMAL(10,2) NOT NULL, -- Prix annuel (ex: 199.00)
    currency VARCHAR(3) DEFAULT 'CHF',
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'expired'
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- 2. TABLE PAIEMENTS (Historique)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
    stripe_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CHF',
    status VARCHAR(20) DEFAULT 'pending', -- 'succeeded', 'failed', 'refunded', 'pending'
    payment_method VARCHAR(50), -- 'card', 'sepa_debit', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 3. GESTION DES SLOTS (Pour les packs multi-accès)
CREATE TABLE IF NOT EXISTS access_slots (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Celui qui a payé
    assigned_email VARCHAR(255), -- Email de la personne assignée
    assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- L'utilisateur qui active le slot
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'assigned', 'active'
    activated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_access_slots_subscription_id ON access_slots(subscription_id);
CREATE INDEX IF NOT EXISTS idx_access_slots_manager_id ON access_slots(manager_id);
CREATE INDEX IF NOT EXISTS idx_access_slots_assigned_user_id ON access_slots(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_access_slots_status ON access_slots(status);

-- 4. MISE À JOUR TABLE USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_subscription_owner BOOLEAN DEFAULT FALSE;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- ============================================
-- COMMENTAIRES SUR LES TABLES
-- ============================================

COMMENT ON TABLE subscriptions IS 'Abonnements annuels PEP''S avec intégration Stripe';
COMMENT ON COLUMN subscriptions.pack_size IS 'Nombre d''accès achetés (1 à 5000)';
COMMENT ON COLUMN subscriptions.price_annual IS 'Prix annuel en CHF ou EUR';
COMMENT ON COLUMN subscriptions.status IS 'Statut: active, canceled, past_due, expired';

COMMENT ON TABLE payments IS 'Historique de tous les paiements effectués';
COMMENT ON COLUMN payments.status IS 'Statut: succeeded, failed, refunded, pending';

COMMENT ON TABLE access_slots IS 'Gestion des slots d''accès pour les packs multi-utilisateurs';
COMMENT ON COLUMN access_slots.manager_id IS 'Utilisateur qui a acheté le pack';
COMMENT ON COLUMN access_slots.assigned_user_id IS 'Utilisateur qui utilise ce slot';
COMMENT ON COLUMN access_slots.status IS 'Statut: available, assigned, active';

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que les tables ont été créées
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'payments', 'access_slots')
ORDER BY table_name;

-- Afficher la structure de la table subscriptions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;
