"""
Helper pour gérer les verrous de migration et éviter les deadlocks PostgreSQL.

Ce module fournit un décorateur pour garantir qu'une seule migration s'exécute à la fois,
évitant ainsi les conflits de verrouillage (deadlocks) lors de l'insertion simultanée
dans les mêmes tables.
"""

import functools
import logging
from sqlalchemy import text

logger = logging.getLogger(__name__)

def with_migration_lock(migration_name):
    """
    Décorateur pour exécuter une migration avec un verrou PostgreSQL advisory lock.
    
    Args:
        migration_name: Nom de la migration (utilisé pour générer un ID de verrou unique)
    
    Usage:
        @with_migration_lock("V25_user_roles")
        def run_user_roles_migration():
            # Code de migration
            pass
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            from app import db
            
            # Générer un ID de verrou unique basé sur le nom de la migration
            # PostgreSQL advisory locks utilisent des entiers 64-bit
            lock_id = hash(migration_name) % (2**31)  # Limiter à 32-bit pour compatibilité
            
            try:
                # Acquérir le verrou (bloque jusqu'à ce que le verrou soit disponible)
                logger.info(f"🔒 Tentative d'acquisition du verrou pour migration {migration_name} (lock_id={lock_id})...")
                db.session.execute(text(f"SELECT pg_advisory_lock({lock_id})"))
                logger.info(f"✅ Verrou acquis pour migration {migration_name}")
                
                # Exécuter la migration
                result = func(*args, **kwargs)
                
                return result
                
            except Exception as e:
                logger.error(f"❌ Erreur lors de la migration {migration_name}: {e}")
                raise
                
            finally:
                # Libérer le verrou
                try:
                    db.session.execute(text(f"SELECT pg_advisory_unlock({lock_id})"))
                    logger.info(f"🔓 Verrou libéré pour migration {migration_name}")
                except Exception as e:
                    logger.warning(f"⚠️  Impossible de libérer le verrou pour {migration_name}: {e}")
        
        return wrapper
    return decorator
