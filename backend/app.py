import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from sqlalchemy import text
from google import genai 
from models import db, User, Partner, Offer, Pack, Company

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

# CONFIGURATION
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'peps_secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'peps_jwt_secret')
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"): database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# CLIENT IA GOOGLE (V2)
ai_client = None
if os.getenv('GOOGLE_API_KEY'):
    try:
        ai_client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))
    except Exception as e:
        print(f"Erreur IA: {e}")

# --- ☢️ ROUTE NUCLÉAIRE (POUR DÉBLOQUER RAILWAY) ---
@app.route('/api/nuke_db')
def nuke_db():
    try:
        # On force la suppression du schéma public pour contourner les erreurs SQLAlchemy
        with db.engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            conn.commit()
        
        # On recrée les tables proprement
        db.create_all()
        return jsonify({"status": "SUCCESS", "message": "Base de données RASÉE et RECRÉÉE. Prêt pour setup_v2."})
    except Exception as e:
        return jsonify({"status": "ERROR", "error": str(e)}), 500

# --- SETUP V2 (COMPTES DÉMO & PACKS) ---
@app.route('/api/setup_v2')
def setup_v2():
    db.create_all()
    created = []

    # 1. Packs Entreprise
    if not Pack.query.first():
        db.session.add(Pack(name="Starter", credits=50, price=99.0))
        db.session.add(Pack(name="Pro", credits=200, price=299.0))
        db.session.add(Pack(name="Enterprise", credits=1000, price=999.0))
        created.append("Packs")

    # 2. Utilisateurs de Démo
    demos = [
        ('admin@peps.swiss', 'admin123', 'super_admin'),
        ('partner@peps.swiss', 'partner123', 'partner'),
        ('company@peps.swiss', 'company123', 'company_admin'),
        ('member@peps.swiss', 'member123', 'member')
    ]

    for email, pwd, role in demos:
        if not User.query.filter_by(email=email).first():
            u = User(email=email, password_hash=generate_password_hash(pwd), role=role)
            db.session.add(u)
            db.session.commit() # Commit pour avoir l'ID
            created.append(f"User: {role}")
            
            # Création Profils Liés
            if role == 'partner':
                p = Partner(user_id=u.id, name="Sushi Démo", distance="200m", category="Restaurant", image_url="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500")
                db.session.add(p)
            elif role == 'company_admin':
                c = Company(name="TechCorp SA", credits_balance=100)
                db.session.add(c)
                db.session.commit()
                u.company_id = c.id

    db.session.commit()
    return jsonify({"status": "SUCCESS", "created": created})

# --- IA GENERATION ---
@app.route('/api/ai/generate', methods=['POST'])
@jwt_required()
def generate_ai():
    if not ai_client: return jsonify({'text': "⚠️ API Key manquante"})
    context = request.json.get('context', '')
    try:
        # Nouvelle syntaxe google-genai 0.3.0
        resp = ai_client.models.generate_content(
            model='gemini-1.5-flash', 
            contents=f"Expert marketing. Description courte (15 mots), urgente, emojis pour : '{context}'."
        )
        return jsonify({'text': resp.text.strip()})
    except Exception as e:
        return jsonify({'text': f"🔥 Offre exclusive : {context} !"})

# --- ROUTES MÉTIER ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u = User.query.filter_by(email=data['email']).first()
    if u and check_password_hash(u.password_hash, data['password']):
        return jsonify({'token': create_access_token(identity={'id': u.id, 'role': u.role}), 'role': u.role})
    return jsonify({'error': 'Login failed'}), 401

@app.route('/api/offers')
def get_offers():
    # Protection si la table est vide ou pas encore créée
    try:
        offers = Offer.query.filter(Offer.stock > 0).order_by(Offer.is_urgent.desc()).all()
        return jsonify([{
            "id": o.id, "partner": o.partner.name, "title": o.title, "description": o.description,
            "price": o.price, "old": o.old_price, "discount": o.discount, "stock": o.stock,
            "urgent": o.is_urgent, "img": o.partner.image_url, "dist": o.partner.distance
        } for o in offers])
    except: return jsonify([])

@app.route('/api/reserve/<int:id>', methods=['POST'])
def reserve(id):
    o = Offer.query.get(id)
    if o.stock > 0:
        o.stock -= 1
        db.session.commit()
        socketio.emit('stock_update', {'id': o.id, 'new_stock': o.stock})
        return jsonify({'success': True})
    return jsonify({'error': 'Stock épuisé'}), 400

@app.route('/api/partner/create-offer', methods=['POST'])
@jwt_required()
def create_offer():
    data = request.json
    uid = get_jwt_identity()['id']
    user = User.query.get(uid)
    partner = user.partner_profile if user.partner_profile else Partner.query.first()
    
    if not partner: return jsonify(error="Profil introuvable"), 404

    offer = Offer(partner_id=partner.id, title=data['title'], description=data.get('description'), price=data['price'], old_price=data['old_price'], discount=data['discount'], stock=int(data['stock']), is_urgent=True)
    db.session.add(offer)
    db.session.commit()
    socketio.emit('stock_update', {'id': offer.id, 'new_stock': offer.stock})
    return jsonify({'success': True})

@app.route('/api/company/info')
@jwt_required()
def company_info():
    user = User.query.get(get_jwt_identity()['id'])
    if not user.company_id: return jsonify(error="No company"), 404
    comp = Company.query.get(user.company_id)
    return jsonify({'name': comp.name, 'credits': comp.credits_balance})

@app.route('/api/company/buy-pack', methods=['POST'])
@jwt_required()
def buy_pack():
    user = User.query.get(get_jwt_identity()['id'])
    comp = Company.query.get(user.company_id)
    pack = Pack.query.get(request.json['pack_id'])
    comp.credits_balance += pack.credits
    db.session.commit()
    return jsonify({'success': True, 'new_balance': comp.credits_balance})

@app.route('/api/packs')
def get_packs():
    try: return jsonify([{'id': p.id, 'name': p.name, 'credits': p.credits, 'price': p.price} for p in Pack.query.all()])
    except: return jsonify([])

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
