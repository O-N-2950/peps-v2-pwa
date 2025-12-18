import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# NOUVELLE LIBRAIRIE IA
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

# CLIENT IA (Nouveau SDK)
ai_client = None
if os.getenv('GOOGLE_API_KEY'):
    ai_client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))

# --- SÉCURITÉ : DÉCORATEUR DE RÔLE ---
def role_required(allowed_roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt_identity()
            if claims['role'] not in allowed_roles and claims['role'] != 'super_admin':
                return jsonify(msg="⛔ Accès interdit : Rôle insuffisant"), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# --- ROUTE IA (MIGRÉE V1) ---
@app.route('/api/ai/generate', methods=['POST'])
@role_required(['partner', 'super_admin'])
def generate_ai_text():
    if not ai_client: return jsonify({'text': "⚠️ Clé API manquante."})
    data = request.json
    context = data.get('context', '')
    
    try:
        # NOUVELLE SYNTAXE 2025
        response = ai_client.models.generate_content(
            model='gemini-1.5-flash',
            contents=f"Expert marketing restaurant. Rédige une description courte (20 mots max), urgente avec emojis pour : '{context}'. Pas de guillemets."
        )
        return jsonify({'text': response.text.strip()})
    except Exception as e:
        print(f"Erreur IA: {e}")
        return jsonify({'text': f"🔥 {context} à saisir vite !"})

# --- ROUTE PACKS (ENTREPRISE) ---
@app.route('/api/company/buy-pack', methods=['POST'])
@role_required(['company_admin'])
def buy_pack():
    current_user_id = get_jwt_identity()['id']
    user = User.query.get(current_user_id)
    if not user.company_id: return jsonify(error="Pas d'entreprise liée"), 400
    
    company = Company.query.get(user.company_id)
    pack_id = request.json.get('pack_id')
    pack = Pack.query.get_or_404(pack_id)
    
    # Simulation Paiement
    company.credits_balance += pack.credits
    db.session.commit()
    
    return jsonify({"success": True, "new_balance": company.credits_balance})

# --- AUTH & SETUP ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        token = create_access_token(identity={'id': user.id, 'role': user.role})
        return jsonify({'token': token, 'role': user.role})
    return jsonify({'error': 'Login failed'}), 401

@app.route('/api/setup_v2')
def setup():
    db.create_all()
    # Création Admin
    if not User.query.filter_by(role='super_admin').first():
        admin = User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='super_admin')
        db.session.add(admin)
    # Création Packs
    if not Pack.query.first():
        db.session.add(Pack(name="Start", credits=10, price=99.0))
        db.session.add(Pack(name="Pro", credits=50, price=399.0))
    db.session.commit()
    return jsonify({"status": "DB Updated (Admin + Packs)"})

# --- SERVING FRONTEND ---
@app.route('/api/offers')
def get_offers():
    offers = Offer.query.filter(Offer.stock > 0).order_by(Offer.is_urgent.desc()).all()
    return jsonify([{
        "id": o.id, "partner": o.partner.name, "title": o.title, "description": o.description,
        "price": o.price, "old": o.old_price, "discount": o.discount, "stock": o.stock,
        "urgent": o.is_urgent, "img": o.partner.image_url, "dist": o.partner.distance
    } for o in offers])

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
