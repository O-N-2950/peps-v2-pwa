from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Table Followers
followers = db.Table('followers',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('partner_id', db.Integer, db.ForeignKey('partners.id'), primary_key=True)
)

class Pack(db.Model):
    __tablename__ = 'packs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    access_count = db.Column(db.Integer, nullable=False)
    price_chf = db.Column(db.Float, nullable=False)
    price_eur = db.Column(db.Float, nullable=False)

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    access_total = db.Column(db.Integer, default=0)
    stripe_customer_id = db.Column(db.String(100))
    employees = db.relationship('User', backref='company_ref', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='member')
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    followed_partners = db.relationship('Partner', secondary=followers, backref=db.backref('followers', lazy='dynamic'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))     
    icon_slug = db.Column(db.String(100))   
    
    # GPS
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    image_url = db.Column(db.String(500))
    offers = db.relationship('Offer', backref='partner', lazy=True)

class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Types: 'flash', 'permanent', 'daily', 'weekly', 'seasonal'
    offer_type = db.Column(db.String(20), default='permanent') 
    
    # Règles
    stock = db.Column(db.Integer, nullable=True) 
    day_of_week = db.Column(db.Integer, nullable=True) # 0=Lundi
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    
    price = db.Column(db.String(20))
    discount_val = db.Column(db.String(20))
    active = db.Column(db.Boolean, default=True)
    
    # Sécurité
    activation_pin = db.Column(db.String(6)) # Code PIN
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Activation(db.Model):
    __tablename__ = 'activations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id'))
    code = db.Column(db.String(50)) # QR Data
    used_at = db.Column(db.DateTime, default=datetime.utcnow)