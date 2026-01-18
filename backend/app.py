import os
import sys
import json
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
from models import db, User, Partner, Offer, Company, Booking, AvailabilitySlot, Member
from sms_service import send_sms

app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

# CONFIGURATION CRITIQUE (FIX 422)
app.config['SECRET_KEY'] = 'peps_v14_prod_secret_key_fixed_99'
app.config['JWT_SECRET_KEY'] = 'peps_v14_prod_jwt_key_fixed_99'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///peps.db').replace("postgres://", "postgresql://")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)

# --- HELPER AUTH ROBUSTE ---
def get_auth_user():
    try:
        identity = get_jwt_identity()
        user_id = int(identity) if isinstance(identity, str) else identity.get('id')
        return User.query.get(int(user_id))
    except Exception as e:
        print(f"🔴 Auth Error: {e}")
        return None

# --- 1. AUTHENTIFICATION ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u = User.query.filter_by(email=data.get('email')).first()
    if u and check_password_hash(u.password_hash, data.get('password')):
        # Identité = String pour éviter bug parsing
        token = create_access_token(identity=str(u.id), additional_claims={'role': u.role})
        return jsonify(token=token, role=u.role)
    return jsonify(error="Identifiants incorrects"), 401

@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if User.query.filter_by(email=d['email']).first():
        return jsonify(error="Email utilisé"), 400
    
    u = User(email=d['email'], password_hash=generate_password_hash(d['password']), role=d.get('role', 'member'))
    db.session.add(u)
    db.session.commit()
    
    if u.role == 'partner':
        db.session.add(Partner(user_id=u.id, name="Nouveau Commerce"))
    elif u.role == 'member':
        db.session.add(Member(user_id=u.id, first_name="Nouveau", last_name="Membre"))
    elif u.role == 'company_admin':
        db.session.add(Company(user_id=u.id, name="Nouvelle Société"))
    db.session.commit()
    
    token = create_access_token(identity=str(u.id), additional_claims={'role': u.role})
    return jsonify(success=True, token=token, role=u.role)

# --- 2. PARTNER DASHBOARD ---
@app.route('/api/partner/profile', methods=['GET', 'PUT'])
@jwt_required()
def partner_profile():
    u = get_auth_user()
    if not u or u.role != 'partner': return jsonify(error="Unauthorized"), 403
    
    p = u.partner_profile
    if not p: # Auto-healing
        p = Partner(user_id=u.id, name="Mon Commerce")
        db.session.add(p); db.session.commit()

    if request.method == 'PUT':
        d = request.json
        p.name = d.get('name', p.name)
        p.category = d.get('category', p.category)
        p.description = d.get('description', p.description)
        p.phone = d.get('phone', p.phone)
        if 'hours' in d: p.hours_json = json.dumps(d['hours'])
        db.session.commit()
        return jsonify(success=True)

    hours = json.loads(p.hours_json) if p.hours_json else {}
    return jsonify({
        "name": p.name, "category": p.category, "description": p.description,
        "phone": p.phone, "hours": hours, "address": p.address,
        "stats": { "offers": len(p.offers), "bookings": len(p.bookings) }
    })

@app.route('/api/partner/offers', methods=['GET', 'POST'])
@jwt_required()
def partner_offers():
    u = get_auth_user()
    p = u.partner_profile
    
    if request.method == 'POST':
        d = request.json
        o = Offer(partner_id=p.id, title=d['title'], description=d.get('description'), 
                  offer_type=d['type'], value=d['value'], is_active=True)
        db.session.add(o); db.session.commit()
        return jsonify(success=True)

    return jsonify([{"id":o.id, "title":o.title, "type":o.offer_type, "value":o.value, "active":o.is_active} for o in p.offers])

# --- 3. AGENDA & BOOKINGS ---
@app.route('/api/partner/bookings', methods=['GET'])
@jwt_required()
def partner_bookings():
    u = get_auth_user()
    p = u.partner_profile
    bookings = Booking.query.filter_by(partner_id=p.id).all()
    
    res = []
    for b in bookings:
        m = Member.query.get(b.member_id)
        client_name = f"{m.first_name} {m.last_name}" if m else "Client Inconnu"
        res.append({
            "id": b.id, "client": client_name, "date": b.booking_date, 
            "time": b.booking_time, "service": b.service_name, "status": b.status
        })
    return jsonify(res)

# --- 4. MEMBER & SEARCH ---
@app.route('/api/partners/search')
def search_partners():
    q = request.args.get('q', '').lower()
    partners = Partner.query.filter(Partner.name.ilike(f"%{q}%")).all()
    return jsonify([{"id": p.id, "name": p.name, "category": p.category, "img": p.image_url} for p in partners])

@app.route('/api/bookings/create', methods=['POST'])
@jwt_required()
def create_booking():
    user = get_auth_user()
    d = request.json
    if not user.member_profile: return jsonify(error="Profil membre requis"), 400
    
    p = Partner.query.get(d['partner_id'])
    b = Booking(
        partner_id=p.id, member_id=user.member_profile.id,
        booking_date=d['date'], booking_time=d['time'], service_name=d['service']
    )
    db.session.add(b); db.session.commit()
    
    if p.phone: send_sms(p.phone, f"PEP's: Nouveau RDV le {d['date']} à {d['time']}")
    return jsonify(success=True)

# --- 5. SYSTEM SETUP ---
@app.route('/api/setup_v14')
def setup_v14():
    db.create_all()
    if not User.query.filter_by(email='partner@peps.swiss').first():
        u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner')
        db.session.add(u); db.session.commit()
        p = Partner(user_id=u.id, name="Mario Pizza", category="Restaurant", phone="+33600000000")
        db.session.add(p); db.session.commit()
        db.session.add(Offer(partner_id=p.id, title="Pizza Offerte", offer_type="flash", value="100%"))
        
        u2 = User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin')
        db.session.add(u2); db.session.commit()
    return jsonify(success=True, msg="V14 Installed")

@app.route('/api/nuke_db')
def nuke():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all()
    return "V14 Clean"

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
