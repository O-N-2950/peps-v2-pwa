"""
Détection géographique pour devise
"""

import requests
from flask import request

def get_client_ip():
    """Récupère l'IP réelle du client"""
    # En production avec proxy (Railway, Heroku, etc.)
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr


def detect_currency_from_ip(ip_address=None):
    """
    Détecte la devise selon l'IP
    Utilise ipapi.co (gratuit, 30k requêtes/mois)
    """
    if not ip_address:
        ip_address = get_client_ip()
    
    # Pour tests locaux (localhost)
    if ip_address in ['127.0.0.1', '::1', 'localhost']:
        return {
            'currency': 'CHF',
            'country': 'CH',
            'country_name': 'Switzerland',
            'flag': '🇨🇭',
            'symbol': 'CHF',
            'detected': False,  # Non détecté (local)
            'source': 'default'
        }
    
    try:
        # API ipapi.co (gratuite)
        response = requests.get(
            f'https://ipapi.co/{ip_address}/json/',
            timeout=2  # Timeout 2s max
        )
        
        if response.status_code == 200:
            data = response.json()
            country_code = data.get('country_code', 'CH')
            country_name = data.get('country_name', 'Switzerland')
            
            # Mapping pays → devise
            currency_map = get_currency_mapping()
            currency_info = currency_map.get(country_code, currency_map['DEFAULT'])
            
            return {
                'currency': currency_info['currency'],
                'country': country_code,
                'country_name': country_name,
                'flag': currency_info['flag'],
                'symbol': currency_info['symbol'],
                'detected': True,
                'source': 'ipapi.co'
            }
    
    except Exception as e:
        print(f"Erreur détection IP: {e}")
    
    # Fallback : CHF par défaut
    return {
        'currency': 'CHF',
        'country': 'CH',
        'country_name': 'Switzerland',
        'flag': '🇨🇭',
        'symbol': 'CHF',
        'detected': False,
        'source': 'fallback'
    }


def get_currency_mapping():
    """
    Mapping pays → devise
    """
    return {
        # Suisse
        'CH': {
            'currency': 'CHF',
            'flag': '🇨🇭',
            'symbol': 'CHF'
        },
        
        # Zone Euro
        'FR': {'currency': 'EUR', 'flag': '🇫🇷', 'symbol': '€'},
        'DE': {'currency': 'EUR', 'flag': '🇩🇪', 'symbol': '€'},
        'IT': {'currency': 'EUR', 'flag': '🇮🇹', 'symbol': '€'},
        'ES': {'currency': 'EUR', 'flag': '🇪🇸', 'symbol': '€'},
        'BE': {'currency': 'EUR', 'flag': '🇧🇪', 'symbol': '€'},
        'NL': {'currency': 'EUR', 'flag': '🇳🇱', 'symbol': '€'},
        'AT': {'currency': 'EUR', 'flag': '🇦🇹', 'symbol': '€'},
        'PT': {'currency': 'EUR', 'flag': '🇵🇹', 'symbol': '€'},
        'IE': {'currency': 'EUR', 'flag': '🇮🇪', 'symbol': '€'},
        'LU': {'currency': 'EUR', 'flag': '🇱🇺', 'symbol': '€'},
        'FI': {'currency': 'EUR', 'flag': '🇫🇮', 'symbol': '€'},
        'GR': {'currency': 'EUR', 'flag': '🇬🇷', 'symbol': '€'},
        'SI': {'currency': 'EUR', 'flag': '🇸🇮', 'symbol': '€'},
        'SK': {'currency': 'EUR', 'flag': '🇸🇰', 'symbol': '€'},
        'EE': {'currency': 'EUR', 'flag': '🇪🇪', 'symbol': '€'},
        'LV': {'currency': 'EUR', 'flag': '🇱🇻', 'symbol': '€'},
        'LT': {'currency': 'EUR', 'flag': '🇱🇹', 'symbol': '€'},
        'CY': {'currency': 'EUR', 'flag': '🇨🇾', 'symbol': '€'},
        'MT': {'currency': 'EUR', 'flag': '🇲🇹', 'symbol': '€'},
        
        # Défaut (reste du monde → EUR)
        'DEFAULT': {
            'currency': 'EUR',
            'flag': '🌍',
            'symbol': '€'
        }
    }
