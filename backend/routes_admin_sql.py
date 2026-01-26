"""
Route admin pour exécuter du SQL custom (DEBUG ONLY)
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from models import db
from sqlalchemy import text

admin_sql_bp = Blueprint('admin_sql', __name__)

@admin_sql_bp.route('/api/admin/execute-sql', methods=['POST'])
@jwt_required()
def execute_sql():
    """Exécuter du SQL custom (ADMIN ONLY)"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        sql = request.json.get('sql')
        if not sql:
            return jsonify({'error': 'SQL required'}), 400
        
        result = db.session.execute(text(sql))
        db.session.commit()
        
        # Essayer de récupérer les résultats
        try:
            rows = result.fetchall()
            return jsonify({
                'success': True,
                'rows': [dict(row._mapping) for row in rows]
            }), 200
        except:
            return jsonify({
                'success': True,
                'message': 'SQL exécuté avec succès'
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
