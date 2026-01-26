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
    
    partner_profile = db.relationship('Partner', backref='owner', uselist=False, foreign_keys='Partner.user_id')
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
    feedbacks = db.relationship('PartnerFeedback', backref='member', lazy=True)

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    name = db.Column(db.String(100), index=True)
    category = db.Column(db.String(50), index=True)
    # sector_id = db.Column(db.Integer, db.ForeignKey('activity_sectors.id'))  # TODO: Ajouter migration
    city = db.Column(db.String(100), index=True)
    latitude = db.Column(db.Float, index=True)
    longitude = db.Column(db.Float, index=True)
    image_url = db.Column(db.String(500))
    
    # V20 ADMIN - Adresse complète
    address_street = db.Column(db.String(200))
    address_number = db.Column(db.String(20))
    address_postal_code = db.Column(db.String(20))
    address_city = db.Column(db.String(100))
    address_country = db.Column(db.String(2), default='CH')
    
    # V20 ADMIN - Contact
    phone = db.Column(db.String(50))
    website = db.Column(db.String(200))
    opening_hours = db.Column(db.Text)  # JSON ou texte libre
    
    # V20 ADMIN - Gestion et statut
    status = db.Column(db.String(20), default='active', index=True)  # active, warned, suspended, excluded
    warnings_count = db.Column(db.Integer, default=0)
    suspension_reason = db.Column(db.Text)
    admin_notes = db.Column(db.Text)
    
    # V20 ADMIN - Validation
    validation_status = db.Column(db.String(20), default='draft', index=True)  # draft, pending, published
    validated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    validated_at = db.Column(db.DateTime)
    
    # Relation explicite pour le validateur
    validator = db.relationship('User', foreign_keys=[validated_by], primaryjoin="Partner.validated_by == User.id", backref=db.backref('validated_partners', lazy='dynamic'))
    
    offers = db.relationship('Offer', backref='partner', lazy=True)
    feedbacks = db.relationship('PartnerFeedback', backref='partner', lazy=True)
    warnings = db.relationship('PartnerWarning', backref='partner', lazy=True)
    addresses = db.relationship('PartnerAddress', backref='partner', lazy='dynamic', cascade="all, delete-orphan")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AccessSlot(db.Model):
    __tablename__ = 'access_slots'
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'))
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=True)
    status = db.Column(db.String(20), default='empty')
    invited_email = db.Column(db.String(120))
    invitation_token = db.Column(db.String(100))

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
    
    # V20 ADMIN - Détails privilège
    description = db.Column(db.Text)
    conditions = db.Column(db.Text)
    valid_from = db.Column(db.DateTime)
    valid_until = db.Column(db.DateTime)
    max_uses_per_member = db.Column(db.Integer)
    priority = db.Column(db.Integer, default=0)  # Pour trier les offres
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PrivilegeUsage(db.Model):
    __tablename__ = 'privilege_usages'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'))
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'))
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id'))
    used_at = db.Column(db.DateTime, default=datetime.utcnow)
    validation_code = db.Column(db.String(100))
    offer_title = db.Column(db.String(100))

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100))
    access_total = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# V20 ADMIN - Système de feedback membres
class PartnerFeedback(db.Model):
    __tablename__ = 'partner_feedbacks'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), index=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), index=True)
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id'), nullable=True)
    
    # Feedback membre
    rating = db.Column(db.Integer)  # 1-5 étoiles
    experience_type = db.Column(db.String(50), index=True)  # privilege_granted, privilege_refused, bad_service, excellent_service
    comment = db.Column(db.Text)
    
    # Gestion admin
    admin_viewed = db.Column(db.Boolean, default=False, index=True)
    admin_action_taken = db.Column(db.String(50))  # no_action, warning_sent, partner_contacted, excluded
    admin_notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

# V20 ADMIN - Historique des avertissements
class PartnerWarning(db.Model):
    __tablename__ = 'partner_warnings'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), index=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    warning_type = db.Column(db.String(50), index=True)  # feedback_negative, rules_violation, inactive, other
    severity = db.Column(db.String(20))  # low, medium, high, exclusion
    reason = db.Column(db.Text)
    action_taken = db.Column(db.String(50))  # warning_sent, suspended_7days, suspended_30days, excluded
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

# V20 ADMIN - Système de notifications internes
class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Ciblage
    target_type = db.Column(db.String(20), index=True)  # individual, group, global
    target_role = db.Column(db.String(20), index=True)  # member, partner, all
    target_category = db.Column(db.String(50))  # B2C, PME, CORP (pour filtrer)
    target_city = db.Column(db.String(100))  # Pour ciblage géographique
    target_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Pour notifications individuelles
    
    # Contenu
    title = db.Column(db.String(200))
    message = db.Column(db.Text)
    action_url = db.Column(db.String(500))  # Lien optionnel
    
    # Planification
    scheduled_for = db.Column(db.DateTime, nullable=True)
    sent_at = db.Column(db.DateTime, index=True)
    
    # Statistiques
    recipients_count = db.Column(db.Integer, default=0)
    read_count = db.Column(db.Integer, default=0)
    
    receipts = db.relationship('NotificationReceipt', backref='notification', lazy=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# V20 ADMIN - Suivi de lecture des notifications
class NotificationReceipt(db.Model):
    __tablename__ = 'notification_receipts'
    id = db.Column(db.Integer, primary_key=True)
    notification_id = db.Column(db.Integer, db.ForeignKey('notifications.id'), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# V20 ADMIN - Système de parrainage adaptatif
class Referral(db.Model):
    __tablename__ = 'referrals'
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)  # Parrain
    referred_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)  # Filleul (null si pas encore inscrit)
    
    referrer_type = db.Column(db.String(20), index=True)  # member, partner
    referral_code = db.Column(db.String(50), unique=True, index=True)
    referred_email = db.Column(db.String(120))  # Email du filleul invité
    
    # Statut et récompenses
    status = db.Column(db.String(20), default='pending', index=True)  # pending, completed, rewarded
    reward_type = db.Column(db.String(50))  # free_month, discount, badge, premium_highlight
    reward_applied = db.Column(db.Boolean, default=False)
    
    # Métadonnées
    pack_category = db.Column(db.String(50))  # B2C, PME, CORP (pour adapter les récompenses)
    access_count = db.Column(db.Integer)  # Nombre d'accès du pack (pour seuil 30)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    completed_at = db.Column(db.DateTime)

# Tables stubs (à développer plus tard)
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

class ViewLog(db.Model):
    __tablename__ = 'view_logs'
    id = db.Column(db.Integer, primary_key=True)

class ClickLog(db.Model):
    __tablename__ = 'click_logs'
    id = db.Column(db.Integer, primary_key=True)


# V2 - Système d'adresses multiples pour les partenaires
class PartnerAddress(db.Model):
    """
    Table pour gérer les adresses multiples des partenaires
    (un partenaire peut avoir plusieurs établissements)
    """
    __tablename__ = 'partner_addresses'

    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False, index=True)

    # Détails de l'adresse
    street = db.Column(db.String(200), nullable=False)
    number = db.Column(db.String(20))
    postal_code = db.Column(db.String(20), nullable=False)
    city = db.Column(db.String(100), nullable=False, index=True)
    canton = db.Column(db.String(50))
    country = db.Column(db.String(2), default='CH', nullable=False)

    # Géocodage (pour la map interactive)
    latitude = db.Column(db.Float, index=True)
    longitude = db.Column(db.Float, index=True)

    # Gestion de la priorité
    is_primary = db.Column(db.Boolean, default=False, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PartnerAddress {self.street} {self.number}, {self.city}>"
