"""
Routes API pour l'IA Coach Gemini Flash
Fournit des suggestions intelligentes pour aider les partenaires à améliorer leur business
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Partner, Offer, PrivilegeUsage
from datetime import datetime, timedelta
import os
import json
import time

# ============================================
# CONFIGURATION GEMINI (Google SDK)
# ============================================

try:
    import google.generativeai as genai
    GEMINI_SDK_AVAILABLE = True
except ImportError:
    GEMINI_SDK_AVAILABLE = False
    print("[AI_COACH] ⚠️ google-generativeai non installé. Exécutez: pip install google-generativeai")

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

if not GOOGLE_API_KEY:
    print("[AI_COACH] ⚠️ ERREUR CRITIQUE: GOOGLE_API_KEY manquante !")
    print("[AI_COACH] Ajoutez-la sur Railway : Variables → GOOGLE_API_KEY=AIzaSy...")
    print("[AI_COACH] Obtenez votre clé sur : https://aistudio.google.com/apikey")
else:
    print(f"[AI_COACH] ✅ Clé Google API configurée (commence par {GOOGLE_API_KEY[:10]}...)")
    if GEMINI_SDK_AVAILABLE:
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
model = None
if GEMINI_SDK_AVAILABLE and GOOGLE_API_KEY:
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",  # Version stable recommandée
            generation_config=generation_config,
            safety_settings=safety_settings,
            system_instruction=PEPI_SYSTEM_PROMPT
        )
        print(f"[AI_COACH] ✅ Modèle Gemini initialisé : gemini-2.0-flash-exp")
    except Exception as e:
        print(f"[AI_COACH] ❌ Erreur initialisation modèle Gemini: {e}")
        model = None
else:
    print(f"[AI_COACH] ❌ Modèle Gemini non initialisé (SDK: {GEMINI_SDK_AVAILABLE}, API Key: {bool(GOOGLE_API_KEY)})")

ai_coach_bp = Blueprint('ai_coach', __name__, url_prefix='/api/ai-coach')

def get_partner_from_token():
    """Récupère le partenaire depuis le token JWT"""
    try:
        user_id = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        partner = Partner.query.filter_by(user_id=user_id).first()
        return partner
    except:
        return None

def get_partner_stats(partner):
    """Récupère les statistiques du partenaire pour l'IA"""
    now = datetime.utcnow()
    
    # Activations 7 derniers jours
    seven_days_ago = now - timedelta(days=7)
    activations_7d = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id,
        PrivilegeUsage.used_at >= seven_days_ago
    ).count()
    
    # Activations 30 derniers jours
    thirty_days_ago = now - timedelta(days=30)
    activations_30d = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id,
        PrivilegeUsage.used_at >= thirty_days_ago
    ).count()
    
    # Activations mois précédent (pour comparaison)
    sixty_days_ago = now - timedelta(days=60)
    activations_prev_month = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id,
        PrivilegeUsage.used_at >= sixty_days_ago,
        PrivilegeUsage.used_at < thirty_days_ago
    ).count()
    
    # Followers
    followers_count = len(partner.followers_list)
    
    # Dernière offre flash
    last_flash_offer = Offer.query.filter_by(
        partner_id=partner.id,
        offer_type='flash'
    ).order_by(Offer.created_at.desc()).first()
    
    days_since_flash = None
    if last_flash_offer and last_flash_offer.created_at:
        days_since_flash = (now - last_flash_offer.created_at).days
    
    # Nombre d'offres actives
    active_offers = Offer.query.filter_by(partner_id=partner.id, active=True).count()
    
    # Offres sans photo (si le champ image_url existe)
    offers_without_photo = Offer.query.filter_by(
        partner_id=partner.id,
        active=True
    ).filter(
        (Offer.image_url == None) | (Offer.image_url == '')
    ).count() if hasattr(Offer, 'image_url') else 0
    
    return {
        'activations_7d': activations_7d,
        'activations_30d': activations_30d,
        'activations_prev_month': activations_prev_month,
        'followers': followers_count,
        'days_since_flash': days_since_flash,
        'active_offers': active_offers,
        'offers_without_photo': offers_without_photo,
        'partner_name': partner.name,
        'partner_category': partner.category
    }

def call_gemini_flash(prompt):
    """Appelle l'API Gemini Flash pour générer des suggestions (pour coach partenaires)"""
    if not model:
        print("[AI_COACH] ❌ Modèle Gemini non disponible")
        return []
    
    try:
        # Créer un modèle temporaire pour les suggestions (sans system_instruction)
        temp_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        system_prompt = """Tu es un coach business expert pour les commerces partenaires PEP's.
Ta mission : analyser les données et donner 3 suggestions actionnables et concrètes.

Format de réponse (JSON strict) :
{
  "suggestions": [
    {
      "type": "performance|followers|contenu|timing|opportunite",
      "icon": "emoji approprié",
      "title": "Titre court et percutant",
      "description": "Explication claire (max 80 caractères)",
      "action": "Texte du bouton d'action",
      "priority": "high|medium|low"
    }
  ]
}

Règles :
- Sois direct et actionnable
- Utilise des chiffres précis
- Propose des solutions concrètes
- Reste positif et encourageant
- Maximum 3 suggestions"""
        
        full_prompt = system_prompt + "\n\n" + prompt
        
        chat = temp_model.start_chat(history=[])
        response = chat.send_message(full_prompt)
        
        content = response.text
        
        # Parser la réponse JSON
        try:
            # Extraire le JSON si entouré de markdown
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            
            result = json.loads(content)
            return result.get('suggestions', [])
        except json.JSONDecodeError:
            # Fallback si le parsing échoue
            return []
            
    except Exception as e:
        print(f"Erreur Gemini API: {e}")
        return []

@ai_coach_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_suggestions():
    """Génère des suggestions IA pour le partenaire"""
    partner = get_partner_from_token()
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    # Récupérer les stats
    stats = get_partner_stats(partner)
    
    # Construire le prompt pour Gemini
    prompt = f"""
Analyse les données de ce commerce partenaire PEP's et donne 3 suggestions pour améliorer sa performance :

📊 DONNÉES :
- Nom : {stats['partner_name']}
- Catégorie : {stats['partner_category']}
- Activations derniers 7 jours : {stats['activations_7d']}
- Activations derniers 30 jours : {stats['activations_30d']}
- Activations mois précédent : {stats['activations_prev_month']}
- Followers : {stats['followers']}
- Offres actives : {stats['active_offers']}
- Jours depuis dernière offre flash : {stats['days_since_flash'] if stats['days_since_flash'] is not None else 'Jamais créé'}
- Offres sans photo : {stats['offers_without_photo']}

🎯 CONTEXTE :
- PEP's est une plateforme de privilèges pour membres
- Les offres flash génèrent du trafic immédiat
- Les followers reçoivent les notifications push
- Plus de photos = plus d'engagement

Donne 3 suggestions concrètes et actionnables.
"""
    
    # Appeler Gemini
    suggestions = call_gemini_flash(prompt)
    
    # Si l'IA ne répond pas, utiliser des suggestions par défaut basées sur les règles
    if not suggestions:
        suggestions = generate_fallback_suggestions(stats)
    
    return jsonify({
        'suggestions': suggestions,
        'stats': stats
    })

def generate_fallback_suggestions(stats):
    """Génère des suggestions par défaut si l'IA ne répond pas"""
    suggestions = []
    
    # Règle 1 : Offre flash
    if stats['days_since_flash'] is None or stats['days_since_flash'] > 10:
        suggestions.append({
            'type': 'performance',
            'icon': '⚡',
            'title': 'Créez une offre flash',
            'description': 'Aucune offre flash récente. Boostez votre visibilité !',
            'action': 'Créer maintenant',
            'priority': 'high'
        })
    
    # Règle 2 : Followers
    if stats['followers'] < 20:
        suggestions.append({
            'type': 'followers',
            'icon': '👥',
            'title': f'Objectif : 25 followers',
            'description': f'Vous avez {stats["followers"]} followers. Créez des offres attractives !',
            'action': 'Voir actions',
            'priority': 'medium'
        })
    
    # Règle 3 : Photos
    if stats['offers_without_photo'] > 0:
        suggestions.append({
            'type': 'contenu',
            'icon': '📸',
            'title': 'Ajoutez des photos',
            'description': f'{stats["offers_without_photo"]} offre(s) sans photo. +40% d\'engagement !',
            'action': 'Upload photos',
            'priority': 'medium'
        })
    
    # Règle 4 : Performance en baisse
    if stats['activations_30d'] < stats['activations_prev_month'] * 0.7:
        suggestions.append({
            'type': 'performance',
            'icon': '📉',
            'title': 'Activations en baisse',
            'description': 'Vos activations baissent. Créez une offre flash ce weekend !',
            'action': 'Créer offre',
            'priority': 'high'
        })
    
    # Règle 5 : Encouragement
    if stats['activations_30d'] > stats['activations_prev_month']:
        suggestions.append({
            'type': 'opportunite',
            'icon': '🎉',
            'title': 'Excellente progression !',
            'description': f'+{int((stats["activations_30d"] - stats["activations_prev_month"]) / stats["activations_prev_month"] * 100)}% ce mois. Continuez !',
            'action': 'Voir stats',
            'priority': 'low'
        })
    
    # Retourner maximum 3 suggestions
    return suggestions[:3]

# ============================================
# ENDPOINT CHAT
# ============================================

@ai_coach_bp.route('/chat', methods=['POST'])
def chat():
    """
    Endpoint de chat avec Pepi (Gemini Flash via SDK Google)
    """
    try:
        # === VALIDATION ===
        if not GOOGLE_API_KEY:
            return jsonify({
                'error': 'Configuration serveur manquante. Contacte l\'administrateur.'
            }), 500
        
        if not model:
            return jsonify({
                'error': 'Service IA temporairement indisponible. Réessaie dans un instant.'
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
            'lunettes', 'vétérinaire', 'animal', 'trouver', 'cherche',
            'où', 'localité', 'ville', 'région', 'près', 'proche'
        ]
        
        should_search = any(keyword in user_message.lower() for keyword in keywords)
        
        # Extraction de la ville si mentionnée
        city_filter = None
        cities_swiss = ['lausanne', 'genève', 'geneva', 'bern', 'berne', 'zurich', 
                        'neuchâtel', 'fribourg', 'sion', 'yverdon', 'montreux', 
                        'vevey', 'nyon', 'morges', 'renens', 'aigle', 'monthey',
                        'martigny', 'sierre', 'bulle', 'payerne']
        for city in cities_swiss:
            if city in user_message.lower():
                city_filter = city
                break
        
        partners = []
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
        
        chat_session = model.start_chat(history=[])
        response = chat_session.send_message(full_message)
        
        elapsed = time.time() - start_time
        print(f"[CHAT] ✅ Réponse Gemini reçue en {elapsed:.2f}s")
        
        assistant_response = response.text
        print(f"[CHAT] Réponse : {assistant_response[:150]}...")
        print(f"{'='*60}\n")
        
        return jsonify({
            'response': assistant_response,
            'partners_found': len(partners) if should_search else 0
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
        if "API key" in str(e) or "api_key" in str(e).lower():
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
        'gemini_sdk_installed': GEMINI_SDK_AVAILABLE,
        'gemini_configured': GOOGLE_API_KEY is not None,
        'model_initialized': model is not None,
        'prompt_length': len(PEPI_SYSTEM_PROMPT)
    }), 200
