from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# --- PACKS & ENTREPRISES (B2B) ---
class Pack(db.Model):
    __tablename__ = 'packs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False) # Ex: "Starter"
    credits = db.Column(db.Integer, nullable=False) # Ex: 50
    price = db.Column(db.Float, nullable=False)     # Ex: 490.00

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    credits_balance = db.Column(db.Integer, default=0)
    # Relation : Une entreprise a plusieurs employés (Users)
    employees = db.relationship('User', backref='company_ref', lazy=True)

# --- UTILISATEURS & RÔLES ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    
    # Rôles: 'super_admin', 'partner', 'company_admin', 'employee', 'member'
    role = db.Column(db.String(20), default='member')
    
    # Liens optionnels
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# --- PARTENAIRES & OFFRES ---
class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id')) # Le compte User propriétaire
    name = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(500))
    distance = db.Column(db.String(20))
    category = db.Column(db.String(50))
    offers = db.relationship('Offer', backref='partner', lazy=True)

class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.String(20))
    old_price = db.Column(db.String(20))
    discount = db.Column(db.String(10))
    stock = db.Column(db.Integer, default=5)
    is_urgent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
