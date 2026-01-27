"""
Routes de debug pour les membres
"""
from flask import Blueprint, jsonify
from sqlalchemy import text
from models import db

debug_members_bp = Blueprint('debug_members', __name__)

@debug_members_bp.route('/api/debug/members')
def debug_members():
    """Voir tous les membres"""
    try:
        result = db.session.execute(text("""
            SELECT m.id, m.user_id, m.first_name, m.last_name, u.email
            FROM members m
            LEFT JOIN users u ON m.user_id = u.id
            ORDER BY m.id
        """)).fetchall()
        
        members = []
        for row in result:
            members.append({
                "member_id": row[0],
                "user_id": row[1],
                "first_name": row[2],
                "last_name": row[3],
                "email": row[4]
            })
        
        return jsonify({
            "success": True,
            "count": len(members),
            "members": members
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@debug_members_bp.route('/api/debug/users')
def debug_users():
    """Voir tous les users"""
    try:
        result = db.session.execute(text("""
            SELECT id, email, role
            FROM users
            ORDER BY id
        """)).fetchall()
        
        users = []
        for row in result:
            users.append({
                "user_id": row[0],
                "email": row[1],
                "role": row[2]
            })
        
        return jsonify({
            "success": True,
            "count": len(users),
            "users": users
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@debug_members_bp.route('/api/debug/create-member-force')
def create_member_force():
    """Forcer la création du membre pour user_id 7"""
    try:
        # Supprimer si existe
        db.session.execute(text("DELETE FROM members WHERE user_id = 7"))
        
        # Créer
        db.session.execute(text("""
            INSERT INTO members (user_id, first_name, last_name, phone, address, zip_code, city, dob, created_at)
            VALUES (7, 'Olivier', 'Neukomm', '079 579 25 00', 'Bellevue 7', '2950', 'Courgenay', '1980-01-01', NOW())
        """))
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Membre créé avec succès"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
