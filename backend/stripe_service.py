import os
import stripe
from datetime import datetime, timedelta
from models import db, Member, Pack

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
FRONTEND_URL = os.getenv('DOMAIN_URL', "https://www.peps.swiss")

def sync_stripe_products():
    """Crée le produit d'abonnement dans Stripe si inexistant"""
    if not stripe.api_key: return
    try:
        pack = Pack.query.filter_by(name="Abonnement Annuel").first()
        if pack and not pack.stripe_price_id:
            # Création Product + Price
            prod = stripe.Product.create(name="Abonnement PEP's Digital")
            price = stripe.Price.create(
                product=prod.id,
                unit_amount=4900, # 49.00 CHF
                currency='chf',
                recurring={'interval': 'year'},
            )
            pack.stripe_price_id = price.id
            db.session.commit()
            print(f"✅ Stripe Price Created: {price.id}")
    except Exception as e:
        print(f"⚠️ Stripe Sync Error: {e}")

def create_checkout_session(member_id):
    member = Member.query.get(member_id)
    pack = Pack.query.filter_by(name="Abonnement Annuel").first()
    
    if not pack or not pack.stripe_price_id:
        return {"error": "Configuration Stripe incomplète (Pack manquant)"}

    try:
        # Création Client Stripe si besoin
        if not member.stripe_customer_id:
            cust = stripe.Customer.create(email=member.owner.email, name=f"{member.first_name}")
            member.stripe_customer_id = cust.id
            db.session.commit()

        session = stripe.checkout.Session.create(
            customer=member.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{'price': pack.stripe_price_id, 'quantity': 1}],
            mode='subscription',
            success_url=f"{FRONTEND_URL}/?success=subscription_active",
            cancel_url=f"{FRONTEND_URL}/?canceled=true",
            client_reference_id=str(member.id)
        )
        return {"url": session.url}
    except Exception as e:
        return {"error": str(e)}

def create_portal_session(member_id):
    member = Member.query.get(member_id)
    if not member or not member.stripe_customer_id: return None
    try:
        session = stripe.billing_portal.Session.create(
            customer=member.stripe_customer_id,
            return_url=FRONTEND_URL
        )
        return session.url
    except: return None

def handle_subscription_success(member_id, end_timestamp):
    member = Member.query.get(member_id)
    if member:
        member.subscription_status = 'active'
        member.current_period_end = datetime.fromtimestamp(end_timestamp)
        db.session.commit()
        print(f"🎉 Abonnement activé pour Membre {member_id}")
