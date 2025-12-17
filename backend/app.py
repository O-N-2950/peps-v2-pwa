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

with app.app_context():
    db.create_all()
    # Création Admin par défaut si inexistant
    if not User.query.filter_by(email="admin@peps.swiss").first():
        admin = User(email="admin@peps.swiss", password_hash=generate_password_hash("admin123"), role="admin")
        db.session.add(admin)
        db.session.commit()
        print("Admin user created: admin@peps.swiss / admin123")

# --- ROUTES AUTH ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        token = create_access_token(identity={'id': user.id, 'role': user.role})
        return jsonify({'token': token, 'role': user.role})
    return jsonify({'error': 'Invalid credentials'}), 401

# --- ROUTES AI ---
@app.route('/api/ai/generate', methods=['POST'])
@jwt_required()
def generate_ai_text():
    if not GOOGLE_API_KEY:
        return jsonify({'text': "⚠️ Clé API Google manquante. Ajoutez GOOGLE_API_KEY dans Railway."})
    
    data = request.json
    prompt = f"Rédige une description courte (max 20 mots), punchy et vendeuse pour une offre PEP's : {data.get('context')}. Utilise des emojis."
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return jsonify({'text': response.text})
    except Exception as e:
        return jsonify({'text': "Erreur IA: " + str(e)})

# --- ROUTES ADMIN ---
@app.route('/api/admin/offers', methods=['POST'])
@jwt_required()
def create_offer():
    data = request.json
    # On assigne arbitrairement au partenaire 1 pour la démo
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
    offers = Offer.query.filter(Offer.stock > 0).order_by(Offer.is_urgent.desc()).all()
    return jsonify([{
        "id": o.id, "partner": o.partner.name, "title": o.title,
        "description": o.description, "price": o.price, "old": o.old_price, 
        "dist": o.partner.distance, "img": o.partner.image_url, 
        "urgent": o.is_urgent, "discount": o.discount, "stock": o.stock
    } for o in offers])

@app.route('/api/reserve/<int:offer_id>', methods=['POST'])
def reserve(offer_id):
    offer = Offer.query.get_or_404(offer_id)
    if offer.stock > 0:
        offer.stock -= 1
        db.session.commit()
        socketio.emit('stock_update', {'id': offer.id, 'new_stock': offer.stock})
        return jsonify({"success": True, "remaining": offer.stock})
    return jsonify({"success": False, "message": "Stock épuisé"}), 400

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
