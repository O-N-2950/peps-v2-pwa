"""
Routes API Flask V20 Admin
Gestion commerçants, privilèges, feedbacks, notifications, parrainage
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc, func
from datetime import datetime, timedelta
import secrets

from models import (
    db, User, Partner, Offer, Member, Pack,
    PartnerFeedback, PartnerWarning, Notification, NotificationReceipt, Referral
)

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

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

# ========== GESTION COMMERÇANTS ==========

@admin_bp.route('/partners', methods=['GET'])
@jwt_required()
def list_partners():
    """Liste tous les commerçants avec filtres"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    # Filtres
    status = request.args.get('status')  # active, warned, suspended, excluded
    validation_status = request.args.get('validation_status')  # draft, pending, published
    city = request.args.get('city')
    category = request.args.get('category')
    search = request.args.get('search')
    
    query = Partner.query
    
    if status:
        query = query.filter(Partner.status == status)
    if validation_status:
        query = query.filter(Partner.validation_status == validation_status)
    if city:
        query = query.filter(Partner.city == city)
    if category:
        query = query.filter(Partner.category == category)
    if search:
        query = query.filter(Partner.name.ilike(f'%{search}%'))
    
    partners = query.order_by(desc(Partner.created_at)).all()
    
    return jsonify({
        'partners': [{
            'id': p.id,
            'name': p.name,
            'category': p.category,
            'city': p.city,
            'address_street': p.address_street,
            'address_number': p.address_number,
            'address_postal_code': p.address_postal_code,
            'phone': p.phone,
            'website': p.website,
            'status': p.status,
            'warnings_count': p.warnings_count,
            'validation_status': p.validation_status,
            'offers_count': len(p.offers),
            'feedbacks_count': len(p.feedbacks),
            'created_at': p.created_at.isoformat() if p.created_at else None
        } for p in partners]
    })

@admin_bp.route('/partners/<int:partner_id>', methods=['GET'])
@jwt_required()
def get_partner(partner_id):
    """Récupère un commerçant avec tous ses détails"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    partner = Partner.query.get_or_404(partner_id)
    
    return jsonify({
        'id': partner.id,
        'name': partner.name,
        'category': partner.category,
        'city': partner.city,
        'latitude': partner.latitude,
        'longitude': partner.longitude,
        'image_url': partner.image_url,
        'address_street': partner.address_street,
        'address_number': partner.address_number,
        'address_postal_code': partner.address_postal_code,
        'address_city': partner.address_city,
        'address_country': partner.address_country,
        'phone': partner.phone,
        'website': partner.website,
        'opening_hours': partner.opening_hours,
        'status': partner.status,
        'warnings_count': partner.warnings_count,
        'suspension_reason': partner.suspension_reason,
        'admin_notes': partner.admin_notes,
        'validation_status': partner.validation_status,
        'validated_at': partner.validated_at.isoformat() if partner.validated_at else None,
        'offers': [{
            'id': o.id,
            'title': o.title,
            'description': o.description,
            'offer_type': o.offer_type,
            'discount_val': o.discount_val,
            'active': o.active,
            'conditions': o.conditions,
            'valid_from': o.valid_from.isoformat() if o.valid_from else None,
            'valid_until': o.valid_until.isoformat() if o.valid_until else None
        } for o in partner.offers],
        'feedbacks': [{
            'id': f.id,
            'rating': f.rating,
            'experience_type': f.experience_type,
            'comment': f.comment,
            'created_at': f.created_at.isoformat() if f.created_at else None
        } for f in partner.feedbacks[-10:]],  # 10 derniers feedbacks
        'warnings': [{
            'id': w.id,
            'warning_type': w.warning_type,
            'severity': w.severity,
            'reason': w.reason,
            'action_taken': w.action_taken,
            'created_at': w.created_at.isoformat() if w.created_at else None
        } for w in partner.warnings]
    })

@admin_bp.route('/partners/<int:partner_id>', methods=['PUT'])
@jwt_required()
def update_partner(partner_id):
    """Met à jour un commerçant"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    partner = Partner.query.get_or_404(partner_id)
    data = request.json
    
    # Mise à jour des champs
    if 'name' in data:
        partner.name = data['name']
    if 'category' in data:
        partner.category = data['category']
    if 'city' in data:
        partner.city = data['city']
    if 'address_street' in data:
        partner.address_street = data['address_street']
    if 'address_number' in data:
        partner.address_number = data['address_number']
    if 'address_postal_code' in data:
        partner.address_postal_code = data['address_postal_code']
    if 'address_city' in data:
        partner.address_city = data['address_city']
    if 'address_country' in data:
        partner.address_country = data['address_country']
    if 'phone' in data:
        partner.phone = data['phone']
    if 'website' in data:
        partner.website = data['website']
    if 'opening_hours' in data:
        partner.opening_hours = data['opening_hours']
    if 'admin_notes' in data:
        partner.admin_notes = data['admin_notes']
    if 'latitude' in data:
        partner.latitude = data['latitude']
    if 'longitude' in data:
        partner.longitude = data['longitude']
    
    partner.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Partner updated', 'id': partner.id})

@admin_bp.route('/partners/<int:partner_id>/validate', methods=['POST'])
@jwt_required()
def validate_partner(partner_id):
    """Valide un commerçant (draft -> published)"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    partner = Partner.query.get_or_404(partner_id)
    partner.validation_status = 'published'
    partner.validated_by = admin.id
    partner.validated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Partner validated'})

@admin_bp.route('/partners/<int:partner_id>/warn', methods=['POST'])
@jwt_required()
def warn_partner(partner_id):
    """Envoie un avertissement à un commerçant"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    partner = Partner.query.get_or_404(partner_id)
    data = request.json
    
    # Créer l'avertissement
    warning = PartnerWarning(
        partner_id=partner.id,
        admin_id=admin.id,
        warning_type=data.get('warning_type', 'other'),
        severity=data.get('severity', 'medium'),
        reason=data.get('reason', ''),
        action_taken='warning_sent'
    )
    db.session.add(warning)
    
    # Incrémenter le compteur
    partner.warnings_count += 1
    
    # Si 3+ avertissements, passer en statut "warned"
    if partner.warnings_count >= 3:
        partner.status = 'warned'
    
    db.session.commit()
    
    return jsonify({'message': 'Warning sent', 'warnings_count': partner.warnings_count})

@admin_bp.route('/partners/<int:partner_id>/suspend', methods=['POST'])
@jwt_required()
def suspend_partner(partner_id):
    """Suspend un commerçant"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    partner = Partner.query.get_or_404(partner_id)
    data = request.json
    
    partner.status = 'suspended'
    partner.suspension_reason = data.get('reason', '')
    
    # Créer l'avertissement de suspension
    warning = PartnerWarning(
        partner_id=partner.id,
        admin_id=admin.id,
        warning_type='rules_violation',
        severity='high',
        reason=data.get('reason', ''),
        action_taken='suspended_30days'
    )
    db.session.add(warning)
    db.session.commit()
    
    return jsonify({'message': 'Partner suspended'})

@admin_bp.route('/partners/<int:partner_id>/exclude', methods=['POST'])
@jwt_required()
def exclude_partner(partner_id):
    """Exclut définitivement un commerçant"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    partner = Partner.query.get_or_404(partner_id)
    data = request.json
    
    partner.status = 'excluded'
    partner.suspension_reason = data.get('reason', '')
    
    # Créer l'avertissement d'exclusion
    warning = PartnerWarning(
        partner_id=partner.id,
        admin_id=admin.id,
        warning_type='rules_violation',
        severity='exclusion',
        reason=data.get('reason', ''),
        action_taken='excluded'
    )
    db.session.add(warning)
    db.session.commit()
    
    return jsonify({'message': 'Partner excluded'})

# ========== GESTION PRIVILÈGES ==========

@admin_bp.route('/partners/<int:partner_id>/offers', methods=['POST'])
@jwt_required()
def create_offer(partner_id):
    """Crée un nouveau privilège pour un commerçant"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    partner = Partner.query.get_or_404(partner_id)
    data = request.json
    
    offer = Offer(
        partner_id=partner.id,
        title=data.get('title'),
        description=data.get('description'),
        offer_type=data.get('offer_type', 'permanent'),
        discount_val=data.get('discount_val'),
        conditions=data.get('conditions'),
        active=data.get('active', True),
        priority=data.get('priority', 0)
    )
    
    if data.get('valid_from'):
        offer.valid_from = datetime.fromisoformat(data['valid_from'])
    if data.get('valid_until'):
        offer.valid_until = datetime.fromisoformat(data['valid_until'])
    
    db.session.add(offer)
    db.session.commit()
    
    return jsonify({'message': 'Offer created', 'id': offer.id})

@admin_bp.route('/offers/<int:offer_id>', methods=['PUT'])
@jwt_required()
def update_offer(offer_id):
    """Met à jour un privilège"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    offer = Offer.query.get_or_404(offer_id)
    data = request.json
    
    if 'title' in data:
        offer.title = data['title']
    if 'description' in data:
        offer.description = data['description']
    if 'discount_val' in data:
        offer.discount_val = data['discount_val']
    if 'conditions' in data:
        offer.conditions = data['conditions']
    if 'active' in data:
        offer.active = data['active']
    if 'priority' in data:
        offer.priority = data['priority']
    
    offer.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Offer updated'})

@admin_bp.route('/offers/<int:offer_id>', methods=['DELETE'])
@jwt_required()
def delete_offer(offer_id):
    """Supprime un privilège"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    offer = Offer.query.get_or_404(offer_id)
    db.session.delete(offer)
    db.session.commit()
    
    return jsonify({'message': 'Offer deleted'})

# ========== SYSTÈME FEEDBACK MEMBRES ==========

@admin_bp.route('/feedbacks', methods=['GET'])
@jwt_required()
def list_feedbacks():
    """Liste tous les feedbacks avec filtres"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    # Filtres
    admin_viewed = request.args.get('admin_viewed')  # true/false
    experience_type = request.args.get('experience_type')
    partner_id = request.args.get('partner_id')
    
    query = PartnerFeedback.query
    
    if admin_viewed is not None:
        query = query.filter(PartnerFeedback.admin_viewed == (admin_viewed.lower() == 'true'))
    if experience_type:
        query = query.filter(PartnerFeedback.experience_type == experience_type)
    if partner_id:
        query = query.filter(PartnerFeedback.partner_id == int(partner_id))
    
    feedbacks = query.order_by(desc(PartnerFeedback.created_at)).limit(100).all()
    
    return jsonify({
        'feedbacks': [{
            'id': f.id,
            'member_id': f.member_id,
            'partner_id': f.partner_id,
            'partner_name': f.partner.name if f.partner else None,
            'rating': f.rating,
            'experience_type': f.experience_type,
            'comment': f.comment,
            'admin_viewed': f.admin_viewed,
            'admin_action_taken': f.admin_action_taken,
            'admin_notes': f.admin_notes,
            'created_at': f.created_at.isoformat() if f.created_at else None
        } for f in feedbacks]
    })

@admin_bp.route('/feedbacks/<int:feedback_id>/mark_viewed', methods=['POST'])
@jwt_required()
def mark_feedback_viewed(feedback_id):
    """Marque un feedback comme vu par l'admin"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    feedback = PartnerFeedback.query.get_or_404(feedback_id)
    feedback.admin_viewed = True
    db.session.commit()
    
    return jsonify({'message': 'Feedback marked as viewed'})

@admin_bp.route('/feedbacks/<int:feedback_id>/action', methods=['POST'])
@jwt_required()
def feedback_action(feedback_id):
    """Enregistre une action admin suite à un feedback"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    feedback = PartnerFeedback.query.get_or_404(feedback_id)
    data = request.json
    
    feedback.admin_action_taken = data.get('action')  # no_action, warning_sent, partner_contacted, excluded
    feedback.admin_notes = data.get('notes', '')
    feedback.admin_viewed = True
    db.session.commit()
    
    return jsonify({'message': 'Action recorded'})

# ========== SYSTÈME NOTIFICATIONS INTERNES ==========

@admin_bp.route('/notifications', methods=['POST'])
@jwt_required()
def create_notification():
    """Crée et envoie une notification interne"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    data = request.json
    
    notification = Notification(
        admin_id=admin.id,
        target_type=data.get('target_type'),  # individual, group, global
        target_role=data.get('target_role'),  # member, partner, all
        target_category=data.get('target_category'),
        target_city=data.get('target_city'),
        target_user_id=data.get('target_user_id'),
        title=data.get('title'),
        message=data.get('message'),
        action_url=data.get('action_url'),
        scheduled_for=datetime.fromisoformat(data['scheduled_for']) if data.get('scheduled_for') else None,
        sent_at=datetime.utcnow() if not data.get('scheduled_for') else None
    )
    
    # Déterminer les destinataires
    recipients = []
    if notification.target_type == 'individual':
        recipients = [User.query.get(notification.target_user_id)]
    elif notification.target_type == 'group':
        query = User.query
        if notification.target_role == 'member':
            query = query.filter(User.role == 'member')
        elif notification.target_role == 'partner':
            query = query.filter(User.role == 'partner')
        # TODO: Ajouter filtres par catégorie et ville
        recipients = query.all()
    elif notification.target_type == 'global':
        recipients = User.query.all()
    
    notification.recipients_count = len(recipients)
    db.session.add(notification)
    db.session.flush()
    
    # Créer les receipts
    for user in recipients:
        receipt = NotificationReceipt(
            notification_id=notification.id,
            user_id=user.id
        )
        db.session.add(receipt)
    
    db.session.commit()
    
    return jsonify({'message': 'Notification created', 'id': notification.id, 'recipients_count': len(recipients)})

@admin_bp.route('/notifications', methods=['GET'])
@jwt_required()
def list_notifications():
    """Liste toutes les notifications envoyées"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    notifications = Notification.query.order_by(desc(Notification.created_at)).limit(50).all()
    
    return jsonify({
        'notifications': [{
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'target_type': n.target_type,
            'target_role': n.target_role,
            'recipients_count': n.recipients_count,
            'read_count': n.read_count,
            'sent_at': n.sent_at.isoformat() if n.sent_at else None,
            'created_at': n.created_at.isoformat() if n.created_at else None
        } for n in notifications]
    })

# ========== SYSTÈME PARRAINAGE ADAPTATIF ==========

@admin_bp.route('/referrals', methods=['GET'])
@jwt_required()
def list_referrals():
    """Liste tous les parrainages"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    referrals = Referral.query.order_by(desc(Referral.created_at)).limit(100).all()
    
    return jsonify({
        'referrals': [{
            'id': r.id,
            'referrer_id': r.referrer_id,
            'referred_id': r.referred_id,
            'referrer_type': r.referrer_type,
            'referral_code': r.referral_code,
            'referred_email': r.referred_email,
            'status': r.status,
            'reward_type': r.reward_type,
            'reward_applied': r.reward_applied,
            'pack_category': r.pack_category,
            'access_count': r.access_count,
            'created_at': r.created_at.isoformat() if r.created_at else None,
            'completed_at': r.completed_at.isoformat() if r.completed_at else None
        } for r in referrals]
    })

@admin_bp.route('/referrals/<int:referral_id>/apply_reward', methods=['POST'])
@jwt_required()
def apply_referral_reward(referral_id):
    """Applique manuellement la récompense de parrainage"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    referral = Referral.query.get_or_404(referral_id)
    
    if referral.reward_applied:
        return jsonify({'error': 'Reward already applied'}), 400
    
    # TODO: Implémenter la logique d'application de récompense
    # (ajouter 1 mois gratuit, badge, etc.)
    
    referral.reward_applied = True
    referral.status = 'rewarded'
    db.session.commit()
    
    return jsonify({'message': 'Reward applied'})

# ========== STATISTIQUES ADMIN ==========

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def admin_stats():
    """Statistiques globales pour le dashboard admin"""
    admin = require_admin()
    if not admin:
        return jsonify({'error': 'Admin required'}), 403
    
    total_members = Member.query.count()
    active_members = Member.query.filter(Member.subscription_status == 'active').count()
    total_partners = Partner.query.count()
    active_partners = Partner.query.filter(Partner.status == 'active').count()
    warned_partners = Partner.query.filter(Partner.status == 'warned').count()
    pending_feedbacks = PartnerFeedback.query.filter(PartnerFeedback.admin_viewed == False).count()
    total_referrals = Referral.query.count()
    pending_referrals = Referral.query.filter(Referral.status == 'pending').count()
    
    return jsonify({
        'members': {
            'total': total_members,
            'active': active_members
        },
        'partners': {
            'total': total_partners,
            'active': active_partners,
            'warned': warned_partners
        },
        'feedbacks': {
            'pending': pending_feedbacks
        },
        'referrals': {
            'total': total_referrals,
            'pending': pending_referrals
        }
    })
