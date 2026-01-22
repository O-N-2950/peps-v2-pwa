-- =====================================================
-- MIGRATION: Ajout des champs membres
-- Date: 22 janvier 2026
-- Description: Ajoute les champs nécessaires pour les formulaires d'inscription membres
-- =====================================================

-- =====================================================
-- 1. AJOUT DES COLONNES DANS LA TABLE USERS
-- =====================================================

-- Informations personnelles
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20); -- 'male', 'female', 'other'
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Adresse complète
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_canton VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_country VARCHAR(2) DEFAULT 'CH'; -- Code ISO 3166-1 alpha-2

-- Devise (déjà existant mais on s'assure)
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'CHF';

-- =====================================================
-- 2. AJOUT DES COLONNES DANS LA TABLE MEMBERS
-- =====================================================

-- Type de membre
ALTER TABLE members ADD COLUMN IF NOT EXISTS member_type VARCHAR(20) DEFAULT 'private'; -- 'private' ou 'company'

-- Informations entreprise (si member_type = 'company')
ALTER TABLE members ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE members ADD COLUMN IF NOT EXISTS company_sector VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS company_website VARCHAR(500);

-- Informations personne de contact (si member_type = 'company')
ALTER TABLE members ADD COLUMN IF NOT EXISTS contact_first_name VARCHAR(50);
ALTER TABLE members ADD COLUMN IF NOT EXISTS contact_last_name VARCHAR(50);
ALTER TABLE members ADD COLUMN IF NOT EXISTS contact_birth_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS contact_gender VARCHAR(20); -- 'male', 'female', 'other'
ALTER TABLE members ADD COLUMN IF NOT EXISTS contact_position VARCHAR(100); -- Fonction dans l'entreprise

-- =====================================================
-- 3. CRÉATION D'INDEX POUR OPTIMISATION
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_birth_date ON users(birth_date);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_address_city ON users(address_city);
CREATE INDEX IF NOT EXISTS idx_users_address_canton ON users(address_canton);
CREATE INDEX IF NOT EXISTS idx_users_address_country ON users(address_country);
CREATE INDEX IF NOT EXISTS idx_users_currency ON users(currency);

CREATE INDEX IF NOT EXISTS idx_members_member_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_members_company_name ON members(company_name);

-- =====================================================
-- 4. COMMENTAIRES SQL POUR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN users.birth_date IS 'Date de naissance (validation 18+ ans)';
COMMENT ON COLUMN users.gender IS 'Sexe: male, female, other';
COMMENT ON COLUMN users.address_country IS 'Code pays ISO 3166-1 alpha-2 (CH, FR, BE, etc.)';
COMMENT ON COLUMN users.currency IS 'Devise: CHF (Suisse), EUR (France, Belgique)';

COMMENT ON COLUMN members.member_type IS 'Type de membre: private (particulier) ou company (entreprise)';
COMMENT ON COLUMN members.contact_position IS 'Fonction de la personne de contact dans l''entreprise';

-- =====================================================
-- 5. CONTRAINTES DE VALIDATION
-- =====================================================

-- Validation du genre
ALTER TABLE users ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female', 'other') OR gender IS NULL);

-- Validation du type de membre
ALTER TABLE members ADD CONSTRAINT check_member_type CHECK (member_type IN ('private', 'company'));

-- Validation de la devise
ALTER TABLE users ADD CONSTRAINT check_currency CHECK (currency IN ('CHF', 'EUR'));

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Vérification
SELECT 
    'users' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(birth_date) AS with_birth_date,
    COUNT(gender) AS with_gender,
    COUNT(address_city) AS with_address
FROM users
UNION ALL
SELECT 
    'members' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(member_type) AS with_member_type,
    COUNT(company_name) AS with_company_name,
    0 AS with_address
FROM members;
