import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

app.config['SECRET_KEY'] = 'peps_v8_rescue'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v8_rescue'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"): 
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ==========================================
# 🚨 ZONE DE SECOURS (PRIORITAIRE)
# ==========================================

@app.route('/api/nuke_db')
def nuke_db():
    """Force le nettoyage complet pour installer la V8"""
    try:
        with db.engine.connect() as c: 
            # Commande PostgreSQL radicale
            c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
            c.commit()
        db.create_all()
        return jsonify({"status": "SUCCESS", "msg": "BASE NETTOYÉE. Lancez setup_v8 maintenant."})
    except Exception as e: 
        # Fallback si la commande échoue
        try: db.drop_all(); db.create_all(); return "Reset Fallback OK"
        except: return jsonify({"error": str(e)}), 500

@app.route('/api/setup_v8')
def setup_v8():
    """Installe la V8 avec la colonne booking_enabled"""
    try:
        db.create_all()
        
        # 1. Comptes
        if not User.query.filter_by(email='partner@peps.swiss').first():
            u_part = User(email='partner@peps.swiss', password_hash=generate_password_hash('123'), role='partner')
            u_memb = User(email='member@peps.swiss', password_hash=generate_password_hash('123'), role='member')
            db.session.add_all([u_part, u_memb])
            db.session.commit()

            # 2. Partenaire avec Réservation
            p = Partner(
                user_id=u_part.id, name="Barber King", category="Beauté", 
                booking_enabled=True,  # ✅ C'est ici que ça se joue
                image_url="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500",
                latitude=47.1368, longitude=7.2468
            )
            db.session.add(p); db.session.commit()
            
            db.session.add(Offer(partner_id=p.id, title="-20% Coupe", offer_type="permanent", active=True, discount_val="-20%"))
            
            # 3. Config Réservation
            db.session.add(Service(partner_id=p.id, name="Coupe Homme", duration_minutes=30, price_chf=35.0))
            db.session.add(Service(partner_id=p.id, name="Barbe", duration_minutes=15, price_chf=20.0))
            for d in range(5):
                db.session.add(Availability(partner_id=p.id, day_of_week=d, start_time="09:00", end_time="19:00"))

            db.session.commit()

        return jsonify({"status": "SUCCESS", "msg": "V8 Installée"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 🛡️ ROUTES APP (AVEC PROTECTION)
# ==========================================

@app.route('/api/offers')
def get_offers():
    # BLINDAGE : Si la DB plante, on renvoie vide pour ne pas crasher le site
    try:
        offers = Offer.query.filter_by(active=True).all()
        return jsonify([{
            "id": o.id, "title": o.title, "type": o.offer_type, 
            "partner": {
                "id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url,
                "booking": getattr(o.partner, 'booking_enabled', False) # Protection
            }
        } for o in offers])
    except Exception as e:
        print(f"DB Error (Waiting for Reset): {e}")
        return jsonify([]) 

@app.route('/api/partner/<int:pid>/services')
def get_services(pid):
    try:
        services = Service.query.filter_by(partner_id=pid, is_active=True).all()
        return jsonify([{'id': s.id, 'name': s.name, 'duration': s.duration_minutes, 'price': s.price_chf, 'desc': s.description} for s in services])
    except: return jsonify([])

@app.route('/api/partner/<int:pid>/slots')
def get_slots(pid):
    try:
        date_str = request.args.get('date')
        service_id = request.args.get('service_id')
        if not date_str or not service_id: return jsonify([])
        
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        service = Service.query.get(service_id)
        day_idx = target_date.weekday()
        hours = Availability.query.filter_by(partner_id=pid, day_of_week=day_idx).first()
        if not hours: return jsonify([])
        
        # Calcul Algo
        slots = []
        open_time = datetime.strptime(hours.start_time, "%H:%M").time()
        close_time = datetime.strptime(hours.end_time, "%H:%M").time()
        current = datetime.combine(target_date, open_time)
        closing = datetime.combine(target_date, close_time)
        duration = timedelta(minutes=service.duration_minutes)
        
        existing = Booking.query.filter(
            Booking.partner_id == pid, Booking.status == 'confirmed',
            Booking.start_at >= datetime.combine(target_date, datetime.min.time()),
            Booking.start_at <= datetime.combine(target_date, datetime.max.time())
        ).all()

        while current + duration <= closing:
            if current > datetime.utcnow() + timedelta(hours=1):
                slot_end = current + duration
                is_taken = False
                for b in existing:
                    if current < b.end_at and slot_end > b.start_at:
                        is_taken = True; break
                if not is_taken: slots.append(current.strftime("%H:%M"))
            current += timedelta(minutes=15)
            
        return jsonify(slots)
    except: return jsonify([])

@app.route('/api/booking/create', methods=['POST'])
@jwt_required()
def create_booking():
    uid = get_jwt_identity()['id']
    data = request.json
    try:
        partner = Partner.query.get(data['partner_id'])
        service = Service.query.get(data['service_id'])
        user = User.query.get(uid)
        
        if not getattr(partner, 'booking_enabled', False): return jsonify(error="Non activé"), 400
        
        bk = Booking(
            user_id=uid, partner_id=partner.id, service_id=service.id,
            start_at=datetime.utcnow(), end_at=datetime.utcnow(), 
            is_privilege_applied=user.is_active_member, 
            privilege_details="Réservation V8"
        )
        db.session.add(bk)
        db.session.commit()
        return jsonify({"success": True, "msg": "Confirmé !", "privilege": bk.is_privilege_applied, "details": bk.privilege_details})
    except Exception as e: return jsonify(error=str(e)), 500

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        return jsonify(token=create_access_token(identity={'id': u.id, 'role': u.role}), role=u.role)
    return jsonify(error="Incorrect"), 401

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))