import os
import stripe
from datetime import timedelta
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
from migrate_tracking_feedback import run_migration as run_tracking_migration
from migrate_members_columns import run_members_columns_migration
from migrate_schema_sync import run_schema_sync
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
from routes_migrate_notifications import migrate_notifications_bp
from routes_favorites import favorites_bp
from routes_debug_members import debug_members_bp
from routes_debug_partners import debug_partners_bp
from routes_flash_offers import flash_offers_bp
from routes_migrate_flash_reservations import migrate_flash_reservations_bp
from routes_gamification import gamification_bp
from routes_activation import activation_bp
from routes_cancellation import cancellation_bp
from routes_followers import followers_bp
from routes_ai_coach import ai_coach_bp

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
    run_schema_sync()  # Migration V23: Synchronisation complète du schéma
    run_tracking_migration()
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
app.register_blueprint(migrate_notifications_bp)  # Migration notifications + offres flash
app.register_blueprint(favorites_bp)  # Système de favoris
app.register_blueprint(debug_members_bp)  # Debug membres
app.register_blueprint(debug_partners_bp)  # Debug partenaires
app.register_blueprint(flash_offers_bp)  # Offres flash avec validation IA
app.register_blueprint(migrate_flash_reservations_bp)  # Migration flash_reservations
app.register_blueprint(gamification_bp)  # Système de gamification membres
app.register_blueprint(activation_bp)  # Système de tracking activations + feedback
app.register_blueprint(cancellation_bp)  # Résiliation abonnement + suppression compte
app.register_blueprint(followers_bp)  # Système de followers partenaires
app.register_blueprint(ai_coach_bp, url_prefix='/api/ai-coach')  # IA Coach Gemini Flash pour suggestions business
  # IA Coach Gemini Flash pour suggestions business

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
        return jsonify(token=create_access_token(identity=str(u.id), additional_claims={'role': u.role}, expires_delta=timedelta(hours=24)), role=u.role)
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

@app.route('/api/create-test-member-olivier')
def create_test_member_olivier():
    """Route temporaire pour créer le membre test Olivier Neukomm"""
    try:
        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter_by(email='olivier.neukomm@bluewin.ch').first()
        if existing_user:
            # Vérifier si le membre existe
            existing_member = db.session.execute(text("""
                SELECT id FROM members WHERE user_id = :user_id
            """), {"user_id": existing_user.id}).fetchone()
            
            if existing_member:
                return jsonify({"success": False, "message": "Membre déjà existant"}), 400
            
            # Créer uniquement le membre
            db.session.execute(text("""
                INSERT INTO members (user_id, first_name, last_name, phone, address, zip_code, city, dob, created_at)
                VALUES (:user_id, :first_name, :last_name, :phone, :address, :zip_code, :city, :dob, NOW())
            """), {
                'user_id': existing_user.id,
                'first_name': 'Olivier',
                'last_name': 'Neukomm',
                'phone': '079 579 25 00',
                'address': 'Bellevue 7',
                'zip_code': '2950',
                'city': 'Courgenay',
                'dob': '1980-01-01'
            })
            db.session.commit()
            
            return jsonify({
                "success": True,
                "message": "Membre Olivier Neukomm créé avec succès",
                "user_id": existing_user.id,
                "email": "olivier.neukomm@bluewin.ch",
                "password": "Cristal4you11++"
            }), 201
        
        # Créer le User
        new_user = User(
            email='olivier.neukomm@bluewin.ch',
            password_hash='scrypt:32768:8:1$W2oZXEk9ZSkUjss7$4bd2fcb81c89e56a50b7955669a26d970944fa5d19a75313f33dc78e3c75dd8d51f101bc6031925e42d819a9e9fc3476c346f42659fdd6991584d5b8ef1da3a3',
            role='member',
            country='CH',
            currency='CHF'
        )
        db.session.add(new_user)
        db.session.flush()  # Pour obtenir l'ID
        
        # Créer le Member avec SQL brut (car le modèle ne correspond pas)
        db.session.execute(text("""
            INSERT INTO members (user_id, first_name, last_name, phone, address, zip_code, city, dob, created_at)
            VALUES (:user_id, :first_name, :last_name, :phone, :address, :zip_code, :city, :dob, NOW())
        """), {
            'user_id': new_user.id,
            'first_name': 'Olivier',
            'last_name': 'Neukomm',
            'phone': '079 579 25 00',
            'address': 'Bellevue 7',
            'zip_code': '2950',
            'city': 'Courgenay',
            'dob': '1980-01-01'
        })
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Membre test Olivier Neukomm créé avec succès",
            "user_id": new_user.id,
            "email": "olivier.neukomm@bluewin.ch",
            "password": "Test1234++"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/reset-olivier-password-temp')
def reset_olivier_password_temp():
    """Route temporaire pour changer le mot de passe d'Olivier Neukomm"""
    user = User.query.filter_by(email='olivier.neukomm@bluewin.ch').first()
    if user:
        user.password_hash = generate_password_hash('Cristal4you11++')
        db.session.commit()
        return jsonify({"success": True, "message": "Mot de passe Olivier mis à jour"})
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

# Route pour servir les vidéos Pepi depuis dist/videos/ (copiées par Vite lors du build)
@app.route('/videos/<path:filename>')
def serve_videos(filename):
    return send_from_directory(os.path.join(app.static_folder, 'videos'), filename)

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


# ==========================================
# ROUTES API PUBLIQUES POUR PARTENAIRES
# ==========================================

@app.route('/api/partners/<int:partner_id>', methods=['GET'])
def get_partner_detail(partner_id):
    """
    Récupère les détails complets d'un partenaire par son ID
    """
    try:
        partner = Partner.query.get(partner_id)
        if not partner:
            return jsonify({'success': False, 'error': 'Partenaire introuvable'}), 404
        
        # Récupérer les offres actives du partenaire
        active_offers = Offer.query.filter_by(partner_id=partner_id, active=True).order_by(Offer.priority.desc()).all()
        
        return jsonify({
            'success': True,
            'partner': {
                'id': partner.id,
                'name': partner.name,
                'category': partner.category,
                'city': partner.city,
                'latitude': partner.latitude,
                'longitude': partner.longitude,
                'image_url': partner.image_url,
                'logo': partner.image_url,  # Alias pour compatibilité frontend
                'address': f"{partner.address_number} {partner.address_street}".strip() if partner.address_street else None,
                'address_street': partner.address_street,
                'address_number': partner.address_number,
                'address_postal_code': partner.address_postal_code,
                'address_city': partner.address_city,
                'address_country': partner.address_country,
                'phone': partner.phone,
                'website': partner.website,
                'opening_hours': partner.opening_hours,
                'status': partner.status,
                'offers_count': len(active_offers)
            },
            'offers': [{
                'id': offer.id,
                'title': offer.title,
                'description': offer.description,
                'offer_type': offer.offer_type,
                'discount_val': offer.discount_val,
                'conditions': offer.conditions,
                'valid_from': offer.valid_from.isoformat() if offer.valid_from else None,
                'valid_until': offer.valid_until.isoformat() if offer.valid_until else None,
                'max_uses_per_member': offer.max_uses_per_member,
                'is_permanent': offer.is_permanent,
                'stock': offer.stock,
                'active': offer.active
            } for offer in active_offers]
        }), 200
    
    except Exception as e:
        print(f"Erreur lors de la récupération du partenaire {partner_id}: {str(e)}")
        return jsonify({'success': False, 'error': f'Erreur serveur: {str(e)}'}), 500


@app.route('/api/partners/<int:partner_id>/offers', methods=['GET'])
def get_partner_offers(partner_id):
    """
    Récupère toutes les offres actives d'un partenaire
    """
    try:
        partner = Partner.query.get(partner_id)
        if not partner:
            return jsonify({'success': False, 'error': 'Partenaire introuvable'}), 404
        
        # Récupérer les offres actives triées par priorité
        offers = Offer.query.filter_by(
            partner_id=partner_id,
            active=True
        ).order_by(Offer.priority.desc(), Offer.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'partner_name': partner.name,
            'offers': [{
                'id': offer.id,
                'title': offer.title,
                'description': offer.description,
                'offer_type': offer.offer_type,
                'discount_val': offer.discount_val,
                'conditions': offer.conditions,
                'valid_from': offer.valid_from.isoformat() if offer.valid_from else None,
                'valid_until': offer.valid_until.isoformat() if offer.valid_until else None,
                'max_uses_per_member': offer.max_uses_per_member,
                'is_permanent': offer.is_permanent,
                'stock': offer.stock
            } for offer in offers]
        }), 200
    
    except Exception as e:
        print(f"Erreur lors de la récupération des offres du partenaire {partner_id}: {str(e)}")
        return jsonify({'success': False, 'error': f'Erreur serveur: {str(e)}'}), 500


@app.route('/api/privileges/activate', methods=['POST'])
@jwt_required()
def activate_privilege():
    """
    Active un privilège pour un membre
    Vérifie le statut d'abonnement et enregistre l'activation
    """
    try:
        user = get_user()
        if not user or not user.member_profile:
            return jsonify({'success': False, 'error': 'Profil membre introuvable'}), 401
        
        data = request.get_json()
        partner_id = data.get('partner_id')
        offer_id = data.get('offer_id')
        
        if not partner_id or not offer_id:
            return jsonify({'success': False, 'error': 'partner_id et offer_id requis'}), 400
        
        # Vérifier que le partenaire existe
        partner = Partner.query.get(partner_id)
        if not partner:
            return jsonify({'success': False, 'error': 'Partenaire introuvable'}), 404
        
        # Vérifier que l'offre existe et est active
        offer = Offer.query.get(offer_id)
        if not offer or not offer.active:
            return jsonify({'success': False, 'error': 'Offre introuvable ou inactive'}), 404
        
        # Vérifier le statut d'abonnement du membre
        member = user.member_profile
        subscription = Subscription.query.filter_by(member_id=member.id, status='active').first()
        
        if not subscription:
            return jsonify({
                'success': False,
                'error': 'Abonnement inactif',
                'message': 'Vous devez avoir un abonnement actif pour utiliser ce privilège'
            }), 403
        
        # Vérifier si le membre a déjà utilisé ce privilège (limite par membre)
        if offer.max_uses_per_member:
            usage_count = PrivilegeUsage.query.filter_by(
                member_id=member.id,
                offer_id=offer_id
            ).count()
            
            if usage_count >= offer.max_uses_per_member:
                return jsonify({
                    'success': False,
                    'error': 'Limite atteinte',
                    'message': f'Vous avez déjà utilisé ce privilège {usage_count} fois (maximum: {offer.max_uses_per_member})'
                }), 403
        
        # Générer un code de validation unique
        import random
        import string
        validation_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        # Enregistrer l'activation du privilège
        privilege_usage = PrivilegeUsage(
            member_id=member.id,
            partner_id=partner_id,
            offer_id=offer_id,
            validation_code=validation_code,
            offer_title=offer.title
        )
        db.session.add(privilege_usage)
        
        # Décrémenter le stock si l'offre n'est pas permanente
        if not offer.is_permanent and offer.stock is not None:
            offer.stock -= 1
            if offer.stock <= 0:
                offer.active = False
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Privilège activé avec succès !',
            'activation': {
                'id': privilege_usage.id,
                'validation_code': validation_code,
                'partner_name': partner.name,
                'offer_title': offer.title,
                'used_at': privilege_usage.used_at.isoformat()
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de l'activation du privilège: {str(e)}")
        return jsonify({'success': False, 'error': f'Erreur serveur: {str(e)}'}), 500


@app.route('/api/privileges/feedback', methods=['POST'])
@jwt_required()
def submit_privilege_feedback():
    """
    Soumet un feedback après l'activation d'un privilège (optionnel)
    """
    try:
        user = get_user()
        if not user or not user.member_profile:
            return jsonify({'success': False, 'error': 'Profil membre introuvable'}), 401
        
        data = request.get_json()
        partner_id = data.get('partner_id')
        offer_id = data.get('offer_id')
        rating = data.get('rating')  # 1-5 étoiles
        comment = data.get('comment', '')
        experience_type = data.get('experience_type', 'privilege_granted')
        savings_amount = data.get('savings_amount')  # Montant économisé (optionnel)
        
        if not partner_id or not rating:
            return jsonify({'success': False, 'error': 'partner_id et rating requis'}), 400
        
        # Valider le rating
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'success': False, 'error': 'Le rating doit être entre 1 et 5'}), 400
        
        # Créer le feedback
        feedback = PartnerFeedback(
            member_id=user.member_profile.id,
            partner_id=partner_id,
            offer_id=offer_id,
            rating=rating,
            comment=comment,
            experience_type=experience_type
        )
        db.session.add(feedback)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Merci pour votre feedback !',
            'feedback_id': feedback.id
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la soumission du feedback: {str(e)}")
        return jsonify({'success': False, 'error': f'Erreur serveur: {str(e)}'}), 500


@app.route('/api/partners/nearby', methods=['GET'])
def get_nearby_partners():
    """
    Récupère les partenaires triés par distance depuis la position du membre
    Utilise la formule Haversine pour calculer la distance
    
    Query params:
    - lat: Latitude du membre (obligatoire)
    - lng: Longitude du membre (obligatoire)
    - radius: Rayon de recherche en km (optionnel, défaut: 50km)
    - limit: Nombre maximum de résultats (optionnel, défaut: 50)
    """
    try:
        # Récupérer les paramètres
        user_lat = request.args.get('lat', type=float)
        user_lng = request.args.get('lng', type=float)
        radius_km = request.args.get('radius', default=50, type=int)
        limit = request.args.get('limit', default=50, type=int)
        
        if not user_lat or not user_lng:
            return jsonify({
                'success': False,
                'error': 'Paramètres lat et lng requis'
            }), 400
        
        # Formule Haversine pour calculer la distance
        # Distance en km entre deux points GPS
        query = text("""
            SELECT 
                p.id,
                p.name,
                p.category,
                p.city,
                p.latitude,
                p.longitude,
                p.image_url,
                p.address_street,
                p.address_number,
                p.address_postal_code,
                p.address_city,
                p.phone,
                p.website,
                p.status,
                (
                    6371 * acos(
                        cos(radians(:user_lat)) 
                        * cos(radians(p.latitude)) 
                        * cos(radians(p.longitude) - radians(:user_lng)) 
                        + sin(radians(:user_lat)) 
                        * sin(radians(p.latitude))
                    )
                ) AS distance_km,
                (
                    SELECT COUNT(*) 
                    FROM offers o 
                    WHERE o.partner_id = p.id AND o.active = TRUE
                ) AS offers_count
            FROM partners p
            WHERE p.latitude IS NOT NULL 
                AND p.longitude IS NOT NULL
                AND p.status = 'active'
            HAVING distance_km <= :radius_km
            ORDER BY distance_km ASC
            LIMIT :limit
        """)
        
        result = db.session.execute(query, {
            'user_lat': user_lat,
            'user_lng': user_lng,
            'radius_km': radius_km,
            'limit': limit
        }).fetchall()
        
        partners = []
        for row in result:
            # Construire l'adresse complète
            address_parts = []
            if row.address_number:
                address_parts.append(row.address_number)
            if row.address_street:
                address_parts.append(row.address_street)
            if row.address_postal_code:
                address_parts.append(row.address_postal_code)
            if row.address_city:
                address_parts.append(row.address_city)
            
            partners.append({
                'id': row.id,
                'name': row.name,
                'category': row.category,
                'city': row.city,
                'latitude': float(row.latitude) if row.latitude else None,
                'longitude': float(row.longitude) if row.longitude else None,
                'image_url': row.image_url,
                'address': ' '.join(address_parts) if address_parts else None,
                'phone': row.phone,
                'website': row.website,
                'status': row.status,
                'distance_km': round(float(row.distance_km), 2),
                'distance_m': int(float(row.distance_km) * 1000),
                'offers_count': row.offers_count
            })
        
        return jsonify({
            'success': True,
            'partners': partners,
            'count': len(partners),
            'user_location': {
                'lat': user_lat,
                'lng': user_lng
            },
            'radius_km': radius_km
        }), 200
    
    except Exception as e:
        print(f"Erreur get_nearby_partners: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erreur serveur: {str(e)}'
        }), 500
