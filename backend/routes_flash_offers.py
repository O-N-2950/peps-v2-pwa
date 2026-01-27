"""
API Endpoints pour les offres flash avec validation IA
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from models import db, Partner
from datetime import datetime, timedelta
import re

flash_offers_bp = Blueprint('flash_offers', __name__)


@flash_offers_bp.route('/api/offers/flash', methods=['GET'])
def get_public_flash_offers():
    """
    Récupérer les offres flash disponibles (endpoint public)
    """
    try:
        # Récupérer toutes les offres flash actives et non expirées
        offers = db.session.execute(text("""
            SELECT 
                o.id,
                o.title,
                o.description,
                o.discount_val as discount_percentage,
                o.stock as total_slots,
                o.stock - COALESCE(reserved.count, 0) as available_slots,
                o.valid_from as start_time,
                o.valid_until as end_time,
                p.name as partner_name,
                p.city as partner_city,
                p.category as partner_category
            FROM offers o
            JOIN partners p ON o.partner_id = p.id
            LEFT JOIN (
                SELECT offer_id, COUNT(*) as count
                FROM flash_reservations
                WHERE status = 'reserved'
                GROUP BY offer_id
            ) reserved ON o.id = reserved.offer_id
            WHERE o.offer_type = 'flash'
            AND o.active = TRUE
            AND o.valid_until > NOW()
            AND o.stock > COALESCE(reserved.count, 0)
            ORDER BY o.valid_until ASC
        """)).fetchall()
        
        result = []
        for offer in offers:
            # Extraire le pourcentage de réduction
            discount_match = re.search(r'(\d+)', offer[3])
            discount_percentage = int(discount_match.group(1)) if discount_match else 0
            
            result.append({
                'id': offer[0],
                'title': offer[1],
                'description': offer[2],
                'discount_percentage': discount_percentage,
                'total_slots': offer[4],
                'available_slots': offer[5],
                'start_time': offer[6].isoformat() if offer[6] else None,
                'end_time': offer[7].isoformat() if offer[7] else None,
                'partner_name': offer[8],
                'partner_city': offer[9],
                'partner_category': offer[10]
            })
        
        return jsonify(result), 200
    
    except Exception as e:
        print(f"Erreur get_public_flash_offers: {str(e)}")
        return jsonify({'error': str(e)}), 500


def validate_flash_offer_value(partner_id, flash_value_str):
    """
    Valider qu'une offre flash est supérieure aux privilèges permanents existants
    Retourne (is_valid, message, suggested_min_value)
    """
    try:
        # Extraire la valeur numérique de l'offre flash (ex: "-20%" → 20)
        flash_match = re.search(r'(\d+)', flash_value_str)
        if not flash_match:
            return False, "Format de valeur invalide. Utilisez un format comme '-20%' ou '20% de réduction'", None
        
        flash_value = int(flash_match.group(1))
        
        # Récupérer tous les privilèges permanents du partenaire
        privileges = db.session.execute(text("""
            SELECT id, title, discount_val, description
            FROM offers
            WHERE partner_id = :partner_id 
            AND (is_permanent = TRUE OR is_permanent IS NULL)
            AND active = TRUE
        """), {"partner_id": partner_id}).fetchall()
        
        if not privileges:
            # Aucun privilège permanent, l'offre flash est valide
            return True, "Offre flash valide (aucun privilège permanent existant)", None
        
        # Extraire les valeurs des privilèges permanents
        max_privilege_value = 0
        conflicting_privilege = None
        
        for priv in privileges:
            priv_value_str = priv[2]  # discount_val column
            priv_match = re.search(r'(\d+)', priv_value_str)
            if priv_match:
                priv_value = int(priv_match.group(1))
                if priv_value > max_privilege_value:
                    max_privilege_value = priv_value
                    conflicting_privilege = priv
        
        # Vérifier que l'offre flash est supérieure
        if flash_value <= max_privilege_value:
            suggested_min = max_privilege_value + 5  # Suggérer au moins 5% de plus
            return False, f"❌ L'offre flash ({flash_value}%) doit être supérieure au privilège permanent '{conflicting_privilege[1]}' ({max_privilege_value}%). Minimum suggéré : {suggested_min}%", suggested_min
        
        return True, f"✅ Offre flash valide ! ({flash_value}% > {max_privilege_value}%)", None
        
    except Exception as e:
        return False, f"Erreur de validation : {str(e)}", None


@flash_offers_bp.route('/api/partner/offers/flash', methods=['POST'])
@jwt_required()
def create_flash_offer():
    """
    Créer une offre flash avec validation IA
    """
    try:
        user_id = get_jwt_identity()
        
        # Récupérer le partner_id
        partner = db.session.execute(text("""
            SELECT id FROM partners WHERE user_id = :user_id
        """), {"user_id": user_id}).fetchone()
        
        if not partner:
            return jsonify({"success": False, "error": "Partenaire non trouvé"}), 404
        
        partner_id = partner[0]
        
        data = request.get_json()
        title = data.get('title')
        value = data.get('value')
        description = data.get('description', '')
        total_stock = data.get('total_stock', 1)
        validity_hours = data.get('validity_hours', 24)
        
        if not title or not value:
            return jsonify({"success": False, "error": "Titre et valeur requis"}), 400
        
        # VALIDATION IA : Vérifier que l'offre flash est supérieure aux privilèges permanents
        is_valid, message, suggested_min = validate_flash_offer_value(partner_id, value)
        
        if not is_valid:
            return jsonify({
                "success": False,
                "error": message,
                "suggested_min_value": suggested_min
            }), 400
        
        # Calculer les dates de validité
        validity_start = datetime.utcnow()
        validity_end = validity_start + timedelta(hours=validity_hours)
        
        # Créer l'offre flash
        result = db.session.execute(text("""
            INSERT INTO offers (
                partner_id, title, discount_val, description, 
                offer_type, stock, active, is_permanent,
                valid_from, valid_until, created_at
            )
            VALUES (
                :partner_id, :title, :discount_val, :description,
                'flash', :stock, TRUE, FALSE,
                :valid_from, :valid_until, NOW()
            )
            RETURNING id
        """), {
            "partner_id": partner_id,
            "title": title,
            "discount_val": value,
            "description": description,
            "stock": total_stock,
            "valid_from": validity_start,
            "valid_until": validity_end
        })
        
        offer_id = result.fetchone()[0]
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Offre flash créée avec succès ! " + message,
            "offer_id": offer_id,
            "validity_start": validity_start.isoformat(),
            "validity_end": validity_end.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@flash_offers_bp.route('/api/member/offers/flash', methods=['GET'])
@jwt_required()
def get_available_flash_offers():
    """
    Récupérer les offres flash disponibles pour un membre
    Basé sur les favoris + proximité géographique
    """
    try:
        user_id = get_jwt_identity()
        
        # Récupérer le member_id et sa position
        member = db.session.execute(text("""
            SELECT id, latitude, longitude FROM members WHERE user_id = :user_id
        """), {"user_id": user_id}).fetchone()
        
        if not member:
            return jsonify({"success": False, "error": "Membre non trouvé"}), 404
        
        member_id = member[0]
        member_lat = member[1]
        member_lon = member[2]
        
        # Récupérer les IDs des partenaires favoris
        favorites = db.session.execute(text("""
            SELECT partner_id FROM member_favorites WHERE member_id = :member_id
        """), {"member_id": member_id}).fetchall()
        
        favorite_ids = [f[0] for f in favorites] if favorites else []
        
        # Récupérer les offres flash disponibles
        # Critères : (Partenaire en favori OU dans un rayon de 10km) ET stock > 0 ET pas encore expiré
        query = """
            SELECT 
                o.id, o.title, o.discount_val, o.description,
                o.stock, o.stock as current_stock, o.valid_from, o.valid_until,
                p.id as partner_id, p.name as partner_name, p.city, p.category,
                p.latitude, p.longitude
            FROM offers o
            JOIN partners p ON o.partner_id = p.id
            WHERE o.offer_type = 'flash'
            AND o.active = TRUE
            AND o.stock > 0
            AND o.valid_until > NOW()
        """
        
        # Filtrer par favoris OU proximité
        if favorite_ids:
            query += f" AND (o.partner_id IN ({','.join(map(str, favorite_ids))})"
            if member_lat and member_lon:
                # Formule de distance approximative (1 degré ≈ 111 km)
                query += f" OR (p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND "
                query += f"SQRT(POW((p.latitude - {member_lat}) * 111, 2) + POW((p.longitude - {member_lon}) * 111 * COS(RADIANS({member_lat})), 2)) < 10))"
            else:
                query += ")"
        elif member_lat and member_lon:
            query += f" AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND "
            query += f"SQRT(POW((p.latitude - {member_lat}) * 111, 2) + POW((p.longitude - {member_lon}) * 111 * COS(RADIANS({member_lat})), 2)) < 10"
        
        query += " ORDER BY o.validity_end ASC"
        
        result = db.session.execute(text(query)).fetchall()
        
        offers = []
        for row in result:
            offers.append({
                "id": row[0],
                "title": row[1],
                "value": row[2],
                "description": row[3],
                "total_stock": row[4],
                "current_stock": row[5],
                "validity_start": row[6].isoformat() if row[6] else None,
                "validity_end": row[7].isoformat() if row[7] else None,
                "partner": {
                    "id": row[8],
                    "name": row[9],
                    "city": row[10],
                    "category": row[11],
                    "latitude": float(row[12]) if row[12] else None,
                    "longitude": float(row[13]) if row[13] else None
                }
            })
        
        return jsonify({
            "success": True,
            "offers": offers,
            "count": len(offers)
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@flash_offers_bp.route('/api/member/offers/flash/<int:offer_id>/reserve', methods=['POST'])
@jwt_required()
def reserve_flash_offer(offer_id):
    """
    Réserver une offre flash (gestion atomique du stock)
    """
    try:
        user_id = get_jwt_identity()
        
        # Récupérer le member_id
        member = db.session.execute(text("""
            SELECT id, first_name, last_name FROM members WHERE user_id = :user_id
        """), {"user_id": user_id}).fetchone()
        
        if not member:
            return jsonify({"success": False, "error": "Membre non trouvé"}), 404
        
        member_id = member[0]
        member_name = f"{member[1]} {member[2]}"
        
        # Vérifier que l'offre existe et est disponible (AVEC LOCK FOR UPDATE pour éviter les race conditions)
        offer = db.session.execute(text("""
            SELECT id, partner_id, title, discount_val, stock, valid_until
            FROM offers
            WHERE id = :offer_id
            AND offer_type = 'flash'
            AND active = TRUE
            AND stock > 0
            AND valid_until > NOW()
            FOR UPDATE
        """), {"offer_id": offer_id}).fetchone()
        
        if not offer:
            return jsonify({
                "success": False,
                "error": "Offre flash non disponible (stock épuisé ou expirée)"
            }), 404
        
        partner_id = offer[1]
        offer_title = offer[2]
        offer_value = offer[3]
        
        # Vérifier que le membre n'a pas déjà réservé cette offre
        existing = db.session.execute(text("""
            SELECT id FROM flash_reservations
            WHERE member_id = :member_id AND offer_id = :offer_id AND status != 'cancelled'
        """), {"member_id": member_id, "offer_id": offer_id}).fetchone()
        
        if existing:
            return jsonify({
                "success": False,
                "error": "Vous avez déjà réservé cette offre flash"
            }), 400
        
        # Décrémenter le stock de manière atomique
        db.session.execute(text("""
            UPDATE offers
            SET stock = stock - 1
            WHERE id = :offer_id
        """), {"offer_id": offer_id})
        
        # Créer la réservation flash
        result = db.session.execute(text("""
            INSERT INTO flash_reservations (
                member_id, partner_id, offer_id, status, created_at
            )
            VALUES (
                :member_id, :partner_id, :offer_id, 'confirmed', NOW()
            )
            RETURNING id
        """), {
            "member_id": member_id,
            "partner_id": partner_id,
            "offer_id": offer_id
        })
        
        reservation_id = result.fetchone()[0]
        db.session.commit()
        
        # TODO: Envoyer une notification au partenaire
        
        return jsonify({
            "success": True,
            "message": f"Offre flash '{offer_title}' réservée avec succès !",
            "reservation_id": reservation_id,
            "offer": {
                "title": offer_title,
                "value": offer_value
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@flash_offers_bp.route('/api/partner/flash-reservations/<int:reservation_id>/validate', methods=['POST'])
@jwt_required()
def validate_flash_reservation(reservation_id):
    """
    Valider qu'un membre a bien utilisé son offre flash
    """
    try:
        user_id = get_jwt_identity()
        
        # Récupérer le partner_id
        partner = db.session.execute(text("""
            SELECT id FROM partners WHERE user_id = :user_id
        """), {"user_id": user_id}).fetchone()
        
        if not partner:
            return jsonify({"success": False, "error": "Partenaire non trouvé"}), 404
        
        partner_id = partner[0]
        
        # Vérifier que la réservation appartient à ce partenaire
        reservation = db.session.execute(text("""
            SELECT id, member_id, offer_id, status
            FROM flash_reservations
            WHERE id = :reservation_id AND partner_id = :partner_id
        """), {"reservation_id": reservation_id, "partner_id": partner_id}).fetchone()
        
        if not reservation:
            return jsonify({"success": False, "error": "Réservation non trouvée"}), 404
        
        if reservation[3] == 'used':
            return jsonify({"success": False, "error": "Cette réservation a déjà été utilisée"}), 400
        
        # Marquer la réservation comme utilisée
        db.session.execute(text("""
            UPDATE flash_reservations
            SET status = 'used', used_at = NOW(), updated_at = NOW()
            WHERE id = :reservation_id
        """), {"reservation_id": reservation_id})
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Réservation validée avec succès !"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@flash_offers_bp.route('/api/partner/offers/flash', methods=['GET'])
@jwt_required()
def get_partner_flash_offers():
    """
    Récupérer toutes les offres flash d'un partenaire
    """
    try:
        user_id = get_jwt_identity()
        
        # Récupérer le partner_id
        partner = db.session.execute(text("""
            SELECT id FROM partners WHERE user_id = :user_id
        """), {"user_id": user_id}).fetchone()
        
        if not partner:
            return jsonify({"success": False, "error": "Partenaire non trouvé"}), 404
        
        partner_id = partner[0]
        
        # Récupérer les offres flash avec le nombre de réservations
        result = db.session.execute(text("""
            SELECT 
                o.id, o.title, o.discount_val, o.description,
                o.stock, o.stock as current_stock, o.valid_from, o.valid_until, o.active,
                COUNT(fr.id) as reservations_count
            FROM offers o
            LEFT JOIN flash_reservations fr ON o.id = fr.offer_id AND fr.status != 'cancelled'
            WHERE o.partner_id = :partner_id AND o.offer_type = 'flash'
            GROUP BY o.id
            ORDER BY o.created_at DESC
        """), {"partner_id": partner_id}).fetchall()
        
        offers = []
        for row in result:
            offers.append({
                "id": row[0],
                "title": row[1],
                "value": row[2],
                "description": row[3],
                "total_stock": row[4],
                "current_stock": row[5],
                "validity_start": row[6].isoformat() if row[6] else None,
                "validity_end": row[7].isoformat() if row[7] else None,
                "status": row[8],
                "reservations_count": row[9]
            })
        
        return jsonify({
            "success": True,
            "offers": offers,
            "count": len(offers)
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
