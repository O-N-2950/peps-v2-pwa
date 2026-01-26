"""
Routes API Flask V20 Admin - VERSION CORRIGÉE
Gestion commerçants avec gestion des colonnes manquantes
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc
from datetime import datetime

from models import db, User, Partner

admin_bp_fixed = Blueprint('admin_fixed', __name__)

def require_admin():
    """Vérifie que l'utilisateur est admin"""
    try:
        uid = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        user = User.query.get(uid)
        if not user or user.role != 'admin':
            return None
        return user
    except:
        return None

def safe_get_attr(obj, attr, default=None):
    """Récupère un attribut de manière sécurisée"""
    try:
        return getattr(obj, attr, default)
    except:
        return default

@admin_bp_fixed.route('/partners', methods=['GET'])
@jwt_required()
def list_partners():
    """Liste tous les commerçants avec filtres - VERSION ROBUSTE"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    # Filtres
    status = request.args.get('status')
    validation_status = request.args.get('validation_status')
    city = request.args.get('city')
    category = request.args.get('category')
    search = request.args.get('search')
    
    query = Partner.query
    
    if status:
        query = query.filter(Partner.status == status)
    if validation_status and hasattr(Partner, 'validation_status'):
        query = query.filter(Partner.validation_status == validation_status)
    if city:
        query = query.filter(Partner.city == city)
    if category:
        query = query.filter(Partner.category == category)
    if search:
        query = query.filter(Partner.name.ilike(f'%{search}%'))
    
    try:
        partners = query.order_by(desc(Partner.created_at)).all()
    except:
        partners = query.all()
    
    result = []
    for p in partners:
        try:
            partner_data = {
                'id': p.id,
                'name': p.name,
                'category': safe_get_attr(p, 'category'),
                'city': safe_get_attr(p, 'city'),
                'address_street': safe_get_attr(p, 'address_street'),
                'address_number': safe_get_attr(p, 'address_number'),
                'address_postal_code': safe_get_attr(p, 'address_postal_code'),
                'phone': safe_get_attr(p, 'phone'),
                'website': safe_get_attr(p, 'website'),
                'status': safe_get_attr(p, 'status', 'pending'),
                'warnings_count': safe_get_attr(p, 'warnings_count', 0),
                'validation_status': safe_get_attr(p, 'validation_status', 'pending'),
            }
            
            # Compter les offres et feedbacks de manière sécurisée
            try:
                partner_data['offers_count'] = len(p.offers) if hasattr(p, 'offers') else 0
            except:
                partner_data['offers_count'] = 0
                
            try:
                partner_data['feedbacks_count'] = len(p.feedbacks) if hasattr(p, 'feedbacks') else 0
            except:
                partner_data['feedbacks_count'] = 0
            
            # Date de création
            try:
                partner_data['created_at'] = p.created_at.isoformat() if p.created_at else None
            except:
                partner_data['created_at'] = None
            
            result.append(partner_data)
        except Exception as e:
            # Si un partenaire pose problème, on le saute
            print(f"Erreur avec partenaire {p.id}: {e}")
            continue
    
    return jsonify({'partners': result})

@admin_bp_fixed.route('/partners/<int:partner_id>/validate', methods=['POST'])
@jwt_required()
def validate_partner(partner_id):
    """Valide un commerçant"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    partner = Partner.query.get_or_404(partner_id)
    
    # Mettre à jour validation_status si la colonne existe
    if hasattr(Partner, 'validation_status'):
        partner.validation_status = 'published'
    if hasattr(Partner, 'validated_by'):
        partner.validated_by = admin.id
    if hasattr(Partner, 'validated_at'):
        partner.validated_at = datetime.utcnow()
    
    # Toujours mettre le statut à active
    partner.status = 'active'
    
    db.session.commit()
    
    return jsonify({'message': 'Partner validated and activated'})

@admin_bp_fixed.route('/partners/<int:partner_id>', methods=['PUT'])
@jwt_required()
def update_partner(partner_id):
    """Met à jour un commerçant"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    partner = Partner.query.get_or_404(partner_id)
    data = request.get_json()
    
    # Mise à jour des champs autorisés
    if 'status' in data:
        partner.status = data['status']
    if 'validation_status' in data and hasattr(Partner, 'validation_status'):
        partner.validation_status = data['validation_status']
    if 'admin_notes' in data and hasattr(Partner, 'admin_notes'):
        partner.admin_notes = data['admin_notes']
    
    db.session.commit()
    
    return jsonify({'message': 'Partner updated', 'id': partner.id})
