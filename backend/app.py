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

# ========== ROUTES API ==========

@app.route('/api/setup', methods=['GET'])
def setup_db():
    """Initialise la DB avec un admin et des données démo"""
    admin = User.query.filter_by(email='admin@peps.swiss').first()
    if admin:
        return jsonify({'status': 'SUCCESS', 'details': ['ℹ️ Admin existe']})
    
    # Créer admin
    admin = User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin')
    db.session.add(admin)
    
    # Créer partenaire démo
    partner = Partner(name='Café Central', address='Rue de Nidau 24, Bienne', category='Restaurant')
    db.session.add(partner)
    db.session.commit()
    
    # Créer offre démo
    offer = Offer(
        partner_id=partner.id,
        title='Menu Midi',
        description='Plat + Dessert + Café',
        old_price='32.-',
        price='16.-',
        discount='-50%',
        stock=10
    )
    db.session.add(offer)
    db.session.commit()
    
    return jsonify({'status': 'SUCCESS', 'details': ['✅ Admin créé', '✅ Données démo']})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
        return jsonify({'token': token, 'role': user.role})
    return jsonify({'error': 'Identifiants invalides'}), 401

@app.route('/api/ai/generate', methods=['POST'])
@jwt_required()
def generate_ai_text():
    if not GOOGLE_API_KEY:
        return jsonify({'text': "⚠️ Clé API Google manquante."})
    
    # LE NOM EXACT DU MODÈLE ACTUEL
    model_name = 'gemini-1.5-flash'
    
    data = request.json
    offer_context = data.get('context', 'Offre spéciale')
    sector = data.get('sector', 'restaurant')  # Secteur d'activité du partenaire
    
    try:
        model = genai.GenerativeModel(model_name)
        
        # Prompt optimisé pour la rapidité (20 mots)
        prompt = (
            f"Tu es un expert marketing {sector}. Rédige une description courte (max 20 mots), "
            f"urgente et attractive avec des emojis pour cette offre : '{offer_context}'. "
            f"Ne mets pas de guillemets."
        )
        
        # Generation
        response = model.generate_content(prompt)
        return jsonify({'text': response.text.strip()})
        
    except Exception as e:
        print(f"Erreur IA: {str(e)}")
        # Fallback si l'IA échoue
        return jsonify({'text': f"🔥 Offre exclusive : {offer_context} à ne pas manquer ! ⏳"})

@app.route('/api/offers', methods=['GET'])
def get_offers():
    offers = Offer.query.filter(Offer.stock > 0).all()
    return jsonify([{
        'id': o.id,
        'title': o.title,
        'description': o.description,
        'original_price': o.old_price,
        'flash_price': o.price,
        'discount_percent': o.discount,
        'stock': o.stock,
        'partner': {'name': o.partner.name, 'address': o.partner.address}
    } for o in offers])

@app.route('/api/offers', methods=['POST'])
@jwt_required()
def create_offer():
    data = request.json
    partner = Partner.query.first()
    if not partner:
        return jsonify({'error': 'Aucun partenaire trouvé'}), 400
    
    offer = Offer(
        partner_id=partner.id,
        title=data['title'],
        description=data['description'],
        old_price=data.get('original_price', '0.-'),
        price=data.get('flash_price', '0.-'),
        discount=data.get('discount_percent', '-0%'),
        stock=int(data.get('stock', 5))
    )
    db.session.add(offer)
    db.session.commit()
    
    # Notifier tous les clients via Socket.io
    socketio.emit('new_offer', {
        'id': offer.id,
        'title': offer.title,
        'description': offer.description,
        'flash_price': offer.price,
        'stock': offer.stock
    })
    
    return jsonify({'success': True, 'offer_id': offer.id})

@app.route('/api/offers/<int:offer_id>/reserve', methods=['POST'])
def reserve_offer(offer_id):
    offer = Offer.query.get_or_404(offer_id)
    if offer.stock <= 0:
        return jsonify({'error': 'Stock épuisé'}), 400
    
    offer.stock -= 1
    db.session.commit()
    
    # Notifier tous les clients du nouveau stock
    socketio.emit('stock_update', {'offer_id': offer.id, 'stock': offer.stock})
    
    return jsonify({'success': True, 'remaining_stock': offer.stock})

# ========== ROUTES FRONTEND ==========

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080, debug=True)
