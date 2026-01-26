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

# ===========================
# SYSTÈME DE RÉSERVATION
# ===========================
from sqlalchemy.dialects.postgresql import JSON

class Service(db.Model):
    """
    Catalogue des prestations proposées par un commerçant
    Mode 1 (Simple) : Un seul service générique "Réservation"
    Mode 2 (Catalogue) : Plusieurs services avec prix et durées
    """
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False, index=True)
    
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    peps_discount_percent = db.Column(db.Float, default=0)
    peps_discount_amount = db.Column(db.Float, default=0)
    duration_minutes = db.Column(db.Integer, nullable=False)
    capacity = db.Column(db.Integer, default=1)
    is_active = db.Column(db.Boolean, default=True, index=True)
    display_order = db.Column(db.Integer, default=0)
    
    bookings = db.relationship('Booking', backref='service', lazy='dynamic')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id, 'partner_id': self.partner_id, 'name': self.name,
            'description': self.description, 'price': self.price,
            'peps_discount_percent': self.peps_discount_percent,
            'peps_discount_amount': self.peps_discount_amount,
            'duration_minutes': self.duration_minutes, 'capacity': self.capacity,
            'is_active': self.is_active, 'display_order': self.display_order
        }

class PartnerBookingConfig(db.Model):
    __tablename__ = 'partner_booking_configs'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False, unique=True, index=True)
    booking_mode = db.Column(db.String(20), default='catalog', nullable=False)
    is_enabled = db.Column(db.Boolean, default=False)
    slot_duration_minutes = db.Column(db.Integer, default=30)
    advance_booking_days = db.Column(db.Integer, default=30)
    min_notice_hours = db.Column(db.Integer, default=2)
    opening_hours = db.Column(JSON, default={})
    closed_dates = db.Column(JSON, default=[])
    max_concurrent_bookings = db.Column(db.Integer, default=1)
    notification_email = db.Column(db.String(120))
    notification_phone = db.Column(db.String(50))
    send_sms_notifications = db.Column(db.Boolean, default=False)
    send_email_notifications = db.Column(db.Boolean, default=True)
    cancellation_hours = db.Column(db.Integer, default=24)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id, 'partner_id': self.partner_id, 'booking_mode': self.booking_mode,
            'is_enabled': self.is_enabled, 'slot_duration_minutes': self.slot_duration_minutes,
            'advance_booking_days': self.advance_booking_days, 'min_notice_hours': self.min_notice_hours,
            'opening_hours': self.opening_hours, 'closed_dates': self.closed_dates,
            'max_concurrent_bookings': self.max_concurrent_bookings,
            'notification_email': self.notification_email, 'notification_phone': self.notification_phone,
            'send_sms_notifications': self.send_sms_notifications,
            'send_email_notifications': self.send_email_notifications,
            'cancellation_hours': self.cancellation_hours
        }

class Creneau(db.Model):
    __tablename__ = 'creneaux'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False, index=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True, index=True)
    start_utc = db.Column(db.DateTime, nullable=False, index=True)
    end_utc = db.Column(db.DateTime, nullable=False)
    capacity_total = db.Column(db.Integer, default=1)
    capacity_remaining = db.Column(db.Integer, default=1)
    is_available = db.Column(db.Boolean, default=True, index=True)
    blocked_reason = db.Column(db.String(100))
    bookings = db.relationship('Booking', backref='creneau', lazy='dynamic')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.Index('idx_partner_start_available', 'partner_id', 'start_utc', 'is_available'),)
    
    def to_dict(self):
        return {
            'id': self.id, 'partner_id': self.partner_id, 'service_id': self.service_id,
            'start_utc': self.start_utc.isoformat() if self.start_utc else None,
            'end_utc': self.end_utc.isoformat() if self.end_utc else None,
            'capacity_total': self.capacity_total, 'capacity_remaining': self.capacity_remaining,
            'is_available': self.is_available, 'blocked_reason': self.blocked_reason
        }

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=False, index=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False, index=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True, index=True)
    creneau_id = db.Column(db.Integer, db.ForeignKey('creneaux.id'), nullable=False, index=True)
    booking_date = db.Column(db.DateTime, nullable=False, index=True)
    duration_minutes = db.Column(db.Integer, nullable=False)
    number_of_people = db.Column(db.Integer, default=1)
    price_original = db.Column(db.Float)
    price_final = db.Column(db.Float)
    discount_applied = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default='confirmed', index=True)
    member_notes = db.Column(db.Text)
    partner_notes = db.Column(db.Text)
    cancelled_at = db.Column(db.DateTime)
    cancelled_by = db.Column(db.String(20))
    cancellation_reason = db.Column(db.Text)
    reminder_sent_at = db.Column(db.DateTime)
    confirmation_sent_at = db.Column(db.DateTime)
    google_event_id = db.Column(db.String(200), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id, 'member_id': self.member_id, 'partner_id': self.partner_id,
            'service_id': self.service_id, 'creneau_id': self.creneau_id,
            'booking_date': self.booking_date.isoformat() if self.booking_date else None,
            'duration_minutes': self.duration_minutes, 'number_of_people': self.number_of_people,
            'price_original': self.price_original, 'price_final': self.price_final,
            'discount_applied': self.discount_applied, 'status': self.status,
            'member_notes': self.member_notes, 'partner_notes': self.partner_notes,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancelled_by': self.cancelled_by, 'cancellation_reason': self.cancellation_reason,
            'google_event_id': self.google_event_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class GoogleCalendarToken(db.Model):
    __tablename__ = 'google_calendar_tokens'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False, unique=True, index=True)
    access_token = db.Column(db.Text, nullable=False)
    refresh_token = db.Column(db.Text, nullable=False)
    token_expiry = db.Column(db.DateTime, nullable=False)
    calendar_id = db.Column(db.String(200), default='primary')
    calendar_timezone = db.Column(db.String(50), default='Europe/Zurich')
    webhook_id = db.Column(db.String(200))
    webhook_resource_id = db.Column(db.String(200))
    webhook_expiry = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True, index=True)
    last_sync_at = db.Column(db.DateTime)
    sync_error = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id, 'partner_id': self.partner_id, 'calendar_id': self.calendar_id,
            'calendar_timezone': self.calendar_timezone, 'is_active': self.is_active,
            'last_sync_at': self.last_sync_at.isoformat() if self.last_sync_at else None,
            'webhook_expiry': self.webhook_expiry.isoformat() if self.webhook_expiry else None
        }

class BookingNotificationLog(db.Model):
    __tablename__ = 'booking_notification_logs'
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False, index=True)
    notification_type = db.Column(db.String(50), nullable=False)
    recipient_type = db.Column(db.String(20), nullable=False)
    channel = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='pending')
    error_message = db.Column(db.Text)
    sent_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

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
