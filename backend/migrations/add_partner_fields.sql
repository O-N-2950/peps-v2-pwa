-- =====================================================
-- MIGRATION: Ajout des champs partenaires
-- Date: 22 janvier 2026
-- Description: Ajoute les champs nécessaires pour les formulaires d'inscription partenaires
-- =====================================================

-- =====================================================
-- 1. AJOUT DES COLONNES DANS LA TABLE PARTNERS
-- =====================================================

-- Informations personne de contact
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_first_name VARCHAR(50);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_last_name VARCHAR(50);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_birth_date DATE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_gender VARCHAR(20); -- 'male', 'female', 'other'
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_position VARCHAR(100); -- Fonction
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_email VARCHAR(120);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);

-- Type d'établissement
ALTER TABLE partners ADD COLUMN IF NOT EXISTS establishment_type VARCHAR(50); -- 'commerce', 'association', 'artisan'

-- Description et privilège
ALTER TABLE partners ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS privilege TEXT; -- Privilège exclusif OBLIGATOIRE

-- Logo
ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- Site internet
ALTER TABLE partners ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- Statut de validation
ALTER TABLE partners ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'approved', 'rejected'
ALTER TABLE partners ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Coordonnées GPS (déjà existantes mais on s'assure)
ALTER TABLE partners ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Adresse complète (déjà partiellement existante)
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_street VARCHAR(200);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(20);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_canton VARCHAR(50);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_country VARCHAR(2) DEFAULT 'CH';

-- Catégorie (relation avec table categories)
ALTER TABLE partners ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- =====================================================
-- 2. CRÉATION DE LA TABLE CATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    parent VARCHAR(100),
    icon VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. CRÉATION DE LA TABLE SUGGESTED_CATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS suggested_categories (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    suggested_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id)
);

-- =====================================================
-- 4. CRÉATION DE LA TABLE PRIVILEGE_SUGGESTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS privilege_suggestions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    suggestion TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. AJOUT DE LA FOREIGN KEY
-- =====================================================

ALTER TABLE partners 
ADD CONSTRAINT fk_partners_category 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- =====================================================
-- 6. CRÉATION D'INDEX POUR OPTIMISATION
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_category_id ON partners(category_id);
CREATE INDEX IF NOT EXISTS idx_partners_establishment_type ON partners(establishment_type);
CREATE INDEX IF NOT EXISTS idx_partners_address_city ON partners(address_city);
CREATE INDEX IF NOT EXISTS idx_partners_address_canton ON partners(address_canton);
CREATE INDEX IF NOT EXISTS idx_partners_address_country ON partners(address_country);
CREATE INDEX IF NOT EXISTS idx_partners_latitude_longitude ON partners(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent);

CREATE INDEX IF NOT EXISTS idx_suggested_categories_status ON suggested_categories(status);
CREATE INDEX IF NOT EXISTS idx_suggested_categories_partner_id ON suggested_categories(partner_id);

CREATE INDEX IF NOT EXISTS idx_privilege_suggestions_category_id ON privilege_suggestions(category_id);

-- =====================================================
-- 7. COMMENTAIRES SQL POUR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN partners.contact_birth_date IS 'Date de naissance de la personne de contact';
COMMENT ON COLUMN partners.contact_gender IS 'Sexe de la personne de contact: male, female, other';
COMMENT ON COLUMN partners.contact_position IS 'Fonction de la personne de contact (ex: Gérant, Directeur)';
COMMENT ON COLUMN partners.establishment_type IS 'Type d''établissement: commerce, association, artisan';
COMMENT ON COLUMN partners.privilege IS 'Privilège exclusif offert aux membres PEP''s (OBLIGATOIRE)';
COMMENT ON COLUMN partners.status IS 'Statut de validation: pending (en attente), approved (approuvé), rejected (rejeté)';
COMMENT ON COLUMN partners.rejection_reason IS 'Raison du rejet (si status = rejected)';

COMMENT ON TABLE categories IS 'Liste des catégories d''activité des partenaires';
COMMENT ON TABLE suggested_categories IS 'Domaines d''activité suggérés par les partenaires (validation admin)';
COMMENT ON TABLE privilege_suggestions IS 'Suggestions de privilèges par catégorie (générées par IA ou prédéfinies)';

-- =====================================================
-- 8. CONTRAINTES DE VALIDATION
-- =====================================================

-- Validation du genre de la personne de contact
ALTER TABLE partners ADD CONSTRAINT check_contact_gender CHECK (contact_gender IN ('male', 'female', 'other') OR contact_gender IS NULL);

-- Validation du type d'établissement
ALTER TABLE partners ADD CONSTRAINT check_establishment_type CHECK (establishment_type IN ('commerce', 'association', 'artisan') OR establishment_type IS NULL);

-- Validation du statut
ALTER TABLE partners ADD CONSTRAINT check_partner_status CHECK (status IN ('pending', 'approved', 'rejected'));

-- Validation du statut des catégories suggérées
ALTER TABLE suggested_categories ADD CONSTRAINT check_suggested_category_status CHECK (status IN ('pending', 'approved', 'rejected'));

-- =====================================================
-- 9. INSERTION DES CATÉGORIES PAR DÉFAUT
-- =====================================================

-- Restauration & Gastronomie
INSERT INTO categories (name, parent, icon, description) VALUES
('Restaurant', 'Restauration & Gastronomie', 'Utensils', 'Restaurant traditionnel, Brasserie, Bistrot'),
('Café / Bar', 'Restauration & Gastronomie', 'Coffee', 'Café, Bar, Tea room'),
('Boulangerie / Pâtisserie', 'Restauration & Gastronomie', 'Croissant', 'Boulangerie artisanale, Pâtisserie'),
('Traiteur', 'Restauration & Gastronomie', 'ChefHat', 'Service traiteur, Catering'),
('Fast-food / Street food', 'Restauration & Gastronomie', 'Sandwich', 'Kebab, Pizza, Burger'),
('Restaurant gastronomique', 'Restauration & Gastronomie', 'Award', 'Restaurant étoilé, Fine dining')
ON CONFLICT (name) DO NOTHING;

-- Alimentation & Épicerie
INSERT INTO categories (name, parent, icon, description) VALUES
('Épicerie / Superette', 'Alimentation & Épicerie', 'ShoppingCart', 'Épicerie de quartier, Superette'),
('Primeur / Fruits & Légumes', 'Alimentation & Épicerie', 'Apple', 'Maraîcher, Primeur'),
('Boucherie / Charcuterie', 'Alimentation & Épicerie', 'Beef', 'Boucherie artisanale'),
('Poissonnerie', 'Alimentation & Épicerie', 'Fish', 'Poissonnerie fraîche'),
('Fromagerie', 'Alimentation & Épicerie', 'Cheese', 'Fromagerie artisanale'),
('Cave à vin', 'Alimentation & Épicerie', 'Wine', 'Caviste, Œnothèque'),
('Épicerie fine', 'Alimentation & Épicerie', 'Gift', 'Produits du terroir, Spécialités')
ON CONFLICT (name) DO NOTHING;

-- Beauté & Bien-être
INSERT INTO categories (name, parent, icon, description) VALUES
('Coiffeur', 'Beauté & Bien-être', 'Scissors', 'Salon de coiffure, Barbier'),
('Esthétique', 'Beauté & Bien-être', 'Sparkles', 'Institut de beauté, Onglerie'),
('Spa / Massage', 'Beauté & Bien-être', 'Waves', 'Centre de massage, Spa'),
('Parfumerie', 'Beauté & Bien-être', 'Flower', 'Parfumerie, Cosmétiques'),
('Tatouage / Piercing', 'Beauté & Bien-être', 'Pen', 'Studio de tatouage')
ON CONFLICT (name) DO NOTHING;

-- Mode & Accessoires
INSERT INTO categories (name, parent, icon, description) VALUES
('Boutique de vêtements', 'Mode & Accessoires', 'ShoppingBag', 'Prêt-à-porter, Mode'),
('Chaussures', 'Mode & Accessoires', 'Footprints', 'Magasin de chaussures'),
('Maroquinerie', 'Mode & Accessoires', 'Briefcase', 'Sacs, Accessoires cuir'),
('Bijouterie / Horlogerie', 'Mode & Accessoires', 'Watch', 'Bijoutier, Horloger'),
('Optique', 'Mode & Accessoires', 'Glasses', 'Opticien, Lunettes')
ON CONFLICT (name) DO NOTHING;

-- Santé & Services médicaux
INSERT INTO categories (name, parent, icon, description) VALUES
('Pharmacie', 'Santé & Services médicaux', 'Pill', 'Pharmacie'),
('Parapharmacie', 'Santé & Services médicaux', 'Heart', 'Parapharmacie, Compléments'),
('Ostéopathie / Physiothérapie', 'Santé & Services médicaux', 'Activity', 'Ostéopathe, Physio'),
('Médecine alternative', 'Santé & Services médicaux', 'Leaf', 'Naturopathe, Acupuncture'),
('Fitness / Salle de sport', 'Santé & Services médicaux', 'Dumbbell', 'Salle de sport, Fitness'),
('Yoga / Pilates', 'Santé & Services médicaux', 'Sparkle', 'Studio de yoga')
ON CONFLICT (name) DO NOTHING;

-- Loisirs & Culture
INSERT INTO categories (name, parent, icon, description) VALUES
('Cinéma / Théâtre', 'Loisirs & Culture', 'Film', 'Cinéma, Théâtre'),
('Musée / Galerie', 'Loisirs & Culture', 'Palette', 'Musée, Galerie d''art'),
('Librairie / Papeterie', 'Loisirs & Culture', 'Book', 'Librairie, Papeterie'),
('Musique / Instruments', 'Loisirs & Culture', 'Music', 'Magasin de musique'),
('Jeux / Jouets', 'Loisirs & Culture', 'Gamepad', 'Magasin de jeux, Jouets'),
('Photographie', 'Loisirs & Culture', 'Camera', 'Studio photo, Photographe')
ON CONFLICT (name) DO NOTHING;

-- Maison & Décoration
INSERT INTO categories (name, parent, icon, description) VALUES
('Décoration intérieure', 'Maison & Décoration', 'Home', 'Magasin de déco'),
('Fleuriste', 'Maison & Décoration', 'Flower2', 'Fleuriste, Jardinerie'),
('Bricolage / Quincaillerie', 'Maison & Décoration', 'Hammer', 'Quincaillerie, Bricolage'),
('Électroménager', 'Maison & Décoration', 'Zap', 'Électroménager'),
('Meubles', 'Maison & Décoration', 'Sofa', 'Magasin de meubles')
ON CONFLICT (name) DO NOTHING;

-- Services professionnels
INSERT INTO categories (name, parent, icon, description) VALUES
('Pressing / Blanchisserie', 'Services professionnels', 'Shirt', 'Pressing, Nettoyage'),
('Cordonnerie / Retouches', 'Services professionnels', 'Scissors', 'Cordonnier, Retouches'),
('Imprimerie / Reprographie', 'Services professionnels', 'Printer', 'Imprimerie, Copie'),
('Coworking / Bureaux', 'Services professionnels', 'Building', 'Espace de coworking'),
('Services administratifs', 'Services professionnels', 'FileText', 'Secrétariat, Comptabilité')
ON CONFLICT (name) DO NOTHING;

-- Automobile & Mobilité
INSERT INTO categories (name, parent, icon, description) VALUES
('Garage / Mécanique', 'Automobile & Mobilité', 'Wrench', 'Garage automobile'),
('Lavage auto', 'Automobile & Mobilité', 'Droplet', 'Station de lavage'),
('Vélo / Trottinette', 'Automobile & Mobilité', 'Bike', 'Magasin de vélos, Réparation'),
('Location de véhicules', 'Automobile & Mobilité', 'Car', 'Location auto, Moto')
ON CONFLICT (name) DO NOTHING;

-- Technologie & Multimédia
INSERT INTO categories (name, parent, icon, description) VALUES
('Informatique / Réparation', 'Technologie & Multimédia', 'Laptop', 'Réparation ordinateurs'),
('Téléphonie / Accessoires', 'Technologie & Multimédia', 'Smartphone', 'Magasin de téléphones'),
('Électronique', 'Technologie & Multimédia', 'Cpu', 'Électronique, High-tech'),
('Jeux vidéo', 'Technologie & Multimédia', 'Gamepad2', 'Magasin de jeux vidéo')
ON CONFLICT (name) DO NOTHING;

-- Animaux & Animalerie
INSERT INTO categories (name, parent, icon, description) VALUES
('Animalerie', 'Animaux & Animalerie', 'PawPrint', 'Animalerie, Accessoires'),
('Vétérinaire', 'Animaux & Animalerie', 'Stethoscope', 'Clinique vétérinaire'),
('Toilettage', 'Animaux & Animalerie', 'Scissors', 'Toilettage pour animaux')
ON CONFLICT (name) DO NOTHING;

-- Autre
INSERT INTO categories (name, parent, icon, description) VALUES
('Autre', 'Autre', 'MoreHorizontal', 'Domaine non listé')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Vérification
SELECT 
    'partners' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(contact_first_name) AS with_contact,
    COUNT(privilege) AS with_privilege,
    COUNT(category_id) AS with_category,
    COUNT(status) AS with_status
FROM partners
UNION ALL
SELECT 
    'categories' AS table_name,
    COUNT(*) AS total_rows,
    0 AS with_contact,
    0 AS with_privilege,
    0 AS with_category,
    0 AS with_status
FROM categories;
