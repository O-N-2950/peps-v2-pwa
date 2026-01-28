"""
Migration V21: Système de tracking des activations + feedback
Ajoute les tables nécessaires pour le tracking des activations de privilèges
"""
from models import db
from sqlalchemy import text

def run_migration():
    """Exécute la migration pour créer les tables de tracking"""
    print("🚀 Migration V21: Tracking + Feedback")
    
    try:
        # Vérifier si la table privilege_activations existe déjà
        # Détection compatible PostgreSQL et SQLite
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        exists = 'privilege_activations' in inspector.get_table_names()
        
        if not exists:
            print("📊 Création de la table privilege_activations...")
            db.session.execute(text("""
                CREATE TABLE privilege_activations (
                    id SERIAL PRIMARY KEY,
                    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
                    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
                    
                    -- Informations d'activation
                    activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    expires_at TIMESTAMP NOT NULL,
                    validation_code VARCHAR(100) UNIQUE NOT NULL,
                    
                    -- Statut
                    status VARCHAR(20) NOT NULL DEFAULT 'active',
                    -- active: En cours (2 minutes)
                    -- expired: Expiré
                    -- validated: Validé par le commerçant
                    -- cancelled: Annulé
                    
                    -- Feedback membre (optionnel)
                    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
                    feedback_comment TEXT,
                    feedback_submitted_at TIMESTAMP,
                    feedback_points_awarded INTEGER DEFAULT 0,
                    
                    -- Métadonnées
                    latitude FLOAT,
                    longitude FLOAT,
                    device_info TEXT,
                    
                    -- Index pour performance
                    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
                );
                
                -- Index pour les requêtes fréquentes
                CREATE INDEX idx_activations_member ON privilege_activations(member_id);
                CREATE INDEX idx_activations_partner ON privilege_activations(partner_id);
                CREATE INDEX idx_activations_status ON privilege_activations(status);
                CREATE INDEX idx_activations_date ON privilege_activations(activated_at DESC);
                CREATE INDEX idx_activations_validation ON privilege_activations(validation_code);
            """))
            print("✅ Table privilege_activations créée avec succès")
        else:
            print("ℹ️  Table privilege_activations existe déjà")
        
        db.session.commit()
        print("✅ Migration V21 terminée avec succès")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur lors de la migration: {str(e)}")
        raise
