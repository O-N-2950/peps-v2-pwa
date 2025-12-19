from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Pack(db.Model):
    __tablename__ = 'packs'
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50)) # Individual, Family, Business
    name = db.Column(db.String(100), nullable=False)
    access_count = db.Column(db.Integer, nullable=False)
    price_chf = db.Column(db.Float, nullable=False)
    price_eur = db.Column(db.Float, nullable=False)

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    pack_id = db.Column(db.Integer, db.ForeignKey('packs.id'))
    
    # Gestion des places (Quotas)
    access_total = db.Column(db.Integer, default=0)
    access_used = db.Column(db.Integer, default=0)
    
    employees = db.relationship('User', backref='company_ref', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='member')
    
    access_expires_at = db.Column(db.DateTime)
    
    # Parrainage
    referral_code = db.Column(db.String(50), unique=True)
    referred_by = db.Column(db.String(50))
    bonus_months_earned = db.Column(db.Integer, default=0)
    
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    
    # Relation vers les appareils (Sécurité)
    devices = db.relationship('UserDevice', backref='owner', lazy=True)
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserDevice(db.Model):
    __tablename__ = 'user_devices'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    device_fingerprint = db.Column(db.String(100), nullable=False) # ID unique appareil
    last_login = db.Column(db.DateTime, default=datetime.utcnow)

class Referral(db.Model):
    __tablename__ = 'referrals'
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    referred_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(20), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    image_url = db.Column(db.String(500))
    distance = db.Column(db.String(20))
    follower_count = db.Column(db.Integer, default=0)
    offers = db.relationship('Offer', backref='partner', lazy=True)
    feedbacks = db.relationship('PartnerFeedback', backref='partner', lazy=True)

class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_permanent = db.Column(db.Boolean, default=False) 
    is_flash = db.Column(db.Boolean, default=False)
    stock = db.Column(db.Integer, nullable=True)
    price = db.Column(db.String(20))
    old_price = db.Column(db.String(20))
    discount_val = db.Column(db.String(20))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PartnerFeedback(db.Model):
    __tablename__ = 'partner_feedbacks'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    rating = db.Column(db.Integer)
    comment = db.Column(db.Text)
    sentiment = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
