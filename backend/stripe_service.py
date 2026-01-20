import os
import stripe
import random
import string
from datetime import datetime, timedelta
from models import db, Member, Pack, Subscription, AccessSlot

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
FRONTEND_URL = os.getenv('DOMAIN_URL', "https://www.peps.swiss")

def sync_v19_products():
    """Crée les produits Stripe V19"""
    if not stripe.api_key: return
    packs = Pack.query.all()
    for p in packs:
        if not p.stripe_price_id:
            try:
                prod = stripe.Product.create(name=f"PEP's - {p.name}")
                price = stripe.Price.create(
                    product=prod.id,
                    unit_amount=int(p.price_chf * 100),
                    currency='chf',
                    recurring={'interval': 'year'},
                )
                p.stripe_price_id = price.id
                db.session.commit()
                print(f"✅ Stripe Price: {p.name}")
            except: pass

def create_checkout_session(member_id, pack_id):
    member = Member.query.get(member_id)
    pack = Pack.query.get(pack_id)
    
    if not pack.stripe_price_id: sync_v19_products()
    pack = Pack.query.get(pack_id) # Reload

    try:
        if not member.stripe_customer_id:
            cust = stripe.Customer.create(email=member.user.email, name=f"{member.first_name}")
            member.stripe_customer_id = cust.id
            db.session.commit()

        session = stripe.checkout.Session.create(
            customer=member.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{'price': pack.stripe_price_id, 'quantity': 1}],
            mode='subscription',
            success_url=f"{FRONTEND_URL}/?success=sub_ok",
            cancel_url=f"{FRONTEND_URL}/?canceled=true",
            client_reference_id=f"{member.id}|{pack.id}"
        )
        return {"url": session.url}
    except Exception as e:
        return {"error": str(e)}

def handle_subscription_success(stripe_sub_id, member_id, pack_id, end_timestamp):
    """Active l'abo et génère les N slots"""
    try:
        member = Member.query.get(member_id)
        pack = Pack.query.get(pack_id)
        
        # 1. Créer l'abonnement
        sub = Subscription(
            member_id=member.id,
            pack_id=pack.id,
            stripe_subscription_id=stripe_sub_id,
            status='active',
            current_period_end=datetime.fromtimestamp(end_timestamp)
        )
        db.session.add(sub)
        db.session.commit()
        
        # 2. Générer les Slots
        # Slot 1 : Pour le propriétaire (Auto-assigné)
        owner_slot = AccessSlot(subscription_id=sub.id, member_id=member.id, status='active')
        db.session.add(owner_slot)
        
        # Slots restants : Vides (à inviter)
        for _ in range(pack.max_slots - 1):
            db.session.add(AccessSlot(subscription_id=sub.id, status='empty'))
            
        db.session.commit()
        print(f"🎉 Abo V19 activé ({pack.max_slots} slots)")
    except Exception as e:
        print(f"❌ Erreur activation: {e}")
