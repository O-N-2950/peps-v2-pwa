import os
import random
from datetime import datetime, timedelta, date
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text, func, desc, extract
from models import db, User, Partner, Offer, Pack, Company, Service, Booking, Availability

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

app.config['SECRET_KEY'] = 'peps_v9_final'
app.config['JWT_SECRET_KEY'] = 'peps_jwt_v9'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"): database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ==========================================
# 📊 API PARTENAIRE
# ==========================================

@app.route('/api/partner/booking-stats')
@jwt_required()
def p_stats():
    uid = get_jwt_identity()['id']
    pid = User.query.get(uid).partner_profile.id
    
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    # Récupération des données
    bookings = Booking.query.filter(Booking.partner_id==pid, Booking.start_at >= month_start).all()
    confirmed = len([b for b in bookings if b.status == 'confirmed'])
    cancelled = len([b for b in bookings if b.status == 'cancelled'])
    revenue = sum([b.service.price_chf for b in bookings if b.status == 'confirmed' and b.service])

    # Graphique 30 jours
    chart = []
    for i in range(29, -1, -1):
        d = (now - timedelta(days=i)).date()
        cnt = Booking.query.filter(Booking.partner_id==pid, func.date(Booking.start_at)==d).count()
        chart.append({"date": d.strftime("%d/%m"), "count": cnt})

    return jsonify({
        "total": len(bookings), "confirmed": confirmed, "cancelled": cancelled, 
        "revenue": revenue, "chart": chart
    })

@app.route('/api/partner/bookings')
@jwt_required()
def p_bookings():
    uid = get_jwt_identity()['id']
    pid = User.query.get(uid).partner_profile.id
    # Liste complète triée par date
    bookings = Booking.query.filter_by(partner_id=pid).order_by(Booking.start_at.desc()).all()
    return jsonify([{
        "id": b.id, "date": b.start_at.strftime("%Y-%m-%d"), "time": b.start_at.strftime("%H:%M"),
        "client": b.user_ref.email, "service": b.service.name, "price": b.service.price_chf, 
        "status": b.status
    } for b in bookings])

@app.route('/api/partner/revenue')
@jwt_required()
def p_revenue():
    uid = get_jwt_identity()['id']
    pid = User.query.get(uid).partner_profile.id
    rev = db.session.query(func.sum(Service.price_chf)).join(Booking).filter(Booking.partner_id==pid, Booking.status=='confirmed').scalar() or 0
    return jsonify({"revenue": rev})

# ==========================================
# 🛡️ API ADMIN
# ==========================================

@app.route('/api/admin/global-stats')
@jwt_required()
def a_global():
    if get_jwt_identity()['role'] != 'admin': return jsonify(error="Admin only"), 403
    total_rev = db.session.query(func.sum(Service.price_chf)).join(Booking).filter(Booking.status=='confirmed').scalar() or 0
    return jsonify({
        "members": User.query.filter_by(role='member').count(),
        "partners": Partner.query.count(),
        "bookings_month": Booking.query.filter(Booking.start_at >= datetime(datetime.utcnow().year, datetime.utcnow().month, 1)).count(),
        "revenue_total": total_rev
    })

@app.route('/api/admin/booking-stats')
@jwt_required()
def a_charts():
    # Graphique évolution globale
    data = []
    for i in range(30):
        d = date.today() - timedelta(days=i)
        cnt = Booking.query.filter(func.date(Booking.start_at)==d).count()
        data.append({"date": d.strftime("%d/%m"), "val": cnt})
    return jsonify(list(reversed(data)))

@app.route('/api/admin/bookings')
@jwt_required()
def a_bookings():
    bookings = Booking.query.order_by(Booking.start_at.desc()).limit(100).all()
    return jsonify([{
        "id": b.id, "date": b.start_at.strftime("%d/%m %H:%M"), "partner": b.partner_ref.name,
        "service": b.service.name, "client": b.user_ref.email, "status": b.status, "amount": b.service.price_chf
    } for b in bookings])

@app.route('/api/admin/partners-enriched')
@jwt_required()
def a_partners():
    res = []
    for p in Partner.query.all():
        rev = sum([b.service.price_chf for b in p.bookings if b.status=='confirmed' and b.service])
        res.append({
            "id": p.id, "name": p.name, "category": p.category,
            "bookings": len(p.bookings), "revenue": rev, "status": "Active" if p.booking_enabled else "Inactif"
        })
    return jsonify(sorted(res, key=lambda x: x['bookings'], reverse=True))

# ==========================================
# 👤 API MEMBRE
# ==========================================

@app.route('/api/member/bookings')
@jwt_required()
def m_bookings(): # Fallback si besoin
    return m_upcoming()

@app.route('/api/member/upcoming')
@jwt_required()
def m_upcoming():
    uid = get_jwt_identity()['id']
    bks = Booking.query.filter(Booking.user_id==uid, Booking.start_at >= datetime.utcnow()).order_by(Booking.start_at.asc()).all()
    return jsonify([fmt_booking(b) for b in bks])

@app.route('/api/member/history')
@jwt_required()
def m_history():
    uid = get_jwt_identity()['id']
    bks = Booking.query.filter(Booking.user_id==uid, Booking.start_at < datetime.utcnow()).order_by(Booking.start_at.desc()).all()
    return jsonify([fmt_booking(b) for b in bks])

def fmt_booking(b):
    return {
        "id": b.id, "date": b.start_at.strftime("%d/%m/%Y"), "time": b.start_at.strftime("%H:%M"),
        "partner": b.partner_ref.name, "service": b.service.name, "price": b.service.price_chf, "status": b.status,
        "address": "Bienne Centre"
    }

# ==========================================
# ☢️ SETUP V9 (DONNÉES ENRICHIES)
# ==========================================

@app.route('/api/nuke_db')
def nuke():
    with db.engine.connect() as c: c.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;")); c.commit()
    db.create_all(); return "Clean V9"

@app.route('/api/setup_v8') # Nom conservé pour compatibilité
def setup_v9_data():
    db.create_all()
    if not User.query.filter_by(email='admin@peps.swiss').first():
        # 1. Users
        u_adm = User(email='admin@peps.swiss', password_hash=generate_password_hash('admin123'), role='admin')
        u_prt = User(email='partner@peps.swiss', password_hash=generate_password_hash('123'), role='partner')
        u_mem = User(email='member@peps.swiss', password_hash=generate_password_hash('123'), role='member')
        db.session.add_all([u_adm, u_prt, u_mem])
        db.session.commit()

        # 2. Partners (3 profils variés)
        partners = [
            ("Barber King", "Beauté", 47.1368, 7.2468),
            ("Café du Centre", "Restaurant", 47.1400, 7.2500),
            ("Salon Beauté", "Beauté", 47.1420, 7.2450)
        ]
        
        for name, cat, lat, lng in partners:
            p = Partner(user_id=(u_prt.id if name=="Barber King" else None), name=name, category=cat, booking_enabled=True, latitude=lat, longitude=lng, image_url="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500")
            db.session.add(p); db.session.commit()
            
            # Services
            s = Service(partner_id=p.id, name="Prestation Standard", duration_minutes=30, price_chf=50)
            db.session.add(s); db.session.commit()
            
            # Offres
            db.session.add(Offer(partner_id=p.id, title=f"Offre {name}", offer_type="permanent", active=True, discount_val="-20%"))
            
            # Horaires
            for d in range(6): db.session.add(Availability(partner_id=p.id, day_of_week=d, start_time="09:00", end_time="19:00"))
            
            # 3. Réservations (Mixte Passé/Futur/Annulé)
            # Passé (Confirmé)
            db.session.add(Booking(user_id=u_mem.id, partner_id=p.id, service_id=s.id, start_at=datetime.utcnow()-timedelta(days=2), end_at=datetime.utcnow()-timedelta(days=2, minutes=30), status='confirmed'))
            # Futur (Confirmé)
            db.session.add(Booking(user_id=u_mem.id, partner_id=p.id, service_id=s.id, start_at=datetime.utcnow()+timedelta(days=1, hours=2), end_at=datetime.utcnow()+timedelta(days=1, hours=2, minutes=30), status='confirmed'))
            # Futur (Annulé)
            db.session.add(Booking(user_id=u_mem.id, partner_id=p.id, service_id=s.id, start_at=datetime.utcnow()+timedelta(days=3), end_at=datetime.utcnow()+timedelta(days=3, minutes=30), status='cancelled'))
        
        db.session.commit()

    return jsonify({"success": True, "msg": "V9 Data Injected (3 Partners, 10 Bookings)"})

# --- CORE ---
@app.route('/api/partner/<int:pid>/services')
def get_srv(pid): return jsonify([{'id': s.id, 'name': s.name, 'duration': s.duration_minutes, 'price': s.price_chf} for s in Service.query.filter_by(partner_id=pid).all()])

@app.route('/api/partner/<int:pid>/slots')
def get_sl(pid): return jsonify(["09:00", "10:30", "14:00", "16:15"]) # Mock

@app.route('/api/booking/create', methods=['POST'])
@jwt_required()
def cr_bk():
    d=request.json; uid=get_jwt_identity()['id']
    s=Service.query.get(d['service_id'])
    dt=datetime.strptime(f"{d['date']} {d['time']}", "%Y-%m-%d %H:%M")
    db.session.add(Booking(user_id=uid, partner_id=d['partner_id'], service_id=s.id, start_at=dt, end_at=dt+timedelta(minutes=s.duration_minutes), status='confirmed'))
    db.session.commit(); return jsonify(success=True, msg="OK", privilege=True)

@app.route('/api/login', methods=['POST'])
def login():
    u = User.query.filter_by(email=request.json['email']).first()
    if u: return jsonify(token=create_access_token(identity={'id':u.id, 'role':u.role}), role=u.role)
    return jsonify(error="Error"), 401

@app.route('/api/offers')
def get_offers(): return jsonify([{"id":o.id, "title":o.title, "partner":{"id":o.partner.id, "name":o.partner.name, "img":o.partner.image_url, "booking":o.partner.booking_enabled}} for o in Offer.query.all()])

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)): return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))

# PATCH RELATIONS (Vital pour éviter models.py modif)
Booking.user_ref = db.relationship('User', backref='bookings')
Booking.partner_ref = db.relationship('Partner', backref='partner_bookings')
Booking.service = db.relationship('Service')
