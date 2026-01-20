import os
import random
import stripe
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, or_, func, desc
from apscheduler.schedulers.background import BackgroundScheduler
# Imports locaux simples
from models import db, User, Partner, Offer, Member, PrivilegeUsage, Subscription, Referral, Company, Pack
from stripe_service import sync_stripe_products, create_checkout_session, create_portal_session, handle_subscription_success, extend_subscription

app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'peps_v18_3_fix_key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'peps_v18_3_fix_jwt')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///peps.db').replace("postgres://", "postgresql://")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

db.init_app(app)
jwt = JWTManager(app)

# Scheduler compatible mode synchrone
def maintenance_job():
    with app.app_context():
        try:
            Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0, Offer.active==True).update({Offer.active: False})
            db.session.commit()
        except: db.session.rollback()

if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
    scheduler = BackgroundScheduler()
    scheduler.add_job(maintenance_job, 'interval', minutes=30)
    scheduler.start()

def get_auth_user():
    try:
        uid = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        return User.query.get(uid)
    except: return None

def generate_referral_code(name):
    prefix = ''.join(e for e in name if e.isalnum()).upper()[:4]
    suffix = str(random.randint(1000, 9999))
    return f"{prefix}{suffix}"

# --- STRIPE ROUTES ---
@app.route('/api/stripe/create-checkout', methods=['POST'])
@jwt_required()
def checkout():
    u = get_auth_user()
    if not u.member_profile: return jsonify(error="Profil invalide"), 400
    res = create_checkout_session(u.member_profile.id)
    if "error" in res: return jsonify(res), 500
    return jsonify(res)

@app.route('/api/stripe/portal', methods=['POST'])
@jwt_required()
def portal():
    u = get_auth_user()
    res = create_portal_session(u.member_profile.id)
    if "error" in res: return jsonify(res), 500
    return jsonify(res)

@app.route('/api/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig = request.headers.get('Stripe-Signature')
    try: event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except: return "Error", 400

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        member_id = session.get('client_reference_id')
        if member_id:
            with app.app_context():
                handle_subscription_success(member_id, session.get('expires_at', 0) + 31536000)
                # Parrainage
                try:
                    m = Member.query.get(member_id)
                    if m and m.referred_by:
                        extend_subscription(m.referred_by, 1)
                        extend_subscription(m.id, 1)
                        ref = Referral.query.filter_by(referred_id=m.id, status='pending').first()
                        if ref: ref.status = 'rewarded'; db.session.commit()
                except: pass
    return jsonify(success=True)

# --- SETUP V18.3 ---
@app.route('/api/setup_v18')
def setup_v18():
    with app.app_context():
        db.create_all()
        
        # 1. Pack - Force création
        pack = Pack.query.filter_by(name="Abonnement Annuel").first()
        if not pack:
            pack = Pack(name="Abonnement Annuel", price_chf=49.0, access_count=1)
            db.session.add(pack)
            db.session.flush()  # Force l'écriture immédiate
            db.session.commit()
            print("✅ Pack créé")
        else:
            print("✅ Pack existe déjà")
        
        # 2. Sync Stripe
        try:
            sync_stripe_products()
            db.session.commit()  # Commit après sync Stripe
            print("✅ Stripe sync OK")
        except Exception as e:
            print(f"⚠️ Stripe sync error: {e}")
        
        # 3. Comptes Génériques
        accounts = [
            ('admin@peps.swiss', 'admin'),
            ('partner@peps.swiss', 'partner'),
            ('company@peps.swiss', 'company_admin'),
            ('member@peps.swiss', 'member'),
            ('active@peps.swiss', 'member')
        ]
        created = []
        pwd = generate_password_hash('123456')
        
        for email, role in accounts:
            if not User.query.filter_by(email=email).first():
                u = User(email=email, password_hash=pwd, role=role)
                db.session.add(u)
                db.session.flush()
                
                if role == 'partner':
                    p = Partner(user_id=u.id, name="Mario Pizza", category="Restaurant", city="Lausanne", latitude=46.5197, longitude=6.6323, image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500")
                    db.session.add(p)
                    db.session.flush()
                    db.session.add(Offer(partner_id=p.id, title="Pizza Offerte", offer_type="flash", active=True))
                    db.session.add(Offer(partner_id=p.id, title="-20% Carte", offer_type="permanent", active=True))
                
                if role == 'member':
                    status = 'active' if email.startswith('active') else 'inactive'
                    end = datetime(2030,1,1) if status == 'active' else None
                    ref = generate_referral_code(email.split('@')[0])
                    db.session.add(Member(user_id=u.id, first_name="Test", subscription_status=status, current_period_end=end, referral_code=ref))
                    
                created.append(email)
        
        db.session.commit()
        return jsonify(success=True, created=created)

@app.route('/api/nuke_db')
def nuke():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all()
    return "V18.3 Clean"

@app.route('/api/debug/pack')
def debug_pack():
    """Route de diagnostic pour comprendre pourquoi le Pack n'est pas créé"""
    results = {}
    
    # 1. Vérifier si le Pack existe
    pack = Pack.query.filter_by(name="Abonnement Annuel").first()
    results['pack_exists'] = pack is not None
    
    if pack:
        results['pack_id'] = pack.id
        results['pack_name'] = pack.name
        results['pack_price'] = pack.price_chf
        results['pack_stripe_price_id'] = pack.stripe_price_id
    
    # 2. Compter tous les Packs
    results['total_packs'] = Pack.query.count()
    
    # 3. Lister tous les Packs
    all_packs = Pack.query.all()
    results['all_packs'] = [
        {
            'id': p.id,
            'name': p.name,
            'price': p.price_chf,
            'stripe_price_id': p.stripe_price_id
        }
        for p in all_packs
    ]
    
    # 4. Tester la création directe
    try:
        if not pack:
            test_pack = Pack(name="Abonnement Annuel", price_chf=49.0, access_count=1)
            db.session.add(test_pack)
            db.session.flush()
            results['test_pack_id_before_commit'] = test_pack.id
            db.session.commit()
            results['test_pack_created'] = True
            results['test_pack_id_after_commit'] = test_pack.id
        else:
            results['test_pack_created'] = False
            results['reason'] = "Pack already exists"
    except Exception as e:
        results['test_pack_created'] = False
        results['error'] = str(e)
    
    return jsonify(results)

# --- AUTH & API ---
@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        token = create_access_token(identity=str(u.id), additional_claims={'role': u.role})
        return jsonify(token=token, role=u.role, is_both=u.is_both)
    return jsonify(error="Incorrect"), 401

@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if User.query.filter_by(email=d['email']).first(): return jsonify(error="Pris"), 400
    u = User(email=d['email'], password_hash=generate_password_hash(d['password']), role='member')
    db.session.add(u); db.session.commit()
    ref = generate_referral_code(d['email'].split('@')[0])
    m = Member(user_id=u.id, first_name=d.get('name', 'Nouveau'), referral_code=ref)
    if d.get('referral'):
        p = Member.query.filter_by(referral_code=d['referral']).first()
        if p: m.referred_by = p.id; db.session.add(Referral(referrer_id=p.id, referred_id=m.id))
    db.session.add(m); db.session.commit()
    return jsonify(success=True, token=create_access_token(identity=str(u.id), additional_claims={'role': 'member'}), role='member')

@app.route('/api/partners/search')
def search_partners():
    q = request.args.get('q', '').lower()
    cat = request.args.get('category', 'all')
    query = Partner.query
    if cat != 'all': query = query.filter(Partner.category == cat)
    if q: query = query.filter(or_(Partner.name.ilike(f"%{q}%"), Partner.city.ilike(f"%{q}%")))
    return jsonify([{ "id": p.id, "name": p.name, "category": p.category, "city": p.city, "img": p.image_url, "lat": p.latitude, "lng": p.longitude, "offer_count": len([o for o in p.offers if o.active]) } for p in query.limit(50).all()])

@app.route('/api/member/privileges/<int:oid>/use', methods=['POST'])
@jwt_required()
def use_priv(oid):
    u = get_auth_user()
    m = u.member_profile
    is_exempt = u.role in ['admin', 'partner', 'company_admin']
    is_active = m.subscription_status == 'active' and m.current_period_end and m.current_period_end > datetime.utcnow()
    if not is_active and not is_exempt: return jsonify(error="ABO_REQUIRED"), 403
    o = Offer.query.get_or_404(oid)
    code = f"PRIV-{o.partner_id}-{m.id}-{int(datetime.utcnow().timestamp())}"
    db.session.add(PrivilegeUsage(member_id=m.id, partner_id=o.partner_id, offer_id=o.id, offer_title=o.title, validation_code=code))
    db.session.commit()
    return jsonify(success=True, code=code, partner_name=o.partner.name, privilege_title=o.title)

@app.route('/api/member/status')
@jwt_required()
def member_status():
    u = get_auth_user()
    if not u or not u.member_profile: return jsonify(active=False)
    m = u.member_profile
    active = m.subscription_status == 'active' and m.current_period_end and m.current_period_end > datetime.utcnow()
    return jsonify(active=active, end_date=m.current_period_end)

@app.route('/api/member/referrals')
@jwt_required()
def referrals():
    u = get_auth_user()
    if not u.member_profile: return jsonify(count=0, list=[])
    refs = Referral.query.filter_by(referrer_id=u.member_profile.id).all()
    return jsonify({ "code": u.member_profile.referral_code, "count": len(refs), "list": [{"date": r.created_at.strftime("%d/%m"), "status": r.status} for r in refs] })

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
