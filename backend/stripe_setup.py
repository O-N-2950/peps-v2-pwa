"""
Configuration et gestion Stripe
Création des prix en CHF et EUR
"""

import stripe
import os
from pricing import REFERENCE_PRICES, FIXED_TIERS

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


def create_all_stripe_prices():
    """
    Crée TOUS les prix Stripe pour paliers courants
    À exécuter UNE SEULE FOIS lors du setup
    
    Returns:
        dict: Mapping nb_access → {chf: price_id, eur: price_id}
    """
    price_mapping = {}
    
    # Créer produit PEP's unique
    try:
        product = stripe.Product.create(
            name="PEP's - Abonnement Membre",
            description="Accès aux privilèges exclusifs chez nos partenaires locaux",
            metadata={'type': 'member_subscription'}
        )
        product_id = product.id
        print(f"✅ Produit créé : {product_id}")
    except stripe.error.InvalidRequestError:
        # Produit existe déjà
        products = stripe.Product.list(limit=1)
        product_id = products.data[0].id if products.data else None
        print(f"ℹ️  Produit existant utilisé : {product_id}")
    
    # Paliers à créer (courants + fixes)
    tiers_to_create = [1, 2, 5, 10, 20, 50, 100]  # Progressifs courants
    tiers_to_create += list(FIXED_TIERS.keys())    # Tous les paliers fixes
    
    for nb_access in sorted(set(tiers_to_create)):
        
        # Calculer prix
        if nb_access in REFERENCE_PRICES:
            price = REFERENCE_PRICES[nb_access]
        elif nb_access in FIXED_TIERS:
            price = FIXED_TIERS[nb_access]
        else:
            continue  # Skipper les intermédiaires
        
        amount_cents = int(price * 100)
        
        print(f"\n📦 Création prix pour {nb_access} accès ({price} CHF/EUR)...")
        
        # Prix CHF
        try:
            price_chf = stripe.Price.create(
                product=product_id,
                unit_amount=amount_cents,
                currency='chf',
                recurring={'interval': 'year'},
                metadata={
                    'nb_access': str(nb_access),
                    'currency': 'CHF'
                }
            )
            print(f"  ✅ CHF: {price_chf.id}")
        except Exception as e:
            print(f"  ❌ Erreur CHF: {e}")
            price_chf = None
        
        # Prix EUR
        try:
            price_eur = stripe.Price.create(
                product=product_id,
                unit_amount=amount_cents,  # Même montant !
                currency='eur',
                recurring={'interval': 'year'},
                metadata={
                    'nb_access': str(nb_access),
                    'currency': 'EUR'
                }
            )
            print(f"  ✅ EUR: {price_eur.id}")
        except Exception as e:
            print(f"  ❌ Erreur EUR: {e}")
            price_eur = None
        
        # Sauvegarder mapping
        if price_chf and price_eur:
            price_mapping[nb_access] = {
                'chf': price_chf.id,
                'eur': price_eur.id
            }
    
    print(f"\n✅ {len(price_mapping)} paliers créés avec succès")
    print("\n💡 Sauvegardez ce mapping dans votre base de données !")
    
    return price_mapping


def create_dynamic_stripe_price(nb_access, currency, total_price):
    """
    Crée un prix Stripe à la volée (pour accès non pré-créés)
    
    Args:
        nb_access (int): Nombre d'accès
        currency (str): 'CHF' ou 'EUR'
        total_price (float): Prix total annuel
        
    Returns:
        str: Stripe Price ID
    """
    try:
        # Récupérer ou créer produit
        products = stripe.Product.list(limit=1)
        product_id = products.data[0].id if products.data else None
        
        if not product_id:
            product = stripe.Product.create(
                name="PEP's - Abonnement Membre",
                description="Accès aux privilèges exclusifs"
            )
            product_id = product.id
        
        # Créer prix
        amount_cents = int(total_price * 100)
        
        price = stripe.Price.create(
            product=product_id,
            unit_amount=amount_cents,
            currency=currency.lower(),
            recurring={'interval': 'year'},
            metadata={
                'nb_access': str(nb_access),
                'currency': currency.upper(),
                'dynamic': 'true'
            }
        )
        
        return price.id
    
    except Exception as e:
        print(f"❌ Erreur création prix dynamique: {e}")
        raise


def get_or_create_stripe_price(nb_access, currency, price_mapping=None):
    """
    Récupère prix pré-créé OU crée dynamiquement
    
    Args:
        nb_access (int): Nombre d'accès
        currency (str): 'CHF' ou 'EUR'
        price_mapping (dict): Mapping nb_access → {chf, eur}
        
    Returns:
        str: Stripe Price ID
    """
    from pricing import calculate_subscription_price
    
    # Si prix mapping fourni et palier existe
    if price_mapping and nb_access in price_mapping:
        return price_mapping[nb_access][currency.lower()]
    
    # Sinon créer dynamiquement
    pricing = calculate_subscription_price(nb_access)
    
    if pricing['total_price'] is None:
        raise ValueError("Prix sur devis - contactez business@peps.digital")
    
    return create_dynamic_stripe_price(
        nb_access,
        currency,
        pricing['total_price']
    )


# Pour exécution standalone
if __name__ == "__main__":
    print("🚀 Création des prix Stripe...")
    print("=" * 60)
    
    mapping = create_all_stripe_prices()
    
    print("\n" + "=" * 60)
    print("📋 MAPPING À SAUVEGARDER :")
    print("=" * 60)
    
    import json
    print(json.dumps(mapping, indent=2))
    
    print("\n💾 Sauvegardez ce JSON dans votre base de données ou fichier config")
