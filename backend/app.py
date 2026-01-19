
import os
import random
import string
import math
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, desc, Date, cast
from models import db, User, Partner, Offer, Member, PrivilegeUsage, followers, Company

app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

# SÉCURITÉ V16
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'peps_v16_secure_dev')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'peps_v16_jwt_dev')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///peps.db').replace("postgres://", "postgresql://")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)

def get_auth_user():
    try:
        identity = get_jwt_identity()
        uid = int(identity) if isinstance(identity, str) else identity.get('id')
        return User.query.get(uid)
    except: return None

def generate_validation_code(pid, mid):
    """Génère un code unique avec hash court"""
    timestamp = int(datetime.utcnow().timestamp())
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"PRIV-{pid}-{mid}-{timestamp}-{suffix}"

def calculate_distance(lat1, lon1, lat2, lon2):
    """Formule Haversine pour calculer la distance GPS en km"""
    if not lat1 or not lat2: return 9999
    R = 6371  # Rayon de la Terre en km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# --- ROUTES PARTNER V16 ---

@app.route('/api/partner/flash-offers', methods=['GET', 'POST'])
@jwt_required()
def partner_flash():
    u = get_auth_user()
    if not u or u.role != 'partner': return jsonify(error="Unauthorized"), 403
    p = u.partner_profile
    
    if request.method == 'POST':
        d = request.json
        # Création Offre Flash
        o = Offer(partner_id=p.id, title=d['title'], discount_val=d['discount'], 
                  offer_type='flash', is_permanent=False, stock=int(d.get('slots', 5)), active=True)
        db.session.add(o); db.session.commit()
        return jsonify(success=True)

    # Liste Offres Flash
    offers = Offer.query.filter_by(partner_id=p.id, offer_type='flash').all()
    return jsonify([{
        "id": o.id, "title": o.title, "discount": o.discount_val, 
        "taken": 0, "total": o.stock, "active": o.active, "end": (o.created_at + timedelta(hours=24)).isoformat()
    } for o in offers])

@app.route('/api/partner/privileges', methods=['GET', 'POST', 'PUT', 'DELETE'])
@jwt_required()
def partner_privileges():
    u = get_auth_user()
    p = u.partner_profile
    
    if request.method == 'POST':
        d = request.json
        o = Offer(partner_id=p.id, title=d['title'], description=d.get('description'),
                  offer_type='permanent', is_permanent=True, discount_val=d.get('type'), active=True)
        db.session.add(o); db.session.commit()
        return jsonify(success=True)

    if request.method == 'PUT': # Toggle Active
        oid = request.args.get('id')
        o = Offer.query.get(oid)
        if o and o.partner_id == p.id:
            o.active = not o.active
            db.session.commit()
        return jsonify(success=True)

    if request.method == 'DELETE':
        oid = request.args.get('id')
        o = Offer.query.get(oid)
        if o and o.partner_id == p.id:
            db.session.delete(o)
            db.session.commit()
        return jsonify(success=True)

    # GET List
    offers = Offer.query.filter_by(partner_id=p.id, offer_type='permanent').all()
    today = datetime.utcnow().date()
    res = []
    for o in offers:
        total_uses = PrivilegeUsage.query.filter_by(offer_id=o.id).count()
        # Utilisation de cast(Date) pour compatibilité PostgreSQL
        today_uses = PrivilegeUsage.query.filter(PrivilegeUsage.offer_id==o.id, cast(PrivilegeUsage.used_at, Date)==today).count()
        res.append({
            "id": o.id, "title": o.title, "description": o.description, "type": o.discount_val,
            "active": o.active, "total_uses": total_uses, "today_uses": today_uses
        })
    return jsonify(res)

@app.route('/api/partner/statistics')
@jwt_required()
def partner_stats():
    u = get_auth_user()
    p = u.partner_profile
    
    # 1. Top Privilèges
    top_offers = db.session.query(PrivilegeUsage.offer_title, func.count(PrivilegeUsage.id).label('count'))\
        .filter(PrivilegeUsage.partner_id == p.id)\
        .group_by(PrivilegeUsage.offer_title).order_by(desc('count')).limit(3).all()
    
    # 2. Graphique 7 jours
    graph_data = []
    for i in range(6, -1, -1):
        d = datetime.utcnow().date() - timedelta(days=i)
        c = PrivilegeUsage.query.filter(PrivilegeUsage.partner_id==p.id, cast(PrivilegeUsage.used_at, Date)==d).count()
        graph_data.append({"name": d.strftime("%d/%m"), "uses": c})

    # 3. Stats Globales
    today = datetime.utcnow().date()
    total_today = PrivilegeUsage.query.filter(PrivilegeUsage.partner_id==p.id, cast(PrivilegeUsage.used_at, Date)==today).count()
    total_month = PrivilegeUsage.query.filter(PrivilegeUsage.partner_id==p.id).count()

    return jsonify({
        "total_month": total_month,
        "today": total_today,
        "top_offers": [{"title": t[0], "count": t[1]} for t in top_offers],
        "graph_data": graph_data
    })

# --- ROUTES MEMBER V16 ---

@app.route('/api/member/privileges/available')
def available_privileges():
    # Tous les privilèges permanents actifs
    offers = Offer.query.filter_by(offer_type='permanent', active=True).all()
    return jsonify([{
        "id": o.id, "title": o.title, "type": o.discount_val, "desc": o.description,
        "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url, "lat": o.partner.latitude, "lng": o.partner.longitude}
    } for o in offers])

@app.route('/api/member/privileges/<int:oid>/use', methods=['POST'])
@jwt_required()
def use_privilege(oid):
    u = get_auth_user()
    if not u or not u.member_profile: return jsonify(error="Profil membre requis"), 400
    
    offer = Offer.query.get_or_404(oid)
    if not offer.active: return jsonify(error="Privilège inactif"), 400
    
    # Génération Code Unique (ILLIMITÉ)
    code = generate_validation_code(offer.partner_id, u.member_profile.id)
    
    usage = PrivilegeUsage(
        member_id=u.member_profile.id,
        partner_id=offer.partner_id,
        offer_id=offer.id,
        offer_title=offer.title,
        validation_code=code
    )
    db.session.add(usage)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "code": code,
        "timestamp": usage.used_at.isoformat(),
        "partner_name": offer.partner.name,
        "privilege_title": offer.title
    })

@app.route('/api/member/history')
@jwt_required()
def member_history():
    u = get_auth_user()
    if not u or not u.member_profile: return jsonify([])
    
    # Historique Privilèges
    privileges = PrivilegeUsage.query.filter_by(member_id=u.member_profile.id).order_by(desc(PrivilegeUsage.used_at)).all()
    return jsonify([{
            "partner": Partner.query.get(p.partner_id).name, 
            "title": p.offer_title, 
            "date": p.used_at.strftime("%d/%m/%Y %H:%M"), "code": p.validation_code
        } for p in privileges])

# --- ROUTES SEARCH V18.1 ---
@app.route('/api/partners/search')
def search_partners():
    """Recherche de partenaires par nom, ville ou catégorie - Retourne les OFFRES"""
    from sqlalchemy import or_
    q = request.args.get('q', '').lower()
    cat = request.args.get('category', 'all')
    
    query = Partner.query
    if cat != 'all': 
        query = query.filter(Partner.category == cat)
    if q: 
        query = query.filter(or_(
            Partner.name.ilike(f"%{q}%"), 
            Partner.city.ilike(f"%{q}%")
        ))
    
    partners = query.limit(50).all()
    
    # Retourner les offres actives de ces partenaires
    results = []
    for p in partners:
        for o in p.offers:
            if o.active:
                results.append({
                    "id": o.id,
                    "title": o.title,
                    "type": o.discount_val,
                    "desc": o.description,
                    "partner": {
                        "id": p.id,
                        "name": p.name,
                        "img": p.image_url,
                        "lat": p.latitude,
                        "lng": p.longitude
                    }
                })
    
    return jsonify(results)

@app.route('/api/partners/nearby')
def nearby_partners():
    """Retourne les partenaires à proximité (géolocalisation)"""
    try:
        user_lat = float(request.args.get('lat'))
        user_lng = float(request.args.get('lng'))
        radius = float(request.args.get('radius', 20))  # Rayon en km
        category = request.args.get('category', 'all')
    except:
        return jsonify(error="Coordonnées invalides"), 400

    # Récupérer tous les partenaires avec GPS
    partners = Partner.query.filter(Partner.latitude != None).all()
    results = []

    for p in partners:
        dist = calculate_distance(user_lat, user_lng, p.latitude, p.longitude)
        
        if dist <= radius:
            if category == 'all' or p.category == category:
                # Compter les offres actives
                offer_count = Offer.query.filter_by(partner_id=p.id, active=True).count()
                results.append({
                    "id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "lat": p.latitude,
                    "lng": p.longitude,
                    "img": p.image_url,
                    "distance": round(dist, 1),
                    "offers_count": offer_count
                })
    
    # Tri du plus proche au plus loin
    results.sort(key=lambda x: x['distance'])
    return jsonify(results)

# --- AUTH & SYSTEM ---

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        token = create_access_token(identity=str(u.id), additional_claims={'role': u.role})
        return jsonify(token=token, role=u.role)
    return jsonify(error="Incorrect"), 401

@app.route('/api/setup_v17')
def setup_v17():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all()
    
    # Partenaires Test
    partners = [
        ("Mario Pizza", "Restaurant", 46.5197, 6.6323),
        ("Coiffure Bella", "Beauté", 46.2044, 6.1432),
        ("Fitness Pro", "Sport", 46.4312, 6.9107)
    ]
    
    for name, cat, lat, lng in partners:
        email = f"partner.{name.split()[0].lower()}@peps.swiss"
        u = User(email=email, password_hash=generate_password_hash('123456'), role='partner')
        db.session.add(u); db.session.commit()
        p = Partner(user_id=u.id, name=name, category=cat, latitude=lat, longitude=lng, image_url="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=500")
        db.session.add(p); db.session.commit()
        
        # Offres Permanentes
        db.session.add(Offer(partner_id=p.id, title=f"Bienvenue chez {name}", offer_type='permanent', is_permanent=True, discount_val="-10%", active=True))
        db.session.add(Offer(partner_id=p.id, title="Cadeau Fidélité", offer_type='permanent', is_permanent=True, discount_val="Offert", active=True))

    # Membres Test
    if not User.query.filter_by(email='member@peps.swiss').first():
        u = User(email='member@peps.swiss', password_hash=generate_password_hash('123456'), role='member')
        db.session.add(u); db.session.commit()
        db.session.add(Member(user_id=u.id, first_name="Jean"))
        db.session.commit()
    
    # Admin Test
    if not User.query.filter_by(email='admin@peps.swiss').first():
        u = User(email='admin@peps.swiss', password_hash=generate_password_hash('123456'), role='admin')
        db.session.add(u); db.session.commit()
    
    # Company Test
    if not User.query.filter_by(email='company@peps.swiss').first():
        u = User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin')
        db.session.add(u); db.session.commit()
    
    # Both Test (Partner + Member)
    if not User.query.filter_by(email='both@peps.swiss').first():
        u = User(email='both@peps.swiss', password_hash=generate_password_hash('123456'), role='partner')
        db.session.add(u); db.session.commit()
        # Créer le partenaire
        p = Partner(user_id=u.id, name="Both Commerce", category="Commerce", latitude=46.5197, longitude=6.6323, image_url="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=500")
        db.session.add(p); db.session.commit()
        # Créer le membre
        db.session.add(Member(user_id=u.id, first_name="Both"))
        db.session.commit()

    return jsonify(success=True, msg="V17 Installed")

@app.route('/api/nuke_db')
def nuke():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all()
    return "Clean V17"

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))