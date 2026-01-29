"""
Migration V26: Créer automatiquement des comptes utilisateurs pour les partenaires sans user_id
Objectif: Tous les partenaires doivent avoir un compte pour apparaître partout (carte + liste + dashboard)
"""
from sqlalchemy import text
from models import db
from werkzeug.security import generate_password_hash
import logging
import secrets
from utils.migration_lock import with_migration_lock

logger = logging.getLogger(__name__)

@with_migration_lock("V26_create_missing_users")
def run_create_missing_users_migration():
    """Crée automatiquement des comptes utilisateurs pour les partenaires sans user_id"""
    try:
        logger.info("🚀 Migration V26: Création des comptes utilisateurs manquants")
        
        # 1. Identifier les partenaires sans user_id
        check_query = text("""
            SELECT id, name, phone, website
            FROM partners
            WHERE user_id IS NULL
            ORDER BY id;
        """)
        result = db.session.execute(check_query)
        partners_without_user = result.fetchall()
        
        if not partners_without_user:
            logger.info("✅ Tous les partenaires ont déjà un user_id")
            return
        
        logger.info(f"📊 {len(partners_without_user)} partenaires sans user_id trouvés")
        
        # 2. Créer un compte utilisateur pour chaque partenaire
        created_count = 0
        for partner in partners_without_user:
            partner_id, name, phone, website = partner
            
            # Générer un email (toujours, car la table partners n'a pas de colonne email)
            contact_email = None
            if not contact_email:
                # Utiliser le nom du commerce pour générer un email
                safe_name = name.lower().replace(' ', '_').replace("'", '').replace('"', '')[:30]
                contact_email = f"{safe_name}@peps-partner-temp.ch"
            
            # Vérifier si l'email existe déjà
            check_email_query = text("""
                SELECT id FROM users WHERE email = :email;
            """)
            existing_user = db.session.execute(check_email_query, {'email': contact_email}).fetchone()
            
            if existing_user:
                # Lier le partenaire à l'utilisateur existant
                user_id = existing_user[0]
                update_partner_query = text("""
                    UPDATE partners SET user_id = :user_id WHERE id = :partner_id;
                """)
                db.session.execute(update_partner_query, {
                    'user_id': user_id,
                    'partner_id': partner_id
                })
                logger.info(f"✅ Partenaire #{partner_id} ({name}) lié à l'utilisateur existant #{user_id}")
                created_count += 1
            else:
                # Créer un nouveau compte utilisateur
                # Générer un mot de passe temporaire sécurisé
                temp_password = secrets.token_urlsafe(16)
                hashed_password = generate_password_hash(temp_password)
                
                # Insérer l'utilisateur
                insert_user_query = text("""
                    INSERT INTO users (email, password_hash, created_at)
                    VALUES (:email, :password_hash, CURRENT_TIMESTAMP)
                    RETURNING id;
                """)
                result = db.session.execute(insert_user_query, {
                    'email': contact_email,
                    'password_hash': hashed_password
                })
                user_id = result.fetchone()[0]
                
                # Lier le partenaire à l'utilisateur
                update_partner_query = text("""
                    UPDATE partners SET user_id = :user_id WHERE id = :partner_id;
                """)
                db.session.execute(update_partner_query, {
                    'user_id': user_id,
                    'partner_id': partner_id
                })
                
                # Ajouter le rôle 'partner' dans user_roles
                insert_role_query = text("""
                    INSERT INTO user_roles (user_id, role)
                    VALUES (:user_id, 'partner')
                    ON CONFLICT (user_id, role) DO NOTHING;
                """)
                db.session.execute(insert_role_query, {'user_id': user_id})
                
                logger.info(f"✅ Compte créé pour partenaire #{partner_id} ({name}) - Email: {contact_email}")
                created_count += 1
        
        db.session.commit()
        logger.info(f"✅ Migration V26 terminée: {created_count} comptes créés/liés")
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Erreur lors de la migration V26: {e}")
        raise
