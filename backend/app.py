import os
import sys
import google.generativeai as genai
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Partner, Offer, User

# DEBUG LOG AU DÉMARRAGE (Pour vérifier dans Railway)
print("🔥 GUNICORN DÉMARRE FLASK...", file=sys.stdout)

# CORRECTION : On retire static_url_path='/' pour éviter les conflits de routage
app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'peps_secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'peps_jwt_super_secret')

# Config DB
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps_dev.db')
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Config Google AI
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialisation automatique de la base de données au démarrage
with app.app_context():
    print("🔧 Création des tables PostgreSQL...", file=sys.stdout)
    db.create_all()
    print("✅ Tables créées avec succès !", file=sys.stdout)

# --- ROUTE SETUP ---
@app.route('/api/setup')
def setup_db():
    print("🛠️ ACCÈS SETUP ROUTE", file=sys.stdout)
    try:
        db.create_all()
        details = []
        if not User.query.filter_by(email="admin@peps.swiss").first():
            admin = User(email="admin@peps.swiss", password_hash=generate_password_hash("admin123"), role="admin")
            db.session.add(admin)
            details.append("✅ Admin créé")
        else: details.append("ℹ️ Admin existe")

        if not Partner.query.first():
            p1 = Partner(name="Sushi Palace", distance="250m", image_url="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500")
            db.session.add(p1)
            db.session.commit()
            o1 = Offer(partner_id=p1.id, title="Offre Test", description="Test", price="20.-", old_price="40.-", discount="-50%", stock=5)
            db.session.add(o1)
            details.append("✅ Données démo")
        
        db.session.commit()
        return jsonify({"status": "SUCCESS", "details": details})
    except Exception as e:
        return jsonify({"status": "ERROR", "error": str(e)}), 500

# --- ROUTES API ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
        return jsonify({'token': token, 'role': user.role})
    return jsonify({'error': 'Login failed'}), 401

@app.route('/api/offers')
def get_offers():
    try:
        offers = Offer.query.filter(Offer.stock > 0).order_by(Offer.is_urgent.desc()).all()
        return jsonify([{ "id": o.id, "partner": o.partner.name, "title": o.title, "stock": o.stock } for o in offers])
    except: return jsonify([])

@app.route('/api/ai/generate', methods=['POST'])
@jwt_required()
def generate_ai_text():
    if not GOOGLE_API_KEY: return jsonify({'text': "⚠️ Configurer API Key"})
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(f"Offre commerciale courte: {request.json.get('context')}")
        return jsonify({'text': response.text})
    except Exception as e: return jsonify({'text': f"Erreur IA: {str(e)}"})

@app.route('/api/admin/offers', methods=['POST'])
@jwt_required()
def create_offer():
    data = request.json
    partner = Partner.query.first()
    if not partner: return jsonify({'error': 'No partner'}), 400
    new_offer = Offer(partner_id=partner.id, title=data['title'], description=data.get('description', ''), price=data['price'], old_price=data['old_price'], discount=data['discount'], stock=int(data['stock']))
    db.session.add(new_offer)
    db.session.commit()
    socketio.emit('stock_update', {'id': new_offer.id, 'new_stock': new_offer.stock})
    return jsonify({'success': True})

@app.route('/api/reserve/<int:offer_id>', methods=['POST'])
def reserve(offer_id):
    offer = Offer.query.get_or_404(offer_id)
    if offer.stock > 0:
        offer.stock -= 1
        db.session.commit()
        socketio.emit('stock_update', {'id': offer.id, 'new_stock': offer.stock})
        return jsonify({"success": True})
    return jsonify({"success": False}), 400

# --- SERVING FRONTEND (SMART 404) ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Si c'est un fichier statique existant (JS/CSS)
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # Sinon on renvoie index.html (SPA)
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    # Si l'URL commence par /api, c'est une erreur Backend -> JSON
    if request.path.startswith('/api/'):
        return jsonify({"error": "API Route Not Found"}), 404
    # Sinon -> Frontend
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
# Updated at Wed Dec 17 17:15:02 EST 2025
