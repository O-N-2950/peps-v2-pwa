-- Migration : Créer la table flash_reservations pour les réservations d'offres flash

CREATE TABLE IF NOT EXISTS flash_reservations (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'confirmed',
    member_notes TEXT,
    partner_notes TEXT,
    used_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_flash_reservations_member ON flash_reservations(member_id);
CREATE INDEX idx_flash_reservations_partner ON flash_reservations(partner_id);
CREATE INDEX idx_flash_reservations_offer ON flash_reservations(offer_id);
CREATE INDEX idx_flash_reservations_status ON flash_reservations(status);
CREATE INDEX idx_flash_reservations_created ON flash_reservations(created_at);
