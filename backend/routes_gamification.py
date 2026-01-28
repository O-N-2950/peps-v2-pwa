"""
Routes pour le système de gamification des membres PEP's
"""
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import os

gamification_bp = Blueprint('gamification', __name__)

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

# Calcul du grade selon le nombre d'activations
def calculate_grade(activations_count):
    if activations_count >= 100:
        return {'name': 'Diamant', 'emoji': '💎', 'color': '#60A5FA'}
    elif activations_count >= 50:
        return {'name': 'Or', 'emoji': '🥇', 'color': '#FBBF24'}
    elif activations_count >= 20:
        return {'name': 'Argent', 'emoji': '🥈', 'color': '#9CA3AF'}
    else:
        return {'name': 'Bronze', 'emoji': '🥉', 'color': '#D97706'}

# Calcul des points PEP's
def calculate_points(activations_count, flash_offers_used, referrals):
    points = 0
    points += activations_count * 10  # 10 points par activation
    points += flash_offers_used * 20  # 20 points par offre flash
    points += referrals * 50  # 50 points par parrainage
    return points

@gamification_bp.route('/api/member/profile', methods=['GET'])
def get_member_profile():
    """Récupère le profil complet du membre avec gamification"""
    try:
        # Récupérer l'ID du membre depuis le token JWT (à implémenter)
        # Pour l'instant, on utilise un ID de test
        member_id = request.args.get('member_id', 1)
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Récupérer les informations du membre
        cur.execute("""
            SELECT u.id, u.email, u.created_at
            FROM users u
            WHERE u.id = %s AND u.role = 'member'
        """, (member_id,))
        member = cur.fetchone()
        
        if not member:
            return jsonify({'success': False, 'error': 'Membre non trouvé'}), 404
        
        # Compter le nombre d'activations de privilèges
        cur.execute("""
            SELECT COUNT(*) as count
            FROM offer_activations
            WHERE user_id = %s
        """, (member_id,))
        activations = cur.fetchone()
        activations_count = activations['count'] if activations else 0
        
        # Compter le nombre d'offres flash utilisées
        cur.execute("""
            SELECT COUNT(*) as count
            FROM flash_offer_bookings
            WHERE user_id = %s AND status = 'confirmed'
        """, (member_id,))
        flash_offers = cur.fetchone()
        flash_offers_count = flash_offers['count'] if flash_offers else 0
        
        # Compter le nombre de parrainages (à implémenter dans la DB)
        referrals_count = 0
        
        # Calculer le grade et les points
        grade = calculate_grade(activations_count)
        points = calculate_points(activations_count, flash_offers_count, referrals_count)
        
        # Calculer les économies totales
        cur.execute("""
            SELECT COALESCE(SUM(o.discount_amount), 0) as total_savings
            FROM offer_activations oa
            JOIN offers o ON oa.offer_id = o.id
            WHERE oa.user_id = %s
        """, (member_id,))
        savings = cur.fetchone()
        total_savings = float(savings['total_savings']) if savings else 0
        
        # Récupérer les partenaires favoris
        cur.execute("""
            SELECT p.id, p.name, p.category, p.city
            FROM favorites f
            JOIN partners p ON f.partner_id = p.id
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
            LIMIT 5
        """, (member_id,))
        favorites = cur.fetchall()
        
        # Calculer le streak (jours consécutifs d'utilisation)
        cur.execute("""
            SELECT DATE(created_at) as activation_date
            FROM offer_activations
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 30
        """, (member_id,))
        activation_dates = cur.fetchall()
        
        streak = 0
        if activation_dates:
            current_date = datetime.now().date()
            for i, row in enumerate(activation_dates):
                expected_date = current_date - timedelta(days=i)
                if row['activation_date'] == expected_date:
                    streak += 1
                else:
                    break
        
        # Récupérer les badges (liste statique pour l'instant)
        badges = [
            {'id': 1, 'name': 'Premier Pas', 'description': 'Première activation', 'unlocked': activations_count >= 1},
            {'id': 2, 'name': 'Explorateur', 'description': '5 partenaires différents', 'unlocked': False},
            {'id': 3, 'name': 'Flash Master', 'description': '10 offres flash', 'unlocked': flash_offers_count >= 10},
            {'id': 4, 'name': 'Fidèle', 'description': '7 jours consécutifs', 'unlocked': streak >= 7},
            {'id': 5, 'name': 'Économe', 'description': '500 CHF économisés', 'unlocked': total_savings >= 500},
        ]
        
        unlocked_badges = [b for b in badges if b['unlocked']]
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'profile': {
                'id': member['id'],
                'email': member['email'],
                'member_since': member['created_at'].isoformat() if member['created_at'] else None,
                'grade': grade,
                'points': points,
                'activations_count': activations_count,
                'flash_offers_count': flash_offers_count,
                'referrals_count': referrals_count,
                'total_savings': total_savings,
                'streak': streak,
                'favorites': [dict(f) for f in favorites],
                'badges': badges,
                'unlocked_badges_count': len(unlocked_badges)
            }
        })
        
    except Exception as e:
        print(f"Erreur get_member_profile: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@gamification_bp.route('/api/member/stats', methods=['GET'])
def get_member_stats():
    """Récupère les statistiques détaillées du membre"""
    try:
        member_id = request.args.get('member_id', 1)
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Statistiques par catégorie de partenaire
        cur.execute("""
            SELECT p.category, COUNT(*) as count
            FROM offer_activations oa
            JOIN offers o ON oa.offer_id = o.id
            JOIN partners p ON o.partner_id = p.id
            WHERE oa.user_id = %s
            GROUP BY p.category
            ORDER BY count DESC
            LIMIT 5
        """, (member_id,))
        by_category = cur.fetchall()
        
        # Activations des 7 derniers jours
        cur.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM offer_activations
            WHERE user_id = %s
              AND created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        """, (member_id,))
        last_7_days = cur.fetchall()
        
        # Top 5 partenaires les plus visités
        cur.execute("""
            SELECT p.name, COUNT(*) as visits
            FROM offer_activations oa
            JOIN offers o ON oa.offer_id = o.id
            JOIN partners p ON o.partner_id = p.id
            WHERE oa.user_id = %s
            GROUP BY p.id, p.name
            ORDER BY visits DESC
            LIMIT 5
        """, (member_id,))
        top_partners = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'by_category': [dict(c) for c in by_category],
                'last_7_days': [{'date': row['date'].isoformat(), 'count': row['count']} for row in last_7_days],
                'top_partners': [dict(p) for p in top_partners]
            }
        })
        
    except Exception as e:
        print(f"Erreur get_member_stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@gamification_bp.route('/api/member/challenges', methods=['GET'])
def get_member_challenges():
    """Récupère les défis hebdomadaires du membre"""
    try:
        member_id = request.args.get('member_id', 1)
        
        # Défis hebdomadaires (statiques pour l'instant)
        challenges = [
            {
                'id': 1,
                'title': 'Découvreur',
                'description': 'Visiter 3 nouveaux partenaires',
                'progress': 1,
                'target': 3,
                'reward': 50,
                'completed': False
            },
            {
                'id': 2,
                'title': 'Flash Hunter',
                'description': 'Réserver 2 offres flash',
                'progress': 0,
                'target': 2,
                'reward': 30,
                'completed': False
            },
            {
                'id': 3,
                'title': 'Social',
                'description': 'Parrainer 1 ami',
                'progress': 0,
                'target': 1,
                'reward': 100,
                'completed': False
            }
        ]
        
        return jsonify({
            'success': True,
            'challenges': challenges
        })
        
    except Exception as e:
        print(f"Erreur get_member_challenges: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@gamification_bp.route('/api/member/leaderboard', methods=['GET'])
def get_leaderboard():
    """Récupère le classement des membres"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Top 10 membres par nombre d'activations
        cur.execute("""
            SELECT u.id, u.email, COUNT(oa.id) as activations
            FROM users u
            LEFT JOIN offer_activations oa ON u.id = oa.user_id
            WHERE u.role = 'member'
            GROUP BY u.id, u.email
            ORDER BY activations DESC
            LIMIT 10
        """)
        leaderboard = cur.fetchall()
        
        # Ajouter le grade pour chaque membre
        leaderboard_with_grades = []
        for member in leaderboard:
            grade = calculate_grade(member['activations'])
            leaderboard_with_grades.append({
                'id': member['id'],
                'email': member['email'],
                'activations': member['activations'],
                'grade': grade
            })
        
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard_with_grades
        })
        
    except Exception as e:
        print(f"Erreur get_leaderboard: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
