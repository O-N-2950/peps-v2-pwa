"""
Routes de debug pour les partenaires
"""
from flask import Blueprint, jsonify
from sqlalchemy import text
from werkzeug.security import generate_password_hash
from models import db

debug_partners_bp = Blueprint('debug_partners', __name__)

@debug_partners_bp.route('/api/create-test-partner-winwin')
def create_test_partner_winwin():
    """
    Créer/réinitialiser le compte partenaire WIN WIN Finance Group
    Email: contact@winwin.swiss
    Password: Cristal4you11++
    """
    try:
        # 1. Trouver le partner_id de WIN WIN Finance Group
        partner = db.session.execute(text("""
            SELECT id, name FROM partners WHERE name LIKE '%WIN WIN%'
        """)).fetchone()
        
        if not partner:
            return jsonify({
                "success": False,
                "error": "Partenaire WIN WIN Finance Group introuvable"
            }), 404
        
        partner_id = partner[0]
        partner_name = partner[1]
        
        # 2. Vérifier si un user existe déjà avec cet email
        existing_user = db.session.execute(text("""
            SELECT id FROM users WHERE email = 'contact@winwin.swiss'
        """)).fetchone()
        
        if existing_user:
            user_id = existing_user[0]
            # Mettre à jour le mot de passe
            hashed_password = generate_password_hash('Cristal4you11++')
            db.session.execute(text("""
                UPDATE users 
                SET password = :password, role = 'partner'
                WHERE id = :user_id
            """), {"password": hashed_password, "user_id": user_id})
            
            # Mettre à jour le partner.user_id
            db.session.execute(text("""
                UPDATE partners
                SET user_id = :user_id
                WHERE id = :partner_id
            """), {"user_id": user_id, "partner_id": partner_id})
            
            db.session.commit()
            
            return jsonify({
                "success": True,
                "message": "Compte partenaire mis à jour",
                "partner_id": partner_id,
                "partner_name": partner_name,
                "user_id": user_id,
                "email": "contact@winwin.swiss"
            }), 200
        
        else:
            # Créer un nouveau user
            hashed_password = generate_password_hash('Cristal4you11++')
            result = db.session.execute(text("""
                INSERT INTO users (email, password, role)
                VALUES ('contact@winwin.swiss', :password, 'partner')
                RETURNING id
            """), {"password": hashed_password})
            
            user_id = result.fetchone()[0]
            
            # Lier le partner au user
            db.session.execute(text("""
                UPDATE partners
                SET user_id = :user_id
                WHERE id = :partner_id
            """), {"user_id": user_id, "partner_id": partner_id})
            
            db.session.commit()
            
            return jsonify({
                "success": True,
                "message": "Compte partenaire créé avec succès",
                "partner_id": partner_id,
                "partner_name": partner_name,
                "user_id": user_id,
                "email": "contact@winwin.swiss"
            }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@debug_partners_bp.route('/api/reset-winwin-password')
def reset_winwin_password():
    """
    Réinitialiser uniquement le mot de passe de contact@winwin.swiss
    """
    try:
        hashed_password = generate_password_hash('Cristal4you11++')
        result = db.session.execute(text("""
            UPDATE users 
            SET password = :password
            WHERE email = 'contact@winwin.swiss'
            RETURNING id, email, role
        """), {"password": hashed_password})
        
        user = result.fetchone()
        
        if not user:
            return jsonify({
                "success": False,
                "error": "Utilisateur contact@winwin.swiss introuvable"
            }), 404
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Mot de passe réinitialisé avec succès",
            "user_id": user[0],
            "email": user[1],
            "role": user[2]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
