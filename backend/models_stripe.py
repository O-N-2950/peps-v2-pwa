"""
Modèles SQLAlchemy pour les tables Stripe
À ajouter dans models.py ou à importer séparément
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# ==========================================
# NOUVEAUX MODÈLES STRIPE (V2)
# ==========================================

class Payment(db.Model):
    """
    Historique de tous les paiements effectués
    """
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=True, index=True)
    
    # Identifiants Stripe
    stripe_session_id = db.Column(db.String(255), unique=True, index=True)
    stripe_payment_intent_id = db.Column(db.String(255), index=True)
    
    # Montant et devise
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='CHF')
    
    # Statut du paiement
    status = db.Column(db.String(20), default='pending', index=True)  # 'succeeded', 'failed', 'refunded', 'pending'
    payment_method = db.Column(db.String(50))  # 'card', 'sepa_debit', etc.
    
    # Dates
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relations
    user = db.relationship('User', backref=db.backref('payments', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Payment {self.id}: {self.amount} {self.currency} - {self.status}>'


# ==========================================
# NOTE: Les modèles Subscription et AccessSlot
# existent déjà dans models.py mais avec une
# structure différente. Il faudra les adapter
# ou créer une migration pour ajouter les
# colonnes manquantes.
# ==========================================

# Colonnes à ajouter à Subscription existant:
# - user_id (au lieu de member_id)
# - pack_size
# - price_annual
# - stripe_customer_id
# - current_period_start
# - cancel_at_period_end

# Colonnes à ajouter à AccessSlot existant:
# - manager_id
# - assigned_email (au lieu de invited_email)
# - assigned_user_id
# - activated_at
