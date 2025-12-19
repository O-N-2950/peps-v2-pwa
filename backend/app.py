import os
import stripe
import random
import qrcode
import io
import base64
from datetime import datetime, date
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
from apscheduler.schedulers.background import BackgroundScheduler
from models import db, User, Partner, Offer, Pack, Company, Activation
import requests

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

# CONFIG
app.config['SECRET_KEY'] = 'peps_world_v7_final'
app.config['JWT_SECRET_KEY'] = 'peps_world_jwt_final'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"): database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# STRIPE LIVE KEYS (Via Env Vars)
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')
FRONTEND_URL = "https://www.peps.world"

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- 🤖 AUTOMATISATION CRON ---
def maintenance():
    with app.app_context():
        # Désactive les offres Flash épuisées
        Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0).update({Offer.active: False})
        db.session.commit()
scheduler = BackgroundScheduler()
scheduler.add_job(maintenance, 'interval', minutes=30)
scheduler.start()

# --- ☢️ SETUP ---
@app.route('/api/nuke_db')
def nuke():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all(); return "Reset OK"

@app.route('/api/setup_v7')
def setup():
    db.create_all()
    if not Pack.query.first():
        db.session.add(Pack(name="Solo", access_count=1, price_chf=49, price_eur=49))
        db.session.add(Pack(name="TPE 10", access_count=10, price_chf=390, price_eur=390))
    
    if not User.query.filter_by(email='partner@peps.world').first():
        u = User(email='partner@peps.world', password_hash=generate_password_hash('123456'), role='partner')
        db.session.add(u); db.session.commit()
        p = Partner(user_id=u.id, name="Mario's Pizza", category="Restaurant", latitude=47.1368, longitude=7.2468, image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500")
        db.session.add(p); db.session.commit()
        # Offres Démo
        db.session.add(Offer(partner_id=p.id, title="Pizza Offerte", offer_type="flash", stock=5, discount_val="Gratuit"))
        db.session.add(Offer(partner_id=p.id, title="-20% Carte", offer_type="permanent", discount_val="-20%"))
        db.session.add(Offer(partner_id=p.id, title="Menu du Jour", offer_type="daily", day_of_week=datetime.now().weekday(), price="19.-"))
    
    db.session.commit()
    return jsonify(success=True)

# --- 💳 STRIPE COMPLETE FLOW ---
@app.route('/api/company/create-checkout', methods=['POST'])
@jwt_required()
def create_checkout():
    uid = get_jwt_identity()['id']
    user = User.query.get(uid)
    if not user.company_id: return jsonify(error="Pas d'entreprise"), 400
    
    pack = Pack.query.get(request.json['pack_id'])
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{'price_data': {'currency': 'chf', 'product_data': {'name': pack.name}, 'unit_amount': int(pack.price_chf * 100)}, 'quantity': 1}],
            mode='payment',
            client_reference_id=str(user.company_id), # CRITIQUE POUR LE WEBHOOK
            success_url=f"{FRONTEND_URL}/company?success=true",
            cancel_url=f"{FRONTEND_URL}/company?canceled=true",
        )
        return jsonify(url=session.url)
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig = request.headers.get('Stripe-Signature')
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except: return "Error", 400

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        company_id = session.get('client_reference_id')
        amount = session.get('amount_total') # Centimes
        
        # Crédit automatique
        pack = Pack.query.filter_by(price_chf=amount/100).first()
        if pack and company_id:
            with app.app_context():
                c = Company.query.get(company_id)
                if c: 
                    c.access_total += pack.access_count
                    db.session.commit()
                    print(f"💰 Crédits ajoutés à {c.name}")

    return jsonify(success=True)

# --- 🧠 IA CATÉGORISATION ---
@app.route('/api/partner/suggest-category', methods=['POST'])
def suggest_category():
    name = request.json.get('name')
    if not PERPLEXITY_KEY: return jsonify(category="Commerce", icon_slug="default.png")
    try:
        # Analyse intelligente
        r = requests.post("https://api.perplexity.ai/chat/completions", 
            json={"model": "sonar-medium-online", "messages": [{"role": "user", "content": f"Catégorie courte (1 mot: Restaurant, Bar, Sport, Beauté) pour '{name}'?"}]},
            headers={"Authorization": f"Bearer {PERPLEXITY_KEY}"}).json()
        cat = r['choices'][0]['message']['content'].strip()
        return jsonify(category=cat, icon_slug=f"{cat.lower()}.png")
    except: return jsonify(category="Autre", icon_slug="default.png")

# --- 📍 OFFRES & GPS ---
@app.route('/api/offers')
def get_offers():
    today_weekday = datetime.now().weekday()
    offers = Offer.query.filter_by(active=True).all()
    res = []
    for o in offers:
        # Filtre Menu du Jour
        if o.offer_type == 'daily' and o.day_of_week != today_weekday: continue
        res.append({
            "id": o.id, "title": o.title, "type": o.offer_type, "stock": o.stock,
            "discount": o.discount_val, "price": o.price,
            "partner": {
                "name": o.partner.name, "cat": o.partner.category,
                "lat": o.partner.latitude, "lng": o.partner.longitude, "img": o.partner.image_url
            }
        })
    return jsonify(res)

@app.route('/api/activate', methods=['POST'])
@jwt_required()
def activate():
    uid = get_jwt_identity()['id']
    oid = request.json['offer_id']
    code = f"QR-{random.randint(10000,99999)}"
    db.session.add(Activation(user_id=uid, offer_id=oid, code=code))
    db.session.commit()
    return jsonify(success=True, code=code)

# --- AUTH ---
@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d['email']).first()
    if u and check_password_hash(u.password_hash, d['password']):
        return jsonify(token=create_access_token(identity={'id': u.id, 'role': u.role}), role=u.role)
    return jsonify(error="Login incorrect"), 401

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))