"""
API Endpoints pour le système de favoris
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from models import db, Member, Partner
from datetime import datetime

favorites_bp = Blueprint('favorites', __name__)

@favorites_bp.route('/api/member/favorites', methods=['GET'])
@jwt_required()
def get_member_favorites():
    """
    Récupérer la liste des partenaires favoris d'un membre
    """
    try:
        member_id = get_jwt_identity()
        
        # Récupérer les favoris avec les informations des partenaires
        result = db.session.execute(text("""
            SELECT 
                p.id, p.name, p.category, p.city, p.address, 
                p.phone, p.website, p.latitude, p.longitude,
                mf.created_at as favorited_at
            FROM member_favorites mf
            JOIN partners p ON mf.partner_id = p.id
            WHERE mf.member_id = :member_id
            ORDER BY mf.created_at DESC
        """), {"member_id": member_id}).fetchall()
        
        favorites = []
        for row in result:
            favorites.append({
                "id": row[0],
                "name": row[1],
                "category": row[2],
                "city": row[3],
                "address": row[4],
                "phone": row[5],
                "website": row[6],
                "latitude": float(row[7]) if row[7] else None,
                "longitude": float(row[8]) if row[8] else None,
                "favorited_at": row[9].isoformat() if row[9] else None
            })
        
        return jsonify({
            "success": True,
            "favorites": favorites,
            "count": len(favorites)
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@favorites_bp.route('/api/member/favorites/<int:partner_id>', methods=['POST'])
@jwt_required()
def add_favorite(partner_id):
    """
    Ajouter un partenaire aux favoris
    """
    try:
        member_id = get_jwt_identity()
        
        # Vérifier que le partenaire existe
        partner = Partner.query.get(partner_id)
        if not partner:
            return jsonify({"success": False, "error": "Partenaire non trouvé"}), 404
        
        # Vérifier si déjà en favori
        existing = db.session.execute(text("""
            SELECT id FROM member_favorites 
            WHERE member_id = :member_id AND partner_id = :partner_id
        """), {"member_id": member_id, "partner_id": partner_id}).fetchone()
        
        if existing:
            return jsonify({
                "success": False,
                "error": "Ce partenaire est déjà dans vos favoris"
            }), 400
        
        # Ajouter aux favoris
        db.session.execute(text("""
            INSERT INTO member_favorites (member_id, partner_id, created_at)
            VALUES (:member_id, :partner_id, NOW())
        """), {"member_id": member_id, "partner_id": partner_id})
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"{partner.name} ajouté à vos favoris",
            "partner_id": partner_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@favorites_bp.route('/api/member/favorites/<int:partner_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(partner_id):
    """
    Retirer un partenaire des favoris
    """
    try:
        member_id = get_jwt_identity()
        
        # Supprimer des favoris
        result = db.session.execute(text("""
            DELETE FROM member_favorites 
            WHERE member_id = :member_id AND partner_id = :partner_id
            RETURNING id
        """), {"member_id": member_id, "partner_id": partner_id})
        
        db.session.commit()
        
        if result.rowcount == 0:
            return jsonify({
                "success": False,
                "error": "Ce partenaire n'est pas dans vos favoris"
            }), 404
        
        return jsonify({
            "success": True,
            "message": "Partenaire retiré de vos favoris",
            "partner_id": partner_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@favorites_bp.route('/api/member/favorites/<int:partner_id>/check', methods=['GET'])
@jwt_required()
def check_favorite(partner_id):
    """
    Vérifier si un partenaire est dans les favoris
    """
    try:
        member_id = get_jwt_identity()
        
        result = db.session.execute(text("""
            SELECT id FROM member_favorites 
            WHERE member_id = :member_id AND partner_id = :partner_id
        """), {"member_id": member_id, "partner_id": partner_id}).fetchone()
        
        return jsonify({
            "success": True,
            "is_favorite": result is not None,
            "partner_id": partner_id
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@favorites_bp.route('/api/partner/<int:partner_id>/favorites/count', methods=['GET'])
def get_partner_favorites_count(partner_id):
    """
    Obtenir le nombre de membres qui ont mis ce partenaire en favori
    """
    try:
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM member_favorites 
            WHERE partner_id = :partner_id
        """), {"partner_id": partner_id}).fetchone()
        
        count = result[0] if result else 0
        
        return jsonify({
            "success": True,
            "partner_id": partner_id,
            "favorites_count": count
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
