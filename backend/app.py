import os
import json
import math
import uuid
import random
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
from apscheduler.schedulers.background import BackgroundScheduler
from pywebpush import webpush, WebPushException
from models import db, User, Partner, Member, FlashOffer, FlashClaim, Offer, Company, Booking, Pack

app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

app.config['SECRET_KEY'] = 'peps_v15_secure'
app.config['JWT_SECRET_KEY'] = 'peps_v15_jwt'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///peps.db').replace("postgres://", "postgresql://")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)

# --- 🔔 SERVICE PUSH INTÉGRÉ ---
def send_web_push(subscription_json, title, body, data=None):
    VAPID_PRIVATE = os.getenv('VAPID_PRIVATE_KEY')
    VAPID_CLAIMS = {"sub": os.getenv('VAPID_CLAIM_EMAIL', "mailto:admin@peps.world")}
    if not VAPID_PRIVATE or not subscription_json: return
    try:
        sub_info = json.loads(subscription_json) if isinstance(subscription_json, str) else subscription_json
        webpush(
            subscription_info=sub_info,
            data=json.dumps({"title": title, "body": body, "icon": "/logo.jpg", "data": data or {"url": "/"}}),
            vapid_private_key=VAPID_PRIVATE,
            vapid_claims=VAPID_CLAIMS
        )
    except Exception as e: print(f"Push Error: {e}")

# --- 🧮 GÉOLOCALISATION ---
def calculate_distance(lat1, lon1, lat2, lon2):
    if not all([lat1, lon1, lat2, lon2]): return 9999
    R = 6371 # Rayon Terre
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# --- 🤖 AUTOMATISATION ---
def expire_flash_offers():
    with app.app_context():
        now = datetime.utcnow()
        FlashOffer.query.filter(FlashOffer.active==True, FlashOffer.expires_at < now).update({FlashOffer.active: False})
        db.session.commit()

scheduler = BackgroundScheduler()
scheduler.add_job(expire_flash_offers, 'interval', minutes=5)
scheduler.start()

# --- ⚡ PARTNER FLASH ROUTES ---
@app.route('/api/partner/flash-offers', methods=['GET', 'POST'])
@jwt_required()
def manage_flash():
    uid = int(get_jwt_identity()['id']) if isinstance(get_jwt_identity(), dict) else int(get_jwt_identity())
    u = User.query.get(uid)
    p = u.partner_profile
    if not p: return jsonify(error="Not partner"), 403

    if request.method == 'POST':
        d = request.json
        expires = datetime.utcnow() + timedelta(hours=int(d.get('duration_hours', 24)))
        
        offer = FlashOffer(
            partner_id=p.id, title=d['title'], discount=d['discount'],
            slots_total=int(d['slots']), radius_km=int(d['radius']),
            expires_at=expires, active=True
        )
        db.session.add(offer)
        db.session.commit()
        
        # 🔔 PUSH
        users = User.query.filter(User.role=='member', User.push_subscription.isnot(None)).all()
        count = 0
        for member in users:
            dist = calculate_distance(p.latitude, p.longitude, member.latitude, member.longitude)
            if dist <= offer.radius_km:
                send_web_push(member.push_subscription, f"⚡ Flash: {d['title']}", f"{d['discount']} chez {p.name} ({dist:.1f}km)", {"url": "/"})
                count += 1
        
        return jsonify(success=True, pushed_to=count)

    offers = FlashOffer.query.filter_by(partner_id=p.id).order_by(FlashOffer.created_at.desc()).all()
    return jsonify([{
        "id": o.id, "title": o.title, "discount": o.discount, 
        "taken": o.slots_taken, "total": o.slots_total, 
        "active": o.active and o.expires_at > datetime.utcnow(),
        "end": o.expires_at.isoformat()
    } for o in offers])

# --- 🏃 MEMBER ROUTES ---
@app.route('/api/member/flash-offers/nearby', methods=['POST'])
@jwt_required()
def nearby_flash():
    d = request.json
    lat, lng = d.get('lat'), d.get('lng')
    
    uid = int(get_jwt_identity()['id']) if isinstance(get_jwt_identity(), dict) else int(get_jwt_identity())
    u = User.query.get(uid)
    if lat and lng:
        u.latitude = lat; u.longitude = lng; db.session.commit()

    offers = FlashOffer.query.filter(FlashOffer.active==True, FlashOffer.expires_at > datetime.utcnow()).all()
    res = []
    for o in offers:
        if o.slots_taken >= o.slots_total: continue
        dist = calculate_distance(lat, lng, o.partner.latitude, o.partner.longitude)
        if dist <= o.radius_km * 1.5:
            res.append({
                "id": o.id, "title": o.title, "discount": o.discount,
                "partner": o.partner.name, "dist": round(dist, 1),
                "left": o.slots_total - o.slots_taken, "end": o.expires_at.isoformat()
            })
            
    return jsonify(sorted(res, key=lambda x: x['dist']))

@app.route('/api/member/flash-offers/<int:fid>/claim', methods=['POST'])
@jwt_required()
def claim_flash(fid):
    uid = int(get_jwt_identity()['id']) if isinstance(get_jwt_identity(), dict) else int(get_jwt_identity())
    
    try:
        # Verrouillage Pessimiste (Postgres)
        if 'postgres' in app.config['SQLALCHEMY_DATABASE_URI']:
            f = db.session.query(FlashOffer).with_for_update().get(fid)
        else:
            f = FlashOffer.query.get(fid)

        if not f.active or f.expires_at < datetime.utcnow() or f.slots_taken >= f.slots_total:
            return jsonify(error="Trop tard !"), 400

        if FlashClaim.query.filter_by(flash_offer_id=fid, user_id=uid).first():
            return jsonify(error="Déjà pris !"), 400

        f.slots_taken += 1
        code = f"FLASH-{fid}-{uid}-{random.randint(1000,9999)}"
        db.session.add(FlashClaim(flash_offer_id=fid, user_id=uid, qr_code=code))
        db.session.commit()
        
        return jsonify(success=True, qr=code, partner=f.partner.name)
    except:
        db.session.rollback()
        return jsonify(error="Erreur technique"), 500

# --- 🔔 PUSH SUB ---
@app.route('/api/member/push/subscribe', methods=['POST'])
@jwt_required()
def subscribe_push():
    uid = int(get_jwt_identity()['id']) if isinstance(get_jwt_identity(), dict) else int(get_jwt_identity())
    u = User.query.get(uid)
    u.push_subscription = json.dumps(request.json)
    db.session.commit()
    return jsonify(success=True)

@app.route('/api/push/vapid-key', methods=['GET'])
def vapid_key():
    return jsonify(key=os.getenv('VAPID_PUBLIC_KEY'))

# --- AUTH & SETUP ---
@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        token = create_access_token(identity=str(u.id), additional_claims={'role': u.role})
        return jsonify(token=token, role=u.role)
    return jsonify(error="Erreur"), 401

@app.route('/api/setup_v15')
def setup_v15():
    db.create_all()
    if not User.query.filter_by(email='partner@peps.swiss').first():
        u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner')
        db.session.add(u); db.session.commit()
        p = Partner(user_id=u.id, name="Mario Pizza", latitude=47.1368, longitude=7.2468)
        db.session.add(p); db.session.commit()
        db.session.add(FlashOffer(partner_id=p.id, title="-50% Pizza", discount="-50%", slots_total=5, radius_km=50, expires_at=datetime.utcnow()+timedelta(hours=2)))
        
        m = User(email='member@peps.swiss', password_hash=generate_password_hash('123456'), role='member')
        db.session.add(m); db.session.commit()
        db.session.add(Member(user_id=m.id))
        db.session.commit()
    return jsonify(success=True)

@app.route('/api/nuke_db')
def nuke():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all()
    return "Clean V15"

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
