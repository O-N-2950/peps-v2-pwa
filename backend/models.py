from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

followers = db.Table('followers',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('partner_id', db.Integer, db.ForeignKey('partners.id'), primary_key=True)
)

class ActivitySector(db.Model):
    __tablename__ = 'activity_sectors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)

class Pack(db.Model):
    __tablename__ = 'packs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), index=True) # B2C, PME, CORP
    access_count = db.Column(db.Integer, nullable=False)
    
    # PRIX UNIQUE (Facial)
    price_amount = db.Column(db.Float, nullable=False) # 49.0
    
    # DOUBLE ID STRIPE (La clé du multi-devises)
    stripe_price_id_chf = db.Column(db.String(100))
    stripe_price_id_eur = db.Column(db.String(100))
    stripe_product_id = db.Column(db.String(100))

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, index=True)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), default='member', index=True)
    is_both = db.Column(db.Boolean, default=False)
    
    # V20 LOCALISATION
    country = db.Column(db.String(2), default='CH')
    currency = db.Column(db.String(3), default='CHF')
    
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    member_profile = db.relationship('Member', backref='owner', uselist=False)
    company_profile = db.relationship('Company', backref='admin', uselist=False)
    followed_partners = db.relationship('Partner', secondary=followers, backref='followers_list')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), index=True)
    pack_id = db.Column(db.Integer, db.ForeignKey('packs.id'))
    
    stripe_subscription_id = db.Column(db.String(100), unique=True)
    status = db.Column(db.String(20), index=True)
    
    # TRAÇABILITÉ V20
    currency = db.Column(db.String(3))
    amount_paid = db.Column(db.Float)
    
    current_period_end = db.Column(db.DateTime)
    slots = db.relationship('AccessSlot', backref='subscription', lazy=True, cascade="all, delete-orphan")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    first_name = db.Column(db.String(50))
    stripe_customer_id = db.Column(db.String(100), index=True)
    subscription_status = db.Column(db.String(20), default='inactive')
    current_period_end = db.Column(db.DateTime)
    referral_code = db.Column(db.String(20), unique=True)
    referred_by = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=True)
    firestore_id = db.Column(db.String(100), index=True) # Migration
    
    owned_subscription = db.relationship('Subscription', backref='owner', uselist=False)
    occupied_slot = db.relationship('AccessSlot', backref='beneficiary', uselist=False)
    privilege_usages = db.relationship('PrivilegeUsage', backref='member', lazy=True)

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    name = db.Column(db.String(100), index=True)
    category = db.Column(db.String(50), index=True)
    sector_id = db.Column(db.Integer, db.ForeignKey('activity_sectors.id'))
    city = db.Column(db.String(100), index=True)
    latitude = db.Column(db.Float, index=True)
    longitude = db.Column(db.Float, index=True)
    image_url = db.Column(db.String(500))
    offers = db.relationship('Offer', backref='partner', lazy=True)

class AccessSlot(db.Model):
    __tablename__ = 'access_slots'
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'))
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=True)
    status = db.Column(db.String(20), default='empty')
    invited_email = db.Column(db.String(120))
    invitation_token = db.Column(db.String(100))

# Tables Compatibilité V19/V20
class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    title = db.Column(db.String(100))
    offer_type = db.Column(db.String(20))
    active = db.Column(db.Boolean, default=True, index=True)
    stock = db.Column(db.Integer)
    is_permanent = db.Column(db.Boolean, default=False)
    discount_val = db.Column(db.String(20))

class PrivilegeUsage(db.Model):
    __tablename__ = 'privilege_usages'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'))
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id'))
    used_at = db.Column(db.DateTime, default=datetime.utcnow)
    validation_code = db.Column(db.String(100))
    offer_title = db.Column(db.String(100))

class Company(db.Model): id = db.Column(db.Integer, primary_key=True); user_id = db.Column(db.Integer, db.ForeignKey('users.id')); name = db.Column(db.String(100)); access_total=db.Column(db.Integer)
class Referral(db.Model): id = db.Column(db.Integer, primary_key=True)
class Booking(db.Model): id = db.Column(db.Integer, primary_key=True)
class Service(db.Model): id = db.Column(db.Integer, primary_key=True)
class Availability(db.Model): id = db.Column(db.Integer, primary_key=True)
class UserDevice(db.Model): id = db.Column(db.Integer, primary_key=True)
class Activation(db.Model): id = db.Column(db.Integer, primary_key=True)
class PartnerFeedback(db.Model): id = db.Column(db.Integer, primary_key=True)
class ViewLog(db.Model): id = db.Column(db.Integer, primary_key=True)
class ClickLog(db.Model): id = db.Column(db.Integer, primary_key=True)
