"""
Migration automatique V20 Admin
Exécuté automatiquement au démarrage de l'application
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, ProgrammingError

def run_migration():
    """
    Applique la migration V20 Admin sur la base de données
    Utilise IF NOT EXISTS pour éviter les erreurs si déjà appliquée
    """
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("⚠️  DATABASE_URL non définie, migration ignorée")
        return False
    
    # Fix pour Railway (postgres:// -> postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    try:
        engine = create_engine(database_url)
        with engine.connect() as conn:
            print("🔄 Début de la migration V20 Admin...")
            
            # 1. Ajouter colonnes à la table partners
            migrations = [
                # Adresse complète
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_street VARCHAR(200)",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_number VARCHAR(20)",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(20)",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_city VARCHAR(100)",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS address_country VARCHAR(2) DEFAULT 'CH'",
                
                # Contact
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS website VARCHAR(200)",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS opening_hours TEXT",
                
                # Gestion et statut
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS warnings_count INTEGER DEFAULT 0",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS suspension_reason TEXT",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS admin_notes TEXT",
                
                # Validation
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'draft'",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS validated_by INTEGER REFERENCES users(id)",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP",
                
                # Timestamps
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE partners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                
                # Index pour performance
                "CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status)",
                "CREATE INDEX IF NOT EXISTS idx_partners_validation_status ON partners(validation_status)",
                
                # 2. Ajouter colonnes à la table offers
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS description TEXT",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS conditions TEXT",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS max_uses_per_member INTEGER",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                
                # 3. Créer table partner_feedbacks
                """
                CREATE TABLE IF NOT EXISTS partner_feedbacks (
                    id SERIAL PRIMARY KEY,
                    member_id INTEGER REFERENCES members(id),
                    partner_id INTEGER REFERENCES partners(id),
                    offer_id INTEGER REFERENCES offers(id),
                    rating INTEGER,
                    experience_type VARCHAR(50),
                    comment TEXT,
                    admin_viewed BOOLEAN DEFAULT FALSE,
                    admin_action_taken VARCHAR(50),
                    admin_notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_feedbacks_member ON partner_feedbacks(member_id)",
                "CREATE INDEX IF NOT EXISTS idx_feedbacks_partner ON partner_feedbacks(partner_id)",
                "CREATE INDEX IF NOT EXISTS idx_feedbacks_admin_viewed ON partner_feedbacks(admin_viewed)",
                "CREATE INDEX IF NOT EXISTS idx_feedbacks_experience_type ON partner_feedbacks(experience_type)",
                "CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON partner_feedbacks(created_at)",
                
                # 4. Créer table partner_warnings
                """
                CREATE TABLE IF NOT EXISTS partner_warnings (
                    id SERIAL PRIMARY KEY,
                    partner_id INTEGER REFERENCES partners(id),
                    admin_id INTEGER REFERENCES users(id),
                    warning_type VARCHAR(50),
                    severity VARCHAR(20),
                    reason TEXT,
                    action_taken VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_warnings_partner ON partner_warnings(partner_id)",
                "CREATE INDEX IF NOT EXISTS idx_warnings_type ON partner_warnings(warning_type)",
                "CREATE INDEX IF NOT EXISTS idx_warnings_created_at ON partner_warnings(created_at)",
                
                # 5. Créer table notifications
                """
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    admin_id INTEGER REFERENCES users(id),
                    target_type VARCHAR(20),
                    target_role VARCHAR(20),
                    target_category VARCHAR(50),
                    target_city VARCHAR(100),
                    target_user_id INTEGER REFERENCES users(id),
                    title VARCHAR(200),
                    message TEXT,
                    action_url VARCHAR(500),
                    scheduled_for TIMESTAMP,
                    sent_at TIMESTAMP,
                    recipients_count INTEGER DEFAULT 0,
                    read_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON notifications(target_type)",
                "CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role)",
                "CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at)",
                
                # 6. Créer table notification_receipts
                """
                CREATE TABLE IF NOT EXISTS notification_receipts (
                    id SERIAL PRIMARY KEY,
                    notification_id INTEGER REFERENCES notifications(id),
                    user_id INTEGER REFERENCES users(id),
                    read_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_receipts_notification ON notification_receipts(notification_id)",
                "CREATE INDEX IF NOT EXISTS idx_receipts_user ON notification_receipts(user_id)",
                
                # 7. Mettre à jour table referrals (déjà existante mais vide)
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referrer_id INTEGER REFERENCES users(id)",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_id INTEGER REFERENCES users(id)",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referrer_type VARCHAR(20)",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_email VARCHAR(120)",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward_type VARCHAR(50)",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward_applied BOOLEAN DEFAULT FALSE",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS pack_category VARCHAR(50)",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS access_count INTEGER",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP",
                
                "CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id)",
                "CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id)",
                "CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code)",
                "CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)",
                "CREATE INDEX IF NOT EXISTS idx_referrals_type ON referrals(referrer_type)",
                "CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at)",
            ]
            
            # Exécuter toutes les migrations
            for i, migration in enumerate(migrations, 1):
                try:
                    conn.execute(text(migration))
                    conn.commit()
                except (OperationalError, ProgrammingError) as e:
                    # Ignorer les erreurs "column already exists" ou "relation already exists"
                    if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                        pass
                    else:
                        print(f"⚠️  Erreur migration #{i}: {e}")
            
            print("✅ Migration V20 Admin terminée avec succès !")
            return True
            
    except Exception as e:
        print(f"❌ Erreur lors de la migration V20: {e}")
        return False

if __name__ == "__main__":
    run_migration()
