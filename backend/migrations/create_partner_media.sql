-- =====================================================
-- MIGRATION: Création de la table partner_media
-- Date: 22 janvier 2026
-- Description: Table pour gérer les médias des partenaires (menus, photos, PDF)
-- =====================================================

-- =====================================================
-- 1. CRÉATION DE LA TABLE PARTNER_MEDIA
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_media (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    
    -- Type de média
    media_type VARCHAR(50) NOT NULL, -- 'menu_jour', 'menu_semaine', 'carte_complete', 'promotion', 'galerie'
    
    -- Fichier
    file_url VARCHAR(500) NOT NULL, -- URL du fichier dans le stockage externe
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER, -- Taille en bytes
    file_type VARCHAR(50), -- 'image/jpeg', 'image/png', 'application/pdf', etc.
    
    -- Métadonnées
    title VARCHAR(200),
    description TEXT,
    
    -- Dates de validité
    start_date DATE,
    end_date DATE,
    expires_at TIMESTAMP, -- Expiration automatique (menu du jour, menu semaine)
    
    -- Statut
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'deleted'
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    -- Statistiques
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0
);

-- =====================================================
-- 2. CRÉATION D'INDEX POUR OPTIMISATION
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_partner_media_partner_id ON partner_media(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_media_media_type ON partner_media(media_type);
CREATE INDEX IF NOT EXISTS idx_partner_media_status ON partner_media(status);
CREATE INDEX IF NOT EXISTS idx_partner_media_expires_at ON partner_media(expires_at);
CREATE INDEX IF NOT EXISTS idx_partner_media_created_at ON partner_media(created_at DESC);

-- Index composite pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_partner_media_partner_type_status 
ON partner_media(partner_id, media_type, status);

-- =====================================================
-- 3. COMMENTAIRES SQL POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE partner_media IS 'Médias uploadés par les partenaires (menus, photos, PDF)';

COMMENT ON COLUMN partner_media.media_type IS 'Type de média: menu_jour, menu_semaine, carte_complete, promotion, galerie';
COMMENT ON COLUMN partner_media.file_url IS 'URL du fichier dans le stockage externe (Supabase, Cloudflare R2, etc.)';
COMMENT ON COLUMN partner_media.expires_at IS 'Date/heure d''expiration automatique (menu du jour: 23h59, menu semaine: dimanche 23h59)';
COMMENT ON COLUMN partner_media.status IS 'Statut: active (actif), expired (expiré), deleted (supprimé)';

-- =====================================================
-- 4. CONTRAINTES DE VALIDATION
-- =====================================================

-- Validation du type de média
ALTER TABLE partner_media ADD CONSTRAINT check_media_type 
CHECK (media_type IN ('menu_jour', 'menu_semaine', 'carte_complete', 'promotion', 'galerie'));

-- Validation du statut
ALTER TABLE partner_media ADD CONSTRAINT check_media_status 
CHECK (status IN ('active', 'expired', 'deleted'));

-- Validation des dates
ALTER TABLE partner_media ADD CONSTRAINT check_media_dates 
CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);

-- =====================================================
-- 5. TRIGGER POUR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_partner_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_media_updated_at
BEFORE UPDATE ON partner_media
FOR EACH ROW
EXECUTE FUNCTION update_partner_media_updated_at();

-- =====================================================
-- 6. FONCTION POUR EXPIRER LES MÉDIAS AUTOMATIQUEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION expire_partner_media()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Expirer les médias dont la date d'expiration est dépassée
    UPDATE partner_media
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Expirer les promotions dont la date de fin est dépassée
    UPDATE partner_media
    SET status = 'expired'
    WHERE status = 'active'
    AND media_type = 'promotion'
    AND end_date IS NOT NULL
    AND end_date < CURRENT_DATE;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. EXEMPLES D'UTILISATION
-- =====================================================

-- Exemple 1: Insérer un menu du jour (expire automatiquement à 23h59)
-- INSERT INTO partner_media (partner_id, media_type, file_url, file_name, file_type, expires_at, created_by)
-- VALUES (1, 'menu_jour', 'https://storage.example.com/menu-20260122.jpg', 'menu-20260122.jpg', 'image/jpeg', 
--         CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second', 1);

-- Exemple 2: Insérer un menu de la semaine (expire dimanche 23h59)
-- INSERT INTO partner_media (partner_id, media_type, file_url, file_name, file_type, expires_at, created_by)
-- VALUES (1, 'menu_semaine', 'https://storage.example.com/menu-semaine-3.pdf', 'menu-semaine-3.pdf', 'application/pdf',
--         DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days' + INTERVAL '23 hours 59 minutes', 1);

-- Exemple 3: Insérer une carte complète (pas d'expiration)
-- INSERT INTO partner_media (partner_id, media_type, file_url, file_name, file_type, created_by)
-- VALUES (1, 'carte_complete', 'https://storage.example.com/carte-restaurant.pdf', 'carte-restaurant.pdf', 'application/pdf', 1);

-- Exemple 4: Insérer une promotion (expire à une date précise)
-- INSERT INTO partner_media (partner_id, media_type, file_url, file_name, file_type, title, start_date, end_date, created_by)
-- VALUES (1, 'promotion', 'https://storage.example.com/promo-hiver.jpg', 'promo-hiver.jpg', 'image/jpeg',
--         'Promotion hiver -20%', '2026-01-22', '2026-02-28', 1);

-- Exemple 5: Insérer une photo de galerie (pas d'expiration)
-- INSERT INTO partner_media (partner_id, media_type, file_url, file_name, file_type, title, created_by)
-- VALUES (1, 'galerie', 'https://storage.example.com/ambiance-restaurant.jpg', 'ambiance-restaurant.jpg', 'image/jpeg',
--         'Ambiance du restaurant', 1);

-- =====================================================
-- 8. REQUÊTES UTILES
-- =====================================================

-- Récupérer tous les médias actifs d'un partenaire
-- SELECT * FROM partner_media 
-- WHERE partner_id = 1 AND status = 'active' 
-- ORDER BY created_at DESC;

-- Récupérer le menu du jour actif d'un partenaire
-- SELECT * FROM partner_media 
-- WHERE partner_id = 1 AND media_type = 'menu_jour' AND status = 'active' 
-- ORDER BY created_at DESC LIMIT 1;

-- Récupérer toutes les promotions actives
-- SELECT pm.*, p.name AS partner_name 
-- FROM partner_media pm
-- JOIN partners p ON pm.partner_id = p.id
-- WHERE pm.media_type = 'promotion' 
-- AND pm.status = 'active'
-- AND (pm.start_date IS NULL OR pm.start_date <= CURRENT_DATE)
-- AND (pm.end_date IS NULL OR pm.end_date >= CURRENT_DATE)
-- ORDER BY pm.created_at DESC;

-- Expirer les médias périmés (à exécuter via cron job quotidien)
-- SELECT expire_partner_media();

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Vérification
SELECT 
    'partner_media' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(CASE WHEN status = 'active' THEN 1 END) AS active,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) AS expired,
    COUNT(CASE WHEN status = 'deleted' THEN 1 END) AS deleted
FROM partner_media;
