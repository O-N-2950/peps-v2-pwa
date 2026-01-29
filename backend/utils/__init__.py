"""
Module utils pour PEP'S V2
Contient les utilitaires pour le géocodage, les suggestions de privilèges, etc.
"""

from .geocoding import (
    GeocodingService,
    geocode_address,
    geocode_address_dict,
    reverse_geocode,
    geocoding_service
)

# TEMPORAIREMENT DÉSACTIVÉ - Nécessite openai dans requirements.txt
# from .privilege_suggestions import (
#     PrivilegeSuggestionService,
#     get_privilege_suggestions,
#     get_all_categories,
#     privilege_suggestion_service
# )

__all__ = [
    # Géocodage
    'GeocodingService',
    'geocode_address',
    'geocode_address_dict',
    'reverse_geocode',
    'geocoding_service',
    
    # Suggestions de privilèges (DÉSACTIVÉ)
    # 'PrivilegeSuggestionService',
    # 'get_privilege_suggestions',
    # 'get_all_categories',
    # 'privilege_suggestion_service',
]
