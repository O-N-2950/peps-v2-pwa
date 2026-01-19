from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Relation Followers
followers = db.Table('followers',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('partner_id', db.Integer, db.ForeignKey('partners.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='member') # admin, partner, member, company_admin
    is_both = db.Column(db.Boolean, default=False)
    
    # Profils
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    member_profile = db.relationship('Member', backref='owner', uselist=False)
    company_profile = db.relationship('Company', backref='admin', uselist=False)
    
    # Relations
    followed_partners = db.relationship('Partner', secondary=followers, backref=db.backref('followers_list', lazy='dynamic'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    address = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    
    # JSON Data (Stocké en Texte pour compatibilité)
    hours_json = db.Column(db.Text, default='{}') 
    photos_json = db.Column(db.Text, default='[]')
    
    # GPS
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    image_url = db.Column(db.String(500)) 
    
    offers = db.relationship('Offer', backref='partner', lazy=True)
    bookings = db.relationship('Booking', backref='partner', lazy=True)
    slots = db.relationship('AvailabilitySlot', backref='partner', lazy=True)

class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    bookings = db.relationship('Booking', backref='member', lazy=True)

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100), nullable=False)
    slots_total = db.Column(db.Integer, default=0)
    slots_used = db.Column(db.Integer, default=0)
    employees = db.relationship('User', backref='company_ref', lazy=True)

class Offer(db.Model): # Alias 'Privilege'
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    offer_type = db.Column(db.String(20)) # flash, permanent, daily
    value = db.Column(db.String(20)) 
    is_active = db.Column(db.Boolean, default=True)
    stock = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'))
    
    booking_date = db.Column(db.String(20)) # YYYY-MM-DD
    booking_time = db.Column(db.String(10)) # HH:MM
    service_name = db.Column(db.String(100))
    status = db.Column(db.String(20), default='confirmed') 
    sms_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AvailabilitySlot(db.Model):
    __tablename__ = 'availability_slots'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    day_of_week = db.Column(db.Integer) # 0=Lundi
    start_time = db.Column(db.String(5)) 
    end_time = db.Column(db.String(5)) 
    is_active = db.Column(db.Boolean, default=True)
