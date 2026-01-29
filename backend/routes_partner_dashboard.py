"""
Dashboard Partner V21 - Routes API simplifiées
Version sans IA Gemini ni cron job pour déploiement stable
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Partner, Offer, PrivilegeUsage
from sqlalchemy import func
from datetime import datetime, timedelta
from utils.date_helpers import format_datetime_for_js

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
    
    # Nombre de followers
    followers_count = len(partner.followers_list)
    
    # Top 5 offres les plus utilisées
    top_offers_query = db.session.query(
        Offer.title,
        func.count(PrivilegeUsage.id).label('count')
    ).join(PrivilegeUsage).filter(
        Offer.partner_id == partner.id
    ).group_by(Offer.id, Offer.title).order_by(func.count(PrivilegeUsage.id).desc()).limit(5)
    
    top_offers = [{'title': title, 'count': count} for title, count in top_offers_query]
    
    # Activations du mois en cours
    today = datetime.utcnow()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    month_activations = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id,
        PrivilegeUsage.used_at >= month_start
    ).count()
    
    # Activations aujourd'hui
    today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)
    today_activations = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id,
        PrivilegeUsage.used_at >= today_start
    ).count()
    
    # Formater les données du graphique pour le frontend
    chart_data = []
    for stat in daily_stats:
        day_name = datetime.strptime(stat['date'], '%Y-%m-%d').strftime('%a')  # Lun, Mar, etc.
        chart_data.append({
            'name': day_name,
            'uses': stat['activations']
        })
    
    return jsonify({
        'total_activations': total_activations,
        'recent_activations': recent_activations,
        'active_offers': active_offers,
        'followers_count': followers_count,
        'month_activations': month_activations,
        'today_activations': today_activations,
        'daily_stats': daily_stats,
        'chart': chart_data,
        'top_offers': top_offers,
        'total_month': month_activations,
        'today': today_activations
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
            'title': offer.title or '',
            'description': offer.description or '',
            'offer_type': offer.offer_type or 'discount',
            'active': bool(offer.active),
            'discount_val': float(offer.discount_val) if offer.discount_val else 0,
            'total_uses': int(total_uses),
            'created_at': format_datetime_for_js(offer.created_at)
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
        'privilege': {
            'id': new_offer.id,
            'title': new_offer.title,
            'description': new_offer.description,
            'offer_type': new_offer.offer_type,
            'active': bool(new_offer.active),
            'discount_val': float(new_offer.discount_val) if new_offer.discount_val else 0,
            'created_at': format_datetime_for_js(new_offer.created_at)
        }
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
    
    total_uses = PrivilegeUsage.query.filter_by(offer_id=offer.id).count()
    
    return jsonify({
        'message': 'Privilège modifié avec succès',
        'privilege': {
            'id': offer.id,
            'title': offer.title,
            'description': offer.description,
            'offer_type': offer.offer_type,
            'active': bool(offer.active),
            'discount_val': float(offer.discount_val) if offer.discount_val else 0,
            'total_uses': int(total_uses),
            'created_at': format_datetime_for_js(offer.created_at)
        }
    })

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
