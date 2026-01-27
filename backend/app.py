import os
import stripe
import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, or_
from flask_caching import Cache
from apscheduler.schedulers.background import BackgroundScheduler

from models import db, User, Partner, Offer, Member, Pack, Subscription, AccessSlot, PrivilegeUsage
try:
    from models_stripe import Payment
except ImportError:
    Payment = None  # Le modèle sera créé après la migration
from stripe_service import sync_v20_products, create_checkout_v20, handle_webhook_v20
from migrate_v20_auto import run_migration
from migrate_partner_addresses import run_migration as run_partner_addresses_migration
# IMPORTANT : Import du blueprint Admin
from routes_admin_v20_fixed import admin_bp_fixed as admin_bp
from routes_stripe import stripe_bp
from routes_members import members_bp
from routes_partners_v2 import partners_bp
from routes_ai import ai_bp
from routes_upload import upload_bp
from routes_booking import booking_bp
from routes_admin_migrate import admin_migrate_bp
from routes_admin_sql import admin_sql_bp
from routes_partner_dashboard import partner_dashboard_bp

import os
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist'))
CORS(app)

app.config['SECRET_KEY'] = 'peps_v20_world_final'
app.config['JWT_SECRET_KEY'] = 'peps_v20_jwt_final'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///peps.db').replace("postgres://", "postgresql://")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

redis_url = os.getenv('REDIS_URL')
cache = Cache(app, config={'CACHE_TYPE': 'RedisCache' if redis_url else 'SimpleCache', 'CACHE_REDIS_URL': redis_url})

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

db.init_app(app)
jwt = JWTManager(app)

# V20 ADMIN - Exécuter la migration automatique au démarrage
# BOOKING SYSTEM - Tables de réservation activées
with app.app_context():
    run_migration()
    run_partner_addresses_migration()
    db.create_all()

# ==========================================
# 1. ENREGISTREMENT DU BLUEPRINT
# ==========================================
# C'est ICI et UNIQUEMENT ICI qu'on définit le préfixe.
# Résultat final : /api/admin + /stats = /api/admin/stats
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(stripe_bp, url_prefix='/api/stripe')
app.register_blueprint(members_bp, url_prefix='/api/members')
app.register_blueprint(partners_bp, url_prefix='/api/partners')
app.register_blueprint(ai_bp)  # Préfixe déjà défini dans routes_ai.py
app.register_blueprint(upload_bp, url_prefix='/api/upload')
app.register_blueprint(booking_bp)  # Routes de réservation
app.register_blueprint(admin_migrate_bp)  # Route de migration
app.register_blueprint(admin_sql_bp)  # Route SQL custom (debug)
app.register_blueprint(partner_dashboard_bp)  # Dashboard Partner V21

# ==========================================
# 2. ROUTE DE DEBUG (L'arme absolue)
# ==========================================
# Cette route listera toutes les URLs que Flask connait vraiment.
@app.route('/api/debug-routes')
def debug_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append(str(rule))
    return jsonify(routes)

def maintenance():
    with app.app_context():
        Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0).update({Offer.active: False})
        db.session.commit()
if not app.debug:
    s = BackgroundScheduler(); s.add_job(maintenance, 'interval', minutes=30); s.start()

def get_user():
    try:
        uid = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        return User.query.get(uid)
    except: return None

# ==========================================
# 2. ROUTES API PUBLIQUES (Existantes)
# ==========================================

# --- 🌍 GEO & DEVISE ---
@app.route('/api/currency/detect')
@cache.cached(timeout=3600, key_prefix='geo_ip')
def detect_currency():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    try:
        r = requests.get(f"https://ipapi.co/{ip}/json/", timeout=1).json()
        curr = 'EUR' if r.get('currency') == 'EUR' else 'CHF'
    except: curr = 'CHF'
    return jsonify(currency=curr)

@app.route('/api/packs')
@cache.cached(timeout=3600, query_string=True)
def get_packs():
    curr = request.args.get('currency', 'CHF')
    packs = Pack.query.order_by(Pack.access_count).all()
    res = {"B2C": [], "PME": [], "CORP": []}
    for p in packs:
        cat = p.category if p.category in res else "CORP"
        res[cat].append({
            "id": p.id, "name": p.name, "slots": p.access_count, 
            "price": p.price_amount, "currency": curr
        })
    return jsonify(res)

@app.route('/api/partners')
def get_partners():
    status_filter = request.args.get('status')
    query = Partner.query
    if status_filter:
        query = query.filter_by(status=status_filter)
    partners = query.limit(50).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'category': p.category,
        'city': p.city,
        'latitude': p.latitude,
        'longitude': p.longitude,
        'image_url': p.image_url,
        'address_street': p.address_street,
        'address_number': p.address_number,
        'address_postal_code': p.address_postal_code,
        'address_city': p.address_city,
        'address_country': p.address_country,
        'phone': p.phone,
        'website': p.website,
        'status': p.status
    } for p in partners])

# --- 💳 CHECKOUT ---
@app.route('/api/checkout', methods=['POST'])
@jwt_required()
def checkout():
    u = get_user()
    d = request.json
    if not u.member_profile: return jsonify(error="Profil invalide"), 400
    # Sauvegarde préférence
    u.currency = d.get('currency', 'CHF')
    db.session.commit()
    res = create_checkout_v20(u.member_profile.id, d['pack_id'], d.get('currency', 'CHF'))
    return jsonify(res)

@app.route('/api/webhooks/stripe', methods=['POST'])
def webhook():
    payload = request.get_data(as_text=True)
    sig = request.headers.get('Stripe-Signature')
    try: event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except: return "Error", 400

    if event['type'] == 'checkout.session.completed':
        handle_webhook_v20(event['data']['object'])
    return jsonify(success=True)

# --- 🔍 RECHERCHE V2 (OPTIMISÉE & CACHÉE) ---
@app.route('/api/partners/search_v2')
@cache.cached(timeout=300, query_string=True) # Cache 5 min unique par recherche
def search_v2():
    q = request.args.get('q', '').strip().lower()
    cat = request.args.get('category', 'all')
    
    # 1. Optimisation : On ne prend que les partenaires qui ont une position GPS
    query = Partner.query.filter(Partner.latitude.isnot(None))
    
    # 2. Filtre Catégorie
    if cat != 'all':
        query = query.filter(Partner.category == cat)
    
    # 3. Recherche Texte (Nom ou Ville)
    if q:
        query = query.filter(or_(
            Partner.name.ilike(f"%{q}%"),
            Partner.city.ilike(f"%{q}%")
        ))
    
    # Limite à 500 résultats pour ne pas faire laguer la carte Leaflet
    partners = query.limit(500).all()
    
    # Format optimisé pour le Frontend
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "city": p.city or "",
        "lat": p.latitude,
        "lng": p.longitude,
        "img": p.image_url,
        # Compteur d'offres pour filtrage visuel (ex: marqueur gris si 0)
        "offer_count": len([o for o in p.offers if o.active])
    } for p in partners])

# --- 🛠️ SETUP V20 MASSIF ---
@app.route('/api/setup_v20')
def setup_v20():
    db.create_all()
    
    # LISTE COMPLÈTE DES 29 PACKS
    # (Nom, Catégorie, Slots, Prix)
    packs_data = [
        ("Solo", "B2C", 1, 49), ("Duo", "B2C", 2, 89), ("Famille 3", "B2C", 3, 129), ("Famille 4", "B2C", 4, 164),
        ("Famille 5", "B2C", 5, 199), ("Famille 6", "B2C", 6, 245), ("Famille 7", "B2C", 7, 289), ("Famille 8", "B2C", 8, 330),
        ("Famille 9", "B2C", 9, 360), ("TPE 10", "PME", 10, 390), ("TPE 12", "PME", 12, 460), ("TPE 15", "PME", 15, 550),
        ("PME 20", "PME", 20, 700), ("PME 25", "PME", 25, 850), ("PME 30", "PME", 30, 1000), ("PME 40", "PME", 40, 1280),
        ("PME 50", "PME", 50, 1500), ("PME 75", "PME", 75, 2000), ("PME 100", "PME", 100, 2500),
        ("Corp 150", "CORP", 150, 3300), ("Corp 200", "CORP", 200, 4000), ("Corp 300", "CORP", 300, 5400),
        ("Corp 400", "CORP", 400, 7200), ("Corp 500", "CORP", 500, 7500), ("Corp 750", "CORP", 750, 9000),
        ("Corp 1000", "CORP", 1000, 12000), ("Corp 2500", "CORP", 2500, 25000), ("Corp 5000", "CORP", 5000, 40000)
    ]
    
    count = 0
    for n, c, s, p in packs_data:
        if not Pack.query.filter_by(name=n).first():
            db.session.add(Pack(name=n, category=c, access_count=s, price_amount=float(p)))
            count += 1
    db.session.commit()
    
    try: sync_v20_products()
    except: pass
    
    # Admin
    if not User.query.filter_by(email='admin@peps.swiss').first():
        db.session.add(User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin'))
        db.session.commit()
        
    return f"V20 Installed ({count} packs)"

@app.route('/api/force_migration')
def force_migration():
    """Route de debug pour forcer l'exécution de la migration"""
    import traceback
    try:
        result = run_migration()
        return jsonify({"success": result, "message": "Migration exécutée avec succès !"})
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

@app.route('/api/nuke_db')
def nuke():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all()
    return "V20 Clean"

# --- ADMIN STATS (DUAL MRR) ---
@app.route('/api/admin/stats_v20')
@jwt_required()
def admin_stats():
    if get_user().role != 'admin': return jsonify(error="No"), 403
    mrr_chf = db.session.query(func.sum(Subscription.amount_paid)).filter_by(status='active', currency='CHF').scalar() or 0
    mrr_eur = db.session.query(func.sum(Subscription.amount_paid)).filter_by(status='active', currency='EUR').scalar() or 0
    return jsonify({"mrr_chf": mrr_chf, "mrr_eur": mrr_eur, "members": Member.query.count(), "partners": Partner.query.count()})

# --- AUTH ---
@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        return jsonify(token=create_access_token(identity=str(u.id), additional_claims={'role': u.role}), role=u.role)
    return jsonify(error="Incorrect"), 401

# --- ADMIN ROUTES ---
@app.route('/api/reset-admin-password-temp')
def reset_admin_password_temp():
    admin = User.query.filter_by(email='admin@peps.swiss').first()
    if admin:
        admin.password_hash = generate_password_hash('Cristal4you11++')
        db.session.commit()
        return jsonify({"success": True, "message": "Mot de passe admin réinitialisé"})
    else:
        admin = User(email='admin@peps.swiss', password_hash=generate_password_hash('Cristal4you11++'), role='admin')
        db.session.add(admin)
        db.session.commit()
        return jsonify({"success": True, "message": "Compte admin créé"})

@app.route('/api/reset-winwin-password-temp')
def reset_winwin_password_temp():
    user = User.query.filter_by(email='contact@winwin.swiss').first()
    if user:
        user.password_hash = generate_password_hash('Cristal4you11++')
        db.session.commit()
        return jsonify({"success": True, "message": "Mot de passe WIN WIN réinitialisé"})
    else:
        return jsonify({"success": False, "message": "Utilisateur non trouvé"}), 404

@app.route('/api/admin/partners')
@jwt_required()
def admin_get_partners():
    if get_user().role != 'admin':
        return jsonify(error="Accès refusé"), 403
    partners = Partner.query.all()
    return jsonify({"partners": [{
        'id': p.id,
        'name': p.name,
        'category': p.category,
        'city': p.city,
        'status': p.status,
        'latitude': p.latitude,
        'longitude': p.longitude,
        'address_street': p.address_street,
        'address_number': p.address_number,
        'address_postal_code': p.address_postal_code,
        'address_city': p.address_city,
        'phone': p.phone,
        'website': p.website
    } for p in partners]})

@app.route('/api/admin/partners/<int:partner_id>', methods=['PUT'])
@jwt_required()
def admin_update_partner(partner_id):
    if get_user().role != 'admin':
        return jsonify(error="Accès refusé"), 403
    partner = Partner.query.get_or_404(partner_id)
    data = request.json
    if 'status' in data:
        partner.status = data['status']
    db.session.commit()
    return jsonify({"success": True, "message": "Partenaire mis à jour"})

# ==========================================
# 3. ROUTING SPA SÉCURISÉ (Pattern 404)
# ==========================================
# Au lieu d'un catch-all agressif, on utilise le gestionnaire d'erreur.

# Route pour servir les assets statiques (CSS, JS, images, etc.)
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(app.static_folder, 'assets'), filename)

# Route pour servir les images du dossier /images/
@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(os.path.join(app.static_folder, 'images'), filename)

# Route pour servir les fichiers uploadés (logos, photos, menus)
@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    return send_from_directory(uploads_dir, filename)

@app.route('/')
def index():
    if os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    return "Frontend not built", 500

@app.errorhandler(404)
def not_found(e):
    # Si l'URL commence par /api, c'est une erreur API -> JSON
    # Cela empêche le HTML de "fuir" dans les requêtes de données
    if request.path.startswith('/api'):
        return jsonify({
            "error": "API Route Not Found",
            "path_requested": request.path,
            "hint": "Check /api/debug-routes to see available endpoints"
        }), 404

    # Sinon, c'est une route React -> Index.html
    if os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    
    return e, 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
