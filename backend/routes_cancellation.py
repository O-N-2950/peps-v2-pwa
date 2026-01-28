"""
Routes pour la résiliation d'abonnement membre et suppression de compte partenaire
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import stripe
import os

from app import db
from models import Member, Partner, Subscription

# Configuration Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

cancellation_bp = Blueprint('cancellation', __name__)


@cancellation_bp.route('/api/member/cancel-subscription', methods=['POST'])
@jwt_required()
def cancel_member_subscription():
    """
    Annuler l'abonnement d'un membre (résiliation à la prochaine échéance)
    """
    try:
        member_id = get_jwt_identity()
        
        # Récupérer le membre
        member = Member.query.get(member_id)
        if not member:
            return jsonify({'error': 'Membre non trouvé'}), 404
        
        # Récupérer l'abonnement actif
        subscription = Subscription.query.filter_by(
            member_id=member_id,
            status='active'
        ).first()
        
        if not subscription:
            return jsonify({'error': 'Aucun abonnement actif trouvé'}), 404
        
        # Annuler l'abonnement Stripe (à la fin de la période)
        if subscription.stripe_subscription_id:
            try:
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=True
                )
            except stripe.error.StripeError as e:
                return jsonify({'error': f'Erreur Stripe : {str(e)}'}), 500
        
        # Mettre à jour le statut dans la base de données
        subscription.status = 'canceling'
        subscription.canceled_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Votre abonnement sera résilié à la prochaine échéance',
            'current_period_end': subscription.current_period_end.isoformat() if subscription.current_period_end else None,
            'access_until': subscription.current_period_end.strftime('%d/%m/%Y') if subscription.current_period_end else 'Date inconnue'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur : {str(e)}'}), 500


@cancellation_bp.route('/api/member/reactivate-subscription', methods=['POST'])
@jwt_required()
def reactivate_member_subscription():
    """
    Réactiver un abonnement en cours de résiliation
    """
    try:
        member_id = get_jwt_identity()
        
        # Récupérer l'abonnement en cours de résiliation
        subscription = Subscription.query.filter_by(
            member_id=member_id,
            status='canceling'
        ).first()
        
        if not subscription:
            return jsonify({'error': 'Aucun abonnement en cours de résiliation'}), 404
        
        # Réactiver l'abonnement Stripe
        if subscription.stripe_subscription_id:
            try:
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=False
                )
            except stripe.error.StripeError as e:
                return jsonify({'error': f'Erreur Stripe : {str(e)}'}), 500
        
        # Mettre à jour le statut
        subscription.status = 'active'
        subscription.canceled_at = None
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Votre abonnement a été réactivé avec succès'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur : {str(e)}'}), 500


@cancellation_bp.route('/api/partner/delete-account', methods=['DELETE'])
@jwt_required()
def delete_partner_account():
    """
    Supprimer définitivement le compte d'un partenaire
    """
    try:
        partner_id = get_jwt_identity()
        
        # Récupérer le partenaire
        partner = Partner.query.get(partner_id)
        if not partner:
            return jsonify({'error': 'Partenaire non trouvé'}), 404
        
        # Vérifier le mot de passe de confirmation (optionnel)
        data = request.get_json()
        confirmation = data.get('confirmation', '')
        
        if confirmation.lower() != 'supprimer':
            return jsonify({'error': 'Confirmation incorrecte. Veuillez taper "SUPPRIMER"'}), 400
        
        # Supprimer le partenaire et toutes ses données associées
        # Les privilèges, horaires, etc. seront supprimés en cascade (si configuré dans models.py)
        db.session.delete(partner)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Votre compte partenaire a été supprimé définitivement'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur : {str(e)}'}), 500


@cancellation_bp.route('/api/member/subscription-status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """
    Récupérer le statut de l'abonnement d'un membre
    """
    try:
        member_id = get_jwt_identity()
        
        subscription = Subscription.query.filter_by(
            member_id=member_id
        ).order_by(Subscription.created_at.desc()).first()
        
        if not subscription:
            return jsonify({
                'has_subscription': False,
                'status': 'none'
            }), 200
        
        return jsonify({
            'has_subscription': True,
            'status': subscription.status,
            'current_period_end': subscription.current_period_end.isoformat() if subscription.current_period_end else None,
            'canceled_at': subscription.canceled_at.isoformat() if subscription.canceled_at else None,
            'is_canceling': subscription.status == 'canceling',
            'access_until': subscription.current_period_end.strftime('%d/%m/%Y') if subscription.current_period_end else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur serveur : {str(e)}'}), 500
