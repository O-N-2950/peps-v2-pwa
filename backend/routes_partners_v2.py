"""
Routes API pour l'inscription et la gestion des partenaires
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, date
from werkzeug.security import generate_password_hash
import re

# Ces imports seront disponibles quand les routes seront enregistrées dans app.py
# from models import db, User, Partner
# from utils.geocoding import geocode_address
# from utils.privilege_suggestions import get_privilege_suggestions, get_all_categories

partners_bp = Blueprint('partners', __name__)


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


@partners_bp.route('/register', methods=['POST'])
def register_partner():
    """
    Inscription d'un nouveau partenaire
    
    Payload:
    {
        "establishment_name": "Restaurant Chez Paul",
        "establishment_type": "commerce",
        "category_id": 1,
        "description": "Restaurant traditionnel suisse",
        "privilege": "10% sur l'addition",
        "website": "https://chezpaul.ch",
        "logo_url": "https://storage.example.com/logo.jpg",
        "contact": {
            "first_name": "Paul",
            "last_name": "Dupont",
            "birth_date": "1975-08-20",
            "gender": "male",
            "position": "Gérant",
            "email": "paul@chezpaul.ch",
            "phone": "+41 21 123 45 67"
        },
        "address": {
            "street": "Rue du Commerce",
            "number": "12",
            "postal_code": "1003",
            "city": "Lausanne",
            "canton": "Vaud",
            "country": "CH"
        },
        "password": "SecurePassword123!"
    }
    
    Response:
    {
        "success": true,
        "message": "Inscription réussie. Votre compte est en attente de validation.",
        "partner_id": 123,
        "status": "pending"
    }
    """
    try:
        data = request.get_json()
        
        # Validation des champs obligatoires
        required_fields = ['establishment_name', 'establishment_type', 'category_id', 
                          'privilege', 'contact', 'address', 'password']
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
                                   'position', 'email', 'phone']
        for field in required_contact_fields:
            if field not in contact or not contact[field]:
                return jsonify({'success': False, 'error': f'Champ de contact obligatoire manquant: {field}'}), 400
        
        # Validation de l'email du contact
        contact_email = contact['email'].lower().strip()
        if not validate_email(contact_email):
            return jsonify({'success': False, 'error': 'Format d\'email du contact invalide'}), 400
        
        # Vérifier si l'email existe déjà
        # existing_user = User.query.filter_by(email=contact_email).first()
        # if existing_user:
        #     return jsonify({'success': False, 'error': 'Cet email est déjà utilisé'}), 400
        
        # Validation du téléphone du contact
        contact_phone = contact['phone'].strip()
        if not validate_phone(contact_phone):
            return jsonify({'success': False, 'error': 'Format de téléphone du contact invalide'}), 400
        
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
        
        # Validation de l'adresse
        address = data['address']
        required_address_fields = ['street', 'postal_code', 'city', 'country']
        for field in required_address_fields:
            if field not in address or not address[field]:
                return jsonify({'success': False, 'error': f'Champ d\'adresse obligatoire manquant: {field}'}), 400
        
        # Validation du mot de passe
        password = data['password']
        if len(password) < 8:
            return jsonify({'success': False, 'error': 'Le mot de passe doit contenir au moins 8 caractères'}), 400
        
        # Géocodage de l'adresse pour obtenir les coordonnées GPS
        # coords = geocode_address(
        #     street=address['street'],
        #     number=address.get('number', ''),
        #     postal_code=address['postal_code'],
        #     city=address['city'],
        #     country=address['country']
        # )
        # 
        # if coords:
        #     latitude, longitude = coords
        # else:
        #     # Si le géocodage échoue, on met des coordonnées nulles
        #     latitude, longitude = None, None
        
        # Création de l'utilisateur
        # user = User(
        #     email=contact_email,
        #     password_hash=generate_password_hash(password),
        #     role='partner',
        #     first_name=contact['first_name'],
        #     last_name=contact['last_name'],
        #     birth_date=contact_birth_date,
        #     gender=contact_gender,
        #     phone=contact_phone,
        #     address_street=address['street'],
        #     address_number=address.get('number', ''),
        #     address_postal_code=address['postal_code'],
        #     address_city=address['city'],
        #     address_canton=address.get('canton', ''),
        #     address_country=address['country'].upper()
        # )
        
        # Création du profil partenaire
        # partner = Partner(
        #     user=user,
        #     name=data['establishment_name'],
        #     establishment_type=establishment_type,
        #     category_id=data['category_id'],
        #     description=data.get('description'),
        #     privilege=privilege,
        #     website=data.get('website'),
        #     logo_url=data.get('logo_url'),
        #     contact_first_name=contact['first_name'],
        #     contact_last_name=contact['last_name'],
        #     contact_birth_date=contact_birth_date,
        #     contact_gender=contact_gender,
        #     contact_position=contact['position'],
        #     contact_email=contact_email,
        #     contact_phone=contact_phone,
        #     address_street=address['street'],
        #     address_number=address.get('number', ''),
        #     address_postal_code=address['postal_code'],
        #     address_city=address['city'],
        #     address_canton=address.get('canton', ''),
        #     address_country=address['country'].upper(),
        #     latitude=latitude,
        #     longitude=longitude,
        #     status='pending'  # En attente de validation admin
        # )
        
        # Sauvegarder dans la base de données
        # db.session.add(user)
        # db.session.add(partner)
        # db.session.commit()
        
        # TODO: Envoyer un email de confirmation au partenaire
        # TODO: Envoyer un email de notification à l'admin
        
        return jsonify({
            'success': True,
            'message': 'Inscription réussie. Votre compte est en attente de validation par notre équipe. Vous recevrez un email de confirmation sous 24-48h.',
            # 'partner_id': partner.id,
            'status': 'pending'
        }), 201
    
    except Exception as e:
        # db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@partners_bp.route('/categories', methods=['GET'])
def get_categories():
    """
    Récupère toutes les catégories d'activité
    
    Response:
    {
        "categories": [
            {
                "id": 1,
                "name": "Restaurant",
                "parent": "Restauration & Gastronomie",
                "icon": "Utensils",
                "description": "Restaurant traditionnel, Brasserie, Bistrot"
            },
            ...
        ]
    }
    """
    try:
        # categories = get_all_categories()
        categories = []  # Placeholder
        return jsonify({'categories': categories}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@partners_bp.route('/privilege-suggestions', methods=['GET'])
def get_privilege_suggestions_endpoint():
    """
    Récupère les suggestions de privilèges pour une catégorie
    
    Query params:
    - category_id: ID de la catégorie (optionnel)
    - category_name: Nom de la catégorie (optionnel)
    - limit: Nombre de suggestions (défaut: 5)
    
    Response:
    {
        "suggestions": [
            "10% sur l'addition",
            "Café offert",
            "Dessert offert",
            ...
        ]
    }
    """
    try:
        category_id = request.args.get('category_id', type=int)
        category_name = request.args.get('category_name')
        limit = request.args.get('limit', default=5, type=int)
        
        if not category_id and not category_name:
            return jsonify({'error': 'category_id ou category_name requis'}), 400
        
        # if category_name:
        #     suggestions = get_privilege_suggestions(category_name, limit)
        # else:
        #     # Récupérer le nom de la catégorie par son ID
        #     category = Category.query.get(category_id)
        #     if not category:
        #         return jsonify({'error': 'Catégorie non trouvée'}), 404
        #     suggestions = get_privilege_suggestions(category.name, limit)
        
        suggestions = []  # Placeholder
        return jsonify({'suggestions': suggestions}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@partners_bp.route('/suggest-category', methods=['POST'])
def suggest_category():
    """
    Suggère un nouveau domaine d'activité (si "Autre" sélectionné)
    
    Payload:
    {
        "partner_id": 123,
        "suggested_name": "Chocolaterie artisanale"
    }
    
    Response:
    {
        "success": true,
        "message": "Suggestion enregistrée. Elle sera examinée par notre équipe.",
        "suggestion_id": 456
    }
    """
    try:
        data = request.get_json()
        
        if 'partner_id' not in data or 'suggested_name' not in data:
            return jsonify({'success': False, 'error': 'partner_id et suggested_name requis'}), 400
        
        partner_id = data['partner_id']
        suggested_name = data['suggested_name'].strip()
        
        if not suggested_name or len(suggested_name) < 3:
            return jsonify({'success': False, 'error': 'Le nom suggéré doit contenir au moins 3 caractères'}), 400
        
        # Créer la suggestion
        # suggestion = SuggestedCategory(
        #     partner_id=partner_id,
        #     suggested_name=suggested_name,
        #     status='pending'
        # )
        # 
        # db.session.add(suggestion)
        # db.session.commit()
        
        # TODO: Envoyer un email de notification à l'admin
        
        return jsonify({
            'success': True,
            'message': 'Suggestion enregistrée. Elle sera examinée par notre équipe.',
            # 'suggestion_id': suggestion.id
        }), 201
    
    except Exception as e:
        # db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@partners_bp.route('/validate-privilege', methods=['POST'])
def validate_privilege():
    """
    Valide qu'un privilège est non vide et suffisamment descriptif
    
    Payload:
    {
        "privilege": "10% sur l'addition"
    }
    
    Response:
    {
        "valid": true,
        "message": "Privilège valide"
    }
    """
    try:
        data = request.get_json()
        privilege = data.get('privilege', '').strip()
        
        if not privilege:
            return jsonify({'valid': False, 'message': 'Le privilège est obligatoire'}), 200
        
        if len(privilege) < 5:
            return jsonify({'valid': False, 'message': 'Le privilège doit contenir au moins 5 caractères'}), 200
        
        if len(privilege) > 200:
            return jsonify({'valid': False, 'message': 'Le privilège ne peut pas dépasser 200 caractères'}), 200
        
        return jsonify({'valid': True, 'message': 'Privilège valide'}), 200
    
    except Exception as e:
        return jsonify({'valid': False, 'message': str(e)}), 500


# Les routes ci-dessous seront activées après l'enregistrement du blueprint dans app.py
# Pour activer, ajouter dans app.py:
# from routes_partners_v2 import partners_v2_bp
# app.register_blueprint(partners_v2_bp)
