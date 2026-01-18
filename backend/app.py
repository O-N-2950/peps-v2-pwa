import sys
import os
import stripe
import requests
import json
import random
from datetime import datetime, timedelta, date
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
# ❌ PLUS DE SOCKETIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, desc
from apscheduler.schedulers.background import BackgroundScheduler

# Import des modèles
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability, followers, UserDevice, Activation, PartnerFeedback

# 1. CONFIGURATION STABLE (Force Logs)
sys.stdout.reconfigure(line_buffering=True)
print("🚀 DÉMARRAGE DU SERVEUR V11 (PURE SYNC - NO SOCKETIO)...", file=sys.stdout)

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

app.config['SECRET_KEY'] = 'peps_v11_final_key'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v11_key'

# Database Config
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Options critiques pour la stabilité PostgreSQL sur Railway
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

# API Keys
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')

# Initialisation
db.init_app(app)
jwt = JWTManager(app)
# ❌ PAS DE SOCKETIO INIT

# 3. MAINTENANCE (Scheduler Threadé Standard - Compatible Gunicorn Threads)
def maintenance():
    with app.app_context():
        try:
            Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0).update({Offer.active: False})
            db.session.commit()
            print("🧹 Maintenance auto effectuée", file=sys.stdout)
        except Exception as e:
            print(f"⚠️ Erreur Maintenance: {e}", file=sys.stdout)

# On lance le scheduler uniquement si ce n'est pas un reload (pour éviter les doublons)
if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    scheduler = BackgroundScheduler()
    scheduler.add_job(maintenance, 'interval', minutes=30)
    scheduler.start()

# ==========================================
# 🛡️ ROUTES ADMIN (STATS & MONITORING)
# ==========================================

@app.route('/api/admin/test-no-jwt')
def admin_test_no_jwt():
    return jsonify({"status": "ok", "mode": "V11 Pure Sync"})

@app.route('/api/admin/global-stats')
@jwt_required()
def admin_global_stats():
    # Vérification Role
    if get_jwt_identity().get('role') != 'admin': return jsonify(error="Unauthorized"), 403
    try:
        total_partners = Partner.query.count()
        # Compte des followers via la table de liaison
        total_follows = db.session.query(func.count(followers.c.user_id)).scalar() or 0
        return jsonify({
            "total_partners": total_partners,
            "total_members": User.query.filter_by(role='member').count(),
            "total_followers": total_follows,
            "total_bookings": Booking.query.count(),
            "total_offers": Offer.query.count()
        })
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/admin/partners-overview')
@jwt_required()
def admin_partners_overview():
    if get_jwt_identity().get('role') != 'admin': return jsonify(error="Unauthorized"), 403
    try:
        partners = Partner.query.all()
        res = []
        for p in partners:
            res.append({
                "id": p.id, "name": p.name, "category": p.category,
                "followers_count": p.followers_list.count(), 
                "active_offers": Offer.query.filter_by(partner_id=p.id, active=True).count(),
                "status": "active"
            })
        return jsonify(sorted(res, key=lambda x: x['followers_count'], reverse=True))
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/admin/bookings')
@jwt_required()
def admin_bookings():
    if get_jwt_identity().get('role') != 'admin': return jsonify(error="Unauthorized"), 403
    try:
        bookings = Booking.query.order_by(desc(Booking.created_at)).limit(50).all()
        return jsonify([{
            "id": b.id, "user": b.user_id, "partner": b.partner_id,
            "date": b.start_at.strftime("%d/%m %H:%M"),
            "status": b.status
        } for b in bookings])
    except: return jsonify([])

# ==========================================
# 🛠️ SETUP & MAINTENANCE
# ==========================================

@app.route('/api/health')
def health():
    return jsonify({"status": "ONLINE", "version": "V11 Sync"})

@app.route('/api/nuke_db')
def nuke_db():
    try:
        with db.engine.connect() as c: 
            c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
            c.commit()
        db.create_all()
        return jsonify({"status": "SUCCESS", "msg": "Base V11 Clean"})
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/setup_v11')
def setup_v11():
    try:
        db.create_all()
        
        # 1. Admin
        if not User.query.filter_by(email='admin@peps.swiss').first():
            db.session.add(User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin', is_both=False))
        
        # 2. Partner Only
        if not User.query.filter_by(email='partner@peps.swiss').first():
            u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=False)
            db.session.add(u); db.session.commit()
            p = Partner(user_id=u.id, name="Partner Only", category="Restaurant", booking_enabled=True, image_url="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500", latitude=47.13, longitude=7.24)
            db.session.add(p); db.session.commit()
            # Offres
            db.session.add(Offer(partner_id=p.id, title="-20% Menu", active=True, offer_type="permanent"))
            db.session.add(Service(partner_id=p.id, name="Menu Midi", duration_minutes=60, price_chf=25))
            for d in range(5): db.session.add(Availability(partner_id=p.id, day_of_week=d, start_time="11:00", end_time="15:00"))

        # 3. Company
        if not User.query.filter_by(email='company@peps.swiss').first():
            c = Company(name="TechCorp", access_total=50)
            db.session.add(c); db.session.commit()
            db.session.add(User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id, is_both=False))
        
        # 4. Hybride (Both)
        if not User.query.filter_by(email='both@peps.swiss').first():
            u = User(email='both@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=True)
            db.session.add(u); db.session.commit()
            p = Partner(user_id=u.id, name="Hybrid Shop", category="Boutique", image_url="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500")
            db.session.add(p); db.session.commit()
            db.session.add(Offer(partner_id=p.id, title="Soldes Flash", offer_type="flash", stock=10, active=True))

        # Packs
        if not Pack.query.first():
            db.session.add(Pack(name="Solo", category="B2C", access_count=1, price_chf=49, price_eur=49))

        db.session.commit()
        return jsonify({"status": "SUCCESS", "msg": "V11 Accounts Ready"})
    except Exception as e: return jsonify(error=str(e)), 500

# ==========================================
# 🔐 AUTHENTIFICATION & INSCRIPTION
# ==========================================

@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if User.query.filter_by(email=d.get('email')).first(): return jsonify(error="Email pris"), 400
    
    role_req = d.get('role', 'member')
    is_both = False
    final_role = 'member'
    
    if role_req == 'partner': final_role = 'partner'
    elif role_req == 'both': final_role = 'partner'; is_both = True
    elif role_req == 'company': final_role = 'company_admin'
    
    u = User(email=d.get('email'), password_hash=generate_password_hash(d.get('password')), role=final_role, is_both=is_both)
    
    if final_role == 'member' or is_both:
        u.access_expires_at = datetime.utcnow() + timedelta(days=365)
        
    db.session.add(u); db.session.commit()
    
    if final_role == 'partner':
        db.session.add(Partner(user_id=u.id, name="Nouveau Commerce", category="Autre"))
        db.session.commit()

    token = create_access_token(identity={'id': u.id, 'role': final_role})
    return jsonify(success=True, token=token, role=final_role, is_both=is_both)

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    
    # Device Check (Simple)
    dev_id = d.get('device_id')
    if u and u.role == 'member' and not u.is_both and dev_id:
        known = UserDevice.query.filter_by(user_id=u.id, device_fingerprint=dev_id).first()
        if not known:
            if UserDevice.query.filter_by(user_id=u.id).count() >= 2:
                return jsonify({'error': 'Max 2 appareils autorisés'}), 403
            db.session.add(UserDevice(user_id=u.id, device_fingerprint=dev_id))
            db.session.commit()

    if u and check_password_hash(u.password_hash, d.get('password')):
        return jsonify({
            'token': create_access_token(identity={'id': u.id, 'role': u.role}), 
            'role': u.role,
            'is_both': u.is_both
        })
    return jsonify({'error': 'Incorrect'}), 401

# ==========================================
# 📍 PARTENAIRES & OFFRES
# ==========================================

@app.route('/api/offers')
def get_offers():
    try:
        offers = Offer.query.filter_by(active=True).all()
        return jsonify([{
            "id": o.id, "title": o.title, "type": o.offer_type, "stock": o.stock,
            "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url, "lat": o.partner.latitude, "lng": o.partner.longitude, "booking": o.partner.booking_enabled}
        } for o in offers])
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/partner/my-stats')
@jwt_required()
def my_stats():
    uid = get_jwt_identity()['id']
    u = User.query.get(uid)
    if not u.partner_profile: return jsonify(error="Not partner"), 403
    return jsonify({"name": u.partner_profile.name, "followers_count": u.partner_profile.followers_list.count()})

@app.route('/api/partner/growth-suggestions')
@jwt_required()
def growth_ai():
    return jsonify({"suggestions": [{"action": "Offre Flash", "desc": "Boostez votre visibilité", "priority": 1, "icon": "⚡"}], "level": "basic"})

# ==========================================
# 📅 RÉSERVATION (SYNC)
# ==========================================

@app.route('/api/partner/<int:pid>/services')
def get_services(pid):
    services = Service.query.filter_by(partner_id=pid, is_active=True).all()
    return jsonify([{'id':s.id, 'name':s.name, 'duration':s.duration_minutes, 'price':s.price_chf} for s in services])

@app.route('/api/partner/<int:pid>/slots')
def get_slots(pid):
    return jsonify(["09:00", "10:00", "11:30", "14:00", "16:00"])

@app.route('/api/booking/create', methods=['POST'])
@jwt_required()
def create_booking():
    try:
        uid = get_jwt_identity()['id']
        d = request.json
        s = Service.query.get(d['service_id'])
        
        start = datetime.strptime(f"{d['date']} {d['time']}", "%Y-%m-%d %H:%M")
        b = Booking(
            user_id=uid, partner_id=d['partner_id'], service_id=s.id,
            start_at=start, end_at=start + timedelta(minutes=s.duration_minutes),
            status='confirmed', is_privilege_applied=True, privilege_details="Membre V11"
        )
        db.session.add(b)
        db.session.commit()
        # ❌ PLUS DE SOCKETIO EMIT ICI
        return jsonify(success=True, msg="Rendez-vous confirmé !", privilege=True, details="Avantage Membre")
    except Exception as e: return jsonify(error=str(e)), 500

# ==========================================
# 🚀 CATCH-ALL FRONTEND
# ==========================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): 
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Mode standard Flask
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
