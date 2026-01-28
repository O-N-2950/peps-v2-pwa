"""
Migration V23: Synchronisation complète du schéma PostgreSQL
Ajoute toutes les colonnes manquantes dans members et subscriptions
"""

from sqlalchemy import text
from app import db

def column_exists(table_name, column_name):
    """Vérifie si une colonne existe dans une table"""
    query = text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = :table_name 
        AND column_name = :column_name
    """)
    result = db.session.execute(query, {'table_name': table_name, 'column_name': column_name})
    return result.scalar() is not None

def run_schema_sync():
    print("🚀 Migration V23: Synchronisation complète du schéma")
    
    try:
        # Définition de toutes les colonnes à ajouter
        columns_to_add = {
            'members': [
                ('referral_code', 'VARCHAR(20) UNIQUE'),
                ('referred_by', 'INTEGER REFERENCES members(id)'),
                ('firestore_id', 'VARCHAR(100)')
            ],
            'subscriptions': [
                ('currency', 'VARCHAR(3) DEFAULT \'CHF\''),
                ('amount_paid', 'NUMERIC(10, 2)')
            ]
        }
        
        # Ajouter les colonnes manquantes
        for table, columns in columns_to_add.items():
            print(f"\n📊 Vérification de la table '{table}'...")
            
            for column_name, column_definition in columns:
                if not column_exists(table, column_name):
                    print(f"  ➕ Ajout de la colonne '{column_name}'...")
                    
                    alter_query = text(f"""
                        ALTER TABLE {table} 
                        ADD COLUMN {column_name} {column_definition}
                    """)
                    
                    db.session.execute(alter_query)
                    db.session.commit()
                    
                    print(f"  ✅ Colonne '{column_name}' ajoutée avec succès")
                else:
                    print(f"  ⏭️  Colonne '{column_name}' existe déjà")
        
        # Créer les index nécessaires
        print(f"\n📊 Vérification des index...")
        
        indexes_to_create = [
            ('ix_members_firestore_id', 'members', 'firestore_id'),
            ('ix_members_referral_code', 'members', 'referral_code')
        ]
        
        for index_name, table_name, column_name in indexes_to_create:
            # Vérifier si l'index existe
            index_check = text("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = :table_name 
                AND indexname = :index_name
            """)
            
            result = db.session.execute(index_check, {
                'table_name': table_name,
                'index_name': index_name
            })
            
            if not result.scalar():
                print(f"  ➕ Création de l'index '{index_name}'...")
                
                create_index = text(f"""
                    CREATE INDEX {index_name} ON {table_name}({column_name})
                """)
                
                db.session.execute(create_index)
                db.session.commit()
                
                print(f"  ✅ Index '{index_name}' créé")
            else:
                print(f"  ⏭️  Index '{index_name}' existe déjà")
        
        print("\n✅ Migration V23 terminée avec succès")
        print("🔧 IMPORTANT : Commentez l'appel à run_schema_sync() dans app.py après vérification")
        
    except Exception as e:
        print(f"\n❌ Erreur lors de la migration V23: {str(e)}")
        db.session.rollback()
        raise
