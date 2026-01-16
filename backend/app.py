import os
import random
from datetime import datetime, timedelta, date
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, and_
# Import correct des modèles
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability, followers

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'peps_v8_final'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v8'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- 📅 API RÉSERVATION ---

@app.route('/api/partner/<int:pid>/services')
def get_services(pid):
    services = Service.query.filter_by(partner_id=pid, is_active=True).all()
    return jsonify([{
        'id': s.id, 'name': s.name, 'duration': s.duration_minutes, 
        'price': s.price_chf, 'desc': s.description
    } for s in services])

@app.route('/api/partner/<int:pid>/slots')
def get_slots(pid):
    """Algorithme de disponibilité"""
    date_str = request.args.get('date')
    service_id = request.args.get('service_id')
    
    if not date_str or not service_id: return jsonify([])
    
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except: return jsonify([])

    service = Service.query.get(service_id)
    if not service: return jsonify([])

    day_idx = target_date.weekday() # 0=Lundi
    
    # 1. Horaires du jour
    hours = Availability.query.filter_by(partner_id=pid, day_of_week=day_idx).first()
    if not hours: return jsonify([]) 

    # 2. Réservations existantes
    day_start = datetime.combine(target_date, datetime.min.time())
    day_end = datetime.combine(target_date, datetime.max.time())
    
    existing = Booking.query.filter(
        Booking.partner_id == pid,
        Booking.status == 'confirmed',
        Booking.start_at >= day_start,
        Booking.start_at <= day_end
    ).all()

    # 3. Calcul créneaux
    slots = []
    try:
        open_time = datetime.strptime(hours.start_time, "%H:%M").time()
        close_time = datetime.strptime(hours.end_time, "%H:%M").time()
    except: return jsonify([])
    
    current = datetime.combine(target_date, open_time)
    closing = datetime.combine(target_date, close_time)
    duration = timedelta(minutes=service.duration_minutes)
    
    now = datetime.utcnow() + timedelta(hours=1) # UTC+1 (Zurich approx)

    while current + duration <= closing:
        # Ne pas proposer le passé
        if current > now:
            slot_end = current + duration
            is_taken = False
            for b in existing:
                # Chevauchement : (StartA < EndB) and (EndA > StartB)
                if current < b.end_at and slot_end > b.start_at:
                    is_taken = True
                    break
            
            if not is_taken:
                slots.append(current.strftime("%H:%M"))
        
        current += timedelta(minutes=15) # Pas de 15 min

    return jsonify(slots)

@app.route('/api/booking/create', methods=['POST'])
@jwt_required()
def create_booking():
    """Transaction avec verrouillage"""
    uid = get_jwt_identity()['id']
    data = request.json
    
    partner = Partner.query.get(data['partner_id'])
    user = User.query.get(uid)
    service = Service.query.get(data['service_id'])
    
    # RÈGLE 1 : Partner doit avoir un privilège actif pour activer la résa
    has_privilege_offer = Offer.query.filter_by(partner_id=partner.id, active=True).first()
    if not has_privilege_offer:
        return jsonify(error="Réservation indisponible (Partenaire sans privilège actif)."), 403

    start_dt = datetime.strptime(f"{data['date']} {data['time']}", "%Y-%m-%d %H:%M")
    end_dt = start_dt + timedelta(minutes=service.duration_minutes)

    try:
        # RÈGLE 2 : ANTI-DOUBLE BOOKING (Verrouillage)
        # On verrouille le Partenaire pour s'assurer qu'on est le seul à écrire
        # (Sur Postgres, cela met en file d'attente les écritures simultanées)
        if 'postgres' in app.config['SQLALCHEMY_DATABASE_URI']:
            db.session.query(Partner).with_for_update().get(partner.id)

        # On vérifie s'il y a collision
        collision = Booking.query.filter(
            Booking.partner_id == partner.id,
            Booking.status == 'confirmed',
            Booking.start_at < end_dt,
            Booking.end_at > start_dt
        ).first()

        if collision:
            return jsonify(error="Oups ! Ce créneau vient d'être pris."), 409

        # RÈGLE 3 : STATUT MEMBRE
        # Le privilège est appliqué SI l'utilisateur est membre actif
        is_vip = user.is_active_member
        privilege_txt = "Privilège Membre Appliqué ✅" if is_vip else "Tarif Standard (Non-membre)"

        new_b = Booking(
            user_id=uid, partner_id=partner.id, service_id=service.id,
            start_at=start_dt, end_at=end_dt,
            is_privilege_applied=is_vip,
            privilege_details=privilege_txt
        )
        
        db.session.add(new_b)
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "msg": "Rendez-vous confirmé !", 
            "privilege": is_vip,
            "details": privilege_txt
        })

    except Exception as e:
        db.session.rollback()
        return jsonify(error=str(e)), 500

# --- ☢️ SETUP V8 ---
@app.route('/api/setup_v8')
def setup_v8():
    with db.engine.connect() as c: 
        c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"))
        c.commit()
    db.create_all()
    
    # 1. Comptes
    u_part = User(email='partner@peps.swiss', password_hash=generate_password_hash('123'), role='partner')
    u_memb = User(email='member@peps.swiss', password_hash=generate_password_hash('123'), role='member') # Gratuit
    db.session.add_all([u_part, u_memb])
    db.session.commit()

    # 2. Partenaire & Offre (Obligatoire)
    p = Partner(user_id=u_part.id, name="Barber King", category="Beauté", booking_enabled=True, image_url="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500", latitude=47.1368, longitude=7.2468)
    db.session.add(p); db.session.commit()
    db.session.add(Offer(partner_id=p.id, title="-20% Coupe", offer_type="permanent", active=True, discount_val="-20%"))
    
    # 3. Prestations & Horaires
    db.session.add(Service(partner_id=p.id, name="Coupe Homme", duration_minutes=30, price_chf=35.0))
    db.session.add(Service(partner_id=p.id, name="Barbe", duration_minutes=15, price_chf=20.0))
    
    for d in range(5): # Lun-Ven
        db.session.add(Availability(partner_id=p.id, day_of_week=d, start_time="09:00", end_time="19:00"))

    db.session.commit()
    return jsonify(success=True, msg="V8 Ready")

# --- AUTH & SERVE ---
@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email')).first()
    if u and check_password_hash(u.password_hash, d.get('password')):
        return jsonify(token=create_access_token(identity={'id': u.id, 'role': u.role}), role=u.role)
    return jsonify(error="Incorrect"), 401

@app.route('/api/offers')
def get_offers():
    offers = Offer.query.filter_by(active=True).all()
    return jsonify([{
        "id": o.id, "title": o.title, "type": o.offer_type, 
        "partner": {"id": o.partner.id, "name": o.partner.name, "img": o.partner.image_url, "booking": o.partner.booking_enabled}
    } for o in offers])

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))