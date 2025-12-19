import os
import random
import string
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
from google import genai
from models import db, User, Partner, Offer, Pack, Company, Referral, PartnerFeedback, UserDevice

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'peps_secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'peps_jwt')
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"): database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- ☢️ RESET DB ---
@app.route('/api/nuke_db')
def nuke_db():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            conn.commit()
        db.create_all()
        return jsonify({"status": "SUCCESS", "msg": "Base V4 Clean (Avec Sécurité)"})
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- SETUP V4 (27 PACKS) ---
@app.route('/api/setup_v4')
def setup_v4():
    try:
        db.create_all()
        logs = []
        if not Pack.query.first():
            # LISTE COMPLÈTE DES 27 PACKS
            packs_data = [
                # B2C
                ("Solo 1 an", "Individual", 1, 49),
                ("Couple 1 an", "Family", 2, 89),
                ("Famille (4) 1 an", "Family", 4, 159),
                ("Famille XL (6) 1 an", "Family", 6, 229),
                # PME
                ("TPE 3", "Business", 3, 135), ("TPE 5", "Business", 5, 220), 
                ("TPE 10", "Business", 10, 390), ("TPE 15", "Business", 15, 580),
                ("PME 20", "Business", 20, 750), ("PME 25", "Business", 25, 890),
                ("PME 30", "Business", 30, 1050), ("PME 40", "Business", 40, 1350),
                ("PME 50", "Business", 50, 1590), ("PME 60", "Business", 60, 1890),
                ("PME 75", "Business", 75, 2290), ("PME 100", "Business", 100, 2900),
                # CORPORATE
                ("Corp 150", "Business", 150, 4200), ("Corp 200", "Business", 200, 5400),
                ("Corp 250", "Business", 250, 6500), ("Corp 300", "Business", 300, 7500),
                ("Corp 400", "Business", 400, 9600), ("Corp 500", "Business", 500, 11500),
                ("Corp 750", "Business", 750, 16500), ("Corp 1000", "Business", 1000, 21000),
                ("Corp 1500", "Business", 1500, 30000), ("Corp 2000", "Business", 2000, 38000),
                ("Unlimited", "Business", 9999, 50000)
            ]
            for name, cat, acc, price in packs_data:
                db.session.add(Pack(name=name, category=cat, access_count=acc, price_chf=price, price_eur=price))
            logs.append("✅ 27 Packs injectés")

        # Démos
        if not User.query.filter_by(email='company@peps.swiss').first():
            c = Company(name="TechCorp SA", access_total=10, access_used=0)
            db.session.add(c)
            db.session.commit()
            u = User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id)
            db.session.add(u)
            logs.append("✅ Compte Entreprise créé")

        db.session.commit()
        return jsonify({"status": "SUCCESS", "logs": logs})
    except Exception as e: return jsonify({"status": "ERROR", "error": str(e)}), 500

# --- SÉCURITÉ : LOGIN AVEC CHECK DEVICE ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u = User.query.filter_by(email=data.get('email')).first()
    device_id = data.get('device_id', 'unknown')

    if u and check_password_hash(u.password_hash, data.get('password')):
        # SÉCURITÉ ANTI-PARTAGE (Seulement Membres)
        if u.role == 'member':
            # Cherche si l'appareil est déjà connu
            known = UserDevice.query.filter_by(user_id=u.id, device_fingerprint=device_id).first()
            if not known:
                count = UserDevice.query.filter_by(user_id=u.id).count()
                if count >= 2: # LIMITE 2 APPAREILS
                    return jsonify({'error': '⛔ Trop d\'appareils connectés (Max 2). Contactez le support.'}), 403
                
                # Ajout nouvel appareil
                db.session.add(UserDevice(user_id=u.id, device_fingerprint=device_id))
                db.session.commit()
            else:
                known.last_login = datetime.utcnow()
                db.session.commit()

        token = create_access_token(identity={'id': u.id, 'role': u.role})
        return jsonify({'token': token, 'role': u.role})
    return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

# --- GESTION ÉQUIPE / FAMILLE ---
@app.route('/api/company/add-member', methods=['POST'])
@jwt_required()
def add_team_member():
    current_uid = get_jwt_identity()['id']
    admin = User.query.get(current_uid)
    if not admin.company_id: return jsonify(error="Accès refusé"), 403
    
    company = Company.query.get(admin.company_id)
    if company.access_used >= company.access_total:
        return jsonify(error="Plus de places disponibles !"), 402

    data = request.json
    email = data.get('email')
    if User.query.filter_by(email=email).first(): return jsonify(error="Email déjà utilisé"), 400
        
    pwd = "welcome123"
    new_user = User(email=email, password_hash=generate_password_hash(pwd), role='member', company_id=company.id)
    new_user.access_expires_at = datetime.utcnow() + timedelta(days=365)
    
    company.access_used += 1
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"success": True, "msg": f"Compte créé ! MDP: {pwd}"})

@app.route('/api/company/info', methods=['GET'])
@jwt_required()
def company_info():
    uid = get_jwt_identity()['id']
    u = User.query.get(uid)
    if not u.company_id: return jsonify({}), 404
    c = Company.query.get(u.company_id)
    members = [{"email": m.email, "joined": m.created_at.strftime("%Y-%m-%d")} for m in c.employees if m.id != u.id]
    return jsonify({"name": c.name, "total": c.access_total, "used": c.access_used, "members": members})

# --- REGISTER & SYSTEM ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data['email']).first(): return jsonify(error="Email pris"), 400
    u = User(email=data['email'], password_hash=generate_password_hash(data['password']), role='member')
    db.session.add(u)
    db.session.commit()
    return jsonify(success=True, token=create_access_token(identity={'id': u.id, 'role': 'member'}), role='member')

@app.route('/api/offers')
def get_offers():
    offers = Offer.query.filter_by(active=True).all()
    return jsonify([{ "id": o.id, "title": o.title, "partner": o.partner.name if o.partner else "PEP's", "type": "PERMANENT" if o.is_permanent else "FLASH", "stock": o.stock, "discount": o.discount_val, "img": o.partner.image_url if o.partner else "" } for o in offers])

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
