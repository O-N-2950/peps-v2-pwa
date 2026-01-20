# 1. MONKEY PATCH OBLIGATOIRE
import eventlet
eventlet.monkey_patch()

import os
import stripe
import random
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, or_
from models import db, User, Partner, Offer, Member, PrivilegeUsage, Company, Subscription, Pack
from stripe_service import sync_stripe_products, create_checkout_session, create_portal_session, handle_subscription_success

app = Flask(__name__, static_folder='../frontend/dist')
CORS(app)

app.config['SECRET_KEY'] = 'peps_v18_2_secret_prod'
app.config['JWT_SECRET_KEY'] = 'peps_v18_2_jwt_prod'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///peps.db').replace("postgres://", "postgresql://")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

db.init_app(app)
jwt = JWTManager(app)

def get_auth_user():
    try:
        uid = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        return User.query.get(uid)
    except: return None

# --- 💳 STRIPE ROUTES ---
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
            # +1 an (fallback si invoice non traité immédiatement)
            handle_subscription_success(member_id, session.get('expires_at', 0) + 31536000)
            
    return jsonify(success=True)

# --- 🔎 RECHERCHE ---
@app.route('/api/partners/search')
def search_partners():
    q = request.args.get('q', '').lower()
    cat = request.args.get('category', 'all')
    
    query = Partner.query
    if cat != 'all': query = query.filter(Partner.category == cat)
    if q: query = query.filter(or_(Partner.name.ilike(f"%{q}%"), Partner.city.ilike(f"%{q}%")))
    
    return jsonify([{
        "id": p.id, "name": p.name, "category": p.category, "city": p.city,
        "img": p.image_url, "lat": p.latitude, "lng": p.longitude,
        "offer_count": len([o for o in p.offers if o.active])
    } for p in query.limit(50).all()])

# --- 🎁 USAGE SÉCURISÉ ---
@app.route('/api/member/privileges/<int:oid>/use', methods=['POST'])
@jwt_required()
def use_priv(oid):
    u = get_auth_user()
    m = u.member_profile
    
    # 🔒 VÉRIFICATION ABONNEMENT
    # Tolérance pour admin/partner
    is_exempt = u.role in ['admin', 'partner', 'company_admin']
    is_active = m.subscription_status == 'active' and m.current_period_end and m.current_period_end > datetime.utcnow()
    
    if not is_active and not is_exempt:
        return jsonify(error="ABO_REQUIRED", message="Réservé aux membres Premium"), 403

    o = Offer.query.get_or_404(oid)
    code = f"PRIV-{o.partner_id}-{m.id}-{int(datetime.utcnow().timestamp())}"
    db.session.add(PrivilegeUsage(member_id=m.id, partner_id=o.partner_id, offer_id=o.id, offer_title=o.title, validation_code=code))
    db.session.commit()
    return jsonify(success=True, code=code, partner_name=o.partner.name, privilege_title=o.title)

@app.route('/api/member/status')
@jwt_required()
def member_status():
    u = get_auth_user()
    m = u.member_profile
    if not m: return jsonify(active=False)
    is_active = m.subscription_status == 'active' and m.current_period_end and m.current_period_end > datetime.utcnow()
    return jsonify(active=is_active, end_date=m.current_period_end)

# --- 🛠️ SETUP V18.2 (CORRECTIF COMPTES) ---
@app.route('/api/setup_v18')
def setup_v18():
    db.create_all()
    
    # 1. Pack Abonnement & Stripe Sync
    if not Pack.query.filter_by(name="Abonnement Annuel").first():
        db.session.add(Pack(name="Abonnement Annuel", price_chf=49.0, access_count=1))
        db.session.commit()
    sync_stripe_products()
    
    # 2. Comptes Génériques (FIX)
    pwd = generate_password_hash('123456')
    accounts = [
        ('admin@peps.swiss', 'admin', 'admin123'),
        ('partner@peps.swiss', 'partner', '123456'),
        ('company@peps.swiss', 'company_admin', '123456'),
        ('member@peps.swiss', 'member', '123456'),
        ('both@peps.swiss', 'partner', '123456') # Hybride
    ]
    
    created = []
    for email, role, pass_plain in accounts:
        if not User.query.filter_by(email=email).first():
            u = User(email=email, password_hash=generate_password_hash(pass_plain), role=role)
            if email.startswith('both'): u.is_both = True
            db.session.add(u); db.session.commit()
            
            if role == 'partner' or u.is_both:
                p = Partner(user_id=u.id, name="Mario Pizza", category="Restaurant", city="Lausanne", latitude=46.5197, longitude=6.6323, image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500")
                db.session.add(p); db.session.commit()
                db.session.add(Offer(partner_id=p.id, title="Pizza Offerte", offer_type="flash", active=True))
            
            if role == 'member':
                # Membre par défaut INACTIF (pour tester paiement)
                db.session.add(Member(user_id=u.id, first_name="Jean", subscription_status='inactive'))
            
            if role == 'company_admin':
                db.session.add(Company(user_id=u.id, name="TechCorp"))
                
            created.append(email)
            
    db.session.commit()
    return jsonify(success=True, created=created)

@app.route('/api/nuke_db')
def nuke():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all()
    return "V18.2 Clean"

# --- AUTH ---
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
    db.session.add(Member(user_id=u.id, first_name="Nouveau"))
    db.session.commit()
    return jsonify(success=True, token=create_access_token(identity=str(u.id), additional_claims={'role': 'member'}), role='member')

@app.route('/api/offers')
def get_offers():
    offers = Offer.query.filter_by(active=True).all()
    return jsonify([{ "id": o.id, "title": o.title, "type": o.offer_type, "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url} } for o in offers])

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
