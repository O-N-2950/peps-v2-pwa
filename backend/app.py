import os
import random
import string
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
from google import genai
from models import db, User, Partner, Offer, Pack, Company, Referral, PartnerFeedback

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

# CONFIGURATION
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'peps_secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'peps_jwt')
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"): database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# UTILITAIRES
def generate_referral_code(name):
    clean_name = ''.join(e for e in name if e.isalnum()).upper()[:5]
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"PEPS-{clean_name}-{suffix}"

# --- ☢️ ROUTE NUCLÉAIRE ---
@app.route('/api/nuke_db')
def nuke_db():
    try:
        # Nettoyage brutal et efficace
        with db.engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            conn.commit()
        db.create_all()
        return jsonify({"status": "SUCCESS", "msg": "Base propre (V3.1 - String 50)"})
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- SETUP V3 CORRIGÉ (Bug Fix) ---
@app.route('/api/setup_v3')
def setup_v3():
    try:
        db.create_all()
        logs = []
        
        # 1. Packs
        if not Pack.query.first():
            packs_data = [("Individuel", 1, 49), ("Famille", 5, 199), ("PME 10", 10, 390), ("Corporate 100", 100, 3185)]
            for name, acc, price in packs_data:
                db.session.add(Pack(name=name, access_count=acc, price_chf=price, price_eur=price))
            logs.append("✅ Packs créés")

        # 2. Utilisateurs Démo
        demos = [('admin@peps.swiss', 'super_admin'), ('partner@peps.swiss', 'partner'), ('member@peps.swiss', 'member')]
        for email, role in demos:
            if not User.query.filter_by(email=email).first():
                u = User(email=email, password_hash=generate_password_hash('123456'), role=role)
                # CORRECTION : La colonne referral_code accepte maintenant 50 caractères
                u.referral_code = f"PEPS-{role.upper()}-DEMO" 
                db.session.add(u)
                db.session.commit()
                
                if role == 'partner':
                    p = Partner(user_id=u.id, name="Chez Mario", category="Restaurant", distance="300m", image_url="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500")
                    db.session.add(p)
                    db.session.commit()
                    # Offres
                    db.session.add(Offer(partner_id=p.id, title="-20% sur la carte", is_permanent=True, discount_val="-20%"))
                    db.session.add(Offer(partner_id=p.id, title="2 Tables Dispo", is_flash=True, stock=2, price="Carte", discount_val="-50%"))
                    logs.append("✅ Mario + Offres créés")

        db.session.commit()
        return jsonify({"status": "SUCCESS", "logs": logs})
    except Exception as e:
        db.session.rollback() # Annulation en cas d'erreur
        return jsonify({"status": "ERROR", "error": str(e)}), 500

# --- NOUVEAU : INSCRIPTION + PARRAINAGE ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'member')
    ref_code = data.get('referral_code')

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email déjà utilisé"}), 400

    new_user = User(
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
        referral_code=generate_referral_code(email.split('@')[0])
    )

    # LOGIQUE PARRAINAGE
    bonus_msg = ""
    # Durée standard = 12 mois (365 jours)
    expiration = datetime.utcnow() + timedelta(days=365)
    
    if ref_code:
        referrer = User.query.filter_by(referral_code=ref_code).first()
        if referrer:
            # 1. Le nouvel inscrit gagne 1 mois (13 mois total)
            expiration += timedelta(days=30)
            
            # 2. Le parrain gagne 1 mois
            if referrer.access_expires_at:
                referrer.access_expires_at += timedelta(days=30)
            else:
                referrer.access_expires_at = datetime.utcnow() + timedelta(days=30)
            
            referrer.bonus_months_earned += 1
            
            # 3. Enregistrement
            db.session.add(Referral(referrer_id=referrer.id, referred_id=None, status='pending'))
            new_user.referred_by = ref_code
            bonus_msg = "🎁 Code parrain valide ! +1 mois offert."

    new_user.access_expires_at = expiration
    db.session.add(new_user)
    db.session.commit() # Commit pour avoir l'ID

    # Mise à jour du lien de parrainage
    if ref_code and referrer:
        ref_record = Referral.query.filter_by(referrer_id=referrer.id, status='pending').order_by(Referral.id.desc()).first()
        if ref_record:
            ref_record.referred_id = new_user.id
            ref_record.status = 'completed'
            db.session.commit()

    token = create_access_token(identity={'id': new_user.id, 'role': new_user.role})
    return jsonify({
        "success": True, 
        "token": token, 
        "role": new_user.role, 
        "message": f"Compte créé. {bonus_msg}"
    })

# --- LOGIN & ROUTES ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u = User.query.filter_by(email=data.get('email')).first()
    if u and check_password_hash(u.password_hash, data.get('password')):
        return jsonify({'token': create_access_token(identity={'id': u.id, 'role': u.role}), 'role': u.role})
    return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

@app.route('/api/offers')
def get_offers():
    offers = Offer.query.filter_by(active=True).all()
    return jsonify([{
        "id": o.id, "title": o.title, "partner": o.partner.name, 
        "type": "PERMANENT" if o.is_permanent else "FLASH",
        "stock": o.stock, "discount": o.discount_val, "img": o.partner.image_url
    } for o in offers])

# --- SERVE FRONTEND ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
