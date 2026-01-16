import os
import random
import stripe
import requests
from datetime import datetime, timedelta, date
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, and_
from apscheduler.schedulers.background import BackgroundScheduler
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability, followers, Activation, UserDevice, PartnerFeedback

# Configuration Flask
import os
from whitenoise import WhiteNoise

app = Flask(__name__)
CORS(app)

# WhiteNoise pour servir les fichiers statiques et gérer le SPA routing
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'dist')
app.wsgi_app = WhiteNoise(app.wsgi_app, root=STATIC_DIR, index_file='index.html')

app.config['SECRET_KEY'] = 'peps_v10_final'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v10'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# APIs
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- ☢️ RESET DB ---
@app.route('/api/nuke_db')
def nuke_db():
    with db.engine.connect() as c: 
        c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
        c.commit()
    db.create_all()
    return jsonify({"status": "SUCCESS", "msg": "Base V10 Clean"})

# --- 🛠️ SETUP V10 (4 COMPTES) ---
@app.route('/api/setup_v8')
def setup_v8():
    db.create_all()
    
    # 1. ADMIN
    if not User.query.filter_by(email='admin@peps.swiss').first():
        admin = User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin', is_both=False)
        db.session.add(admin)

    # 2. PARTENAIRE PUR
    if not User.query.filter_by(email='partner@peps.swiss').first():
        u_part = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=False)
        db.session.add(u_part)
        db.session.commit()
        p = Partner(user_id=u_part.id, name="Partner Only", category="Restaurant", booking_enabled=True, image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500")
        db.session.add(p)
        db.session.commit()
        # Données Résa
        db.session.add(Offer(partner_id=p.id, title="-20% Menu", active=True))
        db.session.add(Service(partner_id=p.id, name="Menu Midi", duration_minutes=60, price_chf=25))
        for d in range(5): db.session.add(Availability(partner_id=p.id, day_of_week=d, start_time="09:00", end_time="14:00"))

    # 3. ENTREPRISE
    if not User.query.filter_by(email='company@peps.swiss').first():
        c = Company(name="TechCorp", access_total=10)
        db.session.add(c)
        db.session.commit()
        u_comp = User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id, is_both=False)
        db.session.add(u_comp)

    # 4. HYBRIDE (BOTH)
    if not User.query.filter_by(email='both@peps.swiss').first():
        u_both = User(email='both@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=True)
        db.session.add(u_both)
        db.session.commit()
        p_both = Partner(user_id=u_both.id, name="Hybrid Shop", category="Boutique", booking_enabled=False, image_url="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500")
        db.session.add(p_both)
        db.session.commit()
        db.session.add(Offer(partner_id=p_both.id, title="Découverte", active=True))

    db.session.commit()
    return jsonify({"status": "SUCCESS", "msg": "Comptes V10 créés (Admin, Partner, Company, Both)"})

# --- 📝 INSCRIPTION V10 ---
@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    email = d.get('email')
    role_req = d.get('role', 'member')

    if User.query.filter_by(email=email).first():
        return jsonify(error="Email déjà utilisé"), 400
    
    final_role = 'member'
    is_both = False
    
    if role_req == 'partner':
        final_role = 'partner'
        is_both = False
    elif role_req == 'both':
        final_role = 'partner'
        is_both = True
    elif role_req == 'company':
        final_role = 'company_admin'
    
    u = User(email=email, password_hash=generate_password_hash(d.get('password')), role=final_role, is_both=is_both)
    
    # Abo offert pour la démo
    if final_role == 'member' or is_both:
        u.access_expires_at = datetime.utcnow() + timedelta(days=365)

    db.session.add(u)
    db.session.commit()
    
    # Création fiche partenaire vide
    if final_role == 'partner':
        p = Partner(user_id=u.id, name="Nouveau Commerce", category="Autre")
        db.session.add(p)
        db.session.commit()

    token = create_access_token(identity=u.id)
    return jsonify(success=True, token=token, role=final_role, is_both=is_both)

# --- 🔑 LOGIN V10 ---
@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        # On renvoie is_both pour le frontend
        return jsonify({
            'token': create_access_token(identity=u.id), 
            'role': u.role,
            'is_both': u.is_both
        })
    return jsonify({'error': 'Identifiants incorrects'}), 401

# --- ACCÈS AUX OFFRES ---
@app.route('/api/offers')
def get_offers():
    # Ouvert à tous en lecture (le frontend filtre l'affichage)
    offers = Offer.query.filter_by(active=True).all()
    return jsonify([{
        "id": o.id, "title": o.title, "type": o.offer_type, 
        "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url, "booking": o.partner.booking_enabled}
    } for o in offers])

# --- ROUTES V9 (RÉSERVATION) ---
@app.route('/api/partner/<int:pid>/services')
def get_services(pid):
    services = Service.query.filter_by(partner_id=pid, is_active=True).all()
    return jsonify([{'id':s.id, 'name':s.name, 'duration':s.duration_minutes, 'price':s.price_chf} for s in services])

@app.route('/api/partner/<int:pid>/slots')
def get_slots(pid):
    return jsonify(["10:00", "14:00", "16:00"])

@app.route('/api/booking/create', methods=['POST'])
@jwt_required()
def create_booking():
    return jsonify(success=True, msg="Rendez-vous confirmé", privilege=True, details="Privilège Membre")

# Routes Admin
@app.route('/api/admin/global-stats')
@jwt_required()
def a_global():
    user_id = get_jwt_identity()
    u = User.query.get(user_id)
    if not u or u.role != 'admin': return jsonify(error="Admin only"), 403
    total_rev = db.session.query(func.sum(Service.price_chf)).join(Booking).filter(Booking.status=='confirmed').scalar() or 0
    return jsonify({
        "members": User.query.filter_by(role='member').count(),
        "partners": Partner.query.count(),
        "bookings_month": Booking.query.filter(Booking.start_at >= datetime(datetime.utcnow().year, datetime.utcnow().month, 1)).count(),
        "total_revenue": total_rev
    })

@app.route('/api/admin/booking-stats')
@jwt_required()
def a_charts():
    data = []
    for i in range(30):
        d = date.today() - timedelta(days=i)
        cnt = Booking.query.filter(func.date(Booking.start_at)==d).count()
        data.append({"date": d.strftime("%d/%m"), "val": cnt})
    return jsonify(list(reversed(data)))

@app.route('/api/admin/bookings')
@jwt_required()
def a_bookings():
    bookings = Booking.query.order_by(Booking.start_at.desc()).limit(100).all()
    return jsonify([{
        "id": b.id, "date": b.start_at.strftime("%d/%m %H:%M"), "partner": b.partner_ref.name,
        "service": b.service.name, "client": b.user_ref.email, "status": b.status, "amount": b.service.price_chf
    } for b in bookings])

# SPA routing: Fallback vers index.html pour toutes les routes non-API
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    # Si le path existe comme fichier statique, WhiteNoise le sert déjà
    # Sinon, on renvoie index.html pour le routing React
    if path and not path.startswith('api/'):
        file_path = os.path.join(STATIC_DIR, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(STATIC_DIR, path)
    return send_from_directory(STATIC_DIR, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))