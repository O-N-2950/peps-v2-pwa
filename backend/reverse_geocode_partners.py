"""
Reverse Geocoding et Enrichissement des Adresses PEP's
- Utilise les coordonnées GPS existantes pour récupérer les adresses complètes
- Complète les champs manquants (rue, numéro, code postal, ville, pays)
- Corrige les adresses incomplètes ou erronées
- Normalise les formats d'adresse
- Logging détaillé pour audit
"""

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from sqlalchemy import text
from models import db, Partner
import time
import traceback
from datetime import datetime
import re

class AddressEnricher:
    def __init__(self):
        self.geolocator = Nominatim(
            user_agent="peps_swiss_reverse_geocoder_v1.0",
            timeout=10
        )
        self.success_count = 0
        self.error_count = 0
        self.skipped_count = 0
        self.partial_count = 0
        self.rate_limit_delay = 1.1
        
    def extract_house_number(self, address_dict):
        """
        Extrait le numéro de maison de différents formats d'adresse
        """
        # Tentative 1: Champ house_number direct
        if 'house_number' in address_dict:
            return address_dict['house_number']
        
        # Tentative 2: Dans le champ road (ex: "Rue du Rhône 15")
        if 'road' in address_dict:
            road = address_dict['road']
            # Chercher un nombre à la fin
            match = re.search(r'\b(\d+[a-zA-Z]?)\s*$', road)
            if match:
                return match.group(1)
        
        return None
    
    def extract_street_name(self, address_dict):
        """
        Extrait le nom de rue sans le numéro
        """
        if 'road' in address_dict:
            road = address_dict['road']
            # Retirer le numéro s'il est dans le nom
            street = re.sub(r'\s*\d+[a-zA-Z]?\s*$', '', road)
            return street.strip()
        
        # Fallback sur d'autres champs
        for field in ['street', 'pedestrian', 'path', 'footway']:
            if field in address_dict:
                return address_dict[field]
        
        return None
    
    def normalize_address_data(self, location):
        """
        Normalise les données d'adresse de Nominatim
        """
        if not location or not location.raw:
            return None
        
        address_dict = location.raw.get('address', {})
        
        # Extraire les composants
        house_number = self.extract_house_number(address_dict)
        street = self.extract_street_name(address_dict)
        
        # Code postal
        postcode = address_dict.get('postcode')
        
        # Ville (plusieurs fallbacks)
        city = (
            address_dict.get('city') or 
            address_dict.get('town') or 
            address_dict.get('village') or 
            address_dict.get('municipality') or
            address_dict.get('suburb')
        )
        
        # Pays
        country = address_dict.get('country')
        country_code = address_dict.get('country_code', '').upper()
        
        # Canton (pour Suisse)
        state = address_dict.get('state')
        
        return {
            'house_number': house_number,
            'street': street,
            'postcode': postcode,
            'city': city,
            'country': country,
            'country_code': country_code,
            'state': state,
            'full_address': location.address,
            'raw': address_dict
        }
    
    def reverse_geocode(self, latitude, longitude):
        """
        Effectue le reverse geocoding pour des coordonnées GPS
        """
        try:
            location = self.geolocator.reverse(
                f"{latitude}, {longitude}",
                exactly_one=True,
                language='fr',
                addressdetails=True
            )
            
            if location:
                return self.normalize_address_data(location)
            
            return None
            
        except GeocoderTimedOut:
            print(f"    ⏱️  Timeout - retry...")
            time.sleep(2)
            try:
                location = self.geolocator.reverse(
                    f"{latitude}, {longitude}",
                    exactly_one=True,
                    language='fr',
                    addressdetails=True
                )
                if location:
                    return self.normalize_address_data(location)
            except:
                return None
        except GeocoderServiceError as e:
            print(f"    ❌ Erreur service: {str(e)}")
            return None
        except Exception as e:
            print(f"    ❌ Erreur inattendue: {str(e)}")
            return None
    
    def needs_enrichment(self, partner):
        """
        Détermine si un partenaire a besoin d'enrichissement
        """
        # Vérifie si des champs essentiels sont manquants
        missing_fields = []
        
        if not partner.address_street:
            missing_fields.append('street')
        if not partner.address_postal_code:
            missing_fields.append('postcode')
        if not partner.address_city:
            missing_fields.append('city')
        if not partner.address_country:
            missing_fields.append('country')
        
        return len(missing_fields) > 0, missing_fields
    
    def update_partner_address(self, partner, address_data):
        """
        Met à jour les champs d'adresse du partenaire
        """
        updated_fields = []
        
        # Numéro de maison
        if address_data['house_number'] and not partner.address_number:
            partner.address_number = address_data['house_number']
            updated_fields.append('house_number')
        
        # Rue
        if address_data['street'] and not partner.address_street:
            partner.address_street = address_data['street']
            updated_fields.append('street')
        
        # Code postal
        if address_data['postcode'] and not partner.address_postal_code:
            partner.address_postal_code = address_data['postcode']
            updated_fields.append('postcode')
        
        # Ville
        if address_data['city']:
            if not partner.address_city:
                partner.address_city = address_data['city']
                updated_fields.append('city')
            # Mettre à jour aussi le champ 'city' pour compatibilité
            if not partner.city:
                partner.city = address_data['city']
        
        # Pays
        if address_data['country'] and not partner.address_country:
            partner.address_country = address_data['country_code'] or address_data['country']
            updated_fields.append('country')
        
        return updated_fields
    
    def enrich_partner(self, partner):
        """
        Enrichit l'adresse d'un partenaire via reverse geocoding
        """
        print(f"\n📍 [{partner.id}] {partner.name}")
        print(f"    GPS: ({partner.latitude}, {partner.longitude})")
        
        # Vérifier si enrichissement nécessaire
        needs_update, missing_fields = self.needs_enrichment(partner)
        
        if not needs_update:
            print(f"    ✅ Adresse complète - aucun enrichissement nécessaire")
            self.skipped_count += 1
            return True
        
        print(f"    ⚠️  Champs manquants: {', '.join(missing_fields)}")
        
        # Effectuer le reverse geocoding
        address_data = self.reverse_geocode(partner.latitude, partner.longitude)
        
        if not address_data:
            print(f"    ❌ Reverse geocoding échoué")
            self.error_count += 1
            return False
        
        print(f"    🔍 Adresse trouvée: {address_data['full_address'][:100]}")
        
        # Mettre à jour les champs manquants
        updated_fields = self.update_partner_address(partner, address_data)
        
        if updated_fields:
            db.session.commit()
            print(f"    💾 Champs mis à jour: {', '.join(updated_fields)}")
            self.success_count += 1
            return True
        else:
            print(f"    ⚠️  Aucune donnée utilisable trouvée")
            self.partial_count += 1
            return False
    
    def enrich_all_partners(self, limit=None, force=False):
        """
        Enrichit tous les partenaires avec coordonnées GPS
        
        Args:
            limit: Nombre maximum de partenaires à traiter
            force: Force l'enrichissement même si adresse complète
        """
        print("\n" + "="*80)
        print("🔄 ENRICHISSEMENT AUTOMATIQUE DES ADRESSES")
        print("="*80)
        print(f"⏰ Démarrage: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📊 Limite: {limit or 'Aucune (tous les partenaires)'}")
        print(f"🔄 Force enrichment: {force}")
        print("="*80 + "\n")
        
        try:
            # Récupérer les partenaires avec GPS mais adresse incomplète
            query = Partner.query.filter_by(status='active').filter(
                Partner.latitude.isnot(None),
                Partner.longitude.isnot(None)
            )
            
            if not force:
                # Seulement ceux avec au moins un champ manquant
                query = query.filter(
                    (Partner.address_street.is_(None)) |
                    (Partner.address_postal_code.is_(None)) |
                    (Partner.address_city.is_(None)) |
                    (Partner.address_country.is_(None))
                )
            
            if limit:
                query = query.limit(limit)
            
            partners = query.all()
            total = len(partners)
            
            print(f"📋 Partenaires à enrichir: {total}\n")
            
            if total == 0:
                print("✅ Toutes les adresses sont déjà complètes !")
                return True
            
            # Traiter chaque partenaire
            for i, partner in enumerate(partners, 1):
                print(f"\n{'='*80}")
                print(f"Progression: {i}/{total} ({(i/total*100):.1f}%)")
                print(f"{'='*80}")
                
                self.enrich_partner(partner)
                
                # Rate limiting
                if i < total:
                    time.sleep(self.rate_limit_delay)
            
            # Statistiques finales
            self.print_summary(total)
            
            return True
            
        except KeyboardInterrupt:
            print("\n\n⚠️  Interruption manuelle détectée")
            self.print_summary(self.success_count + self.error_count + self.skipped_count)
            return False
        except Exception as e:
            print(f"\n\n❌ Erreur critique: {str(e)}")
            print(traceback.format_exc())
            return False
    
    def print_summary(self, total_processed):
        """
        Affiche les statistiques finales
        """
        print("\n" + "="*80)
        print("📊 RÉSUMÉ DE L'ENRICHISSEMENT")
        print("="*80)
        print(f"\n  📋 Total traité:        {total_processed}")
        print(f"  ✅ Enrichis:            {self.success_count}")
        print(f"  ⚠️  Partiels:            {self.partial_count}")
        print(f"  ❌ Échecs:              {self.error_count}")
        print(f"  ⏭️  Déjà complets:       {self.skipped_count}")
        
        if total_processed > 0:
            success_rate = ((self.success_count + self.partial_count) / total_processed) * 100
            print(f"  📈 Taux d'amélioration: {success_rate:.1f}%")
        
        print("\n" + "="*80)
        print(f"⏰ Fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")


def verify_address_completeness():
    """
    Vérifie l'état de complétude des adresses
    """
    try:
        stats = db.session.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE 
                    address_street IS NOT NULL AND 
                    address_postal_code IS NOT NULL AND 
                    address_city IS NOT NULL AND 
                    address_country IS NOT NULL
                ) as complete,
                COUNT(*) FILTER (WHERE address_street IS NULL) as missing_street,
                COUNT(*) FILTER (WHERE address_postal_code IS NULL) as missing_postcode,
                COUNT(*) FILTER (WHERE address_city IS NULL) as missing_city,
                COUNT(*) FILTER (WHERE address_country IS NULL) as missing_country,
                COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as has_gps
            FROM partners
            WHERE status = 'active';
        """)).fetchone()
        
        print("\n" + "="*80)
        print("🔍 ÉTAT DE COMPLÉTUDE DES ADRESSES")
        print("="*80)
        print(f"\n  📊 Total partenaires:       {stats.total}")
        print(f"  ✅ Adresses complètes:      {stats.complete} ({(stats.complete/stats.total*100):.1f}%)")
        print(f"  📍 Avec coordonnées GPS:    {stats.has_gps}")
        print(f"\n  Champs manquants:")
        print(f"    - Rue:                    {stats.missing_street}")
        print(f"    - Code postal:            {stats.missing_postcode}")
        print(f"    - Ville:                  {stats.missing_city}")
        print(f"    - Pays:                   {stats.missing_country}")
        
        incomplete = stats.total - stats.complete
        print(f"\n  ⚠️  Adresses incomplètes:    {incomplete} ({(incomplete/stats.total*100):.1f}%)")
        
        print("\n" + "="*80 + "\n")
        
        # Exemples d'adresses incomplètes
        if incomplete > 0:
            examples = db.session.execute(text("""
                SELECT 
                    id, 
                    name, 
                    address_street,
                    address_postal_code,
                    address_city,
                    latitude,
                    longitude
                FROM partners
                WHERE status = 'active'
                AND (
                    address_street IS NULL OR 
                    address_postal_code IS NULL OR 
                    address_city IS NULL OR 
                    address_country IS NULL
                )
                AND latitude IS NOT NULL
                AND longitude IS NOT NULL
                LIMIT 10;
            """)).fetchall()
            
            if examples:
                print("⚠️  Exemples d'adresses incomplètes avec GPS (max 10):")
                for p in examples:
                    missing = []
                    if not p.address_street:
                        missing.append("rue")
                    if not p.address_postal_code:
                        missing.append("CP")
                    if not p.address_city:
                        missing.append("ville")
                    
                    print(f"  - ID {p.id}: {p.name}")
                    print(f"    GPS: ({p.latitude}, {p.longitude})")
                    print(f"    Manque: {', '.join(missing)}")
                
                if incomplete > 10:
                    print(f"\n  ... et {incomplete - 10} autres")
        
        return stats.complete, incomplete
        
    except Exception as e:
        print(f"\n❌ Erreur de vérification: {str(e)}\n")
        return 0, 0


def fix_duplicate_cities():
    """
    Corrige les doublons entre 'city' et 'address_city'
    Synchronise ces deux champs pour cohérence
    """
    print("\n" + "="*80)
    print("🔧 SYNCHRONISATION DES CHAMPS VILLE")
    print("="*80 + "\n")
    
    try:
        # Cas 1: address_city existe mais pas city
        result1 = db.session.execute(text("""
            UPDATE partners
            SET city = address_city
            WHERE status = 'active'
            AND city IS NULL
            AND address_city IS NOT NULL;
        """))
        
        print(f"✅ Copié address_city → city: {result1.rowcount} partenaires")
        
        # Cas 2: city existe mais pas address_city
        result2 = db.session.execute(text("""
            UPDATE partners
            SET address_city = city
            WHERE status = 'active'
            AND address_city IS NULL
            AND city IS NOT NULL;
        """))
        
        print(f"✅ Copié city → address_city: {result2.rowcount} partenaires")
        
        # Cas 3: Les deux existent mais sont différents (prendre address_city comme référence)
        result3 = db.session.execute(text("""
            UPDATE partners
            SET city = address_city
            WHERE status = 'active'
            AND city IS NOT NULL
            AND address_city IS NOT NULL
            AND city != address_city;
        """))
        
        print(f"✅ Synchronisé city ← address_city: {result3.rowcount} partenaires")
        
        db.session.commit()
        
        print("\n" + "="*80 + "\n")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"\n❌ Erreur: {str(e)}\n")
        return False


def run_reverse_geocoding_migration(limit=None, force=False):
    """
    Point d'entrée principal pour l'enrichissement
    """
    enricher = AddressEnricher()
    return enricher.enrich_all_partners(limit=limit, force=force)


if __name__ == '__main__':
    """
    Exécution standalone
    """
    from app import app
    
    with app.app_context():
        # Mode 1: Vérification
        print("Mode: VÉRIFICATION\n")
        verify_address_completeness()
        
        # Décommenter pour lancer l'enrichissement :
        # print("\nMode: ENRICHISSEMENT\n")
        # fix_duplicate_cities()
        # run_reverse_geocoding_migration(limit=10)
