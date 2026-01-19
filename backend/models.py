
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Table Followers
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
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    member_profile = db.relationship('Member', backref='owner', uselist=False)
    followed_partners = db.relationship('Partner', secondary=followers, backref=db.backref('followers_list', lazy='dynamic'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    city = db.Column(db.String(100))  # V18.1 Search
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    image_url = db.Column(db.String(500))
    offers = db.relationship('Offer', backref='partner', lazy=True)
    privilege_usages = db.relationship('PrivilegeUsage', backref='partner', lazy=True)

class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    first_name = db.Column(db.String(50))
    privilege_usages = db.relationship('PrivilegeUsage', backref='member', lazy=True)

class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    offer_type = db.Column(db.String(20)) # flash, permanent
    is_permanent = db.Column(db.Boolean, default=False) # NEW V16
    discount_val = db.Column(db.String(20))
    active = db.Column(db.Boolean, default=True)
    stock = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# NEW V16 : Historique Illimité
class PrivilegeUsage(db.Model):
    __tablename__ = 'privilege_usages'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'))
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id'))
    validation_code = db.Column(db.String(50), unique=True)
    offer_title = db.Column(db.String(100)) # Snapshot du titre
    used_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Compatibilité
class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))