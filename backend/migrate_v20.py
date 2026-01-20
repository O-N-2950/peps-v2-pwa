import json
import secrets
import requests
from datetime import datetime
from werkzeug.security import generate_password_hash
import os

RC_API_KEY = os.getenv('REVENUECAT_API_KEY')

def get_rc_expiry(app_user_id):
    """Récupère l'expiration via RevenueCat"""
    if not RC_API_KEY: return None
    try:
        url = f"https://api.revenuecat.com/v1/subscribers/{app_user_id}"
        headers = {"Authorization": f"Bearer {RC_API_KEY}", "Content-Type": "application/json"}
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            ent = res.json().get('subscriber', {}).get('entitlements', {})
            active = ent.get('premium') or ent.get('30 Business member')
            if active and active.get('expires_date'):
                return datetime.fromisoformat(active['expires_date'].replace('Z', '+00:00'))
    except Exception as e:
        print(f"⚠️ Erreur RC: {e}")
    return None

def run_migration_logic():
    from app import app, db
    from models import User, Partner, Offer, ActivitySector, Member
    
    print("🚀 Démarrage Migration V20...")
    log = []
    
    with app.app_context():
        # 1. PARTENAIRES (JSON)
        try:
            with open('partners_data.json', 'r') as f:
                partners_data = json.load(f)
            
            count_p = 0
            for p in partners_data:
                email = p.get('companyEmail')
                if not email or User.query.filter_by(email=email).first(): continue
                
                pwd = secrets.token_urlsafe(8)
                u = User(email=email, password_hash=generate_password_hash(pwd), role='partner')
                db.session.add(u); db.session.flush()
                
                partner = Partner(
                    user_id=u.id,
                    name=p.get('companyName', 'Inconnu'),
                    category=p.get('activitySector', 'Autre'),
                    phone=p.get('companyPhoneNumber'),
                    website=p.get('companyWebsite'),
                    contact_name=p.get('companyContactFullName'),
                    latitude=46.8182, longitude=8.2275, # Centre Suisse (Placeholder)
                    image_url="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=500"
                )
                db.session.add(partner); db.session.flush()
                db.session.add(Offer(partner_id=partner.id, title="Bienvenue", offer_type='permanent', active=False))
                
                log.append(f"Partner: {email} / {pwd}")
                count_p += 1
            
            db.session.commit()
            print(f"✅ {count_p} Partenaires migrés.")
        except Exception as e: 
            print(f"⚠️ Erreur migration partenaires: {e}")

        # 2. MEMBRES (RevenueCat Simulation si pas de JSON)
        # Ici on supposerait un fichier members_data.json exporté de Firestore
        # Pour l'exemple, on ne fait rien sans fichier source
        
    return {"status": "success", "log": log}

if __name__ == "__main__":
    run_migration_logic()
