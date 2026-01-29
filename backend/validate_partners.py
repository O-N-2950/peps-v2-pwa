"""
Système de Validation et Audit des Partenaires PEP's - VERSION MULTI-PAYS
- Supporte: Suisse (CH), France (FR), Belgique (BE), et expansion mondiale
- Détecte les coordonnées GPS incohérentes avec le pays déclaré
- Valide les codes postaux par pays
- Identifie les doublons
- Génère des rapports d'audit détaillés
"""

from sqlalchemy import text, func
from models import db, Partner
import re
from datetime import datetime
import json

class PartnerValidator:
    def __init__(self):
        # Limites géographiques par pays
        self.COUNTRY_BOUNDS = {
            'CH': {  # Suisse
                'lat_min': 45.8, 'lat_max': 47.9,
                'lng_min': 5.9, 'lng_max': 10.5,
                'name': 'Switzerland',
                'postcode_pattern': r'^\d{4}$',  # 4 chiffres
                'postcode_range': (1000, 9999)
            },
            'FR': {  # France
                'lat_min': 41.3, 'lat_max': 51.1,
                'lng_min': -5.1, 'lng_max': 9.6,
                'name': 'France',
                'postcode_pattern': r'^\d{5}$',  # 5 chiffres
                'postcode_range': (1000, 99999)
            },
            'BE': {  # Belgique
                'lat_min': 49.5, 'lat_max': 51.5,
                'lng_min': 2.5, 'lng_max': 6.4,
                'name': 'Belgium',
                'postcode_pattern': r'^\d{4}$',  # 4 chiffres
                'postcode_range': (1000, 9999)
            }
        }
        
        # Codes pays acceptés (extensions possibles)
        self.ALLOWED_COUNTRIES = ['CH', 'FR', 'BE', 'CHE', 'FRA', 'BEL', 
                                  'SWITZERLAND', 'FRANCE', 'BELGIUM',
                                  'SUISSE', 'SCHWEIZ', 'SVIZZERA',
                                  'BELGIQUE', 'BELGIË']
        
        # Normalisation des codes pays
        self.COUNTRY_NORMALIZATION = {
            'CHE': 'CH',
            'SWITZERLAND': 'CH',
            'SUISSE': 'CH',
            'SCHWEIZ': 'CH',
            'SVIZZERA': 'CH',
            'FRA': 'FR',
            'FRANCE': 'FR',
            'BEL': 'BE',
            'BELGIUM': 'BE',
            'BELGIQUE': 'BE',
            'BELGIË': 'BE'
        }
        
        self.issues = []
        self.stats = {
            'total': 0,
            'valid': 0,
            'warnings': 0,
            'errors': 0,
            'critical': 0,
            'by_country': {}
        }
    
    def normalize_country_code(self, country):
        """
        Normalise le code pays en format ISO 2 lettres
        """
        if not country:
            return None
        
        country_upper = country.upper().strip()
        
        # Déjà au bon format
        if country_upper in ['CH', 'FR', 'BE']:
            return country_upper
        
        # Normalisation
        return self.COUNTRY_NORMALIZATION.get(country_upper)
    
    def detect_country_from_gps(self, lat, lng):
        """
        Détecte le pays probable à partir des coordonnées GPS
        """
        if not lat or not lng:
            return None, 'GPS manquant'
        
        for country_code, bounds in self.COUNTRY_BOUNDS.items():
            if (bounds['lat_min'] <= lat <= bounds['lat_max'] and
                bounds['lng_min'] <= lng <= bounds['lng_max']):
                return country_code, bounds['name']
        
        # Hors des pays principaux mais GPS valide
        return 'OTHER', 'Autre pays (expansion mondiale)'
    
    def is_gps_coherent_with_country(self, lat, lng, declared_country):
        """
        Vérifie si le GPS correspond au pays déclaré
        """
        if not lat or not lng or not declared_country:
            return None, "Données manquantes"
        
        detected_country, detected_name = self.detect_country_from_gps(lat, lng)
        
        if detected_country == 'OTHER':
            # GPS hors CH/FR/BE mais OK pour expansion mondiale
            return True, f"Expansion mondiale détectée ({lat:.2f}, {lng:.2f})"
        
        normalized_declared = self.normalize_country_code(declared_country)
        
        if normalized_declared != detected_country:
            return False, f"GPS en {detected_name} mais pays déclaré: {declared_country}"
        
        return True, f"Cohérent ({detected_name})"
    
    def validate_postcode(self, postcode, country):
        """
        Valide le format du code postal selon le pays
        """
        if not postcode:
            return False, "Code postal manquant"
        
        postcode_str = str(postcode).strip()
        normalized_country = self.normalize_country_code(country)
        
        if not normalized_country:
            return False, "Pays non déclaré, impossible de valider le code postal"
        
        if normalized_country not in self.COUNTRY_BOUNDS:
            # Pays hors CH/FR/BE : validation basique
            if len(postcode_str) < 3 or len(postcode_str) > 10:
                return False, f"Format suspect: {postcode_str}"
            return True, "Format acceptable (pays étendu)"
        
        bounds = self.COUNTRY_BOUNDS[normalized_country]
        pattern = re.compile(bounds['postcode_pattern'])
        
        if not pattern.match(postcode_str):
            return False, f"Format invalide pour {normalized_country}: {postcode_str}"
        
        # Vérifier la plage numérique
        try:
            code_num = int(postcode_str)
            if code_num < bounds['postcode_range'][0] or code_num > bounds['postcode_range'][1]:
                return False, f"Hors limites pour {normalized_country}: {code_num}"
        except:
            pass
        
        return True, "Valide"
    
    def calculate_distance(self, lat1, lng1, lat2, lng2):
        """
        Calcule la distance en km entre deux points GPS
        """
        from math import radians, cos, sin, asin, sqrt
        
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
        
        dlng = lng2 - lng1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        c = 2 * asin(sqrt(a))
        
        return 6371 * c
    
    def validate_partner(self, partner):
        """
        Valide un partenaire individuel
        """
        partner_issues = []
        severity_level = 'valid'
        
        # ========================================
        # 1. VALIDATION GPS
        # ========================================
        
        if not partner.latitude or not partner.longitude:
            partner_issues.append({
                'type': 'missing_gps',
                'severity': 'critical',
                'message': 'Coordonnées GPS manquantes',
                'field': 'latitude, longitude'
            })
            severity_level = 'critical'
        else:
            # Détecter le pays depuis le GPS
            detected_country, detected_name = self.detect_country_from_gps(
                partner.latitude, partner.longitude
            )
            
            partner.detected_country = detected_country
            partner.detected_country_name = detected_name
            
            # Vérifier cohérence GPS ↔ Pays déclaré
            if partner.address_country:
                is_coherent, coherence_msg = self.is_gps_coherent_with_country(
                    partner.latitude, partner.longitude, partner.address_country
                )
                
                if is_coherent == False:
                    partner_issues.append({
                        'type': 'gps_country_mismatch',
                        'severity': 'error',
                        'message': coherence_msg,
                        'field': 'latitude, longitude, address_country',
                        'suggestion': f'Vérifier si GPS ou pays est correct'
                    })
                    if severity_level in ['valid', 'warning']:
                        severity_level = 'error'
        
        # ========================================
        # 2. VALIDATION PAYS
        # ========================================
        
        if not partner.address_country:
            partner_issues.append({
                'type': 'missing_country',
                'severity': 'warning',
                'message': 'Pays manquant',
                'field': 'address_country',
                'suggestion': f'Définir comme "{partner.detected_country or "CH"}"'
            })
            if severity_level == 'valid':
                severity_level = 'warning'
        else:
            # Normaliser le code pays
            normalized = self.normalize_country_code(partner.address_country)
            
            if not normalized:
                # Pays non reconnu mais accepté pour expansion mondiale
                partner_issues.append({
                    'type': 'unknown_country',
                    'severity': 'info',
                    'message': f'Pays non standard: {partner.address_country} (expansion mondiale)',
                    'field': 'address_country'
                })
            elif partner.address_country != normalized:
                # Suggérer normalisation
                partner_issues.append({
                    'type': 'country_not_normalized',
                    'severity': 'info',
                    'message': f'Pays non normalisé: {partner.address_country} → {normalized}',
                    'field': 'address_country',
                    'suggestion': f'Normaliser en "{normalized}"'
                })
        
        # ========================================
        # 3. VALIDATION ADRESSE
        # ========================================
        
        # Code postal
        postcode_valid, postcode_msg = self.validate_postcode(
            partner.address_postal_code, 
            partner.address_country
        )
        
        if not postcode_valid:
            partner_issues.append({
                'type': 'invalid_postcode',
                'severity': 'error',
                'message': f'Code postal invalide: {postcode_msg}',
                'field': 'address_postal_code',
                'suggestion': 'Corriger le format selon le pays'
            })
            if severity_level in ['valid', 'warning']:
                severity_level = 'error'
        
        # Rue manquante
        if not partner.address_street:
            partner_issues.append({
                'type': 'missing_street',
                'severity': 'warning',
                'message': 'Rue manquante',
                'field': 'address_street',
                'suggestion': 'Utiliser reverse geocoding'
            })
            if severity_level == 'valid':
                severity_level = 'warning'
        
        # Ville manquante
        if not partner.address_city and not partner.city:
            partner_issues.append({
                'type': 'missing_city',
                'severity': 'error',
                'message': 'Ville manquante',
                'field': 'address_city, city',
                'suggestion': 'Utiliser reverse geocoding'
            })
            if severity_level in ['valid', 'warning']:
                severity_level = 'error'
        
        # Incohérence city vs address_city
        if partner.city and partner.address_city:
            if partner.city.lower().strip() != partner.address_city.lower().strip():
                partner_issues.append({
                    'type': 'city_mismatch',
                    'severity': 'warning',
                    'message': f'Incohérence ville: "{partner.city}" ≠ "{partner.address_city}"',
                    'field': 'city, address_city',
                    'suggestion': 'Synchroniser les champs'
                })
                if severity_level == 'valid':
                    severity_level = 'warning'
        
        # ========================================
        # 4. VALIDATION DONNÉES MÉTIER
        # ========================================
        
        # Nom manquant
        if not partner.name or len(partner.name.strip()) < 2:
            partner_issues.append({
                'type': 'invalid_name',
                'severity': 'critical',
                'message': 'Nom partenaire invalide ou manquant',
                'field': 'name'
            })
            severity_level = 'critical'
        
        # Catégorie manquante
        if not partner.category:
            partner_issues.append({
                'type': 'missing_category',
                'severity': 'warning',
                'message': 'Catégorie manquante',
                'field': 'category'
            })
            if severity_level == 'valid':
                severity_level = 'warning'
        
        # ========================================
        # 5. ENREGISTREMENT
        # ========================================
        
        if partner_issues:
            self.issues.append({
                'partner_id': partner.id,
                'partner_name': partner.name,
                'category': partner.category,
                'city': partner.city or partner.address_city,
                'country': partner.address_country,
                'detected_country': getattr(partner, 'detected_country', None),
                'severity': severity_level,
                'issues': partner_issues,
                'gps': f"({partner.latitude}, {partner.longitude})" if partner.latitude else None
            })
        
        # Statistiques par pays
        country = partner.address_country or 'UNKNOWN'
        if country not in self.stats['by_country']:
            self.stats['by_country'][country] = {'total': 0, 'valid': 0, 'errors': 0}
        
        self.stats['by_country'][country]['total'] += 1
        if severity_level == 'valid':
            self.stats['by_country'][country]['valid'] += 1
        else:
            self.stats['by_country'][country]['errors'] += 1
        
        # Statistiques globales
        self.stats[severity_level] += 1
        
        return severity_level, partner_issues
    
    def find_duplicates(self):
        """
        Détecte les partenaires en double (même nom + même ville)
        """
        print("\n" + "="*80)
        print("🔍 RECHERCHE DE DOUBLONS")
        print("="*80 + "\n")
        
        duplicates = db.session.execute(text("""
            WITH duplicates AS (
                SELECT 
                    LOWER(TRIM(name)) as normalized_name,
                    LOWER(TRIM(COALESCE(address_city, city))) as normalized_city,
                    COUNT(*) as count,
                    ARRAY_AGG(id ORDER BY id) as partner_ids,
                    ARRAY_AGG(name ORDER BY id) as names,
                    ARRAY_AGG(COALESCE(address_country, 'UNKNOWN') ORDER BY id) as countries
                FROM partners
                WHERE status = 'active'
                AND name IS NOT NULL
                AND (address_city IS NOT NULL OR city IS NOT NULL)
                GROUP BY normalized_name, normalized_city
                HAVING COUNT(*) > 1
            )
            SELECT 
                normalized_name,
                normalized_city,
                count,
                partner_ids,
                names,
                countries
            FROM duplicates
            ORDER BY count DESC, normalized_name;
        """)).fetchall()
        
        if duplicates:
            print(f"⚠️  {len(duplicates)} groupes de doublons détectés:\n")
            
            for dup in duplicates:
                print(f"  📋 {dup.names[0]} - {dup.normalized_city}")
                print(f"     IDs: {list(dup.partner_ids)}")
                print(f"     Pays: {list(dup.countries)}")
                print(f"     Occurrences: {dup.count}\n")
                
                self.issues.append({
                    'type': 'duplicate_group',
                    'severity': 'warning',
                    'name': dup.names[0],
                    'city': dup.normalized_city,
                    'countries': list(dup.countries),
                    'count': dup.count,
                    'partner_ids': list(dup.partner_ids)
                })
        else:
            print("✅ Aucun doublon détecté\n")
        
        return len(duplicates)
    
    def validate_all_partners(self):
        """
        Valide tous les partenaires actifs
        """
        print("\n" + "="*80)
        print("🌍 VALIDATION MULTI-PAYS DES PARTENAIRES")
        print("="*80)
        print(f"⏰ Démarrage: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Pays supportés: CH 🇨🇭, FR 🇫🇷, BE 🇧🇪 + Expansion mondiale 🌍")
        print("="*80 + "\n")
        
        # Récupérer tous les partenaires actifs
        partners = Partner.query.filter_by(status='active').all()
        self.stats['total'] = len(partners)
        
        print(f"📋 Partenaires à valider: {len(partners)}\n")
        
        # Valider chaque partenaire
        for i, partner in enumerate(partners, 1):
            if i % 20 == 0:
                print(f"  Progression: {i}/{len(partners)} ({(i/len(partners)*100):.1f}%)")
            
            self.validate_partner(partner)
        
        # Rechercher les doublons
        self.find_duplicates()
        
        # Générer le rapport
        self.generate_report()
    
    def generate_report(self):
        """
        Génère un rapport détaillé de validation
        """
        print("\n" + "="*80)
        print("📊 RAPPORT DE VALIDATION MULTI-PAYS")
        print("="*80 + "\n")
        
        # Statistiques globales
        print("📈 Statistiques Globales:")
        print(f"  Total partenaires:     {self.stats['total']}")
        print(f"  ✅ Valides:             {self.stats['valid']} ({(self.stats['valid']/self.stats['total']*100):.1f}%)")
        print(f"  ℹ️  Avertissements:      {self.stats['warnings']}")
        print(f"  ⚠️  Erreurs:             {self.stats['errors']}")
        print(f"  🚨 Critiques:           {self.stats['critical']}")
        
        # Statistiques par pays
        print(f"\n🌍 Répartition par Pays:")
        for country, stats in sorted(self.stats['by_country'].items(), key=lambda x: -x[1]['total']):
            country_flag = {'CH': '🇨🇭', 'FR': '🇫🇷', 'BE': '🇧🇪'}.get(country, '🌍')
            print(f"  {country_flag} {country}: {stats['total']} partenaires ({stats['valid']} valides, {stats['errors']} avec erreurs)")
        
        # Grouper les problèmes par type
        issues_by_type = {}
        for issue in self.issues:
            if 'issues' in issue:
                for sub_issue in issue['issues']:
                    issue_type = sub_issue['type']
                    if issue_type not in issues_by_type:
                        issues_by_type[issue_type] = []
                    issues_by_type[issue_type].append(issue)
        
        print(f"\n📋 Types de problèmes détectés ({len(issues_by_type)}):\n")
        
        for issue_type, occurrences in sorted(issues_by_type.items(), key=lambda x: -len(x[1])):
            print(f"  - {issue_type}: {len(occurrences)} occurrence(s)")
        
        # Problèmes critiques
        critical = [i for i in self.issues if i.get('severity') == 'critical']
        if critical:
            print(f"\n🚨 PROBLÈMES CRITIQUES ({len(critical)}):\n")
            for issue in critical[:10]:
                print(f"  ID {issue['partner_id']}: {issue['partner_name']} ({issue.get('country', 'N/A')})")
                for sub in issue['issues']:
                    if sub['severity'] == 'critical':
                        print(f"    ❌ {sub['message']}")
            if len(critical) > 10:
                print(f"\n  ... et {len(critical) - 10} autres")
        
        # Recommandations
        print("\n" + "="*80)
        print("💡 RECOMMANDATIONS")
        print("="*80 + "\n")
        
        if self.stats['critical'] > 0:
            print("  1. 🚨 URGENT: Corriger les problèmes critiques (GPS manquants, noms invalides)")
        if self.stats['errors'] > 0:
            print("  2. ⚠️  Corriger les erreurs (codes postaux, incohérences GPS/Pays)")
        if self.stats['warnings'] > 0:
            print("  3. ℹ️  Traiter les avertissements (adresses incomplètes)")
        
        print("\n  Actions recommandées:")
        print("    - Normaliser les codes pays (CH, FR, BE)")
        print("    - Exécuter le reverse geocoding pour enrichir les adresses")
        print("    - Synchroniser les champs city/address_city")
        print("    - Vérifier les incohérences GPS ↔ Pays")
        
        print("\n" + "="*80)
        print(f"⏰ Fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")
        
        return self.stats
    
    def export_issues_json(self, filename='validation_report.json'):
        """
        Exporte les problèmes au format JSON
        """
        report = {
            'generated_at': datetime.now().isoformat(),
            'stats': self.stats,
            'issues': self.issues
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Rapport JSON exporté: {filename}")
        return filename


def run_validation():
    """
    Point d'entrée principal pour la validation
    """
    validator = PartnerValidator()
    validator.validate_all_partners()
    return validator


def quick_check():
    """
    Vérification rapide pour le dashboard
    """
    try:
        stats = db.session.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) as missing_gps,
                COUNT(*) FILTER (WHERE address_street IS NULL) as missing_street,
                COUNT(*) FILTER (WHERE address_postal_code IS NULL) as missing_postcode,
                COUNT(*) FILTER (WHERE address_city IS NULL AND city IS NULL) as missing_city,
                COUNT(*) FILTER (WHERE address_country IS NULL) as missing_country,
                COUNT(*) FILTER (WHERE address_country = 'CH' OR address_country ILIKE '%swiss%' OR address_country ILIKE '%suisse%') as count_ch,
                COUNT(*) FILTER (WHERE address_country = 'FR' OR address_country ILIKE '%france%') as count_fr,
                COUNT(*) FILTER (WHERE address_country = 'BE' OR address_country ILIKE '%belg%') as count_be
            FROM partners
            WHERE status = 'active';
        """)).fetchone()
        
        return {
            'total': stats.total,
            'missing_gps': stats.missing_gps,
            'missing_street': stats.missing_street,
            'missing_postcode': stats.missing_postcode,
            'missing_city': stats.missing_city,
            'missing_country': stats.missing_country,
            'by_country': {
                'CH': stats.count_ch,
                'FR': stats.count_fr,
                'BE': stats.count_be,
                'OTHER': stats.total - stats.count_ch - stats.count_fr - stats.count_be
            },
            'health_score': int(((stats.total - stats.missing_gps) / stats.total * 100)) if stats.total > 0 else 0
        }
    except Exception as e:
        print(f"Erreur quick_check: {str(e)}")
        return None


if __name__ == '__main__':
    """
    Exécution standalone
    """
    from app import app
    
    with app.app_context():
        validator = run_validation()
        validator.export_issues_json()
