"""
Routes API pour pricing et détection devise
"""

from flask import Blueprint, request, jsonify
from utils.geo_detection import detect_currency_from_ip
from pricing import (
    calculate_subscription_price,
    get_all_fixed_tiers,
    get_recommended_tier
)

pricing_bp = Blueprint('pricing', __name__)


def get_supported_currencies():
    """
    Liste des devises supportées par PEP's
    
    Returns:
        list: [{'code': 'CHF', 'symbol': 'CHF', 'flag': '🇨🇭', ...}, ...]
    """
    return [
        {
            'code': 'CHF',
            'symbol': 'CHF',
            'flag': '🇨🇭',
            'name': 'Franc Suisse',
            'countries': ['Suisse']
        },
        {
            'code': 'EUR',
            'symbol': '€',
            'flag': '🇪🇺',
            'name': 'Euro',
            'countries': ['France', 'Allemagne', 'Italie', 'Espagne', 'Belgique', '...']
        }
    ]


@pricing_bp.route('/api/pricing/detect-currency', methods=['GET'])
def detect_currency():
    """
    Détecte automatiquement la devise de l'utilisateur
    
    GET /api/pricing/detect-currency
    
    Returns:
        200: {
            "currency": "CHF",
            "country": "CH",
            "country_name": "Switzerland",
            "flag": "🇨🇭",
            "symbol": "CHF",
            "detected": true,
            "source": "ipapi.co"
        }
    """
    try:
        currency_info = detect_currency_from_ip()
        return jsonify(currency_info), 200
    except Exception as e:
        return jsonify({
            'error': 'Erreur lors de la détection de devise',
            'details': str(e)
        }), 500


@pricing_bp.route('/api/pricing/currencies', methods=['GET'])
def get_currencies():
    """
    Liste toutes les devises supportées
    
    GET /api/pricing/currencies
    
    Returns:
        200: [{
            "code": "CHF",
            "symbol": "CHF",
            "flag": "🇨🇭",
            "name": "Franc Suisse"
        }, ...]
    """
    try:
        currencies = get_supported_currencies()
        return jsonify(currencies), 200
    except Exception as e:
        return jsonify({
            'error': 'Erreur lors de la récupération des devises',
            'details': str(e)
        }), 500


@pricing_bp.route('/api/pricing/calculate', methods=['POST'])
def calculate_price():
    """
    Calcule le prix pour un nombre d'accès ET une devise
    
    POST /api/pricing/calculate
    Body: {
        "nb_access": 58,
        "currency": "CHF"  # Optionnel, détection auto sinon
    }
    
    Returns:
        200: {
            "total_price": 1660.00,
            "price_per_access": 28.62,
            "discount_percent": 41.6,
            "tier_type": "progressive",
            "nb_access_included": 58,
            "tier_name": "Petite entreprise",
            "currency": "CHF",
            "currency_symbol": "CHF",
            "currency_flag": "🇨🇭"
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Corps de requête manquant'
            }), 400
        
        nb_access = data.get('nb_access', 1)
        currency = data.get('currency')
        
        # Validation nb_access
        if not isinstance(nb_access, int) or nb_access < 1:
            return jsonify({
                'error': 'Le nombre d\'accès doit être un entier >= 1'
            }), 400
        
        # Si pas de devise fournie, détection auto
        if not currency:
            currency_info = detect_currency_from_ip()
            currency = currency_info['currency']
        
        # Validation devise
        if currency not in ['CHF', 'EUR']:
            return jsonify({
                'error': 'Devise non supportée. Utilisez CHF ou EUR.'
            }), 400
        
        # Calcul prix
        pricing = calculate_subscription_price(nb_access)
        
        # Ajouter infos devise
        currency_map = {
            'CHF': {'symbol': 'CHF', 'flag': '🇨🇭', 'name': 'Franc Suisse'},
            'EUR': {'symbol': '€', 'flag': '🇪🇺', 'name': 'Euro'}
        }
        
        result = {
            **pricing,
            'currency': currency,
            'currency_symbol': currency_map[currency]['symbol'],
            'currency_flag': currency_map[currency]['flag'],
            'currency_name': currency_map[currency]['name']
        }
        
        return jsonify(result), 200
    
    except ValueError as e:
        return jsonify({
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Erreur lors du calcul du prix',
            'details': str(e)
        }), 500


@pricing_bp.route('/api/pricing/tiers', methods=['GET'])
def get_tiers():
    """
    Retourne tous les paliers disponibles (100+)
    
    GET /api/pricing/tiers?nb_access=250
    
    Query params:
        - nb_access (int, optionnel): Pour indiquer le palier recommandé
    
    Returns:
        200: {
            "requested_access": 250,
            "recommended_tier": {...},
            "all_tiers": [...]
        }
    """
    try:
        nb_access = request.args.get('nb_access', type=int)
        
        # Tous les paliers
        all_tiers = get_all_fixed_tiers()
        
        # Palier recommandé si nb_access fourni
        recommended = None
        if nb_access and nb_access > 100:
            recommended = get_recommended_tier(nb_access)
        
        return jsonify({
            'requested_access': nb_access,
            'recommended_tier': recommended,
            'all_tiers': all_tiers
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Erreur lors de la récupération des paliers',
            'details': str(e)
        }), 500
