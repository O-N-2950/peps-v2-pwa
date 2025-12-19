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

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'peps_secret_v5')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'peps_jwt_v5')
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"): database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# CLIENT IA
ai_client = None
if os.getenv('GOOGLE_API_KEY'):
    try: ai_client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))
    except: pass

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
        return jsonify({"status": "SUCCESS", "msg": "Base V5 Clean"})
    except Exception as e: return jsonify({"error": str(e)}), 500

# --- 💰 SETUP V5 : LES 27 PACKS (VRAIS PRIX) ---
@app.route('/api/setup_v5')
def setup_v5():
    try:
        db.create_all()
        logs = []
        
        # 1. Injection des 27 Packs OFFICIELS
        if not Pack.query.first():
            packs_data = [
                # B2C Individual/Family (1-9 accès)
                ("Solo 1 an", "Individual", 1, 49),
                ("Couple 1 an", "Family", 2, 89),
                ("Famille 3", "Family", 3, 129),
                ("Famille 4", "Family", 4, 164),
                ("Famille 5", "Family", 5, 199),
                ("Famille 6", "Family", 6, 245),
                ("Famille 7", "Family", 7, 289),
                ("Famille 8", "Family", 8, 330),
                ("Famille 9", "Family", 9, 360),
                
                # Business PME (10-100 accès)
                ("PME 10", "Business", 10, 390),
                ("PME 15", "Business", 15, 550),
                ("PME 20", "Business", 20, 700),
                ("PME 25", "Business", 25, 850),
                ("PME 30", "Business", 30, 1000),
                ("PME 40", "Business", 40, 1274),
                ("PME 50", "Business", 50, 1590),
                ("PME 75", "Business", 75, 2390),
                ("PME 100", "Business", 100, 3185),
                
                # Corporate (150-5000 accès)
                ("Corp 150", "Business", 150, 4410),
                ("Corp 200", "Business", 200, 5880),
                ("Corp 300", "Business", 300, 8820),
                ("Corp 400", "Business", 400, 11760),
                ("Corp 500", "Business", 500, 14700),
                ("Corp 750", "Business", 750, 22050),
                ("Corp 1000", "Business", 1000, 29400),
                ("Corp 2500", "Business", 2500, 61250),
                ("Corp 5000", "Business", 5000, 110250)
            ]
            
            for name, cat, acc, price in packs_data:
                db.session.add(Pack(name=name, category=cat, access_count=acc, price_chf=price, price_eur=price))
            logs.append("✅ 27 Packs Officiels injectés")

        # 2. Comptes Démo
        if not User.query.filter_by(email='company@peps.swiss').first():
            c = Company(name="TechSuisse SA", access_total=0, access_used=0)
            db.session.add(c)
            db.session.commit()
            u_comp = User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id)
            db.session.add(u_comp)
            
            u_part = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner')
            db.session.add(u_part)
            db.session.commit()
            p = Partner(user_id=u_part.id, name="Chez Mario", category="Restaurant", distance="200m", image_url="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500")
            db.session.add(p)
            logs.append("✅ Comptes Démos créés")

        db.session.commit()
        return jsonify({"status": "SUCCESS", "logs": logs})
    except Exception as e: return jsonify({"status": "ERROR", "error": str(e)}), 500

# --- SÉCURITÉ : LOGIN + DEVICE CHECK ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u = User.query.filter_by(email=data.get('email')).first()
    # Récupération ID appareil
    dev_id = data.get('device_id', 'unknown')
    
    if u and check_password_hash(u.password_hash, data.get('password')):
        if u.role == 'member':
            known = UserDevice.query.filter_by(user_id=u.id, device_fingerprint=dev_id).first()
            if not known:
                count = UserDevice.query.filter_by(user_id=u.id).count()
                if count >= 2: return jsonify({'error': '⛔ Max 2 appareils autorisés par compte.'}), 403
                db.session.add(UserDevice(user_id=u.id, device_fingerprint=dev_id))
                db.session.commit()
        
        return jsonify({'token': create_access_token(identity={'id': u.id, 'role': u.role}), 'role': u.role})
    return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

# --- ROUTES ENTREPRISE ---
@app.route('/api/company/info')
@jwt_required()
def company_info():
    u = User.query.get(get_jwt_identity()['id'])
    if not u.company_id: return jsonify(error="No company"), 404
    c = Company.query.get(u.company_id)
    members = [{"email": m.email, "joined": m.created_at.strftime("%Y-%m-%d")} for m in c.employees if m.id != u.id]
    return jsonify({"name": c.name, "credits": c.access_total - c.access_used, "total": c.access_total, "used": c.access_used, "members": members})

@app.route('/api/company/add-member', methods=['POST'])
@jwt_required()
def add_team_member():
    u = User.query.get(get_jwt_identity()['id'])
    c = Company.query.get(u.company_id)
    if c.access_used >= c.access_total: return jsonify(error="Quota atteint. Achetez un pack !"), 402
    
    email = request.json.get('email')
    if User.query.filter_by(email=email).first(): return jsonify(error="Email déjà pris"), 400
    
    new_u = User(email=email, password_hash=generate_password_hash("welcome123"), role='member', company_id=c.id)
    c.access_used += 1
    db.session.add(new_u)
    db.session.commit()
    return jsonify({"success": True, "msg": "Compte créé"})

@app.route('/api/company/buy-pack', methods=['POST'])
@jwt_required()
def buy_pack():
    u = User.query.get(get_jwt_identity()['id'])
    c = Company.query.get(u.company_id)
    pack = Pack.query.get(request.json['pack_id'])
    c.access_total += pack.access_count
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/packs')
def get_packs():
    packs = Pack.query.all()
    return jsonify([{'id': p.id, 'name': p.name, 'cat': p.category, 'credits': p.access_count, 'price': p.price_chf} for p in packs])

# --- ROUTES PARTENAIRE (Permanent vs Flash) ---
@app.route('/api/partner/create-offer', methods=['POST'])
@jwt_required()
def create_offer():
    uid = get_jwt_identity()['id']
    u = User.query.get(uid)
    p = u.partner_profile
    if not p: return jsonify(error="Pas partenaire"), 403
    
    d = request.json
    is_flash = d.get('is_flash', True)
    
    o = Offer(
        partner_id=p.id, title=d['title'], description=d.get('description'),
        price=d['price'], old_price=d.get('old_price'), discount_val=d.get('discount'),
        is_flash=is_flash, is_permanent=not is_flash,
        stock=int(d.get('stock', 5)) if is_flash else None, active=True
    )
    db.session.add(o)
    db.session.commit()
    socketio.emit('stock_update', {'id': o.id, 'action': 'create'})
    return jsonify({"success": True})

@app.route('/api/ai/generate', methods=['POST'])
@jwt_required()
def generate_ai():
    if not ai_client: return jsonify({'text': "⚠️ API Key manquante"}), 200
    try:
        resp = ai_client.models.generate_content(model='gemini-1.5-flash', contents=f"Marketing expert. Short urgent description (15 words) with emojis for: '{request.json.get('context')}'. No quotes.")
        return jsonify({'text': resp.text.strip()})
    except: return jsonify({'text': "🔥 Offre exclusive à saisir !"})

# --- PUBLIC & OFFERS ---
@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if User.query.filter_by(email=d['email']).first(): return jsonify(error="Email pris"), 400
    u = User(email=d['email'], password_hash=generate_password_hash(d['password']), role='member')
    db.session.add(u)
    db.session.commit()
    return jsonify(success=True, token=create_access_token(identity={'id': u.id, 'role': 'member'}), role='member')

@app.route('/api/offers')
def get_offers():
    offers = Offer.query.filter_by(active=True).all()
    return jsonify([{ "id": o.id, "title": o.title, "partner": o.partner.name if o.partner else "PEP's", "type": "FLASH" if o.is_flash else "PERMANENT", "stock": o.stock, "discount": o.discount_val, "img": o.partner.image_url if o.partner else "" } for o in offers])

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
