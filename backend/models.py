from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='member') # 'admin', 'partner', 'member'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(500))
    distance = db.Column(db.String(20))
    offers = db.relationship('Offer', backref='partner', lazy=True, cascade="all, delete-orphan")

class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text) # Nouveau champ pour l'IA
    price = db.Column(db.String(20))
    old_price = db.Column(db.String(20))
    discount = db.Column(db.String(10))
    stock = db.Column(db.Integer, default=5)
    is_urgent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
