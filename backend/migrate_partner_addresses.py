"""
Migration pour créer la table partner_addresses
"""
import os
from sqlalchemy import create_engine, text

def run_migration():
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        print("⚠️  DATABASE_URL non définie, migration ignorée")
        return
    
    # Remplacer postgres:// par postgresql:// pour SQLAlchemy
    database_url = database_url.replace("postgres://", "postgresql://")
    
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Vérifier si la table existe déjà
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'partner_addresses'
            );
        """))
        
        table_exists = result.scalar()
        
        if table_exists:
            print("✅ Table partner_addresses existe déjà")
            return
        
        # Créer la table partner_addresses
        conn.execute(text("""
            CREATE TABLE partner_addresses (
                id SERIAL PRIMARY KEY,
                partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
                street VARCHAR(200) NOT NULL,
                number VARCHAR(20),
                postal_code VARCHAR(20) NOT NULL,
                city VARCHAR(100) NOT NULL,
                canton VARCHAR(50),
                country VARCHAR(2) NOT NULL DEFAULT 'CH',
                latitude FLOAT,
                longitude FLOAT,
                is_primary BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Créer les index
        conn.execute(text("""
            CREATE INDEX idx_partner_addresses_partner_id ON partner_addresses(partner_id);
            CREATE INDEX idx_partner_addresses_city ON partner_addresses(city);
            CREATE INDEX idx_partner_addresses_latitude ON partner_addresses(latitude);
            CREATE INDEX idx_partner_addresses_longitude ON partner_addresses(longitude);
        """))
        
        conn.commit()
        
        print("✅ Table partner_addresses créée avec succès")
        print("✅ Index créés avec succès")

if __name__ == '__main__':
    run_migration()
