"""
Système de calcul de prix PEP's
Grille tarifaire progressive (1-100) et paliers fixes (100+)
"""

# Points de référence (1-100 accès - calcul progressif)
REFERENCE_PRICES = {
    1: 49.00,
    2: 89.00,
    3: 129.00,
    4: 164.00,
    5: 199.00,
    6: 245.00,
    7: 289.00,
    8: 330.00,
    9: 360.00,
    10: 390.00,
    12: 460.00,
    15: 550.00,
    20: 700.00,
    25: 850.00,
    30: 1000.00,
    40: 1280.00,
    50: 1500.00,
    75: 2000.00,
    100: 2500.00
}

# Paliers fixes (100+ accès)
FIXED_TIERS = {
    150: 3300.00,
    200: 4000.00,
    300: 5400.00,
    400: 7200.00,
    500: 7500.00,
    750: 9000.00,
    1000: 12000.00,
    2500: 25000.00,
    5000: 40000.00
}


def calculate_subscription_price(nb_access):
    """
    Calcule le prix d'un abonnement selon le nombre d'accès
    
    Args:
        nb_access (int): Nombre d'accès souhaités (1-5000+)
        
    Returns:
        dict: {
            'total_price': float,           # Prix total annuel
            'price_per_access': float,      # Prix par accès
            'discount_percent': float,      # % économie vs tarif unitaire
            'tier_type': str,               # 'progressive' | 'fixed' | 'custom'
            'nb_access_included': int,      # Nombre accès inclus (peut être > demandé si palier)
            'tier_name': str                # Nom du palier pour affichage
        }
    """
    
    # Validation
    if nb_access < 1:
        raise ValueError("Le nombre d'accès doit être au minimum 1")
    
    # Plus de 5000 → Sur devis
    if nb_access > 5000:
        return {
            'total_price': None,
            'price_per_access': None,
            'discount_percent': None,
            'tier_type': 'custom',
            'nb_access_included': nb_access,
            'tier_name': 'Sur devis',
            'message': 'Pour plus de 5000 accès, contactez business@peps.digital'
        }
    
    # 1-100 : Calcul progressif (interpolation linéaire)
    if nb_access <= 100:
        # Prix exact dans la table de référence ?
        if nb_access in REFERENCE_PRICES:
            total_price = REFERENCE_PRICES[nb_access]
        else:
            # Interpolation linéaire entre 2 points
            lower = max([k for k in REFERENCE_PRICES.keys() if k < nb_access])
            upper = min([k for k in REFERENCE_PRICES.keys() if k > nb_access])
            
            lower_price = REFERENCE_PRICES[lower]
            upper_price = REFERENCE_PRICES[upper]
            
            # Formule interpolation linéaire
            ratio = (nb_access - lower) / (upper - lower)
            total_price = lower_price + (upper_price - lower_price) * ratio
            total_price = round(total_price, 2)
        
        tier_type = 'progressive'
        nb_access_included = nb_access
        tier_name = get_tier_name(nb_access)
    
    # 100+ : Paliers fixes
    else:
        # Trouver le palier approprié (plus petit palier >= nb_access)
        suitable_tiers = [t for t in FIXED_TIERS.keys() if t >= nb_access]
        
        if not suitable_tiers:
            # > 5000
            return {
                'total_price': None,
                'price_per_access': None,
                'discount_percent': None,
                'tier_type': 'custom',
                'nb_access_included': nb_access,
                'tier_name': 'Sur devis',
                'message': 'Pour plus de 5000 accès, contactez business@peps.digital'
            }
        
        tier = min(suitable_tiers)  # Plus petit palier suffisant
        total_price = FIXED_TIERS[tier]
        tier_type = 'fixed'
        nb_access_included = tier  # Peut être > demandé
        tier_name = f"Pack {tier} accès"
    
    # Calculs
    price_per_access = round(total_price / nb_access, 2)
    
    # Discount par rapport au prix individuel (49 CHF)
    regular_price = nb_access * 49.00
    discount_percent = round(((regular_price - total_price) / regular_price) * 100, 1)
    
    return {
        'total_price': total_price,
        'price_per_access': price_per_access,
        'discount_percent': discount_percent,
        'tier_type': tier_type,
        'nb_access_included': nb_access_included,
        'tier_name': tier_name
    }


def get_tier_name(nb_access):
    """
    Retourne le nom du palier pour affichage
    
    Args:
        nb_access (int): Nombre d'accès
        
    Returns:
        str: Nom du palier
    """
    if nb_access == 1:
        return "Individuel"
    elif nb_access <= 10:
        return "Famille"
    elif nb_access <= 30:
        return "Famille élargie"
    elif nb_access <= 100:
        return "Petite entreprise"
    elif nb_access <= 500:
        return "Moyenne entreprise"
    elif nb_access <= 5000:
        return "Grande entreprise"
    else:
        return "Entreprise"


def get_all_fixed_tiers():
    """
    Retourne tous les paliers fixes avec détails
    
    Returns:
        list: [{
            'access_count': 150,
            'total_price': 3300.00,
            'price_per_access': 22.00,
            'tier_name': 'Pack 150 accès'
        }, ...]
    """
    tiers = []
    
    for tier_access, tier_price in sorted(FIXED_TIERS.items()):
        tiers.append({
            'access_count': tier_access,
            'total_price': tier_price,
            'price_per_access': round(tier_price / tier_access, 2),
            'tier_name': f"Pack {tier_access} accès"
        })
    
    return tiers


def get_recommended_tier(nb_access):
    """
    Recommande le meilleur palier pour un nombre d'accès donné
    
    Args:
        nb_access (int): Nombre d'accès souhaités
        
    Returns:
        dict: Informations du palier recommandé
    """
    if nb_access <= 100:
        # Progressif, pas de recommandation de palier
        return None
    
    # Trouver le palier juste au-dessus
    suitable_tiers = [t for t in FIXED_TIERS.keys() if t >= nb_access]
    
    if not suitable_tiers:
        return None
    
    recommended_tier = min(suitable_tiers)
    
    return {
        'access_count': recommended_tier,
        'total_price': FIXED_TIERS[recommended_tier],
        'price_per_access': round(FIXED_TIERS[recommended_tier] / recommended_tier, 2),
        'extra_access': recommended_tier - nb_access,
        'tier_name': f"Pack {recommended_tier} accès"
    }
