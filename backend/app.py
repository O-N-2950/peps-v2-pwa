import os
import google.generativeai as genai
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Partner, Offer, User

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'peps_secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'peps_jwt_super_secret')

# Config DB
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps_dev.db')
if database_url.startswith("postgres://"):
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

# --- ROUTE MAGIQUE D'INSTALLATION (SOLVES EMPTY DB PROBLEM) ---
@app.route('/api/setup')
def setup_db():
    try:
        # 1. Création des tables physiques
        db.create_all()
        
        details = []

        # 2. Création Admin
        if not User.query.filter_by(email="admin@peps.swiss").first():
            admin = User(email="admin@peps.swiss", password_hash=generate_password_hash("admin123"), role="admin")
            db.session.add(admin)
            details.append("✅ Admin créé (admin@peps.swiss)")
        else:
            details.append("ℹ️ Admin existe déjà")

        # 3. Création Données Démo (Si pas de partenaires)
        if not Partner.query.first():
            p1 = Partner(name="Sushi Palace", distance="250m", image_url="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500")
            db.session.add(p1)
            db.session.commit() # Commit pour avoir l'ID
            
            o1 = Offer(partner_id=p1.id, title="Offre Démo Setup", description="Ceci est une offre générée par le setup.", price="20.-", old_price="40.-", discount="-50%", stock=10)
            db.session.add(o1)
            details.append("✅ Données démo créées")
        else:
            details.append("ℹ️ Données démo existent déjà")

        db.session.commit()
        return jsonify({
            "status": "SUCCESS", 
            "details": details,
            "action": "Allez maintenant sur /login"
        })
    except Exception as e:
        return jsonify({"status": "ERROR", "error": str(e)}), 500

# --- ROUTES AUTH ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        token = create_access_token(identity={'id': user.id, 'role': user.role})
        return jsonify({'token': token, 'role': user.role})
    return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

# --- ROUTES AI ---
@app.route('/api/ai/generate', methods=['POST'])
@jwt_required()
def generate_ai_text():
    if not GOOGLE_API_KEY:
        return jsonify({'text': "⚠️ Clé API Google manquante dans Railway."})
    
    data = request.json
    prompt = f"Rédige une description courte (max 20 mots), punchy et vendeuse pour une offre PEP's : {data.get('context')}. Utilise des emojis."
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return jsonify({'text': response.text})
    except Exception as e:
        return jsonify({'text': "Erreur IA: " + str(e)})

# --- ROUTES ADMIN ---
@app.route('/api/admin/offers', methods=['POST'])
@jwt_required()
def create_offer():
    data = request.json
    partner = Partner.query.first() 
    if not partner:
        partner = Partner(name="Mon Commerce", distance="0m", image_url="")
        db.session.add(partner)
        db.session.commit()
        
    new_offer = Offer(
        partner_id=partner.id,
        title=data['title'],
        description=data.get('description', ''),
        price=data['price'],
        old_price=data['old_price'],
        discount=data['discount'],
        stock=int(data['stock']),
        is_urgent=False
    )
    db.session.add(new_offer)
    db.session.commit()
    socketio.emit('stock_update', {'id': new_offer.id, 'new_stock': new_offer.stock})
    return jsonify({'success': True})

@app.route('/api/offers')
def get_offers():
    # Protection si la table n'existe pas encore
    try:
        offers = Offer.query.filter(Offer.stock > 0).order_by(Offer.is_urgent.desc()).all()
        return jsonify([{
            "id": o.id, "partner": o.partner.name, "title": o.title,
            "description": o.description, "price": o.price, "old": o.old_price, 
            "dist": o.partner.distance, "img": o.partner.image_url, 
            "urgent": o.is_urgent, "discount": o.discount, "stock": o.stock
        } for o in offers])
    except:
        return jsonify([])

@app.route('/api/reserve/<int:offer_id>', methods=['POST'])
def reserve(offer_id):
    offer = Offer.query.get_or_404(offer_id)
    if offer.stock > 0:
        offer.stock -= 1
        db.session.commit()
        socketio.emit('stock_update', {'id': offer.id, 'new_stock': offer.stock})
        return jsonify({"success": True, "remaining": offer.stock})
    return jsonify({"success": False, "message": "Stock épuisé"}), 400

# --- FRONTEND ROUTES (DOIT ÊTRE APRÈS LES /api) ---
@app.route('/')
def serve():
    try: return send_from_directory(app.static_folder, 'index.html')
    except: return jsonify({"status": "Backend Only"})

@app.errorhandler(404)
def not_found(e):
    try: return send_from_directory(app.static_folder, 'index.html')
    except: return jsonify({"error": "404"})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
