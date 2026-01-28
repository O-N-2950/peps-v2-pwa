"""
Routes API pour le système de followers
Permet aux membres de suivre des partenaires et aux partenaires de voir leurs followers
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Partner, Member
from datetime import datetime

followers_bp = Blueprint('followers', __name__, url_prefix='/api/followers')

def get_user_from_token():
    """Récupère l'utilisateur depuis le token JWT"""
    try:
        user_id = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        user = User.query.get(user_id)
        return user
    except:
        return None

def get_partner_from_token():
    """Récupère le partenaire depuis le token JWT"""
    try:
        user_id = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        partner = Partner.query.filter_by(user_id=user_id).first()
        return partner
    except:
        return None

@followers_bp.route('/partner/<int:partner_id>/count', methods=['GET'])
def get_followers_count(partner_id):
    """Compte le nombre de followers d'un partenaire (public)"""
    partner = Partner.query.get(partner_id)
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    count = len(partner.followers_list)
    
    return jsonify({
        'partner_id': partner_id,
        'followers_count': count
    })

@followers_bp.route('/partner/<int:partner_id>/list', methods=['GET'])
@jwt_required()
def get_followers_list(partner_id):
    """Liste des followers d'un partenaire (anonymisée, réservée au partenaire)"""
    partner = get_partner_from_token()
    if not partner or partner.id != partner_id:
        return jsonify({'error': 'Non autorisé'}), 403
    
    followers = partner.followers_list
    
    result = []
    for follower in followers:
        # Données anonymisées
        member = Member.query.filter_by(user_id=follower.id).first()
        result.append({
            'id': follower.id,
            'first_name': member.first_name if member and member.first_name else 'Membre',
            'followed_at': None,  # TODO: Ajouter un timestamp dans la table followers
            'city': follower.country if hasattr(follower, 'country') else 'CH'
        })
    
    return jsonify({
        'partner_id': partner_id,
        'followers_count': len(result),
        'followers': result
    })

@followers_bp.route('/partner/<int:partner_id>/follow', methods=['POST'])
@jwt_required()
def follow_partner(partner_id):
    """Suivre un partenaire"""
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    partner = Partner.query.get(partner_id)
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    # Vérifier si déjà suivi
    if partner in user.followed_partners:
        return jsonify({'message': 'Vous suivez déjà ce partenaire'}), 200
    
    # Ajouter le follow
    user.followed_partners.append(partner)
    db.session.commit()
    
    return jsonify({
        'message': 'Partenaire suivi avec succès',
        'followers_count': len(partner.followers_list)
    }), 201

@followers_bp.route('/partner/<int:partner_id>/unfollow', methods=['POST'])
@jwt_required()
def unfollow_partner(partner_id):
    """Ne plus suivre un partenaire"""
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    partner = Partner.query.get(partner_id)
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    # Vérifier si suivi
    if partner not in user.followed_partners:
        return jsonify({'message': 'Vous ne suivez pas ce partenaire'}), 200
    
    # Retirer le follow
    user.followed_partners.remove(partner)
    db.session.commit()
    
    return jsonify({
        'message': 'Partenaire retiré des favoris',
        'followers_count': len(partner.followers_list)
    })

@followers_bp.route('/partner/<int:partner_id>/is-following', methods=['GET'])
@jwt_required()
def is_following_partner(partner_id):
    """Vérifier si l'utilisateur suit un partenaire"""
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    partner = Partner.query.get(partner_id)
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    is_following = partner in user.followed_partners
    
    return jsonify({
        'partner_id': partner_id,
        'is_following': is_following,
        'followers_count': len(partner.followers_list)
    })

@followers_bp.route('/my-followed-partners', methods=['GET'])
@jwt_required()
def get_my_followed_partners():
    """Liste des partenaires suivis par l'utilisateur connecté"""
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    result = []
    for partner in user.followed_partners:
        result.append({
            'id': partner.id,
            'name': partner.name,
            'category': partner.category,
            'city': partner.city,
            'image_url': partner.image_url,
            'latitude': partner.latitude,
            'longitude': partner.longitude
        })
    
    return jsonify({
        'count': len(result),
        'partners': result
    })

@followers_bp.route('/my-followers-stats', methods=['GET'])
@jwt_required()
def get_my_followers_stats():
    """Statistiques des followers pour le partenaire connecté"""
    partner = get_partner_from_token()
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    followers_count = len(partner.followers_list)
    
    # TODO: Ajouter évolution (nécessite un timestamp dans la table followers)
    # Pour l'instant, on retourne juste le total
    
    return jsonify({
        'partner_id': partner.id,
        'followers_count': followers_count,
        'evolution': {
            'last_7_days': 0,  # TODO: Calculer avec timestamp
            'last_30_days': 0  # TODO: Calculer avec timestamp
        }
    })
