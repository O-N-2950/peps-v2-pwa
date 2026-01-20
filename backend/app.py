import os
import stripe
import random
import string
import secrets
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, cast, Date
from apscheduler.schedulers.background import BackgroundScheduler
from flask_caching import Cache
from models import db, User, Member, Pack, Subscription, AccessSlot, Partner, Offer, PrivilegeUsage, ViewLog, ClickLog, ActivitySector
from stripe_service import sync_v19_products, create_checkout_session, handle_subscription_success
from migrate_v20 import run_migration_logic

app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

app.config['SECRET_KEY'] = 'peps_v19_prod_key'
app.config['JWT_SECRET_KEY'] = 'peps_v19_jwt_key'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///peps.db').replace("postgres://", "postgresql://")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

db.init_app(app)
jwt = JWTManager(app)

# CACHE REDIS V20
redis_url = os.getenv('REDIS_URL')
cache_config = {
    'CACHE_TYPE': 'RedisCache' if redis_url else 'SimpleCache',
    'CACHE_REDIS_URL': redis_url,
    'CACHE_DEFAULT_TIMEOUT': 300
}
cache = Cache(app, config=cache_config)

# Maintenance (Synchrone)
def maintenance():
    with app.app_context():
        try:
            Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0).update({Offer.active: False})
            db.session.commit()
        except: db.session.rollback()

if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    scheduler = BackgroundScheduler()
    scheduler.add_job(maintenance, 'interval', minutes=30)
    scheduler.start()

def get_auth_user():
    try:
        uid = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        return User.query.get(uid)
    except: return None

# --- 🛠️ SETUP V19 ---
@app.route('/api/setup_v19')
def setup_v19():
    db.create_all()
    
    # 1. Création des Packs
    if not Pack.query.first():
        packs = [
            ("Solo", "INDIVIDUAL", 1, 49.0),
            ("Duo", "FAMILY", 2, 89.0),
            ("Famille (5)", "FAMILY", 5, 199.0),
            ("TPE (10)", "BUSINESS", 10, 390.0),
            ("PME (30)", "BUSINESS", 30, 1050.0)
        ]
        for n, c, s, p in packs:
            db.session.add(Pack(name=n, category=c, max_slots=s, price_chf=p))
    db.session.commit()
    
    try: sync_v19_products()
    except: pass

    # 2. Compte Famille Test
    if not User.query.filter_by(email='family@peps.swiss').first():
        u = User(email='family@peps.swiss', password_hash=generate_password_hash('123456'), role='member')
        db.session.add(u); db.session.commit()
        m = Member(user_id=u.id, first_name="Papa", last_name="Peppa")
        db.session.add(m); db.session.commit()
        
        # Abo 5 slots
        pack = Pack.query.filter_by(name="Famille (5)").first()
        if pack:
            sub = Subscription(member_id=m.id, pack_id=pack.id, status='active', current_period_end=datetime(2030,1,1))
            db.session.add(sub); db.session.commit()
            # Slot 1 (Owner)
            db.session.add(AccessSlot(subscription_id=sub.id, member_id=m.id, status='active'))
            # 4 Slots Vides
            for _ in range(4): db.session.add(AccessSlot(subscription_id=sub.id))
            db.session.commit()
    
    # 3. Compte Admin Test
    if not User.query.filter_by(email='admin@peps.swiss').first():
        u = User(email='admin@peps.swiss', password_hash=generate_password_hash('123456'), role='admin')
        db.session.add(u); db.session.commit()
    
    # 4. Compte Partner Test
    if not User.query.filter_by(email='partner@peps.swiss').first():
        u = User(email='partner@peps.swiss', password_hash=generate_password_hash('123456'), role='partner')
        db.session.add(u); db.session.commit()
        p = Partner(user_id=u.id, name="Mario Pizza", address="Rue de Test 1", city="Gen\u00e8ve", category="Restaurant")
        db.session.add(p); db.session.commit()
    
    # 5. Compte Company Test
    if not User.query.filter_by(email='company@peps.swiss').first():
        u = User(email='company@peps.swiss', password_hash=generate_password_hash('123456'), role='company_admin')
        db.session.add(u); db.session.commit()
        m = Member(user_id=u.id, first_name="Acme", last_name="Corp")
        db.session.add(m); db.session.commit()
        
        # Abo PME 30 slots
        pack = Pack.query.filter_by(name="PME (30)").first()
        if pack:
            sub = Subscription(member_id=m.id, pack_id=pack.id, status='active', current_period_end=datetime(2030,1,1))
            db.session.add(sub); db.session.commit()
            # Slot 1 (Owner)
            db.session.add(AccessSlot(subscription_id=sub.id, member_id=m.id, status='active'))
            # 29 Slots Vides
            for _ in range(29): db.session.add(AccessSlot(subscription_id=sub.id))
            db.session.commit()

    return jsonify(success=True, msg="V19 Ready")

@app.route('/api/nuke_db')
def nuke():
    with db.engine.connect() as c: 
        c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
        c.commit()
    db.create_all()
    return "V19 Clean"

# --- 👥 GESTION GROUPE ---
@app.route('/api/group/manage')
@jwt_required()
def group_manage():
    u = get_auth_user()
    m = u.member_profile
    if not m or not m.owned_subscription: return jsonify(error="Pas d'abonnement"), 403
    
    sub = m.owned_subscription
    slots_data = []
    for s in sub.slots:
        user_info = None
        if s.member_id:
            mem = Member.query.get(s.member_id)
            user_info = f"{mem.first_name} {mem.last_name}"
        slots_data.append({
            "id": s.id, "status": s.status, "email": s.invited_email,
            "user": user_info, "is_me": s.member_id == m.id, "token": s.invitation_token
        })
    
    pack = Pack.query.get(sub.pack_id)
    return jsonify(slots=slots_data, pack_name=pack.name)

@app.route('/api/group/invite', methods=['POST'])
@jwt_required()
def invite():
    u = get_auth_user()
    sub = u.member_profile.owned_subscription
    email = request.json.get('email')
    
    slot = AccessSlot.query.filter_by(subscription_id=sub.id, status='empty').first()
    if not slot: return jsonify(error="Complet"), 400
    
    token = secrets.token_urlsafe(16)
    slot.invitation_token = token
    slot.invited_email = email
    slot.status = 'invited'
    db.session.commit()
    
    FRONTEND_URL = os.getenv('DOMAIN_URL', "https://www.peps.swiss")
    return jsonify(success=True, link=f"{FRONTEND_URL}/register?token={token}")

@app.route('/api/group/revoke', methods=['POST'])
@jwt_required()
def revoke():
    u = get_auth_user()
    slot = AccessSlot.query.get(request.json.get('slot_id'))
    if slot.subscription_id != u.member_profile.owned_subscription.id: return jsonify(error="Non"), 403
    if slot.member_id == u.member_profile.id: return jsonify(error="Impossible"), 400
    
    slot.member_id = None
    slot.status = 'empty'
    slot.invited_email = None
    slot.invitation_token = None
    db.session.commit()
    return jsonify(success=True)

# --- 💳 STRIPE ---
@app.route('/api/subscription/checkout', methods=['POST'])
@jwt_required()
def checkout():
    u = get_auth_user()
    res = create_checkout_session(u.member_profile.id, request.json['pack_id'])
    return jsonify(res)

@app.route('/api/webhooks/stripe', methods=['POST'])
def webhook():
    payload = request.get_data(as_text=True)
    sig = request.headers.get('Stripe-Signature')
    try: event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except: return "Error", 400

    if event['type'] == 'checkout.session.completed':
        s = event['data']['object']
        ref = s.get('client_reference_id')
        if ref:
            mid, pid = ref.split('|')
            with app.app_context():
                handle_subscription_success(s.get('subscription'), int(mid), int(pid), s.get('expires_at', 0)+31536000)
    return jsonify(success=True)

# --- AUTH ---
@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if User.query.filter_by(email=d['email']).first(): return jsonify(error="Email pris"), 400
    
    u = User(email=d['email'], password_hash=generate_password_hash(d['password']), role=d.get('role','member'))
    db.session.add(u); db.session.commit()
    
    m = Member(user_id=u.id, first_name=d.get('first_name'), last_name=d.get('last_name'), 
               address=d.get('address'), city=d.get('city'), dob=d.get('dob'))
    db.session.add(m); db.session.commit()

    # Token Invitation
    if d.get('token'):
        slot = AccessSlot.query.filter_by(invitation_token=d['token'], status='invited').first()
        if slot:
            slot.member_id = m.id
            slot.status = 'active'
            slot.invitation_token = None
            db.session.commit()
            
    return jsonify(success=True, token=create_access_token(identity=str(u.id), additional_claims={'role':u.role}), role=u.role)

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        return jsonify(token=create_access_token(identity=str(u.id), additional_claims={'role': u.role}), role=u.role)
    return jsonify(error="Incorrect"), 401

# --- PARTENAIRE & MEMBER ---
@app.route('/api/partner/stats')
@jwt_required()
def p_stats():
    u = get_auth_user()
    p = u.partner_profile
    views = ViewLog.query.filter_by(partner_id=p.id).count()
    clicks = ClickLog.query.filter_by(partner_id=p.id).count()
    return jsonify({"views":views, "clicks":clicks})

@app.route('/api/packages')
def packs():
    return jsonify([{"id":p.id, "name":p.name, "category":p.category, "slots":p.max_slots, "price":p.price_chf} for p in Pack.query.all()])

@app.route('/api/member/profile')
@jwt_required()
def me():
    u = get_auth_user()
    m = u.member_profile
    return jsonify({
        "name": f"{m.first_name}", 
        "premium": m.is_premium,
        "owner": m.owned_subscription is not None
    })

# FIX 405
@app.route('/api/partner/privileges', methods=['GET', 'POST'])
@jwt_required()
def partner_privs():
    u = get_auth_user()
    if request.method == 'POST': return jsonify(success=True) # Dummy for now
    return jsonify([])

@app.route('/api/partner/flash-offers', methods=['GET', 'POST'])
@jwt_required()
def partner_flash():
    u = get_auth_user()
    if request.method == 'POST': return jsonify(success=True) # Dummy for now
    return jsonify([])

@app.route('/api/member/history')
@jwt_required()
def member_history(): return jsonify([])

@app.route('/api/partners/search')
def search_partners():
    q = request.args.get('q', '').lower()
    cat = request.args.get('category', 'all')
    query = Partner.query
    if cat != 'all': query = query.filter(Partner.category == cat)
    if q: query = query.filter(db.or_(Partner.name.ilike(f"%{q}%"), Partner.city.ilike(f"%{q}%")))
    return jsonify([{ "id": p.id, "name": p.name, "category": p.category, "city": p.city, "img": p.image_url, "lat": p.latitude, "lng": p.longitude, "offer_count": len([o for o in p.offers if o.active]) } for p in query.limit(50).all()])

@app.route('/api/member/privileges/<int:oid>/use', methods=['POST'])
@jwt_required()
def use_priv(oid):
    u = get_auth_user()
    m = u.member_profile
    is_exempt = u.role in ['admin', 'partner', 'company_admin']
    if not m.is_premium and not is_exempt: return jsonify(error="ABO_REQUIRED"), 403
    
    o = Offer.query.get_or_404(oid)
    code = f"PRIV-{o.partner_id}-{m.id}-{int(datetime.utcnow().timestamp())}"
    db.session.add(PrivilegeUsage(member_id=m.id, partner_id=o.partner_id, offer_id=o.id, offer_title=o.title, validation_code=code))
    db.session.commit()
    return jsonify(success=True, code=code, partner_name=o.partner.name, privilege_title=o.title)

# --- 🔧 ADMIN V20 ROUTES ---
@app.route('/api/admin/stats_v20')
@jwt_required()
@cache.cached(timeout=60)
def admin_stats_v20():
    u = get_auth_user()
    if not u or u.role != 'admin': return jsonify(error="Forbidden"), 403
    return jsonify({
        "mrr": Subscription.query.filter_by(status='active').count() * 49,
        "members": Member.query.count(),
        "partners": Partner.query.count(),
        "active_partners": Partner.query.join(Offer).filter(Offer.active==True).distinct().count(),
        "usage": PrivilegeUsage.query.count()
    })

@app.route('/api/admin/partners')
@jwt_required()
def admin_partners_list():
    u = get_auth_user()
    if not u or u.role != 'admin': return jsonify(error="Forbidden"), 403
    page = request.args.get('page', 1, type=int)
    partners = Partner.query.order_by(Partner.id.desc()).paginate(page=page, per_page=20, error_out=False)
    return jsonify({
        "items": [{"id": p.id, "name": p.name, "category": p.category, "email": p.owner.email if p.owner else None, "offers": len(p.offers), "city": p.city} for p in partners.items],
        "total": partners.total, "pages": partners.pages
    })

@app.route('/api/admin/run_migration')
@jwt_required()
def trigger_migration():
    u = get_auth_user()
    if not u or u.role != 'admin': return jsonify(error="Forbidden"), 403
    res = run_migration_logic()
    return jsonify(res)

# --- 🚀 OPTIMIZED PUBLIC ROUTES ---
@app.route('/api/partners/search_v2')
@cache.cached(timeout=120, query_string=True)
def search_v2():
    q = request.args.get('q', '').lower()
    cat = request.args.get('category', 'all')
    query = Partner.query
    if cat != 'all': query = query.filter(Partner.category == cat)
    if q: query = query.filter(db.or_(Partner.name.ilike(f"%{q}%"), Partner.city.ilike(f"%{q}%")))
    
    return jsonify([{
        "id": p.id, "name": p.name, "category": p.category, "city": p.city,
        "img": p.image_url, "lat": p.latitude, "lng": p.longitude,
        "offer_count": len([o for o in p.offers if o.active])
    } for p in query.limit(100).all()])

@app.route('/api/offers')
def get_offers():
    return jsonify([{ "id": o.id, "title": o.title, "type": o.offer_type, "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url} } for o in Offer.query.filter_by(active=True).all()])

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
