"""
Migration V22: Ajouter les colonnes manquantes à la table members
- referral_code
- referred_by
- firestore_id
"""

from sqlalchemy import text
from app import db

def run_members_columns_migration():
    print("🚀 Migration V22: Colonnes members (referral_code, referred_by, firestore_id)")
    
    try:
        # Liste des colonnes à ajouter
        columns_to_add = [
            {
                'name': 'referral_code',
                'definition': 'VARCHAR(20) UNIQUE'
            },
            {
                'name': 'referred_by',
                'definition': 'INTEGER REFERENCES members(id)'
            },
            {
                'name': 'firestore_id',
                'definition': 'VARCHAR(100)'
            }
        ]
        
        for column in columns_to_add:
            # Vérifier si la colonne existe déjà
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'members' 
                AND column_name = :col_name
            """)
            
            result = db.session.execute(check_query, {'col_name': column['name']})
            exists = result.scalar()
            
            if not exists:
                print(f"📊 Ajout de la colonne {column['name']}...")
                alter_query = text(f"""
                    ALTER TABLE members 
                    ADD COLUMN {column['name']} {column['definition']}
                """)
                db.session.execute(alter_query)
                db.session.commit()
                print(f"✅ Colonne {column['name']} ajoutée")
            else:
                print(f"⏭️  Colonne {column['name']} existe déjà")
        
        # Créer un index sur firestore_id si nécessaire
        index_check = text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'members' 
            AND indexname = 'ix_members_firestore_id'
        """)
        
        result = db.session.execute(index_check)
        index_exists = result.scalar()
        
        if not index_exists:
            print("📊 Création de l'index sur firestore_id...")
            db.session.execute(text("""
                CREATE INDEX ix_members_firestore_id ON members(firestore_id)
            """))
            db.session.commit()
            print("✅ Index créé")
        else:
            print("⏭️  Index existe déjà")
        
        print("✅ Migration V22 terminée")
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration V22: {str(e)}")
        db.session.rollback()
        raise
