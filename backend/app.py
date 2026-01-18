import sys
import os
import json
import random
import stripe
import requests
from datetime import datetime, timedelta, date
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
# PAS DE SOCKETIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, desc
from apscheduler.schedulers.background import BackgroundScheduler
# Import complet des modèles
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability, followers, UserDevice, Activation, Notification, PartnerFeedback

# 1. CONFIGURATION & LOGS
sys.stdout.reconfigure(line_buffering=True)
print("🚀 DÉMARRAGE V12.1 STABLE (ROUTING FIX + SAFE AUTH)...", file=sys.stdout)

# ✅ CORRECTION CRITIQUE : Pas de static_url_path ici !
app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

app.config['SECRET_KEY'] = 'peps_v12_1_final_key'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v12_1_key'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"pool_pre_ping": True, "pool_recycle": 300}

# APIs
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')

db.init_app(app)
jwt = JWTManager(app)

# --- 🔐 HELPER AUTH ROBUSTE (Anti-Crash 422/500) ---
def get_auth_user():
    """Gère les identités string (nouveau) et dict (ancien) pour éviter les crashs"""
    try:
        identity = get_jwt_identity()
        if not identity: return None
        
        # Extraction ID safe
        uid = None
        if isinstance(identity, dict): uid = identity.get('id')
        else: uid = identity # Cas string standard V11.4+
        
        return User.query.get(int(uid)) if uid else None
    except Exception as e:
        print(f"⚠️ Auth Error: {e}", file=sys.stdout)
        return None

# --- 🏪 PARTNER API ---

@app.route('/api/partner/profile', methods=['GET', 'PUT'])
@jwt_required()
def partner_profile():
    user = get_auth_user()
    if not user or (user.role != 'partner' and not user.is_both): 
        return jsonify(error="Accès refusé (Rôle incorrect)"), 403
    
    p = user.partner_profile
    if not p: return jsonify(error="Profil Partenaire introuvable"), 404

    if request.method == 'GET':
        # Protection contre le JSON malformé en base
        try: hours = json.loads(p.hours_json) if p.hours_json else {}
        except: hours = {}
        
        return jsonify({
            "id": p.id,
            "name": p.name, "category": p.category, "description": p.description,
            "address": p.address, "phone": p.phone, "email": p.email_contact,
            "website": p.website, "image_url": p.image_url,
            "hours": hours,
            "booking_enabled": p.booking_enabled
        })
    
    # PUT
    d = request.json
    p.name = d.get('name', p.name)
    p.description = d.get('description', p.description)
    p.address = d.get('address', p.address)
    p.phone = d.get('phone', p.phone)
    p.email_contact = d.get('email', p.email_contact)
    p.website = d.get('website', p.website)
    if 'hours' in d: p.hours_json = json.dumps(d['hours'])
    p.booking_enabled = d.get('booking_enabled', p.booking_enabled)
    
    db.session.commit()
    return jsonify(success=True, msg="Profil enregistré")

@app.route('/api/partner/privileges', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def partner_privileges():
    user = get_auth_user()
    if not user or not user.partner_profile: return jsonify(error="No profile"), 403
    p = user.partner_profile
    
    if request.method == 'GET':
        return jsonify([{
            "id": o.id, "title": o.title, "description": o.description,
            "type": o.offer_type, "active": o.active, "discount": o.discount_val,
            "stock": o.stock, "price": o.price, "usage": o.usage_count
        } for o in p.offers])

    d = request.json or {}
    if request.method == 'POST':
        o = Offer(
            partner_id=p.id, title=d.get('title', 'Nouvelle Offre'), description=d.get('description'),
            offer_type=d.get('type', 'permanent'), discount_val=d.get('value'),
            stock=int(d['stock']) if d.get('stock') else None, active=True
        )
        db.session.add(o)
    
    elif request.method == 'DELETE':
        o = Offer.query.get(request.args.get('id'))
        if o and o.partner_id == p.id: db.session.delete(o)

    db.session.commit()
    return jsonify(success=True)

@app.route('/api/partner/stats_advanced', methods=['GET'])
@jwt_required()
def partner_stats():
    user = get_auth_user()
    if not user or not user.partner_profile: return jsonify(error="No profile"), 403
    p = user.partner_profile
    
    # Simulation historique
    history = [random.randint(5, 20) for _ in range(7)]
    
    return jsonify({
        "followers": p.followers_list.count(),
        "views": p.views_count or 0,
        "activations": sum(o.usage_count for o in p.offers),
        "history_7d": history
    })

@app.route('/api/partner/bookings', methods=['GET', 'PUT'])
@jwt_required()
def partner_bookings():
    user = get_auth_user()
    p = user.partner_profile
    if not p: return jsonify(error="No profile"), 404
    
    if request.method == 'GET':
        bookings = Booking.query.filter_by(partner_id=p.id).order_by(desc(Booking.start_at)).all()
        return jsonify([{
            "id": b.id, "date": b.start_at.strftime("%d/%m %H:%M"),
            "service": b.service.name if b.service else "Service", 
            "member": b.client.email if b.client else "Inconnu", 
            "status": b.status
        } for b in bookings])
    
    d = request.json
    b = Booking.query.get(d.get('id'))
    if b and b.partner_id == p.id:
        b.status = d.get('status')
        db.session.commit()
        return jsonify(success=True)
    return jsonify(error="Booking not found"), 404

@app.route('/api/partner/notifications', methods=['POST'])
@jwt_required()
def partner_notif():
    user = get_auth_user()
    p = user.partner_profile
    d = request.json
    count = 0
    for follower in p.followers_list:
        n = Notification(
            user_id=follower.id, sender_id=p.id,
            title=d['title'], message=d['message'], notif_type='info', reach_count=p.followers_list.count()
        )
        db.session.add(n)
        count += 1
    db.session.commit()
    return jsonify(success=True, count=count)

@app.route('/api/partner/growth-suggestions', methods=['GET'])
@jwt_required()
def growth_suggestions():
    # Placeholder essentiel pour éviter crash frontend
    return jsonify({"suggestions": [], "level": "basic"})

# --- MAINTENANCE CRON ---
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

# --- AUTH & SETUP ---

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        # ✅ JWT STANDARD V12.1
        token = create_access_token(identity=str(u.id), additional_claims={'role': u.role, 'is_both': u.is_both})
        return jsonify({'token': token, 'role': u.role, 'is_both': u.is_both})
    return jsonify({'error': 'Identifiants incorrects'}), 401

@app.route('/api/nuke_db')
def nuke_db():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all()
    return jsonify(status="Clean V12.1")

@app.route('/api/setup_v12')
def setup_v12():
    db.create_all()
    # 1. Admin
    if not User.query.filter_by(email='admin@peps.swiss').first():
        db.session.add(User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin', is_both=False))
    
    # 2. Partner
    if not User.query.filter_by(email='partner@peps.swiss').first():
        u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=True)
        db.session.add(u); db.session.commit()
        p = Partner(user_id=u.id, name="Mario Pizza", category="Restaurant", description="Pizzeria historique.", address="Rue Centrale 12", hours_json='{"text":"Lundi-Dimanche 11h-22h"}', booking_enabled=True, image_url="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500")
        db.session.add(p); db.session.commit()
        db.session.add(Offer(partner_id=p.id, title="-20% Menu", offer_type="permanent", discount_val="-20%", active=True))
        db.session.add(Service(partner_id=p.id, name="Table 2 pers", duration_minutes=90, price_chf=0))
        
        c = Company(name="TechCorp", access_total=10); db.session.add(c); db.session.commit()
        db.session.add(User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id))
        
        m = User(email='member@peps.swiss', password_hash=generate_password_hash('123456'), role='member', access_expires_at=datetime.utcnow()+timedelta(days=365))
        db.session.add(m); db.session.commit()
        # Follower demo
        p.followers_list.append(m)

    db.session.commit()
    return jsonify(success=True)

# --- CATCH-ALL (ROUTING FIX) ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'): return jsonify(error="API Not Found"), 404
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)): 
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
