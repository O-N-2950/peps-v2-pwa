# 1. MONKEY PATCH OBLIGATOIRE (DOIT ÊTRE LA TOUTE PREMIÈRE LIGNE)
import eventlet
eventlet.monkey_patch()

import os
import stripe
import requests
import json
import random
from datetime import datetime, timedelta, date
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
# 2. AJOUT DES IMPORTS SQL MANQUANTS (func, desc)
from sqlalchemy import text, func, desc, and_
from apscheduler.schedulers.background import BackgroundScheduler
# 3. AJOUT DE L'IMPORT 'followers'
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability, followers, Activation, UserDevice, PartnerFeedback

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

# CONFIGURATION
app.config['SECRET_KEY'] = 'peps_v10_final_fix'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v10_fix'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# API KEYS
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- 🔄 MAINTENANCE ---
def maintenance():
    with app.app_context():
        try:
            Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0).update({Offer.active: False})
            db.session.commit()
        except: db.session.rollback()

# Démarrage conditionnel du scheduler
if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    scheduler = BackgroundScheduler()
    scheduler.add_job(maintenance, 'interval', minutes=30)
    scheduler.start()

# ==========================================
# 🛡️ ROUTES ADMIN (EN PREMIER POUR ÉVITER LES CONFLITS)
# ==========================================

@app.route('/api/admin/test-no-jwt')
def admin_test_no_jwt():
    # Cette route doit répondre instantanément si le Monkey Patch fonctionne
    return jsonify({"status": "ok", "message": "Le serveur répond correctement (Patch OK)."})

@app.route('/api/admin/global-stats')
@jwt_required()
def admin_global_stats():
    identity = get_jwt_identity()
    if identity.get('role') != 'admin': return jsonify(error="Unauthorized"), 403
    
    try:
        # Utilisation de func.count (nécessite l'import ajouté en haut)
        total_partners = Partner.query.count()
        total_members = User.query.filter_by(role='member').count()
        total_offers = Offer.query.count()
        # Calcul safe des followers via la table de liaison
        total_follows = db.session.query(func.count(followers.c.user_id)).scalar() or 0

        return jsonify({
            "total_partners": total_partners,
            "total_members": total_members,
            "total_followers": total_follows,
            "total_offers": total_offers,
            "avg_engagement": round(total_follows / max(1, total_partners), 1)
        })
    except Exception as e:
        print(f"ADMIN ERROR: {e}")
        return jsonify(error=str(e)), 500

@app.route('/api/admin/partners-overview')
@jwt_required()
def admin_partners_overview():
    identity = get_jwt_identity()
    if identity.get('role') != 'admin': return jsonify(error="Unauthorized"), 403
    
    try:
        partners = Partner.query.all()
        res = []
        for p in partners:
            # p.followers_list fonctionne grâce au backref lazy='dynamic' dans models.py
            f_count = p.followers_list.count()
            active_offers = Offer.query.filter_by(partner_id=p.id, active=True).count()
            
            res.append({
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "followers_count": f_count,
                "active_offers": active_offers,
                "status": "active" if f_count > 5 else "low_engagement"
            })
        return jsonify(sorted(res, key=lambda x: x['followers_count'], reverse=True))
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/api/admin/booking-stats')
@jwt_required()
def admin_booking_stats():
    identity = get_jwt_identity()
    if identity.get('role') != 'admin': return jsonify(error="Unauthorized"), 403
    try:
        confirmed = Booking.query.filter_by(status='confirmed').count()
        return jsonify([{"name": "Confirmés", "value": confirmed}])
    except: return jsonify([])

@app.route('/api/admin/bookings')
@jwt_required()
def admin_bookings_list():
    identity = get_jwt_identity()
    if identity.get('role') != 'admin': return jsonify(error="Unauthorized"), 403
    try:
        # Utilisation de desc() nécessite l'import
        bookings = Booking.query.order_by(desc(Booking.created_at)).limit(20).all()
        return jsonify([{
            "id": b.id, 
            "date": b.start_at.strftime("%d/%m"),
            "status": b.status
        } for b in bookings])
    except: return jsonify([])

# ==========================================
# FIN ROUTES ADMIN
# ==========================================

# --- ☢️ SETUP & UTILS ---

@app.route('/api/nuke_db')
def nuke_db():
    try:
        with db.engine.connect() as c: 
            c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
            c.commit()
        db.create_all()
        return jsonify({"status": "SUCCESS", "msg": "Base Clean"})
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/setup_v8')
def setup_v8():
    try:
        db.create_all()
        # Admin
        if not User.query.filter_by(email='admin@peps.swiss').first():
            db.session.add(User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin', is_both=False))
        
        # Partner
        if not User.query.filter_by(email='partner@peps.swiss').first():
            u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=False)
            db.session.add(u); db.session.commit()
            db.session.add(Partner(user_id=u.id, name="Mario Pizza", category="Restaurant"))
        
        # Company
        if not User.query.filter_by(email='company@peps.swiss').first():
            c = Company(name="TechCorp"); db.session.add(c); db.session.commit()
            db.session.add(User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id, is_both=False))
        
        # Both
        if not User.query.filter_by(email='both@peps.swiss').first():
            u = User(email='both@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=True)
            db.session.add(u); db.session.commit()
            db.session.add(Partner(user_id=u.id, name="Hybrid Shop", category="Boutique"))

        db.session.commit()
        return jsonify({"status": "SUCCESS", "msg": "Comptes V10 créés"})
    except Exception as e: return jsonify(error=str(e)), 500

# --- 🧠 IA & PARTNER ---
@app.route('/api/partner/growth-suggestions')
@jwt_required()
def growth_ai():
    return jsonify({"suggestions": [{"action": "Offre Flash", "desc": "Boostez votre visibilité", "priority": 1}], "level": "basic"})

@app.route('/api/partner/my-stats')
@jwt_required()
def my_stats():
    uid = get_jwt_identity()['id']
    u = User.query.get(uid)
    if not u.partner_profile: return jsonify(error="Not partner"), 403
    return jsonify({"name": u.partner_profile.name, "followers_count": u.partner_profile.followers_list.count(), "engagement_score": 5})

# --- AUTH & PUBLIC ---
@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if User.query.filter_by(email=d.get('email')).first(): return jsonify(error="Email pris"), 400
    
    role = d.get('role', 'member')
    is_both = (role == 'both')
    final_role = 'partner' if is_both or role == 'partner' else role
    if role == 'company': final_role = 'company_admin'
    
    u = User(email=d.get('email'), password_hash=generate_password_hash(d.get('password')), role=final_role, is_both=is_both)
    db.session.add(u); db.session.commit()
    
    if final_role == 'partner':
        db.session.add(Partner(user_id=u.id, name="Nouveau", category="Autre"))
        db.session.commit()

    return jsonify(success=True, token=create_access_token(identity={'id': u.id, 'role': final_role}), role=final_role, is_both=is_both)

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        return jsonify({
            'token': create_access_token(identity={'id': u.id, 'role': u.role}), 
            'role': u.role,
            'is_both': u.is_both
        })
    return jsonify({'error': 'Incorrect'}), 401

@app.route('/api/offers')
def get_offers():
    offers = Offer.query.filter_by(active=True).all()
    return jsonify([{
        "id": o.id, "title": o.title, "type": o.offer_type, 
        "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url, "booking": o.partner.booking_enabled}
    } for o in offers])

# --- CATCH-ALL (DOIT ÊTRE LA DERNIÈRE) ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): 
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
