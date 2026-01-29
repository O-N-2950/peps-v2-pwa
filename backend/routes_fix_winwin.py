"""
Route API temporaire pour transformer WIN WIN Finance Group en partenaire
À SUPPRIMER après utilisation
"""
from flask import Blueprint, jsonify
from models import db, User, Partner

fix_winwin_bp = Blueprint('fix_winwin', __name__)

@fix_winwin_bp.route('/api/fix-winwin-partner', methods=['POST'])
def fix_winwin_partner():
    """
    Route temporaire pour créer le profil partenaire de WIN WIN Finance Group
    """
    try:
        # Trouver l'utilisateur
        user = User.query.filter_by(email='contact@winwin.swiss').first()
        
        if not user:
            return jsonify({'error': 'Utilisateur contact@winwin.swiss non trouvé'}), 404
        
        # Vérifier s'il a déjà un profil partenaire
        existing_partner = Partner.query.filter_by(user_id=user.id).first()
        
        if existing_partner:
            # Mettre à jour le rôle et activer
            user.role = 'partner'
            existing_partner.status = 'active'
            db.session.commit()
            
            return jsonify({
                'message': 'Partenaire existant mis à jour',
                'user_id': user.id,
                'partner_id': existing_partner.id,
                'role': user.role,
                'status': existing_partner.status
            })
        
        # Créer un nouveau partenaire
        new_partner = Partner(
            user_id=user.id,
            business_name='WIN WIN Finance Group',
            category='Services Financiers',
            description='Groupe financier spécialisé dans le conseil et la gestion de patrimoine',
            address='Rue du Rhône 100, 1204 Genève, Suisse',
            phone='+41 22 123 45 67',
            email='contact@winwin.swiss',
            status='active',
            latitude=46.2044,
            longitude=6.1432
        )
        db.session.add(new_partner)
        
        # Mettre à jour le rôle
        user.role = 'partner'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Partenaire créé avec succès',
            'user_id': user.id,
            'partner_id': new_partner.id,
            'role': user.role,
            'status': new_partner.status
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
