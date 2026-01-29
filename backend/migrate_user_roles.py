"""
Migration V24: Système de rôles multiples
Crée la table user_roles et migre les rôles existants
"""
from sqlalchemy import text
from models import db
import logging

logger = logging.getLogger(__name__)

def run_user_roles_migration():
    """Migre le système de rôles vers user_roles"""
    try:
        logger.info("🚀 Migration V24: Système de rôles multiples")
        
        # 1. Créer la table user_roles si elle n'existe pas
        create_table_query = text("""
            CREATE TABLE IF NOT EXISTS user_roles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(50) NOT NULL CHECK (role IN ('member', 'partner', 'admin')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, role)
            );
        """)
        db.session.execute(create_table_query)
        logger.info("✅ Table user_roles créée")
        
        # 2. Créer les index pour les performances
        create_indexes_query = text("""
            CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
        """)
        db.session.execute(create_indexes_query)
        logger.info("✅ Index créés")
        
        # 3. Migrer les rôles existants depuis users.role
        # Vérifier si la colonne role existe encore dans users
        check_column_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'role';
        """)
        result = db.session.execute(check_column_query)
        has_role_column = result.fetchone() is not None
        
        if has_role_column:
            # Migrer les rôles existants
            migrate_roles_query = text("""
                INSERT INTO user_roles (user_id, role)
                SELECT id, role 
                FROM users 
                WHERE role IS NOT NULL 
                AND role != ''
                ON CONFLICT (user_id, role) DO NOTHING;
            """)
            db.session.execute(migrate_roles_query)
            logger.info("✅ Rôles existants migrés")
        
        # 4. Ajouter les rôles basés sur les profils existants
        # Si un utilisateur a un profil Member, ajouter le rôle 'member'
        add_member_roles_query = text("""
            INSERT INTO user_roles (user_id, role)
            SELECT DISTINCT m.user_id, 'member'
            FROM members m
            WHERE NOT EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.user_id = m.user_id AND ur.role = 'member'
            )
            ON CONFLICT (user_id, role) DO NOTHING;
        """)
        db.session.execute(add_member_roles_query)
        logger.info("✅ Rôles 'member' ajoutés depuis la table members")
        
        # Si un utilisateur a un profil Partner, ajouter le rôle 'partner'
        # IMPORTANT: Ignorer les partenaires sans user_id (user_id IS NULL)
        add_partner_roles_query = text("""
            INSERT INTO user_roles (user_id, role)
            SELECT DISTINCT p.user_id, 'partner'
            FROM partners p
            WHERE p.user_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.user_id = p.user_id AND ur.role = 'partner'
            )
            ON CONFLICT (user_id, role) DO NOTHING;
        """)
        db.session.execute(add_partner_roles_query)
        logger.info("✅ Rôles 'partner' ajoutés depuis la table partners")
        
        db.session.commit()
        logger.info("✅ Migration V24 terminée avec succès")
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Erreur lors de la migration V24: {e}")
        raise
