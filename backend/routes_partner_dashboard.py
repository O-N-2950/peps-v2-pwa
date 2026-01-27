"""
Dashboard Partner V21 - Routes API simplifiées
Version sans IA Gemini ni cron job pour déploiement stable
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Partner, Offer, PrivilegeUsage
from sqlalchemy import func
from datetime import datetime, timedelta

partner_dashboard_bp = Blueprint('partner_dashboard', __name__, url_prefix='/api/partner')

def get_partner_from_token():
    """Récupère le partenaire depuis le token JWT"""
    try:
        user_id = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        partner = Partner.query.filter_by(user_id=user_id).first()
        return partner
    except:
        return None

@partner_dashboard_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    """Statistiques du partenaire en temps réel"""
    partner = get_partner_from_token()
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    # Statistiques des 7 derniers jours
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # Nombre total d'activations
    total_activations = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id
    ).count()
    
    # Activations des 7 derniers jours
    recent_activations = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id,
        PrivilegeUsage.used_at >= seven_days_ago
    ).count()
    
    # Nombre de privilèges actifs
    active_offers = Offer.query.filter_by(partner_id=partner.id, active=True).count()
    
    # Graphique des 7 derniers jours
    daily_stats = []
    for i in range(7):
        day = datetime.utcnow() - timedelta(days=6-i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        count = PrivilegeUsage.query.join(Offer).filter(
            Offer.partner_id == partner.id,
            PrivilegeUsage.used_at >= day_start,
            PrivilegeUsage.used_at < day_end
        ).count()
        
        daily_stats.append({
            'date': day.strftime('%Y-%m-%d'),
            'activations': count
        })
    
    return jsonify({
        'total_activations': total_activations,
        'recent_activations': recent_activations,
        'active_offers': active_offers,
        'daily_stats': daily_stats
    })

@partner_dashboard_bp.route('/privileges', methods=['GET'])
@jwt_required()
def get_privileges():
    """Liste des privilèges du partenaire"""
    partner = get_partner_from_token()
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    offers = Offer.query.filter_by(partner_id=partner.id).all()
    
    result = []
    for offer in offers:
        # Compter les utilisations
        total_uses = PrivilegeUsage.query.filter_by(offer_id=offer.id).count()
        
        result.append({
            'id': offer.id,
            'title': offer.title,
            'description': offer.description,
            'offer_type': offer.offer_type,
            'active': offer.active,
            'discount_val': offer.discount_val,
            'total_uses': total_uses,
            'created_at': offer.created_at.isoformat() if offer.created_at else None
        })
    
    return jsonify(result)

@partner_dashboard_bp.route('/privileges', methods=['POST'])
@jwt_required()
def create_privilege():
    """Créer un nouveau privilège"""
    partner = get_partner_from_token()
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    data = request.json
    
    new_offer = Offer(
        partner_id=partner.id,
        title=data.get('title'),
        description=data.get('description'),
        discount_val=data.get('value'),
        offer_type=data.get('type', 'permanent'),
        active=True,
        created_at=datetime.utcnow()
    )
    
    db.session.add(new_offer)
    db.session.commit()
    
    return jsonify({
        'message': 'Privilège créé avec succès',
        'id': new_offer.id
    }), 201

@partner_dashboard_bp.route('/privileges/<int:offer_id>', methods=['PUT'])
@jwt_required()
def update_privilege(offer_id):
    """Modifier un privilège existant"""
    partner = get_partner_from_token()
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    offer = Offer.query.filter_by(id=offer_id, partner_id=partner.id).first()
    if not offer:
        return jsonify({'error': 'Privilège non trouvé'}), 404
    
    data = request.json
    
    if 'title' in data:
        offer.title = data['title']
    if 'description' in data:
        offer.description = data['description']
    if 'active' in data:
        offer.active = data['active']
    if 'discount_val' in data:
        offer.discount_val = data['discount_val']
    
    db.session.commit()
    
    return jsonify({'message': 'Privilège modifié avec succès'})

@partner_dashboard_bp.route('/privileges/<int:offer_id>', methods=['DELETE'])
@jwt_required()
def delete_privilege(offer_id):
    """Supprimer un privilège"""
    partner = get_partner_from_token()
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    offer = Offer.query.filter_by(id=offer_id, partner_id=partner.id).first()
    if not offer:
        return jsonify({'error': 'Privilège non trouvé'}), 404
    
    db.session.delete(offer)
    db.session.commit()
    
    return jsonify({'message': 'Privilège supprimé avec succès'})

@partner_dashboard_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Profil du partenaire"""
    partner = get_partner_from_token()
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    return jsonify({
        'id': partner.id,
        'name': partner.name,
        'category': partner.category,
        'address': partner.address,
        'city': partner.city,
        'latitude': partner.latitude,
        'longitude': partner.longitude,
        'phone': partner.phone,
        'email': partner.email,
        'website': partner.website
    })
