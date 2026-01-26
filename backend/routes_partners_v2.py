"""
Routes API pour l'inscription et la gestion des partenaires
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, date
from werkzeug.security import generate_password_hash
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import re

partners_bp = Blueprint('partners', __name__)

# Initialiser le géocodeur Nominatim
geolocator = Nominatim(user_agent="peps_partner_registration")


def validate_email(email: str) -> bool:
    """Valide le format d'un email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone: str) -> bool:
    """Valide le format d'un numéro de téléphone"""
    pattern = r'^(\+|00)?[0-9\s\-\(\)]{8,20}$'
    return re.match(pattern, phone) is not None


def calculate_age(birth_date: date) -> int:
    """Calcule l'âge à partir de la date de naissance"""
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def geocode_address(address_data: dict) -> tuple:
    """
    Géocode une adresse en utilisant Nominatim.
    Retourne (latitude, longitude) ou (None, None) en cas d'échec.
    """
    street = address_data.get('street', '')
    number = address_data.get('number', '')
    postal_code = address_data.get('postal_code', '')
    city = address_data.get('city', '')
    country = address_data.get('country', 'CH')

    full_address = f"{number} {street}, {postal_code} {city}, {country}"
    
    try:
        location = geolocator.geocode(full_address, timeout=10)
        if location:
            return location.latitude, location.longitude
        return None, None
    except (GeocoderTimedOut, GeocoderServiceError, ValueError) as e:
        print(f"Erreur de géocodage pour {full_address}: {e}")
        return None, None


@partners_bp.route('/register', methods=['POST'])
def register_partner():
    """
    Inscription d'un nouveau partenaire avec support des adresses multiples
    """
    try:
        from models import db, User, Partner, PartnerAddress
        
        data = request.get_json()
        
        # Validation des champs obligatoires
        required_fields = ['establishment_name', 'establishment_type', 'category_id', 
                          'privilege', 'contact', 'addresses', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'success': False, 'error': f'Champ obligatoire manquant: {field}'}), 400
        
        # Validation du type d'établissement
        establishment_type = data['establishment_type']
        if establishment_type not in ['commerce', 'association', 'artisan']:
            return jsonify({'success': False, 'error': 'Type d\'établissement invalide'}), 400
        
        # Validation du privilège (OBLIGATOIRE et non vide)
        privilege = data['privilege'].strip()
        if not privilege or len(privilege) < 5:
            return jsonify({'success': False, 'error': 'Le privilège exclusif est obligatoire (minimum 5 caractères)'}), 400
        
        # Validation de la personne de contact
        contact = data['contact']
        required_contact_fields = ['first_name', 'last_name', 'birth_date', 'gender', 
                                   'position', 'email', 'mobile']
        for field in required_contact_fields:
            if field not in contact or not contact[field]:
                return jsonify({'success': False, 'error': f'Champ de contact obligatoire manquant: {field}'}), 400
        
        # Validation de l'email du contact
        contact_email = contact['email'].lower().strip()
        if not validate_email(contact_email):
            return jsonify({'success': False, 'error': 'Format d\'email du contact invalide'}), 400
        
        # Vérifier si l'email existe déjà
        existing_user = User.query.filter_by(email=contact_email).first()
        if existing_user:
            return jsonify({'success': False, 'error': 'Cet email est déjà utilisé'}), 400
        
        # Validation du mobile du contact (obligatoire)
        contact_mobile = contact['mobile'].strip()
        if not validate_phone(contact_mobile):
            return jsonify({'success': False, 'error': 'Format de mobile du contact invalide'}), 400
        
        # Validation du téléphone fixe du contact (optionnel)
        contact_phone = contact.get('phone', '').strip()
        if contact_phone and not validate_phone(contact_phone):
            return jsonify({'success': False, 'error': 'Format de téléphone fixe du contact invalide'}), 400
        
        # Validation de la date de naissance du contact
        try:
            contact_birth_date = datetime.strptime(contact['birth_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'error': 'Format de date de naissance invalide (YYYY-MM-DD)'}), 400
        
        # Validation de l'âge du contact (18+ ans)
        contact_age = calculate_age(contact_birth_date)
        if contact_age < 18:
            return jsonify({'success': False, 'error': 'La personne de contact doit avoir au moins 18 ans'}), 400
        
        # Validation du genre du contact
        contact_gender = contact['gender']
        if contact_gender not in ['male', 'female', 'other']:
            return jsonify({'success': False, 'error': 'Genre du contact invalide'}), 400
        
        # Validation des adresses (PLURIEL)
        addresses_data = data['addresses']
        if not isinstance(addresses_data, list) or len(addresses_data) == 0:
            return jsonify({'success': False, 'error': 'Au moins une adresse est requise'}), 400
        
        # Valider chaque adresse
        for i, addr in enumerate(addresses_data):
            required_address_fields = ['street', 'postal_code', 'city', 'country']
            for field in required_address_fields:
                if field not in addr or not addr[field]:
                    return jsonify({'success': False, 'error': f'Champ d\'adresse {i+1} obligatoire manquant: {field}'}), 400
        
        # Validation du mot de passe
        password = data['password']
        if len(password) < 8:
            return jsonify({'success': False, 'error': 'Le mot de passe doit contenir au moins 8 caractères'}), 400
        
        # Début de la transaction atomique
        # Création de l'utilisateur
        user = User(
            email=contact_email,
            password_hash=generate_password_hash(password),
            role='partner'
        )
        db.session.add(user)
        db.session.flush()  # Obtenir l'ID de l'utilisateur
        
        # Géocoder la première adresse pour remplir les champs du Partner (rétrocompatibilité)
        primary_address = addresses_data[0]
        primary_lat, primary_lon = geocode_address(primary_address)
        
        # Création du profil partenaire
        partner = Partner(
            user_id=user.id,
            name=data['establishment_name'],
            category=establishment_type,
            city=primary_address['city'],
            latitude=primary_lat,
            longitude=primary_lon,
            image_url=data.get('logo_url'),
            # Rétrocompatibilité : Remplir les champs address_* avec la première adresse
            address_street=primary_address['street'],
            address_number=primary_address.get('number', ''),
            address_postal_code=primary_address['postal_code'],
            address_city=primary_address['city'],
            address_country=primary_address['country'].upper(),
            phone=contact_mobile,
            website=data.get('website'),
            status='pending',  # En attente de validation admin
            validation_status='pending'
        )
        db.session.add(partner)
        db.session.flush()  # Obtenir l'ID du partenaire
        
        # Créer les enregistrements PartnerAddress pour chaque adresse
        for i, addr_data in enumerate(addresses_data):
            lat, lon = geocode_address(addr_data)
            
            partner_address = PartnerAddress(
                partner_id=partner.id,
                street=addr_data['street'],
                number=addr_data.get('number', ''),
                postal_code=addr_data['postal_code'],
                city=addr_data['city'],
                canton=addr_data.get('canton', ''),
                country=addr_data['country'].upper(),
                latitude=lat,
                longitude=lon,
                is_primary=(i == 0)  # La première adresse est primaire
            )
            db.session.add(partner_address)
        
        # Commit de toute la transaction
        db.session.commit()
        
        # TODO: Envoyer un email de confirmation au partenaire
        # TODO: Envoyer un email de notification à l'admin
        
        return jsonify({
            'success': True,
            'message': 'Inscription réussie. Votre compte est en attente de validation par notre équipe. Vous recevrez un email de confirmation sous 24-48h.',
            'partner_id': partner.id,
            'addresses_count': len(addresses_data),
            'status': 'pending'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de l'inscription du partenaire: {str(e)}")
        return jsonify({'success': False, 'error': f'Erreur serveur: {str(e)}'}), 500


@partners_bp.route('/categories', methods=['GET'])
def get_categories():
    """
    Récupère toutes les catégories d'activité
    """
    try:
        import json
        import os
        
        # Charger les catégories depuis le fichier JSON
        categories_file = os.path.join(os.path.dirname(__file__), 'data', 'categories.json')
        with open(categories_file, 'r', encoding='utf-8') as f:
            categories_data = json.load(f)
        
        return jsonify({
            'success': True,
            'categories': categories_data
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
