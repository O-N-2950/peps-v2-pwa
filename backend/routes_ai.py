"""
Routes Flask pour les services IA (Gemini 2.5 Flash)
"""

from flask import Blueprint, request, jsonify
from ai_service import categorize_partner_activity

# Créer le blueprint
ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')


@ai_bp.route('/health', methods=['GET'])
def health_check():
    """Health check de l'API IA"""
    return jsonify({
        "status": "online",
        "service": "Gemini 2.5 Flash",
        "endpoints": ["/api/ai/categorize", "/api/ai/health"]
    }), 200


@ai_bp.route('/categorize', methods=['POST'])
def categorize():
    """
    Endpoint de catégorisation automatique des partenaires
    
    Body JSON:
    {
        "description_activite": "string"
    }
    
    Response:
    {
        "categorie_suggeree": "string",
        "statut": "EXISTANTE" | "NOUVELLE_CREATION",
        "justification": "string",
        "success": bool
    }
    """
    try:
        # Récupérer les données
        data = request.get_json()
        
        if not data or 'description_activite' not in data:
            return jsonify({
                "success": False,
                "error": "Le champ 'description_activite' est requis"
            }), 400
        
        description = data['description_activite'].strip()
        
        if not description:
            return jsonify({
                "success": False,
                "error": "La description ne peut pas être vide"
            }), 400
        
        # Appeler le service IA
        result = categorize_partner_activity(description)
        
        # Retourner le résultat
        if result.get('success'):
            return jsonify(result), 200
        else:
            # Erreur IA mais fallback fourni
            return jsonify(result), 200
    
    except Exception as e:
        # Erreur serveur
        print(f"[ROUTES_AI] Erreur endpoint /categorize: {e}")
        return jsonify({
            "success": False,
            "error": f"Erreur serveur: {str(e)}",
            "categorie_suggeree": "Autres Services",
            "statut": "EXISTANTE",
            "justification": "Erreur de catégorisation automatique"
        }), 500
