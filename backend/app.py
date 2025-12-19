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

# CONFIG
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'peps_secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'peps_jwt')
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"): database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# IA GOOGLE
ai_client = None
if os.getenv('GOOGLE_API_KEY'):
    try: ai_client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))
    except: pass

# --- ☢️ ROUTE NUCLÉAIRE (POUR DÉBLOQUER LA BASE) ---
@app.route('/api/nuke_db')
def nuke_db():
    try:
        # Force la suppression brutale du schéma pour éviter les erreurs de migration
        with db.engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            conn.commit()
        db.create_all()
        return jsonify({"status": "SUCCESS", "msg": "Base de données entièrement nettoyée. Lancez setup_v3."})
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- SETUP V3 (LES 27 PACKS + DÉMO) ---
@app.route('/api/setup_v3')
def setup_v3():
    db.create_all()
    logs = []
    
    # 1. Injection des Packs (Option C - SQL)
    if not Pack.query.first():
        # Liste simplifiée (l'admin pourra ajouter les autres)
        packs_data = [
            ("Individuel", 1, 49), ("Famille", 5, 199), ("PME 10", 10, 390), 
            ("PME 50", 50, 1590), ("Corporate 100", 100, 3185), ("Corp 1000", 1000, 29400)
        ]
        for name, acc, price in packs_data:
            db.session.add(Pack(name=name, access_count=acc, price_chf=price, price_eur=price))
        logs.append("✅ Packs tarifaires créés")

    # 2. Utilisateurs Démo
    demos = [('admin@peps.swiss', 'super_admin'), ('partner@peps.swiss', 'partner'), ('member@peps.swiss', 'member')]
    for email, role in demos:
        if not User.query.filter_by(email=email).first():
            u = User(email=email, password_hash=generate_password_hash('123456'), role=role)
            u.referral_code = f"PEPS-{role.upper()}-DEMO"
            db.session.add(u)
            db.session.commit()
            
            # Partenaire Mario (Avec Offre Permanente ET Flash)
            if role == 'partner':
                p = Partner(user_id=u.id, name="Chez Mario", category="Restaurant", distance="300m", image_url="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500")
                db.session.add(p)
                db.session.commit()
                
                # Offre Permanente (Socle)
                perm = Offer(partner_id=p.id, title="-20% sur la carte", description="Valable midi et soir", is_permanent=True, discount_val="-20%")
                
                # Offre Flash (Opportunité)
                flash = Offer(partner_id=p.id, title="2 Tables Dispo Ce Soir", description="Remplissage", is_flash=True, stock=2, price="Carte", discount_val="-50%")
                
                db.session.add_all([perm, flash])
                logs.append("✅ Partenaire Mario créé (Permanent + Flash)")

    db.session.commit()
    return jsonify({"status": "SUCCESS", "logs": logs})

# --- IA CONSULTANT (Analyse Privilège) ---
@app.route('/api/ai/analyze-privilege', methods=['POST'])
@jwt_required()
def analyze_privilege():
    if not ai_client: return jsonify(error="IA non dispo"), 503
    data = request.json
    prompt = f"""
    Tu es consultant expert pour {data['category']}.
    Privilège actuel: "{data['current_offer']}".
    Critique ce privilège (est-il assez fort ?) et propose 3 alternatives chiffrées.
    """
    try:
        resp = ai_client.models.generate_content(model='gemini-1.5-flash', contents=prompt)
        return jsonify({"analysis": resp.text})
    except Exception as e: return jsonify(error=str(e)), 500

# --- ROUTES DE BASE ---
@app.route('/api/offers')
def get_offers():
    # On renvoie tout (le frontend filtrera Permanent/Flash)
    offers = Offer.query.filter_by(active=True).all()
    return jsonify([{
        "id": o.id, "title": o.title, "partner": o.partner.name, 
        "type": "PERMANENT" if o.is_permanent else "FLASH",
        "stock": o.stock, "discount": o.discount_val, "img": o.partner.image_url
    } for o in offers])

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u = User.query.filter_by(email=data['email']).first()
    if u and check_password_hash(u.password_hash, data['password']):
        return jsonify({'token': create_access_token(identity={'id': u.id, 'role': u.role}), 'role': u.role})
    return jsonify({'error': 'Login failed'}), 401

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
