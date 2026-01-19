from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

followers = db.Table('followers',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('partner_id', db.Integer, db.ForeignKey('partners.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='member')
    is_both = db.Column(db.Boolean, default=False)
    
    # V15: GPS & PUSH
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    push_subscription = db.Column(db.Text, nullable=True) # JSON
    
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    member_profile = db.relationship('Member', backref='owner', uselist=False)
    company_profile = db.relationship('Company', backref='admin', uselist=False)
    
    followed_partners = db.relationship('Partner', secondary=followers, backref=db.backref('followers_list', lazy='dynamic'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    image_url = db.Column(db.String(500))
    
    flash_offers = db.relationship('FlashOffer', backref='partner', lazy=True)
    offers = db.relationship('Offer', backref='partner', lazy=True)
    bookings = db.relationship('Booking', backref='partner', lazy=True)

class FlashOffer(db.Model):
    __tablename__ = 'flash_offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    
    title = db.Column(db.String(100), nullable=False)
    discount = db.Column(db.String(20)) 
    
    slots_total = db.Column(db.Integer, default=1)
    slots_taken = db.Column(db.Integer, default=0)
    
    radius_km = db.Column(db.Integer, default=10)
    expires_at = db.Column(db.DateTime, nullable=False)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    claims = db.relationship('FlashClaim', backref='offer', lazy=True)

class FlashClaim(db.Model):
    __tablename__ = 'flash_claims'
    id = db.Column(db.Integer, primary_key=True)
    flash_offer_id = db.Column(db.Integer, db.ForeignKey('flash_offers.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    qr_code = db.Column(db.String(100))
    claimed_at = db.Column(db.DateTime, default=datetime.utcnow)

# --- Modèles V14 conservés ---
class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    first_name = db.Column(db.String(50))

class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    title = db.Column(db.String(100))
    offer_type = db.Column(db.String(20))
    active = db.Column(db.Boolean, default=True)

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100))

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'))
    status = db.Column(db.String(20))

class Pack(db.Model):
    __tablename__ = 'packs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    price_chf = db.Column(db.Float)
