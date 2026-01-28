"""
Routes AI Coach - Chatbot Pepi pour PEP's
"""

import os
import sys
import google.generativeai as genai
from flask import Blueprint, request, jsonify
from models import Partner, db
import time

# ============================================
# CONFIGURATION
# ============================================

ai_coach_bp = Blueprint('ai_coach', __name__)

# Variables globales (initialisées au premier appel)
_model = None
_pepi_prompt = None
_initialized = False

# ============================================
# FONCTION D'INITIALISATION
# ============================================

def initialize_gemini():
    """
    Initialise Gemini au premier appel (lazy initialization)
    Cette fonction est appelée par l'endpoint /chat
    """
    global _model, _pepi_prompt, _initialized
    
    if _initialized:
        return True
    
    try:
        # === LOG SYSTÈME ===
        print("\n" + "="*60, file=sys.stderr)
        print("[AI_COACH] 🚀 INITIALISATION GEMINI", file=sys.stderr)
        print("="*60, file=sys.stderr)
        
        # === 1. VÉRIFIER CLÉ API ===
        GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
        
        if not GOOGLE_API_KEY:
            print("[AI_COACH] ❌ ERREUR CRITIQUE: GOOGLE_API_KEY manquante", file=sys.stderr)
            return False
        
        print(f"[AI_COACH] ✅ Clé Google API: {GOOGLE_API_KEY[:15]}...", file=sys.stderr)
        
        # Configurer Gemini
        genai.configure(api_key=GOOGLE_API_KEY)
        print("[AI_COACH] ✅ Gemini configuré", file=sys.stderr)
        
        # === 2. CHARGER LE PROMPT ===
        # Chemin absolu depuis la racine du projet
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        PROMPT_PATH = os.path.join(BASE_DIR, "PEPI_PROMPT.md")
        
        print(f"[AI_COACH] 📂 Chemin prompt: {PROMPT_PATH}", file=sys.stderr)
        print(f"[AI_COACH] 📂 Répertoire courant: {os.getcwd()}", file=sys.stderr)
        print(f"[AI_COACH] 📂 __file__: {__file__}", file=sys.stderr)
        
        # Vérifier existence
        if os.path.exists(PROMPT_PATH):
            print(f"[AI_COACH] ✅ Fichier prompt trouvé", file=sys.stderr)
            with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
                _pepi_prompt = f.read()
            print(f"[AI_COACH] ✅ Prompt chargé: {len(_pepi_prompt)} caractères", file=sys.stderr)
        else:
            # Fallback
            print(f"[AI_COACH] ⚠️ FICHIER INTROUVABLE: {PROMPT_PATH}", file=sys.stderr)
            
            # Lister les fichiers du répertoire pour déboguer
            print(f"[AI_COACH] 📁 Contenu de {BASE_DIR}:", file=sys.stderr)
            try:
                for item in os.listdir(BASE_DIR):
                    print(f"   - {item}", file=sys.stderr)
            except Exception as e:
                print(f"[AI_COACH] ❌ Impossible de lister: {e}", file=sys.stderr)
            
            # Utiliser prompt par défaut
            _pepi_prompt = """Tu es Pepi, l'assistant virtuel intelligent de PEP's (Privilèges Économiques et Partenariats).

PEP's est une plateforme suisse qui connecte des membres avec des commerçants partenaires offrant des privilèges exclusifs.

Ton rôle :
- Répondre aux questions sur PEP's
- Aider à trouver des partenaires par catégorie ou localisation
- Conseiller les commerçants sur les privilèges attractifs
- Être chaleureux, professionnel et précis

Réponds toujours en français de Suisse."""
            print(f"[AI_COACH] ⚠️ Utilisation du prompt par défaut: {len(_pepi_prompt)} caractères", file=sys.stderr)
        
        # === 3. CONFIGURATION MODÈLE ===
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        # === 4. INITIALISER MODÈLE ===
        print("[AI_COACH] 🔧 Initialisation du modèle Gemini...", file=sys.stderr)
        
        _model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
            safety_settings=safety_settings,
            system_instruction=_pepi_prompt
        )
        
        print("[AI_COACH] ✅ Modèle Gemini initialisé: gemini-2.0-flash", file=sys.stderr)
        
        # === 5. TEST RAPIDE ===
        print("[AI_COACH] 🧪 Test du modèle...", file=sys.stderr)
        test_chat = _model.start_chat(history=[])
        test_response = test_chat.send_message("Réponds juste 'OK'")
        print(f"[AI_COACH] ✅ Test réussi: {test_response.text.strip()}", file=sys.stderr)
        
        _initialized = True
        print("="*60 + "\n", file=sys.stderr)
        
        return True
        
    except Exception as e:
        print(f"\n[AI_COACH] ❌ ERREUR INITIALISATION", file=sys.stderr)
        print(f"[AI_COACH] Type: {type(e).__name__}", file=sys.stderr)
        print(f"[AI_COACH] Message: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        print("="*60 + "\n", file=sys.stderr)
        return False


# ============================================
# ENDPOINTS
# ============================================

@ai_coach_bp.route('/health', methods=['GET'])
def health():
    """Endpoint de santé"""
    # Force l'initialisation si pas encore fait
    if not _initialized:
        success = initialize_gemini()
        if not success:
            return jsonify({
                'status': 'error',
                'initialized': False,
                'message': 'Échec initialisation Gemini'
            }), 500
    
    return jsonify({
        'status': 'ok',
        'initialized': _initialized,
        'model_ready': _model is not None,
        'prompt_length': len(_pepi_prompt) if _pepi_prompt else 0
    }), 200


@ai_coach_bp.route('/chat', methods=['POST'])
def chat():
    """
    Endpoint de chat avec Pepi
    """
    try:
        # === INITIALISATION LAZY ===
        if not _initialized:
            print("[CHAT] Initialisation Gemini...", file=sys.stderr)
            success = initialize_gemini()
            if not success:
                return jsonify({
                    'error': 'Service IA temporairement indisponible'
                }), 500
        
        # === RÉCUPÉRATION MESSAGE ===
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        print(f"\n[CHAT] Message reçu: {user_message[:100]}...", file=sys.stderr)
        
        if not user_message:
            return jsonify({'error': 'Message vide'}), 400
        
        # === RECHERCHE PARTENAIRES (RAG) ===
        partners_context = ""
        partners = []
        keywords = [
            'partenaire', 'commerçant', 'commerce', 'restaurant', 'café',
            'coiffeur', 'hôtel', 'fitness', 'cinéma', 'boulangerie',
            'pharmacie', 'garage', 'beauté', 'bijoutier', 'fleuriste',
            'trouver', 'cherche', 'où', 'localisation'
        ]
        
        should_search = any(keyword in user_message.lower() for keyword in keywords)
        
        if should_search:
            print(f"[CHAT] 🔍 Recherche partenaires...", file=sys.stderr)
            
            search_term = user_message.lower()
            partners = Partner.query.filter(
                db.or_(
                    Partner.business_name.ilike(f'%{search_term}%'),
                    Partner.description.ilike(f'%{search_term}%'),
                    Partner.category.ilike(f'%{search_term}%'),
                    Partner.city.ilike(f'%{search_term}%')
                )
            ).filter_by(is_active=True).limit(10).all()
            
            print(f"[CHAT] Partenaires trouvés: {len(partners)}", file=sys.stderr)
            
            if partners:
                partners_context = f"\n\n📋 PARTENAIRES DISPONIBLES ({len(partners)}) :\n"
                for idx, p in enumerate(partners, 1):
                    partners_context += f"\n{idx}. **{p.business_name}**\n"
                    partners_context += f"   Catégorie: {p.category}\n"
                    if p.city:
                        partners_context += f"   Ville: {p.city}\n"
                    if p.description:
                        partners_context += f"   {p.description[:100]}...\n"
        
        # === APPEL GEMINI ===
        full_message = user_message + partners_context
        
        print(f"[CHAT] ⏳ Appel Gemini ({len(full_message)} caractères)...", file=sys.stderr)
        start_time = time.time()
        
        chat_session = _model.start_chat(history=[])
        response = chat_session.send_message(full_message)
        
        elapsed = time.time() - start_time
        print(f"[CHAT] ✅ Réponse reçue en {elapsed:.2f}s", file=sys.stderr)
        print(f"[CHAT] Réponse: {response.text[:100]}...\n", file=sys.stderr)
        
        return jsonify({
            'response': response.text,
            'partners_found': len(partners) if should_search and partners else 0
        }), 200
        
    except Exception as e:
        print(f"\n[CHAT] ❌ ERREUR", file=sys.stderr)
        print(f"[CHAT] Type: {type(e).__name__}", file=sys.stderr)
        print(f"[CHAT] Message: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        
        return jsonify({
            'error': 'Désolé, je n\'ai pas pu traiter ta demande. Réessaie dans un instant.'
        }), 500
