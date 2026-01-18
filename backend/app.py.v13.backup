import sys
import os
import json
import random
import stripe
import requests
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, desc
from apscheduler.schedulers.background import BackgroundScheduler
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, followers, UserDevice, Activation, Notification, PartnerFeedback

# 1. LOGS (DEBUG RAILWAY)
sys.stdout.reconfigure(line_buffering=True)
print("🚀 DÉMARRAGE V12.3 FINAL...", file=sys.stdout)

app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

# 2. SÉCURITÉ (CLES DE RESET)
app.config['SECRET_KEY'] = 'peps_v12_3_final_reset'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v12_3_final_reset'

database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"pool_pre_ping": True, "pool_recycle": 300}

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')

db.init_app(app)
jwt = JWTManager(app)

# --- DEBUG JWT ---
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"🚨 JWT INVALID: {error}", file=sys.stdout)
    return jsonify(error="Invalid Token"), 422

# --- AUTH HELPER ---
def get_auth_user():
    try:
        uid = get_jwt_identity()
        if not uid: return None
        # Compatible String/Dict
        if isinstance(uid, dict): uid = uid.get('id')
        return User.query.get(int(uid)) if uid else None
    except Exception as e:
        print(f"⚠️ Auth Error: {e}", file=sys.stdout)
        return None

# --- LOGGING ---
@app.before_request
def log_request():
    if request.path.startswith('/api/'):
        print(f"📥 [{request.method}] {request.path}", file=sys.stdout)

# --- 🏪 PARTNER API ---
@app.route('/api/partner/profile', methods=['GET', 'PUT'])
@jwt_required()
def partner_profile():
    user = get_auth_user()
    if not user: return jsonify(error="User not found"), 401
    if user.role != 'partner' and not user.is_both: return jsonify(error="Forbidden"), 403
    
    p = user.partner_profile
    if not p:
        p = Partner(user_id=user.id, name="Nouveau Commerce", category="Autre")
        db.session.add(p); db.session.commit()

    if request.method == 'GET':
        try: hours = json.loads(p.hours_json) if p.hours_json else {}
        except: hours = {}
        return jsonify({
            "id": p.id, "name": p.name, "category": p.category, "description": p.description,
            "address": p.address, "phone": p.phone, "email": p.email_contact,
            "website": p.website, "image_url": p.image_url, "hours": hours, 
            "booking_enabled": p.booking_enabled
        })
    
    d = request.json
    p.name = d.get('name', p.name)
    p.description = d.get('description', p.description)
    p.address = d.get('address', p.address)
    p.phone = d.get('phone', p.phone)
    p.email_contact = d.get('email', p.email_contact)
    p.booking_enabled = d.get('booking_enabled', p.booking_enabled)
    if 'hours' in d: p.hours_json = json.dumps(d['hours'])
    db.session.commit()
    return jsonify(success=True)

@app.route('/api/partner/privileges', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def partner_privileges():
    p = get_auth_user().partner_profile
    if request.method == 'GET':
        return jsonify([{"id": o.id, "title": o.title, "type": o.offer_type, "active": o.active, "stock": o.stock, "usage": o.usage_count, "price": o.price} for o in p.offers])
    
    if request.method == 'POST':
        d = request.json
        db.session.add(Offer(partner_id=p.id, title=d.get('title'), description=d.get('description'), offer_type=d.get('type'), discount_val=d.get('value'), stock=int(d['stock']) if d.get('stock') else None, active=True))
    
    if request.method == 'DELETE':
        o = Offer.query.get(request.args.get('id'))
        if o and o.partner_id == p.id: db.session.delete(o)
    db.session.commit()
    return jsonify(success=True)

@app.route('/api/partner/stats_advanced', methods=['GET'])
@jwt_required()
def partner_stats():
    p = get_auth_user().partner_profile
    return jsonify({
        "followers": p.followers_list.count(),
        "views": p.views_count,
        "activations": sum(o.usage_count for o in p.offers),
        "history_7d": [random.randint(2, 15) for _ in range(7)]
    })

@app.route('/api/partner/bookings', methods=['GET', 'PUT'])
@jwt_required()
def partner_bookings():
    p = get_auth_user().partner_profile
    if request.method == 'GET':
        bookings = Booking.query.filter_by(partner_id=p.id).order_by(desc(Booking.start_at)).all()
        return jsonify([{
            "id": b.id, "date": b.start_at.strftime("%d/%m %H:%M"), 
            "service": b.service_name or "RDV", "member": b.client.email, "status": b.status
        } for b in bookings])
    
    d = request.json
    b = Booking.query.get(d.get('id'))
    if b and b.partner_id == p.id:
        b.status = d.get('status')
        db.session.commit()
    return jsonify(success=True)

@app.route('/api/partner/notifications', methods=['POST'])
@jwt_required()
def partner_notif():
    p = get_auth_user().partner_profile
    d = request.json
    for f in p.followers_list:
        db.session.add(Notification(user_id=f.id, sender_id=p.id, title=d['title'], message=d['message']))
    db.session.commit()
    return jsonify(success=True, count=p.followers_list.count())

@app.route('/api/partner/growth-suggestions', methods=['GET'])
@jwt_required()
def growth_suggestions():
    return jsonify({"suggestions": [], "level": "basic"})

# --- 👤 MEMBER API ---
@app.route('/api/member/profile', methods=['GET', 'PUT'])
@jwt_required()
def member_profile():
    u = get_auth_user()
    if request.method == 'GET':
        return jsonify({"email": u.email, "first_name": u.first_name, "last_name": u.last_name, "phone": u.phone, "active": u.is_active_member})
    d = request.json
    u.first_name = d.get('first_name'); u.last_name = d.get('last_name'); u.phone = d.get('phone')
    db.session.commit()
    return jsonify(success=True)

@app.route('/api/member/favorites', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def member_favorites():
    u = get_auth_user()
    if request.method == 'GET':
        return jsonify([{"id": p.id, "name": p.name, "image_url": p.image_url} for p in u.followed_partners])
    
    pid = request.json.get('partner_id') or request.args.get('id')
    p = Partner.query.get(pid)
    if request.method == 'POST' and p not in u.followed_partners: u.followed_partners.append(p)
    if request.method == 'DELETE' and p in u.followed_partners: u.followed_partners.remove(p)
    db.session.commit()
    return jsonify(success=True)

@app.route('/api/member/bookings', methods=['GET'])
@jwt_required()
def member_bookings():
    bs = Booking.query.filter_by(user_id=get_auth_user().id).all()
    return jsonify([{ "id": b.id, "partner": b.partner_id, "date": b.start_at.strftime("%d/%m") } for b in bs])

@app.route('/api/booking/create', methods=['POST'])
@jwt_required()
def create_booking():
    u = get_auth_user()
    d = request.json
    s = Service.query.get(d.get('service_id'))
    start = datetime.strptime(f"{d['date']} {d['time']}", "%Y-%m-%d %H:%M")
    b = Booking(
        user_id=u.id, partner_id=d['partner_id'], service_name=s.name if s else "RDV",
        start_at=start, end_at=start + timedelta(minutes=30)
    )
    db.session.add(b); db.session.commit()
    return jsonify(success=True)

# --- 🏢 COMPANY API ---
@app.route('/api/company/overview')
@jwt_required()
def company_overview():
    c = Company.query.get(get_auth_user().company_id)
    if not c: return jsonify(error="No company"), 404
    return jsonify({"name": c.name, "total": c.access_total, "used": c.access_used})

@app.route('/api/company/employees', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def company_employees():
    c = Company.query.get(get_auth_user().company_id)
    if request.method == 'GET':
        return jsonify([{"id": u.id, "email": u.email, "status": "Actif" if u.is_active_member else "Inactif"} for u in c.employees])
    
    if request.method == 'POST':
        email = request.json['email']
        if User.query.filter_by(email=email).first(): return jsonify(error="Email pris"), 400
        u = User(email=email, password_hash=generate_password_hash('123'), role='member', company_id=c.id)
        c.access_used += 1
        db.session.add(u)
    
    if request.method == 'DELETE':
        u = User.query.get(request.args.get('id'))
        if u.company_id == c.id:
            u.company_id = None; c.access_used -= 1
            
    db.session.commit()
    return jsonify(success=True)

# --- 🛡️ ADMIN API ---
@app.route('/api/admin/global-stats')
@jwt_required()
def admin_stats():
    if get_jwt()['role'] != 'admin': return jsonify(error="Forbidden"), 403
    return jsonify({
        "total_partners": Partner.query.count(),
        "total_members": User.query.filter_by(role='member').count(),
        "total_offers": Offer.query.count(),
        "total_bookings": Booking.query.count()
    })

@app.route('/api/admin/partners-overview')
@jwt_required()
def admin_partners():
    if get_jwt()['role'] != 'admin': return jsonify(error="Forbidden"), 403
    return jsonify([{"id": p.id, "name": p.name, "followers": p.followers_list.count()} for p in Partner.query.all()])

# --- AUTH & SETUP ---
@app.route('/api/nuke_db')
def nuke_db():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all()
    return jsonify(status="Clean V12.3")

@app.route('/api/setup_v12')
def setup_v12():
    db.create_all()
    if not User.query.filter_by(email='admin@peps.swiss').first():
        db.session.add(User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin', is_both=False))
    
    if not User.query.filter_by(email='partner@peps.swiss').first():
        u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner', is_both=True)
        db.session.add(u); db.session.commit()
        p = Partner(user_id=u.id, name="Mario Pizza", category="Restaurant", booking_enabled=True)
        db.session.add(p); db.session.commit()
        db.session.add(Offer(partner_id=p.id, title="-20% Menu", offer_type="permanent", discount_val="-20%"))
        
    if not User.query.filter_by(email='company@peps.swiss').first():
        c = Company(name="TechCorp", access_total=10); db.session.add(c); db.session.commit()
        db.session.add(User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin', company_id=c.id))
        
    if not User.query.filter_by(email='member@peps.swiss').first():
        db.session.add(User(email='member@peps.swiss', password_hash=generate_password_hash('123456'), role='member'))
        
    db.session.commit()
    return jsonify(success=True)

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        # TOKEN STRING (STANDARD)
        token = create_access_token(identity=str(u.id), additional_claims={'role': u.role, 'is_both': u.is_both})
        return jsonify({'token': token, 'role': u.role, 'is_both': u.is_both})
    return jsonify({'error': 'Incorrect'}), 401

@app.route('/api/offers')
def get_offers():
    return jsonify([{ "id": o.id, "title": o.title, "partner": {"name": o.partner.name, "img": o.partner.image_url} } for o in Offer.query.filter_by(active=True).all()])

# CATCH-ALL
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'): return jsonify(error="Not Found"), 404
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
