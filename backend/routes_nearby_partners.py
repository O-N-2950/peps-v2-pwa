"""
Routes API pour la liste géolocalisée des partenaires
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Partner, User, followers
from sqlalchemy import func
from math import radians, cos, sin, asin, sqrt

nearby_partners_bp = Blueprint('nearby_partners', __name__, url_prefix='/api')

def haversine(lat1, lon1, lat2, lon2):
    """
    Calcule la distance entre deux points géographiques en kilomètres
    Formule Haversine
    """
    # Rayon de la Terre en km
    R = 6371
    
    # Convertir en radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Différences
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    # Formule Haversine
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    return R * c

@nearby_partners_bp.route('/partners/nearby', methods=['POST'])
@jwt_required()
def get_nearby_partners():
    """
    Récupère la liste des partenaires triés par distance
    
    Body:
        latitude (float): Latitude de l'utilisateur
        longitude (float): Longitude de l'utilisateur
        limit (int, optional): Nombre max de partenaires (défaut: 50)
    
    Returns:
        Liste des partenaires avec distance et statut favori
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.json
        
        user_lat = data.get('latitude')
        user_lon = data.get('longitude')
        limit = data.get('limit', 50)
        
        if not user_lat or not user_lon:
            return jsonify({'error': 'Latitude et longitude requises'}), 400
        
        # Récupérer tous les partenaires actifs
        partners = Partner.query.filter_by(status='active').all()
        
        # Calculer la distance pour chaque partenaire
        partners_with_distance = []
        
        for partner in partners:
            if partner.latitude and partner.longitude:
                distance_km = haversine(user_lat, user_lon, partner.latitude, partner.longitude)
                
                # Vérifier si le partenaire est dans les favoris
                is_favorite = db.session.query(followers).filter_by(
                    user_id=user_id,
                    partner_id=partner.id
                ).first() is not None
                
                partners_with_distance.append({
                    'id': partner.id,
                    'name': partner.business_name,
                    'category': partner.category or 'Commerce',
                    'address': partner.address,
                    'latitude': partner.latitude,
                    'longitude': partner.longitude,
                    'distance': round(distance_km, 2) if distance_km >= 1 else int(distance_km * 1000),
                    'distance_unit': 'km' if distance_km >= 1 else 'm',
                    'distance_raw': distance_km,  # Pour le tri
                    'is_favorite': is_favorite,
                    'logo_url': partner.logo_url if hasattr(partner, 'logo_url') else None
                })
        
        # Trier par distance
        partners_with_distance.sort(key=lambda x: x['distance_raw'])
        
        # Limiter le nombre de résultats
        partners_with_distance = partners_with_distance[:limit]
        
        # Retirer distance_raw (utilisé uniquement pour le tri)
        for partner in partners_with_distance:
            del partner['distance_raw']
        
        return jsonify({
            'partners': partners_with_distance,
            'total': len(partners_with_distance)
        })
    
    except Exception as e:
        print(f"Erreur dans get_nearby_partners: {str(e)}")
        return jsonify({'error': 'Erreur serveur', 'details': str(e)}), 500

@nearby_partners_bp.route('/favorites/add', methods=['POST'])
@jwt_required()
def add_favorite():
    """
    Ajoute un partenaire aux favoris
    
    Body:
        partner_id (int): ID du partenaire
    
    Returns:
        Message de confirmation
    """
    try:
        user_id = int(get_jwt_identity())
        partner_id = request.json.get('partner_id')
        
        if not partner_id:
            return jsonify({'error': 'partner_id requis'}), 400
        
        user = User.query.get(user_id)
        partner = Partner.query.get(partner_id)
        
        if not partner:
            return jsonify({'error': 'Partenaire non trouvé'}), 404
        
        if partner not in user.followed_partners:
            user.followed_partners.append(partner)
            db.session.commit()
            return jsonify({
                'message': 'Ajouté aux favoris',
                'is_favorite': True,
                'partner_id': partner_id
            })
        
        return jsonify({
            'message': 'Déjà dans les favoris',
            'is_favorite': True,
            'partner_id': partner_id
        })
    
    except Exception as e:
        print(f"Erreur dans add_favorite: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erreur serveur', 'details': str(e)}), 500

@nearby_partners_bp.route('/favorites/remove', methods=['POST'])
@jwt_required()
def remove_favorite():
    """
    Retire un partenaire des favoris
    
    Body:
        partner_id (int): ID du partenaire
    
    Returns:
        Message de confirmation
    """
    try:
        user_id = int(get_jwt_identity())
        partner_id = request.json.get('partner_id')
        
        if not partner_id:
            return jsonify({'error': 'partner_id requis'}), 400
        
        user = User.query.get(user_id)
        partner = Partner.query.get(partner_id)
        
        if not partner:
            return jsonify({'error': 'Partenaire non trouvé'}), 404
        
        if partner in user.followed_partners:
            user.followed_partners.remove(partner)
            db.session.commit()
            return jsonify({
                'message': 'Retiré des favoris',
                'is_favorite': False,
                'partner_id': partner_id
            })
        
        return jsonify({
            'message': 'Pas dans les favoris',
            'is_favorite': False,
            'partner_id': partner_id
        })
    
    except Exception as e:
        print(f"Erreur dans remove_favorite: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erreur serveur', 'details': str(e)}), 500
