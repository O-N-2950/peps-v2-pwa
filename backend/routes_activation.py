"""
Routes pour le système de tracking des activations de privilèges
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Member, Partner, Offer, Subscription
from models_activation import PrivilegeActivation
from datetime import datetime, timedelta
import secrets
import string

activation_bp = Blueprint('activation', __name__)

def generate_validation_code():
    """Génère un code de validation unique (8 caractères alphanumériques)"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

@activation_bp.route('/api/member/check-subscription', methods=['GET'])
@jwt_required()
def check_subscription():
    """
    Vérifie si l'abonnement du membre est actif
    Retourne le statut et les informations de renouvellement si expiré
    """
    try:
        user_id = get_jwt_identity()
        member = Member.query.filter_by(user_id=user_id).first()
        
        if not member:
            return jsonify({'error': 'Membre non trouvé'}), 404
        
        # Vérifier si l'abonnement est actif via la table subscriptions
        subscription = Subscription.query.filter_by(
            member_id=member.id
        ).order_by(Subscription.created_at.desc()).first()
        
        if not subscription or subscription.status != 'active':
            return jsonify({
                'active': False,
                'status': 'expired' if subscription else 'no_subscription',
                'message': 'Votre abonnement a expiré' if subscription else 'Aucun abonnement actif',
                'renewal_required': True
            }), 200
        
        # Vérifier la date d'expiration
        if subscription.current_period_end and subscription.current_period_end < datetime.utcnow():
            return jsonify({
                'active': False,
                'status': 'expired',
                'expired_at': subscription.current_period_end.isoformat(),
                'message': 'Votre abonnement a expiré',
                'renewal_required': True
            }), 200
        
        return jsonify({
            'active': True,
            'status': 'active',
            'expires_at': subscription.current_period_end.isoformat() if subscription.current_period_end else None,
            'pack_id': subscription.pack_id,
            'currency': subscription.currency
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@activation_bp.route('/api/member/activate-privilege', methods=['POST'])
@jwt_required()
def activate_privilege():
    """
    Active un privilège pour un membre
    Vérifie l'abonnement, crée l'activation et retourne le code de validation
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validation des données
        if not data or 'offer_id' not in data:
            return jsonify({'error': 'offer_id requis'}), 400
        
        offer_id = data['offer_id']
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        device_info = data.get('device_info')
        
        # Récupérer le membre
        member = Member.query.filter_by(user_id=user_id).first()
        if not member:
            return jsonify({'error': 'Membre non trouvé'}), 404
        
        # Vérifier l'abonnement
        subscription = Subscription.query.filter_by(
            member_id=member.id,
            status='active'
        ).first()
        
        if not subscription or (subscription.current_period_end and subscription.current_period_end < datetime.utcnow()):
            return jsonify({
                'error': 'Abonnement expiré',
                'renewal_required': True,
                'message': 'Veuillez renouveler votre abonnement pour activer ce privilège'
            }), 403
        
        # Récupérer l'offre
        offer = Offer.query.get(offer_id)
        if not offer:
            return jsonify({'error': 'Offre non trouvée'}), 404
        
        if not offer.active:
            return jsonify({'error': 'Cette offre n\'est plus active'}), 400
        
        # Vérifier si le membre a déjà une activation active pour ce commerce
        existing_activation = PrivilegeActivation.query.filter_by(
            member_id=member.id,
            partner_id=offer.partner_id,
            status='active'
        ).filter(
            PrivilegeActivation.expires_at > datetime.utcnow()
        ).first()
        
        if existing_activation:
            return jsonify({
                'error': 'Vous avez déjà une activation en cours pour ce commerce',
                'activation': existing_activation.to_dict()
            }), 400
        
        # Créer l'activation
        validation_code = generate_validation_code()
        activation = PrivilegeActivation(
            member_id=member.id,
            partner_id=offer.partner_id,
            offer_id=offer.id,
            activated_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=2),
            validation_code=validation_code,
            status='active',
            latitude=latitude,
            longitude=longitude,
            device_info=device_info
        )
        
        db.session.add(activation)
        db.session.commit()
        
        # Récupérer les informations du partenaire et de l'offre
        partner = Partner.query.get(offer.partner_id)
        
        return jsonify({
            'success': True,
            'message': 'Privilège activé avec succès',
            'activation': {
                'id': activation.id,
                'validation_code': validation_code,
                'activated_at': activation.activated_at.isoformat(),
                'expires_at': activation.expires_at.isoformat(),
                'status': activation.status,
                'partner': {
                    'id': partner.id,
                    'name': partner.name,
                    'category': partner.category
                },
                'offer': {
                    'id': offer.id,
                    'title': offer.title,
                    'discount_val': offer.discount_val
                },
                'member': {
                    'id': member.id,
                    'first_name': member.first_name
                }
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@activation_bp.route('/api/member/submit-feedback', methods=['POST'])
@jwt_required()
def submit_feedback():
    """
    Soumet un feedback pour une activation de privilège
    Récompense le membre avec +10 points PEP's
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validation des données
        if not data or 'activation_id' not in data or 'rating' not in data:
            return jsonify({'error': 'activation_id et rating requis'}), 400
        
        activation_id = data['activation_id']
        rating = data['rating']
        comment = data.get('comment', '')
        
        # Valider le rating
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'Le rating doit être entre 1 et 5'}), 400
        
        # Récupérer le membre
        member = Member.query.filter_by(user_id=user_id).first()
        if not member:
            return jsonify({'error': 'Membre non trouvé'}), 404
        
        # Récupérer l'activation
        activation = PrivilegeActivation.query.get(activation_id)
        if not activation:
            return jsonify({'error': 'Activation non trouvée'}), 404
        
        # Vérifier que l'activation appartient au membre
        if activation.member_id != member.id:
            return jsonify({'error': 'Cette activation ne vous appartient pas'}), 403
        
        # Vérifier que le feedback n'a pas déjà été soumis
        if activation.feedback_rating:
            return jsonify({'error': 'Vous avez déjà soumis un feedback pour cette activation'}), 400
        
        # Enregistrer le feedback
        activation.feedback_rating = rating
        activation.feedback_comment = comment
        activation.feedback_submitted_at = datetime.utcnow()
        activation.feedback_points_awarded = 10  # +10 points PEP's
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Merci pour votre feedback ! +10 points PEP\'s',
            'points_awarded': 10,
            'feedback': {
                'rating': rating,
                'comment': comment,
                'submitted_at': activation.feedback_submitted_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@activation_bp.route('/api/member/activations', methods=['GET'])
@jwt_required()
def get_member_activations():
    """
    Récupère l'historique des activations du membre
    """
    try:
        user_id = get_jwt_identity()
        member = Member.query.filter_by(user_id=user_id).first()
        
        if not member:
            return jsonify({'error': 'Membre non trouvé'}), 404
        
        # Récupérer les activations
        activations = PrivilegeActivation.query.filter_by(
            member_id=member.id
        ).order_by(
            PrivilegeActivation.activated_at.desc()
        ).limit(50).all()
        
        # Enrichir avec les informations des partenaires et offres
        result = []
        for activation in activations:
            partner = Partner.query.get(activation.partner_id)
            offer = Offer.query.get(activation.offer_id)
            
            result.append({
                'id': activation.id,
                'activated_at': activation.activated_at.isoformat(),
                'expires_at': activation.expires_at.isoformat(),
                'status': activation.status,
                'validation_code': activation.validation_code,
                'feedback_rating': activation.feedback_rating,
                'feedback_comment': activation.feedback_comment,
                'partner': {
                    'id': partner.id,
                    'name': partner.name,
                    'category': partner.category,
                    'city': partner.city
                } if partner else None,
                'offer': {
                    'id': offer.id,
                    'title': offer.title,
                    'discount_val': offer.discount_val
                } if offer else None
            })
        
        return jsonify({
            'activations': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@activation_bp.route('/api/admin/activations', methods=['GET'])
@jwt_required()
def get_all_activations():
    """
    [ADMIN] Récupère toutes les activations avec filtres
    """
    try:
        # TODO: Vérifier que l'utilisateur est admin
        
        # Paramètres de filtrage
        partner_id = request.args.get('partner_id', type=int)
        member_id = request.args.get('member_id', type=int)
        status = request.args.get('status')
        limit = request.args.get('limit', 100, type=int)
        
        # Construire la requête
        query = PrivilegeActivation.query
        
        if partner_id:
            query = query.filter_by(partner_id=partner_id)
        if member_id:
            query = query.filter_by(member_id=member_id)
        if status:
            query = query.filter_by(status=status)
        
        activations = query.order_by(
            PrivilegeActivation.activated_at.desc()
        ).limit(limit).all()
        
        # Enrichir avec les informations
        result = []
        for activation in activations:
            member = Member.query.get(activation.member_id)
            partner = Partner.query.get(activation.partner_id)
            offer = Offer.query.get(activation.offer_id)
            
            result.append({
                'id': activation.id,
                'activated_at': activation.activated_at.isoformat(),
                'expires_at': activation.expires_at.isoformat(),
                'status': activation.status,
                'validation_code': activation.validation_code,
                'feedback_rating': activation.feedback_rating,
                'feedback_comment': activation.feedback_comment,
                'feedback_submitted_at': activation.feedback_submitted_at.isoformat() if activation.feedback_submitted_at else None,
                'member': {
                    'id': member.id,
                    'first_name': member.first_name
                } if member else None,
                'partner': {
                    'id': partner.id,
                    'name': partner.name,
                    'category': partner.category,
                    'city': partner.city
                } if partner else None,
                'offer': {
                    'id': offer.id,
                    'title': offer.title,
                    'discount_val': offer.discount_val
                } if offer else None
            })
        
        return jsonify({
            'activations': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@activation_bp.route('/api/admin/partner-ratings', methods=['GET'])
@jwt_required()
def get_partner_ratings():
    """
    [ADMIN] Récupère les notes et statistiques de tous les partenaires
    """
    try:
        # TODO: Vérifier que l'utilisateur est admin
        
        # Récupérer tous les partenaires avec leurs statistiques
        partners = Partner.query.filter_by(status='active').all()
        
        result = []
        for partner in partners:
            # Compter les activations
            total_activations = PrivilegeActivation.query.filter_by(
                partner_id=partner.id
            ).count()
            
            # Calculer la note moyenne
            activations_with_feedback = PrivilegeActivation.query.filter(
                PrivilegeActivation.partner_id == partner.id,
                PrivilegeActivation.feedback_rating.isnot(None)
            ).all()
            
            feedback_count = len(activations_with_feedback)
            average_rating = 0
            if feedback_count > 0:
                total_rating = sum(a.feedback_rating for a in activations_with_feedback)
                average_rating = round(total_rating / feedback_count, 2)
            
            # Compter les feedbacks négatifs (1-2 étoiles)
            negative_feedback_count = sum(1 for a in activations_with_feedback if a.feedback_rating <= 2)
            
            result.append({
                'partner_id': partner.id,
                'partner_name': partner.name,
                'category': partner.category,
                'city': partner.city,
                'total_activations': total_activations,
                'feedback_count': feedback_count,
                'average_rating': average_rating,
                'negative_feedback_count': negative_feedback_count,
                'warnings_count': partner.warnings_count,
                'status': partner.status
            })
        
        # Trier par note moyenne décroissante
        result.sort(key=lambda x: x['average_rating'], reverse=True)
        
        return jsonify({
            'partners': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
