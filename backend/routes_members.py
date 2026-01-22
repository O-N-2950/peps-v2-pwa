"""
Routes API pour l'inscription et la gestion des membres
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, date
from werkzeug.security import generate_password_hash
import re

# Ces imports seront disponibles quand les routes seront enregistrées dans app.py
# from models import db, User, Member
# from utils.geocoding import geocode_address

members_bp = Blueprint('members', __name__)


def validate_email(email: str) -> bool:
    """Valide le format d'un email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone: str) -> bool:
    """Valide le format d'un numéro de téléphone"""
    # Accepte les formats: +41 79 123 45 67, 0041 79 123 45 67, 079 123 45 67, etc.
    pattern = r'^(\+|00)?[0-9\s\-\(\)]{8,20}$'
    return re.match(pattern, phone) is not None


def calculate_age(birth_date: date) -> int:
    """Calcule l'âge à partir de la date de naissance"""
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def get_currency_from_country(country_code: str) -> str:
    """Détermine la devise selon le pays"""
    if country_code == 'CH':
        return 'CHF'
    elif country_code in ['FR', 'BE', 'LU', 'IT', 'DE', 'AT', 'ES', 'PT', 'NL']:
        return 'EUR'
    else:
        return 'EUR'  # Par défaut


@members_bp.route('/register', methods=['POST'])
def register_member():
    """
    Inscription d'un nouveau membre (privé ou entreprise)
    
    Payload (membre privé):
    {
        "member_type": "private",
        "first_name": "Jean",
        "last_name": "Dupont",
        "birth_date": "1990-05-15",
        "gender": "male",
        "email": "jean.dupont@example.com",
        "phone": "+41 79 123 45 67",
        "password": "SecurePassword123!",
        "address": {
            "street": "Rue du Commerce",
            "number": "12",
            "postal_code": "1003",
            "city": "Lausanne",
            "canton": "Vaud",
            "country": "CH"
        },
        "pack_id": 1
    }
    
    Payload (membre entreprise):
    {
        "member_type": "company",
        "company_name": "ACME SA",
        "company_sector": "Technologie",
        "company_website": "https://acme.ch",
        "contact": {
            "first_name": "Marie",
            "last_name": "Martin",
            "birth_date": "1985-03-20",
            "gender": "female",
            "position": "Directrice RH"
        },
        "email": "marie.martin@acme.ch",
        "phone": "+41 21 123 45 67",
        "password": "SecurePassword123!",
        "address": {
            "street": "Avenue de la Gare",
            "number": "5",
            "postal_code": "1003",
            "city": "Lausanne",
            "canton": "Vaud",
            "country": "CH"
        },
        "pack_id": 5
    }
    
    Response:
    {
        "success": true,
        "message": "Inscription réussie",
        "user_id": 123,
        "member_id": 456,
        "redirect_url": "/api/stripe/create-checkout-session?pack_id=1"
    }
    """
    try:
        data = request.get_json()
        
        # Validation des champs obligatoires communs
        required_fields = ['member_type', 'email', 'phone', 'password', 'address', 'pack_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Champ obligatoire manquant: {field}'}), 400
        
        member_type = data['member_type']
        
        # Validation du type de membre
        if member_type not in ['private', 'company']:
            return jsonify({'success': False, 'error': 'Type de membre invalide (private ou company)'}), 400
        
        # Validation de l'email
        email = data['email'].lower().strip()
        if not validate_email(email):
            return jsonify({'success': False, 'error': 'Format d\'email invalide'}), 400
        
        # Vérifier si l'email existe déjà
        # existing_user = User.query.filter_by(email=email).first()
        # if existing_user:
        #     return jsonify({'success': False, 'error': 'Cet email est déjà utilisé'}), 400
        
        # Validation du téléphone
        phone = data['phone'].strip()
        if not validate_phone(phone):
            return jsonify({'success': False, 'error': 'Format de téléphone invalide'}), 400
        
        # Validation du mot de passe
        password = data['password']
        if len(password) < 8:
            return jsonify({'success': False, 'error': 'Le mot de passe doit contenir au moins 8 caractères'}), 400
        
        # Validation de l'adresse
        address = data['address']
        required_address_fields = ['street', 'postal_code', 'city', 'country']
        for field in required_address_fields:
            if field not in address or not address[field]:
                return jsonify({'success': False, 'error': f'Champ d\'adresse obligatoire manquant: {field}'}), 400
        
        # Déterminer la devise selon le pays
        country = address['country'].upper()
        currency = get_currency_from_country(country)
        
        # Validation spécifique selon le type de membre
        if member_type == 'private':
            # Membre privé
            required_private_fields = ['first_name', 'last_name', 'birth_date', 'gender']
            for field in required_private_fields:
                if field not in data or not data[field]:
                    return jsonify({'success': False, 'error': f'Champ obligatoire manquant: {field}'}), 400
            
            # Validation de la date de naissance
            try:
                birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'success': False, 'error': 'Format de date de naissance invalide (YYYY-MM-DD)'}), 400
            
            # Validation de l'âge (18+ ans)
            age = calculate_age(birth_date)
            if age < 18:
                return jsonify({'success': False, 'error': 'Vous devez avoir au moins 18 ans pour vous inscrire'}), 400
            
            # Validation du genre
            gender = data['gender']
            if gender not in ['male', 'female', 'other']:
                return jsonify({'success': False, 'error': 'Genre invalide (male, female, other)'}), 400
            
            # Création de l'utilisateur
            # user = User(
            #     email=email,
            #     password_hash=generate_password_hash(password),
            #     role='member',
            #     first_name=data['first_name'],
            #     last_name=data['last_name'],
            #     birth_date=birth_date,
            #     gender=gender,
            #     phone=phone,
            #     address_street=address['street'],
            #     address_number=address.get('number', ''),
            #     address_postal_code=address['postal_code'],
            #     address_city=address['city'],
            #     address_canton=address.get('canton', ''),
            #     address_country=country,
            #     currency=currency
            # )
            
            # Création du profil membre
            # member = Member(
            #     user=user,
            #     first_name=data['first_name'],
            #     member_type='private'
            # )
        
        elif member_type == 'company':
            # Membre entreprise
            required_company_fields = ['company_name', 'contact']
            for field in required_company_fields:
                if field not in data or not data[field]:
                    return jsonify({'success': False, 'error': f'Champ obligatoire manquant: {field}'}), 400
            
            contact = data['contact']
            required_contact_fields = ['first_name', 'last_name', 'birth_date', 'gender', 'position']
            for field in required_contact_fields:
                if field not in contact or not contact[field]:
                    return jsonify({'success': False, 'error': f'Champ de contact obligatoire manquant: {field}'}), 400
            
            # Validation de la date de naissance du contact
            try:
                contact_birth_date = datetime.strptime(contact['birth_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'success': False, 'error': 'Format de date de naissance du contact invalide (YYYY-MM-DD)'}), 400
            
            # Validation de l'âge du contact (18+ ans)
            contact_age = calculate_age(contact_birth_date)
            if contact_age < 18:
                return jsonify({'success': False, 'error': 'La personne de contact doit avoir au moins 18 ans'}), 400
            
            # Validation du genre du contact
            contact_gender = contact['gender']
            if contact_gender not in ['male', 'female', 'other']:
                return jsonify({'success': False, 'error': 'Genre du contact invalide (male, female, other)'}), 400
            
            # Création de l'utilisateur
            # user = User(
            #     email=email,
            #     password_hash=generate_password_hash(password),
            #     role='member',
            #     first_name=contact['first_name'],
            #     last_name=contact['last_name'],
            #     birth_date=contact_birth_date,
            #     gender=contact_gender,
            #     phone=phone,
            #     address_street=address['street'],
            #     address_number=address.get('number', ''),
            #     address_postal_code=address['postal_code'],
            #     address_city=address['city'],
            #     address_canton=address.get('canton', ''),
            #     address_country=country,
            #     currency=currency
            # )
            
            # Création du profil membre
            # member = Member(
            #     user=user,
            #     first_name=contact['first_name'],
            #     member_type='company',
            #     company_name=data['company_name'],
            #     company_sector=data.get('company_sector'),
            #     company_website=data.get('company_website'),
            #     contact_first_name=contact['first_name'],
            #     contact_last_name=contact['last_name'],
            #     contact_birth_date=contact_birth_date,
            #     contact_gender=contact_gender,
            #     contact_position=contact['position']
            # )
        
        # Sauvegarder dans la base de données
        # db.session.add(user)
        # db.session.add(member)
        # db.session.commit()
        
        # TODO: Créer la session Stripe Checkout
        # redirect_url = f"/api/stripe/create-checkout-session?pack_id={data['pack_id']}&user_id={user.id}"
        
        return jsonify({
            'success': True,
            'message': 'Inscription réussie',
            # 'user_id': user.id,
            # 'member_id': member.id,
            # 'redirect_url': redirect_url
        }), 201
    
    except Exception as e:
        # db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@members_bp.route('/validate-email', methods=['POST'])
def validate_email_availability():
    """
    Vérifie si un email est disponible
    
    Payload:
    {
        "email": "test@example.com"
    }
    
    Response:
    {
        "available": true
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        
        if not email:
            return jsonify({'available': False, 'error': 'Email requis'}), 400
        
        if not validate_email(email):
            return jsonify({'available': False, 'error': 'Format d\'email invalide'}), 400
        
        # existing_user = User.query.filter_by(email=email).first()
        # available = existing_user is None
        
        return jsonify({'available': True}), 200
    
    except Exception as e:
        return jsonify({'available': False, 'error': str(e)}), 500


@members_bp.route('/calculate-age', methods=['POST'])
def calculate_age_endpoint():
    """
    Calcule l'âge à partir d'une date de naissance
    
    Payload:
    {
        "birth_date": "1990-05-15"
    }
    
    Response:
    {
        "age": 35,
        "is_adult": true
    }
    """
    try:
        data = request.get_json()
        birth_date_str = data.get('birth_date')
        
        if not birth_date_str:
            return jsonify({'error': 'Date de naissance requise'}), 400
        
        try:
            birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Format de date invalide (YYYY-MM-DD)'}), 400
        
        age = calculate_age(birth_date)
        is_adult = age >= 18
        
        return jsonify({
            'age': age,
            'is_adult': is_adult
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Les routes ci-dessous seront activées après l'enregistrement du blueprint dans app.py
# Pour activer, ajouter dans app.py:
# from routes_members import members_bp
# app.register_blueprint(members_bp)
