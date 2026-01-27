-- Migration SQL : Système de Notifications Push + Offres Flash
-- Date : 27 janvier 2026
-- Description : Création des tables pour favoris, notifications, offres flash et réservations

BEGIN;

-- ============================================
-- 1. SYSTÈME DE FAVORIS
-- ============================================

CREATE TABLE IF NOT EXISTS member_favorites (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(member_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_member_favorites_member ON member_favorites(member_id);
CREATE INDEX IF NOT EXISTS idx_member_favorites_partner ON member_favorites(partner_id);

-- ============================================
-- 2. PARAMÈTRES DE NOTIFICATION
-- ============================================

CREATE TABLE IF NOT EXISTS member_notification_settings (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    proximity_radius_km INTEGER DEFAULT 3,
    max_notifications_per_day INTEGER DEFAULT 5,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    favorite_categories JSONB DEFAULT '[]',
    firebase_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_member ON member_notification_settings(member_id);

-- ============================================
-- 3. HISTORIQUE DES NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS push_notifications_log (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    opened BOOLEAN DEFAULT FALSE,
    opened_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_log_member ON push_notifications_log(member_id);
CREATE INDEX IF NOT EXISTS idx_push_log_sent_at ON push_notifications_log(sent_at);

-- ============================================
-- 4. GÉOLOCALISATION (Ajout aux tables existantes)
-- ============================================

-- Ajouter latitude/longitude aux membres
ALTER TABLE members
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_members_location ON members(latitude, longitude);

-- Ajouter latitude/longitude aux partenaires
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

CREATE INDEX IF NOT EXISTS idx_partners_location ON partners(latitude, longitude);

-- ============================================
-- 5. OFFRES FLASH (Modification de la table offers)
-- ============================================

ALTER TABLE offers
ADD COLUMN IF NOT EXISTS is_flash BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_stock INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS validity_start TIMESTAMP,
ADD COLUMN IF NOT EXISTS validity_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_is_flash ON offers(is_flash);
CREATE INDEX IF NOT EXISTS idx_offers_validity ON offers(validity_start, validity_end);

-- ============================================
-- 6. RÉSERVATIONS D'OFFRES FLASH (Modification de la table bookings existante)
-- ============================================

-- Ajouter le lien vers les offres flash
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bookings_offer ON bookings(offer_id);

-- ============================================
-- 7. LISTE D'ATTENTE
-- ============================================

CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP,
    UNIQUE(offer_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_offer ON waitlist(offer_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_member ON waitlist(member_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON waitlist(notified);

COMMIT;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher les tables créées
SELECT 'Tables créées avec succès:' as message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'member_favorites',
    'member_notification_settings',
    'push_notifications_log',
    'waitlist'
)
ORDER BY table_name;
