"""
Modèle SQLAlchemy pour le tracking des activations de privilèges
"""
from models import db
from datetime import datetime

class PrivilegeActivation(db.Model):
    """
    Table de tracking des activations de privilèges
    Permet de suivre chaque activation avec feedback optionnel
    """
    __tablename__ = 'privilege_activations'
    
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=False, index=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False, index=True)
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id'), nullable=False)
    
    # Informations d'activation
    activated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    validation_code = db.Column(db.String(100), unique=True, nullable=False, index=True)
    
    # Statut: active, expired, validated, cancelled
    status = db.Column(db.String(20), nullable=False, default='active', index=True)
    
    # Feedback membre (optionnel)
    feedback_rating = db.Column(db.Integer)  # 1-5 étoiles
    feedback_comment = db.Column(db.Text)
    feedback_submitted_at = db.Column(db.DateTime)
    feedback_points_awarded = db.Column(db.Integer, default=0)
    
    # Métadonnées
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    device_info = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    member = db.relationship('Member', backref=db.backref('activations', lazy='dynamic'))
    partner = db.relationship('Partner', backref=db.backref('activations', lazy='dynamic'))
    offer = db.relationship('Offer', backref=db.backref('activations', lazy='dynamic'))
    
    def to_dict(self):
        """Convertit l'activation en dictionnaire"""
        return {
            'id': self.id,
            'member_id': self.member_id,
            'partner_id': self.partner_id,
            'offer_id': self.offer_id,
            'activated_at': self.activated_at.isoformat() if self.activated_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'validation_code': self.validation_code,
            'status': self.status,
            'feedback_rating': self.feedback_rating,
            'feedback_comment': self.feedback_comment,
            'feedback_submitted_at': self.feedback_submitted_at.isoformat() if self.feedback_submitted_at else None,
            'feedback_points_awarded': self.feedback_points_awarded,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
