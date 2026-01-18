import sys
import os
import stripe
import requests
import json
import random
from datetime import datetime, timedelta, date
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, desc
from apscheduler.schedulers.background import BackgroundScheduler

# Import des modèles
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability, followers, UserDevice, Activation, PartnerFeedback

# 1. CONFIGURATION
sys.stdout.reconfigure(line_buffering=True)
print("🚀 DÉMARRAGE V11 STABLE (PURE SYNC)...", file=sys.stdout)

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
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

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')

db.init_app(app)
jwt = JWTManager(app)

# --- HELPER AUTH SÉCURISÉ ---
def get_auth_user():
    """Récupère l'utilisateur depuis la DB, compatible vieux/nouveaux tokens"""
    try:
        identity = get_jwt_identity()
        uid = identity.get('id') if isinstance(identity, dict) else identity
        return User.query.get(uid) if uid else None
    except: return None

# --- MAINTENANCE ---
def maintenance():
    with app.app_context():
        try:
            Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0).update({Offer.active: False})
            db.session.commit()
        except: pass

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
    return jsonify({"status": "ok", "mode": "V11 Sync"})

@app.route('/api/admin/global-stats')
@jwt_required()
def admin_global_stats():
    user = get_auth_user()
    if not user or user.role != 'admin': return jsonify(error="Unauthorized"), 403
    
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
    user = get_auth_user()
    if not user or user.role != 'admin': return jsonify(error="Unauthorized"), 403
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
    user = get_auth_user()
    if not user or user.role != 'admin': return jsonify(error="Unauthorized"), 403
    try:
        bookings = Booking.query.order_by(desc(Booking.created_at)).limit(50).all()
        return jsonify([{
            "id": b.id, "date": b.start_at.strftime("%d/%m %H:%M"), "status": b.status,
            "user_id": b.user_id, "partner_id": b.partner_id
        } for b in bookings])
    except: return jsonify([])

# ==========================================
# 🏪 ROUTES PARTNER & COMPANY
# ==========================================

@app.route('/api/partner/my-stats')
@jwt_required()
def my_stats():
    user = get_auth_user()
    if not user or (user.role != 'partner' and not user.is_both): return jsonify(error="Not partner"), 403
    if not user.partner_profile: return jsonify(error="Profil introuvable"), 404
    p = user.partner_profile
    return jsonify({"name": p.name, "followers_count": p.followers_list.count()})

@app.route('/api/partner/growth-suggestions')
@jwt_required()
def growth_ai():
    return jsonify({"suggestions": [{"action": "Offre Flash", "desc": "Visibilité Max", "priority": 1, "icon": "⚡"}], "level": "basic"})

@app.route('/api/company/info')
@jwt_required()
def company_info():
    user = get_auth_user()
    if not user or user.role != 'company_admin': return jsonify(error="Not company"), 403
    c = Company.query.get(user.company_id)
    if not c: return jsonify(error="No data"), 404
    members = [{"email": m.email, "joined": m.created_at.strftime("%Y-%m-%d")} for m in c.employees if m.id != user.id]
    return jsonify({"name": c.name, "credits": c.access_total, "members": members})

# ==========================================
# 🛠️ UTILS & SETUP
# ==========================================

@app.route('/api/health')
def health(): return jsonify({"status": "ONLINE", "version": "V11 Sync"})

@app.route('/api/nuke_db')
def nuke_db():
    with db.engine.connect() as c: 
        c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
        c.commit()
    db.create_all()
    return jsonify({"status": "SUCCESS"})

@app.route('/api/setup_v11')
def setup_v11():
    db.create_all()
    # Admin
    if not User.query.filter_by(email='admin@peps.swiss').first():
        db.session.add(User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin', is_both=False))
    # Partner
    if not User.query.filter_by(email='partner@peps.swiss').first():
        u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=False)
        db.session.add(u); db.session.commit()
        db.session.add(Partner(user_id=u.id, name="Mario Pizza", category="Restaurant", booking_enabled=True, latitude=47.13, longitude=7.24))
    # Company
    if not User.query.filter_by(email='company@peps.swiss').first():
        c = Company(name="TechCorp"); db.session.add(c); db.session.commit()
        db.session.add(User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id, is_both=False))
    # Both
    if not User.query.filter_by(email='both@peps.swiss').first():
        u = User(email='both@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=True)
        db.session.add(u); db.session.commit()
        db.session.add(Partner(user_id=u.id, name="Hybrid Shop", category="Boutique"))
    
    if not Pack.query.first():
        db.session.add(Pack(name="Solo", category="B2C", access_count=1, price_chf=49, price_eur=49))
    
    db.session.commit()
    return jsonify({"status": "SUCCESS"})

# ==========================================
# 🔐 AUTH & PUBLIC
# ==========================================

@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if User.query.filter_by(email=d.get('email')).first(): return jsonify(error="Email pris"), 400
    
    role = d.get('role', 'member')
    is_both = (role == 'both')
    final_role = 'partner' if is_both or role == 'partner' else (role if role=='company' else 'member')
    if role == 'company': final_role = 'company_admin'
    
    u = User(email=d.get('email'), password_hash=generate_password_hash(d.get('password')), role=final_role, is_both=is_both)
    if final_role == 'member' or is_both: u.access_expires_at = datetime.utcnow() + timedelta(days=365)
    db.session.add(u); db.session.commit()
    
    if final_role == 'partner':
        db.session.add(Partner(user_id=u.id, name="Nouveau", category="Autre")); db.session.commit()

    token = create_access_token(identity={'id': u.id, 'role': final_role})
    return jsonify(success=True, token=token, role=final_role, is_both=is_both)

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
        return jsonify({
            'token': create_access_token(identity={'id': u.id, 'role': u.role}), 
            'role': u.role, 'is_both': u.is_both
        })
    return jsonify({'error': 'Incorrect'}), 401

@app.route('/api/offers')
def get_offers():
    try:
        offers = Offer.query.filter_by(active=True).all()
        return jsonify([{
            "id": o.id, "title": o.title, "type": o.offer_type, 
            "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url, "lat": o.partner.latitude, "lng": o.partner.longitude, "booking": o.partner.booking_enabled}
        } for o in offers])
    except: return jsonify([])

# 📅 RESA (SYNC)
@app.route('/api/partner/<int:pid>/services')
def get_services(pid):
    services = Service.query.filter_by(partner_id=pid, is_active=True).all()
    return jsonify([{'id':s.id, 'name':s.name, 'duration':s.duration_minutes, 'price':s.price_chf} for s in services])

@app.route('/api/partner/<int:pid>/slots')
def get_slots(pid): return jsonify(["09:00", "10:00", "14:00"])

@app.route('/api/booking/create', methods=['POST'])
@jwt_required()
def create_booking():
    user = get_auth_user()
    if not user: return jsonify(error="Auth required"), 401
    try:
        d = request.json
        s = Service.query.get(d['service_id'])
        start = datetime.strptime(f"{d['date']} {d['time']}", "%Y-%m-%d %H:%M")
        b = Booking(user_id=user.id, partner_id=d['partner_id'], service_id=s.id, start_at=start, end_at=start + timedelta(minutes=s.duration_minutes), status='confirmed', is_privilege_applied=True, privilege_details="Membre V11")
        db.session.add(b); db.session.commit()
        return jsonify(success=True, msg="Confirmé !")
    except Exception as e: return jsonify(error=str(e)), 500

# CATCH-ALL
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'): return jsonify(error="API Not Found"), 404
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
