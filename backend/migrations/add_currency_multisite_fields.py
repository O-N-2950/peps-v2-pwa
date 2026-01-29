"""
Migration pour ajouter les champs devise et multi-sites
SANS perdre les données existantes
"""

from models import db
from sqlalchemy import text
import os

def run_migration():
    """
    Migration safe - Ajoute seulement les nouvelles colonnes
    """
    
    print("🚀 Démarrage migration PEP's V2...")
    print("=" * 60)
    
    # Liste des modifications à apporter
    migrations = []
    
    # ==========================================
    # TABLE: users (ajouter country pour devise)
    # ==========================================
    migrations.append({
        'table': 'users',
        'checks': [
            {
                'column': 'country',
                'sql': """
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS country VARCHAR(2);
                """,
                'description': 'Ajout colonne country (pour détection devise)'
            },
            {
                'column': 'city',
                'sql': """
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS city VARCHAR(100);
                """,
                'description': 'Ajout colonne city'
            }
        ]
    })
    
    # ==========================================
    # TABLE: partners (multi-sites)
    # ==========================================
    migrations.append({
        'table': 'partners',
        'checks': [
            {
                'column': 'account_type',
                'sql': """
                    ALTER TABLE partners 
                    ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'single';
                """,
                'description': 'Ajout colonne account_type (single/multi-site)'
            },
            {
                'column': 'main_country',
                'sql': """
                    ALTER TABLE partners 
                    ADD COLUMN IF NOT EXISTS main_country VARCHAR(2);
                """,
                'description': 'Ajout colonne main_country'
            },
            {
                'column': 'main_lat',
                'sql': """
                    ALTER TABLE partners 
                    ADD COLUMN IF NOT EXISTS main_lat FLOAT;
                """,
                'description': 'Ajout colonne main_lat (géolocalisation)'
            },
            {
                'column': 'main_lng',
                'sql': """
                    ALTER TABLE partners 
                    ADD COLUMN IF NOT EXISTS main_lng FLOAT;
                """,
                'description': 'Ajout colonne main_lng (géolocalisation)'
            }
        ]
    })
    
    # ==========================================
    # TABLE: subscriptions (devise)
    # ==========================================
    migrations.append({
        'table': 'subscriptions',
        'checks': [
            {
                'column': 'currency',
                'sql': """
                    ALTER TABLE subscriptions 
                    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'CHF';
                """,
                'description': 'Ajout colonne currency (CHF/EUR)'
            },
            {
                'column': 'subscription_type',
                'sql': """
                    ALTER TABLE subscriptions 
                    ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) DEFAULT 'individual';
                """,
                'description': 'Ajout colonne subscription_type'
            },
            {
                'column': 'max_members',
                'sql': """
                    ALTER TABLE subscriptions 
                    ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 1;
                """,
                'description': 'Ajout colonne max_members'
            }
        ]
    })
    
    # ==========================================
    # NOUVELLE TABLE: partner_sites
    # ==========================================
    migrations.append({
        'table': 'partner_sites',
        'checks': [
            {
                'column': None,  # Table entière
                'sql': """
                    CREATE TABLE IF NOT EXISTS partner_sites (
                        id SERIAL PRIMARY KEY,
                        partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
                        site_name VARCHAR(200),
                        address VARCHAR(500),
                        city VARCHAR(100),
                        country VARCHAR(2),
                        lat FLOAT,
                        lng FLOAT,
                        verified BOOLEAN DEFAULT FALSE,
                        verification_document VARCHAR(500),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """,
                'description': 'Création table partner_sites (multi-sites)'
            }
        ]
    })
    
    # ==========================================
    # NOUVELLE TABLE: subscription_members
    # ==========================================
    migrations.append({
        'table': 'subscription_members',
        'checks': [
            {
                'column': None,  # Table entière
                'sql': """
                    CREATE TABLE IF NOT EXISTS subscription_members (
                        id SERIAL PRIMARY KEY,
                        subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
                        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                        invited_email VARCHAR(120),
                        invitation_token VARCHAR(200) UNIQUE,
                        invitation_sent_at TIMESTAMP,
                        invitation_accepted_at TIMESTAMP,
                        member_name VARCHAR(200),
                        member_role VARCHAR(100),
                        department VARCHAR(100),
                        notes TEXT,
                        status VARCHAR(20) DEFAULT 'pending',
                        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        activated_at TIMESTAMP,
                        removed_at TIMESTAMP
                    );
                """,
                'description': 'Création table subscription_members (multi-accès)'
            }
        ]
    })
    
    # ==========================================
    # EXÉCUTION DES MIGRATIONS
    # ==========================================
    
    success_count = 0
    error_count = 0
    
    for migration in migrations:
        table_name = migration['table']
        print(f"\n📊 Table: {table_name}")
        print("-" * 60)
        
        for check in migration['checks']:
            desc = check['description']
            sql = check['sql']
            
            try:
                # Exécuter SQL
                db.session.execute(text(sql))
                db.session.commit()
                
                print(f"  ✅ {desc}")
                success_count += 1
                
            except Exception as e:
                db.session.rollback()
                
                # Si erreur "column already exists", c'est OK
                if "already exists" in str(e).lower():
                    print(f"  ℹ️  {desc} (déjà existant)")
                else:
                    print(f"  ❌ {desc}")
                    print(f"     Erreur: {e}")
                    error_count += 1
    
    # ==========================================
    # MISE À JOUR DES DONNÉES EXISTANTES
    # ==========================================
    
    print("\n" + "=" * 60)
    print("📝 Mise à jour des données existantes...")
    print("-" * 60)
    
    try:
        # Mettre CHF par défaut pour abonnements existants
        db.session.execute(text("""
            UPDATE subscriptions 
            SET currency = 'CHF' 
            WHERE currency IS NULL;
        """))
        
        # Mettre account_type = 'single' pour partenaires existants
        db.session.execute(text("""
            UPDATE partners 
            SET account_type = 'single' 
            WHERE account_type IS NULL;
        """))
        
        # Mettre max_members = 1 pour abonnements existants
        db.session.execute(text("""
            UPDATE subscriptions 
            SET max_members = 1 
            WHERE max_members IS NULL OR max_members = 0;
        """))
        
        # Mettre subscription_type selon max_members
        db.session.execute(text("""
            UPDATE subscriptions 
            SET subscription_type = CASE 
                WHEN max_members = 1 THEN 'individual'
                WHEN max_members <= 30 THEN 'family'
                WHEN max_members <= 100 THEN 'small_business'
                WHEN max_members <= 500 THEN 'medium_business'
                ELSE 'large_business'
            END
            WHERE subscription_type IS NULL;
        """))
        
        db.session.commit()
        
        print("  ✅ Données mises à jour avec succès")
        
    except Exception as e:
        db.session.rollback()
        print(f"  ⚠️  Erreur mise à jour données: {e}")
        error_count += 1
    
    # ==========================================
    # CRÉER LES MEMBRES POUR ABONNEMENTS EXISTANTS
    # ==========================================
    
    print("\n" + "=" * 60)
    print("👥 Création membres pour abonnements existants...")
    print("-" * 60)
    
    try:
        # Pour chaque abonnement existant, créer un membre (l'admin)
        db.session.execute(text("""
            INSERT INTO subscription_members (
                subscription_id,
                user_id,
                member_name,
                status,
                added_at,
                activated_at
            )
            SELECT 
                s.id,
                s.admin_user_id,
                CONCAT(u.first_name, ' ', u.last_name, ' (Admin)'),
                'active',
                s.created_at,
                s.created_at
            FROM subscriptions s
            JOIN users u ON u.id = s.admin_user_id
            WHERE NOT EXISTS (
                SELECT 1 FROM subscription_members sm 
                WHERE sm.subscription_id = s.id 
                AND sm.user_id = s.admin_user_id
            );
        """))
        
        db.session.commit()
        
        count_result = db.session.execute(text("""
            SELECT COUNT(*) FROM subscription_members;
        """))
        count = count_result.scalar()
        
        print(f"  ✅ {count} membre(s) créé(s)")
        
    except Exception as e:
        db.session.rollback()
        print(f"  ⚠️  Erreur création membres: {e}")
        error_count += 1
    
    # ==========================================
    # RÉSUMÉ
    # ==========================================
    
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DE LA MIGRATION")
    print("=" * 60)
    print(f"✅ Succès: {success_count}")
    print(f"❌ Erreurs: {error_count}")
    
    if error_count == 0:
        print("\n🎉 Migration terminée avec succès !")
    else:
        print(f"\n⚠️  Migration terminée avec {error_count} erreur(s)")
    
    print("=" * 60)


# ==========================================
# POINT D'ENTRÉE
# ==========================================

if __name__ == "__main__":
    from app import app
    
    with app.app_context():
        run_migration()
