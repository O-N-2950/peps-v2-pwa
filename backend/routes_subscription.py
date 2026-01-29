"""
Routes API pour gestion abonnements et paiements Stripe
"""

from flask import Blueprint, request, jsonify, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe
import os

from models import db, User, Subscription, SubscriptionMember
from pricing import calculate_subscription_price
from stripe_setup import get_or_create_stripe_price

subscription_bp = Blueprint('subscription', __name__)

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Mapping prix pré-créés (à charger depuis DB ou config)
# Format: {nb_access: {'chf': 'price_xxx', 'eur': 'price_yyy'}}
PRICE_MAPPING = {}  # À remplir après create_all_stripe_prices()


@subscription_bp.route('/api/subscription/create-checkout', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """
    Crée une session Stripe Checkout
    
    POST /api/subscription/create-checkout
    Body: {
        "nb_access": 58,
        "currency": "CHF"  # Optionnel, détection auto sinon
    }
    
    Returns:
        200: {
            "checkout_url": "https://checkout.stripe.com/...",
            "session_id": "cs_...",
            "currency": "CHF"
        }
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        data = request.get_json()
        nb_access = data.get('nb_access', 1)
        currency = data.get('currency', 'CHF').upper()
        
        # Validation
        if nb_access < 1:
            return jsonify({'error': 'Minimum 1 accès'}), 400
        
        if currency not in ['CHF', 'EUR']:
            return jsonify({'error': 'Devise non supportée'}), 400
        
        # Calculer prix
        pricing = calculate_subscription_price(nb_access)
        
        if pricing['total_price'] is None:
            return jsonify({
                'error': 'Pour plus de 5000 accès, contactez business@peps.digital'
            }), 400
        
        # Récupérer ou créer Stripe Price
        try:
            stripe_price_id = get_or_create_stripe_price(
                nb_access,
                currency,
                PRICE_MAPPING
            )
        except Exception as e:
            return jsonify({
                'error': 'Erreur création prix Stripe',
                'details': str(e)
            }), 500
        
        # Créer session Stripe Checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': stripe_price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{os.getenv('DOMAIN_URL')}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('DOMAIN_URL')}/checkout/cancel",
            client_reference_id=str(user.id),
            customer_email=user.email,
            metadata={
                'user_id': str(user.id),
                'nb_access': str(nb_access),
                'currency': currency,
                'tier_type': pricing['tier_type']
            },
            subscription_data={
                'metadata': {
                    'user_id': str(user.id),
                    'nb_access': str(nb_access)
                }
            }
        )
        
        return jsonify({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
            'currency': currency,
            'nb_access': nb_access,
            'total_price': pricing['total_price']
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Erreur lors de la création de la session',
            'details': str(e)
        }), 500


@subscription_bp.route('/api/subscription/webhook', methods=['POST'])
def stripe_webhook():
    """
    Webhook Stripe pour événements de paiement
    
    POST /api/subscription/webhook
    
    Événements gérés:
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    """
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Gérer les événements
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_completed(session)
    
    elif event['type'] == 'customer.subscription.created':
        subscription = event['data']['object']
        handle_subscription_created(subscription)
    
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_updated(subscription)
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_deleted(subscription)
    
    return jsonify({'status': 'success'}), 200


def handle_checkout_completed(session):
    """Traite paiement réussi"""
    user_id = session['client_reference_id']
    stripe_subscription_id = session['subscription']
    nb_access = int(session['metadata']['nb_access'])
    currency = session['metadata']['currency']
    
    # Créer abonnement dans DB
    subscription = Subscription(
        admin_user_id=user_id,
        subscription_type='individual' if nb_access == 1 else 'family' if nb_access <= 30 else 'business',
        max_members=nb_access,
        stripe_subscription_id=stripe_subscription_id,
        currency=currency,
        status='active'
    )
    
    db.session.add(subscription)
    
    # Ajouter admin comme premier membre
    member = SubscriptionMember(
        subscription=subscription,
        user_id=user_id,
        member_name="Admin",
        status='active'
    )
    
    db.session.add(member)
    db.session.commit()
    
    print(f"✅ Abonnement créé pour user {user_id}")


def handle_subscription_created(subscription):
    """Abonnement créé"""
    print(f"ℹ️  Subscription créée: {subscription['id']}")


def handle_subscription_updated(subscription):
    """Abonnement mis à jour"""
    stripe_sub_id = subscription['id']
    status = subscription['status']
    
    sub = Subscription.query.filter_by(stripe_subscription_id=stripe_sub_id).first()
    if sub:
        sub.status = status
        db.session.commit()
        print(f"✅ Subscription {stripe_sub_id} mise à jour: {status}")


def handle_subscription_deleted(subscription):
    """Abonnement annulé"""
    stripe_sub_id = subscription['id']
    
    sub = Subscription.query.filter_by(stripe_subscription_id=stripe_sub_id).first()
    if sub:
        sub.status = 'cancelled'
        db.session.commit()
        print(f"✅ Subscription {stripe_sub_id} annulée")
