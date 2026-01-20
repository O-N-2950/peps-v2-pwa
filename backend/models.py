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
    
    # Relations vers les profils
    member_profile = db.relationship('Member', backref='user', uselist=False)
    partner_profile = db.relationship('Partner', backref='owner', uselist=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # V19 : Profil Complet
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    zip_code = db.Column(db.String(10))
    city = db.Column(db.String(50))
    dob = db.Column(db.String(20)) # YYYY-MM-DD
    
    # V19 : Gestion Multi-Accès
    # 1. Si je suis le PAYEUR (Chef de famille / Patron)
    owned_subscription = db.relationship('Subscription', backref='owner', uselist=False)
    
    # 2. Si je suis le BÉNÉFICIAIRE (Utilisateur d'un slot)
    occupied_slot = db.relationship('AccessSlot', backref='beneficiary', uselist=False)
    
    stripe_customer_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    @property
    def is_premium(self):
        # Vérifie si l'utilisateur a un slot actif sur un abo valide
        if self.occupied_slot and self.occupied_slot.status == 'active':
            sub = self.occupied_slot.subscription
            return sub.status == 'active' and sub.current_period_end > datetime.utcnow()
        return False

class Pack(db.Model):
    __tablename__ = 'packs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100)) # "Famille 5"
    category = db.Column(db.String(50)) # FAMILY, BUSINESS
    max_slots = db.Column(db.Integer)
    price_chf = db.Column(db.Float)
    stripe_price_id = db.Column(db.String(100))

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id')) # Le Payeur
    pack_id = db.Column(db.Integer, db.ForeignKey('packs.id'))
    
    stripe_subscription_id = db.Column(db.String(100))
    status = db.Column(db.String(20), default='active')
    current_period_end = db.Column(db.DateTime)
    
    slots = db.relationship('AccessSlot', backref='subscription', lazy=True, cascade="all, delete-orphan")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AccessSlot(db.Model):
    __tablename__ = 'access_slots'
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'))
    
    # Qui occupe ce slot ? (Lien vers Member)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=True)
    
    # Invitation
    status = db.Column(db.String(20), default='empty') # empty, invited, active
    invited_email = db.Column(db.String(120))
    invitation_token = db.Column(db.String(100), unique=True)

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    city = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    image_url = db.Column(db.String(500))
    offers = db.relationship('Offer', backref='partner', lazy=True)
    
    # Stats V19
    views = db.relationship('ViewLog', backref='partner', lazy=True)
    clicks = db.relationship('ClickLog', backref='partner', lazy=True)

class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    title = db.Column(db.String(100))
    description = db.Column(db.Text)
    offer_type = db.Column(db.String(20)) 
    is_permanent = db.Column(db.Boolean, default=False)
    discount_val = db.Column(db.String(20))
    active = db.Column(db.Boolean, default=True)
    stock = db.Column(db.Integer, nullable=True)

class PrivilegeUsage(db.Model):
    __tablename__ = 'privilege_usages'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'))
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id'))
    validation_code = db.Column(db.String(100))
    offer_title = db.Column(db.String(100))
    used_at = db.Column(db.DateTime, default=datetime.utcnow)

# Analytics V19
class ViewLog(db.Model):
    __tablename__ = 'view_logs'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    date = db.Column(db.Date, default=lambda: datetime.utcnow().date())

class ClickLog(db.Model):
    __tablename__ = 'click_logs'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id'))
    date = db.Column(db.Date, default=lambda: datetime.utcnow().date())

# Compatibilité
class Company(db.Model): 
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    
class Referral(db.Model): 
    __tablename__ = 'referrals'
    id = db.Column(db.Integer, primary_key=True)
    
class Booking(db.Model): 
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    
class Service(db.Model): 
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    
class Availability(db.Model): 
    __tablename__ = 'availabilities'
    id = db.Column(db.Integer, primary_key=True)
    
class UserDevice(db.Model): 
    __tablename__ = 'user_devices'
    id = db.Column(db.Integer, primary_key=True)
    
class Activation(db.Model): 
    __tablename__ = 'activations'
    id = db.Column(db.Integer, primary_key=True)
    
class PartnerFeedback(db.Model): 
    __tablename__ = 'partner_feedbacks'
    id = db.Column(db.Integer, primary_key=True)
