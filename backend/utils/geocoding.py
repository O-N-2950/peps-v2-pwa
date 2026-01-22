"""
Utilitaire de géocodage pour convertir les adresses en coordonnées GPS
Utilise l'API Nominatim d'OpenStreetMap (gratuite, pas de clé API requise)
"""

import requests
import time
from typing import Dict, Optional, Tuple

class GeocodingService:
    """Service de géocodage utilisant Nominatim (OpenStreetMap)"""
    
    BASE_URL = "https://nominatim.openstreetmap.org/search"
    USER_AGENT = "PEP's Swiss SA / contact@peps.swiss"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.USER_AGENT
        })
    
    def geocode_address(
        self,
        street: str,
        number: str,
        postal_code: str,
        city: str,
        country: str = "CH"
    ) -> Optional[Tuple[float, float]]:
        """
        Convertit une adresse en coordonnées GPS (latitude, longitude)
        
        Args:
            street: Nom de la rue
            number: Numéro de rue
            postal_code: Code postal (NPA)
            city: Localité
            country: Code pays ISO 3166-1 alpha-2 (CH, FR, BE, etc.)
        
        Returns:
            Tuple (latitude, longitude) ou None si non trouvé
        
        Example:
            >>> service = GeocodingService()
            >>> coords = service.geocode_address("Rue du Commerce", "12", "1003", "Lausanne", "CH")
            >>> print(coords)
            (46.5196535, 6.6322734)
        """
        # Construction de l'adresse complète
        address_parts = []
        if number and street:
            address_parts.append(f"{number} {street}")
        elif street:
            address_parts.append(street)
        
        if postal_code:
            address_parts.append(postal_code)
        
        if city:
            address_parts.append(city)
        
        address = ", ".join(address_parts)
        
        # Paramètres de la requête
        params = {
            'q': address,
            'format': 'json',
            'addressdetails': 1,
            'limit': 1,
            'countrycodes': country.lower()
        }
        
        try:
            # Respect de la politique d'utilisation de Nominatim (max 1 requête/seconde)
            time.sleep(1)
            
            response = self.session.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            
            results = response.json()
            
            if results and len(results) > 0:
                result = results[0]
                lat = float(result['lat'])
                lon = float(result['lon'])
                return (lat, lon)
            
            return None
        
        except requests.exceptions.RequestException as e:
            print(f"Erreur lors du géocodage: {e}")
            return None
        except (KeyError, ValueError, IndexError) as e:
            print(f"Erreur lors du parsing de la réponse: {e}")
            return None
    
    def geocode_address_dict(self, address_dict: Dict[str, str]) -> Optional[Tuple[float, float]]:
        """
        Convertit un dictionnaire d'adresse en coordonnées GPS
        
        Args:
            address_dict: Dictionnaire contenant les champs d'adresse
                - street: Nom de la rue
                - number: Numéro de rue
                - postal_code: Code postal
                - city: Localité
                - country: Code pays (optionnel, défaut: CH)
        
        Returns:
            Tuple (latitude, longitude) ou None si non trouvé
        
        Example:
            >>> service = GeocodingService()
            >>> address = {
            ...     'street': 'Rue du Commerce',
            ...     'number': '12',
            ...     'postal_code': '1003',
            ...     'city': 'Lausanne',
            ...     'country': 'CH'
            ... }
            >>> coords = service.geocode_address_dict(address)
            >>> print(coords)
            (46.5196535, 6.6322734)
        """
        return self.geocode_address(
            street=address_dict.get('street', ''),
            number=address_dict.get('number', ''),
            postal_code=address_dict.get('postal_code', ''),
            city=address_dict.get('city', ''),
            country=address_dict.get('country', 'CH')
        )
    
    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict[str, str]]:
        """
        Convertit des coordonnées GPS en adresse
        
        Args:
            latitude: Latitude
            longitude: Longitude
        
        Returns:
            Dictionnaire contenant l'adresse ou None si non trouvé
        
        Example:
            >>> service = GeocodingService()
            >>> address = service.reverse_geocode(46.5196535, 6.6322734)
            >>> print(address)
            {'street': 'Rue du Commerce', 'city': 'Lausanne', 'postal_code': '1003', 'country': 'CH'}
        """
        url = "https://nominatim.openstreetmap.org/reverse"
        
        params = {
            'lat': latitude,
            'lon': longitude,
            'format': 'json',
            'addressdetails': 1
        }
        
        try:
            # Respect de la politique d'utilisation de Nominatim
            time.sleep(1)
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            
            if result and 'address' in result:
                address = result['address']
                return {
                    'street': address.get('road', ''),
                    'number': address.get('house_number', ''),
                    'postal_code': address.get('postcode', ''),
                    'city': address.get('city') or address.get('town') or address.get('village', ''),
                    'canton': address.get('state', ''),
                    'country': address.get('country_code', '').upper()
                }
            
            return None
        
        except requests.exceptions.RequestException as e:
            print(f"Erreur lors du géocodage inverse: {e}")
            return None
        except (KeyError, ValueError) as e:
            print(f"Erreur lors du parsing de la réponse: {e}")
            return None


# Instance globale pour réutilisation
geocoding_service = GeocodingService()


def geocode_address(street: str, number: str, postal_code: str, city: str, country: str = "CH") -> Optional[Tuple[float, float]]:
    """
    Fonction helper pour géocoder une adresse
    
    Example:
        >>> from utils.geocoding import geocode_address
        >>> coords = geocode_address("Rue du Commerce", "12", "1003", "Lausanne", "CH")
        >>> print(coords)
        (46.5196535, 6.6322734)
    """
    return geocoding_service.geocode_address(street, number, postal_code, city, country)


def geocode_address_dict(address_dict: Dict[str, str]) -> Optional[Tuple[float, float]]:
    """
    Fonction helper pour géocoder un dictionnaire d'adresse
    
    Example:
        >>> from utils.geocoding import geocode_address_dict
        >>> address = {'street': 'Rue du Commerce', 'number': '12', 'postal_code': '1003', 'city': 'Lausanne'}
        >>> coords = geocode_address_dict(address)
        >>> print(coords)
        (46.5196535, 6.6322734)
    """
    return geocoding_service.geocode_address_dict(address_dict)


def reverse_geocode(latitude: float, longitude: float) -> Optional[Dict[str, str]]:
    """
    Fonction helper pour le géocodage inverse
    
    Example:
        >>> from utils.geocoding import reverse_geocode
        >>> address = reverse_geocode(46.5196535, 6.6322734)
        >>> print(address)
        {'street': 'Rue du Commerce', 'city': 'Lausanne', 'postal_code': '1003', 'country': 'CH'}
    """
    return geocoding_service.reverse_geocode(latitude, longitude)


if __name__ == "__main__":
    # Tests
    service = GeocodingService()
    
    print("Test 1: Géocodage d'une adresse à Lausanne")
    coords = service.geocode_address("Rue du Commerce", "12", "1003", "Lausanne", "CH")
    print(f"Résultat: {coords}")
    
    print("\nTest 2: Géocodage d'une adresse à Genève")
    coords = service.geocode_address("Rue du Rhône", "1", "1204", "Genève", "CH")
    print(f"Résultat: {coords}")
    
    print("\nTest 3: Géocodage d'une adresse à Paris")
    coords = service.geocode_address("Champs-Élysées", "1", "75008", "Paris", "FR")
    print(f"Résultat: {coords}")
    
    print("\nTest 4: Géocodage inverse")
    if coords:
        address = service.reverse_geocode(coords[0], coords[1])
        print(f"Résultat: {address}")
