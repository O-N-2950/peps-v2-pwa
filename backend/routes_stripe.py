"""
Routes API Stripe pour PEP'S V2
Gestion des paiements et abonnements
"""

import os
import stripe
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from models import db, User, Subscription, AccessSlot
try:
    from models_stripe import Payment
except ImportError:
    # Créer le modèle Payment temporairement
    class Payment(db.Model):
        __tablename__ = 'payments'
        id = db.Column(db.Integer, primary_key=True)
        user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
        subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'))
        stripe_session_id = db.Column(db.String(255))
        stripe_payment_intent_id = db.Column(db.String(255))
        amount = db.Column(db.Numeric(10, 2))
        currency = db.Column(db.String(3))
        status = db.Column(db.String(20))
        payment_method = db.Column(db.String(50))
        created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Configuration Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')
DOMAIN_URL = os.getenv('DOMAIN_URL', 'https://www.peps.swiss')

# Blueprint
stripe_bp = Blueprint('stripe', __name__)

# ==========================================
# GRILLE TARIFAIRE OFFICIELLE (Source de vérité)
# ==========================================
# UNE SEULE grille pour tous (pas de distinction Particulier/Entreprise)
PRICING_TIERS = {
    1: 49, 2: 89, 3: 129, 4: 164, 5: 199,
    6: 245, 7: 289, 8: 330, 9: 360, 10: 390,
    12: 460, 15: 550, 20: 700, 25: 850, 30: 1000,
    40: 1280, 50: 1500, 75: 2000, 100: 2500,
    150: 3300, 200: 4000, 300: 5400, 400: 7200, 500: 7500,
    750: 9000, 1000: 12000, 2500: 25000, 5000: 40000
}

# ==========================================
# ROUTE 1 : RÉCUPÉRER LA GRILLE TARIFAIRE
# ==========================================
@stripe_bp.route('/pricing', methods=['GET'])
def get_pricing():
    """
    Retourne la grille tarifaire complète
    
    Returns:
        [
            {
                "access_count": 1,
                "price": 49,
                "price_per_access": 49.00,
                "popular": false
            },
            ...
        ]
    """
    pricing_list = []
    for access_count, price in PRICING_TIERS.items():
        pricing_list.append({
            "access_count": access_count,
            "price": price,
            "price_per_access": round(price / access_count, 2),
            "popular": access_count == 5  # Badge "POPULAIRE" sur le pack 5 accès
        })
    
    # Trier par nombre d'accès
    pricing_list.sort(key=lambda x: x['access_count'])
    
    return jsonify(pricing_list)

# ==========================================
# ROUTE 2 : CRÉER UNE SESSION STRIPE CHECKOUT
# ==========================================
@stripe_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """
    Crée une session Stripe Checkout
    
    Payload:
        {
            "pack_size": 5,
            "currency": "CHF"  # Optionnel, défaut CHF
        }
    
    Returns:
        {
            "checkout_url": "https://checkout.stripe.com/..."
        }
    
    SÉCURITÉ CRITIQUE:
    - Le prix est TOUJOURS vérifié côté serveur via PRICING_TIERS
    - On ne fait JAMAIS confiance au prix envoyé par le frontend
    """
    try:
        data = request.get_json()
        pack_size = int(data.get('pack_size', 1))
        currency = data.get('currency', 'CHF').upper()
        
        # Validation de la devise
        if currency not in ['CHF', 'EUR']:
            return jsonify({'error': 'Devise non supportée. Utilisez CHF ou EUR.'}), 400
        
        # SÉCURITÉ : Vérifier que le pack existe dans la grille officielle
        if pack_size not in PRICING_TIERS:
            return jsonify({
                'error': f'Ce pack ({pack_size} accès) n\'est pas disponible à l\'achat automatique. Contactez-nous pour un devis personnalisé.'
            }), 400
        
        # Récupérer le prix depuis la grille serveur
        price_amount = PRICING_TIERS[pack_size]
        
        # Récupérer l'utilisateur connecté
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Créer la session Stripe Checkout
        checkout_session = stripe.checkout.Session.create(
            customer_email=user.email,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': currency.lower(),
                    'product_data': {
                        'name': f"Pack PEP'S - {pack_size} Accès",
                        'description': f"Abonnement annuel aux privilèges exclusifs chez 100+ commerçants partenaires",
                        'images': ['https://www.peps.swiss/logo.png'],  # TODO: Ajouter le vrai logo
                    },
                    'unit_amount': int(price_amount * 100),  # Stripe utilise les centimes
                },
                'quantity': 1,
            }],
            mode='payment',  # Paiement unique annuel (pas d'abonnement récurrent)
            success_url=f"{DOMAIN_URL}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{DOMAIN_URL}/pricing?payment=canceled",
            metadata={
                'user_id': user.id,
                'pack_size': pack_size,
                'price_annual': price_amount,
                'currency': currency
            }
        )
        
        return jsonify({'checkout_url': checkout_session.url})
        
    except ValueError as e:
        return jsonify({'error': f'Données invalides: {str(e)}'}), 400
    except stripe.error.StripeError as e:
        return jsonify({'error': f'Erreur Stripe: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

# ==========================================
# ROUTE 3 : WEBHOOK STRIPE
# ==========================================
@stripe_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """
    Reçoit les événements Stripe
    
    Événements gérés:
    - checkout.session.completed : Paiement réussi
    - invoice.paid : Renouvellement payé
    - customer.subscription.deleted : Abonnement annulé
    """
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        print("❌ Webhook: Invalid payload")
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        print("❌ Webhook: Invalid signature")
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Gérer les événements
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        print(f"💰 PAIEMENT REÇU: User {session['metadata'].get('user_id')} - Pack {session['metadata'].get('pack_size')}")
        
        # Créer l'abonnement dans la base de données
        create_subscription_from_session(session)
    
    elif event['type'] == 'invoice.paid':
        invoice = event['data']['object']
        print(f"💳 FACTURE PAYÉE: {invoice['id']}")
        # TODO: Gérer le renouvellement
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        print(f"❌ ABONNEMENT ANNULÉ: {subscription['id']}")
        # TODO: Désactiver l'abonnement dans la base de données
    
    return jsonify({'success': True}), 200

# ==========================================
# ROUTE 4 : RÉCUPÉRER L'ABONNEMENT ACTUEL
# ==========================================
@stripe_bp.route('/subscriptions/me', methods=['GET'])
@jwt_required()
def get_my_subscription():
    """
    Retourne l'abonnement de l'utilisateur connecté
    
    Returns:
        {
            "pack_size": 5,
            "price": 199,
            "currency": "CHF",
            "status": "active",
            "start_date": "2026-01-22",
            "end_date": "2027-01-22",
            "remaining_slots": 3,
            "total_slots": 5
        }
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    # Récupérer l'abonnement actif
    subscription = Subscription.query.filter_by(
        user_id=user.id,
        status='active'
    ).order_by(Subscription.created_at.desc()).first()
    
    if not subscription:
        return jsonify({'error': 'Aucun abonnement actif'}), 404
    
    # Compter les slots disponibles
    total_slots = subscription.pack_size
    used_slots = AccessSlot.query.filter_by(
        subscription_id=subscription.id,
        status='active'
    ).count()
    remaining_slots = total_slots - used_slots
    
    return jsonify({
        'pack_size': subscription.pack_size,
        'price': float(subscription.price_annual),
        'currency': subscription.currency,
        'status': subscription.status,
        'start_date': subscription.current_period_start.strftime('%Y-%m-%d') if subscription.current_period_start else None,
        'end_date': subscription.current_period_end.strftime('%Y-%m-%d') if subscription.current_period_end else None,
        'remaining_slots': remaining_slots,
        'total_slots': total_slots,
        'auto_renew': not subscription.cancel_at_period_end
    })

# ==========================================
# FONCTION HELPER : CRÉER L'ABONNEMENT
# ==========================================
def create_subscription_from_session(session):
    """
    Crée l'abonnement dans PostgreSQL après un paiement réussi
    
    Args:
        session: Objet Stripe Checkout Session
    """
    try:
        # Récupérer les métadonnées
        user_id = int(session['metadata']['user_id'])
        pack_size = int(session['metadata']['pack_size'])
        price_annual = float(session['metadata']['price_annual'])
        currency = session['metadata'].get('currency', 'CHF')
        
        # Récupérer l'utilisateur
        user = User.query.get(user_id)
        if not user:
            print(f"❌ Utilisateur {user_id} non trouvé")
            return
        
        # Dates de l'abonnement (1 an)
        start_date = datetime.now()
        end_date = start_date + timedelta(days=365)
        
        # Créer l'abonnement
        subscription = Subscription(
            user_id=user_id,
            pack_size=pack_size,
            price_annual=price_annual,
            currency=currency,
            stripe_subscription_id=session.get('subscription'),
            stripe_customer_id=session.get('customer'),
            status='active',
            current_period_start=start_date,
            current_period_end=end_date,
            cancel_at_period_end=False
        )
        db.session.add(subscription)
        db.session.flush()  # Pour obtenir l'ID
        
        # Créer les slots d'accès
        for i in range(pack_size):
            slot = AccessSlot(
                subscription_id=subscription.id,
                manager_id=user_id,
                status='available'
            )
            db.session.add(slot)
        
        # Créer l'enregistrement de paiement
        payment = Payment(
            user_id=user_id,
            subscription_id=subscription.id,
            stripe_session_id=session['id'],
            stripe_payment_intent_id=session.get('payment_intent'),
            amount=price_annual,
            currency=currency,
            status='succeeded',
            payment_method='card'
        )
        db.session.add(payment)
        
        # Mettre à jour l'utilisateur
        user.stripe_customer_id = session.get('customer')
        user.is_subscription_owner = True
        
        db.session.commit()
        
        print(f"✅ Abonnement créé: User {user_id} - {pack_size} accès - {price_annual} {currency}")
        
        # TODO: Envoyer l'email de confirmation
        # send_subscription_confirmation_email(user, subscription)
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur création abonnement: {e}")
