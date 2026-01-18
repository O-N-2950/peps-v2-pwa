import sys
import os
import stripe
import requests
import json
import random
from datetime import datetime, timedelta, date
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
# ❌ PAS DE SOCKETIO, PAS D'EVENTLET -> 100% STABLE
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, desc
from apscheduler.schedulers.background import BackgroundScheduler

# Import Modèles
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability, followers, UserDevice, Activation, PartnerFeedback

# 1. CONFIGURATION (Force Logs)
sys.stdout.reconfigure(line_buffering=True)
print("🚀 DÉMARRAGE V11.1 (ROUTING FIX)...", file=sys.stdout)

# ✅ CORRECTION CRITIQUE : On retire static_url_path='/'
app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

app.config['SECRET_KEY'] = 'peps_v11_final_key'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v11_key'

# Database
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

# APIs
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')

db.init_app(app)
jwt = JWTManager(app)

# 2. MAINTENANCE (Mode Thread Safe)
def maintenance():
    with app.app_context():
        try:
            # Nettoyage offres flash
            Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0).update({Offer.active: False})
            db.session.commit()
        except: pass

# Scheduler uniquement sur le process principal
if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    try:
        scheduler = BackgroundScheduler()
        scheduler.add_job(maintenance, 'interval', minutes=30)
        scheduler.start()
    except: pass

# ==========================================
# 🛡️ ROUTES ADMIN
# ==========================================

@app.route('/api/admin/test-no-jwt')
def admin_test_no_jwt():
    return jsonify({"status": "ok", "routing": "V11.1 Fixed"})

@app.route('/api/admin/global-stats')
@jwt_required()
def admin_global_stats():
    if get_jwt_identity().get('role') != 'admin': return jsonify(error="Unauthorized"), 403
    try:
        total_partners = Partner.query.count()
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
            "id": b.id, "date": b.start_at.strftime("%d/%m %H:%M"), "status": b.status,
            "user_id": b.user_id, "partner_id": b.partner_id
        } for b in bookings])
    except: return jsonify([])

# ==========================================
# 🛠️ UTILS
# ==========================================

@app.route('/api/health')
def health():
    return jsonify({"status": "ONLINE", "version": "V11.1"})

@app.route('/api/nuke_db')
def nuke_db():
    try:
        with db.engine.connect() as c: 
            c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
            c.commit()
        db.create_all()
        return jsonify({"status": "SUCCESS"})
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/setup_v11')
def setup_v11():
    try:
        db.create_all()
        # Création des comptes V11 (Admin, Partner, Company, Both)
        if not User.query.filter_by(email='admin@peps.swiss').first():
            db.session.add(User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin', is_both=False))
        
        if not User.query.filter_by(email='partner@peps.swiss').first():
            u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=False)
            db.session.add(u); db.session.commit()
            db.session.add(Partner(user_id=u.id, name="Partner Only", category="Restaurant", booking_enabled=True, image_url="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500", latitude=47.13, longitude=7.24))

        if not User.query.filter_by(email='company@peps.swiss').first():
            c = Company(name="TechCorp"); db.session.add(c); db.session.commit()
            db.session.add(User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id, is_both=False))
            
        if not User.query.filter_by(email='both@peps.swiss').first():
            u = User(email='both@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=True)
            db.session.add(u); db.session.commit()
            db.session.add(Partner(user_id=u.id, name="Hybrid Shop", category="Boutique", image_url="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500"))

        # Packs & Offres
        if not Pack.query.first():
            db.session.add(Pack(name="Solo", category="B2C", access_count=1, price_chf=49, price_eur=49))
        
        u_p = User.query.filter_by(email='partner@peps.swiss').first()
        if u_p and u_p.partner_profile and not Offer.query.first():
            db.session.add(Offer(partner_id=u_p.partner_profile.id, title="Menu Découverte", active=True, offer_type="permanent"))
            db.session.add(Service(partner_id=u_p.partner_profile.id, name="Menu Midi", duration_minutes=60, price_chf=25))
            for d in range(5): db.session.add(Availability(partner_id=u_p.partner_profile.id, day_of_week=d, start_time="12:00", end_time="14:00"))

        db.session.commit()
        return jsonify({"status": "SUCCESS"})
    except Exception as e: return jsonify(error=str(e)), 500

# ==========================================
# 🔐 AUTH & PUBLIC
# ==========================================

@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if User.query.filter_by(email=d.get('email')).first(): return jsonify(error="Email pris"), 400
    
    role_req = d.get('role', 'member')
    is_both = (role_req == 'both')
    final_role = 'partner' if is_both or role_req == 'partner' else (role_req if role_req=='company' else 'member')
    if role_req == 'company': final_role = 'company_admin'
    
    u = User(email=d.get('email'), password_hash=generate_password_hash(d.get('password')), role=final_role, is_both=is_both)
    if final_role == 'member' or is_both: u.access_expires_at = datetime.utcnow() + timedelta(days=365)
    db.session.add(u); db.session.commit()
    
    if final_role == 'partner':
        db.session.add(Partner(user_id=u.id, name="Nouveau", category="Autre"))
        db.session.commit()
    
    return jsonify(success=True, token=create_access_token(identity={'id': u.id, 'role': final_role}), role=final_role, is_both=is_both)

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    
    dev_id = d.get('device_id')
    if u and u.role == 'member' and not u.is_both and dev_id:
        known = UserDevice.query.filter_by(user_id=u.id, device_fingerprint=dev_id).first()
        if not known:
            if UserDevice.query.filter_by(user_id=u.id).count() >= 2: return jsonify({'error': 'Max 2 appareils'}), 403
            db.session.add(UserDevice(user_id=u.id, device_fingerprint=dev_id)); db.session.commit()

    if u and check_password_hash(u.password_hash, d.get('password')):
        return jsonify({'token': create_access_token(identity={'id': u.id, 'role': u.role}), 'role': u.role, 'is_both': u.is_both})
    return jsonify({'error': 'Incorrect'}), 401

@app.route('/api/offers')
def get_offers():
    try:
        offers = Offer.query.filter_by(active=True).all()
        return jsonify([{
            "id": o.id, "title": o.title, "type": o.offer_type, 
            "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url}
        } for o in offers])
    except: return jsonify([])

# ==========================================
# 🚀 CATCH-ALL ROUTING (LE FIX)
# ==========================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # 1. Si c'est une API qui n'existe pas -> Erreur JSON (Important !)
    if path.startswith('api/'):
        return jsonify(error="API Route Not Found"), 404

    # 2. Si c'est un fichier physique (ex: assets/main.js, logo.jpg) -> On le sert
    # Cela empêche de servir index.html à la place d'une image manquante
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)

    # 3. Sinon (ex: /login, /dashboard) -> On renvoie index.html (Routing React)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
