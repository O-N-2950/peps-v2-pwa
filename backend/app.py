import os
import stripe
import requests
import json
import random
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func
from models import db, User, Partner, Offer, Pack, Company, Activation, followers

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

# CONFIGURATION
app.config['SECRET_KEY'] = 'peps_v7_1_final_secret'
app.config['JWT_SECRET_KEY'] = 'peps_v7_1_jwt_key'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"): database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ✅ CORRECTION URL ET CLÉS
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://www.peps.swiss')
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
PERPLEXITY_KEY = os.getenv('PERPLEXITY_API_KEY')

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- 🔄 MAINTENANCE ---
def maintenance():
    with app.app_context():
        Offer.query.filter(Offer.offer_type=='flash', Offer.stock<=0).update({Offer.active: False})
        db.session.commit()
scheduler = BackgroundScheduler()
scheduler.add_job(maintenance, 'interval', minutes=30)
scheduler.start()

# --- ☢️ RESET & SETUP V7.1 ---
@app.route('/api/nuke_db')
def nuke_db():
    with db.engine.connect() as c: 
        c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
        c.commit()
    db.create_all()
    return jsonify({"status": "SUCCESS", "msg": "Base V7.1 Clean"})

@app.route('/api/setup_v7')
def setup_v7():
    try:
        db.create_all()
        
        # 1. Admin
        if not User.query.filter_by(email='admin@peps.swiss').first():
            admin = User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin')
            db.session.add(admin)

        # 2. Partenaires Démo
        demos = [
            ("Mario's Pizza", "Restaurant", 50, "high"),
            ("Café du Centre", "Bar", 8, "low"),
            ("Salon Beauté", "Beauté", 25, "medium")
        ]
        
        for name, cat, followers_target, eng in demos:
            email = f"partner.{name.split()[0].lower()}@peps.swiss"
            if not User.query.filter_by(email=email).first():
                u = User(email=email, password_hash=generate_password_hash('123456'), role='partner')
                db.session.add(u)
                db.session.commit()
                
                p = Partner(user_id=u.id, name=name, category=cat, latitude=47.1368, longitude=7.2468, image_url="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500")
                db.session.add(p)
                db.session.commit()
                
                # Offres
                db.session.add(Offer(partner_id=p.id, title=f"Offre {name}", offer_type="permanent", discount_val="-20%", active=True))
                if eng == "high":
                    db.session.add(Offer(partner_id=p.id, title="FLASH PROMO", offer_type="flash", stock=5, discount_val="-50%", active=True))

                # Création de followers fictifs
                for i in range(followers_target):
                    f_email = f"fan_{name.split()[0]}_{i}@demo.com"
                    if not User.query.filter_by(email=f_email).first():
                        f_user = User(email=f_email, password_hash="x", role="member")
                        db.session.add(f_user)
                        # FOLLOW : Ajout à la liste du partenaire
                        p.followers_list.append(f_user)
                
        db.session.commit()
        return jsonify({"success": True, "msg": "Données V7.1 injectées (Admin + Partners + Followers)"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# --- ❤️ SYSTÈME DE FOLLOW ---
@app.route('/api/partner/follow/<int:pid>', methods=['POST'])
@jwt_required()
def follow(pid):
    uid = get_jwt_identity()['id']
    u = User.query.get(uid)
    p = Partner.query.get_or_404(pid)
    if p not in u.followed_partners:
        u.followed_partners.append(p)
        db.session.commit()
    return jsonify(success=True, followers_count=p.followers_list.count())

@app.route('/api/partner/unfollow/<int:pid>', methods=['POST'])
@jwt_required()
def unfollow(pid):
    uid = get_jwt_identity()['id']
    u = User.query.get(uid)
    p = Partner.query.get_or_404(pid)
    if p in u.followed_partners:
        u.followed_partners.remove(p)
        db.session.commit()
    return jsonify(success=True, followers_count=p.followers_list.count())

@app.route('/api/partner/<int:pid>/is-following')
@jwt_required()
def is_following(pid):
    uid = get_jwt_identity()['id']
    u = User.query.get(uid)
    p = Partner.query.get_or_404(pid)
    return jsonify(following=(p in u.followed_partners) if p else False)


# --- 📊 PARTNER ANALYTICS & IA ---
@app.route('/api/partner/my-stats')
@jwt_required()
def my_stats():
    uid = get_jwt_identity()['id']
    u = User.query.get(uid)
    if not u.partner_profile: return jsonify(error="Not a partner"), 403
    p = u.partner_profile
    
    f_count = p.followers_list.count()
    offers_count = len(p.offers)
    active_offers = len([o for o in p.offers if o.active])
    activations = Activation.query.filter(Activation.offer_id.in_([o.id for o in p.offers])).count()
    
    # Score d'engagement (0-10)
    score = min(10, round((f_count * 0.15) + (activations * 0.5), 1))
    if score < 2: score = 2.5

    return jsonify({
        "name": p.name,
        "followers_count": f_count,
        "offers_count": offers_count,
        "active_offers_count": active_offers,
        "total_activations": activations,
        "engagement_score": score
    })

@app.route('/api/partner/followers-evolution')
@jwt_required()
def followers_evo():
    # Simulation données graphiques (Pas d'historique en base)
    labels = [(datetime.now() - timedelta(days=i)).strftime("%d/%m") for i in range(6, -1, -1)]
    uid = get_jwt_identity()['id']
    base = User.query.get(uid).partner_profile.followers_list.count()
    data = [max(0, base - random.randint(0, 5) + i) for i in range(7)] # Légère courbe croissante simulée
    return jsonify({"labels": labels, "data": data})

@app.route('/api/partner/growth-suggestions')
@jwt_required()
def growth_ai():
    uid = get_jwt_identity()['id']
    p = User.query.get(uid).partner_profile
    
    f_count = p.followers_list.count()
    active_o = len([o for o in p.offers if o.active])
    
    # Prompt IA Optimisé
    prompt = f"""
    Expert marketing local. Commerce: {p.category}, {f_count} followers, {active_o} offres.
    Donne 3 actions JSON courtes: [{{ "action": "Titre", "desc": "Explication", "priority": 1, "icon": "⚡" }}].
    Réponds uniquement le JSON Array.
    """
    
    if PERPLEXITY_KEY:
        try:
            r = requests.post("https://api.perplexity.ai/chat/completions", 
                json={"model": "sonar-medium-online", "messages": [{"role": "user", "content": prompt}]},
                headers={"Authorization": f"Bearer {PERPLEXITY_KEY}"}).json()
            content = r['choices'][0]['message']['content'].strip()
            # Nettoyage du markdown pour extraire le JSON pur
            if "```json" in content: content = content.split("```json")[1].split("```")[0]
            elif "```" in content: content = content.split("```")[1]
            
            suggestions = json.loads(content)
            return jsonify({"suggestions": suggestions, "level": "ai_generated"})
        except: pass

    # Fallback Statique
    suggs = []
    if f_count < 10: suggs.append({"action": "Offre Bienvenue", "desc": "Offrez un café aux 20 premiers abonnés.", "priority": 1, "icon": "🎁"})
    if active_o == 0: suggs.append({"action": "Réveiller", "desc": "Vos abonnés dorment. Créez une offre !", "priority": 1, "icon": "⚡"})
    suggs.append({"action": "QR Code", "desc": "Imprimez votre QR code pour le comptoir.", "priority": 2, "icon": "📱"})
    return jsonify({"suggestions": suggs, "level": "fallback"})


# --- 🛡️ ADMIN DASHBOARD ---
@app.route('/api/admin/partners-overview')
@jwt_required()
def admin_overview():
    if get_jwt_identity()['role'] != 'admin': return jsonify(error="Admin only"), 403
    
    res = []
    for p in Partner.query.all():
        f_count = p.followers_list.count()
        res.append({
            "id": p.id, "name": p.name, "category": p.category,
            "followers_count": f_count,
            "active_offers": len([o for o in p.offers if o.active]),
            "status": "active" if f_count > 10 else "low_engagement",
            "score": 8.5 # Placeholder
        })
    return jsonify(sorted(res, key=lambda x: x['followers_count'], reverse=True))

@app.route('/api/admin/global-stats')
@jwt_required()
def admin_stats():
    if get_jwt_identity()['role'] != 'admin': return jsonify(error="Admin only"), 403
    
    # Comptage global via la table d'association
    total_follows = db.session.query(func.count(followers.c.user_id)).scalar() or 0
    partners_count = Partner.query.count()

    return jsonify({
        "total_partners": partners_count,
        "total_members": User.query.filter_by(role='member').count(),
        "total_followers": total_follows,
        "avg_engagement": round(total_follows / max(1, partners_count), 1),
        "total_offers": Offer.query.count()
    })

# --- AUTH & OFFERS ---
@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        return jsonify(token=create_access_token(identity={'id': u.id, 'role': u.role}), role=u.role)
    return jsonify(error="Incorrect"), 401

@app.route('/api/offers')
def get_offers():
    uid = None
    try: 
        verify_jwt_in_request(optional=True)
        if get_jwt_identity(): uid = get_jwt_identity()['id']
    except: pass

    user_follows = []
    if uid:
        u = User.query.get(uid)
        user_follows = [p.id for p in u.followed_partners]

    res = []
    for o in Offer.query.filter_by(active=True).all():
        res.append({
            "id": o.id, "title": o.title, "type": o.offer_type, "stock": o.stock, "discount": o.discount_val,
            "is_followed": o.partner.id in user_follows,
            "partner": {"id": o.partner.id, "name": o.partner.name, "cat": o.partner.category, "img": o.partner.image_url, "followers": o.partner.followers_list.count()}
        })
    return jsonify(res)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))