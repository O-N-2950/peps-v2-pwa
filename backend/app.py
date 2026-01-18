import sys
import os
import json
import random
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, desc
from apscheduler.schedulers.background import BackgroundScheduler
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability, followers, UserDevice, Activation, Notification, PartnerFeedback

sys.stdout.reconfigure(line_buffering=True)
print("🚀 DÉMARRAGE V12 PHASE 1...", file=sys.stdout)

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

app.config['SECRET_KEY'] = 'peps_v12_phase1_final_key'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v12_p1'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"pool_pre_ping": True, "pool_recycle": 300}

db.init_app(app)
jwt = JWTManager(app)

def get_auth_user():
    try:
        uid = get_jwt_identity()
        return User.query.get(int(uid)) if uid else None
    except: return None

# --- 🏪 PARTNER API ---

@app.route('/api/partner/profile', methods=['GET', 'PUT'])
@jwt_required()
def partner_profile():
    user = get_auth_user()
    if not user or (user.role != 'partner' and not user.is_both): return jsonify(error="Unauthorized"), 403
    p = user.partner_profile
    if not p: return jsonify(error="No profile"), 404

    if request.method == 'GET':
        return jsonify({
            "name": p.name, "category": p.category, "description": p.description,
            "address": p.address, "phone": p.phone, "email": p.email_contact,
            "website": p.website, "image_url": p.image_url,
            "hours": json.loads(p.hours_json) if p.hours_json else {},
            "booking_enabled": p.booking_enabled
        })
    
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

@app.route('/api/partner/privileges', methods=['GET', 'POST', 'PUT', 'DELETE'])
@jwt_required()
def partner_privileges():
    user = get_auth_user()
    p = user.partner_profile
    
    if request.method == 'GET':
        return jsonify([{
            "id": o.id, "title": o.title, "description": o.description,
            "type": o.offer_type, "active": o.active, "discount": o.discount_val,
            "stock": o.stock, "price": o.price, "usage": o.usage_count
        } for o in p.offers])

    d = request.json
    if request.method == 'POST':
        o = Offer(
            partner_id=p.id, title=d['title'], description=d.get('description'),
            offer_type=d.get('type', 'permanent'), discount_val=d.get('value'),
            conditions=d.get('conditions'), stock=int(d['stock']) if d.get('stock') else None, active=True
        )
        db.session.add(o)
    
    elif request.method == 'PUT':
        o = Offer.query.get(d['id'])
        if o and o.partner_id == p.id:
            o.title = d.get('title', o.title)
            o.active = d.get('active', o.active)
            o.stock = d.get('stock', o.stock)
    
    elif request.method == 'DELETE':
        o = Offer.query.get(request.args.get('id'))
        if o and o.partner_id == p.id: db.session.delete(o)

    db.session.commit()
    return jsonify(success=True)

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

@app.route('/api/partner/bookings', methods=['GET', 'PUT'])
@jwt_required()
def partner_bookings():
    user = get_auth_user()
    p = user.partner_profile
    
    if request.method == 'GET':
        bookings = Booking.query.filter_by(partner_id=p.id).order_by(desc(Booking.start_at)).all()
        return jsonify([{
            "id": b.id, "date": b.start_at.strftime("%d/%m %H:%M"),
            "service": b.service.name, "member": b.client.email, "status": b.status
        } for b in bookings])
        
    d = request.json
    b = Booking.query.get(d['id'])
    if b and b.partner_id == p.id:
        b.status = d['status']
        db.session.commit()
        return jsonify(success=True)
    return jsonify(error="Error"), 404

@app.route('/api/partner/stats_advanced', methods=['GET'])
@jwt_required()
def partner_stats():
    p = get_auth_user().partner_profile
    history = [random.randint(5, 20) for _ in range(7)]
    return jsonify({
        "followers": p.followers_list.count(),
        "views": p.views_count,
        "activations": sum(o.usage_count for o in p.offers),
        "history_7d": history
    })

# --- 🏢 COMPANY API ---

@app.route('/api/company/overview')
@jwt_required()
def company_overview():
    user = get_auth_user()
    c = Company.query.get(user.company_id)
    active_count = User.query.filter_by(company_id=c.id).count() - 1 
    return jsonify({
        "name": c.name, "slots_total": c.access_total, "slots_used": c.access_used,
        "activation_rate": int((c.access_used/c.access_total)*100) if c.access_total > 0 else 0
    })

@app.route('/api/company/employees', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def company_employees():
    user = get_auth_user()
    c = Company.query.get(user.company_id)
    
    if request.method == 'GET':
        emps = User.query.filter(User.company_id == c.id, User.id != user.id).all()
        return jsonify([{
            "id": u.id, "email": u.email, "joined": u.created_at.strftime("%d/%m/%Y"),
            "status": "Actif" if u.is_active_member else "Inactif"
        } for u in emps])
        
    if request.method == 'POST':
        email = request.json['email']
        if User.query.filter_by(email=email).first(): return jsonify(error="Email pris"), 400
        if c.access_used >= c.access_total: return jsonify(error="Quota atteint"), 402
        u = User(email=email, password_hash=generate_password_hash('welcome123'), role='member', company_id=c.id, access_expires_at=datetime.utcnow()+timedelta(days=365))
        c.access_used += 1
        db.session.add(u)
        
    if request.method == 'DELETE':
        u = User.query.get(request.args.get('id'))
        if u and u.company_id == c.id:
            u.company_id = None; c.access_used -= 1
            
    db.session.commit()
    return jsonify(success=True)

# --- 👤 MEMBER API ---

@app.route('/api/member/profile', methods=['GET', 'PUT'])
@jwt_required()
def member_profile():
    u = get_auth_user()
    if request.method == 'GET':
        return jsonify({
            "email": u.email, "first_name": u.first_name, "last_name": u.last_name,
            "phone": u.phone, "active": u.is_active_member,
            "expires": u.access_expires_at.strftime("%d/%m/%Y") if u.access_expires_at else "Inactif"
        })
    d = request.json
    u.first_name = d.get('first_name', u.first_name)
    u.last_name = d.get('last_name', u.last_name)
    u.phone = d.get('phone', u.phone)
    db.session.commit()
    return jsonify(success=True)

@app.route('/api/member/favorites')
@jwt_required()
def member_favorites():
    u = get_auth_user()
    return jsonify([{
        "id": p.id, "name": p.name, "category": p.category, "image_url": p.image_url
    } for p in u.followed_partners])

@app.route('/api/member/bookings')
@jwt_required()
def member_bookings():
    u = get_auth_user()
    bookings = Booking.query.filter_by(user_id=u.id).order_by(desc(Booking.start_at)).all()
    return jsonify([{
        "id": b.id, "partner": b.partner.name, "service": b.service.name,
        "date": b.start_at.strftime("%d/%m/%Y"), "status": b.status
    } for b in bookings])

# --- SYSTEM ---

@app.route('/api/nuke_db')
def nuke_db():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all(); return jsonify(status="Clean V12")

@app.route('/api/setup_v12')
def setup_v12():
    db.create_all()
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

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        return jsonify({'token': create_access_token(identity=str(u.id), additional_claims={'role': u.role, 'is_both': u.is_both}), 'role': u.role, 'is_both': u.is_both})
    return jsonify({'error': 'Incorrect'}), 401

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path.startswith('api/'): return jsonify(error="Not Found"), 404
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
