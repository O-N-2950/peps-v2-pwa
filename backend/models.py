from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# --- 1. PACKS & ENTREPRISES (Option C - SQL) ---
class Pack(db.Model):
    __tablename__ = 'packs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False) # Ex: "PME 10"
    access_count = db.Column(db.Integer, nullable=False) # Ex: 10
    price_chf = db.Column(db.Float, nullable=False)
    price_eur = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    pack_id = db.Column(db.Integer, db.ForeignKey('packs.id'))
    access_total = db.Column(db.Integer, default=0)
    access_used = db.Column(db.Integer, default=0)
    employees = db.relationship('User', backref='company_ref', lazy=True)

# --- 2. UTILISATEURS & PARRAINAGE ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='member') # super_admin, partner, company_admin, member
    
    # Gestion Abonnement
    access_expires_at = db.Column(db.DateTime)
    
    # Système Parrainage
    referral_code = db.Column(db.String(20), unique=True) # Ex: PEPS-JEAN-123
    referred_by = db.Column(db.String(20)) # Code du parrain
    bonus_months_earned = db.Column(db.Integer, default=0)
    
    # Liens
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Referral(db.Model):
    __tablename__ = 'referrals'
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    referred_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(20), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# --- 3. PARTENAIRES & OFFRES HYBRIDES ---
class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50)) # Restaurant, Coiffeur...
    image_url = db.Column(db.String(500))
    distance = db.Column(db.String(20))
    
    # Stats Qualité
    follower_count = db.Column(db.Integer, default=0)
    
    offers = db.relationship('Offer', backref='partner', lazy=True)
    feedbacks = db.relationship('PartnerFeedback', backref='partner', lazy=True)

class Offer(db.Model):
    """Table unique gérant Permanent ET Flash"""
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Distinction Fondamentale V3
    is_permanent = db.Column(db.Boolean, default=False) 
    is_flash = db.Column(db.Boolean, default=False)
    
    # Logique Flash
    stock = db.Column(db.Integer, nullable=True) # Null si permanent
    price = db.Column(db.String(20))
    old_price = db.Column(db.String(20))
    discount_val = db.Column(db.String(20)) # "-20%" ou "Offert"
    
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# --- 4. QUALITÉ (Feedback) ---
class PartnerFeedback(db.Model):
    __tablename__ = 'partner_feedbacks'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    rating = db.Column(db.Integer) # 1-5
    comment = db.Column(db.Text)
    sentiment = db.Column(db.String(20)) # positive, negative
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
