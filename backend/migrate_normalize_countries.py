"""
Migration: Normalisation des codes pays
Convertit tous les codes pays en format ISO 2 lettres (CH, FR, BE)
"""

from sqlalchemy import text
from models import db

def normalize_countries():
    """
    Normalise tous les codes pays en format ISO 2 lettres
    """
    print("\n" + "="*80)
    print("🌍 NORMALISATION DES CODES PAYS")
    print("="*80 + "\n")
    
    # Mapping de normalisation
    mappings = [
        # Suisse
        ("UPDATE partners SET address_country = 'CH' WHERE address_country IN ('CHE', 'SWITZERLAND', 'SUISSE', 'SCHWEIZ', 'SVIZZERA')", "Suisse"),
        
        # France
        ("UPDATE partners SET address_country = 'FR' WHERE address_country IN ('FRA', 'FRANCE', 'FRANKREICH')", "France"),
        
        # Belgique
        ("UPDATE partners SET address_country = 'BE' WHERE address_country IN ('BEL', 'BELGIUM', 'BELGIQUE', 'BELGIË', 'BELGIEN')", "Belgique"),
    ]
    
    total_updated = 0
    
    for query, country_name in mappings:
        result = db.session.execute(text(query))
        count = result.rowcount
        total_updated += count
        if count > 0:
            print(f"  ✅ {country_name}: {count} partenaires normalisés")
    
    db.session.commit()
    
    print(f"\n  📊 Total: {total_updated} partenaires mis à jour")
    print("\n" + "="*80 + "\n")
    
    return total_updated

if __name__ == '__main__':
    from app import app
    with app.app_context():
        normalize_countries()
