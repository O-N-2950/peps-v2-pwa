"""
Routes API pour l'IA Coach Gemini Flash

Fournit des suggestions intelligentes pour aider les partenaires à améliorer leur business
"""

from flask import Blueprint, request, jsonify
from models import Partner, db
import os
import google.generativeai as genai
import time

ai_coach_bp = Blueprint('ai_coach', __name__)

# ============================================
# CONFIGURATION GEMINI
# ============================================

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

if not GOOGLE_API_KEY:
    print("[AI_COACH] ⚠️ ERREUR CRITIQUE: GOOGLE_API_KEY manquante !")
    print("[AI_COACH] Ajoutez-la sur Railway : Variables → GOOGLE_API_KEY=AIzaSy...")
    print("[AI_COACH] Obtenez votre clé sur : https://aistudio.google.com/apikey")
else:
    print(f"[AI_COACH] ✅ Clé Google API configurée (commence par {GOOGLE_API_KEY[:10]}...)")
    genai.configure(api_key=GOOGLE_API_KEY)

# ============================================
# CHARGEMENT DU PROMPT SYSTÈME
# ============================================

DEFAULT_PROMPT = """Tu es Pepi, l'assistant virtuel intelligent de PEP's (Privilèges Économiques et Partenariats).

PEP's est une plateforme suisse qui connecte des membres avec des commerçants partenaires offrant des privilèges exclusifs.

Ton rôle :
- Répondre aux questions sur PEP's
- Aider à trouver des partenaires par catégorie ou localisation
- Conseiller les commerçants partenaires sur les privilèges attractifs
- Être chaleureux, professionnel et précis

Réponds toujours en français de Suisse."""

# Priorité 1 : Variable d'environnement Railway
PEPI_SYSTEM_PROMPT = os.environ.get('PEPI_SYSTEM_PROMPT')

if PEPI_SYSTEM_PROMPT:
    print(f"[AI_COACH] ✅ Prompt Pepi chargé depuis variable d'environnement ({len(PEPI_SYSTEM_PROMPT)} caractères)")
else:
    # Priorité 2 : Fichier local (développement)
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    PEPI_PROMPT_PATH = os.path.join(BASE_DIR, 'PEPI_PROMPT.md')
    try:
        with open(PEPI_PROMPT_PATH, 'r', encoding='utf-8') as f:
            PEPI_SYSTEM_PROMPT = f.read()
        print(f"[AI_COACH] ✅ Prompt Pepi chargé depuis fichier: {PEPI_PROMPT_PATH} ({len(PEPI_SYSTEM_PROMPT)} caractères)")
    except Exception as e:
        print(f"[AI_COACH] ⚠️ Fichier prompt introuvable, utilisation du fallback: {e}")
        PEPI_SYSTEM_PROMPT = DEFAULT_PROMPT

# Validation
if len(PEPI_SYSTEM_PROMPT) < 100:
    print(f"[AI_COACH] ⚠️ WARNING: PEPI_SYSTEM_PROMPT semble incomplet ({len(PEPI_SYSTEM_PROMPT)} caractères)")
else:
    print(f"[AI_COACH] ✅ Prompt système validé : {len(PEPI_SYSTEM_PROMPT)} caractères")

# ============================================
# CONFIGURATION MODÈLE GEMINI
# ============================================

generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 2048,
}

safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE"
    },
]

# Initialisation du modèle
try:
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",  # Modèle stable recommandé
        generation_config=generation_config,
        safety_settings=safety_settings,
        system_instruction=PEPI_SYSTEM_PROMPT
    )
    print(f"[AI_COACH] ✅ Modèle Gemini initialisé : gemini-1.5-flash")
except Exception as e:
    print(f"[AI_COACH] ❌ Erreur initialisation modèle Gemini: {e}")
    model = None

# ============================================
# ENDPOINT CHAT
# ============================================

@ai_coach_bp.route('/chat', methods=['POST'])
def chat():
    """
    Endpoint de chat avec Pepi (Gemini Flash)
    """
    try:
        # === VALIDATION ===
        if not GOOGLE_API_KEY:
            return jsonify({
                'error': 'Configuration serveur manquante',
                'details': 'GOOGLE_API_KEY non configurée'
            }), 500
        
        if not model:
            return jsonify({
                'error': 'Modèle Gemini non initialisé'
            }), 500
        
        # === LOGS DE DÉMARRAGE ===
        print(f"\n{'='*60}")
        print(f"[CHAT] 🚀 Nouvelle requête chat")
        print(f"[CHAT] Prompt système : {len(PEPI_SYSTEM_PROMPT)} caractères")
        
        data = request.get_json()
        user_message = data.get('message', '').strip()
        print(f"[CHAT] Message utilisateur : {user_message[:100]}...")
        
        if not user_message:
            return jsonify({'error': 'Message vide'}), 400
        
        # === RECHERCHE PARTENAIRES (RAG) ===
        partners_context = ""
        keywords = [
            'partenaire', 'commerçant', 'commerce', 'boutique', 'magasin',
            'assurance', 'restaurant', 'café', 'bar', 'coiffeur', 'salon',
            'hôtel', 'hébergement', 'fitness', 'sport', 'gym', 'cinéma',
            'boulangerie', 'pâtisserie', 'pharmacie', 'médical', 'santé',
            'garage', 'mécanique', 'beauté', 'esthétique', 'massage',
            'bijoutier', 'bijoux', 'fleuriste', 'fleur', 'traiteur',
            'nettoyage', 'pressing', 'librairie', 'livre', 'optique',
            'lunettes', 'vétérinaire', 'animal', 'trouver', 'cherche'
        ]
        
        should_search = any(keyword in user_message.lower() for keyword in keywords)
        
        # Extraction de la ville si mentionnée
        city_filter = None
        cities_swiss = ['lausanne', 'genève', 'geneva', 'bern', 'berne', 'zurich', 
                        'neuchâtel', 'fribourg', 'sion', 'yverdon', 'montreux', 
                        'vevey', 'nyon', 'morges', 'renens']
        for city in cities_swiss:
            if city in user_message.lower():
                city_filter = city
                break
        
        if should_search:
            print(f"[CHAT] 🔍 Recherche partenaires déclenchée")
            if city_filter:
                print(f"[CHAT] 📍 Filtre ville : {city_filter}")
            
            search_term = user_message.lower()
            
            # Construction requête SQL optimisée
            query = Partner.query.filter_by(is_active=True)
            
            # Filtre par ville si détecté
            if city_filter:
                query = query.filter(Partner.city.ilike(f'%{city_filter}%'))
            
            # Recherche full-text
            partners = query.filter(
                db.or_(
                    Partner.business_name.ilike(f'%{search_term}%'),
                    Partner.description.ilike(f'%{search_term}%'),
                    Partner.category.ilike(f'%{search_term}%'),
                    Partner.city.ilike(f'%{search_term}%'),
                    Partner.address.ilike(f'%{search_term}%')
                )
            ).limit(10).all()
            
            print(f"[CHAT] Partenaires trouvés : {len(partners)}")
            
            if partners:
                partners_context = f"\n\n📋 CONTEXTE PARTENAIRES DISPONIBLES ({len(partners)}) :\n"
                for idx, p in enumerate(partners, 1):
                    partners_context += f"\n{idx}. **{p.business_name}**\n"
                    partners_context += f"   Catégorie : {p.category}\n"
                    if p.description:
                        desc = p.description[:150] + "..." if len(p.description) > 150 else p.description
                        partners_context += f"   Description : {desc}\n"
                    if p.city:
                        partners_context += f"   📍 Ville : {p.city}\n"
                    if p.address:
                        partners_context += f"   Adresse : {p.address}\n"
                    if p.postal_code:
                        partners_context += f"   CP : {p.postal_code}\n"
                
                partners_context += "\n💡 Utilise ces informations pour répondre précisément à l'utilisateur.\n"
        
        # === CONSTRUCTION MESSAGE COMPLET ===
        full_message = user_message
        if partners_context:
            full_message += partners_context
        
        print(f"[CHAT] Message complet : {len(full_message)} caractères")
        print(f"[CHAT] ⏳ Appel Gemini en cours...")
        
        # === APPEL GEMINI ===
        start_time = time.time()
        
        chat = model.start_chat(history=[])
        response = chat.send_message(full_message)
        
        elapsed = time.time() - start_time
        print(f"[CHAT] ✅ Réponse Gemini reçue en {elapsed:.2f}s")
        
        assistant_response = response.text
        print(f"[CHAT] Réponse : {assistant_response[:150]}...")
        print(f"{'='*60}\n")
        
        return jsonify({
            'response': assistant_response,
            'partners_found': len(partners) if should_search and partners else 0
        }), 200
        
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"[CHAT] ❌ ERREUR CRITIQUE")
        print(f"[CHAT] Type: {type(e).__name__}")
        print(f"[CHAT] Message: {str(e)}")
        print(f"[CHAT] Traceback complet:")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        
        # Message d'erreur user-friendly
        error_message = "Désolé, je n'ai pas pu traiter ta demande. Réessaie dans un instant."
        
        # Messages spécifiques selon l'erreur
        if "API key" in str(e):
            error_message = "Problème de configuration API. Contacte l'administrateur."
        elif "quota" in str(e).lower():
            error_message = "Service temporairement indisponible (quota dépassé)."
        elif "timeout" in str(e).lower():
            error_message = "Délai dépassé, réessaie dans quelques secondes."
        
        return jsonify({
            'error': error_message
        }), 500

# ============================================
# ENDPOINT HEALTH CHECK
# ============================================

@ai_coach_bp.route('/health', methods=['GET'])
def health():
    """Vérification santé du service AI"""
    return jsonify({
        'status': 'ok',
        'gemini_configured': GOOGLE_API_KEY is not None,
        'model_initialized': model is not None,
        'prompt_length': len(PEPI_SYSTEM_PROMPT)
    }), 200

