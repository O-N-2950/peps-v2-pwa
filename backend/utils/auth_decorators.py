"""
Décorateurs d'authentification et d'autorisation
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models import User, Partner, Member

def roles_required(required_roles):
    """
    Décorateur pour vérifier la présence d'un ou plusieurs rôles dans le JWT
    
    Usage:
        @roles_required(['partner'])
        def my_route():
            ...
    """
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            user_roles = set(claims.get('roles', []))
            
            # Fallback: si 'roles' n'existe pas, utiliser 'role'
            if not user_roles:
                single_role = claims.get('role')
                if single_role:
                    user_roles = {single_role}
            
            # Vérifier si l'utilisateur a au moins un des rôles requis
            if not user_roles.intersection(set(required_roles)):
                return jsonify({
                    'error': 'unauthorized_role',
                    'message': f'Accès refusé. Rôles requis: {", ".join(required_roles)}',
                    'required_roles': required_roles,
                    'user_roles': list(user_roles)
                }), 403
            
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def partner_required(fn):
    """
    Décorateur pour vérifier que l'utilisateur a un profil partenaire
    Retourne un message personnalisé si l'utilisateur est membre mais pas partenaire
    """
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_roles = claims.get('roles', [])
        
        # Cas 1 : L'utilisateur n'a pas le rôle 'partner'
        if 'partner' not in user_roles:
            # Vérifier s'il est membre
            is_member = 'member' in user_roles
            
            return jsonify({
                'error': 'not_partner',
                'message': 'Tu n\'es pas encore commerçant partenaire PEP\'s 🏪',
                'description': 'Souhaites-tu créer un compte partenaire gratuit pour ton commerce, association ou entreprise ?',
                'action': 'register_partner',
                'redirect_url': '/partner/register',
                'is_member': is_member
            }), 403
        
        # Cas 2 : L'utilisateur a le rôle mais pas le profil (rare)
        partner = Partner.query.filter_by(user_id=int(user_id)).first()
        if not partner:
            return jsonify({
                'error': 'no_partner_profile',
                'message': 'Ton profil partenaire est en cours de création',
                'action': 'complete_profile',
                'redirect_url': '/partner/complete-profile'
            }), 403
        
        return fn(*args, **kwargs)
    return decorator

def member_required(fn):
    """
    Décorateur pour vérifier que l'utilisateur a un profil membre
    Retourne un message personnalisé si l'utilisateur est partenaire mais pas membre
    """
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_roles = claims.get('roles', [])
        
        # Cas 1 : L'utilisateur n'a pas le rôle 'member'
        if 'member' not in user_roles:
            # Vérifier s'il est partenaire
            is_partner = 'partner' in user_roles
            
            return jsonify({
                'error': 'not_member',
                'message': 'Tu n\'es pas encore inscrit comme membre PEP\'s 🎁',
                'description': 'Souhaites-tu rejoindre PEP\'s en tant que membre pour profiter des privilèges exclusifs ?',
                'action': 'register_member',
                'redirect_url': '/member/register',
                'is_partner': is_partner
            }), 403
        
        # Cas 2 : L'utilisateur a le rôle mais pas le profil (rare)
        member = Member.query.filter_by(user_id=int(user_id)).first()
        if not member:
            return jsonify({
                'error': 'no_member_profile',
                'message': 'Ton profil membre est en cours de création',
                'action': 'complete_profile',
                'redirect_url': '/member/complete-profile'
            }), 403
        
        return fn(*args, **kwargs)
    return decorator
