"""
Géocodage automatique des partenaires PEP's
- Utilise Nominatim (OpenStreetMap) - gratuit, pas de clé API requise
- Rate limiting automatique (1 requête/seconde max)
- Fallback sur plusieurs formats d'adresse
- Sauvegarde progressive des résultats
- Logging détaillé pour debug
"""

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from sqlalchemy import text
from models import db, Partner
import time
import traceback
from datetime import datetime

class PartnerGeocoder:
    def __init__(self):
        # User-agent personnalisé (requis par Nominatim)
        self.geolocator = Nominatim(
            user_agent="peps_swiss_geocoder_v1.0",
            timeout=10
        )
        self.success_count = 0
        self.error_count = 0
        self.skipped_count = 0
        self.rate_limit_delay = 1.1  # Nominatim limite: 1 req/sec
        
    def build_address_variants(self, partner):
        """
        Construit plusieurs variantes d'adresse pour maximiser les chances de géocodage
        """
        variants = []
        
        # Format 1 : Adresse complète structurée
        if partner.address_street and partner.address_city:
            full_address = []
            if partner.address_number:
                full_address.append(str(partner.address_number))
            full_address.append(partner.address_street)
            if partner.address_postal_code:
                full_address.append(str(partner.address_postal_code))
            full_address.append(partner.address_city)
            if partner.address_country:
                full_address.append(partner.address_country)
            else:
                full_address.append('Switzerland')
            
            variants.append(' '.join(full_address))
        
        # Format 2 : Nom du partenaire + ville (pour commerces connus)
        if partner.city:
            variants.append(f"{partner.name}, {partner.city}, Switzerland")
        
        # Format 3 : Ville + code postal seulement
        if partner.address_city and partner.address_postal_code:
            variants.append(f"{partner.address_postal_code} {partner.address_city}, Switzerland")
        
        # Format 4 : Ville seule (dernière option)
        if partner.city:
            variants.append(f"{partner.city}, Switzerland")
        elif partner.address_city:
            variants.append(f"{partner.address_city}, Switzerland")
        
        return variants
    
    def geocode_address(self, address_variants, partner_name):
        """
        Tente de géocoder en essayant plusieurs variantes d'adresse
        """
        for i, address in enumerate(address_variants):
            try:
                print(f"    Tentative {i+1}/{len(address_variants)}: {address[:80]}...")
                
                location = self.geolocator.geocode(
                    address,
                    exactly_one=True,
                    addressdetails=True,
                    language='fr'
                )
                
                if location:
                    # Vérifier que c'est bien en Suisse
                    country = location.raw.get('address', {}).get('country', '')
                    if 'switzerland' in country.lower() or 'suisse' in country.lower():
                        print(f"    ✅ Trouvé: {location.address[:100]}")
                        return location.latitude, location.longitude, location.address
                    else:
                        print(f"    ⚠️  Résultat hors Suisse: {country}")
                
                # Rate limiting
                time.sleep(self.rate_limit_delay)
                
            except GeocoderTimedOut:
                print(f"    ⏱️  Timeout - retry...")
                time.sleep(2)
                continue
            except GeocoderServiceError as e:
                print(f"    ❌ Erreur service: {str(e)}")
                time.sleep(2)
                continue
            except Exception as e:
                print(f"    ❌ Erreur inattendue: {str(e)}")
                continue
        
        return None, None, None
    
    def geocode_partner(self, partner):
        """
        Géocode un partenaire individuel
        """
        print(f"\n📍 [{partner.id}] {partner.name}")
        print(f"    Catégorie: {partner.category}")
        
        # Vérifier si déjà géocodé
        if partner.latitude and partner.longitude:
            print(f"    ⏭️  Déjà géocodé: ({partner.latitude}, {partner.longitude})")
            self.skipped_count += 1
            return True
        
        # Construire les variantes d'adresse
        address_variants = self.build_address_variants(partner)
        
        if not address_variants:
            print(f"    ❌ Aucune adresse disponible")
            self.error_count += 1
            return False
        
        # Tenter le géocodage
        lat, lng, found_address = self.geocode_address(address_variants, partner.name)
        
        if lat and lng:
            # Sauvegarder les coordonnées
            partner.latitude = lat
            partner.longitude = lng
            db.session.commit()
            
            print(f"    💾 Sauvegardé: ({lat:.6f}, {lng:.6f})")
            self.success_count += 1
            return True
        else:
            print(f"    ❌ Géocodage impossible")
            self.error_count += 1
            return False
    
    def geocode_all_partners(self, limit=None, force_regeocode=False):
        """
        Géocode tous les partenaires sans coordonnées GPS
        
        Args:
            limit: Nombre maximum de partenaires à traiter (None = tous)
            force_regeocode: Si True, géocode même les partenaires déjà géocodés
        """
        print("\n" + "="*80)
        print("🗺️  GÉOCODAGE AUTOMATIQUE DES PARTENAIRES PEP'S")
        print("="*80)
        print(f"⏰ Démarrage: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📊 Limite: {limit or 'Aucune (tous les partenaires)'}")
        print(f"🔄 Force regeocoding: {force_regeocode}")
        print("="*80 + "\n")
        
        try:
            # Récupérer les partenaires à géocoder
            if force_regeocode:
                query = Partner.query.filter_by(status='active')
            else:
                query = Partner.query.filter_by(status='active').filter(
                    (Partner.latitude.is_(None)) | (Partner.longitude.is_(None))
                )
            
            if limit:
                query = query.limit(limit)
            
            partners = query.all()
            total = len(partners)
            
            print(f"📋 Partenaires à traiter: {total}\n")
            
            if total == 0:
                print("✅ Tous les partenaires actifs sont déjà géocodés !")
                return True
            
            # Traiter chaque partenaire
            for i, partner in enumerate(partners, 1):
                print(f"\n{'='*80}")
                print(f"Progression: {i}/{total} ({(i/total*100):.1f}%)")
                print(f"{'='*80}")
                
                self.geocode_partner(partner)
                
                # Pause entre chaque partenaire (rate limiting)
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
        print("📊 RÉSUMÉ DU GÉOCODAGE")
        print("="*80)
        print(f"\n  📋 Total traité:     {total_processed}")
        print(f"  ✅ Succès:           {self.success_count}")
        print(f"  ❌ Échecs:           {self.error_count}")
        print(f"  ⏭️  Déjà géocodés:    {self.skipped_count}")
        
        if total_processed > 0:
            success_rate = (self.success_count / total_processed) * 100
            print(f"  📈 Taux de réussite: {success_rate:.1f}%")
        
        print("\n" + "="*80)
        print(f"⏰ Fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")


def geocode_specific_partners(partner_ids):
    """
    Géocode une liste spécifique de partenaires par leurs IDs
    
    Args:
        partner_ids: Liste d'IDs de partenaires (ex: [1, 5, 12])
    """
    geocoder = PartnerGeocoder()
    
    print(f"\n🎯 Géocodage de {len(partner_ids)} partenaires spécifiques")
    print(f"IDs: {partner_ids}\n")
    
    for partner_id in partner_ids:
        partner = Partner.query.get(partner_id)
        if partner:
            geocoder.geocode_partner(partner)
        else:
            print(f"⚠️  Partenaire ID {partner_id} introuvable")
    
    geocoder.print_summary(len(partner_ids))


def geocode_by_city(city_name, limit=None):
    """
    Géocode tous les partenaires d'une ville spécifique
    
    Args:
        city_name: Nom de la ville (ex: "Genève", "Lausanne")
        limit: Nombre maximum de partenaires à traiter
    """
    geocoder = PartnerGeocoder()
    
    partners = Partner.query.filter(
        (Partner.city.ilike(f"%{city_name}%")) | 
        (Partner.address_city.ilike(f"%{city_name}%"))
    ).filter(
        (Partner.latitude.is_(None)) | (Partner.longitude.is_(None))
    )
    
    if limit:
        partners = partners.limit(limit)
    
    partners = partners.all()
    
    print(f"\n🏙️  Géocodage des partenaires de {city_name}")
    print(f"📋 Partenaires trouvés: {len(partners)}\n")
    
    for partner in partners:
        geocoder.geocode_partner(partner)
    
    geocoder.print_summary(len(partners))


def verify_geocoding():
    """
    Vérification de l'état du géocodage
    """
    try:
        stats = db.session.execute(text("""
            SELECT 
                COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as geocoded,
                COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) as not_geocoded,
                COUNT(*) as total
            FROM partners
            WHERE status = 'active';
        """)).fetchone()
        
        print("\n" + "="*80)
        print("🔍 ÉTAT DU GÉOCODAGE")
        print("="*80)
        print(f"\n  📍 Géocodés:         {stats.geocoded}")
        print(f"  ❓ Non géocodés:     {stats.not_geocoded}")
        print(f"  📊 Total:            {stats.total}")
        
        if stats.total > 0:
            geocoded_percent = (stats.geocoded / stats.total) * 100
            print(f"  📈 Complétude:       {geocoded_percent:.1f}%")
        
        print("\n" + "="*80 + "\n")
        
        # Liste des partenaires non géocodés
        if stats.not_geocoded > 0:
            not_geocoded = db.session.execute(text("""
                SELECT id, name, city, address_city, address_street
                FROM partners
                WHERE status = 'active'
                AND (latitude IS NULL OR longitude IS NULL)
                LIMIT 10;
            """)).fetchall()
            
            print("⚠️  Exemples de partenaires non géocodés (max 10):")
            for p in not_geocoded:
                city = p.city or p.address_city or "Ville inconnue"
                street = p.address_street or "Adresse inconnue"
                print(f"  - ID {p.id}: {p.name} - {street}, {city}")
            
            if stats.not_geocoded > 10:
                print(f"\n  ... et {stats.not_geocoded - 10} autres")
        
        return stats.geocoded, stats.not_geocoded
        
    except Exception as e:
        print(f"\n❌ Erreur de vérification: {str(e)}\n")
        return 0, 0


def run_geocoding_migration(limit=None, force=False):
    """
    Point d'entrée principal pour la migration de géocodage
    
    Args:
        limit: Nombre maximum de partenaires à traiter (None = tous)
        force: Force le re-géocodage même si déjà fait
    """
    geocoder = PartnerGeocoder()
    return geocoder.geocode_all_partners(limit=limit, force_regeocode=force)


if __name__ == '__main__':
    """
    Exécution standalone pour debug/test
    """
    from app import app
    
    with app.app_context():
        # Mode 1 : Vérification seulement
        print("Mode sélectionné: VÉRIFICATION")
        verify_geocoding()
        
        # Décommenter pour lancer le géocodage :
        # print("\nMode sélectionné: GÉOCODAGE COMPLET")
        # run_geocoding_migration(limit=10)  # Limité à 10 pour test
        
        # Ou géocoder une ville spécifique :
        # geocode_by_city("Genève", limit=5)
        
        # Ou des IDs spécifiques :
        # geocode_specific_partners([1, 2, 3])
