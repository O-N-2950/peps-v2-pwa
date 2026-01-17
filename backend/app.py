# 1. MONKEY PATCH OBLIGATOIRE (LIGNE 1 & 2)
import eventlet
eventlet.monkey_patch()

import os
import sys
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
from sqlalchemy import text, func, desc, and_
# from apscheduler.schedulers.background import BackgroundScheduler # DÉSACTIVÉ POUR STABILITÉ

# 2. PATCH POSTGRESQL POUR ÉVITER LE DEADLOCK (CRITIQUE)
try:
    from psycogreen.eventlet import patch_psycopg
    patch_psycopg()
    print("✅ Psycogreen appliqué avec succès (Mode Asynchrone)", file=sys.stdout)
except ImportError:
    print("⚠️ Psycogreen non trouvé (OK en local, Risqué en Prod)", file=sys.stdout)

from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability, followers, Activation, UserDevice, PartnerFeedback

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

# CONFIGURATION
app.config['SECRET_KEY'] = 'peps_v10_final_fix_stable'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v10_fix_stable'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Options Engine optimisées pour Railway (Évite "Closed connection")
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_pre_ping": True,  # Vérifie la connexion avant usage
    "pool_recycle": 300,    # Recycle les connexions toutes les 5min
}

# API KEYS
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- 🔄 MAINTENANCE (MANUELLE VIA ROUTE API POUR L'INSTANT) ---
@app.route('/api/cron/maintenance')
def run_maintenance():
    """Route à appeler via un Cron externe ou manuellement"""
    try:
        count = Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0, Offer.active==True).update({Offer.active: False})
        db.session.commit()
        return jsonify(status="success", cleaned=count)
    except Exception as e:
        return jsonify(error=str(e)), 500

# SCHEDULER DÉSACTIVÉ : Cause des crashs workers sur Railway avec Eventlet
# scheduler = BackgroundScheduler()
# scheduler.add_job(maintenance, 'interval', minutes=30)
# scheduler.start()

# ==========================================
# 🛡️ ROUTES ADMIN
# ==========================================

@app.route('/api/admin/test-no-jwt')
def admin_test_no_jwt():
    return jsonify({"status": "ok", "message": "Server Online & Patched"})

@app.route('/api/admin/global-stats')
@jwt_required()
def admin_global_stats():
    claims = get_jwt_identity()
    role = claims.get('role') if isinstance(claims, dict) else 'unknown'
    if role != 'admin': return jsonify(error="Unauthorized"), 403
    
    try:
        total_partners = Partner.query.count()
        # Utilisation de func.count explicite
        total_follows = db.session.query(func.count(followers.c.user_id)).scalar() or 0
        return jsonify({
            "total_partners": total_partners,
            "total_members": User.query.filter_by(role='member').count(),
            "total_followers": total_follows,
            "total_offers": Offer.query.count()
        })
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/admin/partners-overview')
@jwt_required()
def admin_partners_overview():
    claims = get_jwt_identity()
    role = claims.get('role') if isinstance(claims, dict) else 'unknown'
    if role != 'admin': return jsonify(error="Unauthorized"), 403
    
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
        return jsonify(res)
    except Exception as e: return jsonify(error=str(e)), 500

# ==========================================
# ROUTES PUBLIQUES & AUTH
# ==========================================

@app.route('/api/nuke_db')
def nuke_db():
    try:
        with db.engine.connect() as c: 
            c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
            c.commit()
        db.create_all()
        return jsonify({"status": "SUCCESS"})
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/setup_v8')
def setup_v8():
    try:
        db.create_all()
        # Création des comptes (Idem V10)
        if not User.query.filter_by(email='admin@peps.swiss').first():
            db.session.add(User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin', is_both=False))
        
        if not User.query.filter_by(email='partner@peps.swiss').first():
            u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=False)
            db.session.add(u); db.session.commit()
            db.session.add(Partner(user_id=u.id, name="Mario Pizza", category="Restaurant"))

        if not User.query.filter_by(email='company@peps.swiss').first():
            c = Company(name="TechCorp"); db.session.add(c); db.session.commit()
            db.session.add(User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id, is_both=False))
            
        if not User.query.filter_by(email='both@peps.swiss').first():
            u = User(email='both@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=True)
            db.session.add(u); db.session.commit()
            db.session.add(Partner(user_id=u.id, name="Hybrid Shop", category="Boutique"))

        db.session.commit()
        return jsonify({"status": "SUCCESS", "msg": "V10 Accounts Ready"})
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        # IDENTITY DICT: C'est correct et supporté par Flask-JWT
        return jsonify({
            'token': create_access_token(identity={'id': u.id, 'role': u.role}), 
            'role': u.role,
            'is_both': u.is_both
        })
    return jsonify({'error': 'Incorrect'}), 401

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

@app.route('/api/offers')
def get_offers():
    try:
        offers = Offer.query.filter_by(active=True).all()
        return jsonify([{
            "id": o.id, "title": o.title, "type": o.offer_type, 
            "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url}
        } for o in offers])
    except Exception as e: return jsonify(error=str(e)), 500

# PARTNER ROUTES
@app.route('/api/partner/my-stats')
@jwt_required()
def my_stats():
    uid = get_jwt_identity()['id']
    u = User.query.get(uid)
    if not u.partner_profile: return jsonify(error="Not partner"), 403
    return jsonify({"name": u.partner_profile.name, "followers_count": u.partner_profile.followers_list.count(), "engagement_score": 5})

@app.route('/api/partner/growth-suggestions')
@jwt_required()
def growth_ai():
    return jsonify({"suggestions": [{"action": "Offre Flash", "desc": "Boostez votre visibilité", "priority": 1}], "level": "basic"})

# CATCH-ALL
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): 
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
