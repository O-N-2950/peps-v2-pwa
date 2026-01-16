from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Table Followers
followers = db.Table('followers',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('partner_id', db.Integer, db.ForeignKey('partners.id'), primary_key=True)
)

# --- CORE ---
class Pack(db.Model):
    __tablename__ = 'packs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    access_count = db.Column(db.Integer)
    price_chf = db.Column(db.Float)
    price_eur = db.Column(db.Float)

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    access_total = db.Column(db.Integer, default=0)
    employees = db.relationship('User', backref='company_ref', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), default='member')
    
    # ABONNEMENT (Le Graal)
    access_expires_at = db.Column(db.DateTime, nullable=True)
    
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    followed_partners = db.relationship('Partner', secondary=followers, backref=db.backref('followers_list', lazy='dynamic'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    @property
    def is_active_member(self):
        """Vrai si l'abo est actif"""
        return self.access_expires_at and self.access_expires_at > datetime.utcnow()

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100))
    category = db.Column(db.String(50))
    icon_slug = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    image_url = db.Column(db.String(500))
    
    # CONFIG RÉSERVATION
    booking_enabled = db.Column(db.Boolean, default=False)
    
    offers = db.relationship('Offer', backref='partner', lazy=True)
    # Relations Réservation
    services = db.relationship('Service', backref='partner', lazy=True)
    availabilities = db.relationship('Availability', backref='partner', lazy=True)
    bookings = db.relationship('Booking', backref='partner', lazy=True)

class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    title = db.Column(db.String(100))
    offer_type = db.Column(db.String(20)) 
    active = db.Column(db.Boolean, default=True)
    discount_val = db.Column(db.String(20))
    stock = db.Column(db.Integer, nullable=True)

# --- MODULE RÉSERVATION V8 ---

class Service(db.Model):
    """Prestations (ex: Coupe Homme, 30min)"""
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    price_chf = db.Column(db.Float)
    description = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)

class Availability(db.Model):
    """Horaires (0=Lundi)"""
    __tablename__ = 'availabilities'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    day_of_week = db.Column(db.Integer) 
    start_time = db.Column(db.String(5)) # "09:00"
    end_time = db.Column(db.String(5))   # "18:00"

class Booking(db.Model):
    """Rendez-vous"""
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'))
    
    start_at = db.Column(db.DateTime, nullable=False)
    end_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='confirmed')
    
    # SNAPSHOT DU PRIVILÈGE (Le cœur du modèle)
    # On stocke l'état AU MOMENT de la résa (Membre ou pas ?)
    is_privilege_applied = db.Column(db.Boolean, default=False)
    privilege_details = db.Column(db.String(200))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    service = db.relationship('Service')

# Tables utilitaires V7 conservées
class Activation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    code = db.Column(db.String(50))

class UserDevice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    device_fingerprint = db.Column(db.String(100))

class PartnerFeedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    rating = db.Column(db.Integer)