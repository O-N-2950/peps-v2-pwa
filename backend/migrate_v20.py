import json
import os
import secrets
from werkzeug.security import generate_password_hash
from app import app, db
from models import User, Partner, Offer, ActivitySector

def run_migration_logic():
    print("🚀 Démarrage Migration V20 (Firebase JSON)...")
    report = {"added": 0, "skipped": 0, "errors": []}
    
    # Le fichier doit être à la racine du dossier backend sur Railway
    json_path = 'partners_data.json'
    
    if not os.path.exists(json_path):
        return {"status": "error", "msg": f"Fichier {json_path} introuvable"}

    with app.app_context():
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            for p_data in data:
                email = p_data.get('companyEmail')
                
                # 1. Éviter les doublons
                if not email or User.query.filter_by(email=email).first():
                    report["skipped"] += 1
                    continue

                # 2. Gestion Secteur (Création dynamique)
                sector_name = p_data.get('activitySector', 'Autre')
                sector = ActivitySector.query.filter_by(name=sector_name).first()
                if not sector:
                    sector = ActivitySector(name=sector_name)
                    db.session.add(sector)
                    db.session.flush() # Récupérer ID

                # 3. Création User (Partenaire)
                temp_pass = secrets.token_urlsafe(10) # MDP robuste temporaire
                user = User(
                    email=email,
                    password_hash=generate_password_hash(temp_pass),
                    role='partner',
                    is_both=False,
                    country='CH' # Défaut
                )
                db.session.add(user)
                db.session.flush() # Récupérer ID

                # 4. Création Profil Partner
                # Mapping intelligent des coordonnées (supporte latitude ou _latitude)
                coords = p_data.get('coordinates', {})
                lat = coords.get('latitude') or coords.get('_latitude') or 46.8182
                lng = coords.get('longitude') or coords.get('_longitude') or 8.2275

                partner = Partner(
                    user_id=user.id,
                    name=p_data.get('companyName', 'Sans nom'),
                    category=sector_name,
                    sector_id=sector.id,
                    phone=p_data.get('companyPhoneNumber'),
                    website=p_data.get('companyWebsite'),
                    contact_name=p_data.get('companyContactFullName'),
                    city=p_data.get('city', 'Suisse'),
                    latitude=float(lat),
                    longitude=float(lng),
                    # Image par défaut si manquante
                    image_url=p_data.get('companyLogoUrl') or "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=500"
                )
                db.session.add(partner)
                db.session.flush()

                # 5. Offre de Bienvenue (Inactif par défaut)
                offer = Offer(
                    partner_id=partner.id,
                    title="Offre de Bienvenue",
                    description="À configurer depuis votre espace partenaire.",
                    offer_type="permanent",
                    is_permanent=True,
                    active=False, 
                    discount_val="-10%"
                )
                db.session.add(offer)
                
                # Log console pour récupération manuelle si besoin
                # print(f"✅ Créé: {email} | Pass: {temp_pass}")
                report["added"] += 1

            db.session.commit()
            return {"status": "success", "report": report}

        except Exception as e:
            db.session.rollback()
            return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    # Permet de lancer le script en ligne de commande
    print(run_migration_logic())
