import os
import stripe
from datetime import datetime, timedelta
from models import db, Member, Pack, Subscription, AccessSlot

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
FRONTEND_URL = os.getenv('DOMAIN_URL', "https://www.peps.world")

def sync_v20_products():
    """AUTO-SYNC : Crée les 58 prix sur Stripe"""
    if not stripe.api_key: return
    
    packs = Pack.query.all()
    print(f"🔄 V20 Stripe Sync: {len(packs)} Packs...")
    
    for p in packs:
        if not p.stripe_price_id_chf or not p.stripe_price_id_eur:
            try:
                # 1. Produit
                prod_name = f"PEP's - {p.name}"
                existing = stripe.Product.search(query=f"name:'{prod_name}'")
                prod_id = existing['data'][0].id if existing['data'] else stripe.Product.create(name=prod_name).id
                p.stripe_product_id = prod_id

                # 2. Prix CHF
                if not p.stripe_price_id_chf:
                    p.stripe_price_id_chf = stripe.Price.create(
                        product=prod_id, unit_amount=int(p.price_amount * 100), currency='chf', recurring={'interval': 'year'}
                    ).id
                
                # 3. Prix EUR
                if not p.stripe_price_id_eur:
                    p.stripe_price_id_eur = stripe.Price.create(
                        product=prod_id, unit_amount=int(p.price_amount * 100), currency='eur', recurring={'interval': 'year'}
                    ).id
                
                db.session.commit()
                print(f"✅ Synced {p.name}")
            except Exception as e: print(f"❌ Error {p.name}: {e}")

def create_checkout_v20(member_id, pack_id, currency='CHF'):
    member = Member.query.get(member_id)
    pack = Pack.query.get(pack_id)
    
    # Sélection intelligente du prix
    price_id = pack.stripe_price_id_chf if currency == 'CHF' else pack.stripe_price_id_eur
    
    if not price_id:
        sync_v20_products()
        return {"error": "Configuration prix en cours..."}

    try:
        if not member.stripe_customer_id:
            cust = stripe.Customer.create(email=member.user.email, name=f"{member.first_name}")
            member.stripe_customer_id = cust.id
            db.session.commit()

        session = stripe.checkout.Session.create(
            customer=member.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            success_url=f"{FRONTEND_URL}/?success=sub_ok",
            cancel_url=f"{FRONTEND_URL}/?canceled=true",
            # METADATA POUR LE WEBHOOK
            metadata={'pack_id': pack.id, 'currency': currency},
            client_reference_id=str(member.id)
        )
        return {"url": session.url}
    except Exception as e: return {"error": str(e)}

def handle_webhook_v20(session):
    mid = session.get('client_reference_id')
    meta = session.get('metadata', {})
    
    if mid and 'pack_id' in meta:
        try:
            member = Member.query.get(int(mid))
            pack = Pack.query.get(int(meta['pack_id']))
            
            # 1. Création Abonnement V20
            sub = Subscription(
                member_id=member.id, pack_id=pack.id,
                stripe_subscription_id=session.get('subscription'),
                currency=meta.get('currency', 'CHF'),
                amount_paid=pack.price_amount,
                status='active',
                current_period_end=datetime.fromtimestamp(session.get('expires_at', 0) + 31536000)
            )
            db.session.add(sub)
            db.session.commit()
            
            # 2. Génération des Slots
            db.session.add(AccessSlot(subscription_id=sub.id, member_id=member.id, status='active'))
            for _ in range(pack.access_count - 1):
                db.session.add(AccessSlot(subscription_id=sub.id, status='empty'))
            
            # 3. Mise à jour Membre
            member.subscription_status = 'active'
            member.user.currency = meta.get('currency', 'CHF')
            db.session.commit()
            print(f"🎉 Activation V20: {member.first_name}")
        except Exception as e: print(f"❌ Webhook Err: {e}")
